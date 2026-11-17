// A sparse generative sound layer (design-system.md, Sound). Silent until the visitor turns it on.
// Bed: two detuned low partials under a slow low-pass; rain ticks while glyphs fall;
// the cut: a noise burst through a falling band-pass and a sub drop; the hold: silence; the seal: one crack.

export function createSound(button) {
  let ctx = null, on = false, master, bedGain, bedFilter, noiseBuf, lastT = 0, tickClock = 0;

  function init() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    bedFilter = ctx.createBiquadFilter(); bedFilter.type = 'lowpass'; bedFilter.frequency.value = 220; bedFilter.Q.value = 0.7;
    bedGain = ctx.createGain(); bedGain.gain.value = 0;
    bedFilter.connect(bedGain).connect(master);
    for (const [f, g] of [[55, 0.5], [55.37, 0.5], [110.2, 0.18], [82.4, 0.12]]) {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const og = ctx.createGain(); og.gain.value = g;
      o.connect(og).connect(bedFilter); o.start();
    }
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  function noise({ dur, freqFrom, freqTo, q = 2, gain = 0.4, type = 'bandpass' }) {
    const t0 = ctx.currentTime;
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(freqFrom, t0); f.frequency.exponentialRampToValueAtTime(freqTo, t0 + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(gain, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f).connect(g).connect(master);
    src.start(t0); src.stop(t0 + dur + 0.05);
  }
  function sub() {
    const t0 = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(80, t0); o.frequency.exponentialRampToValueAtTime(28, t0 + 1.4);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.55, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.6);
    o.connect(g).connect(master); o.start(t0); o.stop(t0 + 1.7);
  }

  button.addEventListener('click', async () => {
    try {
      if (!ctx) init();
      on = !on;
      if (on) await ctx.resume();
      master.gain.setTargetAtTime(on ? 0.6 : 0, ctx.currentTime, 0.25);
      button.setAttribute('aria-pressed', String(on));
      button.textContent = on ? 'sound on' : 'sound off';
    } catch (_) {
      button.textContent = 'sound unavailable';
      button.disabled = true;
    }
  });

  return {
    update(t, S, dt) {
      if (!ctx || !on) { lastT = t; return; }
      const now = ctx.currentTime;
      const live = 1 - S.freeze;
      bedGain.gain.setTargetAtTime((0.05 + 0.1 * Math.min(t / 100, 1)) * live, now, 0.4);
      bedFilter.frequency.setTargetAtTime(160 + 340 * Math.sin(Math.min(t / 184, 1) * Math.PI), now, 0.8);
      // rain: sparse ticks while the glyph columns fall
      if (S.rain > 0.5 && S.toGrid < 0.6) {
        tickClock += dt * (3 + 9 * S.rainSpeed);
        while (tickClock > 1) { tickClock -= 1; if (Math.random() < 0.5) noise({ dur: 0.05, freqFrom: 5200 + Math.random() * 3000, freqTo: 3000, q: 9, gain: 0.05 }); }
      }
      // events, fired when the timeline crosses them going forward
      const crossed = (x) => lastT < x && t >= x && t - lastT < 4;
      if (crossed(100.5)) { noise({ dur: 1.2, freqFrom: 6000, freqTo: 120, q: 1.2, gain: 0.5 }); sub(); }
      if (crossed(160)) noise({ dur: 0.18, freqFrom: 2400, freqTo: 900, q: 0.8, gain: 0.45, type: 'highpass' });
      lastT = t;
    },
  };
}

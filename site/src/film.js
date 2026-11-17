import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { buildGlyphAtlas } from './glyphs.js';
import { buildSpace, particleMaterial } from './space.js';
import { buildInstruments, buildDepth } from './instruments.js';
import { buildBranches, branchLayout } from './branches.js';
import { buildPost } from './post.js';
import { buildCameraPath, cameraAt } from './camera.js';
import { createSound } from './sound.js';

gsap.registerPlugin(ScrollTrigger);

const END = 184; // timeline units; storyboard.md

export async function startFilm(params) {
  const small = Math.min(innerWidth, innerHeight) < 700 || matchMedia('(pointer: coarse)').matches;
  const PROFILE = small
    ? { rainColumns: 280, dprCap: 1.5, bloom: false, motes: 500 }
    : { rainColumns: 800, dprCap: 1.75, bloom: true, motes: 1400 };

  // ---------------------------------------------------------------- renderer and scene
  const canvas = document.getElementById('gl');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  // clear to true black: the output pass converts to sRGB once more, which would lift #050506 to ~#262626
  renderer.setClearColor(0x000000, 1);
  renderer.info.autoReset = false;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 900);

  const atlas = await buildGlyphAtlas();
  const space = buildSpace({ rainColumns: PROFILE.rainColumns });
  const material = particleMaterial(atlas);
  material.uniforms.uAxis.value.copy(space.axis);
  material.uniforms.uVaultPos.value.copy(space.vaultPos);
  material.uniforms.uVeilN.value.copy(space.b1);
  const points = new THREE.Points(space.geometry, material);
  points.frustumCulled = false;
  scene.add(points);

  // the ghost of the original plume (S11): the same instances, drawn uncut and faint
  const ghostMat = particleMaterial(atlas);
  ghostMat.uniforms.uAxis.value.copy(space.axis);
  ghostMat.uniforms.uGhost.value = 1;
  ghostMat.uniforms.uToGrid.value = 1;
  ghostMat.uniforms.uToSpace.value = 1;
  const ghost = new THREE.Points(space.geometry, ghostMat);
  ghost.frustumCulled = false;
  ghost.visible = false;
  scene.add(ghost);

  const inst = buildInstruments(scene, space);
  const depth = buildDepth(scene, PROFILE.motes);
  const post = buildPost(renderer, scene, camera, { bloom: PROFILE.bloom });
  const branches = buildBranches(scene, atlas);
  let layout = branchLayout(innerWidth / innerHeight);
  branches.setLayout(layout);
  buildCameraPath(space, layout);

  function resize() {
    const pr = Math.min(devicePixelRatio || 1, PROFILE.dprCap);
    const w = innerWidth, h = innerHeight;
    renderer.setPixelRatio(pr);
    renderer.setSize(w, h, false);
    post.setSize(w, h, pr);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const proj = (h * pr) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
    for (const m of [material, ghostMat, depth.motes.material]) { m.uniforms.uProj.value = proj; m.uniforms.uPR.value = pr; }
    branches.setProj(proj);
    const lay = branchLayout(w / h);
    if (lay.tall !== layout.tall) { layout = lay; branches.setLayout(layout); buildCameraPath(space, layout); }
  }
  addEventListener('resize', resize);
  resize();

  // ---------------------------------------------------------------- one master timeline
  const S = {
    cam: 0, rain: 1, rainSpeed: 1, toGrid: 0, toSpace: 0, brackets: 0,
    veil: 0, yAlpha: 0, yDraw: 0, vault: 0, seal: 0,
    rings: 0, searchT: 0, candidates: 0, align: 0, axis: 0, means: 0, reveal: 0,
    floorOn: 0, floorPos: 0, floorMark: 1, toFloor: 0, unfold: 0, yToRing: 0, converge: 0, ghostRise: 0,
    bladeScale: 1, bladeLine: 0, bladeSheet: 0, gap: 0, cut: 0, freeze: 0, collapse: 0,
    testers: 0, ghost: 0, vaultOpen: 0, sealBreak: 0, cleft: 0,
    glitch: 0, scan: 0, aperture: 0.035, phases: 0, bright: 1,
    brOpen: 0, wAsm: 0, ba: 0, baFill: 0, baOver: 0, brClosed: 0, answers: 0, op: 0, move: 0, brOut: 0,
  };

  const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.lagSmoothing(0);

  const tl = gsap.timeline({
    defaults: { ease: 'power2.inOut' },
    scrollTrigger: { trigger: '#film', start: 'top top', end: 'bottom bottom', scrub: true },
  });
  const at = (t, vars) => tl.to(S, vars, t);

  tl.to(S, { cam: 1, duration: END, ease: 'none' }, 0);
  tl.to('#hint', { autoAlpha: 0, duration: 2 }, 0);

  // copy: every element with data-t="in,out" is revealed by the timeline (out optional)
  document.querySelectorAll('#scenes [data-t]').forEach((el) => {
    const [tin, tout] = el.dataset.t.split(',').map(Number);
    const isTitle = el.classList.contains('title-block');
    if (isTitle) {
      gsap.set(el, { autoAlpha: 1 });
      tl.fromTo(el, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -30, duration: 5, ease: 'power2.in', immediateRender: false }, tout);
      return;
    }
    const d = el.classList.contains('lore') || el.classList.contains('read') ? 2 : 2.2;
    tl.fromTo(el, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: d, ease: 'power2.out' }, tin);
    if (el.classList.contains('readout')) {
      el.querySelectorAll('span').forEach((sp, i) => {
        tl.to(sp, { clipPath: 'inset(0 0% 0 0)', duration: 1.3, ease: 'steps(24)' }, tin + 0.6 + i * 1.6);
      });
    }
    if (!Number.isNaN(tout)) tl.to(el, { autoAlpha: 0, y: -10, duration: Math.min(1.8, (tout - tin) * 0.3), ease: 'power2.in' }, tout - Math.min(1.8, (tout - tin) * 0.3));
  });

  // S1–S3: rain → matrix → space
  at(10, { rainSpeed: 0.12, duration: 10 });
  at(9, { toGrid: 1, duration: 12 });
  at(15, { brackets: 1, duration: 4 });
  at(21, { brackets: 0, duration: 3 });
  at(10, { aperture: 0.008, duration: 10 });
  at(23, { toSpace: 1, duration: 10 });
  at(26, { aperture: 0.022, duration: 6 });
  // S5: the veil, and the two branches either side of it (branches.js)
  at(45, { veil: 1, duration: 4 });
  at(44.6, { bright: 0.5, duration: 2.5 });
  at(56.4, { bright: 1, duration: 2.5 });
  at(45.2, { brOpen: 1, duration: 1.4 });
  at(45.3, { wAsm: 1, duration: 3, ease: 'power2.out' });           // W assembles from loose digits
  at(46.7, { ba: 1, duration: 1.2 });                                // B and A are drawn beside it
  at(47.2, { baFill: 1, duration: 1.3, ease: 'power1.inOut' });     // and span the rank-one panel B·A
  at(48.1, { baOver: 1, duration: 0.9 });                            // laid over W …
  at(49.0, { baOver: 0, duration: 0.9 });                            // … and lifted off: W is unchanged
  at(49.4, { brClosed: 1, duration: 1.6 });                          // the sealed model
  at(50.0, { answers: 1, duration: 1.8 });                           // its answers, as embeddings
  at(50.8, { op: 1, duration: 1.4 });                                // operator text flows in
  at(52.0, { move: 1, duration: 3.2 });                              // and only some answers move
  at(56.2, { brOut: 1, duration: 1.5, ease: 'power2.in' });
  // S6: the veil's threads gather into the Y; a sample is sealed away
  at(56.5, { converge: 1, duration: 2.5, ease: 'power2.in' });
  at(57, { veil: 0, duration: 2 });
  at(58.6, { yAlpha: 1, duration: 1.5 });
  at(58.6, { yDraw: 1, duration: 4, ease: 'power1.inOut' });
  at(64, { vault: 1, duration: 4 });
  at(66.5, { seal: 1, duration: 2, ease: 'back.out(1.6)' });
  at(58, { phases: 1, duration: 2 });
  // S7: the search
  at(69, { yToRing: 1, duration: 4 });
  at(72.98, { rings: 1, duration: 0.02, ease: 'none' });
  at(73, { unfold: 1, duration: 3 });
  at(73.5, { searchT: 6, duration: 15.5, ease: 'none' });
  at(74, { candidates: 1, duration: 10, ease: 'none' });
  at(84, { axis: 1, means: 1, duration: 3 });
  at(84, { reveal: 1, duration: 4 });
  at(85, { align: 1, duration: 4 });
  // S8: the floor
  // the floor: ring 1 becomes the dashed ring, sweeps down through the plume and stays at the target level.
  // The plume is not touched: the floor fixes the target, the tournament matches it (C-30).
  at(88.8, { toFloor: 1, duration: 2.2 });
  at(90.98, { floorOn: 1, duration: 0.02, ease: 'none' });
  at(91, { floorPos: 1, duration: 5.5, ease: 'power1.inOut' });
  at(141, { floorMark: 0, duration: 5 });
  // S9: the cut, and the moment held
  at(98, { bladeScale: 0.03, bladeLine: 1, duration: 2.5, ease: 'power3.in' });
  at(100.5, { bladeScale: 2.7, duration: 1.6, ease: 'expo.out' });
  at(100.5, { bladeSheet: 1, gap: 1.3, cut: 1, glitch: 1, scan: 0.6, freeze: 1, duration: 0.6, ease: 'expo.out' });
  at(101.1, { glitch: 0.07, bladeSheet: 0, duration: 3, ease: 'power2.out' });
  at(102, { bladeLine: 0.22, duration: 5 });
  at(101, { aperture: 0.03, duration: 4 });
  at(111, { testers: 1, duration: 3 });
  at(129, { testers: 0, duration: 2 });
  // S10: release; the plume falls back into the plane
  at(131, { freeze: 0, glitch: 0, scan: 0, duration: 2.5 });
  at(131, { cut: 0, duration: 4 });
  at(132, { collapse: 1, duration: 12 });
  at(135, { bladeScale: 1, bladeLine: 0.38, duration: 11 });
  at(141, { axis: 0, means: 0, duration: 5 });
  at(137, { aperture: 0.016, duration: 9 });
  // S11: the gloss — the original, kept beside the edit
  at(146, { ghost: 1, ghostRise: 1, duration: 3.5 });
  at(152, { ghost: 0.18, duration: 3 });
  // S12: the seal, opened once
  at(160, { sealBreak: 1, duration: 1.2, ease: 'power2.out' });
  at(160, { vaultOpen: 1, duration: 3, ease: 'none' });
  at(160.5, { vault: 0, duration: 6.5 });
  at(168, { phases: 0, duration: 2 });
  // S13: the ring keeps its cleft; everything draws away
  at(170, { ghost: 0, duration: 2 });
  at(172, { cleft: 1, bladeLine: 0.6, duration: 4 });

  // ---------------------------------------------------------------- scenes by address: #s1 … #s13
  const sceneEls = [...document.querySelectorAll('#scenes .scene')];
  const scrollMax = () => document.documentElement.scrollHeight - innerHeight;
  function seek(t, immediate = true) {
    lenis.scrollTo((t / END) * scrollMax(), { immediate, force: true });
    ScrollTrigger.update();
  }
  function goToHash() {
    const el = location.hash && document.getElementById(location.hash.slice(1));
    if (el && el.classList.contains('scene')) seek(Number(el.dataset.start) + 0.6, true);
  }
  addEventListener('hashchange', goToHash);
  requestAnimationFrame(() => requestAnimationFrame(goToHash));

  // ---------------------------------------------------------------- frame
  const U = material.uniforms, G = ghostMat.uniforms;
  const clock = { rainT: 0, driftT: 0 };
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / innerWidth) * 2 - 1;
    pointer.y = (e.clientY / innerHeight) * 2 - 1;
  });
  const look = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3(), tmp = new THREE.Vector3();
  const labels = {
    muGood: document.getElementById('muGood'), muBad: document.getElementById('muBad'),
    t: [...document.querySelectorAll('.tlabel')],
    b: Object.fromEntries([...document.querySelectorAll('.blabel')].map((el) => [el.dataset.k, el])),
  };
  const phaseEls = [...document.querySelectorAll('#phases span')];
  const phasesNav = document.getElementById('phases');
  const sound = createSound(document.getElementById('sound'));

  const debugEl = document.getElementById('debug');
  const debug = params.has('debug');
  const capture = params.has('capture'); // frames are driven by __film.step(), not by real time
  if (debug) debugEl.hidden = false;
  let frameMs = 16.7, lastDebug = 0, hidden = false;
  document.addEventListener('visibilitychange', () => { hidden = document.hidden; });

  function placeLabel(el, obj, o, centred = false) {
    obj.getWorldPosition(tmp).project(camera);
    const vis = o > 0.01 && tmp.z < 1;
    el.style.opacity = vis ? o.toFixed(3) : '0';
    if (vis) el.style.transform = centred
      ? `translate(${((tmp.x + 1) / 2) * innerWidth}px, ${((1 - tmp.y) / 2) * innerHeight}px) translate(-50%, -50%)`
      : `translate(${((tmp.x + 1) / 2) * innerWidth + 12}px, ${((1 - tmp.y) / 2) * innerHeight - 10}px)`;
  }
  function phaseAt(t) {
    if (t < 70) return 1; if (t < 90) return 2; if (t < 98) return 3; if (t < 154) return 4; return 5;
  }

  function advance(dt) {
    clock.rainT += dt * S.rainSpeed;
    clock.driftT += dt * (1 - S.freeze);
  }

  function draw(time, deltaMs) {
    const t0 = performance.now();
    const T = S.cam * END;
    cameraAt(T, camera.position, look);
    if (camera.aspect < 1) {
      const k = 1 + (Math.min(1.75, Math.pow(1 / camera.aspect, 0.62)) - 1) * S.toSpace;
      camera.position.sub(look).multiplyScalar(k).add(look);
    }
    pointer.sx += (pointer.x - pointer.sx) * 0.04;
    pointer.sy += (pointer.y - pointer.sy) * 0.04;
    camera.lookAt(look);
    right.setFromMatrixColumn(camera.matrix, 0);
    up.setFromMatrixColumn(camera.matrix, 1);
    camera.position.addScaledVector(right, pointer.sx * 0.9).addScaledVector(up, -pointer.sy * 0.6);
    camera.lookAt(look);
    camera.updateMatrixWorld();

    const focus = camera.position.distanceTo(look);
    U.uRainT.value = clock.rainT; U.uDriftT.value = clock.driftT; U.uRain.value = S.rain;
    U.uToGrid.value = S.toGrid; U.uToSpace.value = S.toSpace; U.uReveal.value = S.reveal;
    U.uCut.value = S.cut; U.uCollapse.value = S.collapse;
    U.uFocus.value = focus; U.uAperture.value = S.aperture; U.uFogNear.value = focus + 12; U.uFogDen.value = 0.03;
    U.uVault.value = S.vault; U.uVaultOpen.value = S.vaultOpen; U.uVeil.value = S.veil; U.uBright.value = S.bright;
    ghost.visible = S.ghost > 0.002;
    if (ghost.visible) {
      G.uDriftT.value = clock.driftT; G.uFocus.value = focus; G.uAperture.value = S.aperture;
      G.uFogNear.value = focus + 12; G.uFogDen.value = 0.03; G.uGhostA.value = S.ghost;
      G.uCollapse.value = 1 - S.ghostRise; // the original rises back out of the flattened disc
    }
    depth.motes.material.uniforms.uFocus.value = focus;
    depth.motes.material.uniforms.uT.value = clock.driftT;

    inst.update(S, camera);
    branches.update(S, clock.driftT);
    post.signal.uniforms.uTime.value = time;
    post.signal.uniforms.uGlitch.value = S.glitch;
    post.signal.uniforms.uScan.value = S.scan;
    if (post.bloomPass) post.bloomPass.strength = 0.55 + S.glitch * 0.35 + S.bladeLine * 0.2;

    renderer.info.reset();
    post.composer.render();

    const m = S.means * (1 - S.cut * 0.6) * (1 - Math.max(S.collapse - 0.2, 0) / 0.8);
    placeLabel(labels.muGood, inst.markG, m);
    placeLabel(labels.muBad, inst.markB, m);
    labels.t.forEach((el, k) => placeLabel(el, k < 4 ? inst.tAnchors[k] : inst.judge, S.testers * (k < 4 ? 1 : 0.7)));
    const bo = 1 - S.brOut, A = branches.anchors;
    placeLabel(labels.b.w, A.w, S.brOpen * bo * Math.min(Math.max(S.wAsm * 2 - 1, 0), 1), true);
    placeLabel(labels.b.ba, A.ba, S.brOpen * bo * S.baFill * (1 - S.baOver) * (layout.tall ? 0 : 1), true);
    placeLabel(labels.b.op, A.op, S.brClosed * bo * S.op * (layout.tall ? 0 : 1), true);
    placeLabel(labels.b.model, A.model, S.brClosed * bo, true);
    placeLabel(labels.b.cloud, A.cloud, S.brClosed * bo * S.answers * (layout.tall ? 0 : 1), true);
    phasesNav.style.opacity = S.phases.toFixed(3);
    const ph = phaseAt(T);
    phaseEls.forEach((el, i) => el.classList.toggle('on', i + 1 === ph));
    sound.update(T, S, Math.max(deltaMs, 0) / 1000);

    if (debug) {
      frameMs = frameMs * 0.92 + deltaMs * 0.08;
      if (time - lastDebug > 0.25) {
        lastDebug = time;
        debugEl.textContent =
          `frame   ${frameMs.toFixed(1)} ms  (${(1000 / frameMs).toFixed(0)} fps)\n` +
          `cpu     ${(performance.now() - t0).toFixed(1)} ms\n` +
          `calls   ${renderer.info.render.calls}\n` +
          `points  ${space.N.toLocaleString()}${ghost.visible ? ' ×2' : ''}\n` +
          `dpr     ${renderer.getPixelRatio().toFixed(2)}  ${small ? 'small' : 'desktop'}\n` +
          `t       ${T.toFixed(1)} / ${END}`;
      }
    }
  }

  gsap.ticker.add((time, deltaMs) => {
    lenis.raf(time * 1000);
    if (hidden || capture) return;
    advance(Math.min(deltaMs / 1000, 0.05));
    draw(time, deltaMs);
  });

  // test and capture hook: jump the film to a timeline point (0..184)
  let captureTime = 0;
  window.__film = {
    end: END,
    seek(t) { seek(t, true); },
    get t() { return S.cam * END; },
    // capture mode: advance the film's own clock by dt seconds at timeline point t, and draw one frame
    step(t, dt) {
      seek(t, true);
      advance(dt);
      captureTime += dt;
      draw(captureTime, dt * 1000);
    },
    ready: true,
  };
}

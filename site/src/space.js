import * as THREE from 'three';
import { GLYPHS, NUMERIC_COUNT, ATLAS_GRID } from './glyphs.js';

// One population of instances lives the whole shot: code rain → weight matrix → activation space.
// Each particle carries all three positions; the shaders move it between them, so a change of
// register is a change of state of the same matter, never a cross-fade between two systems.

const RAIN_ROWS = 90;
const GRID_COLS_PER_RAIN_COL = 0.5; // two rain columns interleave into one matrix column

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildSpace({ rainColumns, seed = 7 }) {
  const rnd = mulberry32(seed);
  const gauss = () => {
    let u = 0, v = 0;
    while (u === 0) u = rnd();
    while (v === 0) v = rnd();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  const N = rainColumns * RAIN_ROWS;
  const gridCols = Math.round(rainColumns * GRID_COLS_PER_RAIN_COL);
  const gridRows = RAIN_ROWS * 2;
  const gridSpacing = 0.12 * (400 / gridCols) ** 0.5; // keep the matrix a similar size on phones

  // --- the behaviour axis, as a prior; the real one is measured below as a difference of means
  const vPrior = new THREE.Vector3(0.22, 1, 0.16).normalize();
  const e1 = new THREE.Vector3().crossVectors(vPrior, new THREE.Vector3(0, 0, 1)).normalize();
  const e2 = new THREE.Vector3().crossVectors(vPrior, e1).normalize();

  // topics: the same clusters appear in both conditions, as they would in a real contrast pair
  const topics = [];
  for (let k = 0; k < 8; k++) {
    const r = 2.5 + rnd() * 9.5;
    const a = rnd() * Math.PI * 2;
    topics.push({ c: [Math.cos(a) * r, Math.sin(a) * r], s: 1.4 + rnd() * 2.4 });
  }

  // --- rain columns, sorted by x so they condense into matrix columns in order
  const cols = [];
  for (let c = 0; c < rainColumns; c++) {
    cols.push({ x: (rnd() * 2 - 1) * 46, z: -38 + rnd() * 78, phase: rnd(), speed: rnd() });
  }
  cols.sort((a, b) => a.x - b.x);

  const aRain = new Float32Array(N * 3);
  const aGrid = new Float32Array(N * 2);
  const aSpace = new Float32Array(N * 3);
  const aSeed = new Float32Array(N * 4);
  const aKind = new Float32Array(N);
  const aVault = new Float32Array(N);

  const muBad = new THREE.Vector3(), muGood = new THREE.Vector3();
  let nBad = 0, nGood = 0;
  const p = new THREE.Vector3();

  let i = 0;
  for (let c = 0; c < rainColumns; c++) {
    const col = cols[c];
    const gx = Math.floor(c / 2);
    for (let r = 0; r < RAIN_ROWS; r++, i++) {
      aRain[i * 3] = col.x;
      aRain[i * 3 + 1] = r;
      aRain[i * 3 + 2] = col.z;

      const gy = r * 2 + (c % 2);
      aGrid[i * 2] = (gx - (gridCols - 1) / 2) * gridSpacing;
      aGrid[i * 2 + 1] = ((gridRows - 1) / 2 - gy) * gridSpacing * 1.15;

      // space: a disc of ordinary outputs, with one behaviour plume along the axis
      const bad = rnd() < 0.27;
      let u, w, h;
      if (rnd() < 0.18) { // diffuse halo
        u = gauss() * 9; w = gauss() * 9; h = gauss() * 0.9;
      } else {
        const t = topics[Math.floor(rnd() * topics.length)];
        u = t.c[0] + gauss() * t.s; w = t.c[1] + gauss() * t.s; h = gauss() * 0.42;
      }
      if (bad) {
        // the same topics, displaced along the axis; the plume narrows as it rises
        const lift = 5.6 + gauss() * 1.35;
        const pinch = 0.55 + 0.45 * Math.exp(-Math.max(lift - 4, 0) * 0.18);
        u *= pinch; w *= pinch;
        h = lift;
      }
      p.set(0, 0, 0).addScaledVector(e1, u).addScaledVector(e2, w).addScaledVector(vPrior, h);
      aSpace[i * 3] = p.x; aSpace[i * 3 + 1] = p.y; aSpace[i * 3 + 2] = p.z;
      aKind[i] = bad ? 1 : 0;
      aVault[i] = rnd() < 0.07 ? 1 : 0; // the sealed sample, drawn from both conditions
      if (bad) { muBad.add(p); nBad++; } else { muGood.add(p); nGood++; }

      aSeed[i * 4] = rnd();                       // glyph identity
      aSeed[i * 4 + 1] = col.phase;               // column phase (rain)
      aSeed[i * 4 + 2] = rnd();                   // size
      aSeed[i * 4 + 3] = col.speed * 0.5 + rnd() * 0.5; // stagger / column speed
    }
  }

  muBad.divideScalar(nBad);
  muGood.divideScalar(nGood);
  // re-centre on the mean of the ordinary outputs, so the cut plane passes through the origin
  for (let k = 0; k < N; k++) {
    aSpace[k * 3] -= muGood.x; aSpace[k * 3 + 1] -= muGood.y; aSpace[k * 3 + 2] -= muGood.z;
  }
  muBad.sub(muGood);
  const axis = muBad.clone().normalize(); // r̂ = normalize(μ_bad − μ_good)
  const plumeHeight = muBad.length();
  const b1 = new THREE.Vector3().crossVectors(axis, new THREE.Vector3(0, 0, 1)).normalize();
  const b2 = new THREE.Vector3().crossVectors(axis, b1).normalize();
  const vaultPos = b2.clone().multiplyScalar(-16.5).addScaledVector(b1, 4).addScaledVector(axis, 2.5);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(aSpace.slice(), 3)); // for bounds only
  geometry.setAttribute('aRain', new THREE.BufferAttribute(aRain, 3));
  geometry.setAttribute('aGrid', new THREE.BufferAttribute(aGrid, 2));
  geometry.setAttribute('aSpace', new THREE.BufferAttribute(aSpace, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(aSeed, 4));
  geometry.setAttribute('aKind', new THREE.BufferAttribute(aKind, 1));
  geometry.setAttribute('aVault', new THREE.BufferAttribute(aVault, 1));
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 80);

  return {
    geometry, N, axis, plumeHeight, b1, b2, vaultPos,
    muBad: muBad.clone(), muGood: new THREE.Vector3(),
    grid: { width: gridCols * gridSpacing, height: gridRows * gridSpacing * 1.15 },
  };
}

export function particleMaterial(atlas) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uAtlas: { value: atlas },
      uProj: { value: 800 },
      uPR: { value: 1 },
      uRainT: { value: 0 },
      uDriftT: { value: 0 },
      uSpin: { value: 0 },
      uRain: { value: 1 },
      uToGrid: { value: 0 },
      uToSpace: { value: 0 },
      uAxis: { value: new THREE.Vector3(0, 1, 0) },
      uReveal: { value: 0 },
      uCut: { value: 0 },
      uCollapse: { value: 0 },
      uFocus: { value: 30 },
      uAperture: { value: 0.02 },
      uFogNear: { value: 40 },
      uFogDen: { value: 0.02 },
      uBright: { value: 1 },
      uVault: { value: 0 },
      uVaultPos: { value: new THREE.Vector3() },
      uVaultOpen: { value: 0 },
      uVeil: { value: 0 },
      uVeilN: { value: new THREE.Vector3(1, 0, 0) },
      uVeilD: { value: 0 },
      uGhost: { value: 0 },
      uGhostA: { value: 0 },
    },
    vertexShader: /* glsl */ `
      #define ROWS ${RAIN_ROWS}.0
      #define NUMERIC ${NUMERIC_COUNT}.0
      #define GLYPHS ${GLYPHS.length}.0
      uniform float uProj, uPR, uRainT, uDriftT, uSpin, uRain, uToGrid, uToSpace;
      uniform vec3 uAxis;
      uniform float uReveal, uCut, uCollapse, uFocus, uAperture, uFogNear, uFogDen, uBright;
      uniform float uVault, uVaultOpen, uVeil, uVeilD, uGhost, uGhostA;
      uniform vec3 uVaultPos, uVeilN;
      attribute vec3 aRain; attribute vec2 aGrid; attribute vec3 aSpace;
      attribute vec4 aSeed; attribute float aKind; attribute float aVault;
      varying vec3 vColor; varying float vAlpha; varying float vGlyph; varying float vIndex; varying float vCoc;

      const vec3 BONE = vec3(0.91, 0.886, 0.83);
      const vec3 PHOS = vec3(0.35, 1.0, 0.61);
      const vec3 RED  = vec3(1.0, 0.25, 0.17);

      float hash(float n) { return fract(sin(n) * 43758.5453123); }

      vec3 rotateAbout(vec3 p, vec3 k, float a) {           // Rodrigues
        float c = cos(a), s = sin(a);
        return p * c + cross(k, p) * s + k * dot(k, p) * (1.0 - c);
      }

      void main() {
        // --- rain: fixed cells in columns; a lit head falls down each column
        float y = 24.0 - aRain.y * 0.55;
        vec3 rainPos = vec3(aRain.x, y, aRain.z);
        float speed = 7.0 + aSeed.w * 12.0;
        float cycle = ROWS + 46.0;
        float head = mod(uRainT * speed + aSeed.y * 400.0, cycle);
        float behind = head - aRain.y;
        float trail = 12.0 + aSeed.y * 22.0;
        float lit = (behind >= 0.0 && behind < trail) ? exp(-behind / (trail * 0.45)) : 0.0;
        float isHead = (behind >= 0.0 && behind < 1.0) ? 1.0 : 0.0;

        // --- matrix
        vec3 gridPos = vec3(aGrid, 0.0);

        // --- space: the cut removes the component along the axis: x' = x - (v.x) v
        vec3 sp = aSpace;
        float s0 = dot(sp, uAxis);
        float cl = clamp(uCollapse * 1.5 - (abs(s0) / 11.0) * 0.5, 0.0, 1.0);
        cl = cl * cl * (3.0 - 2.0 * cl);
        sp -= uAxis * s0 * cl;
        float sNow = dot(sp, uAxis);
        vec3 drift = vec3(sin(uDriftT * 0.31 + aSeed.x * 6.2831),
                          cos(uDriftT * 0.27 + aSeed.w * 6.2831),
                          sin(uDriftT * 0.23 + aSeed.z * 6.2831)) * 0.22;
        sp = rotateAbout(sp + drift, uAxis, uSpin);

        // --- the vault: a sealed sample gathered aside at Frame, returned at Seal
        vec3 vdir = normalize(vec3(hash(aSeed.x * 31.0) - 0.5, hash(aSeed.z * 17.0) - 0.5, hash(aSeed.w * 23.0) - 0.5) + 1e-4);
        vec3 vp = uVaultPos + vdir * (0.7 + 1.9 * pow(hash(aSeed.y * 11.0 + aSeed.x), 0.5)) + drift * 0.3;
        float vt = clamp(uVault * 1.4 - aSeed.w * 0.4, 0.0, 1.0); vt = vt * vt * (3.0 - 2.0 * vt);
        sp = mix(sp, vp, vt * aVault);
        float vshard = aVault * clamp(uVaultOpen * (1.0 - uVaultOpen) * 4.0, 0.0, 1.0);

        // --- staggered transitions
        float tG = clamp(uToGrid * 1.45 - aSeed.w * 0.45, 0.0, 1.0); tG = tG * tG * (3.0 - 2.0 * tG);
        float tS = clamp(uToSpace * 1.6 - aSeed.x * 0.6, 0.0, 1.0); tS = tS * tS * (3.0 - 2.0 * tS);
        vec3 p = mix(rainPos, gridPos, tG);
        vec3 lift = vec3(0.0, sin(tS * 3.14159) * 4.0 * (aSeed.z - 0.4), sin(tS * 3.14159) * 7.0 * (aSeed.x - 0.3));
        p = mix(p, sp, tS) + lift;

        // --- near the severed axis, the points show what they are: numbers
        float along = dot(sp, uAxis);
        float radial = length(sp - uAxis * along);
        float near = (1.0 - smoothstep(0.0, 2.6, radial)) * smoothstep(-1.0, 1.5, along) * (1.0 - smoothstep(9.0, 12.0, along));
        float shard = uCut * near;

        // --- the veil: on the near side the points show as digits; beyond it, only fragments of answers
        float side = dot(sp, uVeilN) - uVeilD;
        float nearV = uVeil * smoothstep(-0.6, 0.6, side);
        float farV = uVeil * (1.0 - smoothstep(-0.6, 0.6, side)) * step(0.972, hash(aSeed.x * 71.0 + floor(uDriftT * 1.4 + aSeed.y * 5.0)));

        // --- glyph state
        float glyphAmt = (1.0 - smoothstep(0.45, 0.9, tS));
        glyphAmt = max(max(glyphAmt, shard), max(max(nearV * 0.92, farV), vshard));
        float rate = mix(2.0 + aSeed.w * 7.0, 0.6, tG);
        float pick = hash(aSeed.x * 97.0 + floor(uRainT * rate + aSeed.y * 10.0));
        float setN = mix(GLYPHS, NUMERIC, step(0.5, tG) * (1.0 - step(0.5, tS)));
        if (shard > 0.05 || nearV > 0.05 || vshard > 0.05) setN = NUMERIC;
        vIndex = floor(pick * setN);
        if (farV > 0.05) vIndex = 36.0 + floor(pick * 6.0);
        vGlyph = glyphAmt;

        // --- colour and brightness
        vec3 cRain = mix(PHOS * 0.75, vec3(0.88, 1.0, 0.92), isHead);
        float aRainA = (0.05 + lit * 0.95) * uRain;
        float aGridA = 0.2 + 0.14 * hash(aSeed.x * 13.0 + floor(uRainT * 0.7));
        vec3 cSpace = BONE * (0.7 + 0.3 * aSeed.z);
        float red = uReveal * smoothstep(1.4, 5.0, sNow);
        cSpace = mix(cSpace, RED, red);
        cSpace = mix(cSpace, vec3(1.0, 0.85, 0.7), shard * 0.6);
        cSpace = mix(cSpace, PHOS * 0.85, max(nearV * 0.8, farV));
        cSpace = mix(cSpace, vec3(1.0, 0.45, 0.32), vshard);
        float aSpaceA = 0.11 + 0.13 * red + shard * 0.45 + nearV * 0.22 + farV * 0.6 + vshard * 0.35;
        aSpaceA *= mix(1.0, 0.16, vt * aVault); // the sealed sample is dense; keep it a dim body, not a light

        vColor = mix(mix(cRain, PHOS, tG), cSpace, tS);
        float alpha = mix(mix(aRainA, aGridA, tG), aSpaceA, tS);

        // --- size, focus, fog
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float dist = max(-mv.z, 0.1);
        float size = mix(mix(0.42, 0.12, tG), 0.075, tS) * (0.6 + aSeed.z * 0.9);
        size = mix(size, 0.2, max(max(shard, vshard), farV));
        size = mix(size, 0.13, nearV);
        float coc = abs(dist - uFocus) * uAperture;
        float px = (size + coc) * uProj / dist;
        float minPx = 1.6 * uPR;
        float energy = (size * size) / ((size + coc) * (size + coc));
        alpha *= max(energy, 0.04);
        if (px < minPx) { alpha *= px / minPx; px = minPx; }
        px = min(px, 72.0 * uPR);
        alpha *= exp(-max(dist - uFogNear, 0.0) * uFogDen);
        vCoc = clamp(coc / (size + 1e-4) * 0.5, 0.0, 1.0);
        vAlpha = alpha * uBright;
        // the ghost: the original plume, uncut, in faint outline
        if (uGhost > 0.5) { vColor = BONE; vGlyph = 0.0; vAlpha = 0.17 * uGhostA * aKind * max(energy, 0.04) * exp(-max(dist - uFogNear, 0.0) * uFogDen); }

        gl_PointSize = px;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uAtlas;
      varying vec3 vColor; varying float vAlpha; varying float vGlyph; varying float vIndex; varying float vCoc;
      void main() {
        vec2 uv = gl_PointCoord;
        vec2 cell = vec2(mod(vIndex, ${ATLAS_GRID}.0), floor(vIndex / ${ATLAS_GRID}.0));
        float g = texture2D(uAtlas, (cell + uv) / ${ATLAS_GRID}.0).r;
        float d = length(uv - 0.5) * 2.0;
        float halo = exp(-d * d * 3.5);
        float core = exp(-d * d * 14.0);
        float sharp = core + halo * 0.35;
        float bokeh = smoothstep(1.0, 0.82, d) * (0.55 + 0.45 * smoothstep(0.55, 0.95, d));
        float point = mix(sharp, bokeh * 0.6, vCoc);
        float a = mix(point, g * (1.0 - vCoc * 0.7), vGlyph);
        if (a * vAlpha < 0.003) discard;
        gl_FragColor = vec4(vColor, a * vAlpha);
      }
    `,
  });
}

import * as THREE from 'three';
import { ATLAS_GRID } from './glyphs.js';

// S5 — the two branches, staged in the space on either side of the veil (the plane x ≈ 0; +x is its near side).
// Open weights, near side: the matrix W assembles from loose digits; a low-rank adapter B·A is drawn beside it,
// laid over it, and lifted off again — W's numbers never change.
// Closed models, far side: a sealed monolith that nothing touches; red operator text flows in, answers flow
// out into a cloud of embeddings, and under the operator only some of the answers move.

const PHOS = new THREE.Color(0x59ff9c);
const RED = new THREE.Color(0xff4a36);
const BONE = new THREE.Color(0xe8e2d4);

// Where the two branches stand, by screen shape: side by side on wide screens, one above the other on tall ones.
export function branchLayout(aspect) {
  const tall = aspect < 0.85;
  return tall
    ? { tall, open: { pos: new THREE.Vector3(2.0, 6.6, 13), rotY: -0.08, scale: 0.5 },
        closed: { pos: new THREE.Vector3(-2.0, -0.2, 13), rotY: 0.08, scale: 0.5 } }
    : { tall, open: { pos: new THREE.Vector3(6.2, 3.2, 13), rotY: -0.2, scale: 1 },
        closed: { pos: new THREE.Vector3(-5.7, 3.2, 13), rotY: 0.2, scale: 1 } };
}

const rand = (seed) => { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };
const gauss = (r) => { let u = 0; for (let i = 0; i < 6; i++) u += r(); return (u - 3) / 1.2; };
const clamp01 = (x) => Math.min(Math.max(x, 0), 1);

function lineMat(color) {
  return new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending });
}
const lines = (pts, mat, seg = true) => new (seg ? THREE.LineSegments : THREE.Line)(new THREE.BufferGeometry().setFromPoints(pts), mat);
const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);

// ---------------------------------------------------------------- W: one quad per number, from a text atlas
const ROWS = 9, COLS = 7, CW = 0.9, CH = 0.43;
function numberAtlas(values) {
  const cw = 128, ch = 56, per = 8;
  const c = document.createElement('canvas');
  c.width = cw * per; c.height = ch * Math.ceil(values.length / per);
  const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '400 34px "JetBrains Mono", ui-monospace, monospace';
  values.forEach((v, i) => {
    const s = (v < 0 ? '−' : '') + Math.abs(v).toFixed(2);
    g.fillText(s, (i % per) * cw + cw / 2, Math.floor(i / per) * ch + ch / 2 + 2);
  });
  const t = new THREE.CanvasTexture(c);
  t.flipY = false; t.anisotropy = 4; t.needsUpdate = true;
  return { tex: t, per, rows: Math.ceil(values.length / per) };
}

function buildMatrix(r) {
  const n = ROWS * COLS;
  const values = [];
  for (let i = 0; i < n; i++) values.push(Math.round(gauss(r) * 3.4) / 100 + (r() < 0.06 ? 0.08 : 0));
  const at = numberAtlas(values);
  const base = new THREE.PlaneGeometry(CW * 0.92, CH * 0.92);
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index; g.setAttribute('position', base.getAttribute('position')); g.setAttribute('uv', base.getAttribute('uv'));
  const grid = new Float32Array(n * 3), from = new Float32Array(n * 3), info = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / COLS), col = i % COLS;
    grid[i * 3] = (col - (COLS - 1) / 2) * CW; grid[i * 3 + 1] = ((ROWS - 1) / 2 - row) * CH;
    // the digits arrive from the space behind, scattered and turning
    from[i * 3] = gauss(r) * 5; from[i * 3 + 1] = gauss(r) * 4; from[i * 3 + 2] = -6 - r() * 10;
    info[i * 4] = i;                                     // atlas cell
    info[i * 4 + 1] = col / COLS * 0.55 + r() * 0.3;     // arrival stagger, left to right
    info[i * 4 + 2] = 0.35 + Math.min(Math.abs(values[i]) * 11, 0.65); // brightness grows with magnitude
    info[i * 4 + 3] = r();
  }
  g.setAttribute('aGrid', new THREE.InstancedBufferAttribute(grid, 3));
  g.setAttribute('aFrom', new THREE.InstancedBufferAttribute(from, 3));
  g.setAttribute('aInfo', new THREE.InstancedBufferAttribute(info, 4));
  g.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTex: { value: at.tex }, uAsm: { value: 0 }, uA: { value: 0 }, uTint: { value: 0 }, uT: { value: 0 },
      uPer: { value: at.per }, uRows: { value: at.rows }, uPhos: { value: PHOS }, uRed: { value: RED } },
    vertexShader: `attribute vec3 aGrid, aFrom; attribute vec4 aInfo; uniform float uAsm, uT, uPer, uRows;
      varying vec2 vUv; varying float vK, vB;
      void main(){
        float k = clamp((uAsm * 1.9 - aInfo.y) / 0.9, 0.0, 1.0); k = k*k*(3.0-2.0*k);
        vec3 p = mix(aFrom, aGrid, k);
        float spin = (1.0 - k) * (aInfo.w * 6.0 - 3.0);
        vec3 q = position; q.xy = mat2(cos(spin), -sin(spin), sin(spin), cos(spin)) * q.xy;
        vec2 cell = vec2(mod(aInfo.x, uPer), floor(aInfo.x / uPer));
        vUv = (cell + vec2(uv.x, 1.0 - uv.y)) / vec2(uPer, uRows);
        vK = k; vB = aInfo.z * (0.9 + 0.1 * sin(uT * 1.7 + aInfo.w * 40.0));
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p + q, 1.0); }`,
    fragmentShader: `uniform sampler2D uTex; uniform float uA, uTint; uniform vec3 uPhos, uRed; varying vec2 vUv; varying float vK, vB;
      void main(){ float g = texture2D(uTex, vUv).r; float a = g * vB * uA * (0.25 + 0.75 * vK); if (a < 0.003) discard;
        gl_FragColor = vec4(mix(uPhos, mix(uPhos, uRed, 0.75), uTint), a); }`,
  });
  const mesh = new THREE.Mesh(g, mat);
  mesh.frustumCulled = false;
  return mesh;
}

// ---------------------------------------------------------------- B·A: two thin factors and the rank-one panel they span
const BA = 1.9;
function buildAdapter(r) {
  const grp = new THREE.Group();
  const outline = lineMat(RED);
  const sq = [V(-BA / 2, -BA / 2), V(BA / 2, -BA / 2), V(BA / 2, -BA / 2), V(BA / 2, BA / 2), V(BA / 2, BA / 2), V(-BA / 2, BA / 2), V(-BA / 2, BA / 2), V(-BA / 2, -BA / 2)];
  grp.add(lines(sq, outline));
  // B: a column of 8 numbers' worth of red ticks along the left edge; A: a row along the top
  const fMat = lineMat(RED);
  const fPts = [];
  const bv = [], av = [];
  for (let i = 0; i < 8; i++) { bv.push(0.25 + r() * 0.75); av.push(0.25 + r() * 0.75); }
  for (let i = 0; i < 8; i++) {
    const y = BA / 2 - (i + 0.5) * (BA / 8), x = -BA / 2 - 0.22;
    fPts.push(V(x - bv[i] * 0.28, y), V(x, y));
    const xx = -BA / 2 + (i + 0.5) * (BA / 8), yy = BA / 2 + 0.22;
    fPts.push(V(xx, yy), V(xx, yy + av[i] * 0.28));
  }
  const factors = lines(fPts, fMat);
  grp.add(factors);
  const cellMat = new THREE.ShaderMaterial({
    transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uFill: { value: 0 }, uA: { value: 0 }, uB: { value: bv }, uAv: { value: av }, uRed: { value: RED } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
    fragmentShader: `uniform float uFill, uA; uniform float uB[8]; uniform float uAv[8]; uniform vec3 uRed; varying vec2 vUv;
      void main(){
        int i = int(clamp(floor((1.0 - vUv.y) * 8.0), 0.0, 7.0)), j = int(clamp(floor(vUv.x * 8.0), 0.0, 7.0));
        float bi = 0.0, aj = 0.0;
        for (int k = 0; k < 8; k++) { if (k == i) bi = uB[k]; if (k == j) aj = uAv[k]; }
        // the outer product sweeps out from the corner where B and A meet
        float sweep = smoothstep(uFill * 2.1 - 0.15, uFill * 2.1 - 0.35, vUv.x + (1.0 - vUv.y));
        vec2 f = fract(vUv * 8.0); float inset = step(0.12, f.x) * step(f.x, 0.88) * step(0.12, f.y) * step(f.y, 0.88);
        float a = (0.06 + 0.42 * bi * aj) * inset * sweep * uA; if (a < 0.003) discard;
        gl_FragColor = vec4(uRed, a); }`,
  });
  const cells = new THREE.Mesh(new THREE.PlaneGeometry(BA, BA), cellMat);
  grp.add(cells);
  grp.userData = { outline, fMat, cellMat };
  return grp;
}

// ---------------------------------------------------------------- glyph streams (operator text in, answers out)
function glyphStream(atlas, count, curves, r, glyphs, color) {
  const pos = new Float32Array(count * 3), a = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    a[i * 4] = i % curves;                    // which curve
    a[i * 4 + 1] = r();                       // phase along it
    a[i * 4 + 2] = glyphs[Math.floor(r() * glyphs.length)];
    a[i * 4 + 3] = r();                       // size / colour jitter
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aS', new THREE.BufferAttribute(a, 4));
  const zero = () => Array.from({ length: 3 }, () => new THREE.Vector3());
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: {
      uAtlas: { value: atlas }, uP0: { value: zero() }, uP1: { value: zero() }, uP2: { value: zero() },
      uT: { value: 0 }, uA: { value: 0 }, uProj: { value: 800 }, uScale: { value: 1 }, uSpeed: { value: 0.12 },
      uColor: { value: color.clone() }, uAlt: { value: RED.clone() }, uAltAmt: { value: 0 },
    },
    vertexShader: `attribute vec4 aS; uniform vec3 uP0[3]; uniform vec3 uP1[3]; uniform vec3 uP2[3];
      uniform float uT, uProj, uScale, uSpeed; varying float vF, vIdx, vJ;
      void main(){
        int c = int(aS.x); vec3 p0 = uP0[0], p1 = uP1[0], p2 = uP2[0];
        if (c == 1) { p0 = uP0[1]; p1 = uP1[1]; p2 = uP2[1]; } else if (c == 2) { p0 = uP0[2]; p1 = uP1[2]; p2 = uP2[2]; }
        float u = fract(aS.y + uT * uSpeed * (0.8 + 0.4 * aS.w));
        vec3 p = mix(mix(p0, p1, u), mix(p1, p2, u), u);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = (0.26 + 0.12 * aS.w) * uScale * uProj / max(-mv.z, 0.1);
        vF = smoothstep(0.0, 0.12, u) * (1.0 - smoothstep(0.86, 1.0, u)); vIdx = aS.z; vJ = aS.w;
        gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform sampler2D uAtlas; uniform float uA, uAltAmt; uniform vec3 uColor, uAlt; varying float vF, vIdx, vJ;
      void main(){
        vec2 cell = vec2(mod(vIdx, ${ATLAS_GRID}.0), floor(vIdx / ${ATLAS_GRID}.0));
        float g = texture2D(uAtlas, (cell + gl_PointCoord) / ${ATLAS_GRID}.0).r;
        float a = g * vF * uA * (0.55 + 0.45 * vJ); if (a < 0.004) discard;
        vec3 col = mix(uColor, uAlt, step(vJ, 0.55) * uAltAmt);
        gl_FragColor = vec4(col, a); }`,
  });
  const pts = new THREE.Points(g, mat);
  pts.frustumCulled = false;
  return pts;
}

// ---------------------------------------------------------------- the cloud of answer embeddings
function buildCloud(r) {
  const n = 560;
  const base = new Float32Array(n * 3), s = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) {
    const core = r() < 0.55;
    const sc = core ? 0.42 : 0.95;
    base[i * 3] = gauss(r) * sc; base[i * 3 + 1] = gauss(r) * sc * 0.8; base[i * 3 + 2] = gauss(r) * sc;
    s[i * 2] = r() < 0.3 ? 1 : 0;   // these are the answers the operator moves
    s[i * 2 + 1] = r();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(base, 3));
  g.setAttribute('aS', new THREE.BufferAttribute(s, 2));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uA: { value: 0 }, uGrow: { value: 0 }, uMove: { value: 0 }, uProj: { value: 800 }, uScale: { value: 1 },
      uShift: { value: new THREE.Vector3(0.75, 0.55, 0.25) }, uBone: { value: BONE }, uRed: { value: RED } },
    vertexShader: `attribute vec2 aS; uniform float uGrow, uMove, uProj, uScale; uniform vec3 uShift; varying float vM, vJ, vIn;
      void main(){
        vIn = smoothstep(aS.y * 0.8, aS.y * 0.8 + 0.2, uGrow);
        float m = aS.x * uMove; vM = m; vJ = aS.y;
        vec3 p = position * (0.4 + 0.6 * vIn) + uShift * m * (0.75 + 0.5 * aS.y);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = (0.05 + 0.04 * aS.y + 0.03 * m) * uScale * uProj / max(-mv.z, 0.1);
        gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uA; uniform vec3 uBone, uRed; varying float vM, vJ, vIn;
      void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; float a = exp(-d*d*4.0) * uA * vIn * (0.45 + 0.55 * vJ);
        if (a < 0.003) discard; gl_FragColor = vec4(mix(uBone * 0.85, uRed, vM), a); }`,
  });
  const pts = new THREE.Points(g, mat);
  pts.frustumCulled = false;
  return pts;
}

export function buildBranches(scene, atlas) {
  const r = rand(5);
  const open = new THREE.Group(), closed = new THREE.Group();
  scene.add(open, closed);

  // ---- open weights
  const W = buildMatrix(r);
  W.position.set(-1.9, 0, 0);
  open.add(W);
  const bw = (COLS * CW) / 2 + 0.25, bh = (ROWS * CH) / 2 + 0.18, lip = 0.32;
  const brMat = lineMat(PHOS);
  const brL = [V(-bw + lip, bh), V(-bw, bh), V(-bw, bh), V(-bw, -bh), V(-bw, -bh), V(-bw + lip, -bh)];
  const brackets = lines([...brL, ...brL.map((v) => V(-v.x, v.y))], brMat);
  brackets.position.copy(W.position);
  open.add(brackets);
  const plusMat = lineMat(BONE);
  const plus = lines([V(-0.18, 0), V(0.18, 0), V(0, -0.18), V(0, 0.18)], plusMat);
  plus.position.set(1.95, 0, 0);
  open.add(plus);
  const adapter = buildAdapter(r);
  const BA_HOME = new THREE.Vector3(3.75, 0, 0.0);
  const BA_OVER = new THREE.Vector3(-1.9, 0, 0.9);
  adapter.position.copy(BA_HOME);
  open.add(adapter);

  // ---- closed models
  const MW = 2.5, MH = 3.0, MD = 2.5;
  const mono = new THREE.Group();
  mono.position.set(-0.9, 0, 0);
  closed.add(mono);
  const faceMat = new THREE.MeshBasicMaterial({ color: 0x08080b, transparent: true, opacity: 0, depthWrite: true });
  const faces = new THREE.Mesh(new THREE.BoxGeometry(MW, MH, MD), faceMat);
  faces.renderOrder = 10;
  const edgeMat = new THREE.LineBasicMaterial({ color: BONE, transparent: true, opacity: 0, depthWrite: false });
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(faces.geometry), edgeMat);
  edges.renderOrder = 11;
  edges.scale.setScalar(1.002);
  mono.add(faces, edges);

  const TOKENS = [36, 37, 38, 39, 40, 41, 34, 33, 16, 17, 23];        // token fragments and a few letters
  const op = glyphStream(atlas, 72, 3, r, TOKENS, RED);
  op.renderOrder = 12;
  const L = -0.9 - MW / 2;
  [[V(-5.3, 2.6, 0.6), V(-3.6, 2.3, 0.5), V(L, 0.55, 0.2)],
    [V(-5.6, 1.7, -0.3), V(-3.7, 1.3, -0.2), V(L, 0.15, 0)],
    [V(-5.2, 0.8, 0.2), V(-3.6, 0.2, 0.3), V(L, -0.25, 0.1)]].forEach(([a, b, c], k) => {
    op.material.uniforms.uP0.value[k].copy(a); op.material.uniforms.uP1.value[k].copy(b); op.material.uniforms.uP2.value[k].copy(c);
  });
  closed.add(op);

  const R0 = -0.9 + MW / 2;
  const CLOUD = new THREE.Vector3(4.0, 0.1, 0);
  const ans = glyphStream(atlas, 48, 3, r, [36, 37, 38, 39, 40, 41], BONE);
  ans.renderOrder = 12;
  ans.material.uniforms.uSpeed.value = 0.16;
  [-0.25, 0.05, 0.3].forEach((y, k) => {
    ans.material.uniforms.uP0.value[k].set(R0, y, 0);
    ans.material.uniforms.uP1.value[k].set((R0 + CLOUD.x) / 2, y * 0.6 + 0.1, 0.1 * (k - 1));
    ans.material.uniforms.uP2.value[k].set(CLOUD.x - 0.5, CLOUD.y + y * 0.3, 0);
  });
  closed.add(ans);
  const cloud = buildCloud(r);
  cloud.position.copy(CLOUD);
  cloud.renderOrder = 12;
  closed.add(cloud);

  // ---- anchors for the HTML labels
  const anchor = (parent, x, y, z = 0) => { const o = new THREE.Object3D(); o.position.set(x, y, z); parent.add(o); return o; };
  const anchors = {
    w: anchor(open, -1.9, -bh - 0.45),
    ba: anchor(open, BA_HOME.x + 0.5, -BA / 2 - 0.8),
    op: anchor(closed, -5.3, 3.15, 0.6),
    model: anchor(closed, -0.9, -MH / 2 - 0.5, MD / 2),
    cloud: anchor(closed, CLOUD.x, -1.5),
  };

  function setLayout(lay) {
    for (const [grp, l] of [[open, lay.open], [closed, lay.closed]]) {
      grp.position.copy(l.pos); grp.rotation.set(0, l.rotY, 0); grp.scale.setScalar(l.scale);
    }
    for (const m of [op.material, ans.material, cloud.material]) m.uniforms.uScale.value = lay.open.scale;
  }

  return {
    anchors, setLayout,
    setProj(proj) { for (const m of [op.material, ans.material, cloud.material]) m.uniforms.uProj.value = proj; },
    update(st, time) {
      const out = 1 - st.brOut;
      const oA = st.brOpen * out, cA = st.brClosed * out;
      open.visible = oA > 0.002; closed.visible = cA > 0.002;
      const u = W.material.uniforms;
      u.uAsm.value = st.wAsm; u.uA.value = oA; u.uT.value = time;
      // while the adapter lies over W, W reads as W + BA; lifted off, W is exactly what it was
      u.uTint.value = st.baOver * 0.55;
      brMat.opacity = oA * 0.85 * clamp01(st.wAsm * 1.6 - 0.6);
      plusMat.opacity = oA * 0.7 * clamp01(st.ba * 2) * (1 - st.baOver);
      const ad = adapter.userData;
      ad.fMat.opacity = oA * clamp01(st.ba * 1.6) * 0.95;
      ad.outline.opacity = oA * clamp01(st.ba * 1.6 - 0.4) * 0.8;
      ad.cellMat.uniforms.uFill.value = st.baFill; ad.cellMat.uniforms.uA.value = oA;
      adapter.position.lerpVectors(BA_HOME, BA_OVER, st.baOver * st.baOver * (3 - 2 * st.baOver));
      adapter.scale.setScalar(1 + st.baOver * (ROWS * CH / BA - 1) * 0.6);

      faceMat.opacity = cA * 0.97;
      edgeMat.opacity = cA * 0.7;
      faces.visible = edges.visible = cA > 0.002;
      op.material.uniforms.uA.value = cA * st.op; op.material.uniforms.uT.value = time;
      ans.material.uniforms.uA.value = cA * st.answers * 0.85; ans.material.uniforms.uT.value = time;
      ans.material.uniforms.uAltAmt.value = st.op;     // under the operator, part of what comes out is different
      const cu = cloud.material.uniforms;
      cu.uA.value = cA; cu.uGrow.value = st.answers; cu.uMove.value = st.move;
      cloud.rotation.y = time * 0.05;
    },
  };
}

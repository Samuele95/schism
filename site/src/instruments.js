import * as THREE from 'three';

const BONE = new THREE.Color(0xe8e2d4);
const PHOS = new THREE.Color(0x59ff9c);
const RED = new THREE.Color(0xff4030);
const WARM = new THREE.Color(1, 0.85, 0.75);

function lineMat(color, opacity = 0) {
  return new THREE.LineBasicMaterial({
    color, transparent: true, opacity, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
  });
}
const lineObj = (pts, mat, segments = false) =>
  new (segments ? THREE.LineSegments : THREE.Line)(new THREE.BufferGeometry().setFromPoints(pts), mat);

// An engraved ring in its own XY plane: a great circle (optionally with a gap or dashed) and degree ticks.
function makeRing(radius, color, { tickEvery = 5, gapDeg = 0, dashed = false } = {}) {
  const group = new THREE.Group();
  const mat = lineMat(color);
  if (dashed) {
    const pts = [];
    for (let d = 0; d < 360; d += 6) {
      for (const dd of [d, d + 3]) {
        const a = (dd / 180) * Math.PI;
        pts.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0));
      }
    }
    group.add(lineObj(pts, mat, true));
  } else {
    const pts = [];
    const from = gapDeg / 2, to = 360 - gapDeg / 2;
    for (let i = 0; i <= 256; i++) {
      const a = ((from + (to - from) * (i / 256)) / 180) * Math.PI;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0));
    }
    group.add(lineObj(pts, mat));
  }
  const tickMat = lineMat(color);
  if (tickEvery) {
    const ticks = [];
    for (let d = 0; d < 360; d += tickEvery) {
      if (gapDeg && (d < gapDeg / 2 + 2 || d > 360 - gapDeg / 2 - 2)) continue;
      const a = (d / 180) * Math.PI;
      const len = d % 30 === 0 ? 0.55 : d % 15 === 0 ? 0.32 : 0.16;
      const c = Math.cos(a), s = Math.sin(a);
      ticks.push(new THREE.Vector3(c * radius, s * radius, 0), new THREE.Vector3(c * (radius - len), s * (radius - len), 0));
    }
    group.add(lineObj(ticks, tickMat, true));
  }
  group.userData.mats = [mat, tickMat];
  return group;
}
function setOpacity(obj, o) {
  obj.userData.mats.forEach((m, i) => { m.opacity = o * (i === 1 ? 0.8 : 1); });
  obj.visible = o > 0.002;
}

function sealTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(118, 112, 10, 128, 128, 120);
  grd.addColorStop(0, '#ff6a4e'); grd.addColorStop(0.55, '#d8321f'); grd.addColorStop(0.9, '#8e1a10'); grd.addColorStop(1, 'rgba(110,20,12,0)');
  g.fillStyle = grd;
  g.beginPath();
  for (let i = 0; i <= 48; i++) {           // an irregular wax edge
    const a = (i / 48) * Math.PI * 2, r = 112 + Math.sin(i * 2.7) * 4 + Math.cos(i * 1.3) * 3;
    g.lineTo(128 + Math.cos(a) * r, 128 + Math.sin(a) * r);
  }
  g.fill();
  g.strokeStyle = 'rgba(255,190,170,0.55)'; g.lineWidth = 3;
  g.beginPath(); g.arc(128, 128, 78, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 1.5; g.beginPath(); g.arc(128, 128, 70, 0, Math.PI * 2); g.stroke();
  g.fillStyle = 'rgba(255,205,190,0.8)';
  g.font = '400 96px "EB Garamond", Georgia, serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('σ', 128, 122);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function buildInstruments(scene, { axis, plumeHeight, grid, b1, b2, vaultPos }) {
  const qPlane = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), axis);
  const qAxis = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis);

  // --- armillary: three rings in a gimbal around the space
  const armillary = new THREE.Group();
  scene.add(armillary);
  const R = 15.5;
  const rings = [makeRing(R, BONE), makeRing(R * 0.94, BONE, { tickEvery: 10 }), makeRing(R * 0.88, BONE, { tickEvery: 10 })];
  rings[1].rotation.x = Math.PI / 2;
  rings[2].rotation.y = Math.PI / 2;
  const base = rings.map((r) => r.quaternion.clone());
  rings.forEach((r) => armillary.add(r));
  // the ring that becomes the blade, and at the end keeps a cleft where the blade passed
  const cleft = makeRing(R, BONE, { gapDeg: 7 });
  rings[0].add(cleft);

  const bladeMat = new THREE.ShaderMaterial({
    transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uI: { value: 0 }, uColor: { value: new THREE.Color(1.0, 0.92, 0.84) } },
    vertexShader: `varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
    fragmentShader: `uniform float uI; uniform vec3 uColor; varying vec2 vP;
      void main(){ float r = length(vP) / ${R.toFixed(1)};
        float edge = exp(-pow((1.0 - r) * 26.0, 2.0));
        float sheet = 0.05 * smoothstep(1.0, 0.0, r);
        float a = (edge + sheet) * uI; if (a < 0.002) discard;
        gl_FragColor = vec4(uColor, a); }`,
  });
  rings[0].add(new THREE.Mesh(new THREE.CircleGeometry(R, 128), bladeMat));

  // --- candidate axes during the search
  const candidates = new THREE.Group();
  scene.add(candidates);
  const rnd = (() => { let s = 11; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  for (let i = 0; i < 6; i++) {
    const d = new THREE.Vector3(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1).normalize().lerp(axis, i / 6).normalize();
    const m = lineMat(PHOS);
    const l = lineObj([d.clone().multiplyScalar(-17), d.clone().multiplyScalar(17)], m);
    l.userData.mats = [m];
    candidates.add(l);
  }

  // --- the severed axis: two halves of one rod, with a halo
  const rod = new THREE.Group();
  rod.quaternion.copy(qAxis);
  scene.add(rod);
  const rodMat = new THREE.MeshBasicMaterial({ color: RED, transparent: true, opacity: 0, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending });
  const haloMat = rodMat.clone();
  const mkHalf = (len, up) => {
    const g = new THREE.Group();
    const core = new THREE.CylinderGeometry(0.035, 0.035, len, 10, 1, true); core.translate(0, up ? len / 2 : -len / 2, 0);
    const halo = new THREE.CylinderGeometry(0.16, 0.16, len, 12, 1, true); halo.translate(0, up ? len / 2 : -len / 2, 0);
    g.add(new THREE.Mesh(core, rodMat), new THREE.Mesh(halo, haloMat));
    return g;
  };
  const lower = mkHalf(9, false), upper = mkHalf(plumeHeight + 8, true);
  rod.add(lower, upper);
  const cross = (s) => [new THREE.Vector3(-s, 0, 0), new THREE.Vector3(s, 0, 0), new THREE.Vector3(0, 0, -s), new THREE.Vector3(0, 0, s)];
  const markMatG = lineMat(BONE), markMatB = lineMat(RED);
  const markG = lineObj(cross(0.6), markMatG, true);
  const markB = lineObj(cross(0.6), markMatB, true);
  markB.position.y = plumeHeight;
  rod.add(markG, markB);

  // --- the Samian letter: stem below, one arm into the disc (without), one into the plume (with).
  // Its three strokes are the same line objects that later bend into the first armillary ring.
  const yMat = lineMat(BONE);
  const armBad = axis.clone().multiplyScalar(plumeHeight + 1.5);
  const armGood = b1.clone().multiplyScalar(9);
  const stemDir = armBad.clone().normalize().add(armGood.clone().normalize()).normalize().multiplyScalar(-8);
  const YM = 64;
  const yStrokes = [stemDir, armGood, armBad].map((end, k) => {
    const pos = new Float32Array(YM * 3);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const line = new THREE.Line(g, yMat);
    line.frustumCulled = false;
    scene.add(line);
    // its arc of ring 0 (ring 0 at rest: radius R in its XY plane), a third of the circle per stroke
    const arc = [];
    for (let i = 0; i < YM; i++) {
      const a = ((k + i / (YM - 1)) * 2 * Math.PI) / 3;
      arc.push(new THREE.Vector3(Math.cos(a) * 15.5, Math.sin(a) * 15.5, 0));
    }
    return { end, line, pos, arc };
  });
  const yTmp = new THREE.Vector3(), yTmp2 = new THREE.Vector3();

  // --- the veil: vertical threads in a plane through the axis
  const veil = new THREE.Group();
  scene.add(veil);
  const veilMat = lineMat(BONE);
  const threads = [];
  for (let k = -32; k <= 32; k++) {
    const off = b2.clone().multiplyScalar(k * 0.55);
    const len = 9 + 5 * Math.cos(k * 0.37) * Math.cos(k * 0.11);
    const t = lineObj([off.clone().addScaledVector(axis, -len * 0.6), off.clone().addScaledVector(axis, len)], veilMat);
    threads.push(t);
    veil.add(t);
  }
  const threadOffsets = threads.map((t, i) => b2.clone().multiplyScalar((i - 32) * 0.55));

  // --- the floor: ring 1, sent along the axis as a dashed ring; it settles as the target mark
  const floorTop = plumeHeight + 3;
  const floorRing = makeRing(9, BONE, { dashed: true, tickEvery: 0 });
  floorRing.quaternion.copy(qPlane);
  scene.add(floorRing);

  // --- the tournament's witnesses: four testers on a ring, each with a thread to the cut, none to each other
  const testers = new THREE.Group();
  testers.quaternion.copy(qPlane);
  scene.add(testers);
  const tMat = lineMat(PHOS), thMat = lineMat(PHOS);
  const tPos = [];
  const tPts = [], thPts = [];
  for (let k = 0; k < 4; k++) {
    const a = Math.PI / 4 + (k * Math.PI) / 2;
    const p = new THREE.Vector3(Math.cos(a) * 11, Math.sin(a) * 11, 0);
    tPos.push(p);
    tPts.push(p.clone().add(new THREE.Vector3(-0.5, 0, 0)), p.clone().add(new THREE.Vector3(0.5, 0, 0)),
      p.clone().add(new THREE.Vector3(0, -0.5, 0)), p.clone().add(new THREE.Vector3(0, 0.5, 0)));
    thPts.push(p.clone().multiplyScalar(0.94), new THREE.Vector3());
  }
  testers.add(lineObj(tPts, tMat, true), lineObj(thPts, thMat, true));
  const tAnchors = tPos.map((p) => { const o = new THREE.Object3D(); o.position.copy(p); testers.add(o); return o; });
  // the judge: a small engraved ring above the cut, on the axis
  const judge = makeRing(0.9, BONE, { tickEvery: 30 });
  judge.quaternion.copy(qPlane);
  judge.position.copy(axis).multiplyScalar(-4.5);
  scene.add(judge);

  // --- the seal over the vault
  const seal = new THREE.Sprite(new THREE.SpriteMaterial({ map: sealTexture(), transparent: true, depthTest: false, depthWrite: false, opacity: 0, color: 0x9a9a9a }));
  seal.position.copy(vaultPos);
  seal.scale.setScalar(0.001);
  scene.add(seal);
  const vaultHalo = makeRing(2.2, RED, { tickEvery: 0 });
  vaultHalo.position.copy(vaultPos);
  scene.add(vaultHalo);

  // --- matrix brackets
  const brackets = new THREE.Group();
  scene.add(brackets);
  const bw = grid.width / 2 + 0.6, bh = grid.height / 2 + 0.5, lip = 0.9;
  const bm = lineMat(PHOS);
  const left = [new THREE.Vector3(-bw + lip, bh, 0), new THREE.Vector3(-bw, bh, 0), new THREE.Vector3(-bw, -bh, 0), new THREE.Vector3(-bw + lip, -bh, 0)];
  brackets.add(lineObj(left, bm), lineObj(left.map((v) => new THREE.Vector3(-v.x, v.y, 0)), bm));

  const q = new THREE.Quaternion();
  const turn = new THREE.Quaternion(), eul = new THREE.Euler();
  return {
    markG, markB, tAnchors, judge, seal,
    update(st, camera) {
      // armillary gimbal; ring 0 aligns to the plane across the axis and becomes the blade
      rings.forEach((r, i) => {
        const t = st.searchT;
        turn.setFromEuler(eul.set(t * (0.7 + i * 0.35), t * (0.45 - i * 0.2), t * 0.25 * (i - 1)));
        r.quaternion.copy(base[i]).multiply(turn);
      });
      // rings 1 and 2 unfold from ring 0 by rotation
      for (const i of [1, 2]) {
        q.copy(rings[0].quaternion).slerp(rings[i].quaternion, st.unfold);
        rings[i].quaternion.copy(q);
        setOpacity(rings[i], st.rings * (1 - st.align * 0.85) * 0.42 * (i === 1 ? 1 - st.floorOn : 1));
      }
      // ring 1 goes on to become the floor's dashed ring: it aligns across the axis, narrows and rises to the plume's top
      if (st.toFloor > 0) {
        q.copy(rings[1].quaternion).slerp(qPlane, st.toFloor);
        rings[1].quaternion.copy(q);
        rings[1].scale.setScalar(1 + (9 / (R * 0.94) - 1) * st.toFloor);
        rings[1].position.copy(axis).multiplyScalar(floorTop * st.toFloor);
      } else { rings[1].scale.setScalar(1); rings[1].position.set(0, 0, 0); }
      q.copy(rings[0].quaternion).slerp(qPlane, st.align);
      rings[0].quaternion.copy(q);
      rings[0].scale.setScalar(st.bladeScale);
      const r0 = Math.max(st.rings * 0.42, st.bladeLine);
      setOpacity(rings[0], r0 * (1 - st.cleft));
      rings[0].userData.mats[0].color.copy(BONE).lerp(WARM, st.bladeLine);
      setOpacity(cleft, r0 * st.cleft);
      bladeMat.uniforms.uI.value = st.bladeSheet;

      candidates.children.forEach((l, i) => {
        const c = st.candidates * 7.2 - i;
        const o = c > 0 && c < 1.4 ? Math.sin(Math.min(c / 1.4, 1) * Math.PI) * 0.75 : 0;
        l.userData.mats[0].opacity = o; l.visible = o > 0.002;
      });

      rodMat.opacity = st.axis * 0.95;
      haloMat.opacity = st.axis * 0.16;
      lower.position.y = -st.gap;
      upper.position.y = st.gap;
      const fall = Math.max(st.collapse, 0);
      upper.scale.y = Math.max(1 - fall, 0.0001);
      lower.scale.y = Math.max(1 - fall * 0.9, 0.0001);
      markMatG.opacity = st.means * 0.8;
      markMatB.opacity = st.means * 0.9 * (1 - fall);
      markB.position.y = plumeHeight * (1 - fall);
      rod.visible = st.axis > 0.002 || st.means > 0.002;

      // the Y draws out from the fork, then its strokes bend into the first armillary ring
      const m = st.yToRing, me = m * m * (3 - 2 * m);
      const showY = st.yAlpha > 0.002 && m < 0.999;
      yMat.opacity = (st.yAlpha * 0.6) * (1 - me) + 0.42 * me;
      yStrokes.forEach((s, k) => {
        s.line.visible = showY;
        if (!showY) return;
        const draw = Math.max(Math.min(st.yDraw * 3 - k, 1), 0);
        for (let i = 0; i < YM; i++) {
          const f = i / (YM - 1);
          yTmp.copy(s.end).multiplyScalar(f * draw);
          yTmp2.copy(s.arc[i]);
          yTmp.lerp(yTmp2, me).addScaledVector(axis, Math.sin(me * Math.PI) * 2.5 * Math.sin(f * Math.PI));
          s.pos[i * 3] = yTmp.x; s.pos[i * 3 + 1] = yTmp.y; s.pos[i * 3 + 2] = yTmp.z;
        }
        s.line.geometry.attributes.position.needsUpdate = true;
      });

      // the veil's threads grow from the disc plane, then converge on the axis, where the Y's fork appears
      veilMat.opacity = Math.max(st.veil, st.converge > 0 && st.converge < 1 ? 0.6 : 0) * 0.22;
      veil.visible = st.veil > 0.002 || (st.converge > 0.002 && st.converge < 0.998);
      threads.forEach((t, k) => {
        t.scale.setScalar(Math.max(Math.min(Math.max(st.veil, st.converge < 1 ? 0.6 * (1 - st.converge) : 0) * 1.6 - (Math.abs(k - 32) / 32) * 0.6, 1), 0.0001));
        t.position.copy(threadOffsets[k]).multiplyScalar(-st.converge);
      });

      // the floor's dashed ring sweeps down through the plume and stays as a mark at the target level
      floorRing.position.copy(axis).multiplyScalar(floorTop * (1 - st.floorPos));
      setOpacity(floorRing, st.floorOn * (0.7 - 0.35 * st.floorPos) * st.floorMark);

      tMat.opacity = st.testers * 0.85; thMat.opacity = st.testers * 0.22;
      testers.visible = st.testers > 0.002;
      setOpacity(judge, st.testers * 0.6);

      seal.material.opacity = st.seal * (1 - st.sealBreak);
      seal.scale.setScalar(Math.max(st.seal * 1.25 * (1 + st.sealBreak * 0.8), 0.001));
      seal.visible = st.seal * (1 - st.sealBreak) > 0.002;
      setOpacity(vaultHalo, st.seal * (1 - st.sealBreak) * 0.35);
      vaultHalo.quaternion.copy(camera.quaternion);

      bm.opacity = st.brackets * 0.8;
      brackets.visible = st.brackets > 0.002;
    },
  };
}

// --- depth cues: near-field motes (parallax, bokeh) and a far field of faint stars
export function buildDepth(scene, count) {
  const rnd = (() => { let s = 3; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  const pos = new Float32Array(count * 3), seed = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (rnd() * 2 - 1) * 60; pos[i * 3 + 1] = (rnd() * 2 - 1) * 34; pos[i * 3 + 2] = (rnd() * 2 - 1) * 60;
    seed[i] = rnd();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const motes = new THREE.Points(g, new THREE.ShaderMaterial({
    transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uProj: { value: 800 }, uFocus: { value: 30 }, uPR: { value: 1 }, uT: { value: 0 }, uO: { value: 1 } },
    vertexShader: `uniform float uProj, uFocus, uPR, uT; attribute float aSeed; varying float vA; varying float vC;
      void main(){ vec3 p = position + vec3(sin(uT*0.05+aSeed*40.0), cos(uT*0.04+aSeed*30.0), 0.0)*0.6;
        vec4 mv = modelViewMatrix*vec4(p,1.0); float d = max(-mv.z, 0.1);
        float coc = abs(d - uFocus) * 0.045; float s = 0.05 + aSeed*0.06;
        gl_PointSize = min((s + coc) * uProj / d, 140.0*uPR);
        vA = (0.10 + aSeed*0.12) * (s*s)/((s+coc)*(s+coc)) * smoothstep(0.5, 4.0, d);
        vC = clamp(coc/s*0.5,0.0,1.0);
        gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform float uO; varying float vA; varying float vC;
      void main(){ float d = length(gl_PointCoord-0.5)*2.0;
        float b = mix(exp(-d*d*6.0), smoothstep(1.0,0.85,d)*0.8, vC);
        gl_FragColor = vec4(vec3(0.95,0.92,0.86), b*vA*uO*2.2); }`,
  }));
  motes.frustumCulled = false;
  scene.add(motes);

  const sc = 3500, sp = new Float32Array(sc * 3);
  for (let i = 0; i < sc; i++) {
    const u = rnd() * 2 - 1, a = rnd() * Math.PI * 2, r = 170 + rnd() * 160, s = Math.sqrt(1 - u * u);
    sp[i * 3] = Math.cos(a) * s * r; sp[i * 3 + 1] = u * r; sp[i * 3 + 2] = Math.sin(a) * s * r;
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const stars = new THREE.Points(sg, new THREE.PointsMaterial({
    color: 0x9fa6b8, size: 1.2, sizeAttenuation: false, transparent: true, opacity: 0.35,
    depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  scene.add(stars);
  return { motes, stars };
}

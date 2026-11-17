import * as THREE from 'three';

// One continuous camera path for the whole film, keyed by timeline time (0..184).
// Catmull–Rom through the keys, so position and gaze change without a seam.

const K = [];
const key = (t, p, l) => K.push({ t, p: new THREE.Vector3(...p), l: new THREE.Vector3(...l) });

export function buildCameraPath({ vaultPos }) {
  K.length = 0;
  // S1–S3: the rain, the matrix, through it into the space
  key(0, [0, 2, 30], [0, 0.5, 0]);
  key(8, [0, 1, 40], [0, 0, 0]);
  key(17, [0, 0, 44], [0, 0, 0]);
  key(22, [1.5, 0.6, 12.5], [1.2, 0.3, 0]);
  key(26, [2, 1.5, 6], [0, 1, -10]);
  key(31, [9, 9, 28], [0, 1.5, 0]);
  // S4: a slow arc at a distance
  key(35, [20, 12, 30], [0, 1.5, 0]);
  key(40, [32, 13, 12], [0, 1.5, 0]);
  key(44, [30, 9, 20], [0, 2, 0]);
  // S5: along the veil, always on its near side
  key(49, [24, 8, 28], [0, 2, 0]);
  key(54, [15, 7, 33], [0, 2, 0]);
  key(58, [9, 8, 36], [0, 2, 0]);
  // S6: back, to hold the whole letter and the sealed sample
  key(62, [-6, 11, 38], [0, 2, 3]);
  key(68, [-22, 10, 32], [1, 1.5, 5]);
  // S7: the search, a wide orbit ending side-on to the disc
  key(72, [-30, 12, 8], [0, 2, 0]);
  key(78, [-22, 13, -22], [0, 2, 0]);
  key(84, [4, 11, -34], [0, 2.5, 0]);
  key(90, [22, 7, -24], [0, 2.6, 0]);
  // S8: the floor
  key(94, [24, 6, -22], [0, 2.5, 0]);
  key(98, [19, 6, -21], [0, 2.4, 0]);
  // S9: the held cut — the camera travels around it while time stands still
  {
    const a0 = Math.atan2(-21, 19);
    const steps = 9;
    for (let i = 1; i <= steps; i++) {
      const f = i / steps;
      const a = a0 - 3.3 * f;
      const r = 28 - 3 * Math.sin(f * Math.PI);
      key(101 + 30 * f, [Math.cos(a) * r, 6 + 6 * f, Math.sin(a) * r], [0, 2.4 + 0.3 * f, 0]);
    }
  }
  // S10: above the disc
  key(138, [-6, 24, 30], [0, 1, 0]);
  key(146, [0, 30, 38], [0, 0, 0]);
  // S11: low and to the side, so the ghost stands over the flat disc
  key(151, [-24, 9, 22], [0, 3, 0]);
  // S12: turn to the seal
  const v = vaultPos;
  key(156, [v.x + 14, v.y + 6, v.z + 16], [v.x * 0.5, v.y * 0.5 + 1, v.z * 0.5]);
  key(160, [v.x + 8, v.y + 3.5, v.z + 11], [v.x, v.y, v.z]);
  key(168, [v.x + 11, v.y + 7, v.z + 17], [v.x * 0.7, v.y * 0.7, v.z * 0.7]);
  // S13: the long pull back and up
  // the ring sits in the upper part of the frame, above the closing words
  key(176, [0, 45, 70], [0, -6, 0]);
  key(184, [0, 110, 170], [0, -22, 0]);
}

function cr(p0, p1, p2, p3, t, out) {
  const t2 = t * t, t3 = t2 * t;
  return out.set(0, 0, 0)
    .addScaledVector(p0, -0.5 * t3 + t2 - 0.5 * t)
    .addScaledVector(p1, 1.5 * t3 - 2.5 * t2 + 1)
    .addScaledVector(p2, -1.5 * t3 + 2 * t2 + 0.5 * t)
    .addScaledVector(p3, 0.5 * t3 - 0.5 * t2);
}

export function cameraAt(t, outPos, outLook) {
  const end = K[K.length - 1].t;
  t = Math.min(Math.max(t, 0), end);
  let i = 0;
  while (i < K.length - 2 && K[i + 1].t < t) i++;
  const a = K[Math.max(i - 1, 0)], b = K[i], c = K[i + 1], d = K[Math.min(i + 2, K.length - 1)];
  const u = (t - b.t) / Math.max(c.t - b.t, 1e-6);
  cr(a.p, b.p, c.p, d.p, u, outPos);
  cr(a.l, b.l, c.l, d.l, u, outLook);
}

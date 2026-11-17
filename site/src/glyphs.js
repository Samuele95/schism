import * as THREE from 'three';

// The construct's glyph set: the method's own material — digits and number punctuation,
// matrix brackets and operators, the Greek letters the method writes with, and token fragments.
// Indices 0..11 are the "numeric" set used when the glyphs settle into a weight matrix.
export const GLYPHS = [
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '−',
  '[', ']', '(', ')', '+', '=', '<', '>', '/', '|', '*', ':', 'ᵀ',
  'σ', 'χ', 'Δ', 'λ', 'μ', 'θ', 'Σ', 'ρ', 'v', 'W', 'x',
  'th', 'in', 'er', 'an', '##', '▁a',
];
export const NUMERIC_COUNT = 12;
export const ATLAS_GRID = 8; // 8 x 8 cells

export async function buildGlyphAtlas() {
  const font = '"JetBrains Mono"';
  try {
    await Promise.all([
      document.fonts.load(`400 40px ${font}`, '0123456789[]σχΔλμθΣρ'),
    ]);
  } catch (_) { /* fall back to the system mono; the atlas still works */ }

  const cell = 64;
  const size = cell * ATLAS_GRID;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  GLYPHS.forEach((g, i) => {
    const cx = (i % ATLAS_GRID) * cell + cell / 2;
    const cy = Math.floor(i / ATLAS_GRID) * cell + cell / 2;
    const px = g.length > 1 ? 30 : 44;
    ctx.font = `400 ${px}px ${font}, ui-monospace, monospace`;
    ctx.fillText(g, cx, cy + 2);
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.flipY = false;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

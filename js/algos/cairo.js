// Cairo Pentagons: the Cairo pentagonal tiling — the dual of the snub square
// tiling, paving the plane with congruent pentagons in four orientations.
// Two-toned by orientation it reads as woven basketwork; the streets of
// Cairo are literally paved with it.
//
// Exact construction: the 90°/120° pentagon with four equal edges and one
// short edge (√3−1), stamped in four 90° rotations around each point of a
// square lattice of pitch √6, rotated 15°.

import { samplePalette, mixHex } from '../core/util.js';

const SQ3 = Math.sqrt(3);
// base pentagon, edge 1, its right-angle corner at the origin
const PENTA = [
  [0, 0],
  [1, 0],
  [(1 + SQ3) / 2, (3 - SQ3) / 2],
  [SQ3 / 2, 3 / 2],
  [0, 1],
];
// orthogonal lattice basis, |u| = |w| = √6
const U = [(3 + SQ3) / 2, (3 - SQ3) / 2];
const W = [-(3 - SQ3) / 2, (3 + SQ3) / 2];

export default {
  id: 'cairo',
  name: 'Cairo Pentagons',
  category: 'Geometric',
  description: 'The Cairo pentagonal tiling — congruent pentagons in four orientations, woven like basketwork.',
  params: [
    { key: 'size', label: 'Scale', type: 'range', min: 10, max: 80, step: 2, value: 34 },
    { key: 'lineWidth', label: 'Line width', type: 'range', min: 0.5, max: 8, step: 0.5, value: 2 },
    { key: 'contrast', label: 'Fill contrast', type: 'range', min: 0, max: 1, step: 0.05, value: 0.55 },
    {
      key: 'colorMode', label: 'Color by', type: 'select', value: 'weave',
      options: [
        { value: 'weave', label: 'two-tone weave' },
        { value: 'four', label: 'four orientations' },
        { value: 'gradient', label: 'gradient' },
        { value: 'random', label: 'random' },
        { value: 'ink', label: 'line only' },
      ],
    },
  ],

  create({ ctx, width, height, rng, palette, params }) {
    const P = params;
    const s = P.size;
    const ink = samplePalette(palette.colors, 0.12);
    const D = Math.hypot(width, height);

    function fillFor(k, a, b) {
      if (P.colorMode === 'ink') return null;
      let t;
      if (P.colorMode === 'weave') t = k % 2 === 0 ? 0.3 : 0.8;
      else if (P.colorMode === 'four') t = 0.15 + (k / 4) * 0.8;
      else if (P.colorMode === 'random') t = rng.random();
      else t = (((a + b) % 9) + 9) % 9 / 9;
      return mixHex(samplePalette(palette.colors, t), palette.bg, 1 - P.contrast);
    }

    // rotate a base vertex k quarter-turns
    const vert = ([x, y], k) => {
      for (let i = 0; i < k; i++) {
        const t = x;
        x = -y;
        y = t;
      }
      return [x, y];
    };

    let drawn = false;
    return {
      frame() {
        if (drawn) return false;
        drawn = true;
        ctx.fillStyle = palette.bg;
        ctx.fillRect(0, 0, width, height);
        ctx.lineJoin = 'round';
        ctx.strokeStyle = ink;
        ctx.lineWidth = P.lineWidth;

        // lattice ranges: project the (padded) canvas corners onto u, w
        const corners = [[-2 * s, -2 * s], [D + 2 * s, -2 * s], [-2 * s, D + 2 * s], [D + 2 * s, D + 2 * s]];
        let a0 = Infinity;
        let a1 = -Infinity;
        let b0 = Infinity;
        let b1 = -Infinity;
        for (const [x, y] of corners) {
          const a = (x * U[0] + y * U[1]) / (6 * s);
          const b = (x * W[0] + y * W[1]) / (6 * s);
          a0 = Math.min(a0, a); a1 = Math.max(a1, a);
          b0 = Math.min(b0, b); b1 = Math.max(b1, b);
        }
        ctx.save();
        ctx.translate((width - D) / 2, (height - D) / 2);
        for (let a = Math.floor(a0) - 1; a <= Math.ceil(a1) + 1; a++) {
          for (let b = Math.floor(b0) - 1; b <= Math.ceil(b1) + 1; b++) {
            const cx = (a * U[0] + b * W[0]) * s;
            const cy = (a * U[1] + b * W[1]) * s;
            for (let k = 0; k < 4; k++) {
              ctx.beginPath();
              PENTA.forEach((v, idx) => {
                const [x, y] = vert(v, k);
                if (idx === 0) ctx.moveTo(cx + x * s, cy + y * s);
                else ctx.lineTo(cx + x * s, cy + y * s);
              });
              ctx.closePath();
              const fill = fillFor(k, a, b);
              if (fill) {
                ctx.fillStyle = fill;
                ctx.fill();
              }
              ctx.stroke();
            }
          }
        }
        ctx.restore();
        return false;
      },
    };
  },
};

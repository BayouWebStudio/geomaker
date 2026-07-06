// Flower of Life: the overlapping-circle lattice of temple walls — every
// circle passing through its neighbours' centers so the plane fills with
// vesica petals. Drawn as the classic bounded flower (19 circles inside a
// double ring), the seed (7), or an endless field. The pattern the whole
// Vesica family is named for.

import { TAU, samplePalette, withAlpha } from '../core/util.js';

export default {
  id: 'flowerlife',
  name: 'Flower of Life',
  category: 'Geometric',
  description: 'The overlapping-circle lattice — seed, flower, or an endless field of vesica petals.',
  params: [
    {
      key: 'figure', label: 'Figure', type: 'select', value: 'field',
      options: [
        { value: 'field', label: 'endless field' },
        { value: 'flower', label: 'flower (19 circles)' },
        { value: 'seed', label: 'seed (7 circles)' },
      ],
    },
    { key: 'size', label: 'Circle size', type: 'range', min: 18, max: 130, step: 2, value: 56 },
    { key: 'lineWidth', label: 'Line width', type: 'range', min: 0.5, max: 7, step: 0.5, value: 1.6 },
    { key: 'glow', label: 'Petal glow (layered fills)', type: 'checkbox', value: true },
    {
      key: 'colorMode', label: 'Ink', type: 'select', value: 'rings',
      options: [
        { value: 'rings', label: 'gradient from center' },
        { value: 'mono', label: 'single ink' },
      ],
    },
  ],

  create({ ctx, width, height, palette, params }) {
    const P = params;
    const cx = width / 2;
    const cy = height / 2;

    // draw one circle with tone t (0 center → 1 edge)
    function circle(x, y, r, t) {
      const tone = P.colorMode === 'mono' ? 0.7 : Math.min(1, t);
      if (P.glow) {
        ctx.fillStyle = withAlpha(samplePalette(palette.colors, tone), 0.055);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, TAU);
        ctx.fill();
      }
      ctx.strokeStyle = samplePalette(palette.colors, tone);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.stroke();
    }

    // triangular lattice around the origin: rows r·√3/2 apart, odd rows
    // shifted half a step — every point exactly r from its six neighbours
    function* lattice(r, spanX, spanY) {
      const rowH = (r * Math.sqrt(3)) / 2;
      const rows = Math.ceil(spanY / rowH) + 2;
      const cols = Math.ceil(spanX / r) + 2;
      for (let j = -rows; j <= rows; j++) {
        const off = ((j % 2) + 2) % 2 === 0 ? 0 : r / 2;
        for (let i = -cols; i <= cols; i++) {
          yield [i * r + off, j * rowH];
        }
      }
    }

    let drawn = false;
    return {
      frame() {
        if (drawn) return false;
        drawn = true;
        ctx.fillStyle = palette.bg;
        ctx.fillRect(0, 0, width, height);
        ctx.lineWidth = P.lineWidth;
        const r = P.size;

        if (P.figure === 'field') {
          const maxDist = Math.hypot(width, height) / 2;
          for (const [x, y] of lattice(r, width / 2 + r, height / 2 + r)) {
            circle(cx + x, cy + y, r, Math.hypot(x, y) / maxDist);
          }
          return false;
        }

        // bounded figures: lattice circles clipped inside the boundary disc
        const bound = P.figure === 'seed' ? 2 * r : 3 * r;
        const R = Math.min(width, height) * 0.44;
        const scale = R / bound;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);
        ctx.lineWidth = P.lineWidth / scale;
        ctx.beginPath();
        ctx.arc(0, 0, bound, 0, TAU);
        ctx.clip();
        for (const [x, y] of lattice(r, bound + r, bound + r)) {
          const d = Math.hypot(x, y);
          if (P.figure === 'seed' && d > r * 1.01) continue;
          if (d > bound + r * 0.99) continue;
          circle(x, y, r, d / bound);
        }
        ctx.restore();
        // the double boundary ring
        ctx.strokeStyle = samplePalette(palette.colors, P.colorMode === 'mono' ? 0.7 : 0.95);
        ctx.lineWidth = P.lineWidth;
        for (const rr of [R, R + P.lineWidth * 2.4]) {
          ctx.beginPath();
          ctx.arc(cx, cy, rr, 0, TAU);
          ctx.stroke();
        }
        return false;
      },
    };
  },
};

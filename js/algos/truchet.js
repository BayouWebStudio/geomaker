// Truchet: a grid of tiles, each randomly oriented, so simple per-tile motifs
// (quarter-arcs, diagonals, two-tone triangles) knit into flowing labyrinths.
// An optional multi-scale pass subdivides some tiles for varied density.

import { TAU, samplePalette } from '../core/util.js';

export default {
  id: 'truchet',
  name: 'Truchet',
  category: 'Geometric',
  description: 'Randomly rotated tiles that connect into woven curves, mazes and op-art.',
  params: [
    {
      key: 'style', label: 'Tile style', type: 'select', value: 'arcs',
      options: [
        { value: 'arcs', label: 'quarter-arcs (weave)' },
        { value: 'diagonal', label: 'diagonals (maze)' },
        { value: 'triangles', label: 'triangles (op-art)' },
      ],
    },
    { key: 'size', label: 'Tile size', type: 'range', min: 14, max: 120, step: 2, value: 46 },
    { key: 'lineWidth', label: 'Line width', type: 'range', min: 1, max: 18, step: 0.5, value: 5 },
    { key: 'multiscale', label: 'Multi-scale subdivide', type: 'checkbox', value: false },
    { key: 'subChance', label: 'Subdivide chance', type: 'range', min: 0, max: 1, step: 0.05, value: 0.35 },
    {
      key: 'colorMode', label: 'Color by', type: 'select', value: 'gradient',
      options: [
        { value: 'gradient', label: 'gradient' },
        { value: 'random', label: 'random' },
        { value: 'single', label: 'single ink' },
      ],
    },
  ],

  create({ ctx, width, height, rng, palette, params }) {
    const P = params;
    const cx = width / 2;
    const cy = height / 2;
    const maxR = Math.hypot(cx, cy) || 1;

    function colorAt(x, y) {
      if (P.colorMode === 'single') return samplePalette(palette.colors, 0.6);
      if (P.colorMode === 'random') return samplePalette(palette.colors, rng.random());
      return samplePalette(palette.colors, Math.hypot(x - cx, y - cy) / maxR);
    }

    function tile(x, y, s) {
      const col = colorAt(x + s / 2, y + s / 2);
      if (P.style === 'arcs') {
        ctx.strokeStyle = col;
        ctx.lineWidth = P.lineWidth;
        ctx.lineCap = 'round';
        ctx.beginPath();
        if (rng.random() < 0.5) {
          ctx.arc(x, y, s / 2, 0, Math.PI / 2);
          ctx.arc(x + s, y + s, s / 2, Math.PI, Math.PI * 1.5);
        } else {
          ctx.arc(x + s, y, s / 2, Math.PI / 2, Math.PI);
          ctx.arc(x, y + s, s / 2, Math.PI * 1.5, TAU);
        }
        ctx.stroke();
      } else if (P.style === 'diagonal') {
        ctx.strokeStyle = col;
        ctx.lineWidth = P.lineWidth;
        ctx.lineCap = 'round';
        ctx.beginPath();
        if (rng.random() < 0.5) {
          ctx.moveTo(x, y);
          ctx.lineTo(x + s, y + s);
        } else {
          ctx.moveTo(x + s, y);
          ctx.lineTo(x, y + s);
        }
        ctx.stroke();
      } else {
        // one of four half-tile triangles, filled — reads as woven op-art
        const tri = [
          [[x, y], [x + s, y], [x, y + s]],
          [[x + s, y], [x + s, y + s], [x, y]],
          [[x + s, y + s], [x, y + s], [x + s, y]],
          [[x, y + s], [x, y], [x + s, y + s]],
        ][rng.int(0, 3)];
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(tri[0][0], tri[0][1]);
        ctx.lineTo(tri[1][0], tri[1][1]);
        ctx.lineTo(tri[2][0], tri[2][1]);
        ctx.closePath();
        ctx.fill();
      }
    }

    function place(x, y, s) {
      if (P.multiscale && s > 18 && rng.random() < P.subChance) {
        const h = s / 2;
        place(x, y, h);
        place(x + h, y, h);
        place(x, y + h, h);
        place(x + h, y + h, h);
      } else {
        tile(x, y, s);
      }
    }

    let drawn = false;
    return {
      frame() {
        if (drawn) return false;
        drawn = true;
        ctx.fillStyle = palette.bg;
        ctx.fillRect(0, 0, width, height);
        const s = P.size;
        for (let y = 0; y < height; y += s) {
          for (let x = 0; x < width; x += s) place(x, y, s);
        }
        return false;
      },
    };
  },
};

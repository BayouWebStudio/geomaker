// Circuit Board: PCB-style traces — grid-snapped runs with 45° corners that
// never cross, ending in pads and vias. Reads as tech wallpaper on dark
// palettes and blueprint linework on light ones.

import { TAU, samplePalette } from '../core/util.js';

// 8 grid directions (45° steps)
const DIRS = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];

export default {
  id: 'circuit',
  name: 'Circuit Board',
  category: 'Geometric',
  description: 'PCB traces with 45° bends, pads and vias — non-crossing runs routed over a grid.',
  params: [
    { key: 'cell', label: 'Grid size', type: 'range', min: 8, max: 40, step: 1, value: 16 },
    { key: 'density', label: 'Trace density', type: 'range', min: 0.1, max: 1, step: 0.05, value: 0.55 },
    { key: 'length', label: 'Run length', type: 'range', min: 4, max: 40, step: 1, value: 16 },
    { key: 'bend', label: 'Bend chance', type: 'range', min: 0, max: 1, step: 0.05, value: 0.35 },
    { key: 'lineWidth', label: 'Trace width', type: 'range', min: 0.8, max: 8, step: 0.2, value: 2.2 },
    { key: 'padSize', label: 'Pad size', type: 'range', min: 0.8, max: 3, step: 0.1, value: 1.6 },
    {
      key: 'colorMode', label: 'Color by', type: 'select', value: 'nets',
      options: [
        { value: 'nets', label: 'random per net' },
        { value: 'gradient', label: 'gradient' },
        { value: 'single', label: 'single ink' },
      ],
    },
  ],

  create({ ctx, width, height, rng, palette, params }) {
    const P = params;
    const cols = Math.ceil(width / P.cell) + 1;
    const rows = Math.ceil(height / P.cell) + 1;
    const used = new Uint8Array(cols * rows);
    const at = (c, r) => r * cols + c;
    const inGrid = (c, r) => c >= 0 && c < cols && r >= 0 && r < rows;

    function traceColor(i, total, y) {
      if (P.colorMode === 'single') return samplePalette(palette.colors, 0.4);
      if (P.colorMode === 'gradient') return samplePalette(palette.colors, y / rows);
      return samplePalette(palette.colors, rng.random());
    }

    function pad(x, y, color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, P.lineWidth * P.padSize, 0, TAU);
      ctx.fill();
      ctx.fillStyle = palette.bg;
      ctx.beginPath();
      ctx.arc(x, y, P.lineWidth * P.padSize * 0.42, 0, TAU);
      ctx.fill();
    }

    let drawn = false;
    return {
      frame() {
        if (drawn) return false;
        drawn = true;
        ctx.fillStyle = palette.bg;
        ctx.fillRect(0, 0, width, height);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const traces = Math.round(cols * rows * 0.06 * P.density);
        for (let n = 0; n < traces; n++) {
          let c = rng.int(0, cols - 1);
          let r = rng.int(0, rows - 1);
          if (used[at(c, r)]) continue;
          let dir = rng.int(0, 7);
          const pts = [[c, r]];
          used[at(c, r)] = 1;
          const len = Math.round(P.length * (0.4 + rng.random() * 1.2));
          for (let s = 0; s < len; s++) {
            if (rng.random() < P.bend) dir = (dir + (rng.random() < 0.5 ? 1 : 7)) % 8;
            // try the current direction, then its 45° neighbours
            let moved = false;
            for (const dd of [0, 1, 7, 2, 6]) {
              const d = (dir + dd) % 8;
              const nc = c + DIRS[d][0];
              const nr = r + DIRS[d][1];
              if (inGrid(nc, nr) && !used[at(nc, nr)]) {
                dir = d;
                c = nc;
                r = nr;
                used[at(c, r)] = 1;
                pts.push([c, r]);
                moved = true;
                break;
              }
            }
            if (!moved) break;
          }
          if (pts.length < 3) continue;
          const color = traceColor(n, traces, pts[0][1]);
          ctx.strokeStyle = color;
          ctx.lineWidth = P.lineWidth;
          ctx.beginPath();
          pts.forEach(([pc, pr], i) => {
            const x = pc * P.cell;
            const y = pr * P.cell;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          });
          ctx.stroke();
          // pad at the start, via at the end
          pad(pts[0][0] * P.cell, pts[0][1] * P.cell, color);
          pad(pts[pts.length - 1][0] * P.cell, pts[pts.length - 1][1] * P.cell, color);
        }
        return false;
      },
    };
  },
};

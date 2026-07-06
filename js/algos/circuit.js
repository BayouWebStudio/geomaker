// Circuit Board: PCB-style traces — grid-snapped runs with 45° corners that
// never cross, ending in pads and vias. Interactive: drag to route your own
// trace, snapped to the grid with 45° bends, ending in a pad when you lift.

import { TAU, samplePalette } from '../core/util.js';

// 8 grid directions (45° steps)
const DIRS = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];

export default {
  id: 'circuit',
  name: 'Circuit Board',
  category: 'Geometric',
  interactive: true,
  symmetry: true,
  hint: 'drag to route your own trace — 45° bends snap under your finger',
  description: 'PCB traces with 45° bends, pads and vias — drag on the board to route your own line.',
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

    function traceColor(r) {
      if (P.colorMode === 'single') return samplePalette(palette.colors, 0.4);
      if (P.colorMode === 'gradient') return samplePalette(palette.colors, r / rows);
      return samplePalette(palette.colors, rng.random());
    }

    // ---- generate the seeded board, stored so we can redraw any time ----
    const traces = []; // { pts: [[c, r], ...], color }
    const budget = Math.round(cols * rows * 0.06 * P.density);
    for (let n = 0; n < budget; n++) {
      let c = rng.int(0, cols - 1);
      let r = rng.int(0, rows - 1);
      if (used[at(c, r)]) continue;
      let dir = rng.int(0, 7);
      const pts = [[c, r]];
      used[at(c, r)] = 1;
      const len = Math.round(P.length * (0.4 + rng.random() * 1.2));
      for (let s = 0; s < len; s++) {
        if (rng.random() < P.bend) dir = (dir + (rng.random() < 0.5 ? 1 : 7)) % 8;
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
      if (pts.length >= 3) traces.push({ pts, color: traceColor(pts[0][1]) });
    }

    function drawTrace(t) {
      ctx.strokeStyle = t.color;
      ctx.lineWidth = P.lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      t.pts.forEach(([pc, pr], i) => {
        const x = pc * P.cell;
        const y = pr * P.cell;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
      pad(t.pts[0][0] * P.cell, t.pts[0][1] * P.cell, t.color);
      pad(t.pts[t.pts.length - 1][0] * P.cell, t.pts[t.pts.length - 1][1] * P.cell, t.color);
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

    function draw() {
      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, width, height);
      for (const t of traces) drawTrace(t);
      for (const t of routing.values()) if (t.pts.length > 1) drawTrace(t);
    }

    // ---- finger routing: greedy 45°-snapped steps toward the pointer ----
    const routing = new Map(); // per mirror index: in-progress trace
    let dirty = true;

    function cellOf(x, y) {
      return [
        Math.max(0, Math.min(cols - 1, Math.round(x / P.cell))),
        Math.max(0, Math.min(rows - 1, Math.round(y / P.cell))),
      ];
    }

    function extend(t, tc, tr) {
      let [c, r] = t.pts[t.pts.length - 1];
      let guard = 0;
      while ((c !== tc || r !== tr) && guard++ < 80) {
        const dc = Math.sign(tc - c);
        const dr = Math.sign(tr - r);
        const nc = c + dc;
        const nr = r + dr;
        if (!inGrid(nc, nr)) break;
        if (used[at(nc, nr)]) break; // never cross another net
        c = nc;
        r = nr;
        used[at(c, r)] = 1;
        t.pts.push([c, r]);
        if (t.pts.length > 400) break;
      }
    }

    return {
      frame() {
        if (dirty) {
          draw();
          dirty = false;
        }
        return true; // stay live for routing
      },
      onDown(x, y, k = 0) {
        const [c, r] = cellOf(x, y);
        if (used[at(c, r)]) return; // start on free copper only
        used[at(c, r)] = 1;
        routing.set(k, { pts: [[c, r]], color: traceColor(r) });
        dirty = true;
      },
      onMove(x, y, dx, dy, k = 0) {
        const t = routing.get(k);
        if (!t) return;
        const [tc, tr] = cellOf(x, y);
        extend(t, tc, tr);
        dirty = true;
      },
      onUp(x, y, dist, k = 0) {
        const t = routing.get(k);
        if (t) {
          if (t.pts.length > 1) traces.push(t);
          routing.delete(k);
          dirty = true;
        }
      },
    };
  },
};

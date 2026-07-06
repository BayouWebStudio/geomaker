// Maze & Path: single-line space-filling graphics — a perfect maze carved by
// recursive backtracking, the Hilbert space-filling curve, and a wobbling
// spiral — one continuous stroke with controllable thickness. Drag the canvas
// to bend the whole path through a magnifying lens that follows your finger.

import { TAU, samplePalette } from '../core/util.js';

export default {
  id: 'maze',
  name: 'Maze & Path',
  category: 'Geometric',
  interactive: true,
  hint: 'drag to bend the path with a lens',
  description: 'One continuous line fills the plane: a perfect maze, the Hilbert curve, or a hand-drawn spiral — drag to warp it.',
  params: [
    {
      key: 'style', label: 'Path', type: 'select', value: 'maze',
      options: [
        { value: 'maze', label: 'perfect maze' },
        { value: 'hilbert', label: 'Hilbert curve' },
        { value: 'spiral', label: 'spiral' },
      ],
    },
    { key: 'cell', label: 'Cell size', type: 'range', min: 8, max: 60, step: 1, value: 20 },
    { key: 'duty', label: 'Line thickness', type: 'range', min: 0.15, max: 0.85, step: 0.05, value: 0.5 },
    { key: 'lens', label: 'Lens strength', type: 'range', min: 0, max: 1, step: 0.05, value: 0.55 },
    { key: 'wobble', label: 'Hand wobble', type: 'range', min: 0, max: 1, step: 0.05, value: 0 },
    { key: 'rounded', label: 'Rounded corners', type: 'checkbox', value: true },
    {
      key: 'colorMode', label: 'Color by', type: 'select', value: 'path',
      options: [
        { value: 'path', label: 'gradient along path' },
        { value: 'single', label: 'single ink' },
      ],
    },
  ],

  create({ ctx, width, height, rng, noise, palette, params }) {
    const P = params;

    // the drag lens: a local bulge centred on the pointer
    let lensX = null;
    let lensY = null;
    const lensR = Math.min(width, height) * 0.38;
    function warp([x, y]) {
      if (lensX === null || P.lens === 0) return [x, y];
      const dx = x - lensX;
      const dy = y - lensY;
      const r2 = (dx * dx + dy * dy) / (lensR * lensR);
      const k = 1 + P.lens * 0.85 * Math.exp(-r2);
      return [lensX + dx * k, lensY + dy * k];
    }

    function wob(x, y, k) {
      if (!P.wobble) return [x, y];
      return [
        x + noise.noise3(x * 0.02, y * 0.02, k) * P.cell * P.wobble * 0.4,
        y + noise.noise3(y * 0.02, x * 0.02, k + 7) * P.cell * P.wobble * 0.4,
      ];
    }

    function mazePath() {
      const cols = Math.max(3, Math.floor(width / P.cell));
      const rows = Math.max(3, Math.floor(height / P.cell));
      const ox = (width - cols * P.cell) / 2 + P.cell / 2;
      const oy = (height - rows * P.cell) / 2 + P.cell / 2;
      const seen = new Uint8Array(cols * rows);
      const at = (c, r) => r * cols + c;
      const stack = [[rng.int(0, cols - 1), rng.int(0, rows - 1)]];
      seen[at(stack[0][0], stack[0][1])] = 1;
      const points = [wob(ox + stack[0][0] * P.cell, oy + stack[0][1] * P.cell, 1)];
      while (stack.length) {
        const [c, r] = stack[stack.length - 1];
        const options = [];
        if (c > 0 && !seen[at(c - 1, r)]) options.push([c - 1, r]);
        if (c < cols - 1 && !seen[at(c + 1, r)]) options.push([c + 1, r]);
        if (r > 0 && !seen[at(c, r - 1)]) options.push([c, r - 1]);
        if (r < rows - 1 && !seen[at(c, r + 1)]) options.push([c, r + 1]);
        if (!options.length) {
          stack.pop();
          if (stack.length) {
            const [bc, br] = stack[stack.length - 1];
            points.push(wob(ox + bc * P.cell, oy + br * P.cell, 1)); // retrace on backtrack
          }
          continue;
        }
        const [nc, nr] = options[rng.int(0, options.length - 1)];
        seen[at(nc, nr)] = 1;
        stack.push([nc, nr]);
        points.push(wob(ox + nc * P.cell, oy + nr * P.cell, 1));
      }
      return points;
    }

    function hilbertPath() {
      const size = Math.min(width, height);
      let order = Math.round(Math.log2(size / P.cell));
      order = Math.max(2, Math.min(7, order));
      const n = 1 << order;
      const step = size / n;
      const ox = (width - size) / 2 + step / 2;
      const oy = (height - size) / 2 + step / 2;
      const points = [];
      for (let d = 0; d < n * n; d++) {
        // standard d -> (x, y) Hilbert transform
        let rx, ry, t = d, x = 0, y = 0;
        for (let s = 1; s < n; s *= 2) {
          rx = 1 & (t / 2);
          ry = 1 & (t ^ rx);
          if (ry === 0) {
            if (rx === 1) {
              x = s - 1 - x;
              y = s - 1 - y;
            }
            [x, y] = [y, x];
          }
          x += s * rx;
          y += s * ry;
          t = Math.floor(t / 4);
        }
        points.push(wob(ox + x * step, oy + y * step, 2));
      }
      return points;
    }

    function spiralPath() {
      const maxR = Math.hypot(width, height) / 2;
      const gap = P.cell;
      const points = [];
      const turns = maxR / gap;
      const steps = Math.ceil(turns * 70);
      for (let i = 0; i <= steps; i++) {
        const a = (i / 70) * TAU;
        const r = (a / TAU) * gap;
        points.push(wob(width / 2 + Math.cos(a) * r, height / 2 + Math.sin(a) * r, 3));
        if (r > maxR) break;
      }
      return points;
    }

    // the path is generated once (seeded); dragging only re-projects it
    const basePoints = P.style === 'maze' ? mazePath() : P.style === 'hilbert' ? hilbertPath() : spiralPath();

    function draw() {
      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, width, height);
      ctx.lineWidth = P.cell * P.duty;
      ctx.lineCap = P.rounded ? 'round' : 'square';
      ctx.lineJoin = P.rounded ? 'round' : 'miter';
      const runLen = Math.max(6, Math.floor(basePoints.length / 110));
      for (let s = 0; s < basePoints.length - 1; s += runLen) {
        const end = Math.min(basePoints.length - 1, s + runLen);
        ctx.strokeStyle = P.colorMode === 'single'
          ? samplePalette(palette.colors, 0.35)
          : samplePalette(palette.colors, s / basePoints.length);
        ctx.beginPath();
        for (let i = s; i <= end; i++) {
          const [x, y] = warp(basePoints[i]);
          i === s ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }

    let dirty = true;
    return {
      frame() {
        if (dirty) {
          draw();
          dirty = false;
        }
        return true; // stay live for the lens drag
      },
      onDown(x, y) {
        lensX = x;
        lensY = y;
        dirty = true;
      },
      onMove(x, y) {
        lensX = x;
        lensY = y;
        dirty = true;
      },
    };
  },
};

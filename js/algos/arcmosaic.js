// Arc Mosaic: the Bauhaus tile game — filled half-discs, quarter fans,
// leaves and shell rings on a grid, each cell randomly oriented. Tap any
// tile to rotate it a quarter turn: the classic composition toy.

import { TAU, samplePalette } from '../core/util.js';

export default {
  id: 'arcmosaic',
  name: 'Arc Mosaic',
  category: 'Geometric',
  interactive: true,
  symmetry: true,
  hint: 'tap a tile to rotate it · drag to spin a path of tiles',
  description: 'Bauhaus tile mosaics — half-discs, quarter fans, leaves and shells, each cell rotatable by touch.',
  params: [
    {
      key: 'style', label: 'Tile', type: 'select', value: 'halves',
      options: [
        { value: 'halves', label: 'half discs (Bauhaus)' },
        { value: 'quarters', label: 'quarter fans' },
        { value: 'leaves', label: 'leaves' },
        { value: 'shells', label: 'shell rings' },
      ],
    },
    { key: 'cell', label: 'Tile size', type: 'range', min: 24, max: 140, step: 2, value: 64 },
    { key: 'rings', label: 'Rings (shells)', type: 'range', min: 2, max: 6, step: 1, value: 3 },
    { key: 'gap', label: 'Tile gap', type: 'range', min: 0, max: 10, step: 0.5, value: 0 },
    {
      key: 'colorMode', label: 'Color by', type: 'select', value: 'checker',
      options: [
        { value: 'checker', label: 'checker two-tone' },
        { value: 'random', label: 'random' },
        { value: 'gradient', label: 'gradient' },
      ],
    },
  ],

  create({ ctx, width, height, rng, palette, params }) {
    const P = params;
    const s = P.cell;
    const cols = Math.ceil(width / s) + 1;
    const rows = Math.ceil(height / s) + 1;
    const D = Math.hypot(width, height);

    // per-cell rotation (0-3) and tone, stored so taps can spin tiles
    const rot = new Uint8Array(cols * rows);
    const tone = new Float32Array(cols * rows);
    for (let i = 0; i < rot.length; i++) {
      rot[i] = rng.int(0, 3);
      tone[i] = rng.random();
    }
    const at = (c, r) => r * cols + c;

    function cellColors(c, r) {
      const i = at(c, r);
      let tA;
      if (P.colorMode === 'random') tA = tone[i];
      else if (P.colorMode === 'gradient') tA = ((c + r) * s) / D;
      else tA = (c + r) % 2 === 0 ? 0.15 : 0.85;
      const tB = P.colorMode === 'checker' ? ((c + r) % 2 === 0 ? 0.85 : 0.15) : Math.min(1, tA + 0.45);
      return [samplePalette(palette.colors, tA), samplePalette(palette.colors, tB)];
    }

    function drawTile(c, r) {
      const i = at(c, r);
      const g = P.gap / 2;
      const x = c * s + g;
      const y = r * s + g;
      const w = s - P.gap;
      const [colA, colB] = cellColors(c, r);
      ctx.save();
      ctx.translate(x + w / 2, y + w / 2);
      ctx.rotate((rot[i] * Math.PI) / 2);
      ctx.translate(-w / 2, -w / 2);
      ctx.fillStyle = colA;
      ctx.fillRect(0, 0, w, w);
      ctx.fillStyle = colB;
      if (P.style === 'halves') {
        ctx.beginPath();
        ctx.arc(w / 2, 0, w / 2, 0, Math.PI);
        ctx.fill();
      } else if (P.style === 'quarters') {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, w, 0, Math.PI / 2);
        ctx.closePath();
        ctx.fill();
      } else if (P.style === 'leaves') {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, w, 0, Math.PI / 2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = colA;
        ctx.beginPath();
        ctx.moveTo(w, w);
        ctx.arc(w, w, w / 2, Math.PI, Math.PI * 1.5);
        ctx.closePath();
        ctx.fill();
      } else {
        // shells: concentric quarter rings fanning from a corner
        const n = Math.round(P.rings);
        for (let k = n; k >= 1; k--) {
          ctx.fillStyle = k % 2 === 0 ? colA : colB;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, (w * k) / n, 0, Math.PI / 2);
          ctx.closePath();
          ctx.fill();
        }
      }
      ctx.restore();
    }

    function draw() {
      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, width, height);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) drawTile(c, r);
      }
    }

    let dirty = true;
    const lastCell = new Map();

    function spin(x, y, k) {
      const c = Math.max(0, Math.min(cols - 1, Math.floor(x / s)));
      const r = Math.max(0, Math.min(rows - 1, Math.floor(y / s)));
      const key = c + ',' + r;
      if (lastCell.get(k) === key) return;
      lastCell.set(k, key);
      rot[at(c, r)] = (rot[at(c, r)] + 1) % 4;
      dirty = true;
    }

    return {
      frame() {
        if (dirty) {
          draw();
          dirty = false;
        }
        return true; // stay live for tile spinning
      },
      onDown(x, y, k = 0) {
        lastCell.delete(k);
        spin(x, y, k);
      },
      onMove(x, y, dx, dy, k = 0) {
        spin(x, y, k);
      },
      onUp(x, y, dist, k = 0) {
        lastCell.delete(k);
      },
    };
  },
};

// Hex Wallpaper: a hexagonal tiling with selectable per-cell motifs — solid
// honeycomb, nested concentric hexagons, an overlapping circle lattice, or a
// little six-petal rosette in every cell.

import { TAU, samplePalette, mixHex, hexToRgb } from '../core/util.js';

function hexPath(ctx, x, y, size, flat) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i + (flat ? 0 : Math.PI / 6);
    const px = x + size * Math.cos(a);
    const py = y + size * Math.sin(a);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

export default {
  id: 'hexweave',
  name: 'Hex Wallpaper',
  category: 'Geometric',
  description: 'Hexagonal tiling — honeycomb, nested hexes, circle lattice or rosettes.',
  params: [
    {
      key: 'style', label: 'Tile motif', type: 'select', value: 'nested',
      options: [
        { value: 'solid', label: 'solid honeycomb' },
        { value: 'nested', label: 'nested hexagons' },
        { value: 'cubes', label: 'isometric cubes' },
        { value: 'rosette', label: 'hex + rosette' },
      ],
    },
    { key: 'size', label: 'Hex size', type: 'range', min: 18, max: 140, step: 2, value: 54 },
    { key: 'orient', label: 'Flat-top hexes', type: 'checkbox', value: true },
    { key: 'rings', label: 'Nested count', type: 'range', min: 1, max: 8, step: 1, value: 4 },
    { key: 'inset', label: 'Gap / inset', type: 'range', min: 0, max: 0.4, step: 0.01, value: 0.06 },
    { key: 'lineWidth', label: 'Line width', type: 'range', min: 0.3, max: 6, step: 0.1, value: 1.4 },
    { key: 'fill', label: 'Fill tiles', type: 'checkbox', value: true },
    { key: 'jitter', label: 'Color variation', type: 'range', min: 0, max: 1, step: 0.05, value: 0.22 },
    {
      key: 'colorMode', label: 'Color by', type: 'select', value: 'radial',
      options: [
        { value: 'radial', label: 'distance from center' },
        { value: 'rows', label: 'rows' },
        { value: 'random', label: 'random per tile' },
      ],
    },
  ],

  create({ ctx, width, height, rng, palette, params }) {
    const P = params;
    const size = P.size;
    const flat = P.orient;
    const cx = width / 2;
    const cy = height / 2;
    const maxR = Math.hypot(cx, cy) || 1;
    const bgIsDark = hexToRgb(palette.bg).reduce((a, b) => a + b, 0) < 384;
    const mixTarget = bgIsDark ? '#ffffff' : '#000000';
    const effSize = size * (1 - P.inset);

    // hex centers covering the canvas (plus a margin so edges are filled)
    const centers = [];
    if (flat) {
      const dx = size * 1.5;
      const dy = size * Math.sqrt(3);
      for (let c = -1, cols = Math.ceil(width / dx) + 1; c <= cols; c++) {
        for (let r = -1, rows = Math.ceil(height / dy) + 1; r <= rows; r++) {
          centers.push({ x: c * dx, y: r * dy + (Math.abs(c) % 2 ? dy / 2 : 0), col: c, row: r });
        }
      }
    } else {
      const dx = size * Math.sqrt(3);
      const dy = size * 1.5;
      for (let r = -1, rows = Math.ceil(height / dy) + 1; r <= rows; r++) {
        for (let c = -1, cols = Math.ceil(width / dx) + 1; c <= cols; c++) {
          centers.push({ x: c * dx + (Math.abs(r) % 2 ? dx / 2 : 0), y: r * dy, col: c, row: r });
        }
      }
    }

    function colorT(c) {
      if (P.colorMode === 'random') return rng.random();
      if (P.colorMode === 'rows') return (((c.row % 6) + 6) % 6) / 5;
      return Math.hypot(c.x - cx, c.y - cy) / maxR;
    }

    function drawCell(c) {
      let t = colorT(c);
      if (P.jitter > 0) t = Math.max(0, Math.min(1, t + (rng.random() - 0.5) * P.jitter));
      const base = samplePalette(palette.colors, t);
      const line = mixHex(base, mixTarget, 0.32);

      if (P.style === 'solid') {
        hexPath(ctx, c.x, c.y, effSize, flat);
        if (P.fill) {
          ctx.fillStyle = base;
          ctx.fill();
        }
        ctx.strokeStyle = P.fill ? line : base;
        ctx.stroke();
      } else if (P.style === 'nested') {
        const n = Math.round(P.rings);
        for (let i = n; i >= 1; i--) {
          const s = effSize * (i / n);
          const tt = Math.max(0, Math.min(1, t + (1 - i / n) * 0.55));
          hexPath(ctx, c.x, c.y, s, flat);
          if (P.fill) {
            ctx.fillStyle = samplePalette(palette.colors, tt);
            ctx.fill();
          } else {
            ctx.strokeStyle = samplePalette(palette.colors, tt);
            ctx.stroke();
          }
        }
      } else if (P.style === 'cubes') {
        // split each hexagon into 3 rhombi (center + two adjacent edges) and
        // shade them light/mid/dark — the classic isometric-cube tiling
        const v = [];
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 3) * i + (flat ? 0 : Math.PI / 6);
          v.push([c.x + effSize * Math.cos(a), c.y + effSize * Math.sin(a)]);
        }
        const faces = [
          { idx: [0, 1, 2], col: mixHex(base, '#ffffff', 0.34) },
          { idx: [2, 3, 4], col: base },
          { idx: [4, 5, 0], col: mixHex(base, '#000000', 0.36) },
        ];
        for (const f of faces) {
          ctx.beginPath();
          ctx.moveTo(c.x, c.y);
          for (const k of f.idx) ctx.lineTo(v[k][0], v[k][1]);
          ctx.closePath();
          ctx.fillStyle = f.col;
          ctx.fill();
          // stroke each face in its own color to hide hairline seams
          ctx.strokeStyle = f.col;
          ctx.stroke();
        }
      } else {
        // rosette: tinted hex backdrop + 6 ringed circles + center
        hexPath(ctx, c.x, c.y, effSize, flat);
        if (P.fill) {
          ctx.fillStyle = mixHex(palette.bg, base, 0.22);
          ctx.fill();
        }
        ctx.strokeStyle = line;
        ctx.stroke();
        const rr = effSize / 2;
        ctx.strokeStyle = base;
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 3) * i + (flat ? 0 : Math.PI / 6);
          ctx.beginPath();
          ctx.arc(c.x + Math.cos(a) * rr, c.y + Math.sin(a) * rr, rr, 0, TAU);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(c.x, c.y, rr, 0, TAU);
        ctx.stroke();
      }
    }

    let drawn = false;
    return {
      frame() {
        if (drawn) return false;
        drawn = true;
        ctx.fillStyle = palette.bg;
        ctx.fillRect(0, 0, width, height);
        ctx.lineJoin = 'round';
        ctx.lineWidth = P.lineWidth;
        for (const c of centers) drawCell(c);
        return false;
      },
    };
  },
};

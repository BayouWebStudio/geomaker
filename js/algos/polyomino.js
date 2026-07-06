// Polyomino Tiles: the plane packed with tetromino / pentomino pieces —
// random rotations, bold piece outlines, distinct colors. Reads like a
// finished game of Tetris that covers the whole wall.

import { samplePalette, mixHex, hexToRgb } from '../core/util.js';

// piece libraries as cell offsets (rotations generated at runtime)
const TETROMINOES = [
  [[0, 0], [1, 0], [2, 0], [3, 0]], // I
  [[0, 0], [1, 0], [0, 1], [1, 1]], // O
  [[0, 0], [1, 0], [2, 0], [1, 1]], // T
  [[0, 0], [1, 0], [1, 1], [2, 1]], // S
  [[1, 0], [2, 0], [0, 1], [1, 1]], // Z
  [[0, 0], [0, 1], [1, 1], [2, 1]], // J
  [[2, 0], [0, 1], [1, 1], [2, 1]], // L
];
const PENTOMINOES = [
  [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]], // I
  [[0, 0], [1, 0], [2, 0], [0, 1], [0, 2]], // V
  [[0, 0], [1, 0], [1, 1], [1, 2], [2, 2]], // Z/S
  [[0, 0], [1, 0], [2, 0], [1, 1], [1, 2]], // T
  [[0, 0], [1, 0], [0, 1], [1, 1], [2, 0]], // P
  [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]], // X (plus)
  [[0, 0], [0, 1], [1, 1], [1, 2], [2, 2]], // W
  [[0, 0], [1, 0], [2, 0], [3, 0], [1, 1]], // Y
];

function rotationsOf(shape) {
  const out = [];
  let cur = shape;
  for (let r = 0; r < 4; r++) {
    // normalize to non-negative offsets
    const minX = Math.min(...cur.map((p) => p[0]));
    const minY = Math.min(...cur.map((p) => p[1]));
    const norm = cur.map(([x, y]) => [x - minX, y - minY]).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    const key = JSON.stringify(norm);
    if (!out.some((o) => o.key === key)) out.push({ key, cells: norm });
    cur = cur.map(([x, y]) => [-y, x]); // rotate 90°
  }
  return out.map((o) => o.cells);
}

export default {
  id: 'polyomino',
  name: 'Polyomino Tiles',
  category: 'Geometric',
  description: 'The plane packed with tetromino and pentomino pieces — a finished Tetris wall with bold outlines.',
  params: [
    {
      key: 'pieces', label: 'Piece set', type: 'select', value: 'tetromino',
      options: [
        { value: 'tetromino', label: 'tetrominoes (Tetris)' },
        { value: 'pentomino', label: 'pentominoes' },
        { value: 'mixed', label: 'mixed' },
      ],
    },
    { key: 'cell', label: 'Cell size', type: 'range', min: 12, max: 70, step: 2, value: 34 },
    { key: 'outline', label: 'Piece outline', type: 'range', min: 0, max: 8, step: 0.5, value: 3 },
    { key: 'inset', label: 'Piece gap', type: 'range', min: 0, max: 0.3, step: 0.02, value: 0.08 },
    {
      key: 'colorMode', label: 'Color by', type: 'select', value: 'random',
      options: [
        { value: 'random', label: 'random per piece' },
        { value: 'gradient', label: 'gradient' },
        { value: 'shape', label: 'by piece shape' },
      ],
    },
  ],

  create({ ctx, width, height, rng, palette, params }) {
    const P = params;
    const s = P.cell;
    const cols = Math.ceil(width / s) + 1;
    const rows = Math.ceil(height / s) + 1;
    const D = cols + rows;
    const bgIsDark = hexToRgb(palette.bg).reduce((a, b) => a + b, 0) < 384;
    const outlineInk = bgIsDark ? '#00000088' : '#00000066';

    const lib = [];
    const base = P.pieces === 'tetromino' ? TETROMINOES : P.pieces === 'pentomino' ? PENTOMINOES : [...TETROMINOES, ...PENTOMINOES];
    base.forEach((shape, si) => {
      for (const cells of rotationsOf(shape)) lib.push({ cells, si });
    });

    // greedy fill: scan cells; at each empty one, try random pieces anchored
    // so their first cell lands here; fall back to a single square
    const owner = new Int32Array(cols * rows).fill(-1);
    const at = (c, r) => r * cols + c;
    const pieces = []; // { cells: [[c, r]…], t }
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (owner[at(c, r)] >= 0) continue;
        let placedPiece = null;
        for (let tries = 0; tries < 14 && !placedPiece; tries++) {
          const cand = lib[rng.int(0, lib.length - 1)];
          const anchor = cand.cells[0];
          const cells = cand.cells.map(([x, y]) => [c + x - anchor[0], r + y - anchor[1]]);
          if (cells.every(([cc, rr]) => cc >= 0 && cc < cols && rr >= 0 && rr < rows && owner[at(cc, rr)] < 0)) {
            placedPiece = { cells, si: cand.si };
          }
        }
        if (!placedPiece) placedPiece = { cells: [[c, r]], si: -1 };
        const id = pieces.length;
        for (const [cc, rr] of placedPiece.cells) owner[at(cc, rr)] = id;
        let t;
        if (P.colorMode === 'gradient') t = (c + r) / D;
        else if (P.colorMode === 'shape') t = placedPiece.si < 0 ? 0.5 : (placedPiece.si % 8) / 7;
        else t = rng.random();
        pieces.push({ cells: placedPiece.cells, t });
      }
    }

    function drawPiece(p, id) {
      const fill = samplePalette(palette.colors, p.t);
      ctx.fillStyle = fill;
      const inset = P.inset * s * 0.5;
      // fill the cells slightly inset toward the piece interior
      for (const [c, r] of p.cells) {
        const x = c * s;
        const y = r * s;
        const left = c > 0 && owner[at(c - 1, r)] === id ? 0 : inset;
        const right = c < cols - 1 && owner[at(c + 1, r)] === id ? 0 : inset;
        const top = r > 0 && owner[at(c, r - 1)] === id ? 0 : inset;
        const bottom = r < rows - 1 && owner[at(c, r + 1)] === id ? 0 : inset;
        ctx.fillRect(x + left, y + top, s - left - right, s - top - bottom);
      }
      if (P.outline > 0) {
        ctx.strokeStyle = mixHex(fill, '#000000', 0.45);
        ctx.lineWidth = P.outline;
        ctx.lineCap = 'square';
        ctx.beginPath();
        for (const [c, r] of p.cells) {
          const x = c * s;
          const y = r * s;
          if (!(r > 0 && owner[at(c, r - 1)] === id)) {
            ctx.moveTo(x + (c > 0 && owner[at(c - 1, r)] === id ? 0 : inset), y + inset);
            ctx.lineTo(x + s - (c < cols - 1 && owner[at(c + 1, r)] === id ? 0 : inset), y + inset);
          }
          if (!(r < rows - 1 && owner[at(c, r + 1)] === id)) {
            ctx.moveTo(x + (c > 0 && owner[at(c - 1, r)] === id ? 0 : inset), y + s - inset);
            ctx.lineTo(x + s - (c < cols - 1 && owner[at(c + 1, r)] === id ? 0 : inset), y + s - inset);
          }
          if (!(c > 0 && owner[at(c - 1, r)] === id)) {
            ctx.moveTo(x + inset, y + (r > 0 && owner[at(c, r - 1)] === id ? 0 : inset));
            ctx.lineTo(x + inset, y + s - (r < rows - 1 && owner[at(c, r + 1)] === id ? 0 : inset));
          }
          if (!(c < cols - 1 && owner[at(c + 1, r)] === id)) {
            ctx.moveTo(x + s - inset, y + (r > 0 && owner[at(c, r - 1)] === id ? 0 : inset));
            ctx.lineTo(x + s - inset, y + s - (r < rows - 1 && owner[at(c, r + 1)] === id ? 0 : inset));
          }
        }
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
        pieces.forEach((p, id) => drawPiece(p, id));
        return false;
      },
    };
  },
};

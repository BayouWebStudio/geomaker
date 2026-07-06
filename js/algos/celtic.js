// Celtic knotwork: an over-under woven plait. Two families of ribbons cross on
// a grid; at each crossing one passes over the other, alternating by parity, so
// the cords interlace. Rotated 45° it reads as the classic diagonal knot.

import { samplePalette, mixHex, hexToRgb } from '../core/util.js';

export default {
  id: 'celtic',
  name: 'Celtic Knot',
  category: 'Geometric',
  interactive: true,
  symmetry: true,
  hint: 'tap a crossing to flip its over/under · drag to re-weave a path',
  description: 'Interlaced Celtic plaitwork — tap any crossing to flip which cord passes over, or drag to re-weave a path.',
  params: [
    { key: 'scale', label: 'Cell size', type: 'range', min: 26, max: 130, step: 2, value: 54 },
    { key: 'ribbon', label: 'Cord width', type: 'range', min: 0.2, max: 0.8, step: 0.05, value: 0.5 },
    { key: 'lineWidth', label: 'Outline', type: 'range', min: 0, max: 4, step: 0.5, value: 2 },
    { key: 'diagonal', label: 'Diagonal weave', type: 'checkbox', value: true },
    { key: 'colorMode', label: 'Cord color', type: 'select', value: 'gradient', options: [
      { value: 'gradient', label: 'gradient' },
      { value: 'single', label: 'single cord' },
    ] },
  ],

  create({ ctx, width, height, palette, params }) {
    const P = params;
    const s = P.scale;
    const w = s * P.ribbon;
    const bgIsDark = hexToRgb(palette.bg).reduce((a, b) => a + b, 0) < 384;
    const outline = bgIsDark ? '#000000' : '#1a1a1a';
    const cordOf = (i, j) =>
      P.colorMode === 'single'
        ? samplePalette(palette.colors, 0.6)
        : samplePalette(palette.colors, (((i + j) % 8) + 8) % 8 / 7);

    // a ribbon segment crossing one cell, horizontal or vertical
    function segment(cxp, cyp, horizontal, color) {
      ctx.fillStyle = color;
      if (horizontal) ctx.fillRect(cxp - s / 2 - 1, cyp - w / 2, s + 2, w);
      else ctx.fillRect(cxp - w / 2, cyp - s / 2 - 1, w, s + 2);
      if (P.lineWidth > 0) {
        ctx.strokeStyle = outline;
        ctx.lineWidth = P.lineWidth;
        if (horizontal) {
          ctx.beginPath();
          ctx.moveTo(cxp - s / 2 - 1, cyp - w / 2); ctx.lineTo(cxp + s / 2 + 1, cyp - w / 2);
          ctx.moveTo(cxp - s / 2 - 1, cyp + w / 2); ctx.lineTo(cxp + s / 2 + 1, cyp + w / 2);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.moveTo(cxp - w / 2, cyp - s / 2 - 1); ctx.lineTo(cxp - w / 2, cyp + s / 2 + 1);
          ctx.moveTo(cxp + w / 2, cyp - s / 2 - 1); ctx.lineTo(cxp + w / 2, cyp + s / 2 + 1);
          ctx.stroke();
        }
      }
    }

    // crossings the user has flipped (key "i,j"); tap toggles over/under
    const flips = new Set();
    const diag = Math.hypot(width, height);
    const x0 = (width - diag) / 2;
    const y0 = (height - diag) / 2;

    function weave() {
      const cols = Math.ceil(diag / s) + 2;
      const rows = Math.ceil(diag / s) + 2;
      // draw the under-strand of every crossing first, then the over-strand,
      // so over/under alternates by (i+j) parity into a basket weave
      for (let pass = 0; pass < 2; pass++) {
        for (let j = -1; j < rows; j++) {
          for (let i = -1; i < cols; i++) {
            const cxp = x0 + i * s + s / 2;
            const cyp = y0 + j * s + s / 2;
            let hOver = ((i + j) & 1) === 0; // horizontal over here?
            if (flips.has(i + ',' + j)) hOver = !hOver;
            const horizontal = pass === 0 ? !hOver : hOver; // under first, then over
            segment(cxp, cyp, horizontal, cordOf(i, j));
          }
        }
      }
    }

    // map a canvas point to its weave cell (undoing the 45° rotation)
    function cellAt(x, y) {
      let px = x;
      let py = y;
      if (P.diagonal) {
        const dx = x - width / 2;
        const dy = y - height / 2;
        const cos = Math.cos(-Math.PI / 4);
        const sin = Math.sin(-Math.PI / 4);
        px = width / 2 + dx * cos - dy * sin;
        py = height / 2 + dx * sin + dy * cos;
      }
      return [Math.floor((px - x0) / s), Math.floor((py - y0) / s)];
    }

    let dirty = true;
    const lastCell = new Map(); // per mirror index, while drag-weaving

    function flipCell(i, j) {
      const key = i + ',' + j;
      if (flips.has(key)) flips.delete(key);
      else flips.add(key);
      dirty = true;
    }

    return {
      frame() {
        if (dirty) {
          ctx.fillStyle = palette.bg;
          ctx.fillRect(0, 0, width, height);
          ctx.lineCap = 'butt';
          if (P.diagonal) {
            ctx.save();
            ctx.translate(width / 2, height / 2);
            ctx.rotate(Math.PI / 4);
            ctx.translate(-width / 2, -height / 2);
            weave();
            ctx.restore();
          } else {
            weave();
          }
          dirty = false;
        }
        return true; // stay live for re-weaving
      },
      onDown(x, y, k = 0) {
        const [i, j] = cellAt(x, y);
        lastCell.set(k, i + ',' + j);
        flipCell(i, j);
      },
      onMove(x, y, dx, dy, k = 0) {
        const [i, j] = cellAt(x, y);
        const key = i + ',' + j;
        if (lastCell.get(k) === key) return;
        lastCell.set(k, key);
        flipCell(i, j);
      },
      onUp(x, y, dist, k = 0) {
        lastCell.delete(k);
      },
    };
  },
};

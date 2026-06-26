// Kumiko (組子): the delicate wooden shoji lattice. A square jigumi grid filled
// with fine "muntin" patterns, rendered with an optional bevel highlight so the
// strips read as wood. Square-based kumiko (complements the triangular asanoha
// in the Wagara pack).

import { samplePalette, mixHex } from '../core/util.js';

export default {
  id: 'kumiko',
  name: 'Kumiko (組子)',
  category: 'Geometric',
  description: 'Japanese wooden shoji latticework — a square jigumi grid filled with fine muntin patterns.',
  params: [
    {
      key: 'pattern', label: 'Infill', type: 'select', value: 'kakuasa',
      options: [
        { value: 'masu', label: 'masu (square grid)' },
        { value: 'diagonal', label: 'diagonal star' },
        { value: 'kakuasa', label: 'kaku-asa (square hemp leaf)' },
      ],
    },
    { key: 'scale', label: 'Cell size', type: 'range', min: 28, max: 160, step: 4, value: 84 },
    { key: 'lineWidth', label: 'Muntin width', type: 'range', min: 0.5, max: 6, step: 0.5, value: 2 },
    { key: 'frame', label: 'Bold frame grid', type: 'checkbox', value: true },
    { key: 'bevel', label: 'Wood bevel highlight', type: 'checkbox', value: true },
    {
      key: 'wood', label: 'Wood tone', type: 'select', value: 'gradient',
      options: [
        { value: 'gradient', label: 'palette gradient' },
        { value: 'single', label: 'single tone' },
      ],
    },
  ],

  create({ ctx, width, height, palette, params }) {
    const P = params;
    const s = P.scale;
    const cx = width / 2;
    const cy = height / 2;
    const maxR = Math.hypot(cx, cy) || 1;
    const woodBase = samplePalette(palette.colors, 0.62);
    const woodFor = (x, y) =>
      P.wood === 'gradient' ? samplePalette(palette.colors, 0.4 + 0.5 * (Math.hypot(x - cx, y - cy) / maxR)) : woodBase;

    // draw a set of strokes as wood muntins, with an optional lighter bevel on top
    function muntins(drawFn, color, w) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = color;
      ctx.lineWidth = w;
      drawFn();
      if (P.bevel) {
        ctx.strokeStyle = mixHex(color, '#ffffff', 0.45);
        ctx.lineWidth = Math.max(0.4, w * 0.38);
        drawFn();
      }
    }

    function cellInfill(x, y) {
      const a = [x, y];
      const b = [x + s, y];
      const c = [x + s, y + s];
      const d = [x, y + s];
      const mAB = [x + s / 2, y];
      const mBC = [x + s, y + s / 2];
      const mCD = [x + s / 2, y + s];
      const mDA = [x, y + s / 2];
      const line = (p, q) => {
        ctx.moveTo(p[0], p[1]);
        ctx.lineTo(q[0], q[1]);
      };
      ctx.beginPath();
      if (P.pattern === 'masu') {
        // plain grid: nothing extra inside the cell
      } else if (P.pattern === 'diagonal') {
        line(a, c);
        line(b, d);
      } else {
        // kaku-asa: diagonals + inner diamond + spikes to the centre
        line(a, c);
        line(b, d);
        line(mAB, mBC);
        line(mBC, mCD);
        line(mCD, mDA);
        line(mDA, mAB);
      }
      ctx.stroke();
    }

    let drawn = false;
    return {
      frame() {
        if (drawn) return false;
        drawn = true;
        ctx.fillStyle = palette.bg;
        ctx.fillRect(0, 0, width, height);

        // infill muntins per cell
        for (let y = 0; y < height; y += s) {
          for (let x = 0; x < width; x += s) {
            const color = woodFor(x + s / 2, y + s / 2);
            muntins(() => cellInfill(x, y), color, P.lineWidth);
          }
        }

        // jigumi frame grid on top (bolder)
        const frameW = P.frame ? P.lineWidth * 1.8 : P.lineWidth;
        muntins(
          () => {
            ctx.beginPath();
            for (let x = 0; x <= width + s; x += s) {
              ctx.moveTo(x, 0);
              ctx.lineTo(x, height);
            }
            for (let y = 0; y <= height + s; y += s) {
              ctx.moveTo(0, y);
              ctx.lineTo(width, y);
            }
            ctx.stroke();
          },
          woodFor(cx, cy),
          frameW
        );
        return false;
      },
    };
  },
};

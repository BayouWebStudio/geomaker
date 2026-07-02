// Sayagata (紗綾形): the linked-manji key fret — the classic kimono-silk and
// irezumi background lattice, traditionally set on the 45° diagonal.
//
// Construction: 卍 motifs on a 4-unit lattice with checkerboard chirality and
// hook length 2. Neighbouring manji then share their hook strokes exactly
// (seamless links, no crossings), and the hooks of diagonal neighbours fuse
// into straight runs — giving the continuous interlocking fret.

import { samplePalette } from '../core/util.js';

export default {
  id: 'sayagata',
  name: 'Sayagata (紗綾形)',
  category: 'Geometric',
  description: 'The interlocking-manji key fret of kimono silk and irezumi backgrounds, set on the diagonal.',
  params: [
    {
      key: 'style', label: 'Fret', type: 'select', value: 'manji',
      options: [
        { value: 'manji', label: 'linked manji (sayagata)' },
        { value: 'higaki', label: 'tight weave (higaki)' },
      ],
    },
    { key: 'size', label: 'Scale', type: 'range', min: 4, max: 22, step: 1, value: 9 },
    { key: 'lineWidth', label: 'Line width', type: 'range', min: 1, max: 10, step: 0.5, value: 3 },
    { key: 'diagonal', label: 'Set on 45°', type: 'checkbox', value: true },
    { key: 'tone', label: 'Ground tone', type: 'range', min: 0, max: 1, step: 0.05, value: 0 },
    {
      key: 'colorMode', label: 'Color by', type: 'select', value: 'single',
      options: [
        { value: 'single', label: 'single ink' },
        { value: 'drift', label: 'gradient drift' },
      ],
    },
  ],

  create({ ctx, width, height, palette, params }) {
    const P = params;

    // the six strokes of one manji at (cx, cy); arms a, hooks h; dir = chirality
    function manji(cx, cy, a, h, dir) {
      ctx.moveTo(cx - a, cy);
      ctx.lineTo(cx + a, cy);
      ctx.moveTo(cx, cy - a);
      ctx.lineTo(cx, cy + a);
      ctx.moveTo(cx + a, cy);
      ctx.lineTo(cx + a, cy - h * dir); // right hook
      ctx.moveTo(cx - a, cy);
      ctx.lineTo(cx - a, cy + h * dir); // left hook
      ctx.moveTo(cx, cy - a);
      ctx.lineTo(cx - h * dir, cy - a); // top hook
      ctx.moveTo(cx, cy + a);
      ctx.lineTo(cx + h * dir, cy + a); // bottom hook
    }

    let drawn = false;
    return {
      frame() {
        if (drawn) return false;
        drawn = true;
        ctx.fillStyle = palette.bg;
        ctx.fillRect(0, 0, width, height);
        if (P.tone > 0) {
          // wash the ground toward the ink for a dyed-fabric feel
          ctx.globalAlpha = P.tone * 0.16;
          ctx.fillStyle = samplePalette(palette.colors, 0.5);
          ctx.fillRect(0, 0, width, height);
          ctx.globalAlpha = 1;
        }

        const u = P.size;
        const D = Math.hypot(width, height);
        ctx.save();
        if (P.diagonal) {
          ctx.translate(width / 2, height / 2);
          ctx.rotate(Math.PI / 4);
          ctx.translate(-D / 2, -D / 2);
        } else {
          ctx.translate((width - D) / 2, (height - D) / 2);
        }
        ctx.lineCap = 'square';
        ctx.lineWidth = P.lineWidth;

        const weave = P.style === 'higaki';
        // higaki: arm tips touch (hooks fuse into the tight weave); sayagata:
        // spaced manji with short hooks, arm tips joined by straight links
        const step = weave ? 4 * u : 6 * u;
        const n = Math.ceil(D / step) + 2;
        for (let j = -1; j < n; j++) {
          for (let i = -1; i < n; i++) {
            ctx.strokeStyle = P.colorMode === 'drift'
              ? samplePalette(palette.colors, (i + j + n) / (n * 2))
              : samplePalette(palette.colors, 0.3);
            const x = i * step;
            const y = j * step;
            ctx.beginPath();
            if (weave) {
              manji(x, y, 2 * u, 2 * u, (i + j) % 2 === 0 ? 1 : -1);
            } else {
              manji(x, y, 2 * u, u, 1);
              // Z-links: our right hook tip steps over to the east manji's
              // left hook, our bottom tip to the south manji's top hook —
              // every hook tip gets exactly one link, so the fret has no
              // free ends and no straight run longer than one arm
              ctx.moveTo(x + 2 * u, y - u);
              ctx.lineTo(x + 4 * u, y - u);
              ctx.lineTo(x + 4 * u, y);
              ctx.moveTo(x + u, y + 2 * u);
              ctx.lineTo(x + u, y + 4 * u);
              ctx.lineTo(x, y + 4 * u);
            }
            ctx.stroke();
          }
        }
        ctx.restore();
        return false;
      },
    };
  },
};

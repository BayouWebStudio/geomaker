// Asanoha (麻の葉): the hemp-leaf star lattice — a triangular grid where every
// triangle is spoked from its centre, blooming into six-pointed leaf stars.
// Dedicated version with kumiko-style double lines and random accent fills.

import { samplePalette, mixHex } from '../core/util.js';

export default {
  id: 'asanoha',
  name: 'Asanoha (麻の葉)',
  category: 'Geometric',
  description: 'The hemp-leaf star lattice, with kumiko double-line joinery and scattered accent fills.',
  params: [
    { key: 'size', label: 'Leaf size', type: 'range', min: 20, max: 140, step: 2, value: 62 },
    { key: 'lineWidth', label: 'Line width', type: 'range', min: 0.5, max: 8, step: 0.5, value: 2 },
    { key: 'weave', label: 'Kumiko double lines', type: 'checkbox', value: false },
    { key: 'accent', label: 'Accent fills', type: 'range', min: 0, max: 1, step: 0.05, value: 0.12 },
    { key: 'rotation', label: 'Rotation', type: 'range', min: 0, max: 60, step: 5, value: 0 },
    {
      key: 'colorMode', label: 'Color by', type: 'select', value: 'ink',
      options: [
        { value: 'ink', label: 'single ink' },
        { value: 'gradient', label: 'gradient drift' },
      ],
    },
  ],

  create({ ctx, width, height, rng, palette, params }) {
    const P = params;
    const ink = samplePalette(palette.colors, 0.15);
    const D = Math.hypot(width, height);

    function seg(x1, y1, x2, y2) {
      if (!P.weave) {
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        return;
      }
      // two parallel hairlines, like kumiko laths
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy) || 1;
      const off = Math.max(0.8, P.lineWidth) * 0.9;
      const nx = (-dy / len) * off;
      const ny = (dx / len) * off;
      ctx.moveTo(x1 + nx, y1 + ny);
      ctx.lineTo(x2 + nx, y2 + ny);
      ctx.moveTo(x1 - nx, y1 - ny);
      ctx.lineTo(x2 - nx, y2 - ny);
    }

    // one grid triangle: edges + centroid spokes, optional accent fill
    function leaf(ax, ay, bx, by, cx, cy, t) {
      const gx = (ax + bx + cx) / 3;
      const gy = (ay + by + cy) / 3;
      if (P.accent > 0 && rng.random() < P.accent) {
        // fill one of the three centre kites (sub-triangles) for sparkle
        const pick = rng.int(0, 2);
        const pts = [[ax, ay], [bx, by], [cx, cy]];
        const [p1, p2] = [pts[pick], pts[(pick + 1) % 3]];
        ctx.fillStyle = mixHex(samplePalette(palette.colors, 0.55 + rng.random() * 0.4), palette.bg, 0.25);
        ctx.beginPath();
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.lineTo(gx, gy);
        ctx.closePath();
        ctx.fill();
      }
      ctx.strokeStyle = P.colorMode === 'gradient'
        ? samplePalette(palette.colors, t)
        : ink;
      ctx.lineWidth = P.weave ? Math.max(0.5, P.lineWidth * 0.5) : P.lineWidth;
      ctx.beginPath();
      seg(ax, ay, bx, by);
      seg(bx, by, cx, cy);
      seg(cx, cy, ax, ay);
      seg(gx, gy, ax, ay);
      seg(gx, gy, bx, by);
      seg(gx, gy, cx, cy);
      ctx.stroke();
    }

    let drawn = false;
    return {
      frame() {
        if (drawn) return false;
        drawn = true;
        ctx.fillStyle = palette.bg;
        ctx.fillRect(0, 0, width, height);
        ctx.lineCap = 'round';
        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.rotate((P.rotation * Math.PI) / 180);
        ctx.translate(-D / 2, -D / 2);

        const a = P.size;
        const h = (a * Math.sqrt(3)) / 2;
        const rows = Math.ceil(D / h) + 2;
        const cols = Math.ceil(D / a) + 2;
        for (let j = -1; j < rows; j++) {
          const y = j * h;
          const off = j % 2 ? a / 2 : 0;
          for (let i = -1; i < cols; i++) {
            const x = i * a + off;
            const t = (i + j + rows) / (cols + rows);
            leaf(x, y, x + a, y, x + a / 2, y + h, t);          // up triangle
            leaf(x + a, y, x + a / 2, y + h, x + a * 1.5, y + h, t); // down triangle
          }
        }
        ctx.restore();
        return false;
      },
    };
  },
};

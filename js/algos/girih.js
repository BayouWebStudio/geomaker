// Islamic Girih: star-and-strapwork patterns. N-pointed {n/m} star polygons are
// laid on a grid (interleaved with a second offset grid) so their points knit
// into the classic star-and-cross fields of Islamic geometric art.

import { samplePalette, mixHex, hexToRgb } from '../core/util.js';

export default {
  id: 'girih',
  name: 'Islamic Girih',
  category: 'Geometric',
  description: 'Islamic geometric star patterns — interlocking {n/m} star polygons in strapwork.',
  params: [
    {
      key: 'points', label: 'Star points', type: 'select', value: '8',
      options: [
        { value: '8', label: '8-point (octagram)' },
        { value: '10', label: '10-point (decagram)' },
        { value: '12', label: '12-point' },
      ],
    },
    { key: 'scale', label: 'Scale', type: 'range', min: 30, max: 180, step: 4, value: 84 },
    { key: 'lineWidth', label: 'Line width', type: 'range', min: 0.5, max: 6, step: 0.5, value: 2 },
    { key: 'fill', label: 'Fill stars', type: 'checkbox', value: true },
    { key: 'colorMode', label: 'Colors', type: 'select', value: 'two', options: [
      { value: 'two', label: 'two-tone' },
      { value: 'gradient', label: 'gradient' },
      { value: 'mono', label: 'single ink' },
    ] },
  ],

  create({ ctx, width, height, palette, params }) {
    const P = params;
    const n = parseInt(P.points, 10);
    const m = n === 8 ? 3 : n === 10 ? 3 : 5; // {n/m} step for a single-path star
    const s = P.scale;
    const cx = width / 2;
    const cy = height / 2;
    const maxR = Math.hypot(cx, cy) || 1;
    const bgIsDark = hexToRgb(palette.bg).reduce((a, b) => a + b, 0) < 384;
    const lineCol = bgIsDark ? '#ffffff' : '#000000';

    function starPath(x, y, R, rot) {
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const a = rot + ((i * m) * 2 * Math.PI) / n;
        const px = x + Math.cos(a) * R;
        const py = y + Math.sin(a) * R;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    }

    function colorAt(x, y, alt) {
      if (P.colorMode === 'mono') return samplePalette(palette.colors, 0.7);
      if (P.colorMode === 'gradient') return samplePalette(palette.colors, Math.hypot(x - cx, y - cy) / maxR);
      return alt ? samplePalette(palette.colors, 0.78) : samplePalette(palette.colors, 0.35);
    }

    function drawStar(x, y, R, rot, alt) {
      const c = colorAt(x, y, alt);
      starPath(x, y, R, rot);
      if (P.fill) {
        ctx.fillStyle = mixHex(c, palette.bg, 0.15);
        ctx.fill('evenodd');
      }
      ctx.lineWidth = P.lineWidth;
      ctx.strokeStyle = P.fill ? mixHex(c, lineCol, 0.25) : c;
      ctx.stroke();
    }

    let drawn = false;
    return {
      frame() {
        if (drawn) return false;
        drawn = true;
        ctx.fillStyle = palette.bg;
        ctx.fillRect(0, 0, width, height);
        ctx.lineJoin = 'round';
        const R = s * 0.62;
        const rot = -Math.PI / 2;
        // primary grid of stars
        for (let y = -s; y < height + s; y += s) {
          for (let x = -s; x < width + s; x += s) {
            drawStar(x, y, R, rot, false);
          }
        }
        // offset grid of smaller rotated stars fills the interstitial crosses
        const R2 = s * 0.34;
        for (let y = -s / 2; y < height + s; y += s) {
          for (let x = -s / 2; x < width + s; x += s) {
            drawStar(x, y, R2, rot + Math.PI / n, true);
          }
        }
        return false;
      },
    };
  },
};

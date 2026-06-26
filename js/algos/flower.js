// Flower of Life: the classic sacred-geometry lattice of equal circles whose
// centers sit one radius apart on a triangular grid. Overlaps form vesica-piscis
// petals; an optional boundary clips the bloom into a clean rosette.

import { TAU, samplePalette, withAlpha, hexToRgb } from '../core/util.js';

export default {
  id: 'flower',
  name: 'Flower of Life',
  category: 'Geometric',
  description: 'Overlapping circles on a hex lattice — vesica petals and sacred-geometry rosettes.',
  params: [
    { key: 'rings', label: 'Rings of circles', type: 'range', min: 1, max: 8, step: 1, value: 4 },
    { key: 'radius', label: 'Circle radius', type: 'range', min: 24, max: 160, step: 2, value: 72 },
    { key: 'lineWidth', label: 'Line width', type: 'range', min: 0.3, max: 6, step: 0.1, value: 1.6 },
    { key: 'rotation', label: 'Rotation', type: 'range', min: 0, max: 360, step: 1, value: 0 },
    { key: 'boundary', label: 'Boundary ring + clip', type: 'checkbox', value: true },
    { key: 'fill', label: 'Stained-glass fill', type: 'checkbox', value: false },
    { key: 'fillAlpha', label: 'Fill opacity', type: 'range', min: 0.02, max: 0.4, step: 0.01, value: 0.12 },
    { key: 'opacity', label: 'Line opacity', type: 'range', min: 0.1, max: 1, step: 0.05, value: 0.9 },
    {
      key: 'colorMode', label: 'Color by', type: 'select', value: 'ring',
      options: [
        { value: 'ring', label: 'ring (distance from center)' },
        { value: 'angle', label: 'angle' },
        { value: 'single', label: 'single ink' },
      ],
    },
  ],

  create({ ctx, width, height, palette, params }) {
    const P = params;
    const R = P.radius;
    const cx = width / 2;
    const cy = height / 2;
    const rings = Math.round(P.rings);

    // triangular lattice basis with nearest-neighbor spacing exactly R
    const ax = R;
    const bx = R / 2;
    const by = (R * Math.sqrt(3)) / 2;

    const centers = [];
    let maxD = 0;
    for (let q = -rings; q <= rings; q++) {
      for (let r = -rings; r <= rings; r++) {
        const hexDist = (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2;
        if (hexDist > rings) continue;
        const x = q * ax + r * bx;
        const y = r * by;
        const d = Math.hypot(x, y);
        if (d > maxD) maxD = d;
        centers.push({ x, y, d });
      }
    }
    const boundR = rings * R + R; // outermost circle edges reach exactly here
    const maxColorD = maxD + R || 1;
    const bgIsDark = hexToRgb(palette.bg).reduce((a, b) => a + b, 0) < 384;

    const colorFor = (c) => {
      if (P.colorMode === 'single') return samplePalette(palette.colors, 0.6);
      if (P.colorMode === 'angle') return samplePalette(palette.colors, Math.atan2(c.y, c.x) / TAU + 0.5);
      return samplePalette(palette.colors, c.d / maxColorD);
    };

    let drawn = false;
    return {
      frame() {
        if (drawn) return false;
        drawn = true;
        ctx.fillStyle = palette.bg;
        ctx.fillRect(0, 0, width, height);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((P.rotation * Math.PI) / 180);

        if (P.boundary) {
          ctx.beginPath();
          ctx.arc(0, 0, boundR, 0, TAU);
          ctx.clip();
        }

        if (P.fill) {
          // overlapping fills deepen (light bg) or glow (dark bg) like stained glass
          ctx.globalCompositeOperation = bgIsDark ? 'lighter' : 'multiply';
          for (const c of centers) {
            ctx.beginPath();
            ctx.arc(c.x, c.y, R, 0, TAU);
            ctx.fillStyle = withAlpha(colorFor(c), P.fillAlpha);
            ctx.fill();
          }
          ctx.globalCompositeOperation = 'source-over';
        }

        ctx.lineWidth = P.lineWidth;
        for (const c of centers) {
          ctx.beginPath();
          ctx.arc(c.x, c.y, R, 0, TAU);
          ctx.strokeStyle = withAlpha(colorFor(c), P.opacity);
          ctx.stroke();
        }
        ctx.restore();

        if (P.boundary) {
          // classic double boundary ring, drawn on the full canvas (outside the clip)
          ctx.strokeStyle = withAlpha(samplePalette(palette.colors, 1), P.opacity);
          ctx.lineWidth = P.lineWidth * 1.6;
          ctx.beginPath();
          ctx.arc(cx, cy, boundR, 0, TAU);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(cx, cy, boundR + P.lineWidth * 3, 0, TAU);
          ctx.stroke();
        }
        return false;
      },
    };
  },
};

// Spirograph: hypotrochoid gear curves — the toy with the pens — layered into
// guilloché-style engraving rosettes. Wheel ratio and pen offset reshape the
// figure; layers nest scaled/rotated copies.

import { TAU, samplePalette } from '../core/util.js';

export default {
  id: 'spiro',
  name: 'Spirograph',
  category: 'Geometric',
  description: 'Gear-drawn hypotrochoid curves layered into guilloché engraving rosettes.',
  params: [
    { key: 'ratio', label: 'Wheel ratio', type: 'range', min: 0.12, max: 0.88, step: 0.01, value: 0.36 },
    { key: 'pen', label: 'Pen offset', type: 'range', min: 0.1, max: 1.6, step: 0.05, value: 0.8 },
    { key: 'revs', label: 'Revolutions', type: 'range', min: 4, max: 80, step: 1, value: 36 },
    { key: 'layers', label: 'Layers', type: 'range', min: 1, max: 6, step: 1, value: 3 },
    { key: 'variation', label: 'Layer variation', type: 'range', min: 0, max: 1, step: 0.05, value: 0.35 },
    { key: 'lineWidth', label: 'Line width', type: 'range', min: 0.4, max: 6, step: 0.1, value: 1 },
    {
      key: 'colorMode', label: 'Color by', type: 'select', value: 'layer',
      options: [
        { value: 'layer', label: 'by layer' },
        { value: 'angle', label: 'gradient sweep' },
        { value: 'single', label: 'single ink' },
      ],
    },
  ],

  create({ ctx, width, height, rng, palette, params }) {
    const P = params;
    const cx = width / 2;
    const cy = height / 2;
    const baseR = Math.min(width, height) * 0.44;

    function drawLayer(l) {
      const jitter = (v) => v * (1 + (rng.random() - 0.5) * P.variation * 0.5);
      const q = Math.min(0.92, Math.max(0.08, jitter(P.ratio)));
      const pen = jitter(P.pen);
      const R = baseR * (1 - (l / Math.max(1, P.layers)) * 0.55);
      const rot = rng.random() * TAU;
      // normalize so the figure's outermost point touches R
      const norm = (1 - q) + pen * q;
      const steps = Math.round(P.revs * 140);
      ctx.lineWidth = P.lineWidth;
      if (P.colorMode === 'layer') {
        ctx.strokeStyle = samplePalette(palette.colors, P.layers > 1 ? l / (P.layers - 1) : 0.3);
      } else if (P.colorMode === 'single') {
        ctx.strokeStyle = samplePalette(palette.colors, 0.35);
      }

      let run = 0;
      ctx.beginPath();
      for (let s = 0; s <= steps; s++) {
        const t = (s / steps) * P.revs * TAU;
        const x = ((1 - q) * Math.cos(t) + pen * q * Math.cos(((1 - q) / q) * t)) / norm;
        const y = ((1 - q) * Math.sin(t) - pen * q * Math.sin(((1 - q) / q) * t)) / norm;
        const px = cx + (x * Math.cos(rot) - y * Math.sin(rot)) * R;
        const py = cy + (x * Math.sin(rot) + y * Math.cos(rot)) * R;
        if (s === 0) {
          ctx.moveTo(px, py);
        } else if (P.colorMode === 'angle' && s % 140 === 0) {
          // break the path so the gradient can sweep along the drawing
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(px, py);
          run = s / steps;
          ctx.strokeStyle = samplePalette(palette.colors, run);
        } else {
          ctx.lineTo(px, py);
        }
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
        ctx.lineJoin = 'round';
        for (let l = 0; l < P.layers; l++) drawLayer(l);
        return false;
      },
    };
  },
};

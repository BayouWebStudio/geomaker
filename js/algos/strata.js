// Ridgelines: stacked horizontal lines displaced by fractal noise, drawn
// back to front with opaque fills so nearer ridges occlude the ones behind.

import { lerp, samplePalette, mixHex } from '../core/util.js';

export default {
  id: 'ridge',
  name: 'Ridgelines',
  description: 'Stacked ridge lines displaced by noise, like mountain strata.',
  params: [
    { key: 'lines', label: 'Lines', type: 'range', min: 8, max: 220, step: 2, value: 64 },
    { key: 'amp', label: 'Peak height', type: 'range', min: 10, max: 320, step: 5, value: 160 },
    { key: 'noiseScale', label: 'Noise scale', type: 'range', min: 0.0008, max: 0.02, step: 0.0002, value: 0.0035 },
    { key: 'depthGap', label: 'Line variation', type: 'range', min: 0.01, max: 0.4, step: 0.01, value: 0.09 },
    { key: 'octaves', label: 'Detail (octaves)', type: 'range', min: 1, max: 5, step: 1, value: 3 },
    { key: 'sharp', label: 'Peak sharpness', type: 'range', min: 1, max: 5, step: 0.1, value: 2.2 },
    { key: 'lineWidth', label: 'Stroke width', type: 'range', min: 0.4, max: 4, step: 0.1, value: 1.4 },
    { key: 'taper', label: 'Taper edges', type: 'checkbox', value: true },
    { key: 'shaded', label: 'Shaded fill', type: 'checkbox', value: true },
    {
      key: 'colorMode', label: 'Color by', type: 'select', value: 'gradient',
      options: [
        { value: 'gradient', label: 'gradient down the page' },
        { value: 'single', label: 'single color' },
      ],
    },
    { key: 'animate', label: 'Animate (drift)', type: 'checkbox', value: false },
    { key: 'drift', label: 'Drift speed', type: 'range', min: 0.05, max: 3, step: 0.05, value: 0.6 },
  ],

  create({ ctx, width, height, noise, palette, params }) {
    const P = params;
    const mx = width * 0.07;
    const xR = width - mx;
    const top = height * 0.06 + P.amp * 0.85;
    const bottom = height * 0.92;
    const stepX = 2.5;
    let z = 0;
    let drawn = false;

    function drawAll() {
      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, width, height);
      ctx.lineWidth = P.lineWidth;
      ctx.lineJoin = 'round';

      const lines = Math.round(P.lines);
      for (let i = 0; i < lines; i++) {
        const t = lines === 1 ? 0 : i / (lines - 1);
        const base = lerp(top, bottom, t);
        const color = P.colorMode === 'gradient' ? samplePalette(palette.colors, t) : palette.colors[0];
        const fill = P.shaded ? mixHex(palette.bg, color, 0.1) : palette.bg;

        const pts = [];
        for (let x = mx; x <= xR; x += stepX) {
          const n = noise.fbm(x * P.noiseScale, i * P.depthGap + 7.3, z, P.octaves);
          const ridge = Math.pow(Math.max(0, n), P.sharp) * P.amp;
          const wig = n * P.amp * 0.06;
          const env = P.taper ? Math.pow(Math.sin((Math.PI * (x - mx)) / (xR - mx)), 0.7) : 1;
          pts.push(x, base - (ridge + wig) * env);
        }
        pts.push(xR, base);

        ctx.beginPath();
        ctx.moveTo(pts[0], pts[1]);
        for (let j = 2; j < pts.length; j += 2) ctx.lineTo(pts[j], pts[j + 1]);
        ctx.lineTo(xR, height);
        ctx.lineTo(mx, height);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(pts[0], pts[1]);
        for (let j = 2; j < pts.length; j += 2) ctx.lineTo(pts[j], pts[j + 1]);
        ctx.strokeStyle = color;
        ctx.stroke();
      }
    }

    return {
      frame() {
        if (!P.animate && drawn) return false;
        drawAll();
        drawn = true;
        if (P.animate) {
          z += P.drift * 0.01;
          return true;
        }
        return false;
      },
    };
  },
};

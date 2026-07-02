// Stripes & Waves: banded wallpaper — straight stripes, chevron zigzags,
// flowing wave ribbons and fish-scale rows — with direct control over band
// width, fill ratio (stripe thickness inside the band) and hand wobble.

import { TAU, samplePalette } from '../core/util.js';

export default {
  id: 'stripes',
  name: 'Stripes & Waves',
  category: 'Geometric',
  description: 'Banded wallpaper: straight stripes, chevrons, wave ribbons or fish scales, with band width and fill ratio levers.',
  params: [
    {
      key: 'style', label: 'Style', type: 'select', value: 'waves',
      options: [
        { value: 'straight', label: 'straight stripes' },
        { value: 'chevron', label: 'chevron zigzag' },
        { value: 'waves', label: 'wave ribbons' },
        { value: 'scales', label: 'fish scales' },
      ],
    },
    { key: 'band', label: 'Band width', type: 'range', min: 10, max: 160, step: 2, value: 44 },
    { key: 'fillRatio', label: 'Fill ratio', type: 'range', min: 0.08, max: 1, step: 0.02, value: 0.55 },
    { key: 'angle', label: 'Angle', type: 'range', min: 0, max: 180, step: 5, value: 20 },
    { key: 'depth', label: 'Wave / zig depth', type: 'range', min: 0, max: 1, step: 0.05, value: 0.5 },
    { key: 'freq', label: 'Frequency', type: 'range', min: 0.5, max: 4, step: 0.1, value: 1.4 },
    { key: 'wobble', label: 'Hand wobble', type: 'range', min: 0, max: 1, step: 0.05, value: 0 },
    {
      key: 'colorMode', label: 'Color by', type: 'select', value: 'sequence',
      options: [
        { value: 'sequence', label: 'cycle palette' },
        { value: 'duotone', label: 'duotone' },
        { value: 'gradient', label: 'gradient' },
        { value: 'random', label: 'random' },
      ],
    },
  ],

  create({ ctx, width, height, rng, noise, palette, params }) {
    const P = params;
    const colors = palette.colors;

    function bandColor(i, total) {
      if (P.colorMode === 'duotone') return i % 2 === 0 ? colors[0] : colors[colors.length - 1];
      if (P.colorMode === 'gradient') return samplePalette(colors, total > 1 ? i / (total - 1) : 0);
      if (P.colorMode === 'random') return samplePalette(colors, rng.random());
      return colors[i % colors.length];
    }

    // triangle wave in [-1, 1]
    function zig(x) {
      const k = (x * P.freq) / 300;
      const t = ((k % 1) + 1) % 1;
      return t < 0.5 ? t * 4 - 1 : 3 - t * 4;
    }

    function offsetAt(x, i) {
      let y = 0;
      if (P.style === 'waves') y += Math.sin(((x * P.freq) / 300) * TAU + i * 0.8) * P.band * P.depth * 0.9;
      else if (P.style === 'chevron') y += zig(x) * P.band * P.depth * 1.1;
      if (P.wobble > 0) y += noise.noise3(x * 0.008, i * 3.1, 0) * P.band * P.wobble * 0.8;
      return y;
    }

    function drawBands() {
      const cx = width / 2;
      const cy = height / 2;
      const D = Math.hypot(width, height);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((P.angle * Math.PI) / 180);
      ctx.translate(-D / 2, -D / 2);
      const total = Math.ceil(D / P.band) + 3;
      const seg = 14; // sampling step along the band edges
      const t = P.band * P.fillRatio;
      for (let i = -1; i < total; i++) {
        const y0 = i * P.band + (P.band - t) / 2;
        ctx.fillStyle = bandColor(i + 1, total + 1);
        ctx.beginPath();
        for (let x = -seg; x <= D + seg; x += seg) {
          const y = y0 + offsetAt(x, i);
          x === -seg ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        for (let x = D + seg; x >= -seg; x -= seg) {
          ctx.lineTo(x, y0 + t + offsetAt(x, i));
        }
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    function drawScales() {
      const r = P.band;
      const rowStep = Math.max(6, r * P.fillRatio);
      const rows = Math.ceil(height / rowStep) + 2;
      const cols = Math.ceil(width / r) + 2;
      let row = 0;
      for (let j = -1; j < rows; j++) {
        const y = j * rowStep;
        const shift = j % 2 === 0 ? 0 : r / 2;
        for (let i = -1; i < cols; i++) {
          const x = i * r + shift + (P.wobble ? noise.noise3(i * 0.5, j * 0.5, 0) * r * P.wobble * 0.3 : 0);
          ctx.fillStyle = bandColor(P.colorMode === 'sequence' ? j + 1 : row++, rows * cols);
          ctx.strokeStyle = palette.bg;
          ctx.lineWidth = Math.max(1, r * 0.05);
          ctx.beginPath();
          ctx.arc(x, y, r * 0.72, 0, Math.PI);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      }
    }

    let drawn = false;
    return {
      frame() {
        if (drawn) return false;
        drawn = true;
        ctx.fillStyle = palette.bg;
        ctx.fillRect(0, 0, width, height);
        if (P.style === 'scales') drawScales();
        else drawBands();
        return false;
      },
    };
  },
};

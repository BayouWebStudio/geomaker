// Quasicrystal: sum of N plane waves at evenly spaced angles. The interference
// of an odd number of waves never repeats — it forms a quasiperiodic lattice
// with N-fold symmetry. Interactive: drag to rotate and phase-shift the waves.

import { clamp, samplePalette, hexToRgb } from '../core/util.js';

const MAXW = 720;

export default {
  id: 'quasicrystal',
  name: 'Quasicrystal',
  category: 'Geometric',
  interactive: true,
  hint: 'Drag to rotate the waves and shift the phase',
  description: 'Many plane waves overlaid into a quasiperiodic interference lattice. Drag to spin it.',
  params: [
    { key: 'waves', label: 'Waves (symmetry)', type: 'range', min: 3, max: 12, step: 1, value: 5 },
    { key: 'freq', label: 'Frequency', type: 'range', min: 0.02, max: 0.3, step: 0.005, value: 0.09 },
    { key: 'contrast', label: 'Contrast', type: 'range', min: 0.2, max: 6, step: 0.1, value: 1.6 },
    { key: 'colorMode', label: 'Color', type: 'select', value: 'duotone', options: [
      { value: 'duotone', label: 'duotone' },
      { value: 'spectrum', label: 'spectrum' },
    ] },
  ],

  create({ ctx, width, height, palette, params }) {
    const P = params;
    const scale = Math.min(1, MAXW / width);
    const gw = Math.max(2, Math.round(width * scale));
    const gh = Math.max(2, Math.round(height * scale));
    const off = document.createElement('canvas');
    off.width = gw;
    off.height = gh;
    const octx = off.getContext('2d');
    const img = octx.createImageData(gw, gh);
    const data = img.data;
    for (let i = 3; i < data.length; i += 4) data[i] = 255;

    const N = Math.round(P.waves);
    let rot = 0;
    let phase = 0;
    let dirty = true;

    const stops =
      P.colorMode === 'spectrum'
        ? [palette.bg, ...palette.colors, palette.colors[0]]
        : [palette.bg, samplePalette(palette.colors, 0.55), samplePalette(palette.colors, 1)];
    const lut = [];
    for (let i = 0; i < 256; i++) lut.push(hexToRgb(samplePalette(stops, i / 255)));

    function render() {
      const sx = width / gw;
      const sy = height / gh;
      const cosA = [];
      const sinA = [];
      for (let k = 0; k < N; k++) {
        const a = rot + (k * Math.PI) / N;
        cosA.push(Math.cos(a));
        sinA.push(Math.sin(a));
      }
      for (let y = 0; y < gh; y++) {
        for (let x = 0; x < gw; x++) {
          const px = (x * sx - width / 2) * P.freq;
          const py = (y * sy - height / 2) * P.freq;
          let sum = 0;
          for (let k = 0; k < N; k++) sum += Math.cos(px * cosA[k] + py * sinA[k] + phase);
          // map sum (~[-N,N]) through a soft contrast curve to [0,1]
          let v = 0.5 + 0.5 * Math.tanh((sum / N) * P.contrast);
          const j = clamp(v * 255, 0, 255) | 0;
          const [r, g, b] = lut[j];
          const idx = (y * gw + x) * 4;
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
        }
      }
      octx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(off, 0, 0, width, height);
    }

    return {
      frame() {
        if (dirty) {
          render();
          dirty = false;
        }
        return true;
      },
      onMove(x, y, dx, dy) {
        rot += dx * 0.004;
        phase += dy * 0.01;
        dirty = true;
      },
    };
  },
};

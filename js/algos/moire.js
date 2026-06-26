// Moiré: two overlaid gratings (rings or lines). Where one's crests fall between
// the other's, interference fringes bloom. Computed in a capped-resolution field
// and upscaled to the canvas.
// Interactive: drag to move the second grating's center and shimmer the moiré.

import { clamp, samplePalette, hexToRgb } from '../core/util.js';

const MAXW = 760; // cap the compute width; the field is upscaled to the canvas

export default {
  id: 'moire',
  name: 'Moiré',
  category: 'Geometric',
  interactive: true,
  hint: 'Drag to move the second layer and shift the interference',
  description: 'Interference fringes from two overlaid gratings. Drag to move one layer and shimmer the moiré.',
  params: [
    {
      key: 'pattern', label: 'Grating', type: 'select', value: 'rings',
      options: [
        { value: 'rings', label: 'concentric rings' },
        { value: 'lines', label: 'parallel lines' },
      ],
    },
    { key: 'freq', label: 'Frequency', type: 'range', min: 0.02, max: 0.4, step: 0.005, value: 0.12 },
    { key: 'offset', label: 'Layer offset', type: 'range', min: 2, max: 200, step: 1, value: 40 },
    { key: 'angle', label: 'Layer 2 rotation°', type: 'range', min: 0, max: 90, step: 0.5, value: 6 },
    {
      key: 'blend', label: 'Combine', type: 'select', value: 'multiply',
      options: [
        { value: 'multiply', label: 'multiply' },
        { value: 'xor', label: 'xor' },
        { value: 'average', label: 'average' },
      ],
    },
    { key: 'softness', label: 'Softness', type: 'range', min: 0, max: 1, step: 0.05, value: 0.4 },
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

    let c1x = width * 0.5;
    let c1y = height * 0.5;
    let c2x = width * 0.5 + P.offset;
    let c2y = height * 0.5;
    let dirty = true;

    const stops = [palette.bg, samplePalette(palette.colors, 0.5), samplePalette(palette.colors, 1)];
    const lut = [];
    for (let i = 0; i < 256; i++) lut.push(hexToRgb(samplePalette(stops, i / 255)));

    const a2 = (P.angle * Math.PI) / 180;
    const cos2 = Math.cos(a2);
    const sin2 = Math.sin(a2);

    function wave(px, py, cxx, cyy, rotated) {
      if (P.pattern === 'rings') {
        const dx = px - cxx;
        const dy = py - cyy;
        return 0.5 + 0.5 * Math.cos(Math.sqrt(dx * dx + dy * dy) * P.freq);
      }
      const dx = px - cxx;
      const dy = py - cyy;
      const u = rotated ? dx * cos2 + dy * sin2 : dx;
      return 0.5 + 0.5 * Math.cos(u * P.freq);
    }

    function render() {
      const sx = width / gw;
      const sy = height / gh;
      const k = 1 + (1 - P.softness) * 8; // harden toward crisp bands as softness drops
      for (let y = 0; y < gh; y++) {
        for (let x = 0; x < gw; x++) {
          const px = x * sx;
          const py = y * sy;
          const a = wave(px, py, c1x, c1y, false);
          const b = wave(px, py, c2x, c2y, true);
          let v;
          if (P.blend === 'multiply') v = a * b;
          else if (P.blend === 'xor') v = Math.abs(a - b);
          else v = (a + b) / 2;
          if (P.softness < 1) v = 1 / (1 + Math.exp(-(v - 0.5) * k));
          const j = clamp(v * 255, 0, 255) | 0;
          const [r, g, bb] = lut[j];
          const idx = (y * gw + x) * 4;
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = bb;
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
      onDown(x, y) {
        c2x = x;
        c2y = y;
        dirty = true;
      },
      onMove(x, y) {
        c2x = x;
        c2y = y;
        dirty = true;
      },
    };
  },
};

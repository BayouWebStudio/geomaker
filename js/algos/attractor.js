// Strange Attractor: millions of iterations of a 4-parameter chaotic map
// (Clifford / de Jong), accumulated into a density buffer and tone-mapped with
// a log curve — the orbit condenses into smoke-like filaments. Progressive:
// each frame adds iterations and re-exposes. Drag to bend the parameters.

import { clamp, samplePalette, hexToRgb } from '../core/util.js';

const MAXW = 860; // density-buffer cap; upscaled to the canvas

export default {
  id: 'attractor',
  name: 'Strange Attractor',
  category: 'Fractal',
  interactive: true,
  hint: 'Drag ↔↕ to bend the attractor parameters',
  description: 'A chaotic map iterated millions of times — orbits condense into smoke-like filaments. Drag to reshape.',
  params: [
    {
      key: 'type', label: 'Map', type: 'select', value: 'clifford',
      options: [
        { value: 'clifford', label: 'Clifford' },
        { value: 'dejong', label: 'de Jong' },
      ],
    },
    { key: 'a', label: 'a', type: 'range', min: -3, max: 3, step: 0.01, value: -1.7 },
    { key: 'b', label: 'b', type: 'range', min: -3, max: 3, step: 0.01, value: 1.8 },
    { key: 'c', label: 'c', type: 'range', min: -3, max: 3, step: 0.01, value: -1.9 },
    { key: 'd', label: 'd', type: 'range', min: -3, max: 3, step: 0.01, value: -0.4 },
    { key: 'seedParams', label: 'Seed picks a/b/c/d', type: 'checkbox', value: true },
    { key: 'budget', label: 'Iterations (millions)', type: 'range', min: 1, max: 16, step: 1, value: 6 },
    { key: 'exposure', label: 'Exposure', type: 'range', min: 0.3, max: 3, step: 0.05, value: 1 },
    {
      key: 'colorMode', label: 'Tone', type: 'select', value: 'gradient',
      options: [
        { value: 'gradient', label: 'palette by density' },
        { value: 'mono', label: 'single ink' },
      ],
    },
  ],

  create({ ctx, width, height, rng, palette, params }) {
    const P = params;
    // seeded parameters land in ranges that reliably produce structure
    let a = P.seedParams ? rng.range(1.2, 2.6) * (rng.random() < 0.5 ? -1 : 1) : P.a;
    let b = P.seedParams ? rng.range(1.2, 2.6) * (rng.random() < 0.5 ? -1 : 1) : P.b;
    let c = P.seedParams ? rng.range(0.6, 2.2) * (rng.random() < 0.5 ? -1 : 1) : P.c;
    let d = P.seedParams ? rng.range(0.6, 2.2) * (rng.random() < 0.5 ? -1 : 1) : P.d;

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

    let density = new Float32Array(gw * gh);
    let x = 0.1;
    let y = 0.1;
    let done = 0;
    const total = P.budget * 1e6;
    const PER_FRAME = 140000;

    const stops = P.colorMode === 'mono'
      ? [palette.bg, samplePalette(palette.colors, 0.8)]
      : [palette.bg, ...palette.colors];
    const lut = [];
    for (let i = 0; i < 256; i++) lut.push(hexToRgb(samplePalette(stops, i / 255)));

    function restart() {
      density = new Float32Array(gw * gh);
      x = 0.1;
      y = 0.1;
      done = 0;
    }

    function iterate(count) {
      // extent of the map: |x| <= 1+|c|, |y| <= 1+|d| (clifford); dejong is ±2
      const clifford = P.type === 'clifford';
      const exX = clifford ? 1 + Math.abs(c) : 2.05;
      const exY = clifford ? 1 + Math.abs(d) : 2.05;
      const sx = (gw - 2) / (2 * exX);
      const sy = (gh - 2) / (2 * exY);
      const s = Math.min(sx, sy);
      const oxp = gw / 2;
      const oyp = gh / 2;
      for (let i = 0; i < count; i++) {
        let nx, ny;
        if (clifford) {
          nx = Math.sin(a * y) + c * Math.cos(a * x);
          ny = Math.sin(b * x) + d * Math.cos(b * y);
        } else {
          nx = Math.sin(a * y) - Math.cos(b * x);
          ny = Math.sin(c * x) - Math.cos(d * y);
        }
        x = nx;
        y = ny;
        const px = (oxp + x * s) | 0;
        const py = (oyp + y * s) | 0;
        if (px >= 0 && px < gw && py >= 0 && py < gh) density[py * gw + px] += 1;
      }
    }

    function expose() {
      let max = 0;
      for (let i = 0; i < density.length; i++) if (density[i] > max) max = density[i];
      const inv = max > 0 ? 1 / Math.log(1 + max) : 0;
      for (let i = 0; i < density.length; i++) {
        const v = clamp(Math.log(1 + density[i]) * inv * P.exposure, 0, 1);
        const j = (v * 255) | 0;
        const p = i * 4;
        const ccc = lut[j];
        data[p] = ccc[0];
        data[p + 1] = ccc[1];
        data[p + 2] = ccc[2];
      }
      octx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(off, 0, 0, width, height);
    }

    iterate(200); // warm-up, don't plot transient — cheap enough to just run
    return {
      frame() {
        if (done >= total) return true; // stay live for dragging
        iterate(PER_FRAME);
        done += PER_FRAME;
        expose();
        return true;
      },
      onMove(xx, yy, dx, dy) {
        a = clamp(a + dx * 0.0012, -3, 3);
        b = clamp(b + dy * 0.0012, -3, 3);
        restart();
      },
    };
  },
};

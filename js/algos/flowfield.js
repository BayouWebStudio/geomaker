// Silk Flow: particles advected through a layered Perlin angle field.
// Low-alpha strokes accumulate frame over frame into silky ribbons.

import { samplePalette, withAlpha } from '../core/util.js';

const BUCKETS = 32; // strokes are batched into quantized color buckets per frame

export default {
  id: 'flow',
  name: 'Silk Flow',
  description: 'Thousands of particles ride a hidden noise field, weaving silky ribbons.',
  params: [
    { key: 'particles', label: 'Particles', type: 'range', min: 200, max: 6000, step: 100, value: 2400 },
    { key: 'noiseScale', label: 'Noise scale', type: 'range', min: 0.0004, max: 0.012, step: 0.0002, value: 0.0024 },
    { key: 'octaves', label: 'Detail (octaves)', type: 'range', min: 1, max: 5, step: 1, value: 2 },
    { key: 'swirl', label: 'Swirl', type: 'range', min: 0.3, max: 6, step: 0.1, value: 2.2 },
    { key: 'speed', label: 'Flow speed', type: 'range', min: 0.4, max: 5, step: 0.1, value: 1.6 },
    { key: 'lineWidth', label: 'Stroke width', type: 'range', min: 0.3, max: 5, step: 0.1, value: 0.9 },
    { key: 'alpha', label: 'Ink opacity', type: 'range', min: 0.02, max: 0.5, step: 0.01, value: 0.09 },
    { key: 'ink', label: 'Ink amount', type: 'range', min: 80, max: 1500, step: 20, value: 420 },
    {
      key: 'colorMode', label: 'Color by', type: 'select', value: 'angle',
      options: [
        { value: 'angle', label: 'flow angle' },
        { value: 'radial', label: 'distance from center' },
        { value: 'horizontal', label: 'horizontal position' },
        { value: 'particle', label: 'per particle' },
      ],
    },
    {
      key: 'edges', label: 'At the edges', type: 'select', value: 'wrap',
      options: [
        { value: 'wrap', label: 'wrap around' },
        { value: 'respawn', label: 'respawn' },
      ],
    },
  ],

  create({ ctx, width, height, rng, noise, palette, params }) {
    const P = params;
    const n = Math.round(P.particles);
    const xs = new Float32Array(n);
    const ys = new Float32Array(n);
    const age = new Float32Array(n);
    const maxAge = new Float32Array(n);
    const colorT = new Float32Array(n);
    const cx = width / 2;
    const cy = height / 2;
    const maxR = Math.hypot(cx, cy);
    const halfAngle = Math.PI * P.swirl;

    const spawn = (i) => {
      xs[i] = rng.random() * width;
      ys[i] = rng.random() * height;
      age[i] = 0;
      maxAge[i] = rng.range(100, 500);
      colorT[i] = rng.random();
    };
    for (let i = 0; i < n; i++) spawn(i);

    const buckets = Array.from({ length: BUCKETS + 1 }, () => []);
    ctx.lineCap = 'round';
    let frames = 0;

    return {
      frame() {
        if (frames++ >= P.ink) return false;
        for (const b of buckets) b.length = 0;

        for (let i = 0; i < n; i++) {
          const x = xs[i];
          const y = ys[i];
          const a = noise.fbm(x * P.noiseScale, y * P.noiseScale, 0, P.octaves) * halfAngle;
          let nx = x + Math.cos(a) * P.speed;
          let ny = y + Math.sin(a) * P.speed;
          let jump = false;

          if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
            jump = true;
            if (P.edges === 'wrap') {
              nx = (nx + width) % width;
              ny = (ny + height) % height;
            } else {
              xs[i] = nx;
              ys[i] = ny;
              spawn(i);
              continue;
            }
          }
          if (age[i]++ > maxAge[i]) {
            spawn(i);
            continue;
          }

          if (!jump) {
            let t;
            if (P.colorMode === 'angle') t = (a / halfAngle + 1) / 2;
            else if (P.colorMode === 'radial') t = Math.hypot(x - cx, y - cy) / maxR;
            else if (P.colorMode === 'horizontal') t = x / width;
            else t = colorT[i];
            buckets[Math.round(Math.max(0, Math.min(1, t)) * BUCKETS)].push(x, y, nx, ny);
          }
          xs[i] = nx;
          ys[i] = ny;
        }

        ctx.lineWidth = P.lineWidth;
        for (let b = 0; b <= BUCKETS; b++) {
          const segs = buckets[b];
          if (!segs.length) continue;
          ctx.strokeStyle = withAlpha(samplePalette(palette.colors, b / BUCKETS), P.alpha);
          ctx.beginPath();
          for (let s = 0; s < segs.length; s += 4) {
            ctx.moveTo(segs[s], segs[s + 1]);
            ctx.lineTo(segs[s + 2], segs[s + 3]);
          }
          ctx.stroke();
        }
        return true;
      },
    };
  },
};

// Dotwork: weighted stippling. Dots are placed by rejection-sampling a density
// field, with an optional even-spacing pass (Poisson-disc-style, radius scaled
// by local density) so the result reads like hand-poked dotwork or engraving
// stipple rather than uniform noise.

import { TAU, clamp, samplePalette } from '../core/util.js';

export default {
  id: 'stipple',
  name: 'Dotwork',
  category: 'Organic',
  interactive: true,
  symmetry: true,
  hint: 'drag to push the dots aside like sand',
  description: 'Weighted stippling — density-driven dot fields, like hand-poked dotwork. Drag to push the dots like sand.',
  params: [
    {
      key: 'field', label: 'Density field', type: 'select', value: 'noise',
      options: [
        { value: 'noise', label: 'noise clouds' },
        { value: 'radial', label: 'radial fade' },
        { value: 'rings', label: 'concentric rings' },
        { value: 'linear', label: 'vertical fade' },
      ],
    },
    { key: 'dots', label: 'Dot count', type: 'range', min: 1000, max: 40000, step: 500, value: 14000 },
    { key: 'fieldScale', label: 'Field scale', type: 'range', min: 0.0008, max: 0.012, step: 0.0002, value: 0.003 },
    { key: 'contrast', label: 'Contrast', type: 'range', min: 0.4, max: 4, step: 0.05, value: 1.6 },
    { key: 'dotMin', label: 'Dot size (sparse)', type: 'range', min: 0.2, max: 3, step: 0.1, value: 0.5 },
    { key: 'dotMax', label: 'Dot size (dense)', type: 'range', min: 0.6, max: 6, step: 0.1, value: 2.2 },
    { key: 'spacing', label: 'Even spacing', type: 'checkbox', value: true },
    { key: 'invert', label: 'Invert field', type: 'checkbox', value: false },
    {
      key: 'colorMode', label: 'Ink', type: 'select', value: 'single',
      options: [
        { value: 'single', label: 'single ink' },
        { value: 'field', label: 'gradient by density' },
      ],
    },
  ],

  create({ ctx, width, height, rng, noise, palette, params }) {
    const P = params;
    const cx = width / 2;
    const cy = height / 2;
    const maxR = Math.hypot(cx, cy) || 1;

    function density(x, y) {
      let f;
      if (P.field === 'radial') f = 1 - Math.hypot(x - cx, y - cy) / maxR;
      else if (P.field === 'rings') f = 0.5 + 0.5 * Math.sin(Math.hypot(x - cx, y - cy) * P.fieldScale * 24);
      else if (P.field === 'linear') f = 1 - y / height;
      else f = 0.5 + 0.5 * noise.fbm(x * P.fieldScale, y * P.fieldScale, 0, 3);
      f = clamp(f, 0, 1);
      if (P.invert) f = 1 - f;
      return Math.pow(f, P.contrast);
    }

    // spatial grid for the even-spacing test; min distance shrinks where dense
    const CELL = 6;
    const gw = Math.ceil(width / CELL);
    const gh = Math.ceil(height / CELL);
    const grid = new Array(gw * gh);
    const baseGap = Math.sqrt((width * height) / P.dots) * 0.9;

    function farEnough(x, y, gap) {
      const g2 = gap * gap;
      const gx = Math.floor(x / CELL);
      const gy = Math.floor(y / CELL);
      const reach = Math.ceil(gap / CELL);
      for (let oy = -reach; oy <= reach; oy++) {
        const yy = gy + oy;
        if (yy < 0 || yy >= gh) continue;
        for (let ox = -reach; ox <= reach; ox++) {
          const xx = gx + ox;
          if (xx < 0 || xx >= gw) continue;
          const bucket = grid[yy * gw + xx];
          if (!bucket) continue;
          for (let i = 0; i < bucket.length; i += 2) {
            const dx = x - bucket[i];
            const dy = y - bucket[i + 1];
            if (dx * dx + dy * dy < g2) return false;
          }
        }
      }
      return true;
    }

    const ink = samplePalette(palette.colors, 0.75);
    const dots = []; // {x, y, r, color} — kept so touch can push them around
    let placed = 0;
    let attempts = 0;
    const maxAttempts = P.dots * 30;
    let dirty = false;

    function drawDot(d) {
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, TAU);
      ctx.fillStyle = d.color;
      ctx.fill();
    }

    function redraw() {
      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, width, height);
      for (const d of dots) drawDot(d);
    }

    return {
      frame() {
        const batch = 900;
        let n = 0;
        while (n < batch && placed < P.dots && attempts < maxAttempts) {
          attempts++;
          const x = rng.random() * width;
          const y = rng.random() * height;
          const f = density(x, y);
          if (rng.random() > f) continue;
          if (P.spacing) {
            const gap = baseGap / (0.25 + f);
            if (!farEnough(x, y, gap)) continue;
            const gi = Math.floor(y / CELL) * gw + Math.floor(x / CELL);
            (grid[gi] || (grid[gi] = [])).push(x, y);
          }
          const dot = {
            x, y,
            r: P.dotMin + (P.dotMax - P.dotMin) * f,
            color: P.colorMode === 'field' ? samplePalette(palette.colors, f) : ink,
          };
          dots.push(dot);
          drawDot(dot);
          placed++;
          n++;
        }
        if (dirty) {
          redraw();
          dirty = false;
        }
        return true; // stay live so drags can push the dots
      },
      onMove(x, y) {
        // push dots out of a soft disc under the finger, like combing sand
        const R = Math.min(width, height) * 0.14;
        const R2 = R * R;
        for (const d of dots) {
          const dx = d.x - x;
          const dy = d.y - y;
          const d2 = dx * dx + dy * dy;
          if (d2 > R2 || d2 < 0.01) continue;
          const dist = Math.sqrt(d2);
          const push = ((R - dist) / dist) * 0.85;
          d.x = clamp(d.x + dx * push, 1, width - 1);
          d.y = clamp(d.y + dy * push, 1, height - 1);
        }
        dirty = true;
      },
    };
  },
};

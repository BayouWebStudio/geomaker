// Op Art: bold optical-illusion graphics — concentric rings, rotating square
// tunnels, Riley-style wavy line fields and bulge-warped checkerboards.
// Drag the canvas to move the focal point of the illusion.

import { TAU, samplePalette } from '../core/util.js';

export default {
  id: 'opart',
  name: 'Op Art',
  category: 'Geometric',
  interactive: true,
  hint: 'drag to move the focal point of the illusion',
  description: 'Optical illusions: bulging checkers, concentric rings, square tunnels and wavy Riley lines — drag the focus around.',
  params: [
    {
      key: 'style', label: 'Style', type: 'select', value: 'checker',
      options: [
        { value: 'checker', label: 'bulging checker' },
        { value: 'rings', label: 'concentric rings' },
        { value: 'tunnel', label: 'square tunnel' },
        { value: 'riley', label: 'wavy lines' },
      ],
    },
    { key: 'scale', label: 'Scale', type: 'range', min: 10, max: 90, step: 2, value: 34 },
    { key: 'bulge', label: 'Bulge / warp', type: 'range', min: 0, max: 1, step: 0.05, value: 0.55 },
    { key: 'twist', label: 'Twist', type: 'range', min: 0, max: 1, step: 0.05, value: 0.35 },
    { key: 'duty', label: 'Line fill ratio', type: 'range', min: 0.15, max: 0.85, step: 0.05, value: 0.5 },
    {
      key: 'colorMode', label: 'Color by', type: 'select', value: 'duotone',
      options: [
        { value: 'duotone', label: 'duotone' },
        { value: 'gradient', label: 'gradient' },
      ],
    },
  ],

  create({ ctx, width, height, rng, noise, palette, params }) {
    const P = params;
    const colors = palette.colors;
    const maxR = Math.hypot(width / 2, height / 2);

    // the focal point of the illusion — draggable
    let fx = width / 2;
    let fy = height / 2;

    function tone(i, total) {
      if (P.colorMode === 'gradient') return samplePalette(colors, total > 1 ? i / (total - 1) : 0);
      return i % 2 === 0 ? colors[0] : colors[colors.length - 1];
    }

    // radial bulge: fisheye pushing space out from the focal point
    function warp(x, y) {
      const dx = x - fx;
      const dy = y - fy;
      const r = Math.hypot(dx, dy) / maxR;
      if (r === 0 || P.bulge === 0) return [x, y];
      const k = Math.pow(r, 1 - P.bulge * 0.8) / r;
      return [fx + dx * k, fy + dy * k];
    }

    function drawChecker() {
      const s = P.scale;
      const cols = Math.ceil(width / s) + 2;
      const rows = Math.ceil(height / s) + 2;
      for (let j = -1; j < rows; j++) {
        for (let i = -1; i < cols; i++) {
          ctx.fillStyle = tone(i + j, 2);
          ctx.beginPath();
          // subdivide each cell edge so the warp bends it smoothly
          const pts = [];
          const corners = [
            [i * s, j * s], [(i + 1) * s, j * s],
            [(i + 1) * s, (j + 1) * s], [i * s, (j + 1) * s],
          ];
          for (let e = 0; e < 4; e++) {
            const [x0, y0] = corners[e];
            const [x1, y1] = corners[(e + 1) % 4];
            for (let t = 0; t < 4; t++) pts.push(warp(x0 + ((x1 - x0) * t) / 4, y0 + ((y1 - y0) * t) / 4));
          }
          pts.forEach(([x, y], n) => (n === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
          ctx.closePath();
          ctx.fill();
        }
      }
    }

    function drawRings() {
      const step = P.scale;
      const reach = maxR + Math.hypot(fx - width / 2, fy - height / 2);
      const n = Math.ceil(reach / step) + 1;
      for (let i = n; i >= 0; i--) {
        ctx.fillStyle = tone(i, n + 1);
        ctx.beginPath();
        // rings distorted by a slow noise wobble
        const segs = 90;
        for (let a = 0; a <= segs; a++) {
          const ang = (a / segs) * TAU;
          const w = 1 + noise.noise3(Math.cos(ang) * 0.7, Math.sin(ang) * 0.7, i * 0.22) * P.bulge * 0.35;
          const r = i * step * w;
          const x = fx + Math.cos(ang) * r;
          const y = fy + Math.sin(ang) * r;
          a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
      }
    }

    function drawTunnel() {
      const n = Math.ceil(maxR / P.scale) + 2;
      const base = Math.max(width, height) * 1.5;
      for (let i = 0; i < n; i++) {
        const t = i / n;
        const size = base * Math.pow(1 - t, 1.6) + 4;
        const rot = i * P.twist * 0.22;
        ctx.fillStyle = tone(i, n);
        ctx.save();
        // deeper squares slide toward the focal point — a leaning tunnel
        ctx.translate(
          width / 2 + (fx - width / 2) * t,
          height / 2 + (fy - height / 2) * t
        );
        ctx.rotate(rot);
        ctx.fillRect(-size / 2, -size / 2, size, size);
        ctx.restore();
      }
    }

    function drawRiley() {
      const spacing = P.scale * 0.55;
      const n = Math.ceil(width / spacing) + 2;
      ctx.lineWidth = spacing * P.duty;
      ctx.lineCap = 'round';
      const phase = (fx / width) * TAU;
      const ampK = 0.4 + 1.6 * (fy / height);
      for (let i = -1; i < n; i++) {
        ctx.strokeStyle = tone(i, n);
        ctx.beginPath();
        for (let y = -10; y <= height + 10; y += 6) {
          const ph = noise.noise3(0.4, i * 0.05, y * 0.002) * 3;
          const x = i * spacing
            + Math.sin((y / height) * TAU * (1 + P.twist * 2.5) + i * 0.18 + ph + phase)
              * spacing * P.bulge * 1.6 * ampK;
          y <= -10 + 6 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }

    function draw() {
      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, width, height);
      if (P.style === 'checker') drawChecker();
      else if (P.style === 'rings') drawRings();
      else if (P.style === 'tunnel') drawTunnel();
      else drawRiley();
    }

    let dirty = true;
    return {
      frame() {
        if (dirty) {
          draw();
          dirty = false;
        }
        return true; // stay live so the focal point can be dragged
      },
      onDown(x, y) {
        fx = x;
        fy = y;
        dirty = true;
      },
      onMove(x, y) {
        fx = x;
        fy = y;
        dirty = true;
      },
    };
  },
};

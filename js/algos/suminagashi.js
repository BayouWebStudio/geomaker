// Suminagashi: Japanese ink marbling. Each "drop" is an area-preserving map
// that expands all existing ink outward to make room for a new colored ring;
// tine/comb strokes shear the rings into the classic flowing waves.
// Interactive: tap to drop ink, drag to comb the surface.

import { TAU, samplePalette, mixHex } from '../core/util.js';

const VERTS = 220; // vertices per ink ring — enough to stay smooth when stretched

export default {
  id: 'suminagashi',
  name: 'Suminagashi',
  category: 'Organic',
  interactive: true,
  hint: 'Tap to drop ink · drag to comb the surface',
  description: 'Japanese ink marbling — concentric drops sheared into flowing waves. Tap and drag to play.',
  params: [
    {
      key: 'layout', label: 'Initial drops', type: 'select', value: 'concentric',
      options: [
        { value: 'concentric', label: 'concentric (tree rings)' },
        { value: 'scattered', label: 'scattered' },
      ],
    },
    { key: 'drops', label: 'Drop count', type: 'range', min: 4, max: 60, step: 1, value: 30 },
    { key: 'dropSize', label: 'Drop size', type: 'range', min: 12, max: 90, step: 2, value: 46 },
    { key: 'combs', label: 'Initial combing', type: 'range', min: 0, max: 12, step: 1, value: 6 },
    { key: 'combStrength', label: 'Comb strength', type: 'range', min: 0, max: 120, step: 4, value: 64 },
    { key: 'brush', label: 'Brush size (drag)', type: 'range', min: 20, max: 220, step: 5, value: 90 },
    { key: 'outline', label: 'Ink outlines', type: 'checkbox', value: false },
    {
      key: 'colorMode', label: 'Colors', type: 'select', value: 'alternate',
      options: [
        { value: 'alternate', label: 'alternate inks' },
        { value: 'sequential', label: 'palette sequence' },
        { value: 'random', label: 'random' },
      ],
    },
  ],

  create({ ctx, width, height, rng, palette, params }) {
    const P = params;
    const drops = []; // { color, x:Float64Array, y:Float64Array }
    let dirty = true;

    const colorFor = (i) => {
      if (P.colorMode === 'random') return samplePalette(palette.colors, rng.random());
      if (P.colorMode === 'sequential') return samplePalette(palette.colors, (i / 8) % 1);
      return palette.colors[i % palette.colors.length];
    };

    // area-preserving ink drop: push all existing points outward, then add a ring
    function addDrop(cx, cy, r, color) {
      for (const d of drops) {
        const xs = d.x;
        const ys = d.y;
        for (let i = 0; i < xs.length; i++) {
          const ox = xs[i] - cx;
          const oy = ys[i] - cy;
          const d2 = ox * ox + oy * oy || 0.0001;
          const f = Math.sqrt(1 + (r * r) / d2);
          xs[i] = cx + ox * f;
          ys[i] = cy + oy * f;
        }
      }
      const x = new Float64Array(VERTS);
      const y = new Float64Array(VERTS);
      for (let i = 0; i < VERTS; i++) {
        const a = (i / VERTS) * TAU;
        x[i] = cx + Math.cos(a) * r;
        y[i] = cy + Math.sin(a) * r;
      }
      drops.push({ color, x, y });
      dirty = true;
    }

    // tine line: displace all points along the line direction, falling off with
    // perpendicular distance — the classic comb that makes non-pareil waves
    function tine(horizontal, cross, amp, decay) {
      for (const d of drops) {
        const xs = d.x;
        const ys = d.y;
        for (let i = 0; i < xs.length; i++) {
          if (horizontal) xs[i] += amp * Math.exp(-Math.abs(ys[i] - cross) / decay);
          else ys[i] += amp * Math.exp(-Math.abs(xs[i] - cross) / decay);
        }
      }
      dirty = true;
    }

    // localized directional drag — like pulling a stylus through the ink
    function smudge(bx, by, dx, dy, sigma) {
      const inv = 1 / (2 * sigma * sigma);
      for (const d of drops) {
        const xs = d.x;
        const ys = d.y;
        for (let i = 0; i < xs.length; i++) {
          const ex = xs[i] - bx;
          const ey = ys[i] - by;
          const w = Math.exp(-(ex * ex + ey * ey) * inv);
          xs[i] += dx * w;
          ys[i] += dy * w;
        }
      }
      dirty = true;
    }

    // ---- seeded starting composition ----
    const cx0 = width / 2;
    const cy0 = height / 2;
    const n = Math.round(P.drops);
    for (let i = 0; i < n; i++) {
      let dx, dy;
      if (P.layout === 'concentric') {
        // small drift keeps the rings nested but slightly off-center / organic
        dx = cx0 + rng.range(-P.dropSize, P.dropSize) * 0.32;
        dy = cy0 + rng.range(-P.dropSize, P.dropSize) * 0.32;
      } else {
        dx = rng.range(width * 0.18, width * 0.82);
        dy = rng.range(height * 0.18, height * 0.82);
      }
      addDrop(dx, dy, P.dropSize * rng.range(0.8, 1.2), colorFor(i));
    }
    for (let i = 0; i < Math.round(P.combs); i++) {
      const horizontal = rng.random() < 0.5;
      const cross = horizontal ? rng.range(0, height) : rng.range(0, width);
      const amp = P.combStrength * (rng.random() < 0.5 ? 1 : -1);
      tine(horizontal, cross, amp, P.brush);
    }

    function render() {
      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, width, height);
      for (const d of drops) {
        const xs = d.x;
        const ys = d.y;
        ctx.beginPath();
        ctx.moveTo(xs[0], ys[0]);
        for (let i = 1; i < xs.length; i++) ctx.lineTo(xs[i], ys[i]);
        ctx.closePath();
        ctx.fillStyle = d.color;
        ctx.fill();
        if (P.outline) {
          ctx.strokeStyle = mixHex(d.color, '#000000', 0.3);
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }

    let nextColor = n;
    return {
      frame() {
        if (dirty) {
          render();
          dirty = false;
        }
        return true; // stay live for interaction
      },
      onMove(x, y, dx, dy) {
        smudge(x, y, dx, dy, P.brush);
      },
      onUp(x, y, dist) {
        if (dist < 6) addDrop(x, y, P.dropSize, colorFor(nextColor++)); // a tap drops ink
      },
    };
  },
};

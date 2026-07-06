// Terrazzo: café-floor stone — angular polygon chips scattered in a grout
// field with a dusting of fine speckles. Dart-throwing placement with overlap
// rejection keeps the chips comfortably spaced. Interactive: drag a chip and
// the floor shoves around your finger; tap to set a new chip.

import { TAU, samplePalette, mixHex, clamp } from '../core/util.js';

export default {
  id: 'terrazzo',
  name: 'Terrazzo',
  category: 'Organic',
  interactive: true,
  symmetry: true,
  hint: 'drag a chip and the floor shoves aside · tap to set a new chip',
  description: 'Speckled stone floor: angular chips in a grout field — drag one and the neighbours shove aside.',
  params: [
    { key: 'chip', label: 'Chip size', type: 'range', min: 6, max: 64, step: 1, value: 22 },
    { key: 'coverage', label: 'Coverage', type: 'range', min: 0.2, max: 1, step: 0.05, value: 0.7 },
    { key: 'sizeVar', label: 'Size variation', type: 'range', min: 0, max: 1, step: 0.05, value: 0.6 },
    { key: 'angularity', label: 'Angularity', type: 'range', min: 0, max: 1, step: 0.05, value: 0.6 },
    { key: 'speckles', label: 'Speckle dust', type: 'range', min: 0, max: 1, step: 0.05, value: 0.5 },
    { key: 'outline', label: 'Outline width', type: 'range', min: 0, max: 6, step: 0.5, value: 0 },
    {
      key: 'colorMode', label: 'Color by', type: 'select', value: 'classic',
      options: [
        { value: 'classic', label: 'classic (distinct chips)' },
        { value: 'gradient', label: 'gradient drift' },
        { value: 'tonal', label: 'tonal (single hue)' },
      ],
    },
  ],

  create({ ctx, width, height, rng, palette, params }) {
    const P = params;
    const colors = palette.colors;
    const outlineInk = mixHex(samplePalette(colors, 0.1), '#000000', 0.25);

    function chipColor(x, y) {
      if (P.colorMode === 'gradient') {
        return samplePalette(colors, clamp((x / width) * 0.6 + (y / height) * 0.4 + (rng.random() - 0.5) * 0.15, 0, 1));
      }
      if (P.colorMode === 'tonal') {
        const base = samplePalette(colors, 0.35);
        return mixHex(base, palette.bg, rng.random() * 0.55);
      }
      return colors[rng.int(0, colors.length - 1)];
    }

    // fixed per-chip shape (vertex angles + radii) so redraws are stable
    function makeChip(x, y, r) {
      const verts = [];
      const n = rng.int(4, 7);
      for (let v = 0; v < n; v++) {
        verts.push({
          a: rng.random() * TAU * P.angularity * 0.15 + (v / n) * TAU,
          k: 1 - rng.random() * P.angularity * 0.5,
        });
      }
      return { x, y, r, rot: rng.random() * TAU, verts, color: chipColor(x, y) };
    }

    const chips = [];
    const attempts = Math.min(18000, Math.ceil(((width * height) / (P.chip * P.chip)) * P.coverage * 4));
    for (let n = 0; n < attempts; n++) {
      const r = (P.chip / 2) * (1 + (rng.random() - 0.5) * P.sizeVar * 1.4);
      const x = rng.range(-r, width + r);
      const y = rng.range(-r, height + r);
      let ok = true;
      for (const c of chips) {
        const min = (c.r + r) * 0.82 + 2;
        const dx = c.x - x;
        const dy = c.y - y;
        if (dx * dx + dy * dy < min * min) {
          ok = false;
          break;
        }
      }
      if (ok) chips.push(makeChip(x, y, r));
    }

    const dust = [];
    const dustN = Math.round(((width * height) / 900) * P.speckles);
    for (let n = 0; n < dustN; n++) {
      const x = rng.range(0, width);
      const y = rng.range(0, height);
      dust.push({ x, y, r: rng.range(0.6, 2.2), color: chipColor(x, y) });
    }

    function drawChip(c) {
      ctx.beginPath();
      for (let v = 0; v < c.verts.length; v++) {
        const vert = c.verts[v];
        const px = c.x + Math.cos(c.rot + vert.a) * c.r * vert.k;
        const py = c.y + Math.sin(c.rot + vert.a) * c.r * vert.k;
        v === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = c.color;
      ctx.fill();
      if (P.outline > 0) {
        ctx.strokeStyle = outlineInk;
        ctx.lineWidth = P.outline;
        ctx.lineJoin = 'round';
        ctx.stroke();
      }
    }

    function draw() {
      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, width, height);
      for (const c of chips) drawChip(c);
      for (const d of dust) {
        ctx.fillStyle = d.color;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, TAU);
        ctx.fill();
      }
    }

    // wavefront shove: the dragged chip pushes overlapping neighbours out
    function shove(rootIdx) {
      let wave = [rootIdx];
      const touched = new Set(wave);
      for (let pass = 0; pass < 3 && wave.length; pass++) {
        const next = [];
        for (const mi of wave) {
          const m = chips[mi];
          for (let j = 0; j < chips.length; j++) {
            if (touched.has(j)) continue;
            const s = chips[j];
            const dx = s.x - m.x;
            const dy = s.y - m.y;
            const min = (s.r + m.r) * 0.82 + 2;
            const d = Math.hypot(dx, dy) || 0.001;
            if (d < min) {
              const push = (min - d) / d;
              s.x += dx * push;
              s.y += dy * push;
              touched.add(j);
              next.push(j);
            }
          }
        }
        wave = next;
      }
    }

    let dirty = true;
    const dragIdx = new Map();

    return {
      frame() {
        if (dirty) {
          draw();
          dirty = false;
        }
        return true; // stay live for touch
      },
      onDown(x, y, k = 0) {
        let best = -1;
        let bd = Infinity;
        for (let i = 0; i < chips.length; i++) {
          const d = Math.hypot(x - chips[i].x, y - chips[i].y) - chips[i].r;
          if (d < bd) {
            bd = d;
            best = i;
          }
        }
        dragIdx.set(k, best);
      },
      onMove(x, y, dx, dy, k = 0) {
        const i = dragIdx.get(k);
        if (i === undefined || i < 0) return;
        chips[i].x = x;
        chips[i].y = y;
        shove(i);
        dirty = true;
      },
      onUp(x, y, dist, k = 0) {
        if (dist < 6 && chips.length < 4000) {
          const r = P.chip / 2;
          chips.push(makeChip(x, y, r));
          shove(chips.length - 1);
          dirty = true;
        }
        dragIdx.delete(k);
      },
    };
  },
};

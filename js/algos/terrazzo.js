// Terrazzo: café-floor stone — angular polygon chips scattered in a grout
// field with a dusting of fine speckles. Dart-throwing placement with overlap
// rejection keeps the chips comfortably spaced.

import { TAU, samplePalette, mixHex, clamp } from '../core/util.js';

export default {
  id: 'terrazzo',
  name: 'Terrazzo',
  category: 'Organic',
  description: 'Speckled stone floor: angular chips scattered in a grout field, café-terrazzo style.',
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

    function drawChip(x, y, r, rot) {
      const verts = rng.int(4, 7);
      ctx.beginPath();
      for (let v = 0; v < verts; v++) {
        const a = rot + (v / verts) * TAU + (rng.random() - 0.5) * P.angularity * 0.9;
        const rr = r * (1 - rng.random() * P.angularity * 0.5);
        const px = x + Math.cos(a) * rr;
        const py = y + Math.sin(a) * rr;
        v === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      if (P.outline > 0) {
        ctx.lineWidth = P.outline;
        ctx.lineJoin = 'round';
        ctx.stroke();
      }
    }

    let drawn = false;
    return {
      frame() {
        if (drawn) return false;
        drawn = true;
        ctx.fillStyle = palette.bg;
        ctx.fillRect(0, 0, width, height);

        const outlineInk = mixHex(samplePalette(colors, 0.1), '#000000', 0.25);
        // dart throwing with a coarse bucket grid so rejection stays O(1)
        const cell = P.chip * 1.8;
        const gw = Math.ceil((width + 2 * cell) / cell);
        const buckets = new Map();
        const bucketAt = (x, y) => Math.floor((y + cell) / cell) * gw + Math.floor((x + cell) / cell);
        const attempts = Math.min(18000, Math.ceil(((width * height) / (P.chip * P.chip)) * P.coverage * 4));
        for (let n = 0; n < attempts; n++) {
          const r = (P.chip / 2) * (1 + (rng.random() - 0.5) * P.sizeVar * 1.4);
          const x = rng.range(-r, width + r);
          const y = rng.range(-r, height + r);
          let ok = true;
          const b = bucketAt(x, y);
          for (let dj = -1; dj <= 1 && ok; dj++) {
            for (let di = -1; di <= 1 && ok; di++) {
              const list = buckets.get(b + dj * gw + di);
              if (!list) continue;
              for (const c of list) {
                const min = (c.r + r) * 0.82 + 2;
                const dx = c.x - x;
                const dy = c.y - y;
                if (dx * dx + dy * dy < min * min) {
                  ok = false;
                  break;
                }
              }
            }
          }
          if (!ok) continue;
          const list = buckets.get(b) || [];
          list.push({ x, y, r });
          buckets.set(b, list);
          ctx.fillStyle = chipColor(x, y);
          ctx.strokeStyle = outlineInk;
          drawChip(x, y, r, rng.random() * TAU);
        }

        // fine dust between the chips
        const dust = Math.round(((width * height) / 900) * P.speckles);
        for (let n = 0; n < dust; n++) {
          const x = rng.range(0, width);
          const y = rng.range(0, height);
          ctx.fillStyle = chipColor(x, y);
          ctx.beginPath();
          ctx.arc(x, y, rng.range(0.6, 2.2), 0, TAU);
          ctx.fill();
        }
        return false;
      },
    };
  },
};

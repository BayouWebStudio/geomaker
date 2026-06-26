// Shibori (絞り): Japanese resist tie-dye. Indigo ground with light resist
// motifs — kanoko (fawn spots), arashi (pole-wrap diagonals) or itajime
// (folded-clamp grid). Dye edges are softened for the bleed of real dyeing.
// Interactive: kanoko — paint resist; arashi — drag to set the wrap angle;
// itajime — drag to move the fold.

import { TAU, samplePalette, withAlpha, hexToRgb } from '../core/util.js';

const lum = (hex) => hexToRgb(hex).reduce((a, b) => a + b, 0);

export default {
  id: 'shibori',
  name: 'Shibori (絞り)',
  category: 'Organic',
  interactive: true,
  hint: 'Kanoko: drag to print resist · Arashi/Itajime: drag to fold & angle',
  description: 'Indigo resist tie-dye — fawn-spot kanoko, pole-wrapped arashi, or folded itajime. Drag to dye.',
  params: [
    {
      key: 'style', label: 'Resist', type: 'select', value: 'kanoko',
      options: [
        { value: 'kanoko', label: 'kanoko (fawn spots)' },
        { value: 'arashi', label: 'arashi (diagonal storm)' },
        { value: 'itajime', label: 'itajime (folded clamp)' },
      ],
    },
    { key: 'scale', label: 'Scale', type: 'range', min: 22, max: 130, step: 2, value: 48 },
    { key: 'bleed', label: 'Dye bleed', type: 'range', min: 0.05, max: 0.95, step: 0.05, value: 0.45 },
    { key: 'wobble', label: 'Hand-made wobble', type: 'range', min: 0, max: 1, step: 0.05, value: 0.4 },
    { key: 'angle', label: 'Arashi angle°', type: 'range', min: 0, max: 180, step: 1, value: 35 },
  ],

  create({ ctx, width, height, rng, noise, palette, params }) {
    const P = params;
    // pick the darkest palette colour as the dye, the lightest as the resist
    const cands = [palette.bg, ...palette.colors];
    let dye = cands[0];
    let resist = cands[0];
    let dl = Infinity;
    let rl = -Infinity;
    for (const c of cands) {
      const L = lum(c);
      if (L < dl) {
        dl = L;
        dye = c;
      }
      if (L > rl) {
        rl = L;
        resist = c;
      }
    }
    let dirty = true;
    let angle = P.angle;
    let foldX = width / 2;
    let foldY = height / 2;
    const dots = []; // user-painted kanoko resist points

    function softDot(x, y, r) {
      const g = ctx.createRadialGradient(x, y, r * 0.08, x, y, r);
      g.addColorStop(0, resist);
      g.addColorStop(Math.max(0.02, 1 - P.bleed), resist);
      g.addColorStop(1, withAlpha(resist, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
      ctx.fillStyle = dye; // the tied pinch point stays dyed
      ctx.beginPath();
      ctx.arc(x, y, r * 0.16, 0, TAU);
      ctx.fill();
    }

    function kanoko() {
      const sp = P.scale;
      const r = sp * 0.46;
      for (let y = -sp, row = 0; y < height + sp; y += sp, row++) {
        const off = row % 2 ? sp / 2 : 0;
        for (let x = -sp; x < width + sp; x += sp) {
          const jx = x + off + noise.noise3(x * 0.05, y * 0.05, 0) * sp * 0.3 * P.wobble;
          const jy = y + noise.noise3(x * 0.05, y * 0.05, 9) * sp * 0.3 * P.wobble;
          softDot(jx, jy, r);
        }
      }
      for (const d of dots) softDot(d[0], d[1], r);
    }

    function arashi() {
      const a = (angle * Math.PI) / 180;
      const dx = Math.cos(a);
      const dy = Math.sin(a);
      const nx = -dy;
      const ny = dx;
      const L = Math.hypot(width, height);
      const sp = P.scale;
      let lo = Infinity;
      let hi = -Infinity;
      for (const [px, py] of [[0, 0], [width, 0], [0, height], [width, height]]) {
        const o = (px - foldX) * nx + (py - foldY) * ny;
        lo = Math.min(lo, o);
        hi = Math.max(hi, o);
      }
      for (let o = Math.floor(lo / sp) * sp; o <= hi; o += sp) {
        // a soft resist band: dye -> resist -> dye across its width, wobbled
        const wob = noise.noise3(o * 0.02, 0, 0) * sp * 0.4 * P.wobble;
        const c = o + wob;
        const bx = foldX + c * nx;
        const by = foldY + c * ny;
        const half = sp * 0.5 * (1 - P.bleed * 0.5);
        const gx0 = bx - nx * half;
        const gy0 = by - ny * half;
        const gx1 = bx + nx * half;
        const gy1 = by + ny * half;
        const g = ctx.createLinearGradient(gx0, gy0, gx1, gy1);
        g.addColorStop(0, withAlpha(resist, 0));
        g.addColorStop(0.5, resist);
        g.addColorStop(1, withAlpha(resist, 0));
        ctx.strokeStyle = g;
        ctx.lineWidth = sp;
        ctx.beginPath();
        ctx.moveTo(bx - dx * L, by - dy * L);
        ctx.lineTo(bx + dx * L, by + dy * L);
        ctx.stroke();
      }
    }

    function itajime() {
      const sp = P.scale;
      // soft light bands along the fold lines (where the clamp resists dye)
      const band = sp * (0.5 - P.bleed * 0.3);
      const drawBands = (vertical) => {
        const span = vertical ? width : height;
        const start = (vertical ? foldX : foldY) % sp;
        for (let p = start - sp; p < span + sp; p += sp) {
          const g = vertical
            ? ctx.createLinearGradient(p - band, 0, p + band, 0)
            : ctx.createLinearGradient(0, p - band, 0, p + band);
          g.addColorStop(0, withAlpha(resist, 0));
          g.addColorStop(0.5, resist);
          g.addColorStop(1, withAlpha(resist, 0));
          ctx.fillStyle = g;
          if (vertical) ctx.fillRect(p - band, 0, band * 2, height);
          else ctx.fillRect(0, p - band, width, band * 2);
        }
      };
      drawBands(true);
      drawBands(false);
      // light diamonds clamped at the fold intersections
      const r = sp * 0.28;
      for (let y = (foldY % sp) - sp; y < height + sp; y += sp) {
        for (let x = (foldX % sp) - sp; x < width + sp; x += sp) {
          const g = ctx.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, resist);
          g.addColorStop(1, withAlpha(resist, 0));
          ctx.fillStyle = g;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(Math.PI / 4);
          ctx.fillRect(-r * 0.7, -r * 0.7, r * 1.4, r * 1.4);
          ctx.restore();
        }
      }
    }

    const STYLES = { kanoko, arashi, itajime };

    function render() {
      ctx.fillStyle = dye;
      ctx.fillRect(0, 0, width, height);
      (STYLES[P.style] || kanoko)();
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
        if (P.style === 'kanoko') dots.push([x, y]);
        dirty = true;
      },
      onMove(x, y, dx, dy) {
        if (P.style === 'kanoko') dots.push([x, y]);
        else if (P.style === 'arashi') {
          angle += dx * 0.2;
          foldX += dx * 0.4;
          foldY += dy * 0.4;
        } else {
          foldX += dx;
          foldY += dy;
        }
        dirty = true;
      },
    };
  },
};

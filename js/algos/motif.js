// Motif Wallpaper: the classic phone-wallpaper recipe — one small motif
// (dots, stars, hearts, moons, crosses…) repeated on a grid, brick offset,
// diamond lattice or loose scatter, with jitter, rotation, size play and
// outline/fill control.

import { TAU, samplePalette } from '../core/util.js';

const MOTIF_KEYS = ['dot', 'ring', 'star', 'sparkle', 'heart', 'moon', 'cross', 'triangle', 'diamond', 'snowflake'];

export default {
  id: 'motif',
  name: 'Motif Wallpaper',
  category: 'Geometric',
  description: 'Classic repeating-motif wallpaper — dots, stars, hearts, moons, crosses — on grids, bricks, diamonds or scatter.',
  params: [
    {
      key: 'motif', label: 'Motif', type: 'select', value: 'dot',
      options: [
        { value: 'dot', label: 'polka dots' },
        { value: 'ring', label: 'rings' },
        { value: 'star', label: 'stars' },
        { value: 'sparkle', label: 'sparkles' },
        { value: 'heart', label: 'hearts' },
        { value: 'moon', label: 'moons' },
        { value: 'cross', label: 'crosses' },
        { value: 'triangle', label: 'triangles' },
        { value: 'diamond', label: 'diamonds' },
        { value: 'snowflake', label: 'snowflakes' },
        { value: 'mixed', label: 'mixed (per seed)' },
      ],
    },
    {
      key: 'layout', label: 'Layout', type: 'select', value: 'offset',
      options: [
        { value: 'grid', label: 'square grid' },
        { value: 'offset', label: 'brick offset' },
        { value: 'diamond', label: 'diamond lattice' },
        { value: 'scatter', label: 'loose scatter' },
      ],
    },
    { key: 'size', label: 'Motif size', type: 'range', min: 5, max: 90, step: 1, value: 20 },
    { key: 'spacing', label: 'Spacing', type: 'range', min: 1.4, max: 5, step: 0.1, value: 2.6 },
    { key: 'sizeVar', label: 'Size variation', type: 'range', min: 0, max: 1, step: 0.05, value: 0.1 },
    { key: 'jitter', label: 'Jitter', type: 'range', min: 0, max: 1, step: 0.05, value: 0 },
    { key: 'sway', label: 'Rotation play', type: 'range', min: 0, max: 1, step: 0.05, value: 0.15 },
    {
      key: 'fillStyle', label: 'Fill', type: 'select', value: 'fill',
      options: [
        { value: 'fill', label: 'filled' },
        { value: 'outline', label: 'outline' },
        { value: 'mix', label: 'mixed' },
      ],
    },
    { key: 'outlineWidth', label: 'Outline width', type: 'range', min: 0.5, max: 10, step: 0.5, value: 2.5 },
    {
      key: 'colorMode', label: 'Color by', type: 'select', value: 'sequence',
      options: [
        { value: 'sequence', label: 'cycle palette' },
        { value: 'rows', label: 'gradient rows' },
        { value: 'random', label: 'random' },
        { value: 'single', label: 'single ink' },
      ],
    },
  ],

  create({ ctx, width, height, rng, palette, params }) {
    const P = params;

    // each motif is drawn around (0,0) at radius r; ctx is pre-transformed
    function tracePath(kind, r) {
      ctx.beginPath();
      if (kind === 'dot' || kind === 'ring') {
        ctx.arc(0, 0, r, 0, TAU);
      } else if (kind === 'star' || kind === 'sparkle') {
        const points = kind === 'star' ? 5 : 4;
        const inner = kind === 'star' ? 0.45 : 0.3;
        for (let i = 0; i < points * 2; i++) {
          const rr = i % 2 === 0 ? r : r * inner;
          const a = (i * Math.PI) / points - Math.PI / 2;
          const x = Math.cos(a) * rr;
          const y = Math.sin(a) * rr;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
      } else if (kind === 'heart') {
        ctx.moveTo(0, 0.95 * r);
        ctx.bezierCurveTo(-1.1 * r, 0.2 * r, -0.65 * r, -0.85 * r, 0, -0.3 * r);
        ctx.bezierCurveTo(0.65 * r, -0.85 * r, 1.1 * r, 0.2 * r, 0, 0.95 * r);
        ctx.closePath();
      } else if (kind === 'moon') {
        // outer left edge, then an inner arc that bites the crescent out
        const d = 0.55 * r;
        const R2 = Math.hypot(d, r);
        const aTop = Math.atan2(-r, -d);
        const aBot = Math.atan2(r, -d);
        ctx.arc(0, 0, r, Math.PI / 2, Math.PI * 1.5);
        ctx.arc(d, 0, R2, aTop, aBot, true);
        ctx.closePath();
      } else if (kind === 'cross') {
        const t = 0.32 * r;
        ctx.moveTo(-t, -r);
        ctx.lineTo(t, -r);
        ctx.lineTo(t, -t);
        ctx.lineTo(r, -t);
        ctx.lineTo(r, t);
        ctx.lineTo(t, t);
        ctx.lineTo(t, r);
        ctx.lineTo(-t, r);
        ctx.lineTo(-t, t);
        ctx.lineTo(-r, t);
        ctx.lineTo(-r, -t);
        ctx.lineTo(-t, -t);
        ctx.closePath();
      } else if (kind === 'snowflake') {
        // six dendrite arms with paired side branches
        for (let arm = 0; arm < 6; arm++) {
          const a = (arm / 6) * TAU - Math.PI / 2;
          const ux = Math.cos(a);
          const uy = Math.sin(a);
          ctx.moveTo(0, 0);
          ctx.lineTo(ux * r, uy * r);
          for (const bt of [0.45, 0.7]) {
            const bx = ux * r * bt;
            const by = uy * r * bt;
            const bl = r * 0.28 * (1.2 - bt);
            for (const sgn of [-1, 1]) {
              const ba = a + (sgn * Math.PI) / 3;
              ctx.moveTo(bx, by);
              ctx.lineTo(bx + Math.cos(ba) * bl, by + Math.sin(ba) * bl);
            }
          }
        }
      } else if (kind === 'triangle') {
        ctx.moveTo(0, -r);
        ctx.lineTo(r * 0.87, r * 0.5);
        ctx.lineTo(-r * 0.87, r * 0.5);
        ctx.closePath();
      } else {
        // diamond
        ctx.moveTo(0, -r);
        ctx.lineTo(r * 0.72, 0);
        ctx.lineTo(0, r);
        ctx.lineTo(-r * 0.72, 0);
        ctx.closePath();
      }
    }

    let drawn = false;
    return {
      frame() {
        if (drawn) return false;
        drawn = true;
        ctx.fillStyle = palette.bg;
        ctx.fillRect(0, 0, width, height);

        const step = P.size * P.spacing;
        const rowStep = P.layout === 'diamond' ? step * 0.72 : step;
        const scatter = P.layout === 'scatter';
        const jitter = scatter ? 1 : P.jitter;
        const rows = Math.ceil(height / rowStep) + 2;
        const cols = Math.ceil(width / step) + 2;
        let index = 0;

        for (let j = -1; j < rows; j++) {
          for (let i = -1; i < cols; i++) {
            const offsetRow = (P.layout === 'offset' || P.layout === 'diamond') && j % 2 !== 0;
            const x = i * step + (offsetRow ? step / 2 : 0) + (rng.random() - 0.5) * jitter * step * 0.9;
            const y = j * rowStep + (rng.random() - 0.5) * jitter * rowStep * 0.9;
            const r = (P.size / 2) * (1 + (rng.random() - 0.5) * P.sizeVar * 1.2);
            const rot = scatter
              ? rng.random() * TAU * P.sway
              : (rng.random() - 0.5) * P.sway * Math.PI;
            const kind = P.motif === 'mixed' ? MOTIF_KEYS[rng.int(0, MOTIF_KEYS.length - 1)] : P.motif;

            let color;
            if (P.colorMode === 'single') color = samplePalette(palette.colors, 0.4);
            else if (P.colorMode === 'random') color = samplePalette(palette.colors, rng.random());
            else if (P.colorMode === 'rows') color = samplePalette(palette.colors, (j + 1) / rows);
            else color = palette.colors[index % palette.colors.length];
            index++;

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rot);
            const outlined = kind === 'ring'
              || kind === 'snowflake' // dendrite arms are strokes by nature
              || P.fillStyle === 'outline'
              || (P.fillStyle === 'mix' && rng.random() < 0.5);
            tracePath(kind, r);
            if (outlined) {
              ctx.strokeStyle = color;
              ctx.lineWidth = P.outlineWidth;
              ctx.lineJoin = 'round';
              ctx.stroke();
            } else {
              ctx.fillStyle = color;
              ctx.fill();
            }
            ctx.restore();
          }
        }
        return false;
      },
    };
  },
};

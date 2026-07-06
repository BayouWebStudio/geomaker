// Aztec Bands: Andean/Mesoamerican textile geometry — stacked bands of
// stepped diamonds, zigzags, frets and checker strips, woven from the seed.

import { samplePalette } from '../core/util.js';

export default {
  id: 'aztec',
  name: 'Aztec Bands',
  category: 'Geometric',
  description: 'Woven textile bands: stepped diamonds, zigzags, frets and checker strips stacked like an Andean blanket.',
  params: [
    { key: 'unit', label: 'Stitch size', type: 'range', min: 4, max: 24, step: 1, value: 10 },
    { key: 'variety', label: 'Band variety', type: 'range', min: 1, max: 5, step: 1, value: 4 },
    { key: 'divider', label: 'Divider lines', type: 'checkbox', value: true },
    {
      key: 'colorMode', label: 'Color by', type: 'select', value: 'bands',
      options: [
        { value: 'bands', label: 'gradient bands' },
        { value: 'alternate', label: 'two-tone' },
        { value: 'random', label: 'random per band' },
      ],
    },
  ],

  create({ ctx, width, height, rng, palette, params }) {
    const P = params;
    const u = P.unit;

    function bandColor(i, total) {
      if (P.colorMode === 'alternate') {
        return i % 2 === 0 ? palette.colors[0] : palette.colors[palette.colors.length - 1];
      }
      if (P.colorMode === 'random') return samplePalette(palette.colors, rng.random());
      return samplePalette(palette.colors, total > 1 ? i / (total - 1) : 0.4);
    }

    // draw one "stitch" (a u×u block) — everything is built from these
    function px(c, r, y0) {
      ctx.fillRect(c * u, y0 + r * u, u + 0.5, u + 0.5);
    }

    // band painters: each fills rows 0..h-1 of its band with stitches
    function steppedDiamonds(y0, h, color) {
      ctx.fillStyle = color;
      const half = Math.floor(h / 2);
      const period = h * 2;
      const cols = Math.ceil(width / u) + period;
      for (let c = -period; c < cols; c++) {
        for (let r = 0; r < h; r++) {
          const d = Math.abs(r - half);
          const phase = ((c % period) + period) % period;
          const spread = half - d;
          const center = Math.abs(phase - h) <= spread;
          const hollow = Math.abs(phase - h) <= spread - 2;
          if (center && !hollow) px(c, r, y0);
        }
      }
    }

    function zigzag(y0, h, color) {
      ctx.fillStyle = color;
      const cols = Math.ceil(width / u) + h * 2;
      for (let c = -h * 2; c < cols; c++) {
        const period = (h - 1) * 2;
        const phase = ((c % period) + period) % period;
        const r = phase < h ? phase : period - phase;
        px(c, r, y0);
        if (r + 1 < h) px(c, r + 1, y0);
      }
    }

    function fret(y0, h, color) {
      ctx.fillStyle = color;
      const cols = Math.ceil(width / u) + 8;
      for (let c = -8; c < cols; c++) {
        const phase = ((c % 6) + 6) % 6;
        for (let r = 0; r < h; r++) {
          const key =
            r === 0 || r === h - 1 ||
            (phase === 0 && r > 0) ||
            (phase < 4 && r === Math.floor(h / 2) && r > 0);
          if (key) px(c, r, y0);
        }
      }
    }

    function checker(y0, h, color) {
      ctx.fillStyle = color;
      const cols = Math.ceil(width / u) + 2;
      for (let c = -2; c < cols; c++) {
        for (let r = 0; r < h; r++) {
          if ((c + r) % 2 === 0) px(c, r, y0);
        }
      }
    }

    function triangles(y0, h, color) {
      ctx.fillStyle = color;
      const cols = Math.ceil(width / u) + h * 2;
      for (let c = -h * 2; c < cols; c++) {
        const period = h;
        const phase = ((c % period) + period) % period;
        for (let r = 0; r < h; r++) {
          const upTri = Math.abs(phase - h / 2) <= r / 2;
          if (upTri) px(c, r, y0);
        }
      }
    }

    const PAINTERS = [steppedDiamonds, zigzag, fret, triangles, checker];

    let drawn = false;
    return {
      frame() {
        if (drawn) return false;
        drawn = true;
        ctx.fillStyle = palette.bg;
        ctx.fillRect(0, 0, width, height);

        // stack bands until the canvas is full; big diamond bands breathe
        // between thinner accent rows
        let y = -u * 2;
        let i = 0;
        const kinds = PAINTERS.slice(0, Math.round(P.variety));
        while (y < height + u * 2) {
          const kind = kinds[rng.int(0, kinds.length - 1)];
          const big = kind === steppedDiamonds;
          const h = big ? rng.int(7, 11) : rng.int(3, 5);
          kind(y, h, bandColor(i, 12));
          y += h * u;
          if (P.divider) {
            ctx.fillStyle = samplePalette(palette.colors, 0.5);
            ctx.fillRect(0, y + u * 0.25, width, Math.max(1, u * 0.18));
            y += u;
          }
          i++;
        }
        return false;
      },
    };
  },
};

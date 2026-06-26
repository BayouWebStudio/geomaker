// Textile: woven cloth patterns — tartan (overlapping warp/weft stripes),
// argyle (diamond lattice with overstitch), and houndstooth (the broken check).

import { samplePalette, withAlpha, mixHex } from '../core/util.js';

export default {
  id: 'textile',
  name: 'Textile Weave',
  category: 'Geometric',
  description: 'Woven cloth patterns — tartan plaid, argyle diamonds, or houndstooth check.',
  params: [
    {
      key: 'style', label: 'Weave', type: 'select', value: 'tartan',
      options: [
        { value: 'tartan', label: 'tartan (plaid)' },
        { value: 'argyle', label: 'argyle' },
        { value: 'houndstooth', label: 'houndstooth' },
      ],
    },
    { key: 'scale', label: 'Scale', type: 'range', min: 14, max: 160, step: 2, value: 60 },
    { key: 'lineWidth', label: 'Overstitch (argyle)', type: 'range', min: 0, max: 4, step: 0.5, value: 1.5 },
  ],

  create({ ctx, width, height, rng, palette, params }) {
    const P = params;
    const s = P.scale;

    // tartan: a seeded "sett" of colored bands laid down as warp then weft,
    // the weft semi-transparent so the threads visibly cross
    function tartan() {
      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, width, height);
      const sett = [];
      let total = 0;
      const bands = rng.int(4, 7);
      for (let i = 0; i < bands; i++) {
        const w = rng.int(1, 5);
        sett.push({ w, color: samplePalette(palette.colors, rng.random()) });
        total += w;
      }
      const unit = s / total;
      const stripe = (vertical) => {
        const span = vertical ? width : height;
        let p = 0;
        let i = 0;
        while (p < span + s) {
          const band = sett[i % sett.length];
          const w = band.w * unit;
          ctx.fillStyle = withAlpha(band.color, vertical ? 1 : 0.5);
          if (vertical) ctx.fillRect(p, 0, w, height);
          else ctx.fillRect(0, p, width, w);
          p += w;
          i++;
        }
      };
      stripe(true);
      stripe(false);
    }

    function argyle() {
      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, width, height);
      const w = s;
      const h = s * 1.4;
      const cA = samplePalette(palette.colors, 0.3);
      const cB = samplePalette(palette.colors, 0.7);
      for (let row = -1, y = -h; y < height + h; y += h / 2, row++) {
        for (let col = -1, x = -w; x < width + w; x += w, col++) {
          const off = row % 2 ? w / 2 : 0;
          const cx = x + off;
          const cy = y;
          ctx.fillStyle = (row + col) % 2 ? cA : cB;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + w / 2, cy + h / 2);
          ctx.lineTo(cx + w, cy);
          ctx.lineTo(cx + w / 2, cy - h / 2);
          ctx.closePath();
          ctx.fill();
        }
      }
      if (P.lineWidth > 0) {
        ctx.strokeStyle = withAlpha(samplePalette(palette.colors, 0.95), 0.8);
        ctx.lineWidth = P.lineWidth;
        ctx.setLineDash([P.lineWidth * 2, P.lineWidth * 2]);
        for (let y = -h; y < height + h; y += h) {
          ctx.beginPath();
          for (let x = -w; x < width + w; x += w) {
            ctx.moveTo(x, y);
            ctx.lineTo(x + w / 2, y + h / 2);
            ctx.moveTo(x + w / 2, y + h / 2);
            ctx.lineTo(x + w, y);
          }
          ctx.stroke();
        }
        ctx.setLineDash([]);
      }
    }

    // houndstooth: the classic broken check, drawn as a 4×4 sub-grid stamp of
    // two-tone cells plus the signature diagonal "teeth"
    function houndstooth() {
      // use the background as one tone and a bright ink as the other, so the
      // broken check stays high-contrast on any palette
      const cA = samplePalette(palette.colors, 0.85);
      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, width, height);
      const u = s / 4;
      for (let y = -s; y < height + s; y += s) {
        for (let x = -s; x < width + s; x += s) {
          ctx.fillStyle = cA;
          // solid quarter block
          ctx.fillRect(x, y, 2 * u, 2 * u);
          // the four "teeth" stepping out diagonally
          ctx.beginPath();
          ctx.moveTo(x + 2 * u, y);
          ctx.lineTo(x + 4 * u, y);
          ctx.lineTo(x + 2 * u, y + 2 * u);
          ctx.closePath();
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(x, y + 2 * u);
          ctx.lineTo(x + 2 * u, y + 4 * u);
          ctx.lineTo(x, y + 4 * u);
          ctx.closePath();
          ctx.fill();
        }
      }
    }

    const STYLES = { tartan, argyle, houndstooth };
    let drawn = false;
    return {
      frame() {
        if (drawn) return false;
        drawn = true;
        (STYLES[P.style] || tartan)();
        return false;
      },
    };
  },
};

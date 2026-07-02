// Parquet & Herringbone: wood-floor tilings — herringbone staircases, chevron
// zigzag columns, running-bond brick and basket weave — with plank proportion,
// grout width and per-plank tone variation.

import { samplePalette, clamp } from '../core/util.js';

export default {
  id: 'parquet',
  name: 'Parquet & Herringbone',
  category: 'Geometric',
  description: 'Wood-floor tilings: herringbone, chevron, brick bond and basket weave, with plank ratio and grout width.',
  params: [
    {
      key: 'style', label: 'Layout', type: 'select', value: 'herringbone',
      options: [
        { value: 'herringbone', label: 'herringbone' },
        { value: 'chevron', label: 'chevron' },
        { value: 'brick', label: 'brick bond' },
        { value: 'basket', label: 'basket weave' },
      ],
    },
    { key: 'size', label: 'Plank width', type: 'range', min: 8, max: 80, step: 1, value: 24 },
    { key: 'ratio', label: 'Plank length ×', type: 'range', min: 2, max: 6, step: 1, value: 3 },
    { key: 'grout', label: 'Grout width', type: 'range', min: 0, max: 10, step: 0.5, value: 2 },
    { key: 'tone', label: 'Tone variation', type: 'range', min: 0, max: 1, step: 0.05, value: 0.5 },
    { key: 'diagonal', label: 'Rotate 45°', type: 'checkbox', value: true },
    {
      key: 'colorMode', label: 'Color by', type: 'select', value: 'wood',
      options: [
        { value: 'wood', label: 'wood tones' },
        { value: 'orientation', label: 'by direction' },
        { value: 'random', label: 'random' },
      ],
    },
  ],

  create({ ctx, width, height, rng, palette, params }) {
    const P = params;
    const w = P.size;
    const k = Math.round(P.ratio);
    const L = w * k;

    function plankColor(ori, t) {
      const jitter = (rng.random() - 0.5) * P.tone * 0.7;
      if (P.colorMode === 'orientation') {
        return samplePalette(palette.colors, clamp((ori === 'h' ? 0.2 : 0.8) + jitter, 0, 1));
      }
      if (P.colorMode === 'random') return samplePalette(palette.colors, rng.random());
      return samplePalette(palette.colors, clamp(t + jitter, 0, 1));
    }

    function plank(x, y, pw, ph, ori, t) {
      ctx.fillStyle = plankColor(ori, t);
      ctx.beginPath();
      ctx.rect(x, y, pw, ph);
      ctx.fill();
      if (P.grout > 0) {
        ctx.strokeStyle = palette.bg;
        ctx.lineWidth = P.grout;
        ctx.stroke();
      }
    }

    // herringbone lattice: cell (i,j) of size w belongs to a horizontal plank
    // when p = (i+j) mod 2k < k (its left end sits p cells back), otherwise to
    // a vertical plank whose top end sits (p-k) cells up.
    function drawHerringbone(D) {
      const cells = Math.ceil(D / w) + 2 * k;
      const seen = new Set();
      for (let j = -k; j < cells; j++) {
        for (let i = -k; i < cells; i++) {
          const p = ((i + j) % (2 * k) + 2 * k) % (2 * k);
          let ox, oy, ori;
          if (p < k) {
            ox = i - p;
            oy = j;
            ori = 'h';
          } else {
            ox = i;
            oy = j - (p - k);
            ori = 'v';
          }
          const key = ori + ox + ',' + oy;
          if (seen.has(key)) continue;
          seen.add(key);
          const t = (ox + oy + cells) / (cells * 2);
          if (ori === 'h') plank(ox * w, oy * w, L, w, ori, t);
          else plank(ox * w, oy * w, w, L, ori, t);
        }
      }
    }

    function drawChevron(D) {
      const colW = L * 0.72;
      const rise = colW; // 45° slant
      const step = w * Math.SQRT2;
      const cols = Math.ceil(D / colW) + 2;
      const rows = Math.ceil(D / step) + 3;
      for (let c = -1; c < cols; c++) {
        const dir = c % 2 === 0 ? 1 : -1;
        const x0 = c * colW;
        for (let r = -2; r < rows; r++) {
          const y0 = r * step - (dir === 1 ? rise : 0);
          ctx.fillStyle = plankColor(dir === 1 ? 'h' : 'v', (r + 2) / (rows + 2));
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x0 + colW, y0 + dir * rise);
          ctx.lineTo(x0 + colW, y0 + dir * rise + step);
          ctx.lineTo(x0, y0 + step);
          ctx.closePath();
          ctx.fill();
          if (P.grout > 0) {
            ctx.strokeStyle = palette.bg;
            ctx.lineWidth = P.grout;
            ctx.stroke();
          }
        }
      }
    }

    function drawBrick(D) {
      const rows = Math.ceil(D / w) + 2;
      const cols = Math.ceil(D / L) + 2;
      for (let j = -1; j < rows; j++) {
        const shift = j % 2 === 0 ? 0 : L / 2;
        for (let i = -2; i < cols; i++) {
          plank(i * L + shift, j * w, L, w, 'h', (j + 1) / rows);
        }
      }
    }

    function drawBasket(D) {
      // k planks bundled into L×L blocks, alternating orientation
      const blocks = Math.ceil(D / L) + 2;
      for (let bj = -1; bj < blocks; bj++) {
        for (let bi = -1; bi < blocks; bi++) {
          const horizontal = (bi + bj) % 2 === 0;
          const t = (bi + bj + blocks) / (blocks * 2);
          for (let n = 0; n < k; n++) {
            if (horizontal) plank(bi * L, bj * L + n * w, L, w, 'h', t);
            else plank(bi * L + n * w, bj * L, w, L, 'v', t);
          }
        }
      }
    }

    let drawn = false;
    return {
      frame() {
        if (drawn) return false;
        drawn = true;
        ctx.fillStyle = palette.bg;
        ctx.fillRect(0, 0, width, height);
        const D = Math.hypot(width, height);
        ctx.save();
        if (P.diagonal) {
          ctx.translate(width / 2, height / 2);
          ctx.rotate(Math.PI / 4);
          ctx.translate(-D / 2, -D / 2);
        } else {
          ctx.translate((width - D) / 2, (height - D) / 2);
        }
        if (P.style === 'herringbone') drawHerringbone(D);
        else if (P.style === 'chevron') drawChevron(D);
        else if (P.style === 'brick') drawBrick(D);
        else drawBasket(D);
        ctx.restore();
        return false;
      },
    };
  },
};

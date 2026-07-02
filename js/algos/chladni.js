// Cymatics: Chladni plate figures. A standing wave f = cos(nπx)cos(mπy) ±
// cos(mπx)cos(nπy) has nodal lines where f = 0 — on a real vibrating plate,
// that's where the sand collects. Rendered as settled sand grains or as crisp
// marching-squares nodal lines. Interactive: drag to sweep the two frequencies.

import { clamp, samplePalette, withAlpha } from '../core/util.js';

const CANDIDATES = 90000; // fixed sample pool, re-tested on every re-render

export default {
  id: 'chladni',
  name: 'Cymatics',
  category: 'Geometric',
  interactive: true,
  hint: 'Drag ↔ and ↕ to sweep the two vibration frequencies',
  description: 'Chladni plate figures — sand settling on the nodal lines of a vibrating plate. Drag to retune.',
  params: [
    { key: 'n', label: 'Frequency n', type: 'range', min: 1, max: 12, step: 0.05, value: 3 },
    { key: 'm', label: 'Frequency m', type: 'range', min: 1, max: 12, step: 0.05, value: 5 },
    { key: 'mix', label: 'Mode mix', type: 'range', min: -1, max: 1, step: 0.05, value: 1 },
    {
      key: 'style', label: 'Render', type: 'select', value: 'sand',
      options: [
        { value: 'sand', label: 'settled sand' },
        { value: 'lines', label: 'nodal lines' },
      ],
    },
    { key: 'threshold', label: 'Sand spread', type: 'range', min: 0.01, max: 0.2, step: 0.005, value: 0.06 },
    { key: 'grain', label: 'Grain size', type: 'range', min: 0.4, max: 2.5, step: 0.1, value: 0.9 },
    { key: 'lineWidth', label: 'Line width', type: 'range', min: 0.4, max: 4, step: 0.1, value: 1.3 },
    { key: 'plate', label: 'Plate size', type: 'range', min: 0.5, max: 1, step: 0.02, value: 0.86 },
  ],

  create({ ctx, width, height, rng, palette, params }) {
    const P = params;
    let n = P.n;
    let m = P.m;
    let dirty = true;

    const side = Math.min(width, height) * P.plate;
    const x0 = (width - side) / 2;
    const y0 = (height - side) / 2;

    // fixed random candidate pool → deterministic sand for a given seed,
    // cheap to re-test when n/m change during a drag
    const pool = new Float32Array(CANDIDATES * 2);
    for (let i = 0; i < pool.length; i++) pool[i] = rng.random();

    const wave = (u, v) =>
      Math.cos(n * Math.PI * u) * Math.cos(m * Math.PI * v) +
      P.mix * Math.cos(m * Math.PI * u) * Math.cos(n * Math.PI * v);
    // normalized u,v in [-1,1] (cos modes give the classic centered symmetry)

    function renderSand() {
      const ink = samplePalette(palette.colors, 0.8);
      ctx.fillStyle = withAlpha(ink, 0.85);
      const r = P.grain;
      for (let i = 0; i < CANDIDATES; i++) {
        const u = pool[i * 2] * 2 - 1;
        const v = pool[i * 2 + 1] * 2 - 1;
        if (Math.abs(wave(u, v)) > P.threshold) continue;
        const x = x0 + ((u + 1) / 2) * side;
        const y = y0 + ((v + 1) / 2) * side;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // marching squares over the plate for the f = 0 iso-line
    function renderLines() {
      const G = 140;
      const step = side / G;
      const f = new Float32Array((G + 1) * (G + 1));
      for (let j = 0; j <= G; j++) {
        for (let i = 0; i <= G; i++) {
          f[j * (G + 1) + i] = wave((i / G) * 2 - 1, (j / G) * 2 - 1);
        }
      }
      ctx.strokeStyle = samplePalette(palette.colors, 0.8);
      ctx.lineWidth = P.lineWidth;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let j = 0; j < G; j++) {
        for (let i = 0; i < G; i++) {
          const tl = f[j * (G + 1) + i];
          const tr = f[j * (G + 1) + i + 1];
          const br = f[(j + 1) * (G + 1) + i + 1];
          const bl = f[(j + 1) * (G + 1) + i];
          let code = 0;
          if (tl > 0) code |= 8;
          if (tr > 0) code |= 4;
          if (br > 0) code |= 2;
          if (bl > 0) code |= 1;
          if (code === 0 || code === 15) continue;
          const px = x0 + i * step;
          const py = y0 + j * step;
          const top = [px + (step * tl) / (tl - tr), py];
          const right = [px + step, py + (step * tr) / (tr - br)];
          const bottom = [px + (step * bl) / (bl - br), py + step];
          const left = [px, py + (step * tl) / (tl - bl)];
          const seg = (a, b) => {
            ctx.moveTo(a[0], a[1]);
            ctx.lineTo(b[0], b[1]);
          };
          switch (code) {
            case 1: seg(left, bottom); break;
            case 2: seg(bottom, right); break;
            case 3: seg(left, right); break;
            case 4: seg(top, right); break;
            case 5: seg(left, top); seg(bottom, right); break;
            case 6: seg(top, bottom); break;
            case 7: seg(left, top); break;
            case 8: seg(left, top); break;
            case 9: seg(top, bottom); break;
            case 10: seg(left, bottom); seg(top, right); break;
            case 11: seg(top, right); break;
            case 12: seg(left, right); break;
            case 13: seg(bottom, right); break;
            case 14: seg(left, bottom); break;
          }
        }
      }
      ctx.stroke();
    }

    return {
      frame() {
        if (!dirty) return true;
        dirty = false;
        ctx.fillStyle = palette.bg;
        ctx.fillRect(0, 0, width, height);
        // faint plate edge grounds the figure
        ctx.strokeStyle = withAlpha(samplePalette(palette.colors, 0.5), 0.25);
        ctx.lineWidth = 1;
        ctx.strokeRect(x0, y0, side, side);
        if (P.style === 'lines') renderLines();
        else renderSand();
        return true;
      },
      onMove(x, y, dx, dy) {
        n = clamp(n + dx * 0.01, 1, 14);
        m = clamp(m + dy * 0.01, 1, 14);
        dirty = true;
      },
    };
  },
};

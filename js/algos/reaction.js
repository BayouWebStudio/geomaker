// Turing Patterns: Gray-Scott reaction-diffusion on a torus grid.
// Two virtual chemicals feed, kill and diffuse until spots, worms,
// mazes or coral-like structures emerge.

import { clamp, samplePalette, hexToRgb } from '../core/util.js';

const PRESETS = {
  coral: { feed: 0.0545, kill: 0.062 },
  mitosis: { feed: 0.0367, kill: 0.0649 },
  worms: { feed: 0.078, kill: 0.061 },
  maze: { feed: 0.029, kill: 0.057 },
  solitons: { feed: 0.03, kill: 0.062 },
};

const DA = 1.0;
const DB = 0.5;

export default {
  id: 'turing',
  name: 'Turing Patterns',
  description: 'Gray-Scott chemistry: spots, worms and mazes emerge from feed & kill.',
  params: [
    {
      key: 'preset', label: 'Pattern preset', type: 'select', value: 'coral',
      options: [
        { value: 'coral', label: 'coral' },
        { value: 'mitosis', label: 'mitosis' },
        { value: 'worms', label: 'worms' },
        { value: 'maze', label: 'maze' },
        { value: 'solitons', label: 'solitons' },
        { value: 'custom', label: 'custom (sliders below)' },
      ],
    },
    { key: 'feed', label: 'Feed (custom)', type: 'range', min: 0.01, max: 0.11, step: 0.0005, value: 0.055 },
    { key: 'kill', label: 'Kill (custom)', type: 'range', min: 0.04, max: 0.07, step: 0.0005, value: 0.062 },
    {
      key: 'resolution', label: 'Resolution', type: 'select', value: '3',
      options: [
        { value: '2', label: 'fine (slower)' },
        { value: '3', label: 'balanced' },
        { value: '4', label: 'chunky (faster)' },
      ],
    },
    { key: 'iters', label: 'Sim speed', type: 'range', min: 2, max: 30, step: 1, value: 12 },
    {
      key: 'seedStyle', label: 'Seeded with', type: 'select', value: 'spots',
      options: [
        { value: 'spots', label: 'random spots' },
        { value: 'center', label: 'center block' },
        { value: 'ring', label: 'ring' },
        { value: 'noise', label: 'noise blobs' },
      ],
    },
    {
      key: 'render', label: 'Render', type: 'select', value: 'smooth',
      options: [
        { value: 'smooth', label: 'smooth gradient' },
        { value: 'banded', label: 'banded (posterized)' },
      ],
    },
    { key: 'invert', label: 'Invert colors', type: 'checkbox', value: false },
  ],

  create({ ctx, width, height, rng, noise, palette, params }) {
    const P = params;
    const cs = parseInt(P.resolution, 10);
    let gw = Math.max(8, Math.floor(width / cs));
    let gh = Math.max(8, Math.floor(height / cs));
    // cap the grid so huge windows stay interactive
    if (gw > 640) {
      gh = Math.round((gh * 640) / gw);
      gw = 640;
    }
    if (gh > 640) {
      gw = Math.round((gw * 640) / gh);
      gh = 640;
    }
    const size = gw * gh;
    let A = new Float32Array(size).fill(1);
    let B = new Float32Array(size);
    let A2 = new Float32Array(size);
    let B2 = new Float32Array(size);

    const fk = PRESETS[P.preset] || { feed: P.feed, kill: P.kill };
    const feed = fk.feed;
    const kill = fk.kill;

    // initial deposits of chemical B
    const blot = (bx, by, r) => {
      for (let y = -r; y <= r; y++) {
        for (let x = -r; x <= r; x++) {
          if (x * x + y * y > r * r) continue;
          const xx = (bx + x + gw) % gw;
          const yy = (by + y + gh) % gh;
          B[yy * gw + xx] = 1;
        }
      }
    };
    if (P.seedStyle === 'spots') {
      const count = rng.int(25, 70);
      for (let i = 0; i < count; i++) blot(rng.int(0, gw - 1), rng.int(0, gh - 1), rng.int(2, 5));
    } else if (P.seedStyle === 'center') {
      blot(Math.floor(gw / 2), Math.floor(gh / 2), Math.max(4, Math.floor(Math.min(gw, gh) / 14)));
    } else if (P.seedStyle === 'ring') {
      const r = Math.min(gw, gh) * 0.28;
      const mx = gw / 2;
      const my = gh / 2;
      for (let i = 0; i < size; i++) {
        const d = Math.hypot((i % gw) - mx, Math.floor(i / gw) - my);
        if (Math.abs(d - r) < 2.5) B[i] = 1;
      }
    } else {
      for (let i = 0; i < size; i++) {
        if (noise.fbm((i % gw) * 0.07, Math.floor(i / gw) * 0.07) > 0.28) B[i] = 1;
      }
    }

    // torus wrap lookups
    const xm1 = new Int32Array(gw);
    const xp1 = new Int32Array(gw);
    for (let x = 0; x < gw; x++) {
      xm1[x] = x > 0 ? x - 1 : gw - 1;
      xp1[x] = x < gw - 1 ? x + 1 : 0;
    }

    function simStep() {
      for (let y = 0; y < gh; y++) {
        const row = y * gw;
        const rowm = (y > 0 ? y - 1 : gh - 1) * gw;
        const rowp = (y < gh - 1 ? y + 1 : 0) * gw;
        for (let x = 0; x < gw; x++) {
          const i = row + x;
          const xm = xm1[x];
          const xp = xp1[x];
          const a = A[i];
          const b = B[i];
          const lapA =
            0.2 * (A[rowm + x] + A[rowp + x] + A[row + xm] + A[row + xp]) +
            0.05 * (A[rowm + xm] + A[rowm + xp] + A[rowp + xm] + A[rowp + xp]) -
            a;
          const lapB =
            0.2 * (B[rowm + x] + B[rowp + x] + B[row + xm] + B[row + xp]) +
            0.05 * (B[rowm + xm] + B[rowm + xp] + B[rowp + xm] + B[rowp + xp]) -
            b;
          const abb = a * b * b;
          const na = a + (DA * lapA - abb + feed * (1 - a));
          const nb = b + (DB * lapB + abb - (kill + feed) * b);
          A2[i] = na < 0 ? 0 : na > 1 ? 1 : na;
          B2[i] = nb < 0 ? 0 : nb > 1 ? 1 : nb;
        }
      }
      [A, A2] = [A2, A];
      [B, B2] = [B2, B];
    }

    // 256-entry color LUT: t=0 is background, t=1 the hottest palette color
    const stops = [palette.bg, ...palette.colors];
    const lutR = new Uint8Array(256);
    const lutG = new Uint8Array(256);
    const lutB = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      let t = i / 255;
      if (P.render === 'banded') t = Math.round(t * 6) / 6;
      if (P.invert) t = 1 - t;
      const [r, g, b] = hexToRgb(samplePalette(stops, t));
      lutR[i] = r;
      lutG[i] = g;
      lutB[i] = b;
    }

    const off = document.createElement('canvas');
    off.width = gw;
    off.height = gh;
    const octx = off.getContext('2d');
    const img = octx.createImageData(gw, gh);
    const data = img.data;
    for (let i = 3; i < data.length; i += 4) data[i] = 255;

    return {
      frame() {
        for (let it = 0; it < P.iters; it++) simStep();
        for (let i = 0; i < size; i++) {
          const t = clamp((1 - (A[i] - B[i])) / 1.2, 0, 1);
          const j = (t * 255) | 0;
          const px = i * 4;
          data[px] = lutR[j];
          data[px + 1] = lutG[j];
          data[px + 2] = lutB[j];
        }
        octx.putImageData(img, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(off, 0, 0, width, height);
        return true; // runs until paused
      },
    };
  },
};

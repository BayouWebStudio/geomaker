// Cellular Automata: elementary 1D rules drawn as a space-time triangle (Rule
// 30, 90, 110…), or a 2D cyclic automaton that self-organizes into spirals.

import { samplePalette } from '../core/util.js';

export default {
  id: 'automata',
  name: 'Cellular Automata',
  category: 'Geometric',
  description: 'Elementary 1D rules as a space-time map (Rule 30/90/110), or a 2D excitable medium of spiral waves.',
  params: [
    {
      key: 'mode', label: 'Mode', type: 'select', value: 'elementary',
      options: [
        { value: 'elementary', label: '1D elementary (space-time)' },
        { value: 'cyclic', label: '2D excitable (spiral waves)' },
      ],
    },
    { key: 'rule', label: 'Rule (elementary)', type: 'range', min: 0, max: 255, step: 1, value: 30 },
    {
      key: 'start', label: 'Seed (elementary)', type: 'select', value: 'single',
      options: [
        { value: 'single', label: 'single cell' },
        { value: 'random', label: 'random row' },
      ],
    },
    { key: 'states', label: 'States (cyclic)', type: 'range', min: 4, max: 16, step: 1, value: 12 },
    { key: 'threshold', label: 'Threshold (cyclic)', type: 'range', min: 1, max: 4, step: 1, value: 1 },
    { key: 'cell', label: 'Cell size', type: 'range', min: 2, max: 12, step: 1, value: 4 },
    { key: 'colorMode', label: 'Color by', type: 'select', value: 'row', options: [
      { value: 'row', label: 'progression' },
      { value: 'mono', label: 'single ink' },
    ] },
  ],

  create({ ctx, width, height, rng, palette, params }) {
    const P = params;
    const cell = Math.round(P.cell);

    if (P.mode === 'elementary') {
      const cols = Math.ceil(width / cell);
      const rows = Math.ceil(height / cell);
      const rule = Math.round(P.rule);
      let cur = new Uint8Array(cols);
      if (P.start === 'single') cur[cols >> 1] = 1;
      else for (let i = 0; i < cols; i++) cur[i] = rng.random() < 0.5 ? 1 : 0;

      let drawn = false;
      return {
        frame() {
          if (drawn) return false;
          drawn = true;
          ctx.fillStyle = palette.bg;
          ctx.fillRect(0, 0, width, height);
          const next = new Uint8Array(cols);
          for (let r = 0; r < rows; r++) {
            const color = P.colorMode === 'mono' ? samplePalette(palette.colors, 0.7) : samplePalette(palette.colors, r / rows);
            ctx.fillStyle = color;
            for (let i = 0; i < cols; i++) {
              if (cur[i]) ctx.fillRect(i * cell, r * cell, cell + 0.5, cell + 0.5);
            }
            for (let i = 0; i < cols; i++) {
              const l = cur[(i - 1 + cols) % cols];
              const c = cur[i];
              const rt = cur[(i + 1) % cols];
              next[i] = (rule >> ((l << 2) | (c << 1) | rt)) & 1;
            }
            cur.set(next);
          }
          return false;
        },
      };
    }

    // 2D cyclic cellular automaton
    const n = Math.round(P.states);
    const thr = Math.round(P.threshold);
    const gw = Math.ceil(width / cell);
    const gh = Math.ceil(height / cell);
    let grid = new Uint8Array(gw * gh);
    for (let i = 0; i < grid.length; i++) grid[i] = rng.int(0, n - 1);
    let next = new Uint8Array(gw * gh);
    const lut = [];
    for (let s = 0; s < n; s++) lut.push(samplePalette(palette.colors, s / (n - 1)));

    // Griffeath cyclic CA: a cell in state s "eats" forward to s+1 (mod n) when
    // at least `threshold` Moore-neighbours are already in state s+1. With a low
    // threshold this self-organizes from debris into rotating spiral waves.
    function step() {
      for (let y = 0; y < gh; y++) {
        for (let x = 0; x < gw; x++) {
          const i = y * gw + x;
          const want = (grid[i] + 1) % n;
          let count = 0;
          for (let oy = -1; oy <= 1; oy++) {
            for (let ox = -1; ox <= 1; ox++) {
              if (ox === 0 && oy === 0) continue;
              if (grid[((y + oy + gh) % gh) * gw + ((x + ox + gw) % gw)] === want) count++;
            }
          }
          next[i] = count >= thr ? want : grid[i];
        }
      }
      [grid, next] = [next, grid];
    }

    let frames = 0;
    return {
      frame() {
        // several steps per frame so the debris organizes into spirals quickly
        for (let k = 0; k < 3; k++) step();
        for (let y = 0; y < gh; y++) {
          for (let x = 0; x < gw; x++) {
            ctx.fillStyle = lut[grid[y * gw + x]];
            ctx.fillRect(x * cell, y * cell, cell + 0.5, cell + 0.5);
          }
        }
        return frames++ < 200; // ~600 steps: settle into spirals, then stop
      },
    };
  },
};

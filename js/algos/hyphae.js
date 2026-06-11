// Mycelium: branching random walkers. Each hypha wanders with angular noise,
// occasionally forks, thins as it grows, and (optionally) dies when it touches
// existing structure — producing root, lightning and fungal forms.

import { TAU, samplePalette, withAlpha } from '../core/util.js';

const CELL = 3; // occupancy-grid resolution in css px

export default {
  id: 'mycelium',
  name: 'Mycelium',
  description: 'Branching root-like walkers that wander, split and avoid each other.',
  params: [
    { key: 'seeds', label: 'Starting points', type: 'range', min: 1, max: 16, step: 1, value: 6 },
    {
      key: 'origin', label: 'Grow from', type: 'select', value: 'scattered',
      options: [
        { value: 'center', label: 'center' },
        { value: 'bottom', label: 'bottom edge' },
        { value: 'edges', label: 'all edges inward' },
        { value: 'scattered', label: 'scattered' },
      ],
    },
    { key: 'wiggle', label: 'Wiggle', type: 'range', min: 0, max: 1.5, step: 0.05, value: 0.25 },
    { key: 'fieldBend', label: 'Flow influence', type: 'range', min: 0, max: 1.2, step: 0.05, value: 0.4 },
    { key: 'branch', label: 'Branch chance', type: 'range', min: 0.005, max: 0.2, step: 0.005, value: 0.075 },
    { key: 'spread', label: 'Branch angle', type: 'range', min: 0.2, max: 1.6, step: 0.05, value: 0.7 },
    { key: 'maxWalkers', label: 'Max branches', type: 'range', min: 50, max: 2500, step: 50, value: 1200 },
    { key: 'stepLen', label: 'Step length', type: 'range', min: 1, max: 5, step: 0.25, value: 2 },
    { key: 'startWidth', label: 'Trunk width', type: 'range', min: 0.8, max: 9, step: 0.2, value: 3.6 },
    { key: 'decay', label: 'Lifespan', type: 'range', min: 0.97, max: 0.999, step: 0.001, value: 0.994 },
    { key: 'avoid', label: 'Self-avoiding', type: 'checkbox', value: true },
    { key: 'speed', label: 'Sim speed', type: 'range', min: 1, max: 12, step: 1, value: 4 },
    { key: 'opacity', label: 'Opacity', type: 'range', min: 0.15, max: 1, step: 0.05, value: 0.9 },
    {
      key: 'colorBy', label: 'Color by', type: 'select', value: 'depth',
      options: [
        { value: 'depth', label: 'branch depth' },
        { value: 'radial', label: 'distance from center' },
        { value: 'branch', label: 'per branch' },
      ],
    },
  ],

  create({ ctx, width, height, rng, noise, palette, params }) {
    const P = params;
    const gw = Math.ceil(width / CELL);
    const gh = Math.ceil(height / CELL);
    const occ = new Uint8Array(gw * gh);
    const cellOf = (x, y) => Math.floor(y / CELL) * gw + Math.floor(x / CELL);
    const cx = width / 2;
    const cy = height / 2;
    const maxR = Math.hypot(cx, cy);
    const fieldScale = 0.0035;
    const walkers = [];

    const spawn = (x, y, a) => {
      const w = {
        x, y, a,
        w: P.startWidth,
        gen: 0,
        grace: 12,
        recent: [],
        colorT: rng.random(),
        alive: true,
        path: [x, y],
      };
      occ[cellOf(x, y)] = 1;
      walkers.push(w);
    };

    const seeds = Math.round(P.seeds);
    for (let i = 0; i < seeds; i++) {
      if (P.origin === 'center') {
        spawn(
          cx + rng.range(-6, 6),
          cy + rng.range(-6, 6),
          (i / seeds) * TAU + rng.range(-0.3, 0.3)
        );
      } else if (P.origin === 'bottom') {
        const x = width * 0.15 + ((i + 0.5) / seeds) * width * 0.7 + rng.range(-20, 20);
        spawn(x, height - 8, -Math.PI / 2 + rng.range(-0.3, 0.3));
      } else if (P.origin === 'edges') {
        const a = (i / seeds) * TAU + rng.range(-0.2, 0.2);
        const x = cx + Math.cos(a) * (width / 2 - 10);
        const y = cy + Math.sin(a) * (height / 2 - 10);
        spawn(x, y, Math.atan2(cy - y, cx - x) + rng.range(-0.3, 0.3));
      } else {
        spawn(rng.range(20, width - 20), rng.range(20, height - 20), rng.random() * TAU);
      }
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    function advance(w) {
      w.a +=
        rng.gaussian() * P.wiggle * 0.4 +
        noise.fbm(w.x * fieldScale, w.y * fieldScale, w.gen * 0.31) * P.fieldBend * 0.55;
      const nx = w.x + Math.cos(w.a) * P.stepLen;
      const ny = w.y + Math.sin(w.a) * P.stepLen;

      if (nx < 4 || nx > width - 4 || ny < 4 || ny > height - 4) {
        w.alive = false;
        return;
      }
      const ci = cellOf(nx, ny);
      if (P.avoid && occ[ci] && w.grace <= 0 && !w.recent.includes(ci)) {
        w.path.push(nx, ny); // touch the structure it collided with, then stop
        w.alive = false;
        return;
      }
      const cm = cellOf((w.x + nx) / 2, (w.y + ny) / 2);
      occ[ci] = 1;
      occ[cm] = 1;
      w.recent.push(ci, cm);
      if (w.recent.length > 16) w.recent.splice(0, w.recent.length - 16);

      w.x = nx;
      w.y = ny;
      w.path.push(nx, ny);
      w.grace--;
      w.w *= P.decay;
      if (w.w < 0.25) w.alive = false;

      if (w.alive && w.w > 0.45 && walkers.length < P.maxWalkers && rng.random() < P.branch) {
        const dir = rng.random() < 0.5 ? -1 : 1;
        walkers.push({
          x: w.x, y: w.y,
          a: w.a + dir * rng.range(P.spread * 0.4, P.spread),
          w: w.w * 0.78,
          gen: w.gen + 1,
          grace: 8,
          recent: w.recent.slice(-8),
          colorT: rng.random(),
          alive: true,
          path: [w.x, w.y],
        });
      }
    }

    function colorOf(w) {
      if (P.colorBy === 'depth') return samplePalette(palette.colors, Math.min(w.gen / 6, 1));
      if (P.colorBy === 'radial') return samplePalette(palette.colors, Math.hypot(w.x - cx, w.y - cy) / maxR);
      return samplePalette(palette.colors, w.colorT);
    }

    return {
      frame() {
        let anyAlive = false;
        for (let s = 0; s < P.speed; s++) {
          const len = walkers.length; // children spawned this pass advance next pass
          for (let i = 0; i < len; i++) {
            if (walkers[i].alive) advance(walkers[i]);
          }
        }
        for (const w of walkers) {
          if (w.path.length >= 4) {
            ctx.strokeStyle = withAlpha(colorOf(w), P.opacity);
            ctx.lineWidth = Math.max(w.w, 0.32);
            ctx.beginPath();
            ctx.moveTo(w.path[0], w.path[1]);
            for (let j = 2; j < w.path.length; j += 2) ctx.lineTo(w.path[j], w.path[j + 1]);
            ctx.stroke();
          }
          w.path = [w.x, w.y];
          if (w.alive) anyAlive = true;
        }
        return anyAlive;
      },
    };
  },
};

// Coral Growth: differential growth of a polyline. Nodes attract their chain
// neighbors, repel everything nearby, and new nodes are inserted on stretched
// edges, so the loop buckles and folds like coral or brain tissue.

import { TAU, clamp, samplePalette, withAlpha } from '../core/util.js';

export default {
  id: 'coral',
  name: 'Coral Growth',
  interactive: true,
  symmetry: true,
  hint: 'grab the living edge and pull — it keeps growing around your finger',
  description: 'A living loop that buckles and folds like coral as it grows — grab the edge and pull it while it grows.',
  params: [
    {
      key: 'shape', label: 'Starting shape', type: 'select', value: 'circle',
      options: [
        { value: 'circle', label: 'circle' },
        { value: 'blob', label: 'noisy blob' },
        { value: 'line', label: 'open line' },
      ],
    },
    { key: 'maxLen', label: 'Edge length', type: 'range', min: 4, max: 24, step: 0.5, value: 9 },
    { key: 'repelRadius', label: 'Repel radius', type: 'range', min: 6, max: 40, step: 1, value: 13 },
    { key: 'repel', label: 'Repulsion', type: 'range', min: 0, max: 2, step: 0.05, value: 1.0 },
    { key: 'attract', label: 'Cohesion', type: 'range', min: 0.05, max: 1.5, step: 0.05, value: 0.5 },
    { key: 'jitter', label: 'Noise jitter', type: 'range', min: 0, max: 2, step: 0.05, value: 0.45 },
    { key: 'growth', label: 'Growth rate', type: 'range', min: 0, max: 8, step: 0.2, value: 1.6 },
    { key: 'maxNodes', label: 'Final size (nodes)', type: 'range', min: 300, max: 6000, step: 100, value: 3600 },
    { key: 'speed', label: 'Sim speed', type: 'range', min: 1, max: 6, step: 1, value: 2 },
    { key: 'lineWidth', label: 'Stroke width', type: 'range', min: 0.4, max: 4, step: 0.1, value: 1 },
    { key: 'trails', label: 'Leave trails (growth rings)', type: 'checkbox', value: true },
    { key: 'trailAlpha', label: 'Trail opacity', type: 'range', min: 0.02, max: 0.4, step: 0.01, value: 0.08 },
  ],

  create({ ctx, width, height, rng, noise, palette, params }) {
    const P = params;
    const closed = P.shape !== 'line';
    const nodes = [];
    const cx = width / 2;
    const cy = height / 2;

    if (closed) {
      const r0 = Math.min(width, height) * 0.16;
      const count = 80;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * TAU;
        // sample noise around a circle so the blob's radius wraps seamlessly
        const wob = P.shape === 'blob' ? 1 + 0.45 * noise.fbm(Math.cos(a) * 1.3 + 10, Math.sin(a) * 1.3 + 10) : 1;
        nodes.push({ x: cx + Math.cos(a) * r0 * wob, y: cy + Math.sin(a) * r0 * wob });
      }
    } else {
      const span = width * 0.6;
      const count = 90;
      for (let i = 0; i < count; i++) {
        const x = cx - span / 2 + (i / (count - 1)) * span;
        nodes.push({ x, y: cy + noise.fbm(x * 0.004, 3.7) * 14 });
      }
    }

    let acc = 0;
    let time = 0;
    let done = false;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    function step() {
      const n = nodes.length;
      const R = P.repelRadius;
      const R2 = R * R;
      const cell = Math.max(8, R);
      const cols = Math.max(1, Math.ceil(width / cell));
      const rows = Math.max(1, Math.ceil(height / cell));
      const grid = new Array(cols * rows);
      for (let i = 0; i < n; i++) {
        const gx = clamp(Math.floor(nodes[i].x / cell), 0, cols - 1);
        const gy = clamp(Math.floor(nodes[i].y / cell), 0, rows - 1);
        const gi = gy * cols + gx;
        (grid[gi] || (grid[gi] = [])).push(i);
      }

      const fxs = new Float32Array(n);
      const fys = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        if (!closed && (i === 0 || i === n - 1)) continue; // pin open-line endpoints
        const p = nodes[i];
        const prev = nodes[(i - 1 + n) % n];
        const next = nodes[(i + 1) % n];
        let fx = ((prev.x + next.x) / 2 - p.x) * P.attract;
        let fy = ((prev.y + next.y) / 2 - p.y) * P.attract;

        const gx = clamp(Math.floor(p.x / cell), 0, cols - 1);
        const gy = clamp(Math.floor(p.y / cell), 0, rows - 1);
        for (let oy = -1; oy <= 1; oy++) {
          const yy = gy + oy;
          if (yy < 0 || yy >= rows) continue;
          for (let ox = -1; ox <= 1; ox++) {
            const xx = gx + ox;
            if (xx < 0 || xx >= cols) continue;
            const bucket = grid[yy * cols + xx];
            if (!bucket) continue;
            for (const j of bucket) {
              if (j === i) continue;
              const q = nodes[j];
              if (q === prev || q === next) continue;
              const dx = p.x - q.x;
              const dy = p.y - q.y;
              const d2 = dx * dx + dy * dy;
              if (d2 > R2 || d2 < 1e-6) continue;
              const d = Math.sqrt(d2);
              const f = ((1 - d / R) * P.repel * 1.2) / d;
              fx += dx * f;
              fy += dy * f;
            }
          }
        }

        const ja = noise.fbm(p.x * 0.005, p.y * 0.005, time * 0.15) * TAU * 2;
        fx += Math.cos(ja) * P.jitter * 0.5;
        fy += Math.sin(ja) * P.jitter * 0.5;

        const m = 10; // soft wall to keep growth inside the canvas
        if (p.x < m) fx += (m - p.x) * 0.05;
        if (p.x > width - m) fx -= (p.x - (width - m)) * 0.05;
        if (p.y < m) fy += (m - p.y) * 0.05;
        if (p.y > height - m) fy -= (p.y - (height - m)) * 0.05;

        fxs[i] = clamp(fx, -2, 2);
        fys[i] = clamp(fy, -2, 2);
      }
      for (let i = 0; i < n; i++) {
        nodes[i].x += fxs[i];
        nodes[i].y += fys[i];
      }

      const lastEdge = closed ? nodes.length - 1 : nodes.length - 2;
      const splitCap = P.maxNodes * 1.25; // pulled edges may still split a little past done
      for (let i = lastEdge; i >= 0 && nodes.length < splitCap; i--) {
        const a = nodes[i];
        const b = nodes[(i + 1) % nodes.length];
        if (Math.hypot(b.x - a.x, b.y - a.y) > P.maxLen) {
          nodes.splice(i + 1, 0, { x: (a.x + b.x) / 2 + rng.range(-0.5, 0.5), y: (a.y + b.y) / 2 + rng.range(-0.5, 0.5) });
        }
      }

      // pinned nodes stick to the finger — the loop grows around the pull
      for (const pin of pins.values()) {
        pin.node.x = pin.x;
        pin.node.y = pin.y;
      }

      acc += P.growth;
      while (acc >= 1 && nodes.length < P.maxNodes) {
        acc -= 1;
        const i = rng.int(0, nodes.length - (closed ? 1 : 2));
        const a = nodes[i];
        const b = nodes[(i + 1) % nodes.length];
        nodes.splice(i + 1, 0, { x: (a.x + b.x) / 2 + rng.range(-1, 1), y: (a.y + b.y) / 2 + rng.range(-1, 1) });
      }
      time++;
    }

    function tracePath() {
      ctx.beginPath();
      ctx.moveTo(nodes[0].x, nodes[0].y);
      for (let i = 1; i < nodes.length; i++) ctx.lineTo(nodes[i].x, nodes[i].y);
      if (closed) ctx.closePath();
    }

    function drawTrail(alpha) {
      const t = clamp(nodes.length / P.maxNodes, 0, 1);
      ctx.strokeStyle = withAlpha(samplePalette(palette.colors, t), alpha);
      ctx.lineWidth = P.lineWidth;
      tracePath();
      ctx.stroke();
    }

    function drawCrisp() {
      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, width, height);
      // color travels around the loop; draw in quantized segment buckets
      const n = nodes.length;
      const SEGS = 24;
      ctx.lineWidth = P.lineWidth;
      for (let s = 0; s < SEGS; s++) {
        const from = Math.floor((s / SEGS) * n);
        const to = Math.min(Math.floor(((s + 1) / SEGS) * n) + 1, n - 1);
        ctx.strokeStyle = samplePalette(palette.colors, s / (SEGS - 1));
        ctx.beginPath();
        ctx.moveTo(nodes[from].x, nodes[from].y);
        for (let i = from + 1; i <= to; i++) ctx.lineTo(nodes[i].x, nodes[i].y);
        if (closed && s === SEGS - 1) ctx.lineTo(nodes[0].x, nodes[0].y);
        ctx.stroke();
      }
    }

    const pins = new Map(); // per mirror index: { node, x, y }

    function nearestNode(x, y) {
      let best = null;
      let bd = Infinity;
      for (const nd of nodes) {
        const d = (nd.x - x) * (nd.x - x) + (nd.y - y) * (nd.y - y);
        if (d < bd) {
          bd = d;
          best = nd;
        }
      }
      return best;
    }

    return {
      frame() {
        if (done && pins.size === 0) return false;
        for (let s = 0; s < P.speed; s++) step();
        if (P.trails) drawTrail(P.trailAlpha);
        else drawCrisp();
        if (nodes.length >= P.maxNodes && pins.size === 0) {
          done = true;
          if (P.trails) drawTrail(0.85); // crisp final edge over the layered history
          return false;
        }
        return true;
      },
      onDown(x, y, k = 0) {
        done = false; // waking a finished coral lets it respond to the pull
        pins.set(k, { node: nearestNode(x, y), x, y });
      },
      onMove(x, y, dx, dy, k = 0) {
        const pin = pins.get(k);
        if (pin) {
          pin.x = x;
          pin.y = y;
        }
      },
      onUp(x, y, dist, k = 0) {
        pins.delete(k);
      },
    };
  },
};

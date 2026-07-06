// Apollonian gasket: three mutually tangent circles, recursively filled with
// the circle tangent to each triple (Descartes Circle Theorem). Uses the
// "other solution" identity so no complex square roots are needed.

import { samplePalette, mixHex, hexToRgb } from '../core/util.js';

export default {
  id: 'apollonian',
  name: 'Apollonian Gasket',
  category: 'Fractal',
  interactive: true,
  hint: 'drag to reshape the mother circles — the whole gasket recomputes',
  description: 'Infinitely nested mutually-tangent circles (Descartes Circle Theorem) — drag to reshape the mother circles and the whole nesting reflows.',
  params: [
    { key: 'depth', label: 'Recursion depth', type: 'range', min: 2, max: 11, step: 1, value: 8 },
    { key: 'minR', label: 'Smallest circle (px)', type: 'range', min: 0.5, max: 8, step: 0.5, value: 1.5 },
    { key: 'lineWidth', label: 'Line width', type: 'range', min: 0.3, max: 3, step: 0.1, value: 1 },
    { key: 'fill', label: 'Fill circles', type: 'checkbox', value: false },
    { key: 'colorMode', label: 'Color by', type: 'select', value: 'size', options: [
      { value: 'size', label: 'circle size' },
      { value: 'depth', label: 'recursion depth' },
    ] },
  ],

  create({ ctx, width, height, palette, params }) {
    const P = params;
    const R = Math.min(width, height) * 0.46;
    const cx = width / 2;
    const cy = height / 2;
    const maxDepth = Math.round(P.depth);
    const maxK = R / P.minR; // curvature cap (radius below minR stops recursion)
    const bgIsDark = hexToRgb(palette.bg).reduce((a, b) => a + b, 0) < 384;

    let circles = []; // {k, x, y} in unit space (radius 1 outer)

    // Descartes "other solution": given three mutually tangent circles and one
    // of their two Soddy circles, the other follows without a square root.
    function other(a, b, c, prev) {
      const k = 2 * (a.k + b.k + c.k) - prev.k;
      if (Math.abs(k) < 1e-9) return null;
      return {
        k,
        x: (2 * (a.k * a.x + b.k * b.x + c.k * c.x) - prev.k * prev.x) / k,
        y: (2 * (a.k * a.y + b.k * b.y + c.k * c.y) - prev.k * prev.y) / k,
      };
    }

    function recurse(c1, c2, c3, c4, depth) {
      circles.push(c4);
      if (depth <= 0 || Math.abs(c4.k) > maxK) return;
      const triples = [[c1, c2, c4, c3], [c1, c3, c4, c2], [c2, c3, c4, c1]];
      for (const [a, b, c, prev] of triples) {
        const nc = other(a, b, c, prev);
        if (nc) recurse(a, b, c, nc, depth - 1);
      }
    }

    // Seed geometry: two mother circles of radius p and 1-p on an axis at
    // angle theta, both tangent to each other and internally to the outer
    // unit circle. The two Soddy companions have curvature 1/p + 1/(1-p) - 1
    // (the Descartes root term vanishes for this family).
    let maxAbsK = 1;
    function buildGasket(p, theta) {
      circles = [];
      const r1 = p;
      const r2 = 1 - p;
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);
      const x1 = -(1 - r1);
      const x2 = 1 - r2;
      const c0 = { k: -1, x: 0, y: 0 };
      const c1 = { k: 1 / r1, x: x1 * cos, y: x1 * sin };
      const c2 = { k: 1 / r2, x: x2 * cos, y: x2 * sin };
      // companion circle: solve tangency to outer + both mothers on the axis
      const k3 = 1 / r1 + 1 / r2 - 1;
      const r3 = 1 / k3;
      const ax = (x1 * x1 + (1 - r3) * (1 - r3) - (r3 + r1) * (r3 + r1)) / (2 * x1);
      const ay = Math.sqrt(Math.max(0, (1 - r3) * (1 - r3) - ax * ax));
      circles.push(c0, c1, c2);
      recurse(c0, c1, c2, { k: k3, x: ax * cos - ay * sin, y: ax * sin + ay * cos }, maxDepth);
      recurse(c0, c1, c2, { k: k3, x: ax * cos + ay * sin, y: ax * sin - ay * cos }, maxDepth);
      maxAbsK = 1;
      for (const c of circles) maxAbsK = Math.max(maxAbsK, Math.abs(c.k));
    }
    buildGasket(0.5, 0);

    function draw() {
      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, width, height);
      ctx.lineWidth = P.lineWidth;
      for (const c of circles) {
        const r = (1 / Math.abs(c.k)) * R;
        if (r < 0.4) continue;
        const x = cx + c.x * R;
        const y = cy + c.y * R;
        const t = Math.min(1, Math.log(Math.abs(c.k) + 1) / Math.log(maxAbsK + 1));
        const color = samplePalette(palette.colors, t);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        if (P.fill && c.k > 0) {
          ctx.fillStyle = mixHex(color, palette.bg, 0.45);
          ctx.fill();
        }
        ctx.strokeStyle = c.k < 0 ? mixHex(color, bgIsDark ? '#ffffff' : '#000000', 0.3) : color;
        ctx.stroke();
      }
    }

    let dirty = true;
    function reshape(x, y) {
      const dx = x - cx;
      const dy = y - cy;
      const theta = Math.atan2(dy, dx);
      // distance from centre sets the mothers' split: centre = even halves,
      // the rim pushes one mother to swallow most of the disc
      const p = Math.min(0.82, Math.max(0.18, 0.5 + (Math.hypot(dx, dy) / R) * 0.4));
      buildGasket(p, theta);
      dirty = true;
    }

    return {
      frame() {
        if (dirty) {
          draw();
          dirty = false;
        }
        return true; // stay live for reshaping drags
      },
      onDown(x, y) {
        reshape(x, y);
      },
      onMove(x, y) {
        reshape(x, y);
      },
    };
  },
};

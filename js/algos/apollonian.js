// Apollonian gasket: three mutually tangent circles, recursively filled with
// the circle tangent to each triple (Descartes Circle Theorem). Uses the
// "other solution" identity so no complex square roots are needed.

import { samplePalette, mixHex, hexToRgb } from '../core/util.js';

export default {
  id: 'apollonian',
  name: 'Apollonian Gasket',
  category: 'Fractal',
  description: 'Infinitely nested mutually-tangent circles, filled by the Descartes Circle Theorem.',
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

    const circles = []; // {k, x, y} in unit space (radius 1 outer)

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

    // symmetric seed: outer (k=-1) with two k=2 circles, generating two k=3
    const c0 = { k: -1, x: 0, y: 0 };
    const c1 = { k: 2, x: -0.5, y: 0 };
    const c2 = { k: 2, x: 0.5, y: 0 };
    circles.push(c0, c1, c2);
    recurse(c0, c1, c2, { k: 3, x: 0, y: 2 / 3 }, maxDepth);
    recurse(c0, c1, c2, { k: 3, x: 0, y: -2 / 3 }, maxDepth);

    let maxAbsK = 1;
    for (const c of circles) maxAbsK = Math.max(maxAbsK, Math.abs(c.k));

    let drawn = false;
    return {
      frame() {
        if (drawn) return false;
        drawn = true;
        ctx.fillStyle = palette.bg;
        ctx.fillRect(0, 0, width, height);
        ctx.lineWidth = P.lineWidth;
        for (const c of circles) {
          const r = (1 / Math.abs(c.k)) * R;
          if (r * 1 < 0.4) continue;
          const x = cx + c.x * R;
          const y = cy + c.y * R;
          const t = P.colorMode === 'depth'
            ? Math.min(1, Math.log(Math.abs(c.k) + 1) / Math.log(maxAbsK + 1))
            : Math.min(1, Math.log(Math.abs(c.k) + 1) / Math.log(maxAbsK + 1));
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
        return false;
      },
    };
  },
};

// Low-Poly Mesh: the faceted-triangle wallpaper look — jittered points
// triangulated with Bowyer-Watson, each face flat-shaded from the palette
// with a crystal-light variance.

import { samplePalette, mixHex, clamp } from '../core/util.js';

export default {
  id: 'delaunay',
  name: 'Low-Poly Mesh',
  category: 'Geometric',
  description: 'Faceted low-poly triangulation, flat-shaded like cut glass or folded paper.',
  params: [
    { key: 'detail', label: 'Detail', type: 'range', min: 30, max: 200, step: 5, value: 80 },
    { key: 'jitter', label: 'Irregularity', type: 'range', min: 0, max: 1, step: 0.05, value: 0.8 },
    { key: 'facet', label: 'Facet lighting', type: 'range', min: 0, max: 1, step: 0.05, value: 0.5 },
    { key: 'edgeWidth', label: 'Edge width', type: 'range', min: 0, max: 4, step: 0.25, value: 0 },
    {
      key: 'colorMode', label: 'Color by', type: 'select', value: 'diagonal',
      options: [
        { value: 'diagonal', label: 'diagonal gradient' },
        { value: 'radial', label: 'radial' },
        { value: 'scatter', label: 'scattered' },
      ],
    },
  ],

  create({ ctx, width, height, rng, palette, params }) {
    const P = params;

    // Bowyer-Watson over triangles kept as vertex-index triples
    function triangulate(pts) {
      const n = pts.length;
      // super-triangle big enough to contain everything
      const m = Math.max(width, height) * 8;
      pts.push([-m, -m], [m * 2, -m], [width / 2, m * 2]);
      let tris = [[n, n + 1, n + 2]];
      const circum = (t) => {
        const [a, b, c] = t.map((i) => pts[i]);
        const d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]));
        if (Math.abs(d) < 1e-9) return null;
        const a2 = a[0] * a[0] + a[1] * a[1];
        const b2 = b[0] * b[0] + b[1] * b[1];
        const c2 = c[0] * c[0] + c[1] * c[1];
        const ux = (a2 * (b[1] - c[1]) + b2 * (c[1] - a[1]) + c2 * (a[1] - b[1])) / d;
        const uy = (a2 * (c[0] - b[0]) + b2 * (a[0] - c[0]) + c2 * (b[0] - a[0])) / d;
        return [ux, uy, (a[0] - ux) ** 2 + (a[1] - uy) ** 2];
      };
      const circs = new Map();
      const circOf = (t) => {
        const key = t.join(',');
        if (!circs.has(key)) circs.set(key, circum(t));
        return circs.get(key);
      };
      for (let i = 0; i < n; i++) {
        const [px, py] = pts[i];
        const bad = [];
        const rest = [];
        for (const t of tris) {
          const cc = circOf(t);
          if (cc && (px - cc[0]) ** 2 + (py - cc[1]) ** 2 < cc[2]) bad.push(t);
          else rest.push(t);
        }
        // boundary of the bad-triangle hole = edges not shared by two bad tris
        const edges = new Map();
        for (const t of bad) {
          for (let e = 0; e < 3; e++) {
            const a = t[e];
            const b = t[(e + 1) % 3];
            const key = a < b ? a + '-' + b : b + '-' + a;
            edges.set(key, edges.has(key) ? null : [a, b]);
          }
        }
        tris = rest;
        for (const edge of edges.values()) {
          if (edge) tris.push([edge[0], edge[1], i]);
        }
      }
      // drop triangles touching the super-triangle
      return tris.filter((t) => t[0] < n && t[1] < n && t[2] < n);
    }

    let drawn = false;
    return {
      frame() {
        if (drawn) return false;
        drawn = true;
        ctx.fillStyle = palette.bg;
        ctx.fillRect(0, 0, width, height);

        // jittered grid + pinned border so the mesh reaches every edge
        const spacing = Math.max(width, height) / Math.sqrt(P.detail * (width / height) * 10);
        const pts = [];
        for (let y = 0; y <= height + spacing; y += spacing) {
          for (let x = 0; x <= width + spacing; x += spacing) {
            const edge = x === 0 || y === 0 || x + spacing > width || y + spacing > height;
            const j = edge ? 0 : P.jitter * spacing * 0.48;
            pts.push([x + (rng.random() * 2 - 1) * j, y + (rng.random() * 2 - 1) * j]);
          }
        }

        const D = width + height;
        for (const t of triangulate(pts)) {
          const [a, b, c] = t.map((i) => pts[i]);
          const mx = (a[0] + b[0] + c[0]) / 3;
          const my = (a[1] + b[1] + c[1]) / 3;
          let tt;
          if (P.colorMode === 'radial') {
            tt = Math.hypot(mx - width / 2, my - height / 2) / (Math.hypot(width, height) / 2);
          } else if (P.colorMode === 'scatter') tt = rng.random();
          else tt = (mx + my) / D;
          let fill = samplePalette(palette.colors, clamp(tt, 0, 1));
          // crystal-light: each facet catches a different amount of light
          const light = (rng.random() - 0.5) * P.facet;
          fill = mixHex(fill, light > 0 ? '#ffffff' : '#000000', Math.abs(light) * 0.45);
          ctx.fillStyle = fill;
          ctx.beginPath();
          ctx.moveTo(a[0], a[1]);
          ctx.lineTo(b[0], b[1]);
          ctx.lineTo(c[0], c[1]);
          ctx.closePath();
          ctx.fill();
          if (P.edgeWidth > 0) {
            ctx.strokeStyle = palette.bg;
            ctx.lineWidth = P.edgeWidth;
            ctx.stroke();
          } else {
            // hairline self-stroke hides antialiasing seams between facets
            ctx.strokeStyle = fill;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
        return false;
      },
    };
  },
};

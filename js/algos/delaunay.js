// Low-Poly Mesh: the faceted-triangle wallpaper look — jittered points
// triangulated with Bowyer-Watson, each face flat-shaded from the palette
// with a crystal-light variance. Interactive: drag a vertex and the whole
// mesh retriangulates live around your finger.

import { samplePalette, mixHex, clamp } from '../core/util.js';

// deterministic per-position hash so facet colors stay put across redraws
function hash01(x, y) {
  return Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
}

export default {
  id: 'delaunay',
  name: 'Low-Poly Mesh',
  category: 'Geometric',
  interactive: true,
  symmetry: true,
  hint: 'drag a vertex — the whole mesh retriangulates under your finger',
  description: 'Faceted low-poly triangulation, flat-shaded like cut glass — drag a vertex and it reflows live.',
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

    // jittered grid + pinned border so the mesh reaches every edge; border
    // points are not draggable (they keep the mesh full-bleed)
    const spacing = Math.max(width, height) / Math.sqrt(P.detail * (width / height) * 10);
    const pts = [];
    const draggable = [];
    for (let y = 0; y <= height + spacing; y += spacing) {
      for (let x = 0; x <= width + spacing; x += spacing) {
        const edge = x === 0 || y === 0 || x + spacing > width || y + spacing > height;
        const j = edge ? 0 : P.jitter * spacing * 0.48;
        pts.push([x + (rng.random() * 2 - 1) * j, y + (rng.random() * 2 - 1) * j]);
        draggable.push(!edge);
      }
    }
    const nReal = pts.length;

    // Bowyer-Watson over triangles kept as vertex-index triples
    function triangulate() {
      const work = pts.slice(0, nReal);
      const m = Math.max(width, height) * 8;
      work.push([-m, -m], [m * 2, -m], [width / 2, m * 2]);
      let tris = [[nReal, nReal + 1, nReal + 2]];
      const circum = (t) => {
        const [a, b, c] = t.map((i) => work[i]);
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
      for (let i = 0; i < nReal; i++) {
        const [px, py] = work[i];
        const bad = [];
        const rest = [];
        for (const t of tris) {
          const cc = circOf(t);
          if (cc && (px - cc[0]) ** 2 + (py - cc[1]) ** 2 < cc[2]) bad.push(t);
          else rest.push(t);
        }
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
      return tris.filter((t) => t[0] < nReal && t[1] < nReal && t[2] < nReal);
    }

    let tris = triangulate();

    function draw() {
      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, width, height);
      const D = width + height;
      for (const t of tris) {
        const [a, b, c] = t.map((i) => pts[i]);
        const mx = (a[0] + b[0] + c[0]) / 3;
        const my = (a[1] + b[1] + c[1]) / 3;
        let tt;
        if (P.colorMode === 'radial') {
          tt = Math.hypot(mx - width / 2, my - height / 2) / (Math.hypot(width, height) / 2);
        } else if (P.colorMode === 'scatter') tt = hash01(mx * 0.6, my * 0.6);
        else tt = (mx + my) / D;
        let fill = samplePalette(palette.colors, clamp(tt, 0, 1));
        // crystal-light: each facet catches a stable amount of light
        const light = (hash01(mx, my) - 0.5) * P.facet;
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
    }

    let dirty = true;
    const dragIdx = new Map();

    return {
      frame() {
        if (dirty) {
          draw();
          dirty = false;
        }
        return true; // stay live for vertex drags
      },
      onDown(x, y, k = 0) {
        let best = -1;
        let bd = Infinity;
        for (let i = 0; i < nReal; i++) {
          if (!draggable[i]) continue;
          const dx = x - pts[i][0];
          const dy = y - pts[i][1];
          const d = dx * dx + dy * dy;
          if (d < bd) {
            bd = d;
            best = i;
          }
        }
        dragIdx.set(k, best);
      },
      onMove(x, y, dx, dy, k = 0) {
        const i = dragIdx.get(k);
        if (i === undefined || i < 0) return;
        pts[i][0] = clamp(x, 1, width - 1);
        pts[i][1] = clamp(y, 1, height - 1);
        tris = triangulate(); // the whole mesh reflows under the finger
        dirty = true;
      },
      onUp(x, y, dist, k = 0) {
        dragIdx.delete(k);
      },
    };
  },
};

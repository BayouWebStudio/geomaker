// Tessellations: the classic Archimedean tilings — triangle grids, the
// trihexagonal star lattice, octagons-and-squares, and the rhombitrihexagonal
// hex-square-triangle mix — with a grout gap and per-shape coloring.

import { TAU, samplePalette } from '../core/util.js';

export default {
  id: 'tessellation',
  name: 'Tessellations',
  category: 'Geometric',
  description: 'Archimedean tilings: triangles, trihexagonal, octagon-and-square, and hex-square-triangle lattices.',
  params: [
    {
      key: 'style', label: 'Tiling', type: 'select', value: 'octasquare',
      options: [
        { value: 'triangles', label: 'triangle grid' },
        { value: 'trihex', label: 'trihexagonal' },
        { value: 'octasquare', label: 'octagons & squares' },
        { value: 'rhombitri', label: 'hex · square · triangle' },
      ],
    },
    { key: 'size', label: 'Tile size', type: 'range', min: 12, max: 90, step: 2, value: 38 },
    { key: 'gap', label: 'Grout gap', type: 'range', min: 0, max: 0.3, step: 0.01, value: 0.06 },
    { key: 'rotation', label: 'Rotation', type: 'range', min: 0, max: 90, step: 5, value: 0 },
    { key: 'variance', label: 'Tone variance', type: 'range', min: 0, max: 1, step: 0.05, value: 0.25 },
    {
      key: 'colorMode', label: 'Color by', type: 'select', value: 'shape',
      options: [
        { value: 'shape', label: 'by shape' },
        { value: 'gradient', label: 'gradient' },
        { value: 'random', label: 'random' },
      ],
    },
  ],

  create({ ctx, width, height, rng, palette, params }) {
    const P = params;
    const D = Math.hypot(width, height);

    // shapeT: a stable palette position per shape kind (hex/square/triangle…)
    function fill(pts, shapeT) {
      let t;
      if (P.colorMode === 'gradient') {
        const c = pts.reduce(([sx, sy], [x, y]) => [sx + x, sy + y], [0, 0]);
        t = (c[0] / pts.length + c[1] / pts.length) / (D * 1.05);
      } else if (P.colorMode === 'random') t = rng.random();
      else t = shapeT;
      t = Math.min(1, Math.max(0, t + (rng.random() - 0.5) * P.variance * 0.4));
      ctx.fillStyle = samplePalette(palette.colors, t);
      // shrink toward the centroid for the grout gap
      const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
      const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
      const k = 1 - P.gap;
      ctx.beginPath();
      pts.forEach(([x, y], i) => {
        const px = cx + (x - cx) * k;
        const py = cy + (y - cy) * k;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.fill();
    }

    function regular(cx, cy, r, n, rot) {
      const pts = [];
      for (let i = 0; i < n; i++) {
        const a = rot + (i / n) * TAU;
        pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
      }
      return pts;
    }

    function drawTriangles(a) {
      const h = (a * Math.sqrt(3)) / 2;
      for (let j = -1; j * h < D + h; j++) {
        for (let i = -1; i * a < D + a; i++) {
          const x = i * a + (j % 2 ? a / 2 : 0);
          const y = j * h;
          fill([[x, y], [x + a, y], [x + a / 2, y + h]], 0.25);
          fill([[x + a, y], [x + a / 2, y + h], [x + a * 1.5, y + h]], 0.75);
        }
      }
    }

    function drawTrihex(a) {
      // hexagons (vertex radius a) on a triangular lattice of spacing 2a;
      // the gaps between three mutual neighbours are equilateral triangles
      const ux = 2 * a;
      const vy = a * Math.sqrt(3);
      for (let j = -2; j * vy < D + vy * 2; j++) {
        for (let i = -2; i * ux < D + ux * 2; i++) {
          const x = i * ux + (j % 2 ? a : 0);
          const y = j * vy;
          fill(regular(x, y, a, 6, 0), 0.3);
          // up/down gap triangles: midpoints toward three mutual neighbours
          fill([[x + a, y], [x + 1.5 * a, y + vy / 2], [x + a / 2, y + vy / 2]], 0.8);
          fill([[x + a, y], [x + 1.5 * a, y - vy / 2], [x + a / 2, y - vy / 2]], 0.8);
        }
      }
    }

    function drawOctaSquare(a) {
      // truncated square tiling 4.8.8: octagon side a, period a(1+√2)
      const s = a * (1 + Math.SQRT2);
      const r = (a / 2) * Math.sqrt(4 + 2 * Math.SQRT2); // octagon vertex radius
      for (let j = -1; j * s < D + s; j++) {
        for (let i = -1; i * s < D + s; i++) {
          fill(regular(i * s, j * s, r, 8, Math.PI / 8), 0.35);
          fill(regular(i * s + s / 2, j * s + s / 2, a / Math.SQRT2, 4, Math.PI / 4), 0.85);
        }
      }
    }

    function drawRhombitri(a) {
      // 3.4.6.4: hexagons + a square on each edge + triangles at the seams
      const step = a * (1 + Math.sqrt(3)); // centre distance through a square
      const vy = (step * Math.sqrt(3)) / 2;
      for (let j = -2; j * vy < D + vy * 2; j++) {
        for (let i = -2; i * step < D + step * 2; i++) {
          const x = i * step + (j % 2 ? step / 2 : 0);
          const y = j * vy;
          // vertices at 30°/90°/… so the flat edges face the lattice neighbours
          const hex = regular(x, y, a, 6, Math.PI / 6);
          fill(hex, 0.25);
          for (let e = 0; e < 6; e++) {
            const [x1, y1] = hex[e];
            const [x2, y2] = hex[(e + 1) % 6];
            const nx = ((y2 - y1) / a);
            const ny = -((x2 - x1) / a);
            // square extruded outward from the hex edge
            const q = [[x1, y1], [x2, y2], [x2 + nx * a, y2 + ny * a], [x1 + nx * a, y1 + ny * a]];
            fill(q, 0.6);
            // triangle between this square and the next
            const [x3, y3] = hex[(e + 2) % 6];
            const mx = ((y3 - y2) / a);
            const my = -((x3 - x2) / a);
            fill([[x2, y2], [x2 + nx * a, y2 + ny * a], [x2 + mx * a, y2 + my * a]], 0.95);
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
        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.rotate((P.rotation * Math.PI) / 180);
        ctx.translate(-D / 2, -D / 2);
        if (P.style === 'triangles') drawTriangles(P.size);
        else if (P.style === 'trihex') drawTrihex(P.size / 2);
        else if (P.style === 'octasquare') drawOctaSquare(P.size / 2);
        else drawRhombitri(P.size / 2);
        ctx.restore();
        return false;
      },
    };
  },
};

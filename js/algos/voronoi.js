// Voronoi Cells: every seed owns the region closest to it. Each cell is built by
// clipping the canvas rectangle against the perpendicular bisector to every other
// seed (Sutherland–Hodgman), so cells are crisp convex polygons.
// Interactive: tap to add a seed, drag to move the nearest one.

import { samplePalette, mixHex, hexToRgb } from '../core/util.js';

export default {
  id: 'voronoi',
  name: 'Voronoi Cells',
  category: 'Organic',
  interactive: true,
  symmetry: true,
  hint: 'Tap to add a cell · drag to move the nearest one',
  description: 'A mosaic of nearest-neighbour cells — cracked glass, scales, stone. Tap to add cells, drag to shove them.',
  params: [
    { key: 'sites', label: 'Cells', type: 'range', min: 8, max: 220, step: 2, value: 80 },
    { key: 'relax', label: 'Evenness (relax)', type: 'range', min: 0, max: 3, step: 1, value: 1 },
    { key: 'gap', label: 'Cell gap', type: 'range', min: 0, max: 10, step: 0.5, value: 1.5 },
    { key: 'lineWidth', label: 'Edge width', type: 'range', min: 0, max: 5, step: 0.25, value: 1 },
    { key: 'fill', label: 'Fill cells', type: 'checkbox', value: true },
    { key: 'jitter', label: 'Color variation', type: 'range', min: 0, max: 1, step: 0.05, value: 0.3 },
    {
      key: 'colorMode', label: 'Color by', type: 'select', value: 'radial',
      options: [
        { value: 'radial', label: 'distance from center' },
        { value: 'random', label: 'random' },
      ],
    },
  ],

  create({ ctx, width, height, rng, palette, params }) {
    const P = params;
    const cx = width / 2;
    const cy = height / 2;
    const maxR = Math.hypot(cx, cy) || 1;
    const bgIsDark = hexToRgb(palette.bg).reduce((a, b) => a + b, 0) < 384;
    const mixT = bgIsDark ? '#ffffff' : '#000000';
    let dirty = true;

    let sites = [];
    const n = Math.round(P.sites);
    for (let i = 0; i < n; i++) sites.push({ x: rng.range(0, width), y: rng.range(0, height), t: rng.random() });

    // Lloyd relaxation (grid-sampled centroids) for more even, organic cells
    function relax(iters) {
      const CELL = 6;
      const gw = Math.ceil(width / CELL);
      const gh = Math.ceil(height / CELL);
      for (let it = 0; it < iters; it++) {
        const sumX = new Float64Array(sites.length);
        const sumY = new Float64Array(sites.length);
        const cnt = new Float64Array(sites.length);
        for (let gy = 0; gy < gh; gy++) {
          for (let gx = 0; gx < gw; gx++) {
            const px = gx * CELL;
            const py = gy * CELL;
            let best = 0;
            let bd = Infinity;
            for (let i = 0; i < sites.length; i++) {
              const dx = px - sites[i].x;
              const dy = py - sites[i].y;
              const d = dx * dx + dy * dy;
              if (d < bd) {
                bd = d;
                best = i;
              }
            }
            sumX[best] += px;
            sumY[best] += py;
            cnt[best]++;
          }
        }
        for (let i = 0; i < sites.length; i++) {
          if (cnt[i] > 0) {
            sites[i].x = sumX[i] / cnt[i];
            sites[i].y = sumY[i] / cnt[i];
          }
        }
      }
    }
    relax(Math.round(P.relax));

    // keep the half-plane closer to s (points where (p - mid)·(t - s) <= 0)
    function clip(poly, mx, my, nx, ny) {
      const out = [];
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i];
        const b = poly[(i + 1) % poly.length];
        const da = (a[0] - mx) * nx + (a[1] - my) * ny;
        const db = (b[0] - mx) * nx + (b[1] - my) * ny;
        if (da <= 0) out.push(a);
        if (da < 0 !== db < 0) {
          const t = da / (da - db);
          out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
        }
      }
      return out;
    }

    function cellPolygon(si) {
      let poly = [[0, 0], [width, 0], [width, height], [0, height]];
      const s = sites[si];
      for (let j = 0; j < sites.length && poly.length; j++) {
        if (j === si) continue;
        const t = sites[j];
        poly = clip(poly, (s.x + t.x) / 2, (s.y + t.y) / 2, t.x - s.x, t.y - s.y);
      }
      return poly;
    }

    function shrink(poly, d) {
      let cxp = 0;
      let cyp = 0;
      for (const p of poly) {
        cxp += p[0];
        cyp += p[1];
      }
      cxp /= poly.length;
      cyp /= poly.length;
      return poly.map((p) => {
        const dx = cxp - p[0];
        const dy = cyp - p[1];
        const len = Math.hypot(dx, dy) || 1;
        return [p[0] + (dx / len) * d, p[1] + (dy / len) * d];
      });
    }

    function render() {
      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, width, height);
      ctx.lineJoin = 'round';
      ctx.lineWidth = P.lineWidth;
      for (let i = 0; i < sites.length; i++) {
        let poly = cellPolygon(i);
        if (poly.length < 3) continue;
        if (P.gap > 0) {
          poly = shrink(poly, P.gap / 2);
          if (poly.length < 3) continue;
        }
        let t = P.colorMode === 'random' ? sites[i].t : Math.hypot(sites[i].x - cx, sites[i].y - cy) / maxR;
        if (P.jitter > 0) t = Math.max(0, Math.min(1, t + (sites[i].t - 0.5) * P.jitter));
        const base = samplePalette(palette.colors, t);
        ctx.beginPath();
        ctx.moveTo(poly[0][0], poly[0][1]);
        for (let k = 1; k < poly.length; k++) ctx.lineTo(poly[k][0], poly[k][1]);
        ctx.closePath();
        if (P.fill) {
          ctx.fillStyle = base;
          ctx.fill();
        }
        if (P.lineWidth > 0) {
          ctx.strokeStyle = P.fill ? mixHex(base, mixT, 0.35) : base;
          ctx.stroke();
        }
      }
    }

    function nearest(x, y) {
      let bi = 0;
      let bd = Infinity;
      for (let i = 0; i < sites.length; i++) {
        const dx = x - sites[i].x;
        const dy = y - sites[i].y;
        const d = dx * dx + dy * dy;
        if (d < bd) {
          bd = d;
          bi = i;
        }
      }
      return bi;
    }

    const dragIdx = new Map(); // dragged site per mirror index
    return {
      frame() {
        if (dirty) {
          render();
          dirty = false;
        }
        return true;
      },
      onDown(x, y, k = 0) {
        if (sites.length) dragIdx.set(k, nearest(x, y));
      },
      onMove(x, y, dx, dy, k = 0) {
        const i = dragIdx.get(k);
        if (i !== undefined) {
          sites[i].x = x;
          sites[i].y = y;
          dirty = true;
        }
      },
      onUp(x, y, dist, k = 0) {
        if (dist < 6 && sites.length < 400) {
          sites.push({ x, y, t: rng.random() });
          dirty = true;
        }
        dragIdx.delete(k);
      },
    };
  },
};

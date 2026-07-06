// Kintsugi (金継ぎ): broken ceramic repaired with gold. Voronoi shards (built by
// per-site half-plane clipping) are filled as glaze and their seams are stroked
// with a metallic vein. Interactive like Voronoi Cells: drag grabs the nearest
// shard and the whole fracture network — gold seams included — reflows live
// under your finger; tap strikes a brand-new shard.

import { samplePalette, mixHex, hexToRgb } from '../core/util.js';

const METALS = {
  gold: ['#6b4e16', '#d4af37', '#fff1b0'],
  silver: ['#54565c', '#c6c9d2', '#ffffff'],
  copper: ['#5a2c16', '#c06a2e', '#ffd9af'],
};

export default {
  id: 'kintsugi',
  name: 'Kintsugi (金継ぎ)',
  category: 'Organic',
  interactive: true,
  symmetry: true,
  hint: 'tap to strike a new shard · drag a shard and the gold reflows',
  description: 'Broken ceramic mended with gold. Tap to strike a fracture; drag a shard and the crack network reflows live.',
  params: [
    { key: 'shards', label: 'Shards', type: 'range', min: 6, max: 160, step: 2, value: 34 },
    { key: 'relax', label: 'Evenness (relax)', type: 'range', min: 0, max: 3, step: 1, value: 1 },
    { key: 'seamWidth', label: 'Seam width', type: 'range', min: 1, max: 12, step: 0.5, value: 4 },
    { key: 'glazeVary', label: 'Glaze variation', type: 'range', min: 0, max: 1, step: 0.05, value: 0.35 },
    { key: 'glazeDepth', label: 'Glaze depth', type: 'range', min: 0, max: 0.6, step: 0.05, value: 0.2 },
    {
      key: 'metal', label: 'Mend with', type: 'select', value: 'gold',
      options: [
        { value: 'gold', label: 'gold (kintsugi)' },
        { value: 'silver', label: 'silver (gintsugi)' },
        { value: 'copper', label: 'copper' },
      ],
    },
  ],

  create({ ctx, width, height, rng, palette, params }) {
    const P = params;
    const cx = width / 2;
    const cy = height / 2;
    const maxR = Math.hypot(cx, cy) || 1;
    const metal = METALS[P.metal] || METALS.gold;
    let dirty = true;

    const sites = [];
    for (let i = 0, n = Math.round(P.shards); i < n; i++) {
      sites.push({ x: rng.range(0, width), y: rng.range(0, height), t: rng.random() });
    }

    function relax(iters) {
      const CELL = 7;
      const gw = Math.ceil(width / CELL);
      const gh = Math.ceil(height / CELL);
      for (let it = 0; it < iters; it++) {
        const sx = new Float64Array(sites.length);
        const sy = new Float64Array(sites.length);
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
            sx[best] += px;
            sy[best] += py;
            cnt[best]++;
          }
        }
        for (let i = 0; i < sites.length; i++) {
          if (cnt[i] > 0) {
            sites[i].x = sx[i] / cnt[i];
            sites[i].y = sy[i] / cnt[i];
          }
        }
      }
    }
    relax(Math.round(P.relax));

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

    let polys = [];
    function computePolys() {
      polys = sites.map((s, si) => {
        let poly = [[0, 0], [width, 0], [width, height], [0, height]];
        for (let j = 0; j < sites.length && poly.length; j++) {
          if (j === si) continue;
          const t = sites[j];
          poly = clip(poly, (s.x + t.x) / 2, (s.y + t.y) / 2, t.x - s.x, t.y - s.y);
        }
        return poly;
      });
    }
    computePolys();

    const dragIdx = new Map(); // shard being dragged, keyed by mirror index

    function nearestSite(x, y) {
      let best = -1;
      let bd = Infinity;
      for (let i = 0; i < sites.length; i++) {
        const dx = x - sites[i].x;
        const dy = y - sites[i].y;
        const d = dx * dx + dy * dy;
        if (d < bd) {
          bd = d;
          best = i;
        }
      }
      return best;
    }

    function tracePoly(poly) {
      ctx.moveTo(poly[0][0], poly[0][1]);
      for (let k = 1; k < poly.length; k++) ctx.lineTo(poly[k][0], poly[k][1]);
      ctx.closePath();
    }

    // three passes give the seam a rounded metallic body with a bright core
    function strokeMetal(traceFn, w) {
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.strokeStyle = metal[0];
      ctx.lineWidth = w * 1.5;
      ctx.beginPath();
      traceFn();
      ctx.stroke();
      ctx.strokeStyle = metal[1];
      ctx.lineWidth = w;
      ctx.beginPath();
      traceFn();
      ctx.stroke();
      ctx.strokeStyle = metal[2];
      ctx.lineWidth = Math.max(0.5, w * 0.35);
      ctx.beginPath();
      traceFn();
      ctx.stroke();
    }

    function render() {
      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, width, height);
      // glaze fills
      for (let i = 0; i < polys.length; i++) {
        const poly = polys[i];
        if (poly.length < 3) continue;
        let t = Math.hypot(sites[i].x - cx, sites[i].y - cy) / maxR;
        t = Math.max(0, Math.min(1, t + (sites[i].t - 0.5) * P.glazeVary));
        ctx.fillStyle = mixHex(samplePalette(palette.colors, t), '#000000', P.glazeDepth);
        ctx.beginPath();
        tracePoly(poly);
        ctx.fill();
      }
      // gold seams along every shard boundary
      for (const poly of polys) {
        if (poly.length < 3) continue;
        strokeMetal(() => tracePoly(poly), P.seamWidth);
      }
    }

    return {
      frame() {
        if (dirty) {
          render();
          dirty = false;
        }
        return true;
      },
      onDown(x, y, k = 0) {
        dragIdx.set(k, nearestSite(x, y));
      },
      onMove(x, y, dx, dy, k = 0) {
        const i = dragIdx.get(k);
        if (i === undefined || i < 0) return;
        sites[i].x = x;
        sites[i].y = y;
        computePolys(); // the whole fracture network reflows under the finger
        dirty = true;
      },
      onUp(x, y, dist, k = 0) {
        if (dist < 6 && sites.length < 400) {
          sites.push({ x, y, t: rng.random() });
          computePolys();
        }
        dragIdx.delete(k);
        dirty = true;
      },
    };
  },
};

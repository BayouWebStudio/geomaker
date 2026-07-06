// Pebbles: organic circle packing. Random candidates grow until they touch a
// neighbor, then get drawn as noise-wobbled blobs with flat illustrative
// fills — like river stones, cells or a riso-printed terrazzo.

import { TAU, samplePalette, mixHex, hexToRgb } from '../core/util.js';

const VERTS = 26;

export default {
  id: 'pebbles',
  name: 'Pebbles',
  interactive: true,
  symmetry: true,
  hint: 'drag a stone and the pack shoves aside · tap to drop a new one',
  description: 'Circle-packed stones drawn as wobbly flat blobs — drag one and the whole pack shoves around your finger.',
  params: [
    { key: 'tries', label: 'Packing attempts', type: 'range', min: 500, max: 8000, step: 100, value: 3000 },
    { key: 'minR', label: 'Smallest stone', type: 'range', min: 2, max: 20, step: 1, value: 4 },
    { key: 'maxR', label: 'Largest stone', type: 'range', min: 10, max: 120, step: 2, value: 56 },
    { key: 'gap', label: 'Gap between stones', type: 'range', min: 0, max: 12, step: 0.5, value: 3 },
    { key: 'wobble', label: 'Wobble', type: 'range', min: 0, max: 0.5, step: 0.01, value: 0.16 },
    { key: 'outline', label: 'Outline width', type: 'range', min: 0, max: 5, step: 0.1, value: 1.6 },
    {
      key: 'fillStyle', label: 'Fill style', type: 'select', value: 'flat',
      options: [
        { value: 'flat', label: 'flat ink' },
        { value: 'offset', label: 'offset ink (misprint)' },
        { value: 'outline', label: 'outline only' },
      ],
    },
    {
      key: 'colorBy', label: 'Color by', type: 'select', value: 'size',
      options: [
        { value: 'size', label: 'stone size' },
        { value: 'position', label: 'position' },
        { value: 'random', label: 'random' },
      ],
    },
  ],

  create({ ctx, width, height, rng, noise, palette, params }) {
    const P = params;
    const placed = []; // {x, y, r}
    let attempts = 0;
    const overflow = P.maxR * 0.3; // let edge stones crop for a full-bleed look
    const bgIsDark = hexToRgb(palette.bg).reduce((a, b) => a + b, 0) < 384;

    ctx.lineJoin = 'round';

    function blobPath(x, y, r, k) {
      // smooth closed blob through noise-displaced verts (midpoint quadratics)
      const px = new Float32Array(VERTS);
      const py = new Float32Array(VERTS);
      for (let i = 0; i < VERTS; i++) {
        const a = (i / VERTS) * TAU;
        const nr = r * (1 + P.wobble * noise.fbm(Math.cos(a) * 1.1 + x * 0.013, Math.sin(a) * 1.1 + y * 0.013, k * 0.37));
        px[i] = x + Math.cos(a) * nr;
        py[i] = y + Math.sin(a) * nr;
      }
      ctx.beginPath();
      ctx.moveTo((px[VERTS - 1] + px[0]) / 2, (py[VERTS - 1] + py[0]) / 2);
      for (let i = 0; i < VERTS; i++) {
        const j = (i + 1) % VERTS;
        ctx.quadraticCurveTo(px[i], py[i], (px[i] + px[j]) / 2, (py[i] + py[j]) / 2);
      }
      ctx.closePath();
    }

    function drawStone(s, k) {
      let t;
      if (P.colorBy === 'size') t = (s.r - P.minR) / Math.max(1, P.maxR - P.minR);
      else if (P.colorBy === 'position') t = (s.x / width + s.y / height) / 2;
      else t = s.t; // stored at placement so full redraws keep each stone's color
      const fill = samplePalette(palette.colors, t);
      const line = mixHex(fill, bgIsDark ? '#ffffff' : '#000000', 0.35);

      if (P.fillStyle === 'offset') {
        // ink pass slightly misregistered from the outline pass, like a cheap print
        const dx = 1.5 + s.r * 0.03;
        blobPath(s.x + dx, s.y + dx * 0.6, s.r, k);
        ctx.fillStyle = fill;
        ctx.fill();
      } else if (P.fillStyle === 'flat') {
        blobPath(s.x, s.y, s.r, k);
        ctx.fillStyle = fill;
        ctx.fill();
      }
      if (P.outline > 0) {
        blobPath(s.x, s.y, s.r, k);
        ctx.strokeStyle = P.fillStyle === 'outline' ? fill : line;
        ctx.lineWidth = P.outline;
        ctx.stroke();
      }
    }

    function allowedRadiusAt(x, y) {
      let allowed = P.maxR;
      for (const s of placed) {
        const d = Math.hypot(x - s.x, y - s.y) - s.r - P.gap;
        if (d < allowed) {
          allowed = d;
          if (allowed < P.minR) break;
        }
      }
      return allowed;
    }

    // wavefront relaxation: the dragged stone pushes overlapping neighbours
    // out, which push theirs — the pack shoves aside like real shingle
    function shove(rootIdx) {
      let wave = [rootIdx];
      const touched = new Set(wave);
      for (let pass = 0; pass < 3 && wave.length; pass++) {
        const next = [];
        for (const mi of wave) {
          const m = placed[mi];
          for (let j = 0; j < placed.length; j++) {
            if (touched.has(j)) continue;
            const s = placed[j];
            const dx = s.x - m.x;
            const dy = s.y - m.y;
            const min = s.r + m.r + P.gap;
            const d = Math.hypot(dx, dy) || 0.001;
            if (d < min) {
              const push = (min - d) / d;
              s.x += dx * push;
              s.y += dy * push;
              touched.add(j);
              next.push(j);
            }
          }
        }
        wave = next;
      }
    }

    let dirty = false;
    const dragIdx = new Map(); // per mirror index

    function redraw() {
      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, width, height);
      for (let i = 0; i < placed.length; i++) drawStone(placed[i], i + 1);
    }

    return {
      frame() {
        // place a batch per frame so the packing visibly fills in
        const batch = 180;
        let placedThisFrame = 0;
        while (placedThisFrame < batch && attempts < P.tries) {
          attempts++;
          const x = rng.range(-overflow, width + overflow);
          const y = rng.range(-overflow, height + overflow);
          const allowed = allowedRadiusAt(x, y);
          if (allowed < P.minR) continue;
          const stone = { x, y, r: Math.min(allowed, P.maxR) * rng.range(0.85, 1), t: rng.random() };
          placed.push(stone);
          drawStone(stone, placed.length);
          placedThisFrame++;
        }
        if (dirty) {
          redraw();
          dirty = false;
        }
        return true; // stay live for touch
      },
      onDown(x, y, k = 0) {
        let best = -1;
        let bd = Infinity;
        for (let i = 0; i < placed.length; i++) {
          const d = Math.hypot(x - placed[i].x, y - placed[i].y) - placed[i].r;
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
        placed[i].x = x;
        placed[i].y = y;
        shove(i);
        dirty = true;
      },
      onUp(x, y, dist, k = 0) {
        if (dist < 6 && placed.length < 3000) {
          const allowed = allowedRadiusAt(x, y);
          if (allowed >= P.minR) {
            placed.push({ x, y, r: Math.min(allowed, P.maxR), t: rng.random() });
            dirty = true;
          }
        }
        dragIdx.delete(k);
      },
    };
  },
};

// Kiku & Sakura: Japanese florals. "Field" packs blooms edge to edge the way
// kiku-zukushi textiles do; scatter drifts blossoms and loose petals along a
// wind; single is one hero bloom. Interactive: drag a bloom and the bouquet
// shuffles aside around your finger; tap to plant a new one.

import { TAU, samplePalette, mixHex } from '../core/util.js';

export default {
  id: 'kiku',
  name: 'Kiku & Sakura',
  category: 'Organic',
  interactive: true,
  symmetry: true,
  hint: 'drag a bloom — the bouquet shuffles aside · tap to plant one',
  description: 'Japanese florals: dense layered chrysanthemums, drifting sakura, round ume — drag the blooms around, tap to plant.',
  params: [
    {
      key: 'style', label: 'Flower', type: 'select', value: 'kiku',
      options: [
        { value: 'kiku', label: 'kiku — chrysanthemum' },
        { value: 'sakura', label: 'sakura — cherry blossom' },
        { value: 'ume', label: 'ume — plum blossom' },
      ],
    },
    {
      key: 'layout', label: 'Layout', type: 'select', value: 'field',
      options: [
        { value: 'field', label: 'packed field' },
        { value: 'scatter', label: 'drifting scatter' },
        { value: 'single', label: 'single bloom' },
      ],
    },
    { key: 'size', label: 'Bloom size', type: 'range', min: 40, max: 260, step: 5, value: 120 },
    { key: 'layers', label: 'Petal layers', type: 'range', min: 2, max: 6, step: 1, value: 4 },
    { key: 'petals', label: 'Petals per layer', type: 'range', min: 10, max: 32, step: 1, value: 18 },
    { key: 'lineWidth', label: 'Outline width', type: 'range', min: 0.5, max: 6, step: 0.5, value: 2 },
    { key: 'tone', label: 'Fill tone', type: 'range', min: 0, max: 1, step: 0.05, value: 0.5 },
  ],

  create({ ctx, width, height, rng, palette, params }) {
    const P = params;
    const ink = samplePalette(palette.colors, 0.1);

    function fillTone(t) {
      return mixHex(samplePalette(palette.colors, 0.5 + t * 0.45), palette.bg, (1 - P.tone) * 0.85);
    }

    // slender chrysanthemum petal with a gently hooked tip, around (0,0) → up
    function kikuPetal(len, w) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(w, -len * 0.22, w * 1.05, -len * 0.62, w * 0.22, -len * 0.94);
      ctx.quadraticCurveTo(0, -len * 1.02, -w * 0.22, -len * 0.94);
      ctx.bezierCurveTo(-w * 1.05, -len * 0.62, -w, -len * 0.22, 0, 0);
      ctx.closePath();
    }

    function kikuBloom(x, y, s, rot) {
      const L = Math.round(P.layers);
      for (let l = L - 1; l >= 0; l--) {
        const t = L > 1 ? l / (L - 1) : 0; // 1 = outermost
        const len = s * (0.42 + t * 0.58);
        const n = Math.round(P.petals * (0.7 + t * 0.5));
        const w = ((len * TAU) / n) * 0.62; // wide enough to overlap neighbours
        ctx.fillStyle = fillTone(l % 2 ? 0.15 : 0.55);
        ctx.strokeStyle = ink;
        ctx.lineWidth = Math.max(0.5, P.lineWidth * (0.68 + t * 0.32));
        ctx.lineJoin = 'round';
        for (let i = 0; i < n; i++) {
          const a = rot + (i / n) * TAU + l * (Math.PI / n) * 1.3;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(a);
          kikuPetal(len * 0.5, w);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
      }
      ctx.beginPath();
      ctx.arc(x, y, s * 0.09, 0, TAU);
      ctx.fillStyle = fillTone(0.9);
      ctx.fill();
      ctx.strokeStyle = ink;
      ctx.lineWidth = P.lineWidth;
      ctx.stroke();
      for (let i = 0; i < 12; i++) {
        const a = rot + (i / 12) * TAU;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * s * 0.14, y + Math.sin(a) * s * 0.14, Math.max(1, P.lineWidth * 0.7), 0, TAU);
        ctx.fillStyle = ink;
        ctx.fill();
      }
    }

    // five-petal blossoms -------------------------------------------------

    function sakuraPetal(len, w) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(w, -len * 0.25, w * 0.95, -len * 0.75, w * 0.3, -len * 0.97);
      ctx.lineTo(0, -len * 0.8); // the signature notch
      ctx.lineTo(-w * 0.3, -len * 0.97);
      ctx.bezierCurveTo(-w * 0.95, -len * 0.75, -w, -len * 0.25, 0, 0);
      ctx.closePath();
    }

    function umePetal(len, w) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(w, -len * 0.15, w * 1.1, -len * 0.8, 0, -len);
      ctx.bezierCurveTo(-w * 1.1, -len * 0.8, -w, -len * 0.15, 0, 0);
      ctx.closePath();
    }

    function blossom(x, y, s, rot, kind, tint) {
      const len = s * 0.5;
      const w = len * (kind === 'ume' ? 0.62 : 0.5);
      ctx.fillStyle = fillTone(tint);
      ctx.strokeStyle = ink;
      ctx.lineWidth = P.lineWidth * 0.8;
      ctx.lineJoin = 'round';
      for (let i = 0; i < 5; i++) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot + (i / 5) * TAU);
        (kind === 'ume' ? umePetal : sakuraPetal)(len, w);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      const nstam = kind === 'ume' ? 8 : 5;
      for (let i = 0; i < nstam; i++) {
        const a = rot + ((i + 0.5) / nstam) * TAU;
        const lr = s * (kind === 'ume' ? 0.24 : 0.14);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(a) * lr, y + Math.sin(a) * lr);
        ctx.strokeStyle = ink;
        ctx.lineWidth = Math.max(0.5, P.lineWidth * 0.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * lr, y + Math.sin(a) * lr, Math.max(1, P.lineWidth * 0.65), 0, TAU);
        ctx.fillStyle = ink;
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(x, y, s * 0.05, 0, TAU);
      ctx.fillStyle = ink;
      ctx.fill();
    }

    function loosePetal(p) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = fillTone(p.t);
      ctx.strokeStyle = ink;
      ctx.lineWidth = Math.max(0.5, P.lineWidth * 0.55);
      sakuraPetal(p.s * 0.28, p.s * 0.15);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // ---- composition, stored so blooms can be dragged around ----

    const blooms = []; // {x, y, s, rot, t}
    const petals = []; // loose drifting petals (static)
    const drift = 0.65;

    if (P.layout === 'single') {
      if (P.style !== 'kiku') {
        for (let i = 0; i < 26; i++) {
          petals.push({ x: rng.range(0, width), y: rng.range(0, height), s: P.size * rng.range(0.5, 0.9), rot: drift + rng.range(-0.5, 0.5), t: rng.random() * 0.6 });
        }
      }
      blooms.push({ x: width / 2, y: height / 2, s: P.size * 1.4, rot: rng.random() * TAU, t: rng.random() * 0.5 });
    } else if (P.layout === 'field') {
      const step = P.size * (P.style === 'kiku' ? 0.82 : 0.7);
      const rowStep = step * 0.82;
      const rows = Math.ceil(height / rowStep) + 2;
      const cols = Math.ceil(width / step) + 2;
      for (let r = -1; r < rows; r++) {
        for (let c = -1; c < cols; c++) {
          blooms.push({
            x: c * step + (r % 2 ? step / 2 : 0) + rng.range(-step, step) * 0.08,
            y: r * rowStep + rng.range(-rowStep, rowStep) * 0.08,
            s: P.size * rng.range(0.85, 1.15),
            rot: rng.random() * TAU,
            t: rng.random() * 0.5,
          });
        }
      }
    } else {
      if (P.style !== 'kiku') {
        const petalsN = Math.round(((width * height) / (P.size * P.size)) * 2.2) + 10;
        for (let i = 0; i < petalsN; i++) {
          petals.push({ x: rng.range(0, width), y: rng.range(0, height), s: P.size * rng.range(0.45, 0.85), rot: drift + rng.range(-0.5, 0.5), t: rng.random() * 0.6 });
        }
      }
      const n = Math.round((width * height) / (P.size * P.size * 6)) + 3;
      for (let i = 0; i < n; i++) {
        blooms.push({
          x: rng.range(width * 0.05, width * 0.95),
          y: rng.range(height * 0.05, height * 0.95),
          s: P.size * rng.range(0.65, 1.1),
          rot: rng.random() * TAU,
          t: rng.random() * 0.5,
        });
      }
    }

    function drawBloom(b) {
      if (P.style === 'kiku') kikuBloom(b.x, b.y, b.s, b.rot);
      else blossom(b.x, b.y, b.s, b.rot, P.style, b.t);
    }

    function draw() {
      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, width, height);
      for (const p of petals) loosePetal(p);
      blooms.sort((a, b) => a.y - b.y); // painter's order after drags
      for (const b of blooms) drawBloom(b);
    }

    // wavefront shove: the dragged bloom nudges overlapping neighbours
    function shove(root) {
      let wave = [root];
      const touched = new Set(wave);
      for (let pass = 0; pass < 3 && wave.length; pass++) {
        const next = [];
        for (const m of wave) {
          for (const b of blooms) {
            if (touched.has(b)) continue;
            const dx = b.x - m.x;
            const dy = b.y - m.y;
            const min = (b.s + m.s) * 0.33;
            const d = Math.hypot(dx, dy) || 0.001;
            if (d < min) {
              const push = (min - d) / d;
              b.x += dx * push;
              b.y += dy * push;
              touched.add(b);
              next.push(b);
            }
          }
        }
        wave = next;
      }
    }

    let dirty = true;
    const dragged = new Map(); // per mirror index → bloom object

    return {
      frame() {
        if (dirty) {
          draw();
          dirty = false;
        }
        return true; // stay live for bloom drags
      },
      onDown(x, y, k = 0) {
        let best = null;
        let bd = Infinity;
        for (const b of blooms) {
          const d = Math.hypot(x - b.x, y - b.y) - b.s * 0.5;
          if (d < bd) {
            bd = d;
            best = b;
          }
        }
        dragged.set(k, best);
      },
      onMove(x, y, dx, dy, k = 0) {
        const b = dragged.get(k);
        if (!b) return;
        b.x = x;
        b.y = y;
        if (P.layout !== 'single') shove(b);
        dirty = true;
      },
      onUp(x, y, dist, k = 0) {
        if (dist < 6 && blooms.length < 900) {
          blooms.push({ x, y, s: P.size * rng.range(0.8, 1.1), rot: rng.random() * TAU, t: rng.random() * 0.5 });
          dirty = true;
        }
        dragged.delete(k);
      },
    };
  },
};

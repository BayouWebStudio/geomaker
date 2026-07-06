// Kiku & Sakura: Japanese florals. "Field" packs blooms edge to edge the way
// kiku-zukushi textiles do (no empty ground); scatter drifts blossoms and
// loose petals along a wind direction; single is one hero bloom. Kiku petals
// are dense and layered with alternating tones, in bold-outline irezumi style.

import { TAU, samplePalette, mixHex } from '../core/util.js';

export default {
  id: 'kiku',
  name: 'Kiku & Sakura',
  category: 'Organic',
  description: 'Japanese florals: dense layered chrysanthemums packed like kiku-zukushi silk, drifting sakura, round ume blossoms.',
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
      // heart: ringed disc with a dotted crown
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

    function blossom(x, y, s, rot, kind) {
      const len = s * 0.5;
      const w = len * (kind === 'ume' ? 0.62 : 0.5);
      ctx.fillStyle = fillTone(rng.random() * 0.5);
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
      // stamens
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

    function loosePetal(x, y, s, drift) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(drift + rng.range(-0.5, 0.5));
      ctx.fillStyle = fillTone(rng.random() * 0.6);
      ctx.strokeStyle = ink;
      ctx.lineWidth = Math.max(0.5, P.lineWidth * 0.55);
      sakuraPetal(s * 0.28, s * 0.15);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    const bloomAt = (x, y, s, rot) => {
      if (P.style === 'kiku') kikuBloom(x, y, s, rot);
      else blossom(x, y, s, rot, P.style);
    };

    let drawn = false;
    return {
      frame() {
        if (drawn) return false;
        drawn = true;
        ctx.fillStyle = palette.bg;
        ctx.fillRect(0, 0, width, height);

        if (P.layout === 'single') {
          if (P.style !== 'kiku') {
            const drift = 0.6;
            const n = 26;
            for (let i = 0; i < n; i++) loosePetal(rng.range(0, width), rng.range(0, height), P.size * rng.range(0.5, 0.9), drift);
          }
          bloomAt(width / 2, height / 2, P.size * 1.4, rng.random() * TAU);
          return false;
        }

        if (P.layout === 'field') {
          // packed offset grid — blooms overlap so no ground shows through,
          // upper rows drawn first so lower blooms sit in front
          const step = P.size * (P.style === 'kiku' ? 0.82 : 0.7);
          const rowStep = step * 0.82;
          const rows = Math.ceil(height / rowStep) + 2;
          const cols = Math.ceil(width / step) + 2;
          for (let r = -1; r < rows; r++) {
            for (let c = -1; c < cols; c++) {
              const x = c * step + (r % 2 ? step / 2 : 0) + rng.range(-step, step) * 0.08;
              const y = r * rowStep + rng.range(-rowStep, rowStep) * 0.08;
              bloomAt(x, y, P.size * rng.range(0.85, 1.15), rng.random() * TAU);
            }
          }
          return false;
        }

        // scatter: blossoms + loose petals drifting one way, like petal fall
        const drift = 0.65; // wind angle
        if (P.style !== 'kiku') {
          const petalsN = Math.round((width * height) / (P.size * P.size) * 2.2) + 10;
          for (let i = 0; i < petalsN; i++) {
            loosePetal(rng.range(0, width), rng.range(0, height), P.size * rng.range(0.45, 0.85), drift);
          }
        }
        const blooms = Math.round((width * height) / (P.size * P.size * 6)) + 3;
        const els = [];
        for (let i = 0; i < blooms; i++) {
          els.push([rng.range(width * 0.05, width * 0.95), rng.range(height * 0.05, height * 0.95)]);
        }
        els.sort((a, b) => a[1] - b[1]);
        for (const [x, y] of els) bloomAt(x, y, P.size * rng.range(0.65, 1.1), rng.random() * TAU);
        return false;
      },
    };
  },
};

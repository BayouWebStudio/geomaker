// Kiku & Sakura: Japanese florals — the layered chrysanthemum of irezumi
// (rings of slender pointed petals around a heart), falling cherry blossoms
// with their notched petals, and round plum blossoms with stamen dots.

import { TAU, samplePalette, mixHex } from '../core/util.js';

export default {
  id: 'kiku',
  name: 'Kiku & Sakura',
  category: 'Organic',
  description: 'Japanese florals: layered chrysanthemum blooms, falling notched sakura petals, round ume blossoms.',
  params: [
    {
      key: 'style', label: 'Flower', type: 'select', value: 'kiku',
      options: [
        { value: 'kiku', label: 'kiku — chrysanthemum' },
        { value: 'sakura', label: 'sakura — cherry blossom' },
        { value: 'ume', label: 'ume — plum blossom' },
      ],
    },
    { key: 'size', label: 'Bloom size', type: 'range', min: 40, max: 240, step: 5, value: 130 },
    { key: 'layers', label: 'Petal layers', type: 'range', min: 2, max: 6, step: 1, value: 4 },
    { key: 'petals', label: 'Petals per layer', type: 'range', min: 8, max: 28, step: 1, value: 16 },
    { key: 'satellites', label: 'Scatter blooms', type: 'range', min: 0, max: 14, step: 1, value: 5 },
    { key: 'lineWidth', label: 'Outline width', type: 'range', min: 0.5, max: 6, step: 0.5, value: 2 },
    { key: 'tone', label: 'Fill tone', type: 'range', min: 0, max: 1, step: 0.05, value: 0.45 },
  ],

  create({ ctx, width, height, rng, palette, params }) {
    const P = params;
    const ink = samplePalette(palette.colors, 0.12);

    function petalFill(t) {
      return mixHex(samplePalette(palette.colors, 0.55 + t * 0.4), palette.bg, 1 - P.tone);
    }

    // one slender pointed petal from (0,0) up to (0,-len)
    function kikuPetal(len, w) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(w, -len * 0.45, 0, -len);
      ctx.quadraticCurveTo(-w, -len * 0.45, 0, 0);
      ctx.closePath();
    }

    function kikuBloom(x, y, s) {
      for (let l = P.layers - 1; l >= 0; l--) {
        const t = P.layers > 1 ? l / (P.layers - 1) : 0;
        const len = s * (0.45 + t * 0.55);
        const w = len * 0.16;
        const n = Math.round(P.petals * (0.75 + t * 0.4));
        ctx.fillStyle = petalFill(1 - t);
        for (let i = 0; i < n; i++) {
          const a = (i / n) * TAU + l * (Math.PI / n); // stagger layers
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(a);
          kikuPetal(len, w);
          ctx.fill();
          ctx.strokeStyle = ink;
          ctx.lineWidth = P.lineWidth * 0.85;
          ctx.stroke();
          ctx.restore();
        }
      }
      // heart: disc + dotted ring
      ctx.beginPath();
      ctx.arc(x, y, s * 0.1, 0, TAU);
      ctx.fillStyle = petalFill(0);
      ctx.fill();
      ctx.strokeStyle = ink;
      ctx.lineWidth = P.lineWidth;
      ctx.stroke();
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * s * 0.16, y + Math.sin(a) * s * 0.16, P.lineWidth * 0.8, 0, TAU);
        ctx.fillStyle = ink;
        ctx.fill();
      }
    }

    // sakura petal: teardrop with the signature notched tip
    function sakuraPetal(len, w) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(w, -len * 0.25, w * 0.95, -len * 0.75, w * 0.28, -len * 0.96);
      ctx.lineTo(0, -len * 0.82); // the notch
      ctx.lineTo(-w * 0.28, -len * 0.96);
      ctx.bezierCurveTo(-w * 0.95, -len * 0.75, -w, -len * 0.25, 0, 0);
      ctx.closePath();
    }

    function sakuraBloom(x, y, s, rot) {
      const len = s * 0.5;
      const w = len * 0.5;
      ctx.fillStyle = petalFill(rng.random() * 0.5);
      for (let i = 0; i < 5; i++) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot + (i / 5) * TAU);
        sakuraPetal(len, w);
        ctx.fill();
        ctx.strokeStyle = ink;
        ctx.lineWidth = P.lineWidth * 0.8;
        ctx.stroke();
        ctx.restore();
      }
      for (let i = 0; i < 5; i++) {
        const a = rot + ((i + 0.5) / 5) * TAU;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(a) * s * 0.12, y + Math.sin(a) * s * 0.12);
        ctx.strokeStyle = ink;
        ctx.lineWidth = P.lineWidth * 0.6;
        ctx.stroke();
      }
    }

    // ume petal: five round petals + long stamens
    function umeBloom(x, y, s, rot) {
      const r = s * 0.22;
      ctx.fillStyle = petalFill(rng.random() * 0.4);
      for (let i = 0; i < 5; i++) {
        const a = rot + (i / 5) * TAU;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * r * 1.18, y + Math.sin(a) * r * 1.18, r, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = ink;
        ctx.lineWidth = P.lineWidth * 0.8;
        ctx.stroke();
      }
      for (let i = 0; i < 7; i++) {
        const a = rot + (i / 7) * TAU + 0.3;
        const lr = s * 0.2 * (0.7 + (i % 2) * 0.4);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(a) * lr, y + Math.sin(a) * lr);
        ctx.strokeStyle = ink;
        ctx.lineWidth = P.lineWidth * 0.55;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * lr, y + Math.sin(a) * lr, P.lineWidth * 0.75, 0, TAU);
        ctx.fillStyle = ink;
        ctx.fill();
      }
    }

    // lone drifting petal (sakura rain)
    function loosePetal(x, y, s, rot) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.fillStyle = petalFill(rng.random() * 0.6);
      sakuraPetal(s * 0.3, s * 0.15);
      ctx.fill();
      ctx.strokeStyle = ink;
      ctx.lineWidth = P.lineWidth * 0.6;
      ctx.stroke();
      ctx.restore();
    }

    let drawn = false;
    return {
      frame() {
        if (drawn) return false;
        drawn = true;
        ctx.fillStyle = palette.bg;
        ctx.fillRect(0, 0, width, height);
        ctx.lineJoin = 'round';

        const bloom = (x, y, s, rot) => {
          if (P.style === 'kiku') kikuBloom(x, y, s);
          else if (P.style === 'sakura') sakuraBloom(x, y, s, rot);
          else umeBloom(x, y, s, rot);
        };

        // satellite blooms first (behind), hero bloom last
        for (let i = 0; i < P.satellites; i++) {
          bloom(
            rng.range(width * 0.05, width * 0.95),
            rng.range(height * 0.05, height * 0.95),
            P.size * rng.range(0.28, 0.6),
            rng.random() * TAU
          );
        }
        if (P.style !== 'kiku') {
          // drifting loose petals fill the air
          const n = 8 + P.satellites * 3;
          for (let i = 0; i < n; i++) {
            loosePetal(rng.range(0, width), rng.range(0, height), P.size * rng.range(0.5, 0.9), rng.random() * TAU);
          }
        }
        bloom(width / 2, height / 2, P.size, rng.random() * TAU);
        return false;
      },
    };
  },
};

// Sacred Geometry II: classical constructions drawn with compass-and-straightedge
// precision — Metatron's Cube (all 78 lines through the Fruit of Life's 13
// centers), the Vesica Piscis construction, and a recursively nested Merkaba
// (hexagram) that telescopes inward.

import { TAU, samplePalette, withAlpha } from '../core/util.js';

export default {
  id: 'sacred2',
  name: 'Sacred Geometry II',
  category: 'Geometric',
  description: "Metatron's Cube, the Vesica Piscis construction, and nested Merkaba hexagrams.",
  params: [
    {
      key: 'figure', label: 'Figure', type: 'select', value: 'metatron',
      options: [
        { value: 'metatron', label: "Metatron's Cube" },
        { value: 'vesica', label: 'Vesica Piscis' },
        { value: 'merkaba', label: 'Merkaba (nested)' },
      ],
    },
    { key: 'scale', label: 'Size', type: 'range', min: 0.4, max: 1.1, step: 0.02, value: 0.84 },
    { key: 'rotation', label: 'Rotation', type: 'range', min: 0, max: 360, step: 1, value: 0 },
    { key: 'lineWidth', label: 'Line width', type: 'range', min: 0.3, max: 5, step: 0.1, value: 1.3 },
    { key: 'circles', label: 'Show construction circles', type: 'checkbox', value: true },
    {
      key: 'lines', label: 'Lines (Metatron)', type: 'select', value: 'all',
      options: [
        { value: 'all', label: 'all 78 connections' },
        { value: 'stars', label: 'hexagrams only' },
        { value: 'none', label: 'circles only' },
      ],
    },
    { key: 'depth', label: 'Nesting (Merkaba)', type: 'range', min: 1, max: 7, step: 1, value: 4 },
    { key: 'fill', label: 'Fill vesica petals', type: 'checkbox', value: true },
    {
      key: 'colorMode', label: 'Ink', type: 'select', value: 'gradient',
      options: [
        { value: 'gradient', label: 'gradient by radius' },
        { value: 'mono', label: 'single ink' },
      ],
    },
  ],

  create({ ctx, width, height, palette, params }) {
    const P = params;
    const cx = width / 2;
    const cy = height / 2;
    const R = (Math.min(width, height) / 2) * P.scale;
    const inkAt = (t) => (P.colorMode === 'mono' ? samplePalette(palette.colors, 0.75) : samplePalette(palette.colors, t));

    function metatron() {
      // Fruit of Life: 13 tangent circles of radius s on the six 60° axes
      const s = R / 5;
      const centers = [[0, 0]];
      for (let ring = 1; ring <= 2; ring++) {
        for (let k = 0; k < 6; k++) {
          const ang = (k / 6) * TAU;
          centers.push([Math.cos(ang) * 2 * s * ring, Math.sin(ang) * 2 * s * ring]);
        }
      }
      if (P.circles) {
        for (const [x, y] of centers) {
          ctx.beginPath();
          ctx.arc(x, y, s, 0, TAU);
          ctx.strokeStyle = withAlpha(inkAt(Math.hypot(x, y) / (4 * s)), 0.85);
          ctx.stroke();
        }
      }
      if (P.lines === 'none') return;
      if (P.lines === 'stars') {
        // the two hexagrams: triangles through the outer ring's alternating centers
        const outer = centers.slice(7);
        for (const start of [0, 1]) {
          ctx.beginPath();
          for (let i = 0; i <= 3; i++) {
            const [x, y] = outer[(start + i * 2) % 6];
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.strokeStyle = inkAt(start ? 0.85 : 0.45);
          ctx.stroke();
        }
        return;
      }
      // all 78 pairwise connections
      ctx.strokeStyle = withAlpha(inkAt(0.65), 0.6);
      ctx.beginPath();
      for (let i = 0; i < centers.length; i++) {
        for (let j = i + 1; j < centers.length; j++) {
          ctx.moveTo(centers[i][0], centers[i][1]);
          ctx.lineTo(centers[j][0], centers[j][1]);
        }
      }
      ctx.stroke();
    }

    function vesica() {
      const r = R * 0.62;
      const d = r / 2;
      if (P.fill) {
        // the lens: intersection of the two discs
        ctx.save();
        ctx.beginPath();
        ctx.arc(-d, 0, r, 0, TAU);
        ctx.clip();
        ctx.beginPath();
        ctx.arc(d, 0, r, 0, TAU);
        ctx.fillStyle = withAlpha(inkAt(0.5), 0.16);
        ctx.fill();
        ctx.restore();
      }
      for (const [x, t] of [[-d, 0.35], [d, 0.75]]) {
        ctx.beginPath();
        ctx.arc(x, 0, r, 0, TAU);
        ctx.strokeStyle = inkAt(t);
        ctx.stroke();
      }
      // construction: centers, axis, and the vesica's inscribed rhombus
      const h = Math.sqrt(r * r - d * d);
      ctx.strokeStyle = withAlpha(inkAt(0.9), 0.8);
      ctx.beginPath();
      ctx.moveTo(-d, 0); ctx.lineTo(d, 0);
      ctx.moveTo(0, -h); ctx.lineTo(0, h);
      ctx.moveTo(-d, 0); ctx.lineTo(0, -h); ctx.lineTo(d, 0); ctx.lineTo(0, h); ctx.closePath();
      ctx.stroke();
      if (P.circles) {
        for (const x of [-d, d]) {
          ctx.beginPath();
          ctx.arc(x, 0, 2.5, 0, TAU);
          ctx.fillStyle = inkAt(0.9);
          ctx.fill();
        }
      }
    }

    function merkaba() {
      // nested hexagrams: each level's inner hexagon hosts the next star,
      // scaled by 1/√3 and rotated 30°
      let radius = R;
      let rot = 0;
      const depth = Math.round(P.depth);
      for (let level = 0; level < depth; level++) {
        const t = depth === 1 ? 0.7 : level / (depth - 1);
        ctx.strokeStyle = inkAt(0.25 + 0.65 * (1 - t));
        for (const start of [0, 1]) {
          ctx.beginPath();
          for (let i = 0; i <= 3; i++) {
            const ang = rot + ((start * 60 + i * 120) * Math.PI) / 180 - Math.PI / 2;
            const x = Math.cos(ang) * radius;
            const y = Math.sin(ang) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        if (P.circles) {
          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, TAU);
          ctx.strokeStyle = withAlpha(inkAt(0.5), 0.3);
          ctx.stroke();
        }
        radius /= Math.sqrt(3);
        rot += Math.PI / 6;
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
        ctx.translate(cx, cy);
        ctx.rotate((P.rotation * Math.PI) / 180);
        ctx.lineWidth = P.lineWidth;
        ctx.lineJoin = 'round';
        if (P.figure === 'vesica') vesica();
        else if (P.figure === 'merkaba') merkaba();
        else metatron();
        ctx.restore();
        return false;
      },
    };
  },
};

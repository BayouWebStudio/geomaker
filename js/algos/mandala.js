// Mandala: a radially symmetric rosette. Concentric rings each carry a motif
// repeated around N-fold symmetry (optionally mirrored within each sector). The
// seed picks the per-ring motifs, so every seed is a different — but always
// symmetric — mandala.

import { TAU, samplePalette } from '../core/util.js';

// weighted pool: favour motifs that fill a ring into a continuous band, and
// keep the airy 'ring' divider rare. (No lone radial spokes — they read as
// sparse "dandelion" spikes on the outer rings.)
const MOTIFS = [
  'petal', 'petal', 'diamonds', 'diamonds', 'triangles', 'scallop', 'dots', 'dots', 'ring',
];

export default {
  id: 'mandala',
  name: 'Mandala',
  category: 'Geometric',
  description: 'Kaleidoscopic rings of repeating motifs with N-fold symmetry.',
  params: [
    { key: 'symmetry', label: 'Symmetry (fold)', type: 'range', min: 3, max: 24, step: 1, value: 12 },
    { key: 'rings', label: 'Rings', type: 'range', min: 2, max: 12, step: 1, value: 6 },
    { key: 'scale', label: 'Size', type: 'range', min: 0.4, max: 1.3, step: 0.02, value: 0.92 },
    { key: 'lineWidth', label: 'Line width', type: 'range', min: 0.4, max: 5, step: 0.1, value: 1.6 },
    { key: 'fill', label: 'Fill motifs', type: 'checkbox', value: true },
    { key: 'mirror', label: 'Mirror each sector', type: 'checkbox', value: true },
    { key: 'rotation', label: 'Rotation', type: 'range', min: 0, max: 360, step: 1, value: 0 },
    { key: 'opacity', label: 'Opacity', type: 'range', min: 0.2, max: 1, step: 0.05, value: 0.95 },
    {
      key: 'paletteMode', label: 'Color by', type: 'select', value: 'ring',
      options: [
        { value: 'ring', label: 'ring' },
        { value: 'alternate', label: 'alternating' },
      ],
    },
  ],

  create({ ctx, width, height, rng, palette, params }) {
    const P = params;
    const cx = width / 2;
    const cy = height / 2;
    const N = Math.round(P.symmetry);
    const ringCount = Math.round(P.rings);
    const maxRadius = (Math.min(width, height) / 2) * P.scale;
    const ringGap = maxRadius / ringCount;
    const sector = TAU / N;

    // pre-roll each ring's motif so the result is deterministic per seed
    const ringDefs = [];
    for (let i = 0; i < ringCount; i++) {
      const rInner = i * ringGap;
      const rOuter = (i + 1) * ringGap;
      ringDefs.push({
        motif: MOTIFS[rng.int(0, MOTIFS.length - 1)],
        rInner,
        rOuter,
        rMid: (rInner + rOuter) / 2,
        t: ringCount === 1 ? 0 : i / (ringCount - 1),
        wobble: rng.range(0.6, 1),
      });
    }

    // arcH is the tangential half-extent (half the angular spacing at this
    // radius), so motifs widen with radius and fill each ring into a continuous
    // band instead of leaving big gaps near the rim. bandH is the radial half.
    function drawMotif(def, arcH) {
      const r = def.rMid;
      const close = () => {
        if (P.fill) ctx.fill();
        else ctx.stroke();
      };
      switch (def.motif) {
        case 'petal':
          ctx.beginPath();
          ctx.moveTo(def.rInner, 0);
          ctx.quadraticCurveTo(r, arcH, def.rOuter, 0);
          ctx.quadraticCurveTo(r, -arcH, def.rInner, 0);
          ctx.closePath();
          close();
          break;
        case 'dots':
          // size by arc spacing so beads touch their neighbours into a ring
          ctx.beginPath();
          ctx.arc(r, 0, arcH * 0.85, 0, TAU);
          close();
          break;
        case 'scallop':
          ctx.beginPath();
          ctx.arc(r, 0, arcH, Math.PI * 0.08, Math.PI * 0.92);
          ctx.stroke();
          break;
        case 'spokes':
          ctx.beginPath();
          ctx.moveTo(def.rInner, 0);
          ctx.lineTo(def.rOuter, 0);
          ctx.stroke();
          break;
        case 'triangles':
          ctx.beginPath();
          ctx.moveTo(def.rInner, -arcH * 0.92);
          ctx.lineTo(def.rOuter, 0);
          ctx.lineTo(def.rInner, arcH * 0.92);
          ctx.closePath();
          close();
          break;
        case 'diamonds':
          ctx.beginPath();
          ctx.moveTo(def.rInner, 0);
          ctx.lineTo(r, -arcH);
          ctx.lineTo(def.rOuter, 0);
          ctx.lineTo(r, arcH);
          ctx.closePath();
          close();
          break;
        // 'ring' is a full circle, drawn once per ring rather than per sector
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
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = P.opacity;

        ringDefs.forEach((def, i) => {
          const t = P.paletteMode === 'alternate' ? (i % 2 ? 0.18 : 0.82) : def.t;
          const color = samplePalette(palette.colors, t);
          ctx.strokeStyle = color;
          ctx.fillStyle = color;

          if (def.motif === 'ring') {
            ctx.beginPath();
            ctx.arc(0, 0, def.rMid, 0, TAU);
            ctx.stroke();
            return;
          }
          const arcH = ((Math.PI * def.rMid) / N) * def.wobble;
          for (let s = 0; s < N; s++) {
            ctx.save();
            ctx.rotate(s * sector);
            drawMotif(def, arcH);
            if (P.mirror) {
              ctx.scale(1, -1);
              drawMotif(def, arcH);
            }
            ctx.restore();
          }
        });

        // concentric scaffolding so the rings always read as a structured whole
        ctx.globalAlpha = P.opacity * 0.3;
        ctx.strokeStyle = samplePalette(palette.colors, 0.5);
        ctx.lineWidth = Math.max(0.5, P.lineWidth * 0.5);
        for (let i = 1; i <= ringCount; i++) {
          ctx.beginPath();
          ctx.arc(0, 0, i * ringGap, 0, TAU);
          ctx.stroke();
        }
        ctx.globalAlpha = P.opacity;

        // center bloom
        ctx.beginPath();
        ctx.arc(0, 0, ringGap * 0.32, 0, TAU);
        ctx.fillStyle = samplePalette(palette.colors, 0.5);
        ctx.fill();

        ctx.restore();
        ctx.globalAlpha = 1;
        return false;
      },
    };
  },
};

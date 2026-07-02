// Harmonograph: the Victorian drawing machine — damped pendulums trace slowly
// decaying Lissajous figures. Includes a rotary variant and a guilloché mode
// (nested epitrochoid rings, the engine-turned engraving on banknotes).
// Draws progressively, like watching the pen. Drag to detune / re-phase.

import { TAU, samplePalette, withAlpha } from '../core/util.js';

export default {
  id: 'harmonograph',
  name: 'Harmonograph',
  category: 'Geometric',
  interactive: true,
  hint: 'Drag ↔ to detune the pendulums · ↕ to shift phase',
  description: 'Damped-pendulum drawing machine — Lissajous ribbons and guilloché engraving rings.',
  params: [
    {
      key: 'mode', label: 'Machine', type: 'select', value: 'lateral',
      options: [
        { value: 'lateral', label: 'two pendulums (lateral)' },
        { value: 'rotary', label: 'rotary table' },
        { value: 'guilloche', label: 'guilloché rings' },
      ],
    },
    { key: 'ratio', label: 'Frequency ratio', type: 'range', min: 1, max: 8, step: 1, value: 3 },
    { key: 'detune', label: 'Detune', type: 'range', min: 0, max: 0.04, step: 0.0005, value: 0.008 },
    { key: 'phase', label: 'Phase', type: 'range', min: 0, max: 360, step: 1, value: 90 },
    { key: 'damping', label: 'Damping', type: 'range', min: 0.0002, max: 0.01, step: 0.0002, value: 0.0014 },
    { key: 'turns', label: 'Pen time (turns)', type: 'range', min: 20, max: 200, step: 5, value: 90 },
    { key: 'teeth', label: 'Teeth (guilloché)', type: 'range', min: 4, max: 60, step: 1, value: 24 },
    { key: 'rings', label: 'Rings (guilloché)', type: 'range', min: 1, max: 12, step: 1, value: 6 },
    { key: 'lineWidth', label: 'Line width', type: 'range', min: 0.3, max: 3, step: 0.05, value: 0.7 },
    { key: 'opacity', label: 'Ink opacity', type: 'range', min: 0.2, max: 1, step: 0.05, value: 0.8 },
    {
      key: 'colorMode', label: 'Color along path', type: 'select', value: 'time',
      options: [
        { value: 'time', label: 'by time' },
        { value: 'single', label: 'single ink' },
      ],
    },
  ],

  create({ ctx, width, height, rng, palette, params }) {
    const P = params;
    const cx = width / 2;
    const cy = height / 2;
    const A = Math.min(width, height) * 0.4;
    let detune = P.detune;
    let phase = (P.phase * Math.PI) / 180;
    // per-seed personality: small random secondary phases
    const p2 = rng.range(0, TAU);
    const p3 = rng.range(0, TAU);

    const STEP = 0.004; // pen time step
    const totalT = P.turns * Math.PI;
    let t = 0;
    let prev = null;
    let needsClear = true;

    function pos(tt) {
      // tuned so the default settings decay to ~1% over the full pen time —
      // the figure fills in as dense nested ribbons instead of dying early
      const decay = Math.exp(-P.damping * tt * 10);
      if (P.mode === 'guilloche') {
        // nested epitrochoids: which ring depends on how far along we are
        const ring = Math.min(P.rings - 1, Math.floor((tt / totalT) * P.rings));
        const rr = A * (0.35 + (0.6 * (ring + 1)) / P.rings);
        const amp = (A * 0.08 * (1 + 0.4 * Math.sin(ring * 1.7 + p2))) * 1;
        const th = ((tt / totalT) * P.rings - ring) * TAU * Math.ceil(P.teeth / 3 + 2);
        const r = rr + amp * Math.sin(P.teeth * th + phase + ring * p3);
        return [cx + r * Math.cos(th), cy + r * Math.sin(th)];
      }
      if (P.mode === 'rotary') {
        const x = A * 0.62 * Math.sin(tt + phase) * decay + A * 0.38 * Math.cos(P.ratio * (1 + detune) * tt) * decay;
        const y = A * 0.62 * Math.cos(tt + p2) * decay + A * 0.38 * Math.sin(P.ratio * (1 + detune) * tt) * decay;
        return [cx + x, cy + y];
      }
      // lateral: two damped pendulums per axis
      const f2 = P.ratio * (1 + detune);
      const x = (A * 0.55 * Math.sin(tt + phase) + A * 0.45 * Math.sin(f2 * tt + p2)) * decay;
      const y = (A * 0.55 * Math.sin(tt) + A * 0.45 * Math.sin(f2 * tt + p3)) * decay;
      return [cx + x, cy + y];
    }

    return {
      frame() {
        if (needsClear) {
          ctx.fillStyle = palette.bg;
          ctx.fillRect(0, 0, width, height);
          t = 0;
          prev = null;
          needsClear = false;
        }
        if (t >= totalT) return true; // finished drawing; stay live for drag
        ctx.lineWidth = P.lineWidth;
        ctx.lineCap = 'round';
        const CHUNK = 2600;
        ctx.strokeStyle = withAlpha(
          P.colorMode === 'time' ? samplePalette(palette.colors, Math.min(1, t / totalT)) : samplePalette(palette.colors, 0.7),
          P.opacity
        );
        ctx.beginPath();
        for (let i = 0; i < CHUNK && t < totalT; i++, t += STEP) {
          const [x, y] = pos(t);
          if (prev) {
            ctx.moveTo(prev[0], prev[1]);
            ctx.lineTo(x, y);
          }
          prev = [x, y];
        }
        ctx.stroke();
        return true;
      },
      onMove(x, y, dx, dy) {
        detune = Math.max(0, Math.min(0.06, detune + dx * 0.00004));
        phase += dy * 0.004;
        needsClear = true; // restart the pen with the new tuning
      },
    };
  },
};

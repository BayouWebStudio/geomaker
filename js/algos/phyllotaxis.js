// Phyllotaxis: Vogel's sunflower model. Seeds sit at golden-angle increments on
// a sqrt spiral. Tiny changes to the divergence angle reorganize the whole head,
// so dragging left/right is mesmerizing.
// Interactive: drag ↔ to detune the angle, ↕ to change spacing.

import { TAU, samplePalette } from '../core/util.js';

const GOLDEN = 137.50776405; // the golden angle, in degrees

export default {
  id: 'phyllotaxis',
  name: 'Phyllotaxis',
  category: 'Geometric',
  interactive: true,
  hint: 'Drag ↔ to shift the angle · ↕ to change spacing',
  description: 'Sunflower seed-head spirals at the golden angle. Drag to detune the angle and watch the spirals reorganize.',
  params: [
    { key: 'count', label: 'Seeds', type: 'range', min: 200, max: 4000, step: 50, value: 1400 },
    { key: 'angle', label: 'Divergence angle°', type: 'range', min: 136.5, max: 138.5, step: 0.01, value: GOLDEN },
    { key: 'spacing', label: 'Spacing', type: 'range', min: 3, max: 16, step: 0.2, value: 7 },
    { key: 'dotMin', label: 'Dot size (center)', type: 'range', min: 0.5, max: 8, step: 0.5, value: 2 },
    { key: 'dotMax', label: 'Dot size (edge)', type: 'range', min: 1, max: 18, step: 0.5, value: 7 },
    { key: 'opacity', label: 'Opacity', type: 'range', min: 0.2, max: 1, step: 0.05, value: 0.95 },
    {
      key: 'colorMode', label: 'Color by', type: 'select', value: 'radius',
      options: [
        { value: 'radius', label: 'distance from center' },
        { value: 'index', label: 'seed index' },
        { value: 'angle', label: 'spiral arm (angle)' },
      ],
    },
  ],

  create({ ctx, width, height, palette, params }) {
    const P = params;
    const cx = width / 2;
    const cy = height / 2;
    const count = Math.round(P.count);
    // live-tunable copies so interaction can nudge without a full regenerate
    let angle = P.angle;
    let spacing = P.spacing;
    let dirty = true;

    function render() {
      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, width, height);
      ctx.globalAlpha = P.opacity;
      const aRad = (angle * Math.PI) / 180;
      const rMax = spacing * Math.sqrt(count) || 1;
      for (let i = 0; i < count; i++) {
        const r = spacing * Math.sqrt(i);
        const th = i * aRad;
        const x = cx + r * Math.cos(th);
        const y = cy + r * Math.sin(th);
        if (x < -20 || x > width + 20 || y < -20 || y > height + 20) continue;
        const tr = r / rMax;
        let t;
        if (P.colorMode === 'index') t = i / count;
        else if (P.colorMode === 'angle') t = ((((th % TAU) + TAU) % TAU)) / TAU;
        else t = tr;
        ctx.beginPath();
        ctx.arc(x, y, P.dotMin + (P.dotMax - P.dotMin) * tr, 0, TAU);
        ctx.fillStyle = samplePalette(palette.colors, t);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    return {
      frame() {
        if (dirty) {
          render();
          dirty = false;
        }
        return true;
      },
      onMove(x, y, dx, dy) {
        angle += dx * 0.01; // fine control: a few degrees across the whole canvas
        spacing = Math.max(2, spacing + dy * 0.05);
        dirty = true;
      },
    };
  },
};

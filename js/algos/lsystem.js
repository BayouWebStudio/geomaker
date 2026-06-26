// L-system: Lindenmayer rewrite grammars drawn with a turtle. Ferns, bushes,
// the Koch curve, the dragon curve and Sierpinski — each a string rewritten N
// times then interpreted. Interactive: drag to bend the branching angle.

import { samplePalette } from '../core/util.js';

const PRESETS = {
  plant: { axiom: 'X', rules: { X: 'F+[[X]-X]-F[-FX]+X', F: 'FF' }, angle: 25, iter: 5, start: 'up' },
  bush: { axiom: 'F', rules: { F: 'FF+[+F-F-F]-[-F+F+F]' }, angle: 22, iter: 4, start: 'up' },
  koch: { axiom: 'F', rules: { F: 'F+F-F-F+F' }, angle: 90, iter: 4, start: 'right' },
  dragon: { axiom: 'FX', rules: { X: 'X+YF+', Y: '-FX-Y' }, angle: 90, iter: 11, start: 'right' },
  sierpinski: { axiom: 'F-G-G', rules: { F: 'F-G+F+G-F', G: 'GG' }, angle: 120, iter: 5, start: 'right' },
};

export default {
  id: 'lsystem',
  name: 'L-system',
  category: 'Fractal',
  interactive: true,
  hint: 'Drag ↔ to bend the branching angle',
  description: 'Lindenmayer grammars drawn with a turtle — fractal plants, Koch, dragon and Sierpinski curves.',
  params: [
    {
      key: 'preset', label: 'System', type: 'select', value: 'plant',
      options: [
        { value: 'plant', label: 'fractal plant' },
        { value: 'bush', label: 'bush' },
        { value: 'koch', label: 'Koch curve' },
        { value: 'dragon', label: 'dragon curve' },
        { value: 'sierpinski', label: 'Sierpinski' },
      ],
    },
    { key: 'iterations', label: 'Iterations', type: 'range', min: 1, max: 8, step: 1, value: 5 },
    { key: 'angle', label: 'Angle°', type: 'range', min: 5, max: 120, step: 1, value: 25 },
    { key: 'lineWidth', label: 'Line width', type: 'range', min: 0.4, max: 4, step: 0.1, value: 1.2 },
    { key: 'colorMode', label: 'Color by', type: 'select', value: 'depth', options: [
      { value: 'depth', label: 'growth (along path)' },
      { value: 'mono', label: 'single ink' },
    ] },
  ],

  create({ ctx, width, height, palette, params }) {
    const P = params;
    const def = PRESETS[P.preset] || PRESETS.plant;
    let angle = P.angle;
    let dirty = true;

    // expand the L-system string, capped so deep iterations don't explode
    const iters = Math.min(Math.round(P.iterations), def.iter + 3);
    let str = def.axiom;
    for (let i = 0; i < iters; i++) {
      let out = '';
      for (const ch of str) out += def.rules[ch] || ch;
      str = out;
      if (str.length > 400000) break;
    }

    // interpret the string into line segments at a given angle (turtle space)
    function buildSegments(angDeg) {
      const ang = (angDeg * Math.PI) / 180;
      const seg = [];
      let x = 0;
      let y = 0;
      let dir = def.start === 'up' ? -Math.PI / 2 : 0;
      const stack = [];
      for (const ch of str) {
        if (ch === 'F' || ch === 'G') {
          const nx = x + Math.cos(dir);
          const ny = y + Math.sin(dir);
          seg.push([x, y, nx, ny]);
          x = nx;
          y = ny;
        } else if (ch === 'f') {
          x += Math.cos(dir);
          y += Math.sin(dir);
        } else if (ch === '+') dir += ang;
        else if (ch === '-') dir -= ang;
        else if (ch === '[') stack.push([x, y, dir]);
        else if (ch === ']') [x, y, dir] = stack.pop();
      }
      return seg;
    }

    function render() {
      const seg = buildSegments(angle);
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const s of seg) {
        minX = Math.min(minX, s[0], s[2]);
        minY = Math.min(minY, s[1], s[3]);
        maxX = Math.max(maxX, s[0], s[2]);
        maxY = Math.max(maxY, s[1], s[3]);
      }
      const margin = 0.08;
      const sc = Math.min(
        (width * (1 - 2 * margin)) / Math.max(1e-6, maxX - minX),
        (height * (1 - 2 * margin)) / Math.max(1e-6, maxY - minY)
      );
      const ox = (width - (maxX + minX) * sc) / 2;
      const oy = (height - (maxY + minY) * sc) / 2;

      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, width, height);
      ctx.lineWidth = P.lineWidth;
      ctx.lineCap = 'round';

      const total = seg.length;
      if (P.colorMode === 'mono') {
        ctx.strokeStyle = samplePalette(palette.colors, 0.7);
        ctx.beginPath();
        for (const s of seg) {
          ctx.moveTo(ox + s[0] * sc, oy + s[1] * sc);
          ctx.lineTo(ox + s[2] * sc, oy + s[3] * sc);
        }
        ctx.stroke();
      } else {
        // draw in colored chunks so the path reads as growth
        const CH = 48;
        for (let c = 0; c < CH; c++) {
          ctx.strokeStyle = samplePalette(palette.colors, c / (CH - 1));
          ctx.beginPath();
          for (let i = Math.floor((c / CH) * total); i < Math.floor(((c + 1) / CH) * total); i++) {
            const s = seg[i];
            ctx.moveTo(ox + s[0] * sc, oy + s[1] * sc);
            ctx.lineTo(ox + s[2] * sc, oy + s[3] * sc);
          }
          ctx.stroke();
        }
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
      onMove(x, y, dx) {
        angle = Math.max(1, Math.min(160, angle + dx * 0.15));
        dirty = true;
      },
    };
  },
};

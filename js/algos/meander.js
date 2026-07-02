// Greek Key: classical fret borders — square key spirals, T-frets and stepped
// zigzags — running in horizontal bands between continuous rails, the way
// they wrap a vase or a mosaic floor.

import { samplePalette } from '../core/util.js';

// polylines in a unit cell (u = one grid unit), designed on a 4×4 grid
const KEY = [[0, 0], [3, 0], [3, 3], [1, 3], [1, 1], [2, 1], [2, 2]];
const TEE = [[0, 0], [0, 2], [-1, 2], [2, 2], [1, 2], [1, 0]];

export default {
  id: 'meander',
  name: 'Greek Key',
  category: 'Geometric',
  description: 'Classical fret borders — key spirals, T-frets and stepped zigzags — running in banded rows.',
  params: [
    {
      key: 'style', label: 'Fret', type: 'select', value: 'key',
      options: [
        { value: 'key', label: 'greek key' },
        { value: 'tee', label: 'T-fret' },
        { value: 'steps', label: 'stepped zigzag' },
      ],
    },
    { key: 'unit', label: 'Scale', type: 'range', min: 5, max: 30, step: 1, value: 12 },
    { key: 'lineWidth', label: 'Line width', type: 'range', min: 1, max: 12, step: 0.5, value: 3.5 },
    { key: 'bandGap', label: 'Band spacing', type: 'range', min: 0, max: 3, step: 0.25, value: 1 },
    { key: 'flip', label: 'Mirror alternate rows', type: 'checkbox', value: true },
    { key: 'rails', label: 'Border rails', type: 'checkbox', value: true },
    {
      key: 'colorMode', label: 'Color by', type: 'select', value: 'bands',
      options: [
        { value: 'bands', label: 'gradient bands' },
        { value: 'alternate', label: 'alternate' },
        { value: 'single', label: 'single ink' },
      ],
    },
  ],

  create({ ctx, width, height, rng, palette, params }) {
    const P = params;

    function bandColor(row, rows) {
      if (P.colorMode === 'alternate') {
        return row % 2 === 0 ? palette.colors[0] : palette.colors[palette.colors.length - 1];
      }
      if (P.colorMode === 'single') return samplePalette(palette.colors, 0.35);
      return samplePalette(palette.colors, rows > 1 ? row / (rows - 1) : 0.4);
    }

    function polyline(pts, u, ox, oy, mirror) {
      ctx.beginPath();
      pts.forEach(([px, py], i) => {
        const x = ox + px * u;
        const y = mirror ? oy + (3 - py) * u : oy + py * u;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    function steps(u, ox, oy, cols, mirror) {
      ctx.beginPath();
      for (let i = 0; i <= cols; i++) {
        const x = ox + i * 2 * u;
        const yA = mirror ? oy + 3 * u : oy;
        const yB = mirror ? oy : oy + 3 * u;
        if (i === 0) ctx.moveTo(x, yA);
        else {
          ctx.lineTo(x, i % 2 ? yB : yA);
        }
        ctx.lineTo(x + 2 * u, i % 2 ? yB : yA);
      }
      ctx.stroke();
    }

    let drawn = false;
    return {
      frame() {
        if (drawn) return false;
        drawn = true;
        ctx.fillStyle = palette.bg;
        ctx.fillRect(0, 0, width, height);
        ctx.lineCap = 'square';
        ctx.lineJoin = 'miter';
        ctx.lineWidth = P.lineWidth;

        const u = P.unit;
        const cellW = P.style === 'tee' ? 3 * u : 4 * u;
        const bandH = 4 * u;
        const stride = bandH + P.bandGap * u + P.lineWidth * 2;
        const rows = Math.ceil(height / stride) + 1;
        const cols = Math.ceil(width / cellW) + 2;

        for (let row = 0; row < rows; row++) {
          const oy = row * stride + u / 2;
          const mirror = P.flip && row % 2 === 1;
          ctx.strokeStyle = bandColor(row, rows);
          if (P.rails) {
            ctx.beginPath();
            ctx.moveTo(0, oy - u * 0.5 - P.lineWidth);
            ctx.lineTo(width, oy - u * 0.5 - P.lineWidth);
            ctx.moveTo(0, oy + 3.5 * u + P.lineWidth);
            ctx.lineTo(width, oy + 3.5 * u + P.lineWidth);
            ctx.stroke();
          }
          if (P.style === 'steps') {
            steps(u, -u, oy, cols, mirror);
            continue;
          }
          const pts = P.style === 'tee' ? TEE : KEY;
          for (let i = -1; i < cols; i++) {
            polyline(pts, u, i * cellW, oy, mirror);
          }
        }
        return false;
      },
    };
  },
};

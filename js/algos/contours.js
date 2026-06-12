// Contours: a topographic map of a fractal noise field. Elevation bands are
// filled with palette tints and iso-lines are traced with marching squares.

import { clamp, samplePalette, mixHex, hexToRgb } from '../core/util.js';

const CELL = 3; // field resolution in css px

export default {
  id: 'contours',
  name: 'Contours',
  description: 'A topographic map of a noise landscape: elevation bands and iso-lines.',
  params: [
    { key: 'levels', label: 'Contour levels', type: 'range', min: 3, max: 24, step: 1, value: 10 },
    { key: 'noiseScale', label: 'Noise scale', type: 'range', min: 0.0008, max: 0.012, step: 0.0002, value: 0.003 },
    { key: 'octaves', label: 'Detail (octaves)', type: 'range', min: 1, max: 5, step: 1, value: 3 },
    { key: 'lineWidth', label: 'Line width', type: 'range', min: 0.3, max: 4, step: 0.1, value: 1.2 },
    { key: 'fillBands', label: 'Fill elevation bands', type: 'checkbox', value: true },
    {
      key: 'colorMode', label: 'Lines colored', type: 'select', value: 'elevation',
      options: [
        { value: 'elevation', label: 'by elevation' },
        { value: 'single', label: 'single ink' },
      ],
    },
    { key: 'animate', label: 'Animate (drift)', type: 'checkbox', value: false },
    { key: 'drift', label: 'Drift speed', type: 'range', min: 0.05, max: 3, step: 0.05, value: 0.5 },
  ],

  create({ ctx, width, height, noise, palette, params }) {
    const P = params;
    const gw = Math.ceil(width / CELL) + 1;
    const gh = Math.ceil(height / CELL) + 1;
    const field = new Float32Array(gw * gh);
    const levels = Math.round(P.levels);
    let z = 0;
    let drawn = false;

    // band fills are rendered at field resolution and upscaled with smoothing,
    // which softens band edges like hand-tinted maps; the iso-lines on top
    // stay crisp at full resolution
    const off = document.createElement('canvas');
    off.width = gw - 1;
    off.height = gh - 1;
    const octx = off.getContext('2d');
    const img = octx.createImageData(gw - 1, gh - 1);
    const data = img.data;
    for (let i = 3; i < data.length; i += 4) data[i] = 255;

    const stops = [palette.bg, ...palette.colors];
    const bandRgb = [];
    for (let b = 0; b < levels; b++) bandRgb.push(hexToRgb(samplePalette(stops, levels === 1 ? 0 : b / (levels - 1))));

    function computeField() {
      // normalize to [0, 1] so every elevation band is actually used
      // (raw fbm rarely reaches its extremes)
      let min = Infinity;
      let max = -Infinity;
      for (let y = 0; y < gh; y++) {
        for (let x = 0; x < gw; x++) {
          const v = noise.fbm(x * CELL * P.noiseScale, y * CELL * P.noiseScale, z, P.octaves);
          field[y * gw + x] = v;
          if (v < min) min = v;
          if (v > max) max = v;
        }
      }
      const span = max - min || 1;
      for (let i = 0; i < field.length; i++) field[i] = (field[i] - min) / span;
    }

    function drawBands() {
      for (let y = 0; y < gh - 1; y++) {
        for (let x = 0; x < gw - 1; x++) {
          const v = clamp(field[y * gw + x], 0, 0.999);
          const [r, g, b] = bandRgb[Math.floor(v * levels)];
          const px = (y * (gw - 1) + x) * 4;
          data[px] = r;
          data[px + 1] = g;
          data[px + 2] = b;
        }
      }
      octx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(off, 0, 0, (gw - 1) * CELL, (gh - 1) * CELL);
    }

    // marching squares with linear interpolation; one stroked path per level
    function drawLines() {
      ctx.lineWidth = P.lineWidth;
      ctx.lineCap = 'round';
      for (let l = 1; l < levels; l++) {
        const T = l / levels; // threshold in normalized field space [0, 1]
        ctx.strokeStyle =
          P.colorMode === 'elevation'
            ? mixHex(samplePalette(palette.colors, l / (levels - 1)), '#000000', 0.25)
            : palette.colors[0];
        ctx.beginPath();
        for (let y = 0; y < gh - 1; y++) {
          for (let x = 0; x < gw - 1; x++) {
            const tl = field[y * gw + x];
            const tr = field[y * gw + x + 1];
            const br = field[(y + 1) * gw + x + 1];
            const bl = field[(y + 1) * gw + x];
            let code = 0;
            if (tl > T) code |= 8;
            if (tr > T) code |= 4;
            if (br > T) code |= 2;
            if (bl > T) code |= 1;
            if (code === 0 || code === 15) continue;

            const x0 = x * CELL;
            const y0 = y * CELL;
            // interpolated crossing points on the four cell edges
            const top = [x0 + (CELL * (T - tl)) / (tr - tl), y0];
            const right = [x0 + CELL, y0 + (CELL * (T - tr)) / (br - tr)];
            const bottom = [x0 + (CELL * (T - bl)) / (br - bl), y0 + CELL];
            const left = [x0, y0 + (CELL * (T - tl)) / (bl - tl)];

            const seg = (a, b) => {
              ctx.moveTo(a[0], a[1]);
              ctx.lineTo(b[0], b[1]);
            };
            switch (code) {
              case 1: seg(left, bottom); break;
              case 2: seg(bottom, right); break;
              case 3: seg(left, right); break;
              case 4: seg(top, right); break;
              case 5: seg(left, top); seg(bottom, right); break;
              case 6: seg(top, bottom); break;
              case 7: seg(left, top); break;
              case 8: seg(left, top); break;
              case 9: seg(top, bottom); break;
              case 10: seg(left, bottom); seg(top, right); break;
              case 11: seg(top, right); break;
              case 12: seg(left, right); break;
              case 13: seg(bottom, right); break;
              case 14: seg(left, bottom); break;
            }
          }
        }
        ctx.stroke();
      }
    }

    function drawAll() {
      computeField();
      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, width, height);
      if (P.fillBands) drawBands();
      drawLines();
    }

    return {
      frame() {
        if (!P.animate && drawn) return false;
        drawAll();
        drawn = true;
        if (P.animate) {
          z += P.drift * 0.01;
          return true;
        }
        return false;
      },
    };
  },
};

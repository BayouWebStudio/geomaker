// Mandelbrot / Julia: the escape-time fractal, smooth-coloured. Rendered in a
// capped-resolution buffer and upscaled. Interactive: in Mandelbrot mode drag to
// pan; in Julia mode drag to set the seed c and watch the set morph.

import { clamp, samplePalette, hexToRgb } from '../core/util.js';

const MAXW = 680;

export default {
  id: 'mandelbrot',
  name: 'Mandelbrot / Julia',
  category: 'Fractal',
  interactive: true,
  hint: 'Mandelbrot: drag to pan · Julia: drag to set the seed',
  description: 'The escape-time fractal, smooth-shaded. Drag to pan the Mandelbrot or to morph the Julia seed.',
  params: [
    { key: 'mode', label: 'Set', type: 'select', value: 'mandelbrot', options: [
      { value: 'mandelbrot', label: 'Mandelbrot' },
      { value: 'julia', label: 'Julia' },
    ] },
    { key: 'zoom', label: 'Zoom', type: 'range', min: 0.4, max: 40, step: 0.1, value: 1 },
    { key: 'iterations', label: 'Detail (iterations)', type: 'range', min: 60, max: 600, step: 20, value: 200 },
    { key: 'juliaRe', label: 'Julia seed (real)', type: 'range', min: -1, max: 1, step: 0.005, value: -0.7 },
    { key: 'juliaIm', label: 'Julia seed (imag)', type: 'range', min: -1, max: 1, step: 0.005, value: 0.27 },
    { key: 'cycles', label: 'Colour cycles', type: 'range', min: 0.5, max: 6, step: 0.5, value: 2 },
  ],

  create({ ctx, width, height, palette, params }) {
    const P = params;
    const scale = Math.min(1, MAXW / width);
    const gw = Math.max(2, Math.round(width * scale));
    const gh = Math.max(2, Math.round(height * scale));
    const off = document.createElement('canvas');
    off.width = gw;
    off.height = gh;
    const octx = off.getContext('2d');
    const img = octx.createImageData(gw, gh);
    const data = img.data;
    for (let i = 3; i < data.length; i += 4) data[i] = 255;

    let centerX = P.mode === 'julia' ? 0 : -0.6;
    let centerY = 0;
    let cRe = P.juliaRe;
    let cIm = P.juliaIm;
    let dirty = true;

    const interior = hexToRgb(palette.bg);
    const lut = [];
    for (let i = 0; i < 256; i++) lut.push(hexToRgb(samplePalette([...palette.colors, palette.colors[0]], i / 255)));

    function render() {
      const span = 3.2 / P.zoom;
      const per = span / gw;
      const oy = centerY - (per * gh) / 2;
      const ox = centerX - (per * gw) / 2;
      const maxIter = Math.round(P.iterations);
      const julia = P.mode === 'julia';
      const log2 = Math.log(2);
      for (let y = 0; y < gh; y++) {
        for (let x = 0; x < gw; x++) {
          let zr;
          let zi;
          let cr;
          let ci;
          if (julia) {
            zr = ox + x * per;
            zi = oy + y * per;
            cr = cRe;
            ci = cIm;
          } else {
            zr = 0;
            zi = 0;
            cr = ox + x * per;
            ci = oy + y * per;
          }
          let n = 0;
          let r2 = 0;
          for (; n < maxIter; n++) {
            const t = zr * zr - zi * zi + cr;
            zi = 2 * zr * zi + ci;
            zr = t;
            r2 = zr * zr + zi * zi;
            if (r2 > 256) break;
          }
          const idx = (y * gw + x) * 4;
          if (n >= maxIter) {
            data[idx] = interior[0];
            data[idx + 1] = interior[1];
            data[idx + 2] = interior[2];
          } else {
            const mu = (n + 1 - Math.log(Math.log(Math.sqrt(r2))) / log2) / maxIter;
            const j = clamp(mu * P.cycles, 0, 1) * 255 | 0;
            const c = lut[j];
            data[idx] = c[0];
            data[idx + 1] = c[1];
            data[idx + 2] = c[2];
          }
        }
      }
      octx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(off, 0, 0, width, height);
    }

    const perPixel = () => 3.2 / P.zoom / gw;
    return {
      frame() {
        if (dirty) {
          render();
          dirty = false;
        }
        return true;
      },
      onMove(x, y, dx, dy) {
        const per = perPixel() * (gw / width);
        if (P.mode === 'mandelbrot') {
          centerX -= dx * per;
          centerY -= dy * per;
        } else {
          cRe = clamp(cRe + dx * per * 0.5, -1.2, 1.2);
          cIm = clamp(cIm + dy * per * 0.5, -1.2, 1.2);
        }
        dirty = true;
      },
    };
  },
};

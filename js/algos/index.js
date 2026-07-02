import flow from './flowfield.js';
import coral from './growth.js';
import turing from './reaction.js';
import ridge from './strata.js';
import mycelium from './hyphae.js';
import pebbles from './pebbles.js';
import contours from './contours.js';
import suminagashi from './suminagashi.js';
import voronoi from './voronoi.js';
import flower from './flower.js';
import hexweave from './hexweave.js';
import mandala from './mandala.js';
import truchet from './truchet.js';
import phyllotaxis from './phyllotaxis.js';
import moire from './moire.js';
import wagara from './wagara.js';
import kumiko from './kumiko.js';
import kintsugi from './kintsugi.js';
import shibori from './shibori.js';
import automata from './automata.js';
import quasicrystal from './quasicrystal.js';
import textile from './textile.js';
import mandelbrot from './mandelbrot.js';
import lsystem from './lsystem.js';
import apollonian from './apollonian.js';
import stipple from './stipple.js';
import chladni from './chladni.js';
import harmonograph from './harmonograph.js';
import sacred2 from './sacred2.js';
import attractor from './attractor.js';
import girih from './girih.js';
import celtic from './celtic.js';
import terrazzo from './terrazzo.js';
import motif from './motif.js';
import stripes from './stripes.js';
import parquet from './parquet.js';

// Grouped in the UI by each algorithm's `category` (defaulting to "Organic").
export const ALGORITHMS = [
  flow, coral, turing, ridge, mycelium, pebbles, terrazzo, contours, suminagashi, voronoi, kintsugi, shibori,
  flower, hexweave, mandala, truchet, motif, stripes, parquet, phyllotaxis, moire, wagara, kumiko, automata,
  quasicrystal, textile, girih, celtic, stipple, chladni, harmonograph, sacred2,
  mandelbrot, lsystem, apollonian, attractor,
];

export function algoById(id) {
  return ALGORITHMS.find((a) => a.id === id) || ALGORITHMS[0];
}

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
import { WAGARA_VARIANTS } from './wagara.js';
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
import tessellation from './tessellation.js';
import penrose from './penrose.js';
import sayagata from './sayagata.js';
import asanoha from './asanoha.js';
import { WAGARA2_VARIANTS } from './wagara2.js';
import irezumi from './irezumi.js';
import kiku from './kiku.js';
import opart from './opart.js';
import maze from './maze.js';
import meander from './meander.js';
import spiro from './spiro.js';
import circuit from './circuit.js';
import delaunay from './delaunay.js';

// Grouped in the UI by each algorithm's `category` (defaulting to "Organic").
export const ALGORITHMS = [
  flow, coral, turing, ridge, mycelium, pebbles, terrazzo, contours, suminagashi, voronoi, kintsugi, shibori,
  flower, hexweave, mandala, truchet, motif, stripes, parquet, tessellation, penrose, opart, maze, meander,
  spiro, circuit, delaunay, phyllotaxis, moire, ...WAGARA_VARIANTS, ...WAGARA2_VARIANTS,
  sayagata, asanoha, kumiko, irezumi, kiku, automata,
  quasicrystal, textile, girih, celtic, stipple, chladni, harmonograph, sacred2,
  mandelbrot, lsystem, apollonian, attractor,
];

export function algoById(id) {
  return ALGORITHMS.find((a) => a.id === id) || ALGORITHMS[0];
}

// The free tier on iOS (everything is free on the open web build). Eleven
// picks, six of them touch-interactive — the fun is free to feel: comb the
// marbling, fracture kintsugi, drag voronoi cells, lens-bend the maze, move
// the op-art focus, morph the fractal. The deep Japanese collection (beyond
// seigaiha) stays part of the unlock.
export const FREE_ALGO_IDS = [
  'flow', 'flower', 'mandala', 'truchet', 'seigaiha',
  'suminagashi', 'kintsugi', 'voronoi', 'maze', 'opart', 'mandelbrot',
];

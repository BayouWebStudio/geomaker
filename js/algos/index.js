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

// Organic generators first, then the geometric/sacred-geometry set. The UI
// groups them by each algorithm's `category` (defaulting to "Organic").
export const ALGORITHMS = [
  flow, coral, turing, ridge, mycelium, pebbles, contours, suminagashi, voronoi,
  flower, hexweave, mandala, truchet, phyllotaxis, moire,
];

export function algoById(id) {
  return ALGORITHMS.find((a) => a.id === id) || ALGORITHMS[0];
}

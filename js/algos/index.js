import flow from './flowfield.js';
import coral from './growth.js';
import turing from './reaction.js';
import ridge from './strata.js';
import mycelium from './hyphae.js';
import pebbles from './pebbles.js';
import contours from './contours.js';
import flower from './flower.js';
import hexweave from './hexweave.js';
import mandala from './mandala.js';
import truchet from './truchet.js';

// Organic generators first, then the geometric/sacred-geometry set. The UI
// groups them by each algorithm's `category` (defaulting to "Organic").
export const ALGORITHMS = [
  flow, coral, turing, ridge, mycelium, pebbles, contours,
  flower, hexweave, mandala, truchet,
];

export function algoById(id) {
  return ALGORITHMS.find((a) => a.id === id) || ALGORITHMS[0];
}

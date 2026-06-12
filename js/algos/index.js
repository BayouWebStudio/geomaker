import flow from './flowfield.js';
import coral from './growth.js';
import turing from './reaction.js';
import ridge from './strata.js';
import mycelium from './hyphae.js';
import pebbles from './pebbles.js';
import contours from './contours.js';

export const ALGORITHMS = [flow, coral, turing, ridge, mycelium, pebbles, contours];

export function algoById(id) {
  return ALGORITHMS.find((a) => a.id === id) || ALGORITHMS[0];
}

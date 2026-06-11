import flow from './flowfield.js';
import coral from './growth.js';
import turing from './reaction.js';
import ridge from './strata.js';
import mycelium from './hyphae.js';

export const ALGORITHMS = [flow, coral, turing, ridge, mycelium];

export function algoById(id) {
  return ALGORITHMS.find((a) => a.id === id) || ALGORITHMS[0];
}

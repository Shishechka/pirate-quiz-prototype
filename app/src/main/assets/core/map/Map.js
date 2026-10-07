import {
  BASE_IDS,
  BASE_OWNERS,
  TERRITORY_COUNT,
  territoryLevel,
} from '../constants.js';
import { Territory } from '../entities/Territory.js';
import { Base } from '../entities/Base.js';

function nodeKey(id) {
  return String(id);
}

export class GameMap {
  constructor({ territories, bases, adjacency }) {
    this.territories = territories;
    this.bases = bases;
    this.adjacency = adjacency;
  }

  getTerritory(id) {
    return this.territories.get(Number(id)) ?? null;
  }

  getBase(id) {
    return this.bases.get(String(id)) ?? null;
  }

  getNode(id) {
    return typeof id === 'number' ? this.getTerritory(id) : this.getBase(id);
  }

  getNeighbors(id) {
    return [...(this.adjacency.get(nodeKey(id)) ?? [])];
  }

  areAdjacent(a, b) {
    return this.getNeighbors(a).includes(b);
  }
}

export function createPirateQuizMap({
  territoryOwners = {},
  baseOwners = BASE_OWNERS,
} = {}) {
  const adjacency = new Map();

  const ensureNode = id => {
    const key = nodeKey(id);
    if (!adjacency.has(key)) adjacency.set(key, []);
  };

  for (let id = 1; id <= TERRITORY_COUNT; id++) ensureNode(id);
  for (const baseId of BASE_IDS) ensureNode(baseId);

  const link = (a, b) => {
    ensureNode(a);
    ensureNode(b);
    const aKey = nodeKey(a);
    const bKey = nodeKey(b);
    if (!adjacency.get(aKey).includes(b)) adjacency.get(aKey).push(b);
    if (!adjacency.get(bKey).includes(a)) adjacency.get(bKey).push(a);
  };

  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 6; col++) {
      const id = row * 6 + col + 1;
      if (col < 5) link(id, id + 1);
      if (row < 5) link(id, id + 6);
    }
  }

  link(15, 22);
  link(16, 21);

  const baseConnections = {
    A: [1, 2, 7],
    B: [5, 6, 12],
    C: [25, 31, 32],
    D: [30, 35, 36],
  };

  for (const [baseId, ids] of Object.entries(baseConnections)) {
    for (const id of ids) link(baseId, id);
  }

  const territories = new Map();
  for (let id = 1; id <= TERRITORY_COUNT; id++) {
    territories.set(id, new Territory({
      id,
      level: territoryLevel(id),
      ownerId: territoryOwners[id] ?? null,
      connections: adjacency.get(nodeKey(id)),
    }));
  }

  const bases = new Map();
  for (const baseId of BASE_IDS) {
    const ownerId = baseOwners[baseId];
    if (!ownerId) throw new Error(`Missing owner for base ${baseId}`);
    bases.set(baseId, new Base({
      id: baseId,
      ownerId,
      originalOwnerId: ownerId,
      connections: adjacency.get(nodeKey(baseId)),
    }));
  }

  return new GameMap({ territories, bases, adjacency });
}

import {
  BOOST_TYPES,
  ISLAND_BOOST_TABLES,
} from '../constants.js';

function getTable(level) {
  const table = ISLAND_BOOST_TABLES[level];
  if (!table) throw new Error(`Unknown island level: ${level}`);
  return table;
}

function validateProbabilityTable(level, table) {
  const total = table.reduce((sum, entry) => sum + entry.weight, 0);
  if (total !== 100) {
    throw new Error(`Boost probability table for level ${level} must total 100, got ${total}`);
  }
  for (const entry of table) {
    if (!Number.isFinite(entry.weight) || entry.weight <= 0) {
      throw new Error(`Invalid boost probability weight for level ${level}`);
    }
  }
}

for (const [level, table] of Object.entries(ISLAND_BOOST_TABLES)) {
  validateProbabilityTable(level, table);
}

export class BoostSystem {
  constructor({ rng = Math.random } = {}) {
    this.rng = rng;
  }

  generateForIslandLevel(level) {
    const table = getTable(level);
    const sample = this.rng();

    if (!Number.isFinite(sample) || sample < 0 || sample >= 1) {
      throw new Error('Boost RNG must return a finite value in [0, 1)');
    }

    const roll = sample * 100;
    let cumulative = 0;

    for (const entry of table) {
      cumulative += entry.weight;
      if (roll < cumulative) return entry.type;
    }

    throw new Error(`Boost table for island level ${level} did not resolve a result`);
  }

  getInventoryCount(state, playerId, boostType) {
    const player = state.players.get(playerId);
    if (!player) throw new Error(`Unknown player: ${playerId}`);
    return player.boosts[boostType] ?? 0;
  }

  grantToPlayer(state, playerId, boostType) {
    const player = state.players.get(playerId);
    if (!player) throw new Error(`Unknown player: ${playerId}`);

    if (boostType === BOOST_TYPES.EMPTY) {
      return {
        granted: false,
        count: 0,
      };
    }

    player.boosts[boostType] = (player.boosts[boostType] ?? 0) + 1;

    return {
      granted: true,
      count: player.boosts[boostType],
    };
  }

  resolveTerritoryCapture({
    state,
    territoryId,
    playerId,
    previousOwnerId,
  }) {
    const territory = state.territories.get(Number(territoryId));
    if (!territory) throw new Error(`Unknown territory: ${territoryId}`);
    if (!state.players.has(playerId)) throw new Error(`Unknown player: ${playerId}`);

    if (previousOwnerId != null || territory.firstCaptureResolved) {
      return {
        generated: false,
        granted: false,
        boostType: null,
      };
    }

    const boostType = this.generateForIslandLevel(territory.level);
    territory.firstCaptureResolved = true;

    const inventoryResult = this.grantToPlayer(state, playerId, boostType);

    return {
      generated: true,
      granted: inventoryResult.granted,
      boostType,
      inventoryCount: inventoryResult.count,
    };
  }
}

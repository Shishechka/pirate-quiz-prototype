import {
  BASE_IDS,
  GAME_STAGES,
  PLAYER_IDS,
} from '../constants.js';

function shuffle(values, rng) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export class BaseSelectionSystem {
  constructor({ rng = Math.random } = {}) {
    this.rng = rng;
  }

  validateAssignments(assignments) {
    if (assignments == null) return false;
    const playerIds = Object.keys(assignments).sort();
    const assignedBases = Object.values(assignments).sort();
    return (
      playerIds.join('|') === [...PLAYER_IDS].sort().join('|')
      && assignedBases.join('|') === [...BASE_IDS].sort().join('|')
    );
  }

  createRandomAssignments() {
    const shuffledBases = shuffle(BASE_IDS, this.rng);
    return Object.fromEntries(
      PLAYER_IDS.map((playerId, index) => [playerId, shuffledBases[index]]),
    );
  }

  toBaseOwners(assignments) {
    if (!this.validateAssignments(assignments)) {
      throw new Error('Invalid base assignments');
    }
    return Object.fromEntries(
      Object.entries(assignments).map(([playerId, baseId]) => [baseId, playerId]),
    );
  }

  applyAssignments(state, assignments) {
    if (state.stage !== GAME_STAGES.BASE_SELECTION) {
      throw new Error('Base assignments can only be applied during BASE_SELECTION');
    }
    if (!this.validateAssignments(assignments)) {
      throw new Error('Invalid base assignments');
    }

    const baseOwners = this.toBaseOwners(assignments);

    for (const playerId of PLAYER_IDS) {
      const player = state.players.get(playerId);
      const baseId = assignments[playerId];
      player.baseId = baseId;
      player.ship.pos = baseId;
    }

    for (const baseId of BASE_IDS) {
      const base = state.bases.get(baseId);
      const ownerId = baseOwners[baseId];
      base.ownerId = ownerId;
      base.originalOwnerId = ownerId;
    }

    return { ...assignments };
  }

  randomizeAndApply(state) {
    return this.applyAssignments(state, this.createRandomAssignments());
  }
}

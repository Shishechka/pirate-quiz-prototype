import {
  BOOST_TYPES,
  GAME_STAGES,
  ISLAND_BOOST_TABLES,
} from '../constants.js';
import { BASE_LAYER_STATUS } from '../entities/Base.js';

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
  constructor({
    rng = Math.random,
    economySystem = null,
    flagshipSystem = null,
  } = {}) {
    this.rng = rng;
    this.economySystem = economySystem;
    this.flagshipSystem = flagshipSystem;
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

  consumeFromInventory(state, playerId, boostType) {
    const count = this.getInventoryCount(state, playerId, boostType);
    if (count <= 0) throw new Error(`Player ${playerId} does not have boost ${boostType}`);
    state.players.get(playerId).boosts[boostType] = count - 1;
  }

  hasPlayerUsedBoost(state, playerId) {
    if (!state.players.has(playerId)) throw new Error(`Unknown player: ${playerId}`);
    return state.warState.boostUsedByPlayer[playerId] != null;
  }

  assertPlayerWarBoostAvailable(state, playerId) {
    if (state.stage !== GAME_STAGES.WAR) {
      throw new Error('This boost requires WAR stage');
    }
    if (this.hasPlayerUsedBoost(state, playerId)) {
      throw new Error('Only one boost per player can be used during the current WAR turn');
    }
  }

  assertOwnWarTurnBoostAvailable(state, playerId) {
    this.assertPlayerWarBoostAvailable(state, playerId);
    if (state.currentPlayerId !== playerId) {
      throw new Error('This boost must be used during the player own WAR turn');
    }
  }

  markTurnBoostUsed(state, playerId, boostType) {
    state.warState.boostUsedByPlayer[playerId] = boostType;
  }

  prepareAttackBoost({ state, playerId, boostType }) {
    if (![BOOST_TYPES.RECON, BOOST_TYPES.SECRET_ROUTE, BOOST_TYPES.DOUBLE_VOLLEY].includes(boostType)) {
      throw new Error('Boost is not an attack-preparation boost');
    }
    this.assertOwnWarTurnBoostAvailable(state, playerId);
    if (state.warState.turnActionUsed) {
      throw new Error('Attack boost must be selected before choosing the target');
    }

    this.consumeFromInventory(state, playerId, boostType);
    this.markTurnBoostUsed(state, playerId, boostType);
    state.warState.selectedTurnBoost = {
      playerId,
      boostType,
    };

    return { ...state.warState.selectedTurnBoost };
  }

  useBoost({
    state,
    playerId,
    boostType,
    targetPlayerId = null,
  }) {
    if ([BOOST_TYPES.RECON, BOOST_TYPES.SECRET_ROUTE, BOOST_TYPES.DOUBLE_VOLLEY].includes(boostType)) {
      return this.prepareAttackBoost({ state, playerId, boostType });
    }

    if (boostType === BOOST_TYPES.SECOND_CHANCE) {
      this.assertPlayerWarBoostAvailable(state, playerId);
      const attack = state.warState.activeAttack;
      if (!attack || attack.pendingQuestionResult?.loserId !== playerId) {
        throw new Error('Second Chance requires a lost result that has not been committed yet');
      }
      this.consumeFromInventory(state, playerId, boostType);
      attack.phase = 'QUESTION';
      attack.questionType = 'MULTIPLE_CHOICE_4';
      attack.responses = {};
      attack.pendingQuestionResult = null;
      attack.secondChanceUsedBy = playerId;
      this.markTurnBoostUsed(state, playerId, boostType);
      return { boostType, replayQuestion: true };
    }

    if (state.stage === GAME_STAGES.WAR) {
      this.assertOwnWarTurnBoostAvailable(state, playerId);
    }

    const markIfWar = () => {
      if (state.stage === GAME_STAGES.WAR) {
        this.markTurnBoostUsed(state, playerId, boostType);
      }
    };

    if (boostType === BOOST_TYPES.SMALL_CHEST) {
      if (!this.economySystem) throw new Error('EconomySystem is required');
      this.consumeFromInventory(state, playerId, boostType);
      const transaction = this.economySystem.credit({
        state,
        playerId,
        amount: 10,
        reason: 'BOOST_SMALL_CHEST',
      });
      markIfWar();
      return { boostType, transaction };
    }

    if (boostType === BOOST_TYPES.LARGE_CHEST) {
      if (!this.economySystem) throw new Error('EconomySystem is required');
      this.consumeFromInventory(state, playerId, boostType);
      const transaction = this.economySystem.credit({
        state,
        playerId,
        amount: 20,
        reason: 'BOOST_LARGE_CHEST',
      });
      markIfWar();
      return { boostType, transaction };
    }

    if (boostType === BOOST_TYPES.TREASURE) {
      if (!this.economySystem) throw new Error('EconomySystem is required');
      this.consumeFromInventory(state, playerId, boostType);
      const transaction = this.economySystem.credit({
        state,
        playerId,
        amount: 30,
        reason: 'BOOST_TREASURE',
      });
      markIfWar();
      return { boostType, transaction };
    }

    if (boostType === BOOST_TYPES.REPAIR_KIT) {
      if (!this.flagshipSystem) throw new Error('FlagshipSystem is required');
      this.consumeFromInventory(state, playerId, boostType);
      const repair = this.flagshipSystem.restoreHpFromBoost({
        state,
        playerId,
        points: 2,
      });
      markIfWar();
      return { boostType, repair };
    }

    if (boostType === BOOST_TYPES.FORT_RESTORATION) {
      const player = state.players.get(playerId);
      const base = state.bases.get(player.baseId);
      if (!base?.isActiveBase || base.ownerId !== playerId) {
        throw new Error('Fort Restoration requires the player active own base');
      }
      if (base.layers.fort !== BASE_LAYER_STATUS.DESTROYED) {
        throw new Error('Fort Restoration cannot be used while Fort is intact');
      }
      this.consumeFromInventory(state, playerId, boostType);
      base.restoreFort();
      markIfWar();
      return { boostType, fortStatus: base.layers.fort };
    }

    if (boostType === BOOST_TYPES.BLACK_MARK) {
      if (!targetPlayerId || !state.players.has(targetPlayerId) || targetPlayerId === playerId) {
        throw new Error('Black Mark requires another player as target');
      }
      this.consumeFromInventory(state, playerId, boostType);
      state.warState.blackMarks.push({
        protectedPlayerId: playerId,
        targetPlayerId,
      });
      this.markTurnBoostUsed(state, playerId, boostType);
      return {
        boostType,
        protectedPlayerId: playerId,
        targetPlayerId,
      };
    }

    if (boostType === BOOST_TYPES.SECOND_CHANCE) {
      const attack = state.warState.activeAttack;
      if (!attack || attack.pendingQuestionResult?.loserId !== playerId) {
        throw new Error('Second Chance requires a lost result that has not been committed yet');
      }
      this.consumeFromInventory(state, playerId, boostType);
      attack.phase = 'QUESTION';
      attack.questionType = 'MULTIPLE_CHOICE_4';
      attack.responses = {};
      attack.pendingQuestionResult = null;
      attack.secondChanceUsedBy = playerId;
      this.markTurnBoostUsed(state, playerId, boostType);
      return { boostType, replayQuestion: true };
    }

    if ([
      BOOST_TYPES.COMPASS,
      BOOST_TYPES.PARROT,
      BOOST_TYPES.POWDER_KEG,
      BOOST_TYPES.SPARE_ANCHOR,
      BOOST_TYPES.MERCENARY,
      BOOST_TYPES.SPYGLASS,
      BOOST_TYPES.CURSED_SKULL,
    ].includes(boostType)) {
      throw new Error(`Boost effect ${boostType} is intentionally undefined in Rules v0.4`);
    }

    throw new Error(`Unsupported boost: ${boostType}`);
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

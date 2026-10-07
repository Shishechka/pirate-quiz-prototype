import {
  ARCHIPELAGO_ROUND_COUNT,
  GAME_STAGES,
  PLAYER_IDS,
  TERRITORY_COUNT,
} from '../constants.js';

export class StageSystem {
  getNeutralTerritoryIds(state) {
    return [...state.territories.values()]
      .filter(territory => territory.ownerId == null)
      .map(territory => territory.id)
      .sort((a, b) => a - b);
  }

  completeArchipelago(state) {
    if (state.stage !== GAME_STAGES.ARCHIPELAGO) {
      throw new Error('Archipelago can only be completed from ARCHIPELAGO stage');
    }

    if (state.archipelagoState.completedRounds.length !== ARCHIPELAGO_ROUND_COUNT) {
      throw new Error(
        `ARCHIPELAGO requires exactly ${ARCHIPELAGO_ROUND_COUNT} completed rounds`,
      );
    }

    if (state.territories.size !== TERRITORY_COUNT) {
      throw new Error(`Expected exactly ${TERRITORY_COUNT} territories`);
    }

    const neutral = this.getNeutralTerritoryIds(state);
    if (neutral.length !== 0) {
      throw new Error(
        `ARCHIPELAGO cannot finish with ${neutral.length} neutral territories`,
      );
    }

    state.stage = GAME_STAGES.PREPARATION;
    state.preparationState.readyPlayerIds = [];

    return {
      stage: state.stage,
      neutralTerritories: 0,
    };
  }

  markPlayerReady(state, playerId) {
    if (state.stage !== GAME_STAGES.PREPARATION) {
      throw new Error('Players can become ready only during PREPARATION');
    }
    if (!state.players.has(playerId)) throw new Error(`Unknown player: ${playerId}`);

    if (!state.preparationState.readyPlayerIds.includes(playerId)) {
      state.preparationState.readyPlayerIds.push(playerId);
    }

    if (this.isPreparationComplete(state)) {
      return this.startWar(state);
    }

    return {
      stage: state.stage,
      readyPlayerIds: [...state.preparationState.readyPlayerIds],
    };
  }

  isPreparationComplete(state) {
    return PLAYER_IDS.every(
      playerId => state.preparationState.readyPlayerIds.includes(playerId),
    );
  }

  startWar(state) {
    if (state.stage !== GAME_STAGES.PREPARATION) {
      throw new Error('WAR can only start from PREPARATION');
    }
    if (!this.isPreparationComplete(state)) {
      throw new Error('All 4 players must finish PREPARATION before WAR');
    }

    const neutral = this.getNeutralTerritoryIds(state);
    if (neutral.length !== 0) {
      throw new Error('WAR cannot start while neutral territories remain');
    }

    state.stage = GAME_STAGES.WAR;
    state.round = 1;
    state.turnIndex = 0;
    state.warState.activeAttack = null;
    state.warState.battleHistory = [];
    state.warState.turnsTakenByPlayer = Object.fromEntries(
      PLAYER_IDS.map(playerId => [playerId, 0]),
    );

    return {
      stage: state.stage,
      round: state.round,
      turnIndex: state.turnIndex,
    };
  }
}

import {
  ARCHIPELAGO_ROUND_COUNT,
  GAME_STAGES,
  PLAYER_IDS,
  PREPARATION_TIME_LIMIT_MS,
  TERRITORY_COUNT,
} from '../constants.js';

export class StageSystem {
  constructor({ clock = () => 0 } = {}) {
    this.clock = clock;
  }

  getNeutralTerritoryIds(state) {
    return [...state.territories.values()]
      .filter(territory => territory.ownerId == null)
      .map(territory => territory.id)
      .sort((a, b) => a - b);
  }

  completeArchipelago(state, { nowMs = this.clock() } = {}) {
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

    return this.startPreparation(state, { nowMs });
  }

  startPreparation(state, { nowMs = this.clock() } = {}) {
    state.stage = GAME_STAGES.PREPARATION;
    state.preparationState.readyPlayerIds = [];
    state.preparationState.startedAtMs = nowMs;
    state.preparationState.deadlineAtMs = nowMs + PREPARATION_TIME_LIMIT_MS;

    return {
      stage: state.stage,
      startedAtMs: state.preparationState.startedAtMs,
      deadlineAtMs: state.preparationState.deadlineAtMs,
      neutralTerritories: 0,
    };
  }

  markPlayerReady(state, playerId, { nowMs = this.clock() } = {}) {
    if (state.stage !== GAME_STAGES.PREPARATION) {
      throw new Error('Players can become ready only during PREPARATION');
    }
    if (!state.players.has(playerId)) throw new Error(`Unknown player: ${playerId}`);

    if (this.isPreparationTimedOut(state, nowMs)) {
      return this.startWar(state, { nowMs, reason: 'TIMEOUT' });
    }

    if (!state.preparationState.readyPlayerIds.includes(playerId)) {
      state.preparationState.readyPlayerIds.push(playerId);
    }

    if (this.isPreparationComplete(state)) {
      return this.startWar(state, { nowMs, reason: 'ALL_READY' });
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

  isPreparationTimedOut(state, nowMs = this.clock()) {
    return (
      state.preparationState.deadlineAtMs != null
      && nowMs >= state.preparationState.deadlineAtMs
    );
  }

  checkPreparationTimeout(state, { nowMs = this.clock() } = {}) {
    if (state.stage !== GAME_STAGES.PREPARATION) {
      return { startedWar: false, stage: state.stage };
    }
    if (!this.isPreparationTimedOut(state, nowMs)) {
      return { startedWar: false, stage: state.stage };
    }
    return {
      startedWar: true,
      ...this.startWar(state, { nowMs, reason: 'TIMEOUT' }),
    };
  }

  startWar(state, {
    nowMs = this.clock(),
    reason = null,
  } = {}) {
    if (state.stage !== GAME_STAGES.PREPARATION) {
      throw new Error('WAR can only start from PREPARATION');
    }

    const ready = this.isPreparationComplete(state);
    const timedOut = this.isPreparationTimedOut(state, nowMs);

    if (!ready && !timedOut) {
      throw new Error('PREPARATION is not complete and its 1 minute timer has not expired');
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
    state.warState.turnActionUsed = false;
    state.warState.turnBoostUsed = false;
    state.warState.selectedTurnBoost = null;
    state.warState.blackMarks = [];
    state.warState.tiebreak = null;

    return {
      stage: state.stage,
      round: state.round,
      turnIndex: state.turnIndex,
      reason: reason ?? (ready ? 'ALL_READY' : 'TIMEOUT'),
    };
  }
}

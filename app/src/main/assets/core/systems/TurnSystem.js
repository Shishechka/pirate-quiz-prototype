import {
  GAME_STAGES,
  PLAYER_IDS,
  TURNS_PER_ROUND,
} from '../constants.js';

export class TurnSystem {
  constructor({
    roundSystem,
    fameSystem = null,
  }) {
    if (!roundSystem) throw new Error('TurnSystem requires RoundSystem');
    this.roundSystem = roundSystem;
    this.fameSystem = fameSystem;
  }

  getCurrentPlayerId(state) {
    if (state.finished) return null;
    if (state.warState.tiebreak?.active) {
      return state.warState.tiebreak.order[state.warState.tiebreak.turnIndex] ?? null;
    }
    const order = this.roundSystem.getOrder(state.turnOrders, state.round);
    return order[state.turnIndex] ?? null;
  }

  clearCompletedTurnState(state, completedPlayerId) {
    state.warState.activeAttack = null;
    state.warState.turnActionUsed = false;
    state.warState.boostUsedByPlayer = Object.fromEntries(
      PLAYER_IDS.map(playerId => [playerId, null]),
    );
    state.warState.selectedTurnBoost = null;
    state.warState.blackMarks = state.warState.blackMarks.filter(
      mark => mark.targetPlayerId !== completedPlayerId,
    );
  }

  finishWithWinners(state, winnerIds) {
    state.resultState.winnerIds = [...winnerIds];
    state.finished = true;
    return {
      finished: true,
      advancedRound: false,
      winnerIds: [...winnerIds],
    };
  }

  finishNormalWarOrStartTiebreak(state) {
    if (!this.fameSystem) {
      return this.finishWithWinners(state, []);
    }

    const leaders = this.fameSystem.getLeaders(state);
    if (leaders.playerIds.length === 1) {
      return this.finishWithWinners(state, leaders.playerIds);
    }

    state.warState.tiebreak = {
      active: true,
      playerIds: [...leaders.playerIds],
      order: this.roundSystem.createTiebreakOrder(leaders.playerIds),
      turnIndex: 0,
    };

    return {
      finished: false,
      advancedRound: true,
      tiebreak: true,
      playerIds: [...leaders.playerIds],
      order: [...state.warState.tiebreak.order],
    };
  }

  advanceTiebreak(state) {
    const tiebreak = state.warState.tiebreak;
    const completedPlayerId = this.getCurrentPlayerId(state);
    this.clearCompletedTurnState(state, completedPlayerId);

    if (tiebreak.turnIndex + 1 < tiebreak.order.length) {
      tiebreak.turnIndex += 1;
      return {
        finished: false,
        advancedRound: false,
        tiebreak: true,
        completedPlayerId,
      };
    }

    const leaders = this.fameSystem
      ? this.fameSystem.getLeaders(state, tiebreak.playerIds)
      : { playerIds: [...tiebreak.playerIds] };

    tiebreak.active = false;
    return {
      completedPlayerId,
      ...this.finishWithWinners(state, leaders.playerIds),
    };
  }

  advance(state) {
    if (state.finished) return { finished: true, advancedRound: false };
    if (state.stage !== GAME_STAGES.WAR) {
      throw new Error('TurnSystem.advance is only valid during WAR');
    }

    if (state.warState.tiebreak?.active) {
      return this.advanceTiebreak(state);
    }

    const completedPlayerId = this.getCurrentPlayerId(state);
    state.warState.turnsTakenByPlayer[completedPlayerId] += 1;
    this.clearCompletedTurnState(state, completedPlayerId);

    if (state.turnIndex + 1 < TURNS_PER_ROUND) {
      state.turnIndex += 1;
      return {
        finished: false,
        advancedRound: false,
        completedPlayerId,
      };
    }

    if (state.round >= this.roundSystem.roundCount) {
      return {
        completedPlayerId,
        ...this.finishNormalWarOrStartTiebreak(state),
      };
    }

    state.round += 1;
    state.turnIndex = 0;
    return {
      finished: false,
      advancedRound: true,
      completedPlayerId,
    };
  }

  skipTurn(state) {
    return {
      skipped: true,
      ...this.advance(state),
    };
  }
}

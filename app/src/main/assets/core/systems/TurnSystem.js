import { TURNS_PER_ROUND } from '../constants.js';

export class TurnSystem {
  constructor({ roundSystem }) {
    if (!roundSystem) throw new Error('TurnSystem requires RoundSystem');
    this.roundSystem = roundSystem;
  }

  getCurrentPlayerId(state) {
    if (state.finished) return null;
    const order = this.roundSystem.getOrder(state.turnOrders, state.round);
    return order[state.turnIndex] ?? null;
  }

  advance(state) {
    if (state.finished) return { finished: true, advancedRound: false };

    if (state.turnIndex + 1 < TURNS_PER_ROUND) {
      state.turnIndex += 1;
      return { finished: false, advancedRound: false };
    }

    if (state.round >= this.roundSystem.roundCount) {
      state.finished = true;
      return { finished: true, advancedRound: false };
    }

    state.round += 1;
    state.turnIndex = 0;
    return { finished: false, advancedRound: true };
  }
}

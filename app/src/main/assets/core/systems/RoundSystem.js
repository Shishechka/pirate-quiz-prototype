import {
  PLAYER_IDS,
  TURNS_PER_ROUND,
  WAR_ROUND_COUNT,
} from '../constants.js';

function shuffle(values, rng) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export class RoundSystem {
  constructor({
    playerIds = PLAYER_IDS,
    roundCount = WAR_ROUND_COUNT,
    rng = Math.random,
  } = {}) {
    this.playerIds = [...playerIds];
    this.roundCount = roundCount;
    this.rng = rng;

    if (this.playerIds.length !== TURNS_PER_ROUND) {
      throw new Error(`RoundSystem expects exactly ${TURNS_PER_ROUND} players`);
    }
  }

  shuffle(values) {
    return shuffle(values, this.rng);
  }

  createTurnOrders() {
    return Array.from(
      { length: this.roundCount },
      () => this.shuffle(this.playerIds),
    );
  }

  createTiebreakOrder(playerIds) {
    if (!Array.isArray(playerIds) || playerIds.length < 2) {
      throw new Error('Tiebreak requires at least 2 players');
    }
    return this.shuffle(playerIds);
  }

  validateTurnOrders(turnOrders) {
    if (!Array.isArray(turnOrders) || turnOrders.length !== this.roundCount) return false;

    const expected = [...this.playerIds].sort().join('|');
    return turnOrders.every(order => (
      Array.isArray(order)
      && order.length === TURNS_PER_ROUND
      && [...order].sort().join('|') === expected
    ));
  }

  getOrder(turnOrders, roundNumber) {
    if (!this.validateTurnOrders(turnOrders)) throw new Error('Invalid turnOrders');
    if (!Number.isInteger(roundNumber) || roundNumber < 1 || roundNumber > this.roundCount) {
      throw new Error('Invalid round number');
    }
    return [...turnOrders[roundNumber - 1]];
  }
}

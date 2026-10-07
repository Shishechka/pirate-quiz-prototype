import {
  DEFAULT_ECONOMY_PRICES,
  ECONOMY_TRANSACTION_TYPES,
} from '../constants.js';

function assertPositiveDubloonAmount(amount, label = 'amount') {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error(`${label} must be a positive integer number of dubloons`);
  }
}

function getPlayer(state, playerId) {
  const player = state.players.get(playerId);
  if (!player) throw new Error(`Unknown player: ${playerId}`);
  return player;
}

export class EconomySystem {
  constructor({ prices = DEFAULT_ECONOMY_PRICES } = {}) {
    this.prices = Object.freeze({
      ...DEFAULT_ECONOMY_PRICES,
      ...(prices ?? {}),
    });

    for (const [key, price] of Object.entries(this.prices)) {
      assertPositiveDubloonAmount(price, `price ${key}`);
    }
  }

  getBalance(state, playerId) {
    return getPlayer(state, playerId).coins;
  }

  getPrice(priceKey) {
    const price = this.prices[priceKey];
    if (price == null) throw new Error(`Unknown economy price key: ${priceKey}`);
    return price;
  }

  getPrices() {
    return { ...this.prices };
  }

  canAfford(state, playerId, amount) {
    assertPositiveDubloonAmount(amount);
    return this.getBalance(state, playerId) >= amount;
  }

  canAffordPrice(state, playerId, priceKey) {
    return this.canAfford(state, playerId, this.getPrice(priceKey));
  }

  credit({
    state,
    playerId,
    amount,
    reason = 'UNSPECIFIED',
  }) {
    assertPositiveDubloonAmount(amount);

    const player = getPlayer(state, playerId);
    const balanceBefore = player.coins;
    player.coins += amount;

    return this.recordTransaction(state, {
      playerId,
      type: ECONOMY_TRANSACTION_TYPES.CREDIT,
      amount,
      reason,
      balanceBefore,
      balanceAfter: player.coins,
    });
  }

  spend({
    state,
    playerId,
    amount,
    reason = 'UNSPECIFIED',
  }) {
    assertPositiveDubloonAmount(amount);

    const player = getPlayer(state, playerId);
    const balanceBefore = player.coins;

    if (balanceBefore < amount) {
      throw new Error(
        `Insufficient dubloons for ${playerId}: requires ${amount}, has ${balanceBefore}`,
      );
    }

    player.coins -= amount;

    return this.recordTransaction(state, {
      playerId,
      type: ECONOMY_TRANSACTION_TYPES.DEBIT,
      amount,
      reason,
      balanceBefore,
      balanceAfter: player.coins,
    });
  }

  spendPrice({
    state,
    playerId,
    priceKey,
    reason = priceKey,
  }) {
    return this.spend({
      state,
      playerId,
      amount: this.getPrice(priceKey),
      reason,
    });
  }

  getHistory(state, playerId = null) {
    const transactions = playerId == null
      ? state.economyState.transactions
      : state.economyState.transactions.filter(
        transaction => transaction.playerId === playerId,
      );

    return transactions.map(transaction => ({ ...transaction }));
  }

  recordTransaction(state, transaction) {
    if (!state.economyState) {
      throw new Error('GameState.economyState is required');
    }

    const entry = {
      transactionId: state.economyState.nextTransactionId,
      ...transaction,
    };

    state.economyState.nextTransactionId += 1;
    state.economyState.transactions.push(entry);

    return { ...entry };
  }
}

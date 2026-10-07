export class FameSystem {
  getTerritoryFame(state, playerId) {
    if (!state.players.has(playerId)) throw new Error(`Unknown player: ${playerId}`);
    let total = 0;
    for (const territory of state.territories.values()) {
      if (territory.ownerId === playerId) total += territory.level;
    }
    return total;
  }

  getEventFame(state, playerId) {
    return state.fameState.events
      .filter(event => event.playerId === playerId)
      .reduce((sum, event) => sum + event.amount, 0);
  }

  getFame(state, playerId) {
    return Math.max(
      0,
      this.getTerritoryFame(state, playerId) + this.getEventFame(state, playerId),
    );
  }

  record(state, {
    playerId,
    amount,
    reason,
    metadata = null,
  }) {
    if (!state.players.has(playerId)) throw new Error(`Unknown player: ${playerId}`);
    if (!Number.isInteger(amount) || amount === 0) {
      throw new Error('Fame amount must be a non-zero integer');
    }

    const event = {
      eventId: state.fameState.nextEventId,
      playerId,
      amount,
      reason,
      metadata,
    };
    state.fameState.nextEventId += 1;
    state.fameState.events.push(event);
    return { ...event };
  }

  award(state, playerId, amount, reason, metadata = null) {
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new Error('Fame award must be a positive integer');
    }
    return this.record(state, {
      playerId,
      amount,
      reason,
      metadata,
    });
  }

  penalizeFloorZero(state, playerId, amount, reason, metadata = null) {
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new Error('Fame penalty must be a positive integer');
    }
    const actualPenalty = Math.min(amount, this.getFame(state, playerId));
    if (actualPenalty === 0) return null;
    return this.record(state, {
      playerId,
      amount: -actualPenalty,
      reason,
      metadata,
    });
  }

  getLeaders(state, playerIds = null) {
    const ids = playerIds ?? [...state.players.keys()];
    const scores = ids.map(playerId => ({
      playerId,
      fame: this.getFame(state, playerId),
    }));
    const maxFame = Math.max(...scores.map(entry => entry.fame));
    return {
      maxFame,
      playerIds: scores
        .filter(entry => entry.fame === maxFame)
        .map(entry => entry.playerId),
      scores,
    };
  }
}

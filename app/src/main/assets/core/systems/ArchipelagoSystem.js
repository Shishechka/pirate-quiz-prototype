import {
  ARCHIPELAGO_CLAIM_RANK_ORDER,
  ARCHIPELAGO_ROUND_COUNT,
  ARCHIPELAGO_TERRITORY_AWARDS,
  GAME_STAGES,
  PLAYER_IDS,
} from '../constants.js';

function assertFiniteNumber(value, label) {
  if (!Number.isFinite(value)) throw new Error(`${label} must be a finite number`);
}

function countByPlayer(claims) {
  const counts = Object.fromEntries(PLAYER_IDS.map(playerId => [playerId, 0]));
  for (const claim of claims) counts[claim.playerId] += 1;
  return counts;
}

export class ArchipelagoSystem {
  constructor({ map }) {
    if (!map) throw new Error('ArchipelagoSystem requires GameMap');
    this.map = map;
  }

  assertArchipelagoStage(state) {
    if (state.stage !== GAME_STAGES.ARCHIPELAGO) {
      throw new Error('ArchipelagoSystem can only operate during ARCHIPELAGO stage');
    }
  }

  getNeutralTerritoryIds(state) {
    return [...state.territories.values()]
      .filter(territory => territory.ownerId == null)
      .map(territory => territory.id)
      .sort((a, b) => a - b);
  }

  getAdjacentNeutralTerritoryIds(state, playerId) {
    const player = state.players.get(playerId);
    if (!player) throw new Error(`Unknown player: ${playerId}`);

    const sources = [player.baseId];
    for (const territory of state.territories.values()) {
      if (territory.ownerId === playerId) sources.push(territory.id);
    }

    const result = new Set();
    for (const source of sources) {
      for (const neighbor of this.map.getNeighbors(source)) {
        if (typeof neighbor !== 'number') continue;
        const territory = state.territories.get(neighbor);
        if (territory?.ownerId == null) result.add(neighbor);
      }
    }

    return [...result].sort((a, b) => a - b);
  }

  isCutOff(state, playerId) {
    return (
      this.getNeutralTerritoryIds(state).length > 0
      && this.getAdjacentNeutralTerritoryIds(state, playerId).length === 0
    );
  }

  getClaimableTerritoryIds(state, playerId) {
    const adjacent = this.getAdjacentNeutralTerritoryIds(state, playerId);
    if (adjacent.length > 0) return adjacent;
    return this.getNeutralTerritoryIds(state);
  }

  rankNumericResponses({ correctAnswer, responses }) {
    assertFiniteNumber(correctAnswer, 'correctAnswer');

    const results = PLAYER_IDS.map(playerId => {
      const value = responses?.[playerId];
      assertFiniteNumber(value, `response for ${playerId}`);
      return {
        playerId,
        response: value,
        error: Math.abs(value - correctAnswer),
      };
    });

    results.sort((a, b) => a.error - b.error);

    for (let index = 1; index < results.length; index++) {
      if (results[index].error === results[index - 1].error) {
        throw new Error(
          'Numeric ranking tie is unresolved by the current Rules v0.3 implementation',
        );
      }
    }

    return results;
  }

  beginRound({
    state,
    question = null,
    correctAnswer,
    responses,
  }) {
    this.assertArchipelagoStage(state);

    if (state.round < 1 || state.round > ARCHIPELAGO_ROUND_COUNT) {
      throw new Error('Invalid ARCHIPELAGO round number');
    }

    const progress = state.archipelagoState;
    if (progress.claimQueue.length > 0 && progress.claimIndex < progress.claimQueue.length) {
      throw new Error('Current ARCHIPELAGO round still has unresolved territory claims');
    }

    const rankedResponses = this.rankNumericResponses({ correctAnswer, responses });
    const ranking = rankedResponses.map(result => result.playerId);
    const claimQueue = ARCHIPELAGO_CLAIM_RANK_ORDER.map(rankIndex => ranking[rankIndex]);

    state.archipelagoState.ranking = [...ranking];
    state.archipelagoState.claimQueue = claimQueue;
    state.archipelagoState.claimIndex = 0;
    state.archipelagoState.claimedThisRound = [];

    state.quizState.currentQuestion = question;
    state.quizState.questionType = 'NUMERIC';
    state.quizState.context = GAME_STAGES.ARCHIPELAGO;
    state.quizState.responses = Object.fromEntries(
      rankedResponses.map(result => [result.playerId, result.response]),
    );
    state.quizState.ranking = [...ranking];

    return {
      round: state.round,
      ranking: [...ranking],
      awards: [...ARCHIPELAGO_TERRITORY_AWARDS],
      claimQueue: [...claimQueue],
    };
  }

  getCurrentClaimPlayerId(state) {
    const progress = state.archipelagoState;
    return progress.claimQueue[progress.claimIndex] ?? null;
  }

  canClaimTerritory(state, playerId, territoryId) {
    const territory = state.territories.get(Number(territoryId));
    if (!territory || territory.ownerId != null) return false;
    return this.getClaimableTerritoryIds(state, playerId).includes(Number(territoryId));
  }

  claimTerritory({ state, territoryId }) {
    this.assertArchipelagoStage(state);

    const playerId = this.getCurrentClaimPlayerId(state);
    if (!playerId) throw new Error('No ARCHIPELAGO territory claim is currently pending');

    const id = Number(territoryId);
    const territory = state.territories.get(id);
    if (!territory) throw new Error(`Unknown territory: ${territoryId}`);
    if (territory.ownerId != null) throw new Error(`Territory ${id} is not neutral`);

    const adjacent = this.getAdjacentNeutralTerritoryIds(state, playerId);
    if (adjacent.length > 0 && !adjacent.includes(id)) {
      throw new Error(
        `Territory ${id} is not adjacent to ${playerId}; non-adjacent claim is only allowed when cut off`,
      );
    }

    if (adjacent.length === 0 && !this.getNeutralTerritoryIds(state).includes(id)) {
      throw new Error(`Territory ${id} cannot be claimed`);
    }

    territory.ownerId = playerId;

    const claim = {
      playerId,
      territoryId: id,
      usedCutOffRule: adjacent.length === 0,
    };

    state.archipelagoState.claimedThisRound.push(claim);
    state.archipelagoState.claimIndex += 1;

    if (state.archipelagoState.claimIndex === state.archipelagoState.claimQueue.length) {
      this.completeRound(state);
    }

    return claim;
  }

  completeRound(state) {
    const progress = state.archipelagoState;

    if (progress.claimedThisRound.length !== 6) {
      throw new Error('ARCHIPELAGO round must distribute exactly 6 territories');
    }

    const claimCounts = countByPlayer(progress.claimedThisRound);
    const expectedCounts = Object.fromEntries(
      progress.ranking.map((playerId, rankIndex) => [
        playerId,
        ARCHIPELAGO_TERRITORY_AWARDS[rankIndex],
      ]),
    );

    for (const playerId of PLAYER_IDS) {
      if (claimCounts[playerId] !== expectedCounts[playerId]) {
        throw new Error('ARCHIPELAGO round does not match 2/2/1/1 territory awards');
      }
    }

    progress.completedRounds.push({
      round: state.round,
      ranking: [...progress.ranking],
      claims: progress.claimedThisRound.map(claim => ({ ...claim })),
    });

    progress.ranking = [];
    progress.claimQueue = [];
    progress.claimIndex = 0;
    progress.claimedThisRound = [];

    if (state.round === ARCHIPELAGO_ROUND_COUNT) {
      const neutral = this.getNeutralTerritoryIds(state);
      if (neutral.length !== 0) {
        throw new Error(
          `ARCHIPELAGO finished with ${neutral.length} neutral territories remaining`,
        );
      }
      state.stage = GAME_STAGES.PREPARATION;
      return;
    }

    state.round += 1;
  }
}

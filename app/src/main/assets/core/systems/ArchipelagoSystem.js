import {
  ARCHIPELAGO_CLAIM_RANK_ORDER,
  ARCHIPELAGO_QUESTION_TIME_LIMIT_MS,
  ARCHIPELAGO_ROUND_COUNT,
  ARCHIPELAGO_TERRITORY_AWARDS,
  GAME_STAGES,
  PLAYER_IDS,
  QUESTION_TYPES,
} from '../constants.js';
import { BoostSystem } from './BoostSystem.js';
import { StageSystem } from './StageSystem.js';

function countByPlayer(claims) {
  const counts = Object.fromEntries(PLAYER_IDS.map(playerId => [playerId, 0]));
  for (const claim of claims) counts[claim.playerId] += 1;
  return counts;
}

export class ArchipelagoSystem {
  constructor({
    map,
    boostSystem = new BoostSystem(),
    stageSystem = new StageSystem(),
    rng = Math.random,
  }) {
    if (!map) throw new Error('ArchipelagoSystem requires GameMap');
    this.map = map;
    this.boostSystem = boostSystem;
    this.stageSystem = stageSystem;
    this.rng = rng;
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

  normalizeNumericResponse(input) {
    const raw = (
      input != null
      && typeof input === 'object'
      && !Array.isArray(input)
    )
      ? input
      : { value: input, elapsedMs: 0 };

    const value = raw.value;
    const elapsedMs = raw.elapsedMs ?? 0;
    const valid = (
      Number.isInteger(value)
      && Number.isFinite(elapsedMs)
      && elapsedMs >= 0
      && elapsedMs <= ARCHIPELAGO_QUESTION_TIME_LIMIT_MS
    );

    if (!valid) {
      return {
        answered: false,
        response: null,
        elapsedMs: null,
        error: null,
      };
    }

    return {
      answered: true,
      response: value,
      elapsedMs,
      error: null,
    };
  }

  rankNumericResponses({
    correctAnswer,
    responses,
    playerIds = PLAYER_IDS,
  }) {
    if (!Number.isInteger(correctAnswer)) {
      throw new Error('correctAnswer must be an integer');
    }

    const results = playerIds.map(playerId => {
      const normalized = this.normalizeNumericResponse(responses?.[playerId]);
      return {
        playerId,
        ...normalized,
        error: normalized.answered
          ? Math.abs(normalized.response - correctAnswer)
          : null,
        randomOrder: normalized.answered ? null : this.rng(),
      };
    });

    results.sort((a, b) => {
      if (a.answered !== b.answered) return a.answered ? -1 : 1;
      if (!a.answered && !b.answered) return a.randomOrder - b.randomOrder;
      if (a.error !== b.error) return a.error - b.error;
      if (a.elapsedMs !== b.elapsedMs) return a.elapsedMs - b.elapsedMs;
      return 0;
    });

    const tieGroups = [];
    let index = 0;
    while (index < results.length) {
      const current = results[index];
      if (!current.answered) break;

      const group = [current.playerId];
      let next = index + 1;
      while (
        next < results.length
        && results[next].answered
        && results[next].error === current.error
        && results[next].elapsedMs === current.elapsedMs
      ) {
        group.push(results[next].playerId);
        next += 1;
      }
      if (group.length > 1) tieGroups.push(group);
      index = next;
    }

    return {
      rankedResponses: results.map(({ randomOrder, ...entry }) => entry),
      tieGroups,
    };
  }

  finalizeRanking(state, rankedResponses) {
    const ranking = rankedResponses.map(result => result.playerId);
    const claimQueue = ARCHIPELAGO_CLAIM_RANK_ORDER.map(rankIndex => ranking[rankIndex]);

    state.archipelagoState.ranking = [...ranking];
    state.archipelagoState.claimQueue = claimQueue;
    state.archipelagoState.claimIndex = 0;
    state.archipelagoState.claimedThisRound = [];
    state.archipelagoState.pendingRankedResponses = [];
    state.archipelagoState.pendingTieGroups = [];

    state.quizState.responses = Object.fromEntries(
      rankedResponses.map(result => [
        result.playerId,
        result.response,
      ]),
    );
    state.quizState.ranking = [...ranking];

    return {
      round: state.round,
      ranking: [...ranking],
      awards: [...ARCHIPELAGO_TERRITORY_AWARDS],
      claimQueue: [...claimQueue],
      requiresTieBreak: false,
    };
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
    if (progress.pendingTieGroups.length > 0) {
      throw new Error('Current ARCHIPELAGO ranking still requires a tie-break question');
    }

    const rankingResult = this.rankNumericResponses({
      correctAnswer,
      responses,
    });

    state.quizState.currentQuestion = question;
    state.quizState.questionType = QUESTION_TYPES.NUMERIC;
    state.quizState.context = GAME_STAGES.ARCHIPELAGO;
    state.quizState.deadlineAtMs = ARCHIPELAGO_QUESTION_TIME_LIMIT_MS;
    state.quizState.lockedPlayerIds = [...PLAYER_IDS];

    if (rankingResult.tieGroups.length > 0) {
      progress.pendingRankedResponses = rankingResult.rankedResponses.map(result => ({
        ...result,
      }));
      progress.pendingTieGroups = rankingResult.tieGroups.map(group => [...group]);

      return {
        round: state.round,
        requiresTieBreak: true,
        tiedPlayerIds: [...progress.pendingTieGroups[0]],
      };
    }

    return this.finalizeRanking(state, rankingResult.rankedResponses);
  }

  resolveTieBreak({
    state,
    question = null,
    correctAnswer,
    responses,
  }) {
    this.assertArchipelagoStage(state);
    const progress = state.archipelagoState;
    const tiedPlayerIds = progress.pendingTieGroups[0];

    if (!tiedPlayerIds) {
      throw new Error('No ARCHIPELAGO tie-break is pending');
    }

    const tieResult = this.rankNumericResponses({
      correctAnswer,
      responses,
      playerIds: tiedPlayerIds,
    });

    state.quizState.currentQuestion = question;
    state.quizState.questionType = QUESTION_TYPES.NUMERIC;
    state.quizState.context = 'ARCHIPELAGO_TIE_BREAK';
    state.quizState.deadlineAtMs = ARCHIPELAGO_QUESTION_TIME_LIMIT_MS;
    state.quizState.lockedPlayerIds = [...tiedPlayerIds];

    if (tieResult.tieGroups.length > 0) {
      progress.pendingTieGroups[0] = [...tieResult.tieGroups[0]];
      return {
        requiresTieBreak: true,
        tiedPlayerIds: [...progress.pendingTieGroups[0]],
      };
    }

    const positions = tiedPlayerIds
      .map(playerId => progress.pendingRankedResponses
        .findIndex(result => result.playerId === playerId))
      .sort((a, b) => a - b);

    positions.forEach((position, index) => {
      progress.pendingRankedResponses[position] = {
        ...tieResult.rankedResponses[index],
      };
    });

    progress.pendingTieGroups.shift();

    if (progress.pendingTieGroups.length > 0) {
      return {
        requiresTieBreak: true,
        tiedPlayerIds: [...progress.pendingTieGroups[0]],
      };
    }

    return this.finalizeRanking(state, progress.pendingRankedResponses);
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

    const boostResult = this.boostSystem.resolveTerritoryCapture({
      state,
      territoryId: id,
      playerId,
      previousOwnerId: territory.ownerId,
    });

    territory.ownerId = playerId;

    const claim = {
      playerId,
      territoryId: id,
      usedCutOffRule: adjacent.length === 0,
      boostType: boostResult.boostType,
      boostGranted: boostResult.granted,
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
      this.stageSystem.completeArchipelago(state);
      return;
    }

    state.round += 1;
  }
}

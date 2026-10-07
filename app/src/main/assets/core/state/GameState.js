import {
  GAME_STAGES,
  PLAYER_IDS,
  isGameStage,
} from '../constants.js';

function createDefaultEconomyState() {
  return {
    transactions: [],
    nextTransactionId: 1,
  };
}

function createDefaultFameState() {
  return {
    events: [],
    nextEventId: 1,
  };
}

function createDefaultPreparationState() {
  return {
    readyPlayerIds: [],
    startedAtMs: null,
    deadlineAtMs: null,
  };
}

function createDefaultWarState() {
  return {
    activeAttack: null,
    battleHistory: [],
    turnsTakenByPlayer: Object.fromEntries(
      PLAYER_IDS.map(playerId => [playerId, 0]),
    ),
    turnActionUsed: false,
    boostUsedByPlayer: Object.fromEntries(
      PLAYER_IDS.map(playerId => [playerId, null]),
    ),
    selectedTurnBoost: null,
    blackMarks: [],
    tiebreak: null,
  };
}

function createDefaultArchipelagoState() {
  return {
    ranking: [],
    claimQueue: [],
    claimIndex: 0,
    claimedThisRound: [],
    completedRounds: [],
    pendingRankedResponses: [],
    pendingTieGroups: [],
  };
}

function createDefaultQuizState() {
  return {
    currentQuestion: null,
    questionType: null,
    context: null,
    responses: {},
    ranking: [],
    deadlineAtMs: null,
    questionTimeLimitMs: null,
    lockedPlayerIds: [],
  };
}

function createDefaultResultState() {
  return {
    winnerIds: [],
  };
}

export class GameState {
  constructor({
    stage = GAME_STAGES.BASE_SELECTION,
    players,
    territories,
    bases,
    turnOrders = [],
    round = 1,
    turnIndex = 0,
    archipelagoState = null,
    economyState = null,
    fameState = null,
    preparationState = null,
    warState = null,
    quizState = null,
    resultState = null,
  }) {
    if (!isGameStage(stage)) throw new Error(`Unknown game stage: ${stage}`);

    this._stage = stage;
    this.players = players;
    this.territories = territories;
    this.bases = bases;
    this.turnOrders = turnOrders;
    this.round = round;
    this.turnIndex = turnIndex;

    this.archipelagoState = {
      ...createDefaultArchipelagoState(),
      ...(archipelagoState ?? {}),
      ranking: [...(archipelagoState?.ranking ?? [])],
      claimQueue: [...(archipelagoState?.claimQueue ?? [])],
      claimedThisRound: [...(archipelagoState?.claimedThisRound ?? [])],
      completedRounds: [...(archipelagoState?.completedRounds ?? [])],
      pendingRankedResponses: [...(archipelagoState?.pendingRankedResponses ?? [])].map(
        response => ({ ...response }),
      ),
      pendingTieGroups: [...(archipelagoState?.pendingTieGroups ?? [])].map(
        group => [...group],
      ),
    };

    this.economyState = {
      ...createDefaultEconomyState(),
      ...(economyState ?? {}),
      transactions: [...(economyState?.transactions ?? [])].map(transaction => ({
        ...transaction,
      })),
    };

    this.fameState = {
      ...createDefaultFameState(),
      ...(fameState ?? {}),
      events: [...(fameState?.events ?? [])].map(event => ({ ...event })),
    };

    this.preparationState = {
      ...createDefaultPreparationState(),
      ...(preparationState ?? {}),
      readyPlayerIds: [...(preparationState?.readyPlayerIds ?? [])],
    };

    this.warState = {
      ...createDefaultWarState(),
      ...(warState ?? {}),
      activeAttack: warState?.activeAttack == null
        ? null
        : {
          ...warState.activeAttack,
          eligibleResponderIds: [...(warState.activeAttack.eligibleResponderIds ?? [])],
          observerPlayerIds: [...(warState.activeAttack.observerPlayerIds ?? [])],
          responses: { ...(warState.activeAttack.responses ?? {}) },
          pendingQuestionResult: warState.activeAttack.pendingQuestionResult == null
            ? null
            : { ...warState.activeAttack.pendingQuestionResult },
        },
      battleHistory: [...(warState?.battleHistory ?? [])].map(battle => ({
        ...battle,
      })),
      turnsTakenByPlayer: {
        ...createDefaultWarState().turnsTakenByPlayer,
        ...(warState?.turnsTakenByPlayer ?? {}),
      },
      boostUsedByPlayer: {
        ...createDefaultWarState().boostUsedByPlayer,
        ...(warState?.boostUsedByPlayer ?? {}),
      },
      blackMarks: [...(warState?.blackMarks ?? [])].map(mark => ({ ...mark })),
      selectedTurnBoost: warState?.selectedTurnBoost == null
        ? null
        : { ...warState.selectedTurnBoost },
      tiebreak: warState?.tiebreak == null
        ? null
        : {
          ...warState.tiebreak,
          playerIds: [...(warState.tiebreak.playerIds ?? [])],
          order: [...(warState.tiebreak.order ?? [])],
        },
    };

    this.quizState = {
      ...createDefaultQuizState(),
      ...(quizState ?? {}),
      responses: { ...(quizState?.responses ?? {}) },
      ranking: [...(quizState?.ranking ?? [])],
      lockedPlayerIds: [...(quizState?.lockedPlayerIds ?? [])],
    };

    this.resultState = {
      ...createDefaultResultState(),
      ...(resultState ?? {}),
      winnerIds: [...(resultState?.winnerIds ?? [])],
    };
  }

  get stage() {
    return this._stage;
  }

  set stage(value) {
    if (!isGameStage(value)) throw new Error(`Unknown game stage: ${value}`);
    this._stage = value;
  }

  get currentTurnOrder() {
    if (this.warState?.tiebreak?.active) {
      return [...this.warState.tiebreak.order];
    }
    return [...(this.turnOrders[this.round - 1] ?? [])];
  }

  get currentPlayerId() {
    if (this.finished) return null;
    if (this.warState?.tiebreak?.active) {
      return this.warState.tiebreak.order[this.warState.tiebreak.turnIndex] ?? null;
    }
    return this.currentTurnOrder[this.turnIndex] ?? null;
  }

  get finished() {
    return this.stage === GAME_STAGES.FINISHED;
  }

  set finished(value) {
    if (value === true) this.stage = GAME_STAGES.FINISHED;
  }
}

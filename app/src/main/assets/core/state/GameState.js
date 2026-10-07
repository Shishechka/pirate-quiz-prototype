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

function createDefaultPreparationState() {
  return {
    readyPlayerIds: [],
  };
}

function createDefaultWarState() {
  return {
    activeAttack: null,
    battleHistory: [],
    turnsTakenByPlayer: Object.fromEntries(
      PLAYER_IDS.map(playerId => [playerId, 0]),
    ),
  };
}

function createDefaultArchipelagoState() {
  return {
    ranking: [],
    claimQueue: [],
    claimIndex: 0,
    claimedThisRound: [],
    completedRounds: [],
  };
}

function createDefaultQuizState() {
  return {
    currentQuestion: null,
    questionType: null,
    context: null,
    responses: {},
    ranking: [],
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
    preparationState = null,
    warState = null,
    quizState = null,
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
    };

    this.economyState = {
      ...createDefaultEconomyState(),
      ...(economyState ?? {}),
      transactions: [...(economyState?.transactions ?? [])].map(transaction => ({
        ...transaction,
      })),
    };

    this.preparationState = {
      ...createDefaultPreparationState(),
      ...(preparationState ?? {}),
      readyPlayerIds: [...(preparationState?.readyPlayerIds ?? [])],
    };

    this.warState = {
      ...createDefaultWarState(),
      ...(warState ?? {}),
      battleHistory: [...(warState?.battleHistory ?? [])].map(battle => ({
        ...battle,
      })),
      turnsTakenByPlayer: {
        ...createDefaultWarState().turnsTakenByPlayer,
        ...(warState?.turnsTakenByPlayer ?? {}),
      },
    };

    this.quizState = {
      ...createDefaultQuizState(),
      ...(quizState ?? {}),
      responses: {
        ...createDefaultQuizState().responses,
        ...(quizState?.responses ?? {}),
      },
      ranking: [...(quizState?.ranking ?? [])],
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
    return [...(this.turnOrders[this.round - 1] ?? [])];
  }

  get currentPlayerId() {
    if (this.finished) return null;
    return this.currentTurnOrder[this.turnIndex] ?? null;
  }

  get finished() {
    return this.stage === GAME_STAGES.FINISHED;
  }

  set finished(value) {
    if (value === true) this.stage = GAME_STAGES.FINISHED;
  }
}

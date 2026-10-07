import {
  GAME_STAGES,
  isGameStage,
} from '../constants.js';

function createDefaultWarState() {
  return {
    activeAttack: null,
  };
}

function createDefaultQuizState() {
  return {
    currentQuestion: null,
    questionType: null,
    context: null,
    responses: {},
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

    this.warState = {
      ...createDefaultWarState(),
      ...(warState ?? {}),
    };

    this.quizState = {
      ...createDefaultQuizState(),
      ...(quizState ?? {}),
      responses: {
        ...createDefaultQuizState().responses,
        ...(quizState?.responses ?? {}),
      },
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

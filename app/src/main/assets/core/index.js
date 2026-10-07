import {
  GAME_STAGES,
  PLAYER_BASES,
  PLAYER_IDS,
} from './constants.js';
import { Player } from './entities/Player.js';
import { Ship } from './entities/Ship.js';
import { createPirateQuizMap } from './map/Map.js';
import { GameState } from './state/GameState.js';
import { ArchipelagoSystem } from './systems/ArchipelagoSystem.js';
import { BoostSystem } from './systems/BoostSystem.js';
import { RoundSystem } from './systems/RoundSystem.js';
import { TurnSystem } from './systems/TurnSystem.js';

export {
  ArchipelagoSystem,
  BoostSystem,
  GameState,
  Player,
  Ship,
  createPirateQuizMap,
  RoundSystem,
  TurnSystem,
};

export function createCoreGame({
  rng = Math.random,
  boostRng = rng,
  territoryOwners = {},
  turnOrders = null,
  stage = GAME_STAGES.BASE_SELECTION,
  archipelagoState = null,
  warState = null,
  quizState = null,
} = {}) {
  const map = createPirateQuizMap({ territoryOwners });

  const players = new Map();
  for (const playerId of PLAYER_IDS) {
    const baseId = PLAYER_BASES[playerId];
    players.set(playerId, new Player({
      id: playerId,
      baseId,
      ship: new Ship({ hp: 3, maxHp: 3, dmg: 1, pos: baseId, sunk: false }),
    }));
  }

  const roundSystem = new RoundSystem({ rng });
  const orders = turnOrders ?? roundSystem.createTurnOrders();

  if (!roundSystem.validateTurnOrders(orders)) {
    throw new Error('Invalid turn orders');
  }

  const state = new GameState({
    stage,
    players,
    territories: map.territories,
    bases: map.bases,
    turnOrders: orders,
    archipelagoState,
    warState,
    quizState,
  });

  const boostSystem = new BoostSystem({ rng: boostRng });
  const archipelagoSystem = new ArchipelagoSystem({ map, boostSystem });
  const turnSystem = new TurnSystem({ roundSystem });

  return {
    state,
    map,
    boostSystem,
    archipelagoSystem,
    roundSystem,
    turnSystem,
  };
}

import {
  PLAYER_BASES,
  PLAYER_IDS,
} from './constants.js';
import { Player } from './entities/Player.js';
import { Ship } from './entities/Ship.js';
import { createPirateQuizMap } from './map/Map.js';
import { GameState } from './state/GameState.js';
import { RoundSystem } from './systems/RoundSystem.js';
import { TurnSystem } from './systems/TurnSystem.js';

export {
  GameState,
  Player,
  Ship,
  createPirateQuizMap,
  RoundSystem,
  TurnSystem,
};

export function createCoreGame({
  rng = Math.random,
  territoryOwners = {},
  turnOrders = null,
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
    players,
    territories: map.territories,
    bases: map.bases,
    turnOrders: orders,
  });

  const turnSystem = new TurnSystem({ roundSystem });

  return {
    state,
    map,
    roundSystem,
    turnSystem,
  };
}

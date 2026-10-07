import {
  GAME_STAGES,
  PLAYER_IDS,
} from './constants.js';
import { Player } from './entities/Player.js';
import { Ship } from './entities/Ship.js';
import { createPirateQuizMap } from './map/Map.js';
import { GameState } from './state/GameState.js';
import { ArchipelagoSystem } from './systems/ArchipelagoSystem.js';
import { BaseSelectionSystem } from './systems/BaseSelectionSystem.js';
import { BoostSystem } from './systems/BoostSystem.js';
import { CombatSystem } from './systems/CombatSystem.js';
import { CrewSystem } from './systems/CrewSystem.js';
import { EconomySystem } from './systems/EconomySystem.js';
import { FameSystem } from './systems/FameSystem.js';
import { FlagshipSystem } from './systems/FlagshipSystem.js';
import { RoundSystem } from './systems/RoundSystem.js';
import { StageSystem } from './systems/StageSystem.js';
import { TurnSystem } from './systems/TurnSystem.js';

export {
  ArchipelagoSystem,
  BaseSelectionSystem,
  BoostSystem,
  CombatSystem,
  CrewSystem,
  EconomySystem,
  FameSystem,
  FlagshipSystem,
  GameState,
  Player,
  Ship,
  createPirateQuizMap,
  RoundSystem,
  StageSystem,
  TurnSystem,
};

export function createCoreGame({
  rng = Math.random,
  boostRng = rng,
  clock = () => 0,
  territoryOwners = {},
  baseAssignments = null,
  turnOrders = null,
  stage = GAME_STAGES.BASE_SELECTION,
  archipelagoState = null,
  economyState = null,
  fameState = null,
  economyPrices = null,
  preparationState = null,
  warState = null,
  quizState = null,
  resultState = null,
} = {}) {
  const baseSelectionSystem = new BaseSelectionSystem({ rng });
  const assignments = baseAssignments ?? baseSelectionSystem.createRandomAssignments();
  const baseOwners = baseSelectionSystem.toBaseOwners(assignments);

  const map = createPirateQuizMap({
    territoryOwners,
    baseOwners,
  });

  const players = new Map();
  for (const playerId of PLAYER_IDS) {
    const baseId = assignments[playerId];
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
    economyState,
    fameState,
    preparationState,
    warState,
    quizState,
    resultState,
  });

  const economySystem = new EconomySystem({
    prices: economyPrices ?? undefined,
  });
  const fameSystem = new FameSystem();
  const flagshipSystem = new FlagshipSystem({ economySystem });
  const boostSystem = new BoostSystem({
    rng: boostRng,
    economySystem,
    flagshipSystem,
  });
  const crewSystem = new CrewSystem({
    economySystem,
    flagshipSystem,
  });
  const stageSystem = new StageSystem({ clock });
  const combatSystem = new CombatSystem({
    map,
    economySystem,
    fameSystem,
    flagshipSystem,
  });
  const archipelagoSystem = new ArchipelagoSystem({
    map,
    boostSystem,
    stageSystem,
    rng,
  });
  const turnSystem = new TurnSystem({
    roundSystem,
    fameSystem,
  });

  return {
    state,
    map,
    baseSelectionSystem,
    boostSystem,
    crewSystem,
    economySystem,
    fameSystem,
    flagshipSystem,
    stageSystem,
    combatSystem,
    archipelagoSystem,
    roundSystem,
    turnSystem,
  };
}

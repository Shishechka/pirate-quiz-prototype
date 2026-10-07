export const PLAYER_IDS = Object.freeze(['R', 'B', 'G', 'P']);

export const PLAYER_BASES = Object.freeze({
  R: 'A',
  B: 'B',
  G: 'C',
  P: 'D',
});

export const BASE_OWNERS = Object.freeze({
  A: 'R',
  B: 'B',
  C: 'G',
  D: 'P',
});

export const BASE_IDS = Object.freeze(['A', 'B', 'C', 'D']);

export const GAME_STAGES = Object.freeze({
  BASE_SELECTION: 'BASE_SELECTION',
  ARCHIPELAGO: 'ARCHIPELAGO',
  PREPARATION: 'PREPARATION',
  WAR: 'WAR',
  FINISHED: 'FINISHED',
});

export const GAME_STAGE_SEQUENCE = Object.freeze([
  GAME_STAGES.BASE_SELECTION,
  GAME_STAGES.ARCHIPELAGO,
  GAME_STAGES.PREPARATION,
  GAME_STAGES.WAR,
  GAME_STAGES.FINISHED,
]);

export const BOOST_TYPES = Object.freeze({
  SECRET_ROUTE: 'SECRET_ROUTE',
});

export const WAR_ROUND_COUNT = 8;
export const TURNS_PER_ROUND = 4;
export const TERRITORY_COUNT = 36;

export const LEVEL_2_TERRITORIES = Object.freeze([3, 8, 9, 11, 17, 18, 19, 20, 26, 28, 33, 34]);
export const LEVEL_3_TERRITORIES = Object.freeze([10, 14, 15, 16, 21, 22, 23, 27]);

export function isGameStage(value) {
  return GAME_STAGE_SEQUENCE.includes(value);
}

export function territoryLevel(id) {
  if (LEVEL_3_TERRITORIES.includes(id)) return 3;
  if (LEVEL_2_TERRITORIES.includes(id)) return 2;
  return 1;
}

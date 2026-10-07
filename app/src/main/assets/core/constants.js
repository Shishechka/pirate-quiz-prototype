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
  EMPTY: 'EMPTY',
  SMALL_CHEST: 'SMALL_CHEST',
  REPAIR_KIT: 'REPAIR_KIT',
  TAILWIND: 'TAILWIND',
  RECON: 'RECON',
  LARGE_CHEST: 'LARGE_CHEST',
  COMPASS: 'COMPASS',
  PARROT: 'PARROT',
  POWDER_KEG: 'POWDER_KEG',
  SPARE_ANCHOR: 'SPARE_ANCHOR',
  MERCENARY: 'MERCENARY',
  SECRET_ROUTE: 'SECRET_ROUTE',
  DOUBLE_VOLLEY: 'DOUBLE_VOLLEY',
  FORT_RESTORATION: 'FORT_RESTORATION',
  BLACK_MARK: 'BLACK_MARK',
  SECOND_CHANCE: 'SECOND_CHANCE',
  SPYGLASS: 'SPYGLASS',
  TREASURE: 'TREASURE',
  CURSED_SKULL: 'CURSED_SKULL',
});

export const ISLAND_BOOST_TABLES = Object.freeze({
  1: Object.freeze([
    Object.freeze({ type: BOOST_TYPES.EMPTY, weight: 45 }),
    Object.freeze({ type: BOOST_TYPES.SMALL_CHEST, weight: 20 }),
    Object.freeze({ type: BOOST_TYPES.REPAIR_KIT, weight: 15 }),
    Object.freeze({ type: BOOST_TYPES.TAILWIND, weight: 10 }),
    Object.freeze({ type: BOOST_TYPES.RECON, weight: 10 }),
  ]),
  2: Object.freeze([
    Object.freeze({ type: BOOST_TYPES.LARGE_CHEST, weight: 20 }),
    Object.freeze({ type: BOOST_TYPES.COMPASS, weight: 20 }),
    Object.freeze({ type: BOOST_TYPES.PARROT, weight: 15 }),
    Object.freeze({ type: BOOST_TYPES.POWDER_KEG, weight: 15 }),
    Object.freeze({ type: BOOST_TYPES.SPARE_ANCHOR, weight: 10 }),
    Object.freeze({ type: BOOST_TYPES.MERCENARY, weight: 10 }),
    Object.freeze({ type: BOOST_TYPES.EMPTY, weight: 10 }),
  ]),
  3: Object.freeze([
    Object.freeze({ type: BOOST_TYPES.SECRET_ROUTE, weight: 15 }),
    Object.freeze({ type: BOOST_TYPES.DOUBLE_VOLLEY, weight: 15 }),
    Object.freeze({ type: BOOST_TYPES.FORT_RESTORATION, weight: 15 }),
    Object.freeze({ type: BOOST_TYPES.BLACK_MARK, weight: 10 }),
    Object.freeze({ type: BOOST_TYPES.SECOND_CHANCE, weight: 10 }),
    Object.freeze({ type: BOOST_TYPES.SPYGLASS, weight: 10 }),
    Object.freeze({ type: BOOST_TYPES.TREASURE, weight: 15 }),
    Object.freeze({ type: BOOST_TYPES.CURSED_SKULL, weight: 10 }),
  ]),
});

export const DUBLOON_INCOME_AMOUNTS = Object.freeze([10, 20, 30]);

export const ECONOMY_TRANSACTION_TYPES = Object.freeze({
  CREDIT: 'CREDIT',
  DEBIT: 'DEBIT',
});

export const ECONOMY_PRICE_KEYS = Object.freeze({
  SHIP_HP_UPGRADE: 'SHIP_HP_UPGRADE',
  SHIP_DAMAGE_UPGRADE: 'SHIP_DAMAGE_UPGRADE',
  CREW_SLOT: 'CREW_SLOT',
  CREW_MEMBER: 'CREW_MEMBER',
});

export const DEFAULT_ECONOMY_PRICES = Object.freeze({
  [ECONOMY_PRICE_KEYS.SHIP_HP_UPGRADE]: 20,
  [ECONOMY_PRICE_KEYS.SHIP_DAMAGE_UPGRADE]: 30,
  [ECONOMY_PRICE_KEYS.CREW_SLOT]: 30,
  [ECONOMY_PRICE_KEYS.CREW_MEMBER]: 20,
});

export const ARCHIPELAGO_ROUND_COUNT = 6;
export const ARCHIPELAGO_TERRITORY_AWARDS = Object.freeze([2, 2, 1, 1]);
export const ARCHIPELAGO_CLAIM_RANK_ORDER = Object.freeze([0, 1, 2, 3, 0, 1]);

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

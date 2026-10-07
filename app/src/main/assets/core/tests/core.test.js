import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  BoostSystem,
  CombatSystem,
  EconomySystem,
  createCoreGame,
  createPirateQuizMap,
  RoundSystem,
} from '../index.js';
import {
  ARCHIPELAGO_ROUND_COUNT,
  ARCHIPELAGO_TERRITORY_AWARDS,
  BASE_IDS,
  BOOST_TYPES,
  DEFAULT_ECONOMY_PRICES,
  DUBLOON_INCOME_AMOUNTS,
  ECONOMY_PRICE_KEYS,
  ECONOMY_TRANSACTION_TYPES,
  GAME_STAGES,
  GAME_STAGE_SEQUENCE,
  ISLAND_BOOST_TABLES,
  LEVEL_2_TERRITORIES,
  LEVEL_3_TERRITORIES,
  PLAYER_BASES,
  PLAYER_IDS,
  TERRITORY_COUNT,
  WAR_ROUND_COUNT,
} from '../constants.js';

function fixedRng() {
  const values = [0.11, 0.77, 0.33, 0.92, 0.05, 0.61, 0.49, 0.20];
  let index = 0;
  return () => values[(index++) % values.length];
}

function responsesForRanking(ranking, correctAnswer = 100) {
  return Object.fromEntries(
    ranking.map((playerId, index) => [playerId, correctAnswer + index + 1]),
  );
}

function warTurnOrders() {
  return Array.from({ length: WAR_ROUND_COUNT }, () => ['R', 'B', 'G', 'P']);
}

function createBasicWarGame({
  targetTerritoryId = 2,
  defenderId = 'B',
} = {}) {
  const territoryOwners = {};
  for (let id = 1; id <= TERRITORY_COUNT; id++) territoryOwners[id] = 'R';
  territoryOwners[targetTerritoryId] = defenderId;

  return createCoreGame({
    baseAssignments: PLAYER_BASES,
    rng: fixedRng(),
    stage: GAME_STAGES.WAR,
    territoryOwners,
    turnOrders: warTurnOrders(),
  });
}

function createBaseWarGame() {
  const territoryOwners = {};
  for (let id = 1; id <= TERRITORY_COUNT; id++) territoryOwners[id] = 'R';

  // Preserve several defender territories so base capture can prove they do not transfer.
  for (const id of [6, 12, 18]) territoryOwners[id] = 'B';

  const game = createCoreGame({
    baseAssignments: PLAYER_BASES,
    rng: fixedRng(),
    stage: GAME_STAGES.WAR,
    territoryOwners,
    turnOrders: warTurnOrders(),
  });

  // Base-layer tests isolate Fort/Harbor/Flag. A separate Rules v0.4 test
  // covers the mandatory Defending Flagship stage.
  game.state.players.get('B').ship.pos = 6;
  return game;
}

function completeArchipelagoRound(game, ranking = PLAYER_IDS) {
  const correctAnswer = 100;
  const started = game.archipelagoSystem.beginRound({
    state: game.state,
    question: { id: `archipelago-${game.state.round}` },
    correctAnswer,
    responses: responsesForRanking(ranking, correctAnswer),
  });

  assert.deepEqual(started.ranking, ranking);

  while (game.archipelagoSystem.getCurrentClaimPlayerId(game.state) != null) {
    const playerId = game.archipelagoSystem.getCurrentClaimPlayerId(game.state);
    const claimable = game.archipelagoSystem.getClaimableTerritoryIds(
      game.state,
      playerId,
    );
    assert.ok(claimable.length > 0, `player ${playerId} must have a claimable territory`);
    game.archipelagoSystem.claimTerritory({
      state: game.state,
      territoryId: claimable[0],
    });
  }

  return game.state.archipelagoState.completedRounds.at(-1);
}

test('GameState is created with the complete central game state', () => {
  const { state } = createCoreGame({
    baseAssignments: PLAYER_BASES, rng: fixedRng() });

  assert.equal(state.stage, GAME_STAGES.BASE_SELECTION);
  assert.equal(state.round, 1);
  assert.equal(state.turnIndex, 0);
  assert.equal(state.players.size, 4);
  assert.equal(state.territories.size, 36);
  assert.equal(state.bases.size, 4);
  assert.equal(state.turnOrders.length, 8);
  assert.equal(state.currentTurnOrder.length, 4);
  assert.equal(PLAYER_IDS.includes(state.currentPlayerId), true);

  for (const playerId of PLAYER_IDS) {
    const player = state.players.get(playerId);
    assert.ok(player);
    assert.equal(typeof player.coins, 'number');
    assert.equal(typeof player.flags, 'number');
    assert.ok(player.ship);
    assert.equal(typeof player.ship.hp, 'number');
    assert.equal(typeof player.ship.maxHp, 'number');
    assert.equal(typeof player.ship.dmg, 'number');
    assert.equal(player.ship.crewSlots, 1);
    assert.deepEqual(player.ship.installedCrew, []);
    assert.deepEqual(player.ship.upgrades, {
      hp: 0,
      damage: 0,
      crewSlots: 0,
    });
    assert.equal(typeof player.boosts, 'object');
    assert.equal(player.boosts[BOOST_TYPES.SECRET_ROUTE], 0);
  }

  assert.deepEqual(state.archipelagoState, {
    ranking: [],
    claimQueue: [],
    claimIndex: 0,
    claimedThisRound: [],
    completedRounds: [],
    pendingRankedResponses: [],
    pendingTieGroups: [],
  });
  assert.deepEqual(state.economyState, {
    transactions: [],
    nextTransactionId: 1,
  });
  assert.deepEqual(state.fameState, {
    events: [],
    nextEventId: 1,
  });
  assert.deepEqual(state.preparationState, {
    readyPlayerIds: [],
    startedAtMs: null,
    deadlineAtMs: null,
  });
  assert.deepEqual(state.warState, {
    activeAttack: null,
    battleHistory: [],
    turnsTakenByPlayer: {
      R: 0,
      B: 0,
      G: 0,
      P: 0,
    },
    turnActionUsed: false,
    boostUsedByPlayer: {
      R: null,
      B: null,
      G: null,
      P: null,
    },
    selectedTurnBoost: null,
    blackMarks: [],
    tiebreak: null,
  });
  assert.deepEqual(state.quizState, {
    currentQuestion: null,
    questionType: null,
    context: null,
    responses: {},
    ranking: [],
    deadlineAtMs: null,
    questionTimeLimitMs: null,
    lockedPlayerIds: [],
  });
  assert.deepEqual(state.resultState, {
    winnerIds: [],
  });
  assert.equal(state.finished, false);
});

test('GameState supports the declared basic stage states without UI dependency', () => {
  const { state } = createCoreGame({
    baseAssignments: PLAYER_BASES, rng: fixedRng() });

  for (const stage of GAME_STAGE_SEQUENCE) {
    state.stage = stage;
    assert.equal(state.stage, stage);
  }

  assert.equal(state.finished, true);
  assert.equal(state.currentPlayerId, null);
});

test('GameState rejects unknown stage values', () => {
  const { state } = createCoreGame({
    baseAssignments: PLAYER_BASES, rng: fixedRng() });

  assert.throws(
    () => {
      state.stage = 'UNKNOWN_STAGE';
    },
    /Unknown game stage/,
  );

  assert.throws(
    () => createCoreGame({
    baseAssignments: PLAYER_BASES, rng: fixedRng(), stage: 'UNKNOWN_STAGE' }),
    /Unknown game stage/,
  );
});

test('legacy finished flag remains compatible with FINISHED stage', () => {
  const { state } = createCoreGame({
    baseAssignments: PLAYER_BASES,
    rng: fixedRng(),
    stage: GAME_STAGES.WAR,
  });

  assert.equal(state.finished, false);
  state.finished = true;
  assert.equal(state.stage, GAME_STAGES.FINISHED);
  assert.equal(state.finished, true);
});

test('player boost state has one source of truth with legacy secret alias', () => {
  const { state } = createCoreGame({
    baseAssignments: PLAYER_BASES, rng: fixedRng() });
  const red = state.players.get('R');

  assert.equal(red.secret, 0);
  assert.equal(red.boosts[BOOST_TYPES.SECRET_ROUTE], 0);

  red.secret = 0;

  assert.equal(red.secret, 0);
  assert.equal(red.boosts[BOOST_TYPES.SECRET_ROUTE], 0);
});

test('core creates exactly 4 players with legacy player ids and bases', () => {
  const { state } = createCoreGame({
    baseAssignments: PLAYER_BASES, rng: fixedRng() });

  assert.equal(state.players.size, 4);
  assert.deepEqual([...state.players.keys()], PLAYER_IDS);
  assert.equal(state.players.get('R').baseId, 'A');
  assert.equal(state.players.get('B').baseId, 'B');
  assert.equal(state.players.get('G').baseId, 'C');
  assert.equal(state.players.get('P').baseId, 'D');
});

test('map contains exactly 36 territories and 4 bases', () => {
  const map = createPirateQuizMap();

  assert.equal(map.territories.size, TERRITORY_COUNT);
  assert.equal(map.bases.size, 4);
  assert.deepEqual([...map.bases.keys()], BASE_IDS);
});

test('territory levels match the current legacy implementation', () => {
  const map = createPirateQuizMap();

  for (let id = 1; id <= TERRITORY_COUNT; id++) {
    const expected = LEVEL_3_TERRITORIES.includes(id)
      ? 3
      : LEVEL_2_TERRITORIES.includes(id)
        ? 2
        : 1;
    assert.equal(map.getTerritory(id).level, expected, `territory ${id}`);
  }
});

test('map preserves normal grid adjacency and special diagonals', () => {
  const map = createPirateQuizMap();

  assert.equal(map.areAdjacent(1, 2), true);
  assert.equal(map.areAdjacent(1, 7), true);
  assert.equal(map.areAdjacent(6, 12), true);
  assert.equal(map.areAdjacent(15, 22), true);
  assert.equal(map.areAdjacent(22, 15), true);
  assert.equal(map.areAdjacent(16, 21), true);
  assert.equal(map.areAdjacent(21, 16), true);
  assert.equal(map.areAdjacent(1, 8), false);
});

test('base connections match legacy map topology', () => {
  const map = createPirateQuizMap();

  assert.deepEqual(map.getNeighbors('A').sort((a, b) => a - b), [1, 2, 7]);
  assert.deepEqual(map.getNeighbors('B').sort((a, b) => a - b), [5, 6, 12]);
  assert.deepEqual(map.getNeighbors('C').sort((a, b) => a - b), [25, 31, 32]);
  assert.deepEqual(map.getNeighbors('D').sort((a, b) => a - b), [30, 35, 36]);
});

test('ARCHIPELAGO numeric question requires all 4 responses and ranks by absolute error', () => {
  const game = createCoreGame({
    baseAssignments: PLAYER_BASES,
    rng: fixedRng(),
    stage: GAME_STAGES.ARCHIPELAGO,
  });

  const result = game.archipelagoSystem.beginRound({
    state: game.state,
    question: { id: 'numeric-1' },
    correctAnswer: 100,
    responses: {
      R: 103,
      B: 101,
      G: 104,
      P: 102,
    },
  });

  assert.deepEqual(result.ranking, ['B', 'P', 'R', 'G']);
  assert.deepEqual(result.awards, ARCHIPELAGO_TERRITORY_AWARDS);
  assert.deepEqual(result.claimQueue, ['B', 'P', 'R', 'G', 'B', 'P']);
  assert.equal(game.state.quizState.questionType, 'NUMERIC');
  assert.equal(game.state.quizState.context, GAME_STAGES.ARCHIPELAGO);
});

test('ARCHIPELAGO uses an additional numeric question for equal error and equal time', () => {
  const game = createCoreGame({
    baseAssignments: PLAYER_BASES,
    rng: fixedRng(),
    stage: GAME_STAGES.ARCHIPELAGO,
  });

  const tied = game.archipelagoSystem.beginRound({
    state: game.state,
    correctAnswer: 100,
    responses: {
      R: { value: 99, elapsedMs: 1000 },
      B: { value: 101, elapsedMs: 1000 },
      G: { value: 103, elapsedMs: 2000 },
      P: { value: 105, elapsedMs: 3000 },
    },
  });

  assert.equal(tied.requiresTieBreak, true);
  assert.deepEqual(tied.tiedPlayerIds, ['R', 'B']);

  const resolved = game.archipelagoSystem.resolveTieBreak({
    state: game.state,
    correctAnswer: 50,
    responses: {
      R: { value: 49, elapsedMs: 1000 },
      B: { value: 52, elapsedMs: 500 },
    },
  });

  assert.equal(resolved.requiresTieBreak, false);
  assert.deepEqual(resolved.ranking, ['R', 'B', 'G', 'P']);
});

test('each ARCHIPELAGO round distributes exactly 6 territories', () => {
  const game = createCoreGame({
    baseAssignments: PLAYER_BASES,
    rng: fixedRng(),
    stage: GAME_STAGES.ARCHIPELAGO,
  });

  const summary = completeArchipelagoRound(game, ['R', 'B', 'G', 'P']);

  assert.equal(summary.round, 1);
  assert.equal(summary.claims.length, 6);
  assert.equal(
    [...game.state.territories.values()].filter(territory => territory.ownerId != null).length,
    6,
  );
  assert.equal(game.state.round, 2);
});

test('ARCHIPELAGO awards territories 2/2/1/1 according to numeric ranking', () => {
  const game = createCoreGame({
    baseAssignments: PLAYER_BASES,
    rng: fixedRng(),
    stage: GAME_STAGES.ARCHIPELAGO,
  });

  const ranking = ['G', 'R', 'P', 'B'];
  const summary = completeArchipelagoRound(game, ranking);
  const counts = Object.fromEntries(PLAYER_IDS.map(playerId => [playerId, 0]));

  for (const claim of summary.claims) counts[claim.playerId] += 1;

  assert.equal(counts.G, 2);
  assert.equal(counts.R, 2);
  assert.equal(counts.P, 1);
  assert.equal(counts.B, 1);
});

test('after 6 ARCHIPELAGO rounds exactly all 36 territories are distributed', () => {
  const game = createCoreGame({
    baseAssignments: PLAYER_BASES,
    rng: fixedRng(),
    stage: GAME_STAGES.ARCHIPELAGO,
  });

  for (let round = 1; round <= ARCHIPELAGO_ROUND_COUNT; round++) {
    const summary = completeArchipelagoRound(game, ['R', 'B', 'G', 'P']);
    assert.equal(summary.claims.length, 6);
  }

  const owned = [...game.state.territories.values()]
    .filter(territory => territory.ownerId != null);

  assert.equal(game.state.archipelagoState.completedRounds.length, 6);
  assert.equal(owned.length, 36);
  assert.equal(game.state.stage, GAME_STAGES.PREPARATION);
});

test('after 6 ARCHIPELAGO rounds no neutral territories remain', () => {
  const game = createCoreGame({
    baseAssignments: PLAYER_BASES,
    rng: fixedRng(),
    stage: GAME_STAGES.ARCHIPELAGO,
  });

  for (let round = 1; round <= ARCHIPELAGO_ROUND_COUNT; round++) {
    completeArchipelagoRound(game, ['R', 'B', 'G', 'P']);
  }

  assert.deepEqual(game.archipelagoSystem.getNeutralTerritoryIds(game.state), []);
});

test('ARCHIPELAGO forbids a non-adjacent island while the player has adjacent neutral islands', () => {
  const game = createCoreGame({
    baseAssignments: PLAYER_BASES,
    rng: fixedRng(),
    stage: GAME_STAGES.ARCHIPELAGO,
  });

  game.archipelagoSystem.beginRound({
    state: game.state,
    correctAnswer: 100,
    responses: responsesForRanking(['R', 'B', 'G', 'P']),
  });

  assert.equal(game.archipelagoSystem.getCurrentClaimPlayerId(game.state), 'R');
  assert.deepEqual(
    game.archipelagoSystem.getAdjacentNeutralTerritoryIds(game.state, 'R'),
    [1, 2, 7],
  );
  assert.equal(game.archipelagoSystem.isCutOff(game.state, 'R'), false);

  assert.throws(
    () => game.archipelagoSystem.claimTerritory({
      state: game.state,
      territoryId: 36,
    }),
    /not adjacent/,
  );

  assert.equal(game.state.territories.get(36).ownerId, null);

  const claim = game.archipelagoSystem.claimTerritory({
    state: game.state,
    territoryId: 1,
  });
  assert.equal(claim.playerId, 'R');
  assert.equal(claim.territoryId, 1);
});

test('ARCHIPELAGO allows a non-adjacent neutral island only when the player is cut off', () => {
  const game = createCoreGame({
    baseAssignments: PLAYER_BASES,
    rng: fixedRng(),
    stage: GAME_STAGES.ARCHIPELAGO,
  });

  for (const id of [1, 2, 7]) {
    game.state.territories.get(id).ownerId = 'B';
  }

  game.archipelagoSystem.beginRound({
    state: game.state,
    correctAnswer: 100,
    responses: responsesForRanking(['R', 'B', 'G', 'P']),
  });

  assert.equal(game.archipelagoSystem.isCutOff(game.state, 'R'), true);
  assert.equal(game.archipelagoSystem.canClaimTerritory(game.state, 'R', 36), true);

  const claim = game.archipelagoSystem.claimTerritory({
    state: game.state,
    territoryId: 36,
  });

  assert.equal(claim.playerId, 'R');
  assert.equal(claim.territoryId, 36);
  assert.equal(claim.usedCutOffRule, true);
});

test('island boost probability tables match Rules v0.4 exactly and total 100%', () => {
  const expected = {
    1: {
      [BOOST_TYPES.EMPTY]: 55,
      [BOOST_TYPES.SMALL_CHEST]: 20,
      [BOOST_TYPES.REPAIR_KIT]: 15,
      [BOOST_TYPES.RECON]: 10,
    },
    2: {
      [BOOST_TYPES.LARGE_CHEST]: 20,
      [BOOST_TYPES.COMPASS]: 20,
      [BOOST_TYPES.PARROT]: 15,
      [BOOST_TYPES.POWDER_KEG]: 15,
      [BOOST_TYPES.SPARE_ANCHOR]: 10,
      [BOOST_TYPES.MERCENARY]: 10,
      [BOOST_TYPES.EMPTY]: 10,
    },
    3: {
      [BOOST_TYPES.SECRET_ROUTE]: 15,
      [BOOST_TYPES.DOUBLE_VOLLEY]: 15,
      [BOOST_TYPES.FORT_RESTORATION]: 15,
      [BOOST_TYPES.BLACK_MARK]: 10,
      [BOOST_TYPES.SECOND_CHANCE]: 10,
      [BOOST_TYPES.SPYGLASS]: 10,
      [BOOST_TYPES.TREASURE]: 15,
      [BOOST_TYPES.CURSED_SKULL]: 10,
    },
  };

  for (const level of [1, 2, 3]) {
    const actual = Object.fromEntries(
      ISLAND_BOOST_TABLES[level].map(entry => [entry.type, entry.weight]),
    );
    const total = ISLAND_BOOST_TABLES[level]
      .reduce((sum, entry) => sum + entry.weight, 0);

    assert.equal(total, 100);
    assert.deepEqual(actual, expected[level]);
  }
});

test('boost generator follows the configured percentages across deterministic percentile samples', () => {
  for (const level of [1, 2, 3]) {
    let sampleIndex = 0;
    const boostSystem = new BoostSystem({
      rng: () => ((sampleIndex++ % 100) + 0.5) / 100,
    });
    const counts = {};

    for (let sample = 0; sample < 100; sample++) {
      const boostType = boostSystem.generateForIslandLevel(level);
      counts[boostType] = (counts[boostType] ?? 0) + 1;
    }

    for (const entry of ISLAND_BOOST_TABLES[level]) {
      assert.equal(
        counts[entry.type] ?? 0,
        entry.weight,
        `level ${level} / ${entry.type}`,
      );
    }
  }
});

test('first neutral island capture generates a boost and stores it in player inventory', () => {
  const game = createCoreGame({
    baseAssignments: PLAYER_BASES,
    rng: fixedRng(),
    boostRng: () => 0.60,
    stage: GAME_STAGES.ARCHIPELAGO,
  });

  game.archipelagoSystem.beginRound({
    state: game.state,
    correctAnswer: 100,
    responses: responsesForRanking(['R', 'B', 'G', 'P']),
  });

  const before = game.boostSystem.getInventoryCount(
    game.state,
    'R',
    BOOST_TYPES.SMALL_CHEST,
  );

  const claim = game.archipelagoSystem.claimTerritory({
    state: game.state,
    territoryId: 1,
  });

  assert.equal(claim.playerId, 'R');
  assert.equal(claim.boostType, BOOST_TYPES.SMALL_CHEST);
  assert.equal(claim.boostGranted, true);
  assert.equal(game.state.territories.get(1).firstCaptureResolved, true);
  assert.equal(
    game.boostSystem.getInventoryCount(game.state, 'R', BOOST_TYPES.SMALL_CHEST),
    before + 1,
  );
});

test('EMPTY result still marks first capture as resolved and adds nothing to inventory', () => {
  const game = createCoreGame({
    baseAssignments: PLAYER_BASES,
    rng: fixedRng(),
    boostRng: () => 0.10,
    stage: GAME_STAGES.ARCHIPELAGO,
  });

  const territory = game.state.territories.get(1);
  const result = game.boostSystem.resolveTerritoryCapture({
    state: game.state,
    territoryId: 1,
    playerId: 'R',
    previousOwnerId: null,
  });

  assert.equal(result.generated, true);
  assert.equal(result.granted, false);
  assert.equal(result.boostType, BOOST_TYPES.EMPTY);
  assert.equal(territory.firstCaptureResolved, true);
  assert.equal(game.state.players.get('R').boosts[BOOST_TYPES.EMPTY], undefined);
});

test('boost is never generated again after island ownership changes', () => {
  let rngCalls = 0;
  const game = createCoreGame({
    baseAssignments: PLAYER_BASES,
    rng: fixedRng(),
    boostRng: () => {
      rngCalls += 1;
      return 0.60;
    },
    stage: GAME_STAGES.ARCHIPELAGO,
  });

  const territory = game.state.territories.get(1);
  const redBefore = game.boostSystem.getInventoryCount(
    game.state,
    'R',
    BOOST_TYPES.SMALL_CHEST,
  );
  const blueBefore = game.boostSystem.getInventoryCount(
    game.state,
    'B',
    BOOST_TYPES.SMALL_CHEST,
  );

  const first = game.boostSystem.resolveTerritoryCapture({
    state: game.state,
    territoryId: 1,
    playerId: 'R',
    previousOwnerId: null,
  });
  territory.ownerId = 'R';

  assert.equal(first.generated, true);
  assert.equal(rngCalls, 1);
  assert.equal(
    game.boostSystem.getInventoryCount(game.state, 'R', BOOST_TYPES.SMALL_CHEST),
    redBefore + 1,
  );

  const previousOwnerId = territory.ownerId;
  territory.ownerId = 'B';
  const second = game.boostSystem.resolveTerritoryCapture({
    state: game.state,
    territoryId: 1,
    playerId: 'B',
    previousOwnerId,
  });

  assert.equal(second.generated, false);
  assert.equal(second.granted, false);
  assert.equal(second.boostType, null);
  assert.equal(rngCalls, 1);
  assert.equal(
    game.boostSystem.getInventoryCount(game.state, 'R', BOOST_TYPES.SMALL_CHEST),
    redBefore + 1,
  );
  assert.equal(
    game.boostSystem.getInventoryCount(game.state, 'B', BOOST_TYPES.SMALL_CHEST),
    blueBefore,
  );
  assert.equal(territory.ownerId, 'B');
});

test('even an erroneous second neutral-capture notification cannot generate a second boost', () => {
  let rngCalls = 0;
  const game = createCoreGame({
    baseAssignments: PLAYER_BASES,
    rng: fixedRng(),
    boostRng: () => {
      rngCalls += 1;
      return 0.60;
    },
    stage: GAME_STAGES.ARCHIPELAGO,
  });

  game.boostSystem.resolveTerritoryCapture({
    state: game.state,
    territoryId: 1,
    playerId: 'R',
    previousOwnerId: null,
  });

  const duplicate = game.boostSystem.resolveTerritoryCapture({
    state: game.state,
    territoryId: 1,
    playerId: 'B',
    previousOwnerId: null,
  });

  assert.equal(duplicate.generated, false);
  assert.equal(rngCalls, 1);
});

test('EconomySystem exposes current player dubloon balance without duplicating it', () => {
  const game = createCoreGame({
    baseAssignments: PLAYER_BASES, rng: fixedRng() });

  assert.equal(game.economySystem.getBalance(game.state, 'R'), 20);
  assert.equal(
    game.economySystem.getBalance(game.state, 'R'),
    game.state.players.get('R').coins,
  );
});

test('EconomySystem supports +10, +20 and +30 dubloon income', () => {
  const game = createCoreGame({
    baseAssignments: PLAYER_BASES, rng: fixedRng() });
  let expectedBalance = 20;

  for (const amount of DUBLOON_INCOME_AMOUNTS) {
    const transaction = game.economySystem.credit({
      state: game.state,
      playerId: 'R',
      amount,
      reason: `TEST_REWARD_${amount}`,
    });

    expectedBalance += amount;
    assert.equal(game.economySystem.getBalance(game.state, 'R'), expectedBalance);
    assert.equal(transaction.type, ECONOMY_TRANSACTION_TYPES.CREDIT);
    assert.equal(transaction.amount, amount);
    assert.equal(transaction.balanceAfter, expectedBalance);
  }
});

test('EconomySystem spends dubloons and checks sufficient funds', () => {
  const game = createCoreGame({
    baseAssignments: PLAYER_BASES, rng: fixedRng() });

  assert.equal(game.economySystem.canAfford(game.state, 'R', 20), true);
  assert.equal(game.economySystem.canAfford(game.state, 'R', 30), false);

  const transaction = game.economySystem.spend({
    state: game.state,
    playerId: 'R',
    amount: 20,
    reason: 'TEST_SPEND',
  });

  assert.equal(transaction.type, ECONOMY_TRANSACTION_TYPES.DEBIT);
  assert.equal(transaction.balanceBefore, 20);
  assert.equal(transaction.balanceAfter, 0);
  assert.equal(game.economySystem.getBalance(game.state, 'R'), 0);
});

test('EconomySystem never changes balance when a spend cannot be afforded', () => {
  const game = createCoreGame({
    baseAssignments: PLAYER_BASES, rng: fixedRng() });
  const before = game.economySystem.getBalance(game.state, 'R');

  assert.throws(
    () => game.economySystem.spend({
      state: game.state,
      playerId: 'R',
      amount: 30,
      reason: 'TOO_EXPENSIVE',
    }),
    /Insufficient dubloons/,
  );

  assert.equal(game.economySystem.getBalance(game.state, 'R'), before);
  assert.deepEqual(game.economySystem.getHistory(game.state, 'R'), []);
});

test('default economy prices match the approved Pirate Quiz values', () => {
  assert.deepEqual(DEFAULT_ECONOMY_PRICES, {
    [ECONOMY_PRICE_KEYS.SHIP_HP_UPGRADE]: 20,
    [ECONOMY_PRICE_KEYS.SHIP_DAMAGE_UPGRADE]: 30,
    [ECONOMY_PRICE_KEYS.CREW_SLOT]: 30,
    [ECONOMY_PRICE_KEYS.CREW_MEMBER]: 20,
  });

  const game = createCoreGame({
    baseAssignments: PLAYER_BASES, rng: fixedRng() });

  assert.equal(
    game.economySystem.getPrice(ECONOMY_PRICE_KEYS.SHIP_HP_UPGRADE),
    20,
  );
  assert.equal(
    game.economySystem.getPrice(ECONOMY_PRICE_KEYS.SHIP_DAMAGE_UPGRADE),
    30,
  );
  assert.equal(
    game.economySystem.getPrice(ECONOMY_PRICE_KEYS.CREW_SLOT),
    30,
  );
  assert.equal(
    game.economySystem.getPrice(ECONOMY_PRICE_KEYS.CREW_MEMBER),
    20,
  );
});

test('economy prices are configurable without changing the default config', () => {
  const economy = new EconomySystem({
    prices: {
      [ECONOMY_PRICE_KEYS.CREW_MEMBER]: 25,
    },
  });

  assert.equal(
    economy.getPrice(ECONOMY_PRICE_KEYS.CREW_MEMBER),
    25,
  );
  assert.equal(
    economy.getPrice(ECONOMY_PRICE_KEYS.SHIP_HP_UPGRADE),
    20,
  );
  assert.equal(
    DEFAULT_ECONOMY_PRICES[ECONOMY_PRICE_KEYS.CREW_MEMBER],
    20,
  );
});

test('EconomySystem can spend a configured price without applying purchase effects', () => {
  const game = createCoreGame({
    baseAssignments: PLAYER_BASES, rng: fixedRng() });

  assert.equal(
    game.economySystem.canAffordPrice(
      game.state,
      'R',
      ECONOMY_PRICE_KEYS.SHIP_HP_UPGRADE,
    ),
    true,
  );

  const hpBefore = game.state.players.get('R').ship.maxHp;

  const transaction = game.economySystem.spendPrice({
    state: game.state,
    playerId: 'R',
    priceKey: ECONOMY_PRICE_KEYS.SHIP_HP_UPGRADE,
  });

  assert.equal(transaction.amount, 20);
  assert.equal(game.economySystem.getBalance(game.state, 'R'), 0);
  assert.equal(game.state.players.get('R').ship.maxHp, hpBefore);
});

test('EconomySystem records deterministic transaction history and reasons', () => {
  const game = createCoreGame({
    baseAssignments: PLAYER_BASES, rng: fixedRng() });

  game.economySystem.credit({
    state: game.state,
    playerId: 'R',
    amount: 10,
    reason: 'TERRITORY_CAPTURE',
  });
  game.economySystem.spend({
    state: game.state,
    playerId: 'R',
    amount: 20,
    reason: 'SHIP_HP_UPGRADE',
  });

  const history = game.economySystem.getHistory(game.state, 'R');

  assert.deepEqual(history, [
    {
      transactionId: 1,
      playerId: 'R',
      type: ECONOMY_TRANSACTION_TYPES.CREDIT,
      amount: 10,
      reason: 'TERRITORY_CAPTURE',
      balanceBefore: 20,
      balanceAfter: 30,
    },
    {
      transactionId: 2,
      playerId: 'R',
      type: ECONOMY_TRANSACTION_TYPES.DEBIT,
      amount: 20,
      reason: 'SHIP_HP_UPGRADE',
      balanceBefore: 30,
      balanceAfter: 10,
    },
  ]);
  assert.equal(game.state.economyState.nextTransactionId, 3);
});

test('flagship starts with Rules v0.4 base characteristics', () => {
  const game = createCoreGame({
    baseAssignments: PLAYER_BASES, rng: fixedRng() });
  const ship = game.flagshipSystem.getFlagship(game.state, 'R');

  assert.equal(ship.hp, 3);
  assert.equal(ship.maxHp, 3);
  assert.equal(ship.dmg, 1);
  assert.equal(ship.crewSlots, 1);
  assert.deepEqual(ship.installedCrew, []);
  assert.deepEqual(ship.upgrades, {
    hp: 0,
    damage: 0,
    crewSlots: 0,
  });
});

test('buying +1 HP costs 20 dubloons and increases current and maximum HP', () => {
  const game = createCoreGame({
    baseAssignments: PLAYER_BASES,
    rng: fixedRng(),
    stage: GAME_STAGES.PREPARATION,
  });

  assert.equal(game.flagshipSystem.canPurchaseHpUpgrade(game.state, 'R'), true);

  const result = game.flagshipSystem.purchaseHpUpgrade({
    state: game.state,
    playerId: 'R',
  });

  const ship = game.flagshipSystem.getFlagship(game.state, 'R');
  assert.equal(result.transaction.amount, 20);
  assert.equal(result.transaction.reason, 'FLAGSHIP_HP_UPGRADE');
  assert.equal(game.economySystem.getBalance(game.state, 'R'), 0);
  assert.equal(ship.hp, 4);
  assert.equal(ship.maxHp, 4);
  assert.equal(ship.upgrades.hp, 1);
});

test('buying +1 Damage costs 30 dubloons and increases damage by one', () => {
  const game = createCoreGame({
    baseAssignments: PLAYER_BASES,
    rng: fixedRng(),
    stage: GAME_STAGES.PREPARATION,
  });

  game.economySystem.credit({
    state: game.state,
    playerId: 'R',
    amount: 10,
    reason: 'TEST_FUNDS',
  });

  const result = game.flagshipSystem.purchaseDamageUpgrade({
    state: game.state,
    playerId: 'R',
  });

  const ship = game.flagshipSystem.getFlagship(game.state, 'R');
  assert.equal(result.transaction.amount, 30);
  assert.equal(result.transaction.reason, 'FLAGSHIP_DAMAGE_UPGRADE');
  assert.equal(game.economySystem.getBalance(game.state, 'R'), 0);
  assert.equal(ship.dmg, 2);
  assert.equal(ship.upgrades.damage, 1);
});

test('buying +1 Crew Slot costs 30 dubloons and increases capacity by one', () => {
  const game = createCoreGame({
    baseAssignments: PLAYER_BASES,
    rng: fixedRng(),
    stage: GAME_STAGES.PREPARATION,
  });

  game.economySystem.credit({
    state: game.state,
    playerId: 'R',
    amount: 10,
    reason: 'TEST_FUNDS',
  });

  const result = game.flagshipSystem.purchaseCrewSlotUpgrade({
    state: game.state,
    playerId: 'R',
  });

  const ship = game.flagshipSystem.getFlagship(game.state, 'R');
  assert.equal(result.transaction.amount, 30);
  assert.equal(result.transaction.reason, 'FLAGSHIP_CREW_SLOT_UPGRADE');
  assert.equal(game.economySystem.getBalance(game.state, 'R'), 0);
  assert.equal(ship.crewSlots, 2);
  assert.equal(ship.upgrades.crewSlots, 1);
});

test('flagship upgrades cannot spend more dubloons than the player has', () => {
  const game = createCoreGame({
    baseAssignments: PLAYER_BASES,
    rng: fixedRng(),
    stage: GAME_STAGES.PREPARATION,
  });
  const ship = game.flagshipSystem.getFlagship(game.state, 'R');
  const before = {
    balance: game.economySystem.getBalance(game.state, 'R'),
    damage: ship.dmg,
    upgrades: ship.upgrades.damage,
    historyLength: game.economySystem.getHistory(game.state, 'R').length,
  };

  assert.equal(game.flagshipSystem.canPurchaseDamageUpgrade(game.state, 'R'), false);

  assert.throws(
    () => game.flagshipSystem.purchaseDamageUpgrade({
      state: game.state,
      playerId: 'R',
    }),
    /Insufficient dubloons/,
  );

  assert.equal(game.economySystem.getBalance(game.state, 'R'), before.balance);
  assert.equal(ship.dmg, before.damage);
  assert.equal(ship.upgrades.damage, before.upgrades);
  assert.equal(
    game.economySystem.getHistory(game.state, 'R').length,
    before.historyLength,
  );
});

test('flagship stores installed crew and enforces available crew slots only', () => {
  const game = createCoreGame({
    baseAssignments: PLAYER_BASES, rng: fixedRng() });

  assert.equal(game.flagshipSystem.canInstallCrew(game.state, 'R'), true);

  game.flagshipSystem.installCrew({
    state: game.state,
    playerId: 'R',
    crewMember: { id: 'crew-1' },
  });

  assert.deepEqual(
    game.flagshipSystem.getInstalledCrew(game.state, 'R'),
    [{ id: 'crew-1' }],
  );
  assert.equal(game.flagshipSystem.canInstallCrew(game.state, 'R'), false);

  assert.throws(
    () => game.flagshipSystem.installCrew({
      state: game.state,
      playerId: 'R',
      crewMember: { id: 'crew-2' },
    }),
    /No free crew slot/,
  );
});

test('destroyed flagship cannot receive upgrades', () => {
  const game = createCoreGame({
    baseAssignments: PLAYER_BASES,
    rng: fixedRng(),
    stage: GAME_STAGES.PREPARATION,
  });
  const ship = game.flagshipSystem.getFlagship(game.state, 'R');

  ship.hp = 0;
  ship.sunk = true;
  ship.pos = 'A';

  assert.throws(
    () => game.flagshipSystem.purchaseHpUpgrade({
      state: game.state,
      playerId: 'R',
    }),
    /Destroyed flagship cannot receive upgrades/,
  );

  assert.equal(ship.hp, 0);
  assert.equal(ship.maxHp, 3);
});

test('Stage 2 completion transitions to PREPARATION only after all 36 islands are owned', () => {
  const game = createCoreGame({
    baseAssignments: PLAYER_BASES,
    rng: fixedRng(),
    stage: GAME_STAGES.ARCHIPELAGO,
  });

  for (let round = 1; round <= ARCHIPELAGO_ROUND_COUNT; round++) {
    completeArchipelagoRound(game, ['R', 'B', 'G', 'P']);
  }

  assert.equal(game.state.stage, GAME_STAGES.PREPARATION);
  assert.equal(
    [...game.state.territories.values()].filter(territory => territory.ownerId == null).length,
    0,
  );
  assert.deepEqual(game.state.preparationState.readyPlayerIds, []);
});

test('PREPARATION allows spending accumulated dubloons before WAR starts', () => {
  const territoryOwners = {};
  for (let id = 1; id <= TERRITORY_COUNT; id++) territoryOwners[id] = 'R';

  const game = createCoreGame({
    baseAssignments: PLAYER_BASES,
    rng: fixedRng(),
    stage: GAME_STAGES.PREPARATION,
    territoryOwners,
    turnOrders: warTurnOrders(),
  });

  const balanceBefore = game.economySystem.getBalance(game.state, 'R');

  game.flagshipSystem.purchaseHpUpgrade({
    state: game.state,
    playerId: 'R',
  });

  assert.equal(game.state.stage, GAME_STAGES.PREPARATION);
  assert.equal(
    game.economySystem.getBalance(game.state, 'R'),
    balanceBefore - 20,
  );
});

test('PREPARATION transitions to WAR when all 4 players are ready', () => {
  const territoryOwners = {};
  for (let id = 1; id <= TERRITORY_COUNT; id++) territoryOwners[id] = 'R';

  const game = createCoreGame({
    baseAssignments: PLAYER_BASES,
    rng: fixedRng(),
    stage: GAME_STAGES.PREPARATION,
    territoryOwners,
    turnOrders: warTurnOrders(),
  });

  game.stageSystem.markPlayerReady(game.state, 'R');
  game.stageSystem.markPlayerReady(game.state, 'B');
  game.stageSystem.markPlayerReady(game.state, 'G');

  assert.equal(game.state.stage, GAME_STAGES.PREPARATION);

  game.stageSystem.markPlayerReady(game.state, 'P');

  assert.equal(game.state.stage, GAME_STAGES.WAR);
  assert.equal(game.state.round, 1);
  assert.equal(game.state.turnIndex, 0);
  assert.deepEqual(game.state.warState.turnsTakenByPlayer, {
    R: 0,
    B: 0,
    G: 0,
    P: 0,
  });
});

test('WAR cannot start while any neutral territory remains', () => {
  const territoryOwners = {};
  for (let id = 1; id < TERRITORY_COUNT; id++) territoryOwners[id] = 'R';

  const game = createCoreGame({
    baseAssignments: PLAYER_BASES,
    rng: fixedRng(),
    stage: GAME_STAGES.PREPARATION,
    territoryOwners,
    turnOrders: warTurnOrders(),
    preparationState: {
      readyPlayerIds: ['R', 'B', 'G', 'P'],
    },
  });

  assert.throws(
    () => game.stageSystem.startWar(game.state),
    /neutral territories remain/,
  );
  assert.equal(game.state.stage, GAME_STAGES.PREPARATION);
});

test('WAR gives exactly 8 completed turns to every player', () => {
  const territoryOwners = {};
  for (let id = 1; id <= TERRITORY_COUNT; id++) territoryOwners[id] = 'R';

  const game = createCoreGame({
    baseAssignments: PLAYER_BASES,
    rng: fixedRng(),
    stage: GAME_STAGES.WAR,
    territoryOwners,
    turnOrders: warTurnOrders(),
  });

  while (!game.state.finished) {
    game.turnSystem.advance(game.state);
  }

  assert.deepEqual(game.state.warState.turnsTakenByPlayer, {
    R: 8,
    B: 8,
    G: 8,
    P: 8,
  });
  assert.equal(game.state.stage, GAME_STAGES.FINISHED);
});

test('capturing or destroying a base does not automatically finish WAR', () => {
  const game = createBasicWarGame();

  const base = game.state.bases.get('A');
  base.remainingLayers = 0;
  base.capturedBy = 'B';

  assert.equal(game.state.stage, GAME_STAGES.WAR);
  assert.equal(game.state.finished, false);
});

test('WAR attack rejects own, neutral and disconnected territories', () => {
  const game = createBasicWarGame();

  assert.equal(game.combatSystem.canAttackTerritory(game.state, 'R', 1), false);

  game.state.territories.get(2).ownerId = null;
  assert.equal(game.combatSystem.canAttackTerritory(game.state, 'R', 2), false);

  game.state.territories.get(2).ownerId = 'B';
  game.state.territories.get(30).ownerId = 'B';
  game.state.territories.get(35).ownerId = 'B';
  game.state.territories.get(36).ownerId = 'B';

  assert.equal(game.combatSystem.canAttackTerritory(game.state, 'R', 36), false);
});

test('combat outcome: attacker correct and defender wrong gives territory to attacker', () => {
  const game = createBasicWarGame();

  const result = game.combatSystem.resolveTerritoryBattle({
    state: game.state,
    attackerId: 'R',
    targetTerritoryId: 2,
    attackerCorrect: true,
    defenderCorrect: false,
  });

  assert.equal(result.winnerId, 'R');
  assert.equal(result.result, 'ATTACKER_CORRECT_DEFENDER_WRONG');
  assert.equal(game.state.territories.get(2).ownerId, 'R');
});

test('combat outcome: attacker wrong and defender correct keeps territory with defender', () => {
  const game = createBasicWarGame();

  const result = game.combatSystem.resolveTerritoryBattle({
    state: game.state,
    attackerId: 'R',
    targetTerritoryId: 2,
    attackerCorrect: false,
    defenderCorrect: true,
  });

  assert.equal(result.winnerId, 'B');
  assert.equal(result.result, 'ATTACKER_WRONG_DEFENDER_CORRECT');
  assert.equal(game.state.territories.get(2).ownerId, 'B');
});

test('combat outcome: both wrong gives victory to defender', () => {
  const game = createBasicWarGame();

  const result = game.combatSystem.resolveTerritoryBattle({
    state: game.state,
    attackerId: 'R',
    targetTerritoryId: 2,
    attackerCorrect: false,
    defenderCorrect: false,
  });

  assert.equal(result.winnerId, 'B');
  assert.equal(result.result, 'BOTH_WRONG_DEFENDER_WINS');
  assert.equal(game.state.territories.get(2).ownerId, 'B');
});

test('combat outcome: both correct and attacker closer in numeric duel gives territory to attacker', () => {
  const game = createBasicWarGame();

  const result = game.combatSystem.resolveTerritoryBattle({
    state: game.state,
    attackerId: 'R',
    targetTerritoryId: 2,
    attackerCorrect: true,
    defenderCorrect: true,
    numericDuel: {
      correctAnswer: 100,
      attackerAnswer: 101,
      defenderAnswer: 104,
    },
  });

  assert.equal(result.winnerId, 'R');
  assert.equal(result.result, 'BOTH_CORRECT_NUMERIC_ATTACKER_WINS');
  assert.equal(game.state.territories.get(2).ownerId, 'R');
});

test('combat outcome: both correct and defender closer in numeric duel keeps territory with defender', () => {
  const game = createBasicWarGame();

  const result = game.combatSystem.resolveTerritoryBattle({
    state: game.state,
    attackerId: 'R',
    targetTerritoryId: 2,
    attackerCorrect: true,
    defenderCorrect: true,
    numericDuel: {
      correctAnswer: 100,
      attackerAnswer: 105,
      defenderAnswer: 101,
    },
  });

  assert.equal(result.winnerId, 'B');
  assert.equal(result.result, 'BOTH_CORRECT_NUMERIC_DEFENDER_WINS');
  assert.equal(game.state.territories.get(2).ownerId, 'B');
});

test('equal numeric duel error and time gives advantage to defender', () => {
  const game = createBasicWarGame();

  const result = game.combatSystem.resolveTerritoryBattle({
    state: game.state,
    attackerId: 'R',
    targetTerritoryId: 2,
    attackerCorrect: true,
    defenderCorrect: true,
    numericDuel: {
      correctAnswer: 100,
      attackerAnswer: 99,
      defenderAnswer: 101,
      attackerElapsedMs: 1000,
      defenderElapsedMs: 1000,
    },
  });

  assert.equal(result.winnerId, 'B');
  assert.equal(game.state.territories.get(2).ownerId, 'B');
  assert.equal(game.state.warState.battleHistory.length, 1);
});

test('base starts with Fort, Harbor and Captain Flag active', () => {
  const game = createBaseWarGame();
  const base = game.state.bases.get('B');

  assert.deepEqual(base.layers, {
    fort: 'ACTIVE',
    harbor: 'ACTIVE',
    flag: 'ACTIVE',
  });
  assert.equal(base.currentLayer, 'fort');
  assert.equal(base.remainingLayers, 3);
  assert.equal(base.isCaptured, false);
});

test('base assault destroys Fort first', () => {
  const game = createBaseWarGame();
  const base = game.state.bases.get('B');

  const result = game.combatSystem.resolveBaseBattle({
    state: game.state,
    attackerId: 'R',
    targetBaseId: 'B',
    attackerCorrect: true,
    defenderCorrect: false,
  });

  assert.equal(result.targetLayer, 'fort');
  assert.equal(result.destroyedLayer, 'fort');
  assert.equal(result.primaryQuestionType, 'MULTIPLE_CHOICE_4');
  assert.equal(result.numericDuelUsed, false);
  assert.deepEqual(base.layers, {
    fort: 'DESTROYED',
    harbor: 'ACTIVE',
    flag: 'ACTIVE',
  });
  assert.equal(base.currentLayer, 'harbor');
  assert.equal(base.remainingLayers, 2);
  assert.equal(base.capturedBy, null);
});

test('base assault destroys Harbor only after Fort is destroyed', () => {
  const game = createBaseWarGame();
  const base = game.state.bases.get('B');

  game.combatSystem.resolveBaseBattle({
    state: game.state,
    attackerId: 'R',
    targetBaseId: 'B',
    attackerCorrect: true,
    defenderCorrect: false,
  });

  const result = game.combatSystem.resolveBaseBattle({
    state: game.state,
    attackerId: 'R',
    targetBaseId: 'B',
    attackerCorrect: true,
    defenderCorrect: false,
  });

  assert.equal(result.targetLayer, 'harbor');
  assert.equal(result.destroyedLayer, 'harbor');
  assert.deepEqual(base.layers, {
    fort: 'DESTROYED',
    harbor: 'DESTROYED',
    flag: 'ACTIVE',
  });
  assert.equal(base.currentLayer, 'flag');
  assert.equal(base.remainingLayers, 1);
});

test('destroying Captain Flag fully captures the base without ending WAR', () => {
  const game = createBaseWarGame();
  const base = game.state.bases.get('B');

  for (let level = 0; level < 2; level++) {
    game.combatSystem.resolveBaseBattle({
      state: game.state,
      attackerId: 'R',
      targetBaseId: 'B',
      attackerCorrect: true,
      defenderCorrect: false,
    });
  }

  const result = game.combatSystem.resolveBaseBattle({
    state: game.state,
    attackerId: 'R',
    targetBaseId: 'B',
    attackerCorrect: true,
    defenderCorrect: false,
  });

  assert.equal(result.targetLayer, 'flag');
  assert.equal(result.destroyedLayer, 'flag');
  assert.equal(result.baseCaptured, true);
  assert.deepEqual(base.layers, {
    fort: 'DESTROYED',
    harbor: 'DESTROYED',
    flag: 'DESTROYED',
  });
  assert.equal(base.remainingLayers, 0);
  assert.equal(base.currentLayer, null);
  assert.equal(base.capturedBy, 'R');
  assert.equal(game.state.stage, GAME_STAGES.WAR);
  assert.equal(game.state.finished, false);
});

test('base damage persists when defender wins a later level', () => {
  const game = createBaseWarGame();
  const base = game.state.bases.get('B');

  game.combatSystem.resolveBaseBattle({
    state: game.state,
    attackerId: 'R',
    targetBaseId: 'B',
    attackerCorrect: true,
    defenderCorrect: false,
  });

  const defense = game.combatSystem.resolveBaseBattle({
    state: game.state,
    attackerId: 'R',
    targetBaseId: 'B',
    attackerCorrect: false,
    defenderCorrect: true,
  });

  assert.equal(defense.targetLayer, 'harbor');
  assert.equal(defense.destroyedLayer, null);
  assert.equal(defense.winnerId, 'B');
  assert.deepEqual(base.layers, {
    fort: 'DESTROYED',
    harbor: 'ACTIVE',
    flag: 'ACTIVE',
  });
  assert.equal(base.currentLayer, 'harbor');
  assert.equal(base.remainingLayers, 2);
});

test('repeated base assault resumes from the first surviving level', () => {
  const game = createBaseWarGame();
  const base = game.state.bases.get('B');

  game.combatSystem.resolveBaseBattle({
    state: game.state,
    attackerId: 'R',
    targetBaseId: 'B',
    attackerCorrect: true,
    defenderCorrect: false,
  });

  game.combatSystem.resolveBaseBattle({
    state: game.state,
    attackerId: 'R',
    targetBaseId: 'B',
    attackerCorrect: false,
    defenderCorrect: false,
  });

  // Defender victory ends the current assault. Resume only on R's next turn.
  for (let step = 0; step < 4; step++) {
    game.turnSystem.advance(game.state);
  }

  const repeatedAssault = game.combatSystem.resolveBaseBattle({
    state: game.state,
    attackerId: 'R',
    targetBaseId: 'B',
    attackerCorrect: true,
    defenderCorrect: false,
  });

  assert.equal(repeatedAssault.targetLayer, 'harbor');
  assert.equal(repeatedAssault.destroyedLayer, 'harbor');
  assert.equal(base.currentLayer, 'flag');
});

test('base assault uses numeric duel when both players answer the 4-option question correctly', () => {
  const game = createBaseWarGame();

  const result = game.combatSystem.resolveBaseBattle({
    state: game.state,
    attackerId: 'R',
    targetBaseId: 'B',
    attackerCorrect: true,
    defenderCorrect: true,
    numericDuel: {
      correctAnswer: 100,
      attackerAnswer: 101,
      defenderAnswer: 104,
    },
  });

  assert.equal(result.targetLayer, 'fort');
  assert.equal(result.destroyedLayer, 'fort');
  assert.equal(result.numericDuelUsed, true);
  assert.equal(result.result, 'BOTH_CORRECT_NUMERIC_ATTACKER_WINS');
});

test('capturing a base keeps defender in game and preserves all defender territories', () => {
  const game = createBaseWarGame();
  const defenderTerritoriesBefore = [...game.state.territories.values()]
    .filter(territory => territory.ownerId === 'B')
    .map(territory => territory.id)
    .sort((a, b) => a - b);

  for (let level = 0; level < 3; level++) {
    game.combatSystem.resolveBaseBattle({
      state: game.state,
      attackerId: 'R',
      targetBaseId: 'B',
      attackerCorrect: true,
      defenderCorrect: false,
    });
  }

  const defenderTerritoriesAfter = [...game.state.territories.values()]
    .filter(territory => territory.ownerId === 'B')
    .map(territory => territory.id)
    .sort((a, b) => a - b);

  assert.equal(game.state.players.has('B'), true);
  assert.deepEqual(defenderTerritoriesAfter, defenderTerritoriesBefore);
  assert.equal(game.state.bases.get('B').ownerId, 'R');
  assert.equal(game.state.bases.get('B').capturedBy, 'R');
  assert.equal(game.state.bases.get('B').isActiveBase, false);
  assert.equal(game.state.finished, false);
});

test('captured base cannot be assaulted again as an active base', () => {
  const game = createBaseWarGame();

  for (let level = 0; level < 3; level++) {
    game.combatSystem.resolveBaseBattle({
      state: game.state,
      attackerId: 'R',
      targetBaseId: 'B',
      attackerCorrect: true,
      defenderCorrect: false,
    });
  }

  for (let step = 0; step < 4; step++) {
    game.turnSystem.advance(game.state);
  }

  assert.equal(game.combatSystem.canAttackBase(game.state, 'R', 'B'), false);
  assert.throws(
    () => game.combatSystem.resolveBaseBattle({
      state: game.state,
      attackerId: 'R',
      targetBaseId: 'B',
      attackerCorrect: true,
      defenderCorrect: false,
    }),
    /Base attack is not legal/,
  );
});

test('RoundSystem creates 8 rounds and every round contains each player exactly once', () => {
  const rounds = new RoundSystem({ rng: fixedRng() });
  const orders = rounds.createTurnOrders();

  assert.equal(orders.length, WAR_ROUND_COUNT);
  assert.equal(rounds.validateTurnOrders(orders), true);

  const expected = [...PLAYER_IDS].sort();
  for (const order of orders) {
    assert.equal(order.length, 4);
    assert.deepEqual([...order].sort(), expected);
  }
});

test('TurnSystem walks exactly 32 normal player turns before finishing with a unique Fame leader', () => {
  const territoryOwners = Object.fromEntries(
    Array.from({ length: TERRITORY_COUNT }, (_, index) => [index + 1, 'R']),
  );
  const { state, turnSystem } = createCoreGame({
    baseAssignments: PLAYER_BASES,
    rng: fixedRng(),
    stage: GAME_STAGES.WAR,
    territoryOwners,
  });
  const visited = [];

  while (!state.finished) {
    visited.push({
      round: state.round,
      turnIndex: state.turnIndex,
      playerId: turnSystem.getCurrentPlayerId(state),
    });
    turnSystem.advance(state);
  }

  assert.equal(visited.length, 32);
  assert.equal(visited[0].round, 1);
  assert.equal(visited[0].turnIndex, 0);
  assert.equal(visited[31].round, 8);
  assert.equal(visited[31].turnIndex, 3);
  assert.equal(state.stage, GAME_STAGES.FINISHED);
  assert.equal(turnSystem.getCurrentPlayerId(state), null);
});

test('core modules have no direct browser UI dependency', () => {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const coreRoot = path.resolve(here, '..');

  const sourceFiles = [
    'constants.js',
    'index.js',
    'state/GameState.js',
    'entities/Player.js',
    'entities/Territory.js',
    'entities/Base.js',
    'entities/Ship.js',
    'map/Map.js',
    'systems/ArchipelagoSystem.js',
    'systems/BaseSelectionSystem.js',
    'systems/BoostSystem.js',
    'systems/CombatSystem.js',
    'systems/CrewSystem.js',
    'systems/EconomySystem.js',
    'systems/FameSystem.js',
    'systems/FlagshipSystem.js',
    'systems/RoundSystem.js',
    'systems/StageSystem.js',
    'systems/TurnSystem.js',
  ];

  for (const relative of sourceFiles) {
    const source = fs.readFileSync(path.join(coreRoot, relative), 'utf8');
    assert.equal(/\bdocument\b|\bwindow\b|getElementById|querySelector/.test(source), false, relative);
  }
});

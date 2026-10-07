import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  BoostSystem,
  createCoreGame,
  createPirateQuizMap,
  RoundSystem,
} from '../index.js';
import {
  ARCHIPELAGO_ROUND_COUNT,
  ARCHIPELAGO_TERRITORY_AWARDS,
  BASE_IDS,
  BOOST_TYPES,
  GAME_STAGES,
  GAME_STAGE_SEQUENCE,
  ISLAND_BOOST_TABLES,
  LEVEL_2_TERRITORIES,
  LEVEL_3_TERRITORIES,
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
  const { state } = createCoreGame({ rng: fixedRng() });

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
    assert.equal(typeof player.boosts, 'object');
    assert.equal(player.boosts[BOOST_TYPES.SECRET_ROUTE], 1);
  }

  assert.deepEqual(state.archipelagoState, {
    ranking: [],
    claimQueue: [],
    claimIndex: 0,
    claimedThisRound: [],
    completedRounds: [],
  });
  assert.deepEqual(state.warState, { activeAttack: null });
  assert.deepEqual(state.quizState, {
    currentQuestion: null,
    questionType: null,
    context: null,
    responses: {},
    ranking: [],
  });
  assert.equal(state.finished, false);
});

test('GameState supports the declared basic stage states without UI dependency', () => {
  const { state } = createCoreGame({ rng: fixedRng() });

  for (const stage of GAME_STAGE_SEQUENCE) {
    state.stage = stage;
    assert.equal(state.stage, stage);
  }

  assert.equal(state.finished, true);
  assert.equal(state.currentPlayerId, null);
});

test('GameState rejects unknown stage values', () => {
  const { state } = createCoreGame({ rng: fixedRng() });

  assert.throws(
    () => {
      state.stage = 'UNKNOWN_STAGE';
    },
    /Unknown game stage/,
  );

  assert.throws(
    () => createCoreGame({ rng: fixedRng(), stage: 'UNKNOWN_STAGE' }),
    /Unknown game stage/,
  );
});

test('legacy finished flag remains compatible with FINISHED stage', () => {
  const { state } = createCoreGame({
    rng: fixedRng(),
    stage: GAME_STAGES.WAR,
  });

  assert.equal(state.finished, false);
  state.finished = true;
  assert.equal(state.stage, GAME_STAGES.FINISHED);
  assert.equal(state.finished, true);
});

test('player boost state has one source of truth with legacy secret alias', () => {
  const { state } = createCoreGame({ rng: fixedRng() });
  const red = state.players.get('R');

  assert.equal(red.secret, 1);
  assert.equal(red.boosts[BOOST_TYPES.SECRET_ROUTE], 1);

  red.secret = 0;

  assert.equal(red.secret, 0);
  assert.equal(red.boosts[BOOST_TYPES.SECRET_ROUTE], 0);
});

test('core creates exactly 4 players with legacy player ids and bases', () => {
  const { state } = createCoreGame({ rng: fixedRng() });

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

test('ARCHIPELAGO does not invent a tie-break rule for equal numeric errors', () => {
  const game = createCoreGame({
    rng: fixedRng(),
    stage: GAME_STAGES.ARCHIPELAGO,
  });

  assert.throws(
    () => game.archipelagoSystem.beginRound({
      state: game.state,
      correctAnswer: 100,
      responses: {
        R: 99,
        B: 101,
        G: 103,
        P: 105,
      },
    }),
    /tie is unresolved/,
  );
});

test('each ARCHIPELAGO round distributes exactly 6 territories', () => {
  const game = createCoreGame({
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

test('island boost probability tables match Rules v0.3 exactly and total 100%', () => {
  const expected = {
    1: {
      [BOOST_TYPES.EMPTY]: 45,
      [BOOST_TYPES.SMALL_CHEST]: 20,
      [BOOST_TYPES.REPAIR_KIT]: 15,
      [BOOST_TYPES.TAILWIND]: 10,
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
    rng: fixedRng(),
    boostRng: () => 0.50,
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
    rng: fixedRng(),
    boostRng: () => {
      rngCalls += 1;
      return 0.50;
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
    rng: fixedRng(),
    boostRng: () => {
      rngCalls += 1;
      return 0.50;
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

test('TurnSystem walks exactly 32 player turns before finishing', () => {
  const { state, turnSystem } = createCoreGame({
    rng: fixedRng(),
    stage: GAME_STAGES.WAR,
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
    'systems/BoostSystem.js',
    'systems/RoundSystem.js',
    'systems/TurnSystem.js',
  ];

  for (const relative of sourceFiles) {
    const source = fs.readFileSync(path.join(coreRoot, relative), 'utf8');
    assert.equal(/\bdocument\b|\bwindow\b|getElementById|querySelector/.test(source), false, relative);
  }
});

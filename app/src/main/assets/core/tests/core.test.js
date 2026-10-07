import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  createCoreGame,
  createPirateQuizMap,
  RoundSystem,
} from '../index.js';
import {
  BASE_IDS,
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
  const { state, turnSystem } = createCoreGame({ rng: fixedRng() });
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
    'systems/RoundSystem.js',
    'systems/TurnSystem.js',
  ];

  for (const relative of sourceFiles) {
    const source = fs.readFileSync(path.join(coreRoot, relative), 'utf8');
    assert.equal(/\bdocument\b|\bwindow\b|getElementById|querySelector/.test(source), false, relative);
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createCoreGame,
} from '../index.js';
import {
  ARCHIPELAGO_QUESTION_TIME_LIMIT_MS,
  BOOST_TYPES,
  CORE_VERSION,
  CREW_TYPES,
  FAME_REWARDS,
  FLAGSHIP_MAX_DAMAGE,
  FLAGSHIP_MAX_HP,
  GAME_STAGES,
  PLAYER_BASES,
  PLAYER_IDS,
  PREPARATION_TIME_LIMIT_MS,
  RULES_VERSION,
  TERRITORY_COUNT,
  WAR_ROUND_COUNT,
} from '../constants.js';

function sequenceRng(values = [0.1, 0.7, 0.3, 0.9, 0.2, 0.6]) {
  let index = 0;
  return () => values[(index++) % values.length];
}

function warTurnOrders() {
  return Array.from(
    { length: WAR_ROUND_COUNT },
    () => ['R', 'B', 'G', 'P'],
  );
}

function allOwnedBy(ownerId = 'R') {
  return Object.fromEntries(
    Array.from({ length: TERRITORY_COUNT }, (_, index) => [index + 1, ownerId]),
  );
}

function createWarGame({
  owners = allOwnedBy('R'),
  rng = sequenceRng(),
} = {}) {
  return createCoreGame({
    rng,
    baseAssignments: PLAYER_BASES,
    stage: GAME_STAGES.WAR,
    territoryOwners: owners,
    turnOrders: warTurnOrders(),
  });
}

test('Core identifies itself as v0.2 implementing Rules v0.4', () => {
  assert.equal(CORE_VERSION, '0.2.0');
  assert.equal(RULES_VERSION, '0.4');
});

test('Rules v0.4 starts without a free Secret Route boost', () => {
  const game = createCoreGame({
    rng: sequenceRng(),
    baseAssignments: PLAYER_BASES,
  });

  for (const playerId of PLAYER_IDS) {
    assert.equal(
      game.boostSystem.getInventoryCount(
        game.state,
        playerId,
        BOOST_TYPES.SECRET_ROUTE,
      ),
      0,
    );
  }
});

test('base assignment can break the legacy fixed color-to-base mapping', () => {
  const game = createCoreGame({
    rng: () => 0,
  });

  const assignedBases = PLAYER_IDS.map(
    playerId => game.state.players.get(playerId).baseId,
  );

  assert.equal(new Set(assignedBases).size, 4);
  assert.notDeepEqual(assignedBases, PLAYER_IDS.map(id => PLAYER_BASES[id]));
});

test('Stage 2 accepts negative integers, rejects decimals and enforces 15 seconds', () => {
  const game = createCoreGame({
    rng: sequenceRng(),
    baseAssignments: PLAYER_BASES,
    stage: GAME_STAGES.ARCHIPELAGO,
  });

  const result = game.archipelagoSystem.beginRound({
    state: game.state,
    correctAnswer: -10,
    responses: {
      R: { value: -10, elapsedMs: ARCHIPELAGO_QUESTION_TIME_LIMIT_MS },
      B: { value: -9, elapsedMs: 2_000 },
      G: { value: -10.5, elapsedMs: 1_000 },
      P: { value: -10, elapsedMs: ARCHIPELAGO_QUESTION_TIME_LIMIT_MS + 1 },
    },
  });

  assert.deepEqual(result.ranking.slice(0, 2), ['R', 'B']);
  assert.deepEqual(new Set(result.ranking.slice(2)), new Set(['G', 'P']));
  assert.equal(game.state.quizState.responses.G, null);
  assert.equal(game.state.quizState.responses.P, null);
  assert.equal(
    game.state.quizState.questionTimeLimitMs,
    ARCHIPELAGO_QUESTION_TIME_LIMIT_MS,
  );
});

test('Stage 2 breaks equal absolute error by response speed', () => {
  const game = createCoreGame({
    rng: sequenceRng(),
    baseAssignments: PLAYER_BASES,
    stage: GAME_STAGES.ARCHIPELAGO,
  });

  const result = game.archipelagoSystem.beginRound({
    state: game.state,
    correctAnswer: 100,
    responses: {
      R: { value: 99, elapsedMs: 2_000 },
      B: { value: 101, elapsedMs: 1_000 },
      G: { value: 104, elapsedMs: 500 },
      P: { value: 110, elapsedMs: 100 },
    },
  });

  assert.deepEqual(result.ranking, ['B', 'R', 'G', 'P']);
});

test('Stage 2 repeats extra numeric questions only for unresolved tied players', () => {
  const game = createCoreGame({
    rng: sequenceRng(),
    baseAssignments: PLAYER_BASES,
    stage: GAME_STAGES.ARCHIPELAGO,
  });

  const initial = game.archipelagoSystem.beginRound({
    state: game.state,
    correctAnswer: 100,
    responses: {
      R: { value: 99, elapsedMs: 1_000 },
      B: { value: 101, elapsedMs: 1_000 },
      G: { value: 99, elapsedMs: 1_000 },
      P: { value: 110, elapsedMs: 2_000 },
    },
  });

  assert.equal(initial.requiresTieBreak, true);
  assert.deepEqual(initial.tiedPlayerIds, ['R', 'B', 'G']);

  const partial = game.archipelagoSystem.resolveTieBreak({
    state: game.state,
    correctAnswer: 50,
    responses: {
      R: { value: 49, elapsedMs: 1_000 },
      B: { value: 51, elapsedMs: 1_000 },
      G: { value: 53, elapsedMs: 500 },
    },
  });

  assert.equal(partial.requiresTieBreak, true);
  assert.deepEqual(partial.tiedPlayerIds, ['R', 'B']);

  const resolved = game.archipelagoSystem.resolveTieBreak({
    state: game.state,
    correctAnswer: 20,
    responses: {
      R: { value: 20, elapsedMs: 2_000 },
      B: { value: 21, elapsedMs: 500 },
    },
  });

  assert.equal(resolved.requiresTieBreak, false);
  assert.deepEqual(resolved.ranking, ['R', 'B', 'G', 'P']);
});

test('Stage 3 starts WAR at one minute even when not everyone is ready', () => {
  const game = createCoreGame({
    rng: sequenceRng(),
    baseAssignments: PLAYER_BASES,
    stage: GAME_STAGES.PREPARATION,
    territoryOwners: allOwnedBy('R'),
    turnOrders: warTurnOrders(),
  });

  game.stageSystem.startPreparation(game.state, { nowMs: 1_000 });
  game.stageSystem.markPlayerReady(game.state, 'R', { nowMs: 10_000 });

  const early = game.stageSystem.checkPreparationTimeout(
    game.state,
    { nowMs: 1_000 + PREPARATION_TIME_LIMIT_MS - 1 },
  );
  assert.equal(early.startedWar, false);

  const timedOut = game.stageSystem.checkPreparationTimeout(
    game.state,
    { nowMs: 1_000 + PREPARATION_TIME_LIMIT_MS },
  );

  assert.equal(timedOut.startedWar, true);
  assert.equal(game.state.stage, GAME_STAGES.WAR);
  assert.equal(timedOut.reason, 'TIMEOUT');
});

test('Flagship MaxHP and Damage stop at v0.4 caps', () => {
  const game = createCoreGame({
    rng: sequenceRng(),
    baseAssignments: PLAYER_BASES,
    stage: GAME_STAGES.PREPARATION,
  });

  game.economySystem.credit({
    state: game.state,
    playerId: 'R',
    amount: 200,
    reason: 'TEST_FUNDS',
  });

  while (game.state.players.get('R').ship.maxHp < FLAGSHIP_MAX_HP) {
    game.flagshipSystem.purchaseHpUpgrade({
      state: game.state,
      playerId: 'R',
    });
  }
  while (game.state.players.get('R').ship.dmg < FLAGSHIP_MAX_DAMAGE) {
    game.flagshipSystem.purchaseDamageUpgrade({
      state: game.state,
      playerId: 'R',
    });
  }

  assert.equal(game.state.players.get('R').ship.maxHp, 5);
  assert.equal(game.state.players.get('R').ship.dmg, 3);

  assert.throws(
    () => game.flagshipSystem.purchaseHpUpgrade({
      state: game.state,
      playerId: 'R',
    }),
    /MaxHP cannot exceed 5/,
  );
  assert.throws(
    () => game.flagshipSystem.purchaseDamageUpgrade({
      state: game.state,
      playerId: 'R',
    }),
    /Damage cannot exceed 3/,
  );
});

test('destroyed flagship returns with 0 HP, loses installed crew and repairs for 20 per HP', () => {
  const game = createCoreGame({
    rng: sequenceRng(),
    baseAssignments: PLAYER_BASES,
    stage: GAME_STAGES.PREPARATION,
  });

  game.state.players.get('R').ship.installedCrew = [CREW_TYPES.GUNNER];

  const destroyed = game.flagshipSystem.destroyFlagship({
    state: game.state,
    playerId: 'R',
  });

  assert.equal(destroyed.returnedToBase, true);
  assert.equal(game.state.players.get('R').ship.hp, 0);
  assert.equal(game.state.players.get('R').ship.pos, 'A');
  assert.deepEqual(game.state.players.get('R').ship.installedCrew, []);

  const repaired = game.flagshipSystem.repairHp({
    state: game.state,
    playerId: 'R',
    points: 1,
  });

  assert.equal(repaired.transaction.amount, 20);
  assert.equal(game.state.players.get('R').ship.hp, 1);
  assert.equal(game.state.players.get('R').ship.sunk, false);
});

test('destroyed flagship does not respawn after its active base has been lost', () => {
  const game = createCoreGame({
    rng: sequenceRng(),
    baseAssignments: PLAYER_BASES,
    stage: GAME_STAGES.WAR,
    territoryOwners: allOwnedBy('R'),
    turnOrders: warTurnOrders(),
  });

  game.state.bases.get('A').convertToFormerBase('B');

  const destroyed = game.flagshipSystem.destroyFlagship({
    state: game.state,
    playerId: 'R',
  });

  assert.equal(destroyed.returnedToBase, false);
  assert.equal(game.state.players.get('R').ship.pos, null);
  assert.equal(game.state.players.get('R').ship.hp, 0);
});

test('Crew costs 20, cannot be duplicated, is changed only at active base and sells for 10', () => {
  const game = createCoreGame({
    rng: sequenceRng(),
    baseAssignments: PLAYER_BASES,
    stage: GAME_STAGES.PREPARATION,
  });

  const purchase = game.crewSystem.purchaseCrew({
    state: game.state,
    playerId: 'R',
    crewType: CREW_TYPES.GUNNER,
  });

  assert.equal(purchase.transaction.amount, 20);
  assert.throws(
    () => game.crewSystem.purchaseCrew({
      state: game.state,
      playerId: 'R',
      crewType: CREW_TYPES.GUNNER,
    }),
    /Duplicate crew/,
  );

  game.crewSystem.installCrew({
    state: game.state,
    playerId: 'R',
    crewType: CREW_TYPES.GUNNER,
  });

  game.flagshipSystem.moveFlagship = game.flagshipSystem.moveFlagship;
  game.state.players.get('R').ship.pos = 1;

  assert.throws(
    () => game.crewSystem.uninstallCrew({
      state: game.state,
      playerId: 'R',
      crewType: CREW_TYPES.GUNNER,
    }),
    /active base/,
  );

  game.state.players.get('R').ship.pos = 'A';
  game.crewSystem.uninstallCrew({
    state: game.state,
    playerId: 'R',
    crewType: CREW_TYPES.GUNNER,
  });

  const sale = game.crewSystem.sellCrew({
    state: game.state,
    playerId: 'R',
    crewType: CREW_TYPES.GUNNER,
  });
  assert.equal(sale.transaction.amount, 10);
});

test('one WAR turn permits only one boost', () => {
  const game = createWarGame();
  game.boostSystem.grantToPlayer(game.state, 'R', BOOST_TYPES.SMALL_CHEST);
  game.boostSystem.grantToPlayer(game.state, 'R', BOOST_TYPES.LARGE_CHEST);

  game.boostSystem.useBoost({
    state: game.state,
    playerId: 'R',
    boostType: BOOST_TYPES.SMALL_CHEST,
  });

  assert.throws(
    () => game.boostSystem.useBoost({
      state: game.state,
      playerId: 'R',
      boostType: BOOST_TYPES.LARGE_CHEST,
    }),
    /Only one boost/,
  );
});

test('Recon bypasses island adjacency but cannot bypass active-base adjacency', () => {
  const owners = allOwnedBy('B');
  owners[1] = 'R';

  const game = createWarGame({ owners });
  game.boostSystem.grantToPlayer(game.state, 'R', BOOST_TYPES.RECON);
  game.boostSystem.prepareAttackBoost({
    state: game.state,
    playerId: 'R',
    boostType: BOOST_TYPES.RECON,
  });

  assert.equal(
    game.combatSystem.canAttackTerritory(game.state, 'R', 36),
    true,
  );
  assert.equal(
    game.combatSystem.canAttackBase(game.state, 'R', 'D'),
    false,
  );
});

test('Secret Route can bypass adjacency for an active-base attack', () => {
  const owners = allOwnedBy('B');
  owners[1] = 'R';

  const game = createWarGame({ owners });
  game.boostSystem.grantToPlayer(game.state, 'R', BOOST_TYPES.SECRET_ROUTE);
  game.boostSystem.prepareAttackBoost({
    state: game.state,
    playerId: 'R',
    boostType: BOOST_TYPES.SECRET_ROUTE,
  });

  assert.equal(
    game.combatSystem.canAttackBase(game.state, 'R', 'D'),
    true,
  );
});

test('Double Volley doubles flagship Damage for the selected attack without inventing HP exchange', () => {
  const game = createWarGame();

  game.state.players.get('R').ship.dmg = 2;
  game.boostSystem.grantToPlayer(game.state, 'R', BOOST_TYPES.DOUBLE_VOLLEY);
  game.boostSystem.prepareAttackBoost({
    state: game.state,
    playerId: 'R',
    boostType: BOOST_TYPES.DOUBLE_VOLLEY,
  });

  assert.equal(game.combatSystem.getAttackFlagshipDamage(game.state, 'R'), 4);
});

test('undefined v0.4 boost effects stay explicitly blocked', () => {
  const game = createWarGame();
  game.boostSystem.grantToPlayer(game.state, 'R', BOOST_TYPES.COMPASS);

  assert.throws(
    () => game.boostSystem.useBoost({
      state: game.state,
      playerId: 'R',
      boostType: BOOST_TYPES.COMPASS,
    }),
    /intentionally undefined/,
  );
});

test('battle state is public but only attacker and defender can submit immutable answers', () => {
  const owners = allOwnedBy('R');
  owners[2] = 'B';

  const game = createWarGame({ owners });
  const attack = game.combatSystem.beginTerritoryAttack({
    state: game.state,
    attackerId: 'R',
    targetTerritoryId: 2,
  });

  assert.deepEqual(attack.eligibleResponderIds, ['R', 'B']);
  assert.deepEqual(new Set(attack.observerPlayerIds), new Set(['G', 'P']));

  assert.throws(
    () => game.combatSystem.submitActiveAnswer({
      state: game.state,
      playerId: 'P',
      answer: 1,
      elapsedMs: 1_000,
    }),
    /observer/,
  );

  game.combatSystem.submitActiveAnswer({
    state: game.state,
    playerId: 'R',
    answer: 1,
    elapsedMs: 1_000,
  });

  assert.throws(
    () => game.combatSystem.submitActiveAnswer({
      state: game.state,
      playerId: 'R',
      answer: 2,
      elapsedMs: 1_100,
    }),
    /cannot be changed/,
  );
});

test('defending flagship is a mandatory first stage and exact Damage-to-HP resolution remains blocked', () => {
  const owners = allOwnedBy('R');
  owners[2] = 'B';

  const game = createWarGame({ owners });
  game.state.players.get('B').ship.pos = 2;

  const attack = game.combatSystem.beginTerritoryAttack({
    state: game.state,
    attackerId: 'R',
    targetTerritoryId: 2,
  });

  assert.equal(attack.phase, 'DEFENDING_FLAGSHIP');

  assert.throws(
    () => game.combatSystem.resolveTerritoryBattle({
      state: game.state,
      attackerId: 'R',
      targetTerritoryId: 2,
      attackerCorrect: true,
      defenderCorrect: false,
    }),
    /Defending flagship must be destroyed/,
  );

  game.flagshipSystem.destroyFlagship({
    state: game.state,
    playerId: 'B',
  });
  const continued = game.combatSystem.continueAfterDefendingFlagshipDestroyed(
    game.state,
  );
  assert.equal(continued.phase, 'QUESTION');
});

test('Second Chance cancels an uncommitted loss and replaces it with a new 4-option question result', () => {
  const owners = allOwnedBy('R');
  owners[2] = 'B';

  const game = createWarGame({ owners });
  game.boostSystem.grantToPlayer(game.state, 'R', BOOST_TYPES.SECOND_CHANCE);

  game.combatSystem.beginTerritoryAttack({
    state: game.state,
    attackerId: 'R',
    targetTerritoryId: 2,
  });

  const first = game.combatSystem.previewActiveQuestionOutcome({
    state: game.state,
    attackerCorrect: false,
    defenderCorrect: true,
  });
  assert.equal(first.loserId, 'R');
  assert.equal(game.state.territories.get(2).ownerId, 'B');

  const replay = game.boostSystem.useBoost({
    state: game.state,
    playerId: 'R',
    boostType: BOOST_TYPES.SECOND_CHANCE,
  });
  assert.equal(replay.replayQuestion, true);
  assert.equal(game.state.warState.activeAttack.questionType, 'MULTIPLE_CHOICE_4');

  game.combatSystem.previewActiveQuestionOutcome({
    state: game.state,
    attackerCorrect: true,
    defenderCorrect: false,
  });
  const committed = game.combatSystem.commitActiveQuestionResult(game.state);

  assert.equal(committed.winnerId, 'R');
  assert.equal(game.state.territories.get(2).ownerId, 'R');
});

test('successful island capture gives 10 dubloons; successful defense gives 2 Fame', () => {
  const owners = allOwnedBy('R');
  owners[2] = 'B';

  const captureGame = createWarGame({ owners: { ...owners } });
  const beforeCoins = captureGame.state.players.get('R').coins;

  captureGame.combatSystem.resolveTerritoryBattle({
    state: captureGame.state,
    attackerId: 'R',
    targetTerritoryId: 2,
    attackerCorrect: true,
    defenderCorrect: false,
  });

  assert.equal(captureGame.state.players.get('R').coins, beforeCoins + 10);

  const defenseGame = createWarGame({ owners: { ...owners } });
  const fameBefore = defenseGame.fameSystem.getFame(defenseGame.state, 'B');

  defenseGame.combatSystem.resolveTerritoryBattle({
    state: defenseGame.state,
    attackerId: 'R',
    targetTerritoryId: 2,
    attackerCorrect: false,
    defenderCorrect: true,
  });

  assert.equal(
    defenseGame.fameSystem.getFame(defenseGame.state, 'B'),
    fameBefore + FAME_REWARDS.SUCCESSFUL_DEFENSE,
  );
});

test('base capture gives +9 Fame, applies one-time -5 floor-zero loss, and former base can be recaptured for +4', () => {
  const owners = allOwnedBy('R');
  for (const id of [6, 12, 18]) owners[id] = 'B';

  const game = createWarGame({ owners });
  game.state.players.get('B').ship.pos = 6;

  const fameRBefore = game.fameSystem.getFame(game.state, 'R');
  const fameBBefore = game.fameSystem.getFame(game.state, 'B');

  for (let stage = 0; stage < 3; stage++) {
    game.combatSystem.resolveBaseBattle({
      state: game.state,
      attackerId: 'R',
      targetBaseId: 'B',
      attackerCorrect: true,
      defenderCorrect: false,
    });
  }

  const base = game.state.bases.get('B');
  assert.equal(base.isActiveBase, false);
  assert.equal(base.ownerId, 'R');
  assert.equal(
    game.fameSystem.getFame(game.state, 'R'),
    fameRBefore + FAME_REWARDS.FIRST_BASE_CAPTURE,
  );
  assert.equal(
    game.fameSystem.getFame(game.state, 'B'),
    Math.max(0, fameBBefore - FAME_REWARDS.BASE_LOSS_PENALTY),
  );

  game.turnSystem.advance(game.state);
  assert.equal(game.state.currentPlayerId, 'B');
  assert.equal(
    game.combatSystem.canAttackFormerBase(game.state, 'B', 'B'),
    true,
  );

  const fameBeforeRecapture = game.fameSystem.getFame(game.state, 'B');
  game.combatSystem.resolveFormerBaseBattle({
    state: game.state,
    attackerId: 'B',
    targetBaseId: 'B',
    attackerCorrect: true,
    defenderCorrect: false,
  });

  assert.equal(base.ownerId, 'B');
  assert.equal(base.isActiveBase, false);
  assert.equal(
    game.fameSystem.getFame(game.state, 'B'),
    fameBeforeRecapture + FAME_REWARDS.FORMER_BASE_CAPTURE,
  );
});

test('former base participates in territorial adjacency but never becomes an active base again', () => {
  const owners = allOwnedBy('B');
  owners[6] = 'R';

  const game = createWarGame({ owners });
  game.state.players.get('B').ship.pos = 12;

  for (let stage = 0; stage < 3; stage++) {
    game.combatSystem.resolveBaseBattle({
      state: game.state,
      attackerId: 'R',
      targetBaseId: 'B',
      attackerCorrect: true,
      defenderCorrect: false,
    });
  }

  const base = game.state.bases.get('B');
  assert.equal(base.isActiveBase, false);
  assert.equal(base.ownerId, 'R');

  // Remove the island that originally provided adjacency. The former base itself
  // must now act as the owned source node for island 5.
  game.state.territories.get(6).ownerId = 'B';

  for (let step = 0; step < 4; step++) {
    game.turnSystem.advance(game.state);
  }

  assert.deepEqual(
    game.combatSystem.getAttackSources(game.state, 'R', 5),
    ['B'],
  );
  assert.equal(game.combatSystem.canAttackTerritory(game.state, 'R', 5), true);
});

test('after 32 normal turns a Fame tie gives each tied leader one extra turn and then allows shared winners', () => {
  const owners = {};
  for (let id = 1; id <= TERRITORY_COUNT; id++) {
    owners[id] = PLAYER_IDS[(id - 1) % PLAYER_IDS.length];
  }

  const game = createWarGame({
    owners,
    rng: () => 0,
  });

  const initialScores = PLAYER_IDS.map(
    playerId => game.fameSystem.getFame(game.state, playerId),
  );
  const target = Math.max(...initialScores);
  PLAYER_IDS.forEach((playerId, index) => {
    const deficit = target - initialScores[index];
    if (deficit > 0) {
      game.fameSystem.award(
        game.state,
        playerId,
        deficit,
        'TEST_TIE_NORMALIZATION',
      );
    }
  });

  let normalTurns = 0;
  let tiebreakStart = null;
  while (!game.state.finished && !game.state.warState.tiebreak?.active) {
    normalTurns += 1;
    tiebreakStart = game.turnSystem.advance(game.state);
  }

  assert.equal(normalTurns, 32);
  assert.equal(tiebreakStart.tiebreak, true);
  assert.equal(game.state.warState.tiebreak.playerIds.length, 4);

  let extraTurns = 0;
  while (!game.state.finished) {
    extraTurns += 1;
    game.turnSystem.advance(game.state);
  }

  assert.equal(extraTurns, 4);
  assert.deepEqual(
    new Set(game.state.resultState.winnerIds),
    new Set(PLAYER_IDS),
  );
  assert.deepEqual(game.state.warState.turnsTakenByPlayer, {
    R: 8,
    B: 8,
    G: 8,
    P: 8,
  });
});

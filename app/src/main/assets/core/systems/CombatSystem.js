import {
  BOOST_TYPES,
  FAME_REWARDS,
  GAME_STAGES,
  PLAYER_IDS,
  TERRITORY_CAPTURE_DUBLOONS,
  WAR_QUESTION_TIME_LIMIT_MS,
} from '../constants.js';

function assertBoolean(value, label) {
  if (typeof value !== 'boolean') throw new Error(`${label} must be boolean`);
}

function validDuelAnswer(value, elapsedMs) {
  return (
    Number.isInteger(value)
    && Number.isFinite(elapsedMs)
    && elapsedMs >= 0
    && elapsedMs <= WAR_QUESTION_TIME_LIMIT_MS
  );
}

export class CombatSystem {
  constructor({
    map,
    economySystem = null,
    fameSystem = null,
    flagshipSystem = null,
  }) {
    if (!map) throw new Error('CombatSystem requires GameMap');
    this.map = map;
    this.economySystem = economySystem;
    this.fameSystem = fameSystem;
    this.flagshipSystem = flagshipSystem;
  }

  assertWarCanAttack(state, attackerId) {
    if (state.stage !== GAME_STAGES.WAR) {
      throw new Error('Attack can only start during WAR');
    }
    if (state.currentPlayerId !== attackerId) {
      throw new Error(`It is not ${attackerId}'s turn`);
    }
    if (!this.flagshipSystem?.isAvailableForAttack(state, attackerId)) {
      throw new Error('Operational flagship is required to attack enemy territory');
    }
  }

  getSelectedBoostType(state, attackerId) {
    const selected = state.warState.selectedTurnBoost;
    return selected?.playerId === attackerId ? selected.boostType : null;
  }

  ignoresAdjacency(state, attackerId, targetType) {
    const boostType = this.getSelectedBoostType(state, attackerId);
    if (boostType === BOOST_TYPES.SECRET_ROUTE) return true;
    if (boostType === BOOST_TYPES.RECON && targetType !== 'BASE') return true;
    return false;
  }

  isBlackMarkBlocked(state, attackerId, defenderId, targetType) {
    if (targetType === 'BASE') return false;
    return state.warState.blackMarks.some(mark => (
      mark.targetPlayerId === attackerId
      && mark.protectedPlayerId === defenderId
    ));
  }

  getOwnedSourceNodeIds(state, attackerId) {
    const territoryIds = [...state.territories.values()]
      .filter(territory => territory.ownerId === attackerId)
      .map(territory => territory.id);

    const baseIds = [...state.bases.values()]
      .filter(base => base.ownerId === attackerId)
      .map(base => base.id);

    return [...territoryIds, ...baseIds];
  }

  getAttackSources(state, attackerId, targetTerritoryId) {
    return this.getOwnedSourceNodeIds(state, attackerId)
      .filter(sourceId => this.map.areAdjacent(sourceId, Number(targetTerritoryId)))
      .sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));
  }

  getBaseAttackSources(state, attackerId, baseId) {
    return this.getOwnedSourceNodeIds(state, attackerId)
      .filter(sourceId => (
        String(sourceId) !== String(baseId)
        && this.map.areAdjacent(sourceId, String(baseId))
      ))
      .sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));
  }

  getDefendingFlagship(state, defenderId, targetNodeId) {
    if (!this.flagshipSystem) return null;
    const ship = this.flagshipSystem.getFlagship(state, defenderId);
    return (
      ship.isOperational
      && String(ship.pos) === String(targetNodeId)
    )
      ? ship
      : null;
  }

  createPublicAttackState({
    state,
    attackerId,
    defenderId,
    targetType,
    targetId,
  }) {
    const defenderFlagship = this.getDefendingFlagship(state, defenderId, targetId);
    const attack = {
      attackId: state.warState.battleHistory.length + 1,
      attackerId,
      defenderId,
      targetType,
      targetId,
      phase: defenderFlagship ? 'DEFENDING_FLAGSHIP' : 'QUESTION',
      questionType: 'MULTIPLE_CHOICE_4',
      questionTimeLimitMs: WAR_QUESTION_TIME_LIMIT_MS,
      eligibleResponderIds: [attackerId, defenderId],
      observerPlayerIds: PLAYER_IDS.filter(
        playerId => playerId !== attackerId && playerId !== defenderId,
      ),
      responses: {},
      pendingQuestionResult: null,
      lastQuestionResult: null,
      defendingFlagshipRequired: Boolean(defenderFlagship),
    };
    state.warState.activeAttack = attack;
    state.warState.turnActionUsed = true;
    return { ...attack };
  }

  previewActiveQuestionOutcome({
    state,
    attackerCorrect,
    defenderCorrect,
    attackerElapsedMs = 0,
    defenderElapsedMs = 0,
    numericDuel = null,
  }) {
    const attack = state.warState.activeAttack;
    if (!attack) throw new Error('No active attack');
    if (attack.phase === 'DEFENDING_FLAGSHIP') {
      throw new Error(
        'Flagship-vs-flagship Damage/HP resolution is intentionally undefined in Rules v0.4',
      );
    }

    const outcome = this.resolveQuizOutcome({
      attackerCorrect,
      defenderCorrect,
      attackerElapsedMs,
      defenderElapsedMs,
      numericDuel,
    });
    const winnerId = outcome.winnerSide === 'ATTACKER'
      ? attack.attackerId
      : attack.defenderId;
    const loserId = winnerId === attack.attackerId
      ? attack.defenderId
      : attack.attackerId;

    attack.pendingQuestionResult = {
      winnerId,
      loserId,
      result: outcome.reason,
      attackerCorrect,
      defenderCorrect,
      attackerElapsedMs,
      defenderElapsedMs,
      numericDuel: numericDuel == null ? null : { ...numericDuel },
    };
    attack.phase = 'QUESTION_RESULT_PENDING';

    return { ...attack.pendingQuestionResult };
  }

  assertDefendingFlagshipCleared(state, targetType, targetId) {
    const attack = state.warState.activeAttack;
    if (
      attack?.defendingFlagshipRequired
      && attack.targetType === targetType
      && String(attack.targetId) === String(targetId)
    ) {
      throw new Error('Defending flagship must be destroyed before continuing the assault');
    }
  }

  getAttackFlagshipDamage(state, attackerId) {
    if (!this.flagshipSystem) throw new Error('FlagshipSystem is required');
    const baseDamage = this.flagshipSystem.getFlagship(state, attackerId).dmg;
    return this.getSelectedBoostType(state, attackerId) === BOOST_TYPES.DOUBLE_VOLLEY
      ? baseDamage * 2
      : baseDamage;
  }

  ensureAttackContext({
    state,
    attackerId,
    targetType,
    targetId,
  }) {
    let attack = state.warState.activeAttack;

    if (attack == null) {
      if (state.warState.turnActionUsed) {
        throw new Error('Only one attack is allowed per ordinary turn');
      }

      if (targetType === 'TERRITORY') {
        this.beginTerritoryAttack({
          state,
          attackerId,
          targetTerritoryId: targetId,
        });
      } else if (targetType === 'BASE') {
        this.beginBaseAttack({
          state,
          attackerId,
          targetBaseId: targetId,
        });
      } else if (targetType === 'FORMER_BASE') {
        this.beginFormerBaseAttack({
          state,
          attackerId,
          targetBaseId: targetId,
        });
      } else {
        throw new Error(`Unknown attack target type: ${targetType}`);
      }
      attack = state.warState.activeAttack;
    }

    if (
      attack.attackerId !== attackerId
      || attack.targetType !== targetType
      || String(attack.targetId) !== String(targetId)
    ) {
      throw new Error('A different attack is already active this turn');
    }

    if (attack.phase === 'DEFENDING_FLAGSHIP') {
      throw new Error('Defending flagship must be destroyed before continuing the assault');
    }
    if (!['QUESTION', 'QUESTION_RESULT_PENDING'].includes(attack.phase)) {
      throw new Error(`Attack cannot resolve a question during phase ${attack.phase}`);
    }

    return attack;
  }

  commitActiveQuestionResult(state) {
    const attack = state.warState.activeAttack;
    const pending = attack?.pendingQuestionResult;
    if (!attack || !pending) {
      throw new Error('No pending battle question result to commit');
    }

    attack.phase = 'QUESTION';

    const common = {
      state,
      attackerId: attack.attackerId,
      attackerCorrect: pending.attackerCorrect,
      defenderCorrect: pending.defenderCorrect,
      attackerElapsedMs: pending.attackerElapsedMs,
      defenderElapsedMs: pending.defenderElapsedMs,
      numericDuel: pending.numericDuel,
    };

    if (attack.targetType === 'TERRITORY') {
      return this.resolveTerritoryBattle({
        ...common,
        targetTerritoryId: attack.targetId,
      });
    }
    if (attack.targetType === 'BASE') {
      return this.resolveBaseBattle({
        ...common,
        targetBaseId: attack.targetId,
      });
    }
    if (attack.targetType === 'FORMER_BASE') {
      return this.resolveFormerBaseBattle({
        ...common,
        targetBaseId: attack.targetId,
      });
    }

    throw new Error(`Unknown attack target type: ${attack.targetType}`);
  }

  canPlayerAnswerActiveQuestion(state, playerId) {
    const attack = state.warState.activeAttack;
    return Boolean(
      attack
      && ['QUESTION', 'NUMERIC_DUEL', 'DEFENDING_FLAGSHIP'].includes(attack.phase)
      && attack.eligibleResponderIds.includes(playerId)
    );
  }

  submitActiveAnswer({
    state,
    playerId,
    answer,
    elapsedMs,
  }) {
    const attack = state.warState.activeAttack;
    if (!attack) throw new Error('No active attack');
    if (!this.canPlayerAnswerActiveQuestion(state, playerId)) {
      throw new Error('This player is an observer and cannot answer');
    }
    if (Object.prototype.hasOwnProperty.call(attack.responses, playerId)) {
      throw new Error('Submitted battle answer cannot be changed');
    }

    attack.responses[playerId] = {
      answer,
      elapsedMs,
      timedOut: !Number.isFinite(elapsedMs) || elapsedMs > WAR_QUESTION_TIME_LIMIT_MS,
    };

    return { ...attack.responses[playerId] };
  }

  canAttackTerritory(state, attackerId, targetTerritoryId) {
    try {
      this.assertWarCanAttack(state, attackerId);
    } catch {
      return false;
    }
    if (state.warState.turnActionUsed) return false;

    const target = state.territories.get(Number(targetTerritoryId));
    if (!target || target.ownerId == null || target.ownerId === attackerId) return false;
    if (this.isBlackMarkBlocked(state, attackerId, target.ownerId, 'TERRITORY')) return false;

    if (this.ignoresAdjacency(state, attackerId, 'TERRITORY')) return true;
    return this.getAttackSources(state, attackerId, targetTerritoryId).length > 0;
  }

  canAttackBase(state, attackerId, baseId) {
    try {
      this.assertWarCanAttack(state, attackerId);
    } catch {
      return false;
    }
    if (state.warState.turnActionUsed) return false;

    const base = state.bases.get(String(baseId));
    if (!base || !base.isActiveBase || base.ownerId === attackerId) return false;

    if (this.ignoresAdjacency(state, attackerId, 'BASE')) return true;
    return this.getBaseAttackSources(state, attackerId, baseId).length > 0;
  }

  canAttackFormerBase(state, attackerId, baseId) {
    try {
      this.assertWarCanAttack(state, attackerId);
    } catch {
      return false;
    }
    if (state.warState.turnActionUsed) return false;

    const base = state.bases.get(String(baseId));
    if (!base || base.isActiveBase || base.ownerId === attackerId) return false;
    if (this.isBlackMarkBlocked(state, attackerId, base.ownerId, 'FORMER_BASE')) return false;

    if (this.ignoresAdjacency(state, attackerId, 'FORMER_BASE')) return true;
    return this.getBaseAttackSources(state, attackerId, baseId).length > 0;
  }

  beginTerritoryAttack({ state, attackerId, targetTerritoryId }) {
    if (!this.canAttackTerritory(state, attackerId, targetTerritoryId)) {
      throw new Error('Territory attack is not legal');
    }
    const target = state.territories.get(Number(targetTerritoryId));
    return this.createPublicAttackState({
      state,
      attackerId,
      defenderId: target.ownerId,
      targetType: 'TERRITORY',
      targetId: target.id,
    });
  }

  beginBaseAttack({ state, attackerId, targetBaseId }) {
    if (!this.canAttackBase(state, attackerId, targetBaseId)) {
      throw new Error('Base attack is not legal');
    }
    const base = state.bases.get(String(targetBaseId));
    return this.createPublicAttackState({
      state,
      attackerId,
      defenderId: base.ownerId,
      targetType: 'BASE',
      targetId: base.id,
    });
  }

  beginFormerBaseAttack({ state, attackerId, targetBaseId }) {
    if (!this.canAttackFormerBase(state, attackerId, targetBaseId)) {
      throw new Error('Former-base attack is not legal');
    }
    const base = state.bases.get(String(targetBaseId));
    return this.createPublicAttackState({
      state,
      attackerId,
      defenderId: base.ownerId,
      targetType: 'FORMER_BASE',
      targetId: base.id,
    });
  }

  continueAfterDefendingFlagshipDestroyed(state) {
    const attack = state.warState.activeAttack;
    if (!attack || attack.phase !== 'DEFENDING_FLAGSHIP') {
      throw new Error('No defending flagship phase is active');
    }

    const ship = this.getDefendingFlagship(
      state,
      attack.defenderId,
      attack.targetId,
    );
    if (ship) {
      throw new Error('Defending flagship is still operational');
    }

    attack.phase = 'QUESTION';
    attack.defendingFlagshipRequired = false;
    attack.responses = {};
    return { ...attack };
  }

  resolveNumericDuel({
    correctAnswer,
    attackerAnswer,
    defenderAnswer,
    attackerElapsedMs = 0,
    defenderElapsedMs = 0,
  }) {
    if (!Number.isInteger(correctAnswer)) {
      throw new Error('correctAnswer must be an integer');
    }

    const attackerValid = validDuelAnswer(attackerAnswer, attackerElapsedMs);
    const defenderValid = validDuelAnswer(defenderAnswer, defenderElapsedMs);

    if (!attackerValid && !defenderValid) return 'DEFENDER';
    if (attackerValid && !defenderValid) return 'ATTACKER';
    if (!attackerValid && defenderValid) return 'DEFENDER';

    const attackerError = Math.abs(attackerAnswer - correctAnswer);
    const defenderError = Math.abs(defenderAnswer - correctAnswer);

    if (attackerError < defenderError) return 'ATTACKER';
    if (defenderError < attackerError) return 'DEFENDER';
    if (attackerElapsedMs < defenderElapsedMs) return 'ATTACKER';
    return 'DEFENDER';
  }

  resolveQuizOutcome({
    attackerCorrect,
    defenderCorrect,
    attackerElapsedMs = 0,
    defenderElapsedMs = 0,
    numericDuel = null,
  }) {
    assertBoolean(attackerCorrect, 'attackerCorrect');
    assertBoolean(defenderCorrect, 'defenderCorrect');

    const attackerInTime = Number.isFinite(attackerElapsedMs)
      && attackerElapsedMs >= 0
      && attackerElapsedMs <= WAR_QUESTION_TIME_LIMIT_MS;
    const defenderInTime = Number.isFinite(defenderElapsedMs)
      && defenderElapsedMs >= 0
      && defenderElapsedMs <= WAR_QUESTION_TIME_LIMIT_MS;

    const attackerResult = attackerCorrect && attackerInTime;
    const defenderResult = defenderCorrect && defenderInTime;

    if (attackerResult && !defenderResult) {
      return {
        winnerSide: 'ATTACKER',
        reason: 'ATTACKER_CORRECT_DEFENDER_WRONG',
      };
    }

    if (!attackerResult && defenderResult) {
      return {
        winnerSide: 'DEFENDER',
        reason: 'ATTACKER_WRONG_DEFENDER_CORRECT',
      };
    }

    if (!attackerResult && !defenderResult) {
      return {
        winnerSide: 'DEFENDER',
        reason: 'BOTH_WRONG_DEFENDER_WINS',
      };
    }

    if (!numericDuel) {
      throw new Error('Both correct answers require a numeric duel');
    }

    const winnerSide = this.resolveNumericDuel(numericDuel);
    return {
      winnerSide,
      reason: winnerSide === 'ATTACKER'
        ? 'BOTH_CORRECT_NUMERIC_ATTACKER_WINS'
        : 'BOTH_CORRECT_NUMERIC_DEFENDER_WINS',
    };
  }

  awardDefense(state, defenderId, metadata) {
    if (!this.fameSystem) return null;
    return this.fameSystem.award(
      state,
      defenderId,
      FAME_REWARDS.SUCCESSFUL_DEFENSE,
      'SUCCESSFUL_DEFENSE',
      metadata,
    );
  }

  resolveTerritoryBattle({
    state,
    attackerId,
    targetTerritoryId,
    attackerCorrect,
    defenderCorrect,
    attackerElapsedMs = 0,
    defenderElapsedMs = 0,
    numericDuel = null,
  }) {
    this.assertWarCanAttack(state, attackerId);
    this.ensureAttackContext({
      state,
      attackerId,
      targetType: 'TERRITORY',
      targetId: targetTerritoryId,
    });

    const target = state.territories.get(Number(targetTerritoryId));
    if (!target) throw new Error(`Unknown territory: ${targetTerritoryId}`);
    if (target.ownerId == null) throw new Error('Cannot attack a neutral territory');
    if (target.ownerId === attackerId) throw new Error('Cannot attack own territory');
    if (this.isBlackMarkBlocked(state, attackerId, target.ownerId, 'TERRITORY')) {
      throw new Error('Black Mark blocks this territory attack');
    }

    const ignoreAdjacency = this.ignoresAdjacency(state, attackerId, 'TERRITORY');
    const attackSources = this.getAttackSources(state, attackerId, targetTerritoryId);
    if (!ignoreAdjacency && attackSources.length === 0) {
      throw new Error('Target is not connected by a sea route to attacker territory');
    }

    const defenderId = target.ownerId;
    const outcome = this.resolveQuizOutcome({
      attackerCorrect,
      defenderCorrect,
      attackerElapsedMs,
      defenderElapsedMs,
      numericDuel,
    });

    const previousOwnerId = target.ownerId;
    const winnerId = outcome.winnerSide === 'ATTACKER'
      ? attackerId
      : defenderId;

    if (winnerId === attackerId) {
      target.ownerId = attackerId;
      if (this.economySystem) {
        this.economySystem.credit({
          state,
          playerId: attackerId,
          amount: TERRITORY_CAPTURE_DUBLOONS,
          reason: 'TERRITORY_CAPTURE',
        });
      }
    } else {
      this.awardDefense(state, defenderId, {
        targetType: 'TERRITORY',
        targetId: target.id,
      });
    }

    const battle = {
      battleId: state.warState.battleHistory.length + 1,
      round: state.round,
      turnIndex: state.turnIndex,
      targetType: 'TERRITORY',
      attackerId,
      defenderId,
      targetTerritoryId: target.id,
      attackSources,
      adjacencyBypassed: ignoreAdjacency,
      winnerId,
      previousOwnerId,
      result: outcome.reason,
    };

    state.warState.battleHistory.push(battle);
    if (state.warState.activeAttack) {
      state.warState.activeAttack.phase = 'RESULT';
      state.warState.activeAttack.pendingQuestionResult = null;
      state.warState.activeAttack.lastQuestionResult = {
        winnerId,
        loserId: winnerId === attackerId ? defenderId : attackerId,
        result: outcome.reason,
      };
    }

    return { ...battle };
  }

  resolveBaseBattle({
    state,
    attackerId,
    targetBaseId,
    attackerCorrect,
    defenderCorrect,
    attackerElapsedMs = 0,
    defenderElapsedMs = 0,
    numericDuel = null,
  }) {
    this.assertWarCanAttack(state, attackerId);
    this.ensureAttackContext({
      state,
      attackerId,
      targetType: 'BASE',
      targetId: targetBaseId,
    });

    const base = state.bases.get(String(targetBaseId));
    if (!base) throw new Error(`Unknown base: ${targetBaseId}`);
    if (!base.isActiveBase) throw new Error('Captured base is now a former-base territory');
    if (base.ownerId === attackerId) throw new Error('Cannot attack own base');

    const ignoreAdjacency = this.ignoresAdjacency(state, attackerId, 'BASE');
    const attackSources = this.getBaseAttackSources(state, attackerId, targetBaseId);
    if (!ignoreAdjacency && attackSources.length === 0) {
      throw new Error('Base is not connected by a sea route to attacker territory');
    }

    const targetLayer = base.currentLayer;
    if (targetLayer == null) {
      throw new Error(`Base ${base.id} has no active defense layer`);
    }

    const defenderId = base.ownerId;
    const outcome = this.resolveQuizOutcome({
      attackerCorrect,
      defenderCorrect,
      attackerElapsedMs,
      defenderElapsedMs,
      numericDuel,
    });

    let destroyedLayer = null;
    let baseCaptured = false;

    if (outcome.winnerSide === 'ATTACKER') {
      destroyedLayer = base.destroyCurrentLayer();
      if (destroyedLayer === 'flag') {
        const originalOwnerId = base.originalOwnerId;
        base.convertToFormerBase(attackerId);
        baseCaptured = true;

        if (this.fameSystem) {
          this.fameSystem.award(
            state,
            attackerId,
            FAME_REWARDS.FIRST_BASE_CAPTURE,
            'FIRST_BASE_CAPTURE',
            { baseId: base.id },
          );

          if (!base.lossPenaltyApplied) {
            this.fameSystem.penalizeFloorZero(
              state,
              originalOwnerId,
              FAME_REWARDS.BASE_LOSS_PENALTY,
              'BASE_LOST',
              { baseId: base.id },
            );
            base.lossPenaltyApplied = true;
          }
        }
      }
    } else {
      this.awardDefense(state, defenderId, {
        targetType: 'BASE',
        targetId: base.id,
        targetLayer,
      });
    }

    const winnerId = outcome.winnerSide === 'ATTACKER'
      ? attackerId
      : defenderId;

    const battle = {
      battleId: state.warState.battleHistory.length + 1,
      round: state.round,
      turnIndex: state.turnIndex,
      targetType: 'BASE',
      attackerId,
      defenderId,
      targetBaseId: base.id,
      targetLayer,
      attackSources,
      adjacencyBypassed: ignoreAdjacency,
      winnerId,
      destroyedLayer,
      baseCaptured,
      continues: outcome.winnerSide === 'ATTACKER' && !baseCaptured,
      primaryQuestionType: 'MULTIPLE_CHOICE_4',
      numericDuelUsed: attackerCorrect && defenderCorrect,
      result: outcome.reason,
    };

    state.warState.battleHistory.push(battle);

    if (state.warState.activeAttack) {
      state.warState.activeAttack.pendingQuestionResult = null;
      state.warState.activeAttack.lastQuestionResult = {
        winnerId,
        loserId: winnerId === attackerId ? defenderId : attackerId,
        result: outcome.reason,
      };
      if (outcome.winnerSide === 'ATTACKER' && !baseCaptured) {
        state.warState.activeAttack.phase = 'QUESTION';
        state.warState.activeAttack.responses = {};
      } else {
        state.warState.activeAttack.phase = 'RESULT';
      }
    }

    return { ...battle };
  }

  resolveFormerBaseBattle({
    state,
    attackerId,
    targetBaseId,
    attackerCorrect,
    defenderCorrect,
    attackerElapsedMs = 0,
    defenderElapsedMs = 0,
    numericDuel = null,
  }) {
    this.assertWarCanAttack(state, attackerId);
    this.ensureAttackContext({
      state,
      attackerId,
      targetType: 'FORMER_BASE',
      targetId: targetBaseId,
    });
    const base = state.bases.get(String(targetBaseId));
    if (!base) throw new Error(`Unknown base: ${targetBaseId}`);
    if (base.isActiveBase) throw new Error('Target is still an active base');
    if (base.ownerId === attackerId) throw new Error('Cannot attack own territory');
    if (this.isBlackMarkBlocked(state, attackerId, base.ownerId, 'FORMER_BASE')) {
      throw new Error('Black Mark blocks this territory attack');
    }

    const ignoreAdjacency = this.ignoresAdjacency(state, attackerId, 'FORMER_BASE');
    const attackSources = this.getBaseAttackSources(state, attackerId, targetBaseId);
    if (!ignoreAdjacency && attackSources.length === 0) {
      throw new Error('Former base is not connected by a sea route to attacker territory');
    }

    const defenderId = base.ownerId;
    const outcome = this.resolveQuizOutcome({
      attackerCorrect,
      defenderCorrect,
      attackerElapsedMs,
      defenderElapsedMs,
      numericDuel,
    });

    const winnerId = outcome.winnerSide === 'ATTACKER'
      ? attackerId
      : defenderId;

    if (winnerId === attackerId) {
      base.captureFormerBase(attackerId);
      if (this.economySystem) {
        this.economySystem.credit({
          state,
          playerId: attackerId,
          amount: TERRITORY_CAPTURE_DUBLOONS,
          reason: 'FORMER_BASE_CAPTURE',
        });
      }
      if (this.fameSystem) {
        this.fameSystem.award(
          state,
          attackerId,
          FAME_REWARDS.FORMER_BASE_CAPTURE,
          'FORMER_BASE_CAPTURE',
          { baseId: base.id },
        );
      }
    } else {
      this.awardDefense(state, defenderId, {
        targetType: 'FORMER_BASE',
        targetId: base.id,
      });
    }

    const battle = {
      battleId: state.warState.battleHistory.length + 1,
      round: state.round,
      turnIndex: state.turnIndex,
      targetType: 'FORMER_BASE',
      attackerId,
      defenderId,
      targetBaseId: base.id,
      attackSources,
      adjacencyBypassed: ignoreAdjacency,
      winnerId,
      result: outcome.reason,
    };
    state.warState.battleHistory.push(battle);
    if (state.warState.activeAttack) {
      state.warState.activeAttack.pendingQuestionResult = null;
      state.warState.activeAttack.lastQuestionResult = {
        winnerId,
        loserId: winnerId === attackerId ? defenderId : attackerId,
        result: outcome.reason,
      };
      state.warState.activeAttack.phase = 'RESULT';
    }
    return { ...battle };
  }
}

import { GAME_STAGES } from '../constants.js';

function assertBoolean(value, label) {
  if (typeof value !== 'boolean') throw new Error(`${label} must be boolean`);
}

function assertFiniteNumber(value, label) {
  if (!Number.isFinite(value)) throw new Error(`${label} must be a finite number`);
}

export class CombatSystem {
  constructor({ map }) {
    if (!map) throw new Error('CombatSystem requires GameMap');
    this.map = map;
  }

  getAttackSources(state, attackerId, targetTerritoryId) {
    return [...state.territories.values()]
      .filter(territory => (
        territory.ownerId === attackerId
        && this.map.areAdjacent(territory.id, Number(targetTerritoryId))
      ))
      .map(territory => territory.id)
      .sort((a, b) => a - b);
  }

  getBaseAttackSources(state, attackerId, baseId) {
    return [...state.territories.values()]
      .filter(territory => (
        territory.ownerId === attackerId
        && this.map.areAdjacent(territory.id, String(baseId))
      ))
      .map(territory => territory.id)
      .sort((a, b) => a - b);
  }

  canAttackBase(state, attackerId, baseId) {
    if (state.stage !== GAME_STAGES.WAR) return false;
    if (!state.players.has(attackerId)) return false;
    if (state.currentPlayerId !== attackerId) return false;

    const neutralExists = [...state.territories.values()]
      .some(territory => territory.ownerId == null);
    if (neutralExists) return false;

    const base = state.bases.get(String(baseId));
    if (!base) return false;
    if (base.ownerId === attackerId) return false;
    if (base.isCaptured) return false;

    return this.getBaseAttackSources(state, attackerId, baseId).length > 0;
  }

  canAttackTerritory(state, attackerId, targetTerritoryId) {
    if (state.stage !== GAME_STAGES.WAR) return false;
    if (!state.players.has(attackerId)) return false;
    if (state.currentPlayerId !== attackerId) return false;

    const target = state.territories.get(Number(targetTerritoryId));
    if (!target) return false;
    if (target.ownerId == null) return false;
    if (target.ownerId === attackerId) return false;

    return this.getAttackSources(state, attackerId, targetTerritoryId).length > 0;
  }

  resolveNumericDuel({
    correctAnswer,
    attackerAnswer,
    defenderAnswer,
  }) {
    assertFiniteNumber(correctAnswer, 'correctAnswer');
    assertFiniteNumber(attackerAnswer, 'attackerAnswer');
    assertFiniteNumber(defenderAnswer, 'defenderAnswer');

    const attackerError = Math.abs(attackerAnswer - correctAnswer);
    const defenderError = Math.abs(defenderAnswer - correctAnswer);

    if (attackerError < defenderError) return 'ATTACKER';
    if (defenderError < attackerError) return 'DEFENDER';

    throw new Error('Numeric duel tie is unresolved by the current Rules v0.3 implementation');
  }

  resolveQuizOutcome({
    attackerCorrect,
    defenderCorrect,
    numericDuel = null,
  }) {
    assertBoolean(attackerCorrect, 'attackerCorrect');
    assertBoolean(defenderCorrect, 'defenderCorrect');

    if (attackerCorrect && !defenderCorrect) {
      return {
        winnerSide: 'ATTACKER',
        reason: 'ATTACKER_CORRECT_DEFENDER_WRONG',
      };
    }

    if (!attackerCorrect && defenderCorrect) {
      return {
        winnerSide: 'DEFENDER',
        reason: 'ATTACKER_WRONG_DEFENDER_CORRECT',
      };
    }

    if (!attackerCorrect && !defenderCorrect) {
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
        ? 'BOTH_CORRECT_NUMERIC_ATTACKER_CLOSER'
        : 'BOTH_CORRECT_NUMERIC_DEFENDER_CLOSER',
    };
  }

  resolveTerritoryBattle({
    state,
    attackerId,
    targetTerritoryId,
    attackerCorrect,
    defenderCorrect,
    numericDuel = null,
  }) {
    if (state.stage !== GAME_STAGES.WAR) {
      throw new Error('Territory battle can only be resolved during WAR');
    }

    const neutral = [...state.territories.values()]
      .filter(territory => territory.ownerId == null);

    if (neutral.length > 0) {
      throw new Error('WAR cannot contain neutral territories');
    }

    if (state.currentPlayerId !== attackerId) {
      throw new Error(`It is not ${attackerId}'s turn`);
    }

    const target = state.territories.get(Number(targetTerritoryId));
    if (!target) throw new Error(`Unknown territory: ${targetTerritoryId}`);
    if (target.ownerId == null) throw new Error('Cannot attack a neutral territory');
    if (target.ownerId === attackerId) throw new Error('Cannot attack own territory');

    const attackSources = this.getAttackSources(state, attackerId, targetTerritoryId);
    if (attackSources.length === 0) {
      throw new Error('Target is not connected by a sea route to attacker territory');
    }

    const defenderId = target.ownerId;
    const outcome = this.resolveQuizOutcome({
      attackerCorrect,
      defenderCorrect,
      numericDuel,
    });

    const previousOwnerId = target.ownerId;
    const winnerId = outcome.winnerSide === 'ATTACKER'
      ? attackerId
      : defenderId;

    target.ownerId = winnerId;

    const battle = {
      battleId: state.warState.battleHistory.length + 1,
      round: state.round,
      turnIndex: state.turnIndex,
      attackerId,
      defenderId,
      targetTerritoryId: target.id,
      attackSources,
      winnerId,
      previousOwnerId,
      result: outcome.reason,
    };

    state.warState.battleHistory.push(battle);

    return { ...battle };
  }

  resolveBaseBattle({
    state,
    attackerId,
    targetBaseId,
    attackerCorrect,
    defenderCorrect,
    numericDuel = null,
  }) {
    if (state.stage !== GAME_STAGES.WAR) {
      throw new Error('Base battle can only be resolved during WAR');
    }

    const neutral = [...state.territories.values()]
      .filter(territory => territory.ownerId == null);

    if (neutral.length > 0) {
      throw new Error('WAR cannot contain neutral territories');
    }

    if (state.currentPlayerId !== attackerId) {
      throw new Error(`It is not ${attackerId}'s turn`);
    }

    const base = state.bases.get(String(targetBaseId));
    if (!base) throw new Error(`Unknown base: ${targetBaseId}`);
    if (base.ownerId === attackerId) throw new Error('Cannot attack own base');
    if (base.isCaptured) throw new Error('Cannot attack an already captured base');

    const attackSources = this.getBaseAttackSources(state, attackerId, targetBaseId);
    if (attackSources.length === 0) {
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
      numericDuel,
    });

    let destroyedLayer = null;
    if (outcome.winnerSide === 'ATTACKER') {
      destroyedLayer = base.destroyCurrentLayer();
      if (destroyedLayer === 'flag') {
        base.capturedBy = attackerId;
      }
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
      winnerId,
      destroyedLayer,
      baseCaptured: base.isCaptured,
      primaryQuestionType: 'MULTIPLE_CHOICE_4',
      numericDuelUsed: attackerCorrect && defenderCorrect,
      result: outcome.reason,
    };

    state.warState.battleHistory.push(battle);

    return { ...battle };
  }
}

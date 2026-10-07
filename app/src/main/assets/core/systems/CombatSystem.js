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
}

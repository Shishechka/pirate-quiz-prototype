import {
  ECONOMY_PRICE_KEYS,
  FLAGSHIP_MAX_DAMAGE,
  FLAGSHIP_MAX_HP,
  FLAGSHIP_REPAIR_HP_COST,
  GAME_STAGES,
} from '../constants.js';

function getPlayer(state, playerId) {
  const player = state.players.get(playerId);
  if (!player) throw new Error(`Unknown player: ${playerId}`);
  return player;
}

export class FlagshipSystem {
  constructor({ economySystem }) {
    if (!economySystem) throw new Error('FlagshipSystem requires EconomySystem');
    this.economySystem = economySystem;
  }

  getFlagship(state, playerId) {
    return getPlayer(state, playerId).ship;
  }

  isPurchaseWindow(state, playerId) {
    if (state.stage === GAME_STAGES.PREPARATION) return true;
    if (state.stage === GAME_STAGES.WAR) {
      return state.currentPlayerId != null && state.currentPlayerId !== playerId;
    }
    return false;
  }

  assertUpgradeAllowed(state, playerId) {
    const ship = this.getFlagship(state, playerId);
    if (!this.isPurchaseWindow(state, playerId)) {
      throw new Error('Flagship upgrades are only allowed in PREPARATION or during another player turn');
    }
    if (ship.sunk || ship.hp <= 0) {
      throw new Error('Destroyed flagship cannot receive upgrades');
    }
    return ship;
  }

  getInstalledCrew(state, playerId) {
    return [...this.getFlagship(state, playerId).installedCrew];
  }

  canInstallCrew(state, playerId) {
    const ship = this.getFlagship(state, playerId);
    return ship.installedCrew.length < ship.crewSlots;
  }

  installCrew({ state, playerId, crewMember }) {
    if (crewMember == null) throw new Error('crewMember is required');
    const ship = this.getFlagship(state, playerId);
    if (ship.installedCrew.length >= ship.crewSlots) {
      throw new Error(`No free crew slot for ${playerId}`);
    }
    ship.installedCrew.push(crewMember);
    return [...ship.installedCrew];
  }

  canPurchaseHpUpgrade(state, playerId) {
    const ship = this.getFlagship(state, playerId);
    return (
      this.isPurchaseWindow(state, playerId)
      && !ship.sunk
      && ship.hp > 0
      && ship.maxHp < FLAGSHIP_MAX_HP
      && this.economySystem.canAffordPrice(
        state,
        playerId,
        ECONOMY_PRICE_KEYS.SHIP_HP_UPGRADE,
      )
    );
  }

  canPurchaseDamageUpgrade(state, playerId) {
    const ship = this.getFlagship(state, playerId);
    return (
      this.isPurchaseWindow(state, playerId)
      && !ship.sunk
      && ship.hp > 0
      && ship.dmg < FLAGSHIP_MAX_DAMAGE
      && this.economySystem.canAffordPrice(
        state,
        playerId,
        ECONOMY_PRICE_KEYS.SHIP_DAMAGE_UPGRADE,
      )
    );
  }

  canPurchaseCrewSlotUpgrade(state, playerId) {
    const ship = this.getFlagship(state, playerId);
    return (
      this.isPurchaseWindow(state, playerId)
      && !ship.sunk
      && ship.hp > 0
      && this.economySystem.canAffordPrice(
        state,
        playerId,
        ECONOMY_PRICE_KEYS.CREW_SLOT,
      )
    );
  }

  purchaseHpUpgrade({ state, playerId }) {
    const ship = this.assertUpgradeAllowed(state, playerId);
    if (ship.maxHp >= FLAGSHIP_MAX_HP) {
      throw new Error(`Flagship MaxHP cannot exceed ${FLAGSHIP_MAX_HP}`);
    }

    const transaction = this.economySystem.spendPrice({
      state,
      playerId,
      priceKey: ECONOMY_PRICE_KEYS.SHIP_HP_UPGRADE,
      reason: 'FLAGSHIP_HP_UPGRADE',
    });

    ship.maxHp += 1;
    ship.hp += 1;
    ship.upgrades.hp += 1;

    return {
      transaction,
      hp: ship.hp,
      maxHp: ship.maxHp,
      upgradeCount: ship.upgrades.hp,
    };
  }

  purchaseDamageUpgrade({ state, playerId }) {
    const ship = this.assertUpgradeAllowed(state, playerId);
    if (ship.dmg >= FLAGSHIP_MAX_DAMAGE) {
      throw new Error(`Flagship Damage cannot exceed ${FLAGSHIP_MAX_DAMAGE}`);
    }

    const transaction = this.economySystem.spendPrice({
      state,
      playerId,
      priceKey: ECONOMY_PRICE_KEYS.SHIP_DAMAGE_UPGRADE,
      reason: 'FLAGSHIP_DAMAGE_UPGRADE',
    });

    ship.dmg += 1;
    ship.upgrades.damage += 1;

    return {
      transaction,
      damage: ship.dmg,
      upgradeCount: ship.upgrades.damage,
    };
  }

  purchaseCrewSlotUpgrade({ state, playerId }) {
    const ship = this.assertUpgradeAllowed(state, playerId);

    const transaction = this.economySystem.spendPrice({
      state,
      playerId,
      priceKey: ECONOMY_PRICE_KEYS.CREW_SLOT,
      reason: 'FLAGSHIP_CREW_SLOT_UPGRADE',
    });

    ship.crewSlots += 1;
    ship.upgrades.crewSlots += 1;

    return {
      transaction,
      crewSlots: ship.crewSlots,
      upgradeCount: ship.upgrades.crewSlots,
    };
  }

  destroyFlagship({ state, playerId }) {
    const player = getPlayer(state, playerId);
    const ship = player.ship;
    const lostCrew = [...ship.installedCrew];

    ship.hp = 0;
    ship.sunk = true;
    ship.installedCrew = [];

    const base = state.bases.get(player.baseId);
    const canReturnToBase = (
      base != null
      && base.isActiveBase
      && base.ownerId === playerId
      && base.originalOwnerId === playerId
    );

    ship.pos = canReturnToBase ? player.baseId : null;

    return {
      playerId,
      returnedToBase: canReturnToBase,
      position: ship.pos,
      lostCrew,
    };
  }

  repairHp({ state, playerId, points = 1 }) {
    if (!Number.isInteger(points) || points <= 0) {
      throw new Error('Repair points must be a positive integer');
    }

    const player = getPlayer(state, playerId);
    const ship = player.ship;
    const base = state.bases.get(player.baseId);

    if (!ship.sunk || ship.hp !== 0) {
      throw new Error('Paid repair is for a destroyed flagship returned with 0 HP');
    }
    if (
      base == null
      || !base.isActiveBase
      || base.ownerId !== playerId
      || ship.pos !== player.baseId
    ) {
      throw new Error('Destroyed flagship has no active own base for repair');
    }

    const actualPoints = Math.min(points, ship.maxHp - ship.hp);
    if (actualPoints <= 0) throw new Error('Flagship is already at MaxHP');

    const transaction = this.economySystem.spend({
      state,
      playerId,
      amount: actualPoints * FLAGSHIP_REPAIR_HP_COST,
      reason: 'FLAGSHIP_REPAIR',
    });

    ship.hp += actualPoints;
    if (ship.hp > 0) ship.sunk = false;

    return {
      transaction,
      hp: ship.hp,
      maxHp: ship.maxHp,
      repaired: actualPoints,
    };
  }

  restoreHpFromBoost({ state, playerId, points }) {
    if (!Number.isInteger(points) || points <= 0) {
      throw new Error('Boost repair points must be a positive integer');
    }
    const ship = this.getFlagship(state, playerId);
    if (ship.sunk || ship.hp <= 0) {
      throw new Error('Repair Kit cannot revive a destroyed flagship');
    }
    const before = ship.hp;
    ship.hp = Math.min(ship.maxHp, ship.hp + points);
    return {
      restored: ship.hp - before,
      hp: ship.hp,
      maxHp: ship.maxHp,
    };
  }

  isAvailableForAttack(state, playerId) {
    return this.getFlagship(state, playerId).isOperational;
  }

  moveFlagship({ state, playerId, targetNodeId }) {
    if (state.stage !== GAME_STAGES.WAR) {
      throw new Error('Flagship movement is only relevant during WAR');
    }

    const ship = this.getFlagship(state, playerId);
    if (!ship.isOperational) throw new Error('Destroyed flagship cannot move');

    const numericId = Number(targetNodeId);
    const territory = Number.isInteger(numericId)
      ? state.territories.get(numericId)
      : null;
    const base = state.bases.get(String(targetNodeId));

    const ownsTarget = (
      territory?.ownerId === playerId
      || base?.ownerId === playerId
    );

    if (!ownsTarget) {
      throw new Error('Flagship can move freely only across own territory');
    }

    ship.pos = territory ? territory.id : base.id;
    return ship.pos;
  }
}

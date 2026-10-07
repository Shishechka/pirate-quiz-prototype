import { ECONOMY_PRICE_KEYS } from '../constants.js';

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
    return this.economySystem.canAffordPrice(
      state,
      playerId,
      ECONOMY_PRICE_KEYS.SHIP_HP_UPGRADE,
    );
  }

  canPurchaseDamageUpgrade(state, playerId) {
    return this.economySystem.canAffordPrice(
      state,
      playerId,
      ECONOMY_PRICE_KEYS.SHIP_DAMAGE_UPGRADE,
    );
  }

  canPurchaseCrewSlotUpgrade(state, playerId) {
    return this.economySystem.canAffordPrice(
      state,
      playerId,
      ECONOMY_PRICE_KEYS.CREW_SLOT,
    );
  }

  purchaseHpUpgrade({ state, playerId }) {
    const transaction = this.economySystem.spendPrice({
      state,
      playerId,
      priceKey: ECONOMY_PRICE_KEYS.SHIP_HP_UPGRADE,
      reason: 'FLAGSHIP_HP_UPGRADE',
    });

    const ship = this.getFlagship(state, playerId);
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
    const transaction = this.economySystem.spendPrice({
      state,
      playerId,
      priceKey: ECONOMY_PRICE_KEYS.SHIP_DAMAGE_UPGRADE,
      reason: 'FLAGSHIP_DAMAGE_UPGRADE',
    });

    const ship = this.getFlagship(state, playerId);
    ship.dmg += 1;
    ship.upgrades.damage += 1;

    return {
      transaction,
      damage: ship.dmg,
      upgradeCount: ship.upgrades.damage,
    };
  }

  purchaseCrewSlotUpgrade({ state, playerId }) {
    const transaction = this.economySystem.spendPrice({
      state,
      playerId,
      priceKey: ECONOMY_PRICE_KEYS.CREW_SLOT,
      reason: 'FLAGSHIP_CREW_SLOT_UPGRADE',
    });

    const ship = this.getFlagship(state, playerId);
    ship.crewSlots += 1;
    ship.upgrades.crewSlots += 1;

    return {
      transaction,
      crewSlots: ship.crewSlots,
      upgradeCount: ship.upgrades.crewSlots,
    };
  }
}

import {
  CREW_SELL_DUBLOONS,
  CREW_TYPES,
  ECONOMY_PRICE_KEYS,
} from '../constants.js';

function getPlayer(state, playerId) {
  const player = state.players.get(playerId);
  if (!player) throw new Error(`Unknown player: ${playerId}`);
  return player;
}

export class CrewSystem {
  constructor({ economySystem, flagshipSystem }) {
    if (!economySystem) throw new Error('CrewSystem requires EconomySystem');
    if (!flagshipSystem) throw new Error('CrewSystem requires FlagshipSystem');
    this.economySystem = economySystem;
    this.flagshipSystem = flagshipSystem;
  }

  assertKnownCrewType(crewType) {
    if (!Object.values(CREW_TYPES).includes(crewType)) {
      throw new Error(`Unknown crew type: ${crewType}`);
    }
  }

  getAllOwnedCrew(state, playerId) {
    const player = getPlayer(state, playerId);
    return [
      ...player.crewReserve,
      ...player.ship.installedCrew,
    ];
  }

  assertAtActiveOwnBase(state, playerId) {
    const player = getPlayer(state, playerId);
    const base = state.bases.get(player.baseId);
    if (
      base == null
      || !base.isActiveBase
      || base.ownerId !== playerId
      || player.ship.pos !== player.baseId
    ) {
      throw new Error('Crew can only be changed at the player active base');
    }
  }

  purchaseCrew({ state, playerId, crewType }) {
    this.assertKnownCrewType(crewType);
    if (!this.flagshipSystem.isPurchaseWindow(state, playerId)) {
      throw new Error('Crew purchases are only allowed in a purchase window');
    }
    if (this.getAllOwnedCrew(state, playerId).includes(crewType)) {
      throw new Error('Duplicate crew members cannot be purchased');
    }

    const transaction = this.economySystem.spendPrice({
      state,
      playerId,
      priceKey: ECONOMY_PRICE_KEYS.CREW_MEMBER,
      reason: `CREW_PURCHASE_${crewType}`,
    });
    getPlayer(state, playerId).crewReserve.push(crewType);

    return {
      crewType,
      transaction,
    };
  }

  installCrew({ state, playerId, crewType }) {
    this.assertKnownCrewType(crewType);
    this.assertAtActiveOwnBase(state, playerId);

    const player = getPlayer(state, playerId);
    if (!player.crewReserve.includes(crewType)) {
      throw new Error('Crew member is not in reserve');
    }
    if (player.ship.installedCrew.length >= player.ship.crewSlots) {
      throw new Error('No free crew slot');
    }

    player.crewReserve = player.crewReserve.filter(type => type !== crewType);
    player.ship.installedCrew.push(crewType);

    return [...player.ship.installedCrew];
  }

  uninstallCrew({ state, playerId, crewType }) {
    this.assertKnownCrewType(crewType);
    this.assertAtActiveOwnBase(state, playerId);

    const player = getPlayer(state, playerId);
    if (!player.ship.installedCrew.includes(crewType)) {
      throw new Error('Crew member is not installed');
    }

    player.ship.installedCrew = player.ship.installedCrew
      .filter(type => type !== crewType);
    player.crewReserve.push(crewType);

    return [...player.crewReserve];
  }

  sellCrew({ state, playerId, crewType }) {
    this.assertKnownCrewType(crewType);
    this.assertAtActiveOwnBase(state, playerId);

    const player = getPlayer(state, playerId);
    if (!player.crewReserve.includes(crewType)) {
      throw new Error('Only reserve crew can be sold');
    }

    player.crewReserve = player.crewReserve.filter(type => type !== crewType);
    const transaction = this.economySystem.credit({
      state,
      playerId,
      amount: CREW_SELL_DUBLOONS,
      reason: `CREW_SALE_${crewType}`,
    });

    return {
      crewType,
      transaction,
    };
  }
}

export class Ship {
  constructor({
    hp = 3,
    maxHp = 3,
    dmg = 1,
    crewSlots = 1,
    installedCrew = [],
    upgrades = null,
    pos = null,
    sunk = false,
  } = {}) {
    if (!Number.isInteger(hp) || hp < 0) throw new Error('Ship.hp must be a non-negative integer');
    if (!Number.isInteger(maxHp) || maxHp < 1) throw new Error('Ship.maxHp must be a positive integer');
    if (hp > maxHp) throw new Error('Ship.hp cannot exceed Ship.maxHp');
    if (!Number.isInteger(dmg) || dmg < 1) throw new Error('Ship.dmg must be a positive integer');
    if (!Number.isInteger(crewSlots) || crewSlots < 1) {
      throw new Error('Ship.crewSlots must be a positive integer');
    }
    if (!Array.isArray(installedCrew)) throw new Error('Ship.installedCrew must be an array');
    if (installedCrew.length > crewSlots) {
      throw new Error('Installed crew cannot exceed available crew slots');
    }

    this.hp = hp;
    this.maxHp = maxHp;
    this.dmg = dmg;
    this.crewSlots = crewSlots;
    this.installedCrew = [...installedCrew];
    this.upgrades = {
      hp: 0,
      damage: 0,
      crewSlots: 0,
      ...(upgrades ?? {}),
    };

    // Legacy-compatible state only. Destruction/return rules are intentionally
    // not implemented in FlagshipSystem until Rules v0.3 defines them.
    this.pos = pos;
    this.sunk = sunk;
  }
}

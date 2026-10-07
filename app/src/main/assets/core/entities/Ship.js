export class Ship {
  constructor({
    hp = 3,
    maxHp = 3,
    dmg = 1,
    pos = null,
    sunk = false,
  } = {}) {
    this.hp = hp;
    this.maxHp = maxHp;
    this.dmg = dmg;
    this.pos = pos;
    this.sunk = sunk;
  }
}

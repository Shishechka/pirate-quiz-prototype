import { Ship } from './Ship.js';

export class Player {
  constructor({
    id,
    baseId,
    coins = 20,
    flags = 0,
    ship = null,
    secret = 1,
  }) {
    if (!id) throw new Error('Player.id is required');
    if (!baseId) throw new Error('Player.baseId is required');

    this.id = id;
    this.baseId = baseId;
    this.coins = coins;
    this.flags = flags;
    this.ship = ship instanceof Ship ? ship : new Ship(ship ?? { pos: baseId });
    this.secret = secret;
  }
}

import { BOOST_TYPES } from '../constants.js';
import { Ship } from './Ship.js';

export class Player {
  constructor({
    id,
    baseId,
    coins = 20,
    flags = 0,
    ship = null,
    boosts = null,
    secret = 1,
    crewReserve = [],
  }) {
    if (!id) throw new Error('Player.id is required');
    if (!baseId) throw new Error('Player.baseId is required');

    this.id = id;
    this.baseId = baseId;
    this.coins = coins;
    this.flags = flags;
    this.ship = ship instanceof Ship ? ship : new Ship(ship ?? { pos: baseId });
    this.crewReserve = [...crewReserve];

    this.boosts = {
      [BOOST_TYPES.SECRET_ROUTE]: secret,
      ...(boosts ?? {}),
    };

    Object.defineProperty(this, 'secret', {
      enumerable: true,
      configurable: false,
      get: () => this.boosts[BOOST_TYPES.SECRET_ROUTE] ?? 0,
      set: value => {
        this.boosts[BOOST_TYPES.SECRET_ROUTE] = value;
      },
    });
  }
}

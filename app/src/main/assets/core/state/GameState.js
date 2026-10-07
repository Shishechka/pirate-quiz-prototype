export class GameState {
  constructor({
    players,
    territories,
    bases,
    turnOrders,
    round = 1,
    turnIndex = 0,
    finished = false,
  }) {
    this.players = players;
    this.territories = territories;
    this.bases = bases;
    this.turnOrders = turnOrders;
    this.round = round;
    this.turnIndex = turnIndex;
    this.finished = finished;
  }
}

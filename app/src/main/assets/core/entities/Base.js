export class Base {
  constructor({
    id,
    ownerId,
    remainingLayers = 3,
    capturedBy = null,
    connections = [],
  }) {
    if (!id) throw new Error('Base.id is required');
    if (!ownerId) throw new Error('Base.ownerId is required');

    this.id = id;
    this.ownerId = ownerId;
    this.remainingLayers = remainingLayers;
    this.capturedBy = capturedBy;
    this.connections = [...connections];
  }
}

export class Territory {
  constructor({
    id,
    level,
    ownerId = null,
    connections = [],
    firstCaptureResolved = null,
  }) {
    if (!Number.isInteger(id)) throw new Error('Territory.id must be an integer');
    if (![1, 2, 3].includes(level)) throw new Error('Territory.level must be 1, 2 or 3');

    this.id = id;
    this.level = level;
    this.ownerId = ownerId;
    this.connections = [...connections];
    this.firstCaptureResolved = firstCaptureResolved ?? ownerId != null;
  }
}

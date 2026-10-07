export const BASE_LAYER_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  DESTROYED: 'DESTROYED',
});

export const BASE_LAYER_SEQUENCE = Object.freeze([
  'fort',
  'harbor',
  'flag',
]);

function createLayersFromRemaining(remainingLayers) {
  if (!Number.isInteger(remainingLayers) || remainingLayers < 0 || remainingLayers > 3) {
    throw new Error('Base.remainingLayers must be an integer from 0 to 3');
  }

  const destroyedCount = 3 - remainingLayers;
  return Object.fromEntries(
    BASE_LAYER_SEQUENCE.map((layer, index) => [
      layer,
      index < destroyedCount
        ? BASE_LAYER_STATUS.DESTROYED
        : BASE_LAYER_STATUS.ACTIVE,
    ]),
  );
}

function validateLayers(layers) {
  const normalized = {};
  for (const layer of BASE_LAYER_SEQUENCE) {
    const status = layers?.[layer];
    if (!Object.values(BASE_LAYER_STATUS).includes(status)) {
      throw new Error(`Invalid base layer status for ${layer}: ${status}`);
    }
    normalized[layer] = status;
  }
  return normalized;
}

export class Base {
  constructor({
    id,
    ownerId,
    originalOwnerId = ownerId,
    remainingLayers = 3,
    layers = null,
    capturedBy = null,
    captureCount = 0,
    isActiveBase = true,
    lossPenaltyApplied = false,
    connections = [],
  }) {
    if (!id) throw new Error('Base.id is required');
    if (!ownerId) throw new Error('Base.ownerId is required');
    if (!originalOwnerId) throw new Error('Base.originalOwnerId is required');

    this.id = id;
    this.ownerId = ownerId;
    this.originalOwnerId = originalOwnerId;
    this.layers = layers == null
      ? createLayersFromRemaining(remainingLayers)
      : validateLayers(layers);
    this.capturedBy = capturedBy;
    this.captureCount = captureCount;
    this.isActiveBase = isActiveBase;
    this.lossPenaltyApplied = lossPenaltyApplied;
    this.connections = [...connections];

    if (!this.isActiveBase) {
      this.layers = Object.fromEntries(
        BASE_LAYER_SEQUENCE.map(layer => [layer, BASE_LAYER_STATUS.DESTROYED]),
      );
    }
  }

  get remainingLayers() {
    return BASE_LAYER_SEQUENCE.filter(
      layer => this.layers[layer] === BASE_LAYER_STATUS.ACTIVE,
    ).length;
  }

  set remainingLayers(value) {
    this.layers = createLayersFromRemaining(value);
  }

  get currentLayer() {
    if (!this.isActiveBase) return null;
    return BASE_LAYER_SEQUENCE.find(
      layer => this.layers[layer] === BASE_LAYER_STATUS.ACTIVE,
    ) ?? null;
  }

  get isCaptured() {
    return !this.isActiveBase;
  }

  destroyCurrentLayer() {
    if (!this.isActiveBase) throw new Error(`Base ${this.id} is no longer an active base`);
    const layer = this.currentLayer;
    if (layer == null) throw new Error(`Base ${this.id} has no active defense layer`);

    this.layers[layer] = BASE_LAYER_STATUS.DESTROYED;
    return layer;
  }

  restoreFort() {
    if (!this.isActiveBase) throw new Error('Cannot restore Fort after full base loss');
    this.layers.fort = BASE_LAYER_STATUS.ACTIVE;
    return this.layers.fort;
  }

  convertToFormerBase(newOwnerId) {
    if (!newOwnerId) throw new Error('newOwnerId is required');
    this.ownerId = newOwnerId;
    this.capturedBy = newOwnerId;
    this.captureCount += 1;
    this.isActiveBase = false;
    this.layers = Object.fromEntries(
      BASE_LAYER_SEQUENCE.map(layer => [layer, BASE_LAYER_STATUS.DESTROYED]),
    );
  }

  captureFormerBase(newOwnerId) {
    if (this.isActiveBase) throw new Error('Active base must be captured through its defense layers');
    if (!newOwnerId) throw new Error('newOwnerId is required');
    this.ownerId = newOwnerId;
    this.capturedBy = newOwnerId;
    this.captureCount += 1;
  }
}

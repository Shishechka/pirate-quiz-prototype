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

  let activeSeen = false;
  for (const layer of BASE_LAYER_SEQUENCE) {
    if (normalized[layer] === BASE_LAYER_STATUS.ACTIVE) {
      activeSeen = true;
      continue;
    }
    if (activeSeen) {
      throw new Error('Base layers must be destroyed sequentially: Fort → Harbor → Flag');
    }
  }

  return normalized;
}

export class Base {
  constructor({
    id,
    ownerId,
    remainingLayers = 3,
    layers = null,
    capturedBy = null,
    connections = [],
  }) {
    if (!id) throw new Error('Base.id is required');
    if (!ownerId) throw new Error('Base.ownerId is required');

    this.id = id;
    this.ownerId = ownerId;
    this.layers = layers == null
      ? createLayersFromRemaining(remainingLayers)
      : validateLayers(layers);
    this.capturedBy = capturedBy;
    this.connections = [...connections];

    if (
      this.capturedBy != null
      && this.layers.flag !== BASE_LAYER_STATUS.DESTROYED
    ) {
      throw new Error('Captured base must have destroyed Captain Flag');
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
    return BASE_LAYER_SEQUENCE.find(
      layer => this.layers[layer] === BASE_LAYER_STATUS.ACTIVE,
    ) ?? null;
  }

  get isCaptured() {
    return (
      this.layers.flag === BASE_LAYER_STATUS.DESTROYED
      && this.capturedBy != null
    );
  }

  destroyCurrentLayer() {
    const layer = this.currentLayer;
    if (layer == null) throw new Error(`Base ${this.id} has no active defense layer`);

    this.layers[layer] = BASE_LAYER_STATUS.DESTROYED;
    return layer;
  }
}

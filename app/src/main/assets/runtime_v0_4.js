import { createCoreGame } from './core/index.js';
import {
  ARCHIPELAGO_QUESTION_TIME_LIMIT_MS,
  BOOST_TYPES,
  CORE_VERSION,
  CREW_TYPES,
  GAME_STAGES,
  PLAYER_IDS,
  QUESTION_TYPES,
  RULES_VERSION,
  TERRITORY_COUNT,
  WAR_QUESTION_TIME_LIMIT_MS,
  territoryLevel,
} from './core/constants.js';

const HUMAN = 'R';
const COLORS = Object.freeze({
  R: '#ef5a50',
  B: '#4c91ff',
  G: '#43c279',
  P: '#b46cff',
  NEUTRAL: '#8d826d',
});

const MCQ = [
  ['Какая планета ближе всего к Солнцу?', ['Венера', 'Земля', 'Меркурий', 'Марс'], 2],
  ['Столица Канады?', ['Торонто', 'Оттава', 'Монреаль', 'Ванкувер'], 1],
  ['Какой элемент имеет символ Ag?', ['Золото', 'Серебро', 'Аргон', 'Алюминий'], 1],
  ['Какой океан самый большой?', ['Атлантический', 'Индийский', 'Тихий', 'Северный Ледовитый'], 2],
  ['Сколько планет в Солнечной системе?', ['7', '8', '9', '10'], 1],
  ['Какой газ преобладает в атмосфере Земли?', ['Кислород', 'Азот', 'Водород', 'Аргон'], 1],
  ['Какой металл обозначается Fe?', ['Медь', 'Железо', 'Олово', 'Серебро'], 1],
  ['Столица Австралии?', ['Сидней', 'Канберра', 'Мельбурн', 'Перт'], 1],
  ['Сколько спутников у Марса?', ['1', '2', '3', '4'], 1],
  ['Какой элемент обозначается K?', ['Кальций', 'Калий', 'Кобальт', 'Кремний'], 1],
  ['Кто написал «Войну и мир»?', ['Достоевский', 'Толстой', 'Чехов', 'Пушкин'], 1],
  ['Какой материк самый большой?', ['Африка', 'Европа', 'Азия', 'Южная Америка'], 2],
  ['Столица Японии?', ['Осака', 'Киото', 'Токио', 'Нагоя'], 2],
  ['Сколько сторон у шестиугольника?', ['5', '6', '7', '8'], 1],
  ['Как называется процесс превращения воды в пар?', ['Конденсация', 'Испарение', 'Замерзание', 'Сублимация'], 1],
];

const NUMERIC = [
  ['В каком году человек впервые высадился на Луне?', 1969],
  ['Сколько минут в сутках?', 1440],
  ['Сколько километров примерно в земном экваторе?', 40075],
  ['В каком году началась Вторая мировая война?', 1939],
  ['Сколько костей обычно у взрослого человека?', 206],
  ['Сколько стран-членов было в ООН при её основании?', 51],
  ['Высота Эвереста в метрах примерно?', 8849],
  ['Сколько элементов в современной периодической таблице?', 118],
];

const BASE_POS = {
  A: { x: 250, y: 125 },
  B: { x: 1350, y: 125 },
  C: { x: 250, y: 755 },
  D: { x: 1350, y: 755 },
};
const COL_X = [455, 590, 725, 875, 1010, 1145];
const ROW_Y = [190, 280, 370, 460, 550, 640];
const JITTER_X = [0,-9,8,10,-8,6,8,5,-11,9,-5,8,-6,10,-9,7,9,-7,5,-7,8,-8,11,-6,9,-8,6,8,-10,5,-4,9,-7,7,-8,6];
const JITTER_Y = [0,4,-4,3,-5,4,-4,5,2,-5,4,-3,4,-4,6,-5,3,0,-4,4,-5,3,5,-3,4,-4,4,-3,5,-4,-3,4,-4,3,-4,3];

const $ = id => document.getElementById(id);
const pick = values => values[Math.floor(Math.random() * values.length)];
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

let game = null;
let sessionId = 0;
let humanPhase = 'SETTLEMENT';
let archQuestionStartMs = 0;
let battleQuestionStartMs = 0;
let countdownTimer = null;
let preparationTimer = null;
let visualPatchLoaded = false;
let lastLog = [];

function isCurrentSession(id) {
  return id === sessionId;
}

function clearRuntimeTimers() {
  if (countdownTimer != null) clearInterval(countdownTimer);
  if (preparationTimer != null) clearInterval(preparationTimer);
  countdownTimer = null;
  preparationTimer = null;
}

function log(message) {
  lastLog.unshift(message);
  lastLog = lastLog.slice(0, 30);
  const root = $('log');
  if (root) {
    root.innerHTML = '';
    for (const entry of lastLog) {
      const row = document.createElement('div');
      row.textContent = entry;
      root.appendChild(row);
    }
  }
}

function positionOf(nodeId) {
  if (typeof nodeId === 'string') return BASE_POS[nodeId];
  const index = Number(nodeId) - 1;
  const row = Math.floor(index / 6);
  const col = index % 6;
  return {
    x: COL_X[col] + JITTER_X[index],
    y: ROW_Y[row] + JITTER_Y[index],
  };
}

function fitMap() {
  const viewport = $('mapViewport');
  const scene = $('mapScene');
  if (!viewport || !scene) return;

  const scale = Math.min(
    viewport.clientWidth / 1600,
    viewport.clientHeight / 900,
  );
  const tx = (viewport.clientWidth - 1600 * scale) / 2;
  const ty = (viewport.clientHeight - 900 * scale) / 2;
  scene.style.transform = `translate(${tx}px,${ty}px) scale(${scale})`;
}

function ownerColor(ownerId) {
  return COLORS[ownerId] ?? COLORS.NEUTRAL;
}

function compatProjection() {
  const state = game.state;
  const players = {};
  for (const playerId of PLAYER_IDS) {
    const player = state.players.get(playerId);
    players[playerId] = {
      coins: player.coins,
      flags: player.flags,
      ship: {
        hp: player.ship.hp,
        maxHp: player.ship.maxHp,
        dmg: player.ship.dmg,
        pos: player.ship.pos,
        sunk: player.ship.sunk,
      },
      secret: player.boosts[BOOST_TYPES.SECRET_ROUTE] ?? 0,
    };
  }

  const owners = {};
  for (const [id, territory] of state.territories) {
    owners[id] = territory.ownerId;
  }

  const bases = {};
  const captured = {};
  for (const [id, base] of state.bases) {
    bases[id] = base.remainingLayers;
    captured[id] = base.isActiveBase ? null : base.ownerId;
  }

  return {
    round: state.round,
    orders: state.turnOrders,
    order: state.currentTurnOrder,
    idx: state.warState.tiebreak?.active
      ? state.warState.tiebreak.turnIndex
      : state.turnIndex,
    owners,
    bases,
    captured,
    players,
    finished: state.finished,
  };
}

function syncGlobals() {
  window.S = compatProjection();
  window.lv = territoryLevel;
  window.fame = playerId => game.fameSystem.getFame(game.state, playerId);
  window.__pirateRuntime = {
    coreVersion: CORE_VERSION,
    rulesVersion: RULES_VERSION,
    get stage() { return game?.state.stage ?? null; },
    get state() { return game?.state ?? null; },
  };
}

function renderRoutes() {
  const svg = $('routeSvg');
  if (!svg || !game) return;
  svg.innerHTML = '';

  const seen = new Set();
  for (const [sourceKey, neighbors] of game.map.adjacency) {
    const source = /^\d+$/.test(sourceKey) ? Number(sourceKey) : sourceKey;
    for (const target of neighbors) {
      const key = [String(source), String(target)].sort().join('|');
      if (seen.has(key)) continue;
      seen.add(key);

      const a = positionOf(source);
      const b = positionOf(target);
      if (!a || !b) continue;

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', a.x);
      line.setAttribute('y1', a.y);
      line.setAttribute('x2', b.x);
      line.setAttribute('y2', b.y);
      line.setAttribute('class', 'route');
      svg.appendChild(line);
    }
  }
}

function stageLabel() {
  if (!game) return '';
  const state = game.state;
  if (state.finished) return 'Финал';
  if (state.stage === GAME_STAGES.ARCHIPELAGO) {
    return `Освоение · раунд ${state.round}/6`;
  }
  if (state.stage === GAME_STAGES.PREPARATION) {
    return 'Подготовка к войне';
  }
  if (state.stage === GAME_STAGES.WAR) {
    if (state.warState.tiebreak?.active) return 'Дополнительный раунд';
    return `Морская война · раунд ${state.round}/8`;
  }
  return state.stage;
}

function statusText() {
  const state = game.state;
  if (state.finished) {
    const winners = state.resultState.winnerIds.join(', ');
    return winners ? `Победитель: ${winners}` : 'Игра окончена';
  }

  if (state.stage === GAME_STAGES.ARCHIPELAGO) {
    if (humanPhase === 'READY_TO_START') {
      return 'Карта готова · нажми «Начать освоение»';
    }
    const claimant = game.archipelagoSystem.getCurrentClaimPlayerId(state);
    if (claimant === HUMAN) return 'Выбери доступный нейтральный остров';
    if (state.archipelagoState.pendingTieGroups.length > 0) {
      return 'Дополнительный числовой вопрос';
    }
    return 'Освоение архипелага';
  }

  if (state.stage === GAME_STAGES.PREPARATION) {
    const deadline = state.preparationState.deadlineAtMs;
    const seconds = deadline == null
      ? 60
      : Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    return `Подготовка · ${seconds} сек`;
  }

  if (state.stage === GAME_STAGES.WAR) {
    const current = state.currentPlayerId;
    if (current !== HUMAN) return `Ход игрока ${current}`;
    if (!game.flagshipSystem.isAvailableForAttack(state, HUMAN)) {
      return 'Флагман недоступен · можно пропустить ход';
    }
    if (humanPhase === 'MOVE') return 'Твой ход · перемести флагман или переходи к атаке';
    if (humanPhase === 'ATTACK') return 'Выбери цель атаки или пропусти ход';
    if (humanPhase === 'POST') return 'Атака завершена · перегруппируйся или заверши ход';
    return 'Твой ход';
  }

  return '';
}

function currentClaimableSet() {
  if (
    game.state.stage !== GAME_STAGES.ARCHIPELAGO
    || game.archipelagoSystem.getCurrentClaimPlayerId(game.state) !== HUMAN
  ) {
    return new Set();
  }
  return new Set(game.archipelagoSystem.getClaimableTerritoryIds(game.state, HUMAN));
}

function currentAttackableSets() {
  const territories = new Set();
  const bases = new Set();

  if (
    game.state.stage !== GAME_STAGES.WAR
    || game.state.currentPlayerId !== HUMAN
    || humanPhase !== 'ATTACK'
    || game.state.warState.turnActionUsed
  ) {
    return { territories, bases };
  }

  for (let id = 1; id <= TERRITORY_COUNT; id++) {
    if (
      game.combatSystem.canAttackTerritory(game.state, HUMAN, id)
      && !game.combatSystem.getDefendingFlagship(
        game.state,
        game.state.territories.get(id)?.ownerId,
        id,
      )
    ) {
      territories.add(id);
    }
  }

  for (const [baseId, base] of game.state.bases) {
    const legal = base.isActiveBase
      ? game.combatSystem.canAttackBase(game.state, HUMAN, baseId)
      : game.combatSystem.canAttackFormerBase(game.state, HUMAN, baseId);

    if (
      legal
      && !game.combatSystem.getDefendingFlagship(
        game.state,
        base.ownerId,
        baseId,
      )
    ) {
      bases.add(baseId);
    }
  }

  return { territories, bases };
}

function renderMap() {
  const state = game.state;
  const mapRoot = $('map');
  if (!mapRoot) return;
  mapRoot.innerHTML = '';

  const claimable = currentClaimableSet();
  const attackable = currentAttackableSets();
  const movable = (
    state.stage === GAME_STAGES.WAR
    && state.currentPlayerId === HUMAN
    && (humanPhase === 'MOVE' || humanPhase === 'POST')
  );

  for (let id = 1; id <= TERRITORY_COUNT; id++) {
    const territory = state.territories.get(id);
    const button = document.createElement('button');
    const level = territory.level;
    button.className = `tile l${level}`;
    button.dataset.id = String(id);
    button.style.setProperty('--owner', ownerColor(territory.ownerId));

    const pos = positionOf(id);
    button.style.left = `${pos.x}px`;
    button.style.top = `${pos.y}px`;

    const islandNo = document.createElement('span');
    islandNo.className = 'islandNo';
    islandNo.textContent = `${id} · ${'I'.repeat(level)}`;
    button.appendChild(islandNo);

    if (claimable.has(id) || attackable.territories.has(id)) {
      button.classList.add('legal');
    }
    if (movable && territory.ownerId === HUMAN) {
      button.classList.add('movable');
    }

    for (const playerId of PLAYER_IDS) {
      const ship = state.players.get(playerId).ship;
      if (!ship.sunk && String(ship.pos) === String(id)) {
        const icon = document.createElement('span');
        icon.className = playerId === HUMAN ? 'ship' : 'ship enemyShip';
        icon.textContent = playerId === HUMAN ? '🚢' : '⛵';
        button.appendChild(icon);
      }
    }

    mapRoot.appendChild(button);
  }

  for (const [baseId, base] of state.bases) {
    const button = document.querySelector(`[data-base="${baseId}"]`);
    if (!button) continue;

    const pos = positionOf(baseId);
    button.style.left = `${pos.x}px`;
    button.style.top = `${pos.y}px`;
    button.style.setProperty('--baseColor', ownerColor(base.ownerId));
    button.classList.toggle('legal', attackable.bases.has(baseId));
    button.classList.toggle(
      'movable',
      movable && base.ownerId === HUMAN,
    );

    const layers = base.isActiveBase
      ? `${base.remainingLayers}/3`
      : 'остров · +4 славы';
    button.innerHTML = `<span class="baseMeta">${baseId} · ${layers}</span>`;

    for (const playerId of PLAYER_IDS) {
      const ship = state.players.get(playerId).ship;
      if (!ship.sunk && String(ship.pos) === baseId) {
        const icon = document.createElement('span');
        icon.className = playerId === HUMAN ? 'ship' : 'ship enemyShip';
        icon.textContent = playerId === HUMAN ? '🚢' : '⛵';
        button.appendChild(icon);
      }
    }
  }
}

function renderTimeline() {
  const root = $('turnTimeline');
  if (!root) return;
  root.innerHTML = '';

  for (let roundIndex = 0; roundIndex < 8; roundIndex++) {
    const group = document.createElement('div');
    group.className = 'roundTrack';
    group.dataset.round = String(roundIndex + 1);

    const order = game.state.turnOrders[roundIndex] ?? [];
    order.forEach((playerId, turnIndex) => {
      const mark = document.createElement('span');
      mark.className = 'turnMark';
      mark.style.setProperty('--mark', COLORS[playerId]);

      if (game.state.stage === GAME_STAGES.WAR && !game.state.warState.tiebreak?.active) {
        if (
          roundIndex < game.state.round - 1
          || (
            roundIndex === game.state.round - 1
            && turnIndex < game.state.turnIndex
          )
        ) {
          mark.classList.add('done');
        }
        if (
          !game.state.finished
          && roundIndex === game.state.round - 1
          && turnIndex === game.state.turnIndex
        ) {
          mark.classList.add('current');
        }
      }

      group.appendChild(mark);
    });

    root.appendChild(group);
  }
}

function atActiveOwnBase(playerId) {
  const player = game.state.players.get(playerId);
  const base = game.state.bases.get(player.baseId);
  return Boolean(
    base
    && base.isActiveBase
    && base.ownerId === playerId
    && String(player.ship.pos) === player.baseId
  );
}

function renderCrewButton() {
  const button = $('crewBtn');
  if (!button) return;
  const player = game.state.players.get(HUMAN);
  button.textContent = `Экипаж · ${player.ship.installedCrew.length}/${player.ship.crewSlots}`;
}

function renderShipPanel() {
  const player = game.state.players.get(HUMAN);
  const ship = player.ship;
  const stats = $('shipStats');
  if (stats) {
    stats.textContent = [
      `HP ${ship.hp}/${ship.maxHp}`,
      `Урон ${ship.dmg}`,
      `Слоты ${ship.installedCrew.length}/${ship.crewSlots}`,
      `Дублоны ${player.coins}`,
    ].join(' · ');
  }

  const hpButton = $('hpBtn');
  const dmgButton = $('dmgBtn');
  const slotButton = $('slotBtn');

  if (hpButton) {
    if (ship.sunk && ship.hp === 0 && ship.pos === player.baseId) {
      hpButton.textContent = '+1 HP ремонт · 20';
      hpButton.disabled = player.coins < 20;
    } else {
      hpButton.textContent = '+ MaxHP · 20';
      hpButton.disabled = !game.flagshipSystem.canPurchaseHpUpgrade(
        game.state,
        HUMAN,
      );
    }
  }

  if (dmgButton) {
    dmgButton.textContent = '+ Урон · 30';
    dmgButton.disabled = !game.flagshipSystem.canPurchaseDamageUpgrade(
      game.state,
      HUMAN,
    );
  }

  if (slotButton) {
    slotButton.textContent = '+ Слот · 30';
    slotButton.disabled = !game.flagshipSystem.canPurchaseCrewSlotUpgrade(
      game.state,
      HUMAN,
    );
  }

  renderCrewButton();
}

function boostMeta(type) {
  const table = {
    [BOOST_TYPES.SMALL_CHEST]: ['🧰', 'Малый сундук'],
    [BOOST_TYPES.LARGE_CHEST]: ['📦', 'Большой сундук'],
    [BOOST_TYPES.TREASURE]: ['💰', 'Клад'],
    [BOOST_TYPES.REPAIR_KIT]: ['🔧', 'Ремкомплект'],
    [BOOST_TYPES.RECON]: ['🔭', 'Разведка'],
    [BOOST_TYPES.SECRET_ROUTE]: ['🗺', 'Тайный путь'],
    [BOOST_TYPES.DOUBLE_VOLLEY]: ['💥', 'Двойной залп'],
    [BOOST_TYPES.FORT_RESTORATION]: ['🏰', 'Восстановление форта'],
    [BOOST_TYPES.BLACK_MARK]: ['☠', 'Чёрная метка'],
    [BOOST_TYPES.SECOND_CHANCE]: ['↻', 'Второй шанс'],
    [BOOST_TYPES.COMPASS]: ['🧭', 'Компас'],
    [BOOST_TYPES.PARROT]: ['🦜', 'Попугай'],
    [BOOST_TYPES.POWDER_KEG]: ['🧨', 'Пороховая бочка'],
    [BOOST_TYPES.SPARE_ANCHOR]: ['⚓', 'Запасной якорь'],
    [BOOST_TYPES.MERCENARY]: ['🗡', 'Наёмник'],
    [BOOST_TYPES.SPYGLASS]: ['🔎', 'Подзорная труба'],
    [BOOST_TYPES.CURSED_SKULL]: ['💀', 'Проклятый череп'],
  };
  return table[type] ?? ['?', type];
}

function renderBoostButtons() {
  const bottom = document.querySelector('.bottomHud');
  const secret = $('secretBtn');
  if (!bottom || !secret) return;

  let stack = $('rightBoosts');
  if (!stack) {
    stack = document.createElement('div');
    stack.id = 'rightBoosts';
    bottom.appendChild(stack);
  }

  if (secret.parentElement !== stack) stack.appendChild(secret);

  const secretCount = game.boostSystem.getInventoryCount(
    game.state,
    HUMAN,
    BOOST_TYPES.SECRET_ROUTE,
  );
  secret.innerHTML = `🗺<small>×${secretCount}</small>`;
  secret.title = 'Карта тайного пути';
  secret.disabled = !(
    game.state.stage === GAME_STAGES.WAR
    && game.state.currentPlayerId === HUMAN
    && humanPhase === 'ATTACK'
    && secretCount > 0
    && !game.boostSystem.hasPlayerUsedBoost(game.state, HUMAN)
    && !game.state.warState.turnActionUsed
  );

  stack.querySelectorAll('[data-runtime-boost]').forEach(node => node.remove());

  const player = game.state.players.get(HUMAN);
  for (const [type, count] of Object.entries(player.boosts)) {
    if (type === BOOST_TYPES.SECRET_ROUTE || count <= 0) continue;

    const [icon, label] = boostMeta(type);
    const button = document.createElement('button');
    button.className = 'boostBtn';
    button.dataset.runtimeBoost = type;
    button.innerHTML = `${icon}<small>×${count}</small>`;
    button.title = label;

    const unresolved = [
      BOOST_TYPES.COMPASS,
      BOOST_TYPES.PARROT,
      BOOST_TYPES.POWDER_KEG,
      BOOST_TYPES.SPARE_ANCHOR,
      BOOST_TYPES.MERCENARY,
      BOOST_TYPES.SPYGLASS,
      BOOST_TYPES.CURSED_SKULL,
    ].includes(type);

    const damageBlocked = type === BOOST_TYPES.DOUBLE_VOLLEY;
    const reactiveOnly = type === BOOST_TYPES.SECOND_CHANCE;
    button.disabled = unresolved || damageBlocked || reactiveOnly || !(
      game.state.stage === GAME_STAGES.WAR
      && game.state.currentPlayerId === HUMAN
      && !game.boostSystem.hasPlayerUsedBoost(game.state, HUMAN)
    );
    button.onclick = () => useHumanBoost(type);
    stack.appendChild(button);
  }
}

function renderCoreUi() {
  if (!game) return;
  syncGlobals();
  renderRoutes();
  renderMap();
  renderTimeline();
  renderShipPanel();
  renderBoostButtons();
  fitMap();

  const player = game.state.players.get(HUMAN);
  $('coinsV').textContent = String(player.coins);
  $('fameV').textContent = String(game.fameSystem.getFame(game.state, HUMAN));
  $('shipV').textContent = `${player.ship.hp}/${player.ship.maxHp} · ${player.ship.dmg}`;
  $('roundV').textContent = stageLabel();
  $('status').textContent = statusText();

  const mode = $('modeBtn');
  if (
    game.state.stage === GAME_STAGES.ARCHIPELAGO
    && humanPhase === 'READY_TO_START'
  ) {
    mode.textContent = '▶ Начать освоение';
    mode.disabled = false;
  } else if (game.state.stage === GAME_STAGES.PREPARATION) {
    mode.textContent = '✓ Готов';
    mode.disabled = game.state.preparationState.readyPlayerIds.includes(HUMAN);
  } else if (
    game.state.stage === GAME_STAGES.WAR
    && game.state.currentPlayerId === HUMAN
  ) {
    if (humanPhase === 'MOVE') mode.textContent = '⚔ К атаке';
    if (humanPhase === 'ATTACK') mode.textContent = '⏭ Пропустить ход';
    if (humanPhase === 'POST') mode.textContent = '✓ Завершить ход';
    mode.disabled = false;
  } else {
    mode.textContent = game.state.stage === GAME_STAGES.ARCHIPELAGO
      ? 'Освоение'
      : 'Ход соперника';
    mode.disabled = true;
  }
}

function draw() {
  if (typeof window.render === 'function') {
    window.render();
  } else {
    renderCoreUi();
  }
}

function showOverlay() {
  $('questionOverlay').classList.add('show');
}

function hideOverlay() {
  $('questionOverlay').classList.remove('show');
  $('answers').innerHTML = '';
  $('numericBox').style.display = 'none';
  $('answers').style.display = 'grid';
  $('battleResult').textContent = '';
  $('nInput').value = '';
}

function configureOverlay({
  meta = '',
  title = '',
  numeric = false,
}) {
  $('battleMeta').textContent = meta;
  $('qText').textContent = title;
  $('battleResult').textContent = '';
  $('answers').innerHTML = '';
  $('answers').style.display = numeric ? 'none' : 'grid';
  $('numericBox').style.display = numeric ? 'block' : 'none';
  $('nInput').value = '';
  showOverlay();
}

function startCountdown({
  limitMs,
  startedAtMs,
  onTimeout,
}) {
  if (countdownTimer != null) clearInterval(countdownTimer);

  const update = () => {
    const elapsed = Date.now() - startedAtMs;
    const remaining = Math.max(0, limitMs - elapsed);
    const seconds = (remaining / 1000).toFixed(1);
    const prefix = $('battleMeta').dataset.baseMeta ?? '';
    $('battleMeta').textContent = `${prefix} · ${seconds} сек`;
    if (remaining <= 0) {
      clearInterval(countdownTimer);
      countdownTimer = null;
      onTimeout();
    }
  };

  update();
  countdownTimer = setInterval(update, 100);
}

function randomBotElapsed(limitMs = WAR_QUESTION_TIME_LIMIT_MS) {
  return 500 + Math.floor(Math.random() * Math.max(1, limitMs - 1000));
}

function randomBotNumeric(correctAnswer) {
  const spread = Math.max(4, Math.round(Math.abs(correctAnswer) * 0.08));
  return correctAnswer + Math.floor(Math.random() * (spread * 2 + 1)) - spread;
}

function botMcqCorrect() {
  return Math.random() < 0.62;
}

function archipelagoBotResponses(correctAnswer, playerIds = PLAYER_IDS) {
  const responses = {};
  for (const playerId of playerIds) {
    if (playerId === HUMAN) continue;
    responses[playerId] = {
      value: randomBotNumeric(correctAnswer),
      elapsedMs: randomBotElapsed(ARCHIPELAGO_QUESTION_TIME_LIMIT_MS),
    };
  }
  return responses;
}

async function startArchipelagoQuestion() {
  const id = sessionId;
  if (!isCurrentSession(id) || game.state.stage !== GAME_STAGES.ARCHIPELAGO) return;

  const question = pick(NUMERIC);
  const responses = archipelagoBotResponses(question[1]);
  archQuestionStartMs = Date.now();

  configureOverlay({
    meta: `Освоение · раунд ${game.state.round}/6`,
    title: question[0],
    numeric: true,
  });
  $('nText').textContent = 'Введи целое число. После отправки ответ изменить нельзя.';
  $('battleMeta').dataset.baseMeta = `Освоение · раунд ${game.state.round}/6`;

  let submitted = false;
  const complete = async humanValue => {
    if (submitted || !isCurrentSession(id)) return;
    submitted = true;
    if (countdownTimer != null) clearInterval(countdownTimer);
    countdownTimer = null;

    if (humanValue !== undefined) {
      responses[HUMAN] = {
        value: humanValue,
        elapsedMs: Math.min(
          Date.now() - archQuestionStartMs,
          ARCHIPELAGO_QUESTION_TIME_LIMIT_MS,
        ),
      };
    }

    $('nSend').disabled = true;
    const result = game.archipelagoSystem.beginRound({
      state: game.state,
      question: question[0],
      correctAnswer: question[1],
      responses,
    });

    if (result.requiresTieBreak) {
      await resolveArchipelagoTie(result.tiedPlayerIds);
      return;
    }

    hideOverlay();
    $('nSend').disabled = false;
    await processArchipelagoClaims();
  };

  $('nSend').disabled = false;
  $('nSend').onclick = () => {
    const raw = $('nInput').value.trim();
    const value = /^-?\d+$/.test(raw) ? Number(raw) : Number.NaN;
    complete(value);
  };
  $('nInput').onkeydown = event => {
    if (event.key === 'Enter') $('nSend').click();
  };

  startCountdown({
    limitMs: ARCHIPELAGO_QUESTION_TIME_LIMIT_MS,
    startedAtMs: archQuestionStartMs,
    onTimeout: () => complete(undefined),
  });
}

async function resolveArchipelagoTie(tiedPlayerIds) {
  const id = sessionId;
  if (!isCurrentSession(id)) return;

  const question = pick(NUMERIC);
  const responses = archipelagoBotResponses(question[1], tiedPlayerIds);
  const humanTied = tiedPlayerIds.includes(HUMAN);

  configureOverlay({
    meta: `Дополнительный вопрос · ${tiedPlayerIds.join(', ')}`,
    title: question[0],
    numeric: true,
  });
  $('nText').textContent = humanTied
    ? 'Ответь целым числом. Вопрос только для игроков с полной ничьёй.'
    : 'Ты наблюдаешь. Отвечают только игроки с полной ничьёй.';
  $('nInput').disabled = !humanTied;
  $('nSend').disabled = !humanTied;
  $('battleMeta').dataset.baseMeta = `Дополнительный вопрос · ${tiedPlayerIds.join(', ')}`;

  const startedAt = Date.now();

  const finish = async humanValue => {
    if (!isCurrentSession(id)) return;
    if (countdownTimer != null) clearInterval(countdownTimer);
    countdownTimer = null;

    if (humanTied && humanValue !== undefined) {
      responses[HUMAN] = {
        value: humanValue,
        elapsedMs: Math.min(
          Date.now() - startedAt,
          ARCHIPELAGO_QUESTION_TIME_LIMIT_MS,
        ),
      };
    }

    const result = game.archipelagoSystem.resolveTieBreak({
      state: game.state,
      question: question[0],
      correctAnswer: question[1],
      responses,
    });

    if (result.requiresTieBreak) {
      await delay(350);
      await resolveArchipelagoTie(result.tiedPlayerIds);
      return;
    }

    $('nInput').disabled = false;
    $('nSend').disabled = false;
    hideOverlay();
    await processArchipelagoClaims();
  };

  if (humanTied) {
    let sent = false;
    $('nSend').onclick = () => {
      if (sent) return;
      sent = true;
      const raw = $('nInput').value.trim();
      const value = /^-?\d+$/.test(raw) ? Number(raw) : Number.NaN;
      finish(value);
    };
    startCountdown({
      limitMs: ARCHIPELAGO_QUESTION_TIME_LIMIT_MS,
      startedAtMs: startedAt,
      onTimeout: () => finish(undefined),
    });
  } else {
    await delay(900);
    await finish(undefined);
  }
}

async function processArchipelagoClaims() {
  const id = sessionId;
  while (
    isCurrentSession(id)
    && game.state.stage === GAME_STAGES.ARCHIPELAGO
  ) {
    const claimant = game.archipelagoSystem.getCurrentClaimPlayerId(game.state);
    if (!claimant) break;

    if (claimant === HUMAN) {
      humanPhase = 'CLAIM';
      draw();
      return;
    }

    const choices = game.archipelagoSystem.getClaimableTerritoryIds(
      game.state,
      claimant,
    );
    if (choices.length === 0) throw new Error(`No claimable island for ${claimant}`);

    const territoryId = pick(choices);
    const claim = game.archipelagoSystem.claimTerritory({
      state: game.state,
      territoryId,
    });
    log(`${claimant} осваивает остров ${territoryId}.`);
    if (claim.boostGranted) {
      log(`${claimant} получает буст ${boostMeta(claim.boostType)[1]}.`);
    }
    draw();
    await delay(220);
  }

  if (!isCurrentSession(id)) return;

  if (game.state.stage === GAME_STAGES.PREPARATION) {
    enterPreparation();
    return;
  }

  if (game.state.stage === GAME_STAGES.ARCHIPELAGO) {
    humanPhase = 'SETTLEMENT';
    await delay(400);
    startArchipelagoQuestion();
  }
}

function claimHumanTerritory(territoryId) {
  if (
    game.state.stage !== GAME_STAGES.ARCHIPELAGO
    || game.archipelagoSystem.getCurrentClaimPlayerId(game.state) !== HUMAN
  ) {
    return;
  }

  if (!game.archipelagoSystem.canClaimTerritory(game.state, HUMAN, territoryId)) {
    log('Этот остров сейчас нельзя выбрать.');
    return;
  }

  const claim = game.archipelagoSystem.claimTerritory({
    state: game.state,
    territoryId,
  });
  log(`Ты осваиваешь остров ${territoryId}.`);
  if (claim.boostGranted) {
    log(`Получен буст: ${boostMeta(claim.boostType)[1]}.`);
  }
  draw();
  processArchipelagoClaims();
}

function enterPreparation() {
  if (preparationTimer != null) clearInterval(preparationTimer);

  for (const botId of PLAYER_IDS.filter(id => id !== HUMAN)) {
    if (
      game.state.stage === GAME_STAGES.PREPARATION
      && !game.state.preparationState.readyPlayerIds.includes(botId)
    ) {
      game.stageSystem.markPlayerReady(game.state, botId, { nowMs: Date.now() });
    }
  }

  humanPhase = 'PREPARATION';
  log('Подготовка к войне: 60 секунд. Игроки готовятся одновременно.');
  draw();

  preparationTimer = setInterval(() => {
    if (game.state.stage !== GAME_STAGES.PREPARATION) {
      clearInterval(preparationTimer);
      preparationTimer = null;
      return;
    }

    const result = game.stageSystem.checkPreparationTimeout(
      game.state,
      { nowMs: Date.now() },
    );
    draw();
    if (result.startedWar) {
      clearInterval(preparationTimer);
      preparationTimer = null;
      enterWar();
    }
  }, 250);
}

function humanReady() {
  if (game.state.stage !== GAME_STAGES.PREPARATION) return;
  const result = game.stageSystem.markPlayerReady(
    game.state,
    HUMAN,
    { nowMs: Date.now() },
  );
  draw();
  if (result.stage === GAME_STAGES.WAR) {
    if (preparationTimer != null) clearInterval(preparationTimer);
    preparationTimer = null;
    enterWar();
  }
}

function enterWar() {
  hideOverlay();
  humanPhase = 'WAIT';
  log('Морская война началась. У каждого игрока 8 обычных ходов.');
  draw();
  setTimeout(runCurrentTurn, 300);
}

function currentPlayer() {
  return game.state.currentPlayerId;
}

function ownNodes(playerId) {
  const nodes = [];
  for (const territory of game.state.territories.values()) {
    if (territory.ownerId === playerId) nodes.push(territory.id);
  }
  for (const base of game.state.bases.values()) {
    if (base.ownerId === playerId) nodes.push(base.id);
  }
  return nodes;
}

function beginHumanTurn() {
  humanPhase = 'MOVE';
  log('Твой ход.');
  draw();
}

function endCurrentTurn() {
  const result = game.turnSystem.advance(game.state);
  hideOverlay();

  if (game.state.finished) {
    humanPhase = 'FINISHED';
    showFinal();
    draw();
    return;
  }

  humanPhase = 'WAIT';
  draw();
  setTimeout(runCurrentTurn, result.advancedRound ? 500 : 250);
}

function skipHumanTurn() {
  if (
    game.state.stage !== GAME_STAGES.WAR
    || game.state.currentPlayerId !== HUMAN
  ) return;
  log('Ты пропускаешь ход.');
  endCurrentTurn();
}

function runCurrentTurn() {
  if (game.state.finished) {
    showFinal();
    return;
  }

  const playerId = currentPlayer();
  if (playerId === HUMAN) {
    beginHumanTurn();
    return;
  }

  humanPhase = 'WAIT';
  draw();
  runBotTurn(playerId);
}

function botLegalTargets(playerId) {
  const choices = [];

  for (let id = 1; id <= TERRITORY_COUNT; id++) {
    if (!game.combatSystem.canAttackTerritory(game.state, playerId, id)) continue;
    const defenderId = game.state.territories.get(id).ownerId;
    if (game.combatSystem.getDefendingFlagship(game.state, defenderId, id)) continue;
    choices.push({ type: 'TERRITORY', id });
  }

  for (const [baseId, base] of game.state.bases) {
    const legal = base.isActiveBase
      ? game.combatSystem.canAttackBase(game.state, playerId, baseId)
      : game.combatSystem.canAttackFormerBase(game.state, playerId, baseId);
    if (!legal) continue;
    if (game.combatSystem.getDefendingFlagship(game.state, base.ownerId, baseId)) continue;
    choices.push({
      type: base.isActiveBase ? 'BASE' : 'FORMER_BASE',
      id: baseId,
    });
  }

  return choices;
}

async function runBotTurn(playerId) {
  const id = sessionId;
  await delay(450);
  if (!isCurrentSession(id) || currentPlayer() !== playerId) return;

  const ship = game.state.players.get(playerId).ship;
  if (ship.isOperational) {
    const nodes = ownNodes(playerId);
    if (nodes.length > 0 && Math.random() < 0.65) {
      try {
        game.flagshipSystem.moveFlagship({
          state: game.state,
          playerId,
          targetNodeId: pick(nodes),
        });
      } catch {
        // Random AI movement is best-effort only.
      }
    }
  }

  const targets = botLegalTargets(playerId);
  if (targets.length === 0 || Math.random() < 0.12) {
    log(`${playerId} пропускает ход.`);
    endCurrentTurn();
    return;
  }

  const target = pick(targets);
  startAttack(playerId, target.type, target.id);
}

function moveHumanFlagship(targetNodeId) {
  if (
    game.state.stage !== GAME_STAGES.WAR
    || currentPlayer() !== HUMAN
    || !['MOVE', 'POST'].includes(humanPhase)
  ) return;

  try {
    game.flagshipSystem.moveFlagship({
      state: game.state,
      playerId: HUMAN,
      targetNodeId,
    });
    log(`Флагман перемещён: ${targetNodeId}.`);
    draw();
  } catch (error) {
    log(error.message);
  }
}

function startHumanAttack(type, targetId) {
  if (
    game.state.stage !== GAME_STAGES.WAR
    || currentPlayer() !== HUMAN
    || humanPhase !== 'ATTACK'
  ) return;

  let defenderId = null;
  if (type === 'TERRITORY') {
    defenderId = game.state.territories.get(Number(targetId))?.ownerId ?? null;
  } else {
    defenderId = game.state.bases.get(String(targetId))?.ownerId ?? null;
  }

  if (
    defenderId
    && game.combatSystem.getDefendingFlagship(
      game.state,
      defenderId,
      targetId,
    )
  ) {
    log('На цели стоит флагман защитника. Точная Damage→HP механика пока не определена Rules v0.4.');
    return;
  }

  startAttack(HUMAN, type, targetId);
}

function startAttack(attackerId, targetType, targetId) {
  try {
    let attack;
    if (targetType === 'TERRITORY') {
      attack = game.combatSystem.beginTerritoryAttack({
        state: game.state,
        attackerId,
        targetTerritoryId: targetId,
      });
    } else if (targetType === 'BASE') {
      attack = game.combatSystem.beginBaseAttack({
        state: game.state,
        attackerId,
        targetBaseId: targetId,
      });
    } else {
      attack = game.combatSystem.beginFormerBaseAttack({
        state: game.state,
        attackerId,
        targetBaseId: targetId,
      });
    }

    if (attack.phase === 'DEFENDING_FLAGSHIP') {
      log('Атака остановлена: точная Damage→HP механика флагманов ещё не определена.');
      return;
    }

    log(`${attackerId} атакует ${targetId}.`);
    askBattleMcq();
  } catch (error) {
    log(error.message);
    draw();
    if (attackerId !== HUMAN) setTimeout(endCurrentTurn, 300);
  }
}

function battleParticipantMeta() {
  const attack = game.state.warState.activeAttack;
  return `${attack.attackerId} атакует ${attack.defenderId} · цель ${attack.targetId}`;
}

function setBattleMetaBase(text) {
  $('battleMeta').dataset.baseMeta = text;
  $('battleMeta').textContent = text;
}

function askBattleMcq() {
  const attack = game.state.warState.activeAttack;
  if (!attack || attack.phase !== 'QUESTION') return;

  const question = pick(MCQ);
  const humanParticipates = attack.eligibleResponderIds.includes(HUMAN);
  const botAnswers = {};

  for (const playerId of attack.eligibleResponderIds) {
    if (playerId === HUMAN) continue;
    botAnswers[playerId] = {
      correct: botMcqCorrect(),
      elapsedMs: randomBotElapsed(),
    };
  }

  configureOverlay({
    meta: battleParticipantMeta(),
    title: question[0],
    numeric: false,
  });
  setBattleMetaBase(battleParticipantMeta());

  let completed = false;
  battleQuestionStartMs = Date.now();

  const finish = humanResult => {
    if (completed) return;
    completed = true;
    if (countdownTimer != null) clearInterval(countdownTimer);
    countdownTimer = null;

    const attacker = attack.attackerId;
    const defender = attack.defenderId;

    const attackerData = attacker === HUMAN
      ? humanResult
      : botAnswers[attacker];
    const defenderData = defender === HUMAN
      ? humanResult
      : botAnswers[defender];

    if (attackerData.correct && defenderData.correct) {
      askBattleNumeric({
        attackerCorrect: true,
        defenderCorrect: true,
        attackerMcqElapsedMs: attackerData.elapsedMs,
        defenderMcqElapsedMs: defenderData.elapsedMs,
      });
      return;
    }

    previewBattleResult({
      attackerCorrect: attackerData.correct,
      defenderCorrect: defenderData.correct,
      attackerElapsedMs: attackerData.elapsedMs,
      defenderElapsedMs: defenderData.elapsedMs,
      numericDuel: null,
    });
  };

  question[1].forEach((answer, index) => {
    const button = document.createElement('button');
    button.className = 'answer';
    button.textContent = answer;
    button.disabled = !humanParticipates;
    if (humanParticipates) {
      button.onclick = () => {
        const elapsedMs = Date.now() - battleQuestionStartMs;
        document.querySelectorAll('#answers .answer').forEach(item => {
          item.disabled = true;
        });
        finish({
          correct: index === question[2],
          elapsedMs,
        });
      };
    }
    $('answers').appendChild(button);
  });

  if (humanParticipates) {
    startCountdown({
      limitMs: WAR_QUESTION_TIME_LIMIT_MS,
      startedAtMs: battleQuestionStartMs,
      onTimeout: () => finish({
        correct: false,
        elapsedMs: WAR_QUESTION_TIME_LIMIT_MS + 1,
      }),
    });
  } else {
    setTimeout(() => finish(null), 950);
  }
}

function askBattleNumeric({
  attackerCorrect,
  defenderCorrect,
  attackerMcqElapsedMs,
  defenderMcqElapsedMs,
}) {
  const attack = game.state.warState.activeAttack;
  const question = pick(NUMERIC);
  const humanParticipates = attack.eligibleResponderIds.includes(HUMAN);
  const botAnswers = {};

  for (const playerId of attack.eligibleResponderIds) {
    if (playerId === HUMAN) continue;
    botAnswers[playerId] = {
      value: randomBotNumeric(question[1]),
      elapsedMs: randomBotElapsed(),
    };
  }

  configureOverlay({
    meta: `${battleParticipantMeta()} · числовая дуэль`,
    title: question[0],
    numeric: true,
  });
  $('nText').textContent = humanParticipates
    ? 'Введи целое число.'
    : 'Ты наблюдаешь числовую дуэль.';
  $('nInput').disabled = !humanParticipates;
  $('nSend').disabled = !humanParticipates;
  setBattleMetaBase(`${battleParticipantMeta()} · числовая дуэль`);

  let completed = false;
  battleQuestionStartMs = Date.now();

  const finish = humanData => {
    if (completed) return;
    completed = true;
    if (countdownTimer != null) clearInterval(countdownTimer);
    countdownTimer = null;

    const attackerNumeric = attack.attackerId === HUMAN
      ? humanData
      : botAnswers[attack.attackerId];
    const defenderNumeric = attack.defenderId === HUMAN
      ? humanData
      : botAnswers[attack.defenderId];

    previewBattleResult({
      attackerCorrect,
      defenderCorrect,
      attackerElapsedMs: attackerMcqElapsedMs,
      defenderElapsedMs: defenderMcqElapsedMs,
      numericDuel: {
        correctAnswer: question[1],
        attackerAnswer: attackerNumeric?.value,
        defenderAnswer: defenderNumeric?.value,
        attackerElapsedMs: attackerNumeric?.elapsedMs ?? WAR_QUESTION_TIME_LIMIT_MS + 1,
        defenderElapsedMs: defenderNumeric?.elapsedMs ?? WAR_QUESTION_TIME_LIMIT_MS + 1,
      },
    });
  };

  if (humanParticipates) {
    $('nSend').onclick = () => {
      const raw = $('nInput').value.trim();
      const value = /^-?\d+$/.test(raw) ? Number(raw) : Number.NaN;
      $('nSend').disabled = true;
      finish({
        value,
        elapsedMs: Date.now() - battleQuestionStartMs,
      });
    };
    $('nInput').onkeydown = event => {
      if (event.key === 'Enter') $('nSend').click();
    };

    startCountdown({
      limitMs: WAR_QUESTION_TIME_LIMIT_MS,
      startedAtMs: battleQuestionStartMs,
      onTimeout: () => finish({
        value: Number.NaN,
        elapsedMs: WAR_QUESTION_TIME_LIMIT_MS + 1,
      }),
    });
  } else {
    setTimeout(() => finish(null), 950);
  }
}

function previewBattleResult(payload) {
  const attack = game.state.warState.activeAttack;
  const pending = game.combatSystem.previewActiveQuestionOutcome({
    state: game.state,
    ...payload,
  });

  const loser = pending.loserId;
  const secondChanceCount = game.boostSystem.getInventoryCount(
    game.state,
    loser,
    BOOST_TYPES.SECOND_CHANCE,
  );
  const canUseSecondChance = (
    secondChanceCount > 0
    && !game.boostSystem.hasPlayerUsedBoost(game.state, loser)
  );

  if (!canUseSecondChance) {
    commitBattleResult();
    return;
  }

  if (loser === HUMAN) {
    configureOverlay({
      meta: battleParticipantMeta(),
      title: 'Ты проиграл вопрос. Использовать «Второй шанс»?',
      numeric: false,
    });
    const use = document.createElement('button');
    use.className = 'answer';
    use.textContent = '↻ Использовать Второй шанс';
    use.onclick = () => {
      game.boostSystem.useBoost({
        state: game.state,
        playerId: HUMAN,
        boostType: BOOST_TYPES.SECOND_CHANCE,
      });
      askBattleMcq();
      draw();
    };
    const accept = document.createElement('button');
    accept.className = 'answer';
    accept.textContent = 'Принять результат';
    accept.onclick = commitBattleResult;
    $('answers').append(use, accept);
    return;
  }

  if (Math.random() < 0.5) {
    game.boostSystem.useBoost({
      state: game.state,
      playerId: loser,
      boostType: BOOST_TYPES.SECOND_CHANCE,
    });
    log(`${loser} использует «Второй шанс».`);
    setTimeout(askBattleMcq, 600);
    return;
  }

  commitBattleResult();
}

function commitBattleResult() {
  let result;
  try {
    result = game.combatSystem.commitActiveQuestionResult(game.state);
  } catch (error) {
    log(error.message);
    hideOverlay();
    draw();
    return;
  }

  $('battleResult').textContent = `Победитель: ${result.winnerId}`;
  log(`Бой за ${result.targetTerritoryId ?? result.targetBaseId}: победил ${result.winnerId}.`);
  draw();

  if (result.continues) {
    setTimeout(() => {
      $('battleResult').textContent = '';
      askBattleMcq();
    }, 700);
    return;
  }

  setTimeout(finishAttack, 700);
}

function finishAttack() {
  hideOverlay();
  const current = currentPlayer();
  if (current === HUMAN) {
    humanPhase = 'POST';
    draw();
  } else {
    endCurrentTurn();
  }
}

function useHumanBoost(type) {
  if (
    game.state.stage !== GAME_STAGES.WAR
    || currentPlayer() !== HUMAN
  ) return;

  if (type === BOOST_TYPES.BLACK_MARK) {
    openBlackMarkTargets();
    return;
  }

  try {
    const result = game.boostSystem.useBoost({
      state: game.state,
      playerId: HUMAN,
      boostType: type,
    });
    log(`Использован буст: ${boostMeta(type)[1]}.`);
    if (result?.transaction) {
      log(`Баланс: ${game.state.players.get(HUMAN).coins} дублонов.`);
    }
    draw();
  } catch (error) {
    log(error.message);
    draw();
  }
}

function openBlackMarkTargets() {
  configureOverlay({
    meta: 'Чёрная метка',
    title: 'Выбери противника',
    numeric: false,
  });

  for (const playerId of PLAYER_IDS.filter(id => id !== HUMAN)) {
    const button = document.createElement('button');
    button.className = 'answer';
    button.textContent = playerId;
    button.onclick = () => {
      try {
        game.boostSystem.useBoost({
          state: game.state,
          playerId: HUMAN,
          boostType: BOOST_TYPES.BLACK_MARK,
          targetPlayerId: playerId,
        });
        log(`Чёрная метка наложена на ${playerId}.`);
        hideOverlay();
        draw();
      } catch (error) {
        log(error.message);
        hideOverlay();
        draw();
      }
    };
    $('answers').appendChild(button);
  }

  const close = document.createElement('button');
  close.className = 'answer';
  close.textContent = 'Отмена';
  close.onclick = hideOverlay;
  $('answers').appendChild(close);
}

function openCrewMenu() {
  const player = game.state.players.get(HUMAN);
  configureOverlay({
    meta: 'Экипаж',
    title: `Слоты ${player.ship.installedCrew.length}/${player.ship.crewSlots}`,
    numeric: false,
  });

  const labels = {
    [CREW_TYPES.GUNNER]: 'Канонир',
    [CREW_TYPES.NAVIGATOR]: 'Штурман',
    [CREW_TYPES.CARPENTER]: 'Плотник',
    [CREW_TYPES.QUARTERMASTER]: 'Квартирмейстер',
  };

  for (const crewType of Object.values(CREW_TYPES)) {
    const owned = game.crewSystem.getAllOwnedCrew(game.state, HUMAN).includes(crewType);
    const installed = player.ship.installedCrew.includes(crewType);
    const reserve = player.crewReserve.includes(crewType);

    const button = document.createElement('button');
    button.className = 'answer';

    if (!owned) {
      button.textContent = `${labels[crewType]} · купить 20`;
      button.onclick = () => {
        try {
          game.crewSystem.purchaseCrew({
            state: game.state,
            playerId: HUMAN,
            crewType,
          });
          hideOverlay();
          draw();
          openCrewMenu();
        } catch (error) {
          log(error.message);
        }
      };
    } else if (installed) {
      button.textContent = `${labels[crewType]} · установлен · снять`;
      button.onclick = () => {
        try {
          game.crewSystem.uninstallCrew({
            state: game.state,
            playerId: HUMAN,
            crewType,
          });
          hideOverlay();
          draw();
          openCrewMenu();
        } catch (error) {
          log(error.message);
        }
      };
    } else if (reserve) {
      button.textContent = `${labels[crewType]} · установить`;
      button.onclick = () => {
        try {
          game.crewSystem.installCrew({
            state: game.state,
            playerId: HUMAN,
            crewType,
          });
          hideOverlay();
          draw();
          openCrewMenu();
        } catch (error) {
          log(error.message);
        }
      };

      const sell = document.createElement('button');
      sell.className = 'answer';
      sell.textContent = `${labels[crewType]} · продать 10`;
      sell.onclick = () => {
        try {
          game.crewSystem.sellCrew({
            state: game.state,
            playerId: HUMAN,
            crewType,
          });
          hideOverlay();
          draw();
          openCrewMenu();
        } catch (error) {
          log(error.message);
        }
      };
      $('answers').append(button, sell);
      continue;
    }

    $('answers').appendChild(button);
  }

  const close = document.createElement('button');
  close.className = 'answer';
  close.textContent = 'Закрыть';
  close.onclick = hideOverlay;
  $('answers').appendChild(close);
}

function buyHpOrRepair() {
  const player = game.state.players.get(HUMAN);
  try {
    if (player.ship.sunk && player.ship.hp === 0) {
      game.flagshipSystem.repairHp({
        state: game.state,
        playerId: HUMAN,
        points: 1,
      });
      log('Флагман отремонтирован на 1 HP.');
    } else {
      game.flagshipSystem.purchaseHpUpgrade({
        state: game.state,
        playerId: HUMAN,
      });
      log('Куплено улучшение +1 MaxHP.');
    }
  } catch (error) {
    log(error.message);
  }
  draw();
}

function buyDamage() {
  try {
    game.flagshipSystem.purchaseDamageUpgrade({
      state: game.state,
      playerId: HUMAN,
    });
    log('Куплено улучшение +1 Damage.');
  } catch (error) {
    log(error.message);
  }
  draw();
}

function buyCrewSlot() {
  try {
    game.flagshipSystem.purchaseCrewSlotUpgrade({
      state: game.state,
      playerId: HUMAN,
    });
    log('Куплен дополнительный слот экипажа.');
  } catch (error) {
    log(error.message);
  }
  draw();
}

function showFinal() {
  const winners = game.state.resultState.winnerIds;
  const ranking = PLAYER_IDS
    .map(playerId => ({
      playerId,
      fame: game.fameSystem.getFame(game.state, playerId),
    }))
    .sort((a, b) => b.fame - a.fame);

  configureOverlay({
    meta: 'Финал',
    title: winners.length > 1
      ? `Победители: ${winners.join(', ')}`
      : `Победитель: ${winners[0] ?? '—'}`,
    numeric: false,
  });

  for (const entry of ranking) {
    const row = document.createElement('button');
    row.className = 'answer';
    row.disabled = true;
    row.textContent = `${entry.playerId}: ${entry.fame} славы`;
    $('answers').appendChild(row);
  }

  const again = document.createElement('button');
  again.className = 'answer';
  again.textContent = 'Новая партия';
  again.onclick = startNewGame;
  $('answers').appendChild(again);
}

function handleTileClick(territoryId) {
  if (game.state.stage === GAME_STAGES.ARCHIPELAGO) {
    claimHumanTerritory(territoryId);
    return;
  }

  if (
    game.state.stage !== GAME_STAGES.WAR
    || currentPlayer() !== HUMAN
  ) return;

  const territory = game.state.territories.get(territoryId);
  if (['MOVE', 'POST'].includes(humanPhase) && territory.ownerId === HUMAN) {
    moveHumanFlagship(territoryId);
    return;
  }

  if (humanPhase === 'ATTACK') {
    startHumanAttack('TERRITORY', territoryId);
  }
}

function handleBaseClick(baseId) {
  if (
    game.state.stage !== GAME_STAGES.WAR
    || currentPlayer() !== HUMAN
  ) return;

  const base = game.state.bases.get(baseId);
  if (['MOVE', 'POST'].includes(humanPhase) && base.ownerId === HUMAN) {
    moveHumanFlagship(baseId);
    return;
  }

  if (humanPhase === 'ATTACK') {
    startHumanAttack(
      base.isActiveBase ? 'BASE' : 'FORMER_BASE',
      baseId,
    );
  }
}

function handleModeButton() {
  if (
    game.state.stage === GAME_STAGES.ARCHIPELAGO
    && humanPhase === 'READY_TO_START'
  ) {
    humanPhase = 'SETTLEMENT';
    draw();
    startArchipelagoQuestion();
    return;
  }

  if (game.state.stage === GAME_STAGES.PREPARATION) {
    humanReady();
    return;
  }

  if (
    game.state.stage !== GAME_STAGES.WAR
    || currentPlayer() !== HUMAN
  ) return;

  if (humanPhase === 'MOVE') {
    humanPhase = 'ATTACK';
    draw();
    return;
  }

  if (humanPhase === 'ATTACK') {
    skipHumanTurn();
    return;
  }

  if (humanPhase === 'POST') {
    endCurrentTurn();
  }
}

function setupEvents() {
  $('map').addEventListener('click', event => {
    const tile = event.target.closest('[data-id]');
    if (!tile) return;
    handleTileClick(Number(tile.dataset.id));
  });

  document.querySelectorAll('[data-base]').forEach(button => {
    button.addEventListener('click', () => handleBaseClick(button.dataset.base));
  });

  $('modeBtn').onclick = handleModeButton;
  $('newBtn').onclick = startNewGame;
  $('secretBtn').onclick = () => useHumanBoost(BOOST_TYPES.SECRET_ROUTE);
  $('hpBtn').onclick = buyHpOrRepair;
  $('dmgBtn').onclick = buyDamage;
  $('slotBtn').onclick = buyCrewSlot;
  $('crewBtn').onclick = openCrewMenu;
  $('shipPanelBtn').onclick = () => $('shipPanel').classList.toggle('show');
  window.addEventListener('resize', fitMap);
}

function loadVisualPatch() {
  if (visualPatchLoaded) return;
  visualPatchLoaded = true;

  const script = document.createElement('script');
  script.src = 'v1_1_visual_patch.js';
  script.onload = () => {
    draw();
    fitMap();
  };
  script.onerror = () => {
    visualPatchLoaded = false;
    log('Визуальный патч не загрузился; Core runtime продолжает работать.');
  };
  document.body.appendChild(script);
}

function startNewGame() {
  sessionId += 1;
  clearRuntimeTimers();
  hideOverlay();
  lastLog = [];
  $('shipPanel').classList.remove('show');

  game = createCoreGame({
    rng: Math.random,
    boostRng: Math.random,
    clock: () => Date.now(),
    stage: GAME_STAGES.ARCHIPELAGO,
  });

  window.game = game;
  window.render = renderCoreUi;
  syncGlobals();

  const assignments = PLAYER_IDS
    .map(playerId => `${playerId}→${game.state.players.get(playerId).baseId}`)
    .join(' · ');
  log(`Rules v${RULES_VERSION} / Core v${CORE_VERSION}. Базы: ${assignments}`);
  humanPhase = 'READY_TO_START';
  draw();

  if (!visualPatchLoaded) loadVisualPatch();
}

setupEvents();
startNewGame();

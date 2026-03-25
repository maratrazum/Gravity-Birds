const {
  Engine,
  World,
  Bodies,
  Body,
  Constraint,
  Events,
  Composite,
  Sleeping,
} = Matter;

const BASE_DESIGN_WIDTH = 1920;
const BASE_DESIGN_HEIGHT = 1080;
const DESIGN_WIDTH = 1366;
const DESIGN_HEIGHT = 768;
const SCALE_X = DESIGN_WIDTH / BASE_DESIGN_WIDTH;
const SCALE_Y = DESIGN_HEIGHT / BASE_DESIGN_HEIGHT;
const UI_SCALE = Math.min(SCALE_X, SCALE_Y);
const FLOOR_Y = Math.round(930 * SCALE_Y);
const SLING = { x: Math.round(272 * SCALE_X), y: Math.round(775 * SCALE_Y) };
const MAX_PULL = Math.round(132 * UI_SCALE);
const LAUNCH_SCALE = 0.19;
const FIXED_STEP_MS = 1000 / 90;
const MAX_FRAME_DELTA = 1000 / 30;
const MAX_PHYSICS_STEPS = 4;
const NOTICE_ACK_KEY = "gravity_birds_notice_1366x768_v1";

function sx(value) {
  return Math.round(value * SCALE_X);
}

function sy(value) {
  return Math.round(value * SCALE_Y);
}

function ss(value) {
  return Math.round(value * UI_SCALE);
}

const BIRDS = {
  red: { label: "Rode Vogel", color: "#dd594c", outline: "#7f231e", radius: ss(22), desc: "Basvogel voor nauwkeurige schoten." },
  yellow: { label: "Gele Vogel", color: "#f4c94f", outline: "#8b640b", radius: ss(20), desc: "Sneller dan de standaardvogel." },
  blue: { label: "Blauwe Drieling", color: "#6cbef4", outline: "#21547f", radius: ss(18), desc: "Splitst in drie banen tijdens de vlucht." },
  black: { label: "Zwarte Bomvogel", color: "#2f2c34", outline: "#b89253", radius: ss(24), desc: "Ontploft bij een harde botsing." },
};

const STRINGS = {
  statuses: {
    aim: "Trek naar achteren en schiet.",
    nextBird: "Volgende vogel staat klaar.",
    noBirds: "Geen vogels meer over.",
    settling: "De laatste instorting komt tot rust...",
    allCleared: "Alle varkentjes zijn weg.",
    outOfBirds: "Geen vogels meer.",
    yellowBoost: "Chuck-versnelling geactiveerd.",
  },
  overlay: {
    retry: { eyebrow: "Opnieuw", title: "Missie mislukt", text: "Start opnieuw en probeer een andere hoek.", button: "Opnieuw" },
    win: { eyebrow: "Overwinning", title: "Level voltooid", text: "Ga door naar het volgende zwaartekrachtveld.", button: "Doorgaan" },
    notice: {
      eyebrow: "Belangrijk",
      title: "Gebruik een touchpad",
      text: "Gebruik op deze versie een touchpad of muis. De game werkt niet goed met een touchscreen.",
      button: "Begrepen",
    },
  },
  ui: {
    passed: "Voltooid",
    notCleared: "Nog niet voltooid",
    level: "Level",
    acceleration: "zwaartekrachtversnelling omlaag",
    birdOrder: "Volgorde van vogels",
    unmute: "Geluid aan",
    mute: "Dempen",
    continue: "Doorgaan",
    restart: "Opnieuw",
  },
};

const MATERIALS = {
  wood: { color: "#b97d4f", outline: "#6b3f20", density: 0.0012, friction: 0.86, restitution: 0.04, hp: 18 },
  glass: { color: "#9fe7eb", outline: "#4a9bab", density: 0.0008, friction: 0.22, restitution: 0.02, hp: 9 },
  stone: { color: "#8b97ab", outline: "#586171", density: 0.0026, friction: 0.98, restitution: 0.01, hp: 44 },
  tnt: { color: "#d34b40", outline: "#6b1812", density: 0.0011, friction: 0.74, restitution: 0.02, hp: 7 },
};

const BASE_LEVELS = [
  {
    id: 1,
    planet: "Maan",
    orbClass: "orb-moon",
    gravity: 280,
    gravityMs2: 1.62,
    birds: ["red", "blue", "yellow", "black"],
    palette: { skyTop: "#0d1731", skyBottom: "#5f89bb", dust: "#e8d0ad" },
    blocks: [
      ["stone", 1410, 902, 480, 28],
      ["wood", 1335, 810, 40, 176],
      ["wood", 1485, 810, 40, 176],
      ["wood", 1410, 714, 248, 22],
      ["wood", 1410, 624, 36, 158],
      ["glass", 1410, 534, 220, 18],
    ],
    pigs: [
      { x: 1410, y: 850, helmet: false },
      { x: 1410, y: 495, helmet: false },
    ],
  },
  {
    id: 2,
    planet: "Mars",
    orbClass: "orb-mars",
    gravity: 420,
    gravityMs2: 3.71,
    birds: ["red", "yellow", "blue", "black"],
    palette: { skyTop: "#4e2117", skyBottom: "#d97a49", dust: "#efc28f" },
    blocks: [
      ["stone", 1420, 904, 620, 28],
      ["wood", 1300, 812, 40, 180],
      ["wood", 1420, 812, 40, 180],
      ["wood", 1540, 812, 40, 180],
      ["wood", 1360, 716, 200, 22],
      ["wood", 1480, 716, 200, 22],
      ["stone", 1420, 622, 300, 28],
      ["wood", 1352, 536, 40, 144],
      ["wood", 1488, 536, 40, 144],
      ["glass", 1420, 450, 204, 18],
      ["stone", 1718, 760, 40, 308],
      ["stone", 1718, 592, 112, 24],
    ],
    pigs: [
      { x: 1360, y: 680, helmet: false },
      { x: 1480, y: 680, helmet: false },
      { x: 1420, y: 414, helmet: true },
    ],
  },
  {
    id: 3,
    planet: "Aarde",
    orbClass: "orb-earth",
    gravity: 560,
    gravityMs2: 9.81,
    birds: ["red", "yellow", "blue", "black", "red"],
    palette: { skyTop: "#255c97", skyBottom: "#b2d8f2", dust: "#e8d6a2" },
    blocks: [
      ["stone", 1400, 906, 620, 28],
      ["stone", 1230, 814, 42, 184],
      ["wood", 1345, 814, 38, 184],
      ["wood", 1455, 814, 38, 184],
      ["stone", 1570, 814, 42, 184],
      ["wood", 1288, 720, 150, 20],
      ["stone", 1400, 720, 180, 26],
      ["wood", 1512, 720, 150, 20],
      ["stone", 1400, 620, 40, 170],
      ["glass", 1400, 520, 240, 18],
    ],
    pigs: [
      { x: 1288, y: 686, helmet: false },
      { x: 1512, y: 686, helmet: false },
      { x: 1400, y: 684, helmet: true },
      { x: 1400, y: 481, helmet: true },
    ],
  },
  {
    id: 4,
    planet: "Mercurius",
    orbClass: "orb-mercury",
    gravity: 690,
    gravityMs2: 3.7,
    birds: ["yellow", "blue", "black", "yellow", "red"],
    palette: { skyTop: "#684130", skyBottom: "#eaad71", dust: "#f7d49d" },
    blocks: [
      ["stone", 1400, 908, 640, 28],
      ["stone", 1200, 816, 42, 186],
      ["wood", 1300, 816, 38, 186],
      ["stone", 1400, 816, 42, 186],
      ["wood", 1500, 816, 38, 186],
      ["stone", 1600, 816, 42, 186],
      ["wood", 1250, 720, 160, 22],
      ["stone", 1400, 716, 220, 28],
      ["wood", 1550, 720, 160, 22],
      ["wood", 1338, 600, 36, 166],
      ["wood", 1462, 600, 36, 166],
      ["glass", 1400, 502, 236, 18],
    ],
    pigs: [
      { x: 1250, y: 682, helmet: false },
      { x: 1550, y: 682, helmet: false },
      { x: 1400, y: 680, helmet: true },
      { x: 1400, y: 458, helmet: true },
    ],
  },
  {
    id: 5,
    planet: "Jupiter",
    orbClass: "orb-jupiter",
    gravity: 860,
    gravityMs2: 24.79,
    birds: ["yellow", "blue", "black", "red", "yellow", "black"],
    palette: { skyTop: "#3d252d", skyBottom: "#c08a72", dust: "#f2d8b8" },
    blocks: [
      ["stone", 1420, 910, 720, 28],
      ["stone", 1180, 818, 42, 188],
      ["wood", 1300, 818, 38, 188],
      ["stone", 1420, 818, 42, 188],
      ["wood", 1540, 818, 38, 188],
      ["stone", 1660, 818, 42, 188],
      ["wood", 1240, 720, 160, 20],
      ["stone", 1420, 720, 180, 26],
      ["wood", 1600, 720, 160, 20],
      ["stone", 1420, 622, 360, 28],
      ["wood", 1310, 532, 38, 156],
      ["stone", 1420, 532, 44, 156],
      ["wood", 1530, 532, 38, 156],
      ["glass", 1420, 438, 220, 18],
    ],
    pigs: [
      { x: 1240, y: 684, helmet: false },
      { x: 1600, y: 684, helmet: false },
      { x: 1420, y: 584, helmet: true },
      { x: 1420, y: 398, helmet: true },
    ],
  },
  {
    id: 6,
    planet: "Venus",
    orbClass: "orb-venus",
    gravity: 640,
    gravityMs2: 8.87,
    birds: ["red", "yellow", "blue", "black", "yellow"],
    palette: { skyTop: "#6a3921", skyBottom: "#d89353", dust: "#f0c98f" },
    blocks: [
      ["tnt", 1188, 842, 48, 48],
      ["stone", 1410, 910, 680, 28],
      ["wood", 1220, 818, 38, 186],
      ["wood", 1340, 818, 38, 186],
      ["stone", 1460, 818, 42, 186],
      ["wood", 1580, 818, 38, 186],
      ["glass", 1282, 724, 166, 20],
      ["stone", 1410, 720, 210, 28],
      ["glass", 1538, 724, 166, 20],
      ["wood", 1410, 610, 36, 170],
      ["glass", 1410, 510, 250, 20],
      ["stone", 1718, 770, 44, 300],
    ],
    pigs: [
      { x: 1282, y: 688, helmet: false },
      { x: 1538, y: 688, helmet: false },
      { x: 1410, y: 472, helmet: true },
    ],
    levers: [
      { x: 1188, y: 892, w: 230, h: 18, material: "wood", pivotX: 1188, pivotY: 892 },
    ],
  },
  {
    id: 7,
    planet: "Saturnus",
    orbClass: "orb-saturn",
    gravity: 760,
    gravityMs2: 10.44,
    birds: ["yellow", "blue", "black", "red", "yellow", "red"],
    palette: { skyTop: "#413031", skyBottom: "#bc9a74", dust: "#efd2ad" },
    blocks: [
      ["tnt", 1608, 682, 46, 46],
      ["stone", 1420, 912, 760, 28],
      ["stone", 1160, 820, 40, 188],
      ["wood", 1285, 820, 34, 188],
      ["stone", 1420, 820, 40, 188],
      ["wood", 1555, 820, 34, 188],
      ["stone", 1680, 820, 40, 188],
      ["glass", 1225, 724, 180, 20],
      ["stone", 1420, 720, 220, 28],
      ["glass", 1615, 724, 180, 20],
      ["wood", 1326, 610, 34, 166],
      ["wood", 1514, 610, 34, 166],
      ["stone", 1420, 620, 320, 30],
      ["glass", 1420, 510, 240, 20],
      ["stone", 1420, 408, 50, 150],
    ],
    pigs: [
      { x: 1225, y: 690, helmet: false },
      { x: 1615, y: 690, helmet: false },
      { x: 1420, y: 582, helmet: true },
      { x: 1420, y: 370, helmet: true },
    ],
    levers: [
      { x: 1608, y: 892, w: 250, h: 18, material: "stone", pivotX: 1608, pivotY: 892 },
    ],
  },
  {
    id: 8,
    planet: "Neptunus",
    orbClass: "orb-neptune",
    gravity: 800,
    gravityMs2: 11.15,
    birds: ["yellow", "blue", "black", "yellow", "black", "red"],
    palette: { skyTop: "#102b56", skyBottom: "#4d8fd0", dust: "#86b3e5" },
    blocks: [
      ["tnt", 1322, 690, 46, 46],
      ["tnt", 1518, 690, 46, 46],
      ["stone", 1420, 914, 800, 28],
      ["stone", 1130, 822, 42, 190],
      ["wood", 1260, 822, 36, 190],
      ["stone", 1390, 822, 42, 190],
      ["wood", 1520, 822, 36, 190],
      ["stone", 1650, 822, 42, 190],
      ["glass", 1190, 726, 170, 20],
      ["stone", 1325, 726, 150, 26],
      ["glass", 1455, 726, 170, 20],
      ["stone", 1590, 726, 150, 26],
      ["stone", 1420, 628, 420, 32],
      ["wood", 1295, 532, 34, 158],
      ["stone", 1420, 532, 48, 158],
      ["wood", 1545, 532, 34, 158],
      ["glass", 1420, 430, 290, 18],
    ],
    pigs: [
      { x: 1190, y: 692, helmet: false },
      { x: 1455, y: 692, helmet: false },
      { x: 1590, y: 692, helmet: false },
      { x: 1420, y: 590, helmet: true },
      { x: 1420, y: 392, helmet: true },
    ],
    levers: [
      { x: 1420, y: 890, w: 320, h: 18, material: "wood", pivotX: 1420, pivotY: 890 },
    ],
  },
];

const LEVELS = BASE_LEVELS.map((level) => ({
  ...level,
  gravity: ss(level.gravity),
  blocks: level.blocks.map(([material, x, y, w, h]) => [material, sx(x), sy(y), Math.max(12, sx(w)), Math.max(12, sy(h))]),
  pigs: level.pigs.map((pig) => ({ ...pig, x: sx(pig.x), y: sy(pig.y) })),
  levers: (level.levers ?? []).map((lever) => ({
    ...lever,
    x: sx(lever.x),
    y: sy(lever.y),
    w: sx(lever.w),
    h: sy(lever.h),
    pivotX: sx(lever.pivotX),
    pivotY: sy(lever.pivotY),
  })),
}));

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = true;

const menuScreen = document.getElementById("menuScreen");
const levelScreen = document.getElementById("levelScreen");
const hud = document.getElementById("hud");
const overlay = document.getElementById("overlay");
const overlayEyebrow = document.getElementById("overlayEyebrow");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const overlayBtn = document.getElementById("overlayBtn");
const hudLevel = document.getElementById("hudLevel");
const hudGravity = document.getElementById("hudGravity");
const hudStatus = document.getElementById("hudStatus");
const birdStack = document.getElementById("birdStack");
const birdsGrid = document.getElementById("birdsGrid");
const levelGrid = document.getElementById("levelGrid");
const settingsPanel = document.getElementById("settingsPanel");
const settingsBtn = document.getElementById("settingsBtn");
const closeSettingsBtn = document.getElementById("closeSettingsBtn");
const volumeSlider = document.getElementById("volumeSlider");
const volumeValue = document.getElementById("volumeValue");
const muteBtn = document.getElementById("muteBtn");
const PROGRESS_KEY = "gravity_birds_progress_1366x768_v1";
const AUDIO_SETTINGS_KEY = "gravity_birds_audio_1366x768_v1";

const state = {
  mode: "menu",
  levelIndex: 0,
  world: null,
  pointer: { x: 0, y: 0, down: false },
  lastTs: 0,
  accumulator: 0,
  viewport: { width: window.innerWidth, height: window.innerHeight, scale: 1, offsetX: 0, offsetY: 0 },
  audio: null,
  overlayAction: null,
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function vec(x = 0, y = 0) {
  return { x, y };
}

function add(a, b) {
  return { x: a.x + b.x, y: a.y + b.y };
}

function sub(a, b) {
  return { x: a.x - b.x, y: a.y - b.y };
}

function mul(v, amount) {
  return { x: v.x * amount, y: v.y * amount };
}

function length(v) {
  return Math.hypot(v.x, v.y);
}

function normalize(v) {
  const len = length(v) || 1;
  return { x: v.x / len, y: v.y / len };
}

function rotate(v, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x: v.x * cos - v.y * sin, y: v.x * sin + v.y * cos };
}

function ensureAudio() {
  if (state.audio) return state.audio;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  const ctxAudio = new AudioCtx();
  const compressor = ctxAudio.createDynamicsCompressor();
  const master = ctxAudio.createGain();
  compressor.threshold.value = -24;
  compressor.knee.value = 18;
  compressor.ratio.value = 4;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.2;
  master.gain.value = 0.9;
  master.connect(compressor);
  compressor.connect(ctxAudio.destination);
  state.audio = { ctx: ctxAudio, master, compressor, humTimer: 0, musicTimer: 0, musicStep: 0 };
  applyAudioSettings();
  return state.audio;
}

function unlockAudio() {
  const audio = ensureAudio();
  if (!audio) return;
  if (audio.ctx.state === "suspended") {
    audio.ctx.resume();
  }
}

function loadAudioSettings() {
  try {
    const raw = JSON.parse(localStorage.getItem(AUDIO_SETTINGS_KEY) || "{}");
    return {
      volume: clamp(Number(raw.volume ?? 2.3), 0, 5),
      muted: Boolean(raw.muted),
    };
  } catch {
    return { volume: 2.3, muted: false };
  }
}

function saveAudioSettings(settings) {
  localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(settings));
}

function applyAudioSettings() {
  const settings = loadAudioSettings();
  if (state.audio) {
    state.audio.master.gain.value = settings.muted ? 0 : 0.42 * settings.volume;
  }
  volumeSlider.value = String(Math.round(settings.volume * 100));
  volumeValue.textContent = `${Math.round(settings.volume * 100)}%`;
  muteBtn.textContent = settings.muted ? STRINGS.ui.unmute : STRINGS.ui.mute;
}

function playTone(freq, duration, type = "triangle", volume = 0.24, slideTo = null) {
  const audio = ensureAudio();
  if (!audio) return;
  if (audio.ctx.state === "suspended") audio.ctx.resume();
  const osc = audio.ctx.createOscillator();
  const gain = audio.ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audio.ctx.currentTime);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, audio.ctx.currentTime + duration);
  gain.gain.setValueAtTime(volume, audio.ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audio.master);
  osc.start();
  osc.stop(audio.ctx.currentTime + duration);
}

function playLaunchSound(type) {
  if (type === "yellow") playTone(260, 0.08, "sine", 0.11, 340);
  else if (type === "blue") playTone(380, 0.07, "sine", 0.1, 460);
  else if (type === "black") playTone(150, 0.12, "triangle", 0.12, 110);
  else playTone(220, 0.08, "triangle", 0.1, 280);
}

function playImpactSound(power) {
  playTone(90 + power * 8, 0.06, "triangle", Math.min(0.16, 0.06 + power * 0.004), 72);
}

function playPigSound() {
  playTone(300, 0.08, "sine", 0.12, 220);
}

function playWinSound() {
  playTone(330, 0.1, "triangle", 0.12, 440);
  setTimeout(() => playTone(440, 0.12, "triangle", 0.12, 560), 80);
}

function updateAmbientAudio(dt) {
  const audio = state.audio;
  if (!audio || state.mode !== "game" || !state.world || state.world.outcome) return;
  audio.humTimer -= dt;
  audio.musicTimer -= dt;
  if (audio.humTimer <= 0) {
    audio.humTimer = 3.4;
    playTone(82 + state.world.level.gravity * 0.05, 1.8, "sine", 0.08, 70 + state.world.level.gravity * 0.03);
  }
  if (audio.musicTimer > 0) return;
  const roots = [220, 196, 247, 175, 147];
  const root = roots[(state.world.level.id - 1) % roots.length];
  const patterns = [
    [1, 1.25, 1.5, 2, 1.5, 1.25, 1.12, 1.5],
    [1, 1.125, 1.5, 1.125, 1.68, 1.5, 1.125, 2],
    [1, 1.2, 1.6, 1.2, 1.4, 1.8, 1.6, 1.2],
  ];
  const pattern = patterns[(state.world.level.id - 1) % patterns.length];
  const freq = root * pattern[audio.musicStep % pattern.length];
  playTone(freq, 0.48, "triangle", 0.15, freq * 0.98);
  playTone(freq * 0.5, 0.7, "sine", 0.11, freq * 0.48);
  audio.musicStep += 1;
  audio.musicTimer = 0.52;
}

function roundRect(context, x, y, w, h, r) {
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + w, y, x + w, y + h, r);
  context.arcTo(x + w, y + h, x, y + h, r);
  context.arcTo(x, y + h, x, y, r);
  context.arcTo(x, y, x + w, y, r);
  context.closePath();
}

function resize() {
  const dpr = 1;
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const scale = Math.min(window.innerWidth / DESIGN_WIDTH, window.innerHeight / DESIGN_HEIGHT);
  state.viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
    scale,
    offsetX: (window.innerWidth - DESIGN_WIDTH * scale) / 2,
    offsetY: (window.innerHeight - DESIGN_HEIGHT * scale) / 2,
  };
}

function toWorldPoint(clientX, clientY) {
  const { scale, offsetX, offsetY } = state.viewport;
  return {
    x: (clientX - offsetX) / scale,
    y: (clientY - offsetY) / scale,
  };
}

function rebuildBirdCards() {
  birdsGrid.innerHTML = "";
  Object.entries(BIRDS).forEach(([id, bird]) => {
    const card = document.createElement("article");
    card.className = "bird-card";
    const badge = document.createElement("div");
    badge.className = "bird-badge";
    badge.style.background = bird.color;
    badge.style.boxShadow = `inset -10px -10px 0 ${bird.outline}`;
    const title = document.createElement("h3");
    title.textContent = bird.label;
    const text = document.createElement("p");
    text.textContent = bird.desc;
    card.append(badge, title, text);
    birdsGrid.append(card);
  });
}

function rebuildLevelCards() {
  const progress = loadProgress();
  levelGrid.innerHTML = "";
  LEVELS.forEach((level, index) => {
    const cleared = Boolean(progress[level.id]);
    const card = document.createElement("article");
    card.className = `level-card ${cleared ? "level-card-cleared" : "level-card-pending"}`;
    card.innerHTML = `
      <div class="level-state ${cleared ? "level-state-cleared" : "level-state-pending"}">
        ${cleared ? `✓ ${STRINGS.ui.passed}` : `○ ${STRINGS.ui.notCleared}`}
      </div>
      <div class="level-top">
        <div class="orb ${level.orbClass}"></div>
        <div>
          <div class="eyebrow">${STRINGS.ui.level} ${index + 1}</div>
          <h3>${level.planet}</h3>
        </div>
      </div>
      <div class="metric">
        <strong>g = ${level.gravityMs2.toFixed(2)} m/s²</strong>
        <span>${STRINGS.ui.acceleration}</span>
      </div>
      <div class="metric">
        <strong>${STRINGS.ui.birdOrder}</strong>
        <span>${level.birds.join(", ")}</span>
      </div>
    `;
    card.addEventListener("click", () => startLevel(index));
    levelGrid.append(card);
  });
}

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveLevelProgress(levelId) {
  const progress = loadProgress();
  progress[levelId] = true;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

function setMode(mode) {
  state.mode = mode;
  menuScreen.classList.toggle("hidden", mode !== "menu");
  levelScreen.classList.toggle("hidden", mode !== "levels");
  hud.classList.toggle("hidden", mode !== "game");
  overlay.classList.add("hidden");
  settingsPanel.classList.add("hidden");
  canvas.classList.toggle("interactive", mode === "game");
}

function showOverlay(eyebrow, title, text, button, action = null) {
  state.overlayAction = action;
  overlayEyebrow.textContent = eyebrow;
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  overlayBtn.textContent = button;
  overlay.classList.remove("hidden");
}

function createBlockEntity(material, x, y, w, h, index) {
  const mat = MATERIALS[material];
  const body = Bodies.rectangle(x, y, w, h, {
    chamfer: { radius: 6 },
    friction: mat.friction,
    restitution: mat.restitution,
    density: mat.density,
    frictionAir: 0.006,
    sleepThreshold: 18,
    label: `block:${index}`,
  });
  const entity = {
    kind: "block",
    id: `block-${index}`,
    material,
    body,
    w,
    h,
    hp: mat.hp,
    isLever: false,
    removed: false,
    renderX: x,
    renderY: y,
    renderAngle: 0,
  };
  body.plugin.entity = entity;
  return entity;
}

function createLeverEntity(config, index) {
  const mat = MATERIALS[config.material];
  const body = Bodies.rectangle(config.x, config.y, config.w, config.h, {
    chamfer: { radius: 6 },
    friction: mat.friction,
    restitution: 0.01,
    density: mat.density * 1.2,
    frictionAir: 0.003,
    sleepThreshold: 18,
    label: `lever:${index}`,
  });
  const pivot = Constraint.create({
    pointA: { x: config.pivotX, y: config.pivotY },
    bodyB: body,
    pointB: { x: 0, y: 0 },
    length: 0,
    stiffness: 1,
    damping: 0.08,
  });
  const entity = {
    kind: "block",
    id: `lever-${index}`,
    material: config.material,
    body,
    w: config.w,
    h: config.h,
    hp: mat.hp * 1.6,
    isLever: true,
    pivot,
    removed: false,
    renderX: config.x,
    renderY: config.y,
    renderAngle: 0,
  };
  body.plugin.entity = entity;
  return entity;
}

function createPigEntity(x, y, helmet, index) {
  const body = Bodies.circle(x, y, 22, {
    friction: 0.16,
    restitution: 0.08,
    density: helmet ? 0.0013 : 0.001,
    frictionAir: 0.003,
    sleepThreshold: 5,
    label: `pig:${index}`,
  });
  const entity = {
    kind: "pig",
    id: `pig-${index}`,
    body,
    r: 22,
    helmet,
    hp: helmet ? 2.5 : 1.3,
    removed: false,
    renderX: x,
    renderY: y,
    renderAngle: 0,
  };
  body.plugin.entity = entity;
  return entity;
}

function createGround() {
  return Bodies.rectangle(DESIGN_WIDTH / 2, FLOOR_Y + 55, DESIGN_WIDTH + 200, 110, {
    isStatic: true,
    friction: 0.96,
    restitution: 0,
    label: "ground",
  });
}

function createBounds() {
  return [
    Bodies.rectangle(-30, DESIGN_HEIGHT / 2, 60, DESIGN_HEIGHT * 2, { isStatic: true, label: "wall:left" }),
    Bodies.rectangle(DESIGN_WIDTH + 30, DESIGN_HEIGHT / 2, 60, DESIGN_HEIGHT * 2, { isStatic: true, label: "wall:right" }),
    Bodies.rectangle(DESIGN_WIDTH / 2, -30, DESIGN_WIDTH * 2, 60, { isStatic: true, label: "wall:top" }),
  ];
}

function createWorld(levelIndex) {
  const level = LEVELS[levelIndex];
  const engine = Engine.create({
    enableSleeping: true,
    positionIterations: 5,
    velocityIterations: 3,
    constraintIterations: 1,
  });
  engine.gravity.x = 0;
  engine.gravity.y = level.gravity / 600;
  engine.gravity.scale = 0.001;

  const ground = createGround();
  const bounds = createBounds();
  const blocks = level.blocks.map(([material, x, y, w, h], index) => createBlockEntity(material, x, y, w, h, index));
  const levers = level.levers.map((lever, index) => createLeverEntity(lever, index));
  const pigs = level.pigs.map((pig, index) => createPigEntity(pig.x, pig.y, pig.helmet, index));

  World.add(engine.world, [
    ground,
    ...bounds,
    ...blocks.map((item) => item.body),
    ...levers.map((item) => item.body),
    ...levers.map((item) => item.pivot),
    ...pigs.map((item) => item.body),
  ]);

  [...blocks, ...levers].forEach((block) => {
    Body.setVelocity(block.body, { x: 0, y: 0 });
    Body.setAngularVelocity(block.body, 0);
    Sleeping.set(block.body, true);
  });
  pigs.forEach((pig) => {
    Body.setVelocity(pig.body, { x: 0, y: 0 });
    Body.setAngularVelocity(pig.body, 0);
    Sleeping.set(pig.body, true);
  });

  const world = {
    engine,
    level,
    ground,
    bounds,
    blocks: [...blocks, ...levers],
    pigs,
    birdsQueue: [...level.birds],
    activeBird: null,
    extraBirds: [],
    particles: [],
    aiming: false,
    drag: vec(SLING.x, SLING.y),
    status: STRINGS.statuses.aim,
    outcome: null,
    clearTimer: 0,
    structuresAwake: false,
    lastDeltaMs: 1000 / 60,
  };

  Events.on(engine, "collisionStart", (event) => {
    event.pairs.forEach((pair) => handleCollisionPair(world, pair));
  });

  return world;
}

function wakeStructures(world) {
  if (world.structuresAwake) return;
  world.structuresAwake = true;
  world.blocks.forEach((block) => {
    if (!block.removed) Sleeping.set(block.body, false);
  });
  world.pigs.forEach((pig) => {
    if (!pig.removed) Sleeping.set(pig.body, false);
  });
}

function refreshHud() {
  if (!state.world) return;
  hudLevel.textContent = state.world.level.planet;
  hudGravity.textContent = `g = ${state.world.level.gravityMs2.toFixed(2)} m/s², ${STRINGS.ui.acceleration}`;
  hudStatus.textContent = state.world.status;
  birdStack.innerHTML = "";
  state.world.birdsQueue.forEach((birdType) => {
    const dot = document.createElement("span");
    dot.className = "bird-dot";
    dot.style.background = BIRDS[birdType].color;
    birdStack.append(dot);
  });
}

function startLevel(index) {
  state.levelIndex = index;
  state.world = createWorld(index);
  state.accumulator = 0;
  refreshHud();
  setMode("game");
}

function spawnDebris(world, x, y, color, count) {
  for (let i = 0; i < count; i += 1) {
    world.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 110,
      vy: (Math.random() - 0.95) * 100,
      ttl: 0.35 + Math.random() * 0.25,
      color,
      size: 3 + Math.random() * 4,
      glow: false,
    });
  }
}

function spawnBurst(world, x, y, color, count = 10) {
  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.24;
    const speed = 70 + Math.random() * 110;
    world.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      ttl: 0.28 + Math.random() * 0.18,
      color,
      size: 5 + Math.random() * 5,
      glow: true,
    });
  }
}

function removeBlock(world, entity) {
  if (!entity || entity.removed) return;
  entity.removed = true;
  if (entity.pivot) Composite.remove(world.engine.world, entity.pivot);
  Composite.remove(world.engine.world, entity.body);
  spawnDebris(world, entity.body.position.x, entity.body.position.y, MATERIALS[entity.material].color, 2);
  spawnBurst(world, entity.body.position.x, entity.body.position.y, MATERIALS[entity.material].color, 6);
  playImpactSound(4);
}

function explodeTnt(world, entity) {
  if (!entity || entity.removed) return;
  entity.removed = true;
  if (entity.pivot) Composite.remove(world.engine.world, entity.pivot);
  Composite.remove(world.engine.world, entity.body);
  spawnBurst(world, entity.body.position.x, entity.body.position.y, "#ffcf75", 18);
  spawnDebris(world, entity.body.position.x, entity.body.position.y, "#ff914d", 14);
  world.blocks.forEach((block) => {
    if (block.removed) return;
    const dx = block.body.position.x - entity.body.position.x;
    const dy = block.body.position.y - entity.body.position.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 210) return;
    const impact = 1 - dist / 210;
    const dir = normalize({ x: dx || 1, y: dy || -0.2 });
    Body.applyForce(block.body, block.body.position, {
      x: dir.x * 0.016 * impact,
      y: dir.y * 0.016 * impact,
    });
    if (block.material !== "tnt") damageBlock(world, block, 11 * impact);
  });
  world.pigs.forEach((pig) => {
    if (pig.removed) return;
    const dx = pig.body.position.x - entity.body.position.x;
    const dy = pig.body.position.y - entity.body.position.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 220) return;
    const impact = 1 - dist / 220;
    Body.applyForce(pig.body, pig.body.position, {
      x: dx * 0.00022 * impact,
      y: dy * 0.00022 * impact,
    });
    damagePig(world, pig, 2.5 * impact);
  });
  playImpactSound(12);
}

function removePig(world, entity) {
  if (!entity || entity.removed) return;
  entity.removed = true;
  Composite.remove(world.engine.world, entity.body);
  spawnDebris(world, entity.body.position.x, entity.body.position.y, "#7ed14f", 3);
  spawnBurst(world, entity.body.position.x, entity.body.position.y, "#b8ff7a", 8);
  playPigSound();
}

function getEntity(body) {
  return body?.plugin?.entity ?? null;
}

function damageBlock(world, entity, amount) {
  if (!entity || entity.removed) return;
  const materialMultiplier =
    entity.material === "wood" ? 1.55 :
    entity.material === "glass" ? 1.9 :
    entity.material === "tnt" ? 2.2 :
    entity.isLever ? 0.9 :
    1;
  entity.hp -= amount * materialMultiplier;
  if (entity.hp <= 0) {
    if (entity.material === "tnt") explodeTnt(world, entity);
    else removeBlock(world, entity);
  }
}

function damagePig(world, entity, amount) {
  if (!entity || entity.removed) return;
  entity.hp -= amount;
  if (entity.hp <= 0) removePig(world, entity);
}

function isBirdBody(world, body) {
  return world.activeBird?.body === body || world.extraBirds.some((bird) => bird.body === body);
}

function findBirdByBody(world, body) {
  if (world.activeBird?.body === body) return world.activeBird;
  return world.extraBirds.find((bird) => bird.body === body) ?? null;
}

function explodeBird(world, bird) {
  if (!bird || bird.exploded) return;
  wakeStructures(world);
  bird.exploded = true;
  world.blocks.forEach((block) => {
    if (block.removed) return;
    const dx = block.body.position.x - bird.body.position.x;
    const dy = block.body.position.y - bird.body.position.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 180) return;
    const impact = 1 - dist / 180;
    const dir = normalize({ x: dx || 1, y: dy || -0.2 });
    Body.applyForce(block.body, block.body.position, {
      x: dir.x * 0.012 * impact,
      y: dir.y * 0.012 * impact,
    });
    damageBlock(world, block, 5.5 * impact);
  });
  world.pigs.forEach((pig) => {
    if (pig.removed) return;
    const dx = pig.body.position.x - bird.body.position.x;
    const dy = pig.body.position.y - bird.body.position.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 170) return;
    const impact = 1 - dist / 170;
    Body.applyForce(pig.body, pig.body.position, {
      x: dx * 0.00015 * impact,
      y: dy * 0.00015 * impact,
    });
    damagePig(world, pig, 1.4 * impact);
  });
  spawnDebris(world, bird.body.position.x, bird.body.position.y, "#f1b86c", 8);
  spawnBurst(world, bird.body.position.x, bird.body.position.y, "#ffca76", 12);
  playImpactSound(7);
  Composite.remove(world.engine.world, bird.body);
  if (world.activeBird === bird) world.activeBird = null;
  else world.extraBirds = world.extraBirds.filter((item) => item !== bird);
}

function splitBlueBird(world, bird) {
  if (!bird || bird.type !== "blue" || bird.splitDone || bird.removed) return;
  bird.splitDone = true;
  [-0.18, 0.18].forEach((angle) => {
    const vel = rotate(bird.body.velocity, angle);
    const body = Bodies.circle(bird.body.position.x, bird.body.position.y, 11, {
      friction: 0.02,
      restitution: 0.1,
      density: 0.00075,
      frictionAir: 0.003,
      label: "bird:blue-child",
    });
    const child = {
      kind: "bird",
      type: "blue",
      body,
      r: 11,
      life: 0,
      splitDone: true,
      boosted: true,
      impact: false,
      removed: false,
      exploded: false,
      renderX: bird.body.position.x,
      renderY: bird.body.position.y,
      renderAngle: bird.body.angle,
    };
    body.plugin.entity = child;
    World.add(world.engine.world, body);
    Body.setVelocity(body, vel);
    world.extraBirds.push(child);
  });
}

function handleCollisionPair(world, pair) {
  const aEntity = getEntity(pair.bodyA);
  const bEntity = getEntity(pair.bodyB);

  const aBird = isBirdBody(world, pair.bodyA) ? findBirdByBody(world, pair.bodyA) : null;
  const bBird = isBirdBody(world, pair.bodyB) ? findBirdByBody(world, pair.bodyB) : null;
  const bird = aBird || bBird;
  const other = aBird ? bEntity : bBird ? aEntity : null;

  if (bird && other?.kind === "pig") {
    wakeStructures(world);
    damagePig(world, other, 6.8);
    bird.impact = true;
    playImpactSound(5);
    return;
  }

  if (bird && other?.kind === "block") {
    wakeStructures(world);
    const speed = length(bird.body.velocity);
    const hitStrength = speed * (bird.type === "yellow" ? 1.34 : bird.type === "black" ? 1.82 : bird.type === "red" ? 1.2 : 1.02);
    damageBlock(world, other, hitStrength * 0.72);

    const direction = normalize(sub(other.body.position, bird.body.position));
    Body.applyForce(other.body, other.body.position, {
      x: direction.x * 0.0075 * (bird.type === "black" ? 1.45 : bird.type === "red" ? 1.12 : 1),
      y: direction.y * 0.0075 * (bird.type === "black" ? 1.45 : bird.type === "red" ? 1.12 : 1),
    });
    bird.impact = true;
    playImpactSound(hitStrength);

    if (bird.type === "black") explodeBird(world, bird);
    return;
  }

  if (
    (aEntity?.kind === "pig" && bEntity?.kind === "block") ||
    (aEntity?.kind === "block" && bEntity?.kind === "pig")
  ) {
    if (pair.bodyA.isSleeping) Sleeping.set(pair.bodyA, false);
    if (pair.bodyB.isSleeping) Sleeping.set(pair.bodyB, false);
    return;
  }

  if (aEntity?.kind === "block" && bEntity?.kind === "block") {
    const speed = pair.collision?.depth ? Math.abs(pair.bodyA.speed - pair.bodyB.speed) : 0;
    if (speed > 3.8) {
      damageBlock(world, aEntity, speed * 0.055);
      damageBlock(world, bEntity, speed * 0.05);
    }
  }
}

function pruneRemoved(world) {
  world.blocks = world.blocks.filter((block) => !block.removed);
  world.pigs = world.pigs.filter((pig) => !pig.removed);
  world.extraBirds = world.extraBirds.filter((bird) => !bird.removed);
}

function getSupportState(world, entity) {
  if (entity.removed) {
    return {
      supported: false,
      grounded: false,
      leftSupport: false,
      rightSupport: false,
      leftBlock: null,
      rightBlock: null,
    };
  }
  const body = entity.body;
  const bottom = body.position.y + entity.h / 2;
  if (bottom >= FLOOR_Y - 4) {
    return {
      supported: true,
      grounded: true,
      leftSupport: true,
      rightSupport: true,
      leftBlock: null,
      rightBlock: null,
    };
  }

  let leftSupport = false;
  let rightSupport = false;
  let leftBlock = null;
  let rightBlock = null;

  for (const other of world.blocks) {
    if (other === entity || other.removed) continue;
    const top = other.body.position.y - other.h / 2;
    const verticalGap = Math.abs(bottom - top);
    if (verticalGap > 14) continue;
    const overlapX =
      Math.min(body.position.x + entity.w / 2, other.body.position.x + other.w / 2) -
      Math.max(body.position.x - entity.w / 2, other.body.position.x - other.w / 2);
    if (overlapX > Math.min(entity.w, other.w) * 0.22) {
      const overlapLeft = Math.max(body.position.x - entity.w / 2, other.body.position.x - other.w / 2);
      const overlapRight = Math.min(body.position.x + entity.w / 2, other.body.position.x + other.w / 2);
      const supportCenter = (overlapLeft + overlapRight) / 2 - body.position.x;
      if (supportCenter <= entity.w * -0.1) {
        leftSupport = true;
        leftBlock = other;
      } else if (supportCenter >= entity.w * 0.1) {
        rightSupport = true;
        rightBlock = other;
      } else {
        leftSupport = true;
        rightSupport = true;
      }
    }
  }
  return {
    supported: leftSupport || rightSupport,
    grounded: false,
    leftSupport,
    rightSupport,
    leftBlock,
    rightBlock,
  };
}

function getPigSupportState(world, pig) {
  if (pig.removed) return { supported: false, grounded: false, supportBlock: null };
  const body = pig.body;
  const bottom = body.position.y + pig.r;
  if (bottom >= FLOOR_Y - 4) return { supported: true, grounded: true, supportBlock: null };

  for (const other of world.blocks) {
    if (other.removed) continue;
    const top = other.body.position.y - other.h / 2;
    const verticalGap = Math.abs(bottom - top);
    if (verticalGap > 12) continue;
    const overlapX =
      Math.min(body.position.x + pig.r, other.body.position.x + other.w / 2) -
      Math.max(body.position.x - pig.r, other.body.position.x - other.w / 2);
    if (overlapX > pig.r * 0.5) {
      return { supported: true, grounded: false, supportBlock: other };
    }
  }
  return { supported: false, grounded: false, supportBlock: null };
}

function wakeFloatingBlocks(world) {
  world.blocks.forEach((block) => {
    if (block.removed) return;
    const { supported, grounded, leftSupport, rightSupport, leftBlock, rightBlock } = getSupportState(world, block);
    const isBeam = block.w > block.h * 2.2;
    if (supported) {
      if (world.structuresAwake && isBeam && (!leftSupport || !rightSupport) && !grounded) {
        if (block.body.isSleeping) Sleeping.set(block.body, false);
        const dir = leftSupport ? 1 : rightSupport ? -1 : 0;
        if (dir !== 0) {
          block.tipCooldown = Math.max(0, (block.tipCooldown ?? 0) - 1);
          if (block.tipCooldown === 0) {
            Body.setAngularVelocity(block.body, block.body.angularVelocity + dir * 0.009);
            Body.setVelocity(block.body, {
              x: block.body.velocity.x + dir * 0.022,
              y: block.body.velocity.y + 0.01,
            });
            const supportBlock = leftSupport ? leftBlock : rightBlock;
            if (supportBlock && !supportBlock.removed) {
              if (supportBlock.body.isSleeping) Sleeping.set(supportBlock.body, false);
              Body.applyForce(supportBlock.body, supportBlock.body.position, {
                x: -dir * 0.000009 * supportBlock.body.mass,
                y: 0,
              });
            }
            block.tipCooldown = 8;
          }
        }
      }
      return;
    }
    if (block.body.position.y + block.h / 2 >= FLOOR_Y - 4) return;

    if (block.body.isSleeping) Sleeping.set(block.body, false);
    if (Math.abs(block.body.velocity.y) < 0.8) {
      Body.setVelocity(block.body, {
        x: block.body.velocity.x * 0.98,
        y: Math.max(block.body.velocity.y, 1.4),
      });
    }
    if (!grounded) {
      Body.applyForce(block.body, block.body.position, { x: 0, y: 0.0007 * block.body.mass });
    }
  });
}

function wakeUnsupportedPigs(world) {
  world.pigs.forEach((pig) => {
    if (pig.removed) return;
    const { supported, grounded, supportBlock } = getPigSupportState(world, pig);
    if (supported) {
      if (supportBlock && Math.abs(supportBlock.body.angle) > 0.04) {
        if (pig.body.isSleeping) Sleeping.set(pig.body, false);
        const slideDir = supportBlock.body.angle > 0 ? 1 : -1;
        Body.applyForce(pig.body, pig.body.position, {
          x: slideDir * 0.00018 * pig.body.mass,
          y: 0,
        });
      }
      return;
    }
    if (pig.body.position.y + pig.r >= FLOOR_Y - 4) return;

    if (pig.body.isSleeping) Sleeping.set(pig.body, false);
    if (Math.abs(pig.body.velocity.y) < 0.7) {
      Body.setVelocity(pig.body, {
        x: pig.body.velocity.x * 0.98,
        y: Math.max(pig.body.velocity.y, 1.1),
      });
    }
    if (!grounded) {
      Body.applyForce(pig.body, pig.body.position, { x: 0, y: 0.00045 * pig.body.mass });
    }
  });
}

function updateRenderPose(entity, dt) {
  if (!entity || entity.removed) return;
  const smoothing = clamp(1 - Math.exp(-dt * 46), 0.48, 0.94);
  if (entity.renderX === undefined) {
    entity.renderX = entity.body.position.x;
    entity.renderY = entity.body.position.y;
    entity.renderAngle = entity.body.angle;
    return;
  }
  entity.renderX += (entity.body.position.x - entity.renderX) * smoothing;
  entity.renderY += (entity.body.position.y - entity.renderY) * smoothing;
  entity.renderAngle += (entity.body.angle - entity.renderAngle) * smoothing;
}

function updateRenderState(world, dt) {
  world.blocks.forEach((block) => updateRenderPose(block, dt));
  world.pigs.forEach((pig) => updateRenderPose(pig, dt));
  if (world.activeBird) updateRenderPose(world.activeBird, dt);
  world.extraBirds.forEach((bird) => updateRenderPose(bird, dt));
}

function hasSceneMotion(world) {
  if (world.activeBird?.body.speed > 1.2) return true;
  if (world.extraBirds.some((bird) => bird.body.speed > 1.2)) return true;
  if (world.blocks.some((block) => !block.removed && block.body.speed > 0.7)) return true;
  return world.pigs.some((pig) => !pig.removed && pig.body.speed > 0.65);
}

function updateBirdState(world, dt) {
  const bird = world.activeBird;
  if (!bird) return;
  bird.life += dt;

  if (bird.type === "blue" && !bird.splitDone && bird.life > 0.1) {
    splitBlueBird(world, bird);
  }

  if (bird.type === "yellow" && bird.boosted && bird.body) {
    Body.setAngularVelocity(bird.body, bird.body.angularVelocity * 0.92);
  }

  if (bird.impact && bird.body.speed < 0.9) bird.stuckTime = (bird.stuckTime ?? 0) + dt;
  else bird.stuckTime = 0;
  const touchedGround = bird.body.position.y + bird.r >= FLOOR_Y - 2;
  const touchedWall = bird.body.position.x <= bird.r + 4 || bird.body.position.x >= DESIGN_WIDTH - bird.r - 4;
  if ((touchedGround || touchedWall) && bird.life > 0.12) {
    bird.groundTime = (bird.groundTime ?? 0) + dt;
  } else {
    bird.groundTime = 0;
  }

  if (
    bird.body.position.y > 1300 ||
    bird.body.position.x > 2300 ||
    bird.body.position.x < -200 ||
    (bird.impact && bird.body.speed < 1.5 && bird.life > 0.22) ||
    (bird.stuckTime ?? 0) > 0.16 ||
    (bird.groundTime ?? 0) > 0.12
  ) {
    bird.removed = true;
    Composite.remove(world.engine.world, bird.body);
    world.activeBird = null;
    world.status = world.birdsQueue.length ? STRINGS.statuses.nextBird : STRINGS.statuses.noBirds;
    refreshHud();
  }
}

function updateExtraBirdState(world, dt) {
  world.extraBirds = world.extraBirds.filter((bird) => {
    bird.life += dt;
    if (bird.impact && bird.body.speed < 0.8) bird.stuckTime = (bird.stuckTime ?? 0) + dt;
    else bird.stuckTime = 0;
    const touchedGround = bird.body.position.y + bird.r >= FLOOR_Y - 2;
    const touchedWall = bird.body.position.x <= bird.r + 4 || bird.body.position.x >= DESIGN_WIDTH - bird.r - 4;
    if ((touchedGround || touchedWall) && bird.life > 0.1) bird.groundTime = (bird.groundTime ?? 0) + dt;
    else bird.groundTime = 0;
    if (
      bird.body.position.y > 1300 ||
      bird.body.position.x > 2300 ||
      bird.body.position.x < -200 ||
      (bird.impact && bird.body.speed < 1.2 && bird.life > 0.2) ||
      (bird.stuckTime ?? 0) > 0.14 ||
      (bird.groundTime ?? 0) > 0.1
    ) {
      bird.removed = true;
      Composite.remove(world.engine.world, bird.body);
      return false;
    }
    return true;
  });
}

function updateParticles(world, dt) {
  world.particles = world.particles.filter((particle) => {
    particle.ttl -= dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += 180 * dt;
    particle.vx *= 0.985;
    return particle.ttl > 0;
  });
}

function updateGroundDamage(world) {
  world.blocks.forEach((block) => {
    if (block.removed) return;
    const touchingGround = block.body.position.y + block.h / 2 >= FLOOR_Y - 3;
    if (!touchingGround) {
      block.groundCooldown = 0;
      block.groundPressTime = 0;
      return;
    }
    if (block.groundCooldown > 0) {
      block.groundCooldown -= 1;
      return;
    }
    const impact = Math.abs(block.body.velocity.y) + Math.abs(block.body.angularVelocity) * 18;
    if (block.material === "tnt") {
      const pressForce = impact + Math.abs(block.body.velocity.x) * 0.8;
      block.groundPressTime = pressForce > 4.8 ? (block.groundPressTime ?? 0) + world.lastDeltaMs / 1000 : 0;
      if (pressForce > 10 || (block.groundPressTime ?? 0) > 0.18) {
        explodeTnt(world, block);
        return;
      }
    }
    if (impact > 8.5) {
      damageBlock(world, block, impact * 0.35);
      playImpactSound(impact * 0.5);
      block.groundCooldown = 12;
    }
  });
}

function updatePigCrushing(world, dt) {
  world.pigs.forEach((pig) => {
    if (pig.removed) return;
    let pressed = false;
    world.blocks.forEach((block) => {
      if (block.removed) return;
      const dx = Math.abs(block.body.position.x - pig.body.position.x);
      const topOfPig = pig.body.position.y - pig.r;
      const bottomOfBlock = block.body.position.y + block.h / 2;
      const dy = bottomOfBlock - topOfPig;
      const closeX = dx < block.w / 2 + pig.r + 6;
      const pressing = dy > -10 && dy < 28 && block.body.position.y < pig.body.position.y && block.body.mass > pig.body.mass * 0.65;
      if (!closeX || !pressing) return;
      pressed = true;
    });
    pig.crushTime = pressed ? (pig.crushTime ?? 0) + dt : 0;
    if (pig.crushTime > 1.15) damagePig(world, pig, dt * 4.2);
  });
}

function updateBlockCrushing(world, dt) {
  world.blocks.forEach((lower) => {
    if (lower.removed) return;
    let pressure = 0;
    world.blocks.forEach((upper) => {
      if (upper === lower || upper.removed) return;
      if (upper.body.position.y >= lower.body.position.y) return;
      const dx = Math.abs(upper.body.position.x - lower.body.position.x);
      const topOfLower = lower.body.position.y - lower.h / 2;
      const bottomOfUpper = upper.body.position.y + upper.h / 2;
      const dy = bottomOfUpper - topOfLower;
      const closeX = dx < upper.w / 2 + lower.w / 2 - 6;
      const pressing = dy > -8 && dy < 22 && upper.body.mass > lower.body.mass * 0.75;
      if (!closeX || !pressing) return;
      pressure = Math.max(pressure, upper.body.mass / Math.max(lower.body.mass, 0.0001));
    });
    lower.squeezeTime = pressure > 0 ? (lower.squeezeTime ?? 0) + dt : 0;
    if (lower.material === "tnt" && pressure > 0 && lower.squeezeTime > 0.22) {
      explodeTnt(world, lower);
      return;
    }
    if (lower.squeezeTime > 1.15 && pressure > 0) {
      damageBlock(world, lower, dt * 1.55 * pressure);
    }
  });
}

function checkOutcome(world) {
  const pigsLeft = world.pigs.filter((pig) => !pig.removed).length;
  if (pigsLeft === 0 && !world.outcome) {
    world.clearTimer += world.lastDeltaMs / 1000;
    if (world.clearTimer === world.lastDeltaMs / 1000) {
      world.status = STRINGS.statuses.settling;
      refreshHud();
    }
    if (world.clearTimer > 0.35 && (!hasSceneMotion(world) || world.clearTimer > 0.9)) {
      saveLevelProgress(world.level.id);
      rebuildLevelCards();
      world.outcome = "win";
      world.status = STRINGS.statuses.allCleared;
      refreshHud();
      playWinSound();
      showOverlay(STRINGS.overlay.win.eyebrow, STRINGS.overlay.win.title, STRINGS.overlay.win.text, STRINGS.overlay.win.button, "next");
    }
  } else if (!world.activeBird && world.extraBirds.length === 0 && !world.birdsQueue.length && !world.outcome) {
    world.outcome = "lose";
    world.status = STRINGS.statuses.outOfBirds;
    refreshHud();
    showOverlay(STRINGS.overlay.retry.eyebrow, STRINGS.overlay.retry.title, STRINGS.overlay.retry.text, STRINGS.overlay.retry.button, "retry");
  } else {
    world.clearTimer = 0;
  }
}

function stepWorld(deltaMs) {
  if (state.mode !== "game" || !state.world || state.world.outcome) return;
  const world = state.world;
  world.lastDeltaMs = deltaMs;
  Engine.update(world.engine, deltaMs);

  const dt = deltaMs / 1000;
  if (world.structuresAwake) {
    wakeFloatingBlocks(world);
    wakeUnsupportedPigs(world);
  }
  updateBirdState(world, dt);
  updateExtraBirdState(world, dt);
  updateParticles(world, dt);
  if (world.structuresAwake) {
    updatePigCrushing(world, dt);
    updateBlockCrushing(world, dt);
    updateGroundDamage(world);
  }
  updateAmbientAudio(dt);
  pruneRemoved(world);
  updateRenderState(world, dt);
  checkOutcome(world);
}

function drawBackground(level) {
  const grad = ctx.createLinearGradient(0, 0, 0, DESIGN_HEIGHT);
  grad.addColorStop(0, level.palette.skyTop);
  grad.addColorStop(1, level.palette.skyBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);

  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath();
  ctx.ellipse(260, 170, 180, 42, 0, 0, Math.PI * 2);
  ctx.ellipse(620, 220, 140, 34, 0, 0, Math.PI * 2);
  ctx.ellipse(1040, 130, 220, 52, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = level.palette.dust;
  ctx.beginPath();
  ctx.arc(1580, 160, 100, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.26)";
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.fillStyle = "rgba(23, 33, 54, 0.18)";
  ctx.beginPath();
  ctx.moveTo(-80, FLOOR_Y);
  ctx.lineTo(180, 700);
  ctx.lineTo(390, FLOOR_Y);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(210, FLOOR_Y);
  ctx.lineTo(520, 640);
  ctx.lineTo(920, FLOOR_Y);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(840, FLOOR_Y);
  ctx.lineTo(1230, 680);
  ctx.lineTo(1580, FLOOR_Y);
  ctx.closePath();
  ctx.fill();

  const groundGrad = ctx.createLinearGradient(0, FLOOR_Y, 0, DESIGN_HEIGHT);
  groundGrad.addColorStop(0, "#9b734e");
  groundGrad.addColorStop(1, "#684730");
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, FLOOR_Y, DESIGN_WIDTH, DESIGN_HEIGHT - FLOOR_Y);
  ctx.fillStyle = "#c39867";
  ctx.fillRect(0, FLOOR_Y, DESIGN_WIDTH, 22);
  ctx.fillStyle = "rgba(241, 217, 178, 0.22)";
  for (let x = -20; x < DESIGN_WIDTH + 60; x += 86) {
    ctx.beginPath();
    ctx.arc(x, FLOOR_Y + 10, 18, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMenuBackdrop() {
  const grad = ctx.createLinearGradient(0, 0, 0, DESIGN_HEIGHT);
  grad.addColorStop(0, "#09172b");
  grad.addColorStop(1, "#2c5a8a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);

  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.beginPath();
  ctx.ellipse(310, 180, 240, 56, 0, 0, Math.PI * 2);
  ctx.ellipse(1090, 160, 290, 62, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(0,0,0,0.16)";
  ctx.beginPath();
  ctx.moveTo(-120, DESIGN_HEIGHT);
  ctx.lineTo(220, 700);
  ctx.lineTo(560, DESIGN_HEIGHT);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(420, DESIGN_HEIGHT);
  ctx.lineTo(860, 620);
  ctx.lineTo(1320, DESIGN_HEIGHT);
  ctx.closePath();
  ctx.fill();
}

function drawSlingshot(world) {
  const pull = world.aiming ? world.drag : vec(SLING.x, SLING.y);
  ctx.lineCap = "round";
  ctx.strokeStyle = "#4a2613";
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(SLING.x - 56, SLING.y + 22);
  ctx.lineTo(SLING.x - 6, SLING.y + 8);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(SLING.x + 2, SLING.y + 170);
  ctx.lineTo(SLING.x + 2, SLING.y - 30);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(SLING.x + 2, SLING.y + 18);
  ctx.lineTo(SLING.x + 34, SLING.y - 118);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(SLING.x + 8, SLING.y + 22);
  ctx.lineTo(SLING.x + 92, SLING.y - 114);
  ctx.stroke();

  ctx.strokeStyle = "#cf965e";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(SLING.x + 8, SLING.y + 162);
  ctx.lineTo(SLING.x + 8, SLING.y - 42);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(SLING.x + 12, SLING.y + 10);
  ctx.lineTo(SLING.x + 38, SLING.y - 108);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(SLING.x + 16, SLING.y + 16);
  ctx.lineTo(SLING.x + 84, SLING.y - 106);
  ctx.stroke();

  const leftAnchor = vec(SLING.x + 34, SLING.y - 118);
  const rightAnchor = vec(SLING.x + 92, SLING.y - 114);
  ctx.strokeStyle = "#3d2013";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(leftAnchor.x, leftAnchor.y);
  ctx.lineTo(pull.x, pull.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(rightAnchor.x, rightAnchor.y);
  ctx.lineTo(pull.x, pull.y);
  ctx.stroke();
  ctx.fillStyle = "#7b4d30";
  roundRect(ctx, pull.x - 16, pull.y - 9, 32, 18, 6);
  ctx.fill();
}

function drawBird(bird, x = bird.renderX ?? bird.body.position.x, y = bird.renderY ?? bird.body.position.y, r = bird.r) {
  const def = BIRDS[bird.type ?? "blue"] || BIRDS.red;
  const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.4, 2, x, y, r + 8);
  grad.addColorStop(0, "#fff5e0");
  grad.addColorStop(0.18, def.color);
  grad.addColorStop(1, def.outline);
  ctx.fillStyle = grad;
  ctx.strokeStyle = def.outline;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(x - r * 0.24, y - r * 0.18, Math.max(5, r * 0.22), 0, Math.PI * 2);
  ctx.arc(x + r * 0.18, y - r * 0.18, Math.max(5, r * 0.22), 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#121212";
  ctx.beginPath();
  ctx.arc(x - r * 0.2, y - r * 0.14, Math.max(2, r * 0.09), 0, Math.PI * 2);
  ctx.arc(x + r * 0.14, y - r * 0.14, Math.max(2, r * 0.09), 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f2a53f";
  ctx.beginPath();
  ctx.moveTo(x + r - 2, y);
  ctx.lineTo(x + r + 14, y - 7);
  ctx.lineTo(x + r + 14, y + 7);
  ctx.closePath();
  ctx.fill();
}

function drawPig(entity) {
  if (entity.removed) return;
  const x = entity.renderX ?? entity.body.position.x;
  const y = entity.renderY ?? entity.body.position.y;
  const pigGrad = ctx.createRadialGradient(x - 8, y - 10, 4, x, y, entity.r + 8);
  pigGrad.addColorStop(0, entity.helmet ? "#ccf08d" : "#c8f192");
  pigGrad.addColorStop(1, entity.helmet ? "#72ad4c" : "#80c954");
  ctx.fillStyle = pigGrad;
  ctx.strokeStyle = "#4f7c36";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x, y, entity.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(x - 7, y - 3, 5, 0, Math.PI * 2);
  ctx.arc(x + 7, y - 3, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#111111";
  ctx.beginPath();
  ctx.arc(x - 7, y - 2, 2, 0, Math.PI * 2);
  ctx.arc(x + 7, y - 2, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#8fb56e";
  ctx.beginPath();
  ctx.ellipse(x, y + 9, 10, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  if (entity.helmet) {
    ctx.fillStyle = "#9ba6b6";
    roundRect(ctx, x - 20, y - 28, 40, 14, 6);
    ctx.fill();
    ctx.strokeStyle = "#6f7b8d";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawBlock(entity) {
  if (entity.removed) return;
  const x = entity.renderX ?? entity.body.position.x;
  const y = entity.renderY ?? entity.body.position.y;
  const angle = entity.renderAngle ?? entity.body.angle;
  const mat = MATERIALS[entity.material];
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const left = -entity.w / 2;
  const top = -entity.h / 2;

  const grad = ctx.createLinearGradient(left, top, left + entity.w, top + entity.h);
  grad.addColorStop(0, mat.color);
  grad.addColorStop(1, mat.outline);
  ctx.fillStyle = grad;
  ctx.strokeStyle = mat.outline;
  ctx.lineWidth = 4;
  roundRect(ctx, left, top, entity.w, entity.h, 7);
  ctx.fill();
  ctx.stroke();

  ctx.lineWidth = 2;
  if (entity.material === "wood") {
    ctx.strokeStyle = "rgba(85,47,20,0.35)";
    ctx.beginPath();
    ctx.moveTo(left + 10, top + entity.h * 0.34);
    ctx.lineTo(left + entity.w - 10, top + entity.h * 0.3);
    ctx.moveTo(left + 14, top + entity.h * 0.68);
    ctx.lineTo(left + entity.w - 14, top + entity.h * 0.64);
    ctx.stroke();
  } else if (entity.material === "glass") {
    ctx.strokeStyle = "rgba(255,255,255,0.38)";
    ctx.beginPath();
    ctx.moveTo(left + 10, top + 8);
    ctx.lineTo(left + entity.w - 10, top + entity.h - 8);
    ctx.stroke();
  } else if (entity.material === "tnt") {
    ctx.strokeStyle = "rgba(255,235,194,0.85)";
    ctx.font = "700 13px 'Avenir Next'";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffe8b1";
    ctx.fillText("TNT", 0, 0);
    ctx.strokeStyle = "rgba(110,20,16,0.65)";
    ctx.beginPath();
    ctx.moveTo(left + 8, top + 8);
    ctx.lineTo(left + entity.w - 8, top + entity.h - 8);
    ctx.moveTo(left + entity.w - 8, top + 8);
    ctx.lineTo(left + 8, top + entity.h - 8);
    ctx.stroke();
  } else {
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.beginPath();
    ctx.moveTo(left + 8, top + entity.h * 0.28);
    ctx.lineTo(left + entity.w - 8, top + entity.h * 0.28);
    ctx.moveTo(left + 16, top + entity.h * 0.66);
    ctx.lineTo(left + entity.w - 16, top + entity.h * 0.66);
    ctx.stroke();
  }
  if (entity.isLever) {
    ctx.fillStyle = "#d9d2c1";
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#63584d";
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawTrajectory() {
  if (!state.world?.aiming) return;
  const world = state.world;
  const releasePoint = world.drag;
  const pull = sub(SLING, releasePoint);
  let velocity = vec(pull.x * LAUNCH_SCALE, pull.y * LAUNCH_SCALE);
  const birdType = world.birdsQueue[0];
  if (birdType === "yellow") velocity = mul(velocity, 1.18);
  if (birdType === "black") velocity = mul(velocity, 0.92);
  const variants = birdType === "blue" ? [rotate(velocity, -0.18), velocity, rotate(velocity, 0.18)] : [velocity];

  variants.forEach((variant, index) => {
    const tempBody = Bodies.circle(releasePoint.x, releasePoint.y, BIRDS[birdType].radius, {
      friction: 0.02,
      restitution: 0.12,
      density: birdType === "black" ? 0.0016 : 0.0011,
      frictionAir: 0.002,
    });
    Body.setVelocity(tempBody, variant);
    ctx.fillStyle = variants.length === 1 ? "#ffffff" : index === 1 ? "#ffffff" : "#8fdcff";
    for (let step = 0; step < 52; step += 1) {
      tempBody.force.x = 0;
      tempBody.force.y = tempBody.mass * world.engine.gravity.y * world.engine.gravity.scale;
      Body.update(tempBody, FIXED_STEP_MS);
      tempBody.force.x = 0;
      tempBody.force.y = 0;
      ctx.beginPath();
      ctx.arc(tempBody.position.x, tempBody.position.y, Math.max(1.5, 5 - step * 0.08), 0, Math.PI * 2);
      ctx.fill();
      if (tempBody.position.y >= FLOOR_Y || tempBody.position.x < 0 || tempBody.position.x > DESIGN_WIDTH) break;
    }
  });
}

function renderGame() {
  drawBackground(state.world.level);
  drawSlingshot(state.world);
  drawTrajectory();

  state.world.blocks.forEach(drawBlock);
  state.world.pigs.forEach(drawPig);

  state.world.particles.forEach((particle) => {
    ctx.fillStyle = particle.color;
    ctx.globalAlpha = Math.max(0, particle.ttl * 1.6);
    if (particle.glow) {
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
    }
    ctx.globalAlpha = 1;
  });

  state.world.extraBirds.forEach((bird) => drawBird(bird));
  if (state.world.activeBird) drawBird(state.world.activeBird);
  else if (state.world.birdsQueue.length) {
    const previewPos = state.world.aiming ? state.world.drag : SLING;
    drawBird({ type: state.world.birdsQueue[0], body: { position: previewPos }, r: BIRDS[state.world.birdsQueue[0]].radius }, previewPos.x, previewPos.y, BIRDS[state.world.birdsQueue[0]].radius);
  }
}

function renderBackdrop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(state.viewport.offsetX, state.viewport.offsetY);
  ctx.scale(state.viewport.scale, state.viewport.scale);
  if (state.mode === "game" && state.world) renderGame();
  else drawMenuBackdrop();
  ctx.restore();
}

function frame(ts) {
  if (!state.lastTs) state.lastTs = ts;
  const deltaMs = Math.min(MAX_FRAME_DELTA, ts - state.lastTs || FIXED_STEP_MS);
  state.lastTs = ts;
  state.accumulator += deltaMs;

  if (state.mode === "game" && state.world && !state.world.outcome) {
    let steps = 0;
    while (state.accumulator >= FIXED_STEP_MS && steps < MAX_PHYSICS_STEPS) {
      stepWorld(FIXED_STEP_MS);
      state.accumulator -= FIXED_STEP_MS;
      steps += 1;
    }
    if (steps === MAX_PHYSICS_STEPS) state.accumulator = 0;
  }

  renderBackdrop();
  requestAnimationFrame(frame);
}

function onPointerDown(event) {
  unlockAudio();
  if (state.mode !== "game" || !state.world || state.world.outcome) return;
  const p = toWorldPoint(event.clientX, event.clientY);
  state.pointer.down = true;
  state.pointer.x = p.x;
  state.pointer.y = p.y;

  if (state.world.activeBird?.type === "yellow" && !state.world.activeBird.boosted) {
    const bird = state.world.activeBird;
    const dir = normalize(bird.body.velocity);
    Body.setVelocity(bird.body, add(bird.body.velocity, mul(dir, 5.6)));
    bird.boosted = true;
    state.world.status = STRINGS.statuses.yellowBoost;
    refreshHud();
    return;
  }

  if (state.world.activeBird?.type === "blue" && !state.world.activeBird.splitDone) {
    splitBlueBird(state.world, state.world.activeBird);
    return;
  }

  if (state.world.activeBird || !state.world.birdsQueue.length) return;
  if (Math.hypot(p.x - SLING.x, p.y - SLING.y) <= 92) {
    state.world.aiming = true;
    state.world.drag = p;
  }
}

function onPointerMove(event) {
  const p = toWorldPoint(event.clientX, event.clientY);
  state.pointer.x = p.x;
  state.pointer.y = p.y;
  if (state.mode === "game" && state.world?.aiming) {
    const delta = sub(p, SLING);
    const dist = length(delta);
    state.world.drag = dist > MAX_PULL ? add(SLING, mul(normalize(delta), MAX_PULL)) : p;
  }
}

function createBirdBody(type, releasePoint, pull) {
  const def = BIRDS[type];
  const body = Bodies.circle(releasePoint.x, releasePoint.y, def.radius, {
    friction: 0.02,
    restitution: 0.12,
    density: type === "black" ? 0.0016 : 0.0011,
    frictionAir: 0.002,
    label: `bird:${type}`,
  });
  const bird = {
    kind: "bird",
    type,
    body,
    r: def.radius,
    life: 0,
    splitDone: false,
    boosted: false,
    impact: false,
    removed: false,
    exploded: false,
    stuckTime: 0,
    renderX: releasePoint.x,
    renderY: releasePoint.y,
    renderAngle: 0,
  };
  body.plugin.entity = bird;
  const speedFactor = type === "yellow" ? 1.18 : type === "black" ? 0.92 : 1;
  Body.setVelocity(body, {
    x: pull.x * LAUNCH_SCALE * speedFactor,
    y: pull.y * LAUNCH_SCALE * speedFactor,
  });
  return bird;
}

function onPointerUp() {
  unlockAudio();
  state.pointer.down = false;
  if (state.mode !== "game" || !state.world?.aiming) return;
  const releasePoint = { ...state.world.drag };
  const pull = sub(SLING, state.world.drag);
  state.world.aiming = false;
  if (length(pull) < 10) return;

  const type = state.world.birdsQueue.shift();
  if (!type) return;

  const bird = createBirdBody(type, releasePoint, pull);
  state.world.activeBird = bird;
  World.add(state.world.engine.world, bird.body);
  playLaunchSound(type);
  spawnBurst(state.world, releasePoint.x, releasePoint.y, BIRDS[type].color, 6);
  state.world.status = `${BIRDS[type].label} gelanceerd.`;
  refreshHud();
}

document.getElementById("menuStartBtn").addEventListener("click", (event) => {
  unlockAudio();
  event.stopPropagation();
  const acknowledged = localStorage.getItem(NOTICE_ACK_KEY) === "1";
  if (!acknowledged) {
    showOverlay(
      STRINGS.overlay.notice.eyebrow,
      STRINGS.overlay.notice.title,
      STRINGS.overlay.notice.text,
      STRINGS.overlay.notice.button,
      "open-levels"
    );
    return;
  }
  setMode("levels");
});

document.getElementById("backToMenuBtn").addEventListener("click", (event) => {
  unlockAudio();
  event.stopPropagation();
  setMode("menu");
});

document.getElementById("restartBtn").addEventListener("click", (event) => {
  unlockAudio();
  event.stopPropagation();
  startLevel(state.levelIndex);
});

settingsBtn.addEventListener("click", (event) => {
  unlockAudio();
  event.stopPropagation();
  settingsPanel.classList.toggle("hidden");
});

closeSettingsBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  settingsPanel.classList.add("hidden");
});

volumeSlider.addEventListener("input", () => {
  const settings = loadAudioSettings();
  settings.volume = clamp(Number(volumeSlider.value) / 100, 0, 5);
  saveAudioSettings(settings);
  applyAudioSettings();
});

muteBtn.addEventListener("click", () => {
  const settings = loadAudioSettings();
  settings.muted = !settings.muted;
  saveAudioSettings(settings);
  applyAudioSettings();
});

overlayBtn.addEventListener("click", () => {
  unlockAudio();
  overlay.classList.add("hidden");
  if (state.overlayAction === "open-levels") {
    localStorage.setItem(NOTICE_ACK_KEY, "1");
    state.overlayAction = null;
    setMode("levels");
    return;
  }
  if (!state.world) return;
  if (state.world.outcome === "win" && state.levelIndex < LEVELS.length - 1) startLevel(state.levelIndex + 1);
  else if (state.world.outcome === "win") setMode("levels");
  else startLevel(state.levelIndex);
  state.overlayAction = null;
});

window.addEventListener("resize", resize);
window.addEventListener("pointerdown", unlockAudio, { capture: true });
canvas.addEventListener("pointerdown", onPointerDown);
canvas.addEventListener("pointermove", onPointerMove);
canvas.addEventListener("pointerup", onPointerUp);

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && state.mode === "game") setMode("levels");
  if (event.key === " " && state.mode === "game" && state.world?.activeBird?.type === "yellow") {
    const bird = state.world.activeBird;
    if (!bird.boosted) {
      const dir = normalize(bird.body.velocity);
      Body.setVelocity(bird.body, add(bird.body.velocity, mul(dir, 5.6)));
      bird.boosted = true;
    }
  }
});

rebuildBirdCards();
rebuildLevelCards();
applyAudioSettings();
resize();
setMode("menu");
requestAnimationFrame(frame);

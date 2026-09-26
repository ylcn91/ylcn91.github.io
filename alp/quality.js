import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/* =========================================================
   Quality loop: eight stations on an oval track. Scroll moves
   the camera around the loop; each station plays one beat.
   ========================================================= */

const section = document.getElementById('quality');
const stage = document.getElementById('qStage');
const canvas = document.getElementById('qCanvas');
const staticEl = document.getElementById('qStatic');
const beatEls = [...document.querySelectorAll('.q-beat')];
const railSpans = [...document.querySelectorAll('.q-rail span')];
const railFill = document.getElementById('qRailFill');

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const win = (t, a, b, f = 0.05) => Math.min(smooth(a, a + f, t), 1 - smooth(b - f, b, t));

/* ---------- beats and scroll map ---------- */
// Longer weights give a beat more scroll. The last beats are the slowest.
const WEIGHTS = [1, 0.85, 1.5, 1.05, 1.25, 1.05, 1.2, 1.6];
const TOTAL = WEIGHTS.reduce((a, b) => a + b, 0);
const STARTS = WEIGHTS.map((_, i) => WEIGHTS.slice(0, i).reduce((a, b) => a + b, 0) / TOTAL);
function beatAt(p) {
  let i = 0;
  while (i < 7 && p >= STARTS[i + 1]) i++;
  const len = WEIGHTS[i] / TOTAL;
  return { i, t: clamp((p - STARTS[i]) / len, 0, 1) };
}

function updateDom(p) {
  const { i } = beatAt(p);
  beatEls.forEach((el, k) => el.classList.toggle('on', k === i));
  railSpans.forEach((el, k) => { el.classList.toggle('on', k <= i); el.classList.toggle('now', k === i); });
  railFill.style.width = `${(p * 100).toFixed(2)}%`;
  stage.classList.toggle('go', p > 0.04);
}

function goStatic() {
  section.classList.add('static');
  staticEl.hidden = false;
}

if (reduce) goStatic();
else {
  updateDom(0);
  // Build only when the section is near, so the page above stays light.
  const near = new IntersectionObserver(es => {
    if (!es[0].isIntersecting) return;
    near.disconnect();
    init().catch(e => { console.error('quality init', e); goStatic(); });
  }, { rootMargin: '150% 0px 150% 0px' });
  near.observe(section);
}

/* =========================================================
   Canvas drawing helpers
   ========================================================= */
const INK = '#1D252C', INK2 = '#3F4851', GREY = '#8A949E', LINE = '#E3E6E4', STEEL = '#EEF0EE';
const BLUE = '#1E5E45', BLUEPRINT = '#DCEBE2', RED = '#D4533F', GREEN = '#3E9B5F', AMBER = '#F0B45D';
const F_MONO = '"JetBrains Mono", ui-monospace, Menlo, monospace';
const F_UI = '"DM Sans", "Helvetica Neue", Arial, sans-serif';
const F_DISP = '"Bricolage Grotesque", "Helvetica Neue", Arial, sans-serif';

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  draw(x, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.userData = { c, x };
  return t;
}
function redraw(tex, draw) {
  const { c, x } = tex.userData;
  x.clearRect(0, 0, c.width, c.height);
  draw(x, c.width, c.height);
  tex.needsUpdate = true;
}
function rr(x, X, Y, W, H, R) { x.beginPath(); x.roundRect(X, Y, W, H, R); }
function pill(x, X, Y, text, fg, bg, size = 22) {
  x.font = `600 ${size}px ${F_MONO}`;
  const w = x.measureText(text).width + size * 1.2;
  rr(x, X, Y, w, size * 1.7, size * 0.85); x.fillStyle = bg; x.fill();
  x.fillStyle = fg; x.textBaseline = 'middle'; x.fillText(text, X + size * 0.6, Y + size * 0.87);
  return w;
}

/* =========================================================
   Scene
   ========================================================= */
async function init() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { goStatic(); return; }
  try {
    await Promise.all([
      document.fonts.load(`600 40px ${F_UI}`), document.fonts.load(`500 30px ${F_MONO}`), document.fonts.load(`800 40px ${F_DISP}`),
    ]);
  } catch (e) { /* fallback faces */ }

  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.5;
  scene.fog = new THREE.Fog(0xF1F3F2, 34, 70);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 200);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xF3E6D2, 1.25));
  const fill = new THREE.DirectionalLight(0xDCEBE2, 0.7);
  fill.position.set(18, 10, -6);
  scene.add(fill);
  const rimL = new THREE.DirectionalLight(0xffffff, 0.9);
  rimL.position.set(4, 14, -22);
  scene.add(rimL);
  const sun = new THREE.DirectionalLight(0xFFF3E4, 2.3);
  sun.position.set(-10, 26, 18);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -24, right: 24, top: 20, bottom: -20, near: 2, far: 80 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);

  /* ---------- materials ---------- */
  const mFloor = new THREE.MeshStandardMaterial({ color: 0xEDF0EE, roughness: 0.9, metalness: 0 });
  const mPad = new THREE.MeshStandardMaterial({ color: 0xE6EAE8, roughness: 0.6, metalness: 0.08 });
  const mSteel = new THREE.MeshStandardMaterial({ color: 0xE3E7E5, roughness: 0.34, metalness: 0.55 });
  const mSteelDark = new THREE.MeshStandardMaterial({ color: 0xC5CCC8, roughness: 0.38, metalness: 0.6 });
  const mPaper = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.92, metalness: 0 });
  const mBlue = new THREE.MeshStandardMaterial({ color: 0x1E5E45, roughness: 0.3, metalness: 0.3 });
  const mAmber = new THREE.MeshStandardMaterial({ color: 0xF0B45D, roughness: 0.32, metalness: 0.2 });
  const mRed = new THREE.MeshStandardMaterial({ color: 0xD4533F, roughness: 0.4, metalness: 0.1 });
  const mInk = new THREE.MeshStandardMaterial({ color: 0x2A3138, roughness: 0.5, metalness: 0.1 });
  const shadowed = o => { o.castShadow = true; o.receiveShadow = true; return o; };
  const box = (w, h, d, m, r = 0.06) => shadowed(new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, r), m));
  const face = (w, h, tex) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, transparent: true }));

  /* ---------- labels (sprites, always legible) ---------- */
  function label(text, o = {}) {
    const { size = 40, mono = true, fg = INK, bg = '#FFFFFF', border = '#D3D8D5', h = 0.36, weight = 600 } = o;
    const f = `${weight} ${size}px ${mono ? F_MONO : F_UI}`;
    const m = document.createElement('canvas').getContext('2d');
    m.font = f;
    const pad = size * 0.7;
    const cw = Math.ceil(m.measureText(text).width + pad * 2), ch = Math.round(size * 1.9);
    const tex = canvasTex(cw, ch, (x, w, hh) => {
      if (bg) { rr(x, 3, 3, w - 6, hh - 6, hh / 2 - 3); x.fillStyle = bg; x.fill(); if (border) { x.lineWidth = 3; x.strokeStyle = border; x.stroke(); } }
      x.font = f; x.fillStyle = fg; x.textBaseline = 'middle'; x.fillText(text, pad, hh / 2 + 2);
    });
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false, toneMapped: false }));
    s.scale.set(h * cw / ch, h, 1);
    s.userData.base = s.scale.clone();
    s.renderOrder = 10;
    s.visible = false;
    return s;
  }
  function reveal(obj, v) {
    v = clamp(v, 0, 1);
    obj.visible = v > 0.002;
    if (obj.isSprite) {
      obj.material.opacity = v;
      obj.scale.copy(obj.userData.base).multiplyScalar(0.88 + 0.12 * v);
    } else {
      obj.traverse(o => { if (o.material) { o.material.transparent = true; o.material.opacity = v; } });
    }
  }

  /* ---------- floor, loop track ---------- */
  const RX = 15, RZ = 10.5, TH0 = Math.PI / 2, DTH = Math.PI * 2 / 8;
  const floor = new THREE.Mesh(new THREE.CircleGeometry(60, 64), mFloor);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.01;
  floor.receiveShadow = true;
  scene.add(floor);

  const curve2 = new THREE.EllipseCurve(0, 0, RX, RZ, TH0, TH0 + Math.PI * 2, false, 0);
  const pts = curve2.getPoints(256).map(v => new THREE.Vector3(v.x, 0.04, v.y));
  const path = new THREE.CatmullRomCurve3(pts, true);
  const trackGeo = new THREE.TubeGeometry(path, 400, 0.07, 8, true);
  const track = new THREE.Mesh(trackGeo, new THREE.MeshStandardMaterial({ color: 0xD3DDD7, roughness: 0.6 }));
  track.receiveShadow = true;
  scene.add(track);
  const progGeo = new THREE.TubeGeometry(path, 400, 0.1, 8, true);
  const prog = new THREE.Mesh(progGeo, mBlue);
  scene.add(prog);
  const progCount = progGeo.index.count;
  const puck = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.16, 32), mBlue));
  scene.add(puck);


  /* ---------- stations ---------- */
  const stations = [];
  for (let i = 0; i < 8; i++) {
    const th = TH0 + i * DTH;
    const g = new THREE.Group();
    g.position.set(RX * Math.cos(th), 0, RZ * Math.sin(th));
    g.rotation.y = Math.atan2(Math.cos(th), Math.sin(th));
    scene.add(g);
    const pad = box(i === 2 ? 8.6 : 6.4, 0.16, 4.6, mPad, 0.08);
    pad.position.set(0, 0.08, 0.2);
    g.add(pad);
    stations.push(g);
  }
  const W2 = (g, x, y, z) => g.localToWorld(new THREE.Vector3(x, y, z));

  /* ---------- the issue card that travels the loop ---------- */
  const CARD_STATES = {
    brief: ['TO DO', GREY, STEEL], preview: ['ON PREVIEW', BLUE, BLUEPRINT], fail: ['QA · FAIL', '#fff', RED],
    changes: ['CHANGES REQUESTED', '#fff', RED], retry: ['RETRY 1 OF 1', INK, '#FBE6C4'], resolved: ['RESOLVED 3/3', '#fff', GREEN],
    ready: ['READY', '#fff', GREEN], rtm: ['READY TO MERGE', '#fff', GREEN], merged: ['MERGED', '#fff', INK],
  };
  const drawCard = st => (x, w, h) => {
    const [txt, fg, bg] = CARD_STATES[st];
    rr(x, 0, 0, w, h, 26); x.fillStyle = '#fff'; x.fill();
    x.fillStyle = st === 'fail' || st === 'changes' ? RED : st === 'retry' ? AMBER : ['resolved', 'ready', 'rtm', 'merged'].includes(st) ? GREEN : BLUE;
    x.fillRect(0, 0, 14, h);
    x.font = `500 28px ${F_MONO}`; x.fillStyle = GREY; x.textBaseline = 'alphabetic'; x.fillText('ALP-4011', 44, 62);
    x.font = `700 46px ${F_DISP}`; x.fillStyle = INK;
    x.fillText('Filter panel won’t close', 44, 132); x.fillText('on mobile', 44, 186);
    pill(x, 44, h - 104, txt, fg, bg, 30);
    if (st === 'changes' || st === 'merged') {
      x.save(); x.translate(w * 0.64, h * 0.62); x.rotate(-0.16);
      const big = st === 'merged' ? 'MERGED' : 'CHANGES';
      x.font = `800 ${st === 'merged' ? 92 : 80}px ${F_DISP}`;
      const bw = x.measureText(big).width + 50;
      x.lineWidth = 9; x.strokeStyle = st === 'merged' ? GREEN : RED; x.globalAlpha = 0.92;
      rr(x, -bw / 2, -62, bw, 124, 18); x.stroke();
      x.fillStyle = st === 'merged' ? GREEN : RED; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(big, 0, 6);
      x.restore();
    }
  };
  const cardTex = canvasTex(768, 460, drawCard('brief'));
  let cardState = 'brief';
  const card = new THREE.Group();
  const cardBody = box(1.62, 0.97, 0.05, mPaper, 0.03);
  const cardFace = face(1.56, 0.93, cardTex);
  cardFace.position.z = 0.03;
  card.add(cardBody, cardFace);
  scene.add(card);
  function setCard(st) { if (st !== cardState) { cardState = st; redraw(cardTex, drawCard(st)); } }
  // Card pose per beat: station, local position, lying flat or upright.
  const CARD_POSE = [
    [0, [1.15, 1.05, 1.55], 0], [1, [1.6, 1.1, 0.35], 0], [2, [3.9, 1.3, 1.9], 0], [3, [-0.4, 1.05, 1.7], 0],
    [4, [0.45, 1.09, -0.3], -Math.PI / 2], [5, [0.25, 1.05, 1.45], 0], [5, [0.25, 1.05, 1.45], 0], [7, [-1.25, 1.25, 0.4], -0.5],
  ];
  const poseOf = k => {
    const [s, [x, y, z], flat] = CARD_POSE[k];
    const g = stations[s];
    const q = g.quaternion.clone();
    if (flat) q.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(flat, 0, 0)));
    return { p: W2(g, x, y, z), q };
  };
  const CARD_POSES = CARD_POSE.map((_, k) => poseOf(k));

  /* ======== S0 · Brief ======== */
  const S0 = {};
  {
    const g = stations[0];
    const legs = new THREE.Group();
    [-1.3, 1.3].forEach(x => { const l = box(0.08, 2.9, 0.08, mSteelDark, 0.03); l.position.set(x, 1.45, -0.45); legs.add(l); });
    legs.position.x = -0.9;
    g.add(legs);
    const briefTex = canvasTex(1320, 920, (x, w, h) => {
      x.fillStyle = '#fff'; x.fillRect(0, 0, w, h);
      x.font = `500 30px ${F_MONO}`; x.fillStyle = GREY; x.fillText('ALP-4011  ·  BRIEF', 64, 84);
      x.font = `800 60px ${F_DISP}`; x.fillStyle = INK; x.fillText('Filter panel won’t close on mobile', 64, 160);
      x.fillStyle = LINE; x.fillRect(64, 196, w - 128, 3);
      x.font = `600 28px ${F_MONO}`; x.fillStyle = GREY; x.fillText('ACCEPTANCE CRITERIA', 64, 254); x.fillText('COMMENTS, IN ORDER', 700, 254);
      const kk = [['KK-01', 'Panel closes on a tap outside'], ['KK-02', 'Page scroll unlocks after close'], ['KK-03', 'No layout shift, 375 to 1280']];
      kk.forEach(([k, t], i) => {
        const y = 300 + i * 92;
        rr(x, 64, y, 580, 74, 14); x.fillStyle = STEEL; x.fill();
        x.font = `600 26px ${F_MONO}`; x.fillStyle = BLUE; x.fillText(k, 86, y + 47);
        x.font = `500 29px ${F_UI}`; x.fillStyle = INK; x.fillText(t, 196, y + 47);
      });
      const cm = [['1', 'Seen on listing search at 390.', GREY], ['2', 'Also check the map view.', GREY], ['3', 'Keep the sort chip visible.', INK]];
      cm.forEach(([n, t, c], i) => {
        const y = 300 + i * 92;
        rr(x, 700, y, 556, 74, 14); x.fillStyle = i === 2 ? '#FFF4E0' : '#fff'; x.fill(); x.lineWidth = 2; x.strokeStyle = i === 2 ? AMBER : LINE; x.stroke();
        x.font = `600 26px ${F_MONO}`; x.fillStyle = GREY; x.fillText(n, 722, y + 47);
        x.font = `500 28px ${F_UI}`; x.fillStyle = c; x.fillText(t, 764, y + 47);
      });
      pill(x, 700, 582, 'LAST COMMENT WINS', INK, '#FBE6C4', 22);
      x.font = `600 28px ${F_MONO}`; x.fillStyle = GREY; x.fillText('ATTACHMENT', 64, 624);
      rr(x, 64, 650, 250, 220, 16); x.fillStyle = STEEL; x.fill();
      rr(x, 150, 666, 80, 188, 12); x.fillStyle = '#fff'; x.fill(); x.lineWidth = 3; x.strokeStyle = '#C9CFCB'; x.stroke();
      x.fillStyle = BLUEPRINT; x.fillRect(158, 700, 64, 60); x.fillStyle = LINE; x.fillRect(158, 770, 64, 10); x.fillRect(158, 790, 44, 10);
      x.beginPath(); x.arc(212, 712, 22, 0, Math.PI * 2); x.lineWidth = 4; x.strokeStyle = RED; x.stroke();
      x.font = `500 28px ${F_UI}`; x.fillStyle = INK2; x.fillText('screenshot.png', 340, 700);
      x.font = `500 24px ${F_MONO}`; x.fillStyle = GREY; x.fillText('390 × 844 · panel stays open', 340, 744);
    });
    const board = new THREE.Group();
    const back = box(3.5, 2.44, 0.08, mPaper, 0.04);
    const f = face(3.4, 2.37, briefTex);
    f.position.z = 0.045;
    board.add(back, f);
    board.position.set(-0.9, 1.72, -0.35);
    board.rotation.x = -0.08;
    g.add(board);
    S0.board = board;
    S0.chips = [label('brief.json'), label('acceptance criteria'), label('claims to verify')];
    S0.chips.forEach((c, i) => { c.position.copy(W2(g, 1.45, 3.35 - i * 0.48, 0.9)); scene.add(c); });
  }

  /* ======== S1 · Deploy gate ======== */
  const S1 = {};
  {
    const g = stations[1];
    const host = box(1.6, 2.1, 1.1, mSteel, 0.1);
    host.position.set(-1.7, 1.13, -0.4);
    g.add(host);
    const hostTex = canvasTex(512, 640, (x, w, h) => {
      rr(x, 0, 0, w, h, 30); x.fillStyle = '#FAFBFA'; x.fill();
      x.font = `600 34px ${F_MONO}`; x.fillStyle = INK; x.fillText('PREVIEW', 40, 80);
      x.font = `500 24px ${F_MONO}`; x.fillStyle = GREY;
      ['pr-4011.preview', '', 'image   7d2e5b1', 'pr head 7d2e5b1'].forEach((t, i) => x.fillText(t, 40, 150 + i * 46));
      for (let i = 0; i < 5; i++) { rr(x, 40, 380 + i * 44, w - 80, 28, 8); x.fillStyle = '#E6EAE8'; x.fill(); }
    });
    const hf = face(1.42, 1.78, hostTex);
    hf.position.set(-1.7, 1.13, 0.16);
    g.add(hf);
    const gate = new THREE.Group();
    [0.55, 2.75].forEach(x => { const p = box(0.22, 2.8, 0.22, mSteel, 0.06); p.position.set(x, 1.4, 0.2); gate.add(p); });
    const beam = box(2.6, 0.34, 0.34, mSteel, 0.08);
    beam.position.set(1.65, 2.9, 0.2);
    gate.add(beam);
    const lampMat = new THREE.MeshStandardMaterial({ color: 0xC9CFCB, emissive: 0x000000, roughness: 0.3 });
    const lamp = new THREE.Mesh(new RoundedBoxGeometry(2.2, 0.1, 0.06, 2, 0.03), lampMat);
    lamp.position.set(1.65, 2.72, 0.39);
    gate.add(lamp);
    const gl = canvasTex(1024, 128, (x, w, h) => { x.font = `600 58px ${F_MONO}`; x.fillStyle = INK; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('DEPLOY GATE', w / 2, h / 2 + 4); });
    const gtext = face(2.1, 0.26, gl);
    gtext.position.set(1.65, 2.92, 0.38);
    gate.add(gtext);
    g.add(gate);
    S1.lampMat = lampMat;
    S1.open = label('deploy gate: open · pr_head = image', { fg: '#2C7A48', border: '#9CCBAE' });
    S1.open.position.copy(W2(g, 1.2, 3.65, 0.4));
    scene.add(S1.open);
  }

  /* ======== S2 · Breaker attacks ======== */
  const S2 = { screens: [] };
  {
    const g = stations[2];
    const WIDTHS = [375, 390, 768, 1280];
    const SH = 1.12, GAP = 0.2;
    const ws = WIDTHS.map(px => px / 1280 * 2.3);
    const totalW = ws.reduce((a, b) => a + b, 0) + GAP * 3;
    const drawScreen = (px, isA, flagged) => (x, w, h) => {
      x.fillStyle = '#fff'; x.fillRect(0, 0, w, h);
      const u = h / 100;
      x.fillStyle = '#F2F4F3'; x.fillRect(0, 0, w, 10 * u);
      x.font = `600 ${4.6 * u}px ${F_MONO}`; x.fillStyle = GREY; x.textBaseline = 'middle';
      x.fillText(`${px}`, 3 * u, 5 * u);
      x.textAlign = 'right'; x.fillText(isA ? 'A · FIX' : 'B · CONTROL', w - 3 * u, 5 * u); x.textAlign = 'left';
      // sticky header
      const hdrY = isA ? 13 * u : 10 * u;
      x.fillStyle = '#E8F2EC'; x.fillRect(0, hdrY, w, 9 * u);
      x.font = `700 ${4.8 * u}px ${F_UI}`; x.fillStyle = INK; x.fillText('Listing search', 3 * u, hdrY + 4.5 * u);
      // filter chips
      let cx = 3 * u;
      ['Filters', 'Price', 'Rooms', 'Map'].forEach(c => {
        x.font = `600 ${3.6 * u}px ${F_UI}`;
        const cw = x.measureText(c).width + 5 * u;
        if (cx + cw < w - 2 * u) { rr(x, cx, 22 * u, cw, 7 * u, 3.5 * u); x.fillStyle = c === 'Filters' ? BLUE : STEEL; x.fill(); x.fillStyle = c === 'Filters' ? '#fff' : INK2; x.fillText(c, cx + 2.5 * u, 25.6 * u); }
        cx += cw + 2 * u;
      });
      const cols = px < 500 ? 1 : px < 900 ? 2 : 3;
      const cw = (w - 3 * u * (cols + 1)) / cols;
      for (let r = 0; r < 3; r++) for (let c = 0; c < cols; c++) {
        const X = 3 * u + c * (cw + 3 * u), Y = 33 * u + r * 23 * u;
        const over = isA && r === 1 && c === cols - 1 ? 7 * u : 0;
        rr(x, X, Y, cw + over, 20 * u, 2.5 * u); x.fillStyle = '#FBFCFB'; x.fill(); x.lineWidth = 1.5; x.strokeStyle = LINE; x.stroke();
        x.fillStyle = '#E4ECE7'; x.fillRect(X + 1.5 * u, Y + 1.5 * u, Math.min(14 * u, cw * 0.4), 17 * u);
        x.fillStyle = INK; x.font = `600 ${3.4 * u}px ${F_UI}`;
        const title = isA && r === 0 && c === 0 ? 'Sea-view flat with a lar' : 'Two-bed flat, city centre';
        x.save(); x.beginPath(); x.rect(X + 17 * u, Y, cw - 18 * u, 20 * u); x.clip();
        x.fillText(title, X + 17 * u, Y + 6 * u);
        x.restore();
        x.fillStyle = LINE; x.fillRect(X + 17 * u, Y + 11 * u, Math.max(4, cw * 0.35), 2 * u);
      }
      if (isA) { // sticky element sitting over text
        x.fillStyle = 'rgba(30,94,69,0.92)'; x.fillRect(w * 0.08, 34 * u, w * 0.84, 5 * u);
      }
      if (flagged) {
        x.setLineDash([2.2 * u, 1.4 * u]); x.lineWidth = 0.9 * u; x.strokeStyle = RED;
        x.strokeRect(w - 9 * u, 55 * u, 8 * u, 21 * u);
        x.strokeRect(w * 0.06, 32.5 * u, w * 0.88, 8 * u);
        x.strokeRect(16 * u, 33.5 * u, Math.max(10 * u, cw - 18 * u), 8 * u);
        x.setLineDash([]);
        x.font = `700 ${3.4 * u}px ${F_MONO}`; x.fillStyle = RED;
        x.fillText('OVERFLOW', Math.max(2 * u, w - 30 * u), 81 * u);
      }
    };
    const rows = [[true, 2.52], [false, 1.1]];
    let xs = -totalW / 2 + 0.2;
    const xPos = ws.map(wd => { const c = xs + wd / 2; xs += wd + GAP; return c; });
    rows.forEach(([isA, y]) => {
      WIDTHS.forEach((px, k) => {
        const cw = Math.round(px * 0.5 + 120), ch = 460;
        const clean = canvasTex(cw, ch, drawScreen(px, isA, false));
        const flag = isA ? canvasTex(cw, ch, drawScreen(px, isA, true)) : null;
        const bez = box(ws[k] + 0.1, SH + 0.1, 0.07, mSteel, 0.035);
        bez.position.set(xPos[k], y, -0.2);
        g.add(bez);
        const f = face(ws[k], SH, clean);
        f.position.set(xPos[k], y, -0.16);
        g.add(f);
        S2.screens.push({ f, clean, flag });
      });
      const rl = label(isA ? 'A · fix preview' : 'B · control', { h: 0.3 });
      rl.position.copy(W2(g, -totalW / 2 + 0.75, y + SH / 2 + 0.2, 0));
      scene.add(rl);
      (isA ? (S2.rowA = rl) : (S2.rowB = rl));
    });
    const standL = box(0.1, 3.2, 0.1, mSteelDark, 0.04); standL.position.set(-totalW / 2 - 0.05, 1.6, -0.3); g.add(standL);
    const standR = standL.clone(); standR.position.x = totalW / 2 + 0.45; g.add(standR);
    // laser
    const laser = new THREE.Group();
    laser.add(new THREE.Mesh(new THREE.PlaneGeometry(totalW + 0.5, 0.035), new THREE.MeshBasicMaterial({ color: 0xE4574A, transparent: true, opacity: 0.95, toneMapped: false })));
    laser.add(new THREE.Mesh(new THREE.PlaneGeometry(totalW + 0.5, 0.36), new THREE.MeshBasicMaterial({ color: 0xE4574A, transparent: true, opacity: 0.1, depthWrite: false, toneMapped: false })));
    laser.position.set(0.2, 3, -0.1);
    g.add(laser);
    S2.laser = laser;
    S2.scan = label('layout-scan · overflow · sticky overlap · clipped text', { fg: RED, border: '#EFB7AE' });
    S2.scan.position.copy(W2(g, 0.2, 3.62, 0));
    scene.add(S2.scan);
    // Midscene eye
    const eye = new THREE.Group();
    const ball = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.3, 40, 24), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 })));
    const iris = new THREE.Mesh(new THREE.CircleGeometry(0.15, 36), new THREE.MeshStandardMaterial({ color: 0x1E5E45, roughness: 0.3 }));
    iris.position.z = 0.296;
    const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.07, 30), new THREE.MeshBasicMaterial({ color: 0x1D252C }));
    pupil.position.z = 0.3;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.018, 8, 64), mBlue);
    eye.add(ball, iris, pupil, ring);
    eye.position.set(totalW / 2 + 0.95, 2.85, 0.55);
    g.add(eye);
    S2.eye = eye; S2.ring = ring;
    S2.mid = label('Midscene · aiBoolean "no layout defects" → false', { fg: RED, border: '#EFB7AE' });
    S2.mid.position.copy(W2(g, totalW / 2 - 0.2, 3.72, 0.6));
    scene.add(S2.mid);
    // pixel diff
    const drawDiff = red => (x, w, h) => {
      x.fillStyle = '#fff'; x.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 24) { x.fillStyle = (y / 24) % 2 ? '#F1F3F2' : '#E8EBE9'; x.fillRect(0, y, w, 24); }
      if (red) { x.fillStyle = 'rgba(212,83,63,0.85)'; x.fillRect(0, 168, w, 48); }
      x.font = `600 26px ${F_MONO}`; x.fillStyle = INK; x.fillText('PIXEL DIFF', 20, h - 22);
    };
    const diffA = canvasTex(360, 400, drawDiff(false));
    const diffB = canvasTex(360, 400, drawDiff(true));
    const diffBez = box(1.12, 1.24, 0.07, mSteel, 0.035);
    diffBez.position.set(totalW / 2 + 0.95, 1.1, -0.2);
    g.add(diffBez);
    const diff = face(1.02, 1.14, diffA);
    diff.position.set(totalW / 2 + 0.95, 1.1, -0.16);
    g.add(diff);
    S2.diff = diff; S2.diffA = diffA; S2.diffB = diffB;
    // evidence tray
    const tray = box(2.9, 0.16, 1.0, mSteel, 0.05);
    tray.position.set(0.9, 0.62, 1.75);
    g.add(tray);
    const trayLeg = box(0.14, 0.55, 0.14, mSteelDark, 0.04); trayLeg.position.set(0.9, 0.3, 1.75); g.add(trayLeg);
    const tileNames = [['PNG × 12', BLUE], ['Midscene report', BLUE], ['midscene-summary.json', GREY]];
    S2.tiles = tileNames.map(([n, c], k) => {
      const t = canvasTex(420, 150, (x, w, h) => {
        rr(x, 0, 0, w, h, 18); x.fillStyle = '#fff'; x.fill(); x.lineWidth = 4; x.strokeStyle = c; x.stroke();
        x.font = `600 ${n.length > 16 ? 26 : 34}px ${F_MONO}`; x.fillStyle = INK; x.textBaseline = 'middle'; x.fillText(n, 24, h / 2);
      });
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.03, 0.3), [mPaper, mPaper, new THREE.MeshBasicMaterial({ map: t, toneMapped: false }), mPaper, mPaper, mPaper]);
      m.castShadow = true;
      m.userData.to = new THREE.Vector3(0.9 + (k - 1) * 0.92, 0.72, 1.75);
      g.add(m);
      return m;
    });
    S2.verdict = label('verdict.json · FAIL', { fg: '#fff', bg: RED, border: null });
    S2.verdict.position.copy(W2(g, 1.9, 1.3, 2.1));
    scene.add(S2.verdict);
    // impact flash on the screen qa-breaker hits (A row, 1280)
    const flashTex = canvasTex(256, 256, (x, w, h) => {
      const gr = x.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,214,190,0.9)'); gr.addColorStop(0.6, 'rgba(228,87,74,0.45)'); gr.addColorStop(1, 'rgba(228,87,74,0)');
      x.fillStyle = gr; x.fillRect(0, 0, w, h);
    });
    const flash = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), new THREE.MeshBasicMaterial({ map: flashTex, transparent: true, depthWrite: false, toneMapped: false, opacity: 0 }));
    flash.position.copy(S2.screens[1].f.position); flash.position.z += 0.03;
    flash.renderOrder = 5;
    g.add(flash);
    S2.flash = flash;
    S2.totalW = totalW;
  }

  /* ======== S3 · On call ======== */
  const S3 = {};
  {
    const g = stations[3];
    const draw5xx = rev => (x, w, h) => {
      x.fillStyle = '#fff'; x.fillRect(0, 0, w, h);
      x.font = `600 28px ${F_MONO}`; x.fillStyle = INK; x.fillText('5XX RATE', 30, 50);
      x.font = `500 22px ${F_MONO}`; x.fillStyle = GREY; x.fillText('listing-search · 30 min', 30, 84);
      x.strokeStyle = LINE; x.lineWidth = 2;
      for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(30, 130 + i * 70); x.lineTo(w - 30, 130 + i * 70); x.stroke(); }
      const n = 60, pts = [];
      for (let i = 0; i < n; i++) {
        const u = i / (n - 1);
        const spike = Math.exp(-Math.pow((u - 0.72) / 0.045, 2));
        pts.push([30 + u * (w - 60), 330 - (18 + 10 * Math.sin(i * 1.7) + spike * 210)]);
      }
      const m = Math.max(2, Math.floor(rev * n));
      x.beginPath(); pts.slice(0, m).forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b)));
      x.lineWidth = 5; x.strokeStyle = RED; x.lineJoin = 'round'; x.stroke();
      if (rev > 0.75) { const [a, b] = pts[Math.round(0.72 * (n - 1))]; x.beginPath(); x.arc(a, b, 11, 0, Math.PI * 2); x.fillStyle = RED; x.fill(); }
    };
    const drawRestarts = rev => (x, w, h) => {
      x.fillStyle = '#fff'; x.fillRect(0, 0, w, h);
      x.font = `600 28px ${F_MONO}`; x.fillStyle = INK; x.fillText('RESTARTS / OOM', 30, 50);
      x.font = `500 22px ${F_MONO}`; x.fillStyle = GREY; x.fillText('pods · 30 min', 30, 84);
      const n = 14;
      for (let i = 0; i < n; i++) {
        if (i / n > rev) break;
        const hot = i >= n - 4;
        const bh = hot ? 70 + (i - (n - 4)) * 38 : 14 + (i % 3) * 8;
        x.fillStyle = hot ? RED : '#CAD8CF';
        rr(x, 34 + i * ((w - 68) / n), 330 - bh, (w - 68) / n - 10, bh, 6); x.fill();
      }
    };
    S3.gA = canvasTex(720, 380, draw5xx(0));
    S3.gB = canvasTex(720, 380, drawRestarts(0));
    S3.draw5xx = draw5xx; S3.drawRestarts = drawRestarts;
    [[S3.gA, -1.55], [S3.gB, 1.0]].forEach(([t, x]) => {
      const b = box(2.36, 1.3, 0.07, mSteel, 0.04); b.position.set(x, 1.95, -0.3); g.add(b);
      const f = face(2.26, 1.2, t); f.position.set(x, 1.95, -0.26); g.add(f);
      const leg = box(0.08, 1.3, 0.08, mSteelDark, 0.03); leg.position.set(x, 0.65, -0.34); g.add(leg);
    });
    const consTex = canvasTex(620, 220, (x, w, h) => {
      rr(x, 0, 0, w, h, 20); x.fillStyle = '#F7F8F7'; x.fill(); x.lineWidth = 3; x.strokeStyle = LINE; x.stroke();
      x.font = `500 26px ${F_MONO}`; x.fillStyle = GREY; x.fillText('$ promq \'up == 0\'', 26, 60);
      x.fillStyle = INK; x.fillText('→ 14 series', 26, 108);
      x.fillStyle = GREEN; x.fillText('matches the hypothesis', 26, 156);
    });
    const cons = face(1.5, 0.53, consTex);
    cons.position.set(-0.3, 0.45, 1.05);
    cons.rotation.x = -0.9;
    g.add(cons);
    S3.cons = cons;
    S3.hyp = label('HolmesGPT · hypothesis: 14 scrape targets down', { fg: INK2, bg: '#F7F8F7' });
    S3.ok = label('promq confirms · 14 targets down ✓', { fg: '#fff', bg: GREEN, border: null });
    [S3.hyp, S3.ok].forEach(s => { s.position.copy(W2(g, 1.2, 3.25, 0.9)); scene.add(s); });
  }

  /* ======== S4 · Review ======== */
  const S4 = {};
  {
    const g = stations[4];
    const bench = box(3.2, 1.02, 1.0, mPaper, 0.06);
    bench.position.set(-0.3, 0.51, -0.35);
    g.add(bench);
    const top = box(3.36, 0.08, 1.12, mSteel, 0.03);
    top.position.set(-0.3, 1.04, -0.35);
    g.add(top);
    const riser = box(2.2, 0.5, 1.0, mPad, 0.05);
    riser.position.set(-0.3, 0.25, -1.35);
    g.add(riser);
    const plateTex = canvasTex(1024, 180, (x, w, h) => { x.fillStyle = BLUE; rr(x, 0, 0, w, h, 24); x.fill(); x.font = `700 74px ${F_MONO}`; x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('REVIEW', w / 2, h / 2 + 4); });
    const plate = face(2.2, 0.39, plateTex);
    plate.position.set(-0.3, 0.6, 0.16);
    g.add(plate);
    // stamp
    const stamp = new THREE.Group();
    const knob = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 16), mInk)); knob.position.y = 0.62;
    const stem = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.46, 16), mInk)); stem.position.y = 0.36;
    const foot = box(1.1, 0.16, 0.66, mRed, 0.05); foot.position.y = 0.08;
    stamp.add(knob, stem, foot);
    g.add(stamp);
    S4.stamp = stamp;
    S4.risk = label('Risk: High (62/100)', { fg: '#fff', bg: RED, border: null });
    S4.proof = label('proof 4/6 · patch 2/6');
    S4.nmr = label('not_merge_ready', { fg: RED, border: '#EFB7AE' });
    S4.rej = label('rejections 1 of 2', { fg: INK, bg: '#FBE6C4', border: null });
    S4.one = label('“Drop the new wrapper. The hook already does it.”', { mono: false, weight: 500, fg: INK, size: 40 });
    S4.risk.position.copy(W2(g, -2.4, 4.0, 0.4));
    S4.proof.position.copy(W2(g, -2.4, 3.52, 0.4));
    S4.nmr.position.copy(W2(g, -2.4, 3.04, 0.4));
    S4.rej.position.copy(W2(g, 1.0, 4.0, 0.4));
    S4.one.position.copy(W2(g, 1.4, 2.62, 0.6));
    [S4.risk, S4.proof, S4.nmr, S4.rej, S4.one].forEach(s => scene.add(s));
  }

  /* ======== S5 · Retry ======== */
  const S5 = {};
  {
    const g = stations[5];
    const drawFindings = n => (x, w, h) => {
      x.fillStyle = '#fff'; x.fillRect(0, 0, w, h);
      x.font = `600 28px ${F_MONO}`; x.fillStyle = GREY; x.fillText('FIX-CHECK · NEW HEAD 9c41f07', 40, 64);
      const F = ['Panel ignores a tap outside', 'Page scroll stays locked', 'Layout shift at 375'];
      F.forEach((t, i) => {
        const y = 110 + i * 110;
        rr(x, 40, y, w - 80, 88, 16); x.fillStyle = STEEL; x.fill();
        x.font = `600 26px ${F_MONO}`; x.fillStyle = GREY; x.fillText(`F${i + 1}`, 64, y + 54);
        x.font = `500 30px ${F_UI}`; x.fillStyle = INK; x.fillText(t, 124, y + 54);
        const ok = i < n;
        x.font = `600 24px ${F_MONO}`;
        const lab = ok ? 'RESOLVED' : 'OPEN';
        const pw = x.measureText(lab).width + 30;
        rr(x, w - 80 - pw - 16, y + 24, pw, 40, 20); x.fillStyle = ok ? GREEN : RED; x.fill();
        x.fillStyle = '#fff'; x.textBaseline = 'middle'; x.fillText(lab, w - 80 - pw - 1, y + 45); x.textBaseline = 'alphabetic';
      });
    };
    S5.drawFindings = drawFindings;
    S5.tex = canvasTex(1000, 460, drawFindings(0));
    S5.shown = 0;
    const b = box(2.66, 1.3, 0.07, mSteel, 0.04); b.position.set(-1.4, 1.95, -0.35); g.add(b);
    const f = face(2.56, 1.18, S5.tex); f.position.set(-1.4, 1.95, -0.31); g.add(f);
    [-2.5, -0.3].forEach(x => { const l = box(0.08, 1.35, 0.08, mSteelDark, 0.03); l.position.set(x, 0.67, -0.38); g.add(l); });
    // the handoff note
    const noteTex = canvasTex(256, 180, (x, w, h) => {
      x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.fillStyle = AMBER; x.fillRect(0, 0, w, 20);
      x.fillStyle = LINE; for (let i = 0; i < 4; i++) x.fillRect(20, 50 + i * 30, w - 40 - (i === 3 ? 70 : 0), 12);
    });
    const note = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.36, 0.02), [mPaper, mPaper, mPaper, mPaper, new THREE.MeshBasicMaterial({ map: noteTex, toneMapped: false }), mPaper]));
    scene.add(note);
    S5.note = note;
    S5.noteLab = label('handoff note · 3 findings', { fg: INK, bg: '#FBE6C4', border: null, h: 0.3 });
    scene.add(S5.noteLab);
    S5.retry = label('retry 1 of 1', { fg: INK, bg: '#FBE6C4', border: null });
    S5.retry.position.copy(W2(g, 0.6, 3.3, 0.5));
    scene.add(S5.retry);
    S5.from = W2(g, -4.6, 3.6, 0.4);
    S5.to = W2(g, 1.35, 1.5, 0.75);
  }

  /* ======== S6 · Pattern → fix ======== */
  const S6 = {};
  {
    const g = stations[6];
    S6.tokens = [];
    const tokGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.07, 24);
    for (let k = 0; k < 20; k++) {
      const m = shadowed(new THREE.Mesh(tokGeo, mRed));
      m.userData.home = new THREE.Vector3(-2.7 + (k % 5) * 0.34, 0.2, 0.6 + Math.floor(k / 5) * 0.34);
      g.add(m);
      S6.tokens.push(m);
    }
    const docTex = canvasTex(1100, 800, (x, w, h) => {
      x.fillStyle = '#fff'; x.fillRect(0, 0, w, h);
      x.font = `600 32px ${F_MONO}`; x.fillStyle = INK; x.fillText('agents/qa-breaker.md', 50, 74);
      x.font = `500 24px ${F_MONO}`; x.fillStyle = GREY; x.fillText('improvement issue · one edit', 50, 116);
      const L = [[' ', 'Read the brief, the PR and the diff.', null], ['-', 'Check the criteria you were given.', '#FBE3DF'],
        ['+', 'Exercise every acceptance criterion with', '#E2F2E7'], ['+', 'a Midscene step and a screenshot.', '#E2F2E7'], [' ', 'Report what you could not measure.', null]];
      L.forEach(([sg, t, bg], i) => {
        const y = 170 + i * 84;
        if (bg) { x.fillStyle = bg; x.fillRect(40, y, w - 80, 70); }
        x.font = `600 30px ${F_MONO}`; x.fillStyle = sg === '-' ? RED : sg === '+' ? GREEN : GREY; x.fillText(sg, 60, y + 46);
        x.font = `500 30px ${F_MONO}`; x.fillStyle = INK; x.fillText(t, 104, y + 46);
      });
      x.fillStyle = LINE; x.fillRect(50, 628, w - 100, 3);
      x.font = `600 26px ${F_MONO}`; x.fillStyle = GREY; x.fillText('PREDICTION', 50, 690);
      x.font = `500 30px ${F_UI}`; x.fillStyle = INK; x.fillText('criterion_not_exercised drops on the next 20 runs', 50, 740);
    });
    const doc = new THREE.Group();
    const back = box(2.9, 2.1, 0.07, mPaper, 0.04);
    const f = face(2.8, 2.04, docTex); f.position.z = 0.04;
    doc.add(back, f);
    doc.position.set(0.1, 1.9, -0.35);
    g.add(doc);
    S6.doc = doc;
    [-1.2, 1.2].forEach(x => { const l = box(0.08, 1.0, 0.08, mSteelDark, 0.03); l.position.set(0.1 + x, 0.5, -0.4); g.add(l); });
    S6.docTarget = new THREE.Vector3(0.1, 1.9, -0.3);
    // benchmark meters
    S6.bars = [];
    ['held-in', 'held-out'].forEach((n, k) => {
      const X = 2.35 + k * 0.62;
      const shell = box(0.36, 1.9, 0.36, mSteel, 0.06); shell.position.set(X, 0.95 + 0.08, 0.1); g.add(shell);
      const fill = new THREE.Mesh(new THREE.BoxGeometry(0.26, 1.7, 0.26), new THREE.MeshStandardMaterial({ color: 0x3E9B5F, roughness: 0.4 }));
      fill.geometry.translate(0, 0.85, 0);
      fill.position.set(X, 0.2, 0.2);
      fill.scale.y = 0.001;
      g.add(fill);
      const lab = label(`${n} ✓`, { fg: '#fff', bg: GREEN, border: null, h: 0.3 });
      lab.position.copy(W2(g, X, 2.45 + k * 0.4, 0.3));
      scene.add(lab);
      S6.bars.push({ fill, lab });
    });
    S6.pat = label('failure pattern · 20 fails / 30 days', { fg: RED, border: '#EFB7AE' });
    S6.pat.position.copy(W2(g, -2.0, 1.55, 0.9));
    scene.add(S6.pat);
    S6.person = person();
    S6.person.position.set(3.9, 0.16, 1.0);
    S6.person.rotation.y = -0.6;
    g.add(S6.person);
    S6.start = label('a person starts validation', { fg: INK, bg: '#FBE6C4', border: null, h: 0.3 });
    S6.start.position.copy(W2(g, 2.9, 2.95, 1.0));
    scene.add(S6.start);
  }

  function person() {
    const pr = new THREE.Group();
    const body = shadowed(new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.72, 8, 20), mAmber)); body.position.y = 0.72;
    const head = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.27, 28, 20), new THREE.MeshStandardMaterial({ color: 0xF6D7A7, roughness: 0.5 }))); head.position.y = 1.52;
    pr.add(body, head);
    return pr;
  }

  /* ======== S7 · Merge ======== */
  const S7 = {};
  {
    const g = stations[7];
    const ped = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.84, 0.95, 48), mSteel));
    ped.position.set(0.9, 0.475, 0);
    g.add(ped);
    const btnTex = canvasTex(512, 512, (x, w, h) => {
      x.fillStyle = '#F0B45D'; x.fillRect(0, 0, w, h);
      x.font = `800 104px ${F_DISP}`; x.fillStyle = '#5C3A08'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('MERGE', w / 2, h / 2 + 6);
    });
    const button = new THREE.Group();
    const bb = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.58, 0.2, 48), mAmber));
    const bt = new THREE.Mesh(new THREE.CircleGeometry(0.54, 48), new THREE.MeshStandardMaterial({ map: btnTex, roughness: 0.35 }));
    bt.rotation.x = -Math.PI / 2; bt.position.y = 0.101;
    button.add(bb, bt);
    button.position.set(0.9, 1.05, 0);
    g.add(button);
    S7.button = button;
    const plinth = box(1.9, 0.92, 1.3, mPad, 0.06);
    plinth.position.set(-1.25, 0.46, 0.25);
    g.add(plinth);
    // the hand: a person's arm reaching in from the upper right
    const hand = new THREE.Group();
    const skin = new THREE.MeshStandardMaterial({ color: 0xF2CFA0, roughness: 0.55 });
    const palm = box(0.66, 0.26, 0.62, skin, 0.12);
    hand.add(palm);
    for (let f = 0; f < 4; f++) { const fi = box(0.13, 0.2, 0.36, skin, 0.06); fi.position.set(-0.24 + f * 0.16, -0.02, 0.44); hand.add(fi); }
    const thumb = box(0.16, 0.18, 0.34, skin, 0.07); thumb.position.set(-0.42, 0.02, 0.1); thumb.rotation.y = 0.6; hand.add(thumb);
    const cuff = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.22, 28), mAmber)); cuff.rotation.x = Math.PI / 2; cuff.position.set(0, 0.06, -0.42); hand.add(cuff);
    const sleeve = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 3.4, 28), mAmber)); sleeve.rotation.x = Math.PI / 2; sleeve.position.set(0, 0.06, -2.2); hand.add(sleeve);
    hand.rotation.set(0.55, 0, 0);
    const handPivot = new THREE.Group();
    handPivot.add(hand);
    handPivot.rotation.y = -1.88;
    handPivot.position.set(0.9, 5, 0);
    g.add(handPivot);
    const hand0 = handPivot;
    S7.hand = hand0;
    S7.ready = label('ready', { fg: '#fff', bg: GREEN, border: null });
    S7.rtm = label('ready_to_merge · one notice', { fg: '#fff', bg: GREEN, border: null });
    S7.merged = label('merged by a person', { fg: '#fff', bg: INK, border: null });
    S7.never = label('Alp never merges.', { mono: false, weight: 700, fg: INK, h: 0.42 });
    S7.ready.position.copy(W2(g, -1.25, 2.1, 0.5));
    S7.rtm.position.copy(W2(g, -1.25, 2.1, 0.5));
    S7.merged.position.copy(W2(g, 0.9, 3.1, 0.3));
    S7.never.position.copy(W2(g, 0.9, 3.6, 0.3));
    [S7.ready, S7.rtm, S7.merged, S7.never].forEach(s => scene.add(s));
  }

  /* =========================================================
     Figures: rigged GLBs with a vinyl placeholder until loaded
     ========================================================= */
  const FIG_COLORS = {
    'qa-breaker': [0xC94A3C, 0x2A2D31], 'sre-oncall': [0x9C7A55, 0x6E5334], 'reviewer': [0xE9E9E3, 0x1F2226],
    'ponytail': [0xDADDD8, 0x1D1F22], 'backend-engineer': [0x5A4636, 0x8C9296],
  };
  const loader = new GLTFLoader();
  // Figures are rigid vinyl toys: the skinned meshes stay in their bind pose and all
  // motion is procedural on an inner group (hops, waddles, leans, nods, shakes).
  const MAX_ANISO = renderer.capabilities.getMaxAnisotropy();
  const hopArc = u => 4 * u * (1 - u);
  class Figure {
    constructor(name, idx) {
      this.name = name;
      this.idx = idx;
      this.root = new THREE.Group();
      this.inner = new THREE.Group();
      this.root.add(this.inner);
      this.period = 2.6 + Math.random() * 1.6;
      this.phase = Math.random() * Math.PI * 2;
      this.mode = 'idle';
      this.k = 0; // mode-specific amount, set by the choreography
      this.targetRY = 0;
      this.holder = this.placeholder();
      this.inner.add(this.holder);
      scene.add(this.root);
      this.load();
    }
    placeholder() {
      const [c, a] = FIG_COLORS[this.name];
      const g = new THREE.Group();
      const skin = new THREE.MeshStandardMaterial({ color: 0xE8CFA7, roughness: 0.55 });
      const fur = new THREE.MeshStandardMaterial({ color: c, roughness: 0.5 });
      const cloth = new THREE.MeshStandardMaterial({ color: a, roughness: 0.55 });
      const body = shadowed(new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.5, 8, 20), cloth)); body.position.y = 0.62;
      const head = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 24), fur)); head.position.y = 1.36;
      const muzzle = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.26, 24, 18), skin)); muzzle.position.set(0, 1.26, 0.28); muzzle.scale.set(1.1, 0.8, 0.8);
      const earGeo = new THREE.SphereGeometry(0.14, 16, 12);
      [-1, 1].forEach(s => { const e = shadowed(new THREE.Mesh(earGeo, skin)); e.position.set(0.42 * s, 1.4, 0); e.scale.z = 0.5; g.add(e); });
      g.add(body, head, muzzle);
      return g;
    }
    async load() {
      let gltf;
      try { gltf = await loader.loadAsync(`./assets/models/${this.name}.glb`); } catch (e) { return; }
      const model = gltf.scene;
      model.traverse(o => {
        if (!o.isMesh) return;
        o.castShadow = true; o.frustumCulled = false;
        // The GLBs bake the base colour again as a full emissive map with high specular, which washes them out.
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
          m.emissiveMap = null;
          if (m.emissive) m.emissive.setRGB(0, 0, 0);
          m.emissiveIntensity = 0;
          if ('specularIntensity' in m) m.specularIntensity = 0.5;
          if (m.specularColor) m.specularColor.setRGB(1, 1, 1);
          if ('metalness' in m) m.metalness = Math.min(m.metalness ?? 0, 0.1);
          if ('roughness' in m) m.roughness = 0.62;
          if (m.map) {
            m.map.colorSpace = THREE.SRGBColorSpace;
            m.map.generateMipmaps = false; // mip bleeding shows the atlas seams
            m.map.minFilter = THREE.LinearFilter;
            m.map.anisotropy = MAX_ANISO;
            m.map.needsUpdate = true;
          }
          m.needsUpdate = true;
        }
      });
      const bb = new THREE.Box3().setFromObject(model);
      const s = 2.15 / Math.max(0.001, bb.max.y - bb.min.y);
      model.scale.multiplyScalar(s);
      bb.setFromObject(model);
      model.position.set(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2);
      this.inner.remove(this.holder);
      this.inner.add(model);
      this.holder = null;
    }
    set(mode, k = 0) { this.mode = mode; this.k = k; }
    tick(time) {
      const w = (time / this.period) * Math.PI * 2 + this.phase;
      let y = 0, rx = 0, rz = Math.sin(w * 0.5) * 0.015, ry = 0, sy = 1 + Math.sin(w) * 0.012, sxz = 1 - Math.sin(w) * 0.006;
      const k = this.k;
      switch (this.mode) {
        case 'walk': { // waddle: alternating roll with small hops
          const f = time * 4.2 + this.phase;
          const u = (f / Math.PI) % 1;
          y = 0.13 * hopArc(u);
          rz = Math.sin(f) * 0.14;
          if (u < 0.12 || u > 0.9) { sy = 0.93; sxz = 1.035; }
          break;
        }
        case 'lunge': { // lean into the screens, rattle on each hit
          rx = 0.34 * k;
          y = 0.08 * k;
          rz = Math.sin(time * 46) * 0.13 * this.hit;
          ry = Math.sin(time * 38) * 0.08 * this.hit;
          sy = 1 - 0.05 * this.hit;
          break;
        }
        case 'crouch': { // search: low, pitched forward, sweeping
          sy = lerp(1, 0.9, k); sxz = lerp(1, 1.04, k);
          rx = 0.26 * k;
          ry = Math.sin(time * 1.5 + this.phase) * 0.5 * k;
          break;
        }
        case 'hop': { // one hop, k = progress 0..1
          y = 0.42 * hopArc(k);
          if (k > 0 && (k < 0.1 || k > 0.9)) { sy = 0.9; sxz = 1.05; } else if (k > 0.2 && k < 0.8) { sy = 1.06; sxz = 0.97; }
          break;
        }
        case 'lean': rx = -0.07 + Math.sin(w * 0.5) * 0.03; break;
        case 'gavel': rx = -0.05 + 0.42 * k; sy = 1 - 0.04 * k; break;
        case 'nod': rx = 0.2 * Math.sin(Math.PI * k); break;
        case 'cheer': { // staggered hops and spins
          const t0 = time - this.idx * 0.09;
          const u = ((t0 * 1.6) % 1 + 1) % 1;
          y = 0.5 * hopArc(u);
          ry = (Math.floor(t0 * 1.6) + this.idx) % 2 ? u * Math.PI * 2 : 0;
          if (u < 0.1 || u > 0.92) { sy = 0.9; sxz = 1.05; } else { sy = 1.05; sxz = 0.98; }
          break;
        }
        default: break;
      }
      const inn = this.inner;
      inn.position.y = y;
      inn.rotation.set(rx, ry, rz);
      inn.scale.set(sxz, sy, sxz);
      // eased turn to face (snap on the first frame)
      if (!this.faced) { this.faced = true; this.root.rotation.y = this.targetRY; }
      let d = this.targetRY - this.root.rotation.y;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      this.root.rotation.y += d * 0.12;
    }
  }
  const figs = {};
  ['qa-breaker', 'sre-oncall', 'reviewer', 'ponytail', 'backend-engineer'].forEach((n, k) => { figs[n] = new Figure(n, k); figs[n].hit = 0; });

  // Where each figure stands and which way it faces, for beat i at local time t.
  const place = (fig, s, x, z, ry, y = 0.16) => {
    const g = stations[s];
    fig.root.position.copy(W2(g, x, y, z));
    fig.targetRY = g.rotation.y + ry;
  };
  const walkBetween = (fig, a, b, t) => {
    const pa = W2(stations[a[0]], a[1], 0.16, a[2]), pb = W2(stations[b[0]], b[1], 0.16, b[2]);
    fig.root.position.lerpVectors(pa, pb, t);
    fig.targetRY = Math.atan2(pb.x - pa.x, pb.z - pa.z);
  };
  const BRK = { s0: [0, 2.2, 1.35, -0.8], s1: [1, 3.4, 1.2, -1.2], s2: [2, -1.2, 2.4, 1.75], s7: [7, -3.1, 1.1, 0.7] };
  const HIT_A = 0.18, HIT_B = 0.62;
  function hitEnv(t) { // three hits across the attack window
    if (t < HIT_A || t > HIT_B) return 0;
    const f = ((t - HIT_A) / (HIT_B - HIT_A)) * 3 % 1;
    return f < 0.3 ? 1 - f / 0.3 : 0;
  }
  function cast(i, t) {
    const qa = figs['qa-breaker'], sre = figs['sre-oncall'], rv = figs.reviewer, pt = figs.ponytail, be = figs['backend-engineer'];
    const cheer = i === 7 && t > 0.7;
    // qa-breaker
    qa.hit = 0;
    if (i === 0) { place(qa, ...BRK.s0); qa.set('idle'); }
    else if (i === 1) {
      const w = smooth(0.06, 0.6, t);
      if (w > 0 && w < 1) { walkBetween(qa, BRK.s0, BRK.s1, w); qa.set('walk'); } else { place(qa, ...(w >= 1 ? BRK.s1 : BRK.s0)); qa.set('idle'); }
    } else if (i === 2) {
      const w = smooth(0, 0.14, t);
      if (w < 1) { walkBetween(qa, BRK.s1, BRK.s2, w); qa.set('walk'); }
      else {
        place(qa, ...BRK.s2);
        const k = Math.min(smooth(0.14, 0.2, t), 1 - smooth(0.62, 0.7, t));
        qa.hit = hitEnv(t);
        qa.set(k > 0.01 ? 'lunge' : 'idle', k);
      }
    } else if (i < 7) { place(qa, ...BRK.s2); qa.set('idle'); }
    else { place(qa, ...BRK.s7); qa.set(cheer ? 'cheer' : 'idle'); }
    // sre-oncall: search crouch, then a hop when promq confirms
    place(sre, 3, 2.3, 1.45, -0.75);
    if (i === 3 && t > 0.64 && t < 0.78) sre.set('hop', (t - 0.64) / 0.14);
    else if (i === 3) sre.set('crouch', Math.min(smooth(0.06, 0.16, t), 1 - smooth(0.58, 0.64, t)));
    else sre.set('idle');
    // reviewer (judge): stately lean, gavel-dip with the stamp
    place(rv, 4, -0.95, -1.35, 0.15, 0.5);
    if (i === 4) rv.set('gavel', Math.min(smooth(0.18, 0.28, t), 1 - smooth(0.34, 0.44, t)));
    else rv.set(cheer ? 'cheer' : 'lean');
    // ponytail: nearly still, one slow nod when its line appears
    place(pt, 4, 2.35, 0.55, -0.45);
    pt.set(i === 4 && t > 0.6 && t < 0.72 ? 'nod' : 'idle', clamp((t - 0.6) / 0.12, 0, 1));
    // backend-engineer: catches the handoff note with a hop
    if (i < 7) {
      place(be, 5, 1.95, 0.75, -0.55);
      if (i === 5 && t > 0.26 && t < 0.4) be.set('hop', (t - 0.26) / 0.14); else be.set('idle');
    } else { place(be, 7, 3.0, 1.0, -0.7); be.set(cheer ? 'cheer' : 'idle'); }
  }

  /* =========================================================
     Camera
     ========================================================= */
  const CAM = [
    { d: 12.5, h: 5.6, y: 1.6 }, { d: 12.5, h: 5.6, y: 1.7 }, { d: 15.5, h: 6.2, y: 1.8 }, { d: 12.5, h: 5.6, y: 1.8 },
    { d: 13, h: 5.8, y: 1.6 }, { d: 12.5, h: 5.6, y: 1.7 }, { d: 13.5, h: 5.8, y: 1.6 }, { d: 12.5, h: 5.8, y: 1.6 },
  ];
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let W = 1, H = 1, narrow = false;
  function resize() {
    const r = canvas.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    narrow = camera.aspect < 0.9;
    camera.fov = narrow ? 52 : 30;
    camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(resize).observe(canvas);
  canvas.parentElement.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect();
    pointer.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
  });
  const look = new THREE.Vector3();
  function placeCamera(i, t) {
    const prev = Math.max(0, i - 1);
    const k = i === 0 ? 1 : smooth(0, 0.2, t);
    const a = TH0 + lerp(prev, i, k) * DTH + pointer.x * 0.035;
    const c = { d: lerp(CAM[prev].d, CAM[i].d, k), h: lerp(CAM[prev].h, CAM[i].h, k), y: lerp(CAM[prev].y, CAM[i].y, k) };
    const d = narrow ? c.d * 1.12 : c.d;
    look.set(RX * Math.cos(a), c.y, RZ * Math.sin(a));
    const nx = Math.cos(a), nz = Math.sin(a), nl = Math.hypot(nx, nz);
    camera.position.set(look.x + nx / nl * d, c.h + pointer.y * -0.25, look.z + nz / nl * d);
    camera.lookAt(look);
    camera.setViewOffset(W, H, narrow ? 0 : -W * 0.17, narrow ? H * (stage.classList.contains('go') ? 0.17 : 0.1) : -H * 0.03, W, H);
  }

  /* =========================================================
     Per-frame update
     ========================================================= */
  const clock = new THREE.Clock();
  let pTarget = 0, pView = 0;
  function readProgress() {
    const r = stage.getBoundingClientRect();
    const span = Math.max(1, r.height - innerHeight);
    pTarget = clamp(-r.top / span, 0, 1);
  }
  addEventListener('scroll', readProgress, { passive: true });
  readProgress();
  pView = pTarget;

  const tmp = new THREE.Vector3();
  function update(dt, time) {
    pView += (pTarget - pView) * 0.1;
    if (Math.abs(pTarget - pView) < 1e-4) pView = pTarget;
    const p = pView;
    const { i, t } = beatAt(p);
    updateDom(p);
    placeCamera(i, t);
    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;

    // track progress and puck
    const base = i === 0 ? 0 : i - 1 + smooth(0, 0.2, t);
    const u = clamp((base + (i === 7 ? smooth(0.66, 0.9, t) : 0)) / 8, 0, 0.9999);
    prog.geometry.setDrawRange(0, Math.floor(progCount * u / 6) * 6);
    puck.position.copy(path.getPointAt(u));
    puck.position.y = 0.1;

    // card pose
    const k = i === 0 ? 1 : smooth(0, 0.2, t);
    const A = CARD_POSES[Math.max(0, i - 1)], B = CARD_POSES[i];
    card.position.lerpVectors(A.p, B.p, k);
    const hop = A.p.distanceTo(B.p) > 0.01 ? Math.sin(k * Math.PI) * 1.2 : 0;
    card.position.y += hop + (CARD_POSE[i][2] ? 0 : Math.sin(time * 1.6) * 0.04);
    card.quaternion.slerpQuaternions(A.q, B.q, k);
    setCard(
      i === 0 ? 'brief' : i === 1 ? (t > 0.45 ? 'preview' : 'brief') : i === 2 ? (t > 0.82 ? 'fail' : 'preview') :
      i === 3 ? 'fail' : i === 4 ? (t > 0.3 ? 'changes' : 'fail') : i === 5 ? (t > 0.8 ? 'resolved' : 'retry') :
      i === 6 ? 'resolved' : t > 0.66 ? 'merged' : t > 0.28 ? 'rtm' : 'ready'
    );

    // S0
    const t0 = i === 0 ? t : i > 0 ? 1 : 0;
    S0.board.scale.y = lerp(0.04, 1, smooth(0.02, 0.28, t0));
    S0.chips.forEach((c, n) => reveal(c, i === 0 ? smooth(0.34 + n * 0.1, 0.42 + n * 0.1, t) : 0));

    // S1
    const g1 = i === 1 ? smooth(0.32, 0.46, t) : i > 1 ? 1 : 0;
    S1.lampMat.color.setRGB(lerp(0.79, 0.24, g1), lerp(0.81, 0.61, g1), lerp(0.8, 0.37, g1));
    S1.lampMat.emissive.setRGB(0.05 * g1, 0.35 * g1, 0.14 * g1);
    reveal(S1.open, i === 1 ? smooth(0.46, 0.54, t) : 0);

    // S2
    const a2 = i === 2 ? t : i > 2 ? 1 : 0;
    const sweep = i === 2 ? smooth(0.18, 0.46, t) : 0;
    S2.laser.visible = i === 2 && t > 0.17 && t < 0.48;
    S2.laser.position.y = lerp(3.2, 0.5, sweep);
    const flagged = a2 > 0.44;
    S2.screens.forEach(s => { if (s.flag) s.f.material.map = flagged ? s.flag : s.clean; });
    reveal(S2.rowA, i === 2 ? smooth(0.04, 0.12, t) : 0);
    reveal(S2.rowB, i === 2 ? smooth(0.04, 0.12, t) : 0);
    reveal(S2.scan, i === 2 ? win(t, 0.44, 0.64) : 0);
    const eyeIn = i === 2 ? smooth(0.46, 0.54, t) : i > 2 ? 1 : 0;
    S2.eye.scale.setScalar(Math.max(0.001, eyeIn));
    S2.eye.position.y = 2.85 + Math.sin(time * 1.4) * 0.06;
    S2.eye.rotation.y = -0.55 + Math.sin(time * 0.9) * 0.25;
    S2.ring.rotation.x = time * 1.3;
    reveal(S2.mid, i === 2 ? win(t, 0.55, 0.8) : 0);
    S2.diff.material.map = a2 > 0.6 ? S2.diffB : S2.diffA;
    S2.tiles.forEach((m, n) => {
      const d = i === 2 ? smooth(0.64 + n * 0.05, 0.72 + n * 0.05, t) : i > 2 ? 1 : 0;
      m.position.set(m.userData.to.x, lerp(2.6, m.userData.to.y, d), m.userData.to.z);
      m.rotation.z = (1 - d) * 0.6;
      m.visible = d > 0.001;
    });
    reveal(S2.verdict, i === 2 ? smooth(0.84, 0.9, t) : 0);
    const hf = i === 2 ? hitEnv(t) : 0;
    S2.flash.material.opacity = hf;
    S2.flash.visible = hf > 0.01;
    S2.flash.scale.setScalar(0.6 + 0.6 * (1 - hf));

    // S3
    const r3 = i === 3 ? smooth(0.08, 0.5, t) : i > 3 ? 1 : 0;
    if (Math.abs((S3.lastRev ?? -1) - r3) > 0.01) { S3.lastRev = r3; redraw(S3.gA, S3.draw5xx(r3)); redraw(S3.gB, S3.drawRestarts(r3)); }
    reveal(S3.hyp, i === 3 ? win(t, 0.3, 0.64) : 0);
    reveal(S3.ok, i === 3 ? smooth(0.64, 0.7, t) : 0);
    reveal(S3.cons, i === 3 ? smooth(0.5, 0.6, t) : i > 3 ? 1 : 0);

    // S4
    const down = i === 4 ? Math.min(smooth(0.18, 0.28, t), 1 - smooth(0.34, 0.44, t)) : 0;
    S4.stamp.position.set(0.45, lerp(2.9, 1.1, down), -0.3);
    S4.stamp.visible = i === 4 && t > 0.1 && t < 0.5;
    reveal(S4.risk, i === 4 ? smooth(0.42, 0.48, t) : 0);
    reveal(S4.proof, i === 4 ? smooth(0.48, 0.54, t) : 0);
    reveal(S4.nmr, i === 4 ? smooth(0.54, 0.6, t) : 0);
    reveal(S4.one, i === 4 ? smooth(0.6, 0.66, t) : 0);
    reveal(S4.rej, i === 4 ? smooth(0.72, 0.78, t) : 0);

    // S5
    const fly = i === 5 ? smooth(0.06, 0.32, t) : i > 5 ? 1 : 0;
    const flying = i === 5 && t < 0.52;
    S5.note.visible = flying || (i === 5 && t < 0.5);
    tmp.lerpVectors(S5.from, S5.to, fly);
    tmp.y += Math.sin(fly * Math.PI) * 1.1;
    S5.note.position.copy(tmp);
    S5.note.rotation.set(Math.sin(time * 3) * 0.2, fly * 6.2, Math.sin(time * 2) * 0.15);
    S5.noteLab.position.copy(tmp).add(new THREE.Vector3(0, 0.45, 0));
    reveal(S5.noteLab, i === 5 ? win(t, 0.06, 0.46) : 0);
    reveal(S5.retry, i === 5 ? smooth(0.16, 0.22, t) : 0);
    const nRes = i === 5 ? (t > 0.74 ? 3 : t > 0.64 ? 2 : t > 0.54 ? 1 : 0) : i > 5 ? 3 : 0;
    if (nRes !== S5.shown) { S5.shown = nRes; redraw(S5.tex, S5.drawFindings(nRes)); }

    // S6
    const t6 = i === 6 ? t : i > 6 ? 1 : 0;
    S6.tokens.forEach((m, n) => {
      const pop = i === 6 ? smooth(n * 0.011, 0.04 + n * 0.011, t) : 0;
      const gather = smooth(0.3, 0.48, t6);
      m.position.lerpVectors(m.userData.home, S6.docTarget, gather);
      m.position.y += Math.sin(gather * Math.PI) * 1.2;
      m.scale.setScalar(Math.max(0.001, pop * (1 - gather * 0.9)));
      m.visible = i === 6 && gather < 0.99;
    });
    reveal(S6.pat, i === 6 ? win(t, 0.12, 0.46) : 0);
    const docIn = smooth(0.42, 0.56, t6);
    S6.doc.scale.set(1, Math.max(0.02, docIn), 1);
    S6.doc.visible = docIn > 0.01;
    S6.bars.forEach(({ fill, lab }, n) => {
      const f = i === 6 ? smooth(0.62 + n * 0.08, 0.8 + n * 0.08, t) : i > 6 ? 1 : 0;
      fill.scale.y = Math.max(0.001, f);
      reveal(lab, i === 6 ? smooth(0.8 + n * 0.08, 0.86 + n * 0.08, t) : 0);
    });
    reveal(S6.start, i === 6 ? smooth(0.55, 0.62, t) : 0);
    S6.person.position.y = i === 6 && t > 0.55 && t < 0.62 ? Math.sin((t - 0.55) / 0.07 * Math.PI) * 0.18 : 0;

    // S7
    reveal(S7.ready, i === 7 ? win(t, 0.1, 0.3) : 0);
    reveal(S7.rtm, i === 7 ? smooth(0.3, 0.36, t) : 0);
    const press = i === 7 ? Math.min(smooth(0.42, 0.58, t), 1 - smooth(0.7, 0.84, t)) : 0;
    S7.hand.position.y = lerp(5.4, 1.5, press);
    S7.hand.visible = press > 0.01;
    S7.button.position.y = 1.05 - (i === 7 && t > 0.56 && t < 0.72 ? 0.08 : 0);
    reveal(S7.merged, i === 7 ? smooth(0.66, 0.72, t) : 0);
    reveal(S7.never, i === 7 ? smooth(0.76, 0.84, t) : 0);

    cast(i, t);
    for (const f of Object.values(figs)) f.tick(time);
    if (!narrow) {
      camera.updateMatrixWorld();
      for (const f of Object.values(figs)) {
        tmp.copy(f.root.position); tmp.y += 1.1;
        tmp.project(camera);
        const sx = (tmp.x + 1) / 2 * W;
        f.root.visible = sx > W * 0.42 && tmp.z < 1;
      }
    }
  }

  /* ---------- loop ---------- */
  let visible = false;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { rootMargin: '100px' }).observe(stage);
  function frame() {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) { clock.getDelta(); return; }
    update(Math.min(clock.getDelta(), 0.05), clock.elapsedTime);
    renderer.render(scene, camera);
  }
  update(0, 0);
  renderer.render(scene, camera);
  canvas.dataset.ready = '1';
  requestAnimationFrame(frame);
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); goStatic(); });
}

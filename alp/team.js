// The team: a miniature Alp board where nine agents and a person move one issue
// from Backlog to Done. Runs on its own loop while the section is visible.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const section = document.getElementById('team');
const stage = document.getElementById('teamStage');
if (section && stage) boot();

function boot() {
  const canvas = document.getElementById('teamCanvas');
  const view = document.getElementById('teamView');
  const overlay = document.getElementById('teamOverlay');
  const tip = document.getElementById('teamTip');
  const loadingEl = document.getElementById('teamLoading');
  const captionEl = document.getElementById('teamCaption');
  const captionN = document.getElementById('teamCaptionN');
  const captionT = document.getElementById('teamCaptionT');
  const stepEls = [...document.querySelectorAll('#teamSteps li')];
  const hud = {
    spend: document.getElementById('hudSpend'),
    spendBar: document.getElementById('hudSpendBar'),
    runs: document.getElementById('hudRuns'),
    runsBar: document.getElementById('hudRunsBar'),
    plan: document.getElementById('hudPlan'),
    merge: document.getElementById('hudMerge'),
  };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- world layout ---------------- */
  const LOOP = 44;
  const FIG_H = 2.0;
  const ROW_Z = 3.55;
  // The board leans back like an easel so it reads as a backdrop behind the team.
  const BOARD_FRONT = 2.95;
  const TILT = 0.72;
  const FLOOR_Y = -0.1;
  const CARD_Y = 0.18;

  const COLS = [
    { name: 'Backlog', x: -5.0, icon: 'backlog', tint: 0xF1F2F0 },
    { name: 'In Progress', x: -2.5, icon: 'progress', tint: 0xF6F1E6 },
    { name: 'In Review', x: 0, icon: 'review', tint: 0xF6F1E6 },
    { name: 'Blocked', x: 2.5, icon: 'blocked', tint: 0xF6F1E6 },
    { name: 'Done', x: 5.0, icon: 'done', tint: 0xF1F2F0 },
  ];
  const B = 0, P = 1, R = 2, K = 3, D = 4;
  let boardInner = null;
  const boardQ = new THREE.Quaternion();
  const slot = (c, i) => boardInner.localToWorld(new THREE.Vector3(COLS[c].x, CARD_Y, -1.72 + i * 1.05));

  const FIGS = [
    { id: 'system-architect', x: -5.8, color: 0x433F7E, role: 'Maps where a change spreads' },
    { id: 'software-architect', x: -4.5, color: 0xE0962F, role: 'Writes the spec, the plan and the tasks' },
    { id: 'delivery-lead', x: -3.2, color: 0x3B6A46, role: 'Splits the plan and hands out the work' },
    { id: 'backend-engineer', x: -1.9, color: 0x2C6C7C, role: 'Writes the code, runs the tests, opens the PR' },
    { id: 'frontend-engineer', x: -0.6, color: 0xC45896, role: 'Builds the interface side of a change' },
    { id: 'reviewer', x: 0.7, color: 0x5E7082, role: 'Reads the PR and writes the verdict' },
    { id: 'ponytail', x: 2.0, color: 0x2A2A2A, role: 'Flags code that does not need to exist' },
    { id: 'qa-breaker', x: 3.3, color: 0xB5443A, role: 'Tries to break the change before users do' },
    { id: 'sre-oncall', x: 4.6, color: 0x8C6B45, role: 'Checks runtime signals before a merge' },
  ];
  const AVATAR = {
    'system-architect': 'system-architect.png', 'software-architect': 'software-architect.png',
    'delivery-lead': 'delivery-lead.png', 'backend-engineer': 'backend-engineer.png',
    'frontend-engineer': 'frontend-engineer.png', reviewer: 'reviewer.png', 'qa-breaker': 'qa-breaker.png',
    ponytail: 'ponytail-figure.jpg', 'sre-oncall': 'sre-oncall-figure.jpg',
  };

  /* ---------------- timeline ---------------- */
  const BEATS = [
    { t: 0, text: 'An issue lands in Backlog', focus: -5 },
    { t: 3, text: 'system-architect maps the impact, software-architect writes the plan', focus: -5 },
    { t: 8.5, text: 'You approve the plan', focus: -4.6, you: true },
    { t: 11.5, text: 'delivery-lead hands it to backend-engineer', focus: -3.2 },
    { t: 14.5, text: 'backend-engineer builds it and opens the PR', focus: 'backend' },
    { t: 22.5, text: 'reviewer requests changes, ponytail writes one line', focus: 0.9 },
    { t: 27, text: 'Fixed, broken on purpose, then checked', focus: 'b7' },
    { t: 35, text: 'Ready to merge. You merge.', focus: 3.2, you: true },
  ];
  const beatAt = (t) => { let i = 0; for (let k = 0; k < BEATS.length; k++) if (t >= BEATS[k].t) i = k; return i; };

  const ease = (u) => u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
  const clamp01 = (u) => Math.min(1, Math.max(0, u));
  function hop(a, b, u) {
    const e = ease(clamp01(u)); const v = a.clone().lerp(b, e); const arc = Math.sin(Math.PI * e); v.y += arc * 0.45; v.z += arc * 0.6; return v;
  }
  function bounceOut(u) {
    const n = 7.5625, d = 2.75;
    if (u < 1 / d) return n * u * u;
    if (u < 2 / d) return n * (u -= 1.5 / d) * u + 0.75;
    if (u < 2.5 / d) return n * (u -= 2.25 / d) * u + 0.9375;
    return n * (u -= 2.625 / d) * u + 0.984375;
  }

  // Where the hero card is: { pos, scale, col (index or -1) }. It glides between columns on its own.
  function cardAt(t) {
    const sB = slot(B, 0), sP = slot(P, 0), sR = slot(R, 0), sK = slot(K, 0), sD = slot(D, 0);
    const on = (s0, col, scale = 1) => ({ pos: s0, scale, col });
    const move = (a, b, ca, cb, t0, t1) => { const u = (t - t0) / (t1 - t0); return { pos: hop(a, b, u), scale: 1, col: u < .5 ? ca : cb }; };
    if (t < 0.2) return { pos: sB.clone().setY(sB.y + 4), scale: 0, col: -1 };
    if (t < 1.3) { const u = (t - 0.2) / 1.1; const p = sB.clone(); p.y += (1 - bounceOut(u)) * 3.2; return on(p, B); }
    if (t < 15.9) return on(sB, B);
    if (t < 17.5) return move(sB, sP, B, P, 15.9, 17.5);
    if (t < 19.1) return on(sP, P);
    if (t < 20.8) return move(sP, sR, P, R, 19.1, 20.8);
    if (t < 25.2) return on(sR, R);
    if (t < 26.0) return move(sR, sK, R, K, 25.2, 26.0);
    if (t < 28.4) return on(sK, K);
    if (t < 30.3) return move(sK, sR, K, R, 28.4, 30.3);
    if (t < 37.2) return on(sR, R);
    if (t < 38.1) return move(sR, sD, R, D, 37.2, 38.1);
    if (t < 42.6) return on(sD, D);
    if (t < 43.4) return on(sD, D, 1 - ease((t - 42.6) / 0.8));
    return on(sD, -1, 0);
  }

  function heroStateAt(t) {
    if (t < 3.4) return { who: null, note: 'New issue', tone: 'grey' };
    if (t < 5.9) return { who: 'system-architect', note: t < 4.2 ? 'Mapping impact' : 'impact · 2 services', tone: 'grey' };
    if (t < 9.3) return { who: 'software-architect', note: 'plan · 3 tasks', tone: 'grey' };
    if (t < 11.8) return { who: 'software-architect', note: 'Plan approved', tone: 'amber' };
    if (t < 17.9) return { who: 'backend-engineer', note: 'Assigned by delivery-lead', tone: 'grey' };
    if (t < 21.2) return { who: 'backend-engineer', note: 'branch · tests pass', tone: 'blue' };
    if (t < 23.0) return { who: 'backend-engineer', note: 'PR #1466 → dev', tone: 'blue' };
    if (t < 28.6) return { who: 'backend-engineer', note: 'changes_requested · 1', tone: 'red' };
    if (t < 31.4) return { who: 'backend-engineer', note: '1 finding fixed', tone: 'blue' };
    if (t < 33.6) return { who: 'backend-engineer', note: 'qa · 0 broken', tone: 'green' };
    if (t < 35.3) return { who: 'backend-engineer', note: 'signals clean', tone: 'green' };
    if (t < 38.2) return { who: 'backend-engineer', note: 'ready_to_merge', tone: 'green' };
    return { who: 'backend-engineer', note: 'Merged by you', tone: 'done' };
  }

  const BUBBLES = [
    { who: 'system-architect', t0: 3.4, t1: 5.9, text: 'impact · 2 services' },
    { who: 'software-architect', t0: 5.9, t1: 8.4, text: 'plan · 3 tasks' },
    { who: 'you', t0: 9.2, t1: 11.4, text: 'Plan approved', tone: 'amber' },
    { who: 'delivery-lead', t0: 11.8, t1: 14.3, text: 'Yours, backend-engineer' },
    { who: 'backend-engineer', t0: 17.9, t1: 19.3, text: 'branch · tests pass' },
    { who: 'backend-engineer', t0: 21.1, t1: 22.7, text: 'PR #1466 → dev' },
    { who: 'reviewer', t0: 22.9, t1: 26.8, text: 'changes_requested', tone: 'red' },
    { who: 'ponytail', t0: 24.0, t1: 26.8, text: 'Delete the helper. One line.', lift: 0.62 },
    { who: 'backend-engineer', t0: 28.6, t1: 30.3, text: '1 finding fixed' },
    { who: 'qa-breaker', t0: 31.4, t1: 33.7, text: 'Tried to break it · 0 broken', tone: 'green' },
    { who: 'sre-oncall', t0: 33.0, t1: 35.2, text: 'signals clean', tone: 'green', lift: 0.62 },
    { who: 'reviewer', t0: 35.3, t1: 38.6, text: 'ready_to_merge', tone: 'green' },
    { who: 'you', t0: 37.0, t1: 40.2, text: 'Merged', tone: 'amber', lift: 0.7 },
  ];
  const YOU_WINDOWS = [
    { t0: 8.6, t1: 11.8, x: -5.15, z: ROW_Z + 0.8 },
    { t0: 36.0, t1: 41.2, x: 5.6, z: ROW_Z + 0.8 },
  ];
  // Autonomous runs that each beat starts, with their cost in dollars.
  const RUN_EVENTS = [[3.3, .41], [5.8, .62], [11.7, .18], [14.5, 1.12], [22.8, .37], [24.0, .12], [27.0, .84], [31.2, .55], [32.8, .29], [35.3, .21]];

  /* ---------------- renderer (created lazily) ---------------- */
  let renderer, scene, camera, envRT, raf = 0, started = false, visible = false;
  let T = reduce ? 38.9 : 0, loops = 0, lastNow = 0;
  const figs = new Map();
  let you, hero, heroGlow;
  const ambient = [];
  const headers = [];
  const bubbles = [];
  const hits = [];
  const camFocus = new THREE.Vector3(0, 0.4, 0.9);
  let camTargetX = -3;
  let narrow = false;

  const io = new IntersectionObserver((es) => {
    for (const e of es) if (e.isIntersecting && !started) { started = true; init(); }
  }, { rootMargin: '150% 0px' });
  io.observe(stage);
  const vio = new IntersectionObserver((es) => { visible = es[0].isIntersecting; kick(); }, { threshold: 0.05 });
  vio.observe(stage);
  document.addEventListener('visibilitychange', kick);

  function webglOK() {
    try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
  }

  function init() {
    if (!webglOK()) { fallback(); return; }
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch { fallback(); return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.setClearColor(0x000000, 0);

    scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envRT.texture;
    scene.environmentIntensity = 0.45;
    pmrem.dispose();

    camera = new THREE.PerspectiveCamera(26, 1, 0.1, 200);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xe9e6df, 0.9));
    // Warm key from front-right, cool fill from the left, white rim from behind.
    const sun = new THREE.DirectionalLight(0xfff1de, 2.2);
    sun.position.set(6, 11, 12);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 9, bottom: -9, near: 1, far: 45 });
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.02;
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xDFEDE5, 0.8);
    fill.position.set(-9, 5, 8);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 0.9);
    rim.position.set(-2, 7, -9);
    scene.add(rim);

    buildBoard();
    buildCards();
    buildYou();
    for (const f of FIGS) buildFigure(f);
    buildBubbles();

    resize();
    new ResizeObserver(resize).observe(view);
    canvas.addEventListener('pointermove', onPointer);
    canvas.addEventListener('pointerleave', () => { tip.hidden = true; });

    loadModels();
    applyTimeline(T, true);
    renderOnce();
    kick();
  }

  function fallback() {
    canvas.hidden = true;
    document.getElementById('teamFallback').hidden = false;
    captionEl.hidden = true;
    stepEls.forEach((el) => el.classList.add('on'));
  }

  /* ---------------- board ---------------- */
  // Draw in logical pixels on a canvas `s` times larger, so board text stays sharp.
  function canvasTex(w, h, s = 2) {
    const el = document.createElement('canvas'); el.width = w * s; el.height = h * s;
    const ctx = el.getContext('2d'); ctx.scale(s, s);
    const tex = new THREE.CanvasTexture(el);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter;
    return { c: { width: w, height: h }, ctx, tex };
  }

  function buildBoard() {
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: 0.11 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = FLOOR_Y; ground.receiveShadow = true;
    scene.add(ground);

    const board = new THREE.Group();
    board.position.set(0, 0.12, BOARD_FRONT);
    board.rotation.x = TILT;
    boardInner = new THREE.Group();
    boardInner.position.z = -BOARD_FRONT;
    board.add(boardInner);
    scene.add(board);
    board.updateMatrixWorld(true);
    board.getWorldQuaternion(boardQ);

    const baseMat = new THREE.MeshStandardMaterial({ color: 0xFBFBFA, roughness: 0.62, metalness: 0 });
    const base = new THREE.Mesh(new RoundedBoxGeometry(13.1, 0.2, 5.9, 3, 0.12), baseMat);
    base.castShadow = true; base.receiveShadow = true;
    boardInner.add(base);
    // Two legs hold the raised back edge.
    const legGeo = new RoundedBoxGeometry(0.22, 1, 0.22, 2, 0.06);
    const backY = Math.sin(TILT) * 5.6, backZ = BOARD_FRONT - Math.cos(TILT) * 5.6;
    for (const lx of [-5.9, 5.9]) {
      const leg = new THREE.Mesh(legGeo, baseMat);
      leg.scale.y = backY; leg.position.set(lx, backY / 2 - 0.05, backZ + 0.1);
      leg.castShadow = true; scene.add(leg);
    }

    for (const col of COLS) {
      const m = new THREE.Mesh(new RoundedBoxGeometry(2.34, 0.05, 5.45, 2, 0.1),
        new THREE.MeshStandardMaterial({ color: col.tint, roughness: 0.75 }));
      m.position.set(col.x, 0.125, 0.05); m.receiveShadow = true;
      boardInner.add(m);

      const t = canvasTex(512, 104, 3);
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.447),
        new THREE.MeshBasicMaterial({ map: t.tex, transparent: true, toneMapped: false }));
      plane.rotation.x = -Math.PI / 2; plane.position.set(col.x, 0.152, -2.38);
      boardInner.add(plane);
      headers.push({ col, t, count: -1 });
    }
  }

  function drawIcon(ctx, kind, x, y, r) {
    ctx.save(); ctx.lineWidth = 3.2;
    if (kind === 'backlog') { ctx.setLineDash([4, 4]); ctx.strokeStyle = '#8A949E'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); }
    if (kind === 'progress') {
      ctx.strokeStyle = '#D69A1C'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#D69A1C'; ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, r - 4, -Math.PI / 2, Math.PI / 2); ctx.fill();
    }
    if (kind === 'review') {
      ctx.strokeStyle = '#3E9B5F'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#3E9B5F'; ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, r - 4, -Math.PI / 2, Math.PI * 1.1); ctx.fill();
    }
    if (kind === 'blocked') {
      ctx.strokeStyle = '#D4533F'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - r * .65, y - r * .65); ctx.lineTo(x + r * .65, y + r * .65); ctx.stroke();
    }
    if (kind === 'done') {
      ctx.fillStyle = '#1E5E45'; ctx.beginPath(); ctx.arc(x, y, r + 1, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(x - r * .45, y); ctx.lineTo(x - r * .1, y + r * .38); ctx.lineTo(x + r * .5, y - r * .35); ctx.stroke();
    }
    ctx.restore();
  }

  function drawHeader(h, count) {
    if (h.count === count) return;
    h.count = count;
    const { ctx, c } = h.t;
    ctx.clearRect(0, 0, c.width, c.height);
    drawIcon(ctx, h.col.icon, 30, 52, 15);
    ctx.fillStyle = '#1D252C'; ctx.font = '700 44px "DM Sans", sans-serif'; ctx.textBaseline = 'middle';
    ctx.fillText(h.col.name, 60, 54);
    const w = ctx.measureText(h.col.name).width;
    ctx.fillStyle = '#8A949E'; ctx.font = '500 38px "DM Sans", sans-serif';
    ctx.fillText(String(count), 60 + w + 14, 55);
    h.t.tex.needsUpdate = true;
  }

  /* ---------------- cards ---------------- */
  const avatarImgs = {};
  for (const [id, file] of Object.entries(AVATAR)) {
    const im = new Image(); im.src = `./assets/agents/${file}`; im.onload = () => { avatarImgs[id] = im; redrawCards(); }; }

  const cardGeo = () => new RoundedBoxGeometry(2.04, 0.06, 0.94, 2, 0.05);
  const faceGeo = new THREE.PlaneGeometry(1.96, 0.9);

  class Card {
    constructor(data, isHero = false) {
      this.data = { ...data }; this.isHero = isHero;
      this.group = new THREE.Group();
      const body = new THREE.Mesh(cardGeo(), new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.55 }));
      body.castShadow = true; body.receiveShadow = true;
      this.t = canvasTex(512, 236, isHero ? 3 : 2);
      const face = new THREE.Mesh(faceGeo, new THREE.MeshBasicMaterial({ map: this.t.tex, toneMapped: false }));
      face.rotation.x = -Math.PI / 2; face.position.y = 0.0315;
      this.group.add(body, face);
      scene.add(this.group);
      this.draw();
    }
    set(patch) {
      let changed = false;
      for (const k in patch) if (this.data[k] !== patch[k]) { this.data[k] = patch[k]; changed = true; }
      if (changed) this.draw();
    }
    draw() {
      const { ctx, c } = this.t; const d = this.data;
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, c.width, c.height);
      if (this.isHero) { ctx.strokeStyle = '#1E5E45'; ctx.lineWidth = 8; ctx.strokeRect(4, 4, c.width - 8, c.height - 8); }
      // priority bars + key
      const bars = d.prio ?? 3;
      for (let i = 0; i < 3; i++) { ctx.fillStyle = i < bars ? '#D69A1C' : '#E3E6E4'; ctx.fillRect(28 + i * 9, 40 - (i + 1) * 6, 6, (i + 1) * 6 + 4); }
      ctx.fillStyle = '#8A949E'; ctx.font = '500 24px "JetBrains Mono", monospace'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(d.key, 64, 42);
      // title, two lines max
      ctx.fillStyle = '#1D252C'; ctx.font = '600 29px "DM Sans", sans-serif';
      wrap(ctx, d.title, 28, 86, c.width - 56, 34, 2);
      // assignee
      const y = 196;
      if (d.who) {
        const im = avatarImgs[d.who];
        ctx.save(); ctx.beginPath(); ctx.arc(46, y - 8, 18, 0, Math.PI * 2); ctx.clip();
        if (im) {
          const s = Math.min(im.width, im.height), sy = d.who === 'ponytail' || d.who === 'sre-oncall' ? 0 : (im.height - s) / 2;
          ctx.drawImage(im, (im.width - s) / 2, sy, s, s, 28, y - 26, 36, 36);
        } else { ctx.fillStyle = '#D3D8D5'; ctx.fillRect(28, y - 26, 36, 36); }
        ctx.restore();
        ctx.fillStyle = '#3F4851'; ctx.font = '500 22px "DM Sans", sans-serif';
        ctx.fillText(d.who, 74, y);
      } else {
        ctx.fillStyle = '#8A949E'; ctx.font = '500 22px "DM Sans", sans-serif'; ctx.fillText('No assignee', 28, y);
      }
      // status pill on the right
      if (d.note) {
        const tones = {
          grey: ['#F1F2F0', '#5B6570'], blue: ['#E8F2EC', '#164634'], red: ['#FCEDEA', '#A63A2B'],
          green: ['#EAF6EE', '#2C7447'], amber: ['#FDF1DE', '#8A5A12'], done: ['#1E5E45', '#FFFFFF'],
        };
        const [bg, fg] = tones[d.tone] || tones.grey;
        ctx.font = '500 20px "JetBrains Mono", monospace';
        const tw = ctx.measureText(d.note).width, pw = tw + 24, px = c.width - 24 - pw;
        const whoW = d.who ? 74 + ctx.measureText(d.who).width + 20 : 180;
        if (px > whoW - 30) {
          ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(px, y - 27, pw, 36, 18); ctx.fill();
          ctx.fillStyle = fg; ctx.fillText(d.note, px + 12, y - 2);
        } else {
          // Not enough room beside the assignee: put the note under the title line.
          ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(c.width - 24 - pw, 20, pw, 34, 17); ctx.fill();
          ctx.fillStyle = fg; ctx.fillText(d.note, c.width - 12 - pw, 44);
        }
      }
      this.t.tex.needsUpdate = true;
    }
  }
  function wrap(ctx, text, x, y, maxW, lh, maxLines) {
    const words = text.split(' '); let line = ''; let n = 0;
    for (let i = 0; i < words.length; i++) {
      const test = line ? line + ' ' + words[i] : words[i];
      if (ctx.measureText(test).width > maxW && line) {
        n++;
        if (n === maxLines) { ctx.fillText(line.replace(/\s*\S*$/, '') + '…', x, y); return; }
        ctx.fillText(line, x, y); line = words[i]; y += lh;
      } else line = test;
    }
    ctx.fillText(line, x, y);
  }

  const AMBIENT = [
    { col: B, i: 1, key: 'DEV-113', title: 'Backfill missing district ids on old listings', who: null, note: 'Backlog', tone: 'grey', prio: 2 },
    { col: P, i: 1, key: 'DEV-132', title: 'Show the saved-search count in the result header', who: 'frontend-engineer', note: 'In progress', tone: 'blue' },
    { col: R, i: 1, key: 'DEV-118', title: 'Persist search filters in the URL', who: 'frontend-engineer', note: 'ready', tone: 'green' },
    { col: K, i: 1, key: 'DEV-114', title: 'Deduplicate phone leads within ten minutes', who: 'backend-engineer', note: 'insufficient_proof', tone: 'red' },
    { col: D, i: 1, key: 'DEV-117', title: 'Return 404 instead of 500 for archived listings', who: 'backend-engineer', note: 'Merged', tone: 'done' },
    { col: D, i: 2, key: 'DEV-116', title: 'Make the lead form keyboard accessible', who: 'frontend-engineer', note: 'Merged', tone: 'done', prio: 2 },
  ];

  function buildCards() {
    for (const a of AMBIENT) {
      const card = new Card(a);
      card.group.position.copy(slot(a.col, a.i));
      card.group.quaternion.copy(boardQ);
      card.col = a.col; card.i = a.i;
      ambient.push(card);
    }
    hero = new Card({ key: 'DEV-133', title: 'Return 400 for an unknown sort key', who: null, note: 'New issue', tone: 'grey' }, true);
    heroGlow = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.4), new THREE.MeshBasicMaterial({
      map: glowTexture(), transparent: true, depthWrite: false, opacity: 0.8, toneMapped: false,
    }));
    heroGlow.rotation.x = -Math.PI / 2; heroGlow.position.y = -0.028; heroGlow.renderOrder = -1;
    hero.group.add(heroGlow);
  }
  function glowTexture() {
    const c = document.createElement('canvas'); c.width = 256; c.height = 144; const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(128, 72, 10, 128, 72, 128);
    g.addColorStop(0, 'rgba(30,94,69,.45)'); g.addColorStop(1, 'rgba(30,94,69,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 144);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  function redrawCards() { if (!hero) return; ambient.forEach((c) => c.draw()); hero.draw(); }
  if (document.fonts) document.fonts.ready.then(() => { redrawCards(); headers.forEach((h) => { const n = h.count; h.count = -1; drawHeader(h, n); }); });

  /* ---------------- figures ---------------- */
  // Figures stand still: the skinned mesh stays in its bind pose, placed once facing the viewer.
  class Fig {
    constructor(def) {
      this.def = def;
      this.group = new THREE.Group();
      this.bob = new THREE.Group();
      this.group.add(this.bob);
      this.group.position.set(def.x ?? 0, FLOOR_Y, def.z ?? ROW_Z);
      this.group.rotation.y = Math.atan2(-this.group.position.x, 24 - this.group.position.z);
      this.height = FIG_H;
      this.placeholder();
      const hit = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, FIG_H, 12),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
      hit.position.y = FIG_H / 2; hit.userData.fig = this;
      this.group.add(hit); hits.push(hit);
      scene.add(this.group);
    }
    placeholder() {
      const c = new THREE.Color(this.def.color);
      const mat = new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.35 });
      const headMat = new THREE.MeshPhysicalMaterial({ color: c.clone().lerp(new THREE.Color(0xF2DEC4), 0.55), roughness: 0.45, clearcoat: 0.5 });
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 0.42, 6, 18), mat); body.position.y = 0.46;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 18), headMat); head.position.y = 1.02;
      const earL = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), headMat); earL.position.set(-0.3, 1.05, 0);
      const earR = earL.clone(); earR.position.x = 0.3;
      for (const m of [body, head, earL, earR]) m.castShadow = true;
      g.add(body, head, earL, earR);
      this.ph = g; this.bob.add(g);
    }
    setModel(gltf) {
      const model = gltf.scene;
      const maxAniso = renderer.capabilities.getMaxAnisotropy();
      model.traverse((o) => {
        if (!o.isMesh) return;
        o.castShadow = true; o.frustumCulled = false;
        for (const m of [].concat(o.material)) {
          if (m.map) {
            m.map.colorSpace = THREE.SRGBColorSpace;
            // Mipmaps bleed across UV island edges on these atlases and show as seams.
            m.map.generateMipmaps = false;
            m.map.minFilter = THREE.LinearFilter;
            m.map.anisotropy = maxAniso;
            m.map.needsUpdate = true;
          }
          // The generated GLBs bake the texture in again as full emissive (and specular 2.0),
          // which flattens and washes out the figures. Light them from the scene instead.
          if (m.emissive) { m.emissiveMap = null; m.emissive.setRGB(0, 0, 0); }
          if (m.specularColor) m.specularColor.setRGB(1, 1, 1);
          if ('specularIntensity' in m) m.specularIntensity = 0.4;
          if ('metalness' in m) m.metalness = Math.min(m.metalness ?? 0, 0.1);
          if ('roughness' in m) m.roughness = 0.62;
          m.envMapIntensity = 0.5;
          m.transparent = false; m.opacity = 1; m.alphaTest = 0; m.depthWrite = true;
          m.needsUpdate = true;
        }
      });
      const holder = new THREE.Group(); holder.add(model);
      model.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      if (size.y > 0) {
        holder.scale.setScalar(FIG_H / size.y);
        model.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
      }
      this.bob.remove(this.ph);
      this.bob.add(holder);
      this.model = holder;
    }
  }

  function buildFigure(def) { figs.set(def.id, new Fig(def)); }

  function buildYou() {
    const g = new THREE.Group();
    const mat = new THREE.MeshPhysicalMaterial({ color: 0xF0B45D, roughness: 0.38, clearcoat: 0.7, transparent: true });
    const headMat = new THREE.MeshPhysicalMaterial({ color: 0xF6CE92, roughness: 0.4, clearcoat: 0.6, transparent: true });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.5, 6, 18), mat); body.position.y = 0.5;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 18), headMat); head.position.y = 1.08;
    body.castShadow = head.castShadow = true;
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.52, 40), new THREE.MeshBasicMaterial({ color: 0xF0B45D, transparent: true, toneMapped: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.012;
    g.add(body, head, ring);
    g.position.set(-5.15, FLOOR_Y, ROW_Z + 0.8);
    g.userData.mats = [mat, headMat, ring.material];
    const hit = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.3, 12), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
    hit.position.y = 0.65; hit.userData.fig = { def: { id: 'You', role: 'Approves the plan. Merges the PR.' }, you: true };
    g.add(hit); hits.push(hit);
    scene.add(g);
    you = { group: g, opacity: 0, height: 1.3 };
  }

  /* ---------------- bubbles ---------------- */
  function buildBubbles() {
    for (const b of BUBBLES) {
      const el = document.createElement('div');
      el.className = 'tb' + (b.tone ? ' ' + b.tone : '');
      el.textContent = b.text;
      overlay.appendChild(el);
      bubbles.push({ ...b, el, on: false });
    }
    const tag = document.createElement('div');
    tag.className = 'tb tag'; tag.textContent = 'You';
    overlay.appendChild(tag);
    you.tag = tag;
  }

  /* ---------------- models ---------------- */
  function loadModels() {
    const loader = new GLTFLoader();
    let done = 0; const total = FIGS.length;
    loadingEl.hidden = false;
    const update = () => { loadingEl.textContent = `Loading the team · ${done} / ${total}`; if (done >= total) loadingEl.hidden = true; };
    update();
    for (const def of FIGS) {
      loader.load(`./assets/models/${def.id}.glb`, (gltf) => {
        try { figs.get(def.id).setModel(gltf); } catch (e) { console.warn('team: model setup failed', def.id, e); }
        done++; update(); renderOnce();
      }, undefined, () => { done++; update(); });
    }
  }

  /* ---------------- per-frame state ---------------- */
  const tmp = new THREE.Vector3();
  function applyTimeline(t, snap = false) {
    // hero card
    const c = cardAt(t);
    hero.group.position.copy(c.pos);
    hero.group.scale.setScalar(Math.max(0.0001, c.scale));
    hero.group.visible = c.scale > 0.001;
    hero.group.quaternion.copy(boardQ);
    const hs = heroStateAt(t);
    hero.set({ who: hs.who, note: hs.note, tone: hs.tone });

    // column counts
    const counts = COLS.map((_, i) => AMBIENT.filter((a) => a.col === i).length + (c.col === i ? 1 : 0));
    headers.forEach((h, i) => drawHeader(h, counts[i]));

    // you
    let yo = 0, yx = you.group.position.x, yz = you.group.position.z;
    for (const w of YOU_WINDOWS) {
      if (t >= w.t0 && t < w.t1) {
        yo = 1; yx = w.x; yz = w.z;
      }
    }
    you.opacity = yo > 0 ? 1 : 0;
    you.group.position.set(yx, FLOOR_Y, yz);
    you.group.rotation.y = Math.atan2(-yx, 24 - yz);
    you.group.visible = yo > 0;

    // beat caption + steps
    const bi = t >= 43.4 ? BEATS.length - 1 : beatAt(t);
    captionN.textContent = `${String(bi + 1).padStart(2, '0')} / 08`;
    if (captionT.textContent !== BEATS[bi].text) captionT.textContent = BEATS[bi].text;
    captionEl.classList.toggle('you', !!BEATS[bi].you);
    stepEls.forEach((el, i) => el.classList.toggle('on', i === bi));

    // focus for the camera
    let fx = BEATS[bi].focus;
    if (fx === 'backend') fx = c.pos.x;
    if (fx === 'b7') fx = t < 30.6 ? c.pos.x : 3.0;
    camTargetX = fx;

    // HUD
    const done = RUN_EVENTS.filter(([rt]) => t >= rt);
    const perLoopRuns = RUN_EVENTS.length, perLoopCost = RUN_EVENTS.reduce((s, r) => s + r[1], 0);
    const L = loops % 8;
    const runs = 7 + L * perLoopRuns + done.length;
    const spend = 6.08 + L * perLoopCost + done.reduce((s, r) => s + r[1], 0);
    hud.runs.textContent = String(runs);
    hud.spend.textContent = '$' + spend.toFixed(2);
    hud.runsBar.style.width = Math.max(3, runs / 150 * 100) + '%';
    hud.spendBar.style.width = Math.max(3, spend / 200 * 100) + '%';
    hud.plan.classList.toggle('on', t >= 9.3);
    hud.merge.classList.toggle('on', t >= 37.0);
  }

  function placeOverlay() {
    const w = view.clientWidth, h = view.clientHeight;
    const project = (v) => { tmp.copy(v).project(camera); return [(tmp.x * 0.5 + 0.5) * w, (-tmp.y * 0.5 + 0.5) * h, tmp.z]; };
    for (const b of bubbles) {
      const on = T >= b.t0 && T < b.t1;
      if (on !== b.on) { b.on = on; b.el.classList.toggle('on', on); }
      if (!on) continue;
      let anchor;
      if (b.who === 'you') anchor = you.group.position.clone().setY(FLOOR_Y + 1.35 + (b.lift || 0) + 0.35);
      else { const f = figs.get(b.who); anchor = f.group.position.clone().setY(FLOOR_Y + FIG_H + 0.22 + (b.lift || 0)); }
      const [x, y] = project(anchor);
      b.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`;
    }
    const tagOn = you.opacity > 0.4;
    you.tag.classList.toggle('on', tagOn);
    if (tagOn) {
      const [x, y] = project(you.group.position.clone().setY(FLOOR_Y + 1.42));
      you.tag.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`;
    }
  }

  /* ---------------- camera ---------------- */
  const DIR = new THREE.Vector3(0.05, 0.4, 0.915).normalize();
  function resize() {
    const w = view.clientWidth, h = view.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    narrow = w < 700;
    camera.fov = narrow ? 30 : 26;
    camera.updateProjectionMatrix();
    renderOnce();
  }
  let camX = 0;
  function updateCamera(dt, t, snap = false) {
    const vf = THREE.MathUtils.degToRad(camera.fov);
    const hf = 2 * Math.atan(Math.tan(vf / 2) * camera.aspect);
    const halfW = narrow ? 3.1 : 6.6;
    const dW = halfW / Math.tan(hf / 2);
    const dV = (narrow ? 2.3 : 2.45) / Math.tan(vf / 2);
    const dist = Math.max(dW, dV);
    const k = narrow ? 1 : 0.1;
    const goal = THREE.MathUtils.clamp(camTargetX * k, narrow ? -4.4 : -2.2, narrow ? 4.4 : 2.2);
    camX = snap ? goal : camX + (goal - camX) * Math.min(1, dt * 1.6);
    const drift = reduce ? 0 : Math.sin(t * 0.21) * 0.25;
    camFocus.set(camX, narrow ? 1.5 : 1.38, 2.4);
    camera.position.copy(camFocus).addScaledVector(DIR, dist);
    camera.position.x += drift;
    camera.lookAt(camFocus);
  }

  /* ---------------- loop ---------------- */
  function renderOnce() {
    if (!renderer) return;
    updateCamera(0.016, T, true);
    placeOverlay();
    renderer.render(scene, camera);
  }
  function kick() {
    if (!renderer || reduce) { if (renderer) renderOnce(); return; }
    const run = visible && !document.hidden;
    if (run && !raf) { lastNow = performance.now(); raf = requestAnimationFrame(frame); }
    if (!run && raf) { cancelAnimationFrame(raf); raf = 0; }
  }
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - lastNow) / 1000); lastNow = now;
    step(dt);
  }
  function step(dt) {
    T += dt;
    if (T >= LOOP) { T -= LOOP; loops++; }
    applyTimeline(T);
    updateCamera(dt, T);
    placeOverlay();
    renderer.render(scene, camera);
  }

  /* ---------------- hover ---------------- */
  const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2();
  function onPointer(e) {
    if (!camera) return;
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(hits, false).find((h) => h.object.parent.visible);
    if (!hit) { tip.hidden = true; canvas.style.cursor = ''; return; }
    const f = hit.object.userData.fig;
    const img = tip.querySelector('img');
    if (f.you) { img.hidden = true; } else { img.hidden = false; img.src = `./assets/agents/${f.def.id}-figure.jpg`; }
    tip.querySelector('b').textContent = f.def.id;
    tip.querySelector('span').textContent = f.def.role;
    tip.hidden = false;
    const x = Math.min(e.clientX - r.left + 16, r.width - tip.offsetWidth - 8);
    const y = Math.max(8, e.clientY - r.top - tip.offsetHeight - 12);
    tip.style.transform = `translate(${x}px, ${y}px)`;
    canvas.style.cursor = 'default';
  }
}

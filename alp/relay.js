import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

/* =========================================================
   Page UI (independent of WebGL)
   ========================================================= */
const nav = document.getElementById('nav');
const onScrollNav = () => nav.classList.toggle('scrolled', scrollY > 8);
addEventListener('scroll', onScrollNav, { passive: true });
onScrollNav();

// Analytics tabs
const anTabs = [...document.querySelectorAll('.seg [role=tab]')];
const anShots = [...document.querySelectorAll('#anShots img')];
function selectAn(i, focus) {
  anTabs.forEach((t, k) => {
    const on = k === i;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
  });
  anShots.forEach((img, k) => { img.hidden = k !== i; });
  if (focus) anTabs[i].focus();
}
anTabs.forEach((t, i) => {
  t.addEventListener('click', () => selectAn(i));
  t.addEventListener('keydown', e => {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    selectAn((i + d + anTabs.length) % anTabs.length, true);
  });
});

// Autonomy panel
const LEVELS = [
  { n: 'Suggest', d: 'Only runs a person asked for go out. Alp changes nothing by itself. Every scope lands here while the kill switch is on.' },
  { n: 'Open PRs', d: 'Agents hand work to each other, autopilots run and agents open PRs, all inside the spend and chain limits. People route reviews and merge. This is the default.' },
  { n: 'Route reviews', d: 'When review requests changes, Alp sends the issue back to Delivery with the findings as a handoff note. After two rejections a person takes over.' },
  { n: 'Ready for merge', d: 'Alp tells you when a PR is ready: a ready verdict, green CI and a reviewed head. You get one notice, and you merge.' },
  { n: 'Self-improve', d: 'Alp opens improvement issues for repeated failures, and a fix PR once the benchmark validates it. A person still merges it.' },
];
const detents = [...document.querySelectorAll('#detents button')];
const lvlOut = document.getElementById('lvlOut');
const lvlDesc = document.getElementById('lvlDesc');
const kill = document.getElementById('kill');
const panel = document.getElementById('panel');
let level = 1;
function renderLevel() {
  const killed = kill.getAttribute('aria-pressed') === 'true';
  const l = killed ? 0 : level;
  detents.forEach(b => {
    const on = +b.dataset.l === l;
    b.setAttribute('aria-checked', String(on));
    b.tabIndex = on ? 0 : -1;
    b.disabled = killed;
  });
  lvlOut.textContent = `L${l} · ${LEVELS[l].n}`;
  lvlDesc.textContent = killed
    ? 'Kill switch on. Every autonomous run stops and every scope drops to L0 until an owner or admin releases it.'
    : LEVELS[l].d;
  panel.classList.toggle('killed', killed);
}
detents.forEach(b => {
  b.addEventListener('click', () => { level = +b.dataset.l; renderLevel(); });
  b.addEventListener('keydown', e => {
    const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    level = clamp(level + d, 0, 4); renderLevel(); detents[level].focus();
  });
});
kill.addEventListener('click', () => {
  kill.setAttribute('aria-pressed', String(kill.getAttribute('aria-pressed') !== 'true'));
  renderLevel();
});
renderLevel();


// Tray tilt: lies back on the table, stands up as it scrolls in
const trays = [...document.querySelectorAll('.tray-rim')];
function tiltTrays() {
  for (const t of trays) {
    const r = t.getBoundingClientRect();
    const k = clamp((innerHeight - r.top) / (innerHeight * 0.75), 0, 1);
    t.style.setProperty('--tilt', reduce ? '0deg' : `${(1 - k) * 22}deg`);
  }
}
addEventListener('scroll', tiltTrays, { passive: true });
addEventListener('resize', tiltTrays);
tiltTrays();

/* =========================================================
   The relay table (three.js)
   ========================================================= */
const stage = document.getElementById('relay');
const canvas = document.getElementById('bench');
const heroCopy = document.getElementById('heroCopy');
const steps = [...document.querySelectorAll('.step')];
const rail = document.querySelector('.rail');
const railSpans = [...rail.querySelectorAll('span')];
const railFill = document.getElementById('railFill');
const tip = document.getElementById('tip');

function fallback() {
  stage.classList.add('fallback');
  canvas.remove();
  heroCopy.classList.remove('gone');
  steps.forEach(s => s.classList.add('on'));
}

let renderer = null;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
} catch (e) {
  renderer = null;
}

if (!renderer) fallback();
else await buildScene();

async function buildScene() {
  try { await document.fonts.load('600 44px "DM Sans"'); await document.fonts.load('500 24px "JetBrains Mono"'); } catch (e) { /* draw with fallback faces */ }

  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;

  const camera = new THREE.PerspectiveCamera(26, 1, 0.5, 200);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xdfe4e1, 1.1));
  const sun = new THREE.DirectionalLight(0xffffff, 2.3);
  sun.position.set(-9, 24, 16);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 16, bottom: -16, near: 2, far: 70 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);

  /* ---------- dimensions ---------- */
  const N = 7, PITCH = 2.3, L = 34, D = N * PITCH + 1.2;
  const laneZ = i => (i - (N - 1) / 2) * PITCH;
  const HERO_LANE = 3;
  const ST = { arch: -9, del: 0, rev: 9, end: 14.6, start: -14.2 };

  /* ---------- materials ---------- */
  const mTable = new THREE.MeshStandardMaterial({ color: 0xE8EBE9, roughness: 0.62, metalness: 0.06 });
  const mLane = new THREE.MeshStandardMaterial({ color: 0xE0E4E1, roughness: 0.8, metalness: 0 });
  const mHeroLane = new THREE.MeshStandardMaterial({ color: 0xD9E6FF, roughness: 0.8, metalness: 0 });
  const mDivider = new THREE.MeshStandardMaterial({ color: 0xCDD3CF, roughness: 0.5, metalness: 0.3 });
  const mSteel = new THREE.MeshStandardMaterial({ color: 0xE6EAE8, roughness: 0.34, metalness: 0.55 });
  const mSteelDark = new THREE.MeshStandardMaterial({ color: 0xC9CFCB, roughness: 0.38, metalness: 0.6 });
  const mPaper = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.9, metalness: 0 });
  const mPuck = new THREE.MeshStandardMaterial({ color: 0x2F6BE0, roughness: 0.28, metalness: 0.35 });
  const mPuckTop = new THREE.MeshStandardMaterial({ color: 0xF4F7FF, roughness: 0.4, metalness: 0.1 });
  const mAmber = new THREE.MeshStandardMaterial({ color: 0xF0B45D, roughness: 0.32, metalness: 0.25 });

  /* ---------- table ---------- */
  const table = new THREE.Mesh(new RoundedBoxGeometry(L, 1.1, D, 4, 0.32), mTable);
  table.position.y = -0.55;
  table.receiveShadow = true;
  scene.add(table);

  const rim = new THREE.Mesh(new RoundedBoxGeometry(L - 0.6, 0.16, 0.24, 2, 0.06), mSteel);
  rim.position.set(0, -0.28, D / 2 + 0.04);
  scene.add(rim);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), new THREE.ShadowMaterial({ opacity: 0.07 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.1;
  floor.receiveShadow = true;
  scene.add(floor);

  const laneGeo = new THREE.PlaneGeometry(L - 1.6, PITCH - 0.24);
  const dividerGeo = new THREE.BoxGeometry(L - 1.6, 0.04, 0.05);
  for (let i = 0; i < N; i++) {
    const lane = new THREE.Mesh(laneGeo, i === HERO_LANE ? mHeroLane : mLane);
    lane.rotation.x = -Math.PI / 2;
    lane.position.set(0, 0.004, laneZ(i));
    lane.receiveShadow = true;
    scene.add(lane);
    if (i < N - 1) {
      const dv = new THREE.Mesh(dividerGeo, mDivider);
      dv.position.set(0, 0.02, laneZ(i) + PITCH / 2);
      dv.receiveShadow = true;
      scene.add(dv);
    }
  }

  /* ---------- canvas textures ---------- */
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
  function labelTexture(text, { w = 1024, h = 128, size = 64, color = '#1D252C', bg = null, track = 10 } = {}) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d');
    if (bg) { x.fillStyle = bg; x.fillRect(0, 0, w, h); }
    x.fillStyle = color;
    x.font = `500 ${size}px "JetBrains Mono", ui-monospace, monospace`;
    x.textBaseline = 'middle'; x.textAlign = 'center';
    if ('letterSpacing' in x) x.letterSpacing = `${track}px`;
    x.fillText(text, w / 2, h / 2 + 2);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t;
  }
  function cardTexture(card, stamped) {
    const w = 680, h = 400;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d');
    x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, w, h);
    x.strokeStyle = '#E3E6E4'; x.lineWidth = 6; rr(x, 3, 3, w - 6, h - 6, 22); x.stroke();
    x.fillStyle = '#8A949E'; x.font = '500 34px "JetBrains Mono", monospace'; x.textBaseline = 'alphabetic';
    x.fillText(card.key, 40, 70);
    x.fillStyle = card.hero ? '#2F6BE0' : '#9DB8EE';
    x.beginPath(); x.arc(w - 52, 60, 13, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#1D252C'; x.font = '600 54px "DM Sans", sans-serif';
    const words = card.title.split(' '); let line = '', y = 142; const lines = [];
    for (const word of words) {
      const test = line ? line + ' ' + word : word;
      if (x.measureText(test).width > w - 80 && line) { lines.push(line); line = word; } else line = test;
    }
    lines.push(line);
    lines.slice(0, 3).forEach((l, i) => x.fillText(l, 40, y + i * 64));
    x.fillStyle = '#C3CAD0'; x.fillRect(40, h - 62, 150, 10); x.fillRect(206, h - 62, 90, 10);
    x.fillStyle = card.kind === 'backend' ? '#2F6BE0' : '#6E9BF0'; x.fillRect(40, h - 62, 60, 10);
    if (stamped) {
      x.save(); x.translate(w - 150, h - 130); x.rotate(-0.22);
      x.strokeStyle = '#C98A2A'; x.lineWidth = 10; x.beginPath(); x.arc(0, 0, 92, 0, Math.PI * 2); x.stroke();
      x.lineWidth = 3; x.beginPath(); x.arc(0, 0, 76, 0, Math.PI * 2); x.stroke();
      x.fillStyle = '#C98A2A'; x.font = '700 34px "JetBrains Mono", monospace'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText('MERGED', 0, 2);
      x.restore();
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t;
  }
  function badgeSprite(text, fg, bg) {
    const font = '500 50px "JetBrains Mono", monospace';
    const m = document.createElement('canvas').getContext('2d');
    m.font = font; if ('letterSpacing' in m) m.letterSpacing = '4px';
    const tw = Math.ceil(m.measureText(text).width) + 120;
    const c = document.createElement('canvas'); c.width = tw + 20; c.height = 150;
    const x = c.getContext('2d');
    x.font = font; if ('letterSpacing' in x) x.letterSpacing = '4px';
    x.fillStyle = bg; rr(x, 10, 14, tw, 116, 58); x.fill();
    x.strokeStyle = 'rgba(29,37,44,0.08)'; x.lineWidth = 3; rr(x, 10, 14, tw, 116, 58); x.stroke();
    x.fillStyle = fg; x.beginPath(); x.arc(68, 72, 14, 0, Math.PI * 2); x.fill();
    x.textBaseline = 'middle'; x.fillText(text, 96, 74);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false }));
    s.userData.aspect = c.width / c.height;
    s.scale.set(s.userData.aspect, 1, 1);
    s.renderOrder = 10;
    return s;
  }

  /* ---------- stations ---------- */
  const leds = {};
  function station(xPos, name, key) {
    const g = new THREE.Group();
    const postGeo = new RoundedBoxGeometry(0.62, 2.2, 0.62, 3, 0.14);
    for (const z of [D / 2 - 0.2, -D / 2 + 0.2]) {
      const post = new THREE.Mesh(postGeo, mSteel);
      post.position.set(0, 1.1, z);
      post.castShadow = true;
      g.add(post);
      const foot = new THREE.Mesh(new RoundedBoxGeometry(1.1, 0.16, 1.1, 2, 0.05), mSteelDark);
      foot.position.set(0, 0.08, z);
      foot.castShadow = true; foot.receiveShadow = true;
      g.add(foot);
    }
    const beam = new THREE.Mesh(new RoundedBoxGeometry(0.9, 0.7, D + 0.2, 3, 0.18), mSteel);
    beam.position.set(0, 2.45, 0);
    beam.castShadow = true;
    g.add(beam);
    const plate = new THREE.Mesh(
      new THREE.PlaneGeometry(6.4, 0.66),
      new THREE.MeshBasicMaterial({ map: labelTexture(name, { size: 70, track: 14 }), transparent: true, toneMapped: false })
    );
    plate.rotation.y = -Math.PI / 2;
    plate.position.set(-0.455, 2.46, 2.2);
    g.add(plate);
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 16), new THREE.MeshBasicMaterial({ color: 0xC9D0CC, toneMapped: false }));
    led.position.set(-0.46, 2.46, -2.0);
    g.add(led);
    leds[key] = led;
    g.position.x = xPos;
    scene.add(g);
    return g;
  }
  station(ST.arch, 'ARCHITECTURE', 'arch');
  station(ST.del, 'DELIVERY', 'del');
  station(ST.rev, 'REVIEW', 'rev');

  /* ---------- merge press ---------- */
  const press = new THREE.Group();
  const heroZ = laneZ(HERO_LANE);
  const pressPost = new THREE.Mesh(new RoundedBoxGeometry(0.6, 4.2, 0.6, 3, 0.12), mSteel);
  pressPost.position.set(0, 2.1, -D / 2 + 0.3);
  pressPost.castShadow = true;
  press.add(pressPost);
  const arm = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.42, heroZ + D / 2 + 0.3, 3, 0.1), mSteel);
  arm.position.set(0, 4.0, (heroZ - D / 2 + 0.3) / 2 + 0.15);
  arm.castShadow = true;
  press.add(arm);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1, 16), mSteelDark);
  press.add(rod);
  const seal = new THREE.Group();
  const sealBody = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.76, 0.36, 48), mAmber);
  sealBody.castShadow = true;
  const sealKnob = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.34, 32), mPuckTop);
  sealKnob.position.y = 0.34;
  sealKnob.castShadow = true;
  seal.add(sealBody, sealKnob);
  seal.position.set(0, 2.6, heroZ);
  press.add(seal);
  const sealRing = new THREE.Mesh(new THREE.RingGeometry(0.85, 0.96, 48), new THREE.MeshBasicMaterial({ color: 0xF0B45D, transparent: true, opacity: 0.55 }));
  sealRing.rotation.x = -Math.PI / 2;
  sealRing.position.set(0, 0.012, heroZ);
  press.add(sealRing);
  const pressLabel = new THREE.Mesh(
    new THREE.PlaneGeometry(4.2, 0.62),
    new THREE.MeshBasicMaterial({ map: labelTexture('MERGE · HUMAN', { size: 66, track: 12, color: '#B97A1C' }), transparent: true, toneMapped: false })
  );
  pressLabel.rotation.y = -Math.PI / 2;
  pressLabel.position.set(-0.26, 4.0, -2.2);
  press.add(pressLabel);
  press.position.x = ST.end;
  scene.add(press);

  /* ---------- cards + pucks ---------- */
  const cardGeo = new RoundedBoxGeometry(3.4, 0.1, 1.9, 2, 0.05);
  const puckGeo = new THREE.CylinderGeometry(0.44, 0.48, 0.36, 40);
  const puckCapGeo = new THREE.CylinderGeometry(0.27, 0.27, 0.03, 32);
  const DATA = [
    { key: 'ALP-203', title: 'Refactor the settings loader', kind: 'frontend' },
    { key: 'ALP-218', title: 'Add a rate-limit guard to the lead form', kind: 'backend', hero: true },
    { key: 'ALP-207', title: 'Unify API error handling', kind: 'backend' },
    { key: 'ALP-211', title: 'Fix retry logic on the webhook fan-out', kind: 'backend' },
    { key: 'ALP-214', title: 'Paginate saved searches', kind: 'frontend' },
    { key: 'ALP-221', title: 'Add tests for billing tier checks', kind: 'backend' },
    { key: 'ALP-230', title: 'Cache the pricing table', kind: 'backend' },
    { key: 'ALP-226', title: 'Show a rate-limit banner', kind: 'frontend' },
    { key: 'ALP-233', title: 'Keyboard access for the filter bar', kind: 'frontend' },
  ];
  const cards = [];
  const cardMeshes = [];
  let other = 0;
  DATA.forEach((d, idx) => {
    const k = other % (N - 1), lap = Math.floor(other / (N - 1));
    const lane = d.hero ? HERO_LANE : (k >= HERO_LANE ? k + 1 : k);
    if (!d.hero) other++;
    const topTex = cardTexture(d, false);
    const topMat = new THREE.MeshStandardMaterial({ map: topTex, roughness: 0.85, metalness: 0 });
    const mesh = new THREE.Mesh(cardGeo, [mPaper, mPaper, topMat, mPaper, mPaper, mPaper]);
    mesh.castShadow = true; mesh.receiveShadow = true;
    mesh.position.set(0, 0.075, laneZ(lane));
    scene.add(mesh);
    const puck = new THREE.Group();
    const pb = new THREE.Mesh(puckGeo, mPuck); pb.castShadow = true;
    const pc = new THREE.Mesh(puckCapGeo, mPuckTop); pc.position.y = 0.19;
    puck.add(pb, pc);
    puck.position.set(0, 0.16, laneZ(lane));
    scene.add(puck);
    const card = {
      ...d, lane, mesh, puck, topMat, stampedTex: d.hero ? cardTexture(d, true) : null, plainTex: topTex, stamped: false,
      o: d.hero ? 0 : (lane * 0.31 + lap * 0.5 + 0.08) % 1, s: 0.75 + ((lane * 37) % 10) / 18, x: 0,
    };
    mesh.userData.card = card;
    cards.push(card);
    cardMeshes.push(mesh);
  });
  const hero = cards.find(c => c.hero);

  const flagChanges = badgeSprite('CHANGES REQUESTED · 1 FINDING', '#D4533F', 'rgba(255,255,255,0.97)');
  const flagReady = badgeSprite('VERDICT · READY', '#3E9B5F', 'rgba(255,255,255,0.97)');
  scene.add(flagChanges, flagReady);

  /* ---------- timeline ---------- */
  const KEYS = [[0, ST.start], [0.07, ST.start], [0.19, ST.arch], [0.31, ST.arch], [0.41, ST.del], [0.51, ST.del],
    [0.59, ST.rev], [0.63, ST.rev], [0.69, 1.6], [0.73, 1.6], [0.79, ST.rev], [0.84, ST.rev], [0.9, ST.end], [1, ST.end]];
  function heroX(p) {
    for (let i = 0; i < KEYS.length - 1; i++) {
      const [p0, x0] = KEYS[i], [p1, x1] = KEYS[i + 1];
      if (p <= p1) return lerp(x0, x1, smooth(p0, p1, p));
    }
    return ST.end;
  }
  const stepOf = p => p < 0.13 ? 0 : p < 0.35 ? 1 : p < 0.55 ? 2 : p < 0.87 ? 3 : 4;
  function stageOf(x) {
    if (x < ST.arch - 1.2) return 'Intake';
    if (x < ST.del - 1.2) return 'Architecture';
    if (x < ST.rev - 1.2) return 'Delivery';
    if (x < ST.end - 0.6) return 'Review';
    return 'Ready for merge';
  }
  function agentFor(card, st) {
    if (card.hero && card.stamped) return ['Merged by a person', 'amber'];
    if (card.hero && heroPhase === 'bounce') return ['reviewer · changes requested', 'red'];
    switch (st) {
      case 'Intake': return ['Unassigned · backlog', ''];
      case 'Architecture': return ['system-architect', ''];
      case 'Delivery': return [card.kind === 'backend' ? 'backend-engineer' : 'frontend-engineer', ''];
      case 'Review': return ['reviewer · qa-breaker', ''];
      default: return ['Waiting for a person', 'amber'];
    }
  }
  let heroPhase = '';

  /* ---------- camera framing ---------- */
  const target = new THREE.Vector3();
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let W = 1, H = 1, narrow = false;
  function resize() {
    const r = canvas.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    narrow = camera.aspect < 0.9;
    camera.fov = narrow ? 44 : 26;
    camera.updateProjectionMatrix();
  }
  resize();
  addEventListener('resize', resize);

  function placeCamera(p, hx) {
    // k blends from the wide hero shot to a closer shot that follows the hero card.
    const k = smooth(0.03, 0.16, p);
    const tx = narrow ? lerp(0, hx * 0.9, k) : lerp(2.4, hx * 0.85 + 1.5, k);
    target.set(tx, narrow ? lerp(-3, -1, k) : 0, lerp(narrow ? 1 : 1.2, heroZ, k));
    const dist = narrow ? lerp(58, 40, k) : lerp(45, 33, k);
    const az = THREE.MathUtils.degToRad(-38 + pointer.x * 3);
    const el = THREE.MathUtils.degToRad(lerp(36, 40, k) + pointer.y * 2);
    camera.position.set(
      target.x + dist * Math.cos(el) * Math.sin(az),
      target.y + dist * Math.sin(el),
      target.z + dist * Math.cos(el) * Math.cos(az)
    );
    camera.lookAt(target);
    // Shift the framing so the table sits right of the headline, then right of the step card.
    camera.setViewOffset(W, H,
      narrow ? 0 : lerp(-W * 0.2, -W * 0.13, k),
      narrow ? lerp(-H * 0.34, H * 0.12, k) : lerp(-H * 0.12, -H * 0.02, k),
      W, H);
  }

  /* ---------- hover ---------- */
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let hovered = null;
  canvas.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    pointer.tx = ndc.x; pointer.ty = ndc.y;
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(cardMeshes, false)[0];
    hovered = hit ? hit.object.userData.card : null;
    canvas.style.cursor = hovered ? 'pointer' : '';
    if (hovered) {
      const st = stageOf(hovered.x);
      const [agent, tone] = agentFor(hovered, st);
      tip.innerHTML = `<b>${hovered.title}</b>${hovered.key} · ${st}<br><span class="st ${tone}">${agent}</span>`;
      tip.style.left = `${e.clientX - r.left}px`;
      tip.style.top = `${e.clientY - r.top}px`;
      tip.hidden = false;
    } else tip.hidden = true;
  });
  canvas.addEventListener('pointerleave', () => { hovered = null; tip.hidden = true; pointer.tx = 0; pointer.ty = 0; });

  /* ---------- progress ---------- */
  let pTarget = 0, pView = 0;
  // The final beats (p 0.78-1: verdict, pause, press, stamp, hold) get 45% of
  // the scroll, so each one reads on its own. Earlier beats keep their pace.
  const SEAL_AT = 0.78, SEAL_SCROLL = 0.55;
  const toProgress = u => u < SEAL_SCROLL
    ? u / SEAL_SCROLL * SEAL_AT
    : SEAL_AT + (u - SEAL_SCROLL) / (1 - SEAL_SCROLL) * (1 - SEAL_AT);
  function readProgress() {
    const r = stage.getBoundingClientRect();
    const span = Math.max(1, r.height - innerHeight);
    pTarget = toProgress(clamp(-r.top / span, 0, 1));
  }
  addEventListener('scroll', readProgress, { passive: true });
  readProgress();
  pView = pTarget;

  function updateDom(p) {
    const showSteps = p > 0.035;
    const s = stepOf(p);
    heroCopy.classList.toggle('gone', showSteps);
    stage.classList.toggle('relaying', showSteps);
    steps.forEach((el, i) => el.classList.toggle('on', showSteps && i === s));
    railSpans.forEach((el, i) => el.classList.toggle('on', i <= s));
    rail.classList.toggle('on', showSteps);
    railFill.style.width = `${(p * 100).toFixed(2)}%`;
  }

  /* ---------- per-frame update ---------- */
  function update(t) {
    pView = reduce ? pTarget : pView + (pTarget - pView) * 0.12;
    const p = pView;
    const hx = heroX(p);
    const drift = reduce ? 0 : t;

    heroPhase = p > 0.63 && p < 0.74 ? 'bounce' : '';
    for (const c of cards) {
      let x;
      if (c.hero) x = hx;
      else {
        const u = (c.o + p * c.s * 1.25 + drift * 0.0045 * c.s) % 1;
        x = ST.start - 0.5 + u * (ST.end - ST.start + 1);
      }
      c.x = x;
      const fade = c.hero ? 1 : smooth(ST.start - 0.5, ST.start + 0.9, x) * (1 - smooth(ST.end - 0.4, ST.end + 0.6, x));
      c.mesh.position.x = x;
      c.mesh.scale.setScalar(Math.max(0.001, fade));
      c.puck.position.x = x - 2.3;
      c.puck.scale.setScalar(Math.max(0.001, fade));
      c.puck.position.y = 0.19 + (reduce ? 0 : Math.sin(t * 2.2 + c.lane) * 0.015);
      // A card passing under a station lifts a hair, like it is being read.
      let lift = 0;
      for (const sx of [ST.arch, ST.del, ST.rev]) lift = Math.max(lift, 1 - smooth(0, 1.1, Math.abs(x - sx)));
      c.mesh.position.y = 0.09 + lift * 0.12;
    }

    // Bounce back: the hero card is pulled back by its puck, flagged with the finding.
    const flagOn = smooth(0.605, 0.625, p) * (1 - smooth(0.735, 0.755, p));
    flagChanges.visible = flagOn > 0.01;
    flagChanges.material.opacity = flagOn;
    flagChanges.position.set(hx, 1.9 + flagOn * 0.25, heroZ);
    const readyOn = smooth(0.79, 0.8, p) * (1 - smooth(0.9, 0.915, p));
    flagReady.visible = readyOn > 0.01;
    flagReady.material.opacity = readyOn;
    flagReady.position.set(hx, 1.9 + readyOn * 0.25, heroZ);
    const sc = narrow ? 1.25 : 0.95;
    flagChanges.scale.set(flagChanges.userData.aspect * sc, sc, 1);
    flagReady.scale.set(flagReady.userData.aspect * sc, sc, 1);
    if (p > 0.63 && p < 0.75) hero.puck.position.x = hx + 2.3; // puck goes in front and pulls it back

    // The press: a person brings the seal down.
    // Press: descends slowly, lands and stamps, holds, lifts; MERGED then holds to the end.
    const down = smooth(0.915, 0.945, p) * (1 - smooth(0.955, 0.975, p));
    const idle = reduce ? 0 : Math.sin(t * 1.4) * 0.05;
    seal.position.y = lerp(2.55 + idle, 0.3, down);
    const armY = 4.0;
    rod.scale.y = Math.max(0.01, armY - (seal.position.y + 0.5));
    rod.position.set(0, (armY + seal.position.y + 0.5) / 2, heroZ);
    const stamped = p > 0.944;
    if (stamped !== hero.stamped) {
      hero.stamped = stamped;
      hero.topMat.map = stamped ? hero.stampedTex : hero.plainTex;
      hero.topMat.needsUpdate = true;
    }
    sealRing.material.opacity = 0.25 + 0.5 * smooth(0.88, 0.91, p);

    // Station LEDs light while the hero card is under them.
    const near = sx => 1 - smooth(0.4, 1.4, Math.abs(hx - sx));
    leds.arch.material.color.setHex(near(ST.arch) > 0.5 ? 0x2F6BE0 : 0xC9D0CC);
    leds.del.material.color.setHex(near(ST.del) > 0.5 ? 0x2F6BE0 : 0xC9D0CC);
    leds.rev.material.color.setHex(heroPhase === 'bounce' ? 0xD4533F : near(ST.rev) > 0.5 ? 0x2F6BE0 : 0xC9D0CC);

    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;
    if (reduce) { pointer.x = 0; pointer.y = 0; }
    placeCamera(p, hx);
    updateDom(p);
  }

  /* ---------- loop ---------- */
  let visible = true;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { rootMargin: '100px' }).observe(stage);
  const clock = new THREE.Clock();
  function frame() {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    update(clock.getElapsedTime());
    renderer.render(scene, camera);
  }
  update(0);
  renderer.render(scene, camera);
  canvas.dataset.ready = '1';
  requestAnimationFrame(frame);

  renderer.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); fallback(); });
}

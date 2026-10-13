import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { ROOM, WINDOW, CEILING_LIGHT, PHOTOS } from './layout.js';
import { buildRoom } from './room.js';
import { buildBedArea } from './bed.js';
import { buildSeating } from './seating.js';

const EXPOSURE = 0.95;
const CEILING_CD = 4; // warm dome fixture (candela)
const SUN = 15; // peak morning sun through the window
const ENV = 0.3; // bounce light and reflections from the captured room
const FOV = 65;
const EYE = 1.65, SPEED = 1.6, RADIUS = 0.25;
const LOOP_S = 60; // one cinematic loop
// hour, sky background, window-view tint, window light colour, window light nits, fill colour, fill intensity
const KEYS = [
  [6, 0x1c2540, 0x2a3558, 0x6f7fa8, 0.5, 0x6a7290, 0.4],
  [7.5, 0xe8b48a, 0xffcfa8, 0xffd2aa, 6, 0xd8c4b0, 1.35],
  [10, 0xc6d8ec, 0xfff6ea, 0xfff2e2, 9, 0xd4def2, 1.8],
  [13, 0xc9d5e2, 0xffffff, 0xdde6ff, 9, 0xd4def2, 2.0],
  [16.5, 0xcfcdc8, 0xf4ecdf, 0xf2ead8, 7, 0xe2ddd4, 1.55],
  [18.5, 0xe0874a, 0xff9c5c, 0xffa868, 3, 0xd8a888, 1.0],
  [20, 0x262a4c, 0x2c3460, 0x4a5888, 0.6, 0x5c5a74, 0.4],
  [23, 0x070c1a, 0x0b1226, 0x1c2848, 0.1, 0x4a4050, 0.25],
];
// Cinematic keyframes [camera, look target]: by the console and chair, past the window, round the foot of the bed.
const CINE = [
  [[1.3, 1.55, 5.7], [2.9, 1.1, 2.0]],
  [[1.1, 1.45, 4.0], [2.2, 1.3, 0.0]],
  [[1.35, 1.35, 2.2], [0.9, 0.9, 0.3]],
  [[1.9, 1.4, 1.1], [2.6, 1.3, -0.5]],
  [[2.75, 1.5, 1.05], [4.6, 1.0, 1.3]],
  [[2.25, 1.55, 2.4], [4.6, 0.9, 2.85]],
  [[2.5, 1.6, 4.45], [4.4, 1.2, 2.6]],
  [[3.7, 1.65, 5.3], [3.3, 1.1, 0.5]],
  [[2.4, 1.6, 6.0], [0.8, 1.0, 2.0]],
];
const HELP = {
  walk: 'Click to look around · WASD to move · click a lamp to switch it · Esc frees the mouse · C cinematic',
  dollhouse: 'Drag to orbit · scroll to zoom · click a lamp to switch it · C cinematic',
  compare: 'Photo left, 3D right · ← → change photo · C cinematic',
};

THREE.DefaultLoadingManager.itemStart('main'); // so onLoad still fires if no texture is pending
let texturesLoaded = false;
THREE.DefaultLoadingManager.onLoad = () => { texturesLoaded = true; captureEnv(); };

const canvas = document.getElementById('c');
const ui = { photo: document.getElementById('photo'), slider: document.getElementById('time'), label: document.getElementById('timeLabel'), help: document.getElementById('help'), buttons: document.querySelectorAll('button[data-mode]') };

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = EXPOSURE;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false; // geometry is static: shadows only change with the time of day
RectAreaLightUniformsLib.init();

const scene = new THREE.Scene();
scene.background = new THREE.Color();
const camera = new THREE.PerspectiveCamera(FOV, innerWidth / innerHeight, 0.05, 100);
camera.rotation.order = 'YXZ';

const room = buildRoom(), bedArea = buildBedArea(), seating = buildSeating();
scene.add(room.group, bedArea.group, seating.group);
const lamps = [...bedArea.lamps, ...seating.lamps];

// Dollhouse hides the ceiling; this invisible lid keeps the sun from pouring in over the walls.
const lid = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.W, ROOM.D), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, side: THREE.DoubleSide }));
lid.rotation.x = -Math.PI / 2;
lid.position.set(ROOM.W / 2, ROOM.H + 0.01, ROOM.D / 2);
scene.add(lid);
scene.traverse((o) => { if (o.isMesh && !o.userData.noShadow) o.castShadow = o.receiveShadow = true; });

// Lights
const hemi = new THREE.HemisphereLight(0xffffff, 0x2a2020, 1);
hemi.position.set(0, 0.6, 1.5); // leans toward the window wall, like bounce from the bright room behind the photographer
const { x0, x1, y0, y1 } = WINDOW;
const daylight = new THREE.RectAreaLight(0xffffff, 1, x1 - x0, y1 - y0 - 0.11); // stops under the 11 cm roller-shade box
daylight.position.set((x0 + x1) / 2, (y0 + y1) / 2 - 0.055, 0.01);
daylight.lookAt(daylight.position.x, daylight.position.y, 1);
// Daylight from behind the photographer: washes the left wall and near floor cool, as in the photo.
const frontFill = new THREE.RectAreaLight(0xffffff, 1, 2.2, 1.3);
frontFill.position.set(2.3, 1.15, ROOM.D - 0.01);
frontFill.lookAt(0, 0.9, 3.0);
const ceilingLight = new THREE.PointLight(0xffd7a8, CEILING_CD, 0, 2);
ceilingLight.position.set(CEILING_LIGHT.x, ROOM.H - 0.12, CEILING_LIGHT.z);
ceilingLight.castShadow = true;
ceilingLight.shadow.mapSize.set(1024, 1024);
ceilingLight.shadow.bias = -0.002;
const sun = new THREE.DirectionalLight(0xffffff, 0);
sun.target.position.set(ROOM.W / 2, 0, ROOM.D / 2);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -4.5, right: 4.5, top: 4.5, bottom: -4.5, near: 1, far: 20 }); // the room's bounding sphere has r 4.3
sun.shadow.camera.updateProjectionMatrix();
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.02;
scene.add(hemi, daylight, frontFill, ceilingLight, sun, sun.target);

// The room seen from its centre lights itself: one bounce of fill plus reflections in the floor, chrome and glass.
const envCam = new THREE.CubeCamera(0.05, 20, new THREE.WebGLCubeRenderTarget(128, { type: THREE.HalfFloatType }));
envCam.position.set(ROOM.W / 2, 1.3, ROOM.D / 2);
scene.environment = envCam.renderTarget.texture;
function captureEnv() {
  const ceilingShown = room.ceiling.visible;
  room.ceiling.visible = true;
  scene.environmentIntensity = 0; // no feedback from the previous capture
  envCam.update(renderer, scene);
  scene.environmentIntensity = ENV;
  room.ceiling.visible = ceilingShown;
}

scene.updateMatrixWorld(true);
const colliders = [...room.colliders, ...bedArea.colliders, ...seating.colliders].map((o) => new THREE.Box3().setFromObject(o));
const blockers = colliders.map((b) => b.clone().expandByVector(new THREE.Vector3(RADIUS, 0, RADIUS)));

// Controls
const look = new PointerLockControls(camera, canvas);
const orbit = new OrbitControls(camera, canvas);
orbit.enabled = false;
orbit.enableDamping = true;
orbit.target.set(ROOM.W / 2, 0.6, ROOM.D / 2);
orbit.minDistance = 6;
orbit.maxDistance = 16;
orbit.maxPolarAngle = Math.acos((ROOM.H + 0.3 - orbit.target.y) / orbit.minDistance); // stays above the walls even fully zoomed in
orbit.autoRotateSpeed = 0.6;
orbit.addEventListener('start', () => { orbit.autoRotate = false; });

const cinePath = new THREE.CatmullRomCurve3(CINE.map(([p]) => new THREE.Vector3(...p)), true, 'centripetal');
const cineLook = new THREE.CatmullRomCurve3(CINE.map(([, l]) => new THREE.Vector3(...l)), true, 'centripetal');
const cineFrom = { p: new THREE.Vector3(), q: new THREE.Quaternion() };
const walkPos = new THREE.Vector3(PHOTOS[0].position[0], EYE, PHOTOS[0].position[2]);
const walkRot = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, PHOTOS[0].yaw, 0, 'YXZ'));
let mode = '', prevMode = 'walk', photoIndex = 0, time = 13, cineT = 0;

function setMode(m) {
  if (m === mode) return;
  if (mode === 'walk') { walkPos.copy(camera.position); walkRot.copy(camera.quaternion); }
  if (mode === 'compare') camera.clearViewOffset();
  if (m === 'cinematic') { prevMode = mode; cineT = 0; cineFrom.p.copy(camera.position); cineFrom.q.copy(camera.quaternion); }
  if (look.isLocked) look.unlock();
  mode = m;
  document.body.dataset.mode = m;
  room.ceiling.visible = m !== 'dollhouse';
  orbit.enabled = m === 'dollhouse';
  ui.buttons.forEach((b) => b.setAttribute('aria-pressed', b.dataset.mode === m));
  ui.help.textContent = HELP[m] ?? '';
  if (m === 'walk') { camera.position.copy(walkPos); camera.quaternion.copy(walkRot); walkedAt = performance.now(); }
  if (m === 'dollhouse') {
    camera.position.setFromSphericalCoords(7.5, THREE.MathUtils.degToRad(40), Math.atan2(-ROOM.W, ROOM.D)).add(orbit.target); // above the front-left corner
    orbit.autoRotate = true;
    orbit.update();
  }
  resize();
}

function applyPhoto() {
  const P = PHOTOS[photoIndex];
  const fullW = 2 * Math.max(P.cx, P.width - P.cx), fullH = 2 * Math.max(P.cy, P.height - P.cy);
  camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(fullH / 2 / P.fx));
  camera.setViewOffset(fullW, fullH, fullW / 2 - P.cx, fullH / 2 - P.cy, P.width, P.height);
  camera.position.fromArray(P.position);
  camera.rotation.set(0, P.yaw, P.roll);
}

function setPhoto(i) {
  photoIndex = ((i % PHOTOS.length) + PHOTOS.length) % PHOTOS.length;
  ui.photo.src = PHOTOS[photoIndex].src;
  if (mode === 'compare') applyPhoto();
}

// The photo's object-fit: contain box inside the left half, mirrored into the right half.
function compareRect() {
  const P = PHOTOS[photoIndex], half = innerWidth / 2, s = Math.min(half / P.width, innerHeight / P.height);
  const w = P.width * s, h = P.height * s;
  return [half + (half - w) / 2, (innerHeight - h) / 2, w, h];
}

function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  if (mode === 'compare') return applyPhoto();
  camera.fov = FOV;
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}

function clockText(h) {
  const m = Math.round(h * 60), hh = Math.floor(m / 60);
  return `${((hh + 11) % 12) + 1}:${String(m % 60).padStart(2, '0')} ${hh < 12 ? 'AM' : 'PM'}`;
}
const tmp = new THREE.Color();

function setTime(h) {
  time = h = THREE.MathUtils.clamp(+h, 6, 23);
  ui.slider.value = h;
  ui.label.textContent = clockText(h);
  let i = 0;
  while (i < KEYS.length - 2 && h >= KEYS[i + 1][0]) i++;
  const a = KEYS[i], b = KEYS[i + 1], t = (h - a[0]) / (b[0] - a[0]);
  const col = (j, c) => c.setHex(a[j]).lerp(tmp.setHex(b[j]), t);
  col(1, scene.background);
  col(2, room.windowView.material.color);
  col(3, daylight.color);
  daylight.intensity = THREE.MathUtils.lerp(a[4], b[4], t);
  frontFill.color.copy(daylight.color);
  frontFill.intensity = 1.5 * daylight.intensity; // 1.5 brings the near floor to the photo's brightness
  col(5, hemi.color);
  hemi.intensity = THREE.MathUtils.lerp(a[6], b[6], t);
  // The window faces east (-z) and south is +x: the sun rises at 6:00 and only shines in before noon.
  const s = ((h - 6) / 12) * Math.PI;
  sun.position.set(0.75 * Math.sin(s), 0.65 * Math.sin(s), -Math.cos(s)).setLength(10).add(sun.target.position);
  sun.intensity = SUN * THREE.MathUtils.smoothstep(h, 6.3, 7.5) * (1 - THREE.MathUtils.smoothstep(h, 10.5, 12.2));
  sun.color.setHex(0xff9a50).lerp(tmp.setHex(0xfff1dc), THREE.MathUtils.smoothstep(h, 6.5, 9));
  sun.visible = sun.intensity > 0; // skip its shadow pass and shading when it cannot reach the window
  renderer.shadowMap.needsUpdate = true;
  captureEnv();
}

// Walk
const keys = new Set(), fwd = new THREE.Vector3(), side = new THREE.Vector3(), step = new THREE.Vector3();
const blocked = (x, z) => blockers.some((b) => x > b.min.x && x < b.max.x && z > b.min.z && z < b.max.z);
let walkedAt = 0;

// Also runs on every key change, so a key held between two slow frames still moves the player.
function walk() {
  const now = performance.now(), dt = Math.min((now - walkedAt) / 1000, 0.5);
  walkedAt = now;
  const f = keys.has('KeyW') - keys.has('KeyS'), r = keys.has('KeyD') - keys.has('KeyA');
  if (!f && !r) return;
  camera.getWorldDirection(fwd).setY(0).normalize();
  side.crossVectors(fwd, camera.up);
  const n = Math.ceil(dt / 0.02); // 3 cm sub-steps: a long frame cannot tunnel through furniture
  step.set(0, 0, 0).addScaledVector(fwd, f).addScaledVector(side, r).setLength((SPEED * dt) / n);
  const p = camera.position;
  for (let i = 0; i < n; i++) {
    const stuck = blocked(p.x, p.z); // never trap a player who starts inside a box
    const x = THREE.MathUtils.clamp(p.x + step.x, RADIUS, ROOM.W - RADIUS);
    if (stuck || !blocked(x, p.z)) p.x = x;
    const z = THREE.MathUtils.clamp(p.z + step.z, RADIUS, ROOM.D - RADIUS);
    if (stuck || !blocked(p.x, z)) p.z = z;
  }
}

function cinematic(dt) {
  cineT += dt;
  const t = cinePath.getUtoTmapping((cineT / LOOP_S) % 1);
  camera.position.copy(cinePath.getPoint(t));
  camera.lookAt(cineLook.getPoint(t));
  const k = THREE.MathUtils.smootherstep(cineT, 0, 3); // glide in from wherever the camera was
  camera.position.lerpVectors(cineFrom.p, camera.position, k);
  camera.quaternion.slerpQuaternions(cineFrom.q, camera.quaternion, k);
}

// Lamps
const raycaster = new THREE.Raycaster();
function toggleLamp(x, y) {
  camera.updateMatrixWorld(); // the pose may have changed since the last frame
  raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
  const hit = raycaster.intersectObjects(lamps.map((l) => l.root), true)[0];
  const lamp = hit && lamps.find((l) => l.root.getObjectById(hit.object.id));
  if (!lamp) return;
  lamp.setOn(!lamp.on);
  captureEnv();
}

let downAt = [0, 0];
canvas.addEventListener('pointerdown', (e) => { downAt = [e.clientX, e.clientY]; });
canvas.addEventListener('click', (e) => {
  if (mode === 'walk' && !look.isLocked) Promise.resolve(canvas.requestPointerLock()).catch(() => {});
  else if (mode === 'walk') toggleLamp(0, 0);
  else if (mode === 'dollhouse' && Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) < 5) toggleLamp((e.clientX / innerWidth) * 2 - 1, 1 - (e.clientY / innerHeight) * 2);
});
addEventListener('keydown', (e) => {
  if (mode === 'walk') walk();
  keys.add(e.code);
  if (e.repeat) return;
  const k = e.key.toLowerCase();
  if (k === 'c') setMode(mode === 'cinematic' ? prevMode : 'cinematic');
  else if (['1', '2', '3'].includes(k)) setMode(['walk', 'dollhouse', 'compare'][k - 1]);
  else if (mode === 'compare' && e.target !== ui.slider && (k === 'arrowleft' || k === 'arrowright')) setPhoto(photoIndex + (k === 'arrowright' ? 1 : -1));
});
addEventListener('keyup', (e) => {
  if (mode === 'walk') walk();
  keys.delete(e.code);
});
addEventListener('blur', () => keys.clear());
addEventListener('resize', resize);
ui.buttons.forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
ui.slider.addEventListener('input', () => setTime(ui.slider.value));

const app = (window.app = {
  ready: false,
  get mode() { return mode; },
  setMode, camera, scene, renderer, lamps, colliders, ceiling: room.ceiling,
  get time() { return time; },
  setTime,
  get photoIndex() { return photoIndex; },
  setPhoto, ROOM,
});

setPhoto(0);
setTime(ui.slider.value);
setMode('walk');
THREE.DefaultLoadingManager.itemEnd('main');

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.25);
  if (mode === 'walk') walk();
  if (mode === 'dollhouse') orbit.update(dt);
  if (mode === 'cinematic') cinematic(dt);
  renderer.setScissorTest(mode === 'compare');
  if (mode === 'compare') {
    renderer.setScissor(0, 0, innerWidth, innerHeight);
    renderer.setClearColor(0x111111);
    renderer.clear();
    const r = compareRect();
    renderer.setViewport(...r);
    renderer.setScissor(...r);
  } else renderer.setViewport(0, 0, innerWidth, innerHeight);
  renderer.render(scene, camera);
  if (texturesLoaded) app.ready = true;
});

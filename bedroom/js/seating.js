import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ARMCHAIR, FLOOR_LAMP, CONSOLE } from './layout.js';

const DOWN_CD = 2; // cone out of the shade's bottom opening onto the chair and floor (candela)
const SPOT_CD = 2.5; // wide cone from the shade top that paints the scallop on the back and left walls (candela)
const GLOW = 0.6; // shade emissiveIntensity when on

const CHAIR = { armT: 0.09, armTop: 0.70, cap: 0.035, post: 0.035, leg: 0.10, deck: 0.32, seat: 0.47, back: 0.70, backT: 0.05 }; // back no higher than the arms: in the photo nothing shows above the right arm
const LAMP = { hub: 1.16, shade0: 1.19, shade1: 1.47, rTop: 0.20, rBot: 0.21, spread: 0.28, legYaw: 0.26 }; // shade and leg directions fitted to the photo
const RIM = { w: 0.04, h: 0.035 }; // console tier rim: radial width, height
const TILE = 0.12; // metres per repeat of the wicker and seagrass photo crops

const std = (color, roughness, extra) => new THREE.MeshStandardMaterial({ color, roughness, ...extra });
const suede = new THREE.MeshPhysicalMaterial({ color: 0xf8cab2, roughness: 0.9, sheen: 0.5, sheenRoughness: 0.7, sheenColor: 0xffffff });
const wood = std(0x3b2a24, 0.4);
const steel = std(0xd9d9d6, 0.3, { metalness: 0.5 });
const glass = new THREE.MeshPhysicalMaterial({ color: 0xd2e4da, roughness: 0.04, transparent: true, opacity: 0.16, depthWrite: false });
const glassEdge = std(0x8fb8a6, 0.1, { transparent: true, opacity: 0.75 });

const loader = new THREE.TextureLoader();
function weave(url) {
  const t = loader.load(url);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return std(0xffffff, 0.95, { map: t, side: THREE.DoubleSide });
}
const wicker = weave('textures/wicker.jpg');
const seagrass = weave('textures/seagrass.jpg');

function add(parent, geo, mat, x, y, z) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}
const rbox = (w, h, d, r) => new RoundedBoxGeometry(w, h, d, 3, r);

function rod(parent, a, b, r, mat) {
  const m = add(parent, new THREE.CylinderGeometry(r, r, a.distanceTo(b), 12), mat, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return m;
}

function canvasTex(size, draw) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Stuffed pillow: a sphere squared off in its plane and flattened, so the corners pinch thin.
function pillowGeo(w, h, t) {
  const g = new THREE.SphereGeometry(1, 48, 32), p = g.attributes.position;
  const sq = (v) => Math.sign(v) * Math.abs(v) ** 0.35;
  for (let i = 0; i < p.count; i++) p.setXYZ(i, w / 2 * sq(p.getX(i)), h / 2 * sq(p.getY(i)), t / 2 * p.getZ(i));
  g.computeVertexNormals();
  return g;
}

function buildArmchair() {
  const g = new THREE.Group();
  const { armT, armTop, cap, post, leg, deck, seat, back, backT } = CHAIR;
  const { w: W, d: D } = ARMCHAIR, zf = D / 2, zb = -D / 2, iw = W - 2 * armT;

  // Box arms: cream panel set a little inside a dark wood cap and front post, so the wood frames each arm.
  for (const s of [-1, 1]) {
    const x = s * (W - armT) / 2;
    add(g, rbox(armT - 0.014, armTop - cap - leg + 0.01, D - post - 0.004, 0.012), suede, x, (leg + armTop - cap) / 2, zb + (D - post) / 2);
    add(g, rbox(armT, cap, D, 0.01), wood, x, armTop - cap / 2, 0);
    add(g, rbox(0.055, armTop - 0.004, post, 0.006), wood, x + s * (armT - 0.055) / 2, (armTop - 0.004) / 2, zf - post / 2); // narrow post on the arm's outer edge
    add(g, new THREE.BoxGeometry(0.04, leg, 0.04), wood, s * (W / 2 - 0.03), leg / 2, zb + 0.04);
  }
  add(g, new THREE.BoxGeometry(iw + 0.01, 0.04, 0.03), wood, 0, leg + 0.02, zf - 0.02); // front rail
  add(g, rbox(iw, deck - leg - 0.04, D - backT, 0.02), suede, 0, (leg + 0.04 + deck) / 2, zb + backT + (D - backT) / 2 - 0.01);
  const cushD = D - backT - 0.01;
  add(g, rbox(iw - 0.006, seat - deck, cushD, 0.055), suede, 0, (deck + seat) / 2, zf - 0.01 - cushD / 2);
  for (const y of [seat - 0.016, deck + 0.016]) { // welt piping along the cushion front edges
    add(g, new THREE.CylinderGeometry(0.006, 0.006, iw - 0.07, 8), suede, 0, y, zf - 0.026).rotation.z = Math.PI / 2;
  }

  add(g, rbox(iw, back - leg, backT, 0.03), suede, 0, (leg + back) / 2, zb + backT / 2);
  const bh = back - 0.04 - seat;
  add(g, rbox(iw - 0.01, bh, 0.07, 0.03), suede, 0, seat + bh / 2, zb + backT + 0.035).rotation.x = -0.08;

  // Soft contact shadow: the hemisphere and env fill would otherwise light the floor under the seat like open floor.
  const pool = canvasTex(64, (c, n) => {
    const r = c.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
    r.addColorStop(0.5, 'rgba(0,0,0,1)');
    r.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = r;
    c.fillRect(0, 0, n, n);
  });
  const shadow = add(g, new THREE.PlaneGeometry(W + 0.12, D + 0.12), new THREE.MeshBasicMaterial({ map: pool, transparent: true, opacity: 0.6, depthWrite: false }), 0, 0.002, 0);
  shadow.rotation.x = -Math.PI / 2;
  shadow.userData.noShadow = true;

  // Loose square pillow sunk into the back cushion, leaning over the back's top with a corner over the left arm (pose fitted to the photo, x kept from the left arm).
  add(g, pillowGeo(0.46, 0.46, 0.12), suede, 0.149 - iw / 2, 0.665, zb + 0.128).rotation.set(-0.595, -0.252, 0.05, 'YXZ');

  g.position.set(ARMCHAIR.x, 0, ARMCHAIR.z);
  g.rotation.y = ARMCHAIR.rotY;
  return g;
}

function buildFloorLamp() {
  const root = new THREE.Group();
  root.position.set(FLOOR_LAMP.x, 0, FLOOR_LAMP.z);
  const { hub, shade0, shade1, rTop, rBot, spread, legYaw } = LAMP;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  // Tripod: three slim legs splaying from a small yoke just under the shade.
  for (let i = 0; i < 3; i++) {
    const a = legYaw + i * 2 * Math.PI / 3, c = Math.cos(a), s = Math.sin(a);
    rod(root, V(0.045 * c, hub, 0.045 * s), V(spread * c, 0, spread * s), 0.0065, steel);
    add(root, new THREE.SphereGeometry(0.009, 10, 8), steel, spread * c, 0.004, spread * s);
  }
  add(root, new THREE.CylinderGeometry(0.055, 0.055, 0.012, 24), steel, 0, hub, 0);
  const bulbY = shade0 + 0.08;
  rod(root, V(0, hub, 0), V(0, bulbY - 0.03, 0), 0.007, steel);

  const glow = std(0xa8703a, 0.9, { emissive: 0xe06a20, emissiveIntensity: GLOW, side: THREE.DoubleSide });
  const shade = add(root, new THREE.CylinderGeometry(rTop, rBot, shade1 - shade0, 64, 1, true), glow, 0, (shade0 + shade1) / 2, 0);
  const trimTop = add(root, new THREE.TorusGeometry(rTop, 0.004, 6, 64), glow, 0, shade1, 0);
  const trimBot = add(root, new THREE.TorusGeometry(rBot, 0.004, 6, 64), glow, 0, shade0, 0);
  trimTop.rotation.x = trimBot.rotation.x = Math.PI / 2;
  const bulb = add(root, new THREE.SphereGeometry(0.035, 16, 12), std(0xfff4e0, 0.5, { emissive: 0xffe2b8, emissiveIntensity: 2 }), 0, bulbY, 0);
  for (const m of [trimTop, trimBot, bulb]) m.userData.noShadow = true; // the shade casts: light leaves only through its openings

  // Spots, not a point light: a point's cone through the open top leaves a hard-edged ellipse on the ceiling that the photo does not have.
  const down = new THREE.SpotLight(0xffa850, DOWN_CD, 0, 1.2, 0.3, 2); // 1.2 rad: the bottom rim seen from the bulb
  const spot = new THREE.SpotLight(0xffa850, SPOT_CD, 0, 1.5, 0.25, 2);
  down.position.y = bulbY;
  down.target.position.y = 0;
  spot.position.set(-0.05, shade1 - 0.03, -0.07); // just under the shade top, nudged toward the corner so the scallop peaks right above the shade
  spot.target.position.set(-0.05, shade1 + 0.97, -0.07);
  for (const l of [down, spot]) {
    l.castShadow = true;
    l.shadow.mapSize.set(512, 512);
    l.shadow.bias = -0.002;
    l.shadow.camera.near = 0.1; // the shade is closer than the default 0.5 m near plane
  }
  root.add(down, down.target, spot, spot.target);

  return {
    root, on: true,
    setOn(on) {
      this.on = on;
      down.visible = spot.visible = on;
      glow.emissiveIntensity = on ? GLOW : 0;
      bulb.material.emissiveIntensity = on ? 2 : 0;
    },
  };
}

// Half ellipse with its flat side on the wall: shape x = out from the wall, shape y = along the wall.
function demilune(dx, dz) {
  const s = new THREE.Shape();
  s.moveTo(0, -dz);
  s.absellipse(0, 0, dx, dz, -Math.PI / 2, Math.PI / 2, false);
  return s;
}

// Extrude a shape upward, from y0 to y1, with shape x -> world x and shape y -> world z.
function slab(shape, y0, y1) {
  const g = new THREE.ExtrudeGeometry(shape, { depth: y1 - y0, bevelEnabled: false, curveSegments: 64 });
  return g.rotateX(-Math.PI / 2).translate(0, y0, 0);
}

function basket(r, h) {
  const g = new THREE.Group();
  const side = new THREE.CylinderGeometry(r, r * 0.92, h, 40, 1, true);
  side.attributes.uv.array.forEach((v, i, a) => { a[i] = v * (i % 2 ? h : 2 * Math.PI * r) / TILE; });
  add(g, side, seagrass, 0, h / 2, 0);
  add(g, new THREE.CircleGeometry(r * 0.92, 40), seagrass, 0, 0.004, 0).rotation.x = -Math.PI / 2;
  const rim = new THREE.TorusGeometry(r, 0.015, 8, 40);
  rim.attributes.uv.array.forEach((v, i, a) => { a[i] = v * (i % 2 ? 0.08 : 2 * Math.PI * r) / TILE; });
  add(g, rim, seagrass, 0, h, 0).rotation.x = Math.PI / 2;
  return g;
}

// Lidded wicker box, narrower at the base. UVs in metres from each face's plane.
function wickerBox(w, d, h) {
  const g = new THREE.Group();
  const body = new THREE.BoxGeometry(w, h, d, 1, 1, 1).translate(0, h / 2, 0);
  const lid = new THREE.BoxGeometry(w + 0.02, 0.03, d + 0.02).translate(0, h + 0.012, 0);
  for (const geo of [body, lid]) {
    const p = geo.attributes.position, n = geo.attributes.normal, uv = geo.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      if (geo === body && p.getY(i) < 0.01) p.setXYZ(i, p.getX(i) * 0.86, 0, p.getZ(i) * 0.9);
      const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i));
      uv.setXY(i, (ax > 0.5 ? p.getZ(i) : p.getX(i)) / TILE, (ay > 0.5 ? p.getZ(i) : p.getY(i)) / TILE);
    }
    geo.computeVertexNormals();
    add(g, geo, wicker, 0, 0, 0);
  }
  return g;
}

const leafTex = canvasTex(64, (g) => {
  const lobes = [[32, 3], [41, 17], [58, 15], [50, 31], [61, 45], [41, 43], [32, 61], [23, 43], [3, 45], [14, 31], [6, 15], [23, 17]];
  const leaf = (k) => {
    g.beginPath();
    for (const [x, y] of lobes) g.lineTo(32 + (x - 32) * k, 36 + (y - 36) * k);
    g.closePath();
  };
  leaf(1); g.fillStyle = '#cfdcb0'; g.fill(); // thin variegated margin, as on the photo's ivy
  leaf(0.92); g.fillStyle = '#2e5b26'; g.fill();
  g.strokeStyle = '#a9c495'; g.lineWidth = 1.5;
  for (const [x, y] of [[32, 6], [52, 18], [56, 44], [8, 44], [12, 18]]) { g.beginPath(); g.moveTo(32, 50); g.lineTo(32 + (x - 32) * 0.6, 50 + (y - 50) * 0.6); g.stroke(); }
});

let seed = 11;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647; // seeded: the ivy keeps the shape that was matched to the photo

// Potted trailing ivy: a dark glazed bowl and stems that climb a little, then spill over the shelf edge.
function ivy() {
  const g = new THREE.Group();
  const prof = [[0, 0], [0.05, 0], [0.072, 0.025], [0.083, 0.06], [0.085, 0.085], [0.078, 0.085], [0.074, 0.07]];
  add(g, new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 40), std(0x4a2c24, 0.22), 0, 0, 0);
  add(g, new THREE.CircleGeometry(0.075, 24), std(0x2a1d15, 1), 0, 0.07, 0).rotation.x = -Math.PI / 2;

  const stems = [], leaves = [], d = new THREE.Object3D();
  for (let k = 0; k < 18; k++) {
    const trail = k >= 15, a = trail ? (k - 16) * 0.7 + rnd() * 0.3 : rnd() * 2 * Math.PI; // trailers spill toward the open side (+x)
    const len = trail ? 0.08 + rnd() * 0.05 : 0.1 + rnd() * 0.12, rise = trail ? 0.06 : 0.06 + rnd() * 0.1;
    const dir = (r, y) => new THREE.Vector3(Math.cos(a) * r, 0.07 + y, Math.sin(a) * r);
    const end = trail ? -0.02 - rnd() * 0.03 : rise - 0.05;
    const curve = new THREE.CatmullRomCurve3([dir(0, 0), dir(len * 0.35, rise), dir(len * 0.75, (rise + end) / 2 + 0.03), dir(len, end)]);
    stems.push(new THREE.TubeGeometry(curve, 16, 0.0018, 4));
    for (let t = 0.12; t <= 1; t += 0.07 + rnd() * 0.05) {
      const p = curve.getPoint(t);
      d.position.copy(p);
      d.lookAt(p.x + Math.cos(a) * 0.6 + rnd() - 0.5, p.y + 1, p.z + Math.sin(a) * 0.6 + rnd() - 0.5);
      d.rotateZ(rnd() * 2 * Math.PI);
      d.scale.setScalar(0.05 + rnd() * 0.035);
      d.updateMatrix();
      leaves.push(d.matrix.clone());
    }
  }
  add(g, mergeGeometries(stems), std(0x4b5a2c, 0.8), 0, 0, 0).userData.noShadow = true;
  const leafMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), std(0xffffff, 0.6, { map: leafTex, alphaTest: 0.5, side: THREE.DoubleSide }), leaves.length);
  const c = new THREE.Color();
  leaves.forEach((m, i) => { leafMesh.setMatrixAt(i, m); leafMesh.setColorAt(i, c.setHSL(0.27 + rnd() * 0.05, 0.25, 0.75 + rnd() * 0.25)); });
  leafMesh.userData.noShadow = true; // alpha-tested quads would cast square shadows
  g.add(leafMesh);
  return g;
}

function buildConsole() {
  const g = new THREE.Group();
  const { zc, halfLen: L, depth: X, tiers } = CONSOLE;
  g.position.z = zc;

  const ring = demilune(X, L), a0 = Math.acos(RIM.w / (X - RIM.w));
  ring.holes.push(new THREE.Path().absellipse(0, 0, X - RIM.w, L - RIM.w, -a0, a0, false));
  const plate = demilune(X - RIM.w * 0.4, L - RIM.w * 0.4);
  for (const y of tiers) {
    add(g, slab(ring, y - RIM.h, y - 0.004), wood, 0, 0, 0);
    add(g, slab(plate, y - 0.012, y), [glass, glassEdge], 0, 0, 0).userData.noShadow = true;
  }

  // Square legs, floor to top tier: two on the curve (at +-0.6 rad, as the photo shows) and two at the wall ends.
  const top = tiers[0] - 0.004;
  for (const t of [0.6, -0.6, Math.PI / 2, -Math.PI / 2]) {
    const c = Math.cos(t), s = Math.sin(t);
    const leg = add(g, new THREE.BoxGeometry(0.04, top, 0.04), wood, Math.max(0.025, (X - 0.015) * c), top / 2, (L - 0.03) * s);
    leg.rotation.y = Math.atan2(-X * s, L * c); // square to the curve
  }

  // Contents, as in the photo: wicker box up top; seagrass baskets and the ivy on the middle tier.
  const box = wickerBox(0.19, 0.34, 0.115);
  box.position.set(0.215, tiers[0], -0.07);
  g.add(box);
  const gap = tiers[0] - RIM.h - tiers[1]; // baskets are sized to fit under the shelf above
  const big = basket(0.12, Math.min(0.29, gap - 0.06));
  big.position.set(0.135, tiers[1], 0.05);
  const small = basket(0.08, Math.min(0.2, gap - 0.08));
  small.position.set(0.23, tiers[1], 0.25);
  const plant = ivy();
  plant.position.set(0.36, tiers[1], 0.07);
  g.add(big, small, plant);
  return g;
}

export function buildSeating() {
  const group = new THREE.Group();
  const armchair = buildArmchair();
  const floorLamp = buildFloorLamp();
  const consoleTable = buildConsole();
  group.add(armchair, floorLamp.root, consoleTable);
  return { group, colliders: [armchair, floorLamp.root, consoleTable], lamps: [floorLamp] };
}

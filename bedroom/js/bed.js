import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ROOM, BED, NIGHTSTANDS, TABLE_LAMPS } from './layout.js';

const POINT_CD = 1.2; // warm fill from inside each shade (candela)
const SPOT_CD = 10; // upward cone that paints the scallop on the wall (candela)
const GLOW = 0.8; // shade emissiveIntensity when on

const HB = { T: 0.13, wing: 0.10, wingT: 0.07, W: 2.24 }; // wingback headboard
const SHADE = { rTop: 0.18, rBot: 0.21, h: 0.27, top: 0.78 }; // top: shade top above the nightstand
const SIDE_HEM = 0.19; // coverlet side hem height; the foot hem stops just above the rail

const std = (color, roughness, extra) => new THREE.MeshStandardMaterial({ color, roughness, ...extra });

function canvas(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  return c;
}

// All geometry here has UVs in metres, so one texture tile = size metres.
function tex(c, size, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / size, 1 / size);
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Planar UVs in metres picked by face normal, with wood grain running horizontally on every face.
function boxUV(geo) {
  const p = geo.attributes.position, n = geo.attributes.normal, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    if (ax >= ay && ax >= az) uv.setXY(i, p.getZ(i), p.getY(i));
    else if (ay >= az) uv.setXY(i, p.getZ(i), p.getX(i));
    else uv.setXY(i, p.getX(i), p.getY(i));
  }
  return geo;
}

const rbox = (w, h, d, r) => boxUV(new RoundedBoxGeometry(w, h, d, 3, r));

function add(parent, geo, mat, x, y, z) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

const linenCanvas = canvas(256, 256, (g, S) => {
  g.fillStyle = '#fff'; g.fillRect(0, 0, S, S);
  for (let i = 0; i < S; i++) {
    g.fillStyle = `rgba(90,85,80,${Math.random() * 0.1})`; g.fillRect(0, i, S, 1);
    g.fillStyle = `rgba(90,85,80,${Math.random() * 0.08})`; g.fillRect(i, 0, 1, S);
  }
  for (let k = 0; k < 160; k++) { // slubs: short thick weft threads
    const x = Math.random() * S, y = Math.floor(Math.random() * S), l = 8 + Math.random() * 40;
    g.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.35)' : 'rgba(80,75,70,0.12)';
    g.fillRect(x, y, l, 1.5); g.fillRect(x - S, y, l, 1.5);
  }
});

// Matelasse: rows of waves in alternating phase pinch into puffy vermicelli cells.
const quiltCanvas = canvas(512, 512, (g, S) => {
  g.fillStyle = '#eceef2'; g.fillRect(0, 0, S, S);
  const rows = 20, step = S / rows, ph = Array.from({ length: rows }, () => Math.random() * 6.28);
  for (let k = -1; k <= rows; k++) {
    const path = (dy) => {
      g.beginPath();
      for (let x = 0; x <= S; x += 4) g.lineTo(x, k * step + dy + 6 * Math.sin(x / S * 16 * Math.PI + k * Math.PI) + 3 * Math.sin(x / S * 38 * Math.PI + ph[(k + rows) % rows]));
      g.stroke();
    };
    g.lineWidth = 3; g.strokeStyle = 'rgba(112,118,134,0.45)'; path(0);
    g.lineWidth = 2.5; g.strokeStyle = 'rgba(255,255,255,0.95)'; path(-3);
  }
});

const latticeCanvas = canvas(256, 256, (g, S) => {
  g.fillStyle = '#4a2e26'; g.fillRect(0, 0, S, S);
  for (let i = 0; i < S; i += 2) { g.fillStyle = `rgba(0,0,0,${Math.random() * 0.15})`; g.fillRect(0, i, S, 1); }
  g.strokeStyle = '#efe9e0'; g.lineWidth = 7;
  for (let i = -4; i <= 4; i++) {
    const o = i * S / 3;
    g.beginPath(); g.moveTo(o, 0); g.lineTo(o + S, S); g.moveTo(o, S); g.lineTo(o + S, 0); g.stroke();
  }
});

const grainCanvas = canvas(512, 512, (g, S) => {
  g.fillStyle = '#fff'; g.fillRect(0, 0, S, S);
  for (let k = 0; k < 160; k++) {
    const y = Math.random() * S, a = Math.random() * 6, f = 1 + Math.floor(Math.random() * 3);
    g.strokeStyle = Math.random() < 0.7 ? `rgba(0,0,0,${0.08 + Math.random() * 0.22})` : `rgba(255,235,220,${0.1 + Math.random() * 0.2})`;
    g.lineWidth = 0.5 + Math.random() * 2.5;
    g.beginPath();
    for (let x = 0; x <= S; x += 8) g.lineTo(x, y + 3 * Math.sin(x / S * f * 2 * Math.PI + a));
    g.stroke();
  }
});

const linen = std(0xcfccc6, 0.95, { map: tex(linenCanvas, 0.3), bumpMap: tex(linenCanvas, 0.3, false), bumpScale: 0.4 });
const quilt = std(0xffffff, 0.92, { map: tex(quiltCanvas, 0.4), bumpMap: tex(quiltCanvas, 0.4, false), bumpScale: 1.5, side: THREE.DoubleSide });
const wood = std(0x3b2a24, 0.45, { map: tex(grainCanvas, 0.6) });
const legWood = std(0x2a1c17, 0.5);
const nickel = std(0xc8c8c4, 0.32, { metalness: 0.85 });
const chrome = std(0xf0f0f2, 0.2, { metalness: 0.7 });

// Stuffed pillow: two domed faces sewn at a rectangle whose edges pull in, leaving thin pointed corners. UVs in metres.
function pillowGeo(w, h, t) {
  const front = new THREE.PlaneGeometry(2, 2, 40, 30), n = front.attributes.position.count;
  const g = mergeGeometries([front, front.clone().rotateY(Math.PI)]), p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i), v = p.getY(i), X = w / 2 * u * (1 - 0.07 * (1 - v * v)), Y = h / 2 * v * (1 - 0.07 * (1 - u * u));
    p.setXYZ(i, X, Y, (i < n ? 1 : -1) * t / 2 * Math.sqrt(Math.max(0, Math.cos(u * Math.PI / 2) * Math.cos(v * Math.PI / 2))));
    uv.setXY(i, X, Y);
  }
  g.computeVertexNormals();
  return g;
}

// Lean a pillow back (front facing -x), then slide it so its back touches backX and it sinks into the coverlet.
function pillow(parent, geo, mat, backX, z, lean, yaw = 0, roll = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.rotation.set(-lean, yaw - Math.PI / 2, roll, 'YXZ');
  m.updateMatrixWorld();
  const b = new THREE.Box3().setFromObject(m, true);
  m.position.set(backX - b.max.x, BED.mattressTop - 0.02 - b.min.y, z);
  parent.add(m);
  return m;
}

// Coverlet: a sheet laid over the mattress, rolled over a rounded edge, hanging down the foot and sides.
// Corners take the straight-line distance, so they dip lower like a real draped corner.
function coverletGeo(top, footHem, headX) {
  const R = 0.06, ARC = R * Math.PI / 2, OUT = 0.015;
  const fx = BED.x0 - OUT + R, za = BED.z0 - OUT + R, zb = BED.z1 + OUT - R;
  const footL = ARC + top - R - footHem, sideL = ARC + top - R - SIDE_HEM;
  const lin = (a, b, n) => Array.from({ length: n + 1 }, (_, i) => a + (b - a) * i / n);
  const S = [...lin(fx - footL, fx, 30), ...lin(fx, headX, 24).slice(1)];
  const T = [...lin(za - sideL, za, 30), ...lin(za, zb, 30).slice(1, -1), ...lin(zb, zb + sideL, 30)];
  const pos = [], uv = [], idx = [];
  for (const t of T) for (const s of S) {
    const dx = Math.max(0, fx - s), dz = Math.max(0, za - t, t - zb), d = Math.hypot(dx, dz);
    const k = Math.max(0, d - ARC); // length hanging below the rounded edge
    const fold = 0.016 * Math.min(1, k / 0.15) * Math.sin((dx * t + dz * s) / (d || 1) * 15 + 1);
    const h = d < ARC ? R * Math.sin(d / R) : R + 0.35 * k * k + fold;
    const y = d < ARC ? top - R * (1 - Math.cos(d / R)) : top - R - k;
    pos.push(Math.max(s, fx) - (d ? dx / d : 0) * h, y, Math.min(Math.max(t, za), zb) + (t < za ? -1 : 1) * (d ? dz / d : 0) * h);
    uv.push(s, t);
  }
  const n = S.length;
  for (let j = 0; j < T.length - 1; j++) for (let i = 0; i < n - 1; i++) {
    const a = j * n + i;
    idx.push(a, a + n, a + 1, a + 1, a + n, a + n + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function buildBed() {
  const bed = new THREE.Group();
  const { x0, x1, z0, z1, legH, railTop, mattressTop, headboardH } = BED;
  const zc = (z0 + z1) / 2, back = ROOM.W - 0.02, face = back - HB.T;

  add(bed, rbox(x1 - x0, railTop - legH, z1 - z0, 0.035), linen, (x0 + x1) / 2, (legH + railTop) / 2, zc);
  for (const [lx, lz] of [[x0 + 0.08, z0 + 0.08], [x0 + 0.08, z1 - 0.08], [x1 - 0.12, z0 + 0.08], [x1 - 0.12, z1 - 0.08]]) {
    const leg = add(bed, new THREE.CylinderGeometry(0.034, 0.026, legH, 4), legWood, lx, legH / 2, lz);
    leg.rotation.y = Math.PI / 4;
  }
  add(bed, new THREE.BoxGeometry(face - x0 - 0.03, mattressTop - railTop, z1 - z0 - 0.06), std(0xf2f2f2, 0.9), (x0 + 0.03 + face) / 2, (railTop + mattressTop) / 2, zc);
  add(bed, coverletGeo(mattressTop + 0.012, railTop - 0.02, face - HB.wing - 0.01), quilt, 0, 0, 0);

  // Wingback headboard: main panel plus a wing at each end turned toward the room.
  const hbH = headboardH - legH;
  add(bed, rbox(HB.T, hbH, HB.W, 0.03), linen, back - HB.T / 2, legH + hbH / 2, zc);
  for (const s of [-1, 1]) {
    add(bed, rbox(HB.T + HB.wing, hbH, HB.wingT, 0.03), linen, back - (HB.T + HB.wing) / 2, legH + hbH / 2, zc + s * (HB.W - HB.wingT) / 2);
  }

  const white = std(0xf6f6f4, 0.9, { map: quilt.map, bumpMap: quilt.bumpMap, bumpScale: 0.8 });
  const brown = std(0x5a3a2e, 0.95, { map: linen.map, bumpMap: linen.bumpMap, bumpScale: 1 });
  const lattice = std(0xffffff, 0.9, { map: tex(latticeCanvas, 0.5), bumpMap: linen.bumpMap, bumpScale: 1 });
  const sham = pillowGeo(0.92, 0.52, 0.19), sleep = pillowGeo(0.86, 0.48, 0.17), sq = pillowGeo(0.45, 0.45, 0.13), lat = pillowGeo(0.48, 0.36, 0.12);
  for (const s of [-1, 1]) pillow(bed, sham, white, face, zc + s * 0.5, 1.0);
  const flange = pillowGeo(0.94, 0.56, 0.025); // sham border
  for (const s of [-1, 1]) pillow(bed, sleep, white, face - 0.2, zc + s * 0.5 + 0.12, 1.15, s * 0.05).add(new THREE.Mesh(flange, white));
  pillow(bed, sq, brown, face - 0.3, zc - 0.27, 1.05, 0.1, 0.04);
  pillow(bed, sq, brown, face - 0.3, zc + 0.43, 0.9, -0.2, -0.2);
  pillow(bed, lat, lattice, face - 0.45, zc - 0.1, 1.15, 0.25, 0.3);
  return bed;
}

function buildNightstand(n) {
  const g = new THREE.Group();
  const D = n.x1 - n.x0, W = n.w, H = n.h, FEET = 0.07, TOP = 0.03, OVER = 0.015;
  const fx = n.x0 + OVER; // body front face
  add(g, rbox(D, TOP, W, 0.006), wood, n.x0 + D / 2, H - TOP / 2, n.z);
  add(g, new THREE.BoxGeometry(n.x1 - fx, H - TOP - FEET, W - 2 * OVER), wood, (fx + n.x1) / 2, (FEET + H - TOP) / 2, n.z);

  // Two drawer fronts with a thin reveal, standing proud of the case, bar pulls facing the room.
  const lo = FEET + 0.05, hi = H - TOP - 0.015, gap = 0.006, dh = (hi - lo - gap) / 2, dw = W - 2 * OVER - 0.03;
  for (const y of [lo + dh / 2, hi - dh / 2]) {
    add(g, rbox(0.02, dh, dw, 0.004), wood, fx - 0.008 + 0.01, y, n.z);
    add(g, new RoundedBoxGeometry(0.008, 0.016, 0.22, 2, 0.003), nickel, fx - 0.035, y, n.z);
    for (const s of [-1, 1]) add(g, new THREE.CylinderGeometry(0.005, 0.005, 0.03, 12), nickel, fx - 0.02, y, n.z + s * 0.085).rotation.z = Math.PI / 2;
  }
  for (const [x, z] of [[fx + 0.025, -1], [fx + 0.025, 1], [n.x1 - 0.025, -1], [n.x1 - 0.025, 1]]) {
    add(g, new THREE.CylinderGeometry(0.032, 0.022, FEET, 4), wood, x, FEET / 2, n.z + z * (W / 2 - OVER - 0.025)).rotation.y = Math.PI / 4;
  }
  return g;
}

function buildLamp(p) {
  const root = new THREE.Group();
  root.position.set(p.x, p.y, p.z);
  add(root, new THREE.CylinderGeometry(0.056, 0.058, 0.02, 48), chrome, 0, 0.01, 0);

  // Gourd: wide low bulb, long tapering neck. Ombre glaze: pale aqua neck, aqua shoulder, deeper teal at the foot.
  const prof = [[0, 0.02], [0.045, 0.02], [0.066, 0.04], [0.081, 0.075], [0.087, 0.12], [0.085, 0.16], [0.075, 0.2], [0.058, 0.245],
    [0.044, 0.29], [0.034, 0.34], [0.027, 0.39], [0.023, 0.43], [0.021, 0.46], [0.024, 0.475], [0.026, 0.485], [0, 0.485]];
  const body = new THREE.LatheGeometry(new THREE.SplineCurve(prof.map(([r, y]) => new THREE.Vector2(r, y))).getPoints(80), 64);
  const neck = new THREE.Color(0xa0d6cc), top = new THREE.Color(0x48b8b8), deep = new THREE.Color(0x2e9aa0), c = new THREE.Color(), col = [];
  for (let i = 0; i < body.attributes.position.count; i++) {
    const y = body.attributes.position.getY(i);
    c.lerpColors(deep, top, THREE.MathUtils.smoothstep(y, 0.1, 0.2)).lerp(neck, THREE.MathUtils.smoothstep(y, 0.22, 0.36));
    col.push(c.r, c.g, c.b);
  }
  body.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  add(root, body, new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.04 }), 0, 0, 0);

  const sb = SHADE.top - SHADE.h, bulbY = sb + 0.1;
  add(root, new THREE.CylinderGeometry(0.011, 0.012, sb + 0.04 - 0.485, 16), chrome, 0, (0.485 + sb + 0.04) / 2, 0);
  add(root, new THREE.CylinderGeometry(0.018, 0.018, 0.05, 16), chrome, 0, sb + 0.065, 0);

  const glow = std(0xf1ece2, 0.9, { emissive: 0xf3d2a8, emissiveIntensity: GLOW, side: THREE.DoubleSide });
  const shade = add(root, new THREE.CylinderGeometry(SHADE.rTop, SHADE.rBot, SHADE.h, 64, 1, true), glow, 0, sb + SHADE.h / 2, 0);
  const bulb = add(root, new THREE.SphereGeometry(0.03, 16, 12), glow, 0, bulbY, 0);
  shade.userData.noShadow = bulb.userData.noShadow = true;

  const point = new THREE.PointLight(0xffc58a, POINT_CD, 0, 2);
  const spot = new THREE.SpotLight(0xffc58a, SPOT_CD, 0, 0.95, 0.55, 2);
  point.position.y = spot.position.y = bulbY;
  spot.target.position.y = bulbY + 1;
  root.add(point, spot, spot.target);

  return {
    root, on: true,
    setOn(on) {
      this.on = on;
      point.visible = spot.visible = on;
      glow.emissiveIntensity = on ? GLOW : 0;
    },
  };
}

export function buildBedArea() {
  const group = new THREE.Group();
  const bed = buildBed();
  const stands = NIGHTSTANDS.map(buildNightstand);
  const lamps = TABLE_LAMPS.map(buildLamp);
  group.add(bed, ...stands, ...lamps.map((l) => l.root));
  return { group, colliders: [bed, ...stands], lamps };
}

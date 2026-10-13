import * as THREE from 'three';
import { ROOM, WINDOW, DOOR, SWITCH, OUTLET, CEILING_LIGHT, TV, CURTAINS, ART, RUG, PHOTOS } from './layout.js';

const { W, D, H } = ROOM;
const TILE = 2.6; // metres of floor per texture repeat (20 planks)
const REVEAL = 0.12; // window drywall return depth
const JAMB = 0.16; // wall thickness at the door
const CASING = 0.07;
const VIEW = [1.53, 3.445, 0.757, 1.956]; // x0, x1, y0, y1 on z=0 that tools/textures.py rectified into window.jpg

const std = (color, roughness, extra) => new THREE.MeshStandardMaterial({ color, roughness, ...extra });
const wallMat = std(0x64616a, 0.92);
const drywall = std(0xf2efea, 0.88);
const trim = std(0xf2efea, 0.45);
const black = std(0x121212, 0.5);
const nickel = std(0xc9c8c3, 0.3, { metalness: 0.7 });
const bronze = std(0x4a4448, 0.3, { metalness: 0.6 });
const loader = new THREE.TextureLoader();
const image = (url) => { const t = loader.load(url); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };

function put(parent, m, x, y, z) {
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}
const box = (parent, mat, w, h, d, x, y, z) => put(parent, new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat), x, y, z);

// Seeded so both copies of a plank that wraps across the tile edge draw identically.
let seed = 1;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

function plank(g, b, x, y, w, l, s) {
  seed = s;
  for (const c of [g, b]) { c.save(); c.beginPath(); c.rect(x, y, w, l); c.clip(); }
  const t = rnd(); // dark #553a2a .. light #836454: lighter planks are less saturated
  g.fillStyle = `hsl(${17 + rnd() * 8},${34 - 12 * t}%,${25 + 17 * t}%)`;
  g.fillRect(x, y, w, l);
  const patches = g.createLinearGradient(0, y, 0, y + l); // light and dark patches along the board
  for (let k = 0; k <= 6; k++) patches.addColorStop(k / 6, rnd() < 0.55 ? `rgba(25,12,6,${rnd() * 0.3})` : `rgba(205,145,90,${rnd() * 0.16})`);
  g.fillStyle = patches;
  g.fillRect(x, y, w, l);
  for (let k = 0; k < 50; k++) { // lengthwise grain and mineral streaks
    const gx = x + rnd() * w, ph = rnd() * 6, f = 0.003 + rnd() * 0.012, amp = 1 + rnd() * 5;
    g.strokeStyle = rnd() < 0.7 ? `rgba(30,15,7,${0.05 + rnd() * 0.2})` : `rgba(215,155,95,${0.04 + rnd() * 0.12})`;
    g.lineWidth = 0.5 + rnd() * (rnd() < 0.1 ? 10 : 2);
    g.beginPath();
    for (let v = 0; v <= l + 16; v += 16) g.lineTo(gx + (Math.sin(v * f + ph) + 0.3 * Math.sin(v * f * 3.7)) * amp, y + v);
    g.stroke();
  }
  for (let k = rnd() * 2.5; k < 3; k++) { // cathedral figure: nested arches along the board, which the scraping and sheen pick out
    const cx = x + w * (0.2 + rnd() * 0.6), cy = y + rnd() * l, sp = 6 + rnd() * 8, curv = (25 + rnd() * 140) / (w * w / 4), dir = rnd() < 0.5 ? 1 : -1;
    for (let j = 0; j < 10; j++) {
      const arch = (c) => { c.beginPath(); for (let u = -w; u <= w; u += 3) c.lineTo(cx + u, cy + dir * (j * sp + curv * u * u)); c.stroke(); };
      g.strokeStyle = j % 2 ? 'rgba(30,15,7,0.16)' : 'rgba(225,170,110,0.13)'; g.lineWidth = 1.3; arch(g);
      b.strokeStyle = j % 2 ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.25)'; b.lineWidth = 2; arch(b);
    }
  }
  for (let v = rnd() * 40; v < l; v += 15 + rnd() * 45) { // hand-scrape scallops, rarely the full width
    const a = x + rnd() * w * 0.4, e = x + w * (0.6 + rnd() * 0.4), amp = 2 + rnd() * 8, ph = rnd() * 6;
    const curve = (c, dy) => { c.beginPath(); for (let u = a; u <= e + 6; u += 6) c.lineTo(u, y + v + dy + amp * Math.sin((u - x) / w * 3 + ph)); c.stroke(); };
    b.strokeStyle = `rgba(0,0,0,${0.15 + rnd() * 0.2})`; b.lineWidth = 10 + rnd() * 20; curve(b, 0);
    g.strokeStyle = `rgba(225,170,110,${0.03 + rnd() * 0.07})`; g.lineWidth = 2 + rnd() * 3; curve(g, -8);
  }
  g.fillStyle = 'rgba(16,8,4,0.9)'; g.fillRect(x, y, 1.6, l); g.fillRect(x, y, w, 2.2); // seams
  g.fillStyle = 'rgba(232,180,128,0.14)'; g.fillRect(x + 1.6, y, 1.4, l); g.fillRect(x, y + 2.2, w, 1.4); // worn bevel
  b.fillStyle = '#1c1c1c'; b.fillRect(x, y, 2.5, l); b.fillRect(x, y, w, 3);
  b.fillStyle = 'rgba(0,0,0,0.3)'; b.fillRect(x + 2.5, y, 3, l); b.fillRect(x + w - 3, y, 3, l);
  g.restore(); b.restore();
}

function floorMaps() {
  const S = 2048, n = 20, pw = S / n, mpx = S / TILE;
  const [c, bc] = [0, 1].map(() => Object.assign(document.createElement('canvas'), { width: S, height: S }));
  const g = c.getContext('2d'), b = bc.getContext('2d');
  b.fillStyle = '#808080'; b.fillRect(0, 0, S, S);
  b.lineCap = 'round';
  seed = 7;
  for (let i = 0; i < n; i++) {
    const lens = [];
    for (let sum = 0; sum < S - 0.45 * mpx;) { const l = (0.45 + rnd() * 1.4) * mpx; lens.push(l); sum += l; }
    const total = lens.reduce((a, l) => a + l, 0);
    let y = rnd() * S;
    for (const l0 of lens) {
      const l = l0 * S / total, s = 1 + Math.floor(rnd() * 1e9);
      plank(g, b, i * pw, y, pw, l, s);
      plank(g, b, i * pw, y - S, pw, l, s);
      y += l;
    }
  }
  b.filter = 'blur(5px)'; // soften scrape edges so the bump reads as dished, not stepped
  b.drawImage(bc, 0, 0);
  return [c, bc].map((cv, i) => {
    const t = new THREE.CanvasTexture(cv);
    if (!i) t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 16;
    return t;
  });
}

function curtain(x0, x1) {
  const w = x1 - x0, top = CURTAINS.rodY + 0.005, len = top + 0.2; // heading stands over the rod; 20 cm extra puddles on the floor
  const geo = new THREE.PlaneGeometry(w, len, Math.ceil(w / 0.007), 80);
  const p = geo.attributes.position;
  const pleats = Math.round(w / 0.07), folds = Math.round(w / 0.07);
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i) / w + 0.5, drop = 0.5 - p.getY(i) / len; // u 0..1 across, drop 0 at top..1 at bottom
    const gather = Math.max(0, 1 - drop * 6); // pinch pleats deepest in the heading
    const fold = 0.03 * Math.abs(Math.sin(u * Math.PI * pleats)) * (0.3 + gather)
      + (0.008 + 0.018 * Math.min(1, drop * 2)) * Math.sin(u * Math.PI * 2 * folds + 0.8 + drop * 1.2)
      + 0.012 * Math.sin(u * Math.PI * 2 * (folds + 1.5) + 2 + drop * 3);
    let y = top - drop * len, z = CURTAINS.wallGap + 0.025 + fold; // clear of the rod, which the heading hides
    if (y < 0.006) { z += 0.006 - y; y = 0.006; }
    p.setXYZ(i, (x0 + x1) / 2 + (u - 0.5) * w * 0.92, y, z);
  }
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, std(0x7a7170, 0.95, { side: THREE.DoubleSide }));
}

export function buildRoom() {
  const group = new THREE.Group();

  // Walls: single-sided, normals into the room, so Dollhouse culls the near ones.
  const rect = (u0, v0, u1, v1) => [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
  const wall = (pts, rotY, x, z, hole) => {
    const s = new THREE.Shape(pts.map(([u, v]) => new THREE.Vector2(u, v)));
    if (hole) s.holes.push(new THREE.Path(hole.map(([u, v]) => new THREE.Vector2(u, v))));
    put(group, new THREE.Mesh(new THREE.ShapeGeometry(s), wallMat), x, 0, z).rotation.y = rotY;
  };
  wall(rect(0, 0, W, H), 0, 0, 0, rect(WINDOW.x0, WINDOW.y0, WINDOW.x1, WINDOW.y1));
  wall(rect(0, 0, D, H), -Math.PI / 2, W, 0);
  wall(rect(0, 0, W, H), Math.PI, W, D);
  wall([[0, 0], [D - DOOR.z1, 0], [D - DOOR.z1, DOOR.h], [D - DOOR.z0, DOOR.h], [D - DOOR.z0, 0], [D, 0], [D, H], [0, H]], Math.PI / 2, 0, D);

  // Floor
  const [floorTex, floorBump] = floorMaps();
  for (const t of [floorTex, floorBump]) t.repeat.set(W / TILE, D / TILE);
  const floorMat = std(0xffffff, 0.32, { map: floorTex, bumpMap: floorBump, bumpScale: 1.2 });
  put(group, new THREE.Mesh(new THREE.PlaneGeometry(W, D), floorMat), W / 2, 0, D / 2).rotation.x = -Math.PI / 2;

  // Ceiling and flush-mount fixture (main.js adds the light)
  const ceiling = new THREE.Group();
  group.add(ceiling);
  put(ceiling, new THREE.Mesh(new THREE.PlaneGeometry(W, D), std(0xd8cabf, 0.9)), W / 2, H, D / 2).rotation.x = Math.PI / 2;
  const fixture = put(ceiling, new THREE.Group(), CEILING_LIGHT.x, H, CEILING_LIGHT.z);
  const ring = [[0.19, 0], [0.192, -0.01], [0.186, -0.028], [0.174, -0.042], [0.163, -0.046]].map(([r, y]) => new THREE.Vector2(r, y));
  fixture.add(new THREE.Mesh(new THREE.LatheGeometry(ring, 64), std(0xe0d2bc, 0.3, { emissive: 0x5a4630, side: THREE.DoubleSide })));
  put(fixture, new THREE.Mesh(new THREE.SphereGeometry(0.165, 48, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
    std(0xf8f2e8, 0.35, { emissive: 0xffd9a8, emissiveIntensity: 1.3 })), 0, -0.042, 0).scale.y = 0.52;
  const brass = std(0xa88a5a, 0.35, { metalness: 0.3 });
  box(fixture, brass, 0.012, 0.016, 0.012, 0, -0.125, 0);
  put(fixture, new THREE.Mesh(new THREE.SphereGeometry(0.011, 16, 8), brass), 0, -0.135, 0);
  fixture.traverse((o) => { o.userData.noShadow = true; });

  // Baseboards, broken at the door casing
  const bb = 0.06, bt = 0.014;
  box(group, trim, W, bb, bt, W / 2, bb / 2, bt / 2);
  box(group, trim, W, bb, bt, W / 2, bb / 2, D - bt / 2);
  box(group, trim, bt, bb, D, W - bt / 2, bb / 2, D / 2);
  const za = DOOR.z0 - CASING, zb = DOOR.z1 + CASING;
  box(group, trim, bt, bb, za, bt / 2, bb / 2, za / 2);
  box(group, trim, bt, bb, D - zb, bt / 2, bb / 2, (zb + D) / 2);

  // Window: 3-panel vinyl slider set in a white drywall return, with stool, apron and roller-shade box
  const { x0, x1, y0, y1, mullions } = WINDOW, xc = (x0 + x1) / 2, yc = (y0 + y1) / 2, ww = x1 - x0, wh = y1 - y0;
  box(group, drywall, 0.01, wh, REVEAL, x0 - 0.005, yc, -REVEAL / 2 - 0.002);
  box(group, drywall, 0.01, wh, REVEAL, x1 + 0.005, yc, -REVEAL / 2 - 0.002);
  box(group, drywall, ww + 0.02, 0.01, REVEAL, xc, y1 + 0.005, -REVEAL / 2 - 0.002); // 2 mm behind the wall plane, so no z-fighting at the opening edge
  box(group, trim, ww + 0.1, 0.025, REVEAL + 0.03, xc, y0 - 0.0125, (0.03 - REVEAL) / 2);
  box(group, trim, ww + 0.06, 0.045, 0.012, xc, y0 - 0.0475, 0.006);
  box(group, std(0xa39ba5, 0.8), ww, 0.11, 0.09, xc, y1 - 0.055, -0.065);
  const fz = -REVEAL - 0.025, vinyl = std(0xa0aac4, 0.45); // frame centre, 5 cm deep behind the return; vinyl reads blue-grey against the bright glass
  box(group, vinyl, 0.045, wh, 0.05, x0 + 0.0225, yc, fz);
  box(group, vinyl, 0.045, wh, 0.05, x1 - 0.0225, yc, fz);
  box(group, vinyl, ww, 0.085, 0.05, xc, y0 + 0.0425, fz);
  box(group, vinyl, ww, 0.09, 0.05, xc, y1 - 0.045, fz);
  for (const m of mullions) { // meeting stiles: the vent sash's sits nearer the room than the fixed pane's
    const s = m < xc ? -1 : 1;
    box(group, vinyl, 0.035, wh, 0.05, m + s * 0.0175, yc, fz + 0.008);
    box(group, vinyl, 0.035, wh, 0.05, m - s * 0.0175, yc, fz);
  }
  const glass = put(group, new THREE.Mesh(new THREE.PlaneGeometry(ww, wh),
    std(0xd6e4dc, 0.05, { transparent: true, opacity: 0.04, depthWrite: false })), xc, yc, fz + 0.004);
  glass.userData.noShadow = true;
  // Map window.jpg as seen from the photo camera, so the trees line up with the photo from there.
  // The plane runs through the frame members, which hide its edges; close to the glass keeps parallax small.
  const viewTex = image('textures/window.jpg'), viewZ = fz - 0.008, [px, py, pz] = PHOTOS[0].position, k = (pz - viewZ) / pz;
  const [vx0, vx1, vy0, vy1] = VIEW.map((v, i) => (i < 2 ? px : py) + k * (v - (i < 2 ? px : py)));
  viewTex.wrapS = viewTex.wrapT = THREE.MirroredRepeatWrapping; // beyond the photo's crop, mirror rather than smear
  viewTex.repeat.set(ww / (vx1 - vx0), wh / (vy1 - vy0));
  viewTex.offset.set((x0 - vx0) / (vx1 - vx0), (y0 - vy0) / (vy1 - vy0));
  const windowView = put(group, new THREE.Mesh(new THREE.PlaneGeometry(ww, wh),
    new THREE.MeshBasicMaterial({ map: viewTex, toneMapped: false })), xc, yc, viewZ);
  windowView.userData.noShadow = true;

  // Curtains on a dark bronze rod with ball finials and brackets
  const { rodY, rodX0, rodX1, wallGap } = CURTAINS;
  put(group, new THREE.Mesh(new THREE.CylinderGeometry(0.0125, 0.0125, rodX1 - rodX0, 16), bronze), (rodX0 + rodX1) / 2, rodY, wallGap).rotation.z = Math.PI / 2;
  for (const [x, s] of [[rodX0, -1], [rodX1, 1]]) put(group, new THREE.Mesh(new THREE.SphereGeometry(0.03, 20, 12), bronze), x + s * 0.025, rodY, wallGap);
  for (const x of [rodX0 + 0.08, (rodX0 + rodX1) / 2, rodX1 - 0.08]) {
    box(group, bronze, 0.03, 0.07, 0.008, x, rodY - 0.01, 0.004);
    box(group, bronze, 0.014, 0.014, wallGap, x, rodY - 0.01, wallGap / 2);
  }
  for (const [a, b] of CURTAINS.panels) group.add(curtain(a, b));

  // Door: casing, jambs with stops and strike, slab swung open into a dim hallway
  const { z0, z1, h } = DOOR, zc = (z0 + z1) / 2, dw = z1 - z0;
  box(group, trim, 0.018, h + 0.005, CASING, 0.009, (h + 0.005) / 2, z0 - CASING / 2);
  box(group, trim, 0.018, h + 0.005, CASING, 0.009, (h + 0.005) / 2, z1 + CASING / 2);
  box(group, trim, 0.018, CASING, dw + 2 * CASING, 0.009, h + CASING / 2, zc);
  box(group, trim, 0.03, 0.022, dw + 2 * CASING + 0.03, 0.015, h + CASING + 0.011, zc);
  box(group, trim, JAMB, h, 0.02, -JAMB / 2, h / 2, z0 - 0.01);
  box(group, trim, JAMB, h, 0.02, -JAMB / 2, h / 2, z1 + 0.01);
  box(group, trim, JAMB, 0.02, dw + 0.04, -JAMB / 2, h + 0.01, zc);
  box(group, trim, 0.032, h, 0.012, -0.106, h / 2, z0 + 0.006);
  box(group, trim, 0.032, h, 0.012, -0.106, h / 2, z1 - 0.006);
  box(group, trim, 0.032, 0.012, dw, -0.106, h - 0.006, zc);
  box(group, nickel, 0.028, 0.07, 0.003, -0.14, 0.91, z0 + 0.0015);
  const hinge = put(group, new THREE.Group(), -JAMB, 0, z1);
  hinge.rotation.y = Math.PI / 2; // open 90 deg into the hallway, flat against its end wall
  const slabW = dw - 0.006;
  box(hinge, trim, 0.035, h - 0.012, slabW, 0.0175, h / 2, -0.003 - slabW / 2);
  for (const s of [-1, 1]) put(hinge, new THREE.Mesh(new THREE.SphereGeometry(0.028, 16, 10), nickel), 0.0175 + s * 0.065, 0.91, -slabW + 0.065);
  const hallMat = std(0xd8cdbd, 0.9, { side: THREE.BackSide });
  const hallFloor = floorTex.clone();
  hallFloor.repeat.set(1 / TILE, (dw + 1.04) / TILE);
  box(group, [new THREE.MeshBasicMaterial({ visible: false }), hallMat, hallMat, std(0xffffff, 0.5, { map: hallFloor, side: THREE.BackSide }), hallMat, hallMat],
    1, H, dw + 1.04, -JAMB - 0.5, H / 2, (z0 - 1 + z1 + 0.04) / 2);
  box(group, std(0x5b3420, 0.5), JAMB, 0.01, dw, -JAMB / 2, 0, zc); // wood threshold across the wall thickness

  // Switch plate (left wall) and duplex outlet (window wall)
  box(group, trim, 0.006, 0.115, 0.07, 0.003, SWITCH.y, SWITCH.z);
  box(group, trim, 0.012, 0.024, 0.009, 0.009, SWITCH.y, SWITCH.z);
  box(group, trim, 0.07, 0.115, 0.006, OUTLET.x, OUTLET.y, 0.003);
  for (const dy of [-0.02, 0.02]) {
    box(group, trim, 0.034, 0.036, 0.01, OUTLET.x, OUTLET.y + dy, 0.005);
    for (const dx of [-0.006, 0.006]) box(group, black, 0.002, 0.009, 0.002, OUTLET.x + dx, OUTLET.y + dy + 0.004, 0.0105);
  }

  // TV on the left wall: thin black panel, chrome bottom trim, glossy screen
  const tv = put(group, new THREE.Group(), 0, TV.y, TV.z);
  tv.rotation.set(0, -0.077, 0.068); // swivelled on its arm, far end and bottom off the wall
  box(tv, black, 0.03, 0.3, 0.4, 0.015, 0, 0);
  box(tv, std(0x0c0c0d, 0.35), 0.035, TV.h, TV.w, 0.0475, 0, 0);
  box(tv, std(0xd0d2d6, 0.15, { metalness: 0.9 }), 0.036, 0.012, TV.w + 0.002, 0.0475, -TV.h / 2 + 0.006, 0);
  // The photo's screen mirrors the dark wall at the top and the bright window below.
  const glare = Object.assign(document.createElement('canvas'), { width: 1, height: 64 }), gc = glare.getContext('2d'), ramp = gc.createLinearGradient(0, 0, 0, 64);
  ramp.addColorStop(0.2, '#656364');
  ramp.addColorStop(0.65, '#a2b9e8');
  gc.fillStyle = ramp;
  gc.fillRect(0, 0, 1, 64);
  const glareTex = new THREE.CanvasTexture(glare);
  glareTex.colorSpace = THREE.SRGBColorSpace;
  const tvScreen = put(tv, new THREE.Mesh(new THREE.PlaneGeometry(TV.w - 0.024, TV.h - 0.03), std(0xffffff, 0.25, { map: glareTex })), 0.066, 0.003, 0);
  tvScreen.rotation.y = Math.PI / 2;

  // Wall art: box frames with the print on the room-facing face
  for (const a of ART) {
    const face = std(0xffffff, 0.5, { map: image(a.tex) });
    const m = box(group, [black, black, black, black, face, black], a.w, a.h, 0.03, 0, a.y, 0);
    if (a.wall === 'back') m.position.set(a.c, a.y, 0.015);
    else { m.position.set(W - 0.015, a.y, a.c); m.rotation.y = -Math.PI / 2; }
  }

  // Rug
  const rugEdge = std(0xa87a4c, 1); // tan binding
  box(group, [rugEdge, rugEdge, std(0xe6e8f4, 1, { map: image('textures/rug.jpg') }), rugEdge, rugEdge, rugEdge],
    RUG.x1 - RUG.x0, 0.012, RUG.z1 - RUG.z0, (RUG.x0 + RUG.x1) / 2, 0.006, (RUG.z0 + RUG.z1) / 2);

  return { group, ceiling, windowView, tvScreen, colliders: [] };
}

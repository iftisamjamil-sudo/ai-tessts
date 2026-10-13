// Measured room layout (metres). See room-analysis.md for how each number was derived.
// Axes: x along the window wall (left wall x=0 -> bed wall x=ROOM.W), y up, z from window wall (0) toward the front wall (ROOM.D).
export const ROOM = { W: 5.05, D: 6.0, H: 2.44 };

export const WINDOW = { x0: 1.49, x1: 3.58, y0: 0.64, y1: 2.13, mullions: [1.91, 3.14] };
export const DOOR = { z0: 1.15, z1: 1.95, h: 2.00 }; // left wall, open
export const SWITCH = { z: 0.61, y: 1.15 }; // left wall
export const OUTLET = { x: 4.04, y: 0.37 }; // window wall
export const CEILING_LIGHT = { x: 2.52, z: 2.97 };
export const TV = { z: 3.39, y: 1.45, w: 1.0, h: 0.57 }; // left wall

export const BED = { x0: 2.74, x1: 5.00, z0: 1.73, z1: 3.83, legH: 0.11, railTop: 0.38, mattressTop: 0.49, headboardH: 1.18 };
export const NIGHTSTANDS = [{ z: 1.36 }, { z: 4.22 }].map(n => ({ ...n, x0: 4.58, x1: 5.03, w: 0.60, h: 0.62 }));
export const TABLE_LAMPS = [1.31, 4.23].map((z, i) => ({ x: 4.805, y: NIGHTSTANDS[i].h, z }));
export const FLOOR_LAMP = { x: 0.31, z: 0.28 };
export const ARMCHAIR = { x: 0.725, z: 0.716, rotY: 0.625, w: 0.74, d: 0.59 }; // rotY turns its front (+z) toward the room
export const CONSOLE = { zc: 3.25, halfLen: 0.70, depth: 0.505, tiers: [0.71, 0.24, 0.06] }; // demilune, flat side on left wall
export const RUG = { x0: 0.95, x1: 2.44, z0: 1.79, z1: 3.88 };
export const CURTAINS = { rodY: 2.285, rodX0: 1.09, rodX1: 3.85, wallGap: 0.10, panels: [[1.10, 1.48], [3.45, 3.84]] };
export const ART = [ // wall: 'back' (z=0, faces +z) or 'right' (x=W, faces -x); c = centre along the wall, y = centre height
  { tex: 'textures/art_left.jpg', wall: 'back', c: 0.785, y: 1.39, w: 0.49, h: 1.10 },
  { tex: 'textures/art_right.jpg', wall: 'back', c: 4.385, y: 1.44, w: 0.49, h: 1.10 },
  { tex: 'textures/art_bed1.jpg', wall: 'right', c: 2.345, y: 1.60, w: 0.50, h: 0.44 },
  { tex: 'textures/art_bed2.jpg', wall: 'right', c: 3.165, y: 1.735, w: 0.50, h: 0.44 },
];

// Calibrated cameras for Compare mode: fx/cx/cy in photo pixels, yaw/roll in radians (three.js rotation order YXZ).
export const PHOTOS = [
  { src: 'photos/photo1.jpg', width: 2000, height: 1333, fx: 1073, cx: 1000, cy: 588.4, position: [0.679, 1.157, 5.713], yaw: -0.5075, roll: -0.0031 },
];

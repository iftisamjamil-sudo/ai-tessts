// Measured room layout (metres). See room-analysis.md for how each number was derived.
// Axes: x along the window wall (left wall x=0 -> bed wall x=ROOM.W), y up, z from window wall (0) toward the front wall (ROOM.D).
export const ROOM = { W: 4.97, D: 6.6, H: 2.44 };

export const WINDOW = { x0: 1.55, x1: 3.61, y0: 0.63, y1: 2.11, mullions: [1.96, 3.14] };
export const DOOR = { z0: 1.21, z1: 2.21, h: 2.05 }; // left wall, open
export const SWITCH = { z: 0.63, y: 1.25 }; // left wall
export const OUTLET = { x: 4.03, y: 0.44 }; // window wall
export const CEILING_LIGHT = { x: 2.49, z: 3.26 };
export const TV = { z: 3.55, y: 1.47, w: 1.0, h: 0.57 }; // left wall

export const BED = { x0: 2.88, x1: 4.92, z0: 1.75, z1: 3.95, legH: 0.10, railTop: 0.38, mattressTop: 0.50, headboardH: 1.27 };
export const NIGHTSTANDS = [{ z: 1.43 }, { z: 4.36 }].map(n => ({ ...n, x0: 4.50, x1: 4.95, w: 0.60, h: 0.70 }));
export const TABLE_LAMPS = NIGHTSTANDS.map(n => ({ x: 4.72, y: n.h, z: n.z }));
export const FLOOR_LAMP = { x: 0.40, z: 0.42 };
export const ARMCHAIR = { x: 0.67, z: 0.79, rotY: 0.694, w: 0.81, d: 0.85 }; // rotY turns its front (+z) toward the room
export const CONSOLE = { zc: 3.65, halfLen: 0.75, depth: 0.48, tiers: [0.72, 0.42, 0.12] }; // demilune, flat side on left wall
export const RUG = { x0: 0.94, x1: 2.54, z0: 1.88, z1: 4.16 };
export const CURTAINS = { rodY: 2.31, rodX0: 1.10, rodX1: 4.00, wallGap: 0.10, panels: [[1.12, 1.56], [3.58, 4.00]] };
export const ART = [ // wall: 'back' (z=0, faces +z) or 'right' (x=W, faces -x); c = centre along the wall, y = centre height
  { tex: 'textures/art_left.jpg', wall: 'back', c: 0.82, y: 1.39, w: 0.51, h: 1.12 },
  { tex: 'textures/art_right.jpg', wall: 'back', c: 4.40, y: 1.47, w: 0.47, h: 1.07 },
  { tex: 'textures/art_bed1.jpg', wall: 'right', c: 2.43, y: 1.65, w: 0.52, h: 0.43 },
  { tex: 'textures/art_bed2.jpg', wall: 'right', c: 3.28, y: 1.79, w: 0.52, h: 0.43 },
];

// Calibrated cameras for Compare mode: fx/cx/cy in photo pixels, yaw/roll in radians (three.js rotation order YXZ).
export const PHOTOS = [
  { src: 'photos/photo1.jpg', width: 2000, height: 1333, fx: 1198, cx: 1000, cy: 588, position: [0.61, 1.19, 6.31], yaw: -0.478, roll: 0.013 },
];

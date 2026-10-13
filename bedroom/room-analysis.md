# Room analysis

Source: `photos/photo1.jpg` (2000 x 1333). Only one photo was supplied, so every
position below comes from single-view measurement of that photo, cross-checked
against standard real-world sizes (king bed, 8 ft ceiling, outlet and switch
heights). If more angles are added later, they go in `PHOTOS` in `js/layout.js`
and get the same treatment.

## Coordinate system

Metres. Origin at the floor of the back-left corner (the corner behind the
floor lamp).

- **x**: along the window wall, from the left wall (x = 0) to the bed wall (x = 5.05)
- **y**: up, from the floor (y = 0) to the ceiling (y = 2.44)
- **z**: from the window wall (z = 0) toward the photographer (front wall z = 6.0)

## Camera calibration

Photo camera (used by Compare mode, `PHOTOS[0]`): f = 1073 px (85.97 deg
horizontal field of view), principal point (1000, 588.4), position
(0.679, 1.157, 5.713), yaw -0.5075 rad (-29.1 deg, turned right of square-on to
the window wall), roll -0.0031 rad (-0.18 deg), no pitch. The camera is level
with a shifted lens (vertical edges are parallel in the photo), which
`applyPhoto` reproduces with `setViewOffset`.

How it was fitted:

1. **Edge samples.** Each room line was sampled with a sub-pixel gradient
   search (luminance blurred by 1.2 px, peak of |dL| refined with a parabola)
   every 6-30 px along its length: the left-wall/ceiling line (48 samples,
   y 4-290), the window-wall ceiling line (31, x 240-1140), the bed-wall
   ceiling line (28, x 1175-1995), the window-wall baseboard bottom (15,
   x 600-950), both back-corner verticals (x 223.6 at y 305-500, x 1156.5 at
   y 405-670), the far door-casing edge, the left window mullion, the window
   apron's bottom edge and the headboard's top edge. All of them are straight
   to 0.1-0.5 px, so the photo has no visible lens distortion.
2. **Model.** Each sampled edge is a known 3D line: wall/ceiling junctions at
   x = 0, z = 0 and x = W with y = 2.44, the baseboard at y = 0, the corners
   at (0, 0) and (W, 0), and the casing, mullion, apron and headboard edges as
   vertical or horizontal lines whose offset is a free nuisance parameter.
   Unknowns: f, cy, camera position, yaw, roll and W (cx fixed at 1000). Scale
   comes from the 2.44 m ceiling.
3. **Least squares.** Levenberg-Marquardt on the perpendicular pixel distance
   of every sample to its projected line, each line weighted equally.
   Result: 0.29 px RMS per line (0.13-0.45 px on each). The previous camera
   (f 1198, position (0.61, 1.19, 6.31), yaw -0.478, roll +0.013, W 4.97)
   scores 5.86 px on the same samples, with 15.1 px on the left ceiling line
   and 7.6 px on the bed-wall ceiling line. A critic's independent fit
   (f 1066, position (0.674, 1.161, 5.673), yaw -0.511, roll -0.004, W 5.04)
   scores 0.78 px, so the two fits agree. Dropping any one line and refitting
   moves f only within 1067-1080 px.
4. **Vanishing points.** The fitted camera puts the depth (z) vanishing point
   at (403, 590) and the x vanishing point at (2930, 582).
   (403-1000)(2930-1000) = -f^2 gives f = 1073 px.
5. **Independent checks.** None of these were used in the fit.
   - The two identical calla prints back-project to the same size,
     0.49 x 1.10 m. The old camera gave 0.51 x 1.12 and 0.47 x 1.07.
   - The two photos above the bed come out at 0.50 x 0.44 m each.
   - Every frame's top edge is level to within 1 cm.
   - The door's head-cap top back-projects level at 2.09 m along its whole length.
   - The strike plate lands mid-jamb at 0.94 m, a normal latch height.
   - The rug's four photo corners land on a right-angled 1.49 x 2.09 m
     rectangle (a 5 x 7 ft rug) to within 3 cm. They reproject within 1-4 px.
     The old camera missed its near corners by 24-36 px.
   - The ceiling light lands at x = 2.52, the centre of the room's width.
   - The bed's foot legs are 1.93 m apart, which makes a 2.10 m wide king frame.
   - Both nightstands come out at the same height, 0.62 m.

## How positions were worked out

1. **Back-projection.** With the camera fixed, any pixel on a known plane
   becomes a 3D point. Floor contacts use y = 0. Wall-hung things use the wall
   plane: the front face of the frames (z = 0.03, x = W - 0.03), the casing
   face (x = 0.018) and the switch/outlet plates (0.006). Table tops use their
   height.
2. **Transfer from the previous camera.** When the camera changed, every value
   was moved so it keeps its photo pixel. A point was projected with the old
   camera, then back-projected with the new one onto the same plane, or onto
   the vertical line above its own new floor point. Wherever an edge could be
   measured, the photo was used directly instead. That covered the door, switch,
   outlet, TV, the frames (photo corners from `tools/textures.py`), the rug
   (likewise), the bed's foot legs, the nightstand corners, the lamp necks, the
   curtain rod and panels, the window's left edge, apron and top, and the
   light's ring.
3. **Hidden extents.** The front wall is behind the photographer, so room
   depth is a choice. A ceiling light is normally centred, and this one is at
   z = 2.97, which suggests a depth of about 5.95 m. 6.0 m is used. It keeps
   the photo camera (z = 5.713) inside the room with walk-mode clearance.
4. **Check.** Compare mode was rendered with Playwright and blended 50/50 with
   the photo. The room lines, corners, window, mullions, rod, outlet, switch,
   TV, door, frames, rug, bed legs, nightstand corners, lamp necks and chair
   posts line up within about 0-4 px of the 1500 px wide compare image.

## Room

| | |
|---|---|
| Size | 5.05 m wide (x) x 6.0 m deep (z) x 2.44 m high. About 16.5 x 19.7 ft, a large primary bedroom |
| Window wall (z = 0) | One wide 3-panel vinyl slider (XOX). Opening x 1.49-3.58, y 0.64-2.13. Mullions at x 1.91 and 3.14. Roller-shade box across the top. Duplex outlet at (4.04, 0.37) |
| Bed wall (x = 5.05) | No openings. Headboard, nightstands and two framed photos |
| Left wall (x = 0) | Door near the back corner, opening z 1.15-1.86 (a 28 in door), 2.00 m high (casing outer edges z 1.08-1.93, cap top 2.09). White casing, door open (the strike plate on the far jamb is visible). Light switch at z 0.61, y 1.15. Wall-mounted TV on a tilting arm, centred z 3.39, y 1.45 |
| Front wall (z = 6.0) | Not visible. Left plain |
| Ceiling | Flat, white. Flush-mount dome light at (2.52, 2.44, 2.97). Its ring measures about 0.21 m in radius |
| Floor | Hand-scraped hardwood, planks about 0.13 m wide running along z |
| Trim | White baseboards about 0.09 m tall. White door casing and window trim |

## Furniture and objects

Positions are centres on the floor unless noted. Sizes are w (x) x d (z) x h.

| Object | Position | Size | Notes |
|---|---|---|---|
| King bed, upholstered platform | x 2.74-5.00, z 1.73-3.83 (centre z 2.78) | 2.26 x 2.10 footprint | Foot faces the left wall. Foot legs at (2.82, 1.81) and (2.82, 3.75). Leg tops 0.11, side rail 0.11-0.38, coverlet top about 0.51 (puffy: 0.51-0.54 along the far side). Coverlet hangs to about 0.25 at the sides |
| Wingback headboard | against bed wall, x 4.92-5.03, z 1.68-3.84 (photo) | 0.11 x 2.16 x 1.18 | Light grey linen. Top front edge at 1.17-1.18. Wings turn forward 0.12 from the wall |
| Pillows | at the head of the bed | | 2-4 white sleeping pillows and shams. 2 solid chocolate-brown throws. 1 dark brown throw with a white diamond lattice, in front, tilted |
| Nightstand (far) | x 4.58-5.03, z 1.06-1.66 | 0.45 x 0.60 x 0.62 | Espresso wood, 2 drawers, brushed-nickel bar pulls, drawers face -x |
| Nightstand (near) | x 4.58-5.03, z 3.90-4.50 | same | same |
| Table lamps x2 | on nightstands at (4.805, 0.62, 1.31) and (4.805, 0.62, 4.23) | 0.36 dia x 0.72 | Glossy aqua gourd base fading to deeper teal, chrome foot and neck, white drum shade (0.31 top / 0.36 bottom, 0.24 tall). Shade top at about 1.34 (0.72 above the stand) |
| Floor lamp | (0.31, 0, 0.28), back-left corner | shade about 0.38 dia, 1.47 tall | Chrome tripod. The legs are hidden behind the chair, so the position comes from the shade: its photo silhouette fits a shade at 1.22-1.47 with radii 0.19 (bottom) / 0.18 (top) |
| Armchair | centre (0.725, 0, 0.716), turned 36 deg toward the room | 0.74 w x 0.59 d x 0.70 | Box-arm club chair. Espresso wood frame on the arm tops and front posts. Cream microsuede seat and back cushions, plus a loose pillow. Seat 0.47, arms 0.70 |
| Demilune console | flat side on the left wall, centre z 3.25 | 0.505 deep x 1.40 long x 0.71 | Three glass tiers (0.71, 0.24, 0.06) on dark espresso legs and rims. Small lidded wicker box on top. Two round seagrass baskets and a potted ivy on the middle tier |
| TV | left wall, centre (0, 1.45, 3.39) | 1.0 x 0.57 | Black bezel, glossy screen. Swivelled and tilted on its arm (room.js rotation (0, -0.077, 0.068)). Its far edge and top/bottom edges fit within 2 px |
| Rug | x 0.95-2.44, z 1.79-3.88 | 1.49 x 2.09 (5 x 7 ft) | Cream ground, large leaves and flowers in chocolate, taupe and dusty blue |
| Curtains | rod y 2.285 from x 1.09 to 3.85, 0.10 off the wall (finials at 1.065 and 3.875) | 2 panels, x 1.10-1.44 and 3.46-3.80 | Taupe, pinch-pleated, floor length. Dark bronze rod with ball finials |
| Calla lily print (left) | window wall, centre (0.785, 1.39) | 0.49 x 1.10 | Black frame, white mat, black-and-white photo |
| Calla lily print (right) | window wall, centre (4.385, 1.44) | 0.49 x 1.10 | Same print and frame |
| Photo above bed (left) | bed wall, centre z 2.345, y 1.60 | 0.50 x 0.44 | Black frame, white mat, black-and-white storefront |
| Photo above bed (right) | bed wall, centre z 3.165, y 1.735 | 0.50 x 0.44 | Black frame, white mat, black-and-white vintage delivery truck |

## Materials and colours

Sampled from the photo. Read as surface colours under the photo's light.

| Surface | Colour | Finish |
|---|---|---|
| Walls | #56535c (shade) to #685956 (lamp-lit). Paint about #5a5760, a cool charcoal grey | Matte eggshell |
| Ceiling, trim, window frame | #f2efea | Matte, semi-gloss trim |
| Floor | #5b3420 to #8d6452, hand-scraped hickory or walnut | Satin, visible scrape marks |
| Headboard and bed frame | #cfccc6 | Woven linen |
| Coverlet | #e8eaf0 (reads cool in window light) | Quilted matelasse, wavy stitch pattern |
| Nightstands, chair frame, console | #3b2a24 espresso | Satin wood |
| Lamp bases | #48b8b8 to #2e9aa0 | Glossy glaze |
| Lamp shades | #f1ece2 (glowing #f6e2ca) | Linen, translucent |
| Floor lamp shade | #b88a55 (glowing #ebbe91) | Linen |
| Curtains | #9a8d86 taupe | Soft, matte |
| Chair upholstery | #e6dccb | Microsuede |
| Throw pillows | #5a3a2e chocolate. Lattice pillow #4a2e26 with white lines | Woven |
| Rug | cream #d9d2c4 with #6b4a3a, #8a7a70, #7f97a3 motifs | Wool pile |
| Glass | faint green-grey, transparent | Glossy |

## Lighting

- **Time of day:** daytime, probably early afternoon. The trees outside are
  bright and evenly lit, mostly bare deciduous trunks with moss in front of
  evergreens (Pacific Northwest, late winter). No direct sun patch falls on
  the floor, so the sun is not shining into this window. The window is
  the main daylight source: a large, soft, cool light from the back wall.
- **Artificial lights, all on:** ceiling dome (warm, even fill), both table
  lamps and the floor lamp. Each lamp throws a bright warm scallop up the wall
  above its shade and a pool down onto its table. These scallops are the most
  noticeable lighting feature in the photo.
- **Look:** HDR real-estate processing with lifted shadows and high overall
  exposure. Warm (2700 K) lamp light mixes with cool window light. Shadows are
  very soft, mostly contact shadows under the bed, chair, nightstands and console.
- **Time slider plan:** in the morning, sun comes through the window and leaves
  a warm patch on the floor (the window faces roughly east). Midday matches the
  photo: bright sky, no direct sun. In the evening the sky turns orange and the
  room darkens. At night the window goes dark blue and only the lamps light
  the room.

# Room analysis

Source: `photos/photo1.jpg` (2000 x 1333). Only one photo was supplied, so every
position below comes from single-view measurement of that photo, cross-checked
against standard real-world sizes (king bed, 8 ft ceiling, outlet and switch
heights). If more angles are added later, they go in `PHOTOS` in `js/layout.js`
and get the same treatment.

## Coordinate system

Metres. Origin at the floor of the back-left corner (the corner behind the
floor lamp).

- **x**: along the window wall, from the left wall (x = 0) to the bed wall (x = 4.97)
- **y**: up, from the floor (y = 0) to the ceiling (y = 2.44)
- **z**: from the window wall (z = 0) toward the photographer (front wall z = 6.6)

## How positions were worked out

1. **Vanishing points.** The ceiling lines of the left wall (225,297)->(65,0)
   and the bed wall (1152,393)->(2000,188) are parallel in 3D, and in the photo
   they meet at about (378, 580). That point is the vanishing point of the
   depth axis (z). The window wall's ceiling line (225,297)->(1150,393) and its
   baseboard (600,818)->(950,792) meet far to the right at about (3308, 618),
   the vanishing point of the x axis.
2. **Horizon, focal length, heading.** The line through both vanishing points
   is the horizon. At the image centre it sits at row 588, which is 78 px above
   the middle of the frame. Vertical edges stay vertical in the photo, so the
   camera was level with a shifted lens (or perspective-corrected in editing),
   not tilted. Two perpendicular vanishing points give the focal length:
   (378-1000)(3308-1000) = -f^2, so f = 1198 px. That is a 79.7 deg horizontal
   field of view. The camera is turned 27.4 deg to the right of square-on to
   the window wall.
3. **Scale.** On the window wall, the horizon cuts the wall at 0.488 of its
   height. The window top lands at 0.867 and the sill at 0.245. With an
   8 ft (2.44 m) ceiling, that puts the camera at 1.19 m, the window top at
   2.11 m (a standard 6'11" header) and the sill at 0.60 m. All three are
   ordinary US framing heights, so 2.44 m is taken as the ceiling height.
4. **Back-projection.** With the camera fixed, any pixel on a known plane
   becomes a 3D point. Floor contacts use y = 0, wall-hung things use the wall
   plane, and table tops use their height. Checks: both back corners land
   within 1 cm of x = 0 and x = 4.97 at z = 0. The ceiling line at the photo's
   right edge lands on the bed wall (x = 4.970). The ceiling light lands at
   x = 2.49, which is the middle of the room's width. The bed's foot legs come
   out 2.11 m apart (a king frame is 2.05-2.15 m wide).
5. **Hidden extents.** The front wall is behind the photographer, so room
   depth is a choice. The camera is 6.31 m from the window wall. A ceiling
   light is normally centred, and this one is at z = 3.26, which suggests a
   depth of about 6.5 m. 6.6 m is used.
6. **Refinement per object.** The first pass placed objects from a few clicked
   points. Then each object was measured again with zoomed grids and
   luminance profiles of its own edges, and its 3D box was projected back into
   the photo to check that it lined up. That pass moved the door, TV, rug,
   nightstands and the photos above the bed by a few centimetres. It also
   showed that the bed's rail is taller (0.38 m) than first estimated. The
   numbers below are the refined ones.

Photo camera (used by Compare mode): position (0.61, 1.19, 6.31), yaw -27.4 deg,
roll +0.75 deg, f = 1198 px, principal point (1000, 588).

## Room

| | |
|---|---|
| Size | 4.97 m wide (x) x 6.6 m deep (z) x 2.44 m high. About 16 x 21.5 ft, a large primary bedroom |
| Window wall (z = 0) | One wide 3-panel vinyl slider (XOX). Opening x 1.55-3.61, y 0.63-2.11. Mullions at x 1.96 and 3.14. White roller-shade box across the top. Duplex outlet at (4.03, 0.44) |
| Bed wall (x = 4.97) | No openings. Headboard, nightstands and two framed photos |
| Left wall (x = 0) | Door near the back corner, opening z 1.21-2.21, 2.05 m high (head casing spans z 1.14-2.28), white casing, door open (the strike plate on the far jamb is visible). Light switch at z 0.63, y 1.25. Wall-mounted TV on a tilting arm, centred z 3.55, y 1.47 |
| Front wall (z = 6.6) | Not visible. Left plain |
| Ceiling | Flat, white. Flush-mount dome light at (2.49, 2.44, 3.26) |
| Floor | Hand-scraped hardwood, planks about 0.13 m wide running along z |
| Trim | White baseboards about 0.09 m tall. White door casing and window trim |

## Furniture and objects

Positions are centres on the floor unless noted. Sizes are w (x) x d (z) x h.

| Object | Position | Size | Notes |
|---|---|---|---|
| King bed, upholstered platform | x 2.88-4.92, z 1.75-3.95 (centre z 2.85) | 2.04 x 2.20 footprint | Foot faces the left wall. Short dark legs 0.10, side rail 0.10-0.38, coverlet top about 0.52. Coverlet hangs to about 0.25 at the sides |
| Wingback headboard | against bed wall, x 4.82-4.95, z 1.70-4.00 | 0.13 x 2.30 x 1.27 | Light grey linen. Wings turn forward about 0.10 at each end |
| Pillows | at the head of the bed | | 2-4 white sleeping pillows and shams. 2 solid chocolate-brown throws. 1 dark brown throw with a white diamond lattice, in front, tilted |
| Nightstand (far) | x 4.50-4.95, z 1.13-1.73 | 0.45 x 0.60 x 0.70 | Espresso wood, 2 drawers, brushed-nickel bar pulls, drawers face -x |
| Nightstand (near) | x 4.50-4.95, z 4.06-4.66 | same | same |
| Table lamps x2 | on nightstands at (4.72, 0.70, 1.43) and (4.72, 0.70, 4.36) | 0.36 dia x 0.70 | Glossy aqua gourd base fading to deeper teal, chrome foot and neck, white drum shade (0.31 top / 0.36 bottom, 0.24 tall). Shade top at about 1.40 |
| Floor lamp | (0.40, 0, 0.42), back-left corner | 0.45 dia shade, 1.70 tall | Chrome tripod, legs splay about 0.28 m. Hub at 1.15. Tan drum shade 1.45-1.70 |
| Armchair | centre (0.67, 0, 0.79), turned 40 deg toward the room | 0.81 w x 0.85 d x 0.85 | Box-arm club chair. Espresso wood frame on the arm sides. Cream microsuede seat and back cushions. Seat 0.45, arms 0.66 |
| Demilune console | flat side on the left wall, centre z 3.65 | 0.48 deep x 1.50 long x 0.72 | Three glass tiers (0.72, 0.42, 0.12) on dark espresso legs and rims. Lidded wicker box on top. Round seagrass baskets on the lower tiers. Potted ivy on the middle tier |
| TV | left wall, centre (0, 1.47, 3.55) | 1.0 x 0.57 | Black bezel, slightly reflective screen. On a tilting arm in the photo (its edge is not vertical); modelled flush |
| Rug | x 0.94-2.54, z 1.88-4.16 | 1.60 x 2.28 (a standard 5'3" x 7'6") | Cream ground, large leaves and flowers in chocolate, taupe and dusty blue |
| Curtains | rod y 2.31 from x 1.10 to 4.00, 0.10 off the wall | 2 panels, x 1.12-1.56 and 3.58-4.00 | Taupe, pinch-pleated, floor length. Dark bronze rod with ball finials |
| Calla lily print (left) | window wall, centre (0.82, 1.39) | 0.51 x 1.12 | Black frame, white mat, black-and-white photo |
| Calla lily print (right) | window wall, centre (4.40, 1.47) | 0.47 x 1.07 | Same style |
| Photo above bed (left) | bed wall, centre z 2.43, y 1.65 | 0.52 x 0.43 | Black frame, white mat, black-and-white storefront |
| Photo above bed (right) | bed wall, centre z 3.28, y 1.79 | 0.52 x 0.43 | Black frame, white mat, black-and-white vintage delivery truck |

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

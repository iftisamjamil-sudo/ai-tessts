# Photo vs render

Each round, `tools/shoot.mjs` rendered Compare mode headlessly (Chromium, software WebGL) from the photo's calibrated camera. The photo and the render were then compared side by side, with a 50/50 blend and pixel colour samples. Only one photo was supplied, so every round compares against `photos/photo1.jpg`.

| Round 1, before | After round 1 | After round 2 |
|---|---|---|
| ![](shots/round1-before_photo0.jpg) | ![](shots/round2-before_photo0.jpg) | ![](shots/final_photo0.jpg) |

(In each image the photo is on the left and the render on the right.)

## Round 1

Five critics (structure, bed wall, left side, window wall, lighting) listed 67 mismatches. Biggest ones, and what changed:

| Mismatch | Fix |
|---|---|
| The camera calibration was off. Room lines missed by up to 15 px, and the lower corners by 24 to 36 px (rug edge, nightstand feet) | Refitted on ten room lines: fx 1198 → 1073, camera 0.6 m closer to the window. Line fit went from 5.86 px RMS to 0.29 px. Every position in `layout.js` was re-derived, and the room is now 5.05 × 6.0 m |
| Lamp light on the walls had the wrong shape: narrow cones with hot discs on the ceiling | A wide, soft fan that starts at the shade top. The floor lamp's shade now casts shadows, so light no longer leaks sideways |
| Contact shadows were missing everywhere | Bug: the ceiling light's shadow bias was about 1 m (it scales with the shadow camera's 500 m far plane). Far plane set to 9 m. Dark contact patches added under the bed, nightstands and chair |
| Pillows looked like flat paper slabs | Plump pillows. The lattice pillow got the photo's finer pattern |
| Walls were too violet, the left wall too dark, the ceiling too bright | Paint colours sampled from the photo. Added the cool fill light from behind the photographer that the photo shows on the left wall and near floor |
| Curtains: too light and pink, too few folds, right panel 20 px off and hiding the outlet | Taupe, six narrow folds per panel, re-measured panel positions |
| The TV was a black slab, flush to the wall | Pale reflective screen, swivelled and tilted on its arm as in the photo |
| Headboard wings too deep, nightstand wood too dark, baskets too dark and red | Slimmer wings, lighter wood, re-balanced weave textures |

## Round 2

Measured against the photo after round 1 (photo vs render colour, 1500 px compare image):

| Spot | Photo | Render, start of round 2 | Render, end of round 2 |
|---|---|---|---|
| Near side of the bed | (144,126,127) | (211,213,225) | (185,187,204) |
| Ceiling centre | (204,183,167) | (225,214,207) | (217,196,181) |
| Coverlet top | (202,203,221) | (218,213,217) | (210,202,206) |
| Wall below window | (84,80,97) | (86,80,96) | (83,77,92) |
| Foreground floor | (143,103,85) | (159,115,88) | (136,91,65) |

Fixes:

- **The bed read as a white box.** The cool front fill hit its near side head-on. The fill now sits left of centre, so it still lights the left wall and near floor, and the quilt is a shade darker.
- **Ceiling too bright and neutral.** Warmer, darker beige paint.
- **The hallway behind the door showed as a box outside the room in Dollhouse.** It now hides with the ceiling.

## What still differs

- The photo's HDR processing squeezes local contrast. That's why the bed's near side is still brighter than the photo, and the wall under the TV darker (about L107 vs L172). One global exposure can't match both.
- At the foot of the bed, the photo's grey rail shows clearly under the coverlet. In the render the rail is nearly the coverlet's white, so the bed still reads as one pale block.
- The floor is a little more orange, and its plank seams don't follow the photo's exactly.
- The ceiling light reads as a matte dome rather than glowing frosted glass.
- The calibration residual is under 4 px on room lines. The console and the chair's left post are still about 5 px off.
- The TV, door and window view are fitted to this one camera angle. With a second photo, the window view would show a little parallax.

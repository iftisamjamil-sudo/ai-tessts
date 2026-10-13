# Bedroom in 3D

A browser recreation of the bedroom in `photos/photo1.jpg`, built with three.js from a CDN. No build step.

```
npx serve .
```

Then open the printed URL.

## Controls

| Mode | How | What |
|---|---|---|
| Walk | `1` | Click to look around, WASD to move at eye height. You can't walk through furniture. Esc frees the mouse. |
| Dollhouse | `2` | The ceiling disappears and the camera orbits the room from above. Drag to orbit, scroll to zoom. |
| Compare | `3` | The photo on the left, the 3D view from the photo's calibrated camera on the right. ← → cycle photos. |
| Cinematic | `C` | Hides the UI and glides the camera through the room. Press `C` again to leave. |

Click a lamp to switch it on or off (in Walk mode, aim the centre dot at it). The time-of-day slider runs from 6 AM to 11 PM: morning sun comes through the window, early afternoon matches the photo, and at night only the lamps are lit.

## Files

- `room-analysis.md`: how the room was measured from the photo (camera calibration, sizes, materials, lighting).
- `js/layout.js`: every measured position and the photo camera. The scene modules read from it.
- `js/room.js`, `js/bed.js`, `js/seating.js`: the procedural room and furniture.
- `js/main.js`: renderer, lighting, time of day, modes, collision.
- `tools/textures.py`: flattens the rug, window view and wall art out of the photo into `textures/`.
- `tools/shoot.mjs`: the headless check. Run `node tools/shoot.mjs [outDir]`. It saves compare screenshots and fails on any console error or broken feature.
- `comparison.md`: the photo-vs-render rounds, with what was fixed and what still differs.

To add another photo, put it in `photos/`, calibrate it, and add its camera to `PHOTOS` in `js/layout.js`. Compare mode and the arrow keys pick it up.

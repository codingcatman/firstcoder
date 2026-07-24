# Grow the Cow 🐄

A tiny playable browser game. Feed a cow different foods to help it grow until
it's fully grown at **30 points**.

## How to play

1. Open `index.html` in any web browser (no build step or server needed).
2. Click a food button to feed the cow. Each food adds growth points:
   - 🌿 **Grass** — 3 points
   - 🫘 **Soy** — 2 points
   - 🌸 **Flowers** — 1 point
3. Higher-point foods grow the cow more. The cow visibly grows and a progress
   bar fills as you feed it.
4. When the cow reaches **30 points** it's fully grown — a **Play again**
   button appears so you can reset and start over.

## The 3D cow

The cow is a real 3D model (a Highland cow, `models/cow.stl`) rendered with
WebGL. It loads automatically when the page opens, and you can:

- **Drag** to rotate it and inspect all sides.
- **Zoom** with the scroll wheel, a two-finger pinch, or the on-screen +/−
  buttons.
- **Grow** it by feeding — it scales up as its growth points increase.
- **Mute/unmute** the sound effects with the 🔊 button.

If the model ever fails to load, the game falls back to a simple cow drawn with
CSS 3D transforms so it stays playable. Everything runs locally in the
browser — nothing is sent anywhere.

## Files

- `index.html` — the game (HTML, CSS, and JavaScript in one file).
- `models/cow.stl` — the built-in 3D cow model, loaded at startup.
- `vendor/` — [Three.js](https://threejs.org/) (r128) and its `STLLoader`,
  vendored locally so the model renders without any network access.

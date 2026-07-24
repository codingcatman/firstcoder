# The Dome — portfolio site

`index.html` is the front page: a standalone, editorial portfolio for **The
Dome**. Open it in any browser (no build step or server needed) — the CAD model
is embedded in the page, so it loads even from a `file://` URL.

- The **3D model** (`models/dome.stl`) sits at the centre of the hero and:
  - **Drag** to rotate it and inspect every angle.
  - **Scroll** (or pinch, or use the on-screen +/− buttons) to zoom.
  - It **auto-spins** gently while idle and pauses the moment you interact.
- Below the hero are short **concept sections** (Concept · Form · Craft · Specs)
  with placeholder copy — replace the text with the real story of The Dome.
- Rendered with the same vendored [Three.js](https://threejs.org/) (r128) and
  `STLLoader` in `vendor/`, so it needs no network access.

Model files:

- `models/dome.stl` — the source CAD model (binary STL).
- `models/dome-stl-data.js` — the same model embedded as base64 (auto-generated
  from `dome.stl`), loaded at startup so the page works from a `file://` URL.

---

# Grow the Cow 🐄

A tiny playable browser game. Feed a cow different foods to help it grow until
it's fully grown at **30 points**.

## How to play

1. Open `cow.html` in any web browser — just double-click it, no build step
   or server needed. (The 3D model is embedded in the page, so it loads even
   from a `file://` URL.)
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

- `cow.html` — the game (HTML, CSS, and JavaScript in one file).
- `models/cow.stl` — the built-in 3D cow model (source asset).
- `models/cow-stl-data.js` — the same model embedded as base64 (auto-generated
  from `cow.stl`), loaded at startup so the page works from a `file://` URL.
- `vendor/` — [Three.js](https://threejs.org/) (r128) and its `STLLoader`,
  vendored locally so the model renders without any network access.

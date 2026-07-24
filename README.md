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

## Use your own cow model

The cow is a 3D model you can rotate (drag), zoom (scroll / pinch / the +/−
buttons), and grow by feeding. By default it's a built-in model drawn with CSS
3D transforms, but you can **swap in your own CAD model**:

1. Click **Upload cow model (.stl)** and pick an `.stl` file (a common CAD
   export format, e.g. from Fusion 360, SolidWorks, or Blender).
2. Your model is rendered in a WebGL view and takes over all the controls —
   drag to rotate, zoom, and feeding still grows it.
3. Click **Use default cow** to switch back to the built-in cow.

Everything runs locally in your browser — the uploaded file is never sent
anywhere.

## Files

- `index.html` — the game (HTML, CSS, and JavaScript in one file).
- `vendor/` — [Three.js](https://threejs.org/) (r128) and its `STLLoader`,
  vendored locally so uploaded STL models render without any network access.

# The Dome — portfolio site

An editorial, single-page portfolio for **The Dome**, built around an
interactive 3D view of the product's CAD model. No build step or server needed —
just open it in a browser.

## Run it

- **`index.html`** — the site. Open it directly (double-click) or serve the
  folder. It loads `vendor/` and `models/` alongside it. The model is embedded
  as base64, so it renders even from a `file://` URL.
- **`dome-standalone.html`** — the exact same page with Three.js, the STL
  loader, the model, and the fonts all inlined into one file. Fully
  self-contained — open it anywhere with nothing else needed.

## The 3D model

The Dome (`models/dome.stl`) sits at the centre of the hero. You can:

- **Drag** to rotate it; it **auto-spins** gently while idle and pauses when you
  interact.
- **Scroll the page** — the model and its cast shadow shrink, and the model
  gradually **tilts up to 90°** to reveal its top. (There is no separate zoom;
  scrolling the page is never captured by the model.)

## Content

Below the hero are short editorial sections — **Concept · Form · Craft · Specs** —
with **placeholder copy**. Replace the text with the real story of The Dome; the
spec figures are the model's actual bounding-box dimensions.

## Type

- **Headings** — Mikela if it's installed locally, otherwise the embedded
  [Fraunces](https://fonts.google.com/specimen/Fraunces) (SIL OFL). Mikela is a
  commercial face and isn't bundled; drop its font file in and it takes over.
- **Body** — [Marcellus](https://fonts.google.com/specimen/Marcellus) (SIL OFL),
  embedded as base64 so it renders offline.

## Files

- `index.html` — the portfolio page (HTML, CSS, and JavaScript in one file).
- `dome-standalone.html` — single self-contained build with everything inlined.
- `models/dome.stl` — the source CAD model (binary STL).
- `models/dome-stl-data.js` — the same model embedded as base64, so the page
  works from a `file://` URL.
- `vendor/` — [Three.js](https://threejs.org/) (r128) and its `STLLoader`,
  vendored locally so the model renders without any network access.

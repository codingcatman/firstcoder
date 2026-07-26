# Portfolio site

A static, editorial portfolio. No build step or server needed — every page
opens directly in a browser (`file://` works fine). The only build step that
exists is optional: regenerating the single-file standalone build of the
Dome project page (see below).

## Site map

- **`index.html`** — landing page: three categories (Product Design, UI
  Design, Photography).
- **`work/product-design/index.html`** — Product Design listing. Currently
  lists one project, **The Dome**.
  - **`work/product-design/the-dome/index.html`** — The Dome's project page,
    with an interactive 3D view of its CAD model.
  - **`work/product-design/the-dome/dome-standalone.html`** — the same Dome
    page with everything (Three.js, the model, the fonts) inlined into one
    file. Fully self-contained — open it anywhere with nothing else needed;
    useful for sharing without the rest of the site.
- **`work/ui-design/index.html`** — UI Design listing (placeholder, no
  projects yet).
- **`work/photography/index.html`** — Photography listing (placeholder, no
  projects yet).

Add a new project by creating a folder under the relevant `work/<category>/`
directory and linking it from that category's listing page.

## Shared assets

- `assets/site.css` — design tokens (colours, type stack) and base layout
  styles used by the landing page and the category listing pages.
- `assets/fonts.css` — the same two embedded webfonts used across the site
  (see Type, below), as `@font-face` declarations. Linked from every page
  except the-dome (which stays fully self-contained on its own).
- `vendor/` — [Three.js](https://threejs.org/) (r128) and its `OBJLoader`,
  vendored locally so 3D project pages render without any network access.

## The Dome — 3D model

The Dome (`work/product-design/the-dome/models/dome.obj`, exported from
Autodesk Fusion) sits at the centre of its project page's hero and renders
with its **per-part Fusion materials** — satin steel, dark bamboo, clear
polycarbonate, and MDF board (base colours from the exported `dome.mtl`). It
is **non-interactive**; instead:

- The model **auto-spins** gently on its own.
- **Scroll the page** — the model and its cast shadow shrink, and the model
  gradually **tilts up to 90°** to reveal its top (through the clear cap you
  can see the internal steel parts). Scrolling the page is never captured by
  the model, so the page always scrolls freely.

Below the hero are short editorial sections — Concept · Form · Craft · Specs —
with **placeholder copy**. Replace the text with the real story of The Dome;
the spec figures are the model's actual bounding-box dimensions.

### Regenerating the standalone build

If you edit `work/product-design/the-dome/index.html`, the single-file
`dome-standalone.html` does **not** update automatically — it's a generated
snapshot, not a linked copy. Regenerate it with:

```
node scripts/build-standalone.js
```

## Type

- **Headings** — Mikela if it's installed locally, otherwise the embedded
  [Fraunces](https://fonts.google.com/specimen/Fraunces) (SIL OFL). Mikela is
  a commercial face and isn't bundled; drop its font file in and it takes
  over.
- **Body** — [Marcellus](https://fonts.google.com/specimen/Marcellus)
  (SIL OFL), embedded as base64 so it renders offline.

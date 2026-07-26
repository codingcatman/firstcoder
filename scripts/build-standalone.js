#!/usr/bin/env node
// Regenerates work/product-design/the-dome/dome-standalone.html from
// work/product-design/the-dome/index.html by inlining Three.js, the OBJ
// loader, and the embedded model data. Run after editing the-dome/index.html:
//
//   node scripts/build-standalone.js

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const domeDir = path.join(root, "work", "product-design", "the-dome");

const srcPath = path.join(domeDir, "index.html");
const outPath = path.join(domeDir, "dome-standalone.html");

let html = fs.readFileSync(srcPath, "utf8");
const three = fs.readFileSync(path.join(root, "vendor", "three.min.js"), "utf8");
const objLoader = fs.readFileSync(path.join(root, "vendor", "OBJLoader.js"), "utf8");
const modelData = fs.readFileSync(path.join(domeDir, "models", "dome-obj-data.js"), "utf8");

for (const [name, code] of [["three.min.js", three], ["OBJLoader.js", objLoader], ["dome-obj-data.js", modelData]]) {
  if (/<\/script>/i.test(code)) {
    console.error(`Refusing to inline ${name}: it contains a literal </script>.`);
    process.exit(1);
  }
}

html = html
  .replace(
    '<script src="../../../vendor/three.min.js"></script>',
    `<script>\n${three}\n  </script>`
  )
  .replace(
    '<script src="../../../vendor/OBJLoader.js"></script>',
    `<script>\n${objLoader}\n  </script>`
  )
  .replace(
    '<script src="models/dome-obj-data.js"></script>',
    `<script>\n${modelData}\n  </script>`
  );

if (/src="(\.\.\/){1,}vendor\//.test(html) || /src="models\//.test(html)) {
  console.error("Some external script references were not inlined — check the src= strings above still match.");
  process.exit(1);
}

fs.writeFileSync(outPath, html);
console.log(`Wrote ${path.relative(root, outPath)} (${(html.length / 1024 / 1024).toFixed(2)} MB)`);

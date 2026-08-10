"use client";

import React, {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

// ---------------------------------------------------------------------------
// WebGL shader plumbing (generic — renders a subtle animated dithered paper
// grain behind the document). Adapted from the same shader-mount machinery
// used by the ticket component; unchanged apart from trimming the pieces
// (image dithering, presets, remixing) that a plain document card doesn't need.
// ---------------------------------------------------------------------------

var vertexShaderSource = `#version 300 es
precision mediump float;
layout(location = 0) in vec4 a_position;
void main() {
  gl_Position = a_position;
}`;

var declarePI = `
#define TWO_PI 6.28318530718
#define PI 3.14159265358979323846
`;

var proceduralHash11 = `
  float hash11(float p) {
    p = fract(p * 0.3183099) + 0.1;
    p *= p + 19.19;
    return fract(p * p);
  }
`;

var proceduralHash21 = `
  float hash21(vec2 p) {
    p = fract(p * vec2(0.3183099, 0.3678794)) + 0.1;
    p += dot(p, p + 19.19);
    return fract(p.x * p.y);
  }
`;

var simplexNoise = `
vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
    -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
      dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
`;

var ditheringFragmentShader = `#version 300 es
precision mediump float;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_pixelRatio;

uniform float u_pxSize;
uniform vec4 u_colorBack;
uniform vec4 u_colorFront;
uniform float u_scale;

out vec4 fragColor;

${simplexNoise}
${declarePI}
${proceduralHash11}
${proceduralHash21}

const int bayer8x8[64] = int[64](
0, 32, 8, 40, 2, 34, 10, 42,
48, 16, 56, 24, 50, 18, 58, 26,
12, 44, 4, 36, 14, 46, 6, 38,
60, 28, 52, 20, 62, 30, 54, 22,
3, 35, 11, 43, 1, 33, 9, 41,
51, 19, 59, 27, 49, 17, 57, 25,
15, 47, 7, 39, 13, 45, 5, 37,
63, 31, 55, 23, 61, 29, 53, 21
);

float getBayerValue(vec2 uv) {
  ivec2 pos = ivec2(fract(uv / 8.0) * 8.0);
  int index = pos.y * 8 + pos.x;
  return float(bayer8x8[index]) / 64.0;
}

void main() {
  float t = .35 * u_time;

  float pxSize = u_pxSize * u_pixelRatio;
  vec2 pxSizeUV = gl_FragCoord.xy - .5 * u_resolution;
  pxSizeUV /= pxSize;
  vec2 canvasPixelizedUV = (floor(pxSizeUV) + .5) * pxSize;
  vec2 shapeUV = canvasPixelizedUV / u_resolution;

  shapeUV *= u_scale * .001;
  float shape = 0.5 + 0.5 * snoise(shapeUV - vec2(0., .3 * t));
  shape += 0.5 * snoise(2. * shapeUV + vec2(0., .32 * t));
  shape = smoothstep(0.35, 1.1, shape);

  float dithering = getBayerValue(pxSizeUV) - .5;
  float res = step(.5, shape + dithering);

  vec3 fgColor = u_colorFront.rgb * u_colorFront.a;
  vec3 bgColor = u_colorBack.rgb * u_colorBack.a;
  vec3 color = mix(bgColor, fgColor, res);

  fragColor = vec4(color, 1.0);
}
`;

function getShaderColorFromString(colorString) {
  if (typeof colorString !== "string" || !colorString.startsWith("#")) {
    return [0, 0, 0, 1];
  }
  let hex = colorString.replace(/^#/, "");
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  if (hex.length === 6) hex += "ff";
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const a = parseInt(hex.slice(6, 8), 16) / 255;
  return [r, g, b, a];
}

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("PdfDocumentCard: shader compile error", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl, vsSource, fsSource) {
  const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
  if (!vs || !fs) return null;
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("PdfDocumentCard: program link error", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  return program;
}

/** Minimal WebGL2 full-viewport shader mount, driving one <canvas> per instance. */
class ShaderMount {
  rafId = null;
  lastRenderTime = 0;
  currentFrame = 0;
  disposed = false;
  resolutionChanged = true;

  constructor(parentElement, uniforms, speed) {
    this.parentElement = parentElement;
    this.uniforms = uniforms;
    this.speed = speed;

    const canvas = document.createElement("canvas");
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;";
    this.canvas = canvas;
    parentElement.prepend(canvas);

    const gl = canvas.getContext("webgl2");
    if (!gl) return;
    this.gl = gl;

    this.program = createProgram(gl, vertexShaderSource, ditheringFragmentShader);
    if (!this.program) return;

    const positionLoc = gl.getAttribLocation(this.program, "a_position");
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    this.locations = {
      u_time: gl.getUniformLocation(this.program, "u_time"),
      u_pixelRatio: gl.getUniformLocation(this.program, "u_pixelRatio"),
      u_resolution: gl.getUniformLocation(this.program, "u_resolution"),
      u_pxSize: gl.getUniformLocation(this.program, "u_pxSize"),
      u_colorBack: gl.getUniformLocation(this.program, "u_colorBack"),
      u_colorFront: gl.getUniformLocation(this.program, "u_colorFront"),
      u_scale: gl.getUniformLocation(this.program, "u_scale"),
    };

    this.resizeObserver = new ResizeObserver(() => {
      this.resolutionChanged = true;
      this.render(performance.now());
    });
    this.resizeObserver.observe(parentElement);

    this.setSpeed(speed);
  }

  setUniforms = (next) => {
    this.uniforms = { ...this.uniforms, ...next };
    this.render(performance.now());
  };

  setSpeed = (speed) => {
    this.speed = speed;
    if (this.rafId === null && speed !== 0) {
      this.lastRenderTime = performance.now();
      this.rafId = requestAnimationFrame(this.render);
    }
    if (this.rafId !== null && speed === 0) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  };

  render = (time) => {
    if (this.disposed || !this.gl || !this.program) return;
    const dt = time - this.lastRenderTime;
    this.lastRenderTime = time;
    if (this.speed !== 0) this.currentFrame += dt * this.speed;

    const gl = this.gl;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.round(this.parentElement.clientWidth * dpr);
    const height = Math.round(this.parentElement.clientHeight * dpr);
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      gl.viewport(0, 0, width, height);
      this.resolutionChanged = true;
    }

    gl.useProgram(this.program);
    gl.uniform1f(this.locations.u_time, this.currentFrame * 0.001);
    if (this.resolutionChanged) {
      gl.uniform2f(this.locations.u_resolution, width, height);
      gl.uniform1f(this.locations.u_pixelRatio, dpr);
      this.resolutionChanged = false;
    }
    gl.uniform1f(this.locations.u_pxSize, this.uniforms.pxSize);
    gl.uniform4fv(this.locations.u_colorBack, this.uniforms.colorBack);
    gl.uniform4fv(this.locations.u_colorFront, this.uniforms.colorFront);
    gl.uniform1f(this.locations.u_scale, this.uniforms.scale);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    if (this.speed !== 0) {
      this.rafId = requestAnimationFrame(this.render);
    } else {
      this.rafId = null;
    }
  };

  dispose = () => {
    this.disposed = true;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.resizeObserver?.disconnect();
    this.canvas.remove();
  };
}

/** React wrapper mounting a ShaderMount canvas inside a positioned div. */
const PaperGrain = memo(function PaperGrain({
  colorBack = "#f4f1ea",
  colorFront = "#ffffff",
  pxSize = 1.1,
  scale = 2.4,
  speed = 0.06,
  className,
  style,
}) {
  const divRef = useRef(null);
  const mountRef = useRef(null);

  useEffect(() => {
    if (!divRef.current) return;
    mountRef.current = new ShaderMount(
      divRef.current,
      {
        colorBack: getShaderColorFromString(colorBack),
        colorFront: getShaderColorFromString(colorFront),
        pxSize,
        scale,
      },
      speed
    );
    return () => mountRef.current?.dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    mountRef.current?.setUniforms({
      colorBack: getShaderColorFromString(colorBack),
      colorFront: getShaderColorFromString(colorFront),
      pxSize,
      scale,
    });
  }, [colorBack, colorFront, pxSize, scale]);

  useEffect(() => {
    mountRef.current?.setSpeed(speed);
  }, [speed]);

  return <div ref={divRef} className={className} style={{ position: "absolute", inset: 0, ...style }} />;
});

// ---------------------------------------------------------------------------
// Tilt physics — the cursor "puts weight on" the card: an instant tilt/scale
// that follows the pointer while hovering, and eases back flat on leave.
// ---------------------------------------------------------------------------

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";
function usePrefersReducedMotion() {
  return React.useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(MOTION_QUERY);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(MOTION_QUERY).matches,
    () => false
  );
}

function TiltCard({ children, radius = 0, maxTilt = 9, scale = 1.02, glare = 0.16, className }) {
  const cardRef = useRef(null);
  const glareRef = useRef(null);
  const [hovering, setHovering] = useState(false);

  const onMove = useCallback(
    (e) => {
      const el = cardRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const dx = (e.clientX - rect.left) / rect.width - 0.5;
      const dy = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.transform = `perspective(1200px) rotateX(${-(dy * 2) * maxTilt}deg) rotateY(${
        dx * 2 * maxTilt
      }deg) scale(${scale})`;
      if (glareRef.current) {
        glareRef.current.style.background = `radial-gradient(38% 55% at ${(dx + 0.5) * 100}% ${
          (dy + 0.5) * 100
        }%, rgba(255,255,255,${glare}) 0%, rgba(255,255,255,0) 70%)`;
      }
    },
    [maxTilt, scale, glare]
  );

  const onLeave = useCallback(() => {
    setHovering(false);
    if (cardRef.current) {
      cardRef.current.style.transform = "perspective(1200px) rotateX(0deg) rotateY(0deg) scale(1)";
    }
    if (glareRef.current) glareRef.current.style.background = "transparent";
  }, []);

  return (
    <div
      ref={cardRef}
      onPointerEnter={() => setHovering(true)}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={`relative w-fit will-change-transform ${className ?? ""}`}
      style={{
        transition: hovering ? "none" : "transform 420ms cubic-bezier(0.22, 1, 0.36, 1)",
        transform: "perspective(1200px) rotateX(0deg) rotateY(0deg) scale(1)",
        transformStyle: "preserve-3d",
      }}
    >
      {children}
      {glare > 0 && (
        <div
          ref={glareRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ borderRadius: radius, transition: hovering ? "none" : "background 420ms ease-out" }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// The document itself — A4 portrait, shows a paper-grain placeholder until a
// PDF is dropped or picked, then fills the page with the PDF's own rendering.
// ---------------------------------------------------------------------------

const DOCUMENT_ASPECT = 210 / 297; // ISO 216 A4, width / height (portrait)

/**
 * Renders page 1 of `file` onto a canvas via pdfjs-dist (peer dependency —
 * `npm install pdfjs-dist`). A canvas is used instead of an <iframe> so the
 * browser's own PDF viewer chrome (toolbar, thumbnail sidebar) never shows
 * up, and pointer events reach the card normally for the tilt effect.
 */
function usePdfPageRender(file, width) {
  const canvasRef = useRef(null);
  const [status, setStatus] = useState("idle"); // idle | loading | ready | error

  useEffect(() => {
    if (!file || !canvasRef.current) {
      setStatus("idle");
      return;
    }
    let cancelled = false;
    let renderTask = null;
    setStatus("loading");

    (async () => {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        // Bundler-relative worker URL (Next.js/webpack 5 and Vite both resolve this
        // from the installed pdfjs-dist package, so no network round-trip to a CDN
        // and no separate copy-to-public-dir step is needed).
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url
        ).toString();

        const buffer = await file.arrayBuffer();
        if (cancelled) return;
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
        const page = await pdf.getPage(1);
        if (cancelled || !canvasRef.current) return;

        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const baseViewport = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: (width * dpr) / baseViewport.width });

        const canvas = canvasRef.current;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        renderTask = page.render({ canvasContext: canvas.getContext("2d"), viewport });
        await renderTask.promise;
        if (!cancelled) setStatus("ready");
      } catch (err) {
        if (!cancelled) {
          console.error("PdfDocumentCard: failed to render PDF", err);
          setStatus("error");
        }
      }
    })();

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [file, width]);

  return { canvasRef, status };
}

const pillButtonClass =
  "rounded-full border-none bg-black/70 px-3 py-1.5 text-[11px] font-semibold text-white cursor-pointer hover:bg-black/85";

function DocumentCard({
  file: controlledFile,
  onFileChange,
  placeholder = "Drop a PDF here, or click to upload",
  width = 420,
  radius = 3,
  className,
  style,
}) {
  const [internalFile, setInternalFile] = useState(null);
  const file = controlledFile !== undefined ? controlledFile : internalFile;
  const { canvasRef, status: previewStatus } = usePdfPageRender(file, width);
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  const height = width / DOCUMENT_ASPECT;

  const setFile = useCallback(
    (next) => {
      if (controlledFile === undefined) setInternalFile(next);
      onFileChange?.(next);
    },
    [controlledFile, onFileChange]
  );

  const openPicker = () => inputRef.current?.click();

  const handleInputChange = (e) => {
    const picked = e.target.files?.[0];
    if (picked && picked.type === "application/pdf") setFile(picked);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && dropped.type === "application/pdf") setFile(dropped);
  };

  return (
    <div
      className={`group relative select-none overflow-hidden ${className ?? ""}`}
      style={{
        width,
        height,
        borderRadius: radius,
        boxShadow: "0 1px 2px rgba(20,16,8,0.08), 0 18px 36px -12px rgba(20,16,8,0.28)",
        cursor: file ? "default" : "pointer",
        ...style,
      }}
      onClick={() => {
        if (!file) openPicker();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!file) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        onChange={handleInputChange}
        style={{ display: "none" }}
      />

      <PaperGrain speed={reducedMotion ? 0 : 0.06} />

      {file && (
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            background: "#fff",
            display: previewStatus === "ready" ? "block" : "none",
          }}
        />
      )}

      {file && (previewStatus === "loading" || previewStatus === "error") && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center px-8 text-center"
          style={{ color: "#5a4f3a", fontSize: 13 }}
        >
          {previewStatus === "loading" ? "Rendering preview…" : "Couldn't preview this PDF"}
        </div>
      )}

      {!file && (
        <div
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center"
          style={{ color: "#5a4f3a", opacity: dragOver ? 1 : 0.75 }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              border: "1.5px dashed currentColor",
              display: "grid",
              placeItems: "center",
            }}
          >
            <span style={{ fontSize: 20, lineHeight: 1 }}>+</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, letterSpacing: "0.01em" }}>{placeholder}</span>
          <span style={{ fontSize: 11, opacity: 0.7 }}>PDF · A4</span>
        </div>
      )}

      {file && (
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            className={pillButtonClass}
            onClick={(e) => {
              e.stopPropagation();
              openPicker();
            }}
          >
            Replace
          </button>
          <button
            type="button"
            className={pillButtonClass}
            onClick={(e) => {
              e.stopPropagation();
              setFile(null);
            }}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

/** Public entry point: an A4 document card with pointer-weight tilt, holding an uploaded PDF. */
function PdfDocumentCard({ tilt, ...props }) {
  const radius = props.radius ?? 3;
  if (tilt === false) return <DocumentCard {...props} />;
  return (
    <TiltCard radius={radius} {...tilt}>
      <DocumentCard {...props} />
    </TiltCard>
  );
}

export { DocumentCard, TiltCard, DOCUMENT_ASPECT, PdfDocumentCard };
export default PdfDocumentCard;

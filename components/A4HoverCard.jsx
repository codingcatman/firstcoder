import React, { useRef, useEffect, useCallback } from "react";

const A4_RATIO = 297 / 210; // height / width, ISO 216

/**
 * An A4-shaped card that tilts and presses down under the cursor, as if the
 * pointer were resting weight on a sheet of paper. Motion is smoothed with a
 * damped spring loop (not a CSS transition) so the card settles gradually
 * instead of snapping, which is what reads as "weight" rather than "hover".
 */
export default function A4HoverCard({
  width = 420,
  maxTilt = 12,
  maxPress = 0.035,
  children,
  style,
  className,
}) {
  const cardRef = useRef(null);
  const glareRef = useRef(null);
  const target = useRef({ rx: 0, ry: 0, press: 0, gx: 50, gy: 50 });
  const current = useRef({ rx: 0, ry: 0, press: 0, gx: 50, gy: 50 });

  useEffect(() => {
    let raf;
    const damping = 0.12; // lower = heavier, slower to settle

    const animate = () => {
      const c = current.current;
      const t = target.current;
      c.rx += (t.rx - c.rx) * damping;
      c.ry += (t.ry - c.ry) * damping;
      c.press += (t.press - c.press) * damping;
      c.gx += (t.gx - c.gx) * damping;
      c.gy += (t.gy - c.gy) * damping;

      const card = cardRef.current;
      if (card) {
        const scale = 1 - c.press * maxPress;
        card.style.transform = `perspective(900px) rotateX(${c.rx}deg) rotateY(${c.ry}deg) scale(${scale})`;

        const shadowBlur = 40 - c.press * 24;
        const shadowSpread = -6 - c.press * 4;
        const shadowY = 24 - c.press * 16;
        const shadowOpacity = 0.28 - c.press * 0.1;
        card.style.boxShadow = `${-c.ry * 1.2}px ${shadowY}px ${shadowBlur}px ${shadowSpread}px rgba(20, 20, 30, ${shadowOpacity})`;
      }

      const glare = glareRef.current;
      if (glare) {
        glare.style.background = `radial-gradient(circle at ${c.gx}% ${c.gy}%, rgba(255,255,255,${
          0.35 + c.press * 0.15
        }), transparent 55%)`;
      }

      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [maxPress]);

  const handleMove = useCallback(
    (e) => {
      const card = cardRef.current;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;

      target.current.ry = (px - 0.5) * 2 * maxTilt;
      target.current.rx = -(py - 0.5) * 2 * maxTilt;
      target.current.press = 1;
      target.current.gx = px * 100;
      target.current.gy = py * 100;
    },
    [maxTilt]
  );

  const handleLeave = useCallback(() => {
    target.current = { rx: 0, ry: 0, press: 0, gx: 50, gy: 50 };
  }, []);

  const handleDown = useCallback(() => {
    target.current.press = 1.4;
  }, []);

  const handleUp = useCallback(() => {
    target.current.press = 1;
  }, []);

  return (
    <div
      ref={cardRef}
      className={className}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      onPointerDown={handleDown}
      onPointerUp={handleUp}
      style={{
        width,
        height: width * A4_RATIO,
        borderRadius: 4,
        background: "#fdfdfb",
        position: "relative",
        overflow: "hidden",
        transformStyle: "preserve-3d",
        willChange: "transform, box-shadow",
        boxShadow: "0 24px 40px -6px rgba(20, 20, 30, 0.28)",
        cursor: "pointer",
        ...style,
      }}
    >
      <div
        ref={glareRef}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          mixBlendMode: "overlay",
        }}
      />
      <div style={{ position: "relative", zIndex: 1, height: "100%", boxSizing: "border-box", padding: 32 }}>
        {children}
      </div>
    </div>
  );
}

import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

// ─── TYPES ──────────────────────────────────────────────────────────────────
export interface ColorScheme {
  background: string;
  primary: string;
  secondary: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
  key?: string;
}

export interface DynamicSceneProps {
  scene: {
    id: string;
    durationSec: number;
    label: string;
    motionGraphic: {
      shapeVocabulary: string;
      movementBehavior: string;
      thematicLink: string;
      layerPosition: string;
      imageIntegration: boolean;
    };
    text: {
      headline: string;
      subtext?: string;
    };
    voiceLine: string;
    animationStyle: string;
    colorScheme: ColorScheme;
  };
  imagePath?: string;
  fps?: number;
}

// ─── SECURITY GUARD ──────────────────────────────────────────────────────────
function isSafeImagePath(p?: string) {
  if (!p || typeof p !== "string") return false;
  if (/\0/.test(p))                                          return false; // null bytes
  if (/^(javascript|data|http|https|ftp|blob):/i.test(p))   return false; // protocol URIs
  if (/\.\./.test(p))                                        return false; // path traversal
  return /^\//.test(p) || p.startsWith('http');                             // absolute or http
}

// ─── DETERMINISTIC RANDOMNESS ────────────────────────────────────────────────
function seededRandom(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x); // 0.0–1.0
}

function simpleHash(str?: string) {
  if (!str) return 42;
  return str.split("").reduce((acc, c, i) => acc + c.charCodeAt(0) * (i + 1), 0);
}

// ─── SHAPE CONSTRUCTION ──────────────────────────────────────────────────────
function buildShapes(shapeVocabulary: string = "rect", durationSec: number = 3) {
  const vocab = shapeVocabulary.toLowerCase();
  const count = Math.min(28, 12 + Math.floor(durationSec * 2.5));
  const seed  = simpleHash(shapeVocabulary);

  let type: "circle" | "line" | "triangle" | "hexagon" | "rect" = "rect";
  if      (/circle|dot|orb|sphere/.test(vocab))               type = "circle";
  else if (/triangle|spike|wedge/.test(vocab))                 type = "triangle";
  else if (/hexagon/.test(vocab))                              type = "hexagon";
  else if (/line|streak|beam|ray/.test(vocab))                 type = "line";
  else if (/rectangle|block|bar|shard|tile/.test(vocab))       type = "rect";

  return Array.from({ length: count }, (_, i) => ({
    id:         i,
    type,
    x:          seededRandom(seed + i * 7)  * 1920,
    y:          seededRandom(seed + i * 13) * 1080,
    size:       20 + seededRandom(seed + i * 3) * 80,
    colorIndex: i % 3,   // 0=primary, 1=secondary, 2=accent
    opacity:    0.15 + (Math.sin(i * 1.7) * 0.5 + 0.5) * 0.7,  // 0.15–0.85
    rotation:   seededRandom(seed + i * 11) * 360,
  }));
}

// ─── SVG SHAPE RENDERER ──────────────────────────────────────────────────────
function renderShape(shape: any, x: number, y: number, size: number, opacity: number, rotation: number, colorScheme: ColorScheme) {
  const colors    = [colorScheme.primary, colorScheme.secondary, colorScheme.accent];
  const fill      = colors[shape.colorIndex];
  const transform = `rotate(${rotation} ${x} ${y})`;

  switch (shape.type) {
    case "circle": {
      return <circle key={shape.id} cx={x} cy={y} r={size / 2} fill={fill} opacity={opacity} />;
    }
    case "line": {
      return <rect key={shape.id} x={x - size} y={y - 2} width={size * 2} height={4}
        fill={fill} opacity={opacity} transform={transform} />;
    }
    case "triangle": {
      const pts = `${x},${y - size / 2} ${x - size / 2},${y + size / 2} ${x + size / 2},${y + size / 2}`;
      return <polygon key={shape.id} points={pts} fill={fill} opacity={opacity} transform={transform} />;
    }
    case "hexagon": {
      const hpts = Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        return `${x + (size / 2) * Math.cos(a)},${y + (size / 2) * Math.sin(a)}`;
      }).join(" ");
      return <polygon key={shape.id} points={hpts} fill={fill} opacity={opacity} transform={transform} />;
    }
    case "rect":
    default: {
      return <rect key={shape.id} x={x - size / 2} y={y - size / 2}
        width={size} height={size * 0.6}
        fill={fill} opacity={opacity} transform={transform} rx={3} />;
    }
  }
}

// ─── ANIMATION ENGINE ────────────────────────────────────────────────────────
function animateShapes(shapes: any[], animationStyle: string, frame: number, fps: number, durationSec: number, movementBehavior: string, colorScheme: ColorScheme) {
  return shapes.map(shape => {
    switch (animationStyle) {
      case "burst": {
        const progress = interpolate(frame, [0, durationSec * fps], [0, 1], { extrapolateRight: "clamp" });
        const scale    = interpolate(progress, [0, 0.6, 1], [0, 1.4, 1.6]);
        const opacity  = interpolate(progress, [0, 0.4, 1], [0, shape.opacity, 0]);
        const x = 960 + (shape.x - 960) * scale;
        const y = 540 + (shape.y - 540) * scale;
        return renderShape(shape, x, y, shape.size, opacity, shape.rotation, colorScheme);
      }
      case "drift": {
        const mv    = (movementBehavior || "").toLowerCase();
        const speed = mv.includes("slow") ? 35 : mv.includes("fast") ? 95 : 55;
        const t     = frame / fps;
        const dx = (mv.includes("left") ? -1 : mv.includes("right") ? 1 : mv.includes("diagonal") ? 0.7 : 0) * speed * t;
        const dy = (mv.includes("down") ? 1 : mv.includes("up") ? -1 : mv.includes("diagonal") ? 0.7 : -1) * speed * t;
        const x = ((shape.x + dx) % 1920 + 1920) % 1920;
        const y = ((shape.y + dy) % 1080 + 1080) % 1080;
        return renderShape(shape, x, y, shape.size, shape.opacity, shape.rotation, colorScheme);
      }
      case "cascade": {
        const delayFrames = (shape.id / Math.max(shapes.length, 1)) * (durationSec * fps * 0.5);
        const sp = spring({ frame: Math.max(0, Math.round(frame - delayFrames)), fps, config: { stiffness: 90, damping: 15 } });
        const y  = -200 + sp * (shape.y + 200); 
        return renderShape(shape, shape.x, y, shape.size, sp * shape.opacity, shape.rotation, colorScheme);
      }
      case "pulse": {
        const mv        = (movementBehavior || "").toLowerCase();
        const frequency = mv.includes("fast") || mv.includes("rapid") ? 1.2 : mv.includes("slow") || mv.includes("gentle") ? 0.5 : 0.75;
        const pulseFactor = 1 + Math.sin(frame / fps * Math.PI * 2 * frequency + shape.id * 0.4) * 0.3;
        return renderShape(shape, shape.x, shape.y, shape.size * pulseFactor, shape.opacity, shape.rotation, colorScheme);
      }
      case "assemble": {
        const sp     = spring({ frame, fps, config: { stiffness: 80, damping: 12 } });
        const startX = seededRandom(shape.id * 17) * 1920;
        const startY = seededRandom(shape.id * 23) * 1080;
        const x      = startX + (shape.x - startX) * sp;
        const y      = startY + (shape.y - startY) * sp;
        return renderShape(shape, x, y, shape.size, sp * shape.opacity, shape.rotation, colorScheme);
      }
      case "shatter": {
        const progress = interpolate(frame, [0, durationSec * fps * 0.7], [0, 1], { extrapolateRight: "clamp" });
        const explodeX = shape.x + (shape.x - 960) * progress * 1.5;
        const explodeY = shape.y + (shape.y - 540) * progress * 1.5;
        const opacity  = interpolate(progress, [0, 0.5, 1], [shape.opacity, shape.opacity * 0.8, 0]);
        return renderShape(shape, explodeX, explodeY, shape.size, opacity, shape.rotation + progress * 45, colorScheme);
      }
      case "wave": {
        const colIndex   = shape.id % 8;
        const waveOffset = Math.sin(frame / fps * Math.PI * 2 * 0.8 + colIndex * 0.6) * 60;
        return renderShape(shape, shape.x, shape.y + waveOffset, shape.size, shape.opacity, shape.rotation, colorScheme);
      }
      case "spiral": {
        const safeLen   = Math.max(shapes.length, 1);
        const baseAngle = (shape.id / safeLen) * Math.PI * 2;
        const radius    = 120 + shape.id * 20;
        const angle     = baseAngle + (frame / fps) * 0.4;
        const x         = 960 + radius * Math.cos(angle);
        const y         = 540 + radius * Math.sin(angle);
        return renderShape(shape, x, y, shape.size, shape.opacity, shape.rotation, colorScheme);
      }
      default: {
        const t = frame / fps;
        const x = ((shape.x - t * 55) % 1920 + 1920) % 1920;
        const y = ((shape.y - t * 55) % 1080 + 1080) % 1080;
        return renderShape(shape, x, y, shape.size, shape.opacity, shape.rotation, colorScheme);
      }
    }
  });
}

// ─── DYNAMIC SCENE COMPONENT ─────────────────────────────────────────────────
export const DynamicScene: React.FC<DynamicSceneProps> = ({ scene, imagePath, fps = 30 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const motionGraphic = (scene.motionGraphic || {}) as DynamicSceneProps['scene']['motionGraphic'];
  const { colorScheme, text, animationStyle } = scene;
  const { layerPosition = "background" } = motionGraphic;
  const durationSec = Math.max(0.5, scene.durationSec ?? 3);

  const safeImagePath = isSafeImagePath(imagePath) ? imagePath : undefined;
  const shapes         = buildShapes(motionGraphic.shapeVocabulary || "rect", durationSec);
  const animatedShapes = animateShapes(
    shapes, animationStyle, frame, fps, durationSec,
    motionGraphic.movementBehavior || "", colorScheme
  );

  const textEntrance = spring({
    frame: Math.max(0, frame - 8),
    fps,
    config: { stiffness: 60, damping: 14 }
  });

  const svgLayer = (
    <svg
      key="svg-layer"
      viewBox="0 0 1920 1080"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    >
      {animatedShapes}
    </svg>
  );

  const imageLayer = motionGraphic.imageIntegration && safeImagePath ? (
    <div
      key="image-layer"
      style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        pointerEvents: "none",
        zIndex: 5,
        // NOTE: no background or backgroundColor here — intentional
      }}
    >
      <img
        src={safeImagePath}
        style={{
          maxWidth: 600, maxHeight: 600,
          objectFit: "contain",
          opacity: 0.85,
          mixBlendMode: "lighten",
          filter: "grayscale(100%) contrast(1.4) brightness(2)",
        }}
        alt="Product"
      />
    </div>
  ) : null;

  const textLayer = layerPosition !== "full" ? (
    <div
      key="text-layer"
      style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "0 120px",
        transform: `translateY(${(1 - textEntrance) * 40}px)`,
        opacity: textEntrance,
        zIndex: layerPosition === "foreground" ? 2 : 10,
      }}
    >
      {text?.headline && (
        <p style={{
          fontSize: 88, fontWeight: 700,
          color: colorScheme.textPrimary,
          letterSpacing: "-1px", lineHeight: 1.1,
          margin: 0, textAlign: "center",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', Arial, sans-serif",
        }}>
          {text.headline}
        </p>
      )}
      {text?.subtext && (
        <p style={{
          fontSize: 36, fontWeight: 400,
          color: colorScheme.textSecondary,
          opacity: 0.8, marginTop: 16, textAlign: "center",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', Arial, sans-serif",
        }}>
          {text.subtext}
        </p>
      )}
    </div>
  ) : null;

  const layers = layerPosition === "foreground"
    ? [textLayer, svgLayer, imageLayer]
    : [svgLayer, imageLayer, textLayer];

  return (
    <div style={{ width, height, position: "relative", background: colorScheme.background, overflow: "hidden" }}>
      {layers}
    </div>
  );
};

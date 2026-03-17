import React from 'react';
import {
  AbsoluteFill,
  Audio,
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  staticFile,
  Img,
} from 'remotion';

interface HookSceneProps {
  title: string;
  subtitle: string;
  narration: string;
  audioPath: string;
  imageProvided: boolean;
}

export const HookScene: React.FC<HookSceneProps> = ({
  title,
  subtitle,
  audioPath,
  imageProvided,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const titleY = interpolate(entrance, [0, 1], [80, 0]);
  const subtitleY = interpolate(
    spring({ frame: Math.max(0, frame - 10), fps, config: { damping: 14 } }),
    [0, 1],
    [60, 0]
  );

  return (
    <AbsoluteFill style={{ backgroundColor: '#050507', overflow: 'hidden' }}>
      {/* Audio */}
      <Audio src={staticFile(audioPath)} />

      {/* Background image (full-bleed with dark overlay) — only if provided */}
      {imageProvided && (
        <AbsoluteFill style={{ zIndex: 0 }}>
          <Img
            src={staticFile('/uploaded-image.jpg')}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35 }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(135deg, rgba(5,5,7,0.85) 40%, rgba(99,102,241,0.2) 100%)',
            }}
          />
        </AbsoluteFill>
      )}

      {/* Ambient glow */}
      {!imageProvided && (
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '-10%',
            width: '70%',
            height: '70%',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
          }}
        />
      )}

      {/* Content */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 120px',
          zIndex: 1,
        }}
      >
        {/* Tag */}
        <div
          style={{
            opacity,
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '3px',
              background: 'linear-gradient(90deg, #6366f1, #22d3ee)',
              borderRadius: '2px',
            }}
          />
          <span
            style={{
              fontSize: '24px',
              fontWeight: 700,
              letterSpacing: '0.2em',
              color: 'rgba(255,255,255,0.5)',
              fontFamily: 'Inter, sans-serif',
              textTransform: 'uppercase',
            }}
          >
            NOW PRESENTING
          </span>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: '120px',
            fontWeight: 900,
            lineHeight: 1.0,
            margin: '0 0 24px',
            letterSpacing: '-0.04em',
            fontFamily: 'Inter, sans-serif',
            background: 'linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            transform: `translateY(${titleY}px)`,
            opacity,
          }}
        >
          {title}
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: '36px',
            fontWeight: 400,
            color: 'rgba(255,255,255,0.5)',
            margin: 0,
            fontFamily: 'Outfit, sans-serif',
            transform: `translateY(${subtitleY}px)`,
            opacity,
          }}
        >
          {subtitle}
        </p>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

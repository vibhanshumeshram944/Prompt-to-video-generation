import React from 'react';
import {
  AbsoluteFill,
  Audio,
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  staticFile,
} from 'remotion';

interface ClimaxSceneProps {
  title: string;
  subtitle: string;
  narration: string;
  audioPath: string;
}

export const ClimaxScene: React.FC<ClimaxSceneProps> = ({
  title,
  subtitle,
  audioPath,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const entrance = spring({ frame, fps, config: { damping: 10, stiffness: 200 } });
  const opacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });

  // Pulse color between amber and orange
  const pulse = interpolate(
    Math.sin((frame / fps) * Math.PI * 3),
    [-1, 1],
    [0, 1]
  );
  const glowOpacity = interpolate(pulse, [0, 1], [0.3, 0.7]);

  const scale = interpolate(entrance, [0, 1], [0.7, 1]);

  // Exit fade — clamped so it never exceeds half the scene
  const exitFadeStart = Math.max(0, durationInFrames - Math.min(15, Math.floor(durationInFrames / 4)));
  const exitOpacity = interpolate(
    frame,
    [exitFadeStart, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#070502',
        overflow: 'hidden',
        opacity: exitOpacity,
      }}
    >
      <Audio src={staticFile(audioPath)} />

      {/* Pulsing radial glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 50% 50%, rgba(245,158,11,${glowOpacity}) 0%, rgba(234,88,12,${glowOpacity * 0.4}) 30%, transparent 70%)`,
        }}
      />
      
      {/* High impact flash */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: '#fff',
          opacity: interpolate(frame, [0, 5], [1, 0], { extrapolateRight: 'clamp' }),
          zIndex: 10,
        }}
      />

      {/* Explosive starburst lines */}
      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * 360;
        const lineLen = interpolate(entrance, [0, 1], [0, 800]);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: `${lineLen}px`,
              height: '1px',
              background: `rgba(245,158,11,0.15)`,
              transformOrigin: '0 0',
              transform: `rotate(${angle}deg)`,
            }}
          />
        );
      })}

      {/* Content */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '0 80px',
        }}
      >
        {/* Title */}
        <h2
          style={{
            fontSize: '140px',
            fontWeight: 900,
            lineHeight: 0.9,
            margin: '0 0 40px',
            letterSpacing: '-0.05em',
            fontFamily: 'Inter, sans-serif',
            background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 50%, #fbbf24 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            transform: `scale(${scale})`,
            opacity,
            textTransform: 'uppercase',
          }}
        >
          {title}
        </h2>

        {/* Divider */}
        <div
          style={{
            width: interpolate(entrance, [0, 1], [0, 200]),
            height: '3px',
            background: 'linear-gradient(90deg, #f59e0b, #f97316)',
            borderRadius: '2px',
            marginBottom: '40px',
            opacity,
          }}
        />

        {/* Subtitle */}
        <p
          style={{
            fontSize: '36px',
            fontWeight: 300,
            color: 'rgba(255,255,255,0.6)',
            margin: 0,
            fontFamily: 'Outfit, sans-serif',
            letterSpacing: '0.05em',
            opacity,
          }}
        >
          {subtitle}
        </p>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

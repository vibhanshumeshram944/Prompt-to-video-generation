import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  spring,
  useVideoConfig,
  Audio,
  staticFile,
} from 'remotion';

export const ProblemScene: React.FC<{
  title: string;
  subtitle: string;
  audioPath: string;
}> = ({ title, subtitle, audioPath }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    fps,
    frame,
    config: { damping: 14 },
  });

  const glitchOffsetX = interpolate(frame, [20, 22, 24, 26, 28], [0, 10, -10, 5, 0], {
    extrapolateRight: 'clamp',
  });

  const opacity = interpolate(frame, [0, 15], [0, 1]);

  // Motion blocks
  const block1Scale = spring({ fps, frame: frame - 5, config: { damping: 12 } });
  const block2Scale = spring({ fps, frame: frame - 10, config: { damping: 12 } });

  return (
    <AbsoluteFill style={{ backgroundColor: '#180505', justifyContent: 'center', alignItems: 'center' }}>
      {audioPath && <Audio src={staticFile(audioPath)} />}

      {/* Abstract motion blocks to add visual interest */}
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        backgroundColor: '#ef4444',
        opacity: 0.1,
        borderRadius: '50px',
        transform: `translate(-30%, -40%) scale(${block1Scale}) rotate(${frame}deg)`,
      }} />
      <div style={{
        position: 'absolute',
        width: '600px',
        height: '100px',
        backgroundColor: '#f87171',
        opacity: 0.05,
        transform: `translate(20%, 30%) scale(${block2Scale})`,
      }} />

      <div style={{ opacity, transform: `translateY(${50 - entrance * 50}px) translateX(${glitchOffsetX}px)` }}>
        <h1
          style={{
            fontSize: '90px',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 900,
            color: '#ef4444',
            margin: 0,
            textAlign: 'center',
            textShadow: '0 0 30px rgba(239, 68, 68, 0.4)',
            letterSpacing: '-0.03em',
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: '40px',
            fontFamily: 'Inter, sans-serif',
            color: 'rgba(255,255,255,0.7)',
            margin: '20px 0 0',
            textAlign: 'center',
            fontWeight: 500,
            transform: `scale(${interpolate(frame, [10, 30], [0.9, 1], { extrapolateRight: 'clamp' })})`,
          }}
        >
          {subtitle}
        </p>
      </div>
    </AbsoluteFill>
  );
};

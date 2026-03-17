import React from 'react';
import { AbsoluteFill, Audio, staticFile } from 'remotion';
import { TransitionSeries, springTiming, linearTiming } from '@remotion/transitions';
import { slide } from '@remotion/transitions/slide';
import { wipe } from '@remotion/transitions/wipe';
import { fade } from '@remotion/transitions/fade';
import { DynamicScene } from './scenes/DynamicScene';

// New scene shape from the updated scene planner
export interface Scene {
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
  colorScheme: {
    key: string;
    background: string;
    primary: string;
    secondary: string;
    accent: string;
    textPrimary: string;
    textSecondary: string;
  };
  audioPath?: string;
  duration: number; // in frames (computed by videoRenderFinalNode)
}

export interface CompositionProps {
  plan: {
    scenes: Scene[];
    totalDurationSec?: number;
    prompt: string;
    imageProvided: boolean;
  };
  [key: string]: unknown;
}

const TRANSITION_FRAMES = 20;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getTransition = (index: number): { presentation: any; timing: ReturnType<typeof linearTiming> } => {
  const idx = index % 5;
  if (idx === 0) return { presentation: slide({ direction: 'from-right' }), timing: springTiming({ config: { damping: 200 }, durationInFrames: TRANSITION_FRAMES }) };
  if (idx === 1) return { presentation: wipe({ direction: 'from-top-left' }), timing: linearTiming({ durationInFrames: TRANSITION_FRAMES }) };
  if (idx === 2) return { presentation: wipe({ direction: 'from-left' }), timing: springTiming({ config: { damping: 200 }, durationInFrames: TRANSITION_FRAMES }) };
  if (idx === 3) return { presentation: slide({ direction: 'from-bottom' }), timing: springTiming({ config: { damping: 200 }, durationInFrames: TRANSITION_FRAMES }) };
  return { presentation: fade(), timing: linearTiming({ durationInFrames: TRANSITION_FRAMES }) };
};

export const Main: React.FC<CompositionProps> = ({ plan }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#050507' }}>
      <TransitionSeries>
        {plan.scenes.map((scene, i) => {
          const transition = getTransition(i);
          const durationInFrames = Math.max(1, scene.duration || Math.round(scene.durationSec * 30));
          
          return (
            <React.Fragment key={scene.id || i}>
              <TransitionSeries.Sequence durationInFrames={durationInFrames}>
                {scene.audioPath && (
                    <Audio src={staticFile(scene.audioPath)} />
                )}
                <DynamicScene
                  scene={scene}
                  imagePath={plan.imageProvided ? staticFile('/product-image.png') : undefined}
                  fps={30}
                />
              </TransitionSeries.Sequence>
              {/* Add a transition after every scene except the last */}
              {i < plan.scenes.length - 1 && (
                <TransitionSeries.Transition
                  presentation={transition.presentation}
                  timing={transition.timing}
                />
              )}
            </React.Fragment>
          );
        })}
      </TransitionSeries>
    </AbsoluteFill>
  );
};

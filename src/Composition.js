import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { AbsoluteFill, Audio, staticFile } from 'remotion';
import { TransitionSeries, springTiming, linearTiming } from '@remotion/transitions';
import { slide } from '@remotion/transitions/slide';
import { wipe } from '@remotion/transitions/wipe';
import { fade } from '@remotion/transitions/fade';
import { DynamicScene } from './scenes/DynamicScene';

const TRANSITION_FRAMES = 20;

const getTransition = (index) => {
  const idx = index % 5;
  if (idx === 0) return { presentation: slide({ direction: 'from-right' }), timing: springTiming({ config: { damping: 200 }, durationInFrames: TRANSITION_FRAMES }) };
  if (idx === 1) return { presentation: wipe({ direction: 'from-top-left' }), timing: linearTiming({ durationInFrames: TRANSITION_FRAMES }) };
  if (idx === 2) return { presentation: wipe({ direction: 'from-left' }), timing: springTiming({ config: { damping: 200 }, durationInFrames: TRANSITION_FRAMES }) };
  if (idx === 3) return { presentation: slide({ direction: 'from-bottom' }), timing: springTiming({ config: { damping: 200 }, durationInFrames: TRANSITION_FRAMES }) };
  return { presentation: fade(), timing: linearTiming({ durationInFrames: TRANSITION_FRAMES }) };
};

export const Main = ({ plan }) => {
  return (
    _jsx(AbsoluteFill, {
      style: { backgroundColor: '#050507' },
      children: _jsx(TransitionSeries, {
        children: plan.scenes.map((scene, i) => {
          const transition = getTransition(i);
          const durationInFrames = Math.max(1, scene.duration || Math.round(scene.durationSec * 30));
          
          return _jsx(React.Fragment, {
            children: [
              _jsx(TransitionSeries.Sequence, {
                durationInFrames,
                children: [
                  scene.audioPath && _jsx(Audio, { src: staticFile(scene.audioPath) }),
                  _jsx(DynamicScene, { 
                    scene, 
                    imagePath: plan.imageProvided ? staticFile('/product-image.png') : undefined,
                    fps: 30 
                  })
                ].filter(Boolean)
              }),
              i < plan.scenes.length - 1 && _jsx(TransitionSeries.Transition, {
                presentation: transition.presentation,
                timing: transition.timing,
              })
            ].filter(Boolean)
          }, scene.id || i);
        })
      })
    })
  );
};

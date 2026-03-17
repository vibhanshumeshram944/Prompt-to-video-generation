import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Composition } from 'remotion';
import { Main } from './Composition';
import { z } from 'zod';
import latestPlanData from './latest-plan.json';

const FPS = 30;
const WIDTH = 1920;
const HEIGHT = 1080;

const motionGraphicSchema = z.object({
  shapeVocabulary: z.string(),
  movementBehavior: z.string(),
  thematicLink: z.string(),
  layerPosition: z.string(),
  imageIntegration: z.boolean(),
});

const colorSchemeSchema = z.object({
  key: z.string(),
  background: z.string(),
  primary: z.string(),
  secondary: z.string(),
  accent: z.string(),
  textPrimary: z.string(),
  textSecondary: z.string(),
});

const sceneSchema = z.object({
  id: z.string(),
  durationSec: z.number(),
  label: z.string(),
  motionGraphic: motionGraphicSchema,
  text: z.object({
    headline: z.string(),
    subtext: z.string().optional(),
  }),
  voiceLine: z.string(),
  animationStyle: z.string(),
  colorScheme: colorSchemeSchema,
  audioPath: z.string().optional(),
  duration: z.number(),
});

const compositionSchema = z.object({
  plan: z.object({
    scenes: z.array(sceneSchema),
    totalDurationSec: z.number().optional(),
    prompt: z.string(),
    imageProvided: z.boolean(),
  }),
});

const TRANSITION_FRAMES = 20;

const defaultColorScheme = {
  key: "deep_electric",
  background: "#0a0a1a",
  primary: "#4f46e5",
  secondary: "#7c3aed",
  accent: "#06b6d4",
  textPrimary: "#f8fafc",
  textSecondary: "#94a3b8",
};

const defaultPlan = {
  scenes: [
    {
      id: "scene_1", durationSec: 3, label: "Opening impact",
      motionGraphic: { shapeVocabulary: "diagonal shards, sharp rectangles", movementBehavior: "burst outward from center fast", thematicLink: "speed and precision", layerPosition: "full", imageIntegration: false },
      text: { headline: "The Future Is Here", subtext: "Next-generation technology" },
      voiceLine: "The future is here, and it changes everything.", animationStyle: "burst",
      colorScheme: defaultColorScheme, audioPath: "", duration: 90,
    },
    {
      id: "scene_2", durationSec: 4, label: "Feature showcase",
      motionGraphic: { shapeVocabulary: "circles, orbs", movementBehavior: "drift upward slowly", thematicLink: "smooth experience", layerPosition: "background", imageIntegration: false },
      text: { headline: "Instant Results", subtext: "Achieve more in less time" },
      voiceLine: "Experience instant results that speak for themselves.", animationStyle: "drift",
      colorScheme: defaultColorScheme, audioPath: "", duration: 120,
    },
    {
      id: "scene_3", durationSec: 4, label: "Product highlight",
      motionGraphic: { shapeVocabulary: "hexagons, blocks", movementBehavior: "assemble from scattered", thematicLink: "building innovation", layerPosition: "foreground", imageIntegration: false },
      text: { headline: "Built Different", subtext: "Leading the industry" },
      voiceLine: "Built different from the ground up for you.", animationStyle: "assemble",
      colorScheme: defaultColorScheme, audioPath: "", duration: 120,
    },
    {
      id: "scene_4", durationSec: 3, label: "Call to action",
      motionGraphic: { shapeVocabulary: "triangles, spikes", movementBehavior: "pulse outward", thematicLink: "urgency to act", layerPosition: "full", imageIntegration: false },
      text: { headline: "Start Today" },
      voiceLine: "Start your journey today and never look back.", animationStyle: "pulse",
      colorScheme: defaultColorScheme, audioPath: "", duration: 90,
    },
  ],
  totalDurationSec: 14,
  prompt: 'A powerful product demonstration',
  imageProvided: false,
};

export const RemotionRoot = () => {
  return _jsx(_Fragment, {
    children: _jsx(Composition, {
      id: "VideoAd",
      component: Main,
      durationInFrames: 660,
      fps: FPS,
      width: WIDTH,
      height: HEIGHT,
      schema: compositionSchema,
      calculateMetadata: async ({ props }) => {
        let planData = props.plan;
        if (latestPlanData && latestPlanData.scenes && latestPlanData.scenes.length >= 2) {
          planData = latestPlanData;
        }
        const sceneDuration = planData.scenes.reduce((acc, s) => acc + (s.duration || Math.round(s.durationSec * FPS)), 0);
        const transitionReduction = Math.max(0, (planData.scenes.length - 1) * TRANSITION_FRAMES);
        const dynamicDuration = Math.max(180, sceneDuration - transitionReduction);
        return {
          durationInFrames: dynamicDuration,
          props: { ...props, plan: planData },
        };
      },
      defaultProps: { plan: defaultPlan }
    })
  });
};

import { Annotation } from "@langchain/langgraph";

export const AgentState = Annotation.Root({
  goal: Annotation<string>(),
  imageBase64: Annotation<string | undefined>(),
  
  // Feature Extractor Output
  productInfo: Annotation<{
    product: string;
    features: string[];
    tone: string;
    duration: number;
  } | null>(),

  // Color Scheme (resolved locally after feature extraction)
  colorScheme: Annotation<{
    key: string;
    background: string;
    primary: string;
    secondary: string;
    accent: string;
    textPrimary: string;
    textSecondary: string;
  } | null>(),

  // Scene Planner Output — new schema with motionGraphic, text, voiceLine
  sceneManifest: Annotation<Array<{
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
  }> | null>(),

  // Total duration from scene planner
  totalDurationSec: Annotation<number | null>(),

  // Render Timings
  frameTimings: Annotation<Array<{
    sceneId: string;
    durationInFrames: number;
  }> | null>(),

  // Voice Generator Output
  audioPaths: Annotation<Array<{
    sceneId: string;
    audioPath: string;
    durationMs: number;
  }> | null>(),

  // Final Output
  finalVideoUrl: Annotation<string | null>(),

  // LangGraph Errors/Retries Track
  error: Annotation<string | null>(),
});

export type State = typeof AgentState.State;

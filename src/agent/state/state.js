import { Annotation } from "@langchain/langgraph";

export const AgentState = Annotation.Root({
  goal: Annotation(),
  imageBase64: Annotation(),

  // Feature Extractor Output
  productInfo: Annotation(),

  // Color Scheme (resolved locally after feature extraction)
  colorScheme: Annotation(),

  // Scene Planner Output — new schema with motionGraphic, text, voiceLine
  sceneManifest: Annotation(),

  // Total duration from scene planner
  totalDurationSec: Annotation(),

  // Render Timings
  frameTimings: Annotation(),

  // Voice Generator Output
  audioPaths: Annotation(),

  // Final Output
  finalVideoUrl: Annotation(),

  // LangGraph Errors/Retries Track
  error: Annotation(),
});

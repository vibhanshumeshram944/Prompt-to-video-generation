import { State } from "../state/state.js";
import { getPrimaryModel } from "../groqClient.js";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { z } from "zod";

// ─── FEATURE EXTRACTOR (unchanged) ──────────────────────────────────────────
const featureExtractorSchema = z.object({
  product: z.string(),
  features: z.array(z.string()).max(4),
  tone: z.enum(["premium", "energetic", "friendly", "corporate", "neutral"]),
  duration: z.number(),
});

export const featureExtractorNode = async (state: State): Promise<Partial<State>> => {
  const llm = getPrimaryModel().withStructuredOutput(featureExtractorSchema);
  
  const systemMsg = new SystemMessage(
    "You are a video storyboard agent. Extract product/topic details from the user's goal. Be concise. Default duration is 15 seconds."
  );
  const humanMsg = new HumanMessage(`Goal: ${state.goal}`);
  
  const result = await llm.invoke([systemMsg, humanMsg]);
  
  return {
    productInfo: result
  };
};

// ─── SCENE PLANNER — FULL REWRITE ───────────────────────────────────────────

// Step 1 — Sanitise rawPrompt (prompt injection defense)
function sanitisePrompt(raw: string | undefined): string {
  if (!raw || typeof raw !== "string") return "";
  return raw
    .slice(0, 280)
    .replace(/[\r\n]+/g, " ")          // strip newlines — prevent fake message injection
    .replace(/[`"'\\{}[\]]/g, "")      // strip JSON-breaking and template chars
    .replace(/ignore|override|forget|system|you are|act as|disregard/gi, "***")
    .trim();
}

// Step 2 — System prompt (module-scope constant)
const SCENE_PLANNER_SYSTEM_PROMPT = `You are a motion graphics scene planner. Reply ONLY with valid JSON. No prose, no markdown fences, no explanation outside the JSON.
Rules:
- 3 to 8 scenes based on prompt complexity and duration
- durationSec per scene: 2 to 6 seconds; all scene durations must sum to totalDurationSec
- shapeVocabulary: max 8 words. movementBehavior: max 8 words. thematicLink: max 10 words
- voiceLine: CRITICAL — each scene's voiceLine MUST be a STANDALONE complete sentence on its own. It MUST end with exactly one of: period (.), exclamation mark (!), or question mark (?). NEVER split one sentence across multiple scenes. NEVER write a sentence fragment. Word count must fit durationSec (2-3s=5-8 words, 3-4s=8-12 words, 4-6s=12-16 words). Thematic link between consecutive voiceLines is fine, but each is grammatically complete by itself.
- text: Object with 'headline' (required) and 'subtext' (optional). 
  - IMPORTANT: NEVER return an empty text object {}. Every scene MUST have a headline, even if it's just the product name or 'Order Now'.
- animationStyle: One of [burst, drift, cascade, pulse, assemble, shatter, wave, spiral].
  - IMPORTANT: The FIRST scene must use animationStyle 'burst' or 'cascade' — NEVER drift or wave for the opening.
  - IMPORTANT: Every scene must have a DISTINCT animationStyle from the scene immediately before it — no two consecutive scenes may share the same value.
  - IMPORTANT: The LAST scene must have a headline in its text field AND layerPosition must be 'background', so the CTA is always readable.
- colorScheme: Use the provided JSON exactly. Do NOT change its values.
- headline: max 5 words. subtext: max 8 words, omit if not needed.
- layerPosition: background for text scenes, full for opening/closing, foreground when shapes overlay text.`;

// Scene planner Zod schema for structured output
const scenePlannerSchema = z.object({
  totalDurationSec: z.number(),
  scenes: z.array(z.object({
    id: z.string(),
    durationSec: z.number(),
    label: z.string(),
    motionGraphic: z.object({
      shapeVocabulary: z.string(),
      movementBehavior: z.string(),
      thematicLink: z.string(),
      layerPosition: z.string(),
      imageIntegration: z.boolean(),
    }),
    text: z.object({
      headline: z.string().min(1).describe("Big impact text. Max 5 words. NEVER leave empty."),
      subtext: z.string().optional().describe("Small support text. Max 8 words."),
    }).describe("Text overlays for the scene. Required."),
    voiceLine: z.string(),
    animationStyle: z.string(),
  })).min(3).max(8)
});

export const scenePlannerNode = async (state: State): Promise<Partial<State>> => {
  if (!state.productInfo) throw new Error("Missing product info");
  if (!state.colorScheme) throw new Error("Missing color scheme — run colorSchemeResolver first");

  const featureOutput = state.productInfo;
  const colorScheme = state.colorScheme;
  const hasImage = !!state.imageBase64;
  const rawPrompt = state.goal;

  // Step 3 — Assemble user prompt
  const safePrompt = sanitisePrompt(rawPrompt);

  const userPrompt = [
    `Product: ${featureOutput.product  || "unknown"}`,
    `Features: ${(featureOutput.features || []).slice(0, 4).join(", ")}`,
    `Tone: ${featureOutput.tone        || "neutral"}`,
    `Duration: ${featureOutput.duration || 20}s`,
    `Has image: ${Boolean(hasImage)}`,
    `Color scheme: ${colorScheme.key}`,
    `Brief: ${safePrompt}`,
    `Plan scenes as JSON.`
  ].join("\n");

  // Step 4 — Call Groq via groqClient.js
  const llm = getPrimaryModel().withStructuredOutput(scenePlannerSchema);
  
  const systemMsg = new SystemMessage(SCENE_PLANNER_SYSTEM_PROMPT);
  const humanMsg = new HumanMessage(userPrompt);

  const result = await llm.invoke([systemMsg, humanMsg]);

  // Step 5 — Validate (structured output from Zod already validates shape,
  // but we add extra guards)
  if (!result || typeof result !== "object") {
    throw new Error("scenePlanner: response is not a JSON object");
  }

  if (!Array.isArray(result.scenes) || result.scenes.length < 3 || result.scenes.length > 8) {
    throw new Error(`scenePlanner: invalid scene count: ${result.scenes?.length}`);
  }

  const totalDurationSec = Number(result.totalDurationSec);
  if (isNaN(totalDurationSec) || totalDurationSec < 3 || totalDurationSec > 300) {
    throw new Error(`scenePlanner: invalid totalDurationSec: ${result.totalDurationSec}`);
  }

  // Fix 4 — Proportional duration scaling
  // If the sum of scene durations doesn't match totalDurationSec (±0.5s tolerance),
  // scale each scene proportionally so the video is always the right length.
  let scenes = result.scenes;
  const sceneSum = scenes.reduce((s, sc) => s + sc.durationSec, 0);
  if (Math.abs(sceneSum - totalDurationSec) > 0.5) {
    console.warn(`scenePlanner: scene sum (${sceneSum}s) ≠ totalDurationSec (${totalDurationSec}s) — scaling proportionally.`);
    const ratio = totalDurationSec / sceneSum;
    scenes = scenes.map(sc => ({
      ...sc,
      durationSec: Math.max(2, parseFloat((sc.durationSec * ratio).toFixed(1)))
    }));
  }

  // Auto-repair voiceLines: if the LLM produced a fragment (no terminal punctuation),
  // append a period so Groq structured-output validation doesn't reject the whole response.
  scenes = scenes.map(sc => {
    const vl = (sc.voiceLine || "").trim();
    const endsWithPunct = /[.!?]$/.test(vl);
    return {
      ...sc,
      voiceLine: endsWithPunct ? vl : vl + "."
    };
  });

  // Attach colorScheme (mood already stripped) to every scene
  const finalScenes = scenes.map(scene => ({ ...scene, colorScheme }));

  return {
    sceneManifest: finalScenes,
    totalDurationSec,
  };
};

// infographicNode has been REMOVED — all visual instructions live in scene.motionGraphic

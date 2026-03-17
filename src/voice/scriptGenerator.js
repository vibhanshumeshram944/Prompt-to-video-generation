// ─── VOICE SCRIPT GENERATOR ──────────────────────────────────────────────────
// Zero API calls of any kind. Voice lines come from the scene plan.
// This module validates, formats, and coordinates audio sync only.

// Lazy import — toneMatcher may not exist yet during early dev
let toneMatcher = null;
function getToneMatcher() {
  if (!toneMatcher) {
    toneMatcher = require('./toneMatcher.js');
  }
  return toneMatcher;
}

// ─── STEP 2 — Validate each voice line ──────────────────────────────────────
function validateVoiceLine(voiceLine, scene) {
  if (!voiceLine || typeof voiceLine !== "string") return fallback(scene);
  const trimmed   = voiceLine.trim();
  const endsOk    = /[.!?]$/.test(trimmed);
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
  // 18-word cap: scene planner ceiling is 16 words. 2-word buffer catches minor overruns
  // before they cause audio cut-off against scene duration.
  if (!endsOk || wordCount < 4 || wordCount > 18) return fallback(scene);
  return trimmed;
}

function fallback(scene) {
  return `${scene.label || "Scene"}, a moment that defines it all.`;
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────
// Step 1 — Receives sceneManifest[] from stateManager.js
export function generateVoiceScript(sceneManifest) {
  if (!sceneManifest || !Array.isArray(sceneManifest)) return [];

  return sceneManifest.map(scene => {
    // Step 2 — Validate voice line
    const validatedVoiceLine = validateVoiceLine(scene.voiceLine, scene);

    // Step 3 — Target audio duration
    const targetMs        = (scene.durationSec * 1000) - 300; // 300ms end buffer
    const clampedTargetMs = Math.max(700, targetMs);           // minimum 700ms

    // Step 4 — ElevenLabs payload
    const payload = {
      sceneId:          scene.id,
      text:             validatedVoiceLine,
      targetDurationMs: clampedTargetMs,
      // Guard: colorScheme may be missing — ?. prevents crash, resolveVoiceId handles undefined
      voiceId:          getToneMatcher().resolveVoiceId(scene.colorScheme?.key),
      modelId:          "eleven_turbo_v2_5",
      // Updated from "eleven_turbo_v2" — verify this ID against current ElevenLabs API docs
      // before deployment. ElevenLabs periodically deprecates model IDs.
      voiceSettings: {
        stability:         0.72,   // consistent voice with natural prosody variation
        similarity_boost:  0.85,   // identical character across scenes — sounds like one narrator
        style:             0.0,    // no exaggeration — sentence content carries the tone
        use_speaker_boost: true,   // clarity on short sentences in short scenes
      }
    };

    return payload;
  });
}

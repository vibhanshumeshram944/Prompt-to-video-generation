import { resolveVoiceId } from "../../voice/toneMatcher.js";
import axios from "axios";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const audioGeneratorNode = async (state) => {
  if (!state.sceneManifest) throw new Error("No scenes planned");

  const audioPaths = [];
  const publicDir = path.join(process.cwd(), "public");
  const audioDir = path.join(publicDir, "audio");

  if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });

  const runId = Date.now().toString();

  for (let i = 0; i < state.sceneManifest.length; i++) {
    const scene = state.sceneManifest[i];
    // Use voiceLine from new schema, fall back to text.headline
    const narrationText = scene.voiceLine || scene.text?.headline || "A moment that defines it all.";
    const outputPath = path.join(audioDir, `scene-${runId}-${scene.id}.mp3`);

    // Determine voice ID based on color scheme
    const voiceId = resolveVoiceId(scene.colorScheme?.key);

    try {
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          text: narrationText,
          model_id: "eleven_turbo_v2_5",
          voice_settings: {
            stability: 0.72,
            similarity_boost: 0.85,
            style: 0.0,
            use_speaker_boost: true,
          },
        },
        {
          headers: {
            "xi-api-key": process.env.ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
          },
          responseType: "arraybuffer",
        }
      );

      fs.writeFileSync(outputPath, Buffer.from(response.data));

      audioPaths.push({
        sceneId: scene.id,
        audioPath: `/audio/scene-${runId}-${scene.id}.mp3`,
        durationMs: scene.durationSec * 1000
      });
    } catch (e) {
      console.error(`ElevenLabs error for scene ${scene.id}:`, e);
      // Continue without audio for this scene
    }
  }

  return { audioPaths };
};

export const videoRenderFinalNode = async (state) => {
  // Write scene plan to latest-plan.json so Remotion Root can read it during bundle.
  const srcDir = path.join(process.cwd(), "src");
  const latestPlanPath = path.join(srcDir, "latest-plan.json");

  const planData = {
    scenes: state.sceneManifest?.map((scene) => {
      const audioData = state.audioPaths?.find(a => a.sceneId === scene.id);
      return {
        // New schema — pass full scene data through
        ...scene,
        audioPath: audioData?.audioPath || '',
        duration: scene.durationSec * 30, // 30fps
      };
    }),
    totalDurationSec: state.totalDurationSec,
    prompt: state.goal,
    imageProvided: !!state.imageBase64
  };

  // Write the plan FIRST — Remotion Root.tsx reads this file at bundle time
  fs.writeFileSync(latestPlanPath, JSON.stringify(planData, null, 2));
  console.log(`   ✅ Wrote latest-plan.json with ${planData.scenes?.length} scenes`);
  planData.scenes?.forEach(s => console.log(`      Scene ${s.id}: audioPath = "${s.audioPath}"`));

  const runId = Date.now();
  const outName = `video-${runId}.mp4`;
  const publicDir = path.join(process.cwd(), "public");
  const outPath = path.join(publicDir, outName);

  // Save product image if provided
  if (state.imageBase64) {
    const base64Data = state.imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const imgPath = path.join(publicDir, "product-image.png");
    fs.writeFileSync(imgPath, Buffer.from(base64Data, 'base64'));
  }

  try {
    const { stdout, stderr } = await execAsync(
      `npx remotion render src/remotion-entry.tsx VideoAd "${outPath}"`,
      { maxBuffer: 1024 * 1024 * 50 }
    );
    if (stderr) console.log("   Render stderr:", stderr.slice(0, 500));
    console.log("   ✅ Render done:", stdout.slice(-200));
  } catch (error) {
    console.error("   ❌ Render failed:", error.stderr?.slice(0, 800) || error.message);
    throw new Error("Video render failed: " + (error.stderr?.slice(0, 200) || error.message));
  }

  return { finalVideoUrl: `/${outName}` };
};

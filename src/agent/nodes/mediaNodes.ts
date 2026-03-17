import { State } from "../state/state.js";
import { resolveVoiceId } from "../../voice/toneMatcher.js";
import axios from "axios";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const audioGeneratorNode = async (state: State): Promise<Partial<State>> => {
  if (!state.sceneManifest) throw new Error("No scenes planned");

  const audioPaths: Array<{ sceneId: string; audioPath: string; durationMs: number }> = [];
  const publicDir = path.join(process.cwd(), "public");
  const audioDir = path.join(publicDir, "audio");

  if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });

  const runId = Date.now().toString();
  console.log(`🎙️ Starting Audio Generation for ${state.sceneManifest.length} scenes...`);

  for (let i = 0; i < state.sceneManifest.length; i++) {
    const scene = state.sceneManifest[i];
    const narrationText = scene.voiceLine || scene.text?.headline || "A moment that defines it all.";
    const outputPath = path.join(audioDir, `scene-${runId}-${scene.id}.mp3`);

    // Determine voice ID based on color scheme
    const voiceId = resolveVoiceId(scene.colorScheme?.key);
    console.log(`   [Scene ${scene.id}] Using voiceId: ${voiceId}`);

    try {
      if (!process.env.ELEVENLABS_API_KEY) {
        throw new Error("ELEVENLABS_API_KEY is missing in .env");
      }

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
      
      const relPath = `/audio/scene-${runId}-${scene.id}.mp3`;
      audioPaths.push({
        sceneId: scene.id,
        audioPath: relPath,
        durationMs: scene.durationSec * 1000
      });
      console.log(`   ✅ Audio saved to: ${relPath}`);
    } catch (e: any) {
      console.error(`   ❌ ElevenLabs error for scene ${scene.id}:`, e.response?.data?.toString() || e.message);
      // Skip this scene's audio but don't crash the whole process
    }
  }

  return { audioPaths };
};

export const videoRenderFinalNode = async (state: State): Promise<Partial<State>> => {
  const srcDir = path.join(process.cwd(), "src");
  const latestPlanPath = path.join(srcDir, "latest-plan.json");
  const publicDir = path.join(process.cwd(), "public");
  
  console.log("🎬 Finalizing Video Plan...");

  const planData = {
    scenes: state.sceneManifest?.map((scene) => {
        const audioData = state.audioPaths?.find(a => a.sceneId === scene.id);
        if (!audioData) console.warn(`   ⚠️ No audio data match found for scene ID: ${scene.id}`);
        
        return {
            ...scene,
            audioPath: audioData?.audioPath || '',
            duration: scene.durationSec * 30,
        };
    }),
    totalDurationSec: state.totalDurationSec,
    prompt: state.goal,
    imageProvided: !!state.imageBase64
  };

  // Write the plan FIRST — Remotion Root.tsx imports this file at bundle time.
  // Audio paths are already resolved here since audioGeneratorNode ran first.
  fs.writeFileSync(latestPlanPath, JSON.stringify(planData, null, 2));
  console.log(`   ✅ Wrote latest-plan.json with ${planData.scenes?.length} scenes`);
  planData.scenes?.forEach(s => console.log(`      Scene ${s.id}: audioPath = "${s.audioPath}"`));
  
  const runId = Date.now();
  const outName = `video-${runId}.mp4`;
  const outPath = path.join(publicDir, outName);

  if (state.imageBase64) {
    const base64Data = state.imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const imgPath = path.join(publicDir, "product-image.png");
    fs.writeFileSync(imgPath, Buffer.from(base64Data, 'base64'));
    console.log(`   🎨 Product image saved to public/product-image.png`);
  }

  try {
    console.log(`   🚀 Starting Remotion render: ${outName}...`);
    // NOTE: No --props flag here — Remotion Root.tsx imports latest-plan.json directly.
    // The --props flag with JSON on Windows PowerShell is not reliable.
    const { stdout, stderr } = await execAsync(
      `npx remotion render src/remotion-entry.tsx VideoAd "${outPath}"`,
      { maxBuffer: 1024 * 1024 * 50 } // 50MB buffer for render output
    );
    if (stderr) console.log("   Render stderr:", stderr.slice(0, 500));
    console.log("   ✅ Render successfully completed.");
    console.log("   Render output:", stdout.slice(-300));
  } catch (error: any) {
    console.error("   ❌ Render failed:", error.stderr?.slice(0, 800) || error.message);
    throw new Error("Video render failed: " + (error.stderr?.slice(0, 200) || error.message));
  }

  return { finalVideoUrl: `/${outName}` };
};

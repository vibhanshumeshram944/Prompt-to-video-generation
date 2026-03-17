# 🎬 AI Video Agent — Prompt-to-Motion-Graphics Video Generator

> A **ReAct (Reasoning + Action) AI Agent** that converts a text prompt and optional product image into a fully rendered motion-graphics product demo video — automatically, with LLM reasoning, tool dispatch, observation loops, and self-correction built in.
>
> ⚠️ **Rate-limit aware:** Designed to operate within Groq free tier constraints — 6,000 TPM / 500,000 TPD for `llama-3.3-70b-versatile`.

---

## 🧠 What It Does

| Input | Output |
|---|---|
| Text goal + optional product image | Rendered MP4 product demo video |

**Example Input:**
```
Goal: "Create a high-energy 15 second ad for wireless earbuds"
Image: earbuds.png  (optional)
```

**Example Output:**
```
Scene 1 → Animated Title
Scene 2 → Product Showcase
Scene 3 → Feature Highlight
Scene 4 → Infographic Chart
Scene 5 → Call To Action
→ Final MP4 with AI voiceover
```

---

## 🤖 Agent Framework — ReAct (Reasoning + Action)

### Why ReAct?

| Framework | What it does | Suitable here? |
|---|---|---|
| **Chain of Thought (CoT)** | LLM reasons step-by-step in text only — no tool calls | ❌ Cannot invoke external APIs or tools |
| **ReAct** | LLM alternates: Thought → Action (tool call) → Observation → repeat | ✅ Correct — agent must invoke Groq, ElevenLabs, Remotion |
| **LangGraph / AutoGen** | Multi-agent graph with parallel nodes and stateful edges | ⚠️ Overkill for a single sequential pipeline at this scope |

> **Decision: ReAct.** The pipeline must call external tools at each step and react to their outputs. CoT cannot dispatch tool calls. LangGraph adds unnecessary overhead for a single-agent sequential flow.

### ReAct Loop — Per Video Generation Request

```
INPUT: { goal: string, image?: File }
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│                      REACT AGENT LOOP                            │
│                                                                  │
│  STEP 1  [~350 tokens in+out]                                    │
│  Thought:  Parse prompt → detect product type, input mode       │
│  Action:   CALL feature_extractor tool                          │
│  Observe:  { product, features[], tone, duration }              │
│      ↓  wait 1s inter-step delay (rate limit guard)             │
│  STEP 2  [~400 tokens in+out]                                    │
│  Thought:  Map features to scenes → decide scene count/order    │
│  Action:   CALL scene_planner tool                              │
│  Observe:  sceneManifest[] — valid? (≥ 3 scenes, durations ok?) │
│      ↓  if invalid → re-plan (1 retry max to conserve tokens)   │
│  STEP 3  [~350 tokens in+out]                                    │
│  Thought:  Which scenes need chart data? Build infographic spec  │
│  Action:   CALL infographic_generator tool                      │
│  Observe:  chartAssets[] — confirm assets generated             │
│      ↓  wait 1s inter-step delay                                │
│  STEP 4  [~300 tokens in+out]                                    │
│  Thought:  All assets ready → trigger timings-only render       │
│  Action:   CALL video_renderer (timings_only mode)              │
│  Observe:  frameTimingManifest[] — ⚠ BLOCKING for Step 5       │
│      ↓                                                           │
│  STEP 5  [~450 tokens in+out]                                    │
│  Thought:  Write narration script timed to exact durations      │
│  Action:   CALL voice_generator (ElevenLabs) with timing data   │
│  Observe:  { sceneId, audioPath, durationMs }[]                 │
│      ↓                                                           │
│  STEP 6  [~300 tokens in+out]                                    │
│  Thought:  All inputs ready → compose and render final video    │
│  Action:   CALL video_renderer (full_render mode)               │
│  Observe:  mp4Path — valid?                                     │
│      ↓                                                           │
│  DONE:     Return mp4Path to user                               │
└──────────────────────────────────────────────────────────────────┘

Total Groq token budget per run: ~2,150 tokens  (well under 6,000 TPM)
On 429: exponential backoff — wait 2^n seconds (n = retry attempt, max 3)
```

---

## 🚦 Rate Limit Management (Groq Free Tier)

This is one of the most critical engineering concerns for this project. The ReAct agent makes **6 Groq API calls per video** — all calls within the same minute. Without controls, the scratchpad alone will grow to thousands of tokens and breach the 6,000 TPM limit.

### Free Tier Limits (llama-3.3-70b-versatile)

| Limit Type | Free Tier Cap | Risk in this project |
|---|---|---|
| Tokens per Minute (TPM) | 6,000 tokens/min | HIGH — 6 calls in ~30s window |
| Tokens per Day (TPD) | 500,000 tokens/day | LOW — each run uses ~2,150 tokens |
| Requests per Minute (RPM) | ~30 req/min | LOW — max 6 req per run |

### Token Budget Per Groq Call

Each call to Groq is capped to keep the total run well within 6,000 TPM:

| Step | Call Purpose | Max Input Tokens | Max Output Tokens | Total Cap |
|---|---|---|---|---|
| 1 | Feature Extraction | 300 | 150 | 450 |
| 2 | Scene Planning | 350 | 250 | 600 |
| 3 | Infographic Spec | 300 | 150 | 450 |
| 4 | Timing Validation | 200 | 100 | 300 |
| 5 | Narration Script | 350 | 200 | 550 |
| 6 | Final Validation | 200 | 100 | 300 |
| **Total** | | **1,700** | **950** | **~2,650** |

> 🟢 ~2,650 tokens total per run — leaves 3,350 token buffer within the 6,000 TPM cap.

### Scratchpad Truncation — The Most Important Control

The biggest token risk is the **growing scratchpad**. In a naive ReAct implementation, every Groq call receives the full conversation history (all previous Thoughts + Observations). By Step 6, this can be 3,000+ tokens of input alone.

**Solution: Sliding scratchpad window in `stateManager.js`**

```
Instead of:  [Step1 thought] + [Step1 obs] + [Step2 thought] + [Step2 obs] + ...
Use:         [system prompt] + [current step input] + [last observation only]
```

Each Groq call receives only:
1. Compressed system prompt (~100 tokens, fixed)
2. The current step's task description (~50–100 tokens)
3. The **most recent observation only** — not the full history

Previous observations are stored in `stateManager.js` for reference but **never sent back to Groq** unless a retry is triggered.

### Rate Limit Controls in `agentOrchestrator.js`

```
1. max_tokens cap        → Set per-call max_tokens in every Groq API request
2. Inter-step delay      → 1 second sleep between consecutive Groq calls
3. Token estimator       → Count tokens before sending; abort if > 900 input tokens
4. 429 exponential back-off → On HTTP 429: wait 2^n seconds (n=1→2, n=2→4, n=3→8)
5. Retry cap             → Max 3 retries per call, then structured error (no infinite loop)
6. Daily budget tracker  → Track cumulative tokens in stateManager; warn at 400k/day
```

### Prompt Engineering for Token Efficiency

System prompt is written once, compressed, and reused across all steps:

```
SYSTEM (fixed, ~100 tokens):
"You are a video storyboard agent. Respond ONLY in JSON.
 Extract features, plan scenes, or validate outputs as instructed.
 Be concise. No explanation. No markdown."
```

User prompt per step is instruction-only (~50–100 tokens):
```
STEP 2 USER PROMPT (example, ~70 tokens):
"Features: {product:'earbuds', features:['noise cancellation','8hr battery'],
 tone:'energetic', duration:15}
Plan 5 scenes. Return: [{id,type,content,durationSec}]"
```

Output is always **JSON only** — no prose, no explanation tokens wasted.

### Model Selection Fallback

If `llama-3.3-70b-versatile` is rate-limited (429), fall back to `llama-3.1-8b-instant`:

| Model | TPM (free) | Quality | Use as |
|---|---|---|---|
| `llama-3.3-70b-versatile` | ~6,000 | High | Primary |
| `llama-3.1-8b-instant` | ~30,000 | Good | Fallback on 429 |

The fallback is triggered automatically by `groqClient.js` when a 429 is received and all retries are exhausted on the primary model.

---

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          USER INPUT                              │
│                Text Goal + Optional Product Image                │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│               REACT AGENT ORCHESTRATOR                           │
│               agentOrchestrator.js                               │
│                                                                  │
│  LLM Backbone  : Groq API  (llama-3.3-70b-versatile)           │
│  Agent Pattern : ReAct — Thought → Action → Observe             │
│  Tool Dispatch : toolRegistry.js                                 │
│  Session State : stateManager.js  (sliding scratchpad)          │
│  Rate Guard    : groqClient.js — token cap + backoff + fallback  │
│  Error Policy  : retry ≤ 3 per tool → structured abort         │
└──┬──────────────────┬─────────────────────┬────────────────┬───┘
   │ Tool 1           │ Tool 2              │ Tool 3         │ Tool 4+5
   ▼                  ▼                     ▼                ▼
┌──────────────┐  ┌──────────────────┐  ┌──────────────┐  ┌─────────────────────┐
│  FEATURE     │  │  SCENE PLANNER   │  │  INFOGRAPHIC │  │  VIDEO RENDERER     │
│  EXTRACTOR   │→ │                  │→ │  GENERATOR   │→ │  (Remotion CLI)     │
│              │  │  • scene types   │  │              │  │                     │
│  • product   │  │  • durations     │  │  • chart data│  │  MODE 1:            │
│  • features[]│  │  • storyboard    │  │  • animated  │  │  timings_only →     │
│  • tone      │  │    JSON          │  │    assets    │  │  frameTimingManifest│
│  • duration  │  └──────────────────┘  └──────────────┘  │                     │
└──────────────┘                                           │  MODE 2:            │
                                                           │  full_render →      │
                                                           │  MP4 output         │
                                                           └──────────┬──────────┘
                                                                      │
                                              frameTimingManifest ←───┘
                                              ⚠ BLOCKING for voice layer
                                                       │
                                                       ▼
                                          ┌────────────────────────┐
                                          │  VOICE GENERATOR       │
                                          │  (ElevenLabs API)      │
                                          │  IN:  scene durations  │
                                          │  OUT: audioPaths[]     │
                                          └───────────┬────────────┘
                                                      │
                              { sceneManifest + audioPaths + assetPaths }
                                                      │
                                                      ▼
                                          ┌────────────────────────┐
                                          │  VIDEO COMPOSER        │
                                          │  (Remotion + ffmpeg)   │
                                          └───────────┬────────────┘
                                                      ▼
                                          ┌────────────────────────┐
                                          │   RENDERED MP4 OUTPUT  │
                                          │   1920×1080 · H.264    │
                                          │   AAC audio · ≤60s     │
                                          └────────────────────────┘
```

---

## 🔩 Low-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│  LAYER 1 — UI LAYER  (React + TailwindCSS)                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────────┐ │
│  │ PromptInput.jsx │  │ ImageUpload.jsx  │  │ PreviewPanel.jsx     │ │
│  │ • Text goal     │  │ • Drag & drop    │  │ • Progress tracker   │ │
│  │   input field   │  │ • PNG/JPG/WebP   │  │ • Agent step display │ │
│  │ • Submit trigger│  │ • 5 MB limit     │  │ • Download MP4 btn   │ │
│  └─────────────────┘  └─────────────────┘  └──────────────────────┘ │
│  Data contract out: { goal: string, image?: File }                  │
└─────────────────────────────────┬────────────────────────────────────┘
                                  │
┌─────────────────────────────────▼────────────────────────────────────┐
│  LAYER 2 — REACT AGENT LAYER  (Groq API · llama-3.3-70b-versatile)  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  agentOrchestrator.js          ← ReAct loop controller       │   │
│  │  • Thought → Action → Observe cycle (max 10 steps)          │   │
│  │  • 1s inter-step delay between all Groq calls               │   │
│  │  • Dispatches tools via toolRegistry.js                      │   │
│  │  • Writes trimmed observations to stateManager (last obs     │   │
│  │    only sent to Groq — not full history)                     │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  groqClient.js                 ← Rate-limit wrapper          │   │
│  │  • Sets max_tokens per call (see token budget table)        │   │
│  │  • Estimates input tokens before sending (abort if > 900)   │   │
│  │  • On 429: exponential backoff 2^n seconds (max 3 retries)  │   │
│  │  • Fallback model: llama-3.1-8b-instant on retry exhaustion │   │
│  │  • Tracks cumulative daily tokens; warns at 400k            │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  stateManager.js               ← Session memory + scratchpad │   │
│  │  • Stores all tool results keyed by step                    │   │
│  │  • Sends ONLY last observation to Groq (not full history)   │   │
│  │  • Tracks token count per call + cumulative daily total     │   │
│  │  • retryCount per tool, sessionId (UUID)                    │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────┐  ┌──────────────────────┐  ┌───────────────┐  │
│  │ promptParser.js │  │ featureExtractor.js   │  │scenePlanner.js│  │
│  │ OUT: { goal,    │  │ Groq call (capped     │  │ Maps features │  │
│  │  hasImage,      │  │ 300 in / 150 out)     │  │ to storyboard │  │
│  │  imagePath }    │  │ OUT: { product,       │  │ OUT: scene[]  │  │
│  └─────────────────┘  │  features[], tone,    │  └───────────────┘  │
│                        │  duration }           │                     │
│                        └──────────────────────┘                     │
│                                                                      │
│  ┌────────────────────────────┐  ┌───────────────────────────────┐  │
│  │ toolRegistry.js            │  │ tokenEstimator.js             │  │
│  │ • feature_extractor        │  │ • Rough char-based token count│  │
│  │ • scene_planner            │  │   before each Groq call       │  │
│  │ • infographic_generator    │  │ • Blocks call if > 900 tokens │  │
│  │ • voice_generator          │  │   and logs a warning          │  │
│  │ • video_renderer           │  └───────────────────────────────┘  │
│  └────────────────────────────┘                                      │
└─────────────────────────────────┬────────────────────────────────────┘
                                  │  sceneManifest JSON
┌─────────────────────────────────▼────────────────────────────────────┐
│  LAYER 3 — MEDIA GENERATION LAYER  (Remotion + React)                │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │ TitleScene.jsx   │  │ ProductScene.jsx  │  │ FeatureScene.jsx │   │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │ InfographicScene │  │ CTAScene.jsx      │  │ assetManager.js  │   │
│  │ .jsx             │  └──────────────────┘  └──────────────────┘   │
│  └──────────────────┘                                                │
│  OUTPUT: frameTimingManifest[] { sceneId, startFrame, endFrame,      │
│          durationSec, fps:30 }  ⚠ BLOCKING for Layer 4             │
└─────────────────────────────────┬────────────────────────────────────┘
                                  │  frameTimingManifest[]
┌─────────────────────────────────▼────────────────────────────────────┐
│  LAYER 4 — VOICE LAYER  (ElevenLabs API)                             │
│  ┌─────────────────────────┐  ┌──────────────────────────────────┐   │
│  │ scriptGenerator.js      │  │ audioSynchronizer.js             │   │
│  │ Uses stateManager data  │  │ Trim/pad audio to scene duration │   │
│  │ — NO extra Groq call    │  │ OUT: { sceneId, audioPath,       │   │
│  │ (scripts built locally  │  │        durationMs }[]            │   │
│  │  from sceneManifest)    │  └──────────────────────────────────┘   │
│  └─────────────────────────┘                                         │
│  ┌─────────────────────────┐                                         │
│  │ toneMatcher.js          │  Tone → ElevenLabs voice ID mapping     │
│  └─────────────────────────┘                                         │
└─────────────────────────────────┬────────────────────────────────────┘
                                  │  { sceneManifest, audioPaths[], assetPaths[] }
┌─────────────────────────────────▼────────────────────────────────────┐
│  LAYER 5 — RENDERING LAYER  (Remotion CLI + ffmpeg)                  │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌────────────┐  │
│  │ sceneSequencer.js    │  │ videoRenderer.js      │  │mp4Exporter │  │
│  │ • Frame ranges       │  │ • Remotion CLI        │  │ • ffmpeg   │  │
│  │ • Total duration     │  │ • 30fps · 1920×1080  │  │ • H.264    │  │
│  │ • Asset binding      │  │ • timings_only / full │  │ • AAC      │  │
│  └──────────────────────┘  └──────────────────────┘  └────────────┘  │
│  ⚠ DEPENDENCY: ffmpeg must be installed on the render host          │
└──────────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Critical Execution Order

```
Step 1  promptParser          →  { goal, hasImage, imagePath }            [no Groq call]
Step 2  featureExtractor      →  { product, features[], tone, duration }  [Groq call 1]
Step 3  scenePlanner          →  sceneManifest[]                          [Groq call 2]
Step 4  infographicGenerator  →  chartAssets[]                            [Groq call 3]
Step 5  videoRenderer         →  frameTimingManifest[]   ← BLOCKING       [no Groq call]
Step 6  voiceGenerator        →  { sceneId, audioPath, durationMs }[]     [no Groq call]
Step 7  scriptGenerator       →  narration scripts built locally          [no Groq call]
Step 8  videoComposer         →  mp4Path                                  [no Groq call]
```

> Only **3 of 8 steps** hit Groq. Steps 5–8 are local computation, keeping total Groq usage minimal.

---

## 📦 Module Reference

| Module | Layer | Responsibility |
|---|---|---|
| `agent/agentOrchestrator.js` | 2 | ReAct loop + 1s inter-step delay |
| `agent/groqClient.js` | 2 | Token cap, exponential backoff, model fallback |
| `agent/tokenEstimator.js` | 2 | Pre-call token count guard |
| `agent/toolRegistry.js` | 2 | Tool registration + dispatch |
| `agent/stateManager.js` | 2 | Sliding scratchpad + daily token tracker |
| `agent/promptParser.js` | 2 | Input parsing, no Groq call |
| `agent/featureExtractor.js` | 2 | Groq call 1 — product understanding |
| `agent/scenePlanner.js` | 2 | Groq call 2 — storyboard JSON |
| `scenes/TitleScene.jsx` | 3 | Animated title |
| `scenes/ProductScene.jsx` | 3 | Product image zoom/reveal |
| `scenes/FeatureScene.jsx` | 3 | Kinetic typography |
| `scenes/InfographicScene.jsx` | 3 | Animated charts |
| `scenes/CTAScene.jsx` | 3 | Call-to-action animation |
| `scenes/assetManager.js` | 3 | Image loading + fallbacks |
| `voice/scriptGenerator.js` | 4 | Narration scripts built locally — no Groq |
| `voice/toneMatcher.js` | 4 | Tone → ElevenLabs voice ID |
| `voice/audioSynchronizer.js` | 4 | Trim/pad audio to exact durations |
| `composer/sceneSequencer.js` | 5 | Frame range + duration calc |
| `composer/videoRenderer.js` | 5 | Remotion CLI headless render |
| `composer/mp4Exporter.js` | 5 | ffmpeg H.264/AAC MP4 mux |

---

## 🛠️ Tech Stack

| Layer | Technology | Detail |
|---|---|---|
| Frontend UI | React + TailwindCSS | Input + preview interface |
| Motion Graphics | Remotion | Scene components + frame render |
| Agent Framework | **ReAct** (custom) | Thought → Action → Observe loop |
| LLM Inference | **Groq API** | Primary: `llama-3.3-70b-versatile` · Fallback: `llama-3.1-8b-instant` |
| Rate Limiting | `groqClient.js` | Token cap, backoff, fallback, daily tracker |
| Voiceover | ElevenLabs API | Voice narration per scene |
| Agent Dev | Google Antigravity | AI-assisted module coding |
| Video Encoding | **ffmpeg** | Audio/video mux |
| Rendering | Remotion CLI (headless) | PNG frame sequence + compose |

---

## 📁 Project Structure

```
ai-video-agent/
├── src/
│   ├── agent/
│   │   ├── agentOrchestrator.js
│   │   ├── groqClient.js          ← NEW: rate-limit wrapper
│   │   ├── tokenEstimator.js      ← NEW: pre-call token guard
│   │   ├── toolRegistry.js
│   │   ├── stateManager.js
│   │   ├── promptParser.js
│   │   ├── featureExtractor.js
│   │   └── scenePlanner.js
│   ├── scenes/
│   │   ├── TitleScene.jsx
│   │   ├── ProductScene.jsx
│   │   ├── FeatureScene.jsx
│   │   ├── InfographicScene.jsx
│   │   ├── CTAScene.jsx
│   │   └── assetManager.js
│   ├── voice/
│   │   ├── scriptGenerator.js
│   │   ├── toneMatcher.js
│   │   └── audioSynchronizer.js
│   ├── composer/
│   │   ├── sceneSequencer.js
│   │   ├── videoRenderer.js
│   │   └── mp4Exporter.js
│   └── ui/
│       ├── PromptInput.jsx
│       ├── ImageUpload.jsx
│       └── PreviewPanel.jsx
├── public/
├── README.md
├── PRD.docx
└── package.json
```

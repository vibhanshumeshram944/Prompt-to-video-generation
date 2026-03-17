// ─── COLOR SCHEME DEFINITIONS ────────────────────────────────────────────────
const COLOR_SCHEMES = {
  deep_electric: {
    key: "deep_electric",
    background: "#0a0a1a",
    primary: "#4f46e5",
    secondary: "#7c3aed",
    accent: "#06b6d4",
    textPrimary: "#f8fafc",
    textSecondary: "#94a3b8",
    mood: ["tech", "ai", "digital", "software", "data", "neural", "cyber", "app", "platform"]
  },
  solar_energy: {
    key: "solar_energy",
    background: "#0c0a00",
    primary: "#f59e0b",
    secondary: "#ef4444",
    accent: "#fbbf24",
    textPrimary: "#fefce8",
    textSecondary: "#fde68a",
    mood: ["energy", "power", "performance", "speed", "fast", "sports", "car", "engine", "drive", "race"]
  },
  nature_pulse: {
    key: "nature_pulse",
    background: "#021a0a",
    primary: "#10b981",
    secondary: "#059669",
    accent: "#34d399",
    textPrimary: "#ecfdf5",
    textSecondary: "#a7f3d0",
    mood: ["nature", "eco", "green", "environment", "plant", "organic", "health", "wellness", "rain", "water", "outdoor", "raincoat", "jacket"]
  },
  midnight_luxury: {
    key: "midnight_luxury",
    background: "#080810",
    primary: "#c084fc",
    secondary: "#a855f7",
    accent: "#e879f9",
    textPrimary: "#fdf4ff",
    textSecondary: "#e9d5ff",
    mood: ["luxury", "premium", "fashion", "beauty", "elegant", "watch", "jewel", "perfume", "brand", "smartwatch", "designer"]
  },
  arctic_clean: {
    key: "arctic_clean",
    background: "#020617",
    primary: "#38bdf8",
    secondary: "#0ea5e9",
    accent: "#7dd3fc",
    textPrimary: "#f0f9ff",
    textSecondary: "#bae6fd",
    mood: ["clean", "minimal", "medical", "pure", "fresh", "clarity", "focus", "productivity", "saas", "tool", "utility"]
  },
  ember_bold: {
    key: "ember_bold",
    background: "#0f0500",
    primary: "#f97316",
    secondary: "#dc2626",
    accent: "#fb923c",
    textPrimary: "#fff7ed",
    textSecondary: "#fed7aa",
    mood: ["food", "restaurant", "spicy", "drink", "beverage", "coffee", "flavor", "taste", "snack", "cuisine"]
  },
  neon_night: {
    key: "neon_night",
    background: "#000008",
    primary: "#a3e635",
    secondary: "#4ade80",
    accent: "#facc15",
    textPrimary: "#fafafa",
    textSecondary: "#d4d4d4",
    mood: ["music", "entertainment", "game", "gaming", "fun", "party", "festival", "creative", "art", "dance", "headphones", "earbuds", "audio"]
  },
  steel_corporate: {
    key: "steel_corporate",
    background: "#0a0f1a",
    primary: "#64748b",
    secondary: "#475569",
    accent: "#94a3b8",
    textPrimary: "#f1f5f9",
    textSecondary: "#cbd5e1",
    mood: ["finance", "business", "corporate", "investment", "bank", "money", "trust", "professional", "enterprise", "b2b"]
  }
};

// ─── TONE DIRECT MATCH MAP ───────────────────────────────────────────────────
const TONE_MAP = {
  premium: "midnight_luxury",
  luxury: "midnight_luxury",
  elegant: "midnight_luxury",
  energetic: "solar_energy",
  bold: "solar_energy",
  intense: "solar_energy",
  fast: "solar_energy",
  clean: "arctic_clean",
  minimal: "arctic_clean",
  focused: "arctic_clean",
  calm: "arctic_clean",
  fun: "neon_night",
  playful: "neon_night",
  creative: "neon_night",
  vibrant: "neon_night",
  corporate: "steel_corporate",
  professional: "steel_corporate",
  trusted: "steel_corporate",
  natural: "nature_pulse",
  organic: "nature_pulse",
  eco: "nature_pulse",
};

// ─── RESOLVER ────────────────────────────────────────────────────────────────
export function resolveColorScheme(featureOutput) {
  let resolvedScheme = null;

  // Stage 1 — Tone direct match (check this first)
  // Guard: tone may be undefined or non-string
  const tone = (featureOutput.tone || "").toLowerCase().trim();

  if (tone && TONE_MAP[tone]) {
    resolvedScheme = COLOR_SCHEMES[TONE_MAP[tone]];
  }

  // Stage 2 — Keyword scoring (only if Stage 1 produced no match)
  if (!resolvedScheme) {
    // Guards: product and features may be missing
    const product  = (featureOutput.product  || "").toLowerCase();
    const features = (featureOutput.features || []).join(" ").toLowerCase();
    const searchStr = `${product} ${features}`;

    let bestScore = 0;
    let bestScheme = null;

    for (const schemeKey of Object.keys(COLOR_SCHEMES)) {
      const scheme = COLOR_SCHEMES[schemeKey];
      let score = 0;
      for (const keyword of scheme.mood) {
        if (searchStr.includes(keyword)) {
          score++;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestScheme = scheme;
      }
    }

    if (bestScore > 0) {
      resolvedScheme = bestScheme;
    }
  }

  // Stage 3 — Default (only if all Stage 2 scores are 0)
  if (!resolvedScheme) {
    resolvedScheme = COLOR_SCHEMES["deep_electric"];
  }

  // Strip mood before returning — never null or undefined
  const { mood, ...schemeWithoutMood } = resolvedScheme;
  return schemeWithoutMood;
}

// ─── TONE MATCHER ────────────────────────────────────────────────────────────
// Maps color scheme keys to ElevenLabs pre-made voice IDs.
// IMPORTANT: All voices below are official ElevenLabs pre-made voices, which
// are available on the FREE tier. Do NOT use Voice Library voices (paid-only).
//
// Full list of free pre-made voices: https://api.elevenlabs.io/v1/voices
//   Sarah  EXAVITQu4vr4xnSDxMaL  — warm, storytelling
//   Laura  FGY2WhTYpPnrIDTdsKH5  — upbeat, friendly
//   Charlie IKne3meq5aSn9XLyUdCD — casual, conversational
//   George JBFqnCBsd6RMkjVDRZzb  — authoritative, calm
//   Callum N2lVS1w4EtoT3dr4eOWO  — neutral, versatile
//   Liam   TX3LPaxmHKxFdv7VOQHJ  — energetic, youthful
//   Charlotte XB0fDUnXU5powFXDhCwa — elegant, refined
//   Alice  Xb7hH8MSUJpSbSDYk0k2  — clear, professional

export function resolveVoiceId(colorSchemeKey) {
  const map = {
    // Pre-made voice assignment per color scheme / mood
    midnight_luxury:  "XB0fDUnXU5powFXDhCwa", // Charlotte — elegant, refined
    solar_energy:     "TX3LPaxmHKxFdv7VOQHJ", // Liam      — energetic, youthful
    neon_night:       "IKne3meq5aSn9XLyUdCD",  // Charlie   — casual, expressive
    nature_pulse:     "EXAVITQu4vr4xnSDxMaL",  // Sarah     — warm, grounded
    arctic_clean:     "Xb7hH8MSUJpSbSDYk0k2",  // Alice     — clear, precise
    ember_bold:       "JBFqnCBsd6RMkjVDRZzb",  // George    — bold, authoritative
    steel_corporate:  "N2lVS1w4EtoT3dr4eOWO",  // Callum    — steady, professional
    deep_electric:    "FGY2WhTYpPnrIDTdsKH5",  // Laura     — upbeat, friendly (default)
  };

  // colorSchemeKey may be undefined — ?? falls back to deep_electric's voice
  return map[colorSchemeKey] ?? map["deep_electric"];
}

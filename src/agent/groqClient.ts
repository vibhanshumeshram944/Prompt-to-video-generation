import { ChatGroq } from "@langchain/groq";

// Primary powerful model for complex reasoning
export const getPrimaryModel = (apiKey?: string) => new ChatGroq({
  model: "llama-3.3-70b-versatile",
  maxTokens: 2048, // strict cap as per PRD but raised because JSON was being cut off
  maxRetries: 3, // langchains built-in 429 backoff
  apiKey: apiKey || process.env.GROK_API_KEY,
});

// Fallback model if 70b hits limit despite retries
export const getFallbackModel = (apiKey?: string) => new ChatGroq({
  model: "llama-3.1-8b-instant",
  maxTokens: 2048,
  maxRetries: 3,
  apiKey: apiKey || process.env.GROK_API_KEY,
});

// We can use Langchains withFallbacks
export const getAgentLLM = (apiKey?: string) => {
    const primary = getPrimaryModel(apiKey);
    const fallback = getFallbackModel(apiKey);
    return primary.withFallbacks([fallback]);
};

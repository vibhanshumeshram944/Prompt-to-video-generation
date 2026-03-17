import { State } from "../state/state.js";
import { resolveColorScheme } from "../colorSchemeResolver.js";

// Pure local logic node — zero API calls.
// Runs after featureExtractor, before scenePlanner.
export const colorSchemeResolverNode = async (state: State): Promise<Partial<State>> => {
  if (!state.productInfo) throw new Error("Missing product info for color scheme resolution");

  const colorScheme = resolveColorScheme(state.productInfo);

  return {
    colorScheme,
  };
};

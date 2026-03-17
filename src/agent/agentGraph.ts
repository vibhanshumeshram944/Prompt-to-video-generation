import { StateGraph } from "@langchain/langgraph";
import { AgentState } from "./state/state.js";
import { featureExtractorNode, scenePlannerNode } from "./nodes/aiNodes.js";
import { colorSchemeResolverNode } from "./nodes/colorSchemeResolverNode.js";
import { audioGeneratorNode, videoRenderFinalNode } from "./nodes/mediaNodes.js";

const builder = new StateGraph(AgentState)
  .addNode("featureExtractor", featureExtractorNode)
  .addNode("colorSchemeResolver", colorSchemeResolverNode)
  .addNode("scenePlanner", scenePlannerNode)
  .addNode("audioGenerator", audioGeneratorNode)
  .addNode("videoRenderer", videoRenderFinalNode)

  // Define continuous execution path
  // Total Groq calls per run: exactly 2 (featureExtractor + scenePlanner)
  // colorSchemeResolver is pure local logic — zero API calls
  .addEdge("__start__", "featureExtractor")
  .addEdge("featureExtractor", "colorSchemeResolver")
  .addEdge("colorSchemeResolver", "scenePlanner")
  .addEdge("scenePlanner", "audioGenerator")
  .addEdge("audioGenerator", "videoRenderer")
  .addEdge("videoRenderer", "__end__");

export const aiVideoAgentGraph = builder.compile();

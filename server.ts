import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// LangGraph imports
import { aiVideoAgentGraph } from './src/agent/agentGraph.js';

dotenv.config();

const app = express();
const port = process.env.BACKEND_PORT || 3002;

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.static('public'));

app.post('/api/run-agent', async (req, res) => {
  try {
    const { prompt, imageBase64 } = req.body;

    // Run the LangGraph
    const finalState = await aiVideoAgentGraph.invoke({
      goal: prompt,
      imageBase64,
    });

    res.json({
      success: true,
      scenes: finalState.sceneManifest,
      totalDurationSec: finalState.totalDurationSec,
      videoUrl: finalState.finalVideoUrl
    });
  } catch (error: any) {
    console.error('Agent Graph Error:', error);
    res.status(500).json({ error: error.message || 'Failed to run agent' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Advanced LangGraph Backend running at http://localhost:${port}`);
});

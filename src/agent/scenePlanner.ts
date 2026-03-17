import axios from 'axios';

export interface VideoPlan {
  scenes: Array<{
    id: string;
    durationSec: number;
    label: string;
    motionGraphic: {
      shapeVocabulary: string;
      movementBehavior: string;
      thematicLink: string;
      layerPosition: string;
      imageIntegration: boolean;
    };
    text: {
      headline: string;
      subtext?: string;
    };
    voiceLine: string;
    animationStyle: string;
    colorScheme: {
      key: string;
      background: string;
      primary: string;
      secondary: string;
      accent: string;
      textPrimary: string;
      textSecondary: string;
    };
  }>;
  totalDurationSec?: number;
  prompt: string;
  imageProvided: boolean;
  videoUrl?: string;
}

export const planScenes = async (prompt: string, imageBase64?: string): Promise<VideoPlan> => {
  try {
    const response = await axios.post('http://localhost:3002/api/run-agent', {
      prompt,
      imageBase64
    });

    if (!response.data || !response.data.success) {
      throw new Error(response.data?.error || 'Failed to generate video via agent');
    }

    const { scenes, videoUrl, totalDurationSec } = response.data;

    return {
      scenes,
      totalDurationSec,
      prompt,
      imageProvided: !!imageBase64,
      videoUrl
    };
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Agent error:', error.response?.data || error.message);
    } else {
      console.error('Agent error:', error);
    }
    throw new Error('Could not generate video via LangGraph agent.');
  }
};

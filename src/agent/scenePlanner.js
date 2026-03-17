import axios from 'axios';

export const planScenes = async (prompt, imageBase64) => {
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
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Agent error:', error.response?.data || error.message);
    } else {
      console.error('Agent error:', error);
    }
    throw new Error('Could not generate video via LangGraph agent.');
  }
};

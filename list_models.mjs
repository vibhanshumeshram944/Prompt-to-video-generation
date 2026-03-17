import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
  try {
    const res = await axios.get('https://api.x.ai/v1/models', {
      headers: { 'Authorization': `Bearer ${process.env.GROK_API_KEY}` }
    });
    console.log(JSON.stringify(res.data.data.map(m => m.id), null, 2));
  } catch (err) {
    console.error('ERROR:', err.response?.data || err.message);
  }
}

listModels();

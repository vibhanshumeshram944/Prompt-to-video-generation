import axios from 'axios';

async function test() {
  try {
    const res = await axios.post('http://localhost:3002/api/chat', {
      messages: [{ role: 'system', content: 'You are a helpful assistant. Output JSON.' }, { role: 'user', content: 'test' }]
    });
    console.log('SUCCESS:', res.data);
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      console.error('ERROR: Connection refused. Server is not running on 3002.');
    } else {
      console.error('ERROR RESPONSE:', err.response?.data || err.message);
    }
  }
}

test();

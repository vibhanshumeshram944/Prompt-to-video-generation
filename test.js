const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('http://localhost:3002/api/chat', {
      messages: [{ role: 'system', content: 'You are a helpful assistant.' }, { role: 'user', content: 'test' }]
    });
    console.log('SUCCESS:', res.data);
  } catch (err) {
    console.error('ERROR RESPONSE:', err.response?.data || err.message);
  }
}

test();

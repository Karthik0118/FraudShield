const axios = require('axios');

async function test() {
  console.log('=== SMS FRAUD DETECTION END-TO-END TEST ===\n');

  // Step 1: Login
  console.log('Step 1: Logging in...');
  let token;
  try {
    const loginRes = await axios.post('http://127.0.0.1:5000/api/auth/login', {
      email: 'rrkarthik015@gmail.com',
      password: 'Itskarthik9@'
    });
    token = loginRes.data.data.accessToken;
    console.log('  Login SUCCESS. User:', loginRes.data.data.user.name);
    console.log('  Token (first 20 chars):', token.substring(0, 20) + '...');
  } catch (err) {
    console.error('  Login FAILED:', err.response ? err.response.data : err.message);
    return;
  }

  // Step 2: Test SMS detect with token
  console.log('\nStep 2: Calling POST /api/sms/detect...');
  try {
    const smsRes = await axios.post('http://127.0.0.1:5000/api/sms/detect', {
      text: 'Congratulations! You have won Rs. 50,000. Click this link to claim your prize.'
    }, {
      headers: { Authorization: 'Bearer ' + token },
      timeout: 30000
    });
    console.log('  SMS Detect SUCCESS!');
    console.log('  Full response:', JSON.stringify(smsRes.data, null, 2));
  } catch (err) {
    console.error('  SMS Detect FAILED:', err.response ? JSON.stringify(err.response.data) : err.message);
    console.error('  Status:', err.response ? err.response.status : 'N/A');
  }

  // Step 3: Test refresh token
  console.log('\nStep 3: Testing refresh token...');
  try {
    const loginRes2 = await axios.post('http://127.0.0.1:5000/api/auth/login', {
      email: 'rrkarthik015@gmail.com',
      password: 'Itskarthik9@'
    });
    const refreshToken = loginRes2.data.data.refreshToken;
    const refreshRes = await axios.post('http://127.0.0.1:5000/api/auth/refresh-token', {
      refreshToken: refreshToken
    });
    console.log('  Refresh SUCCESS:', refreshRes.data.success);
  } catch (err) {
    console.error('  Refresh FAILED:', err.response ? JSON.stringify(err.response.data) : err.message);
  }

  console.log('\n=== TEST COMPLETE ===');
}
test();

/**
 * Simple API test script to verify endpoints
 */
import axios from 'axios';

const EXPRESS_URL = 'http://localhost:8000';
const FASTAPI_URL = 'http://localhost:5001';

const testExpressEndpoints = async () => {
  try {
    console.log('Testing Express endpoints...');
    
    // Test /user/profile GET endpoint
    try {
      const profileResponse = await axios.get(`${EXPRESS_URL}/user/profile`);
      console.log('GET /user/profile success:', profileResponse.status);
    } catch (e) {
      if (e.response?.status === 404) {
        console.log('GET /user/profile returned 404 (expected for new users)');
      } else {
        console.error('GET /user/profile error:', e.message);
      }
    }
    
    // Test /weights GET endpoint
    try {
      const weightsResponse = await axios.get(`${EXPRESS_URL}/weights?userId=user123`);
      console.log('GET /weights success:', weightsResponse.status, `(${weightsResponse.data.length} entries)`);
    } catch (e) {
      console.error('GET /weights error:', e.message);
    }
    
    // Test /goals/active GET endpoint
    try {
      const goalsResponse = await axios.get(`${EXPRESS_URL}/goals/active`);
      console.log('GET /goals/active success:', goalsResponse.status);
    } catch (e) {
      console.error('GET /goals/active error:', e.message);
    }
    
  } catch (e) {
    console.error('Express test error:', e.message);
  }
};

const testFastApiEndpoints = async () => {
  try {
    console.log('\nTesting FastAPI endpoints...');
    
    // Test /user/profile GET endpoint
    try {
      const profileResponse = await axios.get(`${FASTAPI_URL}/user/profile`);
      console.log('GET /user/profile success:', profileResponse.status);
    } catch (e) {
      if (e.response?.status === 404) {
        console.log('GET /user/profile returned 404 (expected for new users)');
      } else {
        console.error('GET /user/profile error:', e.message);
      }
    }
    
    // Test root endpoint
    try {
      const rootResponse = await axios.get(`${FASTAPI_URL}/`);
      console.log('GET / success:', rootResponse.status);
    } catch (e) {
      console.error('GET / error:', e.message);
    }
    
  } catch (e) {
    console.error('FastAPI test error:', e.message);
  }
};

const runTests = async () => {
  await testExpressEndpoints();
  await testFastApiEndpoints();
};

runTests().then(() => {
  console.log('\nAPI tests completed.');
}); 
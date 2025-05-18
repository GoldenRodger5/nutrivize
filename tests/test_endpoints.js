// API Endpoint Test Script
// This test script verifies that the key API endpoints for the Food Index functionality work

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:5001';
const AUTH_TOKEN = 'eyJhbGciOi...'; // Replace with your actual auth token

// Test data
const TEST_FOOD = {
  name: 'Test Food Item',
  serving_size: 100,
  serving_unit: 'g',
  calories: 150,
  proteins: 10,
  carbs: 20,
  fats: 5,
  fiber: 3
};

// Helper function for API requests
async function apiRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  console.log(`Making ${method} request to ${endpoint}`);
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    console.log(`Response status: ${response.status}`);
    
    // Parse JSON response if possible
    let responseData;
    try {
      responseData = await response.json();
    } catch (e) {
      responseData = await response.text();
    }
    
    return { status: response.status, data: responseData };
  } catch (error) {
    console.error(`Error making request to ${endpoint}:`, error.message);
    return { status: 0, error: error.message };
  }
}

// Main test function
async function runTests() {
  console.log('=== STARTING API ENDPOINT TESTS ===');
  const results = [];
  
  // Test 1: Get foods endpoint
  try {
    console.log('\nTest 1: GET /api/foods');
    const getFoodsResult = await apiRequest('/api/foods');
    
    if (getFoodsResult.status === 200 && Array.isArray(getFoodsResult.data)) {
      console.log('✅ GET /api/foods: Success');
      console.log(`Found ${getFoodsResult.data.length} food items`);
      results.push({ test: 'GET /api/foods', passed: true });
    } else {
      console.log('❌ GET /api/foods: Failed');
      console.log('Response:', getFoodsResult);
      results.push({ test: 'GET /api/foods', passed: false, error: 'Invalid response' });
    }
  } catch (error) {
    console.error('Error in Test 1:', error);
    results.push({ test: 'GET /api/foods', passed: false, error: error.message });
  }
  
  // Test 2: Create food endpoint
  try {
    console.log('\nTest 2: POST /api/foods/');
    const createFoodResult = await apiRequest('/api/foods/', 'POST', TEST_FOOD);
    
    if (createFoodResult.status === 200 || createFoodResult.status === 201) {
      console.log('✅ POST /api/foods/: Success');
      console.log('Created food item:', createFoodResult.data);
      
      // Save the created food ID for later tests
      const createdFoodId = createFoodResult.data._id || createFoodResult.data.id;
      results.push({ test: 'POST /api/foods/', passed: true, foodId: createdFoodId });
      
      // Test 3: Update food endpoint
      if (createdFoodId) {
        try {
          console.log('\nTest 3: PUT /api/foods/:id');
          const updateFoodResult = await apiRequest(`/api/foods/${createdFoodId}`, 'PUT', {
            ...TEST_FOOD,
            name: 'Updated Test Food Item'
          });
          
          if (updateFoodResult.status === 200) {
            console.log('✅ PUT /api/foods/:id: Success');
            results.push({ test: 'PUT /api/foods/:id', passed: true });
          } else {
            console.log('❌ PUT /api/foods/:id: Failed');
            console.log('Response:', updateFoodResult);
            results.push({ test: 'PUT /api/foods/:id', passed: false, error: 'Invalid response' });
          }
        } catch (error) {
          console.error('Error in Test 3:', error);
          results.push({ test: 'PUT /api/foods/:id', passed: false, error: error.message });
        }
        
        // Test 4: Delete food endpoint
        try {
          console.log('\nTest 4: DELETE /api/foods/:id');
          const deleteFoodResult = await apiRequest(`/api/foods/${createdFoodId}`, 'DELETE');
          
          if (deleteFoodResult.status === 200) {
            console.log('✅ DELETE /api/foods/:id: Success');
            results.push({ test: 'DELETE /api/foods/:id', passed: true });
          } else {
            console.log('❌ DELETE /api/foods/:id: Failed');
            console.log('Response:', deleteFoodResult);
            results.push({ test: 'DELETE /api/foods/:id', passed: false, error: 'Invalid response' });
          }
        } catch (error) {
          console.error('Error in Test 4:', error);
          results.push({ test: 'DELETE /api/foods/:id', passed: false, error: error.message });
        }
      }
    } else {
      console.log('❌ POST /api/foods/: Failed');
      console.log('Response:', createFoodResult);
      results.push({ test: 'POST /api/foods/', passed: false, error: 'Invalid response' });
    }
  } catch (error) {
    console.error('Error in Test 2:', error);
    results.push({ test: 'POST /api/foods/', passed: false, error: error.message });
  }
  
  // Print summary
  console.log('\n=== TEST RESULTS SUMMARY ===');
  const passedTests = results.filter(r => r.passed).length;
  console.log(`Passed: ${passedTests}/${results.length} tests`);
  
  for (const result of results) {
    console.log(`${result.passed ? '✅' : '❌'} ${result.test}: ${result.passed ? 'Passed' : 'Failed'}`);
    if (!result.passed && result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }
  
  console.log('\n=== TESTS COMPLETED ===');
}

// Run the tests
runTests().catch(error => {
  console.error('Unhandled error running tests:', error);
}); 
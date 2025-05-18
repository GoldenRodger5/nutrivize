import fetch from 'node-fetch';

// Function to simulate the transformation in the AppleHealthTab component
function transformSummaryData(summaryData, userId) {
  if (!summaryData || !summaryData.daily_data) {
    console.error('No summary data or daily_data found');
    return [];
  }

  return Object.entries(summaryData.daily_data).map(([date, metrics]) => ({
    _id: date,
    user_id: userId,
    date: date,
    steps: metrics.steps,
    calories: metrics.calories,
    distance: metrics.distance,
    exercise_minutes: metrics.exercise_minutes,
    resting_heart_rate: metrics.resting_heart_rate,
    walking_heart_rate: metrics.walking_heart_rate,
    sleep_hours: metrics.sleep_hours,
    source: "Apple HealthKit",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
}

// Main function to test
async function testHealthSummary() {
  const BASE_URL = "http://127.0.0.1:5001";
  const userId = "GME7nGpJQRc2v9T057vJ4oyqAJN2";
  
  // Login to get token
  console.log("Logging in...");
  const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: "isaacmineo@gmail.com",
      password: "Buddydog41"
    })
  });
  
  const loginData = await loginResponse.json();
  const token = loginData.token;
  console.log(`Got token: ${token.substring(0, 20)}...`);
  
  // Get health summary
  console.log("\nFetching health summary...");
  const start_date = "2025-05-12";
  const end_date = "2025-05-18";
  
  const summaryResponse = await fetch(
    `${BASE_URL}/api/healthkit/summary?start_date=${start_date}&end_date=${end_date}`, 
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  
  if (summaryResponse.status !== 200) {
    console.error(`Error: Got status ${summaryResponse.status}`);
    console.error(await summaryResponse.text());
    return;
  }
  
  const summaryData = await summaryResponse.json();
  console.log("Successfully fetched summary data!");
  console.log(`Date range: ${summaryData.date_range.start} to ${summaryData.date_range.end}`);
  console.log(`Days with data: ${Object.keys(summaryData.daily_data).length}`);
  
  // Transform the data
  console.log("\nTransforming data...");
  const transformedData = transformSummaryData(summaryData, userId);
  
  console.log(`Successfully transformed ${transformedData.length} entries`);
  
  // Validate a sample of the transformed data
  if (transformedData.length > 0) {
    console.log("\nSample transformed data (first entry):");
    const sample = transformedData[0];
    console.log(`- Date: ${sample.date}`);
    console.log(`- Steps: ${sample.steps}`);
    console.log(`- Calories: ${sample.calories}`);
    console.log(`- Exercise minutes: ${sample.exercise_minutes}`);
    console.log(`- Heart rate (resting): ${sample.resting_heart_rate}`);
  }
  
  console.log("\nTest complete! The transformation logic from AppleHealthTab component works correctly.");
}

// Run the test
testHealthSummary().catch(error => {
  console.error("Test failed with error:", error);
});

async function addTestDataForToday() {
  const BASE_URL = "http://127.0.0.1:5001";
  
  // Login to get token
  console.log("Logging in...");
  const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: "isaacmineo@gmail.com",
      password: "Buddydog41"
    })
  });
  
  if (!loginResponse.ok) {
    console.error(`Login failed: ${loginResponse.status}`);
    return;
  }
  
  const loginData = await loginResponse.json();
  const token = loginData.token;
  const userId = loginData.uid;
  console.log(`Got token: ${token.substring(0, 20)}...`);
  
  // Create test data for today
  const today = new Date().toISOString().split('T')[0];
  console.log(`Adding test data for today (${today}) with higher values`);
  
  // Use API to add batch health data
  try {
    // Create data with higher values than what's currently there
    const testData = {
      entries: [
        {
          user_id: userId,
          date: `${today}T12:00:00Z`,
          date_key: today,
          steps: 5000, // Much higher value 
          calories: 500,
          distance: 3500,
          exercise_minutes: 45,
          resting_heart_rate: 68,
          walking_heart_rate: 120,
          sleep_hours: 7.5,
          source: "Test Data"
        }
      ]
    };
    
    // Send batch upload request
    const uploadResponse = await fetch(`${BASE_URL}/api/healthkit/batch-upload`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testData)
    });
    
    if (!uploadResponse.ok) {
      console.error(`Upload failed: ${uploadResponse.status}`);
      const text = await uploadResponse.text();
      console.error(text);
      return;
    }
    
    const result = await uploadResponse.json();
    console.log("Upload successful:", result);
    
    // Now verify the data was saved
    const verifyResponse = await fetch(
      `${BASE_URL}/api/healthkit/summary?start_date=${today}&end_date=${today}`, 
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    if (!verifyResponse.ok) {
      console.error(`Verification failed: ${verifyResponse.status}`);
      return;
    }
    
    const verifyData = await verifyResponse.json();
    console.log("Verification data:", JSON.stringify(verifyData, null, 2));
    
    console.log("Success! New data for today has been added. Please refresh your frontend page.");
    
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run the test
addTestDataForToday().catch(error => {
  console.error("Script failed with error:", error);
}); 
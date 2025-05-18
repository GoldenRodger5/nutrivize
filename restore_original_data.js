import fetch from 'node-fetch';

async function restoreOriginalData() {
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
  
  // Restore original data for today
  const today = "2025-05-18";
  console.log(`Restoring original data for ${today}`);
  
  // Original values from our initial check
  const testData = {
    entries: [
      {
        user_id: userId,
        date: `${today}T12:00:00Z`,
        date_key: today,
        steps: 833.0,
        calories: 132.55900000000005,
        distance: 606.6246590417577,
        exercise_minutes: 4.0,
        resting_heart_rate: 64.0,
        walking_heart_rate: 94.0,
        sleep_hours: 0.0,
        source: "Apple HealthKit (iOS)"
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
    console.error(`Restore failed: ${uploadResponse.status}`);
    const text = await uploadResponse.text();
    console.error(text);
    return;
  }
  
  const result = await uploadResponse.json();
  console.log("Data restored successfully:", result);
  
  // Verify the data was saved
  const verifyResponse = await fetch(
    `${BASE_URL}/api/healthkit/summary?start_date=${today}&end_date=${today}`, 
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  
  if (!verifyResponse.ok) {
    console.error(`Verification failed: ${verifyResponse.status}`);
    return;
  }
  
  const verifyData = await verifyResponse.json();
  console.log("Verified data:", JSON.stringify(verifyData.daily_data, null, 2));
}

// Run the script
restoreOriginalData().catch(error => {
  console.error("Script failed with error:", error);
}); 
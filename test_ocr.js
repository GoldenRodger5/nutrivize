#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { fileURLToPath } from 'url';

// Get current file directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the image file
const imagePath = path.join(__dirname, 'NutritionLabel-Tortilla.png');

// Valid token from our test login
const AUTH_TOKEN = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjNmOWEwNTBkYzRhZTgyOGMyODcxYzMyNTYzYzk5ZDUwMjc3ODRiZTUiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiVGVzdCBVc2VyIiwiaXNzIjoiaHR0cHM6Ly9zZWN1cmV0b2tlbi5nb29nbGUuY29tL2Zvb2QtdHJhY2tlci02MDk2ZCIsImF1ZCI6ImZvb2QtdHJhY2tlci02MDk2ZCIsImF1dGhfdGltZSI6MTc0NjMyNDUyMSwidXNlcl9pZCI6IjVqbFByODNza3ZOSk1lUEdRQ1dDNDZOcTVMUzIiLCJzdWIiOiI1amxQcjgzc2t2TkpNZVBHUUNXQzQ2TnE1TFMyIiwiaWF0IjoxNzQ2MzI0NTIxLCJleHAiOjE3NDYzMjgxMjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJ0ZXN0QGV4YW1wbGUuY29tIl19LCJzaWduX2luX3Byb3ZpZGVyIjoicGFzc3dvcmQifX0.NyDqxmixcc1EeV54p6SR32M6FTPn9-DUPS1jGLOZqzEiEJQq1462fAZjd-0-kYBtpmZbWzcIZkNWZgFS4GkPTbIxuMc4CJG3puMw39e0CN-e18DH6OxobIQG6KAwt8vrJxntTNrm6p8JnZeLNih4HV69s3Ui_8KnjcIvp2sfRVVHA5u0wM2DfTnRq9bQk9qjhomNMuFxwtMQqjFF77QT5L9tkUNV88s2cGZCn5MgCa3LL4eUcUwEQjp5L_kzvkHJTnEgJky9wLoOeGEson1DfIufBqu1yGOx21avMHyAXqRIHsnuI_ynoxhYdcVl_XHcgPRApmBxKGgFAKItK96Byw";

async function testOCR() {
  try {
    // Create a form with the image file
    const form = new FormData();
    form.append('file', fs.createReadStream(imagePath));

    // Make request to the OCR endpoint
    console.log('Sending image to OCR service...');
    const response = await fetch('http://localhost:5001/nutrition-label/upload', {
      method: 'POST',
      body: form,
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });

    // Process the response
    const result = await response.json();
    
    // Display results
    console.log('\nOCR Test Results:');
    console.log('Status:', response.status, response.statusText);
    
    if (response.ok) {
      console.log('\nRaw OCR Text:');
      console.log(result.raw_text);
      
      console.log('\nExtracted Nutrition Info:');
      console.log(JSON.stringify(result.nutrition_info, null, 2));
    } else {
      console.log('Error:', result);
    }
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testOCR().catch(console.error); 
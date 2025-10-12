#!/usr/bin/env node

/**
 * SMS Forwarder Test Script
 * 
 * This script helps test your SMS Forwarder configuration
 * by simulating SMS data and sending it to your configured endpoints.
 */

const https = require('https');
const http = require('http');

// Test configuration
const testConfig = {
  restApi: {
    url: 'https://your-api.com/sms',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer your-token'
    }
  },
  telegram: {
    botToken: '123456789:ABCdefGHIjklMNOpqrsTUVwxyz',
    chatId: '123456789'
  }
};

// Sample SMS data
const sampleSMS = {
  message: 'Test SMS message from SMS Forwarder',
  sender: '+1234567890',
  timestamp: Date.now().toString(),
  dateSent: Date.now().toString(),
  receivedAt: new Date().toISOString()
};

/**
 * Test REST API endpoint
 */
async function testRestAPI() {
  console.log('Testing REST API...');
  
  return new Promise((resolve, reject) => {
    const url = new URL(testConfig.restApi.url);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: testConfig.restApi.method,
      headers: testConfig.restApi.headers
    };
    
    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('✅ REST API test successful');
          console.log('Response:', data);
          resolve(data);
        } else {
          console.log('❌ REST API test failed');
          console.log('Status:', res.statusCode);
          console.log('Response:', data);
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ REST API test failed');
      console.log('Error:', error.message);
      reject(error);
    });
    
    req.write(JSON.stringify(sampleSMS));
    req.end();
  });
}

/**
 * Test Telegram bot
 */
async function testTelegram() {
  console.log('Testing Telegram bot...');
  
  return new Promise((resolve, reject) => {
    const message = `📱 *Test SMS from SMS Forwarder*\n\n` +
      `📞 *From:* ${sampleSMS.sender}\n` +
      `📅 *Date:* ${new Date(parseInt(sampleSMS.timestamp)).toLocaleString()}\n` +
      `💬 *Message:*\n${sampleSMS.message}`;
    
    const postData = JSON.stringify({
      chat_id: testConfig.telegram.chatId,
      text: message,
      parse_mode: 'Markdown'
    });
    
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${testConfig.telegram.botToken}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const response = JSON.parse(data);
        if (response.ok) {
          console.log('✅ Telegram test successful');
          console.log('Message ID:', response.result.message_id);
          resolve(response);
        } else {
          console.log('❌ Telegram test failed');
          console.log('Error:', response.description);
          reject(new Error(response.description));
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Telegram test failed');
      console.log('Error:', error.message);
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🚀 Starting SMS Forwarder Configuration Tests\n');
  
  try {
    await testRestAPI();
  } catch (error) {
    console.log('REST API test failed:', error.message);
  }
  
  console.log('');
  
  try {
    await testTelegram();
  } catch (error) {
    console.log('Telegram test failed:', error.message);
  }
  
  console.log('\n✨ Tests completed!');
}

// Run tests if this script is executed directly
if (require.main === module) {
  console.log('⚠️  Please update the test configuration in this script before running tests.');
  console.log('Edit the testConfig object with your actual API URL, headers, and Telegram credentials.\n');
  
  // Uncomment the line below to run tests
  // runTests();
}

module.exports = {
  testRestAPI,
  testTelegram,
  runTests,
  sampleSMS
};

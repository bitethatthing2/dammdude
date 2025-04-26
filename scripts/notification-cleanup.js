#!/usr/bin/env node

/**
 * Notification System Cleanup Script
 * 
 * This script helps test and maintain the notification system by:
 * 1. Cleaning up invalid FCM tokens
 * 2. Sending test notifications to verify delivery
 * 3. Providing detailed diagnostics about the notification system
 */

const fetch = require('node-fetch');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configuration
const API_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const NOTIFICATION_ENDPOINT = `${API_URL}/api/send-notification`;

/**
 * Display the main menu
 */
function showMenu() {
  console.log('\n=== Notification System Maintenance ===');
  console.log('1. Clean up invalid FCM tokens');
  console.log('2. Send test notification to all devices');
  console.log('3. Check notification system status');
  console.log('4. Exit');
  
  rl.question('\nSelect an option (1-4): ', handleMenuSelection);
}

/**
 * Handle menu selection
 */
async function handleMenuSelection(choice) {
  switch (choice) {
    case '1':
      await cleanupTokens();
      break;
    case '2':
      await sendTestNotification();
      break;
    case '3':
      await checkSystemStatus();
      break;
    case '4':
      console.log('Exiting...');
      rl.close();
      return;
    default:
      console.log('Invalid option. Please try again.');
  }
  
  // Return to menu after operation completes
  showMenu();
}

/**
 * Clean up invalid FCM tokens
 */
async function cleanupTokens() {
  console.log('\nCleaning up invalid FCM tokens...');
  
  try {
    const response = await fetch(NOTIFICATION_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Token Cleanup',
        body: 'Cleaning up invalid tokens',
        action: 'cleanup_tokens'
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log(`\n✅ Successfully cleaned up ${data.removed} invalid tokens out of ${data.total} total tokens.`);
    } else {
      console.error(`\n❌ Failed to clean up tokens: ${data.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error(`\n❌ Error cleaning up tokens: ${error.message}`);
  }
}

/**
 * Send a test notification to all devices
 */
async function sendTestNotification() {
  console.log('\nSending test notification to all devices...');
  
  try {
    const response = await fetch(NOTIFICATION_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Notification',
        body: `Test notification sent at ${new Date().toLocaleTimeString()}`,
        sendToAll: true,
        data: {
          type: 'test',
          timestamp: new Date().toISOString()
        }
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log(`\n✅ Test notification sent successfully!`);
      console.log(`   Recipients: ${data.recipients}`);
      console.log(`   Failures: ${data.failures}`);
      console.log(`   Total tokens: ${data.totalTokens}`);
      
      if (data.invalidTokensRemoved > 0) {
        console.log(`   Invalid tokens removed: ${data.invalidTokensRemoved}`);
      }
    } else {
      console.error(`\n❌ Failed to send test notification: ${data.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error(`\n❌ Error sending test notification: ${error.message}`);
  }
}

/**
 * Check notification system status
 */
async function checkSystemStatus() {
  console.log('\nChecking notification system status...');
  
  try {
    // First check if we can reach the API
    const response = await fetch(`${API_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    }).catch(() => ({ ok: false }));
    
    if (!response.ok) {
      console.error('\n❌ API server is not reachable. Make sure the Next.js server is running.');
      return;
    }
    
    console.log('\n✅ API server is reachable.');
    
    // Now check Firebase configuration
    console.log('\nChecking Firebase configuration...');
    
    // Send a minimal request to test Firebase connectivity
    const firebaseResponse = await fetch(NOTIFICATION_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'System Check',
        body: 'Checking system status',
        // Use a non-existent token to avoid actually sending a notification
        token: 'system-check-token'
      })
    });
    
    const firebaseData = await firebaseResponse.json();
    
    // Check if we got a specific Firebase error or a simulation response
    if (firebaseData.error && firebaseData.error.includes('Firebase')) {
      console.log('\n✅ Firebase is configured but returned an error:');
      console.log(`   ${firebaseData.error}`);
    } else if (firebaseData.simulated) {
      console.log('\n⚠️ Firebase is in simulation mode (development environment)');
    } else if (firebaseData.tokenRemoved) {
      console.log('\n✅ Firebase is properly configured and working');
    } else {
      console.log('\n✅ Firebase appears to be configured');
    }
    
    console.log('\nNotification system status check complete.');
  } catch (error) {
    console.error(`\n❌ Error checking system status: ${error.message}`);
  }
}

// Start the application
console.log(`Using API URL: ${API_URL}`);
showMenu();

/**
 * @deprecated This script is deprecated and will be removed in a future release.
 * Please use notification-cleanup.js instead, which provides more comprehensive
 * notification testing and management functionality.
 */

// Test script to send a notification
const fetch = require('node-fetch');

async function sendTestNotification() {
  try {
    console.log('⚠️ DEPRECATED: This script is deprecated. Please use notification-cleanup.js instead.');
    console.log('Sending test notification...');
    
    // Use the production URL instead of localhost
    const baseUrl = 'https://dammdude.vercel.app';
    
    const response = await fetch(`${baseUrl}/api/send-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Notification',
        body: 'This is a test notification from the script',
        sendToAll: true,
        image: '/icons/android-big-icon.png',
        link: '/',
        data: {
          type: 'test',
          timestamp: Date.now().toString()
        }
      }),
    });

    const data = await response.json();
    console.log('Response:', data);
    
    if (data.success) {
      console.log('✅ Test notification sent successfully!');
      
      if (data.recipients > 0) {
        console.log(`Delivered to ${data.recipients} devices`);
      } else {
        console.warn('⚠️ Warning: No devices received the notification');
        console.log('Details:');
        console.log(`- Total tokens: ${data.totalTokens || 0}`);
        console.log(`- Failures: ${data.failures || 0}`);
        console.log(`- Invalid tokens removed: ${data.invalidTokensRemoved || 0}`);
        
        console.log('\nPossible issues:');
        console.log('1. FCM tokens are expired or invalid');
        console.log('2. Devices are not connected to FCM');
        console.log('3. Firebase project configuration issues');
        console.log('\nTry testing with the browser test page at:');
        console.log(`${baseUrl}/test-notifications`);
      }
    } else {
      console.error('❌ Failed to send test notification:', data.error);
      console.error('Error details:', data.errorDetails || 'No additional details');
    }
  } catch (error) {
    console.error('Error sending test notification:', error);
  }
}

sendTestNotification();

// Test script to send a notification
const fetch = require('node-fetch');

async function sendTestNotification() {
  try {
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
      if (data.recipients) {
        console.log(`Delivered to ${data.recipients} devices`);
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

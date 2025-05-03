# Push Notification Edge Functions

This directory contains the Edge Functions required for sending push notifications via Firebase Cloud Messaging (FCM).

## Setup Instructions

### 1. Set Environment Variables

You need to set the following environment variables in your Supabase project:

```bash
# In Supabase Dashboard: Settings > API > Project API keys
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Firebase Service Account (JSON stringified)
FIREBASE_SERVICE_ACCOUNT=your_stringified_service_account_json
```

### 2. Prepare Firebase Service Account

1. Convert your `servicekey.json` file to a stringified JSON:

```bash
# On Windows PowerShell
$serviceAccount = Get-Content -Raw -Path "path\to\servicekey.json"
$encodedServiceAccount = $serviceAccount -replace "`n", "" -replace "`r", ""
```

2. Set the environment variable in Supabase:
   - Go to Supabase Dashboard > Settings > API
   - Add a new secret named `FIREBASE_SERVICE_ACCOUNT`
   - Paste the stringified JSON value

### 3. Deploy Edge Functions

```bash
supabase functions deploy send-notification
```

## Usage

The Edge Function supports two endpoints:

1. Send to specific device token:
   - `POST /functions/v1/send-notification/token`

2. Send to topic:
   - `POST /functions/v1/send-notification/topic`

### Request Format

```json
{
  "title": "Notification Title",
  "body": "Notification Message",
  "token": "device_fcm_token", // for token endpoint
  "topic": "topic_name", // for topic endpoint
  "link": "https://example.com/action",
  "image": "https://example.com/image.jpg",
  "icon": "https://example.com/icon.png",
  "badge": "https://example.com/badge.png",
  "linkButtonText": "View Details",
  "actionButton": "action_key",
  "actionButtonText": "Take Action",
  "data": {
    "orderId": "123",
    "customKey": "customValue"
  },
  "androidConfig": {
    "channelId": "default",
    "priority": "high"
  },
  "iosConfig": {
    "sound": "default",
    "badge": 1
  },
  "webConfig": {
    "requireInteraction": true
  }
}
```

## Important Notes

- Each device will only receive one notification (Firebase handles deduplication)
- Custom icons, images, and action buttons are supported
- The service worker will handle displaying notifications with the proper styling

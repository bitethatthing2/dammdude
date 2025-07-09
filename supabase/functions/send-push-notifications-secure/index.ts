import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FirebaseCredentials {
  project_id: string;
  private_key: string;
  client_email: string;
}

interface NotificationPayload {
  user_id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  link?: string;
  type?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate authorization
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Rate limiting check
    const rateLimitKey = `notifications:${new URL(req.url).searchParams.get('user_id') || 'anonymous'}`
    const { data: rateLimitData } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('key', rateLimitKey)
      .gte('expires_at', new Date().toISOString())
      .single()

    if (rateLimitData) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const payload: NotificationPayload = await req.json()

    // Validate required fields
    if (!payload.user_id || !payload.title || !payload.body) {
      throw new Error('Missing required fields: user_id, title, body')
    }

    // Get Firebase credentials from secure storage
    const { data: credentialsData, error: credentialsError } = await supabase
      .from('secure_credentials')
      .select('credentials')
      .eq('service_name', 'firebase')
      .single()

    if (credentialsError || !credentialsData) {
      console.error('Failed to get Firebase credentials:', credentialsError)
      throw new Error('Firebase credentials not found')
    }

    const firebaseCredentials: FirebaseCredentials = credentialsData.credentials

    // Get user's device tokens
    const { data: deviceTokens, error: tokensError } = await supabase
      .from('device_tokens')
      .select('*')
      .eq('user_id', payload.user_id)
      .eq('is_active', true)

    if (tokensError) {
      throw new Error(`Failed to get device tokens: ${tokensError.message}`)
    }

    if (!deviceTokens || deviceTokens.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active device tokens found for user' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get Firebase access token
    const accessToken = await getFirebaseAccessToken(firebaseCredentials)

    // Send notifications to each device
    const results = []
    
    for (const deviceToken of deviceTokens) {
      try {
        // Create push notification record
        const { data: notificationRecord, error: notificationError } = await supabase
          .from('push_notifications')
          .insert({
            user_id: payload.user_id,
            device_token_id: deviceToken.id,
            title: payload.title,
            body: payload.body,
            data: payload.data || {},
            link: payload.link,
            type: payload.type || 'general',
            priority: payload.priority || 'normal',
            status: 'pending'
          })
          .select()
          .single()

        if (notificationError) {
          console.error('Failed to create notification record:', notificationError)
          continue
        }

        // Send to Firebase FCM
        const fcmResponse = await sendToFirebase(
          accessToken,
          firebaseCredentials.project_id,
          deviceToken.token,
          payload,
          deviceToken.platform
        )

        if (fcmResponse.success) {
          // Update notification status
          await supabase
            .from('push_notifications')
            .update({
              status: 'sent',
              firebase_message_id: fcmResponse.message_id,
              sent_at: new Date().toISOString()
            })
            .eq('id', notificationRecord.id)

          // Update device token last used
          await supabase
            .from('device_tokens')
            .update({ last_used: new Date().toISOString() })
            .eq('id', deviceToken.id)

          results.push({ 
            device_token_id: deviceToken.id, 
            status: 'sent',
            message_id: fcmResponse.message_id 
          })
        } else {
          // Update notification status with error
          await supabase
            .from('push_notifications')
            .update({
              status: 'failed',
              error_message: fcmResponse.error,
              retry_count: 1
            })
            .eq('id', notificationRecord.id)

          // Update device token error count
          await supabase
            .from('device_tokens')
            .update({
              error_count: deviceToken.error_count + 1,
              last_error: fcmResponse.error
            })
            .eq('id', deviceToken.id)

          // Deactivate token if too many errors
          if (deviceToken.error_count >= 4) {
            await supabase
              .from('device_tokens')
              .update({ is_active: false })
              .eq('id', deviceToken.id)
          }

          results.push({ 
            device_token_id: deviceToken.id, 
            status: 'failed',
            error: fcmResponse.error 
          })
        }
      } catch (error) {
        console.error('Error processing device token:', error)
        results.push({ 
          device_token_id: deviceToken.id, 
          status: 'failed',
          error: error.message 
        })
      }
    }

    // Set rate limit
    await supabase
      .from('rate_limits')
      .upsert({
        key: rateLimitKey,
        count: 1,
        expires_at: new Date(Date.now() + 60000).toISOString() // 1 minute
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        sent_count: results.filter(r => r.status === 'sent').length,
        failed_count: results.filter(r => r.status === 'failed').length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in send-push-notifications-secure:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function getFirebaseAccessToken(credentials: FirebaseCredentials): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  }

  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  }

  // Create JWT
  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  
  const unsignedToken = `${encodedHeader}.${encodedPayload}`
  
  // Sign with private key
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    new TextEncoder().encode(credentials.private_key.replace(/\\n/g, '\n')),
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(unsignedToken)
  )

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  const jwt = `${unsignedToken}.${encodedSignature}`

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  })

  const tokenData = await tokenResponse.json()
  return tokenData.access_token
}

async function sendToFirebase(
  accessToken: string, 
  projectId: string, 
  deviceToken: string, 
  payload: NotificationPayload,
  platform: string
): Promise<{ success: boolean; message_id?: string; error?: string }> {
  try {
    const message = {
      token: deviceToken,
      notification: {
        title: payload.title,
        body: payload.body
      },
      data: {
        ...payload.data,
        link: payload.link || '/',
        type: payload.type || 'general'
      },
      android: {
        priority: payload.priority === 'urgent' ? 'high' : 'normal',
        notification: {
          icon: '/icons/android-big-icon.png',
          color: '#FF0000',
          sound: 'default',
          click_action: payload.link || '/'
        }
      },
      apns: {
        payload: {
          aps: {
            badge: 1,
            sound: 'default'
          }
        }
      },
      webpush: {
        headers: {
          'TTL': '86400'
        },
        notification: {
          icon: '/icons/android-big-icon.png',
          badge: '/icons/android-lil-icon-white.png',
          requireInteraction: payload.priority === 'urgent'
        }
      }
    }

    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      }
    )

    const responseData = await response.json()

    if (response.ok) {
      return { 
        success: true, 
        message_id: responseData.name?.split('/').pop() || 'unknown' 
      }
    } else {
      return { 
        success: false, 
        error: responseData.error?.message || 'Unknown Firebase error' 
      }
    }
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    }
  }
}
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FCMTokenPayload {
  token: string;
  platform: 'ios' | 'android' | 'web';
  device_name?: string;
  device_model?: string;
  app_version?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get user from JWT token
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

    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Invalid user token')
    }

    // Parse request body
    const payload: FCMTokenPayload = await req.json()

    // Validate required fields
    if (!payload.token || !payload.platform) {
      throw new Error('Missing required fields: token, platform')
    }

    // Validate platform
    if (!['ios', 'android', 'web'].includes(payload.platform)) {
      throw new Error('Invalid platform. Must be ios, android, or web')
    }

    // Rate limiting check
    const rateLimitKey = `store-token:${user.id}`
    const { data: rateLimitData } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('key', rateLimitKey)
      .gte('expires_at', new Date().toISOString())
      .single()

    if (rateLimitData && rateLimitData.count >= 10) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if token already exists for this user
    const { data: existingToken } = await supabase
      .from('device_tokens')
      .select('*')
      .eq('user_id', user.id)
      .eq('token', payload.token)
      .single()

    if (existingToken) {
      // Update existing token
      const { data: updatedToken, error: updateError } = await supabase
        .from('device_tokens')
        .update({
          platform: payload.platform,
          device_name: payload.device_name,
          device_model: payload.device_model,
          app_version: payload.app_version,
          is_active: true,
          last_used: new Date().toISOString(),
          error_count: 0,
          last_error: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingToken.id)
        .select()
        .single()

      if (updateError) {
        throw new Error(`Failed to update token: ${updateError.message}`)
      }

      // Update rate limit
      await supabase
        .from('rate_limits')
        .upsert({
          key: rateLimitKey,
          count: (rateLimitData?.count || 0) + 1,
          expires_at: new Date(Date.now() + 60000).toISOString() // 1 minute
        })

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Token updated successfully',
          token_id: updatedToken.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Deactivate old tokens for this user/platform combination to prevent duplicates
    await supabase
      .from('device_tokens')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('platform', payload.platform)

    // Create new token record
    const { data: newToken, error: insertError } = await supabase
      .from('device_tokens')
      .insert({
        user_id: user.id,
        token: payload.token,
        platform: payload.platform,
        device_name: payload.device_name,
        device_model: payload.device_model,
        app_version: payload.app_version,
        is_active: true,
        registration_attempts: 1,
        last_attempt_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      throw new Error(`Failed to store token: ${insertError.message}`)
    }

    // Update rate limit
    await supabase
      .from('rate_limits')
      .upsert({
        key: rateLimitKey,
        count: (rateLimitData?.count || 0) + 1,
        expires_at: new Date(Date.now() + 60000).toISOString() // 1 minute
      })

    // Subscribe to default topics based on user preferences
    const { data: userPrefs } = await supabase
      .from('users')
      .select('notification_preferences')
      .eq('id', user.id)
      .single()

    if (userPrefs?.notification_preferences) {
      const preferences = userPrefs.notification_preferences
      const { data: topics } = await supabase
        .from('notification_topics')
        .select('*')
        .eq('is_active', true)

      if (topics) {
        const subscriptions = []
        
        for (const topic of topics) {
          const prefKey = topic.topic_key
          if (preferences[prefKey] === true) {
            subscriptions.push({
              user_id: user.id,
              topic_id: topic.id
            })
          }
        }

        if (subscriptions.length > 0) {
          await supabase
            .from('user_topic_subscriptions')
            .upsert(subscriptions, { onConflict: 'user_id,topic_id' })
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Token stored successfully',
        token_id: newToken.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in store-fcm-token:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
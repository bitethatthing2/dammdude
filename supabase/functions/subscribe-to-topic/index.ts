import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TopicSubscriptionPayload {
  topic_key: string;
  subscribe: boolean; // true to subscribe, false to unsubscribe
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
    const payload: TopicSubscriptionPayload = await req.json()

    // Validate required fields
    if (!payload.topic_key || typeof payload.subscribe !== 'boolean') {
      throw new Error('Missing required fields: topic_key, subscribe')
    }

    // Rate limiting check
    const rateLimitKey = `subscribe-topic:${user.id}`
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

    // Get topic
    const { data: topic, error: topicError } = await supabase
      .from('notification_topics')
      .select('*')
      .eq('topic_key', payload.topic_key)
      .eq('is_active', true)
      .single()

    if (topicError || !topic) {
      throw new Error('Topic not found or inactive')
    }

    // Check if user has required role for this topic
    if (topic.requires_role) {
      const { data: userRole } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!userRole || userRole.role !== topic.requires_role) {
        throw new Error('Insufficient permissions for this topic')
      }
    }

    if (payload.subscribe) {
      // Subscribe to topic
      const { error: subscribeError } = await supabase
        .from('user_topic_subscriptions')
        .upsert({
          user_id: user.id,
          topic_id: topic.id,
          is_active: true
        }, { onConflict: 'user_id,topic_id' })

      if (subscribeError) {
        throw new Error(`Failed to subscribe: ${subscribeError.message}`)
      }

      // Update user notification preferences
      const { data: currentPrefs } = await supabase
        .from('users')
        .select('notification_preferences')
        .eq('id', user.id)
        .single()

      const updatedPrefs = {
        ...currentPrefs?.notification_preferences,
        [payload.topic_key]: true
      }

      await supabase
        .from('users')
        .update({ notification_preferences: updatedPrefs })
        .eq('id', user.id)

    } else {
      // Unsubscribe from topic
      const { error: unsubscribeError } = await supabase
        .from('user_topic_subscriptions')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('topic_id', topic.id)

      if (unsubscribeError) {
        throw new Error(`Failed to unsubscribe: ${unsubscribeError.message}`)
      }

      // Update user notification preferences
      const { data: currentPrefs } = await supabase
        .from('users')
        .select('notification_preferences')
        .eq('id', user.id)
        .single()

      const updatedPrefs = {
        ...currentPrefs?.notification_preferences,
        [payload.topic_key]: false
      }

      await supabase
        .from('users')
        .update({ notification_preferences: updatedPrefs })
        .eq('id', user.id)
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
        message: payload.subscribe ? 'Subscribed to topic' : 'Unsubscribed from topic',
        topic: topic.display_name
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in subscribe-to-topic:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
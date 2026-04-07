// Supabase Edge Function: telemetry
// ESP32 gửi POST đến: https://[project].supabase.co/functions/v1/telemetry
// Header: Authorization: Bearer [SUPABASE_ANON_KEY]
// Body: { user_id, battery_pct, humidity, temperature, gps_lat, gps_lng }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const body = await req.json()
    const { user_id, battery_pct, humidity, temperature, gps_lat, gps_lng } = body

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'Missing user_id' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Insert telemetry
    const { error } = await supabase.from('robot_telemetry').insert({
      user_id, battery_pct, humidity, temperature, gps_lat, gps_lng,
      timestamp: new Date().toISOString()
    })

    if (error) throw error

    // Check battery alert
    if (battery_pct < 20) {
      // Trigger push notification (non-blocking)
      supabase.functions.invoke('send-notification', {
        body: {
          user_id,
          title: '⚠️ Pin robot yếu!',
          body: `Pin chỉ còn ${battery_pct.toFixed(0)}%. Robot cần được sạc.`,
          tag: 'battery-low'
        }
      }).catch(console.error)
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

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
    const { device_id, battery_pct, humidity, temperature, gps_lat, gps_lng } = body

    if (!device_id) {
      return new Response(JSON.stringify({ error: 'Missing device_id' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 1. Tìm xem robot này thuộc về ai trong bảng 'robots'
    let { data: robot, error: robotError } = await supabase
      .from('robots')
      .select('owner_id')
      .eq('id', device_id)
      .single()

    // 2. Nếu chưa có trong bảng robots, tự động tạo mới (chưa có chủ)
    if (robotError || !robot) {
      const { data: newRobot } = await supabase
        .from('robots')
        .insert({ id: device_id })
        .select()
        .single()
      robot = newRobot
    }

    const user_id = robot?.owner_id

    // 3. Insert telemetry (lưu cả device_id và user_id nếu có)
    const { error } = await supabase.from('robot_telemetry').insert({
      device_id,
      user_id, // Có thể null nếu chưa được "nhận"
      battery_pct, 
      humidity, 
      temperature, 
      gps_lat, 
      gps_lng,
      timestamp: new Date().toISOString()
    })

    if (error) throw error

    // 4. Nếu đã có chủ và pin yếu, gửi thông báo
    if (user_id && battery_pct < 20) {
      supabase.functions.invoke('send-notification', {
        body: {
          user_id,
          title: '⚠️ Pin robot yếu!',
          body: `Pin của robot [${device_id}] chỉ còn ${battery_pct.toFixed(0)}%.`,
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

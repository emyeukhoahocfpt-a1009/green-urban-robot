// Supabase Edge Function: commands
// ESP32 gọi GET để lấy lệnh: https://[project].supabase.co/functions/v1/commands?user_id=xxx
// Trả về lệnh chưa executed, sau đó mark là executed

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

    const url = new URL(req.url)
    const device_id = url.searchParams.get('device_id')

    if (!device_id) {
      return new Response(JSON.stringify({ error: 'Missing device_id' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 1. Tìm chủ sở hữu của robot từ mã MAC (device_id)
    const { data: robot } = await supabase
      .from('robots')
      .select('owner_id')
      .eq('id', device_id)
      .single()

    const user_id = robot?.owner_id

    if (!user_id) {
      return new Response(JSON.stringify({ command: null, message: 'Robot has no owner' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 2. Lấy lệnh mới nhất của chính chủ nhân đó
    const { data: commands, error } = await supabase
      .from('robot_commands')
      .select('*')
      .eq('user_id', user_id)
      .eq('executed', false)
      .order('created_at', { ascending: true })
      .limit(1)

    if (error) throw error

    if (!commands || commands.length === 0) {
      return new Response(JSON.stringify({ command: null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const cmd = commands[0]

    // Mark as executed
    await supabase
      .from('robot_commands')
      .update({ executed: true })
      .eq('id', cmd.id)

    return new Response(JSON.stringify({ command: cmd.command, id: cmd.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

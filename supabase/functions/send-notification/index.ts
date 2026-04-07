// Supabase Edge Function: send-notification
// Gửi Web Push VAPID notification đến user
// Cần set secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL
//
// Generate VAPID keys: node skills/generate-vapid-keys.js
// Set secrets: supabase secrets set VAPID_PUBLIC_KEY=xxx VAPID_PRIVATE_KEY=yyy VAPID_EMAIL=mailto:you@example.com

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple Web Push implementation using VAPID
async function sendWebPush(subscription: {
  endpoint: string
  p256dh: string
  auth: string
}, payload: { title: string; body: string; tag?: string }) {
  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!
  const vapidEmail = Deno.env.get('VAPID_EMAIL')!

  // Import web-push compatible library for Deno
  const { default: webpush } = await import('npm:web-push@3')

  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey)

  await webpush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: { p256dh: subscription.p256dh, auth: subscription.auth }
    },
    JSON.stringify(payload)
  )
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { user_id, title, body, tag } = await req.json()

    // Get user's push tokens
    const { data: tokens } = await supabase
      .from('user_push_tokens')
      .select('*')
      .eq('user_id', user_id)

    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const results = await Promise.allSettled(
      tokens.map(t => sendWebPush({ endpoint: t.endpoint, p256dh: t.p256dh, auth: t.auth }, { title, body, tag }))
    )

    const sent = results.filter(r => r.status === 'fulfilled').length

    return new Response(JSON.stringify({ ok: true, sent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

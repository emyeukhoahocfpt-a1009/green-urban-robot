// ============================================================
// simulate-esp32.js — Giả lập ESP32 gửi telemetry
// Dùng để test dashboard mà không cần phần cứng
//
// Chạy: node skills/simulate-esp32.js
// Yêu cầu: node >= 18 (fetch built-in)
// Cần cài: npm install dotenv (trong thư mục gốc hoặc skills/)
// ============================================================

const SUPABASE_URL    = 'https://glbmjvnhdulpqiavmdai.supabase.co'
const SUPABASE_KEY    = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsYm1qdm5oZHVscHFpYXZtZGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzM5MTYsImV4cCI6MjA5MTE0OTkxNn0.CIL6J1cj2NXPY6oqJKv63Un6MTw9h2hakUq7KW5OTOE'
const TELEMETRY_URL   = `${SUPABASE_URL}/functions/v1/telemetry`

// ⚠️ THAY user_id bằng UUID của tài khoản bạn tạo trên Supabase
const USER_ID = 'cac8dc2b-5953-4c4c-a8f3-8c68ffe40f33'

// GPS trail giả lập (Hồ Chí Minh City)
const BASE_LAT = 10.7769
const BASE_LNG = 106.7009

let step = 0
let battery = 100

async function sendTelemetry() {
  const lat = BASE_LAT + (step * 0.0001) + (Math.random() - 0.5) * 0.00005
  const lng = BASE_LNG + (step * 0.00015) + (Math.random() - 0.5) * 0.00005
  battery = Math.max(0, battery - 0.3 + Math.random() * 0.1)

  const payload = {
    user_id:     USER_ID,
    battery_pct: parseFloat(battery.toFixed(1)),
    humidity:    parseFloat((60 + Math.random() * 20).toFixed(1)),
    temperature: parseFloat((27 + Math.random() * 5).toFixed(1)),
    gps_lat:     parseFloat(lat.toFixed(6)),
    gps_lng:     parseFloat(lng.toFixed(6))
  }

  try {
    const res = await fetch(TELEMETRY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify(payload)
    })
    const data = await res.json()
    console.log(`[${new Date().toLocaleTimeString('vi-VN')}] Sent → status=${res.status} | bat=${battery.toFixed(0)}% lat=${lat.toFixed(4)} lng=${lng.toFixed(4)}`, data.ok ? '✅' : '❌')
  } catch (e) {
    console.error('Error:', e.message)
  }

  step++
}

console.log('🤖 ESP32 Simulator đang chạy...')
console.log(`   User ID: ${USER_ID}`)
console.log(`   Endpoint: ${TELEMETRY_URL}`)
console.log('   Gửi telemetry mỗi 2 giây. Ctrl+C để dừng.\n')

sendTelemetry()
setInterval(sendTelemetry, 2000)

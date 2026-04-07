// ============================================================
// generate-vapid-keys.js — Tạo VAPID keys cho Web Push
// Chạy 1 lần duy nhất: node skills/generate-vapid-keys.js
// Sau đó set vào Supabase Secrets
// ============================================================

const { execSync } = require('child_process')

try {
  execSync('npm list web-push', { stdio: 'ignore' })
} catch {
  console.log('Đang cài web-push...')
  execSync('npm install web-push --no-save', { stdio: 'inherit' })
}

const webpush = require('web-push')
const keys = webpush.generateVAPIDKeys()

console.log('\n✅ VAPID Keys đã tạo!\n')
console.log('📋 Copy các lệnh sau vào terminal (cần Supabase CLI):\n')
console.log(`supabase secrets set VAPID_PUBLIC_KEY="${keys.publicKey}"`)
console.log(`supabase secrets set VAPID_PRIVATE_KEY="${keys.privateKey}"`)
console.log(`supabase secrets set VAPID_EMAIL="mailto:your@email.com"\n`)
console.log('📋 Copy vào pwa/.env:\n')
console.log(`VITE_VAPID_PUBLIC_KEY=${keys.publicKey}\n`)
console.log('⚠️  Lưu ý: Chỉ tạo keys 1 lần! Nếu tạo lại thì tất cả push subscriptions cũ sẽ hết hạn.\n')

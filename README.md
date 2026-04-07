# Green Urban Robot 🤖🌿

Hệ thống điều khiển robot đô thị xanh — PWA + Supabase + ESP32

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/emyeukhoahocfpt-a1009/Green-Urban-Robot)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend PWA | React 18 + Vite 5 + TypeScript |
| Backend | Supabase (Auth, DB, Realtime, Edge Functions) |
| Map | Leaflet.js |
| Push Notifications | Web Push VAPID |
| Camera Remote | Cloudflare Tunnel |
| Firmware | ESP32 Arduino (ArduinoJson, TinyGPS++) |
| Deploy | Vercel |

## Cấu trúc

```
Green_Urban_Robot/
├── .agents/workflows/   # Hướng dẫn deploy, setup
├── skills/              # Scripts: simulate-esp32, generate-vapid-keys
├── pwa/                 # React PWA (deploy Vercel)
├── supabase/functions/  # Edge Functions (telemetry, commands, notifications)
└── firmware/            # ESP32 Arduino code
```

## Tính năng

- 📷 **Camera Feed** — MJPEG stream qua Cloudflare Tunnel
- 📊 **Sensor HUD** — Battery, humidity, temp realtime
- 🗺️ **GPS Map** — Leaflet.js, trail 50 điểm, mở Google Maps
- 📡 **Connection Badge** — Online/Offline ESP32
- 📅 **Schedule Panel** — Lập lịch, auto-calc return time
- 🔔 **Push Notifications** — Web Push VAPID (pin thấp, hết giờ, offline)
- 🔐 **Auth** — Supabase email/password, RLS phân quyền admin/user

## Bắt đầu nhanh

### 1. Clone & Install
```bash
cd pwa
npm install
npm run dev
```

### 2. Giả lập ESP32 (không cần phần cứng)
```bash
# Sửa USER_ID trong file trước
node skills/simulate-esp32.js
```

### 3. Deploy
Xem `.agents/workflows/deploy.md`

### 4. Camera từ xa
Xem `.agents/workflows/cloudflare-tunnel.md`

## ESP32 Setup

Sửa `firmware/robot_firmware.ino`:
- `WIFI_SSID` / `WIFI_PASSWORD`
- `USER_ID` — UUID tài khoản Supabase

Library cần cài (Arduino Library Manager):
- ArduinoJson
- TinyGPSPlus

---
© 2025 FPT Semiconductor — NCKH EMG Signal Analysis

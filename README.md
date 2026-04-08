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

## Sơ đồ hệ thống

```mermaid
graph TD
    classDef frontend fill:#f3e5f5,stroke:#9575cd,stroke-width:2px,color:#1a237e;
    classDef backend fill:#e0f2f1,stroke:#4db6ac,stroke-width:2px,color:#004d40;
    classDef bridge fill:#fff8e1,stroke:#ffd54f,stroke-width:2px,color:#e65100;
    classDef hardware fill:#ffebee,stroke:#e57373,stroke-width:2px,color:#b71c1c;

    subgraph FE ["Frontend — PWA (React + Vite)"]
        direction TB
        FE_DESC["Vercel · Service Worker · Push Notifications"]
        subgraph FE_C [" "]
            direction LR
            FE1["Camera feed"]
            FE2["GPS + Map"]
            FE3["Sensors HUD"]
            FE4["Schedule"]
            FE5["Admin / Settings"]
        end
    end

    subgraph BE ["Backend — Supabase"]
        direction TB
        BE_DESC["Auth · PostgreSQL · Realtime · Storage · Edge Functions"]
        subgraph BE_C [" "]
            direction LR
            BE1["Auth (JWT)"]
            BE2["Realtime channel"]
            BE3["Robot configs"]
            BE4["GPS history"]
            BE5["Push alerts"]
        end
    end

    subgraph BR ["ESP32 Bridge Server (Node.js / Raspberry Pi)"]
        direction TB
        BR_DESC["WebSocket → Supabase Realtime · MJPEG stream proxy · BLE bridge"]
        subgraph BR_C [" "]
            direction LR
            BR1["WS server :8080"]
            BR2["MJPEG proxy :8081"]
            BR3["BLE / serial link"]
            BR4["Supabase realtime pub"]
        end
    end

    subgraph HW ["ESP32 — Robot Hardware"]
        direction TB
        HW_DESC["WiFi / BLE · FPV cam · GPS · BMS · Sensors · Motor control"]
        subgraph HW_C [" "]
            direction LR
            HW1["FPV camera"]
            HW2["GPS NEO"]
            HW3["BMS (pin %)"]
            HW4["Humidity/Temp"]
            HW5["Motor driver"]
            HW6["Auto-home"]
        end
    end

    FE --> BE
    BE --> BR
    BR --> HW

    class FE,FE_DESC,FE1,FE2,FE3,FE4,FE5 frontend;
    class BE,BE_DESC,BE1,BE2,BE3,BE4,BE5 backend;
    class BR,BR_DESC,BR1,BR2,BR3,BR4 bridge;
    class HW,HW_DESC,HW1,HW2,HW3,HW4,HW5,HW6 hardware;
```

### Luồng dữ liệu chính

```mermaid
graph TD
    classDef sensor fill:#e3f2fd,stroke:#2196f3,stroke-width:1px;
    classDef command fill:#f1f8e9,stroke:#8bc34a,stroke-width:1px;
    classDef alert fill:#fbe9e7,stroke:#ff5722,stroke-width:1px;

    subgraph S_Flow ["Sensor data"]
        direction LR
        S1["Sensor data<br/>ESP32 → Bridge → Supabase"] --> S2["Realtime sub<br/>Supabase → PWA (ws)"] --> S3["Dashboard update<br/>React state re-render"]
    end

    subgraph C_Flow ["Command"]
        direction LR
        C1["Command<br/>User click → Supabase"] --> C2["Edge Function<br/>Validate + relay"] --> C3["ESP32 executes<br/>WebSocket → motor"]
    end

    subgraph A_Flow ["Alerts"]
        direction LR
        A1["Pin thấp / hết giờ<br/>BMS trigger ESP32"] --> A2["Auto-home logic<br/>Bridge → Supabase alert"] --> A3["Push notification<br/>FCM → điện thoại"]
    end

    class S_Flow,S1,S2,S3 sensor;
    class C_Flow,C1,C2,C3 command;
    class A_Flow,A1,A2,A3 alert;
```

**Tech stack:** React + Vite · Supabase · Vercel · Node.js bridge · ESP32 Arduino · WebSocket · FCM · Leaflet.js  
**Auth:** Supabase Auth (email/password) · RLS policies · Admin role in profiles table  
**Camera:** MJPEG stream qua Bridge Server (ESP32 → Node.js → `<img src>` trong PWA)  
**GPS history + schedule config:** lưu Supabase · mở Google Maps qua coordinates link

---

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
1. Đảm bảo máy tính chạy PWA và phần cứng ESP32 đang kết nối **cùng một mạng WiFi**.
2. Tìm địa chỉ IP nội bộ của ESP32 (vd: `192.168.x.x`).
3. Mở Terminal và chạy lệnh thiết lập đường hầm Cloudflare Tunnel (yêu cầu cài đặt sẵn `cloudflared` bằng lệnh `winget install Cloudflare.cloudflared`):
   ```bash
   cloudflared tunnel --url http://192.168.x.x:80
   ```
4. Khi quá trình chạy thành công, một đường dẫn tạm thời sẽ được tạo ra (ví dụ: `https://abc-xyz-123.trycloudflare.com`). Bạn copy link này, đổi thành `https://abc-xyz-123.trycloudflare.com/stream`, sau đó dán vào ô **Camera Stream** tại **Dashboard** và nhấn **Lưu**.

## ESP32 Setup

Sửa `firmware/robot_firmware.ino`:
- `WIFI_SSID` / `WIFI_PASSWORD`
- `USER_ID` — UUID tài khoản Supabase

Library cần cài (Arduino Library Manager):
- ArduinoJson
- TinyGPSPlus

---
© 2025 FPT Semiconductor — NCKH EMG Signal Analysis

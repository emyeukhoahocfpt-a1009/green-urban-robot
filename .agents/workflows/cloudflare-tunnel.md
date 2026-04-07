---
description: Setup Cloudflare Tunnel cho camera stream từ xa
---

## Cài cloudflared trên Windows

```powershell
# Tải cloudflared
winget install Cloudflare.cloudflared
# hoặc tải thủ công từ: https://github.com/cloudflare/cloudflared/releases
```

## Chạy Quick Tunnel (không cần tài khoản)

Khi ESP32 đang chạy MJPEG stream, chạy lệnh sau trên PC **cùng WiFi với ESP32**:

```bash
# Thay 192.168.x.x bằng IP thực của ESP32
cloudflared tunnel --url http://192.168.x.x:80
```

Sẽ ra URL dạng: `https://abc-xyz-123.trycloudflare.com`

## Copy URL vào Dashboard

1. Mở PWA → Dashboard
2. Dán URL vào ô Camera Stream: `https://abc-xyz-123.trycloudflare.com/stream`
3. Nhấn 💾 Lưu

## Lưu ý
- URL thay đổi mỗi lần restart cloudflared (quick tunnel)
- Để URL cố định: tạo tài khoản Cloudflare free → named tunnel
- Tunnel chỉ cần chạy khi demo, có thể tắt sau đó

---
description: Deploy PWA lên Vercel
---

## Bước 1: Build project
```bash
cd pwa
npm run build
```

## Bước 2: Push lên GitHub
```bash
git add .
git commit -m "build: production ready"
git push origin main
```

## Bước 3: Deploy trên Vercel
1. Vào https://vercel.com → New Project
2. Import repo GitHub: `emyeukhoahocfpt-a1009/Green-Urban-Robot`
3. **Root Directory**: `pwa`
4. **Framework Preset**: Vite
5. Thêm Environment Variables:
   - `VITE_SUPABASE_URL` = `https://glbmjvnhdulpqiavmdai.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = (anon key)
   - `VITE_VAPID_PUBLIC_KEY` = (sau khi chạy generate-vapid-keys.js)
6. Click Deploy → Done!

## Bước 4: PWA trên điện thoại
- Mở link Vercel trên Chrome/Safari
- "Add to Home Screen"

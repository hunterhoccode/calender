# Deployment Guide — CMP PRO

## Yêu cầu

- Node.js >= 18
- Tài khoản Supabase (free tier là đủ)

## 1. Setup Supabase

### Tạo project
1. Vào [supabase.com](https://supabase.com) → New project
2. Lưu lại **Project URL** và **anon key** (Settings > API)

### Chạy schema
Vào Supabase Dashboard → SQL Editor → paste nội dung `supabase/schema.sql` → Run.

Schema sẽ tạo:
- Tables: `profiles`, `brands`, `campaigns`, `milestones`, `changelog`
- Triggers: auto-create profile, auto-update `updated_at`, trim changelog
- RLS policies cho tất cả tables
- Realtime publication cho campaigns, brands, milestones, changelog

### (Tùy chọn) Seed data
```bash
# Cài dotenv nếu chưa có
npm install dotenv

# Chạy seed
node scripts/seed.cjs
```

### Tạo RPC function
Chạy thêm trong SQL Editor:
```sql
CREATE OR REPLACE FUNCTION create_profile(
  user_id UUID,
  user_username TEXT,
  user_display_name TEXT,
  user_role TEXT DEFAULT 'viewer'
)
RETURNS void AS $$
  INSERT INTO profiles (id, username, display_name, role)
  VALUES (user_id, user_username, user_display_name, user_role)
  ON CONFLICT (id) DO NOTHING;
$$ LANGUAGE sql SECURITY DEFINER;
```

## 2. Cấu hình môi trường

Copy file `.env.example` thành `.env` và điền giá trị thực:
```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Cả `src/lib/supabase.js` và `src/contexts/AuthContext.jsx` đều đọc từ `import.meta.env`.

## 3. Chạy local

```bash
npm install
npm run dev
# App chạy tại http://localhost:5173
```

## 4. Build production

```bash
npm run build
# Output trong dist/
npm run preview   # kiểm tra build locally
```

## 5. Deploy

### Vercel (khuyến nghị)
```bash
npm i -g vercel
vercel --prod
```
Thêm environment variables trong Vercel dashboard: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

### Netlify
```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

### Cloudflare Pages
Kết nối repo GitHub → Build command: `npm run build` → Build output: `dist`.

### Static hosting khác
Upload toàn bộ `dist/` lên bất kỳ static host nào. Cần cấu hình rewrite tất cả route về `index.html` (SPA routing).

**Vercel:** tự động xử lý.
**Nginx:**
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

## 6. Tạo tài khoản Admin đầu tiên

Sau khi deploy:
1. Vào Supabase Dashboard → Authentication → Users → Add user
2. Điền email + password
3. Vào SQL Editor, cập nhật role:
```sql
UPDATE profiles SET role = 'admin' WHERE id = 'user-uuid-here';
```

Hoặc dùng register trong app rồi update role qua SQL.

## 7. Supabase Storage (media upload)

Tạo bucket `campaign-media` trong Supabase Storage:
- Public bucket hoặc signed URLs
- RLS: cho phép authenticated users upload

## Checklist trước khi go-live

- [ ] Schema đã chạy thành công
- [ ] RPC `create_profile` đã tạo
- [ ] Realtime enabled cho 4 tables
- [ ] `.env` đã có đúng URL + key
- [ ] Refactor hardcoded API key sang env vars
- [ ] Tài khoản Admin đầu tiên đã tạo
- [ ] Bucket Storage đã cấu hình (nếu cần upload media)
- [ ] SPA routing đã cấu hình trên host

# Deployment Guide — CMP PRO (Firebase)

## Yêu cầu

- Node.js >= 18
- Tài khoản Google + Firebase project (free Spark plan đủ dùng)

## 1. Setup Firebase Project

### Tạo project
1. Vào [console.firebase.google.com](https://console.firebase.google.com) → **Add project**
2. Enable **Authentication** → Sign-in method → **Email/Password**
3. Enable **Firestore Database** → Start in production mode → region `asia-southeast1` (cho VN)
4. Enable **Storage** → Start in production mode

### Lấy Firebase Config
Firebase Console → Project Settings → General → **Your apps** → Add app (Web) → copy `firebaseConfig` object (6 giá trị cần).

## 2. Cấu hình môi trường

```bash
cp .env.example .env
```

Điền 6 giá trị vào `.env`:
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

## 3. Deploy Security Rules

**Firestore Rules:** Firebase Console → Firestore → **Rules** → paste nội dung `firebase/firestore.rules` → **Publish**.

**Storage Rules:** Firebase Console → Storage → **Rules** → paste nội dung `firebase/storage.rules` → **Publish**.

Hoặc dùng Firebase CLI:
```bash
npm i -g firebase-tools
firebase login
firebase deploy --only firestore:rules,storage
```

## 4. Chạy local

```bash
npm install
npm run dev
# App chạy tại http://localhost:5173
```

## 5. Build production

```bash
npm run build      # output dist/
npm run preview    # kiểm tra build local
```

## 6. Deploy hosting

### Vercel (khuyến nghị)
```bash
npm i -g vercel
vercel --prod
```
Thêm 6 env vars `VITE_FIREBASE_*` trong Vercel dashboard (Settings → Environment Variables).

### Netlify
```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```
Thêm env vars trong Netlify dashboard.

### Cloudflare Pages
Kết nối repo GitHub → Build command: `npm run build` → Build output: `dist` → thêm env vars.

### Firebase Hosting
```bash
firebase init hosting   # chọn dist làm public dir, single-page app: yes
firebase deploy --only hosting
```

### Static hosting khác
Upload `dist/` → cấu hình rewrite mọi route về `index.html` (SPA routing).

**Nginx:**
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

## 7. Tạo tài khoản Admin đầu tiên

1. Vào app → tab **Đăng Ký** → tạo tài khoản với email/password
2. Firebase Console → Authentication → Users → copy UID của user vừa tạo
3. Firebase Console → Firestore → collection `users` → document `{uid}` → sửa field `role` thành `"admin"` → Save

## 8. Hardening (khuyến nghị production)

### Restrict API key
Google Cloud Console → APIs & Services → **Credentials** → click vào API key → **Application restrictions**: HTTP referrers → thêm:
- `localhost:*`
- `*.vercel.app/*` (hoặc custom domain)

Tránh API key bị abuse từ domain khác.

### Authorized domains (Auth)
Firebase Console → Authentication → Settings → **Authorized domains** → thêm domain Vercel/custom của bạn.

## Checklist trước go-live

- [ ] Authentication Email/Password đã enable
- [ ] Firestore created (production mode, region asia-southeast1)
- [ ] Storage created
- [ ] Firestore rules deployed
- [ ] Storage rules deployed
- [ ] `.env` có đủ 6 giá trị `VITE_FIREBASE_*`
- [ ] Env vars đã thêm vào hosting platform (Vercel/Netlify/CF)
- [ ] Admin user đầu tiên đã set role
- [ ] API key đã restrict HTTP referrers
- [ ] Domain production đã thêm vào Authorized domains

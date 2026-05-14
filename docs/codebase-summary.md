# Codebase Summary — CMP PRO

## Thống kê

| Loại | Số lượng |
|------|---------|
| Tổng file source | 27 file |
| Tổng LOC (JS/JSX/CSS) | ~8,600 |
| Components | 15 |
| Contexts | 4 |
| Utils/Libs | 4 |

## Cấu trúc thư mục

```
marketing-calendar/
├── src/
│   ├── App.jsx                  # Root: routing view, layout chính
│   ├── main.jsx                 # Entry point, mount React
│   ├── index.css                # Toàn bộ styles (4039 LOC)
│   ├── components/              # UI components
│   │   ├── LoginPage.jsx        # Form đăng nhập
│   │   ├── Sidebar.jsx          # Nav sidebar (brand list, view switch)
│   │   ├── FilterBar.jsx        # Bộ lọc category/status/search
│   │   ├── MonthView.jsx        # Calendar view tháng
│   │   ├── WeekView.jsx         # Calendar view tuần
│   │   ├── TimelineView.jsx     # Gantt chart view
│   │   ├── DashboardView.jsx    # Thống kê tổng quan
│   │   ├── CampaignDrawer.jsx   # Form tạo/sửa campaign (504 LOC)
│   │   ├── CampaignDetailModal.jsx  # Modal xem chi tiết campaign
│   │   ├── BrandDrawer.jsx      # Form tạo/sửa brand
│   │   ├── CommentThread.jsx    # Comments real-time
│   │   ├── UserManagement.jsx   # Quản lý user (Admin only)
│   │   ├── UserBadge.jsx        # Avatar + profile dropdown
│   │   ├── DatePicker.jsx       # Custom date picker component
│   │   ├── ChangeLogModal.jsx   # Xem audit log
│   │   └── ExportButton.jsx     # Nút export PNG
│   ├── contexts/                # React contexts (state management)
│   │   ├── AuthContext.jsx      # Auth state, session, permissions
│   │   ├── CampaignContext.jsx  # Campaign/brand state + Firestore CRUD
│   │   ├── ThemeContext.jsx     # Dark/Light mode state
│   │   └── ChangeLogContext.jsx # Changelog state + Firestore writes
│   ├── lib/
│   │   ├── firebase.js          # Firebase app init (Auth, Firestore, Storage)
│   │   ├── firestoreRest.js     # Firestore REST API fallback (bypass SDK)
│   │   └── dbMappers.js         # Defaults cho campaign array fields
│   ├── utils/
│   │   └── dateUtils.js         # Date helpers (addMonths, formatWeekRange...)
│   └── assets/                  # Static assets (hero.png)
├── firebase/
│   ├── firestore.rules          # Firestore Security Rules
│   └── storage.rules            # Storage Security Rules
├── firebase.json                # Firebase CLI deploy config
├── .mcp.json                    # firebase-tools MCP server config
├── docs/                        # Project documentation
├── public/                      # Static files (favicon, icons)
├── .env.example                 # Required environment variables template
├── index.html                   # HTML entry
├── vite.config.js               # Vite + code-split manualChunks
├── package.json
└── eslint.config.js
```

## File quan trọng nhất

### [src/contexts/CampaignContext.jsx](../src/contexts/CampaignContext.jsx)
Trung tâm của toàn bộ state management. Dùng `useReducer` cho local state và `useCallback` cho Firestore CRUD. Xử lý:
- Load dữ liệu khi user login (onSnapshot listeners cho campaigns + brands)
- Real-time subscriptions qua Firestore `onSnapshot`
- Tất cả CRUD operations với permission check trước khi thực thi
- Filtered campaigns selector

### [src/contexts/AuthContext.jsx](../src/contexts/AuthContext.jsx)
Quản lý session Firebase Auth, user profile, và permission system.
- Restore session qua `onAuthStateChanged`
- Login/logout/register qua Firebase Auth SDK
- `fetchProfile` dùng Firestore REST API (`firestoreRest.js`) để bypass SDK WebChannel có thể bị extension chặn
- `hasPermission(permKey)` dùng bởi CampaignContext để guard actions

### [src/lib/firebase.js](../src/lib/firebase.js)
Khởi tạo Firebase app từ 6 env vars `VITE_FIREBASE_*`. Export `auth`, `db`, `storage` instances.

### [src/lib/firestoreRest.js](../src/lib/firestoreRest.js)
Helper gọi Firestore REST API trực tiếp (`https://firestore.googleapis.com/v1/...`) qua `fetch` + Bearer idToken. Dùng cho `fetchProfile` khi SDK fail vì WebChannel bị chặn.

### [src/components/CampaignDrawer.jsx](../src/components/CampaignDrawer.jsx)
Form phức tạp nhất trong app: tạo/sửa campaign với tất cả fields, milestone editor, media upload (Firebase Storage).

### [src/index.css](../src/index.css)
Toàn bộ design system: CSS custom properties, component styles, responsive, dark mode, animations.

### [firebase/firestore.rules](../firebase/firestore.rules)
Security Rules cho collections users/brands/campaigns/comments/changelog. Enforce role-based access ở DB layer.

## Luồng dữ liệu

```
User action
  → dispatch(action) [CampaignContext]
  → hasPermission check [AuthContext]
  → addLog [ChangeLogContext]
  → firestoreCrud(action) [Firestore SDK]
  → onSnapshot triggered
  → SET_CAMPAIGNS / SET_BRANDS [local state update]
  → React re-render
```

## Dependencies chính

| Package | Dùng cho |
|---------|---------|
| `firebase` | Backend client (Auth, Firestore, Storage) |
| `date-fns` | Xử lý date/time |
| `lucide-react` | SVG icons |
| `marked` + `dompurify` | Render Markdown an toàn |
| `html2canvas` | Export PNG |

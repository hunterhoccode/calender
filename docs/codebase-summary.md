# Codebase Summary — CMP PRO

## Thống kê

| Loại | Số lượng |
|------|---------|
| Tổng file source | 26 file |
| Tổng LOC (JS/JSX/CSS) | ~8,559 |
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
│   │   ├── CampaignContext.jsx  # Campaign/brand state + Supabase CRUD
│   │   ├── ThemeContext.jsx     # Dark/Light mode state
│   │   └── ChangeLogContext.jsx # Changelog state + Supabase writes
│   ├── lib/
│   │   ├── supabase.js          # Supabase client (reads from .env)
│   │   └── dbMappers.js         # snake_case <-> camelCase converters
│   ├── utils/
│   │   └── dateUtils.js         # Date helpers (addMonths, formatWeekRange...)
│   └── assets/                  # Static assets (hero.png)
├── supabase/
│   └── schema.sql               # DDL đầy đủ + RLS policies + triggers
├── scripts/
│   └── seed.cjs                 # Seed data script
├── docs/                        # Project documentation
├── public/                      # Static files (favicon, icons)
├── .env.example                 # Required environment variables template
├── index.html                   # HTML entry
├── vite.config.js
├── package.json
└── eslint.config.js
```

## File quan trọng nhất

### [src/contexts/CampaignContext.jsx](../src/contexts/CampaignContext.jsx)
Trung tâm của toàn bộ state management. Dùng `useReducer` cho local state và `useCallback` cho Supabase CRUD. Xử lý:
- Load dữ liệu lần đầu khi user login
- Real-time subscriptions (campaigns, brands, milestones)
- Tất cả CRUD operations với permission check trước khi thực thi
- Filtered campaigns selector

### [src/contexts/AuthContext.jsx](../src/contexts/AuthContext.jsx)
Quản lý session Supabase, user profile, và permission system.
- Restore session khi refresh trang
- Login/logout/register qua Supabase Auth REST API
- `hasPermission(permKey)` dùng bởi CampaignContext để guard actions

### [src/components/CampaignDrawer.jsx](../src/components/CampaignDrawer.jsx)
Form phức tạp nhất trong app: tạo/sửa campaign với tất cả fields, milestone editor, media upload.

### [src/index.css](../src/index.css)
Toàn bộ design system: CSS custom properties, component styles, responsive, dark mode, animations.

### [supabase/schema.sql](../supabase/schema.sql)
DDL đầy đủ bao gồm: tables, indexes, triggers, RLS policies, realtime publication.

## Luồng dữ liệu

```
User action
  → dispatch(action) [CampaignContext]
  → hasPermission check [AuthContext]
  → addLog [ChangeLogContext]
  → supabaseCrud(action) [Supabase DB]
  → Realtime event broadcast
  → rawDispatch(UPSERT/REMOVE) [local state update]
  → React re-render
```

## Dependencies chính

| Package | Dùng cho |
|---------|---------|
| `@supabase/supabase-js` | Backend client |
| `date-fns` | Xử lý date/time |
| `lucide-react` | SVG icons |
| `marked` + `dompurify` | Render Markdown an toàn |
| `html2canvas` | Export PNG |

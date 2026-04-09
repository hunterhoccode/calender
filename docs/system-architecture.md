# System Architecture — CMP PRO

## Tổng quan kiến trúc

```
┌─────────────────────────────────────────────┐
│              Browser (React SPA)            │
│                                             │
│  ThemeProvider                              │
│  └── AuthProvider                           │
│      └── ChangeLogProvider                  │
│          └── CampaignProvider               │
│              └── AuthGate                   │
│                  ├── SplashScreen           │
│                  ├── LoginPage              │
│                  └── AppContent             │
│                      ├── Sidebar            │
│                      ├── Header             │
│                      ├── FilterBar          │
│                      ├── Views (4)          │
│                      └── Modals/Drawers (5) │
└──────────────┬──────────────────────────────┘
               │ HTTPS / WebSocket
┌──────────────▼──────────────────────────────┐
│              Supabase Cloud                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │   Auth   │  │ PostgREST│  │ Realtime │  │
│  │  (JWT)   │  │  (REST)  │  │  (WS)    │  │
│  └──────────┘  └────┬─────┘  └────┬─────┘  │
│                     │              │        │
│              ┌──────▼──────────────▼─────┐  │
│              │      PostgreSQL           │  │
│              │  profiles, campaigns,     │  │
│              │  brands, milestones,      │  │
│              │  changelog               │  │
│              └──────────────────────────┘  │
│  ┌──────────┐                              │
│  │ Storage  │  (media files upload)        │
│  └──────────┘                              │
└─────────────────────────────────────────────┘
```

## Database Schema

### Tables

#### `profiles`
| Column | Type | Ghi chú |
|--------|------|---------|
| id | UUID PK | = auth.users.id |
| username | TEXT UNIQUE | auto từ email |
| display_name | TEXT | |
| role | TEXT | admin/editor/viewer |
| created_at | TIMESTAMPTZ | |

#### `brands`
| Column | Type | Ghi chú |
|--------|------|---------|
| id | UUID PK | |
| name | TEXT | |
| logo | TEXT | emoji hoặc URL |
| color | TEXT | hex color |
| description | TEXT | |
| created_at | TIMESTAMPTZ | |

#### `campaigns`
| Column | Type | Ghi chú |
|--------|------|---------|
| id | UUID PK | |
| name | TEXT | |
| category | TEXT | big-campaign/flash-sale/social/email/event/content |
| brand_id | UUID FK | → brands(id) SET NULL on delete |
| start_date | DATE | |
| end_date | DATE | |
| key_message | TEXT | |
| budget | TEXT | free-form string |
| channels | TEXT[] | mảng kênh triển khai |
| target_audience | TEXT | |
| notes | TEXT | |
| details | TEXT | Markdown content |
| media | TEXT[] | URLs từ Supabase Storage |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | auto-update trigger |

#### `milestones`
| Column | Type | Ghi chú |
|--------|------|---------|
| id | UUID PK | |
| campaign_id | UUID FK | → campaigns(id) CASCADE delete |
| text | TEXT | |
| date | DATE | |
| completed | BOOLEAN | |
| sort_order | INTEGER | thứ tự hiển thị |

#### `changelog`
| Column | Type | Ghi chú |
|--------|------|---------|
| id | UUID PK | |
| user_id | UUID FK | → profiles(id) SET NULL |
| username | TEXT | denormalized |
| user_role | TEXT | denormalized |
| action | TEXT | action type key |
| action_label | TEXT | human-readable label |
| target_name | TEXT | tên campaign/brand bị tác động |
| details | JSONB | extra data |
| created_at | TIMESTAMPTZ | |

Trigger `changelog_trim`: FIFO 500 rows tự động sau mỗi INSERT.

### RLS Policies tóm tắt

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| profiles | authenticated | — | self hoặc admin | admin (không xóa chính mình) |
| brands | authenticated | admin | admin | admin |
| campaigns | authenticated | admin/editor | admin/editor | admin |
| milestones | authenticated | admin/editor | admin/editor | admin/editor |
| changelog | authenticated | admin/editor | — | admin |

### DB Functions & Triggers

| Tên | Loại | Mô tả |
|-----|------|-------|
| `handle_new_user()` | Trigger AFTER INSERT on auth.users | Auto tạo profile khi signup |
| `update_updated_at()` | Trigger BEFORE UPDATE on campaigns | Cập nhật updated_at tự động |
| `trim_changelog()` | Trigger AFTER INSERT on changelog | Giữ tối đa 500 rows |
| `get_user_role()` | SQL Function | Trả về role của auth.uid() hiện tại |
| `create_profile()` | RPC Function | Tạo profile bypass RLS (SECURITY DEFINER) |

## Frontend Architecture

### Context hierarchy & data flow

```
ThemeContext          → theme preference (localStorage + system)
AuthContext           → currentUser, session, permissions, users list
  ChangeLogContext    → audit entries (depends on AuthContext for user info)
    CampaignContext   → campaigns, brands, UI state
                        (depends on Auth for permission guard + log)
```

### State in CampaignContext

```js
{
  campaigns: Campaign[],       // all campaigns loaded
  brands: Brand[],             // all brands loaded
  activeBrandId: string|null,  // filter by brand
  filters: {
    categories: string[],
    status: 'active'|'upcoming'|'completed'|null,
    search: string,
  },
  selectedCampaign: Campaign|null,  // campaign đang edit trong drawer
  drawerOpen: boolean,
  isNewCampaign: boolean,
  detailOpen: boolean,
  viewingCampaign: Campaign|null,   // campaign đang xem chi tiết
  brandDrawerOpen: boolean,
  editingBrand: Brand|null,
  dataLoaded: boolean,
}
```

### Permission system

```js
// Defined in AuthContext
PERMISSIONS = {
  admin:  { canCreate, canEdit, canDelete, canManageUsers, canManageBrands },
  editor: { canCreate, canEdit, canDelete:false, canManageUsers:false, canManageBrands:false },
  viewer: { all: false },
}

// Guard map in CampaignContext
ACTION_PERMISSION_MAP = {
  ADD_CAMPAIGN:       'canCreate',
  UPDATE_CAMPAIGN:    'canEdit',
  DELETE_CAMPAIGN:    'canDelete',
  DUPLICATE_CAMPAIGN: 'canCreate',
  DRAG_UPDATE:        'canEdit',
  TOGGLE_MILESTONE:   'canEdit',
  ADD_BRAND:          'canManageBrands',
  UPDATE_BRAND:       'canManageBrands',
  DELETE_BRAND:       'canManageBrands',
}
```

## Real-time Architecture

Supabase Realtime dùng PostgreSQL logical replication:

```
DB change → Supabase Realtime broadcast → WS → client onEvent
  → UPSERT/REMOVE dispatch → state update → re-render
```

3 channels riêng biệt: `campaigns-realtime`, `brands-realtime`, `milestones-realtime`.

Khi nhận event milestone thay đổi: re-fetch toàn bộ campaign cha (để có milestones array đầy đủ).

## Build & Deploy

```
Source (src/) → Vite build → dist/ (static HTML/JS/CSS)
```

Output trong `dist/` deploy được lên bất kỳ static host nào (Vercel, Netlify, Cloudflare Pages).

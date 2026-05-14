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
               │ HTTPS / WebChannel / REST
┌──────────────▼──────────────────────────────┐
│              Firebase Cloud                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │   Auth   │  │ Firestore│  │ Storage  │  │
│  │ (Email/  │  │ (NoSQL)  │  │ (media)  │  │
│  │  Pass)   │  │ Realtime │  │          │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│                                             │
│  Security Rules enforce role-based access   │
└─────────────────────────────────────────────┘
```

## Firestore Data Model

Firestore là document database NoSQL. Schema dưới mô tả các collections + fields.

### `users/{uid}` (uid = Firebase Auth UID)

| Field | Type | Ghi chú |
|--------|------|---------|
| username | string | auto từ email + uid prefix |
| displayName | string | tên hiển thị |
| role | string | admin / editor / viewer |
| createdAt | timestamp | server timestamp |

### `brands/{auto-id}`

| Field | Type | Ghi chú |
|--------|------|---------|
| name | string | |
| logo | string | emoji hoặc URL |
| color | string | hex color |
| description | string | |
| createdAt | timestamp | |

### `campaigns/{auto-id}`

| Field | Type | Ghi chú |
|--------|------|---------|
| name | string | |
| category | string | big-campaign/flash-sale/social/email/event/content |
| brandId | string\|null | id của brand (không có FK trong NoSQL) |
| startDate | string | ISO date YYYY-MM-DD |
| endDate | string | ISO date YYYY-MM-DD |
| keyMessage | string | |
| budget | string | free-form |
| channels | array&lt;string&gt; | kênh triển khai |
| targetAudience | string | |
| notes | string | |
| details | string | Markdown content |
| media | array&lt;string&gt; | Firebase Storage download URLs |
| milestones | array&lt;object&gt; | embed: `{text, date, completed, sortOrder}` |
| createdAt | timestamp | |
| updatedAt | timestamp | |

**Lưu ý:** milestones được **embed** trong campaign document (array) thay vì collection riêng — giảm số reads và đảm bảo atomic update.

### `campaigns/{id}/comments/{auto-id}` (subcollection)

| Field | Type | Ghi chú |
|--------|------|---------|
| campaignId | string | denormalized (= parent id) |
| userId | string | uid người comment |
| username | string | denormalized |
| userRole | string | denormalized |
| content | string | text comment |
| createdAt | timestamp | |

### `changelog/{auto-id}`

| Field | Type | Ghi chú |
|--------|------|---------|
| userId | string | uid |
| username | string | denormalized |
| userRole | string | denormalized |
| action | string | action type key |
| actionLabel | string | nhãn tiếng Việt |
| targetName | string | tên campaign/brand bị tác động |
| details | object\|null | extra data |
| createdAt | timestamp | |

Client query: `orderBy('createdAt', 'desc') limit(500)` — không có server-side FIFO trim, các entries cũ vẫn lưu nhưng không hiển thị.

### Security Rules tóm tắt

| Collection | Read | Create | Update | Delete |
|-------|--------|--------|--------|--------|
| users | authenticated | self, role='viewer' | self (trừ role) hoặc admin | admin (không xóa chính mình) |
| brands | authenticated | admin | admin | admin |
| campaigns | authenticated | admin/editor | admin/editor | admin |
| campaigns/.../comments | authenticated | authenticated | — | owner hoặc admin |
| changelog | authenticated | admin/editor | — | admin |

Storage rules: read = authenticated, write/delete = admin/editor; giới hạn 10MB; chỉ accept `image/*`, `video/*`, `application/pdf`.

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

Firestore realtime dùng WebChannel (hoặc HTTP long-polling fallback):

```
Doc change → Firestore listener → WebChannel push → client onSnapshot
  → SET_CAMPAIGNS / SET_BRANDS / SET_LOGS dispatch → state update → re-render
```

3 onSnapshot listeners độc lập: `campaigns` (orderBy startDate), `brands` (orderBy createdAt), `changelog` (orderBy createdAt desc, limit 500).

Milestones embed trong campaign document → khi toggle milestone, update toàn bộ array → Firestore broadcast → tất cả client re-render.

### Fallback: REST API

`AuthContext.fetchProfile` dùng Firestore REST API trực tiếp (qua `src/lib/firestoreRest.js`) thay vì SDK — bypass WebChannel protocol có thể bị ad blocker / extension trình duyệt chặn.

## Build & Deploy

```
Source (src/) → Vite build → dist/ (static HTML/JS/CSS)
```

Output `dist/` deploy được lên bất kỳ static host nào (Vercel, Netlify, Cloudflare Pages, Firebase Hosting).

Code-splitting: firebase gộp 1 chunk (~370KB) để share Firebase App instance; react/icons/markdown/date-fns/html2canvas tách chunks riêng để cache hiệu quả.

# Code Standards — CMP PRO

## Ngôn ngữ & Frameworks

- **JavaScript (JSX)** — không dùng TypeScript
- **React 19** functional components, hooks
- **Vite 8** build tool
- **CSS thuần** — không Tailwind, không CSS modules, không styled-components

## Cấu trúc file

### Naming conventions
- Components: `PascalCase.jsx` (vd: `CampaignDrawer.jsx`)
- Contexts: `PascalCase.jsx` trong `src/contexts/`, kết thúc bằng `Context` (vd: `AuthContext.jsx`)
- Utils/libs: `camelCase.js` (vd: `dateUtils.js`, `dbMappers.js`)
- CSS classes: `kebab-case` (vd: `.campaign-drawer`, `.btn-primary`)

### Component structure
```jsx
// 1. Imports
import { useState, useCallback } from 'react';
import { useCampaigns } from '../context/CampaignContext';

// 2. Component (named export hoặc default)
export default function MyComponent({ prop1, prop2 }) {
  // 3. Hooks
  const { state, dispatch } = useCampaigns();
  const [local, setLocal] = useState(null);

  // 4. Handlers / callbacks
  const handleClick = useCallback(() => { ... }, [deps]);

  // 5. Derived values
  const filtered = state.campaigns.filter(...);

  // 6. JSX
  return <div>...</div>;
}
```

## State Management

### Context pattern
Dự án dùng **React Context + useReducer** — không Redux, không Zustand.

| Context | Phạm vi |
|---------|---------|
| `ThemeContext` | dark/light mode preference |
| `AuthContext` | session, currentUser, permissions, user list |
| `ChangeLogContext` | audit log entries |
| `CampaignContext` | campaigns, brands, UI state (drawers, modals, filters) |

### Dispatch pattern
```js
// UI actions: dispatch trực tiếp (không gọi Supabase)
dispatch({ type: 'OPEN_DRAWER', payload: campaign });

// Data actions: dispatch qua guarded dispatch (có permission check + log)
dispatch({ type: 'ADD_CAMPAIGN', payload: { name, startDate, ... } });
```

### Action naming
- `SET_*` — gán dữ liệu mới
- `UPSERT_*` — insert hoặc update theo id
- `REMOVE_*` — xóa theo id
- `OPEN_*` / `CLOSE_*` — toggle UI state
- `ADD_*`, `UPDATE_*`, `DELETE_*`, `DUPLICATE_*` — CRUD actions (có permission check)

## Supabase Integration

### DB naming
- DB columns: `snake_case` (vd: `start_date`, `brand_id`)
- App objects: `camelCase` (vd: `startDate`, `brandId`)
- Chuyển đổi qua `src/lib/dbMappers.js` (`mapCampaignFromDb`, `toCamelCase`, `toSnakeCase`)

### Real-time subscriptions
Đăng ký trong `CampaignContext` khi `currentUser` có giá trị. Ba channel:
- `campaigns-realtime` — table `campaigns`
- `brands-realtime` — table `brands`
- `milestones-realtime` — table `milestones`

Cleanup channels trong return của `useEffect`.

### RLS
Mọi permission đều được enforce ở **cả 2 layer**:
1. **Frontend** (`hasPermission` trong AuthContext)
2. **Database** (RLS policies trong schema.sql)

Không bao giờ chỉ check ở frontend mà bỏ DB.

## CSS Conventions

### CSS Custom Properties (design tokens)
```css
/* Định nghĩa trong :root và [data-theme="dark"] */
--bg-primary: #ffffff;
--text-primary: #1e293b;
--accent: #6366f1;
--radius-md: 8px;
--shadow-sm: 0 1px 3px rgba(0,0,0,0.1);
```

### Component styling
- Mỗi component có class wrapper riêng (vd: `.campaign-drawer`, `.month-view`)
- Không dùng inline styles trừ giá trị động (màu brand, width %)
- Mobile-first với `@media (max-width: 768px)`

## Error Handling

- Lỗi Supabase CRUD: log ra console, không throw (tránh crash UI)
- Lỗi Auth: dispatch `SET_ERROR` để hiển thị cho user
- Không dùng `try/catch` bao toàn bộ component render

## Security

- Markdown từ user render qua `marked` + `dompurify` (XSS safe)
- API key Supabase là `anon` key — public by design, bảo vệ bằng RLS
- Không lưu sensitive data trong localStorage

## Accessibility

- Tất cả buttons/interactive elements có `aria-label`
- Respect `prefers-reduced-motion` (disable animations)
- Đủ color contrast ratio
- Keyboard navigation cho modals và drawers

## Quy tắc thêm tính năng mới

1. Thêm action vào `ACTION_PERMISSION_MAP` nếu cần permission guard
2. Thêm RLS policy tương ứng vào `supabase/schema.sql`
3. Thêm reducer case vào context tương ứng
4. Component lấy data qua context hook, không fetch trực tiếp
5. Ghi log vào changelog nếu là action có side effect

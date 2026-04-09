# CMP PRO — Marketing Calendar

Ứng dụng quản lý lịch marketing tập trung cho team, hỗ trợ nhiều brand, nhiều view, cộng tác real-time.

## Tech Stack

- **Frontend:** React 19, Vite 8, CSS thuần (không dùng Tailwind/UI lib)
- **Backend:** Supabase (Auth, PostgreSQL, Realtime, Storage)
- **Thư viện:** date-fns, lucide-react, marked, dompurify, html2canvas

## Quick Start

```bash
cp .env.example .env   # điền VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm install
npm run dev            # localhost:5173
npm run build
npm run preview
```

Xem [deployment-guide.md](docs/deployment-guide.md) để setup Supabase schema và biến môi trường.

## Tính năng chính

| Tính năng | Mô tả |
|-----------|-------|
| 4 Views | Dashboard, Month, Week, Timeline (Gantt) |
| Campaign CRUD | Tạo/sửa/xóa/nhân bản campaign |
| Brand Management | Quản lý thương hiệu (Admin only) |
| Milestones | Mốc tiến độ trong campaign |
| Real-time | Sync tức thì qua Supabase Realtime |
| Role-based | Admin / Editor / Viewer |
| Export PNG | Xuất ảnh cả 3 view lịch |
| Change Log | Audit trail toàn bộ thao tác |
| Dark/Light Mode | Theo system preference |

## Roles & Permissions

| Action | Admin | Editor | Viewer |
|--------|-------|--------|--------|
| Xem | ✅ | ✅ | ✅ |
| Tạo campaign | ✅ | ✅ | ❌ |
| Sửa campaign | ✅ | ✅ | ❌ |
| Xóa campaign | ✅ | ❌ | ❌ |
| Quản lý brand | ✅ | ❌ | ❌ |
| Quản lý user | ✅ | ❌ | ❌ |

## Docs

- [Project Overview & PDR](docs/project-overview-pdr.md)
- [System Architecture](docs/system-architecture.md)
- [Codebase Summary](docs/codebase-summary.md)
- [Code Standards](docs/code-standards.md)
- [Deployment Guide](docs/deployment-guide.md)
- [Project Roadmap](docs/project-roadmap.md)

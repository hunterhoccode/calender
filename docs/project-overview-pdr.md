# Project Overview & PDR — CMP PRO

## Tổng quan

**CMP PRO** (Campaign Manager Pro) là ứng dụng web quản lý lịch marketing tập trung cho team. Cho phép các team marketing lên kế hoạch, theo dõi và cộng tác trên các chiến dịch marketing theo thời gian thực.

## Mục tiêu sản phẩm

- Cung cấp một "single source of truth" cho toàn bộ lịch marketing của công ty
- Hỗ trợ nhiều brand trong cùng một workspace
- Phân quyền rõ ràng (Admin / Editor / Viewer) để kiểm soát ai được chỉnh sửa gì
- Cộng tác real-time: mọi thay đổi sync ngay cho tất cả user đang online
- Giao diện trực quan với nhiều cách xem (tháng, tuần, timeline Gantt)

## Đối tượng người dùng

| Vai trò | Mô tả |
|---------|-------|
| Marketing Manager | Lên kế hoạch chiến dịch, phân công, duyệt nội dung |
| Content/Campaign Editor | Tạo và cập nhật chiến dịch hàng ngày |
| Stakeholder / Viewer | Xem lịch để nắm tiến độ, không cần chỉnh sửa |

## Phạm vi tính năng hiện tại

### Campaign Management
- Tạo, sửa, xóa, nhân bản (duplicate) campaign
- Mỗi campaign có: tên, category, brand, ngày bắt đầu/kết thúc, key message, budget, channels, target audience, notes, details (Markdown), media files
- Drag & drop để thay đổi ngày trực tiếp trên calendar
- Milestones: các mốc tiến độ bên trong campaign (có checkbox completed)
- Comments: bình luận real-time trên từng campaign

### Brand Management
- Tạo/sửa/xóa brand với tên, logo (emoji hoặc URL), màu sắc, mô tả
- Lọc calendar theo brand (chỉ hiện campaign của brand đó)

### Calendar Views
| View | Mô tả |
|------|-------|
| Dashboard | Thống kê tổng quan: số campaign, phân bổ category, budget, milestones, overlap |
| Month | Lưới tháng, campaign hiện dưới dạng bar màu |
| Week | Lưới tuần 7 ngày, chi tiết hơn |
| Timeline | Gantt chart, kéo thả để resize campaign |

### Bộ lọc
- Lọc theo category (big-campaign, flash-sale, social, email, event, content)
- Lọc theo status (active, upcoming, completed)
- Tìm kiếm theo tên / key message

### Export
- Xuất ảnh PNG cho cả 3 view calendar (dùng html2canvas)

### User Management (Admin only)
- Tạo user mới với role
- Đổi role user
- Xóa user
- Chỉnh sửa profile cá nhân (display name, password)

### Change Log
- Audit trail toàn bộ thao tác CRUD
- Lưu user, action, tên đối tượng, timestamp
- FIFO 500 entries (trigger tự xóa cũ)

### UI/UX
- Dark / Light mode (theo system preference, có toggle)
- Font: Plus Jakarta Sans
- Responsive mobile
- Splash screen khi load
- Accessibility: aria-labels, prefers-reduced-motion, color contrast

## Các giới hạn hiện tại

- Không có approval workflow (campaign tạo ra là active ngay)
- Không có notification / reminder
- Không có template campaign
- Export chỉ hỗ trợ PNG, chưa có PDF/Excel
- Không tích hợp calendar bên ngoài (Google Calendar, etc.)
- Comments chưa có notification khi có reply mới

## Định nghĩa hoàn thành (DoD)

Một tính năng được coi là hoàn thành khi:
1. Hoạt động đúng với cả 3 role (Admin, Editor, Viewer)
2. RLS Supabase chặn đúng ở DB layer
3. Real-time sync hoạt động (thay đổi của user A hiện cho user B)
4. Responsive trên mobile
5. Change log ghi nhận đúng action

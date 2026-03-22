# Feature Roadmap - CMP PRO Marketing Calendar

## Đã hoàn thành ✅

### Core
- [x] Supabase backend (Auth, Database, Realtime, Storage)
- [x] Role-based access (Admin, Editor, Viewer)
- [x] Campaign CRUD + Drag & Drop
- [x] Brand management
- [x] 3 views: Month, Week, Timeline (Gantt)
- [x] Milestone tracking
- [x] Markdown editor cho campaign details
- [x] Media upload (Supabase Storage)
- [x] Change log (audit trail)
- [x] Export ảnh PNG cho cả 3 views

### Mới thêm
- [x] Dashboard tổng quan (stats, category distribution, budget, milestones, overlaps)
- [x] Duplicate Campaign (nhân bản chiến dịch)
- [x] Comments (bình luận real-time trên campaign)
- [x] Profile edit (đổi tên, mật khẩu)

### UI/UX
- [x] Dark theme + Plus Jakarta Sans font
- [x] Responsive mobile
- [x] Accessibility (aria-labels, prefers-reduced-motion, color contrast)
- [x] Confirm dialog cho delete
- [x] SVG icons (Lucide) thay emoji

---

## Ưu tiên cao 🔴 (Nên làm tiếp)

### 1. Thông báo & Nhắc nhở
**Mô tả:** Nhắc khi milestone/campaign sắp đến hạn
**Chi tiết:**
- Browser push notification khi milestone còn 1-3 ngày
- Email notification (tích hợp Supabase Edge Functions + Resend/SendGrid)
- Badge đỏ trên sidebar khi có milestone quá hạn
- Tùy chọn bật/tắt thông báo cho từng user

**Tech:** Supabase Edge Functions, Web Push API, cron job

### 2. Template Campaign
**Mô tả:** Lưu campaign mẫu để tái sử dụng nhanh
**Chi tiết:**
- Nút "Lưu làm Template" trong campaign detail
- Thư viện template: Tết, Black Friday, Flash Sale, Product Launch...
- Tạo campaign mới từ template - chỉ cần đổi ngày
- Template có thể chia sẻ giữa các user

**Tech:** Bảng `campaign_templates` trong Supabase, UI tương tự campaign drawer

### 3. Approval Workflow
**Mô tả:** Editor tạo campaign → Admin duyệt → Publish
**Chi tiết:**
- Trạng thái mới: Draft → Pending Approval → Approved → Active
- Editor chỉ tạo được Draft
- Admin nhận notification khi có campaign chờ duyệt
- Nút Approve/Reject trong detail modal
- Lịch sử duyệt trong changelog

**Tech:** Thêm cột `approval_status` vào campaigns table, RLS policies mới

---

## Ưu tiên trung bình 🟡

### 4. Kanban Board View
**Mô tả:** View dạng bảng kéo thả giữa các cột trạng thái
**Chi tiết:**
- Cột: Lên kế hoạch | Đang chạy | Hoàn thành
- Drag & drop campaign giữa các cột
- Hiện brand icon, ngày, budget trên mỗi card
- Filter theo brand/category

**Tech:** React DnD hoặc @hello-pangea/dnd, thêm view mới trong App.jsx

### 5. Báo cáo & Export nâng cao
**Mô tả:** Export PDF/Excel báo cáo theo tháng/quý
**Chi tiết:**
- Báo cáo tổng hợp: số campaign, ngân sách, kênh triển khai
- So sánh theo tháng/quý (biểu đồ trend)
- Export PDF với logo company
- Gửi báo cáo tự động qua email (weekly/monthly)

**Tech:** jsPDF hoặc @react-pdf/renderer, Supabase Edge Functions cho email

### 6. Tích hợp Google Calendar
**Mô tả:** Sync 2 chiều với Google Calendar
**Chi tiết:**
- Campaign tự động tạo event trên Google Calendar
- Milestone → reminder trên Google Calendar
- Xem Google Calendar events trong app
- OAuth2 login với Google

**Tech:** Google Calendar API, OAuth2, Supabase Edge Functions

### 7. Tích hợp Slack/Zalo
**Mô tả:** Notification khi có thay đổi campaign
**Chi tiết:**
- Webhook gửi tin nhắn khi: campaign tạo mới, cập nhật, milestone đến hạn
- Chọn channel Slack/Zalo group để nhận thông báo
- Format tin nhắn đẹp với campaign info

**Tech:** Slack Webhook API, Zalo OA API, Supabase Edge Functions

---

## Ưu tiên thấp 🟢 (Dài hạn)

### 8. Multi-workspace
**Mô tả:** Mỗi công ty/team có workspace riêng
**Chi tiết:**
- Tạo workspace mới (tên, logo, domain)
- Invite thành viên vào workspace
- Data tách biệt giữa các workspace
- Billing per workspace (nếu làm SaaS)

**Tech:** Bảng `workspaces`, thêm `workspace_id` vào tất cả tables, RLS theo workspace

### 9. AI Assistant
**Mô tả:** AI gợi ý nội dung và phân tích campaign
**Chi tiết:**
- Gợi ý key message dựa trên ngành hàng + mùa
- Phân tích thời điểm tốt nhất để chạy campaign
- Tự động phát hiện campaign trùng lặp/xung đột
- Tóm tắt hiệu suất campaign bằng AI

**Tech:** Claude API / OpenAI API, Supabase Edge Functions

### 10. Kết nối Facebook/Google Ads
**Mô tả:** Xem hiệu suất quảng cáo thực tế trong app
**Chi tiết:**
- Kết nối Facebook Ads Manager
- Kết nối Google Ads
- Hiện metrics: impressions, clicks, CTR, spend
- So sánh budget kế hoạch vs thực tế

**Tech:** Facebook Marketing API, Google Ads API, OAuth2

### 11. Mobile App
**Mô tả:** Ứng dụng di động native
**Chi tiết:**
- Xem lịch, nhận thông báo push
- Duyệt campaign khi di chuyển
- Tận dụng Supabase backend hiện tại

**Tech:** React Native hoặc Flutter, chia sẻ Supabase backend

### 12. Activity Analytics
**Mô tả:** Dashboard phân tích hoạt động team
**Chi tiết:**
- Ai tạo/sửa nhiều campaign nhất
- Thời gian trung bình từ Draft → Active
- Campaign completion rate
- Heatmap hoạt động theo ngày/giờ

**Tech:** Aggregate queries trên changelog + campaigns tables

---

## Ghi chú kỹ thuật

### Stack hiện tại
- **Frontend:** React 19 + Vite 8
- **Styling:** Pure CSS + CSS Variables
- **Backend:** Supabase (PostgreSQL + Auth + Realtime + Storage)
- **Icons:** Lucide React
- **Date:** date-fns
- **Markdown:** marked + DOMPurify

### Database tables hiện có
- `profiles` - User profiles + roles
- `campaigns` - Campaign data
- `milestones` - Campaign milestones
- `brands` - Brand management
- `changelog` - Audit trail
- `campaign_comments` - Comments

### Supabase project
- URL: https://rvdpjrxaxvdbouwichru.supabase.co
- Storage bucket: `campaign-media`

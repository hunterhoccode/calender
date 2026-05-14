# Project Roadmap — CMP PRO

## Đã hoàn thành

### Core
- Firebase backend (Auth, Firestore, Storage)
- Role-based access: Admin / Editor / Viewer
- Campaign CRUD + Drag & Drop ngày trên calendar
- Brand management
- 3 calendar views: Month, Week, Timeline (Gantt)
- Milestone tracking bên trong campaign
- Markdown editor cho campaign details
- Media upload (Firebase Storage)
- Change log / audit trail (FIFO 500 entries)
- Export ảnh PNG cho cả 3 views

### Tính năng gần đây
- Dashboard tổng quan (stats, category distribution, budget, milestones, overlaps)
- Duplicate Campaign (nhân bản chiến dịch kèm milestones)
- Comments real-time trên campaign
- Profile edit (đổi tên, mật khẩu)
- Dark / Light mode toggle

---

## Ưu tiên cao (làm tiếp)

### 1. Thông báo & Nhắc nhở
**Mục tiêu:** Nhắc khi milestone/campaign sắp đến hạn

Chi tiết:
- Browser push notification khi milestone còn 1–3 ngày
- Email notification (Firebase Cloud Functions + Resend/SendGrid)
- Badge đỏ trên sidebar khi có milestone quá hạn
- Tùy chọn bật/tắt per user

Stack: Firebase Cloud Functions, Firebase Cloud Messaging (FCM), Cloud Scheduler

### 2. Template Campaign
**Mục tiêu:** Lưu campaign mẫu để tái sử dụng nhanh

Chi tiết:
- Nút "Lưu làm Template" trong campaign detail
- Thư viện template (Tết, Black Friday, Flash Sale, Product Launch...)
- Tạo campaign mới từ template — chỉ đổi ngày
- Chia sẻ template giữa user

Stack: Collection `campaignTemplates` trong Firestore

### 3. Approval Workflow
**Mục tiêu:** Editor tạo → Admin duyệt → Publish

Chi tiết:
- Trạng thái: Draft → Pending Approval → Approved → Active
- Editor chỉ tạo được Draft
- Admin nhận notification khi có campaign chờ duyệt
- Nút Approve/Reject trong detail modal
- Lịch sử duyệt trong changelog

Stack: Thêm field `approvalStatus` vào campaigns, Firestore Security Rules mới

---

## Ưu tiên trung bình

### 4. Kanban Board View
Cột: Lên kế hoạch | Đang chạy | Hoàn thành. Drag & drop giữa cột.

Stack: `@hello-pangea/dnd`, thêm view mới trong App.jsx

### 5. Báo cáo & Export nâng cao
Export PDF/Excel tổng hợp theo tháng/quý, gửi email tự động.

Stack: `@react-pdf/renderer` hoặc jsPDF, Firebase Cloud Functions

### 6. Tích hợp Google Calendar
Sync 2 chiều: campaign → Google Calendar event, milestone → reminder.

Stack: Google Calendar API, OAuth2

### 7. Tích hợp Slack/Zalo
Notification khi có thay đổi campaign quan trọng.

Stack: Slack Webhooks / Zalo OA API, Firebase Cloud Functions

---

## Ưu tiên thấp / Tương lai

### 8. Phân tích & Insights
So sánh performance campaign theo tháng/quý, heatmap hoạt động.

### 9. Multi-workspace
Nhiều workspace cho nhiều team/công ty trong cùng tài khoản.

### 10. Mobile App (React Native)
Companion app để xem lịch và nhận notification trên điện thoại.

### 11. AI Suggestions
Gợi ý thời điểm tốt để chạy campaign, phân tích overlap, đề xuất channels.

---

## Technical Debt

| Item | Mức độ | Ghi chú |
|------|--------|---------|
| Migrate sang TypeScript | Thấp | JSX hiện tại hoạt động tốt |
| Unit tests | Thấp | Cần khi codebase scale |
| Restrict Firebase API key (HTTP referrers) | Trung bình | Làm trên Google Cloud Console — chưa tự động hóa được qua code |
| Add production domain vào Firebase Auth → Authorized domains | Trung bình | Cần làm khi có custom domain |
| Migrate fully sang Firestore REST cho mọi reads | Thấp | Tránh "client is offline" do extension chặn SDK WebChannel |
| index.css quá lớn (4039 LOC) | Thấp | Tách thành CSS modules khi cần |

## Security & Maintenance

| Hoạt động | Tần suất | Ghi chú |
|-----------|----------|---------|
| `npm audit` | Mỗi tháng / trước release | `npm audit fix` xử lý ngay nếu Critical/High |
| Review Firestore Security Rules | Khi thêm collection mới | Deploy qua `firebase deploy --only firestore:rules` |
| Rotate Firebase API key | Khi nghi ngờ leak | Tạo key mới trên Google Cloud Console + update Vercel env vars |
| Backup Firestore | Trước migration / hàng tuần | `gcloud firestore export` (cần Blaze plan cho scheduled backup) |

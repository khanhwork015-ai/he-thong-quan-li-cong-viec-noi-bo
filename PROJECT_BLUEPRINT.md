# PROJECT BLUEPRINT: HỆ THỐNG QUẢN LÝ CÔNG VIỆC NỘI BỘ THANH VŨ MEDIC CS3
> **Tiêu chuẩn thiết kế:** SHIN AIOS v2.7.0 (Google Stitch UI, Gold Accent `#D6A52A`, Mobile-First)  
> **Kiến trúc:** 3 Tầng Clean Architecture (Vanilla ES Modules + Service Worker PWA + Google Apps Script)  
> **Ngày phê duyệt:** 09/11/2026

---

## 1. TỔNG QUAN HỆ THỐNG
Hệ thống Quản lý Công việc & Điều hành Nội bộ dành cho Bệnh viện Đa khoa Thanh Vũ Medic Cơ Sở 3 (Cà Mau), vận hành theo mô hình đa phòng ban (Multi-Department Ready) và đa bộ phận con (Teams/Sub-departments), phân quyền 4 cấp độ nghiêm ngặt, hỗ trợ phê duyệt 1-chạm và trung tâm thông báo thời gian thực.

---

## 2. MA TRẬN PHÂN QUYỀN RBAC (4 CẤP ĐỘ BẢO MẬT CHẶT CHẼ)

| Cấp Độ | Vai Trò (Role) | Thẩm Quyền Được Phép | Giới Hạn Nghiêm Ngặt |
| :--- | :--- | :--- | :--- |
| **Cấp 1** | **👑 ADMIN**<br>*(Quản Trị Viên Hệ Thống)* | • Toàn quyền cấu hình hệ thống.<br>• Thêm / Sửa / Xóa phòng ban & bộ phận con.<br>• **Duy nhất Admin được cấp tài khoản**, phân quyền (set role) và khóa tài khoản nhân sự.<br>• Xem và quản lý toàn bộ task toàn viện. | Không có giới hạn kỹ thuật. |
| **Cấp 2** | **🏛️ LEADERSHIP**<br>*(Giám Đốc / Ban Lãnh Đạo)* | • Toàn quyền xem và giám sát tất cả các phòng ban và bộ phận con.<br>• Xem **Executive Dashboard** tinh gọn với biểu đồ phân bổ tiến độ toàn viện.<br>• Phê duyệt 1-chạm các công việc / đề xuất cấp bệnh viện.<br>• Tạo và giao việc cho bất kỳ ai. | **TUYỆT ĐỐI KHÔNG** được cấp tài khoản hoặc set role nhân viên (giữ giao diện sạch). |
| **Cấp 3** | **👔 MANAGER**<br>*(Trưởng / Phó Phòng Ban)* | • Quản trị toàn diện công việc trong phòng ban mình trực thuộc.<br>• Phân chia việc cho các tổ/bộ phận con.<br>• Phê duyệt 1-chạm các công việc cần xác nhận cấp phòng.<br>• Xem thống kê năng suất nhân sự của phòng. | **KHÔNG ĐƯỢC PHÉP CẤP TÀI KHOẢN**.<br>Bị chặn không xem được công việc riêng tư / dữ liệu nhạy cảm của phòng ban khác. |
| **Cấp 4** | **👤 MEMBER**<br>*(Nhân Viên / Chuyên Viên)* | • Tạo task mới, assign task cho đồng nghiệp.<br>• Đọc task, cập nhật tiến độ, kéo thả trạng thái task mình phụ trách / liên quan.<br>• Bình luận, đính kèm checklist, gửi yêu cầu phê duyệt.<br>• Chỉnh sửa hồ sơ cá nhân (Profile, Avatar, Mật khẩu). | Chỉ có quyền thao tác trên task được phân công hoặc tạo ra; không xem cài đặt hệ thống. |

---

## 3. CƠ CHẾ NGHIỆP VỤ CỐT LÕI

### 3.1. Phê Duyệt 1-Chạm (One-Tap Approval Workflow)
1. **Khởi tạo:** Khi tạo hoặc chỉnh sửa task, người dùng có thể bật switch *"Cần phê duyệt"* và chọn người duyệt đích danh (chỉ hiện danh sách Lãnh đạo hoặc Trưởng phòng liên quan).
2. **Trạng thái:** Task chuyển sang badge vàng cam `CHỜ DUYỆT` (`PENDING_APPROVAL`).
3. **Phê duyệt:** Người duyệt nhận thông báo tức thì, khi mở task sẽ có 2 nút hành động nhanh chuẩn **Touch Target ≥ 44px**:
   - `✓ Duyệt ngay` -> Task chuyển sang `IN_PROGRESS` hoặc `DONE`, ghi nhận Audit Log người duyệt và thời gian.
   - `✕ Từ chối` -> Mở prompt nhập lý do ngắn gọn, task chuyển về người tạo để điều chỉnh.

### 3.2. Trung Tâm Thông Báo (Notification Center & Deep Linking)
1. **Sự kiện kích hoạt thông báo:**
   - Khi được giao việc mới (Task Assignment).
   - Khi trạng thái task thay đổi (Status Changed).
   - Khi có comment mới trên task mình theo dõi (New Comment).
   - Khi có yêu cầu phê duyệt gửi đến người duyệt (Approval Requested / Resolved).
2. **Trải nghiệm người dùng:**
   - Chuông thông báo trên Top Header với badge đỏ hiển thị số lượng chưa đọc.
   - Bấm vào chuông: Mở Notification Drawer / Popover trực quan.
   - **Click vào thông báo:** Đánh dấu đã đọc + tự động điều hướng và trượt mở **Task Detail Drawer** đúng ID task đó.
3. **Đồng bộ:** Kết hợp **Optimistic UI Update** (cập nhật tức thì trên client) + **Smart Polling 30s** đồng bộ với Google Sheets/Apps Script.

### 3.3. Executive Dashboard Dành Cho Giám Đốc / Lãnh Đạo
Thiết kế theo **Archetype B của SHIN v2.7**:
- **Compact Bar (40px):** Chọn phạm vi xem (Toàn viện hoặc Lọc theo từng phòng ban).
- **4 Thẻ KPI Cốt Lõi:**
  1. *Tổng khối lượng việc toàn viện*
  2. *Tỷ lệ hoàn thành đúng hạn (%)*
  3. *Việc khẩn cấp đang chờ duyệt (Highlight viền vàng cam cảnh báo)*
  4. *Việc đang quá hạn (Cần can thiệp)*
- **1 Biểu đồ tiến độ trực quan (Horizontal Stacked Bar / Progress Grid):**
  - Hiển thị so sánh tiến độ hoàn thành giữa các phòng ban (PTKH, Kho Dược, QLDA, ...).
- **Khu vực duyệt khẩn cấp (Quick Approval Queue):** Danh sách các việc đang chờ Ban Lãnh đạo ký duyệt với nút bấm 1-chạm.

---

## 4. KIẾN TRÚC KỸ THUẬT & AN TOÀN BẢO MẬT (CLEAN ARCHITECTURE)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. PRESENTATION LAYER (Giao diện chuẩn SHIN AIOS v2.7 Mobile-First)          │
│ • HTML5 Semantic, CSS Grid/Flexbox, Tailwind CSS + Google Stitch Token      │
│ • View Controllers: DashboardView (Executive), WorkspaceView, TaskDrawer,   │
│   NotificationDrawer, LoginView, MemberModal, DepartmentModal               │
│ • An toàn DOM: 100% dữ liệu render qua esc(), link qua anToanUrl()          │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. APPLICATION & STATE LAYER (Vanilla JS ES Modules)                        │
│ • auth.js: RBAC 4 cấp, Session Expire, Hash SHA-256 + Salt cho password     │
│ • store.js: Reactive State (Tasks, Departments, Users, Notifications)       │
│ • notificationService.js: Quản lý sự kiện, badge count, trigger notify     │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. DATA ACCESS & SYNC LAYER (Google Apps Script + LocalStorage Cache)       │
│ • appScriptBridge.js: Quản lý hàng đợi API, Exponential Backoff retry       │
│ • Backend Code.gs: Web App REST endpoint (doGet / doPost), Data Isolation    │
│ • Google Spreadsheet: Lưu trữ TASKS, USERS, DEPARTMENTS, NOTIFICATIONS      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. KẾ HOẠCH BÀN GIAO & PHÂN NHIỆM SUBAGENT

| Hạng mục | File phụ trách | Mô tả chi tiết |
| :--- | :--- | :--- |
| **Phân quyền mới & Auth** | `js/auth.js`, `js/models.js` | Khóa quyền cấp acc chỉ cho Admin. Chuẩn hóa 4 role: ADMIN, LEADERSHIP, MANAGER, MEMBER. Băm mật khẩu SHA-256. |
| **Notification Center** | `js/store.js`, `js/components/topHeader.js`, `js/components/notificationDrawer.js` | Tạo bảng thông báo, badge đếm, click nhảy thẳng vào Task Detail Drawer. |
| **Phê duyệt 1-chạm** | `js/components/createTaskModal.js`, `js/components/taskDrawer.js` | Chọn người duyệt khi tạo task. Nút duyệt/từ chối 1-chạm chuẩn 44px. |
| **Executive Dashboard** | `js/components/dashboardView.js` | 4 thẻ KPI toàn viện + biểu đồ tiến độ phòng ban + hàng đợi duyệt khẩn cấp. |
| **Bộ phận con (Teams)** | `js/components/createTaskModal.js`, `js/components/departmentModal.js` | Cho phép chọn bộ phận con hoặc để trống (Toàn phòng ban). |
| **Backend GAS** | `google-apps-script/Code.gs` | Thêm Sheet NOTIFICATIONS, hoàn thiện API lưu vết và đồng bộ. |

# PROJECT CONTEXT MEMORY: THANH VŨ MEDIC CS3
> **Tài liệu duy trì bộ nhớ ngữ cảnh dự án (Context Hygiene)**  
> **Cập nhật lần cuối:** 09/11/2026 15:45 (Hoàn thành triển khai toàn diện Phase 1)

---

## 1. TỔNG QUAN & HIỆN TRẠNG DỰ ÁN
- **Mục tiêu:** Hệ thống Quản trị công việc nội bộ và điều hành đa phòng ban dành cho Bệnh viện Đa Khoa Thanh Vũ Medic Cơ Sở 3 (Cà Mau).
- **Trạng thái:** Đã có khung giao diện Google Stitch, PWA, demo GitHub Pages. Đang tiến hành nâng cấp toàn diện phân quyền 4 cấp, Notification Center, Phê duyệt 1-chạm và Executive Dashboard.
- **Công nghệ cốt lõi:**
  - Frontend: Vanilla JavaScript (ES Modules), Tailwind CSS, Google Stitch Tokens (`stitch-theme.css`).
  - Backend: Google Apps Script Web App (`Code.gs`) kết nối Google Spreadsheet đa bảng.
  - Lưu trữ client: LocalStorage kết hợp Service Worker offline caching.

---

## 2. BẢN ĐỒ CẤU TRÚC FILE (FILE TREE & TRÁCH NHIỆM)
- `index.html`: Shell chính, anti-flicker script, semantic containers.
- `js/models.js`: Khai báo hằng số ROLES (ADMIN, LEADERSHIP, MANAGER, MEMBER), DEPARTMENTS, TEAMS, USERS mẫu, INITIAL_TASKS, INITIAL_NOTIFICATIONS.
- `js/auth.js`: Quản lý phiên đăng nhập, phân quyền RBAC chặt chẽ (Admin cấp acc, Lãnh đạo xem/duyệt, Trưởng phòng quản trị nội bộ phòng, Nhân viên tạo/assign/sửa profile), băm mật khẩu SHA-256.
- `js/store.js`: Reactive Store chứa state: tasks, users, depts, notifications. Đồng bộ với Google Apps Script và LocalStorage.
- `js/helpers.js`: Tiện ích bảo mật `esc()`, `anToanUrl()`, định dạng `ngayVN()`, `soVN()`, `toast()`, `rung()`.
- `js/components/`:
  - `topHeader.js`: Header cố định, nút tạo task, chuông thông báo (Notification Badge + Popover), profile menu, switch role (chế độ demo).
  - `sidebar.js`: Điều hướng chính desktop/mobile drawer, chuyển đổi phòng ban (Admin/Lãnh đạo).
  - `bottomNav.js`: Thanh điều hướng đáy chuẩn công thái học Mobile-First.
  - `dashboardView.js`: Executive Dashboard cho Lãnh đạo & Trưởng phòng: 4 KPI, biểu đồ tiến độ phòng ban, hàng đợi duyệt việc.
  - `workspaceView.js`: Bảng Kanban & Table View cho công việc, bộ lọc tab nhanh, tìm kiếm.
  - `taskDrawer.js`: Ngăn kéo trượt xem chi tiết công việc, bình luận nội bộ, checklist, phê duyệt 1-chạm.
  - `createTaskModal.js`: Modal tạo việc mới, chỉ định người thực hiện, chọn bộ phận con, bật switch duyệt & chọn người duyệt.
  - `notificationDrawer.js`: Khối hiển thị thông báo, đánh dấu đã đọc, deep-link mở thẳng Task Drawer.
  - `loginView.js`: Form đăng nhập bảo mật.
  - `memberModal.js`: Quản lý tài khoản (chỉ mở cho Admin).
  - `departmentModal.js`: Quản lý phòng ban & bộ phận con (chỉ mở cho Admin).
  - `profileModal.js`: Chỉnh sửa thông tin cá nhân của nhân viên đang đăng nhập.
  - `settingsModal.js`: Cấu hình URL Google Apps Script Web App và giao diện.
- `google-apps-script/Code.gs`: Endpoint REST Web App xử lý CRUD Tasks, Users, Departments, Notifications trên Google Sheets.

---

## 3. TIẾN ĐỘ THỰC HIỆN CÁC TÍNH NĂNG CHÍNH

- [x] **1. Chuẩn hóa Phân quyền RBAC 4 cấp (`js/auth.js`, `js/models.js`)**:
  - Khóa quyền cấp account: Chỉ ADMIN được mở `memberModal` để tạo acc và set role.
  - MANAGER bị chặn cấp account.
  - LEADERSHIP có toàn quyền xem nhưng không cấp account.
  - MEMBER chỉ tạo/assign task và chỉnh sửa profile.
- [x] **2. Phê duyệt 1-chạm (`createTaskModal.js`, `taskDrawer.js`, `store.js`)**:
  - Form tạo task cho phép bật "Yêu cầu phê duyệt" và chọn đích danh người duyệt (Lãnh đạo hoặc Trưởng phòng).
  - TaskDrawer hiển thị thanh duyệt 1-chạm (Duyệt / Từ chối kèm lý do).
- [x] **3. Trung tâm Thông báo Notification Center (`notificationDrawer.js`, `topHeader.js`, `store.js`)**:
  - Lưu vết thông báo khi: được giao việc, đổi trạng thái, có comment, có yêu cầu duyệt.
  - Chuông thông báo hiển thị badge đếm số lượng chưa đọc.
  - Click thông báo: Đánh dấu đã đọc + tự động mở TaskDrawer của task tương ứng.
- [x] **4. Executive Dashboard cho Lãnh đạo (`dashboardView.js`)**:
  - 4 Thẻ KPI toàn viện cô đọng.
  - 1 Biểu đồ so sánh tiến độ giữa các phòng ban.
  - Danh sách công việc khẩn cấp chờ duyệt.
- [x] **5. Nâng cấp Google Apps Script (`Code.gs`) & Mã hóa Mật khẩu**:
  - Hỗ trợ bảng NOTIFICATIONS.
  - Băm SHA-256 mật khẩu trên client trước khi xác thực.
- [x] **6. Sửa lỗi Giao diện & Tách biệt Cỡ chữ khỏi Bố cục Layout (`css/stitch-theme.css`, `createTaskModal.js`, `settingsModal.js`)**:
  - Khắc phục hoàn toàn lỗi vỡ layout modal do thẻ đóng `</div>` sớm; thêm `overflow-x-hidden`.
  - Cố định `font-size: 16px` trên `html` để layout (width, padding, modal, drawer) không bị phình to khi tăng cỡ chữ; chỉ scale các class font-size của chữ (1.1x / 1.2x).
  - Cài đặt Google Apps Script Web App và Reset dữ liệu mẫu: CHỈ ADMIN mới nhìn thấy và cập nhật được.
  - Cung cấp nút đồng bộ thông minh 2 chiều duy nhất (`🔄 Đồng Bộ 2 Chiều Ngay`) kèm tùy chọn tải/đẩy nâng cao cho Admin.

---

## 4. QUY TẮC PHÁT TRIỂN & TIẾT KIỆM TOKEN
- Mặc định sử dụng model Gemini Flash.
- Luôn kiểm tra `PROJECT_CONTEXT.md` trước khi thao tác, không scan lại toàn bộ dự án từ đầu.
- Giữ vững 18 tiêu chí DoD Gate chuẩn SHIN AIOS v2.7 (Touch target ≥ 44px, không cuộn ngang, Mobile-first 320px, an toàn DOM `esc()`).
- Sau mỗi đợt cập nhật lớn, cập nhật trạng thái vào file này và khuyến nghị người dùng `/compact`.

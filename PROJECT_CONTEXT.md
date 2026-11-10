# PROJECT CONTEXT MEMORY: THANH VŨ MEDIC CS3
> **Tài liệu duy trì bộ nhớ ngữ cảnh dự án (Context Hygiene)**  
> **Cập nhật lần cuối:** 09/11/2026 15:30 (Hoàn thành tinh chỉnh nút duyệt & đồng bộ git)

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
- [x] **8. Rà Soát Toàn Diện Hệ Thống CRUD, Deep-Link Notification & Tối Ưu Hóa Giao Diện Di Động (`PROJECT_CONTEXT.md`)**:
  - **Kiểm thử tự động 100% CRUD:** Toàn bộ thao tác Thêm, Sửa, Xóa, Cột mốc, Việc con, Phê duyệt, Đổi trạng thái, Bình luận, Đính kèm tài liệu trên Task, Plan, Department, Team, User, Notification đều hoạt động trơn tru 100% (xác minh qua Node test runner `test_all_crud.mjs`).
  - **Deep-linking từ Notification:** Click bất kỳ thông báo nào (trong dropdown chuông ở top header hay ngăn kéo thông báo) sẽ tự động mở thẳng chính xác Task Drawer (`TSK-` / `PTKH-`) hoặc Plan Drawer (`PLN-` / `PLAN-`) hoặc Trung tâm Phê duyệt (`phe-duyet`).
  - **Trung tâm Phê duyệt Executive Approval Hub (`approvalView.js`):** 3 tab trực quan (Công việc chờ duyệt, Kế hoạch chờ duyệt, Lịch sử đã duyệt) hỗ trợ duyệt 1-chạm cá nhân và duyệt hàng loạt (Batch approval).
  - **Khắc phục triệt để lỗi giao diện Mobile theo phản hồi hình ảnh:**
    - Cột mốc (Milestones): Đồng bộ huy hiệu tiến độ theo tông màu vàng hổ phách `amber`, thanh tiến độ gradient `amber-500` đến `emerald-500`. Nút "Thêm mốc" đổi sang style chuẩn của hệ sinh thái, vùng chạm chuẩn $\ge 44$px.
    - Phân rã đầu việc (Tasks breakdown): Loại bỏ ký tự trùng lặp icon `+` trên nút "Chuyển thành Task"; điều chỉnh form nhập việc con sang layout `grid-cols-1 sm:grid-cols-3` chống hoàn toàn việc bị ép cắt ngắn ngày tháng trên điện thoại.
    - Tài liệu đính kèm (Links): Nút "Lưu" đổi sang style chủ đạo hệ thống, kích thước chuẩn 44px, không lệch màu xanh biển.
    - Modal tạo việc: Bổ sung chọn phòng ban tiếp nhận khi đang xem toàn viện và tự động cập nhật danh sách bộ phận con (teams).
  - **Dữ liệu chuẩn bị triển khai bên thứ ba:** Dữ liệu khởi tạo trong `models.js` được làm sạch, hoàn chỉnh và thực tế cho Thanh Vũ Medic CS3.
  - **Cache Buster:** Nâng toàn bộ đường dẫn import JS và `index.html` lên `?v=7.1`.
- [x] **12. Nâng Cấp Giao Diện Phân Công (Assignee Picker) & Giới Hạn Đúng Nhân Sự Phòng Ban (`createTaskModal.js`, `taskDrawer.js`)**:
  - **Giới hạn phạm vi phân công:** Khi tạo hoặc sửa việc cho phòng ban nào (hoặc chuyển phòng ban tiếp nhận), hệ thống tự động lọc chỉ hiển thị đúng các nhân sự thuộc phòng ban đó (và tài khoản toàn viện). Không còn tình trạng hiển thị tràn lan toàn bộ nhân viên viện.
  - **Thay thế hoàn toàn thẻ `<select>` mặc định:** Thiết kế lại bộ chọn thành viên (Member Picker) chuẩn công thái học cao cấp cho toàn bộ hệ thống (Mobile lẫn Desktop):
    - **Trigger Card:** Thẻ hiển thị avatar có đèn online, họ tên, chức danh và badge vai trò (`Trưởng phòng`, `Chuyên viên`), nút bấm "Đổi người" $\ge 56$px.
    - **Member Picker Modal:** Khi bấm sẽ mở bảng chọn nhân viên với ô tìm kiếm nhanh, danh sách thẻ nhân sự có vùng chạm $\ge 48$px, hiển thị tổ/đội con (`[CSKH]`, `[MKT]`) và icon checkmark xác nhận trực quan.
    - Đồng bộ tự động: Khi đổi phòng ban tiếp nhận, tự động nạp lại danh sách nhân sự tương ứng và kiểm tra hợp lệ của người được phân công.
- [x] **11. Loại Bỏ Logo TV & Chữ Thanh Vũ Trên Mobile Top Navbar (`topHeader.js`)**:
  - Gỡ bỏ hoàn toàn badge logo `TV` và text `Thanh Vũ Medic` trên thanh điều hướng di động (< 640px) theo yêu cầu.
  - Phía bên trái header di động nay chỉ giữ lại duy nhất 1 nút Hamburger Menu `☰` chuẩn touch target $\ge 44 \times 44$px, tạo khoảng không gian cực kỳ thoáng đãng, tối giản và chuyên nghiệp.
- [x] **10. Tách Riêng Hàng Thực Hiện & Hạn Hoàn Thành, Chuẩn Hóa Định Dạng Ngày Tháng (`dashboardView.js`, `planDrawer.js`)**:
  - Khắc phục triệt để lỗi hiển thị thời gian thô dạng ISO timestamp (`2026-11-06T15:00:00.000Z`) trong hàng đợi phê duyệt của Dashboard. Bỏ hoàn toàn phần giờ/múi giờ, chỉ giữ lại ngày tháng năm dạng `DD/MM/YYYY` qua hàm `ngayVN()`.
  - Tách riêng thông tin "Thực hiện:" và "Hạn:" thành 2 hàng độc lập trên giao diện Mobile, giúp hiển thị trọn vẹn họ tên nhân viên và hạn chót mà không bị co kéo, ngắt dòng luộm thuộm.
  - Đồng bộ cấu trúc tách hàng tương tự cho danh sách đầu việc bóc tách trong ngăn kéo kế hoạch ([planDrawer.js](file:///d:/TVM%20Project/H%E1%BB%87%20th%E1%BB%91ng%20qu%E1%BA%A3n%20l%C3%BD%20c%C3%B4ng%20vi%E1%BB%87c/js/components/planDrawer.js)).
- [x] **9. Tinh Chỉnh Tối Giản Thanh Điều Hướng (Top Navbar) Cho Mobile (`topHeader.js`)**:
  - Khắc phục triệt để hiện tượng ô tìm kiếm đè/chèn lấn lên nút Dark Mode và các nút chức năng trên màn hình hẹp điện thoại.
  - Trên Mobile (< 640px): Tối giản thanh navbar chỉ còn 4 nút hành động gọn gàng bên phải (Kính lúp tìm kiếm, Khiên phê duyệt 1-chạm, Chuông thông báo, Avatar cá nhân).
  - Tích hợp **Full-width Mobile Search Overlay**: Bấm kính lúp sẽ mở ô tìm kiếm tràn viền toàn bộ header với icon đóng `✕`, tìm kiếm tức thì không chiếm không gian thường trực.
  - Ẩn bớt các nút dư thừa trên mobile bar (`btnQuickThemeToggle`, `btnQuickPalette`, `btnHeaderCreateTask`) và chuyển nút bật/tắt Dark Mode trực tiếp vào trong Menu Avatar (User Menu) với 1-chạm cực kỳ tiện lợi.
  - Fix triệt để lỗi F5 bị mất bộ phận: Đồng bộ hóa cấu trúc teams 2 chiều giữa LocalStorage và Google Sheets (`Code.gs` + `appScriptBridge.js`), hợp nhất dữ liệu không ghi đè mất mát.
  - Fix lỗi placeholder đè lên icon tìm kiếm phòng ban (`pl-10`).
  - Fix lỗi giật layout khi bấm "Thêm bộ phận": Xóa vòng lặp re-render kép, tự động dọn sạch input và hỗ trợ phím Enter.
- [x] **8. Phân Tách Trưởng Phòng Quản Trị Toàn Phòng & Khắc Phục Lỗi Mở/Thao Tác Task Drawer (`departmentView.js`, `store.js`, `taskDrawer.js`, `workspaceView.js`, `Code.gs`)**:
  - **Trưởng phòng độc lập Quản trị Toàn phòng:** Hiển thị thẻ VIP Card riêng biệt có viền vàng kim, huy hiệu Vương Miện `👑 Trưởng Phòng`, khóa cố định "Toàn phòng", không gán vào bộ phận con, loại trừ khỏi danh sách thêm vào bộ phận con để bảo toàn thẩm quyền bao quát toàn phòng.
  - **Khắc phục lỗi mở Task Drawer:** Chuẩn hóa kiểu dữ liệu mảng phòng thủ (defensive array sanitization) cho `subtasks` và `comments` từ Google Sheets/LocalStorage, triệt tiêu lỗi `TypeError: map is not a function` làm sập Drawer.
  - **Đồng bộ hóa trạng thái công việc:** Hỗ trợ đầy đủ ánh xạ giữa `pending_approval` / `review` và `completed` / `done` trên toàn bộ Kanban, Table View và bộ lọc tab.
  - **Chống lưu cache trình duyệt:** Thêm tiền tố versioning `?v=4.2` cho toàn bộ các module ES import giúp GitHub Pages cập nhật ngay lập tức.
- [x] **9. Hỗ Trợ Đầy Đủ Cấp/Sửa Nhân Sự Đa Phòng Ban & Bổ Sung Chức Vụ Phó Trưởng Phòng (`departmentView.js`, `memberModal.js`, `store.js`, `app.js`)**:
  - **Thêm nhân sự cho các phòng ban bất kỳ:** Modal Cấp tài khoản mới tự động nhận diện đúng phòng ban đang được chọn trên màn hình (`defaultDeptId`), không còn bị gán nhầm về phòng đầu tiên.
  - **Bổ sung vai trò Phó Trưởng Phòng (`DEPUTY_MANAGER`):** Đã bổ sung tùy chọn `⭐ Phó Trưởng Phòng (DEPUTY_MANAGER)` vào danh sách vai trò phân quyền và thẻ hiển thị riêng biệt.
  - **Nút sửa thông tin & thăng chức trực tiếp:** Thêm nút icon bút chì `Sửa` trên mọi thẻ nhân viên, Trưởng phòng và Phó phòng trong giao diện phòng ban.
  - **Trạng thái phòng ban trống:** Hiển thị nút kêu gọi hành động (CTA) nổi bật `+ Cấp Tài Khoản Nhân Sự Đầu Tiên` khi phòng ban chưa có nhân sự nào.
  - **Tự động thăng cấp khi gán Trưởng phòng:** Khi gán một chuyên viên làm Trưởng phòng trong form sửa phòng ban, hệ thống tự động cập nhật role thành `MANAGER`.
- [x] **10. Nâng Cấp Quản Lý Nhân Sự Toàn Viện & Bộ Lọc Phòng Ban Trực Quan (`app.js`, `store.js`, `auth.js`, `sidebar.js`, `departmentView.js`)**:
  - **Bộ lọc phòng ban trên trang Nhân sự:** Admin có thể chuyển đổi mượt mà giữa xem `🏥 Toàn viện (${allCount})` và từng phòng ban (`Khoa Dược`, `PTKH`, `Ban QLDA`) bằng thanh tab cuộn ngang.
  - **Tự động tìm kiếm nhân sự:** Tích hợp ô tìm kiếm theo tên, chức danh, email, số điện thoại, username ngay trên trang Nhân sự.
  - **Đồng bộ hóa phạm vi phòng ban toàn viện (`'all'`):** Hỗ trợ trạng thái phòng ban `all` trong `auth.js`, `store.js` (`getDepartmentUsers('all')` trả về 100% nhân sự) và modal chuyển đổi phòng ban ở Sidebar.
  - **Đồng bộ khi chọn phòng ban trong Quản lý cơ cấu:** Bấm chọn phòng ban ở `DepartmentView` tự động đồng bộ `activeDepartment` sang phòng ban đó cho toàn bộ ứng dụng.
- [x] **11. Nâng Cấp Quản Lý Việc Con (Subtasks), Thông Tin Người Tạo, Custom Status Dropdown & Bỏ Ca Trực (`taskDrawer.js`, `workspaceView.js`, `topHeader.js`, `store.js`)**:
  - **Lưu vết và hiển thị Người tạo & Thời gian tạo:** Lưu trữ đầy đủ `creatorId`, `creatorName`, `createdAt` trong `store.js`; hiển thị rõ ràng trên thẻ công việc (Mobile Cards, Table View, Kanban) và trong Task Drawer.
  - **Quản lý danh sách việc con (Subtasks Checklist) & Chi tiết như một Task hoàn chỉnh:**
    + Mỗi việc con là một task hoàn chỉnh mang đầy đủ: Mã việc con (`${taskId}.${index}`), Tiêu đề, Mô tả chi tiết & Tiêu chuẩn bàn giao, Người được phân công (`assigneeId`), Hạn chót (`dueDate`), Trạng thái (`status`: Chưa làm / Đang làm / Hoàn thành).
    + Cho phép chỉnh sửa trực tiếp (Inline Edit Form) từng việc con hoặc xóa bỏ.
    + Form thêm việc con mới mở rộng đầy đủ các trường nhập chuyên nghiệp.
    + Tự động tính % tiến độ công việc cha dựa trên tỷ lệ việc con hoàn thành.
  - **Xem việc con ở bên ngoài danh sách (Dropdown Accordion - Chuẩn Mobile & Tablet):**
    + Trên Bảng Table View (Desktop & Tablet): Nút `[ x/y việc con ▾ ]` xổ ra hàng phụ hiển thị lưới thẻ các việc con với thông tin ngắn gọn, bấm vào xem chi tiết ngay.
    + Trên Mobile Cards: Thanh bấm mở rộng `Việc con (x/y)` xổ dropdown các thẻ việc con thụt lề mượt mà, hỗ trợ thao tác chạm mượt trên mobile 320px - 414px, không tràn ngang.
  - **Custom Status Dropdown (Không dùng OS default):** Thay thế `<select>` mặc định của hệ điều hành bằng menu popup tùy biến cao cấp phong cách Google Stitch Gold.
  - **Mở rộng khung nhập bình luận & chỉ đạo:** Tăng chiều cao lên `min-h-[90px]` với thẻ `<textarea>` rộng rãi.
  - **Loại bỏ huy hiệu Ca trực:** Đã xóa bỏ hoàn toàn badge `Ca hành chính: 07:00 - 17:00` khỏi Top Header theo yêu cầu.
- [x] **12. Loại Bỏ Biểu Tượng Trùng Lặp Trên Nút Phê Duyệt & Từ Chối (`taskDrawer.js`)**:
  - Loại bỏ ký tự `✕` và `✓` trong nhãn văn bản, giữ lại đúng 1 Material Symbol (`close` cho "Từ Chối", `verified` cho "Phê Duyệt 1-Chạm") tạo giao diện sạch sẽ, chuyên nghiệp chuẩn Touch Target ≥ 44px.
  - Đẩy cache buster toàn diện `?v=4.8` và đồng bộ git `origin/main`.
- [x] **13. Sửa Triệt Để Lỗi Lưu & Khắc Phục Mất Dữ Liệu Việc Con (Subtasks Persistence & Zero Data Loss)**:
  - **Khắc phục lỗi F5 bị mất việc con:** Xây dựng cơ chế hợp nhất dữ liệu 2 chiều (Two-Way Safe Merge) giữa LocalStorage và Cloud trong `store.js` (`syncFromCloudIfAvailable` & `pullAllFromCloud`), ngăn chặn triệt để tình trạng cloud trống/cũ đè mất việc con mới tạo.
  - **Đồng bộ song hành `subtasks` & `checklist`:** Duy trì cập nhật song song 2 trường dữ liệu trên toàn bộ các phương thức `createTask`, `addSubtask`, `updateSubtask`, `toggleSubtask`, `deleteSubtask` và `Code.gs`.
  - **Thêm việc con ngay khi tạo công việc mới:** Nâng cấp modal `createTaskModal.js` cho phép người dùng thêm 1 hoặc nhiều việc con ban đầu trước khi bấm "Tạo & Giao Việc".
  - **Phòng vệ kiểu dữ liệu:** Thêm fallback `currentUser` an toàn trong `store.js` chống lỗi sập khi session chưa sẵn sàng.
  - Cập nhật cache buster `?v=4.9` và đồng bộ Git `origin/main`.
- [x] **14. Nâng Cấp Nút Show Task Con Riêng Biệt, Modal Chi Tiết Việc Con & Chỉnh Sửa Task Cha Toàn Diện**:
  - **Bỏ dropdown nhỏ trong tiêu đề:** Thay thế bằng nút bấm độc lập chuẩn Touch Target $\ge 44\text{px}$ trên Table (`.btn-open-subtasks-modal`) và Mobile Card full-width (`Danh sách việc con (x/y) • Chi tiết >`).
  - **Modal Chi Tiết Việc Con (`subtaskDetailModal.js`):** Hiển thị chi tiết toàn diện của việc con (mã, tiêu đề, task cha, người phụ trách kèm avatar, hạn chót, mô tả & tiêu chuẩn bàn giao, checkbox hoàn thành và nút sửa nhanh).
  - **Modal Danh Sách Việc Con (`subtasksModal.js`):** Quản lý tập trung subtasks với thanh tiến độ %, form thêm mới và sửa inline.
  - **Khắc phục lỗi nút sửa việc con:** Sửa lỗi CSS Selector khi ID việc con chứa dấu chấm (`.`) bằng `data-subtask-form-id` và tìm form qua mảng DOM an toàn.
  - **Chỉnh sửa toàn diện Task Cha:** Bổ sung nút "Chỉnh sửa" trên Header Task Drawer, trên Table View và Mobile Card. Nâng cấp `createTaskModal.js` (`show(taskToEdit)`) và `store.updateTask(taskId, updates)` đồng bộ dữ liệu đa chiều.
  - Cập nhật cache buster `?v=5.0` và đồng bộ Git `origin/main`.
- [x] **15. Tách Riêng Cột "Việc Con" Độc Lập Trên Bảng Quản Lý Công Việc (`workspaceView.js`)**:
  - Tách nút xem việc con ra khỏi cột Thao tác, bố trí thành 1 cột riêng biệt `VIỆC CON` (rộng 160px, căn giữa).
  - Nhiệm vụ đã có việc con: hiển thị nút Vàng Gold `[🌿 x/y việc con]` nổi bật, diện tích bấm rộng rãi.
  - Nhiệm vụ chưa có việc con: hiển thị nút viền nét đứt `[+ Thêm việc con]` trang nhã, hỗ trợ thao tác nhanh.
  - Cột `THAO TÁC` được thu gọn gàng chỉ giữ 2 icon hành động chuẩn (Chỉnh sửa `edit` và Mở chi tiết `open_in_new`).
  - Cập nhật cache buster `?v=5.1` và đồng bộ Git `origin/main`.
- [x] **16. Loại Bỏ Nút Phụ `open_in_new`, Tối Ưu Tiêu Đề Việc Con & Khôi Phục Toàn Diện Font Chữ UTF-8 (`workspaceView.js`, `taskDrawer.js`, `subtasksModal.js`)**:
  - **Khắc phục triệt để lỗi Font chữ (Mojibake):** Khôi phục 100% định dạng UTF-8 chuẩn xác cho toàn bộ hệ sinh thái mã nguồn, loại bỏ toàn bộ ký tự `?` xuất hiện do lưu sai encoding trước đó.
  - **Tối ưu trải nghiệm chạm (Click-to-open):** Bấm trực tiếp vào dòng bảng hoặc thẻ việc con để xem chi tiết, loại bỏ hoàn toàn các nút icon `open_in_new` dư thừa.
  - **Hiển thị việc con chống cắt chữ (Anti-truncate):** Dùng `break-words` đa dòng trên Mobile & Tablet giúp hiển thị trọn vẹn tiêu đề và nội dung việc con.
  - **Nâng cấp Cache Buster toàn diện `?v=5.3`:** Đảm bảo trình duyệt client tải lại toàn bộ mã nguồn sạch không dính cache lỗi font.
- [x] **17. Tách Riêng Đặc Quyền Quản Trị Viên (Admin Privilege) Khỏi Chức Vụ Chuyên Môn (`auth.js`, `models.js`, `store.js`, `memberModal.js`, `app.js`, `topHeader.js`)**:
  - **Tách quyền Admin độc lập (`isAdmin: boolean`):** Một người dùng có thể giữ chức vụ chuyên môn thực tế (Trưởng Phòng, Phó Trưởng Phòng, Ban Lãnh Đạo hoặc Nhân Viên) đồng thời sở hữu đặc quyền Quản Trị Hệ Thống (`isAdmin: true`).
  - **Nâng cấp Modal Cấp/Sửa Nhân Sự (`memberModal.js`):** Vai trò công tác (Role) chỉ gồm các vị trí thực tế (`MEMBER`, `DEPUTY_MANAGER`, `MANAGER`, `LEADERSHIP`); bổ sung khối chuyển đổi riêng biệt với Toggle Switch sang trọng để cấp/hủy quyền Admin Hệ Thống.
  - **Hiển thị huy hiệu kép (Dual Badges):** Trên thẻ nhân sự và TopHeader hiển thị song song Chức vụ nghiệp vụ và Huy hiệu `👑 Admin Hệ Thống` nổi bật.
  - **Phòng vệ xóa tài khoản Admin:** Ngăn chặn tuyệt đối việc xóa nhầm Admin cuối cùng trong hệ thống.
  - **Nâng cấp Cache Buster toàn diện `?v=5.4`:** Đồng bộ trên toàn bộ hệ thống file và đẩy Git `origin/main`.
- [x] **18. Tối Ưu Bảng Công Việc Table View: Loại Bỏ Cột Thao Tác, Chống Xuống Dòng Mã Việc & Tên Người Tạo (`workspaceView.js`)**:
  - **Loại bỏ hoàn toàn cột "Thao tác":** Tiết kiệm không gian ngang cho màn hình desktop và tablet. Người dùng bấm trực tiếp vào bất kỳ điểm nào trên dòng nhiệm vụ (`tr.row-task-item`) đều mở ngay Task Drawer trượt từ phải sang để xem chi tiết đầy đủ và chỉnh sửa.
  - **Khắc phục lỗi ngắt dòng Mã việc (`TSK-PTKH-xx`):** Thiết lập `whitespace-nowrap font-mono-data` với độ rộng chuẩn `w-36`, đảm bảo mã công việc luôn nằm trên 1 dòng duy nhất.
  - **Thiết kế lại thông tin Người tạo & Ngày tháng:** Mở rộng cột tiêu đề lên `min-w-[320px]`, bố trí Người tạo (`Tạo bởi: ...`) và Ngày tạo (`calendar_today + ngayVN`) gọn gàng với `whitespace-nowrap overflow-hidden text-ellipsis`, triệt tiêu hoàn toàn hiện tượng tên dài bị rớt chữ xuống dòng.
  - **Nâng cấp Cache Buster toàn diện `?v=5.5`:** Đảm bảo toàn bộ trình duyệt người dùng nạp phiên bản giao diện mới nhất.
- [x] **19. Chuẩn Hóa Danh Xưng Chức Vụ: Đổi "Phó Trưởng Phòng" Thành "Phó Phòng" Toàn Hệ Thống (`models.js`, `app.js`, `memberModal.js`, `departmentView.js`, `topHeader.js`)**:
  - **Chuẩn hóa danh xưng ngắn gọn, chính xác:** Thay thế toàn bộ nhãn `Phó Trưởng Phòng` thành `Phó Phòng` trên toàn bộ hệ thống (Danh bạ nhân viên, Header vai trò, Modal phân quyền và Chi tiết khoa phòng).
  - **Nâng cấp Cache Buster toàn diện `?v=5.6`:** Đồng bộ trên toàn bộ hệ thống file và đẩy Git `origin/main`.
- [x] **20. Xóa Bỏ Hoàn Toàn Tùy Chọn "Quản Trị Viên" Trong Dropdown Role (`memberModal.js`, `models.js`, `app.js`, `topHeader.js`)**:
  - **Loại bỏ role Admin trong list:** Dropdown chức vụ chỉ giữ đúng 4 vị trí thực tế trong bệnh viện (`MEMBER`, `DEPUTY_MANAGER`, `MANAGER`, `LEADERSHIP`).
  - **Quản lý Admin độc lập bằng nút bật:** Quyền Admin được kích hoạt/hủy hoàn toàn thông qua nút bật Switch riêng biệt `Đặc Quyền Quản Trị Viên (Admin Hệ Thống)`.
  - **Nâng cấp Cache Buster toàn diện `?v=5.7`:** Đồng bộ trên toàn bộ hệ thống file và đẩy Git `origin/main`.
- [x] **21. Tự Động Ẩn Chọn Bộ Phận Con Khi Chọn Trưởng Phòng / Phó Phòng (`memberModal.js`)**:
  - **Bao quát toàn bộ khoa phòng:** Khi chọn vai trò `Trưởng Phòng`, `Phó Phòng` hoặc `Ban Lãnh Đạo`, hệ thống tự động ẩn khối chọn Bộ phận con (Team), tự động gán `teamId = ''` và hiển thị thẻ thông báo nghiệp vụ trực quan.
  - Khối chọn Bộ phận con chỉ xuất hiện khi phân bổ nhân sự cho vị trí `Nhân viên / Chuyên viên`.
  - **Nâng cấp Cache Buster toàn diện `?v=5.8`:** Đồng bộ trên toàn bộ hệ thống file và đẩy Git `origin/main`.
- [x] **22. Chuẩn Hóa Thuật Ngữ "Tất Cả" & "Toàn Phòng Khám CS3" (`dashboardView.js`, `auth.js`, `app.js`, `sidebar.js`, `memberModal.js`, `models.js`)**:
  - **Thay "Toàn viện" bằng "Tất cả":** Đồng bộ nhãn bộ lọc, badge trạng thái (`TẤT CẢ`), tab lọc nhân sự (`🏥 Tất cả`), biểu đồ tiến độ (`(Tất Cả)`).
  - **Thay "Toàn Bệnh Viện CS3" bằng "Toàn Phòng Khám CS3":** Cập nhật trên Executive Dashboard (`Toàn Phòng Khám CS3`), Modal chuyển đổi phòng ban (`Toàn Phòng Khám CS3 (Tất Cả)`), và banner quản lý nhân sự.
  - **Nâng cấp Cache Buster toàn diện `?v=5.9`:** Đảm bảo toàn bộ trình duyệt người dùng tự động làm mới giao diện chuẩn xác.
- [x] **23. Tối Ưu Bố Cục Thẻ Nhân Sự: Đưa Các Badge / Tag Chức Vụ Xuống Dưới Phần Email (`app.js`)**:
  - **Cố định hàng Avatar & Họ tên ở đỉnh thẻ:** Đưa Avatar, Họ tên, Chức danh chuyên môn và Email lên vị trí đầu tiên của thẻ nhân sự với khoảng trống `pr-20` an toàn cho cụm nút thao tác (Sửa/Xóa).
  - **Chuyển toàn bộ Badges xuống dưới Email:** Các nhãn Phòng ban, Chức vụ, Admin Hệ Thống, Bộ phận con đặt ngay bên dưới email. Khi một nhân sự có nhiều role/bộ phận khiến badge rớt dòng, chiều cao toàn bộ thẻ trong hàng sẽ tự co giãn đều nhau mà không làm lệch vị trí Avatar và Họ tên so với các thẻ bên cạnh.
  - **Nâng cấp Cache Buster toàn diện `?v=6.0`:** Đẩy Git `origin/main` để toàn bộ người dùng nhận phiên bản mới nhất.
- [x] **24. Xây Dựng Hoàn Chỉnh Module "Dự Án & Kế Hoạch" (Project Canvas & Incubator) (`plansView.js`, `planDrawer.js`, `planModal.js`, `models.js`, `store.js`, `sidebar.js`, `bottomNav.js`, `app.js`)**:
  - **Khởi tạo dữ liệu & mô hình kế hoạch (`models.js`, `store.js`):** Schema `PLANS` với trạng thái 5 bước (`draft`, `planning`, `pending_approval`, `in_progress`, `completed`), người tạo (`creatorId`), thời gian tạo (`createdAt`), mốc tiến độ (`milestones`), đầu việc dự kiến (`tasksList`), tài liệu đính kèm (`links`) và trao đổi (`comments`).
  - **Ai cũng có thể tạo kế hoạch:** Phân quyền mở, tự động lưu thông tin Người tạo và Thời gian tạo chính xác từng phút.
  - **Giao diện Thẻ Kế Hoạch tinh gọn (Project Cards Grid - `plansView.js`):** Bố cục không ảnh bìa/icon rườm rà, tập trung hiển thị mã plan, tên dự án, mục tiêu tóm tắt, tiến độ cột mốc (Milestones progress bar), người phụ trách (Lead), người tạo và thời hạn.
  - **Ngăn kéo chi tiết toàn diện (Plan Detail Drawer - `planDrawer.js`):** Quản lý mục tiêu cốt lõi, tương tác tick mốc tiến độ, thảo luận bình luận, đính kèm tài liệu Google Docs/Drive/Sheets và đặc biệt tính năng **1-Chạm chuyển đầu việc dự kiến thành Task thực tế trong Workspace**.
  - **Modal soạn thảo / chỉnh sửa kế hoạch (`planModal.js`):** Form trực quan hỗ trợ cả lập mới và cập nhật.
  - **Tích hợp thanh điều hướng:** Thêm mục `📂 Dự án và kế hoạch` trên Sidebar và `Kế hoạch` trên Bottom Nav Mobile.
  - **Nâng cấp Cache Buster toàn diện `?v=6.1`:** Đẩy Git `origin/main`.
- [x] **25. Kiểm Tra & Tối Ưu Toàn Diện Chức Năng Xóa / Sửa (`plansView.js`, `planDrawer.js`, `planModal.js`, `taskDrawer.js`, `store.js`)**:
  - **Sửa lỗi xác nhận xóa `xacNhan2Lan`:** Sửa lỗi thiếu tham số khóa `khoa` trong `planDrawer.js`, đảm bảo cơ chế xác nhận 2 lần (double-confirmation 5s) hoạt động chính xác 100%.
  - **Bổ sung cụm nút Sửa & Xóa trực tiếp trên Card (`plansView.js`):** Cho phép người tạo/quản lý chỉnh sửa và xóa kế hoạch ngay trên lưới thẻ mà không bắt buộc phải mở Drawer.
  - **Bổ sung chức năng Xóa đầu việc dự kiến & Xóa bình luận (`planDrawer.js`, `store.js`):** Hỗ trợ `deletePlanTaskItem` và `deletePlanComment` giúp quản lý nội dung linh hoạt.
  - **Bổ sung nút Xóa công việc trên Task Drawer (`taskDrawer.js`):** Bổ sung nút Xóa nhiệm vụ kèm xác nhận 2 lần ngay trên thanh Header của Task Drawer.
  - **Nâng cấp Cache Buster toàn diện `?v=6.2`:** Đẩy Git `origin/main`.
- [x] **26. Tối Ưu Toàn Diện Giao Diện Mobile: Chống Tràn Content, Chuẩn Hóa Bo Góc & Đổi Modal Thành Bottom-Sheet (`planDrawer.js`, `planModal.js`, `createTaskModal.js`, `plansView.js`, `bottomNav.js`, `memberModal.js`, `subtasksModal.js`, `subtaskDetailModal.js`)**:
  - **Chuyển đổi Modal sang Bottom-Sheet trên Mobile:** Tất cả modal (`CreateTaskModal`, `PlanModal`, `MemberModal`, `SubtasksModal`) hiển thị dưới dạng Bottom-Sheet trượt từ đáy màn hình (`items-end sm:items-center`, `rounded-t-2xl sm:rounded-2xl`), Header cố định (`shrink-0`), Body cuộn linh hoạt (`overflow-y-auto`) và Action Bar cố định ở đáy, không còn hiện tượng modal capsule lơ lửng lộ nền ứng dụng và che mất nút bấm.
  - **Khắc phục va chạm đè nút trên Header Plan Drawer (`planDrawer.js`):** Tách dropdown đổi trạng thái xuống dải riêng biệt trong Drawer Body. Thanh Header chỉ giữ mã `PLN-xx` và mức ưu tiên `P1` bên trái, cụm nút Sửa, Xóa và Đóng bên phải, loại bỏ hoàn toàn hiện tượng icon thùng rác đè lên huy hiệu trên màn hình hẹp 360px.
  - **Triệt tiêu lỗi cắt chữ (Anti-truncation) danh sách Milestones:** Dùng `leading-snug break-words flex-1` giúp hiển thị trọn vẹn toàn bộ câu chữ của mốc tiến độ trên nhiều dòng, không bị cắt ngắn `...`.
  - **Tối ưu form nhập liệu thích ứng (Responsive Form Layouts):** Các form Thêm cột mốc, Thêm đầu việc dự kiến và Thêm tài liệu đính kèm tự động xếp chồng (stacked) trên Mobile và dàn ngang trên Desktop, không bị co ép hẹp URL hoặc nút lưu.
  - **Sửa lỗi bo góc quá sâu (`rounded-3xl`):** Thay thế toàn bộ bo góc bong bóng `rounded-3xl` thành `rounded-2xl` và `rounded-xl` sắc nét, tinh tế và đồng bộ chuẩn SHIN AIOS v2.7.
  - **Tối ưu Bottom Nav Mobile 5 mục:** Giữ đúng 5 mục cốt lõi (`Tổng quan`, `Kế hoạch`, `Công việc`, `Nhân sự`, `Cài đặt`) đảm bảo vùng chạm thoải mái > 64px, loại bỏ tràn ngang thanh tab.
  - **Nâng cấp Cache Buster toàn diện `?v=6.3`:** Đẩy Git `origin/main`.
- [x] **27. Chuẩn Hóa Chi Tiết UI/UX: Nâng Chiều Cao Input Đạt Chuẩn ($\ge 40$–$44$px), Loại Bỏ Nút Trùng Lặp 2 Icon, Sửa Tràn Form Thêm Việc & Chuẩn Hóa Bo Góc Tinh Tế (`planDrawer.js`, `plansView.js`, `planModal.js`, `createTaskModal.js`, `subtasksModal.js`, `taskDrawer.js`, `app.js`, `dashboardView.js`, `departmentView.js`)**:
  - **Loại bỏ triệt để hiện tượng 2 icon trên một nút bấm (Double-icon redundancy):** Xóa bỏ các ký tự `+` và `＋` nằm dư thừa trong thẻ `<span>` bên cạnh icon Material Symbols (như `[add_task] ＋ Chuyển thành Task`, `[add_circle] + Lập Kế Hoạch`, `[person_add] + Cấp Tài Khoản`, v.v.). Các nút bấm giờ đây chỉ có 1 icon chuyên nghiệp kèm nhãn hành vi trực quan.
  - **Khắc phục lỗi Input quá nhỏ & tràn Form thêm việc dự kiến (`planDrawer.js`):**
    + Nâng toàn bộ chiều cao của các trường nhập liệu (tiêu đề, phân công, hạn chót, link tài liệu, bình luận) lên chuẩn công thái học `h-11` (44px) và `h-10` (40px) với viền rõ ràng `border-[#cbd5e1]` trên nền trắng `bg-white`.
    + Bố trí lại Form thêm đầu việc dự kiến: Dòng 1 là Tiêu đề việc, Dòng 2 chia lưới 2 cột (Người nhận việc ở cột trái, Hạn chót + Nút "Thêm việc" ở cột phải), triệt tiêu hoàn toàn lỗi nút bấm bị đẩy rớt ra khỏi mép màn hình điện thoại.
  - **Loại bỏ bo góc tròn bong bóng (`rounded-full`):**
    + Thay thế các badge/pill bo tròn quả nhộng dễ bị gãy 2 dòng xấu xí (như badge `2/4 mốc • 50%`) thành `rounded-lg` / `rounded-md` hiện đại, thanh thoát, cố định dòng với `whitespace-nowrap shrink-0`.
    + Đồng bộ hóa các card và container thành `rounded-xl` / `rounded-lg` sắc nét, chuẩn phong cách Enterprise SaaS.
  - **Sửa lỗi Input tìm kiếm bị trùng lặp trong `plansView.js`:** Loại bỏ khối HTML thừa gây ra 2 ô tìm kiếm chồng chéo.
  - **Nâng cấp Cache Buster toàn diện `?v=6.4`:** Đồng bộ trên toàn bộ hệ thống file và đẩy Git `origin/main`.
- [x] **28. Triệt Tiêu Lỗi Giật Nhảy Cuộn Lên Đầu Trang Khi Tick Hoàn Thành (Anti-Scroll Jump & In-Place DOM Updates) Toàn Hệ Thống (`subtasksModal.js`, `planDrawer.js`, `taskDrawer.js`, `subtaskDetailModal.js`, `app.js`, `workspaceView.js`, `plansView.js`, `departmentView.js`)**:
  - **Căn nguyên vấn đề (Root Cause):** Trên trình duyệt di động (iOS Safari & Chrome Android), khi người dùng tick chọn hoàn thành việc con hoặc mốc tiến độ, hàm xử lý trước đây gọi `this.render()`, thay thế toàn bộ `innerHTML` của phần tử chứa. Hành vi này làm trình duyệt hủy DOM node có `overflow-y-auto` cũ và tạo lại node mới với vị trí cuộn `scrollTop = 0`, gây ra hiện tượng màn hình bị giật văng ngược lên đầu trang. Ngoài ra, sự kiện `onTaskUpdated` / `onPlanChanged` chạy `app.refreshCurrentView()` ngầm làm reflow toàn bộ `main-content-canvas` dẫn đến việc reset luôn cả `window.scrollY`.
  - **Giải pháp Cập nhật DOM Tại Chỗ (In-Place DOM Mutation):**
    + Trong `subtasksModal.js`, `taskDrawer.js` và `planDrawer.js`: Khi người dùng bấm checkbox hoàn thành việc con hoặc milestone, không gọi `this.render()` nữa. Thay vào đó, cập nhật trực tiếp tại chỗ thuộc tính của thẻ DOM (`subtask-status-badge`, `subtask-title-text`, tiến độ `%` và thanh Progress Bar `width`). Thao tác này chạy với tốc độ 60fps tức thì (0ms trễ) và giữ nguyên 100% vị trí thanh cuộn hiện tại của người dùng.
  - **Cơ chế Bảo tồn Vị trí Cuộn (Scroll Position Preservation) 2 Lớp:**
    + **Lớp 1 (Drawer & Modal Body):** Lưu `prevScrollTop` trước khi bất kỳ thao tác render DOM nào diễn ra và khôi phục ngay lập tức kết hợp `requestAnimationFrame` sau khi gán nội dung mới (`#taskDrawerScrollBody`, `#planDrawerScrollBody`, `.modal-card`).
    + **Lớp 2 (Main Canvas & Background Views):** Lưu `prevScrollY = window.scrollY || document.documentElement.scrollTop;` trước khi `refreshCurrentView()`, `renderEmployeesView()`, `workspaceView.render()`, `plansView.render()`, `departmentView.render()` thực thi, và khôi phục ngay với `window.scrollTo({ top: prevScrollY, behavior: 'instant' })`.
  - **Nâng cấp Cache Buster toàn diện `?v=6.5`:** Đồng bộ trên 21 files và đẩy Git `origin/main`.
- [x] **29. Khắc Phục Lệch Căn Lề Nội Dung & Xây Dựng Trung Tâm Phê Duyệt 1-Chạm (Executive Approval Hub) Cho Ban Lãnh Đạo (`approvalView.js`, `store.js`, `topHeader.js`, `sidebar.js`, `dashboardView.js`, `app.js`, `plansView.js`, `workspaceView.js`, `departmentView.js`)**:
  - **Chuẩn hóa khung hiển thị đồng nhất (Uniform Canvas Fit & Centering):**
    + Loại bỏ thẻ `</div>` đóng sớm tại dòng 144 trong `plansView.js` vốn làm bung lưới thẻ `plansCardsGrid` ra khỏi giới hạn vùng chứa.
    + Đồng bộ hóa 100% root container của toàn bộ các View (`dashboardView`, `plansView`, `workspaceView`, `departmentView`, `renderEmployeesView`, `renderSettingsView`, `approvalView`) thành `flex flex-col w-full gap-5 sm:gap-6 animate-fade-in max-w-7xl mx-auto pb-12 overflow-x-hidden`. Triệt tiêu hoàn toàn hiện tượng lệch lề (Tổng quan canh giữa, Kế hoạch lệch trái) và loại bỏ dứt điểm tràn ngang màn hình.
  - **Xây dựng module Trung Tâm Phê Duyệt 1-Chạm (`approvalView.js`):**
    + **Tab 1: Công việc chờ duyệt (Tasks):** Hiển thị các nhiệm vụ hoàn tất gửi trình ký nghiệm thu hoặc các việc cần Ban Lãnh Đạo/Trưởng phòng ký duyệt.
    + **Tab 2: Kế hoạch chờ duyệt (Plans):** Hiển thị các dự án chiến lược mới lập cần Ban Lãnh Đạo thông qua chủ trương.
    + **Tab 3: Lịch sử đã duyệt (History):** Tra cứu toàn bộ các hạng mục đã được phê duyệt hoặc yêu cầu làm lại trước đó.
    + **Hành động 1-Chạm (One-Tap Actions):** Nút `[Duyệt 1-Chạm]` tức thì với hiệu ứng rung `rung(15)` và thông báo Toast; Nút `[Cần Sửa / Yêu Cầu Làm Lại]` mở modal góp ý linh hoạt (cho phép để trống nội dung vẫn gửi trả thành công và tự động bắn thông báo chuông đến nhân sự).
    + **Duyệt hàng loạt (Batch 1-Tap Approval):** Hỗ trợ checkbox chọn từng việc hoặc chọn tất cả để duyệt đồng loạt nhiều hạng mục cùng lúc.
    + **Phân quyền thông minh (Option 4A):** Ban Lãnh Đạo & Admin kiểm soát toàn viện; Trưởng phòng kiểm soát theo khoa phòng; Nhân viên thông thường theo dõi hồ sơ của chính mình đã gửi trình cấp trên.
  - **Kết nối điều hướng đa kênh (Cross-Navigation Connections):**
    + **Sidebar Desktop:** Thêm mục `Phê duyệt` kèm Huy hiệu số lượng việc đang chờ duyệt rung nhịp (pulse badge).
    + **Top Header (Mobile & Desktop):** Thêm nút lối tắt Phê duyệt nhanh ngay cạnh chuông thông báo.
    + **Trang Tổng Quan (Dashboard):** Click vào ô Hero "Chờ duyệt khẩn", thẻ KPI "Chờ Duyệt Khẩn" hoặc nút "Xem tất cả" đều chuyển ngay sang Trung Tâm Phê Duyệt.
  - **Nâng cấp Cache Buster toàn diện `?v=6.6`:** Đồng bộ trên 22 files và đẩy Git `origin/main`.
- [x] **30. Tinh Chỉnh Navbar Mobile, Định Dạng Ngày & Assignee Custom Picker (v6.8 - v7.1)**:
  - **Navbar Mobile Tối Giản (v6.8):** Thay thế thanh tìm kiếm 180px chiếm diện tích bằng nút kính lúp 1-chạm mở Mobile Search Overlay toàn màn hình. Chuyển đổi theme mode tích hợp gọn vào Profile Dropdown.
  - **Tách Riêng Hàng Thực Hiện & Hạn Chót (v6.9):** Tách 2 thông tin thành 2 hàng riêng biệt trên thẻ hàng đợi di động, loại bỏ chuỗi ISO UTC thô và định dạng ngày tháng chuẩn `DD/MM/YYYY`.
  - **Tối Giản Thương Hiệu Mobile (v7.0):** Ẩn huy hiệu logo `TV Thanh Vũ Medic` trên thanh tiêu đề di động (< 640px) để tối đa diện tích hiển thị.
  - **Custom Assignee Picker Toàn Hệ Thống (v7.1):** Thay thế `<select>` mặc định bằng thẻ chọn nhân sự sang trọng kèm modal tìm kiếm tức thì; giới hạn danh sách nhân viên theo đúng phòng ban đang làm việc.
- [x] **31. Triệt Tiêu Co Giật Màn Hình Desktop & Thay Thế Bằng Popup Xác Nhận Xóa Chuẩn SHIN AIOS (v7.2)**:
  - **Triệt tiêu hiện tượng màn hình desktop bị giật sang trái:**
    + Cố định không gian thanh cuộn bằng `html { overflow-y: scroll !important; scrollbar-gutter: stable; }`.
    + Loại bỏ `overflow-y: auto;` thừa ở `body` để chống xung đột thanh cuộn lồng nhau.
    + Bỏ `transition-all` trên `#main-app-shell`, thay bằng `transition-[padding] duration-200` để tránh việc trình duyệt tự động animate bề rộng khung hình khi DOM render lại.
  - **Popup Modal Xác Nhận Xóa (`xacNhanXoa`):**
    + Loại bỏ cơ chế bấm 2 lần trong 5 giây gây phiền toái.
    + Xây dựng Modal Popup Xác Nhận Xóa sang trọng chuẩn UI/UX SHIN AIOS v2.7 với icon cảnh báo nổi bật, thông điệp chi tiết, nút Hủy bỏ và nút Xác nhận xóa (Touch target $\ge 44 \times 44$px).
    + Điều hướng tự động toàn bộ lệnh gọi `xacNhan2Lan` sang `xacNhanXoa`, đồng bộ 100% tất cả vị trí xóa (Nhiệm vụ, Kế hoạch, Phòng ban, Bộ phận, Cột mốc, Đầu việc dự kiến, Việc con, Reset dữ liệu, Xóa thông báo).
    + Thay thế toàn bộ `window.confirm` còn sót lại bằng `xacNhanXoa`.
  - **Nâng cấp Cache Buster toàn diện `?v=7.2`:** Đồng bộ trên 24 files và đẩy Git `origin/main`.
- [x] **32. Khắc Phục Lệch Navbar Desktop, Triệt Tiêu Bounce Cuộn Ngang & Nâng Cấp Popup Từ Chối Phê Duyệt (v7.3)**:
  - **Sửa lỗi Navbar mất bên phải & dư khoảng trống bên trái:** Loại bỏ thuộc tính `relative` thừa trên `<header>` trong `topHeader.js` (vốn ghi đè `position: fixed` và làm header bị offset 256px sang phải do nằm trong `main-app-shell` có `pl-64`). Đưa `#header-container` ra cấp viewport ngoài shell chính để căn chuẩn 100% từ mép sidebar (256px) đến mép phải màn hình, hiển thị trọn vẹn nút "+ Giao việc" và ô tìm kiếm.
  - **Triệt tiêu hiện tượng click nút màn hình giật sang trái rồi trở ngược lại:** Thiết lập `overflow-x: clip !important;` trên cả `html` và `body` để cấm hoàn toàn hành vi cuộn ngang của trình duyệt khi focus nút; loại bỏ `scroll-behavior: smooth` trên root để chặn hiệu ứng bounce/rung giật.
  - **Popup Modal Từ Chối Phê Duyệt (`popupTuChoiPheDuyet`):** Thay thế toàn bộ hộp thoại `prompt()` / `alert()` mặc định của trình duyệt bằng Popup Modal chuyên nghiệp chuẩn SHIN AIOS v2.7 (đồng bộ với `xacNhanXoa`), có icon chuyển trả, textarea nhập góp ý (linh hoạt tùy chọn) và các nút bấm $\ge 44 \times 44$px.
  - **Nâng cấp Cache Buster toàn diện `?v=7.3`:** Đồng bộ trên 24 files và đẩy Git `origin/main`.
- [x] **33. Hệ Thống Cảnh Báo Trễ Deadline Toàn Diện (Overdue Warning System) v7.4**:
  - **Hàm chuẩn hóa kiểm tra trễ hạn `kiemTraTreHan(dueDateStr, status)`:** Tính toán chính xác số ngày trễ (`daysLate`) dựa trên mốc ngày thực tế và loại trừ các nhiệm vụ đã hoàn thành (`done` / `completed`).
  - **Bảng Quản Lý Công Việc (`workspaceView.js`):**
    + Thêm tab mới "Quá hạn" kèm icon báo thức và huy hiệu đếm số lượng việc quá hạn nhấp nháy (`animate-pulse`). Hỗ trợ lọc tức thì qua `store.getDepartmentTasks({ tab: 'overdue' })`.
    + Danh sách dạng bảng (Table view): Hàng task trễ hạn có viền trái đỏ `border-l-4 border-l-rose-500 bg-rose-50/15`, cột Hạn chót nổi bật với icon `alarm` đỏ và huy hiệu `Quá hạn X ngày`.
    + Dạng thẻ Mobile & Kanban: Thẻ task quá hạn có viền đỏ nổi bật, hiển thị huy hiệu `⚠️ Quá hạn X ngày` / `Trễ Xn` rõ ràng.
  - **Ngăn Kéo Chi Tiết Task (`taskDrawer.js`):**
    + Xuất hiện Banner cảnh báo khẩn cấp màu đỏ nổi bật ngay đầu trang: *"CẢNH BÁO: NHIỆM VỤ ĐÃ TRỄ DEADLINE X NGÀY!"* kèm thông điệp đôn đốc xử lý.
    + Khối Metadata Grid "Hạn hoàn thành" đổi sang màu đỏ kèm huy hiệu `Trễ X ngày`.
  - **Trang Tổng Quan (`dashboardView.js` & `app.js`):**
    + Hàng đợi duyệt việc (Priority Queue) hiển thị cảnh báo đỏ cạnh ngày hạn.
    + Click thẻ KPI "Quá hạn" chuyển hướng thẳng sang tab "Quá hạn" trên Không gian công việc.
  - **Nâng cấp Cache Buster toàn diện `?v=7.4`:** Đồng bộ trên 24 files và đẩy Git `origin/main`.
- [x] **34. Tách Riêng Người Tạo & Ngày Tạo Thành 2 Hàng Rõ Ràng (v7.5)**:
  - **Bảng Quản lý công việc (Table View & Mobile Cards View trong `workspaceView.js`):** Thay vì gộp chung một dòng dạng `Tạo bởi: ... • 📅 DD/MM/YYYY`, đã tách thành 2 dòng riêng biệt:
    + Dòng 1: `Tạo bởi: [Họ và tên người tạo]` (màu xám xanh & chữ đậm dễ nhìn).
    + Dòng 2: `📅 Ngày tạo: DD/MM/YYYY` (màu vàng kim font mono-data chuyên nghiệp).
  - Giúp cột Tên công việc thông thoáng, dễ đọc lướt, không bị dài dòng hay tràn dòng ngang.
  - **Nâng cấp Cache Buster toàn diện `?v=7.5`:** Đồng bộ trên 24 files và đẩy Git `origin/main`.
- [x] **35. Tích Hợp App Splash Loader Toàn Màn Hình & Tối Ưu Font Preload Triệt Tiêu FOUC / FOUT (v7.6)**:
  - Tích hợp `#app-splash-loader` inline 0ms che chắn giai đoạn nạp ban đầu.
- [x] **36. Khắc Phục Triệt Để Lỗi Mất Icon / Vỡ Chữ Ligature Bằng Font Cục Bộ & Khung Chặn 1em (v7.7)**:
  - **Phân tích nguyên nhân sự cố hình ảnh (`7b0adb73` & `bfb4a53e`):**
    + Hình 1: Khi dùng `&display=block` trên Google Fonts CDN (1MB woff2), nếu font chưa tải xong trong 800ms mà splash đã đóng, trình duyệt ẩn toàn bộ icon thành khoảng trắng vô hình.
    + Hình 2: Khi kết nối CDN bị nghẽn/timeout, trình duyệt hủy `display: block` và chuyển sang dùng font mặc định Times New Roman, in ra toàn bộ tên ligature thô (`grid_view`, `search`, `notifications`, `pending_actions`, v.v.). Vì `.material-symbols-outlined` không có giới hạn kích thước, chữ dài đến 15 ký tự chèn ép vỡ toang layout navbar, sidebar và thẻ thống kê.
  - **Giải pháp xử lý triệt để 4 tầng (Zero External Dependency & Zero Layout Shift):**
    + **Tầng 1 - Self-hosted Font Cục Bộ (`fonts/material-symbols-outlined.woff2`):** Tải và nhúng trực tiếp font WOFF2 chuẩn 323KB vào thư mục dự án. Cấu hình `@font-face` ưu tiên nạp từ file local (`../fonts/material-symbols-outlined.woff2`) trước, CDN chỉ làm fallback dự phòng. Loại bỏ 100% rủi ro nghẽn mạng quốc tế hay chặn Google Fonts.
    + **Tầng 2 - Preload cực nhanh ở 0ms (`<link rel="preload">`):** Đặt thẻ preload trong `<head>` của `index.html` để tải font ngay từ mili-giây đầu tiên song song với phân tích HTML.
    + **Tầng 3 - Khung Bounding Box Cố Định 1em (`width: 1em; height: 1em; overflow: hidden`):** Quy định chặt chẽ `.material-symbols-outlined` có `display: inline-flex; width: 1em; height: 1em; overflow: hidden; white-space: nowrap; flex-shrink: 0;`. Kể cả trong trường hợp xấu nhất font bị trễ, văn bản ligature tuyệt đối không bao giờ tràn ra ngoài làm xô lệch bất kỳ nút bấm hay layout nào.
    + **Tầng 4 - Điều phối gỡ Splash chính xác bằng `document.fonts.load`:** Chờ trực tiếp `document.fonts.load('24px "Material Symbols Outlined"')` trước khi ẩn Splash Screen, timeout dự phòng 1200ms.
  - **Nâng cấp Cache Buster toàn diện `?v=7.7`:** Đồng bộ trên toàn bộ 23 files và đẩy Git `origin/main`.
- [x] **37. Sửa Lỗi UI Không Xóa Ngay Sau Khi Xác Nhận & Triệt Tiêu Khoảng Trống Ghi Chú Kế Hoạch (v7.8)**:
  - **Khắc phục lỗi xóa task phải F5 mới mất:** Trong `taskDrawer.js:864`, sửa lỗi gọi nhầm `this.onTaskChanged()` (undefined) thành `this.onTaskUpdated()`. Gán cả 2 alias trong constructor để bảo vệ hai chiều. Khi xác nhận xóa, `store.deleteTask(id)` chạy và ngay lập tức gọi `this.refreshCurrentView()`, xóa task biến mất tức thì khỏi Table/Kanban/Cards mà không cần tải lại trang.
  - **Rà soát toàn diện các hàm xóa/sửa:**
    + Cập nhật `refreshCurrentView()` trong `app.js` tự động re-render `TaskDrawer` và `PlanDrawer` nếu đang mở, đảm bảo dữ liệu mới nhất được phản ánh tức thì.
    + Thêm callback `onNotifChanged` cho `NotificationDrawer` giúp biểu tượng chuông thông báo ở Header cập nhật badge ngay khi xóa hoặc đánh dấu đã đọc.
    + Kiểm tra và xác nhận toàn bộ luồng Xóa Kế hoạch, Xóa Cột mốc, Xóa Việc con, Xóa Phòng ban, Xóa Bộ phận, Xóa Nhân sự đều re-render ngay lập tức.
  - **Triệt tiêu khoảng trống thừa ở ô Ghi Chú Kế Hoạch (`c907bf9c`):**
    + Do khai báo `whitespace-pre-wrap` kết hợp xuống dòng và thụt lề 18 spaces trong template literal của `planDrawer.js` (và `subtaskDetailModal.js`), trình duyệt render khoảng cách đó thành 1 dòng trống và khoảng thụt lề lớn.
    + Chuyển chuỗi nội dung thành cùng dòng và áp dụng `.trim()`, loại bỏ 100% khoảng trắng thừa, văn bản hiển thị sát và ngay ngắn dưới tiêu đề.
  - **Nâng cấp Cache Buster toàn diện `?v=7.8`:** Đồng bộ trên 23 files và đẩy Git `origin/main`.

- [x] **38. Chuẩn Bị Bàn Giao: Dữ Liệu Thật Đồng Bộ Google Sheet, Tạo Việc & Giao Diện (v7.9)**:
  - **UI:** Tên công việc hiển thị đầy đủ (bỏ cắt `line-clamp`); đổi mọi nhãn "Giao việc" thành "Tạo việc"; bỏ khối "Danh sách việc con" trong form tạo/sửa việc (việc con tạo sau khi đã có việc cha; sửa việc cha không làm mất việc con).
  - **Nguyên nhân Sheet không có dữ liệu Kế hoạch/Phê duyệt:** (1) `Code.gs` không có sheet PLANS, không xử lý `savePlan/deletePlan`, `getData` không trả plans → kế hoạch chỉ nằm ở LocalStorage; (2) nút "Đẩy lên Sheet" ở trang Cài đặt gọi `appScriptBridge.pushAllToCloud()` KHÔNG truyền dữ liệu → không đẩy gì nhưng báo thành công; nút "Kéo về" chỉ tải mà không hợp nhất vào store; (3) dữ liệu mẫu cứng (`models.js`) được nạp sẵn vào máy; (4) `Code.gs` tự đổ công việc mẫu vào Sheet khi TASKS trống.
  - **Sửa:** thêm sheet PLANS + `savePlan/deletePlan` + pushAll/getData có plans; `store.saveAllPlans` tự đẩy mọi thay đổi/xóa kế hoạch lên Sheet; pull hợp nhất kế hoạch theo `updatedAt`; thông báo đồng bộ xóa/đã đọc hàng loạt; Settings dùng `store.pushAllToCloud/syncFromCloudIfAvailable`; sao lưu JSON đủ tasks/plans/users/depts/notifications.
  - **Dữ liệu vận hành bắt đầu RỖNG** (công việc/kế hoạch/thông báo); `Code.gs` chỉ seed cơ cấu (phòng ban + tài khoản) khi USERS trống, chỉ nạp demo khi gọi `?action=seed`. Nút Admin "Xóa dữ liệu mẫu" (`store.clearOperationalData`) dọn tasks/plans/notifs cả máy lẫn Sheet, giữ nhân sự & phòng ban.
  - **Toàn vẹn dữ liệu:** mã việc tăng dần theo phòng ban (`PTKH-001`, không trùng); mã kế hoạch không trùng sau khi xóa; `Code.gs` ép cột ngày/giờ dạng text và chuẩn hóa Date khi đọc (hết lệch ngày/ISO UTC).
  - **Hợp nhất module:** mọi import nội bộ dùng cùng `?v=` để chỉ còn 1 instance của auth/store/appScriptBridge (trước đây URL endpoint lưu ở trang Cài đặt không đến được store cho tới khi F5).
  - **Cache Buster `?v=7.9`.** Cần Deploy lại Code.gs (New version) để dùng sheet PLANS.

- [x] **39. Sửa Lỗi Nút Xóa Dữ Liệu Mẫu, Tinh Chỉnh Màn Hình Đăng Nhập & Phân Quyền Trang Cài Đặt (v8.0 - v8.2)**:
  - **Sửa lỗi nút "Xóa dữ liệu mẫu" không mở popup (v8.0):** Bổ sung import `xacNhanXoa` trong `settingsModal.js` và `toast` trong `store.js`; xóa fallback `|| INITIAL_TASKS` trong `getAllTasksRaw()`; thêm cơ chế lưu vết ID đã xóa (`tvm_deleted_ids_v1`) để chặn vĩnh viễn dữ liệu mẫu/đã xóa tự động quay lại từ Google Sheets khi chưa redeploy `Code.gs`.
  - **Tinh gọn màn hình đăng nhập (`loginView.js`) (v8.1):**
    + Bỏ dòng chữ `"Đang đồng bộ từ Google Sheets..."` trên nút đăng nhập (đổi thành `"Đang đăng nhập..."` gọn gàng).
    + Xóa bỏ dòng chân trang `"Bệnh viện Đa Khoa Thanh Vũ Medic Bạc Liêu • Cơ Sở 3 (Cà Mau)"` ở cuối thẻ đăng nhập theo yêu cầu.
  - **Khóa quyền hiển thị & chỉnh sửa Trang Cài Đặt (`app.js`, `settingsModal.js`) (v8.2):**
    + Chỉ duy nhất tài khoản có quyền **Admin** (`auth.isAdmin()`) mới nhìn thấy và thao tác được các khối: *Cổng Kết Nối Google Sheets (Apps Script Webhook)*, *Hướng Dẫn 3 Bước Kết Nối Google Sheets*, *Bảo Mật & Phân Quyền RBAC*, và *Quản Trị Cơ Sở Dữ Liệu (Backup JSON & Xóa dữ liệu mẫu)*.
    + Tất cả các tài khoản không phải Admin khi vào mục **Cài đặt** (cả trang chính `renderSettingsView` lẫn cửa sổ popup `SettingsModal`) chỉ nhìn thấy duy nhất phần **Tùy chỉnh Themes & Giao diện** (`shinTheme.renderSettingsUI()`).
  - **Nâng cấp Cache Buster toàn diện `?v=8.2`:** Đồng bộ trên 26 files và đẩy Git `origin/main`.

---

## 4. QUY TẮC PHÁT TRIỂN & TIẾT KIỆM TOKEN
- Mặc định sử dụng model Gemini Flash.
- Luôn kiểm tra `PROJECT_CONTEXT.md` trước khi thao tác, không scan lại toàn bộ dự án từ đầu.
- Giữ vững 18 tiêu chí DoD Gate chuẩn SHIN AIOS v2.7 (Touch target ≥ 44px, không cuộn ngang, Mobile-first 320px, an toàn DOM `esc()`).
- Sau mỗi đợt cập nhật lớn, cập nhật trạng thái vào file này và khuyến nghị người dùng `/compact`.

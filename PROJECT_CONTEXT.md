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
- [x] **7. Quản lý Cơ cấu Bộ Phận Con & Phân bổ Nhân sự Linh Hoạt (`departmentView.js`, `store.js`, `Code.gs`)**:
  - Hỗ trợ Kéo Thả (Drag & Drop) trực tiếp thẻ nhân viên vào bộ phận con.
  - Nút "+ Thêm nhân viên" trên mỗi bộ phận con mở popup gán nhanh 1-chạm.
  - Bộ chọn nhanh (Dropdown selector) trực tiếp trên từng thẻ nhân sự và nút gỡ nhân sự nhanh.
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

---

## 4. QUY TẮC PHÁT TRIỂN & TIẾT KIỆM TOKEN
- Mặc định sử dụng model Gemini Flash.
- Luôn kiểm tra `PROJECT_CONTEXT.md` trước khi thao tác, không scan lại toàn bộ dự án từ đầu.
- Giữ vững 18 tiêu chí DoD Gate chuẩn SHIN AIOS v2.7 (Touch target ≥ 44px, không cuộn ngang, Mobile-first 320px, an toàn DOM `esc()`).
- Sau mỗi đợt cập nhật lớn, cập nhật trạng thái vào file này và khuyến nghị người dùng `/compact`.

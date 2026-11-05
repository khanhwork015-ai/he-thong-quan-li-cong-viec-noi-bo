# THANH VŨ MEDIC CS3 - HỆ THỐNG QUẢN LÝ CÔNG VIỆC PHÒNG BAN
> **Thiết kế:** Chuẩn Google Stitch (`thanh_v_medic_cs3_clinical_workspace`)  
> **Màu sắc chủ đạo:** Vàng Hoàng Gia (`#D6A52A` / `#795900`) trên nền xám lạnh nhẹ (`#F8F9FF`)  
> **Kiến trúc:** Sẵn sàng mở rộng đa phòng ban (Multi-Department Ready) & Phân quyền bảo mật 3 cấp độ (Strict RBAC)

---

## 🌟 1. KIẾN TRÚC MỞ RỘNG ĐA PHÒNG BAN (MULTI-DEPARTMENT)
Hệ thống được thiết kế theo mô hình phân vùng dữ liệu (Data Isolation) có thể mở rộng không giới hạn:
* **Hiện tại (Phòng ban trọng tâm):** **Phòng Phát Triển Khách Hàng - CS3 (`dept_ptkh`)** với đầy đủ các nghiệp vụ khám sức khỏe doanh nghiệp (Đoàn Minh Phú 2.850 công nhân), tiếp đón Đoàn kiểm tra Sở Y Tế Cà Mau, bảo lãnh viện phí BHYT tư nhân.
* **Mở rộng dễ dàng:** Sẵn sàng kết nối thêm **Kho Dược CS3 (`dept_duoc`)**, **Khoa Chẩn Đoán Hình Ảnh (`dept_cdha`)**, **Ban QLDA Thi Công (`dept_qlda`)**... Mỗi phòng ban có mã định danh, trưởng phòng và luồng công việc biệt lập, **không bị trùng lặp hoặc xem lén thông tin của nhau**.

---

## 👥 2. MA TRẬN PHÂN QUYỀN (3 NHÓM ROLES CHUẨN)

| Nhóm Vai Trò | Đại Diện Thực Tế | Thẩm Quyền Được Phép | Giới Hạn Bảo Mật |
| :--- | :--- | :--- | :--- |
| **👑 ADMIN** | **Sếp Tâm** *(Tổng Giám Đốc / HĐQT)* | • Toàn quyền xem báo cáo mọi phòng ban.<br>• Chuyển đổi giữa các phòng ban bằng bộ chọn ở Sidebar.<br>• Phê duyệt các khoản ngân sách & nghiệm thu cấp cao. | Toàn quyền kiểm soát hệ thống. |
| **👔 TRƯỞNG PHÒNG (MANAGER)** | **BS.CKI Trần Minh Tuấn** *(Trưởng phòng PTKH)* | • Toàn quyền quản trị trong phòng ban của mình.<br>• Xem Dashboard KPI phòng ban, giao việc mới cho nhân viên.<br>• Kéo thả Kanban, ký duyệt nghiệm thu các việc cấp phòng. | **BỊ CHẶN** không xem được công việc và dữ liệu nhạy cảm của các phòng ban khác. |
| **👤 NHÂN VIÊN (MEMBER)** | **CN. Tuyết Mai**, **ThS. Hoàng Nam** | • Xem các công việc được giao cho cá nhân mình.<br>• Cập nhật tiến độ, hoàn thành checklist việc con, gửi trình phê duyệt. | Chỉ xem việc của cá nhân, không có quyền giao việc hoặc duyệt việc cấp phòng. |

---

## 🎨 3. GIAO DIỆN & TÍNH NĂNG CHUẨN GOOGLE STITCH
1. **Sidebar cố định (w-64 = 256px):**
   * Logo Thanh Vũ Medic CS3.
   * Bộ chọn phòng ban linh hoạt (Admin chuyển phòng ban tức thì).
   * Điều hướng 4 mục: *Tổng quan, Công việc, Nhân viên, Cài đặt*.
   * Chế độ chuyển đổi *[ Quản lý | Cá nhân ]*.
2. **Top Header cố định (h-16 = 64px):**
   * Thanh tìm kiếm nhanh dạng spotlight `⌘K`.
   * Ca trực: *Ca hành chính: 07:00 - 17:00*.
   * Nút tạo việc mới (Vàng Gold `#D6A52A`).
   * Quick Role Switcher để thử nghiệm phân quyền ngay lập tức.
3. **Màn hình Tổng quan phòng ban:**
   * Dải thông báo khẩn cấp (Urgent Clinical Broadcast Banner) tiếp đón Sở Y Tế Cà Mau.
   * Hàng 5 Thẻ KPI: *Tổng việc, Đang chạy, Đã hoàn thành, Chờ phê duyệt (có nút Duyệt ngay), Quá hạn*.
   * Khối phân bổ năng suất nhân sự phòng ban.
4. **Màn hình Quản lý công việc:**
   * Tabs chuẩn Linear/Notion: *Việc được giao cho tôi, Việc do tôi tạo, Chờ phê duyệt, Đã hoàn thành*.
   * Chuyển đổi linh hoạt giữa **Bảng (Table View)** và **Thẻ (Kanban Board)**.
   * Ngăn kéo chi tiết công việc từ phải trượt ra (**Slide-over Detail Drawer**): checklist việc con, bình luận nội bộ, duyệt 1-chạm.

---

## 🚀 4. HƯỚNG DẪN CHẠY & TRIỂN KHAI
* **Chạy Offline / Local:** Mở trực tiếp file `index.html` bằng trình duyệt web.
* **Deploy GitHub Pages / Vercel:** Đã tích hợp sẵn cấu hình PWA và Vercel.

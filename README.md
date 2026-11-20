# SHIN TASK MANAGEMENT - HỆ THỐNG QUẢN LÝ CÔNG VIỆC NỘI BỘ
> **Thiết kế:** Chuẩn Google Stitch (`shin_task_management_workspace`)  
> **Màu sắc chủ đạo:** Vàng Hoàng Gia (`#D6A52A` / `#795900`) trên nền xám lạnh nhẹ (`#F8F9FF`)  
> **Kiến trúc:** Sẵn sàng mở rộng đa phòng ban (Multi-Department Ready) & Phân quyền bảo mật 4 cấp độ (Strict RBAC)

---

## 🌟 1. KIẾN TRÚC MỞ RỘNG ĐA PHÒNG BAN (MULTI-DEPARTMENT)
Hệ thống được thiết kế theo mô hình phân vùng dữ liệu (Data Isolation) có thể mở rộng không giới hạn:
* **Mở rộng dễ dàng:** Kết nối linh hoạt nhiều phòng ban, đơn vị. Mỗi phòng ban có mã định danh, trưởng phòng và luồng công việc biệt lập, **không bị trùng lặp hoặc xem lén thông tin của nhau**.

---

## 👥 2. MA TRẬN PHÂN QUYỀN (4 NHÓM ROLES CHUẨN)

| Nhóm Vai Trò | Thẩm Quyền Được Phép | Giới Hạn Bảo Mật |
| :--- | :--- | :--- |
| **👑 ADMIN** | • Toàn quyền xem báo cáo mọi phòng ban.<br>• Chuyển đổi giữa các phòng ban bằng bộ chọn ở Sidebar.<br>• Phê duyệt các khoản ngân sách & nghiệm thu cấp cao.<br>• Quản trị hệ thống, kết nối Google Sheets & Database. | Toàn quyền kiểm soát hệ thống. |
| **👔 TRƯỞNG PHÒNG (MANAGER)** | • Toàn quyền quản trị trong phòng ban của mình.<br>• Xem Dashboard KPI phòng ban, giao việc mới cho nhân viên.<br>• Kéo thả Kanban, ký duyệt nghiệm thu các việc cấp phòng. | **BỊ CHẶN** không xem được công việc và dữ liệu nhạy cảm của các phòng ban khác. |
| **👤 NHÂN VIÊN (MEMBER)** | • Xem các công việc được giao cho cá nhân mình.<br>• Cập nhật tiến độ, hoàn thành checklist việc con, gửi trình phê duyệt. | Chỉ xem việc của cá nhân, không có quyền giao việc hoặc duyệt việc cấp phòng. |

---

## 🎨 3. GIAO DIỆN & TÍNH NĂNG CHUẨN GOOGLE STITCH & SHIN AIOS
1. **Sidebar cố định (w-64 = 256px):**
   * Logo Shin Task Management (STM).
   * Bộ chọn phòng ban linh hoạt (Admin chuyển phòng ban tức thì).
   * Điều hướng chính: *Tổng quan, Công việc, Kế hoạch, Phê duyệt, Nhân sự, Phòng ban, Cài đặt*.
2. **Top Header cố định (h-16 = 64px):**
   * Thanh tìm kiếm nhanh dạng spotlight `⌘K`.
   * Trạng thái Cloud Auto-Sync Google Sheets thời gian thực.
   * Nút tạo việc mới (Vàng Gold `#D6A52A`).
3. **Quản lý công việc & Kế hoạch:**
   * Chuyển đổi linh hoạt giữa **Bảng (Table View)** và **Thẻ (Kanban Board)**.
   * Ngăn kéo chi tiết công việc từ phải trượt ra (**Slide-over Detail Drawer**): việc con, bình luận nội bộ, duyệt 1-chạm.

---

## 🚀 4. HƯỚNG DẪN CHẠY & TRIỂN KHAI
* **Chạy Offline / Local:** Mở trực tiếp file `index.html` bằng trình duyệt web.
* **Deploy GitHub Pages / Vercel:** Đã tích hợp sẵn cấu hình PWA và Vercel.

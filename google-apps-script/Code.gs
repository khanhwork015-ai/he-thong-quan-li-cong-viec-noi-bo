/**
 * THANH VŨ MEDIC CS3 - GOOGLE APPS SCRIPT WEB APP BACKEND (SHIN AIOS BRIDGE)
 * Tự động tạo bảng & đồng bộ 2 chiều dữ liệu thực tế với Google Sheets
 * 
 * HƯỚNG DẪN TRIỂN KHAI TRÊN GOOGLE SHEETS:
 * 1. Mở một Google Spreadsheet mới, đặt tên: "TVM_CS3_Task_Database"
 * 2. Vào Extensions (Tiện ích mở rộng) -> Apps Script
 * 3. Xóa hết code cũ, dán TOÀN BỘ file này vào Code.gs và bấm Lưu (Ctrl+S)
 * 4. Bấm nút "Deploy" (Triển khai) góc trên bên phải -> "New deployment" (Triển khai mới)
 * 5. Bấm icon bánh răng cưa -> chọn "Web app"
 *    - Description: "TVM CS3 Task Sync v2"
 *    - Execute as: "Me" (Tôi)
 *    - Who has access: "Anyone" (Bất kỳ ai)  <-- CỰC KỲ QUAN TRỌNG ĐỂ KHÔNG BỊ CHẶN QUYỀN
 * 6. Bấm "Deploy" -> Cấp quyền cho Google Tài khoản -> Copy URL Web App (đuôi /exec)
 * 7. Dán URL vào ô "Cài đặt" trong ứng dụng và bấm "Đồng bộ ngay"!
 */

const SHEET_TASKS = 'TASKS';
const SHEET_USERS = 'USERS';
const SHEET_DEPTS = 'DEPARTMENTS';

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'getData';
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    ensureSheets(ss);

    // Tự động seed dữ liệu mẫu ban đầu nếu sheet TASKS đang trống
    const taskSheet = ss.getSheetByName(SHEET_TASKS);
    if (taskSheet.getLastRow() <= 1 || action === 'seed') {
      seedInitialData(ss);
    }

    if (action === 'getData' || action === 'seed') {
      const tasks = getSheetData(ss.getSheetByName(SHEET_TASKS));
      const users = getSheetData(ss.getSheetByName(SHEET_USERS));
      const depts = getSheetData(ss.getSheetByName(SHEET_DEPTS));
      return responseJSON({
        success: true,
        message: 'Lấy dữ liệu thành công từ Google Sheets',
        tasks: tasks,
        users: users,
        depts: depts,
        timestamp: new Date().toISOString()
      });
    }

    // Hỗ trợ lưu task nhanh qua GET (phòng trường hợp POST bị hạn chế mạng)
    if (action === 'saveTaskGet' && e.parameter.data) {
      const task = JSON.parse(decodeURIComponent(e.parameter.data));
      saveOrUpdateRow(ss.getSheetByName(SHEET_TASKS), task, 'id');
      return responseJSON({ success: true, message: 'Đã lưu công việc qua GET' });
    }

    return responseJSON({ success: false, message: 'Invalid action: ' + action });
  } catch (err) {
    return responseJSON({ success: false, error: err.toString() });
  }
}

function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    ensureSheets(ss);

    let body = {};
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }

    const action = body.action || (e && e.parameter && e.parameter.action);

    // 1. Đẩy toàn bộ dữ liệu từ Web App lên Google Sheet (Batch Sync)
    if (action === 'pushAll') {
      if (body.tasks && Array.isArray(body.tasks)) {
        const taskSheet = ss.getSheetByName(SHEET_TASKS);
        clearDataRows(taskSheet);
        body.tasks.forEach(t => saveOrUpdateRow(taskSheet, t, 'id'));
      }
      if (body.users && Array.isArray(body.users)) {
        const userSheet = ss.getSheetByName(SHEET_USERS);
        clearDataRows(userSheet);
        body.users.forEach(u => saveOrUpdateRow(userSheet, u, 'id'));
      }
      return responseJSON({ success: true, message: 'Đã đồng bộ toàn bộ dữ liệu lên Google Sheets' });
    }

    // 2. Thao tác đơn lẻ
    if (action === 'saveTask') {
      saveOrUpdateRow(ss.getSheetByName(SHEET_TASKS), body.task, 'id');
      return responseJSON({ success: true, message: 'Task saved' });
    }

    if (action === 'deleteTask') {
      deleteRow(ss.getSheetByName(SHEET_TASKS), body.taskId, 'id');
      return responseJSON({ success: true, message: 'Task deleted' });
    }

    if (action === 'saveUser') {
      saveOrUpdateRow(ss.getSheetByName(SHEET_USERS), body.user, 'id');
      return responseJSON({ success: true, message: 'User saved' });
    }

    if (action === 'deleteUser') {
      deleteRow(ss.getSheetByName(SHEET_USERS), body.userId, 'id');
      return responseJSON({ success: true, message: 'User deleted' });
    }

    return responseJSON({ success: false, message: 'Unknown action: ' + action });
  } catch (err) {
    return responseJSON({ success: false, error: err.toString() });
  }
}

// Xóa các dòng data (giữ lại dòng header 1)
function clearDataRows(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
}

// Helper: Đảm bảo các sheet cần thiết đã được tạo với header màu Vàng Gold
function ensureSheets(ss) {
  const sheets = [
    { name: SHEET_TASKS, headers: ['id', 'departmentId', 'title', 'description', 'priority', 'status', 'assigneeId', 'creatorId', 'dueDate', 'category', 'progress', 'cost', 'createdAt', 'updatedAt'] },
    { name: SHEET_USERS, headers: ['id', 'name', 'role', 'departmentId', 'title', 'unit', 'avatar', 'badge', 'phone', 'email'] },
    { name: SHEET_DEPTS, headers: ['id', 'name', 'code', 'unit', 'managerId', 'description', 'badge', 'color'] }
  ];

  sheets.forEach(s => {
    let sheet = ss.getSheetByName(s.name);
    if (!sheet) {
      sheet = ss.insertSheet(s.name);
      sheet.appendRow(s.headers);
      sheet.getRange(1, 1, 1, s.headers.length).setFontWeight('bold').setBackground('#D6A52A').setFontColor('#FFFFFF');
    }
  });
}

// Seed dữ liệu thực tế mẫu của Thanh Vũ Medic CS3 lên Google Sheet
function seedInitialData(ss) {
  const deptSheet = ss.getSheetByName(SHEET_DEPTS);
  const userSheet = ss.getSheetByName(SHEET_USERS);
  const taskSheet = ss.getSheetByName(SHEET_TASKS);

  clearDataRows(deptSheet);
  clearDataRows(userSheet);
  clearDataRows(taskSheet);

  // 1. Departments
  const depts = [
    { id: 'dept_ptkh', name: 'Phòng Phát Triển Khách Hàng', code: 'PTKH-CS3', unit: 'Cơ Sở 3 (Cà Mau)', managerId: 'usr_tuan_ptkh', description: 'Khám đoàn doanh nghiệp, bảo hiểm y tế & chăm sóc khách hàng', badge: 'PTKH', color: '#D6A52A' },
    { id: 'dept_duoc', name: 'Khoa Dược & Vật Tư Y Tế', code: 'DUOC-CS3', unit: 'Cơ Sở 3 (Cà Mau)', managerId: 'usr_minh_duoc', description: 'Cung ứng thuốc, quản lý kho lạnh GSP & hóa chất xét nghiệm', badge: 'DƯỢC', color: '#16A34A' },
    { id: 'dept_qlda', name: 'Ban Quản Lý Dự Án & Cải Tạo', code: 'QLDA-PNH', unit: 'CS Phan Ngọc Hiển', managerId: 'usr_nghia_ct', description: 'Giám sát thi công hoàn thiện cơ sở Phan Ngọc Hiển', badge: 'QLDA', color: '#2563EB' }
  ];
  depts.forEach(d => saveOrUpdateRow(deptSheet, d, 'id'));

  // 2. Users
  const users = [
    { id: 'usr_tam_sep', name: 'Sếp Tâm', role: 'ADMIN', departmentId: 'all', title: 'Tổng Giám Đốc Điều Hành', unit: 'Ban Lãnh Đạo Toàn Viện', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80', badge: 'Lãnh đạo', phone: '0913 888 999', email: 'septam@thanhvumedic.vn' },
    { id: 'usr_tuan_ptkh', name: 'BS.CKI Trần Minh Tuấn', role: 'MANAGER', departmentId: 'dept_ptkh', title: 'Trưởng Phòng Phát Triển Khách Hàng', unit: 'Cơ Sở 3 (Cà Mau)', avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=160&q=80', badge: 'Trưởng phòng', phone: '0945 112 233', email: 'tuan.tm@thanhvumedic.vn' },
    { id: 'usr_thu_dd', name: 'ĐD. Thư', role: 'MEMBER', departmentId: 'dept_ptkh', title: 'Điều Dưỡng Trưởng Khám Đoàn', unit: 'Cơ Sở 3 (Cà Mau)', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=80', badge: 'Chuyên viên', phone: '0918 445 566', email: 'thu.dd@thanhvumedic.vn' },
    { id: 'usr_truc_bs', name: 'BS. Trực CĐHA', role: 'MEMBER', departmentId: 'dept_ptkh', title: 'Bác Sĩ Chẩn Đoán Hình Ảnh', unit: 'Cơ Sở 3 (Cà Mau)', avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=160&q=80', badge: 'Bác sĩ', phone: '0909 778 899', email: 'truc.cdha@thanhvumedic.vn' },
    { id: 'usr_minh_duoc', name: 'DS. Minh', role: 'MANAGER', departmentId: 'dept_duoc', title: 'Trưởng Khoa Dược', unit: 'Cơ Sở 3 (Cà Mau)', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80', badge: 'Trưởng khoa', phone: '0933 667 788', email: 'minh.duoc@thanhvumedic.vn' },
    { id: 'usr_nghia_ct', name: 'Kỹ sư Nghĩa', role: 'MANAGER', departmentId: 'dept_qlda', title: 'Chỉ Huy Trưởng Công Trình', unit: 'CS Phan Ngọc Hiển', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80', badge: 'Chỉ huy trưởng', phone: '0977 123 456', email: 'nghia.kpd@thanhvumedic.vn' }
  ];
  users.forEach(u => saveOrUpdateRow(userSheet, u, 'id'));

  // 3. Initial Tasks
  const tasks = [
    { id: 'TSK-PTKH-01', departmentId: 'dept_ptkh', title: 'Khám sức khỏe định kỳ Đoàn Công ty Thủy sản Minh Phú (1.200 CBCNV)', description: 'Tổ chức xe xét nghiệm lưu động, lấy mẫu máu và chụp X-Quang phổi tận nơi tại phân xưởng Giá Rai.', priority: 'P1', status: 'in_progress', assigneeId: 'usr_thu_dd', creatorId: 'usr_tuan_ptkh', dueDate: '2026-11-08', category: 'Khám Đoàn', progress: 65, cost: 240000000, createdAt: new Date().toISOString() },
    { id: 'TSK-PTKH-02', departmentId: 'dept_ptkh', title: 'Ký kết hợp đồng bảo lãnh viện phí trực tiếp Bảo Việt - CS3', description: 'Hoàn thiện hồ sơ pháp lý danh mục kỹ thuật cao áp dụng bảo lãnh ngoại trú và nội trú tại Cơ Sở 3.', priority: 'P2', status: 'review', assigneeId: 'usr_tuan_ptkh', creatorId: 'usr_tam_sep', dueDate: '2026-11-10', category: 'Bảo Hiểm', progress: 90, cost: 0, createdAt: new Date().toISOString() },
    { id: 'TSK-PTKH-03', departmentId: 'dept_ptkh', title: 'Triển khai gói tầm soát Tim Mạch & Đột Quỵ sớm cho khách hàng VIP CS3', description: 'Đóng gói dịch vụ MRI sọ não + Siêu âm Doppler tim mạch, truyền thông trên Zalo OA và Fanpage bệnh viện.', priority: 'P2', status: 'in_progress', assigneeId: 'usr_truc_bs', creatorId: 'usr_tuan_ptkh', dueDate: '2026-11-15', category: 'Gói Dịch Vụ', progress: 40, cost: 35000000, createdAt: new Date().toISOString() },
    { id: 'TSK-PTKH-04', departmentId: 'dept_ptkh', title: 'Nghiệm thu báo cáo đánh giá sự hài lòng người bệnh ngoại trú Tháng 10', description: 'Tổng hợp 850 phiếu khảo sát QR-Code tại quầy tiếp đón CS3. Tỷ lệ hài lòng đạt 94.6%.', priority: 'P3', status: 'done', assigneeId: 'usr_thu_dd', creatorId: 'usr_tuan_ptkh', dueDate: '2026-11-02', category: 'Đánh Giá', progress: 100, cost: 5000000, createdAt: new Date().toISOString() }
  ];
  tasks.forEach(t => saveOrUpdateRow(taskSheet, t, 'id'));
}

function getSheetData(sheet) {
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  const headers = rows[0];
  const data = [];
  for (let i = 1; i < rows.length; i++) {
    const item = {};
    headers.forEach((h, idx) => {
      item[h] = rows[i][idx];
    });
    data.push(item);
  }
  return data;
}

function saveOrUpdateRow(sheet, item, keyField) {
  if (!sheet || !item) return;
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const keyIdx = headers.indexOf(keyField);
  let foundRowIdx = -1;

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][keyIdx]) === String(item[keyField])) {
      foundRowIdx = i + 1;
      break;
    }
  }

  const rowValues = headers.map(h => item[h] !== undefined ? item[h] : '');

  if (foundRowIdx > 0) {
    sheet.getRange(foundRowIdx, 1, 1, headers.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
}

function deleteRow(sheet, idVal, keyField) {
  if (!sheet) return;
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const keyIdx = headers.indexOf(keyField);
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][keyIdx]) === String(idVal)) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
}

function responseJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

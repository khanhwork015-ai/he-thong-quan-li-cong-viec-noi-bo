/**
 * THANH VŨ MEDIC CS3 - GOOGLE APPS SCRIPT WEB APP BACKEND (SHIN AIOS BRIDGE v2.7)
 * Tự động tạo bảng & đồng bộ 2 chiều dữ liệu thực tế với Google Sheets
 * Hỗ trợ 4 Sheets: TASKS, USERS, DEPARTMENTS, NOTIFICATIONS
 * 
 * HƯỚNG DẪN TRIỂN KHAI TRÊN GOOGLE SHEETS:
 * 1. Mở một Google Spreadsheet mới, đặt tên: "TVM_CS3_Task_Database"
 * 2. Vào Extensions (Tiện ích mở rộng) -> Apps Script
 * 3. Xóa hết code cũ, dán TOÀN BỘ file này vào Code.gs và bấm Lưu (Ctrl+S)
 * 4. Bấm nút "Deploy" (Triển khai) góc trên bên phải -> "New deployment" (Triển khai mới)
 * 5. Bấm icon bánh răng cưa -> chọn "Web app"
 *    - Description: "TVM CS3 Task & Notification Sync v2.7"
 *    - Execute as: "Me" (Tôi)
 *    - Who has access: "Anyone" (Bất kỳ ai)  <-- CỰC KỲ QUAN TRỌNG ĐỂ KHÔNG BỊ CHẶN QUYỀN
 * 6. Bấm "Deploy" -> Cấp quyền cho Google Tài khoản -> Copy URL Web App (đuôi /exec)
 * 7. Dán URL vào ô "Cài đặt" trong ứng dụng và bấm "Đồng bộ ngay"!
 */

const SHEET_TASKS = 'TASKS';
const SHEET_USERS = 'USERS';
const SHEET_DEPTS = 'DEPARTMENTS';
const SHEET_NOTIFS = 'NOTIFICATIONS';

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
      const rawTasks = getSheetData(ss.getSheetByName(SHEET_TASKS));
      const tasks = rawTasks.map(t => {
        let subtasks = t.subtasks;
        if (typeof subtasks === 'string' && subtasks.trim().startsWith('[')) {
          try { subtasks = JSON.parse(subtasks); } catch (_) { subtasks = []; }
        }
        if (!Array.isArray(subtasks) || subtasks.length === 0) {
          if (typeof t.checklist === 'string' && t.checklist.trim().startsWith('[')) {
            try { subtasks = JSON.parse(t.checklist); } catch (_) { subtasks = []; }
          } else if (Array.isArray(t.checklist)) {
            subtasks = t.checklist;
          }
        }
        if (!Array.isArray(subtasks)) subtasks = [];
        t.subtasks = subtasks;
        t.checklist = subtasks.map(s => ({ id: s.id, text: s.title || s.text || '', done: Boolean(s.completed || s.status === 'done' || s.done) }));

        if (typeof t.comments === 'string' && t.comments.trim().startsWith('[')) {
          try { t.comments = JSON.parse(t.comments); } catch (_) { t.comments = []; }
        }
        if (!Array.isArray(t.comments)) t.comments = [];

        return t;
      });
      const users = getSheetData(ss.getSheetByName(SHEET_USERS));
      const rawDepts = getSheetData(ss.getSheetByName(SHEET_DEPTS));
      const depts = rawDepts.map(d => {
        if (typeof d.teams === 'string' && d.teams.trim().startsWith('[')) {
          try { d.teams = JSON.parse(d.teams); } catch (_) { d.teams = []; }
        }
        if (!Array.isArray(d.teams)) d.teams = [];
        return d;
      });
      const notifs = getSheetData(ss.getSheetByName(SHEET_NOTIFS));

      return responseJSON({
        success: true,
        message: 'Lấy dữ liệu thành công từ Google Sheets',
        tasks: tasks,
        users: users,
        depts: depts,
        notifications: notifs,
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
      if (body.notifications && Array.isArray(body.notifications)) {
        const notifSheet = ss.getSheetByName(SHEET_NOTIFS);
        clearDataRows(notifSheet);
        body.notifications.forEach(n => saveOrUpdateRow(notifSheet, n, 'id'));
      }
      if (body.departments && Array.isArray(body.departments)) {
        const deptSheet = ss.getSheetByName(SHEET_DEPTS);
        clearDataRows(deptSheet);
        body.departments.forEach(d => {
          const toSave = { ...d, teams: JSON.stringify(d.teams || []) };
          saveOrUpdateRow(deptSheet, toSave, 'id');
        });
      }
      return responseJSON({ success: true, message: 'Đã đồng bộ toàn bộ dữ liệu (Tasks, Users, Departments, Notifications) lên Google Sheets' });
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

    if (action === 'saveDepartments' && body.departments) {
      const deptSheet = ss.getSheetByName(SHEET_DEPTS);
      clearDataRows(deptSheet);
      body.departments.forEach(d => {
        const toSave = { ...d, teams: JSON.stringify(d.teams || []) };
        saveOrUpdateRow(deptSheet, toSave, 'id');
      });
      return responseJSON({ success: true, message: 'Departments saved' });
    }

    if (action === 'saveNotification') {
      saveOrUpdateRow(ss.getSheetByName(SHEET_NOTIFS), body.notification, 'id');
      return responseJSON({ success: true, message: 'Notification saved' });
    }

    if (action === 'markNotificationRead') {
      const notifSheet = ss.getSheetByName(SHEET_NOTIFS);
      const rows = notifSheet.getDataRange().getValues();
      const headers = rows[0];
      const idIdx = headers.indexOf('id');
      const readIdx = headers.indexOf('isRead');
      if (idIdx >= 0 && readIdx >= 0) {
        for (let i = 1; i < rows.length; i++) {
          if (String(rows[i][idIdx]) === String(body.notifId)) {
            notifSheet.getRange(i + 1, readIdx + 1).setValue(true);
            break;
          }
        }
      }
      return responseJSON({ success: true, message: 'Notification marked as read' });
    }

    return responseJSON({ success: false, message: 'Unknown action: ' + action });
  } catch (err) {
    return responseJSON({ success: false, error: err.toString() });
  }
}

// Xóa các dòng data (giữ lại dòng header 1)
function clearDataRows(sheet) {
  if (!sheet) return;
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
}

// Helper: Đảm bảo các sheet cần thiết đã được tạo với header màu Vàng Gold
function ensureSheets(ss) {
  const sheets = [
    { 
      name: SHEET_TASKS, 
      headers: ['id', 'departmentId', 'teamId', 'title', 'description', 'priority', 'status', 'requiresApproval', 'approvalStatus', 'approverId', 'assigneeId', 'creatorId', 'dueDate', 'category', 'progress', 'cost', 'subtasks', 'comments', 'createdAt', 'updatedAt'] 
    },
    { 
      name: SHEET_USERS, 
      headers: ['id', 'username', 'password', 'name', 'role', 'departmentId', 'teamId', 'title', 'unit', 'avatar', 'badge', 'phone', 'email', 'dob', 'hometown', 'createdAt', 'updatedAt'] 
    },
    { 
      name: SHEET_DEPTS, 
      headers: ['id', 'name', 'code', 'unit', 'managerId', 'description', 'badge', 'color'] 
    },
    { 
      name: SHEET_NOTIFS, 
      headers: ['id', 'recipientId', 'senderId', 'title', 'content', 'taskId', 'type', 'isRead', 'createdAt'] 
    }
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
  const notifSheet = ss.getSheetByName(SHEET_NOTIFS);

  clearDataRows(deptSheet);
  clearDataRows(userSheet);
  clearDataRows(taskSheet);
  clearDataRows(notifSheet);

  // 1. Departments
  const depts = [
    { id: 'dept_ptkh', name: 'Phòng Phát Triển Khách Hàng', code: 'PTKH-CS3', unit: 'Cơ Sở 3 (Cà Mau)', managerId: 'user_tam_ptkh', description: 'Khám đoàn doanh nghiệp, bảo hiểm y tế & chăm sóc khách hàng', badge: 'PTKH', color: '#D6A52A', teams: JSON.stringify([
      { id: 'team_cskh', name: 'Chăm Sóc Khách Hàng', code: 'CSKH' },
      { id: 'team_mkt', name: 'Marketing & Truyền Thông', code: 'MKT' },
      { id: 'team_hotro', name: 'Hỗ Trợ & Tiếp Đón', code: 'HOTRO' }
    ]) },
    { id: 'dept_duoc', name: 'Kho Dược & Vật Tư Y Tế', code: 'DUOC-CS3', unit: 'Cơ Sở 3 (Cà Mau)', managerId: 'user_minh_duoc', description: 'Cung ứng thuốc, quản lý kho lạnh GSP & hóa chất xét nghiệm', badge: 'DƯỢC', color: '#0D9488', teams: JSON.stringify([
      { id: 'team_duoc_gsp', name: 'Kho Thuốc GSP', code: 'GSP' },
      { id: 'team_duoc_vaccine', name: 'Kho Lạnh Vaccine', code: 'VAC' }
    ]) },
    { id: 'dept_qlda', name: 'Ban QLDA & Thi Công Cải Tạo', code: 'QLDA-SVH', unit: 'Công trường SVH & STN', managerId: 'user_nghia_qlda', description: 'Giám sát thi công hoàn thiện cơ sở Phan Ngọc Hiển', badge: 'QLDA', color: '#2563EB', teams: JSON.stringify([
      { id: 'team_qlda_thicong', name: 'Tổ Thi Công Xây Dựng', code: 'TC' },
      { id: 'team_qlda_giamsat', name: 'Tổ Giám Sát Kỹ Thuật', code: 'GS' }
    ]) }
  ];
  depts.forEach(d => saveOrUpdateRow(deptSheet, d, 'id'));

  // 2. Users (RBAC 4 cấp: ADMIN, LEADERSHIP, MANAGER, MEMBER)
  const users = [
    { id: 'user_admin', username: 'admin', password: '123', name: 'Quản Trị Viên Hệ Thống', role: 'ADMIN', departmentId: 'all', teamId: 'all', title: 'Quản Trị Viên Cấp Cao', unit: 'Phòng CNTT & Quản Trị Hệ Thống', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80', badge: 'Admin Hệ Thống', phone: '0913 888 999', email: 'admin@thanhvumedic.vn', dob: '1980-01-01', hometown: 'Cà Mau' },
    { id: 'user_lanhdao', username: 'lanhdao', password: '123', name: 'ThS.BS Nguyễn Thanh Vũ', role: 'LEADERSHIP', departmentId: 'all', teamId: 'all', title: 'Chủ Tịch HĐQT / Ban Lãnh Đạo', unit: 'Ban Lãnh Đạo Toàn Viện', avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=160&q=80', badge: 'Ban Lãnh Đạo', phone: '0913 777 888', email: 'lanhdao@thanhvumedic.vn', dob: '1975-10-15', hometown: 'Cà Mau' },
    { id: 'user_tam_ptkh', username: 'thanhtam', password: '123', name: 'Huỳnh Trường Thanh Tâm', role: 'MANAGER', departmentId: 'dept_ptkh', teamId: 'all', title: 'Trưởng phòng Phát Triển Khách Hàng', unit: 'Phòng Phát Triển Khách Hàng • CS3', avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=160&q=80', badge: 'Trưởng phòng', phone: '0945 112 233', email: 'thanhtam.ptkh@thanhvumedic.vn', dob: '1986-06-20', hometown: 'Cà Mau' },
    { id: 'user_mai_ptkh', username: 'tuyetmai', password: '123', name: 'CN. Nguyễn Thị Tuyết Mai', role: 'MEMBER', departmentId: 'dept_ptkh', teamId: 'team_cskh', title: 'Chuyên viên CSKH & Tiếp Nhận', unit: 'Bộ phận CSKH • Phòng PTKH', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=80', badge: 'Chuyên viên CSKH', phone: '0918 445 566', email: 'mai.ntt@thanhvumedic.vn', dob: '1992-04-15', hometown: 'Bạc Liêu' },
    { id: 'user_minh_duoc', username: 'minhhn', password: '123', name: 'DS.CKI Nguyễn Văn Minh', role: 'MANAGER', departmentId: 'dept_duoc', teamId: 'all', title: 'Trưởng Kho Dược CS3', unit: 'Kho Dược & VTYT • CS3', avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=160&q=80', badge: 'Trưởng phòng', phone: '0933 667 788', email: 'minh.duoc@thanhvumedic.vn', dob: '1982-08-12', hometown: 'Cà Mau' },
    { id: 'user_nghia_qlda', username: 'nghiath', password: '123', name: 'KS. Trương Hữu Nghĩa', role: 'MANAGER', departmentId: 'dept_qlda', teamId: 'all', title: 'Chỉ Huy Trưởng Ban QLDA', unit: 'Ban QLDA Cải Tạo SVH-STN', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80', badge: 'Chỉ huy trưởng', phone: '0977 123 456', email: 'nghia.kpd@thanhvumedic.vn', dob: '1988-03-25', hometown: 'TP. Hồ Chí Minh' }
  ];
  users.forEach(u => saveOrUpdateRow(userSheet, u, 'id'));

  // 3. Initial Tasks
  const tasks = [
    { id: 'PTKH-101', departmentId: 'dept_ptkh', teamId: 'team_cskh', title: 'Chuẩn bị tài liệu & báo cáo tiếp đón Đoàn kiểm tra Sở Y Tế Cà Mau', description: 'Tổng hợp số liệu khám chữa bệnh BHYT, quy trình đón tiếp bệnh nhân VIP tại CS3.', priority: 'P1', status: 'in_progress', requiresApproval: false, approvalStatus: 'NONE', approverId: 'user_tam_ptkh', assigneeId: 'user_mai_ptkh', creatorId: 'user_tam_ptkh', dueDate: '2026-11-06', category: 'Báo cáo & Kiểm tra', progress: 50, cost: 2500000, createdAt: new Date().toISOString() },
    { id: 'PTKH-102', departmentId: 'dept_ptkh', teamId: 'team_cskh', title: 'Đàm phán hợp đồng khám sức khỏe định kỳ Cty Thủy Sản Minh Phú (1.200 CBCNV)', description: 'Khảo sát nhu cầu khám lưu động tại Nhà máy Chế biến Thủy sản Giá Rai. Trình duyệt bảng giá ưu đãi.', priority: 'P2', status: 'pending_approval', requiresApproval: true, approvalStatus: 'PENDING', approverId: 'user_tam_ptkh', assigneeId: 'user_mai_ptkh', creatorId: 'user_mai_ptkh', dueDate: '2026-11-08', category: 'Khám Đoàn', progress: 100, cost: 180000000, createdAt: new Date().toISOString() },
    { id: 'DUOC-201', departmentId: 'dept_duoc', teamId: 'team_duoc_vaccine', title: 'Kiểm kê định kỳ & thẩm định nhiệt độ kho lạnh bảo quản Vaccine GSP', description: 'Xuất dữ liệu biểu đồ cảm biến nhiệt độ tự động (2-8 độ C) 30 ngày qua.', priority: 'P1', status: 'in_progress', requiresApproval: false, approvalStatus: 'NONE', approverId: 'user_admin', assigneeId: 'user_minh_duoc', creatorId: 'user_minh_duoc', dueDate: '2026-11-07', category: 'GSP & Kho Lạnh', progress: 50, cost: 0, createdAt: new Date().toISOString() }
  ];
  tasks.forEach(t => saveOrUpdateRow(taskSheet, t, 'id'));

  // 4. Initial Notifications
  const notifs = [
    { id: 'notif_init_1', recipientId: 'user_tam_ptkh', senderId: 'user_mai_ptkh', title: '⏳ Đề xuất cần phê duyệt 1-chạm', content: 'CN. Nguyễn Thị Tuyết Mai đã gửi đề xuất phê duyệt hợp đồng khám Minh Phú (1.200 CBCNV).', taskId: 'PTKH-102', type: 'approval_request', isRead: false, createdAt: new Date().toISOString() }
  ];
  notifs.forEach(n => saveOrUpdateRow(notifSheet, n, 'id'));
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
  let rows = sheet.getDataRange().getValues();
  let headers = rows[0] || [];

  const newCols = Object.keys(item).filter(k => !headers.includes(k) && typeof item[k] !== 'function');
  if (newCols.length > 0) {
    newCols.forEach(col => {
      headers.push(col);
      sheet.getRange(1, headers.length).setValue(col).setFontWeight('bold').setBackground('#D6A52A').setFontColor('#FFFFFF');
    });
    rows = sheet.getDataRange().getValues();
  }

  const keyIdx = headers.indexOf(keyField);
  let foundRowIdx = -1;

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][keyIdx]) === String(item[keyField])) {
      foundRowIdx = i + 1;
      break;
    }
  }

  const rowValues = headers.map(h => {
    const val = item[h];
    if (val !== undefined && val !== null) {
      if (typeof val === 'object') {
        return JSON.stringify(val);
      }
      return val;
    }
    return '';
  });

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

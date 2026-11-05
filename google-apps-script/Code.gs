/**
 * THANH VŨ MEDIC CS3 - GOOGLE APPS SCRIPT WEB APP BACKEND
 * Kết nối Google Sheets với Hệ thống Quản Lý Công Việc (SHIN AIOS Bridge)
 * 
 * HƯỚNG DẪN TRIỂN KHAI TRÊN GOOGLE SHEETS:
 * 1. Mở một Google Spreadsheet mới, đặt tên: "TVM_CS3_Task_Database"
 * 2. Vào Extensions (Tiện ích mở rộng) -> Apps Script
 * 3. Dán toàn bộ mã nguồn này vào file Code.gs
 * 4. Bấm "Deploy" (Triển khai) -> "New deployment" (Triển khai mới)
 * 5. Chọn loại: "Web app"
 *    - Execute as: "Me" (Tôi)
 *    - Who has access: "Anyone" (Bất kỳ ai)
 * 6. Copy URL Web App (dạng https://script.google.com/macros/s/.../exec)
 * 7. Dán URL này vào mục "Cài Đặt" trong ứng dụng TVM CS3 để đồng bộ 2 chiều!
 */

const SHEET_TASKS = 'TASKS';
const SHEET_USERS = 'USERS';
const SHEET_DEPTS = 'DEPARTMENTS';

function doGet(e) {
  const action = e.parameter.action || 'getData';
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheets(ss);

  if (action === 'getData') {
    const tasks = getSheetData(ss.getSheetByName(SHEET_TASKS));
    const users = getSheetData(ss.getSheetByName(SHEET_USERS));
    const depts = getSheetData(ss.getSheetByName(SHEET_DEPTS));
    return responseJSON({ success: true, tasks, users, depts });
  }

  return responseJSON({ success: false, message: 'Invalid action' });
}

function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    ensureSheets(ss);
    const body = JSON.parse(e.postData.contents);
    const action = body.action;

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

    return responseJSON({ success: false, message: 'Unknown action' });
  } catch (err) {
    return responseJSON({ success: false, error: err.toString() });
  }
}

// Helper: Đảm bảo các sheet cần thiết đã được tạo
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

function getSheetData(sheet) {
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

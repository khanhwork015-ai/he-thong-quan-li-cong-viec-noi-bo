/**
 * THANH VŨ MEDIC CS3 - TASK DETAIL SLIDE-OVER DRAWER COMPONENT
 * Ngăn trượt chi tiết công việc từ bên phải phong cách Linear / Notion chuẩn Google Stitch
 * Chuẩn màu Vàng Hoàng Kim Gold #D6A52A / #795900, Badges theo quy chuẩn 6 màu
 * Hỗ trợ Cơ chế Phê Duyệt 1-Chạm (Duyệt ngay / Từ chối kèm lý do) & Touch Target >= 44px
 */

import { auth } from '../auth.js?v=7.8';
import { store } from '../store.js?v=7.8';
import { esc, soVN, ngayVN, toast, timeAgo, rung, xacNhan2Lan, xacNhanXoa, popupTuChoiPheDuyet, kiemTraTreHan } from '../helpers.js?v=7.8';

export class TaskDrawer {
  constructor(containerId, onTaskUpdated, onEditTask = null, onOpenSubtaskDetail = null) {
    this.container = document.getElementById(containerId);
    this.onTaskUpdated = onTaskUpdated;
    this.onTaskChanged = onTaskUpdated;
    this.onEditTask = onEditTask;
    this.onOpenSubtaskDetail = onOpenSubtaskDetail;
    this.currentTaskId = null;
  }

  open(taskId) {
    rung(10);
    this.currentTaskId = taskId;
    try {
      this.render();
    } catch (err) {
      console.error('[TASK DRAWER OPEN ERROR]', err);
      toast('Lỗi khi mở công việc: ' + err.message, 'error');
    }
  }

  close() {
    rung(10);
    this.currentTaskId = null;
    if (this.container) {
      this.container.innerHTML = '';
    }
  }

  render() {
    if (!this.container || !this.currentTaskId) return;

    const task = store.getTaskById(this.currentTaskId);
    if (!task) {
      this.close();
      return;
    }

    const prevBody = this.container.querySelector('#taskDrawerScrollBody');
    const prevScrollTop = prevBody ? prevBody.scrollTop : 0;

    // Đảm bảo subtasks và comments luôn là Mảng chuẩn an toàn
    if (!Array.isArray(task.subtasks)) {
      if (typeof task.subtasks === 'string' && task.subtasks.trim().startsWith('[')) {
        try { task.subtasks = JSON.parse(task.subtasks); } catch (_) { task.subtasks = []; }
      } else {
        task.subtasks = [];
      }
    }
    if (task.subtasks.length === 0 && Array.isArray(task.checklist) && task.checklist.length > 0) {
      task.subtasks = task.checklist.map((c, i) => ({
        id: c.id || `${task.id}.${i + 1}`,
        title: c.text || c.title || '',
        description: '',
        assigneeId: c.assigneeId || task.assigneeId || '',
        dueDate: c.dueDate || task.dueDate || '',
        status: (c.done || c.completed) ? 'done' : 'in_progress',
        completed: Boolean(c.done || c.completed),
        createdAt: new Date().toISOString()
      }));
    }
    if (!Array.isArray(task.comments)) {
      if (typeof task.comments === 'string' && task.comments.trim().startsWith('[')) {
        try { task.comments = JSON.parse(task.comments); } catch (_) { task.comments = []; }
      } else {
        task.comments = [];
      }
    }

    const currentUser = auth.getCurrentUser() || {};
    const assignee = store.getUserById(task.assigneeId);
    const creator = store.getUserById(task.creatorId);
    const approver = store.getUserById(task.approverId);
    const dept = store.getDepartmentById(task.departmentId);
    const deptTeams = Array.isArray(dept?.teams) ? dept.teams : [];
    const team = deptTeams.find(t => t.id === task.teamId);

    const isPendingApproval = task.status === 'pending_approval' || task.status === 'review';
    const canManageTask = auth.isAdmin() || auth.isLeadership() || (auth.isManager() && currentUser.departmentId === task.departmentId) || (currentUser.id === task.creatorId);
    
    // Phân quyền phê duyệt: Người duyệt chỉ định, Admin, Lãnh đạo hoặc Trưởng phòng cùng khoa
    const canUserApproveThisTask = auth.isAdmin() || 
      auth.isLeadership() || 
      (task.approverId && task.approverId === currentUser.id) || 
      (auth.isManager() && currentUser.departmentId === task.departmentId);
    
    const { isOverdue, daysLate } = kiemTraTreHan(task.dueDate, task.status);

    const statusMeta = this.getStatusMeta(task.status);

    this.container.innerHTML = `
      <div class="drawer-backdrop fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end active" id="drawerBackdrop">
        <div class="drawer-panel w-full max-w-xl h-full bg-white shadow-2xl flex flex-col justify-between overflow-hidden border-l border-[#e2e8f0]" style="background-color: var(--card); border-color: var(--border);">
          
          <!-- DRAWER HEADER -->
          <div class="h-16 px-5 sm:px-6 border-b border-[#e2e8f0] flex items-center justify-between shrink-0 bg-[#f8f9ff]" style="background-color: var(--primary-soft); border-color: var(--border);">
            <div class="flex items-center gap-2.5 min-w-0">
              <span class="font-mono-data text-[13px] font-bold px-2.5 py-1 rounded-lg bg-[#fffbeb] border border-[#fef3c7] text-[#795900] shrink-0">
                ${esc(task.id)}
              </span>
              <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${task.priority === 'P1' ? 'bg-[#fee2e2] text-[#b91c1c]' : 'bg-[#fef3c7] text-[#92400e]'}">
                ${task.priority} • ${task.priority === 'P1' ? 'Khẩn cấp' : 'Quan trọng'}
              </span>
              ${team ? `
                <span class="hidden sm:inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 truncate">
                  ${esc(team.name)}
                </span>
              ` : ''}
            </div>

            <div class="flex items-center gap-1.5">
              ${canManageTask ? `
                <button type="button" id="btnDrawerEditTask" class="px-3 py-1.5 rounded-xl border border-[#d6a52a] text-[#795900] bg-[#fffbeb] hover:bg-[#fde68a] font-bold text-[12.5px] min-h-[38px] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs shrink-0" title="Chỉnh sửa thông tin nhiệm vụ cha">
                  <span class="material-symbols-outlined text-[17px]">edit</span>
                  <span>Chỉnh sửa</span>
                </button>
                <button type="button" id="btnDrawerDeleteTask" class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl min-w-[38px] min-h-[38px] flex items-center justify-center transition-colors cursor-pointer shrink-0" title="Xóa nhiệm vụ này">
                  <span class="material-symbols-outlined text-[18px]">delete</span>
                </button>
              ` : ''}
              <button type="button" class="p-2 rounded-xl text-[#64748b] hover:text-[#0d1c2f] hover:bg-gray-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer shrink-0" id="btnCloseDrawer" aria-label="Đóng">
                <span class="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>
          </div>

          <!-- DRAWER SCROLLABLE BODY -->
          <div class="p-5 sm:p-6 flex-1 overflow-y-auto flex flex-col gap-4 sm:gap-5" id="taskDrawerScrollBody">
            
            ${isOverdue ? `
              <!-- 0. CẢNH BÁO QUÁ HẠN DEADLINE (OVERDUE ALERT BANNER) -->
              <div class="p-3.5 sm:p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 flex items-start gap-3 shadow-2xs animate-fade-in">
                <div class="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-[24px]">alarm_on</span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <strong class="font-extrabold text-[14px] text-rose-700">CẢNH BÁO: NHIỆM VỤ ĐÃ TRỄ DEADLINE ${daysLate} NGÀY!</strong>
                    <span class="px-2 py-0.2 rounded-full bg-rose-200 text-rose-900 font-bold text-[10.5px]">Đôn đốc khẩn</span>
                  </div>
                  <p class="text-[12px] text-rose-800 mt-1 leading-relaxed">
                    Hạn hoàn thành ban đầu là <strong>${ngayVN(task.dueDate)}</strong>. Người phụ trách cần nhanh chóng xử lý dứt điểm hoặc liên hệ quản lý để gia hạn.
                  </p>
                </div>
              </div>
            ` : ''}

            <!-- 1. BANNER CẢNH BÁO PHÊ DUYỆT 1-CHẠM -->
            ${isPendingApproval ? `
              <div class="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex items-start gap-3 text-amber-900 shadow-2xs animate-fade-in">
                <span class="material-symbols-outlined text-[24px] text-amber-600 shrink-0 mt-0.5">pending_actions</span>
                <div class="flex-1 min-w-0">
                  <div class="font-bold text-[13.5px] flex items-center gap-1.5">
                    <span>Nhiệm Vụ Đang Chờ Phê Duyệt</span>
                    <span class="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.2 rounded-full font-bold">1-Chạm</span>
                  </div>
                  <div class="text-[12px] text-amber-800 mt-1 leading-relaxed">
                    Người phê duyệt chỉ định: <strong>${approver ? esc(approver.name) : 'Ban Lãnh Đạo / Trưởng phòng'}</strong>
                    ${canUserApproveThisTask ? ' • <span class="text-[#795900] font-bold">Bạn có thẩm quyền ký duyệt ngay bên dưới.</span>' : ''}
                  </div>
                </div>
              </div>
            ` : ''}

            <!-- 2. TITLE & DESCRIPTION -->
            <div>
              <h2 class="text-[18px] sm:text-[19px] font-bold text-[#0d1c2f] leading-snug" style="color: var(--text);">${esc(task.title)}</h2>
              <p class="text-[13.5px] text-[#4f4635] mt-2.5 leading-relaxed bg-[#f8f9ff] p-4 rounded-2xl border border-[#e2e8f0]" style="background-color: var(--background); border-color: var(--border); color: var(--text-muted);">
                ${esc(task.description || 'Chưa có mô tả chi tiết.')}
              </p>
            </div>

            <!-- THÔNG TIN NGƯỜI TẠO & THỜI GIAN TẠO -->
            <div class="p-3 px-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between text-[12px] text-[#795900]">
              <div class="flex items-center gap-2 min-w-0">
                <span class="material-symbols-outlined text-[18px] text-[#795900] shrink-0">edit_note</span>
                <span class="truncate">Khởi tạo bởi: <strong>${creator ? esc(creator.name) : esc(task.creatorName || 'Ban Giám Đốc')}</strong></span>
              </div>
              <div class="flex items-center gap-1 font-mono-data text-[11px] text-[#817663] shrink-0">
                <span class="material-symbols-outlined text-[15px]">schedule</span>
                <span>${task.createdAt ? ngayVN(task.createdAt) : 'Hôm nay'}</span>
              </div>
            </div>

            <!-- 3. KHU VỰC PHÂN CÔNG NGƯỜI THỰC HIỆN (ASSIGNEE) -->
            <div class="p-4 rounded-2xl border border-[#e2e8f0] flex flex-col gap-2.5 shadow-2xs" style="background-color: var(--primary-soft); border-color: var(--border);">
              <div class="flex items-center justify-between">
                <span class="text-[12px] font-bold flex items-center gap-1.5" style="color: var(--primary);">
                  <span class="material-symbols-outlined text-[18px]">person_check</span>
                  <span>Người thực hiện (Assignee)</span>
                </span>
                <span class="text-[10.5px] font-semibold text-[#817663]">Đổi người phụ trách tại đây</span>
              </div>

              <!-- THẺ HIỂN THỊ VÀ ĐỔI NGƯỜI PHỤ TRÁCH (CUSTOM MEMBER CARD TOÀN HỆ THỐNG) -->
              <div 
                id="btnOpenDrawerAssigneePicker"
                class="flex items-center justify-between p-3 rounded-xl bg-white border border-[#cbd5e1] hover:border-[#d6a52a] transition-all cursor-pointer shadow-2xs group min-h-[56px]"
                style="background-color: var(--card); border-color: var(--border);"
                title="Nhấn để đổi người phụ trách trong phòng ban này"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <div class="relative shrink-0">
                    <img id="drawerAssigneeAvatar" src="${assignee ? assignee.avatar : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80'}" class="w-10 h-10 rounded-full object-cover ring-2 ring-amber-300 shadow-xs" />
                    <span class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                  </div>
                  <div class="min-w-0 flex flex-col text-left">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span id="drawerAssigneeName" class="font-bold text-[13.5px] text-[#0d1c2f] truncate" style="color: var(--text);">
                        ${assignee ? esc(assignee.name) : 'Chưa giao'}
                      </span>
                      <span class="font-mono-data text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                        ${assignee ? esc(assignee.badge || assignee.role) : 'Thành viên'}
                      </span>
                    </div>
                    <span id="drawerAssigneeTitle" class="text-[11.5px] text-[#64748b] truncate mt-0.5">
                      ${assignee ? esc(assignee.title || 'Nhân sự') : 'Chưa chỉ định'}
                    </span>
                  </div>
                </div>

                <div class="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#f8f9ff] text-[#795900] group-hover:bg-[#fffbeb] border border-[#e2e8f0] transition-colors shrink-0 font-bold text-[12px]">
                  <span>Đổi người</span>
                  <span class="material-symbols-outlined text-[18px]">expand_more</span>
                </div>
              </div>

              <div class="text-[11px] text-[#64748b] flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span>Người giao việc: <strong>${creator ? esc(creator.name) : (task.creatorName || 'Ban Giám Đốc')}</strong></span>
                <span class="text-amber-700 font-semibold flex items-center gap-1">
                  <span class="material-symbols-outlined text-[14px]">notifications_active</span>
                  <span>Tự động gửi chuông thông báo khi đổi người</span>
                </span>
              </div>
            </div>

            <!-- 4. METADATA GRID -->
            <div class="grid grid-cols-2 gap-3.5 p-4 rounded-2xl bg-white border ${isOverdue ? 'border-rose-200 bg-rose-50/15' : 'border-[#e2e8f0]'}" style="background-color: var(--card); border-color: var(--border);">
              <div>
                <span class="text-[11px] ${isOverdue ? 'text-rose-600 font-bold' : 'text-[#64748b] font-medium'} uppercase tracking-wider flex items-center gap-1">
                  ${isOverdue ? '<span class="material-symbols-outlined text-[14px] text-rose-600">warning</span>' : ''}
                  <span>Hạn hoàn thành</span>
                </span>
                <div class="text-[13px] font-bold ${isOverdue ? 'text-rose-600' : 'text-[#0d1c2f]'} font-mono-data mt-1 flex items-center gap-1.5 flex-wrap" style="${isOverdue ? 'color: #dc2626;' : 'color: var(--text);'}">
                  <span class="material-symbols-outlined text-[16px] ${isOverdue ? 'text-rose-600' : 'text-[#795900]'}">${isOverdue ? 'alarm' : 'event'}</span>
                  <span>${ngayVN(task.dueDate)}</span>
                  ${isOverdue ? `
                    <span class="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 border border-rose-300">
                      Trễ ${daysLate} ngày
                    </span>
                  ` : ''}
                </div>
              </div>

              <div>
                <span class="text-[11px] text-[#64748b] font-medium uppercase tracking-wider">Dự toán kinh phí</span>
                <div class="text-[13px] font-bold text-[#0d1c2f] font-mono-data mt-1" style="color: var(--text);">
                  ${soVN(task.cost)} đ
                </div>
              </div>
            </div>

            <!-- 5. STATUS SELECTOR (CUSTOM STYLED DROPDOWN) -->
            <div class="p-4 rounded-2xl bg-[#f8f9ff] border border-[#e2e8f0] flex items-center justify-between relative" style="background-color: var(--background); border-color: var(--border);">
              <div>
                <span class="text-[11px] text-[#64748b] font-bold uppercase tracking-wider">Trạng thái hiện tại</span>
                <div class="text-[13px] font-bold mt-0.5" style="color: ${statusMeta.text};">
                  ${statusMeta.label}
                </div>
              </div>

              <div class="relative">
                <button type="button" id="btnCustomStatusToggle" class="h-10 px-3.5 rounded-xl bg-white border border-[#e2e8f0] hover:border-[#d6a52a] text-[12.5px] font-bold flex items-center gap-2 shadow-2xs transition-all cursor-pointer min-h-[40px]" style="color: ${statusMeta.text};">
                  <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${statusMeta.text};"></span>
                  <span>${statusMeta.label}</span>
                  <span class="material-symbols-outlined text-[18px] text-[#64748b]">expand_more</span>
                </button>

                <!-- STATUS DROPDOWN POPUP -->
                <div id="statusCustomMenu" class="hidden absolute right-0 top-12 w-48 bg-white rounded-2xl shadow-xl border border-[#e2e8f0] p-1.5 z-30 flex flex-col gap-1 animate-fade-in" style="background-color: var(--card); border-color: var(--border);">
                  <button type="button" class="btn-select-status w-full px-3 py-2.5 rounded-xl text-left text-[12.5px] font-bold flex items-center gap-2 hover:bg-[#fffbeb] hover:text-[#795900] transition-colors cursor-pointer min-h-[40px] ${task.status === 'todo' ? 'bg-[#f1f5f9] text-[#475569]' : 'text-[#475569]'}" data-status="todo">
                    <span class="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                    <span>Chưa bắt đầu</span>
                  </button>
                  <button type="button" class="btn-select-status w-full px-3 py-2.5 rounded-xl text-left text-[12.5px] font-bold flex items-center gap-2 hover:bg-[#fffbeb] hover:text-[#795900] transition-colors cursor-pointer min-h-[40px] ${task.status === 'in_progress' ? 'bg-[#dbeafe] text-[#1d4ed8]' : 'text-[#1d4ed8]'}" data-status="in_progress">
                    <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    <span>Đang thực hiện</span>
                  </button>
                  <button type="button" class="btn-select-status w-full px-3 py-2.5 rounded-xl text-left text-[12.5px] font-bold flex items-center gap-2 hover:bg-[#fffbeb] hover:text-[#795900] transition-colors cursor-pointer min-h-[40px] ${(task.status === 'pending_approval' || task.status === 'review') ? 'bg-[#fef3c7] text-[#92400e]' : 'text-[#92400e]'}" data-status="pending_approval">
                    <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span>Chờ phê duyệt</span>
                  </button>
                  <button type="button" class="btn-select-status w-full px-3 py-2.5 rounded-xl text-left text-[12.5px] font-bold flex items-center gap-2 hover:bg-[#fffbeb] hover:text-[#795900] transition-colors cursor-pointer min-h-[40px] ${(task.status === 'done' || task.status === 'completed') ? 'bg-[#ccfbf1] text-[#0f766e]' : 'text-[#0f766e]'}" data-status="done">
                    <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>Đã hoàn thành</span>
                  </button>
                  <button type="button" class="btn-select-status w-full px-3 py-2.5 rounded-xl text-left text-[12.5px] font-bold flex items-center gap-2 hover:bg-[#fffbeb] hover:text-[#795900] transition-colors cursor-pointer min-h-[40px] ${task.status === 'paused' ? 'bg-[#f3e8ff] text-[#7e22ce]' : 'text-[#7e22ce]'}" data-status="paused">
                    <span class="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                    <span>Tạm dừng</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- 6. SUBTASKS / CHECKLIST (TASK CON CHUYÊN SÂU CHUẨN CÔNG THÁI HỌC) -->
            <div class="p-4 rounded-2xl bg-white border border-[#e2e8f0] flex flex-col gap-3.5 shadow-2xs" style="background-color: var(--card); border-color: var(--border);">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-xl bg-[#fffbeb] text-[#795900] border border-[#fef3c7] flex items-center justify-center font-bold">
                    <span class="material-symbols-outlined text-[19px]">account_tree</span>
                  </div>
                  <div>
                    <h3 class="text-[13.5px] font-bold text-[#0d1c2f] flex items-center gap-1.5" style="color: var(--text);">
                      <span id="drawerSubtaskCountText">Danh sách việc con (${task.subtasks ? task.subtasks.filter(s => s.completed || s.status === 'done').length : 0}/${task.subtasks ? task.subtasks.length : 0})</span>
                    </h3>
                    <p class="text-[11px] text-[#64748b]">Các đầu việc con cụ thể bên trong nhiệm vụ này</p>
                  </div>
                </div>
                <div class="text-right">
                  <span class="text-[13px] font-bold font-mono-data text-[#795900]" id="drawerSubtaskPctText">${task.progress || 0}%</span>
                  <span class="block text-[10px] text-[#817663] font-medium">Tiến độ</span>
                </div>
              </div>

              <!-- PROGRESS BAR -->
              <div class="w-full bg-[#e2e8f0] h-2 rounded-full overflow-hidden">
                <div class="bg-[#d6a52a] h-2 rounded-full transition-all duration-300" id="drawerSubtaskProgressBar" style="width: ${task.progress || 0}%"></div>
              </div>

              <!-- SUBTASK ITEMS LIST -->
              <div class="flex flex-col gap-2.5 mt-1">
                ${(!task.subtasks || task.subtasks.length === 0) ? `
                  <div class="text-[12.5px] text-[#64748b] italic py-3 px-4 text-center bg-[#f8f9ff] rounded-2xl border border-dashed border-[#e2e8f0]">
                    Chưa có việc con nào. Thêm việc con mới với đầy đủ mô tả, người phụ trách và hạn chót ở biểu mẫu bên dưới.
                  </div>
                ` : task.subtasks.map(s => {
                  const sAssignee = store.getUserById(s.assigneeId);
                  const isDone = s.completed || s.status === 'done';
                  return `
                    <div class="subtask-card p-3 sm:p-3.5 rounded-2xl border border-[#e2e8f0] bg-[#f8f9ff] flex flex-col gap-2.5 hover:border-[#d6a52a] hover:shadow-xs transition-all cursor-pointer" data-subtask-id="${s.id}">
                      <!-- Hàng 1: Checkbox, Mã việc con, Trạng thái & Nút thao tác (Sửa, Xóa) -->
                      <div class="flex items-center justify-between gap-2">
                        <div class="flex items-center gap-2 flex-wrap">
                          <input type="checkbox" class="chk-subtask w-4 h-4 rounded text-[#d6a52a] focus:ring-[#d6a52a] cursor-pointer shrink-0" data-subtask-id="${s.id}" ${isDone ? 'checked' : ''} />
                          <span class="font-mono-data text-[10.5px] font-bold px-2 py-0.5 rounded bg-[#fffbeb] text-[#795900] border border-[#fef3c7] shrink-0">${esc(s.id)}</span>
                          <span class="subtask-status-badge text-[10px] font-bold px-2.5 py-0.5 rounded-md shrink-0 ${isDone ? 'bg-teal-100 text-teal-800' : s.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}">
                            ${isDone ? 'Đã xong' : s.status === 'in_progress' ? 'Đang làm' : 'Chưa làm'}
                          </span>
                        </div>

                        <div class="flex items-center gap-1 shrink-0">
                          <button type="button" class="btn-toggle-edit-subtask p-1.5 text-[#817663] hover:text-[#795900] hover:bg-amber-100/60 rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer transition-colors" data-subtask-id="${s.id}" title="Sửa việc con này">
                            <span class="material-symbols-outlined text-[17px]">edit</span>
                          </button>
                          <button type="button" class="btn-delete-subtask p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer transition-colors" data-subtask-id="${s.id}" title="Xóa việc con này">
                            <span class="material-symbols-outlined text-[17px]">delete</span>
                          </button>
                        </div>
                      </div>

                      <!-- Hàng 2: Tiêu đề việc con chiếm toàn bộ chiều rộng, không bị cắt chữ (break-words) -->
                      <div class="subtask-title-text text-[13.5px] sm:text-[14px] font-bold text-[#0d1c2f] leading-snug break-words ${isDone ? 'line-through text-gray-400' : 'hover:text-[#795900]'} transition-colors">
                        ${esc(s.title || s.text)}
                      </div>

                      <!-- Hàng 3: Mô tả việc con (nếu có) -->
                      ${s.description ? `
                        <div class="text-[12px] text-[#4f4635] bg-white p-2.5 rounded-xl border border-[#e2e8f0] leading-relaxed break-words">
                          ${esc(s.description)}
                        </div>
                      ` : ''}

                      <!-- Hàng 4: Người phụ trách & Hạn chót -->
                      <div class="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#e2e8f0] text-[11.5px] text-[#64748b]">
                        <div class="flex items-center gap-1.5 min-w-0">
                          <img src="${sAssignee ? sAssignee.avatar : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80'}" class="w-4 h-4 rounded-full object-cover shrink-0 ring-1 ring-[#e2e8f0]" />
                          <span class="truncate">Phụ trách: <strong class="text-[#0d1c2f] font-semibold">${sAssignee ? esc(sAssignee.name) : 'Chưa giao'}</strong></span>
                        </div>
                        <div class="flex items-center gap-1 font-mono-data text-[#817663] shrink-0">
                          <span class="material-symbols-outlined text-[14px] text-[#795900]">event</span>
                          <span>Hạn: <strong class="text-[#0d1c2f]">${s.dueDate ? ngayVN(s.dueDate) : 'Chưa đặt'}</strong></span>
                        </div>
                      </div>

                      <!-- FORM CHỈNH SỬA VIỆC CON (INLINE EDIT FORM - MẶC ĐỊNH ẨN) -->
                      <div class="edit-subtask-form-box hidden p-3 mt-1 bg-white rounded-xl border border-[#d6a52a] flex flex-col gap-2.5 animate-fade-in shadow-xs" data-subtask-form-id="${esc(s.id)}">
                        <div class="text-[11.5px] font-bold text-[#795900] flex items-center gap-1">
                          <span class="material-symbols-outlined text-[16px]">edit_note</span>
                          <span>Chỉnh sửa việc con ${esc(s.id)}</span>
                        </div>
                        
                        <div>
                          <label class="block text-[11px] font-bold text-[#0d1c2f] mb-0.5">Tiêu đề việc con *</label>
                          <input type="text" class="edit-subtask-title w-full h-10 px-3 rounded-lg border border-[#cbd5e1] text-[13px] outline-none focus:border-[#d6a52a]" value="${esc(s.title || s.text)}" />
                        </div>

                        <div>
                          <label class="block text-[11px] font-bold text-[#0d1c2f] mb-0.5">Mô tả &amp; Tiêu chuẩn bàn giao</label>
                          <textarea class="edit-subtask-desc w-full p-2.5 rounded-lg border border-[#cbd5e1] text-[12.5px] outline-none focus:border-[#d6a52a]" rows="2" placeholder="Ghi chú yêu cầu kỹ thuật...">${esc(s.description || '')}</textarea>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label class="block text-[10.5px] font-bold text-[#0d1c2f] mb-0.5">Phân công</label>
                            <select class="edit-subtask-assignee w-full h-10 px-2.5 rounded-lg border border-[#cbd5e1] text-[12.5px] font-semibold outline-none focus:border-[#d6a52a]">
                              <option value="">-- Chưa giao --</option>
                              ${store.getAllUsers().map(u => `
                                <option value="${u.id}" ${u.id === s.assigneeId ? 'selected' : ''}>${esc(u.name)}</option>
                              `).join('')}
                            </select>
                          </div>

                          <div>
                            <label class="block text-[10.5px] font-bold text-[#0d1c2f] mb-0.5">Hạn chót</label>
                            <input type="date" class="edit-subtask-duedate w-full h-10 px-2.5 rounded-lg border border-[#cbd5e1] text-[12.5px] font-mono-data outline-none focus:border-[#d6a52a]" value="${s.dueDate ? s.dueDate.slice(0, 10) : ''}" />
                          </div>

                          <div>
                            <label class="block text-[10.5px] font-bold text-[#0d1c2f] mb-0.5">Trạng thái</label>
                            <select class="edit-subtask-status w-full h-10 px-2.5 rounded-lg border border-[#cbd5e1] text-[12.5px] font-bold outline-none focus:border-[#d6a52a]">
                              <option value="todo" ${s.status === 'todo' ? 'selected' : ''}>Chưa bắt đầu</option>
                              <option value="in_progress" ${s.status === 'in_progress' ? 'selected' : ''}>Đang thực hiện</option>
                              <option value="done" ${isDone ? 'selected' : ''}>Đã hoàn thành</option>
                            </select>
                          </div>
                        </div>

                        <div class="flex justify-end gap-2 pt-1">
                          <button type="button" class="btn-cancel-edit-subtask px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-[11.5px] font-semibold hover:bg-gray-100 min-h-[36px] cursor-pointer" data-subtask-id="${s.id}">Hủy</button>
                          <button type="button" class="btn-save-edit-subtask px-3.5 py-1.5 rounded-lg bg-[#d6a52a] text-[#533d00] hover:bg-[#795900] hover:text-white text-[11.5px] font-bold min-h-[36px] cursor-pointer" data-subtask-id="${s.id}">Lưu thay đổi</button>
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>

              <!-- FORM THÊM VIỆC CON MỚI CHUYÊN NGHIỆP -->
              <div class="p-3.5 sm:p-4 rounded-2xl border border-[#d6a52a]/40 bg-[#fffbeb]/50 flex flex-col gap-3 mt-1 shadow-2xs">
                <div class="flex items-center justify-between">
                  <span class="text-[12.5px] font-bold text-[#795900] flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-[18px]">add_circle</span>
                    <span>Thêm việc con mới (Đầy đủ thông tin task)</span>
                  </span>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#fef3c7] text-[#92400e]">Subtask</span>
                </div>

                <div>
                  <label class="block text-[11.5px] font-bold text-[#0d1c2f] mb-1">Tên việc con / mục tiêu cụ thể *</label>
                  <input type="text" id="inputNewSubtaskTitle" placeholder="Ví dụ: Đối soát số lô và hạn sử dụng 45 danh mục vaccine" class="w-full h-10 px-3 rounded-xl border border-[#e2e8f0] text-[13px] outline-none focus:border-[#d6a52a] bg-white text-[#0d1c2f] shadow-2xs" />
                </div>

                <div>
                  <label class="block text-[11.5px] font-bold text-[#0d1c2f] mb-1">Mô tả &amp; Tiêu chuẩn bàn giao (Tùy chọn)</label>
                  <textarea id="inputNewSubtaskDesc" rows="2" placeholder="Ghi chú chi tiết yêu cầu, thiết bị sử dụng, cách thức nghiệm thu..." class="w-full p-2.5 rounded-xl border border-[#e2e8f0] text-[12.5px] outline-none focus:border-[#d6a52a] bg-white text-[#0d1c2f] shadow-2xs"></textarea>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label class="block text-[11px] font-bold text-[#0d1c2f] mb-1">Phân công người làm</label>
                    <select id="selectNewSubtaskAssignee" class="w-full h-10 px-2.5 rounded-xl border border-[#e2e8f0] text-[12px] font-semibold text-[#0d1c2f] bg-white outline-none focus:border-[#d6a52a] cursor-pointer shadow-2xs">
                      <option value="${task.assigneeId}">Phụ trách: ${assignee ? esc(assignee.name) : 'Người làm chính'}</option>
                      ${store.getAllUsers().filter(u => u.id !== task.assigneeId).map(u => `
                        <option value="${u.id}">${esc(u.name)} (${esc(u.departmentCode || u.deptCode || 'CS3')})</option>
                      `).join('')}
                    </select>
                  </div>

                  <div>
                    <label class="block text-[11px] font-bold text-[#0d1c2f] mb-1">Hạn hoàn thành</label>
                    <input type="date" id="inputNewSubtaskDueDate" value="${task.dueDate ? task.dueDate.slice(0, 10) : ''}" class="w-full h-10 px-2.5 rounded-xl border border-[#e2e8f0] text-[12px] font-mono-data text-[#0d1c2f] bg-white outline-none focus:border-[#d6a52a] shadow-2xs cursor-pointer" />
                  </div>

                  <div>
                    <label class="block text-[11px] font-bold text-[#0d1c2f] mb-1">Trạng thái ban đầu</label>
                    <select id="selectNewSubtaskStatus" class="w-full h-10 px-2.5 rounded-xl border border-[#e2e8f0] text-[12px] font-bold text-[#0d1c2f] bg-white outline-none focus:border-[#d6a52a] cursor-pointer shadow-2xs">
                      <option value="todo">Chưa bắt đầu</option>
                      <option value="in_progress">Đang thực hiện</option>
                      <option value="done">Đã hoàn thành</option>
                    </select>
                  </div>
                </div>

                <div class="flex justify-end pt-1">
                  <button type="button" id="btnAddSubtask" class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#d6a52a] text-[#533d00] hover:bg-[#795900] hover:text-white font-bold text-[13px] transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]">
                    <span class="material-symbols-outlined text-[19px]">add_circle</span>
                    <span>Thêm Việc Con Mới</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- 7. COMMENTS & INTERNAL AUDIT LOGS (TĂNG CHIỀU CAO KHUNG NHẬP) -->
            <div class="pt-2 border-t border-[#f1f5f9] flex flex-col gap-3" style="border-color: var(--border);">
              <span class="text-[13px] font-bold text-[#0d1c2f] flex items-center gap-1.5" style="color: var(--text);">
                <span class="material-symbols-outlined text-[18px] text-[#795900]">chat</span>
                Trao đổi nội bộ &amp; Nhật ký duyệt (${task.comments ? task.comments.length : 0})
              </span>

              <div class="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                ${(!task.comments || task.comments.length === 0) ? `
                  <div class="text-[12px] text-[#64748b] italic p-3 bg-[#f8f9ff] rounded-xl border border-[#e2e8f0]">Chưa có trao đổi nào. Hãy để lại chỉ đạo hoặc ghi chú bên dưới.</div>
                ` : task.comments.map(c => {
                  const commentUser = store.getUserById(c.userId);
                  const cContent = c.content || c.text || '';
                  const isAudit = cContent.startsWith('[ĐÃ PHÊ DUYỆT') || cContent.startsWith('[TỪ CHỐI');
                  return `
                    <div class="p-3 rounded-xl ${isAudit ? 'bg-amber-50/70 border border-amber-200' : 'bg-[#f8f9ff] border border-[#e2e8f0]'} text-[12.5px]">
                      <div class="flex items-center justify-between mb-1">
                        <span class="font-bold text-[#0d1c2f]">${commentUser ? esc(commentUser.name) : 'Hệ thống'}</span>
                        <span class="text-[10.5px] text-[#64748b]">${timeAgo(c.createdAt || c.time)}</span>
                      </div>
                      <div class="${isAudit ? 'font-semibold text-amber-900' : 'text-[#4f4635]'} leading-relaxed">${esc(cContent)}</div>
                    </div>
                  `;
                }).join('')}
              </div>

              <!-- ADD COMMENT INPUT (LARGE TEXTAREA >= 90PX) -->
              <div class="flex flex-col gap-2">
                <textarea id="inputComment" rows="3" placeholder="Để lại chỉ đạo, phản hồi nghiệm thu hoặc ghi chú..." class="w-full min-h-[90px] p-3 rounded-xl border border-[#e2e8f0] text-[13px] outline-none focus:border-[#d6a52a] bg-[#f8f9ff] focus:bg-white text-[#0d1c2f] resize-y shadow-2xs"></textarea>
                <div class="flex justify-end">
                  <button type="button" class="px-5 py-2.5 rounded-xl bg-[#d6a52a] text-[#533d00] font-bold text-[13px] hover:bg-[#795900] hover:text-white transition-colors shadow-xs min-h-[44px] flex items-center gap-1.5 cursor-pointer" id="btnSendComment">
                    <span class="material-symbols-outlined text-[18px]">send</span>
                    <span>Gửi phản hồi</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- DRAWER FOOTER: PHÊ DUYỆT 1-CHẠM CHUẨN TOUCH TARGET >= 44PX -->
          <div class="p-4 sm:px-6 border-t border-[#e2e8f0] flex items-center justify-between shrink-0 bg-white gap-2.5" style="background-color: var(--card); border-color: var(--border);">
            ${isPendingApproval ? `
              ${canUserApproveThisTask ? `
                <!-- NÚT TỪ CHỐI -->
                <button type="button" class="px-4 py-2.5 rounded-xl border border-rose-300 text-rose-700 bg-rose-50/50 hover:bg-rose-100 font-bold text-[13px] min-h-[44px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs" id="btnRejectTask">
                  <span class="material-symbols-outlined text-[18px]">close</span>
                  <span>Từ Chối</span>
                </button>

                <!-- NÚT DUYỆT 1-CHẠM -->
                <button type="button" class="flex-1 py-2.5 rounded-xl font-bold text-[13px] min-h-[44px] flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer" style="background-color: var(--primary-container); color: var(--on-primary-container);" id="btnApproveTask">
                  <span class="material-symbols-outlined text-[19px]">verified</span>
                  <span>Phê Duyệt 1-Chạm</span>
                </button>
              ` : `
                <div class="text-[12.5px] text-amber-700 font-semibold flex items-center gap-1.5 py-1">
                  <span class="material-symbols-outlined text-[18px]">lock_clock</span>
                  <span>Đang chờ <strong>${approver ? esc(approver.name) : 'Người phê duyệt'}</strong> ký duyệt.</span>
                </div>
              `}
            ` : (task.status !== 'done' && task.status !== 'completed') ? `
              <button type="button" class="flex-1 py-2.5 rounded-xl bg-[#eff4ff] text-[#1d4ed8] font-bold text-[13px] hover:bg-[#dbeafe] flex items-center justify-center gap-1.5 transition-all min-h-[44px] cursor-pointer" id="btnMarkReview">
                <span class="material-symbols-outlined text-[18px]">send</span>
                <span>Gửi Trình Phê Duyệt 1-Chạm</span>
              </button>
            ` : `
              <div class="text-[12.5px] text-[#16a34a] font-bold flex items-center gap-1.5 py-1">
                <span class="material-symbols-outlined text-[19px]">check_circle</span>
                <span>Nhiệm vụ đã hoàn tất và được nghiệm thu đạt chuẩn.</span>
              </div>
            `}
          </div>
        </div>

        <!-- POPUP ĐỔI NGƯỜI PHỤ TRÁCH (CHỈ HIỂN THỊ THÀNH VIÊN TRONG PHÒNG BAN) -->
        <div id="drawerAssigneePickerModal" class="hidden fixed inset-0 z-[120] bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div class="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full p-4 sm:p-5 flex flex-col gap-3 shadow-2xl border border-[#cbd5e1] max-h-[82vh] overflow-hidden" style="background-color: var(--card); border-color: var(--border);">
            <div class="flex items-center justify-between pb-2 border-b border-[#f1f5f9]" style="border-color: var(--border);">
              <div>
                <h4 class="font-bold text-[15px] text-[#0d1c2f]" style="color: var(--text);">Chuyển Giao Người Phụ Trách</h4>
                <p class="text-[11.5px] text-[#64748b]">Nhân sự thuộc <strong class="text-[#0d1c2f]">${dept ? esc(dept.name) : 'Phòng ban'}</strong></p>
              </div>
              <button type="button" id="btnCloseDrawerAssigneeModal" class="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer">
                <span class="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <!-- Ô TÌM KIẾM NHANH NHÂN SỰ -->
            <div class="relative">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-gray-400">search</span>
              <input 
                type="text" 
                id="inputSearchDrawerAssignee" 
                placeholder="Tìm theo tên nhân viên hoặc chức danh..." 
                class="w-full h-11 pl-9 pr-3 rounded-xl border border-[#cbd5e1] text-[13px] outline-none focus:border-[#d6a52a] bg-[#f8f9ff] text-[#0d1c2f]" 
                style="color: var(--text); border-color: var(--border);"
              />
            </div>

            <!-- DANH SÁCH THẺ NHÂN VIÊN TRONG PHÒNG BAN (SCROLLABLE) -->
            <div id="drawerAssigneeMemberList" class="flex flex-col gap-1.5 overflow-y-auto max-h-72 pr-1">
              <!-- Rendered dynamically -->
            </div>
          </div>
        </div>

      </div>
    `;

    this.bindEvents(task, isPendingApproval, canUserApproveThisTask);

    const newBody = this.container.querySelector('#taskDrawerScrollBody');
    if (newBody && prevScrollTop > 0) {
      newBody.scrollTop = prevScrollTop;
      requestAnimationFrame(() => {
        if (newBody) newBody.scrollTop = prevScrollTop;
      });
    }
  }

  getStatusMeta(status) {
    const map = {
      'todo': { label: 'Chưa bắt đầu', bg: '#F1F5F9', text: '#475569' },
      'in_progress': { label: 'Đang thực hiện', bg: '#DBEAFE', text: '#1D4ED8' },
      'pending_approval': { label: 'Chờ phê duyệt', bg: '#FEF3C7', text: '#92400E' },
      'review': { label: 'Chờ phê duyệt', bg: '#FEF3C7', text: '#92400E' },
      'done': { label: 'Hoàn thành', bg: '#CCFBF1', text: '#0F766E' },
      'completed': { label: 'Hoàn thành', bg: '#CCFBF1', text: '#0F766E' },
      'paused': { label: 'Tạm dừng', bg: '#F3E8FF', text: '#7E22CE' },
      'overdue': { label: 'Quá hạn', bg: '#FEE2E2', text: '#B91C1C' }
    };
    return map[status] || { label: status, bg: '#F1F5F9', text: '#475569' };
  }

  bindEvents(task, isPendingApproval, canUserApproveThisTask) {
    const btnClose = this.container.querySelector('#btnCloseDrawer');
    if (btnClose) btnClose.addEventListener('click', () => this.close());

    const backdrop = this.container.querySelector('#drawerBackdrop');
    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) this.close();
      });
    }

    // QUẢN LÝ CHUYỂN GIAO ASSIGNEE TRONG TASK DRAWER
    const btnOpenPicker = this.container.querySelector('#btnOpenDrawerAssigneePicker');
    const pickerModal = this.container.querySelector('#drawerAssigneePickerModal');
    const btnClosePicker = this.container.querySelector('#btnCloseDrawerAssigneeModal');
    const inputSearch = this.container.querySelector('#inputSearchDrawerAssignee');
    const memberListContainer = this.container.querySelector('#drawerAssigneeMemberList');

    const renderDrawerMemberList = (searchQuery = '') => {
      if (!memberListContainer) return;
      const dept = store.getDepartmentById(task.departmentId);
      // CHỈ LẤY NHÂN SỰ THUỘC PHÒNG BAN CỦA TASK
      const members = store.getAllUsers().filter(u => u.departmentId === task.departmentId || u.departmentId === 'all');
      
      let filtered = members;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(u => 
          u.name.toLowerCase().includes(q) || 
          (u.title && u.title.toLowerCase().includes(q)) ||
          (u.badge && u.badge.toLowerCase().includes(q))
        );
      }

      if (filtered.length === 0) {
        memberListContainer.innerHTML = `
          <div class="p-6 text-center text-gray-400 text-[12.5px]">
            Không tìm thấy nhân sự phù hợp trong phòng ban này.
          </div>
        `;
        return;
      }

      const currentDeptTeams = dept ? (dept.teams || []) : [];

      memberListContainer.innerHTML = filtered.map(u => {
        const isSelected = u.id === task.assigneeId;
        const team = currentDeptTeams.find(t => t.id === u.teamId);
        return `
          <div 
            class="item-select-drawer-member flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer min-h-[48px] ${isSelected ? 'bg-amber-50/80 border-[#d6a52a] shadow-xs' : 'bg-white hover:bg-gray-50 border-[#e2e8f0]'}"
            data-user-id="${u.id}"
            style="background-color: ${isSelected ? 'var(--primary-soft)' : 'var(--card)'}; border-color: ${isSelected ? 'var(--primary)' : 'var(--border)'};"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div class="relative shrink-0">
                <img src="${u.avatar}" class="w-9 h-9 rounded-full object-cover ring-1 ring-gray-200" />
                <span class="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white"></span>
              </div>
              <div class="min-w-0 flex flex-col text-left">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-[13px] text-[#0d1c2f] truncate" style="color: var(--text);">${esc(u.name)}</span>
                  <span class="text-[10px] font-mono-data font-bold px-1.5 py-0.2 rounded bg-gray-100 text-gray-700">${esc(u.badge || u.role)}</span>
                </div>
                <div class="flex items-center gap-1.5 text-[11px] text-[#64748b] mt-0.5">
                  ${team ? `<span class="font-semibold text-amber-800">[${esc(team.code)}]</span>` : ''}
                  <span class="truncate">${esc(u.title || 'Chuyên viên')}</span>
                </div>
              </div>
            </div>

            <div class="shrink-0 pl-2">
              ${isSelected ? `
                <span class="material-symbols-outlined text-[20px]" style="color: var(--primary);">check_circle</span>
              ` : `
                <span class="material-symbols-outlined text-[20px] text-gray-300">radio_button_unchecked</span>
              `}
            </div>
          </div>
        `;
      }).join('');

      memberListContainer.querySelectorAll('.item-select-drawer-member').forEach(item => {
        item.addEventListener('click', () => {
          rung(10);
          const newAssigneeId = item.dataset.userId;
          if (newAssigneeId === task.assigneeId) {
            pickerModal.classList.add('hidden');
            return;
          }
          store.updateTaskAssignee(task.id, newAssigneeId);
          const newAssignee = store.getUserById(newAssigneeId);
          toast(`Đã chuyển giao nhiệm vụ cho ${newAssignee ? newAssignee.name : 'nhân sự mới'}!`, 'success');
          pickerModal.classList.add('hidden');
          if (this.onTaskUpdated) this.onTaskUpdated();
          this.render();
        });
      });
    };

    if (btnOpenPicker && pickerModal) {
      btnOpenPicker.addEventListener('click', () => {
        rung(10);
        if (inputSearch) inputSearch.value = '';
        renderDrawerMemberList();
        pickerModal.classList.remove('hidden');
        if (inputSearch) inputSearch.focus();
      });
    }

    if (btnClosePicker && pickerModal) {
      btnClosePicker.addEventListener('click', () => {
        pickerModal.classList.add('hidden');
      });
    }

    if (pickerModal) {
      pickerModal.addEventListener('click', (e) => {
        if (e.target === pickerModal) pickerModal.classList.add('hidden');
      });
    }

    if (inputSearch) {
      inputSearch.addEventListener('input', (e) => {
        renderDrawerMemberList(e.target.value);
      });
    }

    // CUSTOM STATUS DROPDOWN
    const btnCustomStatusToggle = this.container.querySelector('#btnCustomStatusToggle');
    const statusCustomMenu = this.container.querySelector('#statusCustomMenu');
    if (btnCustomStatusToggle && statusCustomMenu) {
      btnCustomStatusToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        rung(10);
        statusCustomMenu.classList.toggle('hidden');
      });

      this.container.querySelectorAll('.btn-select-status').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          rung(10);
          const newStatus = btn.dataset.status;
          statusCustomMenu.classList.add('hidden');
          store.updateTaskStatus(task.id, newStatus);
          const meta = this.getStatusMeta(newStatus);
          toast(`Đã cập nhật trạng thái: ${meta.label}`, 'success');
          if (this.onTaskUpdated) this.onTaskUpdated();
          this.render();
        });
      });

      // Đóng dropdown khi bấm ra ngoài
      document.addEventListener('click', (e) => {
        if (!statusCustomMenu.classList.contains('hidden') && !statusCustomMenu.contains(e.target) && e.target !== btnCustomStatusToggle) {
          statusCustomMenu.classList.add('hidden');
        }
      }, { once: true });
    }

    // CHECKBOX VIỆC CON (SUBTASKS) - In-place DOM update để không giật nhảy scroll
    this.container.querySelectorAll('.chk-subtask').forEach(chk => {
      chk.addEventListener('change', (e) => {
        e.stopPropagation();
        rung(10);
        const sid = chk.dataset.subtaskId;
        store.toggleSubtask(task.id, sid);

        const freshTask = store.getTaskById(task.id) || task;
        const sub = (freshTask.subtasks || []).find(x => x.id === sid);
        const isCompleted = sub ? (sub.completed || sub.status === 'done') : chk.checked;

        const card = chk.closest('.subtask-card');
        if (card) {
          const badge = card.querySelector('.subtask-status-badge');
          if (badge) {
            badge.className = `subtask-status-badge text-[10px] font-bold px-2.5 py-0.5 rounded-md shrink-0 ${isCompleted ? 'bg-teal-100 text-teal-800' : 'bg-gray-100 text-gray-700'}`;
            badge.textContent = isCompleted ? 'Đã xong' : 'Chưa làm';
          }
          const title = card.querySelector('.subtask-title-text');
          if (title) {
            if (isCompleted) {
              title.classList.add('line-through', 'text-gray-400');
              title.classList.remove('hover:text-[#795900]');
            } else {
              title.classList.remove('line-through', 'text-gray-400');
              title.classList.add('hover:text-[#795900]');
            }
          }
        }

        // Cập nhật progress bar & count ở header
        const totalSubs = (freshTask.subtasks || []).length;
        const doneSubs = (freshTask.subtasks || []).filter(s => s.completed || s.status === 'done').length;
        const countEl = this.container.querySelector('#drawerSubtaskCountText');
        if (countEl) countEl.textContent = `Danh sách việc con (${doneSubs}/${totalSubs})`;
        const pctEl = this.container.querySelector('#drawerSubtaskPctText');
        if (pctEl) pctEl.textContent = `${freshTask.progress || 0}%`;
        const barEl = this.container.querySelector('#drawerSubtaskProgressBar');
        if (barEl) barEl.style.width = `${freshTask.progress || 0}%`;

        if (this.onTaskUpdated) this.onTaskUpdated();
      });
    });

    // CHỈNH SỬA NHIỆM VỤ CHA
    const btnDrawerEditTask = this.container.querySelector('#btnDrawerEditTask');
    if (btnDrawerEditTask) {
      btnDrawerEditTask.addEventListener('click', () => {
        rung(10);
        if (this.onEditTask) {
          this.onEditTask(task);
        }
      });
    }

    // XÓA NHIỆM VỤ CHA
    const btnDrawerDeleteTask = this.container.querySelector('#btnDrawerDeleteTask');
    if (btnDrawerDeleteTask) {
      btnDrawerDeleteTask.addEventListener('click', () => {
        xacNhan2Lan(
          'del_task_drawer_' + task.id,
          `Xóa công việc "${task.title}" (${task.id})`,
          () => {
            store.deleteTask(task.id);
            toast('Đã xóa công việc thành công!', 'success');
            this.close();
            if (this.onTaskUpdated) this.onTaskUpdated();
          }
        );
      });
    }

    // XEM ĐẦY ĐỦ CHI TIẾT VIỆC CON BẰNG CÁCH BẤM VÀO THẺ (BỎ ICON OPEN_IN_NEW)
    this.container.querySelectorAll('.subtask-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // Không kích hoạt khi bấm vào checkbox, nút bấm hoặc trong form sửa
        if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select') || e.target.closest('textarea') || e.target.closest('.edit-subtask-form-box')) {
          return;
        }
        rung(10);
        const sid = card.dataset.subtaskId;
        if (this.onOpenSubtaskDetail) {
          this.onOpenSubtaskDetail(task.id, sid);
        }
      });
    });

    // MỞ / ĐÓNG FORM SỬA VIỆC CON (AN TOÀN SELECTOR CÓ DẤU CHẤM)
    this.container.querySelectorAll('.btn-toggle-edit-subtask').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        rung(10);
        const sid = btn.dataset.subtaskId;
        const form = Array.from(this.container.querySelectorAll('.edit-subtask-form-box')).find(f => f.dataset.subtaskFormId === sid);
        if (form) form.classList.toggle('hidden');
      });
    });

    // HỦY SỬA VIỆC CON
    this.container.querySelectorAll('.btn-cancel-edit-subtask').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sid = btn.dataset.subtaskId;
        const form = Array.from(this.container.querySelectorAll('.edit-subtask-form-box')).find(f => f.dataset.subtaskFormId === sid);
        if (form) form.classList.add('hidden');
      });
    });

    // LƯU SỬA VIỆC CON
    this.container.querySelectorAll('.btn-save-edit-subtask').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        rung(10);
        const sid = btn.dataset.subtaskId;
        const form = Array.from(this.container.querySelectorAll('.edit-subtask-form-box')).find(f => f.dataset.subtaskFormId === sid);
        if (!form) return;

        const title = form.querySelector('.edit-subtask-title')?.value.trim();
        if (!title) {
          toast('Vui lòng nhập tiêu đề việc con', 'warning');
          return;
        }

        const description = form.querySelector('.edit-subtask-desc')?.value.trim() || '';
        const assigneeId = form.querySelector('.edit-subtask-assignee')?.value || '';
        const dueDate = form.querySelector('.edit-subtask-duedate')?.value || '';
        const status = form.querySelector('.edit-subtask-status')?.value || 'todo';

        store.updateSubtask(task.id, sid, {
          title,
          description,
          assigneeId,
          dueDate,
          status
        });

        toast('Đã cập nhật việc con thành công!', 'success');
        if (this.onTaskUpdated) this.onTaskUpdated();
        this.render();
      });
    });

    // XÓA VIỆC CON (POPUP XÁC NHẬN CHUẨN SHIN)
    this.container.querySelectorAll('.btn-delete-subtask').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sid = btn.dataset.subtaskId;
        const subtask = (task.subtasks || []).find(s => s.id === sid);
        const stTitle = subtask ? subtask.title : 'việc con này';
        xacNhanXoa(
          'Xóa Việc Con',
          `Bạn có chắc chắn muốn xóa "${stTitle}" không? Hành động này sẽ không thể hoàn tác.`,
          () => {
            store.deleteSubtask(task.id, sid);
            toast('Đã xóa việc con thành công!', 'info');
            if (this.onTaskUpdated) this.onTaskUpdated();
            this.render();
          }
        );
      });
    });

    // THÊM VIỆC CON MỚI (ĐẦY ĐỦ CÁC TRƯỜNG THÔNG TIN)
    const btnAddSubtask = this.container.querySelector('#btnAddSubtask');
    const inputNewSubtaskTitle = this.container.querySelector('#inputNewSubtaskTitle');
    const inputNewSubtaskDesc = this.container.querySelector('#inputNewSubtaskDesc');
    const selectNewSubtaskAssignee = this.container.querySelector('#selectNewSubtaskAssignee');
    const inputNewSubtaskDueDate = this.container.querySelector('#inputNewSubtaskDueDate');
    const selectNewSubtaskStatus = this.container.querySelector('#selectNewSubtaskStatus');

    if (btnAddSubtask && inputNewSubtaskTitle) {
      const doAddSubtask = () => {
        const title = inputNewSubtaskTitle.value.trim();
        if (!title) {
          toast('Vui lòng nhập tên việc con', 'warning');
          return;
        }
        rung(10);
        const description = inputNewSubtaskDesc ? inputNewSubtaskDesc.value.trim() : '';
        const assigneeId = selectNewSubtaskAssignee ? selectNewSubtaskAssignee.value : task.assigneeId;
        const dueDate = inputNewSubtaskDueDate ? inputNewSubtaskDueDate.value : '';
        const status = selectNewSubtaskStatus ? selectNewSubtaskStatus.value : 'todo';

        store.addSubtask(task.id, {
          title,
          description,
          assigneeId,
          dueDate,
          status
        });

        inputNewSubtaskTitle.value = '';
        if (inputNewSubtaskDesc) inputNewSubtaskDesc.value = '';

        toast('Đã thêm việc con mới thành công!', 'success');
        if (this.onTaskUpdated) this.onTaskUpdated();
        this.render();
      };

      btnAddSubtask.addEventListener('click', doAddSubtask);
      inputNewSubtaskTitle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          doAddSubtask();
        }
      });
    }

    // BÌNH LUẬN & CHỈ ĐẠO
    const btnSend = this.container.querySelector('#btnSendComment');
    const inputComment = this.container.querySelector('#inputComment');
    if (btnSend && inputComment) {
      const submitComment = () => {
        rung(10);
        const text = inputComment.value.trim();
        if (text) {
          store.addComment(task.id, text);
          inputComment.value = '';
          toast('Đã gửi phản hồi thành công!', 'success');
          this.render();
        }
      };
      btnSend.addEventListener('click', submitComment);
    }

    // NÚT PHÊ DUYỆT 1-CHẠM
    const btnApprove = this.container.querySelector('#btnApproveTask');
    if (btnApprove) {
      btnApprove.addEventListener('click', () => {
        rung(15);
        store.approveTask(task.id);
        toast('Đã phê duyệt nghiệm thu công việc 1-chạm thành công!', 'success');
        if (this.onTaskUpdated) this.onTaskUpdated();
        this.render();
      });
    }

    // NÚT TỪ CHỐI KÈM LÝ DO (POPUP XÁC NHẬN CHUẨN SHIN AIOS)
    const btnReject = this.container.querySelector('#btnRejectTask');
    if (btnReject) {
      btnReject.addEventListener('click', () => {
        popupTuChoiPheDuyet({
          tieuDe: 'Yêu Cầu Làm Lại Nhiệm Vụ',
          tenDoiTuong: `${task.id} - ${task.title}`,
          defaultReason: '',
          onConfirm: (reason) => {
            store.rejectTask(task.id, reason);
            toast('Đã gửi yêu cầu làm lại và chuyển trả công việc về người thực hiện!', 'warning');
            if (this.onTaskUpdated) this.onTaskUpdated();
            this.render();
          }
        });
      });
    }

    // NÚT GỬI TRÌNH DUYỆT
    const btnMarkReview = this.container.querySelector('#btnMarkReview');
    if (btnMarkReview) {
      btnMarkReview.addEventListener('click', () => {
        rung(10);
        store.updateTaskStatus(task.id, 'pending_approval');
        toast('Đã gửi công việc lên hàng chờ phê duyệt 1-chạm!', 'info');
        if (this.onTaskUpdated) this.onTaskUpdated();
        this.render();
      });
    }
  }
}



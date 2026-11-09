/**
 * THANH VŨ MEDIC CS3 - TASK DETAIL SLIDE-OVER DRAWER COMPONENT
 * Ngăn trượt chi tiết công việc từ bên phải phong cách Linear / Notion chuẩn Google Stitch
 * Chuẩn màu Vàng Hoàng Kim Gold #D6A52A / #795900, Badges theo quy chuẩn 6 màu
 * Hỗ trợ Cơ chế Phê Duyệt 1-Chạm (Duyệt ngay / Từ chối kèm lý do) & Touch Target >= 44px
 */

import { auth } from '../auth.js';
import { store } from '../store.js';
import { esc, soVN, ngayVN, toast, timeAgo, rung } from '../helpers.js';

export class TaskDrawer {
  constructor(containerId, onTaskUpdated) {
    this.container = document.getElementById(containerId);
    this.onTaskUpdated = onTaskUpdated;
    this.currentTaskId = null;
  }

  open(taskId) {
    rung(10);
    this.currentTaskId = taskId;
    this.render();
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

    const currentUser = auth.getCurrentUser();
    const assignee = store.getUserById(task.assigneeId);
    const creator = store.getUserById(task.creatorId);
    const approver = store.getUserById(task.approverId);
    const dept = store.getDepartmentById(task.departmentId);
    const team = (dept?.teams || []).find(t => t.id === task.teamId);

    const isPendingApproval = task.status === 'pending_approval' || task.status === 'review';
    
    // Phân quyền phê duyệt: Người duyệt chỉ định, Admin, Lãnh đạo hoặc Trưởng phòng cùng khoa
    const canUserApproveThisTask = auth.isAdmin() || 
      auth.isLeadership() || 
      (task.approverId && task.approverId === currentUser.id) ||
      (auth.isManager() && currentUser.departmentId === task.departmentId);

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

            <div class="flex items-center gap-2">
              <button type="button" class="p-2 rounded-xl text-[#64748b] hover:text-[#0d1c2f] hover:bg-gray-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer" id="btnCloseDrawer" aria-label="Đóng">
                <span class="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>
          </div>

          <!-- DRAWER SCROLLABLE BODY -->
          <div class="p-5 sm:p-6 flex-1 overflow-y-auto flex flex-col gap-4 sm:gap-5">
            
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

            <!-- 3. KHU VỰC PHÂN CÔNG NGƯỜI THỰC HIỆN (ASSIGNEE) -->
            <div class="p-4 rounded-2xl border border-[#e2e8f0] flex flex-col gap-2.5 shadow-2xs" style="background-color: var(--primary-soft); border-color: var(--border);">
              <div class="flex items-center justify-between">
                <span class="text-[12px] font-bold flex items-center gap-1.5" style="color: var(--primary);">
                  <span class="material-symbols-outlined text-[18px]">person_check</span>
                  <span>Người thực hiện (Assignee)</span>
                </span>
                <span class="text-[10.5px] font-semibold text-[#817663]">Đổi người phụ trách tại đây</span>
              </div>

              <div class="flex items-center gap-3">
                <img src="${assignee ? assignee.avatar : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80'}" id="drawerAssigneeAvatar" class="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-white shadow-xs" />
                
                <div class="flex-1 min-w-0">
                  <select id="selectTaskAssignee" class="w-full h-11 px-3 rounded-xl border border-[#e2e8f0] text-[13px] font-bold text-[#0d1c2f] bg-white outline-none focus:border-[#d6a52a] cursor-pointer shadow-2xs">
                    ${store.getAllDepartments().map(d => {
                      const dUsers = store.getAllUsers().filter(u => u.departmentId === d.id || u.departmentId === 'all');
                      if (dUsers.length === 0) return '';
                      return `
                        <optgroup label="${esc(d.name)} (${esc(d.code)})">
                          ${dUsers.map(u => {
                            const uTeam = (d.teams || []).find(t => t.id === u.teamId);
                            const teamLabel = uTeam ? `[${uTeam.code}] ` : '';
                            return `<option value="${u.id}" ${u.id === task.assigneeId ? 'selected' : ''}>${teamLabel}${esc(u.name)} (${esc(u.title)})</option>`;
                          }).join('')}
                        </optgroup>
                      `;
                    }).join('')}
                  </select>
                </div>
              </div>

              <div class="text-[11px] text-[#64748b] flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span>Người giao việc: <strong>${creator ? esc(creator.name) : 'Ban Giám Đốc'}</strong></span>
                <span class="text-amber-700 font-semibold flex items-center gap-1">
                  <span class="material-symbols-outlined text-[14px]">notifications_active</span>
                  <span>Tự động gửi chuông thông báo khi đổi người</span>
                </span>
              </div>
            </div>

            <!-- 4. METADATA GRID -->
            <div class="grid grid-cols-2 gap-3.5 p-4 rounded-2xl bg-white border border-[#e2e8f0]" style="background-color: var(--card); border-color: var(--border);">
              <div>
                <span class="text-[11px] text-[#64748b] font-medium uppercase tracking-wider">Hạn hoàn thành</span>
                <div class="text-[13px] font-bold text-[#0d1c2f] font-mono-data mt-1 flex items-center gap-1" style="color: var(--text);">
                  <span class="material-symbols-outlined text-[16px] text-[#795900]">event</span>
                  ${ngayVN(task.dueDate)}
                </div>
              </div>

              <div>
                <span class="text-[11px] text-[#64748b] font-medium uppercase tracking-wider">Dự toán kinh phí</span>
                <div class="text-[13px] font-bold text-[#0d1c2f] font-mono-data mt-1" style="color: var(--text);">
                  ${soVN(task.cost)} đ
                </div>
              </div>
            </div>

            <!-- 5. STATUS SELECTOR -->
            <div class="p-4 rounded-2xl bg-[#f8f9ff] border border-[#e2e8f0] flex items-center justify-between" style="background-color: var(--background); border-color: var(--border);">
              <div>
                <span class="text-[11px] text-[#64748b] font-bold uppercase tracking-wider">Trạng thái hiện tại</span>
                <div class="text-[13px] font-bold mt-0.5" style="color: ${statusMeta.text};">
                  ${statusMeta.label}
                </div>
              </div>

              <select id="selectTaskStatus" class="h-10 px-3 rounded-xl bg-white border border-[#e2e8f0] text-[12.5px] font-bold text-[#0d1c2f] focus:border-[#d6a52a] outline-none cursor-pointer">
                <option value="todo" ${task.status === 'todo' ? 'selected' : ''}>Chưa bắt đầu</option>
                <option value="in_progress" ${task.status === 'in_progress' ? 'selected' : ''}>Đang thực hiện</option>
                <option value="pending_approval" ${task.status === 'pending_approval' || task.status === 'review' ? 'selected' : ''}>Chờ phê duyệt</option>
                <option value="done" ${task.status === 'done' ? 'selected' : ''}>Đã hoàn thành</option>
              </select>
            </div>

            <!-- 6. SUBTASKS / CHECKLIST -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-[13px] font-bold text-[#0d1c2f] flex items-center gap-1.5" style="color: var(--text);">
                  <span class="material-symbols-outlined text-[18px] text-[#795900]">checklist_rtl</span>
                  Danh sách việc con (${task.subtasks ? task.subtasks.filter(s => s.completed).length : 0}/${task.subtasks ? task.subtasks.length : 0})
                </span>
                <span class="text-[11.5px] font-bold font-mono-data text-[#795900]">${task.progress || 0}%</span>
              </div>

              <div class="w-full bg-[#e2e8f0] h-2 rounded-full mb-3 overflow-hidden">
                <div class="bg-[#d6a52a] h-2 rounded-full transition-all" style="width: ${task.progress || 0}%"></div>
              </div>

              <div class="flex flex-col gap-2">
                ${(!task.subtasks || task.subtasks.length === 0) ? `
                  <div class="text-[12px] text-[#64748b] italic py-1">Không có checklist việc con nào.</div>
                ` : task.subtasks.map(s => `
                  <label class="flex items-center gap-2.5 p-2 rounded-xl hover:bg-[#fffbeb]/40 cursor-pointer transition-colors text-[13px] ${s.completed ? 'line-through text-[#64748b]' : 'text-[#0d1c2f] font-medium'}">
                    <input type="checkbox" class="chk-subtask w-4 h-4 rounded text-[#d6a52a] focus:ring-[#d6a52a]" data-subtask-id="${s.id}" ${s.completed ? 'checked' : ''} />
                    <span>${esc(s.title || s.text)}</span>
                  </label>
                `).join('')}
              </div>
            </div>

            <!-- 7. COMMENTS & INTERNAL AUDIT LOGS -->
            <div class="pt-2 border-t border-[#f1f5f9]" style="border-color: var(--border);">
              <span class="text-[13px] font-bold text-[#0d1c2f] flex items-center gap-1.5 mb-2.5" style="color: var(--text);">
                <span class="material-symbols-outlined text-[18px] text-[#795900]">chat</span>
                Trao đổi nội bộ &amp; Nhật ký duyệt (${task.comments ? task.comments.length : 0})
              </span>

              <div class="flex flex-col gap-2 mb-3">
                ${(!task.comments || task.comments.length === 0) ? `
                  <div class="text-[12px] text-[#64748b] italic">Chưa có trao đổi nào. Hãy để lại lời nhắn bên dưới.</div>
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
                      <div class="${isAudit ? 'font-semibold text-amber-900' : 'text-[#4f4635]'}">${esc(cContent)}</div>
                    </div>
                  `;
                }).join('')}
              </div>

              <!-- ADD COMMENT INPUT -->
              <div class="flex gap-2">
                <input type="text" id="inputComment" placeholder="Để lại chỉ đạo hoặc ghi chú..." class="flex-1 h-10 px-3 rounded-xl border border-[#e2e8f0] text-[13px] outline-none focus:border-[#d6a52a] bg-[#f8f9ff] focus:bg-white text-[#0d1c2f]" />
                <button type="button" class="px-4 py-2 rounded-xl bg-[#d6a52a] text-[#533d00] font-bold text-[12.5px] hover:bg-[#795900] hover:text-white transition-colors shadow-xs min-h-[40px] cursor-pointer" id="btnSendComment">Gửi</button>
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
                  <span>✕ Từ Chối</span>
                </button>

                <!-- NÚT DUYỆT 1-CHẠM -->
                <button type="button" class="flex-1 py-2.5 rounded-xl font-bold text-[13px] min-h-[44px] flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer" style="background-color: var(--primary-container); color: var(--on-primary-container);" id="btnApproveTask">
                  <span class="material-symbols-outlined text-[19px]">verified</span>
                  <span>✓ Phê Duyệt 1-Chạm</span>
                </button>
              ` : `
                <div class="text-[12.5px] text-amber-700 font-semibold flex items-center gap-1.5 py-1">
                  <span class="material-symbols-outlined text-[18px]">lock_clock</span>
                  <span>Đang chờ <strong>${approver ? esc(approver.name) : 'Người phê duyệt'}</strong> ký duyệt.</span>
                </div>
              `}
            ` : task.status !== 'done' ? `
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
      </div>
    `;

    this.bindEvents(task, isPendingApproval, canUserApproveThisTask);
  }

  getStatusMeta(status) {
    const map = {
      'todo': { label: 'Chưa bắt đầu', bg: '#F1F5F9', text: '#475569' },
      'in_progress': { label: 'Đang thực hiện', bg: '#DBEAFE', text: '#1D4ED8' },
      'pending_approval': { label: 'Chờ phê duyệt', bg: '#FEF3C7', text: '#92400E' },
      'review': { label: 'Chờ phê duyệt', bg: '#FEF3C7', text: '#92400E' },
      'done': { label: 'Hoàn thành', bg: '#CCFBF1', text: '#0F766E' },
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

    const selectAssignee = this.container.querySelector('#selectTaskAssignee');
    if (selectAssignee) {
      selectAssignee.addEventListener('change', (e) => {
        rung(10);
        const newAssigneeId = e.target.value;
        store.updateTaskAssignee(task.id, newAssigneeId);
        const newAssignee = store.getUserById(newAssigneeId);
        toast(`Đã phân công lại cho: ${newAssignee ? newAssignee.name : 'nhân sự mới'}!`, 'success');
        if (this.onTaskUpdated) this.onTaskUpdated();
        this.render();
      });
    }

    const selectStatus = this.container.querySelector('#selectTaskStatus');
    if (selectStatus) {
      selectStatus.addEventListener('change', (e) => {
        rung(10);
        store.updateTaskStatus(task.id, e.target.value);
        toast(`Đã cập nhật trạng thái: ${e.target.value}`, 'success');
        if (this.onTaskUpdated) this.onTaskUpdated();
        this.render();
      });
    }

    this.container.querySelectorAll('.chk-subtask').forEach(chk => {
      chk.addEventListener('change', () => {
        rung(10);
        const sid = chk.dataset.subtaskId;
        store.toggleSubtask(task.id, sid);
        if (this.onTaskUpdated) this.onTaskUpdated();
        this.render();
      });
    });

    const btnSend = this.container.querySelector('#btnSendComment');
    const inputComment = this.container.querySelector('#inputComment');
    if (btnSend && inputComment) {
      const submitComment = () => {
        rung(10);
        const text = inputComment.value.trim();
        if (text) {
          store.addComment(task.id, text);
          inputComment.value = '';
          this.render();
        }
      };
      btnSend.addEventListener('click', submitComment);
      inputComment.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') submitComment();
      });
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

    // NÚT TỪ CHỐI KÈM LÝ DO
    const btnReject = this.container.querySelector('#btnRejectTask');
    if (btnReject) {
      btnReject.addEventListener('click', () => {
        rung(15);
        const reason = prompt('Vui lòng nhập lý do từ chối phê duyệt:', 'Cần rà soát lại các mốc nghiệm thu kỹ thuật');
        if (reason !== null && reason.trim()) {
          store.rejectTask(task.id, reason.trim());
          toast('Đã từ chối phê duyệt và chuyển trả công việc về người thực hiện!', 'warning');
          if (this.onTaskUpdated) this.onTaskUpdated();
          this.render();
        }
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

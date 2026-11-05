/**
 * THANH VŨ MEDIC CS3 - TASK DETAIL SLIDE-OVER DRAWER COMPONENT
 * Ngăn trượt chi tiết công việc từ bên phải phong cách Linear / Notion chuẩn Stitch
 */

import { auth } from '../auth.js';
import { store } from '../store.js';
import { esc, soVN, ngayVN, toast, timeAgo } from '../helpers.js';

export class TaskDrawer {
  constructor(containerId, onTaskUpdated) {
    this.container = document.getElementById(containerId);
    this.onTaskUpdated = onTaskUpdated;
    this.currentTaskId = null;
  }

  open(taskId) {
    this.currentTaskId = taskId;
    this.render();
  }

  close() {
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

    const assignee = store.getUserById(task.assigneeId);
    const creator = store.getUserById(task.creatorId);
    const canApprove = auth.canApproveTask();
    const canEdit = auth.isAdmin() || auth.isManager() || task.assigneeId === auth.getCurrentUser().id;

    this.container.innerHTML = `
      <div class="drawer-backdrop fixed inset-0 z-50 bg-black/35 backdrop-blur-xs flex justify-end active" id="drawerBackdrop">
        <div class="drawer-panel w-full max-w-xl h-full bg-white shadow-2xl flex flex-col justify-between overflow-hidden border-l border-[#e2e8f0]">
          <!-- DRAWER HEADER -->
          <div class="h-16 px-6 border-b border-[#e2e8f0] flex items-center justify-between shrink-0 bg-[#f8f9ff]">
            <div class="flex items-center gap-3">
              <span class="font-mono-data text-[13px] font-bold px-2.5 py-1 rounded-md bg-[#fffbeb] border border-[#fef3c7] text-[#795900]">
                ${task.id}
              </span>
              <span class="text-[11px] font-bold px-2 py-0.5 rounded-full ${task.priority === 'P1' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'}">
                ${task.priority} • ${task.priority === 'P1' ? 'Khẩn cấp' : 'Quan trọng'}
              </span>
            </div>

            <div class="flex items-center gap-2">
              <button type="button" class="p-1.5 rounded-lg text-[#817663] hover:text-[#0d1c2f] hover:bg-gray-100 transition-colors" id="btnCloseDrawer">
                <span class="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>
          </div>

          <!-- DRAWER SCROLLABLE BODY -->
          <div class="p-6 flex-1 overflow-y-auto flex flex-col gap-5">
            <!-- TITLE & DESCRIPTION -->
            <div>
              <h2 class="text-[18px] font-bold text-[#0d1c2f] leading-snug">${esc(task.title)}</h2>
              <p class="text-[13.5px] text-[#4f4635] mt-2 leading-relaxed bg-[#f8f9ff] p-3.5 rounded-xl border border-[#e2e8f0]">
                ${esc(task.description || 'Chưa có mô tả chi tiết.')}
              </p>
            </div>

            <!-- METADATA GRID -->
            <div class="grid grid-cols-2 gap-3.5 p-4 rounded-xl bg-white border border-[#e2e8f0]">
              <div>
                <span class="text-[11px] text-[#64748b] font-medium uppercase tracking-wider">Người thực hiện</span>
                <div class="flex items-center gap-2 mt-1">
                  <img src="${assignee ? assignee.avatar : ''}" class="w-6 h-6 rounded-full object-cover" />
                  <span class="text-[13px] font-bold text-[#0d1c2f]">${assignee ? assignee.name : 'Chưa giao'}</span>
                </div>
              </div>

              <div>
                <span class="text-[11px] text-[#64748b] font-medium uppercase tracking-wider">Người giao việc</span>
                <div class="flex items-center gap-2 mt-1">
                  <img src="${creator ? creator.avatar : ''}" class="w-6 h-6 rounded-full object-cover" />
                  <span class="text-[13px] font-bold text-[#0d1c2f]">${creator ? creator.name : 'Ban Giám Đốc'}</span>
                </div>
              </div>

              <div>
                <span class="text-[11px] text-[#64748b] font-medium uppercase tracking-wider">Hạn hoàn thành</span>
                <div class="text-[13px] font-bold text-[#0d1c2f] font-mono-data mt-1 flex items-center gap-1">
                  <span class="material-symbols-outlined text-[16px] text-[#795900]">event</span>
                  ${ngayVN(task.dueDate)}
                </div>
              </div>

              <div>
                <span class="text-[11px] text-[#64748b] font-medium uppercase tracking-wider">Dự toán kinh phí</span>
                <div class="text-[13px] font-bold text-[#0d1c2f] font-mono-data mt-1">
                  ${soVN(task.cost)} đ
                </div>
              </div>
            </div>

            <!-- STATUS SELECTOR -->
            <div class="p-4 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] flex items-center justify-between">
              <div>
                <span class="text-[11px] text-[#64748b] font-bold uppercase tracking-wider">Trạng thái hiện tại</span>
                <div class="text-[13px] font-bold text-[#0d1c2f] mt-0.5">
                  ${task.status === 'todo' ? 'Chưa bắt đầu' : task.status === 'in_progress' ? 'Đang thực hiện' : task.status === 'review' ? 'Chờ phê duyệt' : 'Đã hoàn thành'}
                </div>
              </div>

              <select id="selectTaskStatus" class="h-9 px-3 rounded-lg bg-white border border-[#e2e8f0] text-[12.5px] font-bold text-[#0d1c2f] focus:border-[#d6a52a] outline-none">
                <option value="todo" ${task.status === 'todo' ? 'selected' : ''}>Chưa bắt đầu</option>
                <option value="in_progress" ${task.status === 'in_progress' ? 'selected' : ''}>Đang thực hiện</option>
                <option value="review" ${task.status === 'review' ? 'selected' : ''}>Chờ phê duyệt</option>
                <option value="done" ${task.status === 'done' ? 'selected' : ''}>Đã hoàn thành</option>
              </select>
            </div>

            <!-- SUBTASKS / CHECKLIST -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-[13px] font-bold text-[#0d1c2f] flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[18px] text-[#795900]">checklist_rtl</span>
                  Danh sách việc con (${task.subtasks ? task.subtasks.filter(s => s.completed).length : 0}/${task.subtasks ? task.subtasks.length : 0})
                </span>
                <span class="text-[11px] font-bold font-mono-data text-[#795900]">${task.progress || 0}%</span>
              </div>

              <div class="w-full bg-gray-100 h-1.5 rounded-full mb-3 overflow-hidden">
                <div class="bg-[#d6a52a] h-1.5 rounded-full transition-all" style="width: ${task.progress || 0}%"></div>
              </div>

              <div class="flex flex-col gap-2">
                ${(!task.subtasks || task.subtasks.length === 0) ? `
                  <div class="text-[12px] text-[#64748b] italic py-1">Không có checklist việc con nào.</div>
                ` : task.subtasks.map(s => `
                  <label class="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#f8f9ff] cursor-pointer transition-colors text-[13px] ${s.completed ? 'line-through text-[#64748b]' : 'text-[#0d1c2f] font-medium'}">
                    <input type="checkbox" class="chk-subtask w-4 h-4 rounded text-[#d6a52a] focus:ring-[#d6a52a]" data-subtask-id="${s.id}" ${s.completed ? 'checked' : ''} />
                    <span>${esc(s.title)}</span>
                  </label>
                `).join('')}
              </div>
            </div>

            <!-- COMMENTS & INTERNAL LOGS -->
            <div class="pt-2 border-t border-[#f1f5f9]">
              <span class="text-[13px] font-bold text-[#0d1c2f] flex items-center gap-1.5 mb-2.5">
                <span class="material-symbols-outlined text-[18px] text-[#795900]">chat</span>
                Trao đổi nội bộ (${task.comments ? task.comments.length : 0})
              </span>

              <div class="flex flex-col gap-2 mb-3">
                ${(!task.comments || task.comments.length === 0) ? `
                  <div class="text-[12px] text-[#64748b] italic">Chưa có trao đổi nào. Hãy để lại lời nhắn bên dưới.</div>
                ` : task.comments.map(c => {
                  const commentUser = store.getUserById(c.userId);
                  return `
                    <div class="p-3 rounded-lg bg-[#f8f9ff] border border-[#e2e8f0] text-[12.5px]">
                      <div class="flex items-center justify-between mb-1">
                        <span class="font-bold text-[#0d1c2f]">${commentUser ? commentUser.name : 'Nhân sự'}</span>
                        <span class="text-[10.5px] text-[#64748b]">${timeAgo(c.createdAt)}</span>
                      </div>
                      <div class="text-[#4f4635]">${esc(c.content)}</div>
                    </div>
                  `;
                }).join('')}
              </div>

              <!-- ADD COMMENT INPUT -->
              <div class="flex gap-2">
                <input type="text" id="inputComment" placeholder="Để lại chỉ đạo hoặc ghi chú..." class="flex-1 h-9 px-3 rounded-lg border border-[#e2e8f0] text-[12.5px] outline-none focus:border-[#d6a52a]" />
                <button type="button" class="px-3.5 py-1.5 rounded-lg bg-[#d6a52a] text-[#533d00] font-bold text-[12px] hover:bg-[#795900] hover:text-white transition-colors" id="btnSendComment">Gửi</button>
              </div>
            </div>
          </div>

          <!-- DRAWER FOOTER: PHÊ DUYỆT 1-CHẠM & HÀNH ĐỘNG -->
          <div class="h-16 px-6 border-t border-[#e2e8f0] flex items-center justify-between shrink-0 bg-white">
            ${canApprove && task.status === 'review' ? `
              <button type="button" class="flex-1 py-2 rounded-lg bg-[#d6a52a] text-[#533d00] font-bold text-[13px] hover:bg-[#795900] hover:text-white shadow-xs flex items-center justify-center gap-1.5 transition-all" id="btnApproveTask">
                <span class="material-symbols-outlined text-[18px]">verified</span>
                <span>Ký Duyệt Nghiệm Thu 1-Chạm</span>
              </button>
            ` : task.status !== 'done' ? `
              <button type="button" class="flex-1 py-2 rounded-lg bg-[#eff4ff] text-[#1d4ed8] font-bold text-[13px] hover:bg-[#dbeafe] flex items-center justify-center gap-1.5 transition-all" id="btnMarkReview">
                <span class="material-symbols-outlined text-[18px]">send</span>
                <span>Gửi Trình Phê Duyệt</span>
              </button>
            ` : `
              <div class="text-[12px] text-[#16a34a] font-bold flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[18px]">check_circle</span>
                <span>Nhiệm vụ đã hoàn tất và được lưu hồ sơ.</span>
              </div>
            `}
          </div>
        </div>
      </div>
    `;

    this.bindEvents(task);
  }

  bindEvents(task) {
    const btnClose = this.container.querySelector('#btnCloseDrawer');
    if (btnClose) btnClose.addEventListener('click', () => this.close());

    const backdrop = this.container.querySelector('#drawerBackdrop');
    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) this.close();
      });
    }

    // Đổi trạng thái
    const selectStatus = this.container.querySelector('#selectTaskStatus');
    if (selectStatus) {
      selectStatus.addEventListener('change', (e) => {
        store.updateTaskStatus(task.id, e.target.value);
        toast(`Đã cập nhật trạng thái: ${e.target.value}`, 'success');
        if (this.onTaskUpdated) this.onTaskUpdated();
        this.render();
      });
    }

    // Toggle subtask
    this.container.querySelectorAll('.chk-subtask').forEach(chk => {
      chk.addEventListener('change', () => {
        const sid = chk.dataset.subtaskId;
        store.toggleSubtask(task.id, sid);
        if (this.onTaskUpdated) this.onTaskUpdated();
        this.render();
      });
    });

    // Thêm comment
    const btnSend = this.container.querySelector('#btnSendComment');
    const inputComment = this.container.querySelector('#inputComment');
    if (btnSend && inputComment) {
      const submitComment = () => {
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

    // Phê duyệt 1 chạm
    const btnApprove = this.container.querySelector('#btnApproveTask');
    if (btnApprove) {
      btnApprove.addEventListener('click', () => {
        store.approveTask(task.id);
        toast('Đã phê duyệt nghiệm thu công việc thành công!', 'success');
        if (this.onTaskUpdated) this.onTaskUpdated();
        this.render();
      });
    }

    // Gửi trình duyệt
    const btnMarkReview = this.container.querySelector('#btnMarkReview');
    if (btnMarkReview) {
      btnMarkReview.addEventListener('click', () => {
        store.updateTaskStatus(task.id, 'review');
        toast('Đã gửi công việc lên hàng chờ phê duyệt của Trưởng phòng / Lãnh đạo!', 'info');
        if (this.onTaskUpdated) this.onTaskUpdated();
        this.render();
      });
    }
  }
}

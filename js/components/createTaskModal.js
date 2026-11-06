/**
 * THANH VŨ MEDIC CS3 - CREATE TASK MODAL COMPONENT (MOBILE FIRST)
 * Giao diện form chuẩn mực Google Stitch Gold:
 * Nút Gold #D6A52A, Border #E2E8F0, Text #0D1C2F
 * Thân thiện với thiết bị di động: Vùng chạm >= 44px, nút xếp hàng dọc trên mobile
 */

import { auth } from '../auth.js';
import { store } from '../store.js';
import { toast, rung } from '../helpers.js';

export class CreateTaskModal {
  constructor(containerId, onTaskCreated) {
    this.container = document.getElementById(containerId);
    this.onTaskCreated = onTaskCreated;
  }

  show() {
    if (!this.container) return;

    rung(10);
    const currentDept = auth.getActiveDepartment();
    const allUsers = store.getAllUsers();
    const currentUser = auth.getCurrentUser();
    const depts = store.getAllDepartments();

    this.container.innerHTML = `
      <div class="modal-overlay fixed inset-0 z-[100] bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 active" id="createModalOverlay">
        <div class="modal-card bg-white rounded-2xl p-4 sm:p-6 max-w-lg w-full shadow-2xl border border-[#e2e8f0] max-h-[92vh] overflow-y-auto">
          <!-- HEADER -->
          <div class="flex items-center justify-between pb-3.5 border-b border-[#f1f5f9] mb-4">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-[#fffbeb] text-[#795900] flex items-center justify-center font-bold border border-[#fef3c7] shrink-0">
                <span class="material-symbols-outlined text-[22px]">add_task</span>
              </div>
              <div class="min-w-0">
                <h3 class="font-bold text-[16px] sm:text-[16.5px] text-[#0d1c2f] truncate">Giao Việc Mới</h3>
                <span class="text-[11.5px] text-[#795900] font-semibold truncate block">${currentDept.name} • ${currentDept.code}</span>
              </div>
            </div>
            <button type="button" class="text-gray-400 hover:text-gray-700 text-2xl font-bold min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors" id="btnCloseCreateModal" aria-label="Đóng">&times;</button>
          </div>

          <!-- FORM -->
          <form id="formCreateTask" class="flex flex-col gap-3.5 sm:gap-4">
            <div>
              <label class="block text-[12.5px] font-bold text-[#0d1c2f] mb-1">Tên công việc / Nhiệm vụ *</label>
              <input type="text" id="newTaskTitle" required placeholder="Ví dụ: Lập báo cáo doanh thu khám đoàn tháng 11" class="w-full h-11 px-3.5 rounded-xl border border-[#e2e8f0] text-[14px] outline-none focus:border-[#d6a52a] focus:ring-2 focus:ring-[#d6a52a]/20 bg-[#f8f9ff] focus:bg-white" />
            </div>

            <div>
              <label class="block text-[12.5px] font-bold text-[#0d1c2f] mb-1">Mô tả chi tiết &amp; Tiêu chuẩn nghiệm thu</label>
              <textarea id="newTaskDesc" rows="3" placeholder="Ghi chú các yêu cầu, mốc chất lượng cần bàn giao..." class="w-full p-3 rounded-xl border border-[#e2e8f0] text-[13.5px] outline-none focus:border-[#d6a52a] focus:ring-2 focus:ring-[#d6a52a]/20 bg-[#f8f9ff] focus:bg-white"></textarea>
            </div>

            <div class="p-3.5 rounded-2xl border border-[#e2e8f0] bg-[#fffbeb]/50 flex flex-col gap-2.5" style="background-color: var(--primary-soft); border-color: var(--border);">
              <div class="flex items-center justify-between">
                <label class="block text-[12.5px] font-bold text-[#795900] flex items-center gap-1.5" style="color: var(--primary);">
                  <span class="material-symbols-outlined text-[18px]">person_add</span>
                  <span>Phân công người thực hiện (Assignee) *</span>
                </label>
                <span class="text-[10.5px] font-semibold text-amber-700">Tự động báo chuông</span>
              </div>

              <div class="flex items-center gap-3">
                <img id="newTaskAssigneeAvatar" src="${currentUser.avatar}" class="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-white shadow-xs" />
                <div class="flex-1 min-w-0">
                  <select id="newTaskAssignee" class="w-full h-11 px-3 rounded-xl border border-[#e2e8f0] text-[13.5px] font-bold text-[#0d1c2f] outline-none focus:border-[#d6a52a] bg-white cursor-pointer shadow-2xs">
                    ${depts.map(d => {
                      const dUsers = allUsers.filter(u => u.departmentId === d.id || u.departmentId === 'all');
                      if (dUsers.length === 0) return '';
                      return `
                        <optgroup label="${d.name} (${d.code})">
                          ${dUsers.map(u => {
                            const team = (d.teams || []).find(t => t.id === u.teamId);
                            const teamLabel = team ? `[${team.code}] ` : '';
                            return `<option value="${u.id}" ${u.id === currentUser.id ? 'selected' : ''}>${teamLabel}${u.name} (${u.title})</option>`;
                          }).join('')}
                        </optgroup>
                      `;
                    }).join('')}
                  </select>
                </div>
              </div>
              <span class="text-[11px] text-[#817663]">
                * Bất kỳ ai cũng có thể tạo và giao việc cho bất kỳ nhân sự nào trên toàn viện.
              </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label class="block text-[12.5px] font-bold text-[#0d1c2f] mb-1">Mức độ ưu tiên *</label>
                <select id="newTaskPriority" class="w-full h-11 px-3 rounded-xl border border-[#e2e8f0] text-[13.5px] outline-none focus:border-[#d6a52a] bg-[#f8f9ff] focus:bg-white">
                  <option value="P1">P1 - Khẩn cấp (Cần xử lý ngay)</option>
                  <option value="P2" selected>P2 - Quan trọng</option>
                  <option value="P3">P3 - Tiêu chuẩn</option>
                </select>
              </div>

              <div>
                <label class="block text-[12.5px] font-bold text-[#0d1c2f] mb-1">Hạn hoàn thành *</label>
                <input type="date" id="newTaskDueDate" required value="${new Date().toISOString().split('T')[0]}" class="w-full h-11 px-3 rounded-xl border border-[#e2e8f0] text-[13.5px] outline-none focus:border-[#d6a52a] bg-[#f8f9ff] focus:bg-white" />
              </div>
            </div>

              <div>
                <label class="block text-[12.5px] font-bold text-[#0d1c2f] mb-1">Chuyên môn / Danh mục</label>
                <input type="text" id="newTaskCategory" placeholder="Ví dụ: Khám Đoàn, BHYT, CSKH" value="Chuyên môn" class="w-full h-11 px-3 rounded-xl border border-[#e2e8f0] text-[13.5px] outline-none focus:border-[#d6a52a] bg-[#f8f9ff] focus:bg-white" />
              </div>
            </div>

            <div>
              <label class="block text-[12.5px] font-bold text-[#0d1c2f] mb-1">Dự toán kinh phí (VNĐ)</label>
              <input type="number" id="newTaskCost" value="0" step="500000" class="w-full h-11 px-3 rounded-xl border border-[#e2e8f0] text-[13.5px] outline-none focus:border-[#d6a52a] bg-[#f8f9ff] focus:bg-white" />
            </div>

            <!-- ACTIONS (MOBILE COMPACT & ERGONOMIC) -->
            <div class="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3 border-t border-[#f1f5f9] mt-2">
              <button type="button" class="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#e2e8f0] text-[#64748b] text-[13px] font-semibold hover:bg-gray-50 min-h-[44px]" id="btnCancelCreateTask">
                Hủy bỏ
              </button>
              <button type="submit" class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#d6a52a] text-[#533d00] text-[13px] font-bold hover:bg-[#795900] hover:text-white shadow-xs transition-all min-h-[44px]">
                Tạo &amp; Giao Việc
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const overlay = this.container.querySelector('#createModalOverlay');
    const btnClose = this.container.querySelector('#btnCloseCreateModal');
    const btnCancel = this.container.querySelector('#btnCancelCreateTask');
    const form = this.container.querySelector('#formCreateTask');
    const selectAssignee = this.container.querySelector('#newTaskAssignee');
    const avatarImg = this.container.querySelector('#newTaskAssigneeAvatar');

    if (selectAssignee && avatarImg) {
      selectAssignee.addEventListener('change', () => {
        const u = store.getUserById(selectAssignee.value);
        if (u) avatarImg.src = u.avatar;
      });
    }

    const closeModal = () => {
      rung(10);
      if (overlay) overlay.remove();
    };

    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnCancel) btnCancel.addEventListener('click', closeModal);
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        rung(15);

        const currentDept = auth.getActiveDepartment();
        const currentUser = auth.getCurrentUser();

        const title = this.container.querySelector('#newTaskTitle').value.trim();
        const description = this.container.querySelector('#newTaskDesc').value.trim();
        const assigneeId = this.container.querySelector('#newTaskAssignee').value;
        const priority = this.container.querySelector('#newTaskPriority').value;
        const dueDate = this.container.querySelector('#newTaskDueDate').value;
        const category = this.container.querySelector('#newTaskCategory').value.trim() || 'Chuyên môn';
        const cost = parseFloat(this.container.querySelector('#newTaskCost').value) || 0;

        if (!title) {
          toast('Vui lòng nhập tên công việc!', 'warning');
          return;
        }

        const newTask = store.createTask({
          title,
          description,
          departmentId: currentDept.id,
          assigneeId,
          creatorId: currentUser.id,
          priority,
          dueDate,
          category,
          cost
        });

        toast(`Đã giao việc thành công: ${newTask.id}`, 'success');
        closeModal();
        if (this.onTaskCreated) this.onTaskCreated(newTask);
      });
    }
  }
}

/**
 * THANH VŨ MEDIC CS3 - CREATE TASK MODAL COMPONENT
 * Giao diện form chuẩn mực Google Stitch Gold:
 * Nút Gold #D6A52A, Border #E2E8F0, Text #0D1C2F
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
    const deptUsers = store.getDepartmentUsers(currentDept.id);
    const currentUser = auth.getCurrentUser();

    this.container.innerHTML = `
      <div class="modal-overlay fixed inset-0 z-[100] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 active" id="createModalOverlay">
        <div class="modal-card bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-[#e2e8f0] max-h-[90vh] overflow-y-auto">
          <!-- HEADER -->
          <div class="flex items-center justify-between pb-3.5 border-b border-[#f1f5f9] mb-4">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-[#fffbeb] text-[#795900] flex items-center justify-center font-bold border border-[#fef3c7]">
                <span class="material-symbols-outlined text-[22px]">add_task</span>
              </div>
              <div>
                <h3 class="font-bold text-[16.5px] text-[#0d1c2f]">Giao Việc Mới</h3>
                <span class="text-[11.5px] text-[#795900] font-semibold">${currentDept.name} • ${currentDept.code}</span>
              </div>
            </div>
            <button type="button" class="text-gray-400 hover:text-gray-700 text-2xl font-bold" id="btnCloseCreateModal">&times;</button>
          </div>

          <!-- FORM -->
          <form id="formCreateTask" class="flex flex-col gap-4">
            <div>
              <label class="block text-[12.5px] font-bold text-[#0d1c2f] mb-1">Tên công việc / Nhiệm vụ *</label>
              <input type="text" id="newTaskTitle" required placeholder="Ví dụ: Lập báo cáo doanh thu khám đoàn tháng 11" class="w-full h-10 px-3.5 rounded-xl border border-[#e2e8f0] text-[13.5px] outline-none focus:border-[#d6a52a] focus:ring-2 focus:ring-[#d6a52a]/20 bg-[#f8f9ff] focus:bg-white" />
            </div>

            <div>
              <label class="block text-[12.5px] font-bold text-[#0d1c2f] mb-1">Mô tả chi tiết &amp; Tiêu chuẩn nghiệm thu</label>
              <textarea id="newTaskDesc" rows="3" placeholder="Ghi chú các yêu cầu, mốc chất lượng cần bàn giao..." class="w-full p-3 rounded-xl border border-[#e2e8f0] text-[13px] outline-none focus:border-[#d6a52a] focus:ring-2 focus:ring-[#d6a52a]/20 bg-[#f8f9ff] focus:bg-white"></textarea>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label class="block text-[12.5px] font-bold text-[#0d1c2f] mb-1">Người phụ trách *</label>
                <select id="newTaskAssignee" class="w-full h-10 px-3 rounded-xl border border-[#e2e8f0] text-[13px] outline-none focus:border-[#d6a52a] bg-[#f8f9ff] focus:bg-white">
                  ${deptUsers.map(u => `
                    <option value="${u.id}" ${u.id === currentUser.id ? 'selected' : ''}>${u.name} (${u.title})</option>
                  `).join('')}
                </select>
              </div>

              <div>
                <label class="block text-[12.5px] font-bold text-[#0d1c2f] mb-1">Mức độ ưu tiên *</label>
                <select id="newTaskPriority" class="w-full h-10 px-3 rounded-xl border border-[#e2e8f0] text-[13px] outline-none focus:border-[#d6a52a] bg-[#f8f9ff] focus:bg-white">
                  <option value="P1">P1 - Khẩn cấp (Cần xử lý ngay)</option>
                  <option value="P2" selected>P2 - Quan trọng</option>
                  <option value="P3">P3 - Tiêu chuẩn</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label class="block text-[12.5px] font-bold text-[#0d1c2f] mb-1">Hạn hoàn thành *</label>
                <input type="date" id="newTaskDueDate" required value="${new Date().toISOString().split('T')[0]}" class="w-full h-10 px-3 rounded-xl border border-[#e2e8f0] text-[13px] outline-none focus:border-[#d6a52a] bg-[#f8f9ff] focus:bg-white" />
              </div>

              <div>
                <label class="block text-[12.5px] font-bold text-[#0d1c2f] mb-1">Chuyên môn / Danh mục</label>
                <input type="text" id="newTaskCategory" placeholder="Ví dụ: Khám Đoàn, BHYT, CSKH" value="Chuyên môn" class="w-full h-10 px-3 rounded-xl border border-[#e2e8f0] text-[13px] outline-none focus:border-[#d6a52a] bg-[#f8f9ff] focus:bg-white" />
              </div>
            </div>

            <div>
              <label class="block text-[12.5px] font-bold text-[#0d1c2f] mb-1">Dự toán kinh phí (VNĐ)</label>
              <input type="number" id="newTaskCost" value="0" step="500000" class="w-full h-10 px-3 rounded-xl border border-[#e2e8f0] text-[13px] outline-none focus:border-[#d6a52a] bg-[#f8f9ff] focus:bg-white" />
            </div>

            <!-- ACTIONS -->
            <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-[#f1f5f9] mt-2">
              <button type="button" class="px-4 py-2 rounded-xl border border-[#e2e8f0] text-[#64748b] text-[13px] font-semibold hover:bg-gray-50" id="btnCancelCreateTask">
                Hủy bỏ
              </button>
              <button type="submit" class="px-5 py-2 rounded-xl bg-[#d6a52a] text-[#533d00] text-[13px] font-bold hover:bg-[#795900] hover:text-white shadow-xs transition-all">
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

        const newTask = store.createTask({
          title,
          description,
          assigneeId,
          creatorId: currentUser.id,
          departmentId: currentDept.id,
          priority,
          dueDate,
          category,
          cost
        });

        toast(`Đã giao việc mới: "${title}"`, 'success');
        closeModal();
        if (this.onTaskCreated) this.onTaskCreated(newTask);
      });
    }
  }
}

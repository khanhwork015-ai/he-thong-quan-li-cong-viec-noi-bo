/**
 * THANH VŨ MEDIC CS3 - PLAN MODAL COMPONENT (SHIN AIOS v2.7)
 * Soạn thảo & Chỉnh sửa Kế hoạch / Dự án
 * Ai cũng có thể tạo kế hoạch - Tự động ghi nhận Người tạo và Thời gian tạo
 */

import { auth } from '../auth.js?v=6.6';
import { store } from '../store.js?v=6.6';
import { esc, toast, rung } from '../helpers.js?v=6.6';
import { PLAN_STATUSES } from '../models.js?v=6.6';

export class PlanModal {
  constructor(containerId, onSaved) {
    this.container = document.getElementById(containerId);
    this.onSaved = onSaved;
    this.planToEdit = null;
  }

  show(planToEdit = null) {
    if (!this.container) return;

    rung(10);
    this.planToEdit = planToEdit;
    const isEdit = Boolean(planToEdit);

    const currentUser = auth.getCurrentUser() || {};
    const activeDept = auth.getActiveDepartment() || { id: 'dept_ptkh', name: 'Phòng ban' };
    const allDepts = store.getAllDepartments();
    const canSelectDept = auth.isAdmin() || auth.isLeadership();

    const planDeptId = isEdit ? planToEdit.departmentId : (activeDept.id === 'all' ? 'dept_ptkh' : activeDept.id);
    const deptMembers = (planDeptId && planDeptId !== 'all') 
      ? store.getDepartmentUsers(planDeptId) 
      : store.getAllUsers();

    const defaultLeadId = isEdit ? planToEdit.leadId : currentUser.id;
    const currentPriority = isEdit ? (planToEdit.priority || 'P2') : 'P2';
    const currentStatus = isEdit ? (planToEdit.status || 'planning') : 'planning';
    const currentStartDate = isEdit ? (planToEdit.startDate || '') : new Date().toISOString().slice(0, 10);
    const currentDueDate = isEdit ? (planToEdit.dueDate || '') : new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10);

    this.container.innerHTML = `
      <div class="modal-overlay fixed inset-0 z-[100] bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 active" id="planModalOverlay">
        <div class="modal-card bg-white rounded-t-2xl sm:rounded-2xl rounded-b-none sm:rounded-b-2xl w-full max-w-xl max-h-[90vh] sm:max-h-[88vh] flex flex-col shadow-2xl border border-[#e2e8f0] overflow-hidden" style="background-color: var(--card); border-color: var(--border);">
          
          <!-- MODAL HEADER -->
          <div class="p-4 sm:p-5 border-b border-[#f1f5f9] flex items-center justify-between shrink-0" style="border-color: var(--border);">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-10 h-10 rounded-2xl flex items-center justify-center font-bold shadow-xs shrink-0" style="background-color: var(--primary-soft); color: var(--primary);">
                <span class="material-symbols-outlined text-[22px]">${isEdit ? 'edit_note' : 'topic'}</span>
              </div>
              <div class="min-w-0">
                <h3 class="font-bold text-[16px] sm:text-[17px] text-[#0d1c2f] truncate" style="color: var(--text);">
                  ${isEdit ? `Chỉnh Sửa Kế Hoạch • ${esc(planToEdit.code)}` : 'Lập Dự Án &amp; Kế Hoạch Mới'}
                </h3>
                <span class="text-[11.5px] font-semibold truncate block" style="color: var(--primary);">
                  Người lập: ${currentUser.name || 'Thành viên'} • ${isEdit ? 'Cập nhật kế hoạch' : 'Khởi tạo ý tưởng / dự án'}
                </span>
              </div>
            </div>
            <button type="button" class="text-gray-400 hover:text-gray-700 text-2xl font-bold min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors cursor-pointer shrink-0" id="btnClosePlanModal" aria-label="Đóng">&times;</button>
          </div>

          <!-- FORM SOẠN THẢO VỚI BODY CUỘN VÀ FOOTER CỐ ĐỊNH -->
          <form id="formPlan" class="flex flex-col flex-1 overflow-hidden">
            
            <div class="p-4 sm:p-5 flex-1 overflow-y-auto flex flex-col gap-3.5 text-left">
              <!-- 1. TIÊU ĐỀ KẾ HOẠCH -->
              <div>
                <label for="inputPlanTitle" class="block text-[12.5px] font-bold text-[#0d1c2f] mb-1.5" style="color: var(--text);">
                  Tên Kế Hoạch / Dự Án <span class="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  id="inputPlanTitle" 
                  class="w-full h-11 px-3.5 rounded-lg border border-[#cbd5e1] text-[13.5px] font-bold outline-none focus:border-[#d6a52a] focus:ring-1 focus:ring-[#d6a52a] bg-white text-[#0d1c2f]"
                  placeholder="VD: Chiến dịch Khám Sức Khỏe Doanh Nghiệp Quý 1/2027..." 
                  value="${isEdit ? esc(planToEdit.title) : ''}" 
                  required 
                />
              </div>

              <!-- 2. PHÒNG BAN & NGƯỜI CHỦ TRÌ (PROJECT LEAD) -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label for="selectPlanDept" class="block text-[12px] font-bold text-[#0d1c2f] mb-1" style="color: var(--text);">
                    Phòng ban trực thuộc
                  </label>
                  <select 
                    id="selectPlanDept" 
                    class="w-full h-11 px-3.5 rounded-lg border border-[#cbd5e1] text-[13px] font-medium outline-none focus:border-[#d6a52a] bg-white text-[#0d1c2f]"
                    ${!canSelectDept && !isEdit ? 'disabled' : ''}
                  >
                    ${allDepts.map(d => `
                      <option value="${d.id}" ${d.id === planDeptId ? 'selected' : ''}>${esc(d.name)}</option>
                    `).join('')}
                  </select>
                </div>

                <div>
                  <label for="selectPlanLead" class="block text-[12px] font-bold text-[#0d1c2f] mb-1" style="color: var(--text);">
                    Người phụ trách chính (Lead) <span class="text-red-500">*</span>
                  </label>
                  <select 
                    id="selectPlanLead" 
                    class="w-full h-11 px-3.5 rounded-lg border border-[#cbd5e1] text-[13px] font-medium outline-none focus:border-[#d6a52a] bg-white text-[#0d1c2f]"
                  >
                    ${deptMembers.map(u => `
                      <option value="${u.id}" ${u.id === defaultLeadId ? 'selected' : ''}>${esc(u.name)} (${esc(u.title || 'Chuyên viên')})</option>
                    `).join('')}
                  </select>
                </div>
              </div>

              <!-- 3. THỜI GIAN & ĐỘ ƯU TIÊN & TRẠNG THÁI (CHỐNG TRÀN VÀ CẮT CHỮ TRÊN MOBILE) -->
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label for="inputPlanStartDate" class="block text-[11.5px] font-bold text-[#64748b] mb-1">
                    Bắt đầu
                  </label>
                  <input 
                    type="date" 
                    id="inputPlanStartDate" 
                    value="${currentStartDate}" 
                    class="w-full h-11 px-3 rounded-lg border border-[#cbd5e1] text-[13px] font-mono-data font-bold outline-none focus:border-[#d6a52a] bg-white text-[#0d1c2f]"
                  />
                </div>

                <div>
                  <label for="inputPlanDueDate" class="block text-[11.5px] font-bold text-[#64748b] mb-1">
                    Hạn chót <span class="text-red-500">*</span>
                  </label>
                  <input 
                    type="date" 
                    id="inputPlanDueDate" 
                    value="${currentDueDate}" 
                    class="w-full h-11 px-3 rounded-lg border border-[#cbd5e1] text-[13px] font-mono-data font-bold outline-none focus:border-[#d6a52a] bg-white text-[#0d1c2f]"
                    required
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label for="selectPlanPriority" class="block text-[11.5px] font-bold text-[#64748b] mb-1">
                    Mức ưu tiên
                  </label>
                  <select 
                    id="selectPlanPriority" 
                    class="w-full h-11 px-3 rounded-lg border border-[#cbd5e1] text-[13px] font-bold outline-none focus:border-[#d6a52a] bg-white text-[#0d1c2f]"
                  >
                    <option value="P1" ${currentPriority === 'P1' ? 'selected' : ''}>P1 • Khẩn</option>
                    <option value="P2" ${currentPriority === 'P2' ? 'selected' : ''}>P2 • Quan trọng</option>
                    <option value="P3" ${currentPriority === 'P3' ? 'selected' : ''}>P3 • Thường</option>
                  </select>
                </div>

                <div>
                  <label for="selectPlanStatus" class="block text-[11.5px] font-bold text-[#64748b] mb-1">
                    Trạng thái
                  </label>
                  <select 
                    id="selectPlanStatus" 
                    class="w-full h-11 px-3 rounded-lg border border-[#cbd5e1] text-[13px] font-bold outline-none focus:border-[#d6a52a] bg-white text-[#0d1c2f]"
                  >
                    <option value="planning" ${currentStatus === 'planning' ? 'selected' : ''}>📝 Đang Lập</option>
                    <option value="pending_approval" ${currentStatus === 'pending_approval' ? 'selected' : ''}>⏳ Chờ Duyệt</option>
                    <option value="in_progress" ${currentStatus === 'in_progress' ? 'selected' : ''}>🚀 Triển Khai</option>
                    <option value="completed" ${currentStatus === 'completed' ? 'selected' : ''}>✅ Hoàn Tất</option>
                    <option value="paused" ${currentStatus === 'paused' ? 'selected' : ''}>⏸️ Tạm Dừng</option>
                  </select>
                </div>
              </div>

              <!-- 4. MỤC TIÊU CỐT LÕI (STRATEGIC TARGET) -->
              <div>
                <label for="textareaPlanTarget" class="block text-[12px] font-bold text-[#0d1c2f] mb-1" style="color: var(--text);">
                  🎯 Mục Tiêu Cốt Lõi (Đích đến của dự án)
                </label>
                <textarea 
                  id="textareaPlanTarget" 
                  rows="2" 
                  class="w-full p-3 rounded-lg border border-[#cbd5e1] text-[13px] outline-none focus:border-[#d6a52a] bg-white text-[#0d1c2f] leading-relaxed resize-none"
                  placeholder="Ghi rõ kết quả mong muốn đạt được, chỉ số định lượng cụ thể..."
                >${isEdit ? esc(planToEdit.target || '') : ''}</textarea>
              </div>

              <!-- 5. GHI CHÚ & CHI TIẾT KẾ HOẠCH (NOTES) -->
              <div>
                <label for="textareaPlanNotes" class="block text-[12px] font-bold text-[#0d1c2f] mb-1" style="color: var(--text);">
                  📝 Ghi Chú &amp; Nội Dung Kế Hoạch Chi Tiết
                </label>
                <textarea 
                  id="textareaPlanNotes" 
                  rows="3" 
                  class="w-full p-3 rounded-lg border border-[#cbd5e1] text-[13px] outline-none focus:border-[#d6a52a] bg-white text-[#0d1c2f] leading-relaxed resize-none"
                  placeholder="Phân tích tình hình, phương án thực hiện, các phòng ban cần phối hợp..."
                >${isEdit ? esc(planToEdit.notes || '') : ''}</textarea>
              </div>

              <!-- HỘP THÔNG TIN TỰ ĐỘNG GHI NHẬN NGƯỜI TẠO -->
              <div class="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-[11.5px] text-amber-900 flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px] text-amber-600 shrink-0">verified_user</span>
                <span>Hệ thống tự động lưu người tạo <strong>${currentUser.name || 'Bạn'}</strong> và đóng dấu thời gian tạo vào kế hoạch.</span>
              </div>
            </div>

            <!-- NÚT HÀNH ĐỘNG FOOTER CỐ ĐỊNH (STICKY ACTION BAR) -->
            <div class="p-3.5 sm:p-4 border-t border-[#f1f5f9] bg-[#f8f9ff]/70 flex items-center justify-end gap-2.5 shrink-0" style="border-color: var(--border);">
              <button 
                type="button" 
                class="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-[13px] min-h-[44px] hover:bg-gray-100 transition-colors cursor-pointer"
                id="btnCancelPlanModal"
              >
                Hủy
              </button>

              <button 
                type="submit" 
                class="px-6 py-2.5 rounded-xl font-bold text-[13px] min-h-[44px] shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-2"
                style="background-color: var(--primary-container); color: var(--on-primary-container);"
              >
                <span class="material-symbols-outlined text-[19px]">check_circle</span>
                <span>${isEdit ? 'Lưu Thay Đổi' : 'Tạo Kế Hoạch Ngay'}</span>
              </button>
            </div>

          </form>

        </div>
      </div>
    `;

    this.bindEvents();
  }

  close() {
    rung(10);
    this.planToEdit = null;
    if (this.container) {
      this.container.innerHTML = '';
    }
  }

  bindEvents() {
    const overlay = this.container.querySelector('#planModalOverlay');
    const btnClose = this.container.querySelector('#btnClosePlanModal');
    const btnCancel = this.container.querySelector('#btnCancelPlanModal');
    const form = this.container.querySelector('#formPlan');

    const handleClose = () => this.close();
    if (btnClose) btnClose.addEventListener('click', handleClose);
    if (btnCancel) btnCancel.addEventListener('click', handleClose);

    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.close();
      });
    }

    const deptSelect = this.container.querySelector('#selectPlanDept');
    const leadSelect = this.container.querySelector('#selectPlanLead');
    if (deptSelect && leadSelect) {
      deptSelect.addEventListener('change', () => {
        const newDeptId = deptSelect.value;
        const newMembers = (newDeptId && newDeptId !== 'all')
          ? store.getDepartmentUsers(newDeptId)
          : store.getAllUsers();
        leadSelect.innerHTML = newMembers.map(u => `
          <option value="${u.id}">${esc(u.name)} (${esc(u.title || 'Chuyên viên')})</option>
        `).join('');
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        rung(15);

        const titleInput = this.container.querySelector('#inputPlanTitle');
        const startDateInput = this.container.querySelector('#inputPlanStartDate');
        const dueDateInput = this.container.querySelector('#inputPlanDueDate');
        const prioritySelect = this.container.querySelector('#selectPlanPriority');
        const statusSelect = this.container.querySelector('#selectPlanStatus');
        const targetInput = this.container.querySelector('#textareaPlanTarget');
        const notesInput = this.container.querySelector('#textareaPlanNotes');

        const title = titleInput?.value?.trim();
        if (!title) {
          toast('Vui lòng nhập tên kế hoạch/dự án!', 'warning');
          titleInput?.focus();
          return;
        }

        const planData = {
          title,
          departmentId: deptSelect?.value || (this.planToEdit ? this.planToEdit.departmentId : (auth.getActiveDepartment().id === 'all' ? 'dept_ptkh' : auth.getActiveDepartment().id)),
          leadId: leadSelect?.value,
          startDate: startDateInput?.value,
          dueDate: dueDateInput?.value,
          priority: prioritySelect?.value || 'P2',
          status: statusSelect?.value || 'planning',
          target: targetInput?.value?.trim() || '',
          notes: notesInput?.value?.trim() || ''
        };

        if (this.planToEdit) {
          const updated = store.updatePlan(this.planToEdit.id, planData);
          toast(`Đã cập nhật kế hoạch ${updated.code}!`, 'success');
          if (this.onSaved) this.onSaved(updated);
        } else {
          const created = store.addPlan(planData);
          toast(`Đã tạo thành công kế hoạch mới ${created.code}!`, 'success');
          if (this.onSaved) this.onSaved(created);
        }

        this.close();
      });
    }
  }
}

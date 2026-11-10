/**
 * THANH VŨ MEDIC CS3 - EXECUTIVE APPROVAL HUB COMPONENT (SHIN AIOS v2.7)
 * Trung Tâm Phê Duyệt 1-Chạm Dành Cho Ban Lãnh Đạo & Cấp Quản Lý
 * - Kết nối trực tiếp với Công Việc (Tasks) và Dự Án & Kế Hoạch (Plans)
 * - Tách bạch 2 Tab: Công việc chờ duyệt & Kế hoạch chờ duyệt (+ Lịch sử đã duyệt)
 * - Nút Duyệt 1-Chạm (One-Tap Approval) tức thì và Yêu Cầu Làm Lại (kèm thông báo)
 * - Hỗ trợ Duyệt Hàng Loạt (Batch Approval)
 * - Phân quyền thông minh: Lãnh đạo thấy toàn viện, Trưởng phòng thấy khoa mình, Nhân viên theo dõi hồ sơ đã gửi
 */

import { store } from '../store.js?v=7.9';
import { auth } from '../auth.js?v=7.9';
import { esc, ngayVN, soVN, toast, rung, popupTuChoiPheDuyet } from '../helpers.js?v=7.9';

export class ApprovalView {
  constructor(containerId, onOpenTask, onOpenPlan, onUpdated) {
    this.container = document.getElementById(containerId);
    this.onOpenTask = onOpenTask;
    this.onOpenPlan = onOpenPlan;
    this.onUpdated = onUpdated;

    this.activeTab = 'tasks'; // 'tasks' | 'plans' | 'history'
    this.searchQuery = '';
    this.filterPriority = 'all';
    this.filterDept = 'all';
    this.selectedTaskIds = new Set();
    this.selectedPlanIds = new Set();
  }

  setTab(tab) {
    this.activeTab = tab;
    this.selectedTaskIds.clear();
    this.selectedPlanIds.clear();
    this.render();
  }

  render() {
    if (!this.container) return;

    const prevScrollY = window.scrollY || document.documentElement.scrollTop;
    const currentUser = auth.getCurrentUser() || {};
    const { tasks, plans, isApprover, totalCount } = store.getPendingApprovalsForUser(currentUser);
    const history = store.getApprovedHistoryForUser(currentUser);
    const allDepts = store.getAllDepartments();

    // Lọc công việc theo tìm kiếm & bộ lọc
    const filteredTasks = tasks.filter(t => {
      if (this.filterPriority !== 'all' && t.priority !== this.filterPriority) return false;
      if (this.filterDept !== 'all' && t.departmentId !== this.filterDept) return false;
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        const titleMatch = (t.title || '').toLowerCase().includes(q);
        const idMatch = (t.id || '').toLowerCase().includes(q);
        const assignee = store.getUserById(t.assigneeId);
        const nameMatch = assignee ? assignee.name.toLowerCase().includes(q) : false;
        return titleMatch || idMatch || nameMatch;
      }
      return true;
    });

    // Lọc kế hoạch theo tìm kiếm & bộ lọc
    const filteredPlans = plans.filter(p => {
      if (this.filterPriority !== 'all' && p.priority !== this.filterPriority) return false;
      if (this.filterDept !== 'all' && p.departmentId !== this.filterDept) return false;
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        const nameMatch = (p.title || p.name || '').toLowerCase().includes(q);
        const idMatch = (p.id || '').toLowerCase().includes(q);
        const lead = store.getUserById(p.leadId);
        const leadMatch = lead ? lead.name.toLowerCase().includes(q) : false;
        return nameMatch || idMatch || leadMatch;
      }
      return true;
    });

    // Lịch sử
    const historyItems = [
      ...history.tasks.map(t => ({ ...t, _type: 'task' })),
      ...history.plans.map(p => ({ ...p, _type: 'plan' }))
    ].sort((a, b) => new Date(b.approvedAt || b.rejectedAt || b.updatedAt || 0) - new Date(a.approvedAt || a.rejectedAt || a.updatedAt || 0));

    this.container.innerHTML = `
      <div class="flex flex-col w-full gap-5 sm:gap-6 animate-fade-in max-w-7xl mx-auto pb-12 overflow-x-hidden">
        
        <!-- 1. HERO BANNER TRUNG TÂM PHÊ DUYỆT (EXECUTIVE APPROVAL HUB) -->
        <div class="p-5 sm:p-6 rounded-2xl border border-[#e2e8f0] shadow-2xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4" style="background: linear-gradient(135deg, var(--card) 0%, var(--primary-soft) 100%); border-color: var(--border);">
          <div class="flex items-center gap-3.5 sm:gap-4 min-w-0">
            <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-bold text-white shadow-md shadow-amber-500/20 shrink-0" style="background-color: var(--primary);">
              <span class="material-symbols-outlined text-[28px] sm:text-[32px]">verified</span>
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2 mb-1 flex-wrap">
                <span class="font-mono-data text-[10.5px] font-bold px-2 py-0.5 rounded-md" style="background-color: var(--primary-soft); color: var(--primary); border: 1px solid var(--border);">
                  ONE-TAP APPROVAL
                </span>
                <span class="text-[11.5px] text-[#64748b]">
                  ${isApprover ? 'Cổng điều hành & ký duyệt của Ban Lãnh Đạo' : 'Theo dõi hồ sơ và yêu cầu trình ký của bạn'}
                </span>
              </div>
              <h1 class="font-extrabold text-[19px] sm:text-[23px] text-[#0d1c2f] tracking-tight" style="color: var(--text);">
                ${isApprover ? 'Trung Tâm Phê Duyệt 1-Chạm' : 'Hồ Sơ Của Tôi Đang Chờ Duyệt'}
              </h1>
              <p class="text-[12px] sm:text-[12.5px] text-[#817663] mt-0.5 leading-relaxed">
                ${isApprover 
                  ? 'Ký duyệt nghiệm thu công việc, thông qua chủ trương kế hoạch chiến lược nhanh chóng và chuẩn xác.' 
                  : 'Danh sách các nhiệm vụ và kế hoạch do bạn khởi tạo đang chờ cấp trên phê duyệt.'}
              </p>
            </div>
          </div>

          <!-- BADGE TỔNG SỐ HỒ SƠ & BATCH APPROVAL BUTTON -->
          <div class="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
            <div class="px-3.5 py-2 rounded-xl bg-white border border-[#e2e8f0] shadow-2xs flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full ${totalCount > 0 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}"></span>
              <span class="text-[12.5px] font-bold text-[#0d1c2f]">
                ${totalCount > 0 ? `Đang chờ: <strong class="text-amber-700 font-mono-data text-[14px]">${totalCount}</strong>` : 'Đã duyệt hết'}
              </span>
            </div>

            ${isApprover && (this.selectedTaskIds.size > 0 || this.selectedPlanIds.size > 0) ? `
              <button 
                type="button" 
                class="px-4 py-2.5 rounded-xl font-bold text-[13px] shadow-sm hover:shadow-md transition-all min-h-[44px] flex items-center gap-1.5 cursor-pointer animate-bounce" 
                id="btnBatchApprove"
                style="background-color: var(--primary-container); color: var(--on-primary-container);"
              >
                <span class="material-symbols-outlined text-[19px]">check_circle</span>
                <span>Duyệt Hàng Loạt (${this.selectedTaskIds.size + this.selectedPlanIds.size})</span>
              </button>
            ` : ''}
          </div>
        </div>

        <!-- 2. TABS ĐIỀU HƯỚNG CHÍNH (3 TABS CHUẨN SHIN AIOS) -->
        <div class="flex items-center gap-2 border-b border-[#e2e8f0] pb-2 overflow-x-auto no-scrollbar">
          <button 
            type="button" 
            class="btn-approval-tab px-4 py-2.5 rounded-xl text-[13px] font-bold flex items-center gap-2 transition-all min-h-[42px] cursor-pointer whitespace-nowrap ${this.activeTab === 'tasks' ? 'shadow-xs' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}"
            style="${this.activeTab === 'tasks' ? 'background-color: var(--primary-container); color: var(--on-primary-container);' : ''}"
            data-tab="tasks"
          >
            <span class="material-symbols-outlined text-[18px]">task_alt</span>
            <span>Công việc chờ duyệt</span>
            <span class="px-2 py-0.2 rounded-full text-[10.5px] font-mono-data font-bold ${this.activeTab === 'tasks' ? 'bg-white/40' : 'bg-amber-100 text-amber-800'}">
              ${tasks.length}
            </span>
          </button>

          <button 
            type="button" 
            class="btn-approval-tab px-4 py-2.5 rounded-xl text-[13px] font-bold flex items-center gap-2 transition-all min-h-[42px] cursor-pointer whitespace-nowrap ${this.activeTab === 'plans' ? 'shadow-xs' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}"
            style="${this.activeTab === 'plans' ? 'background-color: var(--primary-container); color: var(--on-primary-container);' : ''}"
            data-tab="plans"
          >
            <span class="material-symbols-outlined text-[18px]">topic</span>
            <span>Kế hoạch chờ duyệt</span>
            <span class="px-2 py-0.2 rounded-full text-[10.5px] font-mono-data font-bold ${this.activeTab === 'plans' ? 'bg-white/40' : 'bg-blue-100 text-blue-800'}">
              ${plans.length}
            </span>
          </button>

          <button 
            type="button" 
            class="btn-approval-tab px-4 py-2.5 rounded-xl text-[13px] font-bold flex items-center gap-2 transition-all min-h-[42px] cursor-pointer whitespace-nowrap ${this.activeTab === 'history' ? 'shadow-xs' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}"
            style="${this.activeTab === 'history' ? 'background-color: var(--primary-container); color: var(--on-primary-container);' : ''}"
            data-tab="history"
          >
            <span class="material-symbols-outlined text-[18px]">history</span>
            <span>Lịch sử đã duyệt</span>
            <span class="px-2 py-0.2 rounded-full text-[10.5px] font-mono-data font-bold ${this.activeTab === 'history' ? 'bg-white/40' : 'bg-gray-100 text-gray-700'}">
              ${historyItems.length}
            </span>
          </button>
        </div>

        <!-- 3. BỘ LỌC & TÌM KIẾM THÍCH ỨNG -->
        ${this.activeTab !== 'history' ? `
          <div class="p-3 sm:p-4 rounded-xl bg-white border border-[#e2e8f0] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3" style="background-color: var(--card); border-color: var(--border);">
            
            <!-- Ô TÌM KIẾM -->
            <div class="relative flex-1 min-w-0">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">search</span>
              <input 
                type="text" 
                id="inputApprovalSearch" 
                class="w-full h-11 pl-9 pr-3 rounded-lg border border-[#cbd5e1] text-[13px] outline-none focus:border-[#d6a52a] bg-white text-[#0d1c2f]" 
                placeholder="Tìm theo mã, tiêu đề, người phụ trách..." 
                value="${esc(this.searchQuery)}"
              />
            </div>

            <!-- CỤM LỌC: ĐỘ ƯU TIÊN & PHÒNG BAN & CHỌN TẤT CẢ -->
            <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
              <select id="selectApprovalPriority" class="h-11 px-3 rounded-lg border border-[#cbd5e1] text-[12.5px] font-bold bg-white outline-none cursor-pointer">
                <option value="all" ${this.filterPriority === 'all' ? 'selected' : ''}>Tất cả mức độ</option>
                <option value="P1" ${this.filterPriority === 'P1' ? 'selected' : ''}>P1 • Khẩn cấp</option>
                <option value="P2" ${this.filterPriority === 'P2' ? 'selected' : ''}>P2 • Quan trọng</option>
              </select>

              ${auth.isAdmin() || auth.isLeadership() ? `
                <select id="selectApprovalDept" class="h-11 px-3 rounded-lg border border-[#cbd5e1] text-[12.5px] font-bold bg-white outline-none cursor-pointer max-w-[200px] truncate">
                  <option value="all" ${this.filterDept === 'all' ? 'selected' : ''}>Toàn Viện (Tất Cả)</option>
                  ${allDepts.map(d => `
                    <option value="${d.id}" ${this.filterDept === d.id ? 'selected' : ''}>${esc(d.name)}</option>
                  `).join('')}
                </select>
              ` : ''}

              ${isApprover ? `
                <button 
                  type="button" 
                  id="btnSelectAllApprovalItems" 
                  class="h-11 px-3 rounded-lg border border-[#cbd5e1] text-[12px] font-bold bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <span class="material-symbols-outlined text-[17px]">select_all</span>
                  <span>Chọn tất cả</span>
                </button>
              ` : ''}
            </div>

          </div>
        ` : ''}

        <!-- 4. DANH SÁCH THẺ DỮ LIỆU (THEO TAB) -->
        ${this.activeTab === 'tasks' ? this.renderTasksTab(filteredTasks, isApprover) : ''}
        ${this.activeTab === 'plans' ? this.renderPlansTab(filteredPlans, isApprover) : ''}
        ${this.activeTab === 'history' ? this.renderHistoryTab(historyItems) : ''}

        <!-- MODAL YÊU CẦU LÀM LẠI (REJECT MODAL) -->
        <div id="approvalRejectModalContainer"></div>

      </div>
    `;

    this.bindEvents(isApprover, filteredTasks, filteredPlans);

    if (prevScrollY > 0) {
      window.scrollTo({ top: prevScrollY, behavior: 'instant' });
      requestAnimationFrame(() => {
        window.scrollTo({ top: prevScrollY, behavior: 'instant' });
      });
    }
  }

  // --- RENDER TAB 1: CÔNG VIỆC CHỜ DUYỆT ---
  renderTasksTab(tasks, isApprover) {
    if (tasks.length === 0) {
      return `
        <div class="bg-white p-10 sm:p-14 rounded-2xl border border-dashed border-[#e2e8f0] text-center shadow-2xs flex flex-col items-center justify-center gap-3">
          <div class="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <span class="material-symbols-outlined text-[36px]">task_alt</span>
          </div>
          <div>
            <h3 class="font-extrabold text-[16px] sm:text-[17px] text-[#0d1c2f]">Tuyệt vời! Không có công việc nào đang chờ duyệt</h3>
            <p class="text-[12.5px] text-[#817663] mt-1 max-w-md mx-auto">
              ${isApprover ? 'Tất cả nhiệm vụ nghiệm thu đã được hoàn tất ký duyệt hoặc chưa có đề xuất mới phát sinh.' : 'Các nhiệm vụ của bạn hiện tại đã được giải quyết xong.'}
            </p>
          </div>
        </div>
      `;
    }

    return `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${tasks.map(task => {
          const assignee = store.getUserById(task.assigneeId);
          const creator = store.getUserById(task.creatorId);
          const dept = store.getDepartmentById(task.departmentId);
          const isSelected = this.selectedTaskIds.has(task.id);
          const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
          const doneSubs = subtasks.filter(s => s.completed || s.status === 'done').length;

          return `
            <div class="bg-white p-4 sm:p-5 rounded-2xl border ${isSelected ? 'border-amber-500 ring-2 ring-amber-200' : 'border-[#e2e8f0]'} shadow-2xs hover:border-[#d6a52a] hover:shadow-md transition-all flex flex-col justify-between gap-3.5 relative" style="background-color: var(--card); border-color: ${isSelected ? '#d6a52a' : 'var(--border)'};">
              
              <!-- HEADER THẺ: CHECKBOX CHỌN, MÃ VIỆC, ƯU TIÊN, PHÒNG BAN -->
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <div class="flex items-center gap-2">
                  ${isApprover ? `
                    <input 
                      type="checkbox" 
                      class="chk-select-task w-4 h-4 rounded text-[#d6a52a] focus:ring-[#d6a52a] cursor-pointer" 
                      data-task-id="${task.id}"
                      ${isSelected ? 'checked' : ''}
                    />
                  ` : ''}
                  <span class="font-mono-data text-[11px] font-bold px-2 py-0.5 rounded bg-[#fffbeb] text-[#795900] border border-[#fef3c7]">
                    ${esc(task.id)}
                  </span>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-md ${task.priority === 'P1' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'}">
                    ${task.priority === 'P1' ? 'P1 • Khẩn cấp' : 'P2 • Quan trọng'}
                  </span>
                </div>

                <div class="flex items-center gap-1.5 text-[11px] text-[#64748b]">
                  <span class="material-symbols-outlined text-[16px] text-amber-600">event</span>
                  <span class="font-mono-data font-bold text-amber-900">${task.dueDate ? ngayVN(task.dueDate) : 'Chưa đặt hạn'}</span>
                </div>
              </div>

              <!-- TIÊU ĐỀ NHIỆM VỤ & PHÒNG BAN -->
              <div class="cursor-pointer btn-open-task-drawer" data-task-id="${task.id}">
                ${dept ? `
                  <div class="text-[11px] font-semibold text-gray-500 mb-1 flex items-center gap-1">
                    <span class="material-symbols-outlined text-[14px]">domain</span>
                    <span>${esc(dept.name)}</span>
                  </div>
                ` : ''}
                <h3 class="font-bold text-[14.5px] sm:text-[15.5px] text-[#0d1c2f] leading-snug hover:text-[#795900] transition-colors break-words">
                  ${esc(task.title)}
                </h3>
                ${task.description ? `
                  <p class="text-[12px] text-[#64748b] mt-1 line-clamp-2 leading-relaxed">
                    ${esc(task.description)}
                  </p>
                ` : ''}
              </div>

              <!-- THÔNG TIN TIẾN ĐỘ VIỆC CON & CHI PHÍ -->
              <div class="p-2.5 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] flex items-center justify-between gap-2 text-[11.5px]">
                <div class="flex items-center gap-1.5 text-[#4f4635]">
                  <span class="material-symbols-outlined text-[16px] text-[#795900]">account_tree</span>
                  <span>Việc con: <strong>${doneSubs}/${subtasks.length}</strong> (${task.progress || 0}%)</span>
                </div>
                ${task.cost ? `
                  <div class="font-mono-data font-bold text-[#0d1c2f]">
                    ${soVN(task.cost)} đ
                  </div>
                ` : ''}
              </div>

              <!-- NGƯỜI THỰC HIỆN & NGƯỜI TRÌNH DUYỆT -->
              <div class="flex items-center justify-between gap-2 pt-2 border-t border-[#f1f5f9] text-[11.5px] text-[#64748b]">
                <div class="flex items-center gap-1.5 min-w-0">
                  <img src="${assignee ? assignee.avatar : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80'}" class="w-5 h-5 rounded-full object-cover shrink-0 ring-1 ring-[#e2e8f0]" />
                  <span class="truncate">Làm: <strong class="text-[#0d1c2f]">${assignee ? esc(assignee.name) : 'Chưa giao'}</strong></span>
                </div>
                <div class="truncate text-right">
                  Trình: <strong class="text-[#0d1c2f]">${creator ? esc(creator.name) : 'Hệ thống'}</strong>
                </div>
              </div>

              <!-- HÀNG NÚT THAO TÁC 1-CHẠM (ACTION BAR) -->
              <div class="flex items-center gap-2 pt-1 border-t border-[#f1f5f9]">
                <button 
                  type="button" 
                  class="px-3 py-2 rounded-xl border border-[#cbd5e1] hover:bg-gray-100 text-gray-700 font-bold text-[12px] min-h-[42px] flex items-center justify-center gap-1 transition-colors cursor-pointer btn-open-task-drawer" 
                  data-task-id="${task.id}"
                >
                  <span class="material-symbols-outlined text-[16px]">visibility</span>
                  <span>Xem</span>
                </button>

                ${isApprover ? `
                  <button 
                    type="button" 
                    class="px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[12px] min-h-[42px] flex items-center justify-center gap-1 transition-colors cursor-pointer btn-reject-task-modal" 
                    data-task-id="${task.id}"
                    data-task-title="${esc(task.title)}"
                  >
                    <span class="material-symbols-outlined text-[16px]">restart_alt</span>
                    <span>Cần Sửa</span>
                  </button>

                  <button 
                    type="button" 
                    class="flex-1 px-4 py-2 rounded-xl font-bold text-[12.5px] min-h-[42px] flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-sm transition-all cursor-pointer btn-approve-task-quick" 
                    data-task-id="${task.id}"
                    style="background-color: var(--primary-container); color: var(--on-primary-container);"
                  >
                    <span class="material-symbols-outlined text-[17px]">verified</span>
                    <span>Duyệt 1-Chạm</span>
                  </button>
                ` : `
                  <div class="flex-1 text-center py-2 text-[11.5px] font-bold text-amber-700 bg-amber-50 rounded-xl border border-amber-200">
                    ⏳ Đang chờ cấp trên ký duyệt
                  </div>
                `}
              </div>

            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // --- RENDER TAB 2: KẾ HOẠCH CHỜ DUYỆT ---
  renderPlansTab(plans, isApprover) {
    if (plans.length === 0) {
      return `
        <div class="bg-white p-10 sm:p-14 rounded-2xl border border-dashed border-[#e2e8f0] text-center shadow-2xs flex flex-col items-center justify-center gap-3">
          <div class="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <span class="material-symbols-outlined text-[36px]">topic</span>
          </div>
          <div>
            <h3 class="font-extrabold text-[16px] sm:text-[17px] text-[#0d1c2f]">Không có dự án hay kế hoạch nào đang chờ duyệt</h3>
            <p class="text-[12.5px] text-[#817663] mt-1 max-w-md mx-auto">
              ${isApprover ? 'Tất cả kế hoạch đã được thông qua chủ trương hoặc đang trong giai đoạn triển khai.' : 'Bạn chưa có kế hoạch nào gửi lên hàng chờ duyệt.'}
            </p>
          </div>
        </div>
      `;
    }

    return `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${plans.map(plan => {
          const lead = store.getUserById(plan.leadId);
          const creator = store.getUserById(plan.creatorId);
          const dept = store.getDepartmentById(plan.departmentId);
          const isSelected = this.selectedPlanIds.has(plan.id);
          const milestones = Array.isArray(plan.milestones) ? plan.milestones : [];
          const tasksList = Array.isArray(plan.tasksList) ? plan.tasksList : [];

          return `
            <div class="bg-white p-4 sm:p-5 rounded-2xl border ${isSelected ? 'border-amber-500 ring-2 ring-amber-200' : 'border-[#e2e8f0]'} shadow-2xs hover:border-[#d6a52a] hover:shadow-md transition-all flex flex-col justify-between gap-3.5 relative" style="background-color: var(--card); border-color: ${isSelected ? '#d6a52a' : 'var(--border)'};">
              
              <!-- HEADER THẺ KẾ HOẠCH -->
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <div class="flex items-center gap-2">
                  ${isApprover ? `
                    <input 
                      type="checkbox" 
                      class="chk-select-plan w-4 h-4 rounded text-[#d6a52a] focus:ring-[#d6a52a] cursor-pointer" 
                      data-plan-id="${plan.id}"
                      ${isSelected ? 'checked' : ''}
                    />
                  ` : ''}
                  <span class="font-mono-data text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                    ${esc(plan.id)}
                  </span>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-md ${plan.priority === 'P1' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'}">
                    ${plan.priority === 'P1' ? 'P1 • Trọng điểm' : 'P2 • Kế hoạch'}
                  </span>
                </div>

                <div class="flex items-center gap-1.5 text-[11px] text-[#64748b]">
                  <span class="material-symbols-outlined text-[16px] text-blue-600">event_upcoming</span>
                  <span class="font-mono-data font-bold text-blue-900">${plan.endDate ? ngayVN(plan.endDate) : 'Chưa đặt hạn'}</span>
                </div>
              </div>

              <!-- TÊN KẾ HOẠCH & MỤC TIÊU CỐT LÕI -->
              <div class="cursor-pointer btn-open-plan-drawer" data-plan-id="${plan.id}">
                ${dept ? `
                  <div class="text-[11px] font-semibold text-gray-500 mb-1 flex items-center gap-1">
                    <span class="material-symbols-outlined text-[14px]">apartment</span>
                    <span>${esc(dept.name)}</span>
                  </div>
                ` : ''}
                <h3 class="font-bold text-[15px] sm:text-[16px] text-[#0d1c2f] leading-snug hover:text-[#795900] transition-colors break-words">
                  ${esc(plan.title || plan.name)}
                </h3>
                ${plan.target ? `
                  <div class="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/80 text-[12px] text-amber-900 mt-2 leading-relaxed italic line-clamp-2">
                    🎯 "${esc(plan.target)}"
                  </div>
                ` : ''}
              </div>

              <!-- LỘ TRÌNH CỘT MỐC & ĐẦU VIỆC DỰ KIẾN -->
              <div class="p-2.5 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] flex items-center justify-between gap-2 text-[11.5px] text-[#4f4635]">
                <div class="flex items-center gap-1">
                  <span class="material-symbols-outlined text-[16px] text-blue-600">flag</span>
                  <span>Lộ trình: <strong>${milestones.length} mốc</strong></span>
                </div>
                <div class="flex items-center gap-1">
                  <span class="material-symbols-outlined text-[16px] text-[#795900]">checklist</span>
                  <span>Đầu việc dự kiến: <strong>${tasksList.length} việc</strong></span>
                </div>
              </div>

              <!-- PHỤ TRÁCH CHÍNH & NGƯỜI LẬP KẾ HOẠCH -->
              <div class="flex items-center justify-between gap-2 pt-2 border-t border-[#f1f5f9] text-[11.5px] text-[#64748b]">
                <div class="flex items-center gap-1.5 min-w-0">
                  <img src="${lead ? lead.avatar : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80'}" class="w-5 h-5 rounded-full object-cover shrink-0 ring-1 ring-[#e2e8f0]" />
                  <span class="truncate">Lead: <strong class="text-[#0d1c2f]">${lead ? esc(lead.name) : 'Chưa rõ'}</strong></span>
                </div>
                <div class="truncate text-right">
                  Lập bởi: <strong class="text-[#0d1c2f]">${creator ? esc(creator.name) : 'Hệ thống'}</strong>
                </div>
              </div>

              <!-- ACTION BAR CHO KẾ HOẠCH -->
              <div class="flex items-center gap-2 pt-1 border-t border-[#f1f5f9]">
                <button 
                  type="button" 
                  class="px-3 py-2 rounded-xl border border-[#cbd5e1] hover:bg-gray-100 text-gray-700 font-bold text-[12px] min-h-[42px] flex items-center justify-center gap-1 transition-colors cursor-pointer btn-open-plan-drawer" 
                  data-plan-id="${plan.id}"
                >
                  <span class="material-symbols-outlined text-[16px]">visibility</span>
                  <span>Xem</span>
                </button>

                ${isApprover ? `
                  <button 
                    type="button" 
                    class="px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[12px] min-h-[42px] flex items-center justify-center gap-1 transition-colors cursor-pointer btn-reject-plan-modal" 
                    data-plan-id="${plan.id}"
                    data-plan-name="${esc(plan.title || plan.name)}"
                  >
                    <span class="material-symbols-outlined text-[16px]">restart_alt</span>
                    <span>Cần Sửa</span>
                  </button>

                  <button 
                    type="button" 
                    class="flex-1 px-4 py-2 rounded-xl font-bold text-[12.5px] min-h-[42px] flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-sm transition-all cursor-pointer btn-approve-plan-quick" 
                    data-plan-id="${plan.id}"
                    style="background-color: var(--primary-container); color: var(--on-primary-container);"
                  >
                    <span class="material-symbols-outlined text-[17px]">verified</span>
                    <span>Thông Qua 1-Chạm</span>
                  </button>
                ` : `
                  <div class="flex-1 text-center py-2 text-[11.5px] font-bold text-blue-700 bg-blue-50 rounded-xl border border-blue-200">
                    ⏳ Đang chờ Ban Lãnh Đạo thông qua
                  </div>
                `}
              </div>

            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // --- RENDER TAB 3: LỊCH SỬ ĐÃ DUYỆT ---
  renderHistoryTab(items) {
    if (items.length === 0) {
      return `
        <div class="bg-white p-10 sm:p-14 rounded-2xl border border-dashed border-[#e2e8f0] text-center shadow-2xs flex flex-col items-center justify-center gap-3">
          <div class="w-16 h-16 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center">
            <span class="material-symbols-outlined text-[36px]">history_toggle_drop_down</span>
          </div>
          <div>
            <h3 class="font-bold text-[15px] text-[#0d1c2f]">Chưa có lịch sử phê duyệt</h3>
            <p class="text-[12px] text-[#817663] mt-1">Các hạng mục sau khi được duyệt hoặc yêu cầu làm lại sẽ được lưu lại nhật ký tại đây.</p>
          </div>
        </div>
      `;
    }

    return `
      <div class="flex flex-col gap-3">
        ${items.map(item => {
          const isTask = item._type === 'task';
          const isApproved = item.approvalStatus === 'APPROVED' || item.status === 'done' || item.status === 'in_progress';
          const approverName = item.approvedBy || item.rejectedBy || 'Ban Lãnh Đạo';
          const actionDate = item.approvedAt || item.rejectedAt || item.updatedAt;

          return `
            <div class="p-3.5 sm:p-4 rounded-xl bg-white border border-[#e2e8f0] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-gray-300 transition-all">
              <div class="flex items-start gap-3 min-w-0">
                <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isApproved ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}">
                  <span class="material-symbols-outlined text-[20px]">${isApproved ? 'check_circle' : 'cancel'}</span>
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-mono-data text-[10.5px] font-bold px-2 py-0.5 rounded ${isTask ? 'bg-[#fffbeb] text-[#795900] border border-[#fef3c7]' : 'bg-blue-50 text-blue-800 border border-blue-200'}">
                      ${esc(item.id)}
                    </span>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded ${isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
                      ${isApproved ? 'Đã duyệt' : 'Yêu cầu làm lại'}
                    </span>
                    <span class="text-[11px] text-[#64748b]">
                      Người duyệt: <strong class="text-[#0d1c2f]">${esc(approverName)}</strong>
                    </span>
                  </div>

                  <h4 class="font-bold text-[13.5px] sm:text-[14px] text-[#0d1c2f] mt-1 leading-snug">
                    ${esc(item.title || item.name)}
                  </h4>

                  ${item.rejectReason ? `
                    <div class="text-[12px] text-rose-700 bg-rose-50 p-2 rounded-lg mt-1 border border-rose-200">
                      Lý do: "${esc(item.rejectReason)}"
                    </div>
                  ` : ''}
                </div>
              </div>

              <div class="flex items-center justify-between sm:justify-end gap-3 text-[11.5px] text-[#64748b] shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                <span class="font-mono-data">${actionDate ? ngayVN(actionDate) : ''}</span>
                <button 
                  type="button" 
                  class="px-3 py-1.5 rounded-lg border border-[#cbd5e1] hover:bg-gray-100 text-[11.5px] font-bold text-gray-700 cursor-pointer ${isTask ? 'btn-open-task-drawer' : 'btn-open-plan-drawer'}" 
                  data-task-id="${item.id}"
                  data-plan-id="${item.id}"
                >
                  Chi tiết
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // --- MODAL POPUP YÊU CẦU LÀM LẠI (POPUP CHUẨN SHIN AIOS v2.7) ---
  openRejectModal(type, id, title) {
    popupTuChoiPheDuyet({
      tieuDe: type === 'task' ? 'Yêu Cầu Làm Lại Nhiệm Vụ' : 'Yêu Cầu Hoàn Thiện Kế Hoạch',
      tenDoiTuong: `${id} - ${title}`,
      defaultReason: '',
      onConfirm: (reason) => {
        if (type === 'task') {
          store.rejectTask(id, reason);
          toast('Đã gửi yêu cầu làm lại nhiệm vụ và thông báo đến nhân sự!', 'warning');
        } else if (type === 'plan') {
          store.rejectPlan(id, reason);
          toast('Đã gửi yêu cầu hoàn thiện lại kế hoạch và thông báo đến người lập!', 'warning');
        }
        if (this.onUpdated) this.onUpdated();
        this.render();
      }
    });
  }

  // --- BINDING EVENTS ---
  bindEvents(isApprover, filteredTasks, filteredPlans) {
    // 1. Chuyển Tab (Tasks / Plans / History)
    this.container.querySelectorAll('.btn-approval-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        rung(10);
        const tab = btn.dataset.tab;
        this.setTab(tab);
      });
    });

    // 2. Tìm kiếm
    const inputSearch = this.container.querySelector('#inputApprovalSearch');
    if (inputSearch) {
      inputSearch.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.render();
      });
    }

    // 3. Lọc theo độ ưu tiên
    const selectPriority = this.container.querySelector('#selectApprovalPriority');
    if (selectPriority) {
      selectPriority.addEventListener('change', (e) => {
        rung(10);
        this.filterPriority = e.target.value;
        this.render();
      });
    }

    // 4. Lọc theo phòng ban
    const selectDept = this.container.querySelector('#selectApprovalDept');
    if (selectDept) {
      selectDept.addEventListener('change', (e) => {
        rung(10);
        this.filterDept = e.target.value;
        this.render();
      });
    }

    // 5. Mở Drawer xem Task
    this.container.querySelectorAll('.btn-open-task-drawer').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const taskId = el.dataset.taskId;
        rung(10);
        if (this.onOpenTask) this.onOpenTask(taskId);
      });
    });

    // 6. Mở Drawer xem Plan
    this.container.querySelectorAll('.btn-open-plan-drawer').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const planId = el.dataset.planId;
        rung(10);
        if (this.onOpenPlan) this.onOpenPlan(planId);
      });
    });

    // 7. DUYỆT 1-CHẠM TASK
    this.container.querySelectorAll('.btn-approve-task-quick').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        rung(15);
        const taskId = btn.dataset.taskId;
        store.approveTask(taskId);
        toast(`✅ Đã phê duyệt 1-chạm hoàn tất nhiệm vụ ${taskId}!`, 'success');
        if (this.onUpdated) this.onUpdated();
        this.render();
      });
    });

    // 8. DUYỆT 1-CHẠM PLAN
    this.container.querySelectorAll('.btn-approve-plan-quick').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        rung(15);
        const planId = btn.dataset.planId;
        store.approvePlan(planId);
        toast(`✅ Đã thông qua chủ trương 1-chạm kế hoạch ${planId}!`, 'success');
        if (this.onUpdated) this.onUpdated();
        this.render();
      });
    });

    // 9. YÊU CẦU LÀM LẠI TASK (MỞ MODAL)
    this.container.querySelectorAll('.btn-reject-task-modal').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const taskId = btn.dataset.taskId;
        const title = btn.dataset.taskTitle;
        this.openRejectModal('task', taskId, title);
      });
    });

    // 10. YÊU CẦU LÀM LẠI PLAN (MỞ MODAL)
    this.container.querySelectorAll('.btn-reject-plan-modal').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const planId = btn.dataset.planId;
        const name = btn.dataset.planName;
        this.openRejectModal('plan', planId, name);
      });
    });

    // 11. CHECKBOX CHỌN ITEM CHO BATCH
    this.container.querySelectorAll('.chk-select-task').forEach(chk => {
      chk.addEventListener('change', (e) => {
        e.stopPropagation();
        const tid = chk.dataset.taskId;
        if (chk.checked) this.selectedTaskIds.add(tid);
        else this.selectedTaskIds.delete(tid);
        this.render();
      });
    });

    this.container.querySelectorAll('.chk-select-plan').forEach(chk => {
      chk.addEventListener('change', (e) => {
        e.stopPropagation();
        const pid = chk.dataset.planId;
        if (chk.checked) this.selectedPlanIds.add(pid);
        else this.selectedPlanIds.delete(pid);
        this.render();
      });
    });

    // 12. CHỌN TẤT CẢ
    const btnSelectAll = this.container.querySelector('#btnSelectAllApprovalItems');
    if (btnSelectAll) {
      btnSelectAll.addEventListener('click', () => {
        rung(10);
        if (this.activeTab === 'tasks') {
          if (this.selectedTaskIds.size === filteredTasks.length) {
            this.selectedTaskIds.clear();
          } else {
            filteredTasks.forEach(t => this.selectedTaskIds.add(t.id));
          }
        } else if (this.activeTab === 'plans') {
          if (this.selectedPlanIds.size === filteredPlans.length) {
            this.selectedPlanIds.clear();
          } else {
            filteredPlans.forEach(p => this.selectedPlanIds.add(p.id));
          }
        }
        this.render();
      });
    }

    // 13. NÚT DUYỆT HÀNG LOẠT (BATCH APPROVE)
    const btnBatch = this.container.querySelector('#btnBatchApprove');
    if (btnBatch) {
      btnBatch.addEventListener('click', () => {
        rung(20);
        const countTasks = this.selectedTaskIds.size;
        const countPlans = this.selectedPlanIds.size;
        const total = countTasks + countPlans;

        this.selectedTaskIds.forEach(tid => store.approveTask(tid, 'Duyệt hàng loạt 1-Chạm'));
        this.selectedPlanIds.forEach(pid => store.approvePlan(pid, 'Thông qua hàng loạt 1-Chạm'));

        this.selectedTaskIds.clear();
        this.selectedPlanIds.clear();

        toast(`✅ Đã phê duyệt 1-chạm thành công ${total} hạng mục!`, 'success');
        if (this.onUpdated) this.onUpdated();
        this.render();
      });
    }
  }
}

/**
 * THANH VŨ MEDIC CS3 - PLAN DRAWER COMPONENT (SHIN AIOS v2.7)
 * Ngăn kéo chi tiết toàn diện cho Kế Hoạch / Dự Án
 * - Hiển thị Người tạo và Thời gian tạo nổi bật
 * - Quản lý Mục tiêu chiến lược & Lộ trình Cột mốc (Milestones)
 * - Phân rã đầu việc & 1-Chạm chuyển thành Task Workspace
 * - Ghi chú, Tài liệu đính kèm & Bình luận thảo luận
 */

import { auth } from '../auth.js?v=6.9';
import { store } from '../store.js?v=6.9';
import { esc, ngayVN, timeAgo, toast, rung, xacNhan2Lan } from '../helpers.js?v=6.9';
import { PLAN_STATUSES } from '../models.js?v=6.9';

export class PlanDrawer {
  constructor(containerId, onPlanChanged, onEditPlan, onOpenTask) {
    this.container = document.getElementById(containerId);
    this.onPlanChanged = onPlanChanged;
    this.onEditPlan = onEditPlan;
    this.onOpenTask = onOpenTask;
    this.currentPlanId = null;
  }

  open(planId) {
    rung(10);
    this.currentPlanId = planId;
    this.render();
  }

  close() {
    rung(10);
    this.currentPlanId = null;
    if (this.container) {
      this.container.innerHTML = '';
    }
  }

  render() {
    if (!this.container || !this.currentPlanId) return;

    const plan = store.getPlanById(this.currentPlanId);
    if (!plan) {
      this.close();
      return;
    }

    const currentUser = auth.getCurrentUser() || {};
    const creator = store.getUserById(plan.creatorId);
    const lead = store.getUserById(plan.leadId);
    const dept = store.getDepartmentById(plan.departmentId);
    const deptMembers = (plan.departmentId && plan.departmentId !== 'all') 
      ? store.getDepartmentUsers(plan.departmentId) 
      : store.getAllUsers();

    const isCreator = currentUser.id === plan.creatorId;
    const isLead = currentUser.id === plan.leadId;
    const canManagePlan = isCreator || isLead || auth.isAdmin() || auth.isLeadership() || auth.isManager();

    const milestones = Array.isArray(plan.milestones) ? plan.milestones : [];
    const completedMilestones = milestones.filter(m => m.completed).length;
    const milestoneProgress = milestones.length > 0 ? Math.round((completedMilestones / milestones.length) * 100) : 0;

    const tasksList = Array.isArray(plan.tasksList) ? plan.tasksList : [];
    const convertedTasksCount = tasksList.filter(t => t.converted).length;

    const links = Array.isArray(plan.links) ? plan.links : [];
    const comments = Array.isArray(plan.comments) ? plan.comments : [];
    const currentStatusMeta = PLAN_STATUSES[plan.status] || PLAN_STATUSES.planning;

    const prevBody = this.container.querySelector('#planDrawerScrollBody');
    const prevScrollTop = prevBody ? prevBody.scrollTop : 0;

    this.container.innerHTML = `
      <div class="drawer-backdrop fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end active" id="planDrawerBackdrop">
        <div class="drawer-panel w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col justify-between overflow-hidden border-l border-[#e2e8f0]" style="background-color: var(--card); border-color: var(--border);">
          
          <!-- 1. DRAWER TOP BAR (CHỐNG TRÀN VÀ ĐÈ NÚT TRÊN MOBILE) -->
          <div class="h-16 px-4 sm:px-6 border-b border-[#e2e8f0] flex items-center justify-between shrink-0 bg-[#f8f9ff]" style="background-color: var(--primary-soft); border-color: var(--border);">
            <div class="flex items-center gap-2">
              <span class="font-mono-data text-[12.5px] font-bold px-2.5 py-1 rounded-md bg-[#fffbeb] border border-[#fef3c7] text-[#795900] shrink-0 shadow-2xs">
                ${esc(plan.code)}
              </span>
              <span class="text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0 shadow-2xs ${plan.priority === 'P1' ? 'bg-[#fee2e2] text-[#b91c1c]' : 'bg-[#fef3c7] text-[#92400e]'}">
                ${plan.priority}
              </span>
            </div>

            <div class="flex items-center gap-1.5 shrink-0">
              ${canManagePlan ? `
                <button type="button" id="btnDrawerEditPlan" class="px-2.5 sm:px-3 py-1.5 rounded-lg border border-[#d6a52a] text-[#795900] bg-[#fffbeb] hover:bg-[#fde68a] font-bold text-[12px] min-h-[38px] flex items-center gap-1 transition-all cursor-pointer shadow-2xs" title="Sửa kế hoạch">
                  <span class="material-symbols-outlined text-[17px]">edit</span>
                  <span class="hidden sm:inline">Sửa</span>
                </button>
                <button type="button" id="btnDrawerDeletePlan" class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg min-w-[38px] min-h-[38px] flex items-center justify-center transition-colors cursor-pointer" title="Xóa kế hoạch">
                  <span class="material-symbols-outlined text-[18px]">delete</span>
                </button>
              ` : ''}
              <button type="button" class="p-2 rounded-lg text-[#64748b] hover:text-[#0d1c2f] hover:bg-gray-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer" id="btnClosePlanDrawer" aria-label="Đóng">
                <span class="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>
          </div>

          <!-- 2. DRAWER SCROLLABLE BODY -->
          <div class="p-4 sm:p-6 flex-1 overflow-y-auto flex flex-col gap-4" id="planDrawerScrollBody">
            
            <!-- THÔNG TIN TIÊU ĐỀ & NGƯỜI TẠO -->
            <div class="flex flex-col gap-2.5">
              <h1 class="text-[18px] sm:text-[21px] font-extrabold text-[#0d1c2f] leading-snug tracking-tight break-words" style="color: var(--text);">
                ${esc(plan.title)}
              </h1>

              <!-- DẢI TRẠNG THÁI CHUYÊN BIỆT (DỄ BẤM VÀ KHÔNG ĐÈ NÚT HEADER) -->
              <div class="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#f8f9ff] border border-[#cbd5e1]" style="background-color: var(--background); border-color: var(--border);">
                <div class="flex items-center gap-1.5 text-[12.5px] font-bold text-[#64748b]">
                  <span class="material-symbols-outlined text-[18px] text-[#795900]">sync</span>
                  <span>Trạng thái dự án:</span>
                </div>
                <select id="selectDrawerPlanStatus" class="h-10 px-3.5 rounded-lg text-[12.5px] font-bold outline-none cursor-pointer border shadow-2xs ${currentStatusMeta.color}">
                  ${Object.values(PLAN_STATUSES).map(st => `
                    <option value="${st.key}" ${st.key === plan.status ? 'selected' : ''}>${st.label}</option>
                  `).join('')}
                </select>
              </div>

              <!-- DÒNG ĐÓNG DẤU NGƯỜI TẠO VÀ THỜI GIAN TẠO -->
              <div class="flex items-center gap-2 flex-wrap text-[11.5px] text-[#64748b] p-2.5 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0]" style="background-color: var(--background); border-color: var(--border);">
                <div class="flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[15px] text-amber-600">person</span>
                  <span>Tạo bởi: <strong>${creator ? esc(creator.name) : 'Thành viên'}</strong></span>
                </div>
                <span>•</span>
                <div class="flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[15px] text-amber-600">schedule</span>
                  <span>Khởi tạo: <strong class="font-mono-data">${ngayVN(plan.createdAt)}</strong> (${timeAgo(plan.createdAt)})</span>
                </div>
              </div>
            </div>

            <!-- CARD META THÔNG TIN ĐƠN VỊ & TIẾN ĐỘ -->
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-white border border-[#e2e8f0] shadow-2xs" style="background-color: var(--card); border-color: var(--border);">
              <div>
                <span class="text-[10.5px] font-bold text-[#64748b] uppercase block">Phòng ban</span>
                <span class="text-[12.5px] font-bold text-[#0d1c2f] truncate block mt-0.5" style="color: var(--text);">
                  ${dept ? esc(dept.name) : 'Toàn phòng khám'}
                </span>
              </div>

              <div>
                <span class="text-[10.5px] font-bold text-[#64748b] uppercase block">Chủ trì (Lead)</span>
                <div class="flex items-center gap-1.5 mt-0.5 min-w-0">
                  <img src="${lead?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80'}" class="w-5 h-5 rounded-full object-cover shrink-0 ring-1 ring-gray-200" />
                  <span class="text-[12.5px] font-bold text-[#0d1c2f] truncate" style="color: var(--text);">${lead ? esc(lead.name) : 'Chưa gán'}</span>
                </div>
              </div>

              <div class="col-span-2 sm:col-span-1">
                <span class="text-[10.5px] font-bold text-[#64748b] uppercase block">Thời hạn</span>
                <span class="text-[12.5px] font-mono-data font-bold text-[#795900] block mt-0.5">
                  ${plan.startDate ? `${ngayVN(plan.startDate)} → ` : ''}${ngayVN(plan.dueDate)}
                </span>
              </div>
            </div>

            <!-- PHẦN 1: MỤC TIÊU CHIẾN LƯỢC (STRATEGIC TARGET) -->
            <div class="p-4 rounded-xl bg-[#fffbeb]/60 border border-amber-200 shadow-2xs flex flex-col gap-2">
              <div class="flex items-center gap-2 text-amber-900 font-bold text-[13px]">
                <span class="material-symbols-outlined text-[19px] text-[#d6a52a]">flag</span>
                <span>Mục Tiêu Cốt Lõi Dự Án</span>
              </div>
              <p class="text-[13px] text-[#4f4635] leading-relaxed italic pl-1">
                "${esc(plan.target || 'Chưa thiết lập mục tiêu chi tiết cho kế hoạch này.')}"
              </p>
            </div>

            <!-- PHẦN 2: LỘ TRÌNH CỘT MỐC (MILESTONES & ROADMAP) -->
            <div class="p-4 sm:p-5 rounded-xl bg-white border border-[#e2e8f0] shadow-2xs flex flex-col gap-3" style="background-color: var(--card); border-color: var(--border);">
              <div class="flex items-center justify-between gap-2 pb-2 border-b border-[#f1f5f9]" style="border-color: var(--border);">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="material-symbols-outlined text-[20px] text-[#795900] shrink-0">timeline</span>
                  <h3 class="font-bold text-[14px] text-[#0d1c2f] truncate" style="color: var(--text);">
                    Lộ Trình Cột Mốc (Milestones)
                  </h3>
                </div>
                <span class="font-mono-data text-[11.5px] font-bold text-[#795900] bg-[#fffbeb] px-2.5 py-1 rounded-lg border border-[#fef3c7] shrink-0 whitespace-nowrap" id="planMilestonesProgressBadge">
                  ${completedMilestones}/${milestones.length} mốc • ${milestoneProgress}%
                </span>
              </div>

              <!-- PROGRESS BAR -->
              <div class="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                <div class="h-full bg-gradient-to-r from-[#d6a52a] to-emerald-500 transition-all duration-300" id="planMilestonesProgressBar" style="width: ${milestoneProgress}%;"></div>
              </div>

              <!-- DANH SÁCH MILESTONES (CHỐNG TRÀN VÀ CẮT CHỮ TRÊN MOBILE) -->
              <div class="flex flex-col gap-2 pt-1" id="milestonesListContainer">
                ${milestones.length === 0 ? `
                  <span class="text-[12px] text-gray-400 italic py-1">Chưa có cột mốc nào. Thêm mốc bên dưới để theo dõi tiến độ.</span>
                ` : milestones.map(m => `
                  <div class="flex items-start justify-between gap-2.5 p-2.5 rounded-xl border ${m.completed ? 'bg-emerald-50/40 border-emerald-200' : 'bg-gray-50/60 border-gray-200'} transition-all">
                    <label class="flex items-start gap-2.5 min-w-0 cursor-pointer flex-1">
                      <input type="checkbox" class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer chk-milestone shrink-0 mt-0.5" data-milestone-id="${m.id}" ${m.completed ? 'checked' : ''} />
                      <span class="milestone-title-text text-[12.5px] leading-snug break-words flex-1 ${m.completed ? 'line-through text-gray-500' : 'font-semibold text-[#0d1c2f]'}">
                        ${esc(m.title)}
                      </span>
                    </label>

                    <div class="flex items-center gap-1.5 shrink-0 pt-0.5">
                      ${m.dueDate ? `
                        <span class="text-[10px] font-mono-data font-semibold text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">
                          ${ngayVN(m.dueDate)}
                        </span>
                      ` : ''}
                      ${canManagePlan ? `
                        <button type="button" class="text-gray-400 hover:text-red-500 p-1 btn-delete-milestone min-w-[28px] min-h-[28px] flex items-center justify-center cursor-pointer" data-milestone-id="${m.id}" title="Xóa mốc">
                          <span class="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      ` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>

              <!-- FORM THÊM MỐC TIẾN ĐỘ NHANH (RESPONSIVE TRÊN MOBILE, INPUT ĐẠT CHUẨN) -->
              ${canManagePlan ? `
                <form id="formAddMilestone" class="flex flex-col gap-2 pt-2.5 border-t border-[#f1f5f9] mt-1" style="border-color: var(--border);">
                  <input type="text" id="inputNewMilestoneTitle" placeholder="Nhập tên cột mốc mới..." class="w-full h-11 px-3.5 rounded-lg border border-[#cbd5e1] text-[13px] outline-none focus:border-[#d6a52a] bg-white text-[#0d1c2f]" required />
                  <div class="flex items-center gap-2">
                    <input type="date" id="inputNewMilestoneDate" class="flex-1 h-11 px-3 rounded-lg border border-[#cbd5e1] text-[12.5px] font-mono-data outline-none bg-white text-[#0d1c2f]" />
                    <button type="submit" class="h-11 px-5 rounded-lg font-bold text-[13px] flex items-center justify-center gap-1.5 shrink-0 cursor-pointer min-h-[44px] shadow-xs transition-all" style="background-color: var(--primary-container); color: var(--on-primary-container);">
                      <span class="material-symbols-outlined text-[18px]">add</span>
                      <span>Thêm mốc</span>
                    </button>
                  </div>
                </form>
              ` : ''}
            </div>

            <!-- PHẦN 3: PHÂN RÃ CÔNG VIỆC DỰ KIẾN & 1-CHẠM CHUYỂN THÀNH TASK WORKSPACE -->
            <div class="p-4 sm:p-5 rounded-xl bg-white border border-[#e2e8f0] shadow-2xs flex flex-col gap-3" style="background-color: var(--card); border-color: var(--border);">
              <div class="flex items-center justify-between gap-2 pb-2 border-b border-[#f1f5f9]" style="border-color: var(--border);">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-[20px] text-amber-600">task_alt</span>
                    <h3 class="font-bold text-[14px] text-[#0d1c2f]" style="color: var(--text);">
                      Đầu Việc Dự Kiến (Tasks Breakdown)
                    </h3>
                  </div>
                  <p class="text-[11.5px] text-[#64748b] mt-0.5">Phân rã kế hoạch thành nhiệm vụ thực tế và chuyển 1-chạm sang Workspace</p>
                </div>
                <span class="font-mono-data text-[11.5px] font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 shrink-0 whitespace-nowrap">
                  ${convertedTasksCount}/${tasksList.length} việc đã tạo
                </span>
              </div>

              <!-- DANH SÁCH CÔNG VIỆC DỰ KIẾN -->
              <div class="flex flex-col gap-2.5 pt-1" id="planTasksListContainer">
                ${tasksList.length === 0 ? `
                  <span class="text-[12px] text-gray-400 italic py-1">Chưa có đầu việc dự kiến nào. Thêm các đầu việc bên dưới để bóc tách kế hoạch.</span>
                ` : tasksList.map((t, idx) => {
                  const assigneeUser = store.getUserById(t.assigneeId);
                  return `
                    <div class="p-3 rounded-xl border ${t.converted ? 'bg-emerald-50/30 border-emerald-200' : 'bg-gray-50/50 border-gray-200'} flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all">
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                          <span class="text-[10px] font-bold px-1.5 py-0.2 rounded-md font-mono-data ${t.priority === 'P1' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}">
                            ${t.priority || 'P2'}
                          </span>
                          <span class="text-[13px] font-bold text-[#0d1c2f] ${t.converted ? 'text-emerald-900' : ''}">
                            ${esc(t.title)}
                          </span>
                        </div>
                        <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1.5 text-[11.5px] text-[#64748b]">
                          <div class="flex items-center gap-1">
                            <span>Người nhận:</span>
                            <strong class="text-[#0d1c2f] font-semibold" style="color: var(--text);">${assigneeUser ? esc(assigneeUser.name) : 'Chưa rõ'}</strong>
                          </div>
                          <span class="hidden sm:inline text-gray-300">•</span>
                          <div class="flex items-center gap-1">
                            <span>Hạn:</span>
                            <strong class="font-mono-data text-[#795900]">${t.dueDate ? ngayVN(t.dueDate) : 'Chưa gán'}</strong>
                          </div>
                        </div>
                      </div>

                      <div class="shrink-0 flex items-center gap-2">
                        ${t.converted ? `
                          <button type="button" class="btn-open-converted-task px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-bold text-[12px] flex items-center gap-1 cursor-pointer transition-colors min-h-[38px]" data-task-id="${t.taskId}">
                            <span class="material-symbols-outlined text-[16px]">check_circle</span>
                            <span>${esc(t.taskId || 'Xem Task')}</span>
                          </button>
                        ` : `
                          <button type="button" class="btn-convert-plan-task px-3.5 py-2 rounded-lg font-bold text-[12.5px] flex items-center gap-1.5 cursor-pointer shadow-xs transition-all hover:scale-102 min-h-[38px]" style="background-color: var(--primary-container); color: var(--on-primary-container);" data-task-idx="${idx}">
                            <span class="material-symbols-outlined text-[17px]">arrow_forward</span>
                            <span>Chuyển thành Task</span>
                          </button>
                        `}
                        ${canManagePlan && !t.converted ? `
                          <button type="button" class="btn-delete-plan-task p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors cursor-pointer min-w-[38px] min-h-[38px] flex items-center justify-center" data-task-idx="${idx}" title="Xóa đầu việc dự kiến">
                            <span class="material-symbols-outlined text-[17px]">delete</span>
                          </button>
                        ` : ''}
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>

              <!-- FORM THÊM ĐẦU VIỆC DỰ KIẾN (RESPONSIVE TRÊN MOBILE, INPUT ĐẠT CHUẨN 44PX, CHỐNG TRÀN) -->
              ${canManagePlan ? `
                <form id="formAddPlanTask" class="p-3 sm:p-3.5 rounded-xl bg-[#f8f9ff] border border-dashed border-[#cbd5e1] flex flex-col gap-2.5 mt-1" style="background-color: var(--background); border-color: var(--border);">
                  <input type="text" id="inputNewTaskTitle" placeholder="Nhập tên việc cần làm..." class="w-full h-11 px-3.5 rounded-lg border border-[#cbd5e1] text-[13.5px] outline-none bg-white focus:border-[#d6a52a] text-[#0d1c2f]" required />
                  
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <select id="selectNewTaskAssignee" class="w-full h-11 px-3 rounded-lg border border-[#cbd5e1] text-[13px] font-semibold outline-none bg-white text-[#0d1c2f]">
                      ${deptMembers.map(u => `
                        <option value="${u.id}">${esc(u.name)}</option>
                      `).join('')}
                    </select>

                    <input type="date" id="inputNewTaskDueDate" value="${plan.dueDate || ''}" class="w-full h-11 px-3 rounded-lg border border-[#cbd5e1] text-[12.5px] font-mono-data outline-none bg-white text-[#0d1c2f]" />

                    <button type="submit" class="w-full h-11 px-4 rounded-lg font-bold text-[13px] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs min-h-[44px] transition-all" style="background-color: var(--primary-container); color: var(--on-primary-container);">
                      <span class="material-symbols-outlined text-[18px]">add</span>
                      <span>Thêm việc</span>
                    </button>
                  </div>
                </form>
              ` : ''}
            </div>

            <!-- PHẦN 4: GHI CHÚ CHI TIẾT & TÀI LIỆU LIÊN KẾT (GOOGLE DOCS / SHEETS / DRIVE) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <!-- GHI CHÚ NỘI BỘ -->
              <div class="p-4 rounded-xl bg-white border border-[#e2e8f0] shadow-2xs flex flex-col gap-2" style="background-color: var(--card); border-color: var(--border);">
                <div class="flex items-center justify-between pb-1.5 border-b border-[#f1f5f9]" style="border-color: var(--border);">
                  <span class="font-bold text-[13px] text-[#0d1c2f] flex items-center gap-1.5" style="color: var(--text);">
                    <span class="material-symbols-outlined text-[17px] text-amber-600">description</span>
                    <span>Ghi Chú Kế Hoạch</span>
                  </span>
                </div>
                <div class="text-[12.5px] text-[#4f4635] leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                  ${esc(plan.notes || 'Chưa có ghi chú bổ sung.')}
                </div>
              </div>

              <!-- TÀI LIỆU LIÊN KẾT ĐÍNH KÈM -->
              <div class="p-4 rounded-xl bg-white border border-[#e2e8f0] shadow-2xs flex flex-col gap-2" style="background-color: var(--card); border-color: var(--border);">
                <div class="flex items-center justify-between pb-1.5 border-b border-[#f1f5f9]" style="border-color: var(--border);">
                  <span class="font-bold text-[13px] text-[#0d1c2f] flex items-center gap-1.5" style="color: var(--text);">
                    <span class="material-symbols-outlined text-[17px] text-amber-600">link</span>
                    <span>Tài Liệu Đính Kèm (${links.length})</span>
                  </span>
                </div>

                <div class="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
                  ${links.length === 0 ? `
                    <span class="text-[11.5px] text-gray-400 italic">Chưa có liên kết tài liệu.</span>
                  ` : links.map((lnk, lIdx) => `
                    <div class="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-gray-50 text-[12px]">
                      <a href="${esc(lnk.url)}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline truncate font-semibold flex items-center gap-1 min-h-[32px] items-center">
                        <span class="material-symbols-outlined text-[15px]">open_in_new</span>
                        <span>${esc(lnk.title)}</span>
                      </a>
                      ${canManagePlan ? `
                        <button type="button" class="text-gray-400 hover:text-red-500 btn-delete-link p-1 min-w-[28px] min-h-[28px] flex items-center justify-center cursor-pointer" data-link-idx="${lIdx}">
                          <span class="material-symbols-outlined text-[15px]">close</span>
                        </button>
                      ` : ''}
                    </div>
                  `).join('')}
                </div>

                <!-- FORM THÊM LINK NHANH (RESPONSIVE TRÊN MOBILE, INPUT ĐẠT CHUẨN 44PX) -->
                ${canManagePlan ? `
                  <form id="formAddLink" class="flex flex-col gap-2 pt-2.5 border-t border-[#f1f5f9] mt-1" style="border-color: var(--border);">
                    <input type="text" id="inputLinkTitle" placeholder="Tên tài liệu (VD: Báo cáo, Kế hoạch...)" class="w-full h-11 px-3.5 rounded-lg border border-[#cbd5e1] text-[13px] outline-none bg-white focus:border-[#d6a52a] text-[#0d1c2f]" required />
                    <div class="flex items-center gap-2">
                      <input type="url" id="inputLinkUrl" placeholder="https://docs.google.com/..." class="flex-1 h-11 px-3.5 rounded-lg border border-[#cbd5e1] text-[13px] outline-none bg-white focus:border-[#d6a52a] text-[#0d1c2f]" required />
                      <button type="submit" class="h-11 px-4 rounded-lg font-bold text-[13px] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs min-h-[44px] shrink-0 transition-all" style="background-color: var(--primary-container); color: var(--on-primary-container);">
                        <span class="material-symbols-outlined text-[17px]">save</span>
                        <span>Lưu</span>
                      </button>
                    </div>
                  </form>
                ` : ''}
              </div>

            </div>

            <!-- PHẦN 5: THẢO LUẬN & BÌNH LUẬN (COMMENTS FEED) -->
            <div class="p-4 sm:p-5 rounded-xl bg-white border border-[#e2e8f0] shadow-2xs flex flex-col gap-3" style="background-color: var(--card); border-color: var(--border);">
              <div class="flex items-center justify-between pb-2 border-b border-[#f1f5f9]" style="border-color: var(--border);">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-[20px] text-[#795900]">chat</span>
                  <h3 class="font-bold text-[14px] text-[#0d1c2f]" style="color: var(--text);">
                    Thảo Luận &amp; Góp Ý Kế Hoạch (${comments.length})
                  </h3>
                </div>
              </div>

              <!-- DANH SÁCH BÌNH LUẬN -->
              <div class="flex flex-col gap-3 max-h-60 overflow-y-auto pr-1">
                ${comments.length === 0 ? `
                  <span class="text-[12px] text-gray-400 italic py-2 text-center">Chưa có bình luận nào. Hãy gửi ý kiến đóng góp cho bản kế hoạch này!</span>
                ` : comments.map(c => `
                  <div class="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0]" style="background-color: var(--background); border-color: var(--border);">
                    <img src="${c.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80'}" class="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-gray-200 mt-0.5" />
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center justify-between gap-2">
                        <span class="font-bold text-[12.5px] text-[#0d1c2f]" style="color: var(--text);">${esc(c.userName)}</span>
                        <div class="flex items-center gap-1.5 shrink-0">
                          <span class="text-[10.5px] text-[#64748b] font-mono-data">${timeAgo(c.createdAt)}</span>
                          ${(currentUser.id === c.userId || auth.isAdmin()) ? `
                            <button type="button" class="text-gray-400 hover:text-red-500 btn-delete-plan-comment p-0.5" data-comment-id="${c.id}" title="Xóa bình luận">
                              <span class="material-symbols-outlined text-[15px]">close</span>
                            </button>
                          ` : ''}
                        </div>
                      </div>
                      <p class="text-[12.5px] text-[#4f4635] mt-1 leading-relaxed" style="color: var(--text-muted);">${esc(c.text)}</p>
                    </div>
                  </div>
                `).join('')}
              </div>

              <!-- FORM GỬI BÌNH LUẬN -->
              <form id="formSendPlanComment" class="flex items-center gap-2 pt-2 border-t border-[#f1f5f9]" style="border-color: var(--border);">
                <img src="${currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80'}" class="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-amber-300" />
                <input type="text" id="inputPlanCommentText" placeholder="Viết ý kiến phản hồi hoặc đề xuất cho dự án..." class="flex-1 h-11 px-3.5 rounded-lg border border-[#cbd5e1] text-[13px] outline-none focus:border-[#d6a52a] bg-white" required />
                <button type="submit" class="h-11 px-4 rounded-lg font-bold text-[13px] flex items-center justify-center gap-1 cursor-pointer shadow-xs shrink-0" style="background-color: var(--primary-container); color: var(--on-primary-container);">
                  <span class="material-symbols-outlined text-[18px]">send</span>
                  <span>Gửi</span>
                </button>
              </form>
            </div>

          </div>

        </div>
      </div>
    `;

    this.bindEvents();

    const newBody = this.container.querySelector('#planDrawerScrollBody');
    if (newBody && prevScrollTop > 0) {
      newBody.scrollTop = prevScrollTop;
      requestAnimationFrame(() => {
        if (newBody) newBody.scrollTop = prevScrollTop;
      });
    }
  }

  bindEvents() {
    const backdrop = this.container.querySelector('#planDrawerBackdrop');
    const btnClose = this.container.querySelector('#btnClosePlanDrawer');
    const selectStatus = this.container.querySelector('#selectDrawerPlanStatus');
    const btnEdit = this.container.querySelector('#btnDrawerEditPlan');
    const btnDelete = this.container.querySelector('#btnDrawerDeletePlan');

    const handleClose = () => this.close();
    if (btnClose) btnClose.addEventListener('click', handleClose);
    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) this.close();
      });
    }

    // Đổi trạng thái kế hoạch trực tiếp
    if (selectStatus) {
      selectStatus.addEventListener('change', () => {
        const newStatus = selectStatus.value;
        store.updatePlan(this.currentPlanId, { status: newStatus });
        toast(`Đã cập nhật trạng thái kế hoạch sang: ${PLAN_STATUSES[newStatus]?.label || newStatus}`, 'success');
        this.render();
        if (this.onPlanChanged) this.onPlanChanged();
      });
    }

    // Sửa kế hoạch
    if (btnEdit) {
      btnEdit.addEventListener('click', () => {
        const plan = store.getPlanById(this.currentPlanId);
        if (plan && this.onEditPlan) {
          this.close();
          this.onEditPlan(plan);
        }
      });
    }

    // Xóa kế hoạch
    if (btnDelete) {
      btnDelete.addEventListener('click', () => {
        const plan = store.getPlanById(this.currentPlanId);
        if (!plan) return;

        xacNhan2Lan(
          'del_plan_drawer_' + plan.id,
          `Xóa kế hoạch "${plan.title}" (${plan.code})`,
          () => {
            store.deletePlan(this.currentPlanId);
            toast('Đã xóa kế hoạch thành công!', 'success');
            this.close();
            if (this.onPlanChanged) this.onPlanChanged();
          }
        );
      });
    }

    // Checkbox toggle milestone (Cập nhật trực tiếp tại chỗ, tuyệt đối không nhảy scroll)
    this.container.querySelectorAll('.chk-milestone').forEach(chk => {
      chk.addEventListener('change', () => {
        const mId = chk.dataset.milestoneId;
        const isChecked = chk.checked;
        store.togglePlanMilestone(this.currentPlanId, mId);
        rung(10);

        // Cập nhật DOM trực tiếp trên mốc
        const row = chk.closest('div.p-2.5');
        if (row) {
          const title = row.querySelector('.milestone-title-text');
          if (title) {
            if (isChecked) {
              title.classList.add('line-through', 'text-gray-500');
              title.classList.remove('font-semibold', 'text-[#0d1c2f]');
            } else {
              title.classList.remove('line-through', 'text-gray-500');
              title.classList.add('font-semibold', 'text-[#0d1c2f]');
            }
          }
          if (isChecked) {
            row.classList.remove('bg-gray-50/60', 'border-gray-200');
            row.classList.add('bg-emerald-50/40', 'border-emerald-200');
          } else {
            row.classList.remove('bg-emerald-50/40', 'border-emerald-200');
            row.classList.add('bg-gray-50/60', 'border-gray-200');
          }
        }

        // Cập nhật thanh tiến độ cột mốc
        const allChecks = this.container.querySelectorAll('.chk-milestone');
        const doneCount = Array.from(allChecks).filter(c => c.checked).length;
        const totalCount = allChecks.length;
        const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

        const badge = this.container.querySelector('#planMilestonesProgressBadge');
        if (badge) {
          badge.textContent = `${doneCount}/${totalCount} mốc • ${pct}%`;
        }
        const bar = this.container.querySelector('#planMilestonesProgressBar');
        if (bar) {
          bar.style.width = `${pct}%`;
        }

        if (this.onPlanChanged) this.onPlanChanged();
      });
    });

    // Xóa milestone
    this.container.querySelectorAll('.btn-delete-milestone').forEach(btn => {
      btn.addEventListener('click', () => {
        const mId = btn.dataset.milestoneId;
        store.deletePlanMilestone(this.currentPlanId, mId);
        this.render();
        if (this.onPlanChanged) this.onPlanChanged();
      });
    });

    // Form thêm milestone
    const formAddMilestone = this.container.querySelector('#formAddMilestone');
    if (formAddMilestone) {
      formAddMilestone.addEventListener('submit', (e) => {
        e.preventDefault();
        const inputTitle = this.container.querySelector('#inputNewMilestoneTitle');
        const inputDate = this.container.querySelector('#inputNewMilestoneDate');
        const title = inputTitle?.value?.trim();
        if (!title) return;

        store.addPlanMilestone(this.currentPlanId, {
          title,
          dueDate: inputDate?.value || ''
        });
        toast('Đã thêm cột mốc mới!', 'success');
        this.render();
        if (this.onPlanChanged) this.onPlanChanged();
      });
    }

    // Nút 1-chạm chuyển thành Task Workspace!
    this.container.querySelectorAll('.btn-convert-plan-task').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.taskIdx, 10);
        rung(15);
        const newTaskId = store.convertPlanTaskToWorkspaceTask(this.currentPlanId, idx);
        if (newTaskId) {
          toast(`Đã tạo thành công nhiệm vụ [${newTaskId}] vào Workspace!`, 'success');
          this.render();
          if (this.onPlanChanged) this.onPlanChanged();
        }
      });
    });

    // Bấm xem task đã tạo
    this.container.querySelectorAll('.btn-open-converted-task').forEach(btn => {
      btn.addEventListener('click', () => {
        const taskId = btn.dataset.taskId;
        if (taskId && this.onOpenTask) {
          this.close();
          this.onOpenTask(taskId);
        }
      });
    });

    // Form thêm đầu việc dự kiến
    const formAddPlanTask = this.container.querySelector('#formAddPlanTask');
    if (formAddPlanTask) {
      formAddPlanTask.addEventListener('submit', (e) => {
        e.preventDefault();
        const inputTitle = this.container.querySelector('#inputNewTaskTitle');
        const selectAssignee = this.container.querySelector('#selectNewTaskAssignee');
        const inputDueDate = this.container.querySelector('#inputNewTaskDueDate');
        const title = inputTitle?.value?.trim();
        if (!title) return;

        store.addPlanTaskItem(this.currentPlanId, {
          title,
          assigneeId: selectAssignee?.value,
          dueDate: inputDueDate?.value || ''
        });
        toast('Đã thêm đầu việc dự kiến!', 'success');
        this.render();
        if (this.onPlanChanged) this.onPlanChanged();
      });
    }

    // Xóa đầu việc dự kiến
    this.container.querySelectorAll('.btn-delete-plan-task').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.taskIdx, 10);
        store.deletePlanTaskItem(this.currentPlanId, idx);
        toast('Đã xóa đầu việc dự kiến!', 'info');
        this.render();
        if (this.onPlanChanged) this.onPlanChanged();
      });
    });

    // Form thêm link tài liệu
    const formAddLink = this.container.querySelector('#formAddLink');
    if (formAddLink) {
      formAddLink.addEventListener('submit', (e) => {
        e.preventDefault();
        const inputTitle = this.container.querySelector('#inputLinkTitle');
        const inputUrl = this.container.querySelector('#inputLinkUrl');
        const title = inputTitle?.value?.trim();
        const url = inputUrl?.value?.trim();
        if (!title || !url) return;

        store.addPlanLink(this.currentPlanId, { title, url });
        toast('Đã thêm liên kết tài liệu!', 'success');
        this.render();
      });
    }

    // Xóa link
    this.container.querySelectorAll('.btn-delete-link').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.linkIdx, 10);
        store.deletePlanLink(this.currentPlanId, idx);
        this.render();
      });
    });

    // Xóa bình luận
    this.container.querySelectorAll('.btn-delete-plan-comment').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const cId = btn.dataset.commentId;
        store.deletePlanComment(this.currentPlanId, cId);
        toast('Đã xóa bình luận!', 'info');
        this.render();
      });
    });

    // Form gửi bình luận
    const formSendComment = this.container.querySelector('#formSendPlanComment');
    if (formSendComment) {
      formSendComment.addEventListener('submit', (e) => {
        e.preventDefault();
        const inputComment = this.container.querySelector('#inputPlanCommentText');
        const text = inputComment?.value?.trim();
        if (!text) return;

        store.addPlanComment(this.currentPlanId, text);
        toast('Đã đăng bình luận!', 'success');
        this.render();
      });
    }
  }
}

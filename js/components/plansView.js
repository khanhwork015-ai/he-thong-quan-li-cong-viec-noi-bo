/**
 * THANH VŨ MEDIC CS3 - PLANS VIEW COMPONENT (SHIN AIOS v2.7)
 * Giao diện Lưới Thẻ Kế Hoạch (Project Cards Grid)
 * - Thiết kế tối giản, thanh lịch, chuẩn Archetype B
 * - Ai cũng có thể tạo kế hoạch
 * - Bộ lọc trạng thái trực quan & Tìm kiếm nhanh
 */

import { auth } from '../auth.js?v=6.4';
import { store } from '../store.js?v=6.4';
import { esc, ngayVN, timeAgo, toast, rung, xacNhan2Lan } from '../helpers.js?v=6.4';
import { PLAN_STATUSES } from '../models.js?v=6.4';

export class PlansView {
  constructor(containerId, onSelectPlan, onOpenCreatePlanModal, onEditPlan) {
    this.container = document.getElementById(containerId);
    this.onSelectPlan = onSelectPlan;
    this.onOpenCreatePlanModal = onOpenCreatePlanModal;
    this.onEditPlan = onEditPlan;
    this.currentFilterStatus = 'all';
    this.searchQuery = '';
  }

  render() {
    if (!this.container) return;

    const currentDept = auth.getActiveDepartment() || { id: 'all', name: 'Toàn Phòng Khám CS3 (Tất Cả)' };
    const allPlans = store.getDepartmentPlans(currentDept.id);

    // Lọc theo trạng thái
    let filteredPlans = allPlans;
    if (this.currentFilterStatus !== 'all') {
      filteredPlans = filteredPlans.filter(p => p.status === this.currentFilterStatus);
    }

    // Lọc theo từ khóa tìm kiếm
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      filteredPlans = filteredPlans.filter(p => {
        const lead = store.getUserById(p.leadId);
        const creator = store.getUserById(p.creatorId);
        return (
          p.title.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          (p.target && p.target.toLowerCase().includes(q)) ||
          (lead && lead.name.toLowerCase().includes(q)) ||
          (creator && creator.name.toLowerCase().includes(q))
        );
      });
    }

    // Đếm số lượng theo trạng thái
    const countAll = allPlans.length;
    const countPlanning = allPlans.filter(p => p.status === 'planning' || p.status === 'draft').length;
    const countPending = allPlans.filter(p => p.status === 'pending_approval').length;
    const countInProgress = allPlans.filter(p => p.status === 'in_progress').length;
    const countCompleted = allPlans.filter(p => p.status === 'completed').length;

    this.container.innerHTML = `
      <div class="flex flex-col gap-5 animate-fade-in w-full max-w-7xl pb-12 overflow-x-hidden">
        
        <!-- 1. HEADER BANNER DỰ ÁN & KẾ HOẠCH -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 bg-white p-4 sm:p-5 rounded-2xl border border-[#e2e8f0] shadow-2xs" style="background-color: var(--card); border-color: var(--border);">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="font-mono-data text-[10.5px] font-bold px-2 py-0.5 rounded-md" style="background-color: var(--primary-soft); color: var(--primary); border: 1px solid var(--border);">
                ${currentDept.code || 'PLN'}
              </span>
              <span class="text-[11.5px] text-[#64748b]" style="color: var(--text-muted);">Không gian ý tưởng &amp; Kế hoạch chiến lược</span>
            </div>
            <h1 class="font-extrabold text-[18px] sm:text-[21px] text-[#0d1c2f] tracking-tight" style="color: var(--text);">
              Dự Án &amp; Kế Hoạch • ${esc(currentDept.name)}
            </h1>
            <p class="text-[12px] text-[#817663] mt-0.5 leading-relaxed" style="color: var(--text-muted);">
              Vườn ươm dự án, hoạch định lộ trình cột mốc và phân rã nhiệm vụ cho các chiến dịch trọng điểm
            </p>
          </div>

          <!-- NÚT TẠO KẾ HOẠCH MỚI (MỞ CHO TẤT CẢ THÀNH VIÊN) -->
          <div class="flex items-center justify-between sm:justify-end gap-2 shrink-0">
            <span class="px-3 py-1.5 rounded-xl font-mono-data text-[11.5px] font-bold shadow-2xs" style="background-color: var(--primary-soft); color: var(--primary); border: 1px solid var(--border);">
              ${filteredPlans.length}/${countAll} kế hoạch
            </span>
            
            <button 
              type="button" 
              class="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg font-bold text-[13px] shadow-xs hover:shadow-md transition-all min-h-[44px] cursor-pointer" 
              id="btnOpenCreatePlanModal"
              style="background-color: var(--primary-container); color: var(--on-primary-container);"
            >
              <span class="material-symbols-outlined text-[18px]">add_circle</span>
              <span>Lập Kế Hoạch Mới</span>
            </button>
          </div>
        </div>

        <!-- 2. BỘ LỌC TRẠNG THÁI & Ô TÌM KIẾM -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-3 sm:p-3.5 rounded-xl border border-[#e2e8f0] shadow-2xs" style="background-color: var(--card); border-color: var(--border);">
          
          <!-- TABS TRẠNG THÁI (CUỘN NGANG MOBILE) -->
          <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0 flex-1 min-w-0" id="planStatusTabs">
            <button type="button" class="btn-plan-status px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all shrink-0 whitespace-nowrap flex items-center gap-1.5 min-h-[36px] cursor-pointer ${this.currentFilterStatus === 'all' ? 'shadow-xs' : 'text-gray-600 hover:bg-gray-100'}" style="${this.currentFilterStatus === 'all' ? 'background-color: var(--primary-container); color: var(--on-primary-container);' : ''}" data-status="all">
              <span>Tất cả</span>
              <span class="px-1.5 py-0.2 rounded-md text-[10px] font-mono-data font-bold bg-white/40">${countAll}</span>
            </button>

            <button type="button" class="btn-plan-status px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all shrink-0 whitespace-nowrap flex items-center gap-1.5 min-h-[36px] cursor-pointer ${this.currentFilterStatus === 'in_progress' ? 'shadow-xs' : 'text-gray-600 hover:bg-gray-100'}" style="${this.currentFilterStatus === 'in_progress' ? 'background-color: var(--primary-container); color: var(--on-primary-container);' : ''}" data-status="in_progress">
              <span>🚀 Triển khai</span>
              <span class="px-1.5 py-0.2 rounded-md text-[10px] font-mono-data font-bold bg-white/40">${countInProgress}</span>
            </button>

            <button type="button" class="btn-plan-status px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all shrink-0 whitespace-nowrap flex items-center gap-1.5 min-h-[36px] cursor-pointer ${this.currentFilterStatus === 'pending_approval' ? 'shadow-xs' : 'text-gray-600 hover:bg-gray-100'}" style="${this.currentFilterStatus === 'pending_approval' ? 'background-color: var(--primary-container); color: var(--on-primary-container);' : ''}" data-status="pending_approval">
              <span>⏳ Chờ duyệt</span>
              <span class="px-1.5 py-0.2 rounded-md text-[10px] font-mono-data font-bold bg-white/40">${countPending}</span>
            </button>

            <button type="button" class="btn-plan-status px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all shrink-0 whitespace-nowrap flex items-center gap-1.5 min-h-[36px] cursor-pointer ${this.currentFilterStatus === 'planning' ? 'shadow-xs' : 'text-gray-600 hover:bg-gray-100'}" style="${this.currentFilterStatus === 'planning' ? 'background-color: var(--primary-container); color: var(--on-primary-container);' : ''}" data-status="planning">
              <span>📝 Đang lập</span>
              <span class="px-1.5 py-0.2 rounded-md text-[10px] font-mono-data font-bold bg-white/40">${countPlanning}</span>
            </button>

            <button type="button" class="btn-plan-status px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all shrink-0 whitespace-nowrap flex items-center gap-1.5 min-h-[36px] cursor-pointer ${this.currentFilterStatus === 'completed' ? 'shadow-xs' : 'text-gray-600 hover:bg-gray-100'}" style="${this.currentFilterStatus === 'completed' ? 'background-color: var(--primary-container); color: var(--on-primary-container);' : ''}" data-status="completed">
              <span>✅ Hoàn tất</span>
              <span class="px-1.5 py-0.2 rounded-md text-[10px] font-mono-data font-bold bg-white/40">${countCompleted}</span>
            </button>
          </div>

          <!-- Ô TÌM KIẾM KẾ HOẠCH DUY NHẤT VỚI HEIGHT ĐẠT CHUẨN -->
          <div class="relative w-full sm:w-64 shrink-0">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">search</span>
            <input 
              type="text" 
              id="inputSearchPlans" 
              class="w-full h-11 pl-9 pr-3 rounded-lg border border-[#cbd5e1] text-[13px] outline-none focus:border-[#d6a52a] bg-white text-[#0d1c2f]" 
              placeholder="Tìm theo tên, mã, người..." 
              value="${esc(this.searchQuery)}"
            />
          </div>

        </div>

        </div>

        <!-- 3. LƯỚI THẺ KẾ HOẠCH (PROJECT CARDS GRID) -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="plansCardsGrid">
          ${filteredPlans.length === 0 ? `
            <div class="col-span-full p-8 sm:p-12 rounded-2xl text-center bg-white border border-dashed border-[#e2e8f0] flex flex-col items-center justify-center gap-3 shadow-2xs" style="background-color: var(--card); border-color: var(--border);">
              <div class="w-16 h-16 rounded-2xl bg-amber-50 text-[#795900] flex items-center justify-center">
                <span class="material-symbols-outlined text-[34px]">topic</span>
              </div>
              <div>
                <h4 class="font-bold text-[16px] text-[#0d1c2f]">Chưa có kế hoạch nào trong danh mục này</h4>
                <p class="text-[12.5px] text-[#817663] mt-1 max-w-md mx-auto">
                  ${this.searchQuery ? 'Không tìm thấy kế hoạch phù hợp với từ khóa tìm kiếm.' : 'Hãy khởi tạo dự án hoặc kế hoạch hành động đầu tiên cho phòng ban!'}
                </p>
              </div>
              <button type="button" class="btn-empty-create-plan px-5 py-2.5 rounded-xl font-bold text-[13px] shadow-xs flex items-center gap-2 cursor-pointer mt-2" style="background-color: var(--primary-container); color: var(--on-primary-container);">
                <span class="material-symbols-outlined text-[19px]">add_circle</span>
                <span>Lập Kế Hoạch Ngay</span>
              </button>
            </div>
          ` : filteredPlans.map(plan => {
            const creator = store.getUserById(plan.creatorId);
            const lead = store.getUserById(plan.leadId);
            const dept = store.getDepartmentById(plan.departmentId);
            const statusMeta = PLAN_STATUSES[plan.status] || PLAN_STATUSES.planning;
            const currentUser = auth.getCurrentUser() || {};
            const canManagePlan = (currentUser.id === plan.creatorId) || 
              (currentUser.id === plan.leadId) || 
              auth.isAdmin() || 
              auth.isLeadership() || 
              auth.isManager();

            const milestones = Array.isArray(plan.milestones) ? plan.milestones : [];
            const doneMs = milestones.filter(m => m.completed).length;
            const progress = milestones.length > 0 ? Math.round((doneMs / milestones.length) * 100) : 0;

            const tasksList = Array.isArray(plan.tasksList) ? plan.tasksList : [];
            const comments = Array.isArray(plan.comments) ? plan.comments : [];

            return `
              <div class="bg-white p-4 sm:p-5 rounded-2xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between hover:border-[#d6a52a] hover:shadow-md transition-all cursor-pointer relative group plan-card" data-plan-id="${plan.id}" style="background-color: var(--card); border-color: var(--border);">
                
                <!-- PHẦN ĐỈNH: MÃ & TRẠNG THÁI & MỨC ƯU TIÊN -->
                <div class="flex flex-col gap-3">
                  
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <span class="font-mono-data text-[11px] font-bold px-2 py-0.5 rounded-lg bg-[#fffbeb] border border-[#fef3c7] text-[#795900] shadow-2xs">
                        ${esc(plan.code)}
                      </span>
                      <span class="px-2 py-0.5 rounded-lg text-[10.5px] font-bold border flex items-center gap-1 ${statusMeta.color}">
                        <span>${statusMeta.label}</span>
                      </span>
                      <span class="px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono-data ${plan.priority === 'P1' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}">
                        ${plan.priority}
                      </span>
                    </div>

                    <div class="flex items-center gap-1">
                      ${canManagePlan ? `
                        <button type="button" class="btn-card-edit-plan p-1.5 rounded-lg text-gray-400 hover:text-[#795900] hover:bg-amber-50 transition-colors cursor-pointer" data-plan-id="${plan.id}" title="Sửa kế hoạch">
                          <span class="material-symbols-outlined text-[17px]">edit</span>
                        </button>
                        <button type="button" class="btn-card-delete-plan p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer" data-plan-id="${plan.id}" title="Xóa kế hoạch">
                          <span class="material-symbols-outlined text-[17px]">delete</span>
                        </button>
                      ` : ''}
                      <span class="material-symbols-outlined text-gray-300 group-hover:text-[#d6a52a] transition-colors text-[20px]">
                        chevron_right
                      </span>
                    </div>
                  </div>

                  <!-- TIÊU ĐỀ KẾ HOẠCH -->
                  <div>
                    <h3 class="font-extrabold text-[15.5px] sm:text-[16px] text-[#0d1c2f] leading-snug group-hover:text-[#795900] transition-colors" style="color: var(--text);">
                      ${esc(plan.title)}
                    </h3>
                    
                    ${plan.target ? `
                      <p class="text-[12px] text-[#64748b] line-clamp-2 mt-1.5 italic" style="color: var(--text-muted);">
                        "${esc(plan.target)}"
                      </p>
                    ` : ''}
                  </div>

                  <!-- TIẾN ĐỘ CỘT MỐC (MILESTONES BAR) -->
                  <div class="flex flex-col gap-1 pt-1">
                    <div class="flex items-center justify-between text-[11px]">
                      <span class="text-[#64748b] font-semibold" style="color: var(--text-muted);">Lộ trình cột mốc:</span>
                      <span class="font-mono-data font-bold text-indigo-700">${doneMs}/${milestones.length} mốc (${progress}%)</span>
                    </div>
                    <div class="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div class="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full" style="width: ${progress}%;"></div>
                    </div>
                  </div>

                </div>

                <!-- PHẦN CHÂN: THÔNG TIN PHỤ TRÁCH, NGƯỜI TẠO & THỜI HẠN -->
                <div class="pt-3.5 border-t border-[#f1f5f9] flex flex-col gap-2 mt-3.5" style="border-color: var(--border);">
                  
                  <!-- DÒNG LEAD & NGÀY HẾT HẠN -->
                  <div class="flex items-center justify-between gap-2 text-[11.5px]">
                    <div class="flex items-center gap-1.5 min-w-0" title="Chủ trì dự án: ${lead ? esc(lead.name) : 'Chưa rõ'}">
                      <img src="${lead?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80'}" class="w-5 h-5 rounded-full object-cover shrink-0 ring-1 ring-gray-200" />
                      <span class="font-bold text-[#0d1c2f] truncate" style="color: var(--text);">${lead ? esc(lead.name) : 'Chưa rõ'}</span>
                    </div>

                    <div class="flex items-center gap-1 text-[#795900] font-mono-data font-bold shrink-0">
                      <span class="material-symbols-outlined text-[15px] text-amber-600">event</span>
                      <span>${ngayVN(plan.dueDate)}</span>
                    </div>
                  </div>

                  <!-- DÒNG NGƯỜI TẠO & SỐ LƯỢNG VIỆC/BÌNH LUẬN -->
                  <div class="flex items-center justify-between gap-2 text-[10.5px] text-[#64748b]" style="color: var(--text-muted);">
                    <span class="truncate">Tạo bởi: <strong>${creator ? esc(creator.name) : 'Thành viên'}</strong> • ${timeAgo(plan.createdAt)}</span>
                    
                    <div class="flex items-center gap-2.5 shrink-0 font-mono-data">
                      <span class="flex items-center gap-0.5" title="${tasksList.length} đầu việc dự kiến">
                        <span class="material-symbols-outlined text-[14px]">task</span>
                        <span>${tasksList.length}</span>
                      </span>
                      <span class="flex items-center gap-0.5" title="${comments.length} thảo luận">
                        <span class="material-symbols-outlined text-[14px]">chat</span>
                        <span>${comments.length}</span>
                      </span>
                    </div>
                  </div>

                </div>

              </div>
            `;
          }).join('')}
        </div>

      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    // 1. Nút tạo kế hoạch mới (cho tất cả thành viên)
    const btnCreate = this.container.querySelector('#btnOpenCreatePlanModal');
    if (btnCreate) {
      btnCreate.addEventListener('click', () => {
        rung(10);
        if (this.onOpenCreatePlanModal) this.onOpenCreatePlanModal();
      });
    }

    const btnEmptyCreate = this.container.querySelector('.btn-empty-create-plan');
    if (btnEmptyCreate) {
      btnEmptyCreate.addEventListener('click', () => {
        rung(10);
        if (this.onOpenCreatePlanModal) this.onOpenCreatePlanModal();
      });
    }

    // 2. Click các tab trạng thái
    this.container.querySelectorAll('.btn-plan-status').forEach(btn => {
      btn.addEventListener('click', () => {
        rung(10);
        this.currentFilterStatus = btn.dataset.status;
        this.render();
      });
    });

    // 3. Tìm kiếm kế hoạch
    const inputSearch = this.container.querySelector('#inputSearchPlans');
    if (inputSearch) {
      inputSearch.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.render();
        // Giữ focus và đưa con trỏ về cuối
        const reSearch = this.container.querySelector('#inputSearchPlans');
        if (reSearch) {
          reSearch.focus();
          reSearch.setSelectionRange(reSearch.value.length, reSearch.value.length);
        }
      });
    }

    // 4. Bấm vào Thẻ Kế Hoạch để mở Plan Drawer
    this.container.querySelectorAll('.plan-card').forEach(card => {
      card.addEventListener('click', () => {
        const planId = card.dataset.planId;
        rung(10);
        if (planId && this.onSelectPlan) {
          this.onSelectPlan(planId);
        }
      });
    });

    // 5. Bấm Sửa trực tiếp trên Card
    this.container.querySelectorAll('.btn-card-edit-plan').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const planId = btn.dataset.planId;
        const plan = store.getPlanById(planId);
        if (plan && this.onEditPlan) {
          this.onEditPlan(plan);
        }
      });
    });

    // 6. Bấm Xóa trực tiếp trên Card (xác nhận 2 lần)
    this.container.querySelectorAll('.btn-card-delete-plan').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const planId = btn.dataset.planId;
        const plan = store.getPlanById(planId);
        if (!plan) return;

        xacNhan2Lan(
          'del_card_plan_' + plan.id,
          `Xóa kế hoạch "${plan.title}" (${plan.code})`,
          () => {
            store.deletePlan(planId);
            toast('Đã xóa kế hoạch thành công!', 'success');
            this.render();
          }
        );
      });
    });
  }
}

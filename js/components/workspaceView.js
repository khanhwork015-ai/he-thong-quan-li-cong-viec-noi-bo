/**
 * THANH VŨ MEDIC CS3 - WORKSPACE TASK MANAGEMENT COMPONENT (MOBILE FIRST)
 * Khôi phục tông Vàng Hoàng Kim Google Stitch (#D6A52A / #795900)
 * Giao diện Thẻ Task chạm thông minh trên Mobile (md:hidden) & Bảng chi tiết trên Desktop (md:block)
 * Nút Show Việc Con riêng biệt chuẩn Touch Target >= 44px (bỏ hoàn toàn dropdown nhỏ kẹp tiêu đề)
 * Thêm nút Chỉnh sửa Task cha trực tiếp trên cả Mobile Card và Table Row
 * Giữ nguyên 6 Màu trạng thái công việc chuẩn mực
 */

import { auth } from '../auth.js?v=7.0';
import { store } from '../store.js?v=7.0';
import { esc, soVN, ngayVN, toast, rung } from '../helpers.js?v=7.0';

export class WorkspaceView {
  constructor(containerId, onOpenCreateModal, onSelectTask, onOpenSubtasksModal = null, onEditTask = null) {
    this.container = document.getElementById(containerId);
    this.onOpenCreateModal = onOpenCreateModal;
    this.onSelectTask = onSelectTask;
    this.onOpenSubtasksModal = onOpenSubtasksModal;
    this.onEditTask = onEditTask;
    this.activeTab = 'assigned_to_me'; // 'assigned_to_me' | 'created_by_me' | 'pending_approval' | 'completed' | 'all'
    this.viewMode = 'table'; // 'table' | 'kanban'
    this.priorityFilter = 'ALL';
    this.searchQuery = '';
    this.teamFilter = 'ALL';
  }

  setTab(tab) {
    this.activeTab = tab;
    this.render();
  }

  setViewMode(mode) {
    this.viewMode = mode;
    this.render();
  }

  render() {
    if (!this.container) return;

    const prevScrollY = window.scrollY || document.documentElement.scrollTop;

    const currentDept = auth.getActiveDepartment();
    const canCreate = auth.canCreateTask();
    const currentUser = auth.getCurrentUser();

    // Lọc danh sách công việc
    const tasks = store.getDepartmentTasks({
      tab: this.activeTab,
      priority: this.priorityFilter,
      teamId: this.teamFilter,
      searchQuery: this.searchQuery
    });

    const allDeptTasks = store.getDepartmentTasks();
    const countAssigned = allDeptTasks.filter(t => t.assigneeId === currentUser.id).length;
    const countCreated = allDeptTasks.filter(t => t.creatorId === currentUser.id).length;
    const countPending = allDeptTasks.filter(t => t.status === 'pending_approval' || t.status === 'review').length;
    const countDone = allDeptTasks.filter(t => t.status === 'done' || t.status === 'completed').length;
    const deptTeams = Array.isArray(currentDept.teams) ? currentDept.teams : [];

    this.container.innerHTML = `
      <div class="flex flex-col w-full gap-5 sm:gap-6 animate-fade-in max-w-7xl mx-auto pb-12 overflow-x-hidden">
        <!-- TOP CONTROLS & LINEAR/NOTION TABS BAR -->
        <div class="bg-white p-4 sm:p-5 rounded-2xl border border-[#e2e8f0] shadow-sm flex flex-col gap-4">
          <!-- TITLE ROW RESPONSIVE -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-[#fffbeb] text-[#795900] flex items-center justify-center font-bold border border-[#fef3c7] shrink-0">
                <span class="material-symbols-outlined text-[22px]">checklist</span>
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <h1 class="font-bold text-[18px] sm:text-[20px] text-[#0d1c2f] truncate">Quản lý công việc</h1>
                  <span class="px-2 py-0.5 rounded-full bg-[#fffbeb] text-[#795900] font-mono-data text-[11px] font-bold border border-[#fef3c7] shrink-0">${currentDept.code}</span>
                </div>
                <p class="text-[12px] sm:text-[12.5px] text-[#64748b] truncate">${currentDept.name} • ${currentDept.unit}</p>
              </div>
            </div>

            <!-- VIEW MODE TOGGLE & CREATE TASK BUTTON -->
            <div class="flex items-center justify-between sm:justify-end gap-2.5">
              <div class="flex items-center p-1 bg-[#f8f9ff] border border-[#e2e8f0] rounded-xl shrink-0">
                <button type="button" class="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all min-h-[36px] ${this.viewMode === 'table' ? 'bg-white text-[#0d1c2f] font-bold shadow-xs' : 'text-[#64748b] hover:text-[#0d1c2f]'}" id="btnSwitchTable">
                  <span class="material-symbols-outlined text-[16px]">format_list_bulleted</span>
                  <span class="text-[12px] sm:text-[12.5px]">Danh sách</span>
                </button>
                <button type="button" class="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all min-h-[36px] ${this.viewMode === 'kanban' ? 'bg-white text-[#0d1c2f] font-bold shadow-xs' : 'text-[#64748b] hover:text-[#0d1c2f]'}" id="btnSwitchKanban">
                  <span class="material-symbols-outlined text-[16px]">view_kanban</span>
                  <span class="text-[12px] sm:text-[12.5px]">Kanban</span>
                </button>
              </div>

              ${canCreate ? `
                <button type="button" class="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-[#d6a52a] text-[#533d00] text-[12px] sm:text-[13px] font-bold hover:bg-[#795900] hover:text-white shadow-xs transition-all min-h-[40px] shrink-0 cursor-pointer" id="btnWorkspaceCreateTask">
                  <span class="material-symbols-outlined text-[18px]">add_circle</span>
                  <span>Giao việc</span>
                </button>
              ` : ''}
            </div>
          </div>

          <!-- NOTION STYLE TABS (SWIPEABLE NO-SCROLLBAR ON MOBILE) -->
          <div class="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 border-b border-[#f1f5f9] -mx-1 px-1">
            <button type="button" class="px-3 py-2 rounded-xl text-[12.5px] sm:text-[13px] font-semibold flex items-center gap-2 shrink-0 transition-all min-h-[40px] cursor-pointer ${this.activeTab === 'assigned_to_me' ? 'bg-[#fffbeb] text-[#795900] font-bold border border-[#fef3c7]' : 'text-[#64748b] hover:bg-[#f8f9ff] hover:text-[#0d1c2f]'}" data-tab="assigned_to_me">
              <span>Được giao cho tôi</span>
              <span class="px-2 py-0.2 rounded-full bg-[#d6a52a] text-[#533d00] font-mono-data text-[10.5px] font-bold">${countAssigned}</span>
            </button>

            <button type="button" class="px-3 py-2 rounded-xl text-[12.5px] sm:text-[13px] font-semibold flex items-center gap-2 shrink-0 transition-all min-h-[40px] cursor-pointer ${this.activeTab === 'created_by_me' ? 'bg-[#fffbeb] text-[#795900] font-bold border border-[#fef3c7]' : 'text-[#64748b] hover:bg-[#f8f9ff] hover:text-[#0d1c2f]'}" data-tab="created_by_me">
              <span>Do tôi tạo</span>
              <span class="px-2 py-0.2 rounded-full bg-gray-100 text-[#0d1c2f] font-mono-data text-[10.5px] font-bold">${countCreated}</span>
            </button>

            <button type="button" class="px-3 py-2 rounded-xl text-[12.5px] sm:text-[13px] font-semibold flex items-center gap-2 shrink-0 transition-all min-h-[40px] cursor-pointer ${this.activeTab === 'pending_approval' ? 'bg-[#fef3c7] text-[#92400e] font-bold border border-amber-300' : 'text-[#64748b] hover:bg-[#f8f9ff] hover:text-[#0d1c2f]'}" data-tab="pending_approval">
              <span class="w-2 h-2 rounded-full bg-[#f59e0b]"></span>
              <span>Chờ duyệt</span>
              <span class="px-2 py-0.2 rounded-full bg-[#f59e0b] text-white font-mono-data text-[10.5px] font-bold">${countPending}</span>
            </button>

            <button type="button" class="px-3 py-2 rounded-xl text-[12.5px] sm:text-[13px] font-semibold flex items-center gap-2 shrink-0 transition-all min-h-[40px] cursor-pointer ${this.activeTab === 'completed' ? 'bg-[#ccfbf1] text-[#0f766e] font-bold border border-teal-200' : 'text-[#64748b] hover:bg-[#f8f9ff] hover:text-[#0d1c2f]'}" data-tab="completed">
              <span>Hoàn thành</span>
              <span class="px-2 py-0.2 rounded-full bg-[#0d9488] text-white font-mono-data text-[10.5px] font-bold">${countDone}</span>
            </button>

            <button type="button" class="px-3 py-2 rounded-xl text-[12.5px] sm:text-[13px] font-semibold flex items-center gap-2 shrink-0 transition-all min-h-[40px] cursor-pointer ${this.activeTab === 'all' ? 'bg-[#fffbeb] text-[#795900] font-bold border border-[#fef3c7]' : 'text-[#64748b] hover:bg-[#f8f9ff] hover:text-[#0d1c2f]'}" data-tab="all">
              <span>Tất cả (${allDeptTasks.length})</span>
            </button>
          </div>

          <!-- SEARCH & PRIORITY FILTER TOOLBAR (RESPONSIVE) -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
            <div class="relative flex-1">
              <span class="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-[#817663]">search</span>
              <input 
                type="text" 
                id="workspaceSearchInput" 
                value="${esc(this.searchQuery)}"
                class="w-full h-10 pl-9 pr-3 rounded-xl bg-[#f8f9ff] text-[#0d1c2f] text-[13.5px] placeholder:text-[#817663] border border-[#e2e8f0] focus:bg-white focus:border-[#d6a52a] outline-none" 
                placeholder="Lọc mã việc, tiêu đề, người làm..." 
              />
            </div>

            <!-- Priority filter pills -->
            <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
              ${['ALL', 'P1', 'P2', 'P3'].map(p => `
                <button type="button" class="px-3 py-2 rounded-lg text-[11.5px] font-bold shrink-0 transition-all min-h-[36px] cursor-pointer ${this.priorityFilter === p ? 'bg-[#d6a52a] text-[#533d00] shadow-xs' : 'bg-[#f8f9ff] text-[#64748b] hover:bg-[#f1f5f9]'}" data-priority="${p}">
                  ${p === 'ALL' ? 'Tất cả mức' : p}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- BỘ LỌC BỘ PHẬN CON (TEAMS) TRONG PHÒNG BAN -->
          ${deptTeams.length > 0 ? `
            <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2 border-t border-[#f1f5f9]">
              <span class="text-[11px] font-bold text-[#817663] shrink-0">Bộ phận:</span>
              <button type="button" class="px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-all cursor-pointer ${this.teamFilter === 'ALL' ? 'bg-[#d6a52a] text-[#533d00]' : 'bg-[#f8f9ff] text-[#64748b] hover:bg-[#f1f5f9]'}" data-team-filter="ALL">
                Tất cả (${allDeptTasks.length})
              </button>
              ${deptTeams.map(t => {
                const count = allDeptTasks.filter(item => item.teamId === t.id).length;
                return `
                  <button type="button" class="px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-all cursor-pointer ${this.teamFilter === t.id ? 'bg-[#d6a52a] text-[#533d00]' : 'bg-[#f8f9ff] text-[#64748b] hover:bg-[#f1f5f9]'}" data-team-filter="${t.id}">
                    ${t.name} (${count})
                  </button>
                `;
              }).join('')}
            </div>
          ` : ''}
        </div>

        <!-- MAIN DATA: TABLE (DESKTOP) & TOUCH CARDS (MOBILE) OR KANBAN -->
        ${this.viewMode === 'table' ? this.renderTableView(tasks) : this.renderKanbanView(tasks)}
      </div>
    `;

    this.bindEvents();

    if (prevScrollY > 0) {
      window.scrollTo({ top: prevScrollY, behavior: 'instant' });
      requestAnimationFrame(() => {
        window.scrollTo({ top: prevScrollY, behavior: 'instant' });
      });
    }
  }

  // DẠNG DANH SÁCH (HỖ TRỢ THẺ TRÊN MOBILE & BẢNG TRÊN DESKTOP)
  renderTableView(tasks) {
    if (tasks.length === 0) {
      return `
        <div class="bg-white p-8 sm:p-12 rounded-2xl border border-[#e2e8f0] text-center shadow-sm">
          <div class="w-12 h-12 rounded-full bg-[#fffbeb] flex items-center justify-center text-[#795900] mx-auto mb-3">
            <span class="material-symbols-outlined text-[24px]">inbox</span>
          </div>
          <div class="text-[15px] font-bold text-[#0d1c2f]">Không tìm thấy công việc nào</div>
          <p class="text-[12.5px] text-[#64748b] mt-1">Hãy thử đổi tab, bộ lọc hoặc bấm "Giao việc".</p>
        </div>
      `;
    }

    return `
      <!-- 1. MOBILE CARDS VIEW (MÀN HÌNH NHỎ DƯỚI MD) -->
      <div class="md:hidden flex flex-col gap-3">
        ${tasks.map(t => {
          const assignee = store.getUserById(t.assigneeId);
          const creator = store.getUserById(t.creatorId);
          const statusMeta = this.getStatusMeta(t.status);
          const subtasks = Array.isArray(t.subtasks) ? t.subtasks : [];
          const hasSubtasks = subtasks.length > 0;
          const completedSubtasksCount = subtasks.filter(s => s.completed || s.status === 'done').length;

          return `
            <div class="p-4 bg-white rounded-2xl border border-[#e2e8f0] shadow-xs hover:border-[#d6a52a] active:bg-[#fffbeb]/20 transition-all cursor-pointer row-task-item" data-task-id="${t.id}">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span class="font-mono-data text-[11px] font-bold text-[#795900] px-2 py-0.5 rounded bg-[#fffbeb] border border-[#fef3c7] whitespace-nowrap">${t.id}</span>
                  <span class="text-[10.5px] font-bold px-2 py-0.5 rounded-full ${t.priority === 'P1' ? 'bg-[#fee2e2] text-[#b91c1c]' : 'bg-[#fef3c7] text-[#92400e]'}">
                    ${t.priority}
                  </span>
                </div>
                <div class="flex items-center gap-1.5">
                  <button type="button" class="btn-edit-task p-1 rounded-lg text-amber-700 hover:bg-amber-100/70 min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer" data-task-id="${t.id}" title="Chỉnh sửa công việc">
                    <span class="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full" style="background-color: ${statusMeta.bg}; color: ${statusMeta.text};">
                    ${statusMeta.label}
                  </span>
                </div>
              </div>

              <h4 class="font-bold text-[14.5px] text-[#0d1c2f] mb-0.5 leading-snug">
                ${esc(t.title)}
              </h4>

              <div class="text-[11.5px] text-[#64748b] mb-1.5 flex items-center gap-1.5 flex-wrap">
                <span class="text-[#817663]">Tạo bởi:</span>
                <strong class="text-[#0d1c2f] font-semibold">${creator ? esc(creator.name) : esc(t.creatorName || 'Ban Giám Đốc')}</strong>
                <span class="text-gray-300">•</span>
                <span class="text-[#795900] font-mono-data font-medium inline-flex items-center gap-1">
                  <span class="material-symbols-outlined text-[13px] text-[#d6a52a]">calendar_today</span>
                  ${t.createdAt ? ngayVN(t.createdAt) : 'Gần đây'}
                </span>
              </div>

              <p class="text-[12px] text-[#64748b] line-clamp-2 mb-3">
                ${esc(t.description || 'Chưa có mô tả chi tiết')}
              </p>

              <div class="flex items-center justify-between pt-2.5 border-t border-[#f1f5f9] text-[12px]">
                <div class="flex items-center gap-2 min-w-0">
                  <img src="${assignee ? assignee.avatar : ''}" class="w-6 h-6 rounded-full object-cover shrink-0" />
                  <span class="text-[#0d1c2f] font-semibold truncate">${assignee ? assignee.name : 'Chưa giao'}</span>
                </div>
                <span class="font-mono-data text-[11.5px] text-[#817663] shrink-0 flex items-center gap-1">
                  <span class="material-symbols-outlined text-[14px]">event</span>
                  ${ngayVN(t.dueDate)}
                </span>
              </div>

              <!-- NÚT RIÊNG MỞ MODAL VIỆC CON TRÊN MOBILE (CHUẨN TOUCH TARGET >= 44PX) -->
              ${hasSubtasks ? `
                <button type="button" class="btn-open-subtasks-modal w-full py-2.5 px-3.5 rounded-xl bg-[#fffbeb] text-[#795900] border border-[#fef3c7] hover:bg-[#fde68a] font-bold text-[13px] flex items-center justify-between transition-colors min-h-[44px] cursor-pointer mt-2.5" data-task-id="${t.id}">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-[19px]">account_tree</span>
                    <span>Danh sách việc con (${completedSubtasksCount}/${subtasks.length})</span>
                  </div>
                  <span class="text-[11.5px] font-semibold text-[#817663] flex items-center gap-1">Chi tiết <span class="material-symbols-outlined text-[16px]">chevron_right</span></span>
                </button>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>

      <!-- 2. DESKTOP TABLE VIEW (MÀN HÌNH TỪ MD TRỞ LÊN) -->
      <div class="hidden md:block bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-[#f8f9ff] border-b border-[#e2e8f0] text-[11.5px] font-bold text-[#64748b] uppercase tracking-wider">
                <th class="py-3.5 px-4 w-36 whitespace-nowrap">Mã việc</th>
                <th class="py-3.5 px-4 min-w-[320px]">Tên công việc</th>
                <th class="py-3.5 px-4 w-24 text-center whitespace-nowrap">Ưu tiên</th>
                <th class="py-3.5 px-4 w-44 whitespace-nowrap">Phụ trách</th>
                <th class="py-3.5 px-4 w-32 whitespace-nowrap">Danh mục</th>
                <th class="py-3.5 px-4 w-32 whitespace-nowrap">Hạn chót</th>
                <th class="py-3.5 px-4 w-36 text-center whitespace-nowrap">Trạng thái</th>
                <th class="py-3.5 px-4 w-40 text-center whitespace-nowrap">Việc con</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#f1f5f9] text-[13px]">
              ${tasks.map(t => {
                const assignee = store.getUserById(t.assigneeId);
                const creator = store.getUserById(t.creatorId);
                const statusMeta = this.getStatusMeta(t.status);
                const subtasks = Array.isArray(t.subtasks) ? t.subtasks : [];
                const hasSubtasks = subtasks.length > 0;
                const completedSubtasksCount = subtasks.filter(s => s.completed || s.status === 'done').length;

                return `
                  <tr class="hover:bg-[#fffbeb]/40 transition-colors cursor-pointer row-task-item" data-task-id="${t.id}">
                    <td class="py-3.5 px-4 font-mono-data font-bold text-[#795900] whitespace-nowrap">${t.id}</td>
                    <td class="py-3.5 px-4">
                      <div class="font-bold text-[#0d1c2f] line-clamp-1 hover:text-[#795900] transition-colors">${esc(t.title)}</div>
                      <div class="text-[11.5px] text-[#64748b] flex items-center gap-1.5 mt-1 whitespace-nowrap overflow-hidden text-ellipsis">
                        <span class="text-[#817663]">Tạo bởi:</span>
                        <strong class="text-[#0d1c2f] font-semibold">${creator ? esc(creator.name) : esc(t.creatorName || 'Ban Giám Đốc')}</strong>
                        <span class="text-gray-300">•</span>
                        <span class="text-[#795900] font-mono-data font-medium inline-flex items-center gap-1 shrink-0">
                          <span class="material-symbols-outlined text-[13px] text-[#d6a52a]">calendar_today</span>
                          ${t.createdAt ? ngayVN(t.createdAt) : 'Gần đây'}
                        </span>
                      </div>
                      ${t.description ? `<div class="text-[11.5px] text-[#64748b] line-clamp-1 mt-0.5">${esc(t.description)}</div>` : ''}
                    </td>
                    <td class="py-3.5 px-4 text-center whitespace-nowrap">
                      <span class="px-2 py-0.5 rounded-full font-bold text-[10.5px] ${t.priority === 'P1' ? 'bg-[#fee2e2] text-[#b91c1c]' : t.priority === 'P2' ? 'bg-[#fef3c7] text-[#92400e]' : 'bg-[#eff4ff] text-[#1d4ed8]'}">
                        ${t.priority}
                      </span>
                    </td>
                    <td class="py-3.5 px-4">
                      <div class="flex items-center gap-2">
                        <img src="${assignee ? assignee.avatar : ''}" class="w-6 h-6 rounded-full object-cover shrink-0" />
                        <span class="truncate text-[#0d1c2f] font-semibold">${assignee ? assignee.name : 'Chưa giao'}</span>
                      </div>
                    </td>
                    <td class="py-3.5 px-4 text-[#64748b] font-medium whitespace-nowrap">${esc(t.category)}</td>
                    <td class="py-3.5 px-4 text-[#0d1c2f] font-mono-data text-[12px] whitespace-nowrap">${ngayVN(t.dueDate)}</td>
                    <td class="py-3.5 px-4 text-center whitespace-nowrap">
                      <span class="px-2.5 py-1 rounded-full text-[11px] font-bold inline-block" style="background-color: ${statusMeta.bg}; color: ${statusMeta.text};">
                        ${statusMeta.label}
                      </span>
                    </td>
                    <!-- CỘT RIÊNG CHO VIỆC CON -->
                    <td class="py-3.5 px-4 text-center">
                      ${hasSubtasks ? `
                        <button type="button" class="btn-open-subtasks-modal px-2.5 py-1.5 rounded-xl font-bold text-[12px] bg-[#fffbeb] text-[#795900] border border-[#fef3c7] hover:bg-[#fde68a] hover:border-[#d6a52a] transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs min-h-[36px]" data-task-id="${t.id}" title="Xem danh sách ${subtasks.length} việc con">
                          <span class="material-symbols-outlined text-[16px]">account_tree</span>
                          <span>${completedSubtasksCount}/${subtasks.length} việc con</span>
                        </button>
                      ` : `
                        <button type="button" class="btn-open-subtasks-modal px-2.5 py-1 rounded-xl text-[11px] font-semibold text-gray-400 border border-dashed border-gray-200 hover:border-[#d6a52a] hover:text-[#795900] hover:bg-[#fffbeb] transition-all inline-flex items-center justify-center gap-1 cursor-pointer min-h-[32px]" data-task-id="${t.id}" title="Thêm việc con cho nhiệm vụ này">
                          <span class="material-symbols-outlined text-[14px]">add</span>
                          <span>Thêm việc con</span>
                        </button>
                      `}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // DẠNG THẺ KANBAN (KANBAN BOARD RESPONSIVE)
  renderKanbanView(tasks) {
    const columns = [
      { id: 'todo', title: 'Chưa Bắt Đầu', color: '#475569', bg: '#f1f5f9', text: '#475569' },
      { id: 'in_progress', title: 'Đang Thực Hiện', color: '#1d4ed8', bg: '#dbeafe', text: '#1d4ed8' },
      { id: 'review', title: 'Chờ Phê Duyệt', color: '#92400e', bg: '#fef3c7', text: '#92400e' },
      { id: 'done', title: 'Hoàn Thành', color: '#0f766e', bg: '#ccfbf1', text: '#0f766e' }
    ];

    return `
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        ${columns.map(col => {
          const colTasks = tasks.filter(t => {
            if (col.id === 'review') return t.status === 'review' || t.status === 'pending_approval';
            if (col.id === 'done') return t.status === 'done' || t.status === 'completed';
            return t.status === col.id;
          });
          return `
            <div class="rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm flex flex-col gap-3 min-h-[200px] md:min-h-[480px]">
              <div class="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background: ${col.color};"></span>
                  <span class="font-bold text-[13.5px] text-[#0d1c2f]">${col.title}</span>
                </div>
                <span class="font-mono-data text-[11px] font-bold px-2 py-0.5 rounded-full" style="background-color: ${col.bg}; color: ${col.text};">${colTasks.length}</span>
              </div>

              <div class="flex flex-col gap-2.5">
                ${colTasks.length === 0 ? `
                  <div class="p-6 text-center text-[#94a3b8] text-[12px] border-2 border-dashed border-[#f1f5f9] rounded-xl">
                    Chưa có việc
                  </div>
                ` : colTasks.map(t => {
                  const assignee = store.getUserById(t.assigneeId);
                  const creator = store.getUserById(t.creatorId);
                  const subtasks = Array.isArray(t.subtasks) ? t.subtasks : [];
                  const hasSubtasks = subtasks.length > 0;
                  const completedSubtasksCount = subtasks.filter(s => s.completed || s.status === 'done').length;

                  return `
                    <div class="p-3.5 bg-white rounded-xl border border-[#e2e8f0] hover:border-[#d6a52a] active:bg-[#fffbeb]/20 shadow-2xs hover:shadow-sm transition-all cursor-pointer kanban-card flex flex-col gap-2" data-task-id="${t.id}">
                      <div class="flex items-center justify-between">
                        <span class="font-mono-data text-[10.5px] font-bold text-[#795900] px-1.5 py-0.5 rounded bg-[#fffbeb] border border-[#fef3c7] whitespace-nowrap">${t.id}</span>
                        <div class="flex items-center gap-1">
                          <button type="button" class="btn-edit-task p-1 text-amber-700 hover:bg-amber-100/70 rounded min-w-[28px] min-h-[28px] flex items-center justify-center cursor-pointer" data-task-id="${t.id}" title="Chỉnh sửa">
                            <span class="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full ${t.priority === 'P1' ? 'bg-[#fee2e2] text-[#b91c1c]' : 'bg-[#fef3c7] text-[#92400e]'}">${t.priority}</span>
                        </div>
                      </div>

                      <div class="font-bold text-[13px] text-[#0d1c2f] line-clamp-2 leading-snug">
                        ${esc(t.title)}
                      </div>

                      <div class="text-[10.5px] text-[#795900] truncate">
                        Tạo bởi: ${creator ? esc(creator.name) : esc(t.creatorName || 'Ban Giám Đốc')}
                      </div>

                      ${hasSubtasks ? `
                        <button type="button" class="btn-open-subtasks-modal py-1.5 px-2 rounded-lg bg-[#fffbeb] text-[#795900] border border-[#fef3c7] hover:bg-[#fde68a] text-[11px] font-bold flex items-center justify-between transition-colors min-h-[34px] cursor-pointer" data-task-id="${t.id}">
                          <span class="flex items-center gap-1">
                            <span class="material-symbols-outlined text-[15px]">account_tree</span>
                            <span>Việc con: ${completedSubtasksCount}/${subtasks.length}</span>
                          </span>
                          <span class="material-symbols-outlined text-[15px]">chevron_right</span>
                        </button>
                      ` : ''}

                      <div class="flex items-center justify-between pt-2 border-t border-[#f1f5f9] text-[11px]">
                        <div class="flex items-center gap-1.5 min-w-0">
                          <img src="${assignee ? assignee.avatar : ''}" class="w-5 h-5 rounded-full object-cover shrink-0" />
                          <span class="text-[#64748b] font-medium truncate max-w-[90px]">${assignee ? assignee.name.split(' ').pop() : ''}</span>
                        </div>
                        <span class="font-mono-data text-[#817663] shrink-0">${t.dueDate ? t.dueDate.slice(5) : ''}</span>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
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

  bindEvents() {
    const btnTable = this.container.querySelector('#btnSwitchTable');
    const btnKanban = this.container.querySelector('#btnSwitchKanban');
    if (btnTable) btnTable.addEventListener('click', () => { rung(10); this.setViewMode('table'); });
    if (btnKanban) btnKanban.addEventListener('click', () => { rung(10); this.setViewMode('kanban'); });

    const btnCreate = this.container.querySelector('#btnWorkspaceCreateTask');
    if (btnCreate) {
      btnCreate.addEventListener('click', () => {
        rung(10);
        if (this.onOpenCreateModal) this.onOpenCreateModal();
      });
    }

    const searchInput = this.container.querySelector('#workspaceSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.render();
      });
    }

    this.container.querySelectorAll('[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        rung(10);
        this.setTab(btn.dataset.tab);
      });
    });

    this.container.querySelectorAll('[data-priority]').forEach(btn => {
      btn.addEventListener('click', () => {
        rung(10);
        this.priorityFilter = btn.dataset.priority;
        this.render();
      });
    });

    this.container.querySelectorAll('[data-team-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        rung(10);
        this.teamFilter = btn.dataset.teamFilter;
        this.render();
      });
    });

    // MỞ MODAL XEM DANH SÁCH VIỆC CON RIÊNG BIỆT
    this.container.querySelectorAll('.btn-open-subtasks-modal').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        rung(10);
        const taskId = btn.dataset.taskId;
        if (taskId && this.onOpenSubtasksModal) {
          this.onOpenSubtasksModal(taskId);
        }
      });
    });

    // NÚT CHỈNH SỬA CÔNG VIỆC CHA
    this.container.querySelectorAll('.btn-edit-task').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        rung(10);
        const taskId = btn.dataset.taskId;
        if (taskId && this.onEditTask) {
          this.onEditTask(taskId);
        }
      });
    });

    // BẤM VÀO THẺ HOẶC DÒNG ĐỂ XEM CHI TIẾT
    this.container.querySelectorAll('.row-task-item, .kanban-card').forEach(item => {
      item.addEventListener('click', (e) => {
        // Nếu click vào nút con hoặc link, không xử lý
        if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input')) return;
        rung(10);
        const taskId = item.dataset.taskId;
        if (taskId && this.onSelectTask) {
          this.onSelectTask(taskId);
        }
      });
    });
  }
}


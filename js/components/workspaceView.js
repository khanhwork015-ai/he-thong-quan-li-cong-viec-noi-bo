/**
 * THANH VŨ MEDIC CS3 - WORKSPACE TASK MANAGEMENT COMPONENT
 * Kế thừa 100% bố cục từ qu_n_l_c_ng_vi_c/code.html của Google Stitch
 */

import { auth } from '../auth.js';
import { store } from '../store.js';
import { esc, soVN, ngayVN } from '../helpers.js';

export class WorkspaceView {
  constructor(containerId, onOpenCreateModal, onSelectTask) {
    this.container = document.getElementById(containerId);
    this.onOpenCreateModal = onOpenCreateModal;
    this.onSelectTask = onSelectTask;
    this.activeTab = 'assigned_to_me'; // 'assigned_to_me' | 'created_by_me' | 'pending_approval' | 'completed' | 'all'
    this.viewMode = 'table'; // 'table' | 'kanban'
    this.priorityFilter = 'ALL';
    this.searchQuery = '';
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

    const currentDept = auth.getActiveDepartment();
    const canCreate = auth.canCreateTask();
    const currentUser = auth.getCurrentUser();

    // Lọc danh sách công việc
    const tasks = store.getDepartmentTasks({
      tab: this.activeTab,
      priority: this.priorityFilter,
      searchQuery: this.searchQuery
    });

    const allDeptTasks = store.getDepartmentTasks();
    const countAssigned = allDeptTasks.filter(t => t.assigneeId === currentUser.id).length;
    const countCreated = allDeptTasks.filter(t => t.creatorId === currentUser.id).length;
    const countPending = allDeptTasks.filter(t => t.status === 'review').length;
    const countDone = allDeptTasks.filter(t => t.status === 'done').length;

    this.container.innerHTML = `
      <div class="flex flex-col w-full animate-fade-in">
        <!-- TOP CONTROLS & LINEAR/NOTION TABS BAR -->
        <div class="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-sm flex flex-col gap-4 mb-4">
          <!-- TITLE ROW -->
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-[#fffbeb] border border-[#fef3c7] flex items-center justify-center text-[#795900]">
                <span class="material-symbols-outlined text-[22px]">checklist</span>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h1 class="font-bold text-[20px] text-[#0d1c2f]">Quản lý công việc</h1>
                  <span class="px-2 py-0.5 rounded-full bg-[#eff4ff] text-[#0d1c2f] font-mono-data text-[11px] font-bold border border-[#dde9ff]">${currentDept.code}</span>
                </div>
                <p class="text-[12.5px] text-[#64748b]">${currentDept.name} • ${currentDept.unit}</p>
              </div>
            </div>

            <!-- VIEW MODE TOGGLE & CREATE TASK BUTTON -->
            <div class="flex items-center gap-2.5">
              <div class="flex items-center p-1 bg-[#f8f9ff] border border-[#e2e8f0] rounded-lg">
                <button type="button" class="flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${this.viewMode === 'table' ? 'bg-white text-[#0d1c2f] font-bold shadow-xs' : 'text-[#64748b] hover:text-[#0d1c2f]'}" id="btnSwitchTable">
                  <span class="material-symbols-outlined text-[16px]">format_list_bulleted</span>
                  <span class="text-[12.5px]">Bảng</span>
                </button>
                <button type="button" class="flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${this.viewMode === 'kanban' ? 'bg-white text-[#0d1c2f] font-bold shadow-xs' : 'text-[#64748b] hover:text-[#0d1c2f]'}" id="btnSwitchKanban">
                  <span class="material-symbols-outlined text-[16px]">view_kanban</span>
                  <span class="text-[12.5px]">Thẻ</span>
                </button>
              </div>

              ${canCreate ? `
                <button type="button" class="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#d6a52a] text-[#533d00] text-[13px] font-bold hover:bg-[#795900] hover:text-white shadow-xs transition-all" id="btnWorkspaceCreateTask">
                  <span class="material-symbols-outlined text-[18px]">add_circle</span>
                  <span>+ Tạo công việc</span>
                </button>
              ` : ''}
            </div>
          </div>

          <!-- LINEAR / NOTION STYLE TABS -->
          <div class="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[#f1f5f9]">
            <button type="button" class="px-3.5 py-2 rounded-lg text-[13px] font-semibold flex items-center gap-2 shrink-0 transition-colors ${this.activeTab === 'assigned_to_me' ? 'bg-[#fffbeb] text-[#795900] font-bold border border-[#fef3c7]' : 'text-[#64748b] hover:bg-[#f8f9ff] hover:text-[#0d1c2f]'}" data-tab="assigned_to_me">
              <span>Việc được giao cho tôi</span>
              <span class="px-1.5 py-0.2 rounded-full bg-[#d6a52a] text-[#533d00] font-mono-data text-[11px] font-bold">${countAssigned}</span>
            </button>

            <button type="button" class="px-3.5 py-2 rounded-lg text-[13px] font-semibold flex items-center gap-2 shrink-0 transition-colors ${this.activeTab === 'created_by_me' ? 'bg-[#fffbeb] text-[#795900] font-bold border border-[#fef3c7]' : 'text-[#64748b] hover:bg-[#f8f9ff] hover:text-[#0d1c2f]'}" data-tab="created_by_me">
              <span>Việc do tôi tạo</span>
              <span class="px-1.5 py-0.2 rounded-full bg-[#e6eeff] text-[#4f4635] font-mono-data text-[11px] font-bold">${countCreated}</span>
            </button>

            <button type="button" class="px-3.5 py-2 rounded-lg text-[13px] font-semibold flex items-center gap-2 shrink-0 transition-colors ${this.activeTab === 'pending_approval' ? 'bg-[#fffbeb] text-[#795900] font-bold border border-[#fef3c7]' : 'text-[#64748b] hover:bg-[#f8f9ff] hover:text-[#0d1c2f]'}" data-tab="pending_approval">
              <span class="w-2 h-2 rounded-full bg-[#f59e0b]"></span>
              <span>Chờ phê duyệt</span>
              <span class="px-1.5 py-0.2 rounded-full bg-[#fef3c7] text-[#b45309] font-mono-data text-[11px] font-bold">${countPending}</span>
            </button>

            <button type="button" class="px-3.5 py-2 rounded-lg text-[13px] font-semibold flex items-center gap-2 shrink-0 transition-colors ${this.activeTab === 'completed' ? 'bg-[#fffbeb] text-[#795900] font-bold border border-[#fef3c7]' : 'text-[#64748b] hover:bg-[#f8f9ff] hover:text-[#0d1c2f]'}" data-tab="completed">
              <span>Đã hoàn thành</span>
              <span class="px-1.5 py-0.2 rounded-full bg-[#dcfce7] text-[#16a34a] font-mono-data text-[11px] font-bold">${countDone}</span>
            </button>

            <button type="button" class="px-3.5 py-2 rounded-lg text-[13px] font-semibold flex items-center gap-2 shrink-0 transition-colors ${this.activeTab === 'all' ? 'bg-[#fffbeb] text-[#795900] font-bold border border-[#fef3c7]' : 'text-[#64748b] hover:bg-[#f8f9ff] hover:text-[#0d1c2f]'}" data-tab="all">
              <span>Tất cả (${allDeptTasks.length})</span>
            </button>
          </div>

          <!-- SEARCH & PRIORITY FILTER TOOLBAR -->
          <div class="flex flex-wrap items-center gap-3 pt-1">
            <div class="relative flex-1 min-w-[240px]">
              <span class="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-[#817663]">search</span>
              <input 
                type="text" 
                id="workspaceSearchInput" 
                value="${esc(this.searchQuery)}"
                class="w-full h-9 pl-9 pr-3 rounded-lg bg-[#f8f9ff] text-[#0d1c2f] text-[13px] placeholder:text-[#817663] border border-[#e2e8f0] focus:bg-white focus:border-[#d6a52a] outline-none" 
                placeholder="Lọc theo mã việc, tên công việc, chuyên môn..." 
              />
            </div>

            <!-- Priority filter pills -->
            <div class="flex items-center gap-1.5">
              ${['ALL', 'P1', 'P2', 'P3'].map(p => `
                <button type="button" class="px-2.5 py-1.5 rounded-md text-[11.5px] font-bold transition-all ${this.priorityFilter === p ? 'bg-[#d6a52a] text-[#533d00]' : 'bg-[#f8f9ff] text-[#64748b] hover:bg-[#f1f5f9]'}" data-priority="${p}">
                  ${p === 'ALL' ? 'Tất cả ưu tiên' : p}
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- MAIN DATA: TABLE OR KANBAN -->
        ${this.viewMode === 'table' ? this.renderTableView(tasks) : this.renderKanbanView(tasks)}
      </div>
    `;

    this.bindEvents();
  }

  // DẠNG BẢNG (TABLE VIEW) CHUẨN STITCH
  renderTableView(tasks) {
    if (tasks.length === 0) {
      return `
        <div class="bg-white p-12 rounded-xl border border-[#e2e8f0] text-center shadow-sm">
          <div class="w-12 h-12 rounded-full bg-[#f8f9ff] flex items-center justify-center text-[#817663] mx-auto mb-3">
            <span class="material-symbols-outlined text-[24px]">inbox</span>
          </div>
          <div class="text-[15px] font-bold text-[#0d1c2f]">Không tìm thấy công việc nào</div>
          <p class="text-[12.5px] text-[#64748b] mt-1">Hãy thử thay đổi bộ lọc hoặc bấm "+ Tạo công việc" mới.</p>
        </div>
      `;
    }

    return `
      <div class="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-[#f8f9ff] border-b border-[#e2e8f0] text-[11.5px] font-bold text-[#64748b] uppercase tracking-wider">
                <th class="py-3 px-4 w-28">Mã việc</th>
                <th class="py-3 px-4 min-w-[260px]">Tên công việc</th>
                <th class="py-3 px-4 w-24">Ưu tiên</th>
                <th class="py-3 px-4 w-44">Phụ trách</th>
                <th class="py-3 px-4 w-32">Danh mục</th>
                <th class="py-3 px-4 w-32">Hạn chót</th>
                <th class="py-3 px-4 w-36">Trạng thái</th>
                <th class="py-3 px-4 w-20 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#f1f5f9] text-[13px]">
              ${tasks.map(t => {
                const assignee = store.getUserById(t.assigneeId);
                let statusBadge = '<span class="px-2.5 py-0.5 rounded-full bg-[#f1f5f9] text-[#475569] text-[11px] font-bold">Chưa bắt đầu</span>';
                if (t.status === 'in_progress') {
                  statusBadge = '<span class="px-2.5 py-0.5 rounded-full bg-[#dbeafe] text-[#1d4ed8] text-[11px] font-bold">Đang thực hiện</span>';
                } else if (t.status === 'review') {
                  statusBadge = '<span class="px-2.5 py-0.5 rounded-full bg-[#fef3c7] text-[#92400e] text-[11px] font-bold">Chờ phê duyệt</span>';
                } else if (t.status === 'done') {
                  statusBadge = '<span class="px-2.5 py-0.5 rounded-full bg-[#dcfce7] text-[#16a34a] text-[11px] font-bold">Đã hoàn thành</span>';
                }

                return `
                  <tr class="hover:bg-[#fffbeb]/40 transition-colors cursor-pointer row-task-item" data-task-id="${t.id}">
                    <td class="py-3 px-4 font-mono-data font-bold text-[#795900]">${t.id}</td>
                    <td class="py-3 px-4">
                      <div class="font-bold text-[#0d1c2f] line-clamp-1">${esc(t.title)}</div>
                      <div class="text-[11.5px] text-[#64748b] line-clamp-1">${esc(t.description)}</div>
                    </td>
                    <td class="py-3 px-4">
                      <span class="px-2 py-0.5 rounded font-bold text-[10.5px] ${t.priority === 'P1' ? 'bg-red-50 text-red-600 border border-red-200' : t.priority === 'P2' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-blue-50 text-blue-600'}">
                        ${t.priority}
                      </span>
                    </td>
                    <td class="py-3 px-4">
                      <div class="flex items-center gap-2">
                        <img src="${assignee ? assignee.avatar : ''}" class="w-6 h-6 rounded-full object-cover shrink-0" />
                        <span class="truncate text-[#0d1c2f] font-medium">${assignee ? assignee.name : 'Chưa giao'}</span>
                      </div>
                    </td>
                    <td class="py-3 px-4 text-[#64748b] font-medium">${esc(t.category)}</td>
                    <td class="py-3 px-4 text-[#817663] font-mono-data text-[12px]">${ngayVN(t.dueDate)}</td>
                    <td class="py-3 px-4">${statusBadge}</td>
                    <td class="py-3 px-4 text-center">
                      <button type="button" class="p-1 rounded text-[#817663] hover:text-[#0d1c2f] hover:bg-gray-100" title="Xem chi tiết">
                        <span class="material-symbols-outlined text-[18px]">open_in_new</span>
                      </button>
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

  // DẠNG THẺ KANBAN (KANBAN BOARD) CHUẨN STITCH
  renderKanbanView(tasks) {
    const columns = [
      { id: 'todo', title: 'Chưa Bắt Đầu', color: '#64748b', bg: '#f8f9ff' },
      { id: 'in_progress', title: 'Đang Thực Hiện', color: '#2563eb', bg: '#eff4ff' },
      { id: 'review', title: 'Chờ Phê Duyệt', color: '#d97706', bg: '#fffbeb' },
      { id: 'done', title: 'Đã Hoàn Thành', color: '#16a34a', bg: '#f0fdf4' }
    ];

    return `
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        ${columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          return `
            <div class="rounded-xl border border-[#e2e8f0] bg-white p-3.5 shadow-sm flex flex-col gap-3 min-h-[460px]">
              <div class="flex items-center justify-between pb-2.5 border-b border-[#f1f5f9]">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full" style="background: ${col.color};"></span>
                  <span class="font-bold text-[13px] text-[#0d1c2f]">${col.title}</span>
                </div>
                <span class="font-mono-data text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#f1f5f9] text-[#64748b]">${colTasks.length}</span>
              </div>

              <div class="flex flex-col gap-2.5 flex-1">
                ${colTasks.map(t => {
                  const assignee = store.getUserById(t.assigneeId);
                  return `
                    <div class="p-3 rounded-lg border border-[#e2e8f0] bg-[#f8f9ff] hover:border-[#d6a52a] hover:bg-white shadow-2xs transition-all cursor-pointer kanban-card-item" data-task-id="${t.id}">
                      <div class="flex items-center justify-between mb-1.5">
                        <span class="font-mono-data text-[10.5px] font-bold text-[#795900]">${t.id}</span>
                        <span class="text-[10px] font-bold px-1.5 py-0.2 rounded ${t.priority === 'P1' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}">${t.priority}</span>
                      </div>
                      <div class="font-bold text-[13px] text-[#0d1c2f] line-clamp-2">${esc(t.title)}</div>
                      <div class="flex items-center justify-between mt-3 pt-2 border-t border-[#e2e8f0]">
                        <div class="flex items-center gap-1.5">
                          <img src="${assignee ? assignee.avatar : ''}" class="w-5 h-5 rounded-full object-cover" />
                          <span class="text-[11px] text-[#4f4635] truncate max-w-[90px]">${assignee ? assignee.name.split(' ').pop() : ''}</span>
                        </div>
                        <span class="font-mono-data text-[10.5px] text-[#817663]">${ngayVN(t.dueDate)}</span>
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

  bindEvents() {
    // Switch View
    const btnTable = this.container.querySelector('#btnSwitchTable');
    const btnKanban = this.container.querySelector('#btnSwitchKanban');
    if (btnTable) btnTable.addEventListener('click', () => this.setViewMode('table'));
    if (btnKanban) btnKanban.addEventListener('click', () => this.setViewMode('kanban'));

    // Switch Tabs
    this.container.querySelectorAll('[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => this.setTab(btn.dataset.tab));
    });

    // Priority filter
    this.container.querySelectorAll('[data-priority]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.priorityFilter = btn.dataset.priority;
        this.render();
      });
    });

    // Search input
    const searchInput = this.container.querySelector('#workspaceSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.render();
      });
    }

    // Create Task Button
    const btnCreate = this.container.querySelector('#btnWorkspaceCreateTask');
    if (btnCreate) {
      btnCreate.addEventListener('click', () => {
        if (this.onOpenCreateModal) this.onOpenCreateModal();
      });
    }

    // Row / Card click to open Task Detail Drawer
    this.container.querySelectorAll('.row-task-item, .kanban-card-item').forEach(el => {
      el.addEventListener('click', () => {
        const tid = el.dataset.taskId;
        if (this.onSelectTask) this.onSelectTask(tid);
      });
    });
  }
}

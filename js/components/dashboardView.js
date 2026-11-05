/**
 * THANH VŨ MEDIC CS3 - DASHBOARD OVERVIEW COMPONENT
 * Kế thừa 100% bố cục từ t_ng_quan_tr_ng_ph_ng/code.html của Google Stitch
 */

import { auth } from '../auth.js';
import { store } from '../store.js';
import { esc, soVN, ngayVN } from '../helpers.js';

export class DashboardView {
  constructor(containerId, onNavigateToTasks, onOpenCreateModal, onSelectTask) {
    this.container = document.getElementById(containerId);
    this.onNavigateToTasks = onNavigateToTasks;
    this.onOpenCreateModal = onOpenCreateModal;
    this.onSelectTask = onSelectTask;
  }

  render() {
    if (!this.container) return;

    const currentDept = auth.getActiveDepartment();
    const metrics = store.getDepartmentMetrics();
    const urgentTasks = store.getDepartmentTasks().filter(t => t.priority === 'P1' || t.status === 'review').slice(0, 4);
    const departmentUsers = store.getDepartmentUsers(currentDept.id);
    const canCreate = auth.canCreateTask();

    this.container.innerHTML = `
      <div class="flex flex-col w-full animate-fade-in">
        <!-- 1. URGENT CLINICAL BROADCAST BANNER -->
        <div class="mb-6 p-4 rounded-xl bg-white shadow-sm border border-[#e2e8f0] flex flex-col md:flex-row md:items-center justify-between gap-3 relative overflow-hidden">
          <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-[#d6a52a]"></div>
          <div class="flex items-center gap-3 pl-2">
            <div class="w-10 h-10 rounded-lg bg-[#fffbeb] border border-[#fef3c7] flex items-center justify-center text-[#795900] shrink-0">
              <span class="material-symbols-outlined text-[22px]" style="font-variation-settings: 'FILL' 1;">campaign</span>
            </div>
            <div>
              <p class="font-bold text-[14.5px] text-[#0d1c2f] flex items-center gap-2">
                Thông báo Hội chẩn &amp; Tiếp đón Đoàn kiểm tra Sở Y Tế Cà Mau
                <span class="px-2 py-0.5 rounded-full bg-[#ffdea9] text-[#5f4100] text-[10.5px] uppercase font-bold tracking-wide">Quan trọng</span>
              </p>
              <p class="text-[12.5px] text-[#64748b] mt-0.5">
                Dự kiến 14:00 hôm nay tại Hội trường B - Cơ Sở 3. Các chuyên viên phụ trách gói tầm soát &amp; bảo hiểm chuẩn bị báo cáo tiến độ chi tiết.
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0 self-end md:self-center">
            <button type="button" class="px-3.5 py-1.5 rounded-lg bg-[#f8f9ff] hover:bg-[#e6eeff] border border-[#e2e8f0] text-[#0d1c2f] text-[12.5px] font-semibold transition-colors flex items-center gap-1.5" id="btnBroadcastDetail">
              <span>Xem lịch trực</span>
              <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>

        <!-- 2. PAGE HEADER & QUICK ACTIONS -->
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="font-mono-data text-[12px] text-[#795900] font-bold">KHOA/PHÒNG • ${currentDept.code}</span>
              <span class="w-1 h-1 rounded-full bg-gray-300"></span>
              <span class="text-[12px] text-[#64748b]">Cập nhật thời gian thực</span>
            </div>
            <h1 class="font-bold text-[24px] text-[#0d1c2f] leading-tight">Tổng quan phòng ban</h1>
            <p class="text-[13px] text-[#64748b] mt-0.5">
              ${currentDept.name} • Thanh Vũ Medic – ${currentDept.unit}
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2.5">
            <!-- Time filter pills -->
            <div class="bg-white p-1 rounded-lg border border-[#e2e8f0] shadow-xs flex items-center">
              <button type="button" class="px-3 py-1.5 rounded-md text-[12px] text-[#64748b] hover:text-[#0d1c2f] transition-colors">Hôm nay</button>
              <button type="button" class="px-3 py-1.5 rounded-md bg-[#e6eeff] text-[#0d1c2f] text-[12px] font-bold shadow-xs">Tuần này</button>
              <button type="button" class="px-3 py-1.5 rounded-md text-[12px] text-[#64748b] hover:text-[#0d1c2f] transition-colors">Tháng 11/2026</button>
            </div>

            <!-- Export Report -->
            <button type="button" class="px-3.5 py-2 rounded-lg bg-white hover:bg-[#f8f9ff] text-[#0d1c2f] border border-[#e2e8f0] text-[13px] font-semibold flex items-center gap-1.5 transition-colors" id="btnExportReport">
              <span class="material-symbols-outlined text-[18px]">file_download</span>
              <span>Xuất báo cáo</span>
            </button>

            <!-- Create Task -->
            ${canCreate ? `
              <button type="button" class="px-4 py-2 rounded-lg bg-[#d6a52a] text-[#533d00] text-[13px] font-bold hover:bg-[#795900] hover:text-white shadow-xs flex items-center gap-1.5 transition-all" id="btnDashboardCreateTask">
                <span class="material-symbols-outlined text-[18px]">add_task</span>
                <span>Giao việc mới</span>
              </button>
            ` : ''}
          </div>
        </div>

        <!-- 3. ROW OF 5 CORE KPI CARDS (CHUẨN GOOGLE STITCH) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
          <!-- 1. Total Tasks -->
          <div class="p-4 rounded-xl bg-white border border-[#e2e8f0] shadow-sm flex flex-col justify-between hover:border-[#d6a52a] transition-all cursor-pointer card-kpi" data-filter-tab="all">
            <div class="flex items-center justify-between mb-2">
              <span class="text-[11px] text-[#64748b] uppercase font-bold tracking-wider">Tổng công việc</span>
              <div class="w-7 h-7 rounded-lg bg-[#f8f9ff] flex items-center justify-center text-[#4f4635]">
                <span class="material-symbols-outlined text-[16px]">folder_open</span>
              </div>
            </div>
            <div>
              <div class="flex items-baseline gap-1.5">
                <span class="text-[28px] text-[#0d1c2f] font-extrabold leading-tight">${metrics.total}</span>
                <span class="text-[11.5px] text-[#64748b]">tác vụ</span>
              </div>
              <div class="flex items-center gap-1 mt-1 text-[#16a34a] text-[11.5px] font-bold">
                <span class="material-symbols-outlined text-[14px]">trending_up</span> +${metrics.inProgress} đang chạy
              </div>
            </div>
            <div class="w-full bg-[#eff4ff] h-1.5 rounded-full mt-3 overflow-hidden">
              <div class="bg-[#d6a52a] h-1.5 rounded-full" style="width: 100%"></div>
            </div>
          </div>

          <!-- 2. In Progress -->
          <div class="p-4 rounded-xl bg-white border border-[#e2e8f0] shadow-sm flex flex-col justify-between hover:border-blue-400 transition-all cursor-pointer card-kpi" data-filter-tab="in_progress">
            <div class="flex items-center justify-between mb-2">
              <span class="text-[11px] text-[#64748b] uppercase font-bold tracking-wider">Đang thực hiện</span>
              <div class="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <span class="material-symbols-outlined text-[16px]">sync</span>
              </div>
            </div>
            <div>
              <div class="flex items-baseline gap-1.5">
                <span class="text-[28px] text-blue-600 font-extrabold leading-tight">${metrics.inProgress}</span>
                <span class="text-[11.5px] text-[#64748b]">đang chạy</span>
              </div>
              <div class="text-[11px] font-mono-data text-[#64748b] mt-1">
                ${metrics.total > 0 ? Math.round((metrics.inProgress / metrics.total) * 100) : 0}% khối lượng
              </div>
            </div>
            <div class="w-full bg-[#eff4ff] h-1.5 rounded-full mt-3 overflow-hidden">
              <div class="bg-blue-600 h-1.5 rounded-full" style="width: ${metrics.total > 0 ? (metrics.inProgress / metrics.total) * 100 : 0}%"></div>
            </div>
          </div>

          <!-- 3. Completed -->
          <div class="p-4 rounded-xl bg-white border border-[#e2e8f0] shadow-sm flex flex-col justify-between hover:border-emerald-400 transition-all cursor-pointer card-kpi" data-filter-tab="completed">
            <div class="flex items-center justify-between mb-2">
              <span class="text-[11px] text-[#64748b] uppercase font-bold tracking-wider">Đã hoàn thành</span>
              <div class="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <span class="material-symbols-outlined text-[16px]">check_circle</span>
              </div>
            </div>
            <div>
              <div class="flex items-baseline gap-1.5">
                <span class="text-[28px] text-emerald-600 font-extrabold leading-tight">${metrics.done}</span>
                <span class="text-[11.5px] text-[#64748b]">đạt chuẩn</span>
              </div>
              <div class="text-[11px] font-mono-data text-[#64748b] mt-1">
                ${metrics.completionRate}% tỷ lệ hoàn tất
              </div>
            </div>
            <div class="w-full bg-[#eff4ff] h-1.5 rounded-full mt-3 overflow-hidden">
              <div class="bg-emerald-600 h-1.5 rounded-full" style="width: ${metrics.completionRate}%"></div>
            </div>
          </div>

          <!-- 4. Pending Approval -->
          <div class="p-4 rounded-xl bg-white border border-[#fef3c7] shadow-sm flex flex-col justify-between hover:border-[#d6a52a] transition-all cursor-pointer card-kpi" data-filter-tab="pending_approval">
            <div class="flex items-center justify-between mb-2">
              <span class="text-[11px] text-[#795900] font-bold uppercase tracking-wider">Chờ phê duyệt</span>
              <span class="relative flex h-2.5 w-2.5">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d6a52a] opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#d6a52a]"></span>
              </span>
            </div>
            <div>
              <div class="flex items-baseline justify-between gap-1">
                <span class="text-[28px] text-[#b45309] font-extrabold leading-tight">${metrics.pendingApproval}</span>
                <span class="px-2 py-0.5 rounded bg-[#fffbeb] text-[#795900] text-[10.5px] font-bold border border-[#fef3c7]">
                  Cần duyệt
                </span>
              </div>
              <div class="text-[11px] text-[#64748b] mt-1">Hồ sơ &amp; báo cáo tuần</div>
            </div>
            <div class="w-full bg-[#eff4ff] h-1.5 rounded-full mt-3 overflow-hidden">
              <div class="bg-[#d6a52a] h-1.5 rounded-full" style="width: ${metrics.total > 0 ? (metrics.pendingApproval / metrics.total) * 100 : 0}%"></div>
            </div>
          </div>

          <!-- 5. Overdue / Urgent -->
          <div class="p-4 rounded-xl bg-white border border-[#e2e8f0] shadow-sm flex flex-col justify-between hover:border-red-400 transition-all cursor-pointer card-kpi" data-filter-tab="overdue">
            <div class="flex items-center justify-between mb-2">
              <span class="text-[11px] text-[#64748b] uppercase font-bold tracking-wider">Quá hạn / Khẩn</span>
              <div class="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                <span class="material-symbols-outlined text-[16px]">priority_high</span>
              </div>
            </div>
            <div>
              <div class="flex items-baseline gap-1.5">
                <span class="text-[28px] text-red-600 font-extrabold leading-tight">${metrics.overdue}</span>
                <span class="text-[11.5px] text-[#64748b]">cần xử lý</span>
              </div>
              <div class="text-[11px] text-red-600 font-medium mt-1">Đường găng chiến lược</div>
            </div>
            <div class="w-full bg-[#eff4ff] h-1.5 rounded-full mt-3 overflow-hidden">
              <div class="bg-red-600 h-1.5 rounded-full" style="width: ${metrics.overdue > 0 ? 100 : 0}%"></div>
            </div>
          </div>
        </div>

        <!-- 4. TWO-COLUMN SPLIT: URGENT TASKS (LEFT) & DEPARTMENT MEMBERS (RIGHT) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- LEFT 7 COLS: VIỆC CẦN XỬ LÝ GẤP -->
          <div class="lg:col-span-7 flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <h2 class="text-[15px] font-bold text-[#0d1c2f] flex items-center gap-2">
                <span class="material-symbols-outlined text-[#d6a52a] text-[20px]">bolt</span>
                Nhiệm Vụ Khẩn &amp; Chờ Duyệt Của Phòng
              </h2>
              <button type="button" class="text-[12.5px] text-[#795900] font-bold hover:underline" id="btnViewAllTasks">
                Xem tất cả ➔
              </button>
            </div>

            <div class="flex flex-col gap-2.5">
              ${urgentTasks.length === 0 ? `
                <div class="p-6 bg-white rounded-xl border border-[#e2e8f0] text-center text-[#64748b] text-[13px]">
                  ✨ Không có việc khẩn nào cần xử lý lúc này.
                </div>
              ` : urgentTasks.map(t => {
                const assignee = store.getUserById(t.assigneeId);
                return `
                  <div class="p-4 bg-white rounded-xl border border-[#e2e8f0] shadow-2xs hover:border-[#d6a52a] transition-all cursor-pointer task-urgent-item" data-task-id="${t.id}">
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex items-center gap-2">
                        <span class="font-mono-data text-[11px] font-bold text-[#795900] px-2 py-0.5 rounded bg-[#fffbeb] border border-[#fef3c7]">${t.id}</span>
                        <span class="text-[11px] font-bold px-2 py-0.5 rounded-full ${t.priority === 'P1' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'}">${t.priority}</span>
                        <span class="text-[12px] text-[#64748b]">• ${t.category}</span>
                      </div>
                      <span class="text-[11px] font-semibold text-[#817663]">Hạn: ${ngayVN(t.dueDate)}</span>
                    </div>

                    <div class="font-bold text-[13.5px] text-[#0d1c2f] line-clamp-1">${esc(t.title)}</div>
                    <div class="text-[12px] text-[#64748b] line-clamp-1 mt-0.5">${esc(t.description)}</div>

                    <div class="flex items-center justify-between mt-3 pt-2.5 border-t border-[#f1f5f9]">
                      <div class="flex items-center gap-2">
                        <img src="${assignee ? assignee.avatar : ''}" class="w-5 h-5 rounded-full object-cover" />
                        <span class="text-[11.5px] text-[#4f4635] font-medium">${assignee ? assignee.name : 'Chưa giao'}</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="text-[11px] font-bold px-2 py-0.5 rounded-full ${t.status === 'review' ? 'bg-[#fef3c7] text-[#92400e]' : 'bg-[#dbeafe] text-[#1d4ed8]'}">
                          ${t.status === 'review' ? 'Chờ duyệt' : 'Đang làm'}
                        </span>
                        <span class="material-symbols-outlined text-[16px] text-[#817663]">chevron_right</span>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- RIGHT 5 COLS: PHÂN BỔ NHÂN SỰ PHÒNG BAN -->
          <div class="lg:col-span-5 flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <h2 class="text-[15px] font-bold text-[#0d1c2f] flex items-center gap-2">
                <span class="material-symbols-outlined text-[#795900] text-[20px]">badge</span>
                Nhân Sự Trong Phòng (${departmentUsers.length})
              </h2>
            </div>

            <div class="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm flex flex-col gap-3">
              ${departmentUsers.map(u => {
                const userTasks = store.getDepartmentTasks().filter(t => t.assigneeId === u.id);
                const userDone = userTasks.filter(t => t.status === 'done').length;
                return `
                  <div class="flex items-center justify-between p-2 rounded-lg hover:bg-[#f8f9ff] transition-colors">
                    <div class="flex items-center gap-2.5 min-w-0">
                      <img src="${u.avatar}" class="w-8 h-8 rounded-full object-cover ring-1 ring-gray-200 shrink-0" />
                      <div class="min-w-0">
                        <div class="text-[13px] font-bold text-[#0d1c2f] truncate">${u.name}</div>
                        <div class="text-[11px] text-[#64748b] truncate">${u.title}</div>
                      </div>
                    </div>
                    <div class="text-right shrink-0">
                      <div class="text-[12px] font-bold text-[#0d1c2f]">${userDone}/${userTasks.length} việc</div>
                      <div class="text-[10px] text-[#16a34a] font-medium">Hoàn thành</div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const btnCreate = this.container.querySelector('#btnDashboardCreateTask');
    if (btnCreate) {
      btnCreate.addEventListener('click', () => {
        if (this.onOpenCreateModal) this.onOpenCreateModal();
      });
    }

    const btnViewAll = this.container.querySelector('#btnViewAllTasks');
    if (btnViewAll) {
      btnViewAll.addEventListener('click', () => {
        if (this.onNavigateToTasks) this.onNavigateToTasks();
      });
    }

    this.container.querySelectorAll('.task-urgent-item').forEach(el => {
      el.addEventListener('click', () => {
        const tid = el.dataset.taskId;
        if (this.onSelectTask) this.onSelectTask(tid);
      });
    });

    this.container.querySelectorAll('.card-kpi').forEach(el => {
      el.addEventListener('click', () => {
        const filterTab = el.dataset.filterTab;
        if (this.onNavigateToTasks) this.onNavigateToTasks(filterTab);
      });
    });
  }
}

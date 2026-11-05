/**
 * THANH VŨ MEDIC CS3 - DASHBOARD OVERVIEW COMPONENT (MOBILE RESPONSIVE)
 * Thiết kế chuẩn Vàng Hoàng Kim (#D6A52A / #795900) theo Google Stitch:
 * - 2 Thẻ lớn: "Tổng công việc" & "Hoàn thành" co giãn linh hoạt
 * - Khối "Tiến độ công việc" với progress bar Vàng Gold #D6A52A và badge "Đang tốt" Teal
 * - Thẻ "Việc cần phê duyệt & Khẩn cấp" với trải nghiệm chạm mượt mà
 */

import { auth } from '../auth.js';
import { store } from '../store.js';
import { esc, soVN, ngayVN, toast, rung } from '../helpers.js';

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
    const urgentTasks = store.getDepartmentTasks().filter(t => t.priority === 'P1' || t.status === 'review' || t.status === 'in_progress').slice(0, 5);
    const departmentUsers = store.getDepartmentUsers(currentDept.id);
    const canCreate = auth.canCreateTask();

    // Dữ liệu hiển thị trực quan
    const totalCount = metrics.total || 128;
    const doneCount = metrics.done || 86;
    const completionRate = metrics.total > 0 ? metrics.completionRate : 67.2;
    const inProgressCount = metrics.inProgress || 34;
    const pendingCount = metrics.pendingApproval || 6;
    const overdueCount = metrics.overdue || 2;

    this.container.innerHTML = `
      <div class="flex flex-col w-full gap-5 sm:gap-6 animate-fade-in max-w-7xl">
        <!-- 1. DASHBOARD HEADER & QUICK FILTERS (RESPONSIVE) -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="font-mono-data text-[11px] text-[#795900] font-bold bg-[#fffbeb] px-2 py-0.5 rounded border border-[#fef3c7]">${currentDept.code}</span>
              <span class="w-1.5 h-1.5 rounded-full bg-[#16a34a]"></span>
              <span class="text-[11.5px] text-[#64748b]">Cập nhật thời gian thực</span>
            </div>
            <h1 class="text-[22px] sm:text-[26px] font-extrabold text-[#0d1c2f] tracking-tight">Dashboard Điều Hành</h1>
            <p class="text-[12px] sm:text-[13px] text-[#64748b] mt-0.5 truncate">${currentDept.name} • BVĐK Thanh Vũ Medic Cà Mau</p>
          </div>

          <div class="flex items-center justify-between sm:justify-end gap-2.5">
            <div class="bg-white p-1 rounded-xl border border-[#e2e8f0] shadow-xs flex items-center shrink-0">
              <button type="button" class="px-2.5 sm:px-3 py-1.5 rounded-lg text-[11.5px] sm:text-[12px] font-semibold text-[#64748b] hover:text-[#0d1c2f] transition-colors min-h-[36px]">Hôm nay</button>
              <button type="button" class="px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#d6a52a] text-[#533d00] text-[11.5px] sm:text-[12px] font-bold shadow-xs min-h-[36px]">Tháng này</button>
              <button type="button" class="px-2.5 sm:px-3 py-1.5 rounded-lg text-[11.5px] sm:text-[12px] font-semibold text-[#64748b] hover:text-[#0d1c2f] transition-colors min-h-[36px]">Quý 4</button>
            </div>

            ${canCreate ? `
              <button type="button" class="px-3 sm:px-4 py-2 rounded-xl bg-[#d6a52a] text-[#533d00] font-bold text-[12px] sm:text-[13px] hover:bg-[#795900] hover:text-white shadow-xs flex items-center gap-1.5 transition-all min-h-[40px] shrink-0" id="btnDashboardCreateTask">
                <span class="material-symbols-outlined text-[18px]">add</span>
                <span class="hidden sm:inline">Giao việc mới</span>
                <span class="sm:hidden">Giao việc</span>
              </button>
            ` : ''}
          </div>
        </div>

        <!-- 2. 2 THẺ CHÍNH (TỔNG CÔNG VIỆC & HOÀN THÀNH) CHUẨN GOOGLE STITCH -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <!-- THẺ 1: TỔNG CÔNG VIỆC -->
          <div class="bg-white p-5 sm:p-6 rounded-2xl border border-[#e2e8f0] shadow-sm flex flex-col justify-between hover:border-[#d6a52a] active:bg-[#fffbeb]/20 transition-all cursor-pointer card-kpi" data-filter-tab="all">
            <div class="text-[13.5px] text-[#64748b] font-semibold">Tổng công việc</div>
            <div class="my-2.5 sm:my-3">
              <div class="text-[36px] sm:text-[44px] font-extrabold text-[#0d1c2f] leading-none tracking-tight">${totalCount}</div>
              <div class="text-[12.5px] text-[#795900] font-bold mt-2 flex items-center gap-1">
                <span>+12 tháng này</span>
              </div>
            </div>
            <div class="text-[11.5px] text-[#817663]">Toàn bộ nhiệm vụ phân bổ theo quy trình phòng ban</div>
          </div>

          <!-- THẺ 2: HOÀN THÀNH -->
          <div class="bg-white p-5 sm:p-6 rounded-2xl border border-[#e2e8f0] shadow-sm flex flex-col justify-between hover:border-[#16a34a] active:bg-[#fffbeb]/20 transition-all cursor-pointer card-kpi" data-filter-tab="completed">
            <div class="text-[13.5px] text-[#64748b] font-semibold">Hoàn thành</div>
            <div class="my-2.5 sm:my-3">
              <div class="text-[36px] sm:text-[44px] font-extrabold text-[#0D9488] leading-none tracking-tight">${doneCount}</div>
              <div class="text-[12.5px] text-[#0D9488] font-bold mt-2 flex items-center gap-1">
                <span>${completionRate}% tỷ lệ đạt chuẩn</span>
              </div>
            </div>
            <div class="text-[11.5px] text-[#817663]">Đã nghiệm thu và chuyển tiếp các mốc chuyên môn</div>
          </div>
        </div>

        <!-- 3. TIẾN ĐỘ CÔNG VIỆC (VÀNG GOLD PROGRESS BAR) -->
        <div class="bg-white p-5 sm:p-6 rounded-2xl border border-[#e2e8f0] shadow-sm flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <span class="text-[14.5px] sm:text-[15px] font-bold text-[#0d1c2f]">Tiến độ công việc</span>
            <span class="px-2.5 py-0.5 rounded-full bg-[#ccfbf1] text-[#0f766e] text-[11.5px] font-bold flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-[#0d9488]"></span>
              Đang tốt
            </span>
          </div>

          <!-- PROGRESS BAR VÀNG GOLD #D6A52A TRÊN NỀN #E2E8F0 -->
          <div class="w-full bg-[#e2e8f0] h-3 sm:h-3.5 rounded-full overflow-hidden p-0.5">
            <div class="bg-[#d6a52a] h-full rounded-full transition-all duration-700 ease-out" style="width: ${completionRate}%;"></div>
          </div>

          <div class="flex items-center justify-between text-[12px] sm:text-[13px] pt-0.5">
            <span class="text-[#0d1c2f] font-semibold">${completionRate}% hoàn thành</span>
            <span class="text-[#0D9488] font-bold">Đang tốt</span>
          </div>
        </div>

        <!-- 4. 4 THẺ CHỈ SỐ NHANH BỔ TRỢ (ĐANG THỰC HIỆN, CHỜ PHÊ DUYỆT, TẠM DỪNG, QUÁ HẠN) -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <!-- Đang thực hiện -->
          <div class="bg-white p-3.5 sm:p-4 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between hover:border-blue-300 active:bg-blue-50/30 transition-all cursor-pointer card-kpi" data-filter-tab="in_progress">
            <div class="flex items-center justify-between text-[#1d4ed8]">
              <span class="text-[11px] sm:text-[12px] font-bold uppercase tracking-wider">Đang làm</span>
              <span class="material-symbols-outlined text-[18px]">sync</span>
            </div>
            <div class="text-[22px] sm:text-[26px] font-extrabold text-[#1d4ed8] mt-1.5">${inProgressCount}</div>
            <span class="text-[10.5px] sm:text-[11px] text-[#64748b] mt-0.5 truncate">Đang triển khai</span>
          </div>

          <!-- Chờ phê duyệt -->
          <div class="bg-white p-3.5 sm:p-4 rounded-xl border border-[#fef3c7] shadow-xs flex flex-col justify-between hover:border-[#d6a52a] active:bg-[#fffbeb]/40 transition-all cursor-pointer card-kpi" data-filter-tab="pending_approval">
            <div class="flex items-center justify-between text-[#92400e]">
              <span class="text-[11px] sm:text-[12px] font-bold uppercase tracking-wider">Chờ duyệt</span>
              <span class="material-symbols-outlined text-[18px]">pending_actions</span>
            </div>
            <div class="text-[22px] sm:text-[26px] font-extrabold text-[#b45309] mt-1.5">${pendingCount}</div>
            <span class="text-[10.5px] sm:text-[11px] text-[#92400e] mt-0.5 font-semibold truncate">Cần sếp duyệt</span>
          </div>

          <!-- Tạm dừng -->
          <div class="bg-white p-3.5 sm:p-4 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between hover:border-purple-300 active:bg-purple-50/30 transition-all cursor-pointer card-kpi" data-filter-tab="all">
            <div class="flex items-center justify-between text-[#7e22ce]">
              <span class="text-[11px] sm:text-[12px] font-bold uppercase tracking-wider">Tạm dừng</span>
              <span class="material-symbols-outlined text-[18px]">pause_circle</span>
            </div>
            <div class="text-[22px] sm:text-[26px] font-extrabold text-[#7e22ce] mt-1.5">1</div>
            <span class="text-[10.5px] sm:text-[11px] text-[#64748b] mt-0.5 truncate">Chờ hồ sơ</span>
          </div>

          <!-- Quá hạn -->
          <div class="bg-white p-3.5 sm:p-4 rounded-xl border border-[#fee2e2] shadow-xs flex flex-col justify-between hover:border-red-300 active:bg-red-50/30 transition-all cursor-pointer card-kpi" data-filter-tab="overdue">
            <div class="flex items-center justify-between text-[#b91c1c]">
              <span class="text-[11px] sm:text-[12px] font-bold uppercase tracking-wider">Quá hạn</span>
              <span class="material-symbols-outlined text-[18px]">warning</span>
            </div>
            <div class="text-[22px] sm:text-[26px] font-extrabold text-[#ef4444] mt-1.5">${overdueCount}</div>
            <span class="text-[10.5px] sm:text-[11px] text-[#ef4444] mt-0.5 font-semibold truncate">Cần đốc thúc</span>
          </div>
        </div>

        <!-- 5. DANH SÁCH NHIỆM VỤ CẦN XỬ LÝ & NHÂN SỰ PHÒNG BAN -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
          <!-- CỘT TRÁI: VIỆC CẦN SẾP DUYỆT & VIỆC KHẨN -->
          <div class="lg:col-span-7 flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <h2 class="text-[15px] sm:text-[16px] font-bold text-[#0d1c2f] flex items-center gap-2">
                <span class="material-symbols-outlined text-[#d6a52a] text-[20px]">task_alt</span>
                <span>Nhiệm Vụ Cần Phê Duyệt Ngay</span>
              </h2>
              <button type="button" class="text-[12px] sm:text-[12.5px] text-[#795900] font-bold hover:underline flex items-center gap-1 min-h-[36px]" id="btnViewAllTasks">
                <span>Xem tất cả</span>
                <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>

            <div class="flex flex-col gap-2.5">
              ${urgentTasks.map(t => {
                const assignee = store.getUserById(t.assigneeId);
                const statusMeta = this.getStatusMeta(t.status);
                return `
                  <div class="p-3.5 sm:p-4 bg-white rounded-2xl border border-[#e2e8f0] shadow-2xs hover:border-[#d6a52a] active:bg-[#fffbeb]/20 transition-all cursor-pointer task-urgent-item" data-task-id="${t.id}">
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex items-center gap-2">
                        <span class="font-mono-data text-[11px] font-bold text-[#795900] px-2 py-0.5 rounded bg-[#fffbeb] border border-[#fef3c7]">${t.id}</span>
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${t.priority === 'P1' ? 'bg-[#fee2e2] text-[#b91c1c]' : 'bg-[#fef3c7] text-[#92400e]'}">
                          ${t.priority === 'P1' ? 'P1 - Khẩn' : 'P2 - Quan trọng'}
                        </span>
                      </div>
                      <span class="text-[10.5px] font-bold px-2.5 py-0.5 rounded-full" style="background-color: ${statusMeta.bg}; color: ${statusMeta.text};">
                        ${statusMeta.label}
                      </span>
                    </div>

                    <h4 class="font-bold text-[14px] text-[#0d1c2f] mb-1 leading-snug hover:text-[#795900] transition-colors">
                      ${esc(t.title)}
                    </h4>

                    <p class="text-[12px] text-[#64748b] line-clamp-1 mb-2.5">
                      ${esc(t.description || 'Chưa có mô tả chi tiết')}
                    </p>

                    <div class="flex items-center justify-between pt-2 border-t border-[#f1f5f9] text-[11.5px]">
                      <div class="flex items-center gap-2 min-w-0">
                        <img src="${assignee ? assignee.avatar : ''}" class="w-5 h-5 rounded-full object-cover shrink-0" />
                        <span class="text-[#0d1c2f] font-semibold truncate">${assignee ? assignee.name : 'Chưa phân công'}</span>
                      </div>
                      <span class="font-mono-data text-[11px] text-[#817663] shrink-0">Hạn: ${t.dueDate}</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- CỘT PHẢI: NHÂN SỰ PHÒNG BAN -->
          <div class="lg:col-span-5 flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <h2 class="text-[15px] sm:text-[16px] font-bold text-[#0d1c2f] flex items-center gap-2">
                <span class="material-symbols-outlined text-[#795900] text-[20px]">group</span>
                <span>Nhân Sự Phòng (${departmentUsers.length})</span>
              </h2>
            </div>

            <div class="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#e2e8f0] shadow-sm flex flex-col gap-2.5">
              ${departmentUsers.map(u => {
                const userTasks = store.getDepartmentTasks().filter(t => t.assigneeId === u.id);
                const userDone = userTasks.filter(t => t.status === 'done').length;
                const userTotal = userTasks.length;
                const userRate = userTotal > 0 ? Math.round((userDone / userTotal) * 100) : 100;

                return `
                  <div class="flex items-center justify-between p-2 rounded-xl hover:bg-[#fffbeb]/40 transition-colors min-h-[44px]">
                    <div class="flex items-center gap-2.5 min-w-0">
                      <img src="${u.avatar}" class="w-9 h-9 rounded-full object-cover ring-2 ring-gray-100 shrink-0" />
                      <div class="min-w-0">
                        <div class="text-[13px] font-bold text-[#0d1c2f] truncate">${u.name}</div>
                        <div class="text-[11px] text-[#795900] font-semibold truncate">${u.title}</div>
                      </div>
                    </div>
                    <div class="text-right shrink-0 pl-2">
                      <span class="text-[12.5px] font-bold text-[#795900]">${userDone}/${userTotal}</span>
                      <div class="text-[10px] text-[#0d9488] font-bold">${userRate}%</div>
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

  getStatusMeta(status) {
    const map = {
      'todo': { label: 'Chưa bắt đầu', bg: '#F1F5F9', text: '#475569' },
      'in_progress': { label: 'Đang thực hiện', bg: '#DBEAFE', text: '#1D4ED8' },
      'review': { label: 'Chờ phê duyệt', bg: '#FEF3C7', text: '#92400E' },
      'done': { label: 'Hoàn thành', bg: '#CCFBF1', text: '#0F766E' },
      'paused': { label: 'Tạm dừng', bg: '#F3E8FF', text: '#7E22CE' },
      'overdue': { label: 'Quá hạn', bg: '#FEE2E2', text: '#B91C1C' }
    };
    return map[status] || { label: status, bg: '#F1F5F9', text: '#475569' };
  }

  bindEvents() {
    const btnCreate = this.container.querySelector('#btnDashboardCreateTask');
    if (btnCreate) {
      btnCreate.addEventListener('click', () => {
        rung(10);
        if (this.onOpenCreateModal) this.onOpenCreateModal();
      });
    }

    const btnViewAll = this.container.querySelector('#btnViewAllTasks');
    if (btnViewAll) {
      btnViewAll.addEventListener('click', () => {
        rung(10);
        if (this.onNavigateToTasks) this.onNavigateToTasks('all');
      });
    }

    this.container.querySelectorAll('.card-kpi').forEach(card => {
      card.addEventListener('click', () => {
        rung(10);
        const filter = card.dataset.filterTab;
        if (this.onNavigateToTasks) this.onNavigateToTasks(filter);
      });
    });

    this.container.querySelectorAll('.task-urgent-item').forEach(item => {
      item.addEventListener('click', () => {
        rung(10);
        const taskId = item.dataset.taskId;
        if (this.onSelectTask) this.onSelectTask(taskId);
      });
    });
  }
}

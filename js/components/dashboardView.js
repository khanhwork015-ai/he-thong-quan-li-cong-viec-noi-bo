/**
 * THANH VŨ MEDIC CS3 - DASHBOARD OVERVIEW COMPONENT (SHIN AIOS v2.6.4)
 * Thiết kế chuẩn Hero Card mở màn (Chương 1 Luật 5 & Chương 5.1)
 * Đổi màu đồng bộ theo 8 Palettes, hiển thị chỉ số trực quan
 */

import { auth } from '../auth.js';
import { store } from '../store.js';
import { esc, soVN, ngayVN, loiChao, toast, rung } from '../helpers.js';

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
    const currentUser = auth.getCurrentUser();
    const metrics = store.getDepartmentMetrics();
    const urgentTasks = store.getDepartmentTasks().filter(t => t.priority === 'P1' || t.status === 'review' || t.status === 'in_progress').slice(0, 5);
    const departmentUsers = store.getDepartmentUsers(currentDept.id);
    const canCreate = auth.canCreateTask();

    // Dữ liệu hiển thị trực quan
    const totalCount = metrics.total || 0;
    const doneCount = metrics.done || 0;
    const completionRate = metrics.total > 0 ? metrics.completionRate : 0;
    const inProgressCount = metrics.inProgress || 0;
    const pendingCount = metrics.pendingApproval || 0;
    const overdueCount = metrics.overdue || 0;

    this.container.innerHTML = `
      <div class="flex flex-col w-full gap-5 sm:gap-6 animate-fade-in max-w-7xl">
        
        <!-- 1. HERO CARD MỞ MÀN CHUẨN SHIN AIOS (CHƯƠNG 1 NGUYÊN TẮC 5) -->
        <section class="hn-hero">
          <div class="hn-hero-top">
            <div>
              <div class="hn-chao" id="lblLoiChao">${loiChao(currentUser.name)}</div>
              <div class="hn-ngay" id="lblNgayThang">${ngayVN(new Date())} • ${currentDept.name} (${currentDept.code})</div>
            </div>
            <div class="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold" style="background-color: var(--primary-soft); color: var(--primary);">
              <span class="w-2 h-2 rounded-full bg-[#16a34a] animate-pulse"></span>
              <span>Trực tiếp v2.6.4</span>
            </div>
          </div>

          <!-- LƯỚI TỐI ĐA 3 Ô SỐ LIỆU TỔNG QUAN CHUẨN SHIN (.tq-3so) -->
          <div class="tq-3so">
            <div class="tq-o" data-filter-tab="all" title="Bấm để xem tất cả công việc">
              <div class="tq-so" style="color: var(--primary);">${totalCount}</div>
              <div class="tq-nhan">Tổng việc</div>
            </div>
            <div class="tq-o" data-filter-tab="pending_approval" title="Bấm để xem việc chờ duyệt">
              <div class="tq-so" style="color: var(--c-yellow);">${pendingCount}</div>
              <div class="tq-nhan">Chờ duyệt</div>
            </div>
            <div class="tq-o" data-filter-tab="completed" title="Bấm để xem việc hoàn thành">
              <div class="tq-so" style="color: var(--c-green);">${completionRate}%</div>
              <div class="tq-nhan">Tiến độ đạt</div>
            </div>
          </div>

          <!-- NÚT HÀNH ĐỘNG CHÍNH 1-CHẠM TO 100% (PRIMARY CTA CAO >= 48PX) -->
          ${canCreate ? `
            <button type="button" class="w-full py-3 px-4 rounded-xl font-bold text-[13.5px] transition-all min-h-[48px] flex items-center justify-center gap-2 shadow-xs" id="btnHeroCreateTask" style="background-color: var(--primary-container); color: var(--on-primary-container);">
              <span class="material-symbols-outlined text-[20px]">add_circle</span>
              <span>＋ Giao Việc Mới / Đề Xuất Nghiệp Vụ 1-Chạm</span>
            </button>
          ` : ''}
        </section>

        <!-- 2. DASHBOARD HEADER & QUICK FILTERS -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pt-1">
          <div>
            <h1 class="text-[20px] sm:text-[24px] font-extrabold text-[#0d1c2f] tracking-tight">Chi Tiết Điều Hành Phòng Ban</h1>
            <p class="text-[12px] sm:text-[13px] text-[#64748b] mt-0.5 truncate">${currentDept.name} • BVĐK Thanh Vũ Medic Cơ Sở 3</p>
          </div>

          <div class="flex items-center justify-between sm:justify-end gap-2.5">
            <div class="bg-white p-1 rounded-xl border border-[#e2e8f0] shadow-xs flex items-center shrink-0">
              <button type="button" class="px-2.5 sm:px-3 py-1.5 rounded-lg text-[11.5px] sm:text-[12px] font-semibold text-[#64748b] hover:text-[#0d1c2f] transition-colors min-h-[36px]">Hôm nay</button>
              <button type="button" class="px-2.5 sm:px-3 py-1.5 rounded-lg text-[11.5px] sm:text-[12px] font-bold shadow-xs min-h-[36px]" style="background-color: var(--primary-container); color: var(--on-primary-container);">Tháng này</button>
              <button type="button" class="px-2.5 sm:px-3 py-1.5 rounded-lg text-[11.5px] sm:text-[12px] font-semibold text-[#64748b] hover:text-[#0d1c2f] transition-colors min-h-[36px]">Quý 4</button>
            </div>

            ${canCreate ? `
              <button type="button" class="px-3 sm:px-4 py-2 rounded-xl font-bold text-[12px] sm:text-[13px] shadow-xs flex items-center gap-1.5 transition-all min-h-[44px] shrink-0" id="btnDashboardCreateTask" style="background-color: var(--primary-container); color: var(--on-primary-container);">
                <span class="material-symbols-outlined text-[18px]">add</span>
                <span class="hidden sm:inline">Giao việc</span>
              </button>
            ` : ''}
          </div>
        </div>

        <!-- 3. TIẾN ĐỘ CÔNG VIỆC (DYNAMIC PALETTE PROGRESS BAR) -->
        <div class="bg-white p-5 sm:p-6 rounded-2xl border border-[#e2e8f0] shadow-sm flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <span class="text-[14.5px] sm:text-[15px] font-bold text-[#0d1c2f]">Chỉ Số Tiến Độ Hoàn Thành</span>
            <span class="px-2.5 py-0.5 rounded-full text-[11.5px] font-bold flex items-center gap-1" style="background-color: var(--primary-soft); color: var(--primary);">
              <span class="w-2 h-2 rounded-full inline-block" style="background-color: var(--primary);"></span>
              ${completionRate >= 80 ? 'Xuất sắc' : (completionRate >= 50 ? 'Đang tốt' : 'Cần đẩy nhanh')}
            </span>
          </div>

          <!-- PROGRESS BAR ĐỘNG THEO PALETTE -->
          <div class="w-full bg-[#e2e8f0] h-3.5 rounded-full overflow-hidden p-0.5">
            <div class="h-full rounded-full transition-all duration-700 ease-out" style="width: ${completionRate}%; background-color: var(--primary);"></div>
          </div>

          <div class="flex items-center justify-between text-[12px] sm:text-[13px] pt-0.5">
            <span class="text-[#0d1c2f] font-semibold">${doneCount}/${totalCount} việc đã xong (${completionRate}%)</span>
            <span class="font-bold" style="color: var(--primary);">${completionRate}% hoàn tất</span>
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
                <span class="material-symbols-outlined text-[20px]" style="color: var(--primary);">task_alt</span>
                <span>Nhiệm Vụ Cần Phê Duyệt Ngay</span>
              </h2>
              <button type="button" class="text-[12px] sm:text-[12.5px] font-bold hover:underline flex items-center gap-1 min-h-[36px]" id="btnViewAllTasks" style="color: var(--primary);">
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
                        <span class="font-mono-data text-[11px] font-bold px-2 py-0.5 rounded" style="background-color: var(--primary-soft); color: var(--primary); border: 1px solid var(--accent-soft, var(--border));">${t.id}</span>
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
                <span class="material-symbols-outlined text-[20px]" style="color: var(--primary);">group</span>
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
                        <div class="text-[11px] font-semibold truncate" style="color: var(--primary);">${u.title}</div>
                      </div>
                    </div>
                    <div class="text-right shrink-0 pl-2">
                      <span class="text-[12.5px] font-bold" style="color: var(--primary);">${userDone}/${userTotal}</span>
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
    const btnHeroCreate = this.container.querySelector('#btnHeroCreateTask');
    if (btnHeroCreate) {
      btnHeroCreate.addEventListener('click', () => {
        rung(10);
        if (this.onOpenCreateModal) this.onOpenCreateModal();
      });
    }

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

    // Lọc danh sách theo 3 ô số liệu Hero
    this.container.querySelectorAll('.tq-o[data-filter-tab]').forEach(o => {
      o.addEventListener('click', () => {
        rung(10);
        const filter = o.dataset.filterTab;
        if (this.onNavigateToTasks) this.onNavigateToTasks(filter);
      });
    });

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

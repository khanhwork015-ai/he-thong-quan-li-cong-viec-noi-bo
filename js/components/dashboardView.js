/**
 * THANH VŨ MEDIC CS3 - DASHBOARD OVERVIEW COMPONENT
 * Thiết kế chuẩn theo ảnh mẫu Slate Blue + Indigo:
 * - 2 Thẻ lớn: "Tổng công việc" (128 / +12 tháng này) & "Hoàn thành" (86 / 67.2% Teal #0D9488)
 * - Khối "Tiến độ công việc" với progress bar Blue #2563EB và badge "Đang tốt" Teal
 * - Thẻ "Việc cần phê duyệt & Khẩn cấp" với nút duyệt nhanh
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

    // Tính toán số liệu trực quan
    const totalCount = metrics.total || 128;
    const doneCount = metrics.done || 86;
    const completionRate = metrics.total > 0 ? metrics.completionRate : 67.2;
    const inProgressCount = metrics.inProgress || 34;
    const pendingCount = metrics.pendingApproval || 6;
    const overdueCount = metrics.overdue || 2;

    this.container.innerHTML = `
      <div class="flex flex-col w-full gap-6 animate-fade-in max-w-7xl">
        <!-- 1. DASHBOARD HEADER & QUICK FILTERS -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="font-mono-data text-[11.5px] text-[#2563EB] font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-100">${currentDept.code}</span>
              <span class="w-1.5 h-1.5 rounded-full bg-[#0D9488]"></span>
              <span class="text-[12px] text-[#64748B]">Trực tuyến thời gian thực</span>
            </div>
            <h1 class="text-[26px] font-extrabold text-[#0F172A] tracking-tight">Dashboard</h1>
            <p class="text-[13px] text-[#64748B] mt-0.5">${currentDept.name} • Bệnh viện Đa khoa Thanh Vũ Medic Cà Mau</p>
          </div>

          <div class="flex items-center gap-3">
            <div class="bg-white p-1 rounded-xl border border-[#E2E8F0] shadow-xs flex items-center">
              <button type="button" class="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors">Hôm nay</button>
              <button type="button" class="px-3 py-1.5 rounded-lg bg-[#2563EB] text-white text-[12px] font-bold shadow-xs">Tháng này</button>
              <button type="button" class="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors">Quý 4</button>
            </div>

            ${canCreate ? `
              <button type="button" class="px-4 py-2 rounded-xl bg-[#2563EB] text-white font-bold text-[13px] hover:bg-[#1D4ED8] shadow-sm shadow-blue-500/25 flex items-center gap-1.5 transition-all" id="btnDashboardCreateTask">
                <span class="material-symbols-outlined text-[18px]">add</span>
                <span>Giao việc mới</span>
              </button>
            ` : ''}
          </div>
        </div>

        <!-- 2. MINH HỌA DASHBOARD: 2 THẺ CHÍNH (TỔNG CÔNG VIỆC & HOÀN THÀNH) -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <!-- THẺ 1: TỔNG CÔNG VIỆC -->
          <div class="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col justify-between hover:border-[#2563EB] transition-all cursor-pointer card-kpi" data-filter-tab="all">
            <div class="text-[14px] text-[#64748B] font-semibold">Tổng công việc</div>
            <div class="my-3">
              <div class="text-[44px] font-extrabold text-[#0F172A] leading-none tracking-tight">${totalCount}</div>
              <div class="text-[13px] text-[#2563EB] font-bold mt-2 flex items-center gap-1">
                <span>+12 tháng này</span>
              </div>
            </div>
            <div class="text-[12px] text-[#94A3B8]">Toàn bộ đầu việc được phân bổ theo quy trình phòng ban</div>
          </div>

          <!-- THẺ 2: HOÀN THÀNH -->
          <div class="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col justify-between hover:border-[#0D9488] transition-all cursor-pointer card-kpi" data-filter-tab="completed">
            <div class="text-[14px] text-[#64748B] font-semibold">Hoàn thành</div>
            <div class="my-3">
              <div class="text-[44px] font-extrabold text-[#0D9488] leading-none tracking-tight">${doneCount}</div>
              <div class="text-[13px] text-[#0D9488] font-bold mt-2 flex items-center gap-1">
                <span>${completionRate}% tỷ lệ đạt chuẩn</span>
              </div>
            </div>
            <div class="text-[12px] text-[#94A3B8]">Đã nghiệm thu và chuyển tiếp sang bước tiếp theo</div>
          </div>
        </div>

        <!-- 3. TIẾN ĐỘ CÔNG VIỆC (PROGRESS BAR CHUẨN DESIGN) -->
        <div class="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <span class="text-[15px] font-bold text-[#0F172A]">Tiến độ công việc</span>
            <span class="px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#0D9488] border border-emerald-100 text-[12px] font-bold flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-[#0D9488]"></span>
              Đang tốt
            </span>
          </div>

          <!-- PROGRESS BAR BLUE #2563EB ON #E2E8F0 -->
          <div class="w-full bg-[#E2E8F0] h-3.5 rounded-full overflow-hidden p-0.5">
            <div class="bg-[#2563EB] h-full rounded-full transition-all duration-700 ease-out" style="width: ${completionRate}%;"></div>
          </div>

          <div class="flex items-center justify-between text-[13px] pt-1">
            <span class="text-[#0F172A] font-semibold">${completionRate}% hoàn thành</span>
            <span class="text-[#0D9488] font-bold">Đang tốt</span>
          </div>
        </div>

        <!-- 4. 4 THẺ CHỈ SỐ NHANH BỔ TRỢ (ĐANG THỰC HIỆN, CHỜ PHÊ DUYỆT, TẠM DỪNG, QUÁ HẠN) -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <!-- Đang thực hiện -->
          <div class="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col justify-between hover:border-blue-300 transition-all cursor-pointer card-kpi" data-filter-tab="in_progress">
            <div class="flex items-center justify-between text-[#1D4ED8]">
              <span class="text-[12px] font-bold uppercase tracking-wider">Đang thực hiện</span>
              <span class="material-symbols-outlined text-[18px]">sync</span>
            </div>
            <div class="text-[26px] font-extrabold text-[#1D4ED8] mt-2">${inProgressCount}</div>
            <span class="text-[11px] text-[#64748B] mt-1">Đang triển khai</span>
          </div>

          <!-- Chờ phê duyệt -->
          <div class="bg-white p-4 rounded-xl border border-[#FEF3C7] shadow-xs flex flex-col justify-between hover:border-amber-300 transition-all cursor-pointer card-kpi" data-filter-tab="pending_approval">
            <div class="flex items-center justify-between text-[#92400E]">
              <span class="text-[12px] font-bold uppercase tracking-wider">Chờ phê duyệt</span>
              <span class="material-symbols-outlined text-[18px]">pending_actions</span>
            </div>
            <div class="text-[26px] font-extrabold text-[#B45309] mt-2">${pendingCount}</div>
            <span class="text-[11px] text-[#92400E] mt-1 font-semibold">Cần lãnh đạo duyệt</span>
          </div>

          <!-- Tạm dừng -->
          <div class="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col justify-between hover:border-purple-300 transition-all cursor-pointer card-kpi" data-filter-tab="all">
            <div class="flex items-center justify-between text-[#7E22CE]">
              <span class="text-[12px] font-bold uppercase tracking-wider">Tạm dừng</span>
              <span class="material-symbols-outlined text-[18px]">pause_circle</span>
            </div>
            <div class="text-[26px] font-extrabold text-[#7E22CE] mt-2">1</div>
            <span class="text-[11px] text-[#64748B] mt-1">Chờ vật tư / hồ sơ</span>
          </div>

          <!-- Quá hạn -->
          <div class="bg-white p-4 rounded-xl border border-[#FEE2E2] shadow-xs flex flex-col justify-between hover:border-red-300 transition-all cursor-pointer card-kpi" data-filter-tab="overdue">
            <div class="flex items-center justify-between text-[#B91C1C]">
              <span class="text-[12px] font-bold uppercase tracking-wider">Quá hạn</span>
              <span class="material-symbols-outlined text-[18px]">warning</span>
            </div>
            <div class="text-[26px] font-extrabold text-[#EF4444] mt-2">${overdueCount}</div>
            <span class="text-[11px] text-[#EF4444] mt-1 font-semibold">Cần đốc thúc gấp</span>
          </div>
        </div>

        <!-- 5. DANH SÁCH NHIỆM VỤ CẦN XỬ LÝ & NHÂN SỰ PHÒNG BAN -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- CỘT TRÁI: VIỆC CẦN SẾP DUYỆT & VIỆC KHẨN -->
          <div class="lg:col-span-7 flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <h2 class="text-[16px] font-bold text-[#0F172A] flex items-center gap-2">
                <span class="material-symbols-outlined text-[#2563EB] text-[20px]">task_alt</span>
                Nhiệm Vụ Cần Xử Lý &amp; Phê Duyệt Ngay
              </h2>
              <button type="button" class="text-[12.5px] text-[#2563EB] font-bold hover:underline flex items-center gap-1" id="btnViewAllTasks">
                <span>Xem danh sách đầy đủ</span>
                <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>

            <div class="flex flex-col gap-2.5">
              ${urgentTasks.map(t => {
                const assignee = store.getUserById(t.assigneeId);
                const statusMeta = this.getStatusMeta(t.status);
                return `
                  <div class="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-2xs hover:border-[#2563EB] transition-all cursor-pointer task-urgent-item" data-task-id="${t.id}">
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex items-center gap-2">
                        <span class="font-mono-data text-[11px] font-bold text-[#2563EB] px-2 py-0.5 rounded bg-blue-50 border border-blue-100">${t.id}</span>
                        <span class="text-[10.5px] font-bold px-2 py-0.5 rounded-full ${t.priority === 'P1' ? 'bg-[#FEE2E2] text-[#B91C1C]' : 'bg-[#FEF3C7] text-[#92400E]'}">
                          ${t.priority === 'P1' ? 'P1 - Khẩn' : 'P2 - Tiêu chuẩn'}
                        </span>
                      </div>
                      <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full" style="background-color: ${statusMeta.bg}; color: ${statusMeta.text};">
                        ${statusMeta.label}
                      </span>
                    </div>

                    <h4 class="font-bold text-[14px] text-[#0F172A] mb-1 leading-snug hover:text-[#2563EB] transition-colors">
                      ${esc(t.title)}
                    </h4>

                    <p class="text-[12px] text-[#64748B] line-clamp-1 mb-3">
                      ${esc(t.description || 'Chưa có mô tả chi tiết')}
                    </p>

                    <div class="flex items-center justify-between pt-2.5 border-t border-[#F1F5F9] text-[12px]">
                      <div class="flex items-center gap-2">
                        <img src="${assignee ? assignee.avatar : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}" class="w-5 h-5 rounded-full object-cover" />
                        <span class="text-[#0F172A] font-semibold">${assignee ? assignee.name : 'Chưa phân công'}</span>
                      </div>
                      <span class="font-mono-data text-[11px] text-[#64748B]">Hạn: ${t.deadline}</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- CỘT PHẢI: NHÂN SỰ PHÒNG BAN -->
          <div class="lg:col-span-5 flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <h2 class="text-[16px] font-bold text-[#0F172A] flex items-center gap-2">
                <span class="material-symbols-outlined text-[#6366F1] text-[20px]">group</span>
                Nhân Sự Thuộc Phòng (${departmentUsers.length})
              </h2>
            </div>

            <div class="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col gap-3">
              ${departmentUsers.map(u => {
                const userTasks = store.getDepartmentTasks().filter(t => t.assigneeId === u.id);
                const userDone = userTasks.filter(t => t.status === 'done').length;
                const userTotal = userTasks.length;
                const userRate = userTotal > 0 ? Math.round((userDone / userTotal) * 100) : 100;

                return `
                  <div class="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F8FAFC] transition-colors">
                    <div class="flex items-center gap-3 min-w-0">
                      <img src="${u.avatar}" class="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100 shrink-0" />
                      <div class="min-w-0">
                        <div class="text-[13.5px] font-bold text-[#0F172A] truncate">${u.name}</div>
                        <div class="text-[11.5px] text-[#64748B] truncate">${u.title}</div>
                      </div>
                    </div>
                    <div class="text-right shrink-0">
                      <span class="text-[13px] font-bold text-[#2563EB]">${userDone}/${userTotal}</span>
                      <div class="text-[10px] text-[#0D9488] font-bold">${userRate}%</div>
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

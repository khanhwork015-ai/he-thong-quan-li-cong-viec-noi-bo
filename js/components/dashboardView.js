/**
 * THANH VŨ MEDIC CS3 - EXECUTIVE DASHBOARD COMPONENT (SHIN AIOS v2.7)
 * Thiết kế chuẩn Archetype B:
 * - Compact Bar (40px) chọn phạm vi Toàn viện / Từng phòng ban
 * - 4 Thẻ KPI toàn viện cô đọng (Tổng việc, Tiến độ %, Chờ duyệt khẩn cấp, Quá hạn)
 * - Biểu đồ so sánh tiến độ đa phòng ban (Horizontal Progress Grid)
 * - Hàng đợi phê duyệt khẩn cấp 1-chạm (Quick Approval Queue)
 * Chuẩn công thái học Mobile-First, Touch Target >= 44px, an toàn DOM với esc()
 */

import { auth } from '../auth.js?v=7.0';
import { store } from '../store.js?v=7.0';
import { esc, soVN, ngayVN, loiChao, toast, rung } from '../helpers.js?v=7.0';

export class DashboardView {
  constructor(containerId, onNavigateToTasks, onOpenCreateModal, onSelectTask) {
    this.container = document.getElementById(containerId);
    this.onNavigateToTasks = onNavigateToTasks;
    this.onOpenCreateModal = onOpenCreateModal;
    this.onSelectTask = onSelectTask;
    this.selectedDeptScope = 'all'; // 'all' hoặc deptId
  }

  render() {
    if (!this.container) return;

    const currentUser = auth.getCurrentUser();
    if (!currentUser) return;

    const isLeadershipOrAdmin = auth.isAdmin() || auth.isLeadership();
    const allDepartments = store.getAllDepartments();
    const allTasksRaw = store.getAllTasksRaw();
    const todayStr = new Date().toISOString().split('T')[0];

    // Xác định phòng ban hiển thị theo scope
    let activeDeptId = this.selectedDeptScope;
    if (!isLeadershipOrAdmin) {
      activeDeptId = currentUser.departmentId || allDepartments[0]?.id || 'dept_ptkh';
    }

    // Lọc công việc theo phạm vi được chọn
    const scopedTasks = activeDeptId === 'all' 
      ? allTasksRaw 
      : allTasksRaw.filter(t => t.departmentId === activeDeptId);

    // Tính 4 chỉ số KPI cốt lõi
    const totalCount = scopedTasks.length;
    const doneTasks = scopedTasks.filter(t => t.status === 'done');
    const doneCount = doneTasks.length;
    const completionRate = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
    
    const pendingApprovalTasks = scopedTasks.filter(t => t.status === 'pending_approval' || t.status === 'review');
    const pendingCount = pendingApprovalTasks.length;

    const overdueTasks = scopedTasks.filter(t => t.dueDate < todayStr && t.status !== 'done');
    const overdueCount = overdueTasks.length;

    // Danh sách hàng đợi phê duyệt khẩn cấp (Ưu tiên P1, P2)
    const approvalQueue = scopedTasks
      .filter(t => t.status === 'pending_approval' || t.status === 'review')
      .sort((a, b) => (a.priority === 'P1' ? -1 : 1));

    // Thống kê tiến độ theo từng phòng ban cho biểu đồ so sánh
    const deptStats = allDepartments.map(dept => {
      const dTasks = allTasksRaw.filter(t => t.departmentId === dept.id);
      const dDone = dTasks.filter(t => t.status === 'done').length;
      const dTotal = dTasks.length;
      const dRate = dTotal > 0 ? Math.round((dDone / dTotal) * 100) : 0;
      const dPending = dTasks.filter(t => t.status === 'pending_approval' || t.status === 'review').length;
      return {
        ...dept,
        total: dTotal,
        done: dDone,
        rate: dRate,
        pending: dPending
      };
    });

    const activeDeptObj = allDepartments.find(d => d.id === activeDeptId);

    this.container.innerHTML = `
      <div class="flex flex-col w-full gap-5 sm:gap-6 animate-fade-in max-w-7xl mx-auto pb-12 overflow-x-hidden">
        
        <!-- 1. COMPACT BAR CHUẨN ARCHETYPE B (CAO 40PX) & CHỌN PHẠM VI TOÀN VIỆN -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:px-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-2xs" style="background-color: var(--card); border-color: var(--border);">
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="w-2.5 h-2.5 rounded-full bg-[#16a34a] shrink-0 animate-pulse"></span>
            <span class="font-bold text-[13px] sm:text-[13.5px] text-[#0d1c2f] truncate" style="color: var(--text);">
              ${isLeadershipOrAdmin ? '🏛️ Executive Dashboard • Điều Hành Toàn Phòng Khám' : '👔 Bảng Điều Hành Phòng Ban'}
            </span>
            <span class="text-[11px] text-[#64748b] hidden md:inline truncate">• Cập nhật trực tiếp ${ngayVN(new Date())}</span>
          </div>

          <!-- BỘ CHỌN PHẠM VI XEM TẤT CẢ HOẶC TỪNG PHÒNG -->
          ${isLeadershipOrAdmin ? `
            <div class="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2 min-w-0">
              <label for="selectDashboardScope" class="text-[12px] font-bold text-[#64748b] shrink-0">Phạm vi:</label>
              <select id="selectDashboardScope" class="flex-1 sm:flex-initial max-w-[210px] sm:max-w-xs h-9 px-2.5 rounded-xl border border-[#e2e8f0] text-[12px] sm:text-[12.5px] font-bold text-[#0d1c2f] bg-[#f8f9ff] focus:bg-white focus:border-[#d6a52a] outline-none cursor-pointer shadow-2xs truncate">
                <option value="all" ${this.selectedDeptScope === 'all' ? 'selected' : ''}>🏥 Tất Cả Phòng Ban</option>
                ${allDepartments.map(d => `
                  <option value="${d.id}" ${this.selectedDeptScope === d.id ? 'selected' : ''}>${esc(d.name)} (${esc(d.code)})</option>
                `).join('')}
              </select>
            </div>
          ` : `
            <span class="px-3 py-1 rounded-full text-[11.5px] font-bold font-mono-data" style="background-color: var(--primary-soft); color: var(--primary);">
              ${esc(activeDeptObj ? activeDeptObj.code : 'CS3')}
            </span>
          `}
        </div>

        <!-- 2. HERO GREETING CARD (CHƯƠNG 1 NGUYÊN TẮC 5) -->
        <section class="hn-hero">
          <div class="hn-hero-top">
            <div>
              <div class="hn-chao" id="lblLoiChao">${loiChao(currentUser.name)}</div>
              <div class="hn-ngay" id="lblNgayThang">
                ${ngayVN(new Date())} • ${activeDeptId === 'all' ? 'Toàn Phòng Khám CS3' : (activeDeptObj?.name || 'Phòng ban')}
              </div>
            </div>
            <div class="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold" style="background-color: var(--primary-soft); color: var(--primary);">
              <span class="material-symbols-outlined text-[15px]">verified_user</span>
              <span>${auth.isAdmin() ? 'Quản Trị Viên' : (auth.isLeadership() ? 'Ban Lãnh Đạo' : 'Trưởng Phòng')}</span>
            </div>
          </div>

          <!-- 3 SỐ LIỆU TỔNG QUAN HERO -->
          <div class="tq-3so">
            <div class="tq-o cursor-pointer" data-filter-tab="all" title="Bấm để xem danh sách công việc">
              <div class="tq-so" style="color: var(--primary);">${totalCount}</div>
              <div class="tq-nhan">Tổng công việc</div>
            </div>
            <div class="tq-o cursor-pointer" data-filter-tab="pending_approval" title="Bấm để xem công việc chờ duyệt">
              <div class="tq-so" style="color: #b45309;">${pendingCount}</div>
              <div class="tq-nhan">Chờ duyệt khẩn</div>
            </div>
            <div class="tq-o cursor-pointer" data-filter-tab="completed" title="Bấm để xem công việc đã xong">
              <div class="tq-so" style="color: #16a34a;">${completionRate}%</div>
              <div class="tq-nhan">Tiến độ đạt</div>
            </div>
          </div>

          <!-- NÚT GIAO VIỆC 1-CHẠM 100% (PRIMARY CTA CAO >= 48PX) -->
          <button type="button" class="w-full py-3 px-4 rounded-xl font-bold text-[13.5px] transition-all min-h-[48px] flex items-center justify-center gap-2 shadow-xs cursor-pointer" id="btnHeroCreateTask" style="background-color: var(--primary-container); color: var(--on-primary-container);">
            <span class="material-symbols-outlined text-[20px]">add_circle</span>
            <span>Giao Việc Mới / Khởi Tạo Đề Xuất 1-Chạm</span>
          </button>
        </section>

        <!-- 3. 4 THẺ KPI TOÀN VIỆN CỐT LÕI (CARDS KPI GRID) -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
          <!-- THẺ 1: TỔNG CÔNG VIỆC -->
          <div class="bg-white p-4 sm:p-5 rounded-2xl border border-[#e2e8f0] shadow-2xs hover:border-[#d6a52a] active:bg-[#fffbeb]/20 transition-all cursor-pointer card-kpi" data-filter-tab="all" style="background-color: var(--card); border-color: var(--border);">
            <div class="flex items-center justify-between text-[#795900]" style="color: var(--primary);">
              <span class="text-[11.5px] sm:text-[12px] font-bold uppercase tracking-wider">Tổng khối lượng</span>
              <span class="material-symbols-outlined text-[20px]">assignment</span>
            </div>
            <div class="text-[24px] sm:text-[28px] font-extrabold text-[#0d1c2f] mt-1.5" style="color: var(--text);">${totalCount}</div>
            <span class="text-[11px] text-[#64748b] mt-0.5 truncate block">Đang vận hành tất cả</span>
          </div>

          <!-- THẺ 2: TỶ LỆ HOÀN THÀNH ĐÚNG HẠN -->
          <div class="bg-white p-4 sm:p-5 rounded-2xl border border-[#e2e8f0] shadow-2xs hover:border-emerald-300 active:bg-emerald-50/20 transition-all cursor-pointer card-kpi" data-filter-tab="completed" style="background-color: var(--card); border-color: var(--border);">
            <div class="flex items-center justify-between text-[#16a34a]">
              <span class="text-[11.5px] sm:text-[12px] font-bold uppercase tracking-wider">Tiến độ hoàn tất</span>
              <span class="material-symbols-outlined text-[20px]">task_alt</span>
            </div>
            <div class="text-[24px] sm:text-[28px] font-extrabold text-[#16a34a] mt-1.5">${completionRate}%</div>
            <span class="text-[11px] text-[#64748b] mt-0.5 truncate block">${doneCount}/${totalCount} công việc đã xong</span>
          </div>

          <!-- THẺ 3: VIỆC CHỜ DUYỆT KHẨN CẤP (HIGHLIGHT VÀNG CAM CẢNH BÁO) -->
          <div class="bg-white p-4 sm:p-5 rounded-2xl border-2 border-amber-400 bg-amber-50/30 shadow-xs hover:border-amber-500 active:bg-amber-100/40 transition-all cursor-pointer card-kpi" data-filter-tab="pending_approval">
            <div class="flex items-center justify-between text-amber-800">
              <span class="text-[11.5px] sm:text-[12px] font-bold uppercase tracking-wider flex items-center gap-1">
                <span>Chờ Duyệt Khẩn</span>
                <span class="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              </span>
              <span class="material-symbols-outlined text-[20px] text-amber-600">pending_actions</span>
            </div>
            <div class="text-[24px] sm:text-[28px] font-extrabold text-amber-900 mt-1.5">${pendingCount}</div>
            <span class="text-[11px] text-amber-800 mt-0.5 font-bold truncate block">Cần lãnh đạo ký 1-chạm</span>
          </div>

          <!-- THẺ 4: VIỆC QUÁ HẠN (HIGHLIGHT ĐỎ CẦN CAN THIỆP) -->
          <div class="bg-white p-4 sm:p-5 rounded-2xl border border-rose-200 shadow-2xs hover:border-rose-400 active:bg-rose-50/30 transition-all cursor-pointer card-kpi" data-filter-tab="overdue">
            <div class="flex items-center justify-between text-rose-600">
              <span class="text-[11.5px] sm:text-[12px] font-bold uppercase tracking-wider">Quá hạn</span>
              <span class="material-symbols-outlined text-[20px]">warning</span>
            </div>
            <div class="text-[24px] sm:text-[28px] font-extrabold text-rose-600 mt-1.5">${overdueCount}</div>
            <span class="text-[11px] text-rose-600 mt-0.5 font-semibold truncate block">Cần đôn đốc xử lý</span>
          </div>

        </div>

        <!-- 4. BIỂU ĐỒ SO SÁNH TIẾN ĐỘ CÁC PHÒNG BAN (HORIZONTAL PROGRESS GRID) -->
        <div class="bg-white p-5 sm:p-6 rounded-3xl border border-[#e2e8f0] shadow-sm flex flex-col gap-4" style="background-color: var(--card); border-color: var(--border);">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#f1f5f9]" style="border-color: var(--border);">
            <div>
              <h2 class="text-[15.5px] sm:text-[16.5px] font-extrabold text-[#0d1c2f] flex items-center gap-2" style="color: var(--text);">
                <span class="material-symbols-outlined text-[20px]" style="color: var(--primary);">bar_chart</span>
                <span>So Sánh Tiến Độ Giữa Các Phòng Ban (Tất Cả)</span>
              </h2>
              <p class="text-[12px] text-[#64748b] mt-0.5">Tỷ lệ hoàn thành nhiệm vụ và công việc đang xử lý tại mỗi đơn vị</p>
            </div>
            <span class="text-[11.5px] font-semibold text-[#795900] bg-[#fffbeb] px-3 py-1 rounded-full border border-[#fef3c7] self-start sm:self-auto font-mono-data">
              ${allDepartments.length} Phòng Ban Trọng Điểm
            </span>
          </div>

          <!-- LƯỚI TIẾN ĐỘ TỪNG PHÒNG BAN -->
          <div class="flex flex-col gap-4 pt-1">
            ${deptStats.map(dept => `
              <div class="flex flex-col gap-1.5 p-3 sm:p-4 rounded-2xl border border-gray-100 hover:border-[#d6a52a] hover:bg-[#fffbeb]/20 transition-all cursor-pointer btn-select-dept-row" data-dept-id="${dept.id}">
                <div class="flex items-center justify-between text-[13px] font-bold">
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="w-3 h-3 rounded-full shrink-0" style="background-color: ${dept.color || '#D6A52A'};"></span>
                    <span class="text-[#0d1c2f] truncate" style="color: var(--text);">${esc(dept.name)}</span>
                    <span class="font-mono-data text-[10.5px] px-2 py-0.2 rounded bg-gray-100 text-gray-700 shrink-0">${esc(dept.code)}</span>
                  </div>
                  <div class="flex items-center gap-3 shrink-0">
                    ${dept.pending > 0 ? `
                      <span class="hidden sm:inline-block text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        ${dept.pending} chờ duyệt
                      </span>
                    ` : ''}
                    <span class="text-[#0d1c2f] font-mono-data" style="color: var(--text);">${dept.done}/${dept.total} việc</span>
                    <span class="font-bold min-w-[42px] text-right font-mono-data" style="color: ${dept.color || 'var(--primary)'};">${dept.rate}%</span>
                  </div>
                </div>

                <!-- THANH TIẾN ĐỘ CO GIÃN TỪ 320PX ĐẾN DESKTOP -->
                <div class="w-full bg-[#e2e8f0] h-3 rounded-full overflow-hidden p-0.5">
                  <div class="h-full rounded-full transition-all duration-700 ease-out" style="width: ${dept.rate}%; background-color: ${dept.color || '#D6A52A'};"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 5. HÀNG ĐỢI PHÊ DUYỆT KHẨN CẤP (QUICK APPROVAL QUEUE - 1-CHẠM) -->
        <div class="bg-white p-5 sm:p-6 rounded-3xl border-2 border-amber-300 shadow-sm flex flex-col gap-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-amber-100">
            <div>
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[22px] text-amber-600">verified</span>
                <h2 class="text-[16px] sm:text-[17px] font-extrabold text-[#0d1c2f]">
                  Hàng Đợi Phê Duyệt Khẩn Cấp (Quick Approval Queue)
                </h2>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white font-mono-data">
                  ${approvalQueue.length}
                </span>
              </div>
              <p class="text-[12px] text-[#64748b] mt-0.5">
                Các nhiệm vụ quan trọng đang chờ Lãnh đạo hoặc Trưởng phòng ký xác nhận 1-chạm
              </p>
            </div>

            <button type="button" class="text-[12.5px] font-bold text-[#795900] hover:underline flex items-center gap-1 min-h-[44px] cursor-pointer" id="btnViewAllPendingTasks">
              <span>Xem toàn bộ hàng chờ</span>
              <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>

          <!-- DANH SÁCH VIỆC CHỜ DUYỆT -->
          <div class="flex flex-col gap-3">
            ${approvalQueue.length === 0 ? `
              <div class="py-10 text-center flex flex-col items-center justify-center gap-2 text-gray-400">
                <span class="material-symbols-outlined text-[36px] text-emerald-500">check_circle</span>
                <span class="text-[13.5px] font-bold text-[#0d1c2f]">Không có công việc nào đang chờ duyệt!</span>
                <span class="text-[12px] text-gray-400">Tất cả đề xuất đã được giải quyết hoặc chưa phát sinh yêu cầu mới.</span>
              </div>
            ` : approvalQueue.map(task => {
              const assignee = store.getUserById(task.assigneeId);
              const creator = store.getUserById(task.creatorId);
              const dept = store.getDepartmentById(task.departmentId);

              return `
                <div class="p-4 rounded-2xl border border-amber-200 bg-[#fffbeb]/40 hover:bg-[#fffbeb] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div class="flex-1 min-w-0 cursor-pointer btn-open-task-from-queue" data-task-id="${task.id}">
                    <div class="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span class="font-mono-data text-[11px] font-bold px-2 py-0.5 rounded bg-white border border-amber-300 text-[#795900]">
                        ${esc(task.id)}
                      </span>
                      <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${task.priority === 'P1' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}">
                        ${task.priority === 'P1' ? 'P1 • Khẩn' : 'P2 • Quan trọng'}
                      </span>
                      ${dept ? `
                        <span class="text-[10.5px] font-semibold text-gray-600 bg-white px-2 py-0.5 rounded border border-gray-200">
                          ${esc(dept.name)}
                        </span>
                      ` : ''}
                    </div>

                    <h4 class="font-bold text-[14px] text-[#0d1c2f] leading-snug hover:text-[#795900] transition-colors" style="color: var(--text);">
                      ${esc(task.title)}
                    </h4>

                    <!-- THÔNG TIN THỰC HIỆN VÀ HẠN TÁCH RIÊNG 2 HÀNG RÕ RÀNG TRÊN MOBILE -->
                    <div class="flex flex-col gap-1 mt-2.5 text-[12px] text-[#64748b]">
                      <div class="flex items-center gap-1.5 min-w-0">
                        <span class="text-[#817663] shrink-0">Thực hiện:</span>
                        <strong class="text-[#0d1c2f] font-semibold truncate" style="color: var(--text);">${assignee ? esc(assignee.name) : 'Chưa rõ'}</strong>
                      </div>
                      <div class="flex items-center gap-1.5">
                        <span class="text-[#817663] shrink-0">Hạn:</span>
                        <strong class="font-mono-data text-amber-900 font-bold">${ngayVN(task.dueDate)}</strong>
                      </div>
                    </div>
                  </div>

                  <!-- NÚT PHÊ DUYỆT 1-CHẠM TRÊN DASHBOARD CHUẨN TOUCH TARGET >= 44PX -->
                  <div class="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-amber-200">
                    <button type="button" class="px-4 py-2.5 rounded-xl border border-amber-300 text-[#795900] bg-white hover:bg-amber-50 font-bold text-[12.5px] min-h-[44px] flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs btn-open-task-from-queue" data-task-id="${task.id}">
                      <span class="material-symbols-outlined text-[17px]">visibility</span>
                      <span>Xem</span>
                    </button>

                    <button type="button" class="px-5 py-2.5 rounded-xl font-bold text-[13px] min-h-[44px] flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer btn-quick-approve-task" data-task-id="${task.id}" style="background-color: var(--primary-container); color: var(--on-primary-container);">
                      <span class="material-symbols-outlined text-[18px]">verified</span>
                      <span>Duyệt 1-Chạm</span>
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    // 1. Chuyển phạm vi xem (Toàn viện / Từng phòng ban)
    const selectScope = this.container.querySelector('#selectDashboardScope');
    if (selectScope) {
      selectScope.addEventListener('change', (e) => {
        rung(10);
        this.selectedDeptScope = e.target.value;
        this.render();
      });
    }

    // 2. Nút tạo việc Hero
    const btnHeroCreate = this.container.querySelector('#btnHeroCreateTask');
    if (btnHeroCreate) {
      btnHeroCreate.addEventListener('click', () => {
        rung(10);
        if (this.onOpenCreateModal) this.onOpenCreateModal();
      });
    }

    // 3. Click vào 3 ô Hero để lọc danh sách
    this.container.querySelectorAll('.tq-o[data-filter-tab]').forEach(o => {
      o.addEventListener('click', () => {
        rung(10);
        const filter = o.dataset.filterTab;
        if (this.onNavigateToTasks) this.onNavigateToTasks(filter);
      });
    });

    // 4. Click vào 4 thẻ KPI để lọc
    this.container.querySelectorAll('.card-kpi').forEach(card => {
      card.addEventListener('click', () => {
        rung(10);
        const filter = card.dataset.filterTab;
        if (this.onNavigateToTasks) this.onNavigateToTasks(filter);
      });
    });

    // 5. Nút xem toàn bộ hàng chờ duyệt
    const btnViewPending = this.container.querySelector('#btnViewAllPendingTasks');
    if (btnViewPending) {
      btnViewPending.addEventListener('click', () => {
        rung(10);
        if (this.onNavigateToTasks) this.onNavigateToTasks('pending_approval');
      });
    }

    // 6. Click vào dòng phòng ban trong biểu đồ để chuyển sang xem phòng đó
    this.container.querySelectorAll('.btn-select-dept-row').forEach(row => {
      row.addEventListener('click', () => {
        rung(10);
        const deptId = row.dataset.deptId;
        if (deptId) {
          this.selectedDeptScope = deptId;
          this.render();
        }
      });
    });

    // 7. Click mở xem task từ hàng chờ
    this.container.querySelectorAll('.btn-open-task-from-queue').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        rung(10);
        const taskId = btn.dataset.taskId;
        if (taskId && this.onSelectTask) {
          this.onSelectTask(taskId);
        }
      });
    });

    // 8. DUYỆT 1-CHẠM NGAY TRÊN DASHBOARD
    this.container.querySelectorAll('.btn-quick-approve-task').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        rung(15);
        const taskId = btn.dataset.taskId;
        if (taskId) {
          store.approveTask(taskId);
          toast(`Đã phê duyệt 1-chạm công việc ${taskId} thành công!`, 'success');
          this.render();
        }
      });
    });
  }
}



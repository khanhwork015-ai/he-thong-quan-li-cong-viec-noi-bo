/**
 * THANH VU MEDIC CS3 - EXECUTIVE DASHBOARD COMPONENT (SHIN AIOS v2.7)
 * Thi?t k? chu?n Archetype B:
 * - Compact Bar (40px) ch?n ph?m vi Toàn vi?n / T?ng phòng ban
 * - 4 Th? KPI toàn vi?n cô d?ng (T?ng vi?c, Ti?n d? %, Ch? duy?t kh?n c?p, Quá h?n)
 * - Bi?u d? so sánh ti?n d? da phòng ban (Horizontal Progress Grid)
 * - Hàng d?i phê duy?t kh?n c?p 1-ch?m (Quick Approval Queue)
 * Chu?n công thái h?c Mobile-First, Touch Target >= 44px, an toàn DOM v?i esc()
 */

import { auth } from '../auth.js?v=5.2';
import { store } from '../store.js?v=5.2';
import { esc, soVN, ngayVN, loiChao, toast, rung } from '../helpers.js?v=5.2';

export class DashboardView {
  constructor(containerId, onNavigateToTasks, onOpenCreateModal, onSelectTask) {
    this.container = document.getElementById(containerId);
    this.onNavigateToTasks = onNavigateToTasks;
    this.onOpenCreateModal = onOpenCreateModal;
    this.onSelectTask = onSelectTask;
    this.selectedDeptScope = 'all'; // 'all' ho?c deptId
  }

  render() {
    if (!this.container) return;

    const currentUser = auth.getCurrentUser();
    if (!currentUser) return;

    const isLeadershipOrAdmin = auth.isAdmin() || auth.isLeadership();
    const allDepartments = store.getAllDepartments();
    const allTasksRaw = store.getAllTasksRaw();
    const todayStr = new Date().toISOString().split('T')[0];

    // Xác d?nh phòng ban hi?n th? theo scope
    let activeDeptId = this.selectedDeptScope;
    if (!isLeadershipOrAdmin) {
      activeDeptId = currentUser.departmentId || allDepartments[0]?.id || 'dept_ptkh';
    }

    // L?c công vi?c theo ph?m vi du?c ch?n
    const scopedTasks = activeDeptId === 'all' 
      ? allTasksRaw 
      : allTasksRaw.filter(t => t.departmentId === activeDeptId);

    // Tính 4 ch? s? KPI c?t lõi
    const totalCount = scopedTasks.length;
    const doneTasks = scopedTasks.filter(t => t.status === 'done');
    const doneCount = doneTasks.length;
    const completionRate = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
    
    const pendingApprovalTasks = scopedTasks.filter(t => t.status === 'pending_approval' || t.status === 'review');
    const pendingCount = pendingApprovalTasks.length;

    const overdueTasks = scopedTasks.filter(t => t.dueDate < todayStr && t.status !== 'done');
    const overdueCount = overdueTasks.length;

    // Danh sách hàng d?i phê duy?t kh?n c?p (Uu tiên P1, P2)
    const approvalQueue = scopedTasks
      .filter(t => t.status === 'pending_approval' || t.status === 'review')
      .sort((a, b) => (a.priority === 'P1' ? -1 : 1));

    // Th?ng kê ti?n d? theo t?ng phòng ban cho bi?u d? so sánh
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
      <div class="flex flex-col w-full gap-5 sm:gap-6 animate-fade-in max-w-7xl mx-auto">
        
        <!-- 1. COMPACT BAR CHU?N ARCHETYPE B (CAO 40PX) & CH?N PH?M VI TOÀN VI?N -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:px-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-2xs" style="background-color: var(--card); border-color: var(--border);">
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="w-2.5 h-2.5 rounded-full bg-[#16a34a] shrink-0 animate-pulse"></span>
            <span class="font-bold text-[13px] sm:text-[13.5px] text-[#0d1c2f] truncate" style="color: var(--text);">
              ${isLeadershipOrAdmin ? '??? Executive Dashboard • Ði?u Hành B?nh Vi?n' : '?? B?ng Ði?u Hành Phòng Ban'}
            </span>
            <span class="text-[11px] text-[#64748b] hidden md:inline truncate">• C?p nh?t tr?c ti?p ${ngayVN(new Date())}</span>
          </div>

          <!-- B? CH?N PH?M VI XEM TOÀN VI?N HO?C T?NG PHÒNG -->
          ${isLeadershipOrAdmin ? `
            <div class="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2 min-w-0">
              <label for="selectDashboardScope" class="text-[12px] font-bold text-[#64748b] shrink-0">Ph?m vi:</label>
              <select id="selectDashboardScope" class="flex-1 sm:flex-initial max-w-[210px] sm:max-w-xs h-9 px-2.5 rounded-xl border border-[#e2e8f0] text-[12px] sm:text-[12.5px] font-bold text-[#0d1c2f] bg-[#f8f9ff] focus:bg-white focus:border-[#d6a52a] outline-none cursor-pointer shadow-2xs truncate">
                <option value="all" ${this.selectedDeptScope === 'all' ? 'selected' : ''}>?? Toàn Vi?n (T?t C?)</option>
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

        <!-- 2. HERO GREETING CARD (CHUONG 1 NGUYÊN T?C 5) -->
        <section class="hn-hero">
          <div class="hn-hero-top">
            <div>
              <div class="hn-chao" id="lblLoiChao">${loiChao(currentUser.name)}</div>
              <div class="hn-ngay" id="lblNgayThang">
                ${ngayVN(new Date())} • ${activeDeptId === 'all' ? 'Toàn B?nh Vi?n CS3' : (activeDeptObj?.name || 'Phòng ban')}
              </div>
            </div>
            <div class="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold" style="background-color: var(--primary-soft); color: var(--primary);">
              <span class="material-symbols-outlined text-[15px]">verified_user</span>
              <span>${auth.isAdmin() ? 'Qu?n Tr? Viên' : (auth.isLeadership() ? 'Ban Lãnh Ð?o' : 'Tru?ng Phòng')}</span>
            </div>
          </div>

          <!-- 3 S? LI?U T?NG QUAN HERO -->
          <div class="tq-3so">
            <div class="tq-o cursor-pointer" data-filter-tab="all" title="B?m d? xem danh sách công vi?c">
              <div class="tq-so" style="color: var(--primary);">${totalCount}</div>
              <div class="tq-nhan">T?ng công vi?c</div>
            </div>
            <div class="tq-o cursor-pointer" data-filter-tab="pending_approval" title="B?m d? xem công vi?c ch? duy?t">
              <div class="tq-so" style="color: #b45309;">${pendingCount}</div>
              <div class="tq-nhan">Ch? duy?t kh?n</div>
            </div>
            <div class="tq-o cursor-pointer" data-filter-tab="completed" title="B?m d? xem công vi?c dã xong">
              <div class="tq-so" style="color: #16a34a;">${completionRate}%</div>
              <div class="tq-nhan">Ti?n d? d?t</div>
            </div>
          </div>

          <!-- NÚT GIAO VI?C 1-CH?M 100% (PRIMARY CTA CAO >= 48PX) -->
          <button type="button" class="w-full py-3 px-4 rounded-xl font-bold text-[13.5px] transition-all min-h-[48px] flex items-center justify-center gap-2 shadow-xs cursor-pointer" id="btnHeroCreateTask" style="background-color: var(--primary-container); color: var(--on-primary-container);">
            <span class="material-symbols-outlined text-[20px]">add_circle</span>
            <span>+ Giao Vi?c M?i / Kh?i T?o Ð? Xu?t 1-Ch?m</span>
          </button>
        </section>

        <!-- 3. 4 TH? KPI TOÀN VI?N C?T LÕI (CARDS KPI GRID) -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
          <!-- TH? 1: T?NG CÔNG VI?C -->
          <div class="bg-white p-4 sm:p-5 rounded-2xl border border-[#e2e8f0] shadow-2xs hover:border-[#d6a52a] active:bg-[#fffbeb]/20 transition-all cursor-pointer card-kpi" data-filter-tab="all" style="background-color: var(--card); border-color: var(--border);">
            <div class="flex items-center justify-between text-[#795900]" style="color: var(--primary);">
              <span class="text-[11.5px] sm:text-[12px] font-bold uppercase tracking-wider">T?ng kh?i lu?ng</span>
              <span class="material-symbols-outlined text-[20px]">assignment</span>
            </div>
            <div class="text-[24px] sm:text-[28px] font-extrabold text-[#0d1c2f] mt-1.5" style="color: var(--text);">${totalCount}</div>
            <span class="text-[11px] text-[#64748b] mt-0.5 truncate block">Ðang v?n hành toàn vi?n</span>
          </div>

          <!-- TH? 2: T? L? HOÀN THÀNH ÐÚNG H?N -->
          <div class="bg-white p-4 sm:p-5 rounded-2xl border border-[#e2e8f0] shadow-2xs hover:border-emerald-300 active:bg-emerald-50/20 transition-all cursor-pointer card-kpi" data-filter-tab="completed" style="background-color: var(--card); border-color: var(--border);">
            <div class="flex items-center justify-between text-[#16a34a]">
              <span class="text-[11.5px] sm:text-[12px] font-bold uppercase tracking-wider">Ti?n d? hoàn t?t</span>
              <span class="material-symbols-outlined text-[20px]">task_alt</span>
            </div>
            <div class="text-[24px] sm:text-[28px] font-extrabold text-[#16a34a] mt-1.5">${completionRate}%</div>
            <span class="text-[11px] text-[#64748b] mt-0.5 truncate block">${doneCount}/${totalCount} công vi?c dã xong</span>
          </div>

          <!-- TH? 3: VI?C CH? DUY?T KH?N C?P (HIGHLIGHT VÀNG CAM C?NH BÁO) -->
          <div class="bg-white p-4 sm:p-5 rounded-2xl border-2 border-amber-400 bg-amber-50/30 shadow-xs hover:border-amber-500 active:bg-amber-100/40 transition-all cursor-pointer card-kpi" data-filter-tab="pending_approval">
            <div class="flex items-center justify-between text-amber-800">
              <span class="text-[11.5px] sm:text-[12px] font-bold uppercase tracking-wider flex items-center gap-1">
                <span>Ch? Duy?t Kh?n</span>
                <span class="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              </span>
              <span class="material-symbols-outlined text-[20px] text-amber-600">pending_actions</span>
            </div>
            <div class="text-[24px] sm:text-[28px] font-extrabold text-amber-900 mt-1.5">${pendingCount}</div>
            <span class="text-[11px] text-amber-800 mt-0.5 font-bold truncate block">C?n lãnh d?o ký 1-ch?m</span>
          </div>

          <!-- TH? 4: VI?C QUÁ H?N (HIGHLIGHT Ð? C?N CAN THI?P) -->
          <div class="bg-white p-4 sm:p-5 rounded-2xl border border-rose-200 shadow-2xs hover:border-rose-400 active:bg-rose-50/30 transition-all cursor-pointer card-kpi" data-filter-tab="overdue">
            <div class="flex items-center justify-between text-rose-600">
              <span class="text-[11.5px] sm:text-[12px] font-bold uppercase tracking-wider">Quá h?n</span>
              <span class="material-symbols-outlined text-[20px]">warning</span>
            </div>
            <div class="text-[24px] sm:text-[28px] font-extrabold text-rose-600 mt-1.5">${overdueCount}</div>
            <span class="text-[11px] text-rose-600 mt-0.5 font-semibold truncate block">C?n dôn d?c x? lý</span>
          </div>

        </div>

        <!-- 4. BI?U Ð? SO SÁNH TI?N Ð? CÁC PHÒNG BAN (HORIZONTAL PROGRESS GRID) -->
        <div class="bg-white p-5 sm:p-6 rounded-3xl border border-[#e2e8f0] shadow-sm flex flex-col gap-4" style="background-color: var(--card); border-color: var(--border);">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#f1f5f9]" style="border-color: var(--border);">
            <div>
              <h2 class="text-[15.5px] sm:text-[16.5px] font-extrabold text-[#0d1c2f] flex items-center gap-2" style="color: var(--text);">
                <span class="material-symbols-outlined text-[20px]" style="color: var(--primary);">bar_chart</span>
                <span>So Sánh Ti?n Ð? Gi?a Các Phòng Ban Toàn Vi?n</span>
              </h2>
              <p class="text-[12px] text-[#64748b] mt-0.5">T? l? hoàn thành nhi?m v? và công vi?c dang x? lý t?i m?i don v?</p>
            </div>
            <span class="text-[11.5px] font-semibold text-[#795900] bg-[#fffbeb] px-3 py-1 rounded-full border border-[#fef3c7] self-start sm:self-auto font-mono-data">
              ${allDepartments.length} Phòng Ban Tr?ng Ði?m
            </span>
          </div>

          <!-- LU?I TI?N Ð? T?NG PHÒNG BAN -->
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
                        ${dept.pending} ch? duy?t
                      </span>
                    ` : ''}
                    <span class="text-[#0d1c2f] font-mono-data" style="color: var(--text);">${dept.done}/${dept.total} vi?c</span>
                    <span class="font-bold min-w-[42px] text-right font-mono-data" style="color: ${dept.color || 'var(--primary)'};">${dept.rate}%</span>
                  </div>
                </div>

                <!-- THANH TI?N Ð? CO GIÃN T? 320PX Ð?N DESKTOP -->
                <div class="w-full bg-[#e2e8f0] h-3 rounded-full overflow-hidden p-0.5">
                  <div class="h-full rounded-full transition-all duration-700 ease-out" style="width: ${dept.rate}%; background-color: ${dept.color || '#D6A52A'};"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 5. HÀNG Ð?I PHÊ DUY?T KH?N C?P (QUICK APPROVAL QUEUE - 1-CH?M) -->
        <div class="bg-white p-5 sm:p-6 rounded-3xl border-2 border-amber-300 shadow-sm flex flex-col gap-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-amber-100">
            <div>
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[22px] text-amber-600">verified</span>
                <h2 class="text-[16px] sm:text-[17px] font-extrabold text-[#0d1c2f]">
                  Hàng Ð?i Phê Duy?t Kh?n C?p (Quick Approval Queue)
                </h2>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white font-mono-data">
                  ${approvalQueue.length}
                </span>
              </div>
              <p class="text-[12px] text-[#64748b] mt-0.5">
                Các nhi?m v? quan tr?ng dang ch? Lãnh d?o ho?c Tru?ng phòng ký xác nh?n 1-ch?m
              </p>
            </div>

            <button type="button" class="text-[12.5px] font-bold text-[#795900] hover:underline flex items-center gap-1 min-h-[44px] cursor-pointer" id="btnViewAllPendingTasks">
              <span>Xem toàn b? hàng ch?</span>
              <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>

          <!-- DANH SÁCH VI?C CH? DUY?T -->
          <div class="flex flex-col gap-3">
            ${approvalQueue.length === 0 ? `
              <div class="py-10 text-center flex flex-col items-center justify-center gap-2 text-gray-400">
                <span class="material-symbols-outlined text-[36px] text-emerald-500">check_circle</span>
                <span class="text-[13.5px] font-bold text-[#0d1c2f]">Không có công vi?c nào dang ch? duy?t!</span>
                <span class="text-[12px] text-gray-400">T?t c? d? xu?t dã du?c gi?i quy?t ho?c chua phát sinh yêu c?u m?i.</span>
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
                        ${task.priority === 'P1' ? 'P1 • Kh?n' : 'P2 • Quan tr?ng'}
                      </span>
                      ${dept ? `
                        <span class="text-[10.5px] font-semibold text-gray-600 bg-white px-2 py-0.5 rounded border border-gray-200">
                          ${esc(dept.name)}
                        </span>
                      ` : ''}
                    </div>

                    <h4 class="font-bold text-[14px] text-[#0d1c2f] leading-snug hover:text-[#795900] transition-colors">
                      ${esc(task.title)}
                    </h4>

                    <div class="flex items-center gap-3 mt-2 text-[11.5px] text-[#64748b]">
                      <span>Th?c hi?n: <strong>${assignee ? esc(assignee.name) : 'Chua rõ'}</strong></span>
                      <span>•</span>
                      <span>H?n: <strong class="font-mono-data text-amber-900">${task.dueDate}</strong></span>
                    </div>
                  </div>

                  <!-- NÚT PHÊ DUY?T 1-CH?M TRÊN DASHBOARD CHU?N TOUCH TARGET >= 44PX -->
                  <div class="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-amber-200">
                    <button type="button" class="px-4 py-2.5 rounded-xl border border-amber-300 text-[#795900] bg-white hover:bg-amber-50 font-bold text-[12.5px] min-h-[44px] flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs btn-open-task-from-queue" data-task-id="${task.id}">
                      <span class="material-symbols-outlined text-[17px]">visibility</span>
                      <span>Xem</span>
                    </button>

                    <button type="button" class="px-5 py-2.5 rounded-xl font-bold text-[13px] min-h-[44px] flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer btn-quick-approve-task" data-task-id="${task.id}" style="background-color: var(--primary-container); color: var(--on-primary-container);">
                      <span class="material-symbols-outlined text-[18px]">verified</span>
                      <span>Duy?t 1-Ch?m</span>
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
    // 1. Chuy?n ph?m vi xem (Toàn vi?n / T?ng phòng ban)
    const selectScope = this.container.querySelector('#selectDashboardScope');
    if (selectScope) {
      selectScope.addEventListener('change', (e) => {
        rung(10);
        this.selectedDeptScope = e.target.value;
        this.render();
      });
    }

    // 2. Nút t?o vi?c Hero
    const btnHeroCreate = this.container.querySelector('#btnHeroCreateTask');
    if (btnHeroCreate) {
      btnHeroCreate.addEventListener('click', () => {
        rung(10);
        if (this.onOpenCreateModal) this.onOpenCreateModal();
      });
    }

    // 3. Click vào 3 ô Hero d? l?c danh sách
    this.container.querySelectorAll('.tq-o[data-filter-tab]').forEach(o => {
      o.addEventListener('click', () => {
        rung(10);
        const filter = o.dataset.filterTab;
        if (this.onNavigateToTasks) this.onNavigateToTasks(filter);
      });
    });

    // 4. Click vào 4 th? KPI d? l?c
    this.container.querySelectorAll('.card-kpi').forEach(card => {
      card.addEventListener('click', () => {
        rung(10);
        const filter = card.dataset.filterTab;
        if (this.onNavigateToTasks) this.onNavigateToTasks(filter);
      });
    });

    // 5. Nút xem toàn b? hàng ch? duy?t
    const btnViewPending = this.container.querySelector('#btnViewAllPendingTasks');
    if (btnViewPending) {
      btnViewPending.addEventListener('click', () => {
        rung(10);
        if (this.onNavigateToTasks) this.onNavigateToTasks('pending_approval');
      });
    }

    // 6. Click vào dòng phòng ban trong bi?u d? d? chuy?n sang xem phòng dó
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

    // 7. Click m? xem task t? hàng ch?
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

    // 8. DUY?T 1-CH?M NGAY TRÊN DASHBOARD
    this.container.querySelectorAll('.btn-quick-approve-task').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        rung(15);
        const taskId = btn.dataset.taskId;
        if (taskId) {
          store.approveTask(taskId);
          toast(`Ðã phê duy?t 1-ch?m công vi?c ${taskId} thành công!`, 'success');
          this.render();
        }
      });
    });
  }
}



/**
 * THANH VŨ MEDIC CS3 - MAIN APPLICATION CONTROLLER (MOBILE FIRST & RESPONSIVE)
 * Tích hợp Quản lý nhân viên (Thêm/Sửa/Xóa), Profile Modal, Settings Grid, Bottom Nav & Google Apps Script
 * Chuẩn màu Vàng Hoàng Kim Google Stitch: Gold #D6A52A, Deep Gold #795900, Warm #FFFBEB
 */

import { auth } from './auth.js?v=7.3';
import { store } from './store.js?v=7.3';
import { Sidebar } from './components/sidebar.js?v=7.3';
import { TopHeader } from './components/topHeader.js?v=7.3';
import { BottomNav } from './components/bottomNav.js?v=7.3';
import { DashboardView } from './components/dashboardView.js?v=7.3';
import { WorkspaceView } from './components/workspaceView.js?v=7.3';
import { TaskDrawer } from './components/taskDrawer.js?v=7.3';
import { NotificationDrawer } from './components/notificationDrawer.js?v=7.3';
import { CreateTaskModal } from './components/createTaskModal.js?v=7.3'
import { SubtasksModal } from './components/subtasksModal.js?v=7.3';
import { SubtaskDetailModal } from './components/subtaskDetailModal.js?v=7.3';;
import { ProfileModal } from './components/profileModal.js?v=7.3';
import { MemberModal } from './components/memberModal.js?v=7.3';
import { SettingsModal } from './components/settingsModal.js?v=7.3';
import { LoginView } from './components/loginView.js?v=7.3';
import { DepartmentModal } from './components/departmentModal.js?v=7.3';
import { DepartmentView } from './components/departmentView.js?v=7.3';
import { PlansView } from './components/plansView.js?v=7.3';
import { PlanDrawer } from './components/planDrawer.js?v=7.3';
import { PlanModal } from './components/planModal.js?v=7.3';
import { ApprovalView } from './components/approvalView.js?v=7.3';
import { appScriptBridge } from './services/appScriptBridge.js?v=7.3';
import { toast, rung, esc, soVN, ngayVN, xacNhan2Lan } from './helpers.js?v=7.3';
import { shinTheme } from './theme.js?v=7.3';

class App {
  constructor() {
    this.currentNav = 'tong-quan'; // 'tong-quan' | 'cong-viec' | 'nhan-vien' | 'cai-dat'
    this.sidebar = null;
    this.header = null;
    this.bottomNav = null;
    this.dashboardView = null;
    this.workspaceView = null;
    this.taskDrawer = null;
    this.notificationDrawer = null;
    this.createTaskModal = null;
    this.subtasksModal = null;
    this.subtaskDetailModal = null;
    this.profileModal = null;
    this.memberModal = null;
    this.settingsModal = null;
    this.loginView = null;
    this.departmentModal = null;
    this.departmentView = null;
    this.plansView = null;
    this.planDrawer = null;
    this.planModal = null;
  }

  init() {
    console.log('🚀 [THANH VŨ MEDIC CS3] Khởi chạy hệ thống Mobile-First SHIN AIOS Master UI...');
    shinTheme.init();
    shinTheme.subscribe(() => {
      if (this.sidebar) this.sidebar.render();
      if (this.bottomNav) this.bottomNav.render();
      if (this.header) this.header.render();
    });

    this.loginView = new LoginView('login-container', (user) => this.onLoginSuccess(user));
    this.profileModal = new ProfileModal('modal-container', () => this.render());
    this.memberModal = new MemberModal('modal-container', () => this.refreshCurrentView());
    this.settingsModal = new SettingsModal('modal-container', () => this.refreshCurrentView());
    this.departmentModal = new DepartmentModal('modal-container', () => this.refreshCurrentView());
    this.departmentView = new DepartmentView('main-content-canvas', () => this.refreshCurrentView(), (deptId, userId = null) => this.memberModal.show(userId, deptId));

    this.sidebar = new Sidebar('sidebar-container', 
      (navId) => this.switchNav(navId),
      (mode) => this.onModeChange(mode),
      () => this.onLogout()
    );

    this.bottomNav = new BottomNav('mobile-nav-container',
      (navId) => this.switchNav(navId)
    );

    this.notificationDrawer = new NotificationDrawer('notification-drawer-container', (targetId) => this.openItemFromNotification(targetId));

    this.header = new TopHeader('header-container',
      (query) => this.onSearch(query),
      () => this.openCreateModal(),
      () => this.profileModal.show(),
      () => this.settingsModal.show(),
      () => this.sidebar.toggle(),
      () => this.switchNav('phong-ban'),
      () => this.onLogout(),
      (targetId) => this.openItemFromNotification(targetId),
      () => this.notificationDrawer.open(),
      () => this.switchNav('phe-duyet')
    );

    this.subtaskDetailModal = new SubtaskDetailModal('modal-container', () => this.refreshCurrentView());
    this.subtasksModal = new SubtasksModal(
      'modal-container',
      () => this.refreshCurrentView(),
      (taskId) => this.openTask(taskId),
      (taskId, subtaskId) => this.subtaskDetailModal.show(taskId, subtaskId)
    );

    this.taskDrawer = new TaskDrawer(
      'drawer-container',
      () => this.refreshCurrentView(),
      (task) => this.openCreateModal(task),
      (taskId, subtaskId) => this.subtaskDetailModal.show(taskId, subtaskId)
    );
    this.createTaskModal = new CreateTaskModal('modal-container', () => this.refreshCurrentView());

    this.dashboardView = new DashboardView('main-content-canvas',
      (filterTab) => {
        if (filterTab === 'pending_approval') {
          this.switchNav('phe-duyet');
        } else {
          this.switchNav('cong-viec');
          if (filterTab && this.workspaceView) {
            if (filterTab === 'in_progress') this.workspaceView.setTab('all');
            else if (filterTab === 'completed') this.workspaceView.setTab('completed');
          }
        }
      },
      () => this.openCreateModal(),
      (taskId) => this.taskDrawer.open(taskId)
    );

    this.approvalView = new ApprovalView(
      'main-content-canvas',
      (taskId) => this.taskDrawer.open(taskId),
      (planId) => this.planDrawer.open(planId),
      () => this.refreshCurrentView()
    );

    this.workspaceView = new WorkspaceView(
      'main-content-canvas',
      () => this.openCreateModal(),
      (taskId) => this.taskDrawer.open(taskId),
      (taskId) => this.subtasksModal.show(taskId),
      (taskId) => {
        const t = store.getTaskById(taskId);
        if (t) this.openCreateModal(t);
      }
    );

    this.planDrawer = new PlanDrawer(
      'drawer-container',
      () => this.refreshCurrentView(),
      (plan) => this.planModal.show(plan),
      (taskId) => this.taskDrawer.open(taskId)
    );

    this.planModal = new PlanModal(
      'modal-container',
      (savedPlan) => {
        this.refreshCurrentView();
        if (savedPlan && this.currentNav === 'ke-hoach') {
          this.planDrawer.open(savedPlan.id);
        }
      }
    );

    this.plansView = new PlansView(
      'main-content-canvas',
      (planId) => this.planDrawer.open(planId),
      () => this.planModal.show(),
      (plan) => this.planModal.show(plan)
    );

    this.bindGlobalEvents();
    this.render();
  }

  onLoginSuccess(user) {
    this.render();
  }

  onLogout() {
    this.render();
  }

  render() {
    const loginContainer = document.getElementById('login-container');
    const mainShell = document.getElementById('main-app-shell');
    const sidebarContainer = document.getElementById('sidebar-container');
    const mobileNav = document.getElementById('mobile-nav-container');

    // NẾU CHƯA ĐĂNG NHẬP HOẶC HẾT HẠN PHIÊN -> HIỆN LOGIN VIEW
    if (!auth.isAuthenticated()) {
      if (loginContainer) {
        loginContainer.className = 'fixed inset-0 z-[100] overflow-y-auto';
        loginContainer.style.display = 'block';
        loginContainer.style.pointerEvents = 'auto';
        this.loginView.render();
      }
      if (mainShell) mainShell.style.display = 'none';
      if (sidebarContainer) sidebarContainer.style.display = 'none';
      if (mobileNav) mobileNav.style.display = 'none';
      document.body.classList.remove('overflow-hidden');
      return;
    }

    // ĐÃ ĐĂNG NHẬP HỢP LỆ -> HỦY HOÀN TOÀN LOGIN CONTAINER ĐỂ KHÔNG CHẶN CUỘN TRANG
    if (loginContainer) {
      loginContainer.className = 'hidden';
      loginContainer.style.display = 'none';
      loginContainer.style.pointerEvents = 'none';
      loginContainer.innerHTML = '';
    }
    if (mainShell) mainShell.style.display = '';
    if (sidebarContainer) sidebarContainer.style.display = '';
    if (mobileNav) mobileNav.style.display = '';
    document.body.classList.remove('overflow-hidden');
    document.documentElement.classList.remove('overflow-hidden');

    this.sidebar.render();
    this.bottomNav.render();
    this.header.render();
    this.renderCurrentView();
  }

  renderCurrentView() {
    if (this.currentNav === 'tong-quan') {
      this.dashboardView.render();
    } else if (this.currentNav === 'ke-hoach') {
      this.plansView.render();
    } else if (this.currentNav === 'phe-duyet') {
      this.approvalView.render();
    } else if (this.currentNav === 'cong-viec') {
      this.workspaceView.render();
    } else if (this.currentNav === 'nhan-vien') {
      this.renderEmployeesView();
    } else if (this.currentNav === 'phong-ban') {
      if (auth.isAdmin()) {
        this.departmentView.render();
      } else {
        toast('Chỉ Quản Trị Viên (Admin) mới có quyền truy cập Phòng ban & Bộ phận!', 'warning');
        this.switchNav('tong-quan');
      }
    } else if (this.currentNav === 'cai-dat') {
      this.renderSettingsView();
    }
  }

  switchNav(navId) {
    rung(15);
    this.currentNav = navId;
    if (this.sidebar) this.sidebar.setNav(navId);
    if (this.bottomNav) this.bottomNav.setNav(navId);

    if (navId === 'phe-duyet') {
      toast('Đang mở Trung tâm phê duyệt 1-chạm...', 'info');
    }
    if (navId === 'cai-dat') {
      toast('Đang mở Cài đặt hệ thống & Tích hợp Cloud...', 'info');
    }

    this.renderCurrentView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onModeChange(mode) {
    if (mode === 'ca-nhan') {
      this.switchNav('cong-viec');
      if (this.workspaceView) this.workspaceView.setTab('assigned_to_me');
    } else {
      this.switchNav('tong-quan');
    }
  }

  onSearch(query) {
    if (this.currentNav !== 'cong-viec') {
      this.switchNav('cong-viec');
    }
    if (this.workspaceView) {
      this.workspaceView.searchQuery = query;
      this.workspaceView.render();
    }
  }

  openItemFromNotification(targetId) {
    if (!targetId) {
      this.switchNav('phe-duyet');
      return;
    }

    // 1. Nếu là Kế hoạch (Plan)
    if (targetId.startsWith('PLN-') || store.getPlanById(targetId)) {
      if (this.currentNav !== 'ke-hoach') {
        this.switchNav('ke-hoach');
      }
      if (this.planDrawer) {
        this.planDrawer.open(targetId);
      }
      return;
    }

    // 2. Nếu là Công việc (Task)
    const task = store.getTaskById(targetId);
    if (task) {
      if (this.taskDrawer) {
        this.taskDrawer.open(targetId);
      }
      return;
    }

    // 3. Fallback
    toast('Hạng mục liên kết không tồn tại hoặc đã được gỡ bỏ.', 'warning');
  }

  openTask(taskId) {
    if (this.taskDrawer) {
      this.taskDrawer.open(taskId);
    }
  }

  openCreateModal(taskToEdit = null) {
    if (!auth.canCreateTask()) {
      toast('Quyền hạn bị từ chối: Bạn không có quyền thao tác nhiệm vụ này!', 'warning');
      return;
    }
    this.createTaskModal.show(taskToEdit);
  }

  refreshCurrentView() {
    const prevScrollY = window.scrollY || document.documentElement.scrollTop;
    this.header.render();
    this.bottomNav.render();
    this.renderCurrentView();
    if (prevScrollY > 0) {
      window.scrollTo({ top: prevScrollY, behavior: 'instant' });
      requestAnimationFrame(() => {
        window.scrollTo({ top: prevScrollY, behavior: 'instant' });
      });
    }
  }

  bindGlobalEvents() {
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('topSearchInput');
        if (searchInput) searchInput.focus();
      }
      if (e.key === 'Escape') {
        if (this.taskDrawer) this.taskDrawer.close();
        if (this.planDrawer) this.planDrawer.close();
        if (this.planModal) this.planModal.close();
      }
    });

    window.addEventListener('tvm:plans_changed', () => {
      if (this.currentNav === 'ke-hoach' && this.plansView) {
        this.plansView.render();
      }
    });

    window.addEventListener('tvm:auth_changed', () => {
      this.render();
    });

    window.addEventListener('tvm:notifications_changed', () => {
      if (this.header) this.header.render();
    });

    window.addEventListener('auth-changed', () => {
      this.render();
    });

    window.addEventListener('tvm:department_changed', () => {
      this.render();
    });

    window.addEventListener('department-changed', () => {
      this.render();
    });
  }

  // --- MÀN HÌNH QUẢN LÝ NHÂN SỰ TOÀN VIỆN & TỪNG PHÒNG BAN (SHIN AIOS v2.7) ---
  renderEmployeesView() {
    const prevScrollY = window.scrollY || document.documentElement.scrollTop;
    const canvas = document.getElementById('main-content-canvas');
    const isAdmin = auth.isAdmin();
    const isLeadership = auth.isLeadership();
    const canSwitch = isAdmin || isLeadership;
    const canManage = auth.canManageMembers();
    const allDepts = store.getAllDepartments();
    const allUsers = store.getAllUsers();

    // Khởi tạo bộ lọc phòng ban cho màn hình nhân sự (Admin mặc định xem Toàn viện 'all')
    if (!canSwitch) {
      this.employeeDeptFilter = auth.getActiveDepartment().id;
    } else if (!this.employeeDeptFilter) {
      this.employeeDeptFilter = 'all';
    }

    // Lọc danh sách theo phòng ban
    let filteredMembers = (this.employeeDeptFilter === 'all') 
      ? allUsers 
      : store.getDepartmentUsers(this.employeeDeptFilter);

    // Lọc tiếp theo từ khóa tìm kiếm
    if (this.employeeSearchQuery) {
      const q = this.employeeSearchQuery.toLowerCase().trim();
      filteredMembers = filteredMembers.filter(u => 
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.title && u.title.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.phone && u.phone.includes(q)) ||
        (u.username && u.username.toLowerCase().includes(q))
      );
    }

    const currentFilterDept = allDepts.find(d => d.id === this.employeeDeptFilter);
    const filterTitle = (this.employeeDeptFilter === 'all') ? 'Toàn Phòng Khám CS3 (Tất Cả)' : (currentFilterDept?.name || 'Phòng ban');

    canvas.innerHTML = `
      <div class="flex flex-col gap-5 animate-fade-in w-full max-w-7xl mx-auto pb-12 overflow-x-hidden">
        
        <!-- 1. HEADER BANNER QUẢN LÝ NHÂN SỰ -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 bg-white p-5 rounded-3xl border border-[#e2e8f0] shadow-sm" style="background-color: var(--card); border-color: var(--border);">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="font-mono-data text-[11px] font-bold px-2.5 py-0.5 rounded-full" style="background-color: var(--primary-soft); color: var(--primary); border: 1px solid var(--border);">
                ${this.employeeDeptFilter === 'all' ? 'TẤT CẢ' : (currentFilterDept?.code || 'PB')}
              </span>
              <span class="text-[12px] text-[#64748b]" style="color: var(--text-muted);">Danh bạ &amp; Nhân sự viện</span>
            </div>
            <h1 class="font-extrabold text-[20px] sm:text-[22px] text-[#0d1c2f] tracking-tight" style="color: var(--text);">
              Quản Lý Nhân Sự • ${esc(filterTitle)}
            </h1>
            <p class="text-[12.5px] text-[#817663] mt-0.5" style="color: var(--text-muted);">
              Theo dõi hồ sơ chuyên môn, phân bổ phòng ban &amp; bộ phận, đánh giá năng suất tất cả phòng ban
            </p>
          </div>

          <div class="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
            <span class="px-3.5 py-2 rounded-2xl font-mono-data text-[12px] font-bold shadow-2xs" style="background-color: var(--primary-soft); color: var(--primary); border: 1px solid var(--border);">
              ${filteredMembers.length} nhân sự
            </span>
            ${canManage ? `
              <button type="button" class="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-[12.5px] sm:text-[13px] shadow-xs hover:shadow-md transition-all min-h-[44px] cursor-pointer" id="btnOpenAddMember" style="background-color: var(--primary-container); color: var(--on-primary-container);">
                <span class="material-symbols-outlined text-[19px]">person_add</span>
                <span>Cấp Tài Khoản Mới</span>
              </button>
            ` : ''}
          </div>
        </div>

        <!-- 2. BỘ LỌC TABS PHÒNG BAN (DÀNH CHO ADMIN & LÃNH ĐẠO) + Ô TÌM KIẾM NHÂN SỰ -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-[#e2e8f0] shadow-sm" style="background-color: var(--card); border-color: var(--border);">
          
          <!-- TABS PHÒNG BAN (CUỘN NGANG MƯỢT MÀ TRÊN MOBILE) -->
          <div class="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0 flex-1 min-w-0" id="employeeDeptTabs">
            ${canSwitch ? `
              <button type="button" class="btn-emp-dept-filter px-3.5 py-2 rounded-xl text-[12px] font-bold transition-all shrink-0 flex items-center gap-1.5 min-h-[38px] cursor-pointer ${this.employeeDeptFilter === 'all' ? 'shadow-xs' : 'text-gray-600 hover:bg-gray-100'}" style="${this.employeeDeptFilter === 'all' ? 'background-color: var(--primary-container); color: var(--on-primary-container);' : ''}" data-dept-filter="all">
                <span>🏥 Tất cả</span>
                <span class="px-1.5 py-0.2 rounded-md text-[10.5px] font-mono-data font-bold bg-white/40">${allUsers.length}</span>
              </button>
            ` : ''}

            ${allDepts.map(d => {
              const dCount = allUsers.filter(u => u.departmentId === d.id).length;
              const isActive = this.employeeDeptFilter === d.id;
              return `
                <button type="button" class="btn-emp-dept-filter px-3.5 py-2 rounded-xl text-[12px] font-bold transition-all shrink-0 flex items-center gap-1.5 min-h-[38px] cursor-pointer ${isActive ? 'shadow-xs' : 'text-gray-600 hover:bg-gray-100'}" style="${isActive ? 'background-color: var(--primary-container); color: var(--on-primary-container);' : ''}" data-dept-filter="${d.id}">
                  <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${d.color || '#D6A52A'};"></span>
                  <span class="truncate max-w-[150px] sm:max-w-none">${esc(d.name)}</span>
                  <span class="px-1.5 py-0.2 rounded-md text-[10.5px] font-mono-data font-bold bg-black/10">${dCount}</span>
                </button>
              `;
            }).join('')}
          </div>

          <!-- Ô TÌM KIẾM NHÂN SỰ -->
          <div class="relative w-full sm:w-64 shrink-0">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-gray-400">search</span>
            <input type="text" id="inputEmployeeSearch" value="${esc(this.employeeSearchQuery || '')}" placeholder="Tìm theo tên, chức danh, email..." class="w-full h-11 pl-9 pr-3.5 rounded-lg border border-[#cbd5e1] text-[13px] outline-none bg-white text-[#0d1c2f] focus:border-[#d6a52a] transition-all" />
          </div>

        </div>

        <!-- 3. LƯỚI THẺ NHÂN SỰ (RESPONSIVE 1 - 2 - 3 COLS) -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="employeeCardsGrid">
          ${filteredMembers.length === 0 ? `
            <div class="col-span-full p-10 rounded-2xl text-center bg-white border border-dashed border-[#e2e8f0] flex flex-col items-center justify-center gap-3" style="background-color: var(--card); border-color: var(--border);">
              <div class="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <span class="material-symbols-outlined text-[30px]">group_off</span>
              </div>
              <div>
                <h4 class="font-bold text-[15px] text-[#0d1c2f]">Không tìm thấy nhân sự phù hợp</h4>
                <p class="text-[12px] text-[#817663] mt-1">
                  ${this.employeeSearchQuery ? 'Thử tìm với từ khóa khác hoặc xóa ô tìm kiếm.' : 'Chưa có nhân sự nào trong phòng ban này.'}
                </p>
              </div>
              ${canManage ? `
                <button type="button" class="btn-empty-add-emp-card px-4 py-2.5 rounded-xl font-bold text-[12.5px] shadow-xs flex items-center gap-1.5 cursor-pointer mt-1" style="background-color: var(--primary-container); color: var(--on-primary-container);">
                  <span class="material-symbols-outlined text-[18px]">person_add</span>
                  <span>Cấp Tài Khoản Mới</span>
                </button>
              ` : ''}
            </div>
          ` : filteredMembers.map(u => {
            const userDept = allDepts.find(d => d.id === u.departmentId);
            const userTeam = userDept?.teams?.find(t => t.id === u.teamId);
            const userTasks = store.getAllTasksRaw().filter(t => t.assigneeId === u.id);
            const done = userTasks.filter(t => t.status === 'done' || t.status === 'completed').length;
            const inProg = userTasks.filter(t => t.status === 'in_progress' || t.status === 'pending_approval' || t.status === 'review').length;
            const isSelf = auth.getCurrentUser().id === u.id;
            const isUserAdmin = Boolean(u.isAdmin || u.role === 'ADMIN');

            let roleBadge = { text: 'Chuyên Viên', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: 'person' };
            if (u.role === 'LEADERSHIP') roleBadge = { text: 'Ban Lãnh Đạo', color: 'bg-purple-100 text-purple-900 border-purple-300', icon: 'account_balance' };
            else if (u.role === 'MANAGER') roleBadge = { text: 'Trưởng Phòng', color: 'bg-[#fef3c7] text-[#92400e] border-amber-300 font-extrabold', icon: 'verified' };
            else if (u.role === 'DEPUTY_MANAGER') roleBadge = { text: 'Phó Phòng', color: 'bg-indigo-100 text-indigo-900 border-indigo-300 font-extrabold', icon: 'stars' };

            return `
              <div class="bg-white p-4 sm:p-5 rounded-3xl border border-[#e2e8f0] shadow-sm flex flex-col justify-between hover:border-[#d6a52a] hover:shadow-md transition-all relative group" style="background-color: var(--card); border-color: var(--border);">
                
                ${canManage ? `
                  <div class="absolute top-3.5 right-3.5 flex items-center gap-1 z-10">
                    <button type="button" class="p-2 rounded-xl hover:bg-[#f1f5f9] text-[#64748b] hover:text-[#0d1c2f] btn-edit-member min-w-[38px] min-h-[38px] flex items-center justify-center transition-colors cursor-pointer" data-member-id="${u.id}" title="Sửa thông tin nhân viên">
                      <span class="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    ${!isUserAdmin && !isSelf ? `
                      <button type="button" class="p-2 rounded-xl hover:bg-red-50 text-[#64748b] hover:text-red-600 btn-delete-member min-w-[38px] min-h-[38px] flex items-center justify-center transition-colors cursor-pointer" data-member-id="${u.id}" data-member-name="${esc(u.name)}" title="Xóa nhân viên">
                        <span class="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    ` : ''}
                  </div>
                ` : ''}

                <!-- THÔNG TIN ĐỊNH DANH NHÂN SỰ -->
                <div class="flex flex-col gap-3">
                  
                  <!-- AVATAR & HỌ TÊN (ĐẨY LÊN ĐẦU ĐỂ KHÔNG BỊ LỆCH HÀNG KHI NHIỀU BADGE) -->
                  <div class="flex items-start gap-3.5 pr-20">
                    <div class="relative shrink-0">
                      <img src="${u.avatar}" class="w-12 h-12 rounded-2xl object-cover ring-2 ring-gray-100 shadow-2xs" alt="${esc(u.name)}" />
                      ${u.role === 'MANAGER' ? '<span class="absolute -top-1.5 -right-1.5 text-[11px]">👑</span>' : ''}
                    </div>

                    <div class="min-w-0 flex-1">
                      <div class="font-bold text-[14.5px] sm:text-[15px] text-[#0d1c2f] truncate flex items-center gap-1.5" style="color: var(--text);">
                        <span class="truncate">${esc(u.name)}</span>
                        ${isSelf ? '<span class="text-[9.5px] text-[#795900] bg-[#fffbeb] px-1.5 py-0.2 rounded border border-[#fef3c7] font-bold shrink-0">Bạn</span>' : ''}
                      </div>
                      <div class="text-[12px] font-semibold text-[#795900] truncate mt-0.5" style="color: var(--primary);">
                        ${esc(u.title || 'Chuyên viên')}
                      </div>
                      <div class="text-[11px] text-[#64748b] truncate mt-0.5 font-mono-data" style="color: var(--text-muted);">
                        ${esc(u.email || u.phone || u.username || '')}
                      </div>
                    </div>
                  </div>

                  <!-- BADGES: PHÒNG BAN & VAI TRÒ & BỘ PHẬN ĐƯA XUỐNG DƯỚI EMAIL -->
                  <div class="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span class="px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono-data uppercase text-white shadow-2xs" style="background-color: ${userDept?.color || '#D6A52A'};">
                      ${esc(userDept?.code || 'TẤT CẢ')}
                    </span>
                    <span class="px-2 py-0.5 rounded-lg text-[10.5px] font-bold border flex items-center gap-1 ${roleBadge.color}">
                      <span>${roleBadge.text}</span>
                    </span>
                    ${isUserAdmin ? `
                      <span class="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-[#fffbeb] text-[#795900] border border-[#fef3c7] flex items-center gap-1 shadow-2xs">
                        <span class="material-symbols-outlined text-[13px] text-[#d6a52a]">admin_panel_settings</span>
                        <span>Admin Hệ Thống</span>
                      </span>
                    ` : ''}
                    ${userTeam ? `
                      <span class="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#f1f5f9] text-[#475569] border border-gray-200">
                        ${esc(userTeam.name)}
                      </span>
                    ` : ''}
                  </div>

                </div>

                <!-- CHỈ SỐ CÔNG VIỆC -->
                <div class="grid grid-cols-2 gap-2 pt-3.5 border-t border-[#f1f5f9] text-center mt-3" style="border-color: var(--border);">
                  <div class="p-2 rounded-xl bg-[#f8f9ff]" style="background-color: var(--background);">
                    <span class="text-[10px] text-[#64748b] uppercase font-bold" style="color: var(--text-muted);">Đang thực hiện</span>
                    <div class="text-[17px] font-extrabold text-[#1d4ed8]">${inProg}</div>
                  </div>
                  <div class="p-2 rounded-xl bg-[#f8f9ff]" style="background-color: var(--background);">
                    <span class="text-[10px] text-[#64748b] uppercase font-bold" style="color: var(--text-muted);">Đã hoàn thành</span>
                    <div class="text-[17px] font-extrabold text-[#16a34a]">${done}</div>
                  </div>
                </div>

              </div>
            `;
          }).join('')}
        </div>

      </div>
    `;

    // Bind events
    const btnAdd = canvas.querySelector('#btnOpenAddMember');
    if (btnAdd) {
      btnAdd.addEventListener('click', () => {
        rung(10);
        const defaultDept = (this.employeeDeptFilter === 'all') ? null : this.employeeDeptFilter;
        this.memberModal.show(null, defaultDept);
      });
    }

    const btnEmptyAdd = canvas.querySelector('.btn-empty-add-emp-card');
    if (btnEmptyAdd) {
      btnEmptyAdd.addEventListener('click', () => {
        rung(10);
        const defaultDept = (this.employeeDeptFilter === 'all') ? null : this.employeeDeptFilter;
        this.memberModal.show(null, defaultDept);
      });
    }

    // Tabs chuyển đổi phòng ban
    canvas.querySelectorAll('.btn-emp-dept-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        rung(10);
        const deptId = btn.dataset.deptFilter;
        this.employeeDeptFilter = deptId;
        // Nếu chọn phòng cụ thể, đồng bộ active department cho hệ thống
        if (deptId !== 'all' && auth.canSwitchDepartment()) {
          auth.switchDepartment(deptId);
        }
        this.renderEmployeesView();
      });
    });

    // Ô tìm kiếm nhân sự
    const inputSearch = canvas.querySelector('#inputEmployeeSearch');
    if (inputSearch) {
      inputSearch.addEventListener('input', (e) => {
        this.employeeSearchQuery = e.target.value;
        this.renderEmployeesView();
      });
    }

    // Nút sửa nhân viên
    canvas.querySelectorAll('.btn-edit-member').forEach(btn => {
      btn.addEventListener('click', () => {
        rung(10);
        const mid = btn.dataset.memberId;
        this.memberModal.show(mid);
      });
    });

    // Nút xóa nhân viên
    canvas.querySelectorAll('.btn-delete-member').forEach(btn => {
      btn.addEventListener('click', () => {
        rung(20);
        const mid = btn.dataset.memberId;
        const mname = btn.dataset.memberName;
        xacNhan2Lan('del_member_' + mid, `Xóa nhân sự "${mname}"`, () => {
          store.deleteUser(mid);
          toast(`Đã xóa nhân viên: ${mname}`, 'info');
          this.renderEmployeesView();
        });
      });
    });

    if (prevScrollY > 0) {
      window.scrollTo({ top: prevScrollY, behavior: 'instant' });
      requestAnimationFrame(() => {
        window.scrollTo({ top: prevScrollY, behavior: 'instant' });
      });
    }
  }

  // --- MÀN HÌNH CÀI ĐẶT 2 CỘT CÂN XỨNG (GRID LAYOUT RESPONSIVE) ---
  renderSettingsView() {
    const canvas = document.getElementById('main-content-canvas');
    const endpoint = appScriptBridge.getEndpoint();
    const isConnected = appScriptBridge.isConnected();
    const currentDept = auth.getActiveDepartment();

    canvas.innerHTML = `
      <div class="flex flex-col gap-5 sm:gap-6 animate-fade-in w-full max-w-7xl mx-auto pb-12 overflow-x-hidden">
        <!-- 1. HEADER BANNER CÀI ĐẶT -->
        <div class="bg-white p-4 sm:p-6 rounded-2xl border border-[#e2e8f0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3.5">
            <div class="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#fffbeb] text-[#795900] flex items-center justify-center font-bold border border-[#fef3c7] shadow-xs shrink-0">
              <span class="material-symbols-outlined text-[24px] sm:text-[26px]">tune</span>
            </div>
            <div>
              <div class="flex items-center gap-2 mb-0.5">
                <span class="font-mono-data text-[11px] text-[#795900] font-bold bg-[#fffbeb] px-2 py-0.5 rounded border border-[#fef3c7]">${currentDept.code}</span>
                <span class="text-[11.5px] sm:text-[12px] text-[#64748b]">• Trung tâm điều phối hệ thống</span>
              </div>
              <h1 class="text-[18px] sm:text-[22px] font-extrabold text-[#0d1c2f] tracking-tight">Cài Đặt Hệ Thống &amp; Tích Hợp Nền Tảng</h1>
              <p class="text-[12px] sm:text-[13px] text-[#64748b]">Quản lý kết nối Google Sheets / SHIN AIOS, bảo mật phân quyền và sao lưu cơ sở dữ liệu</p>
            </div>
          </div>

          <button type="button" class="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#d6a52a] text-[#533d00] text-[13px] font-bold hover:bg-[#795900] hover:text-white flex items-center justify-center gap-2 shadow-xs transition-all shrink-0 min-h-[44px]" id="btnTriggerModalSettings">
            <span class="material-symbols-outlined text-[18px]">open_in_new</span>
            <span>Mở Cửa Sổ Popup</span>
          </button>
        </div>

        <!-- 2. BỐ CỤC 2 CỘT CÂN ĐỐI (GRID 12 CỘT: 7 CỘT TRÁI & 5 CỘT PHẢI) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          
          <!-- CỘT TRÁI (COL-SPAN-7): TÍCH HỢP CLOUD GOOGLE APPS SCRIPT -->
          <div class="lg:col-span-7 flex flex-col gap-5 sm:gap-6">
            
            <!-- THẺ KẾT NỐI CLOUD -->
            <div class="bg-white p-4 sm:p-6 rounded-2xl border border-[#e2e8f0] shadow-sm flex flex-col gap-4">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-[#f1f5f9] gap-2">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-[#fffbeb] text-[#795900] flex items-center justify-center font-bold border border-[#fef3c7] shrink-0">
                    <span class="material-symbols-outlined text-[22px]">cloud_sync</span>
                  </div>
                  <div>
                    <h3 class="text-[15px] sm:text-[15.5px] font-bold text-[#0d1c2f]">Cổng Kết Nối Google Sheets (Apps Script Webhook)</h3>
                    <p class="text-[12px] text-[#64748b]">Đồng bộ 2 chiều dữ liệu thực tế với Google Sheets tương tự SHIN AIOS</p>
                  </div>
                </div>
                <span class="px-3 py-1 rounded-full text-[11px] sm:text-[11.5px] font-bold shrink-0 self-start sm:self-auto ${isConnected ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-[#fffbeb] text-[#795900] border border-[#fef3c7]'}">
                  ${isConnected ? '● Đã kết nối Cloud' : '○ Chế độ LocalStorage'}
                </span>
              </div>

              <div>
                <label class="block text-[12.5px] font-bold text-[#0d1c2f] mb-1.5">URL Google Apps Script Web App Endpoint</label>
                <div class="flex flex-col sm:flex-row gap-2">
                  <input type="url" id="inputGasUrl" value="${esc(endpoint)}" placeholder="https://script.google.com/macros/s/.../exec" class="flex-1 h-11 px-3.5 rounded-xl border border-[#e2e8f0] text-[13px] outline-none focus:border-[#d6a52a] bg-[#f8f9ff] text-[#0d1c2f]" />
                  <button type="button" class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#d6a52a] text-[#533d00] font-bold text-[13px] hover:bg-[#795900] hover:text-white transition-all shrink-0 shadow-xs min-h-[44px]" id="btnSaveGasUrl">
                    Lưu URL
                  </button>
                </div>
                
                <div class="mt-3 p-3 rounded-xl bg-[#fffbeb] border border-[#fef3c7] text-[12px] text-[#795900] leading-relaxed flex items-start gap-2">
                  <span class="material-symbols-outlined text-[18px] shrink-0 mt-0.5">info</span>
                  <span><strong>Lưu ý quan trọng khi triển khai:</strong> Trong cài đặt Deploy của Apps Script, mục <em>"Who has access (Ai có quyền truy cập)"</em> BẮT BUỘC chọn là <strong>"Anyone (Bất kỳ ai)"</strong> để trình duyệt không bị lỗi chặn bảo mật CORS.</span>
                </div>
              </div>

              <!-- HÀNG THAO TÁC ĐỒNG BỘ 2 CHIỀU -->
              <div class="p-3.5 sm:p-4 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div class="text-[12px] sm:text-[12.5px] text-[#0d1c2f]">
                  Lần đồng bộ gần nhất: <br />
                  <strong class="text-[#795900] font-mono-data">${appScriptBridge.lastSyncTime ? new Date(appScriptBridge.lastSyncTime).toLocaleString('vi-VN') : 'Chưa có lượt đồng bộ nào'}</strong>
                </div>

                <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <button type="button" class="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white border border-[#d6a52a] text-[12px] font-bold text-[#795900] hover:bg-[#fffbeb] flex items-center justify-center gap-1.5 shadow-xs transition-all min-h-[44px]" id="btnPushToSheet">
                    <span class="material-symbols-outlined text-[17px]">upload</span>
                    <span>📤 Đẩy lên Sheet</span>
                  </button>
                  <button type="button" class="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#795900] text-white text-[12px] font-bold hover:bg-[#533d00] flex items-center justify-center gap-1.5 shadow-xs transition-all min-h-[44px]" id="btnPullFromSheet">
                    <span class="material-symbols-outlined text-[17px]">download</span>
                    <span>📥 Tải về ngay</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- THẺ HƯỚNG DẪN TRIỂN KHAI 3 BƯỚC -->
            <div class="bg-white p-4 sm:p-6 rounded-2xl border border-[#e2e8f0] shadow-sm flex flex-col gap-3.5">
              <h3 class="text-[15px] font-bold text-[#0d1c2f] flex items-center gap-2">
                <span class="material-symbols-outlined text-[#795900] text-[20px]">terminal</span>
                <span>Hướng Dẫn 3 Bước Kết Nối Google Sheets Thực Tế</span>
              </h3>

              <div class="space-y-3 text-[12.5px] text-[#4f4635]">
                <div class="p-3 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0]">
                  <strong class="text-[#0d1c2f]">Bước 1: Mở Google Sheet</strong>
                  <p class="mt-1">Tạo một Google Sheet mới trên Drive của bạn, chọn menu <em>Tiện ích mở rộng (Extensions) &gt; Apps Script</em>.</p>
                </div>

                <div class="p-3 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0]">
                  <strong class="text-[#0d1c2f]">Bước 2: Dán Code Google Apps Script</strong>
                  <p class="mt-1">Dán file code mã nguồn Apps Script hỗ trợ hàm <code>doGet</code> và <code>doPost</code> được cung cấp sẵn trong dự án.</p>
                </div>

                <div class="p-3 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0]">
                  <strong class="text-[#0d1c2f]">Bước 3: Triển khai (Deploy) Web App</strong>
                  <p class="mt-1">Bấm <strong>Deploy &gt; New deployment &gt; Loại: Web app</strong>. Mục <strong>Who has access</strong> chọn <strong>"Anyone"</strong>, bấm Deploy rồi sao chép URL dán vào ô bên trên.</p>
                </div>
              </div>
            </div>

          </div>

          <!-- CỘT PHẢI (COL-SPAN-5): THƯƠNG HIỆU, PHÂN QUYỀN & SAO LƯU -->
          <div class="lg:col-span-5 flex flex-col gap-5 sm:gap-6">
            
            <!-- MỤC ĐỔI MÀU GIAO DIỆN SHIN AIOS (CHỦ ĐẠO YÊU CẦU: 8 PALETTES, DARK/LIGHT, CỠ CHỮ, BOTTOM NAV) -->
            ${shinTheme.renderSettingsUI()}

            <!-- THẺ PHÂN QUYỀN RBAC 3 CẤP -->
            <div class="bg-white p-4 sm:p-6 rounded-2xl border border-[#e2e8f0] shadow-sm flex flex-col gap-3.5">
              <div class="flex items-center gap-2.5 pb-3 border-b border-[#f1f5f9]">
                <span class="material-symbols-outlined text-[#795900] text-[22px]">verified_user</span>
                <h3 class="font-bold text-[15px] text-[#0d1c2f]">Bảo Mật &amp; Phân Quyền RBAC 3 Cấp</h3>
              </div>

              <div class="space-y-2 text-[12px]">
                <div class="p-2.5 rounded-xl bg-[#fffbeb] border border-[#fef3c7] flex items-center justify-between">
                  <div>
                    <strong class="text-[#795900]">👑 Quản Trị Viên (Admin)</strong>
                    <div class="text-[#64748b] text-[11px] mt-0.5">Toàn quyền hệ thống, chuyển đổi đa phòng ban</div>
                  </div>
                  <span class="px-2 py-0.5 rounded-md bg-[#ffdea9] text-[#5f4100] font-bold text-[10px]">ALL ACCESS</span>
                </div>

                <div class="p-2.5 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] flex items-center justify-between">
                  <div>
                    <strong class="text-[#0d1c2f]">👔 Trưởng Phòng (Manager)</strong>
                    <div class="text-[#64748b] text-[11px] mt-0.5">Giao việc, duyệt nghiệm thu, quản lý nhân viên phòng</div>
                  </div>
                  <span class="px-2 py-0.5 rounded-md bg-[#dcfce7] text-[#16a34a] font-bold text-[10px]">DEPT LEAD</span>
                </div>

                <div class="p-2.5 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] flex items-center justify-between">
                  <div>
                    <strong class="text-[#0d1c2f]">👤 Nhân Viên (Staff)</strong>
                    <div class="text-[#64748b] text-[11px] mt-0.5">Cập nhật tiến độ việc cá nhân, gửi chờ duyệt</div>
                  </div>
                  <span class="px-2 py-0.5 rounded-md bg-[#f1f5f9] text-[#475569] font-bold text-[10px]">OPERATIONAL</span>
                </div>
              </div>
            </div>

            <!-- THẺ QUẢN TRỊ DỮ LIỆU & SAO LƯU BACKUP -->
            <div class="bg-white p-4 sm:p-6 rounded-2xl border border-[#e2e8f0] shadow-sm flex flex-col gap-3.5">
              <div class="flex items-center gap-2.5 pb-3 border-b border-[#f1f5f9]">
                <span class="material-symbols-outlined text-[#795900] text-[22px]">database</span>
                <h3 class="font-bold text-[15px] text-[#0d1c2f]">Quản Trị Cơ Sở Dữ Liệu</h3>
              </div>

              <div class="flex flex-col gap-2.5">
                <button type="button" class="w-full py-2.5 px-4 rounded-xl bg-[#f8f9ff] hover:bg-[#fffbeb] text-[#795900] border border-[#e2e8f0] hover:border-[#d6a52a] text-[12.5px] font-bold flex items-center justify-center gap-2 transition-all min-h-[44px]" id="btnExportBackup">
                  <span class="material-symbols-outlined text-[18px]">download_for_offline</span>
                  <span>📥 Xuất tệp sao lưu (Backup JSON)</span>
                </button>

                <button type="button" class="w-full py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-[12.5px] font-bold flex items-center justify-center gap-2 transition-all min-h-[44px]" id="btnResetData">
                  <span class="material-symbols-outlined text-[18px]">restart_alt</span>
                  <span>🔄 Khôi phục dữ liệu gốc mẫu</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    `;

    // Bind event handlers
    shinTheme.bindEvents(canvas, () => {
      this.renderSettingsView();
    });

    const btnTrigger = canvas.querySelector('#btnTriggerModalSettings');
    if (btnTrigger) {
      btnTrigger.addEventListener('click', () => {
        rung(10);
        this.settingsModal.show();
      });
    }

    const btnSaveGas = canvas.querySelector('#btnSaveGasUrl');
    const inputGas = canvas.querySelector('#inputGasUrl');
    if (btnSaveGas && inputGas) {
      btnSaveGas.addEventListener('click', () => {
        rung(10);
        const url = inputGas.value.trim();
        appScriptBridge.setEndpoint(url);
        toast('Đã lưu URL Google Apps Script thành công!', 'success');
        this.renderSettingsView();
      });
    }

    const btnPush = canvas.querySelector('#btnPushToSheet');
    if (btnPush) {
      btnPush.addEventListener('click', async () => {
        rung(15);
        btnPush.disabled = true;
        btnPush.innerHTML = `<span class="material-symbols-outlined text-[17px] animate-spin">sync</span><span>Đang đồng bộ...</span>`;
        try {
          const res = await appScriptBridge.pushAllToCloud();
          if (res.success) {
            toast('Đã đẩy toàn bộ dữ liệu lên Google Sheets thành công!', 'success');
          } else {
            toast('Lỗi khi đẩy lên Google Sheets: ' + (res.error || 'CORS hoặc URL không hợp lệ'), 'warning');
          }
        } catch (err) {
          toast('Lỗi kết nối: ' + err.message, 'warning');
        } finally {
          btnPush.disabled = false;
          this.renderSettingsView();
        }
      });
    }

    const btnPull = canvas.querySelector('#btnPullFromSheet');
    if (btnPull) {
      btnPull.addEventListener('click', async () => {
        rung(15);
        btnPull.disabled = true;
        btnPull.innerHTML = `<span class="material-symbols-outlined text-[17px] animate-spin">sync</span><span>Đang tải về...</span>`;
        try {
          const res = await appScriptBridge.fetchCloudData();
          if (res.success) {
            toast('Đã kéo dữ liệu từ Google Sheets về thành công!', 'success');
            this.renderCurrentView();
          } else {
            toast('Lỗi tải dữ liệu: ' + (res.error || 'Kiểm tra quyền Anyone của Web App'), 'warning');
          }
        } catch (err) {
          toast('Lỗi: ' + err.message, 'warning');
        } finally {
          btnPull.disabled = false;
          this.renderSettingsView();
        }
      });
    }

    const btnExport = canvas.querySelector('#btnExportBackup');
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        rung(10);
        const backupData = {
          tasks: store.tasks,
          users: store.users,
          departments: store.departments,
          exportedAt: new Date().toISOString(),
          version: '3.8'
        };
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_thanhvu_cs3_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast('Đã tải tệp sao lưu dữ liệu JSON về máy thành công!', 'success');
      });
    }

    const btnReset = canvas.querySelector('#btnResetData');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        rung(20);
        xacNhan2Lan('reset_defaults', 'Khôi phục toàn bộ dữ liệu gốc', () => {
          store.resetDefaults();
          toast('Đã khôi phục dữ liệu gốc mẫu thành công!', 'info');
          this.renderSettingsView();
        });
      });
    }
  }
}

// Khởi chạy khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
  window.TVM_APP = app;
});



/**
 * THANH VŨ MEDIC CS3 - MAIN APPLICATION CONTROLLER
 * Điều phối Router, Reactive Events và Components chuẩn Stitch
 */

import { auth } from './auth.js';
import { store } from './store.js';
import { Sidebar } from './components/sidebar.js';
import { TopHeader } from './components/topHeader.js';
import { DashboardView } from './components/dashboardView.js';
import { WorkspaceView } from './components/workspaceView.js';
import { TaskDrawer } from './components/taskDrawer.js';
import { CreateTaskModal } from './components/createTaskModal.js';
import { toast } from './helpers.js';

class App {
  constructor() {
    this.currentNav = 'tong-quan'; // 'tong-quan' | 'cong-viec' | 'nhan-vien' | 'cai-dat'
    this.sidebar = null;
    this.header = null;
    this.dashboardView = null;
    this.workspaceView = null;
    this.taskDrawer = null;
    this.createTaskModal = null;
  }

  init() {
    console.log('🚀 [THANH VŨ MEDIC CS3] Khởi chạy hệ thống theo chuẩn Google Stitch...');

    // Khởi tạo các Component
    this.sidebar = new Sidebar('sidebar-container', 
      (navId) => this.switchNav(navId),
      (mode) => this.onModeChange(mode)
    );

    this.header = new TopHeader('header-container',
      (query) => this.onSearch(query),
      () => this.openCreateModal()
    );

    this.taskDrawer = new TaskDrawer('drawer-container', () => this.refreshCurrentView());
    this.createTaskModal = new CreateTaskModal('modal-container', () => this.refreshCurrentView());

    this.dashboardView = new DashboardView('main-content-canvas',
      (filterTab) => {
        this.switchNav('cong-viec');
        if (filterTab && this.workspaceView) {
          if (filterTab === 'in_progress') this.workspaceView.setTab('all');
          else if (filterTab === 'completed') this.workspaceView.setTab('completed');
          else if (filterTab === 'pending_approval') this.workspaceView.setTab('pending_approval');
        }
      },
      () => this.openCreateModal(),
      (taskId) => this.taskDrawer.open(taskId)
    );

    this.workspaceView = new WorkspaceView('main-content-canvas',
      () => this.openCreateModal(),
      (taskId) => this.taskDrawer.open(taskId)
    );

    this.bindGlobalEvents();
    this.render();
  }

  render() {
    this.sidebar.render();
    this.header.render();
    this.renderCurrentView();
  }

  renderCurrentView() {
    if (this.currentNav === 'tong-quan') {
      this.dashboardView.render();
    } else if (this.currentNav === 'cong-viec') {
      this.workspaceView.render();
    } else if (this.currentNav === 'nhan-vien') {
      this.renderEmployeesView();
    } else if (this.currentNav === 'cai-dat') {
      this.renderSettingsView();
    }
  }

  switchNav(navId) {
    this.currentNav = navId;
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

  openCreateModal() {
    if (!auth.canCreateTask()) {
      toast('Quyền hạn bị từ chối: Chỉ Trưởng phòng hoặc Admin mới được giao việc mới!', 'warning');
      return;
    }
    this.createTaskModal.show();
  }

  refreshCurrentView() {
    this.header.render();
    this.renderCurrentView();
  }

  bindGlobalEvents() {
    window.addEventListener('tvm:auth_changed', () => {
      this.sidebar.render();
      this.header.render();
      this.renderCurrentView();
    });

    window.addEventListener('tvm:department_changed', () => {
      this.sidebar.render();
      this.header.render();
      this.renderCurrentView();
    });

    window.addEventListener('tvm:data_changed', () => {
      this.header.render();
      this.renderCurrentView();
    });

    // Phím tắt ⌘K hoặc Ctrl+K để focus thanh tìm kiếm
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('topSearchInput');
        if (searchInput) searchInput.focus();
      }
    });
  }

  renderEmployeesView() {
    const canvas = document.getElementById('main-content-canvas');
    const currentDept = auth.getActiveDepartment();
    const members = store.getDepartmentUsers(currentDept.id);

    canvas.innerHTML = `
      <div class="flex flex-col gap-4 animate-fade-in">
        <div class="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-sm flex items-center justify-between">
          <div>
            <h1 class="text-[20px] font-bold text-[#0d1c2f]">Đội Ngũ Nhân Sự • ${currentDept.name}</h1>
            <p class="text-[12.5px] text-[#64748b] mt-0.5">${currentDept.unit} • Quản lý phân bổ công việc theo ca</p>
          </div>
          <span class="px-3 py-1 rounded-full bg-[#ffdea9] text-[#5f4100] text-[12px] font-bold">
            ${members.length} nhân sự
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${members.map(u => {
            const userTasks = store.getDepartmentTasks().filter(t => t.assigneeId === u.id);
            const done = userTasks.filter(t => t.status === 'done').length;
            const inProg = userTasks.filter(t => t.status === 'in_progress').length;
            return `
              <div class="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-sm flex flex-col justify-between hover:border-[#d6a52a] transition-all">
                <div class="flex items-center gap-3 mb-4">
                  <img src="${u.avatar}" class="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100" />
                  <div>
                    <div class="font-bold text-[14.5px] text-[#0d1c2f]">${u.name}</div>
                    <div class="text-[12px] text-[#795900] font-semibold">${u.title}</div>
                    <div class="text-[11px] text-[#64748b]">${u.unit}</div>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-2 pt-3 border-t border-[#f1f5f9] text-center">
                  <div class="p-2 rounded-lg bg-[#f8f9ff]">
                    <span class="text-[10px] text-[#64748b] uppercase font-bold">Đang làm</span>
                    <div class="text-[16px] font-extrabold text-blue-600">${inProg}</div>
                  </div>
                  <div class="p-2 rounded-lg bg-[#f8f9ff]">
                    <span class="text-[10px] text-[#64748b] uppercase font-bold">Hoàn tất</span>
                    <div class="text-[16px] font-extrabold text-emerald-600">${done}</div>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  renderSettingsView() {
    const canvas = document.getElementById('main-content-canvas');
    canvas.innerHTML = `
      <div class="flex flex-col gap-4 animate-fade-in max-w-2xl">
        <div class="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-sm">
          <h1 class="text-[20px] font-bold text-[#0d1c2f]">Cài Đặt Hệ Thống</h1>
          <p class="text-[12.5px] text-[#64748b] mt-0.5">Cấu hình giao diện chuẩn Google Stitch &amp; Bệnh viện Thanh Vũ Medic CS3</p>
        </div>

        <div class="bg-white p-6 rounded-xl border border-[#e2e8f0] shadow-sm flex flex-col gap-4">
          <div class="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
            <div>
              <div class="text-[13.5px] font-bold text-[#0d1c2f]">Giao diện Google Stitch (Gold Theme)</div>
              <div class="text-[11.5px] text-[#64748b]">Bảng màu Vàng Hoàng Gia #D6A52A kết hợp Plus Jakarta Sans</div>
            </div>
            <span class="px-2.5 py-1 rounded-full bg-[#dcfce7] text-[#16a34a] text-[11px] font-bold">Đang kích hoạt</span>
          </div>

          <div class="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
            <div>
              <div class="text-[13.5px] font-bold text-[#0d1c2f]">Kiến trúc Đa Phòng Ban (Multi-Tenant)</div>
              <div class="text-[11.5px] text-[#64748b]">Cô lập dữ liệu giữa các phòng ban: PTKH, Kho Dược, QLDA</div>
            </div>
            <span class="px-2.5 py-1 rounded-full bg-[#ffdea9] text-[#5f4100] text-[11px] font-bold">Sẵn sàng mở rộng</span>
          </div>

          <div class="pt-2">
            <button type="button" class="px-4 py-2 rounded-lg bg-red-50 text-red-600 border border-red-200 text-[12.5px] font-bold hover:bg-red-100 transition-colors" id="btnResetAllData">
              🔄 Khôi phục dữ liệu ban đầu
            </button>
          </div>
        </div>
      </div>
    `;

    const btnReset = canvas.querySelector('#btnResetAllData');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        localStorage.clear();
        location.reload();
      });
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});

/**
 * THANH VŨ MEDIC CS3 - MAIN APPLICATION CONTROLLER
 * Tích hợp Quản lý nhân viên (Thêm/Sửa/Xóa), Profile Modal và Google Apps Script Cloud Sync
 */

import { auth } from './auth.js';
import { store } from './store.js';
import { Sidebar } from './components/sidebar.js';
import { TopHeader } from './components/topHeader.js';
import { DashboardView } from './components/dashboardView.js';
import { WorkspaceView } from './components/workspaceView.js';
import { TaskDrawer } from './components/taskDrawer.js';
import { CreateTaskModal } from './components/createTaskModal.js';
import { ProfileModal } from './components/profileModal.js';
import { MemberModal } from './components/memberModal.js';
import { appScriptBridge } from './services/appScriptBridge.js';
import { toast, rung } from './helpers.js';

class App {
  constructor() {
    this.currentNav = 'tong-quan'; // 'tong-quan' | 'cong-viec' | 'nhan-vien' | 'cai-dat'
    this.sidebar = null;
    this.header = null;
    this.dashboardView = null;
    this.workspaceView = null;
    this.taskDrawer = null;
    this.createTaskModal = null;
    this.profileModal = null;
    this.memberModal = null;
  }

  init() {
    console.log('🚀 [THANH VŨ MEDIC CS3] Khởi chạy hệ thống tích hợp Cloud Sync & Quản lý nhân sự...');

    this.sidebar = new Sidebar('sidebar-container', 
      (navId) => this.switchNav(navId),
      (mode) => this.onModeChange(mode)
    );

    this.profileModal = new ProfileModal('modal-container', () => this.refreshCurrentView());
    this.memberModal = new MemberModal('modal-container', () => this.refreshCurrentView());

    this.header = new TopHeader('header-container',
      (query) => this.onSearch(query),
      () => this.openCreateModal(),
      () => this.profileModal.show()
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

    window.addEventListener('tvm:users_changed', () => {
      this.header.render();
      this.renderCurrentView();
    });

    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('topSearchInput');
        if (searchInput) searchInput.focus();
      }
    });
  }

  // --- MÀN HÌNH QUẢN LÝ NHÂN VIÊN (CÓ QUYỀN THÊM / SỬA / XÓA) ---
  renderEmployeesView() {
    const canvas = document.getElementById('main-content-canvas');
    const currentDept = auth.getActiveDepartment();
    const members = store.getDepartmentUsers(currentDept.id);
    const canManage = auth.canManageMembers();

    canvas.innerHTML = `
      <div class="flex flex-col gap-4 animate-fade-in">
        <div class="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 class="text-[20px] font-bold text-[#0d1c2f]">Quản Lý Nhân Sự • ${currentDept.name}</h1>
            <p class="text-[12.5px] text-[#64748b] mt-0.5">${currentDept.unit} • Danh bạ chuyên viên &amp; phân bổ công việc</p>
          </div>

          <div class="flex items-center gap-2.5">
            <span class="px-3 py-1 rounded-full bg-[#ffdea9] text-[#5f4100] text-[12px] font-bold">
              ${members.length} nhân sự
            </span>
            ${canManage ? `
              <button type="button" class="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#d6a52a] text-[#533d00] font-bold text-[13px] hover:bg-[#795900] hover:text-white shadow-xs transition-all" id="btnOpenAddMember">
                <span class="material-symbols-outlined text-[18px]">person_add</span>
                <span>+ Thêm nhân viên</span>
              </button>
            ` : ''}
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${members.map(u => {
            const userTasks = store.getDepartmentTasks().filter(t => t.assigneeId === u.id);
            const done = userTasks.filter(t => t.status === 'done').length;
            const inProg = userTasks.filter(t => t.status === 'in_progress').length;
            const isSelf = auth.getCurrentUser().id === u.id;

            return `
              <div class="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-sm flex flex-col justify-between hover:border-[#d6a52a] transition-all relative group">
                ${canManage ? `
                  <div class="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button type="button" class="p-1.5 rounded-md hover:bg-[#f1f5f9] text-[#64748b] hover:text-[#0d1c2f] btn-edit-member" data-member-id="${u.id}" title="Sửa thông tin nhân viên">
                      <span class="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    ${u.role !== 'ADMIN' && !isSelf ? `
                      <button type="button" class="p-1.5 rounded-md hover:bg-red-50 text-[#64748b] hover:text-red-600 btn-delete-member" data-member-id="${u.id}" data-member-name="${u.name}" title="Xóa nhân viên">
                        <span class="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    ` : ''}
                  </div>
                ` : ''}

                <div class="flex items-center gap-3 mb-4">
                  <img src="${u.avatar}" class="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100 shrink-0" />
                  <div class="min-w-0 pr-8">
                    <div class="font-bold text-[14.5px] text-[#0d1c2f] truncate">${u.name} ${isSelf ? '<span class="text-[10px] text-[#795900] bg-[#fffbeb] px-1.5 py-0.5 rounded border border-[#fef3c7] font-bold">Bạn</span>' : ''}</div>
                    <div class="text-[12px] text-[#795900] font-semibold truncate">${u.title}</div>
                    <div class="text-[11px] text-[#64748b] truncate">${u.email || u.phone || u.unit}</div>
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

    // Bind events
    const btnAdd = canvas.querySelector('#btnOpenAddMember');
    if (btnAdd) {
      btnAdd.addEventListener('click', () => {
        this.memberModal.show();
      });
    }

    canvas.querySelectorAll('.btn-edit-member').forEach(btn => {
      btn.addEventListener('click', () => {
        const mid = btn.dataset.memberId;
        this.memberModal.show(mid);
      });
    });

    canvas.querySelectorAll('.btn-delete-member').forEach(btn => {
      btn.addEventListener('click', () => {
        const mid = btn.dataset.memberId;
        const mname = btn.dataset.memberName;
        if (confirm(`Bạn có chắc chắn muốn xóa nhân sự "${mname}" khỏi hệ thống không?`)) {
          store.deleteUser(mid);
          toast(`Đã xóa nhân viên: ${mname}`, 'info');
          this.renderEmployeesView();
        }
      });
    });
  }

  // --- MÀN HÌNH CÀI ĐẶT & KẾT NỐI GOOGLE APPS SCRIPT (SHIN AIOS) ---
  renderSettingsView() {
    const canvas = document.getElementById('main-content-canvas');
    const endpoint = appScriptBridge.getEndpoint();
    const isConnected = appScriptBridge.isConnected();

    canvas.innerHTML = `
      <div class="flex flex-col gap-5 animate-fade-in max-w-3xl">
        <div class="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-sm">
          <h1 class="text-[20px] font-bold text-[#0d1c2f]">Cài Đặt &amp; Tích Hợp Google Apps Script</h1>
          <p class="text-[12.5px] text-[#64748b] mt-0.5">Kết nối dữ liệu thật 2 chiều với Google Sheets tương tự nền tảng SHIN AIOS</p>
        </div>

        <!-- GOOGLE APPS SCRIPT CLOUD INTEGRATION CARD -->
        <div class="bg-white p-6 rounded-xl border border-[#e2e8f0] shadow-sm flex flex-col gap-4">
          <div class="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
            <div class="flex items-center gap-2.5">
              <span class="material-symbols-outlined text-[#795900] text-[24px]">cloud_sync</span>
              <div>
                <h3 class="text-[14.5px] font-bold text-[#0d1c2f]">Cổng Kết Nối Google Sheets (Apps Script Webhook)</h3>
                <p class="text-[12px] text-[#64748b]">Dùng để đồng bộ bảng công việc và nhân sự thật vào Google Workspace</p>
              </div>
            </div>
            <span class="px-3 py-1 rounded-full text-[11px] font-bold ${isConnected ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-[#fffbeb] text-[#795900] border border-[#fef3c7]'}">
              ${isConnected ? '● Đã kết nối Cloud' : '○ Chế độ LocalStorage'}
            </span>
          </div>

          <div>
            <label class="block text-[12px] font-bold text-[#0d1c2f] mb-1.5">URL Google Apps Script Web App Endpoint</label>
            <div class="flex gap-2">
              <input type="url" id="inputGasUrl" value="${esc(endpoint)}" placeholder="https://script.google.com/macros/s/.../exec" class="flex-1 h-10 px-3.5 rounded-lg border border-[#e2e8f0] text-[13px] outline-none focus:border-[#d6a52a]" />
              <button type="button" class="px-4 py-2 rounded-lg bg-[#d6a52a] text-[#533d00] font-bold text-[13px] hover:bg-[#795900] hover:text-white transition-colors shrink-0" id="btnSaveGasUrl">
                Lưu &amp; Đồng Bộ
              </button>
            </div>
            <p class="text-[11.5px] text-[#64748b] mt-1.5 leading-relaxed">
              Mã nguồn Apps Script mẫu đã được tạo sẵn tại thư mục <code>google-apps-script/Code.gs</code>. Chỉ cần dán vào Apps Script của Google Sheet và Deploy as Web App.
            </p>
          </div>

          <div class="p-3.5 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] flex items-center justify-between">
            <div class="text-[12px] text-[#4f4635]">
              Lần đồng bộ gần nhất: <strong>${appScriptBridge.lastSyncTime ? new Date(appScriptBridge.lastSyncTime).toLocaleString('vi-VN') : 'Chưa đồng bộ'}</strong>
            </div>
            <button type="button" class="px-3 py-1.5 rounded-lg bg-white border border-[#e2e8f0] text-[12px] font-bold text-[#0d1c2f] hover:bg-[#f1f5f9] flex items-center gap-1" id="btnManualSync">
              <span class="material-symbols-outlined text-[16px]">sync</span>
              <span>Đồng bộ ngay</span>
            </button>
          </div>
        </div>

        <!-- SYSTEM INFORMATION -->
        <div class="bg-white p-6 rounded-xl border border-[#e2e8f0] shadow-sm flex flex-col gap-3">
          <h3 class="text-[14px] font-bold text-[#0d1c2f]">Thông Tin Nền Tảng</h3>
          <div class="text-[12.5px] text-[#64748b] flex justify-between py-1 border-b border-[#f1f5f9]">
            <span>Phiên bản giao diện:</span>
            <strong class="text-[#0d1c2f]">Google Stitch v2.4.0-CS3 (Vàng Gold #D6A52A)</strong>
          </div>
          <div class="text-[12.5px] text-[#64748b] flex justify-between py-1 border-b border-[#f1f5f9]">
            <span>Đơn vị vận hành:</span>
            <strong class="text-[#0d1c2f]">Bệnh viện Đa khoa Thanh Vũ Medic Cơ Sở 3 (Cà Mau)</strong>
          </div>
          <div class="text-[12.5px] text-[#64748b] flex justify-between py-1 border-b border-[#f1f5f9]">
            <span>Kiến trúc mở rộng:</span>
            <strong class="text-[#16a34a]">Multi-Department Ready (PTKH, Kho Dược, QLDA)</strong>
          </div>

          <div class="pt-3">
            <button type="button" class="px-4 py-2 rounded-lg bg-red-50 text-red-600 border border-red-200 text-[12.5px] font-bold hover:bg-red-100 transition-colors" id="btnResetAllData">
              🔄 Khôi phục dữ liệu gốc mẫu
            </button>
          </div>
        </div>
      </div>
    `;

    // Bind events
    const btnSave = canvas.querySelector('#btnSaveGasUrl');
    const inputUrl = canvas.querySelector('#inputGasUrl');
    if (btnSave && inputUrl) {
      btnSave.addEventListener('click', () => {
        const url = inputUrl.value.trim();
        appScriptBridge.setEndpoint(url);
        toast('Đã lưu cấu hình Google Apps Script Endpoint!', 'success');
        store.syncFromCloudIfAvailable();
        this.renderSettingsView();
      });
    }

    const btnSync = canvas.querySelector('#btnManualSync');
    if (btnSync) {
      btnSync.addEventListener('click', async () => {
        if (!appScriptBridge.isConnected()) {
          toast('Vui lòng nhập URL Web App Endpoint trước khi đồng bộ!', 'warning');
          return;
        }
        toast('Đang đồng bộ dữ liệu từ Google Sheet...', 'info');
        await store.syncFromCloudIfAvailable();
        toast('Đồng bộ dữ liệu thành công!', 'success');
        this.renderSettingsView();
      });
    }

    const btnReset = canvas.querySelector('#btnResetAllData');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (confirm('Khôi phục toàn bộ dữ liệu ban đầu? Các dữ liệu tạm sẽ được đặt lại.')) {
          localStorage.clear();
          location.reload();
        }
      });
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});

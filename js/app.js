/**
 * THANH VŨ MEDIC CS3 - MAIN APPLICATION CONTROLLER
 * Tích hợp Quản lý nhân viên (Thêm/Sửa/Xóa), Profile Modal, Settings Grid & Google Apps Script
 * Chuẩn màu Vàng Hoàng Kim Google Stitch: Gold #D6A52A, Deep Gold #795900, Warm #FFFBEB
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
import { SettingsModal } from './components/settingsModal.js';
import { appScriptBridge } from './services/appScriptBridge.js';
import { toast, rung, esc, soVN, ngayVN } from './helpers.js';

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
    this.settingsModal = null;
  }

  init() {
    console.log('🚀 [THANH VŨ MEDIC CS3] Khởi chạy hệ thống Google Stitch Gold UI...');

    this.profileModal = new ProfileModal('modal-container', () => this.refreshCurrentView());
    this.memberModal = new MemberModal('modal-container', () => this.refreshCurrentView());
    this.settingsModal = new SettingsModal('modal-container', () => this.refreshCurrentView());

    this.sidebar = new Sidebar('sidebar-container', 
      (navId) => this.switchNav(navId),
      (mode) => this.onModeChange(mode)
    );

    this.header = new TopHeader('header-container',
      (query) => this.onSearch(query),
      () => this.openCreateModal(),
      () => this.profileModal.show(),
      () => this.settingsModal.show()
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
    rung(15);
    this.currentNav = navId;

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

  // --- MÀN HÌNH QUẢN LÝ NHÂN VIÊN (THÊM / SỬA / XÓA) ---
  renderEmployeesView() {
    const canvas = document.getElementById('main-content-canvas');
    const currentDept = auth.getActiveDepartment();
    const members = store.getDepartmentUsers(currentDept.id);
    const canManage = auth.canManageMembers();

    canvas.innerHTML = `
      <div class="flex flex-col gap-4 animate-fade-in max-w-7xl">
        <div class="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 class="text-[20px] font-bold text-[#0d1c2f]">Quản Lý Nhân Sự • ${currentDept.name}</h1>
            <p class="text-[12.5px] text-[#64748b] mt-0.5">${currentDept.unit} • Phân bổ nhiệm vụ &amp; hiệu suất chuyên viên</p>
          </div>

          <div class="flex items-center gap-2.5">
            <span class="px-3 py-1 rounded-full bg-[#ffdea9] text-[#5f4100] text-[12px] font-bold">
              ${members.length} nhân sự
            </span>
            ${canManage ? `
              <button type="button" class="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#d6a52a] text-[#533d00] font-bold text-[13px] hover:bg-[#795900] hover:text-white shadow-xs transition-all" id="btnOpenAddMember">
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
              <div class="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-sm flex flex-col justify-between hover:border-[#d6a52a] transition-all relative group">
                ${canManage ? `
                  <div class="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button type="button" class="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b] hover:text-[#0d1c2f] btn-edit-member" data-member-id="${u.id}" title="Sửa thông tin nhân viên">
                      <span class="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    ${u.role !== 'ADMIN' && !isSelf ? `
                      <button type="button" class="p-1.5 rounded-lg hover:bg-red-50 text-[#64748b] hover:text-red-600 btn-delete-member" data-member-id="${u.id}" data-member-name="${u.name}" title="Xóa nhân viên">
                        <span class="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    ` : ''}
                  </div>
                ` : ''}

                <div class="flex items-center gap-3 mb-4">
                  <img src="${u.avatar}" class="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100 shrink-0" />
                  <div class="min-w-0 pr-8">
                    <div class="font-bold text-[14.5px] text-[#0d1c2f] truncate">
                      ${u.name} ${isSelf ? '<span class="text-[10px] text-[#795900] bg-[#fffbeb] px-1.5 py-0.5 rounded border border-[#fef3c7] font-bold ml-1">Bạn</span>' : ''}
                    </div>
                    <div class="text-[12px] text-[#795900] font-semibold truncate">${u.title}</div>
                    <div class="text-[11px] text-[#64748b] truncate">${u.email || u.phone || u.unit}</div>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-2 pt-3 border-t border-[#f1f5f9] text-center">
                  <div class="p-2.5 rounded-xl bg-[#f8f9ff]">
                    <span class="text-[10px] text-[#64748b] uppercase font-bold">Đang làm</span>
                    <div class="text-[18px] font-extrabold text-[#1d4ed8]">${inProg}</div>
                  </div>
                  <div class="p-2.5 rounded-xl bg-[#f8f9ff]">
                    <span class="text-[10px] text-[#64748b] uppercase font-bold">Hoàn tất</span>
                    <div class="text-[18px] font-extrabold text-[#16a34a]">${done}</div>
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
        this.memberModal.show();
      });
    }

    canvas.querySelectorAll('.btn-edit-member').forEach(btn => {
      btn.addEventListener('click', () => {
        rung(10);
        const mid = btn.dataset.memberId;
        this.memberModal.show(mid);
      });
    });

    canvas.querySelectorAll('.btn-delete-member').forEach(btn => {
      btn.addEventListener('click', () => {
        rung(20);
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

  // --- MÀN HÌNH CÀI ĐẶT 2 CỘT CÂN XỨNG (GRID LAYOUT KHÔNG DỒN TRÁI) ---
  renderSettingsView() {
    const canvas = document.getElementById('main-content-canvas');
    const endpoint = appScriptBridge.getEndpoint();
    const isConnected = appScriptBridge.isConnected();
    const currentDept = auth.getActiveDepartment();

    canvas.innerHTML = `
      <div class="flex flex-col gap-6 animate-fade-in w-full max-w-7xl">
        <!-- 1. HEADER BANNER CÀI ĐẶT -->
        <div class="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center gap-3.5">
            <div class="w-12 h-12 rounded-2xl bg-[#fffbeb] text-[#795900] flex items-center justify-center font-bold border border-[#fef3c7] shadow-xs">
              <span class="material-symbols-outlined text-[26px]">tune</span>
            </div>
            <div>
              <div class="flex items-center gap-2 mb-0.5">
                <span class="font-mono-data text-[11px] text-[#795900] font-bold bg-[#fffbeb] px-2 py-0.5 rounded border border-[#fef3c7]">${currentDept.code}</span>
                <span class="text-[12px] text-[#64748b]">• Trung tâm điều phối hệ thống</span>
              </div>
              <h1 class="text-[22px] font-extrabold text-[#0d1c2f] tracking-tight">Cài Đặt Hệ Thống &amp; Tích Hợp Nền Tảng</h1>
              <p class="text-[13px] text-[#64748b]">Quản lý kết nối dữ liệu Google Sheets / SHIN AIOS, bảo mật phân quyền và sao lưu cơ sở dữ liệu</p>
            </div>
          </div>

          <button type="button" class="px-4 py-2.5 rounded-xl bg-[#d6a52a] text-[#533d00] text-[13px] font-bold hover:bg-[#795900] hover:text-white flex items-center justify-center gap-2 shadow-xs transition-all shrink-0" id="btnTriggerModalSettings">
            <span class="material-symbols-outlined text-[18px]">open_in_new</span>
            <span>Mở Cửa Sổ Popup</span>
          </button>
        </div>

        <!-- 2. BỐ CỤC 2 CỘT CÂN ĐỐI (GRID 12 CỘT: 7 CỘT TRÁI & 5 CỘT PHẢI) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          <!-- CỘT TRÁI (COL-SPAN-7): TÍCH HỢP CLOUD GOOGLE APPS SCRIPT -->
          <div class="lg:col-span-7 flex flex-col gap-6">
            
            <!-- THẺ KẾT NỐI CLOUD -->
            <div class="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-sm flex flex-col gap-4">
              <div class="flex items-center justify-between pb-3.5 border-b border-[#f1f5f9]">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-[#fffbeb] text-[#795900] flex items-center justify-center font-bold border border-[#fef3c7]">
                    <span class="material-symbols-outlined text-[22px]">cloud_sync</span>
                  </div>
                  <div>
                    <h3 class="text-[15.5px] font-bold text-[#0d1c2f]">Cổng Kết Nối Google Sheets (Apps Script Webhook)</h3>
                    <p class="text-[12px] text-[#64748b]">Đồng bộ 2 chiều dữ liệu thực tế với Google Sheets tương tự SHIN AIOS</p>
                  </div>
                </div>
                <span class="px-3 py-1 rounded-full text-[11.5px] font-bold shrink-0 ${isConnected ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-[#fffbeb] text-[#795900] border border-[#fef3c7]'}">
                  ${isConnected ? '● Đã kết nối Cloud' : '○ Chế độ LocalStorage'}
                </span>
              </div>

              <div>
                <label class="block text-[12.5px] font-bold text-[#0d1c2f] mb-1.5">URL Google Apps Script Web App Endpoint</label>
                <div class="flex flex-col sm:flex-row gap-2">
                  <input type="url" id="inputGasUrl" value="${esc(endpoint)}" placeholder="https://script.google.com/macros/s/.../exec" class="flex-1 h-10 px-3.5 rounded-xl border border-[#e2e8f0] text-[13px] outline-none focus:border-[#d6a52a] bg-[#f8f9ff] text-[#0d1c2f]" />
                  <button type="button" class="px-5 py-2.5 rounded-xl bg-[#d6a52a] text-[#533d00] font-bold text-[13px] hover:bg-[#795900] hover:text-white transition-all shrink-0 shadow-xs" id="btnSaveGasUrl">
                    Lưu URL
                  </button>
                </div>
                
                <div class="mt-3 p-3 rounded-xl bg-[#fffbeb] border border-[#fef3c7] text-[12px] text-[#795900] leading-relaxed flex items-start gap-2">
                  <span class="material-symbols-outlined text-[18px] shrink-0 mt-0.5">info</span>
                  <span><strong>Lưu ý quan trọng khi triển khai:</strong> Trong cài đặt Deploy của Apps Script, mục <em>"Who has access (Ai có quyền truy cập)"</em> BẮT BUỘC chọn là <strong>"Anyone (Bất kỳ ai)"</strong> để trình duyệt không bị lỗi chặn bảo mật CORS.</span>
                </div>
              </div>

              <!-- HÀNG THAO TÁC ĐỒNG BỘ 2 CHIỀU -->
              <div class="p-4 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div class="text-[12.5px] text-[#0d1c2f]">
                  Lần đồng bộ gần nhất: <br />
                  <strong class="text-[#795900] font-mono-data">${appScriptBridge.lastSyncTime ? new Date(appScriptBridge.lastSyncTime).toLocaleString('vi-VN') : 'Chưa có lượt đồng bộ nào'}</strong>
                </div>

                <div class="flex items-center gap-2">
                  <button type="button" class="px-4 py-2.5 rounded-xl bg-white border border-[#d6a52a] text-[12px] font-bold text-[#795900] hover:bg-[#fffbeb] flex items-center justify-center gap-1.5 shadow-xs transition-all" id="btnPushToSheet">
                    <span class="material-symbols-outlined text-[17px]">upload</span>
                    <span>Đẩy lên Sheet</span>
                  </button>

                  <button type="button" class="px-4 py-2.5 rounded-xl bg-[#d6a52a] text-[#533d00] text-[12px] font-bold hover:bg-[#795900] hover:text-white flex items-center justify-center gap-1.5 shadow-xs transition-all" id="btnManualSync">
                    <span class="material-symbols-outlined text-[17px]">sync</span>
                    <span>Tải về ngay</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- THẺ HƯỚNG DẪN TRIỂN KHAI 3 BƯỚC -->
            <div class="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-sm flex flex-col gap-3">
              <h3 class="text-[15px] font-bold text-[#0d1c2f] flex items-center gap-2">
                <span class="material-symbols-outlined text-[#795900] text-[20px]">menu_book</span>
                Hướng Dẫn Triển Khai Nhanh 3 Bước Với Google Sheets
              </h3>
              <ol class="list-decimal list-inside space-y-2 text-[12.5px] text-[#4f4635] leading-relaxed">
                <li>Mở Google Spreadsheet mới -> Vào menu <strong>Tiện ích mở rộng -> Apps Script</strong>.</li>
                <li>Dán toàn bộ mã nguồn tại file <code>google-apps-script/Code.gs</code> vào và bấm Lưu.</li>
                <li>Bấm <strong>Deploy -> New deployment -> Web app</strong> (chọn Execute as: <em>Me</em>, Who has access: <em>Anyone</em>) rồi copy link Web App dán vào ô bên trên.</li>
              </ol>
            </div>
          </div>

          <!-- CỘT PHẢI (COL-SPAN-5): THÔNG TIN NỀN TẢNG, PHÂN QUYỀN & SAO LƯU -->
          <div class="lg:col-span-5 flex flex-col gap-6">

            <!-- THẺ THÔNG TIN NỀN TẢNG & THƯƠNG HIỆU -->
            <div class="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-sm flex flex-col gap-3.5">
              <h3 class="text-[15px] font-bold text-[#0d1c2f] flex items-center gap-2">
                <span class="material-symbols-outlined text-[#795900] text-[20px]">verified</span>
                Nhận Diện Thương Hiệu &amp; Giao Diện
              </h3>

              <div class="text-[13px] text-[#64748b] flex justify-between py-1.5 border-b border-[#f1f5f9]">
                <span>Tông màu chủ đạo:</span>
                <strong class="text-[#795900] flex items-center gap-1.5">
                  <span class="w-3.5 h-3.5 rounded-full bg-[#d6a52a] inline-block shadow-xs"></span>
                  Google Stitch Gold (#D6A52A)
                </strong>
              </div>

              <div class="text-[13px] text-[#64748b] flex justify-between py-1.5 border-b border-[#f1f5f9]">
                <span>Kiểu chữ tiêu chuẩn:</span>
                <strong class="text-[#0d1c2f]">Plus Jakarta Sans &amp; Mono</strong>
              </div>

              <div class="text-[13px] text-[#64748b] flex justify-between py-1.5 border-b border-[#f1f5f9]">
                <span>Đơn vị vận hành:</span>
                <strong class="text-[#0d1c2f]">Thanh Vũ Medic - CS3</strong>
              </div>

              <div class="text-[13px] text-[#64748b] flex justify-between py-1.5 border-b border-[#f1f5f9]">
                <span>Phân quyền bảo mật:</span>
                <strong class="text-[#16a34a]">RBAC 3 Cấp (Admin / TP / NV)</strong>
              </div>

              <div class="text-[13px] text-[#64748b] flex justify-between py-1.5">
                <span>Cầu nối hệ sinh thái:</span>
                <strong class="font-mono-data text-[#0d1c2f]">SHIN AIOS v2.0 Bridge</strong>
              </div>
            </div>

            <!-- THẺ TRUNG TÂM SAO LƯU & DỮ LIỆU HỆ THỐNG -->
            <div class="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-sm flex flex-col gap-3.5">
              <h3 class="text-[15px] font-bold text-[#0d1c2f] flex items-center gap-2">
                <span class="material-symbols-outlined text-[#64748b] text-[20px]">save</span>
                Trung Tâm Quản Trị &amp; Sao Lưu Dữ Liệu
              </h3>
              
              <p class="text-[12px] text-[#64748b] leading-relaxed">
                Tải tệp JSON chứa toàn bộ danh bạ nhân sự và nhật ký công việc về máy tính để bảo đảm an toàn dữ liệu định kỳ.
              </p>

              <div class="flex flex-col gap-2 pt-1">
                <button type="button" class="w-full py-2.5 rounded-xl bg-white border border-[#e2e8f0] text-[#0d1c2f] text-[12.5px] font-bold hover:bg-[#f8f9ff] flex items-center justify-center gap-2 shadow-xs transition-colors" id="btnExportBackupJson">
                  <span class="material-symbols-outlined text-[18px] text-[#795900]">download</span>
                  <span>Xuất Tệp Sao Lưu (Backup JSON)</span>
                </button>

                <button type="button" class="w-full py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200 text-[12.5px] font-bold hover:bg-red-100 flex items-center justify-center gap-2 transition-colors" id="btnResetAllData">
                  <span class="material-symbols-outlined text-[18px]">restart_alt</span>
                  <span>Khôi phục dữ liệu gốc mẫu</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    `;

    // Bind events
    const btnTrigger = canvas.querySelector('#btnTriggerModalSettings');
    if (btnTrigger) {
      btnTrigger.addEventListener('click', () => {
        this.settingsModal.show();
      });
    }

    const btnSave = canvas.querySelector('#btnSaveGasUrl');
    const inputUrl = canvas.querySelector('#inputGasUrl');
    if (btnSave && inputUrl) {
      btnSave.addEventListener('click', () => {
        rung(10);
        const url = inputUrl.value.trim();
        appScriptBridge.setEndpoint(url);
        toast('Đã lưu cấu hình Google Apps Script Endpoint!', 'success');
        this.renderSettingsView();
      });
    }

    // Tải về từ Google Sheet
    const btnSync = canvas.querySelector('#btnManualSync');
    if (btnSync) {
      btnSync.addEventListener('click', async () => {
        rung(10);
        if (!appScriptBridge.isConnected()) {
          toast('Vui lòng nhập URL Web App Endpoint trước khi đồng bộ!', 'warning');
          return;
        }
        btnSync.disabled = true;
        btnSync.innerHTML = '<span class="material-symbols-outlined text-[17px] animate-spin">sync</span><span>Đang tải...</span>';
        toast('Đang kết nối Google Sheets để tải dữ liệu...', 'info');

        const res = await store.syncFromCloudIfAvailable();
        btnSync.disabled = false;
        btnSync.innerHTML = '<span class="material-symbols-outlined text-[17px]">sync</span><span>Tải về ngay</span>';

        toast(res.message, res.success ? 'success' : 'warning');
        this.renderSettingsView();
      });
    }

    // Đẩy lên Google Sheet
    const btnPush = canvas.querySelector('#btnPushToSheet');
    if (btnPush) {
      btnPush.addEventListener('click', async () => {
        rung(15);
        if (!appScriptBridge.isConnected()) {
          toast('Vui lòng nhập URL Web App Endpoint trước!', 'warning');
          return;
        }
        btnPush.disabled = true;
        btnPush.innerHTML = '<span class="material-symbols-outlined text-[17px] animate-spin">sync</span><span>Đang đẩy...</span>';
        toast('Đang đẩy dữ liệu lên Google Sheets...', 'info');

        const res = await store.pushAllToCloud();
        btnPush.disabled = false;
        btnPush.innerHTML = '<span class="material-symbols-outlined text-[17px]">upload</span><span>Đẩy lên Sheet</span>';

        toast(res.message, res.success ? 'success' : 'warning');
        this.renderSettingsView();
      });
    }

    // Xuất Backup JSON
    const btnExport = canvas.querySelector('#btnExportBackupJson');
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        rung(10);
        const backupData = {
          version: '3.7',
          exportedAt: new Date().toISOString(),
          department: currentDept,
          tasks: store.getAllTasksRaw(),
          users: store.getAllUsers()
        };
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `TVM_CS3_Backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast('Đã xuất tệp sao lưu dữ liệu thành công!', 'success');
      });
    }

    // Reset dữ liệu
    const btnReset = canvas.querySelector('#btnResetAllData');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        rung(20);
        if (confirm('Khôi phục toàn bộ dữ liệu ban đầu? Mọi tác vụ tạo mới sẽ được đặt lại theo mẫu.')) {
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

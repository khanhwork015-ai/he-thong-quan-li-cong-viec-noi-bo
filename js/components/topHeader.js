/**
 * THANH VŨ MEDIC CS3 - TOP HEADER COMPONENT
 * Chuẩn màu Vàng Hoàng Kim Google Stitch:
 * Nền White (#FFFFFF), Border (#E2E8F0), Primary Action Gold (#D6A52A / #795900)
 */

import { auth } from '../auth.js';
import { store } from '../store.js';
import { USERS } from '../models.js';
import { toast, rung } from '../helpers.js';

export class TopHeader {
  constructor(containerId, onSearch, onOpenCreateModal, onOpenProfileModal, onOpenSettingsModal) {
    this.container = document.getElementById(containerId);
    this.onSearch = onSearch;
    this.onOpenCreateModal = onOpenCreateModal;
    this.onOpenProfileModal = onOpenProfileModal;
    this.onOpenSettingsModal = onOpenSettingsModal;
  }

  render() {
    if (!this.container) return;

    const user = auth.getCurrentUser();
    const metrics = store.getDepartmentMetrics();
    const canCreate = auth.canCreateTask();

    this.container.innerHTML = `
      <header class="fixed top-0 left-64 right-0 h-16 bg-white/95 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.03)] border-b border-[#e2e8f0] z-40 flex items-center justify-between px-6">
        <!-- SEARCH SPOTLIGHT BAR -->
        <div class="flex items-center gap-4 min-w-0">
          <div class="relative flex items-center w-72 lg:w-96">
            <span class="material-symbols-outlined absolute left-3 text-[18px] text-[#817663]">search</span>
            <input 
              type="text" 
              id="topSearchInput"
              class="w-full h-10 pl-9 pr-12 rounded-xl bg-[#f8f9ff] text-[#0d1c2f] text-[13.5px] placeholder:text-[#817663] border border-[#e2e8f0] focus:bg-white focus:border-[#d6a52a] focus:ring-2 focus:ring-[#d6a52a]/20 outline-none transition-all" 
              placeholder="Tìm kiếm công việc, mã hồ sơ, nhân sự..." 
            />
            <kbd class="absolute right-2.5 px-1.5 py-0.5 rounded bg-[#e6eeff] font-mono-data text-[10px] text-[#4f4635] font-semibold">⌘K</kbd>
          </div>
        </div>

        <!-- RIGHT ACTIONS & USER PROFILE -->
        <div class="flex items-center gap-3">
          <!-- CA TRỰC Y TẾ -->
          <div class="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fffbeb] text-[#795900] border border-[#fef3c7]">
            <span class="material-symbols-outlined text-[16px]">schedule</span>
            <span class="text-[11.5px] font-bold">Ca hành chính: 07:00 - 17:00</span>
          </div>

          <!-- NOTIFICATIONS -->
          <button type="button" class="relative p-2 rounded-xl text-[#4f4635] hover:bg-[#f1f5f9] transition-colors" title="${metrics.pendingApproval} việc đang chờ phê duyệt" id="btnNotifications">
            <span class="material-symbols-outlined text-[22px]">notifications</span>
            ${metrics.pendingApproval > 0 ? `
              <span class="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#ba1a1a] px-1 text-[10px] font-bold text-white shadow-xs">
                ${metrics.pendingApproval}
              </span>
            ` : ''}
          </button>

          <!-- QUICK SETTINGS BUTTON -->
          <button type="button" class="p-2 rounded-xl text-[#4f4635] hover:bg-[#f1f5f9] transition-colors" title="Cài đặt hệ thống & Tích hợp Cloud" id="btnQuickSettings">
            <span class="material-symbols-outlined text-[22px]">settings</span>
          </button>

          <!-- PRIMARY ACTION: TẠO CÔNG VIỆC (VÀNG GOLD CHUẨN STITCH) -->
          ${canCreate ? `
            <button type="button" class="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#d6a52a] text-[#533d00] text-[13px] font-bold hover:bg-[#795900] hover:text-white shadow-xs transition-all" id="btnHeaderCreateTask">
              <span class="material-symbols-outlined text-[18px]">add</span>
              <span>Giao việc mới</span>
            </button>
          ` : ''}

          <!-- USER MENU DROPDOWN TRIGGER -->
          <div class="relative">
            <div class="flex items-center gap-2.5 pl-2 cursor-pointer p-1 rounded-xl hover:bg-[#f8f9ff] transition-colors border border-transparent hover:border-[#e2e8f0]" id="btnUserMenuTrigger">
              <div class="relative shrink-0">
                <img src="${user.avatar}" alt="${user.name}" class="w-8 h-8 rounded-full object-cover ring-2 ring-[#d6a52a]/40" />
                <span class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#16a34a] ring-2 ring-white"></span>
              </div>
              <div class="hidden xl:flex flex-col text-left">
                <span class="text-[13px] text-[#0d1c2f] font-bold leading-tight truncate max-w-[140px]">${user.name}</span>
                <span class="text-[11px] text-[#795900] font-semibold truncate max-w-[140px]">${user.title}</span>
              </div>
              <span class="material-symbols-outlined text-[16px] text-[#817663]">expand_more</span>
            </div>

            <!-- POPUP USER MENU -->
            <div id="userMenuDropdown" class="hidden absolute right-0 top-12 w-60 bg-white rounded-2xl shadow-2xl border border-[#e2e8f0] py-2 z-50">
              <div class="px-4 py-2.5 border-b border-[#f1f5f9] mb-1">
                <div class="text-[13px] font-bold text-[#0d1c2f] truncate">${user.name}</div>
                <div class="text-[11px] text-[#64748b] truncate">${user.email || user.title}</div>
                <span class="mt-1 inline-block text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-[#fffbeb] text-[#795900] border border-[#fef3c7]">
                  ${user.role === 'ADMIN' ? '👑 Quản Trị Viên (Admin)' : (user.role === 'MANAGER' ? '👔 Trưởng Phòng' : '👤 Nhân Viên')}
                </span>
              </div>
              <button type="button" class="w-full px-4 py-2 text-left text-[12.5px] font-semibold text-[#0d1c2f] hover:bg-[#fffbeb] hover:text-[#795900] flex items-center gap-2.5" id="btnOpenProfile">
                <span class="material-symbols-outlined text-[18px] text-[#795900]">badge</span>
                <span>Hồ sơ cá nhân</span>
              </button>
              <button type="button" class="w-full px-4 py-2 text-left text-[12.5px] font-semibold text-[#0d1c2f] hover:bg-[#fffbeb] hover:text-[#795900] flex items-center gap-2.5" id="btnHeaderOpenSettings">
                <span class="material-symbols-outlined text-[18px] text-[#795900]">settings</span>
                <span>Cài đặt hệ thống</span>
              </button>
              <button type="button" class="w-full px-4 py-2 text-left text-[12.5px] font-semibold text-[#0d1c2f] hover:bg-[#f8f9ff] flex items-center gap-2.5 border-t border-[#f1f5f9] mt-1 pt-2" id="btnOpenRoleSwitcher">
                <span class="material-symbols-outlined text-[18px] text-blue-600">switch_account</span>
                <span>Chuyển tài khoản (Test)</span>
              </button>
            </div>
          </div>
        </div>
      </header>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const searchInput = this.container.querySelector('#topSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        if (this.onSearch) this.onSearch(e.target.value);
      });
    }

    const btnCreate = this.container.querySelector('#btnHeaderCreateTask');
    if (btnCreate) {
      btnCreate.addEventListener('click', () => {
        rung(10);
        if (this.onOpenCreateModal) this.onOpenCreateModal();
      });
    }

    const trigger = this.container.querySelector('#btnUserMenuTrigger');
    const dropdown = this.container.querySelector('#userMenuDropdown');
    if (trigger && dropdown) {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('hidden');
      });

      document.addEventListener('click', () => {
        dropdown.classList.add('hidden');
      });
    }

    const btnProfile = this.container.querySelector('#btnOpenProfile');
    if (btnProfile) {
      btnProfile.addEventListener('click', () => {
        rung(10);
        dropdown.classList.add('hidden');
        if (this.onOpenProfileModal) this.onOpenProfileModal();
      });
    }

    const btnQuickSettings = this.container.querySelector('#btnQuickSettings');
    const btnHeaderSettings = this.container.querySelector('#btnHeaderOpenSettings');
    const openSettings = () => {
      rung(10);
      if (dropdown) dropdown.classList.add('hidden');
      if (this.onOpenSettingsModal) this.onOpenSettingsModal();
    };
    if (btnQuickSettings) btnQuickSettings.addEventListener('click', openSettings);
    if (btnHeaderSettings) btnHeaderSettings.addEventListener('click', openSettings);

    const btnRole = this.container.querySelector('#btnOpenRoleSwitcher');
    if (btnRole) {
      btnRole.addEventListener('click', () => {
        rung(10);
        dropdown.classList.add('hidden');
        this.showRoleSwitcherModal();
      });
    }

    const btnNotif = this.container.querySelector('#btnNotifications');
    if (btnNotif) {
      btnNotif.addEventListener('click', () => {
        const metrics = store.getDepartmentMetrics();
        toast(`Có ${metrics.pendingApproval} công việc đang chờ phê duyệt nghiệm thu!`, 'info');
      });
    }
  }

  showRoleSwitcherModal() {
    let modal = document.getElementById('roleSwitcherModal');
    if (modal) modal.remove();

    const currentUser = auth.getCurrentUser();

    modal = document.createElement('div');
    modal.id = 'roleSwitcherModal';
    modal.className = 'modal-overlay fixed inset-0 z-[100] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 active';
    modal.innerHTML = `
      <div class="modal-card bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#e2e8f0]">
        <div class="flex items-center justify-between pb-3.5 border-b border-[#f1f5f9] mb-4">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-[#fffbeb] text-[#795900] flex items-center justify-center border border-[#fef3c7]">
              <span class="material-symbols-outlined text-[20px]">manage_accounts</span>
            </div>
            <h3 class="font-bold text-[16px] text-[#0d1c2f]">Chuyển Đổi Nhân Sự Kiểm Thử</h3>
          </div>
          <button type="button" class="text-gray-400 hover:text-gray-600 text-xl font-bold" id="btnCloseRoleModal">&times;</button>
        </div>

        <p class="text-[12.5px] text-[#64748b] mb-4">
          Chọn một nhân sự để trải nghiệm đúng quyền hạn (RBAC):
        </p>

        <div class="flex flex-col gap-2.5 max-h-80 overflow-y-auto">
          ${USERS.map(u => `
            <div class="p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${u.id === currentUser.id ? 'bg-[#fffbeb] border-[#d6a52a] shadow-xs' : 'bg-white border-[#e2e8f0] hover:bg-[#f8f9ff]'}" data-user-id="${u.id}">
              <div class="flex items-center gap-3">
                <img src="${u.avatar}" class="w-9 h-9 rounded-full object-cover ring-2 ring-gray-100" />
                <div>
                  <div class="text-[13.5px] font-bold text-[#0d1c2f]">${u.name} ${u.id === currentUser.id ? '✓' : ''}</div>
                  <div class="text-[11.5px] text-[#64748b]">${u.title} • ${u.unit}</div>
                </div>
              </div>
              <span class="text-[10.5px] font-bold px-2 py-0.5 rounded-full ${u.role === 'ADMIN' ? 'bg-[#ffdea9] text-[#5f4100]' : (u.role === 'MANAGER' ? 'bg-[#fffbeb] text-[#795900] border border-[#fef3c7]' : 'bg-gray-100 text-gray-700')}">
                ${u.badge}
              </span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#btnCloseRoleModal').addEventListener('click', () => modal.remove());
    modal.querySelectorAll('[data-user-id]').forEach(el => {
      el.addEventListener('click', () => {
        const uid = el.dataset.userId;
        auth.loginAs(uid);
        modal.remove();
        toast(`Đã đăng nhập: ${auth.getCurrentUser().name} (${auth.getCurrentUser().role})`, 'success');
      });
    });
  }
}

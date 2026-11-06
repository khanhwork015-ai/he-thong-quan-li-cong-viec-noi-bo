/**
 * THANH VŨ MEDIC CS3 - TOP HEADER COMPONENT (SHIN AIOS v2.6.4)
 * Thiết kế công thái học Mobile First: Vùng bấm >= 44x44px
 * Hỗ trợ nút Chuyển Theme (Dark/Light) và Nút Đổi Bảng Màu Giao Diện (8 Palettes)
 */

import { auth } from '../auth.js';
import { store } from '../store.js';
import { USERS } from '../models.js';
import { toast, rung } from '../helpers.js';
import { shinTheme } from '../theme.js';

export class TopHeader {
  constructor(containerId, onSearch, onOpenCreateModal, onOpenProfileModal, onOpenSettingsModal, onToggleMobileSidebar) {
    this.container = document.getElementById(containerId);
    this.onSearch = onSearch;
    this.onOpenCreateModal = onOpenCreateModal;
    this.onOpenProfileModal = onOpenProfileModal;
    this.onOpenSettingsModal = onOpenSettingsModal;
    this.onToggleMobileSidebar = onToggleMobileSidebar;
  }

  render() {
    if (!this.container) return;

    const user = auth.getCurrentUser();
    const metrics = store.getDepartmentMetrics();
    const canCreate = auth.canCreateTask();
    const isDark = shinTheme.resolveIsDark();

    this.container.innerHTML = `
      <header class="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-white/95 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.03)] border-b border-[#e2e8f0] z-30 flex items-center justify-between px-3 sm:px-6">
        <!-- LEFT: MOBILE HAMBURGER & SEARCH BAR -->
        <div class="flex items-center gap-2 sm:gap-4 min-w-0 flex-1 max-w-xl">
          <!-- HAMBURGER BUTTON (MOBILE / TABLET ONLY - VÙNG BẤM >= 44PX) -->
          <button 
            type="button" 
            class="lg:hidden p-2 rounded-xl text-[#0d1c2f] hover:bg-[#f1f5f9] min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0 -ml-1 transition-colors" 
            id="btnToggleMobileSidebar" 
            aria-label="Mở Menu Điều Hướng"
          >
            <span class="material-symbols-outlined text-[24px]">menu</span>
          </button>

          <!-- SEARCH SPOTLIGHT BAR -->
          <div class="relative flex items-center w-full max-w-[180px] sm:max-w-xs lg:w-96">
            <span class="material-symbols-outlined absolute left-2.5 sm:left-3 text-[18px] text-[#817663]">search</span>
            <input 
              type="text" 
              id="topSearchInput"
              class="w-full h-10 pl-8 sm:pl-9 pr-3 sm:pr-12 rounded-xl bg-[#f8f9ff] text-[#0d1c2f] text-[13.5px] placeholder:text-[#817663] border border-[#e2e8f0] focus:bg-white focus:border-[#d6a52a] focus:ring-2 focus:ring-[#d6a52a]/20 outline-none transition-all" 
              placeholder="Tìm kiếm công việc..." 
            />
            <kbd class="hidden sm:inline-block absolute right-2.5 px-1.5 py-0.5 rounded bg-[#e6eeff] font-mono-data text-[10px] text-[#4f4635] font-semibold">⌘K</kbd>
          </div>
        </div>

        <!-- RIGHT ACTIONS & USER PROFILE -->
        <div class="flex items-center gap-1 sm:gap-2 shrink-0">
          <!-- CA TRỰC Y TẾ -->
          <div class="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full border" style="background-color: var(--primary-soft); color: var(--primary); border-color: var(--accent-soft, var(--border));">
            <span class="material-symbols-outlined text-[16px]">schedule</span>
            <span class="text-[11.5px] font-bold">Ca hành chính: 07:00 - 17:00</span>
          </div>

          <!-- NÚT CHUYỂN NHANH DARK / LIGHT MODE (SHIN CHUẨN) -->
          <button type="button" class="p-2 rounded-xl hover:bg-[#f1f5f9] min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors" title="${isDark ? 'Chuyển sang chế độ Sáng' : 'Chuyển sang chế độ Tối (Dark Mode)'}" id="btnQuickThemeToggle">
            <span class="material-symbols-outlined text-[20px] text-[#64748b]">${isDark ? 'light_mode' : 'dark_mode'}</span>
          </button>

          <!-- NÚT ĐỔI MÀU GIAO DIỆN (8 PALETTES SHIN) -->
          <button type="button" class="p-2 rounded-xl hover:bg-[#f1f5f9] min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors" title="Đổi màu giao diện (8 Palettes SHIN AIOS)" id="btnQuickPalette">
            <span class="material-symbols-outlined text-[20px]" style="color: var(--primary);">palette</span>
          </button>

          <!-- NOTIFICATIONS -->
          <button type="button" class="relative p-2 rounded-xl text-[#4f4635] hover:bg-[#f1f5f9] min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors" title="${metrics.pendingApproval} việc đang chờ phê duyệt" id="btnNotifications">
            <span class="material-symbols-outlined text-[22px]">notifications</span>
            ${metrics.pendingApproval > 0 ? `
              <span class="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#dc2626] px-1 text-[10px] font-bold text-white shadow-xs">
                ${metrics.pendingApproval}
              </span>
            ` : ''}
          </button>

          <!-- QUICK SETTINGS BUTTON (DESKTOP) -->
          <button type="button" class="hidden sm:flex p-2 rounded-xl text-[#4f4635] hover:bg-[#f1f5f9] min-w-[44px] min-h-[44px] items-center justify-center transition-colors" title="Cài đặt hệ thống & Tích hợp Cloud" id="btnQuickSettings">
            <span class="material-symbols-outlined text-[22px]">settings</span>
          </button>

          <!-- PRIMARY ACTION: TẠO CÔNG VIỆC -->
          ${canCreate ? `
            <button type="button" class="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-[12px] sm:text-[13px] font-bold shadow-xs transition-all min-h-[44px]" id="btnHeaderCreateTask" style="background-color: var(--primary-container); color: var(--on-primary-container);" title="Giao việc mới">
              <span class="material-symbols-outlined text-[18px]">add</span>
              <span class="hidden sm:inline">Giao việc</span>
            </button>
          ` : ''}

          <!-- USER MENU DROPDOWN TRIGGER -->
          <div class="relative">
            <div class="flex items-center gap-1.5 sm:gap-2 pl-1 sm:pl-2 cursor-pointer p-1 rounded-xl hover:bg-[#f8f9ff] transition-colors border border-transparent hover:border-[#e2e8f0] min-h-[44px]" id="btnUserMenuTrigger">
              <div class="relative shrink-0">
                <img src="${user.avatar}" alt="${user.name}" class="w-8 h-8 rounded-full object-cover ring-2" style="--tw-ring-color: var(--primary);" />
                <span class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#16a34a] ring-2 ring-white"></span>
              </div>
              <div class="hidden xl:flex flex-col text-left">
                <span class="text-[13px] text-[#0d1c2f] font-bold leading-tight truncate max-w-[130px]">${user.name}</span>
                <span class="text-[11px] font-semibold truncate max-w-[130px]" style="color: var(--primary);">${user.title}</span>
              </div>
              <span class="material-symbols-outlined text-[16px] text-[#817663]">expand_more</span>
            </div>

            <!-- POPUP USER MENU -->
            <div id="userMenuDropdown" class="hidden absolute right-0 top-12 w-64 bg-white rounded-2xl shadow-2xl border border-[#e2e8f0] py-2 z-50">
              <div class="px-4 py-2.5 border-b border-[#f1f5f9] mb-1">
                <div class="text-[13px] font-bold text-[#0d1c2f] truncate">${user.name}</div>
                <div class="text-[11px] text-[#64748b] truncate">${user.email || user.title}</div>
                <span class="mt-1 inline-block text-[10.5px] font-bold px-2 py-0.5 rounded-full" style="background-color: var(--primary-soft); color: var(--primary);">
                  ${user.role === 'ADMIN' ? '👑 Quản Trị Viên (Admin)' : (user.role === 'MANAGER' ? '👔 Trưởng Phòng' : '👤 Nhân Viên')}
                </span>
              </div>
              <button type="button" class="w-full px-4 py-2.5 text-left text-[13px] font-semibold text-[#0d1c2f] hover:bg-[#f8f9ff] flex items-center gap-2.5 min-h-[44px]" id="btnOpenProfile">
                <span class="material-symbols-outlined text-[18px]" style="color: var(--primary);">badge</span>
                <span>Hồ sơ cá nhân</span>
              </button>
              <button type="button" class="w-full px-4 py-2.5 text-left text-[13px] font-semibold text-[#0d1c2f] hover:bg-[#f8f9ff] flex items-center gap-2.5 min-h-[44px]" id="btnHeaderOpenPalette">
                <span class="material-symbols-outlined text-[18px]" style="color: var(--primary);">palette</span>
                <span>Đổi màu giao diện (SHIN)</span>
              </button>
              <button type="button" class="w-full px-4 py-2.5 text-left text-[13px] font-semibold text-[#0d1c2f] hover:bg-[#f8f9ff] flex items-center gap-2.5 min-h-[44px]" id="btnHeaderOpenSettings">
                <span class="material-symbols-outlined text-[18px]" style="color: var(--primary);">settings</span>
                <span>Cài đặt hệ thống</span>
              </button>
              <button type="button" class="w-full px-4 py-2.5 text-left text-[13px] font-semibold text-[#0d1c2f] hover:bg-[#f8f9ff] flex items-center gap-2.5 border-t border-[#f1f5f9] mt-1 pt-2 min-h-[44px]" id="btnOpenRoleSwitcher">
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
    const btnMobileSidebar = this.container.querySelector('#btnToggleMobileSidebar');
    if (btnMobileSidebar) {
      btnMobileSidebar.addEventListener('click', () => {
        rung(10);
        if (this.onToggleMobileSidebar) this.onToggleMobileSidebar();
      });
    }

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

    // Quick toggle theme (Dark/Light)
    const btnQuickTheme = this.container.querySelector('#btnQuickThemeToggle');
    if (btnQuickTheme) {
      btnQuickTheme.addEventListener('click', () => {
        shinTheme.toggleThemeQuick();
        this.render();
      });
    }

    // Quick open palette in settings
    const btnQuickPalette = this.container.querySelector('#btnQuickPalette');
    const btnHeaderOpenPalette = this.container.querySelector('#btnHeaderOpenPalette');
    const openPalette = () => {
      rung(10);
      const dropdown = this.container.querySelector('#userMenuDropdown');
      if (dropdown) dropdown.classList.add('hidden');
      if (this.onOpenSettingsModal) this.onOpenSettingsModal();
    };
    if (btnQuickPalette) btnQuickPalette.addEventListener('click', openPalette);
    if (btnHeaderOpenPalette) btnHeaderOpenPalette.addEventListener('click', openPalette);

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
    modal.className = 'modal-overlay fixed inset-0 z-[100] bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 active';
    modal.innerHTML = `
      <div class="modal-card bg-white rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-[#e2e8f0] max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-3.5 border-b border-[#f1f5f9] mb-4">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center" style="background-color: var(--primary-soft); color: var(--primary);">
              <span class="material-symbols-outlined text-[20px]">manage_accounts</span>
            </div>
            <h3 class="font-bold text-[16px] text-[#0d1c2f]">Chuyển Đổi Nhân Sự Kiểm Thử</h3>
          </div>
          <button type="button" class="text-gray-400 hover:text-gray-600 text-xl font-bold min-w-[44px] min-h-[44px] flex items-center justify-center" id="btnCloseRoleModal" aria-label="Đóng">&times;</button>
        </div>

        <p class="text-[12.5px] text-[#64748b] mb-4">
          Chọn một nhân sự để trải nghiệm đúng quyền hạn (RBAC):
        </p>

        <div class="flex flex-col gap-2.5 max-h-80 overflow-y-auto">
          ${USERS.map(u => `
            <div class="p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between min-h-[50px] ${u.id === currentUser.id ? 'shadow-xs font-bold' : 'hover:bg-[#f8f9ff]'}" data-user-id="${u.id}" style="${u.id === currentUser.id ? 'background-color: var(--primary-soft); border-color: var(--primary);' : 'background-color: var(--card); border-color: var(--border);'}">
              <div class="flex items-center gap-3">
                <img src="${u.avatar}" class="w-9 h-9 rounded-full object-cover ring-2 ring-gray-100 shrink-0" />
                <div class="min-w-0">
                  <div class="text-[13.5px] font-bold text-[#0d1c2f] truncate">${u.name} ${u.id === currentUser.id ? '✓' : ''}</div>
                  <div class="text-[11.5px] text-[#64748b] truncate">${u.title} • ${u.unit}</div>
                </div>
              </div>
              <span class="text-[10.5px] font-bold px-2 py-0.5 rounded-full shrink-0 ${u.role === 'ADMIN' ? 'bg-[#ffdea9] text-[#5f4100]' : (u.role === 'MANAGER' ? 'bg-[#fffbeb] text-[#795900] border border-[#fef3c7]' : 'bg-gray-100 text-gray-700')}">
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

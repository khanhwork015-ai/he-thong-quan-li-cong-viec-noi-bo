/**
 * THANH VŨ MEDIC CS3 - TOP HEADER COMPONENT (SHIN AIOS v2.6.4)
 * Thiết kế công thái học Mobile First: Vùng bấm >= 44x44px
 * Hỗ trợ nút Chuyển Theme (Dark/Light) và Nút Đổi Bảng Màu Giao Diện (8 Palettes)
 */

import { auth } from '../auth.js?v=7.8';
import { store } from '../store.js?v=7.8';
import { USERS } from '../models.js?v=7.8';
import { toast, rung, esc, timeAgo } from '../helpers.js?v=7.8';
import { shinTheme } from '../theme.js?v=7.8';

export class TopHeader {
  constructor(containerId, onSearch, onOpenCreateModal, onOpenProfileModal, onOpenSettingsModal, onToggleMobileSidebar, onOpenDepartmentModal, onLogout, onOpenTask, onOpenNotifications, onNavigateApproval) {
    this.container = document.getElementById(containerId);
    this.onSearch = onSearch;
    this.onOpenCreateModal = onOpenCreateModal;
    this.onOpenProfileModal = onOpenProfileModal;
    this.onOpenSettingsModal = onOpenSettingsModal;
    this.onToggleMobileSidebar = onToggleMobileSidebar;
    this.onOpenDepartmentModal = onOpenDepartmentModal;
    this.onLogout = onLogout;
    this.onOpenTask = onOpenTask;
    this.onOpenNotifications = onOpenNotifications;
    this.onNavigateApproval = onNavigateApproval;
  }

  render() {
    if (!this.container) return;

    const user = auth.getCurrentUser();
    if (!user) return;
    const metrics = store.getDepartmentMetrics();
    const canCreate = auth.canCreateTask();
    const isDark = shinTheme.resolveIsDark();
    const unreadCount = store.getUnreadNotificationCount(user.id);
    const userNotifs = store.getUserNotifications(user.id);
    const pendingData = store.getPendingApprovalsForUser(user);
    const pendingApprovalCount = pendingData.totalCount || 0;

    let roleBadgeText = '👤 Nhân Viên';
    if (user.role === 'LEADERSHIP') roleBadgeText = '🏛️ Ban Lãnh Đạo';
    else if (user.role === 'MANAGER') roleBadgeText = '👔 Trưởng Phòng';
    else if (user.role === 'DEPUTY_MANAGER') roleBadgeText = '⭐ Phó Phòng';

    if (auth.isAdmin()) {
      roleBadgeText += ' • 👑 Admin';
    }

    this.container.innerHTML = `
      <header class="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-white/95 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.03)] border-b border-[#e2e8f0] z-30 flex items-center justify-between px-3 sm:px-6" style="background-color: var(--card); border-color: var(--border);">
        
        <!-- 1. LEFT: HAMBURGER & SEARCH BAR -->
        <div class="flex items-center gap-2 sm:gap-4 min-w-0 flex-1 max-w-xl">
          <!-- HAMBURGER BUTTON (MOBILE / TABLET ONLY - VÙNG BẤM >= 44PX) -->
          <button 
            type="button" 
            class="lg:hidden p-2 rounded-xl text-[#0d1c2f] hover:bg-[#f1f5f9] min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0 -ml-1 transition-colors" 
            id="btnToggleMobileSidebar" 
            aria-label="Mở Menu Điều Hướng"
            style="color: var(--text);"
          >
            <span class="material-symbols-outlined text-[24px]">menu</span>
          </button>

          <!-- DESKTOP SEARCH SPOTLIGHT BAR (ẨN TRÊN MOBILE ĐỂ TRÁNH ĐÈ NÚT) -->
          <div class="hidden sm:flex relative items-center w-full max-w-xs lg:w-96">
            <span class="material-symbols-outlined absolute left-2.5 sm:left-3 text-[18px] text-[#817663]">search</span>
            <input 
              type="text" 
              id="topSearchInput"
              class="w-full h-10 pl-8 sm:pl-9 pr-3 sm:pr-12 rounded-xl bg-[#f8f9ff] text-[#0d1c2f] text-[13.5px] placeholder:text-[#817663] border border-[#e2e8f0] focus:bg-white focus:border-[#d6a52a] focus:ring-2 focus:ring-[#d6a52a]/20 outline-none transition-all" 
              placeholder="Tìm kiếm công việc..." 
              style="color: var(--text); border-color: var(--border);"
            />
            <kbd class="hidden sm:inline-block absolute right-2.5 px-1.5 py-0.5 rounded bg-[#e6eeff] font-mono-data text-[10px] text-[#4f4635] font-semibold">⌘K</kbd>
          </div>
        </div>

        <!-- 2. RIGHT ACTIONS & USER PROFILE -->
        <div class="flex items-center gap-1 sm:gap-2 shrink-0">
          
          <!-- NÚT TÌM KIẾM CHO MOBILE (CHỈ HIỂN THỊ DƯỚI SM - 1 CHẠM MỞ FULL OVERLAY) -->
          <button 
            type="button" 
            class="sm:hidden p-2 rounded-xl hover:bg-[#f1f5f9] min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors cursor-pointer text-[#64748b]" 
            title="Tìm kiếm" 
            id="btnMobileSearchToggle"
            aria-label="Tìm kiếm"
          >
            <span class="material-symbols-outlined text-[21px]">search</span>
          </button>

          <!-- NÚT CHUYỂN NHANH DARK / LIGHT MODE (CHỈ HIỂN THỊ TỪ SM TRỞ LÊN, MOBILE DÙNG TRONG USER MENU) -->
          <button type="button" class="hidden sm:flex p-2 rounded-xl hover:bg-[#f1f5f9] min-w-[44px] min-h-[44px] items-center justify-center transition-colors" title="${isDark ? 'Chuyển sang chế độ Sáng' : 'Chuyển sang chế độ Tối (Dark Mode)'}" id="btnQuickThemeToggle">
            <span class="material-symbols-outlined text-[20px] text-[#64748b]">${isDark ? 'light_mode' : 'dark_mode'}</span>
          </button>

          <!-- NÚT ĐỔI MÀU GIAO DIỆN (CHỈ HIỂN THỊ TỪ MD TRỞ LÊN, MOBILE DÙNG TRONG USER MENU) -->
          <button type="button" class="hidden md:flex p-2 rounded-xl hover:bg-[#f1f5f9] min-w-[44px] min-h-[44px] items-center justify-center transition-colors" title="Đổi màu giao diện (8 Palettes SHIN AIOS)" id="btnQuickPalette">
            <span class="material-symbols-outlined text-[20px]" style="color: var(--primary);">palette</span>
          </button>

          <!-- NÚT PHÊ DUYỆT 1-CHẠM NHANH (APPROVAL HUB SHORTCUT - CÓ BADGE SỐ LƯỢNG) -->
          <button type="button" class="relative p-2 rounded-xl text-[#4f4635] hover:bg-[#fffbeb] min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors cursor-pointer" title="Trung tâm phê duyệt 1-chạm (${pendingApprovalCount} đang chờ)" id="btnTopApproval">
            <span class="material-symbols-outlined text-[22px]" style="${pendingApprovalCount > 0 ? 'color: #b45309;' : 'color: #64748b;'}">verified</span>
            ${pendingApprovalCount > 0 ? `
              <span class="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#d97706] px-1 text-[10px] font-bold text-white shadow-xs animate-pulse">
                ${pendingApprovalCount > 99 ? '99+' : pendingApprovalCount}
              </span>
            ` : ''}
          </button>

          <!-- NOTIFICATIONS BELL & DROPDOWN -->
          <div class="relative">
            <button type="button" class="relative p-2 rounded-xl text-[#4f4635] hover:bg-[#f1f5f9] min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors cursor-pointer" title="Thông báo (${unreadCount} chưa đọc)" id="btnNotifications">
              <span class="material-symbols-outlined text-[22px]" style="${unreadCount > 0 ? 'color: var(--primary);' : ''}">notifications</span>
              ${unreadCount > 0 ? `
                <span class="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#dc2626] px-1 text-[10px] font-bold text-white shadow-xs animate-pulse">
                  ${unreadCount > 99 ? '99+' : unreadCount}
                </span>
              ` : ''}
            </button>

            <!-- DROPDOWN THÔNG BÁO -->
            <div id="notificationsDropdown" class="hidden absolute right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 top-12 w-[calc(100vw-24px)] max-w-[360px] sm:w-[380px] bg-white rounded-2xl shadow-2xl border border-[#e2e8f0] overflow-hidden z-50 flex flex-col" style="background-color: var(--card); border-color: var(--border);">
              
              <!-- HEADER DROPDOWN -->
              <div class="p-3.5 px-4 border-b border-[#f1f5f9] flex items-center justify-between bg-[#f8f9ff]/60 shrink-0" style="border-color: var(--border); background-color: var(--primary-soft);">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-[20px]" style="color: var(--primary);">notifications_active</span>
                  <span class="text-[13.5px] font-bold text-[#0d1c2f]" style="color: var(--text);">Thông Báo</span>
                  ${unreadCount > 0 ? `
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-mono-data">
                      ${unreadCount} mới
                    </span>
                  ` : ''}
                </div>

                ${unreadCount > 0 ? `
                  <button type="button" id="btnMarkAllNotifsRead" class="text-[11.5px] font-semibold text-amber-700 hover:text-amber-900 hover:underline cursor-pointer">
                    Đã đọc tất cả
                  </button>
                ` : ''}
              </div>

              <!-- LIST THÔNG BÁO -->
              <div class="max-h-[360px] overflow-y-auto flex flex-col divide-y divide-[#f1f5f9]" style="border-color: var(--border);">
                ${userNotifs.length === 0 ? `
                  <div class="p-8 text-center flex flex-col items-center justify-center gap-2 text-gray-400">
                    <span class="material-symbols-outlined text-[36px] text-gray-300">notifications_off</span>
                    <span class="text-[12.5px]">Bạn không có thông báo nào.</span>
                  </div>
                ` : userNotifs.slice(0, 30).map(n => {
                  let icon = 'notifications';
                  let iconBg = 'bg-blue-50 text-blue-600';
                  if (n.type === 'task_assigned') {
                    icon = 'assignment_ind';
                    iconBg = 'bg-amber-50 text-amber-700';
                  } else if (n.type === 'status_change') {
                    icon = 'sync_alt';
                    iconBg = 'bg-sky-50 text-sky-600';
                  } else if (n.type === 'approval' || n.type === 'approval_approved') {
                    icon = 'verified';
                    iconBg = 'bg-emerald-50 text-emerald-600';
                  } else if (n.type === 'approval_request') {
                    icon = 'pending_actions';
                    iconBg = 'bg-amber-50 text-amber-700';
                  } else if (n.type === 'approval_rejected') {
                    icon = 'cancel';
                    iconBg = 'bg-rose-50 text-rose-600';
                  } else if (n.type === 'comment') {
                    icon = 'chat';
                    iconBg = 'bg-purple-50 text-purple-600';
                  }

                  return `
                    <div class="p-3.5 hover:bg-[#f8f9ff] cursor-pointer transition-colors flex items-start gap-3 notif-item ${!n.isRead ? 'bg-[#fffbeb]/40' : ''}" data-notif-id="${n.id}" data-task-id="${n.taskId || ''}">
                      <div class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${iconBg} shadow-2xs mt-0.5">
                        <span class="material-symbols-outlined text-[18px]">${icon}</span>
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between gap-1">
                          <span class="text-[12.5px] font-bold text-[#0d1c2f] truncate ${!n.isRead ? 'text-[#795900]' : ''}" style="color: ${!n.isRead ? 'var(--primary)' : 'var(--text)'};">
                            ${esc(n.title)}
                          </span>
                          <span class="text-[10px] text-gray-400 shrink-0 font-mono-data">${timeAgo(n.createdAt)}</span>
                        </div>
                        <p class="text-[12px] text-[#4f4635] mt-0.5 line-clamp-2 leading-relaxed" style="color: var(--text-muted);">
                          ${esc(n.content)}
                        </p>
                        ${n.taskId ? `
                          <span class="inline-block mt-1 font-mono-data text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                            #${n.taskId}
                          </span>
                        ` : ''}
                      </div>
                      ${!n.isRead ? `
                        <span class="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-2 shadow-xs"></span>
                      ` : ''}
                    </div>
                  `;
                }).join('')}
              </div>

              <!-- FOOTER DROPDOWN -->
              ${userNotifs.length > 0 ? `
                <div class="p-2.5 px-3 border-t border-[#f1f5f9] flex items-center justify-between bg-gray-50/50 shrink-0 text-[11px]" style="border-color: var(--border);">
                  <span class="text-gray-400">${userNotifs.length} thông báo</span>
                  <button type="button" id="btnClearAllNotifs" class="text-gray-500 hover:text-rose-600 transition-colors font-medium cursor-pointer">
                    Xóa tất cả
                  </button>
                </div>
              ` : ''}

            </div>
          </div>

          <!-- QUICK SETTINGS BUTTON (DESKTOP) -->
          <button type="button" class="hidden sm:flex p-2 rounded-xl text-[#4f4635] hover:bg-[#f1f5f9] min-w-[44px] min-h-[44px] items-center justify-center transition-colors" title="Cài đặt hệ thống & Tích hợp Cloud" id="btnQuickSettings">
            <span class="material-symbols-outlined text-[22px]">settings</span>
          </button>

          <!-- PRIMARY ACTION: TẠO CÔNG VIỆC (CHỈ HIỂN THỊ TỪ SM TRỞ LÊN ĐỂ TRÁNH QUÁ TẢI MOBILE) -->
          ${canCreate ? `
            <button type="button" class="hidden sm:flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-[12px] sm:text-[13px] font-bold shadow-xs transition-all min-h-[44px]" id="btnHeaderCreateTask" style="background-color: var(--primary-container); color: var(--on-primary-container);" title="Giao việc mới">
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
            <div id="userMenuDropdown" class="hidden absolute right-0 top-12 w-64 bg-white rounded-2xl shadow-2xl border border-[#e2e8f0] py-2 z-50" style="background-color: var(--card); border-color: var(--border);">
              <div class="px-4 py-2.5 border-b border-[#f1f5f9] mb-1" style="border-color: var(--border);">
                <div class="text-[13px] font-bold text-[#0d1c2f] truncate" style="color: var(--text);">${user.name}</div>
                <div class="text-[11px] text-[#64748b] truncate">${user.email || user.title}</div>
                <span class="mt-1 inline-block text-[10.5px] font-bold px-2 py-0.5 rounded-full" style="background-color: var(--primary-soft); color: var(--primary);">
                  ${roleBadgeText}
                </span>
              </div>

              <!-- CHUYỂN DARK / LIGHT MODE TRỰC TIẾP TRONG MENU (TIỆN LỢI CHO MOBILE) -->
              <button type="button" class="w-full px-4 py-2.5 text-left text-[13px] font-semibold hover:bg-[#f8f9ff] flex items-center justify-between min-h-[44px] cursor-pointer" id="btnUserMenuThemeToggle" style="color: var(--text);">
                <div class="flex items-center gap-2.5">
                  <span class="material-symbols-outlined text-[18px]" style="color: var(--primary);">${isDark ? 'light_mode' : 'dark_mode'}</span>
                  <span>${isDark ? 'Chế độ Sáng' : 'Chế độ Tối (Dark)'}</span>
                </div>
                <span class="text-[10px] font-mono-data px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-bold">${isDark ? 'DARK' : 'LIGHT'}</span>
              </button>

              <button type="button" class="w-full px-4 py-2.5 text-left text-[13px] font-semibold text-[#0d1c2f] hover:bg-[#f8f9ff] flex items-center gap-2.5 min-h-[44px]" id="btnOpenProfile" style="color: var(--text);">
                <span class="material-symbols-outlined text-[18px]" style="color: var(--primary);">badge</span>
                <span>Hồ sơ cá nhân</span>
              </button>
              ${auth.isAdmin() ? `
                <button type="button" class="w-full px-4 py-2.5 text-left text-[13px] font-semibold text-[#0d1c2f] hover:bg-[#f8f9ff] flex items-center gap-2.5 min-h-[44px]" id="btnHeaderOpenDepts" style="color: var(--text);">
                  <span class="material-symbols-outlined text-[18px]" style="color: var(--primary);">domain</span>
                  <span>Phòng ban &amp; Bộ phận</span>
                </button>
              ` : ''}
              <button type="button" class="w-full px-4 py-2.5 text-left text-[13px] font-semibold text-[#0d1c2f] hover:bg-[#f8f9ff] flex items-center gap-2.5 min-h-[44px]" id="btnHeaderOpenPalette" style="color: var(--text);">
                <span class="material-symbols-outlined text-[18px]" style="color: var(--primary);">palette</span>
                <span>Đổi màu giao diện (SHIN)</span>
              </button>
              <button type="button" class="w-full px-4 py-2.5 text-left text-[13px] font-semibold text-[#0d1c2f] hover:bg-[#f8f9ff] flex items-center gap-2.5 min-h-[44px]" id="btnHeaderOpenSettings" style="color: var(--text);">
                <span class="material-symbols-outlined text-[18px]" style="color: var(--primary);">settings</span>
                <span>Cài đặt hệ thống</span>
              </button>

              <button type="button" class="w-full px-4 py-2.5 text-left text-[13px] font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 border-t border-[#f1f5f9] mt-1 pt-2 min-h-[44px] cursor-pointer" id="btnLogoutTopHeader" style="border-color: var(--border);">
                <span class="material-symbols-outlined text-[18px]">logout</span>
                <span>Đăng Xuất (Logout)</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 3. MOBILE SEARCH FULL-WIDTH OVERLAY (TRƯỢT MỞ 1-CHẠM KHI NHẤN NÚT TÌM KIẾM TRÊN MOBILE) -->
        <div id="mobileSearchOverlay" class="hidden sm:!hidden absolute inset-0 bg-white z-40 flex items-center px-3 gap-2 border-b border-[#e2e8f0] shadow-sm animate-fade-in" style="background-color: var(--card); border-color: var(--border);">
          <span class="material-symbols-outlined text-[20px] text-[#817663] shrink-0">search</span>
          <input 
            type="text" 
            id="mobileSearchInput"
            class="flex-1 h-11 px-2 text-[14px] bg-transparent outline-none text-[#0d1c2f] placeholder:text-[#817663]" 
            placeholder="Tìm kiếm công việc, kế hoạch..." 
            style="color: var(--text);"
          />
          <button type="button" id="btnCloseMobileSearch" class="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#64748b] hover:text-[#0d1c2f] cursor-pointer shrink-0" aria-label="Đóng tìm kiếm">
            <span class="material-symbols-outlined text-[22px]">close</span>
          </button>
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

    const btnTopApproval = this.container.querySelector('#btnTopApproval');
    if (btnTopApproval) {
      btnTopApproval.addEventListener('click', () => {
        rung(10);
        if (this.onNavigateApproval) this.onNavigateApproval();
      });
    }

    const searchInput = this.container.querySelector('#topSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        if (this.onSearch) this.onSearch(e.target.value);
      });
    }

    // TÌM KIẾM DÀNH RIÊNG CHO MOBILE (FULL-WIDTH OVERLAY)
    const btnMobileSearch = this.container.querySelector('#btnMobileSearchToggle');
    const mobileSearchOverlay = this.container.querySelector('#mobileSearchOverlay');
    const mobileSearchInput = this.container.querySelector('#mobileSearchInput');
    const btnCloseMobileSearch = this.container.querySelector('#btnCloseMobileSearch');

    if (btnMobileSearch && mobileSearchOverlay) {
      btnMobileSearch.addEventListener('click', () => {
        rung(10);
        mobileSearchOverlay.classList.remove('hidden');
        if (mobileSearchInput) {
          mobileSearchInput.value = searchInput ? searchInput.value : '';
          mobileSearchInput.focus();
        }
      });
    }

    if (btnCloseMobileSearch && mobileSearchOverlay) {
      btnCloseMobileSearch.addEventListener('click', () => {
        rung(10);
        mobileSearchOverlay.classList.add('hidden');
        if (mobileSearchInput) mobileSearchInput.value = '';
        if (searchInput) searchInput.value = '';
        if (this.onSearch) this.onSearch('');
      });
    }

    if (mobileSearchInput) {
      mobileSearchInput.addEventListener('input', (e) => {
        const val = e.target.value;
        if (searchInput) searchInput.value = val;
        if (this.onSearch) this.onSearch(val);
      });
    }

    const btnCreate = this.container.querySelector('#btnHeaderCreateTask');
    if (btnCreate) {
      btnCreate.addEventListener('click', () => {
        rung(10);
        if (this.onOpenCreateModal) this.onOpenCreateModal();
      });
    }

    // Quick toggle theme (Dark/Light) trên Desktop
    const btnQuickTheme = this.container.querySelector('#btnQuickThemeToggle');
    if (btnQuickTheme) {
      btnQuickTheme.addEventListener('click', () => {
        shinTheme.toggleThemeQuick();
        this.render();
      });
    }

    // Quick toggle theme (Dark/Light) bên trong User Menu (tiện lợi cho Mobile)
    const btnUserMenuTheme = this.container.querySelector('#btnUserMenuThemeToggle');
    if (btnUserMenuTheme) {
      btnUserMenuTheme.addEventListener('click', () => {
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

    const btnDepts = this.container.querySelector('#btnHeaderOpenDepts');
    if (btnDepts) {
      btnDepts.addEventListener('click', () => {
        rung(10);
        dropdown.classList.add('hidden');
        if (this.onOpenDepartmentModal) this.onOpenDepartmentModal();
      });
    }

    const btnLogout = this.container.querySelector('#btnLogoutTopHeader');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        dropdown.classList.add('hidden');
        auth.logout();
        toast('Đã đăng xuất thành công!', 'info');
        if (this.onLogout) this.onLogout();
      });
    }

    const user = auth.getCurrentUser();
    const btnNotif = this.container.querySelector('#btnNotifications');
    const notifDropdown = this.container.querySelector('#notificationsDropdown');
    const btnMarkAll = this.container.querySelector('#btnMarkAllNotifsRead');
    const btnClearAll = this.container.querySelector('#btnClearAllNotifs');

    if (btnNotif) {
      btnNotif.addEventListener('click', (e) => {
        e.stopPropagation();
        rung(10);
        if (dropdown) dropdown.classList.add('hidden');
        if (this.onOpenNotifications) {
          this.onOpenNotifications();
        } else if (notifDropdown) {
          notifDropdown.classList.toggle('hidden');
        }
      });

      document.addEventListener('click', () => {
        notifDropdown.classList.add('hidden');
      });

      notifDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    if (btnMarkAll && user) {
      btnMarkAll.addEventListener('click', (e) => {
        e.stopPropagation();
        rung(10);
        store.markAllNotificationsAsRead(user.id);
        toast('Đã đánh dấu tất cả thông báo là đã đọc!', 'success');
        this.render();
      });
    }

    if (btnClearAll && user) {
      btnClearAll.addEventListener('click', (e) => {
        e.stopPropagation();
        rung(15);
        store.clearUserNotifications(user.id);
        toast('Đã xóa danh sách thông báo!', 'info');
        this.render();
      });
    }

    this.container.querySelectorAll('.notif-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        rung(10);
        const notifId = item.dataset.notifId;
        const taskId = item.dataset.taskId;

        if (notifId) store.markNotificationAsRead(notifId);
        if (notifDropdown) notifDropdown.classList.add('hidden');

        if (taskId && this.onOpenTask) {
          this.onOpenTask(taskId);
        } else {
          this.render();
        }
      });
    });
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
          ${store.getAllUsers().map(u => `
            <div class="p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between min-h-[50px] ${u.id === currentUser.id ? 'shadow-xs font-bold' : 'hover:bg-[#f8f9ff]'}" data-user-id="${u.id}" style="${u.id === currentUser.id ? 'background-color: var(--primary-soft); border-color: var(--primary);' : 'background-color: var(--card); border-color: var(--border);'}">
              <div class="flex items-center gap-3">
                <img src="${u.avatar}" class="w-9 h-9 rounded-full object-cover ring-2 ring-gray-100 shrink-0" />
                <div class="min-w-0">
                  <div class="text-[13.5px] font-bold text-[#0d1c2f] truncate">${u.name} ${u.id === currentUser.id ? '✓' : ''}</div>
                  <div class="text-[11.5px] text-[#64748b] truncate">${u.title} • ${u.unit}</div>
                </div>
              </div>
              <div class="flex items-center gap-1.5 flex-wrap shrink-0">
                <span class="text-[10.5px] font-bold px-2 py-0.5 rounded-full shrink-0 ${u.role === 'MANAGER' ? 'bg-[#fffbeb] text-[#795900] border border-[#fef3c7]' : (u.role === 'LEADERSHIP' ? 'bg-purple-100 text-purple-900 border border-purple-200' : 'bg-gray-100 text-gray-700')}">
                  ${u.badge}
                </span>
                ${(u.isAdmin || u.role === 'ADMIN') ? `
                  <span class="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-[#ffdea9] text-[#5f4100] border border-amber-300 shrink-0">
                    👑 Admin
                  </span>
                ` : ''}
              </div>
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



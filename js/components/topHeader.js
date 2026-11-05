/**
 * THANH VŨ MEDIC CS3 - TOP HEADER COMPONENT
 * Chiều cao 64px, cố định trên cùng, chuẩn Stitch
 */

import { auth } from '../auth.js';
import { store } from '../store.js';
import { USERS } from '../models.js';

export class TopHeader {
  constructor(containerId, onSearch, onOpenCreateModal) {
    this.container = document.getElementById(containerId);
    this.onSearch = onSearch;
    this.onOpenCreateModal = onOpenCreateModal;
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
              class="w-full h-10 pl-9 pr-12 rounded-lg bg-[#f8f9ff] text-[#0d1c2f] text-[13.5px] placeholder:text-[#817663] border border-[#e2e8f0] focus:bg-white focus:border-[#d6a52a] focus:ring-2 focus:ring-[#d6a52a]/20 outline-none transition-all" 
              placeholder="Tìm kiếm công việc, mã hồ sơ, nhân sự..." 
            />
            <kbd class="absolute right-2.5 px-1.5 py-0.5 rounded bg-[#e6eeff] font-mono-data text-[10px] text-[#4f4635] font-semibold">⌘K</kbd>
          </div>
        </div>

        <!-- RIGHT ACTIONS & USER PROFILE -->
        <div class="flex items-center gap-3">
          <!-- CA TRỰC Y TẾ -->
          <div class="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ffdea9] text-[#5f4100]">
            <span class="material-symbols-outlined text-[16px]">schedule</span>
            <span class="text-[11.5px] font-semibold">Ca hành chính: 07:00 - 17:00</span>
          </div>

          <!-- NOTIFICATIONS -->
          <button type="button" class="relative p-2 rounded-lg text-[#4f4635] hover:bg-[#f1f5f9] transition-colors" title="${metrics.pendingApproval} việc đang chờ phê duyệt" id="btnNotifications">
            <span class="material-symbols-outlined text-[22px]">notifications</span>
            ${metrics.pendingApproval > 0 ? `
              <span class="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#ba1a1a] px-1 text-[10px] font-bold text-white">
                ${metrics.pendingApproval}
              </span>
            ` : ''}
          </button>

          <!-- PRIMARY ACTION: TẠO CÔNG VIỆC -->
          ${canCreate ? `
            <button type="button" class="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#d6a52a] text-[#533d00] text-[13px] font-bold hover:bg-[#795900] hover:text-white shadow-xs transition-all" id="btnHeaderCreateTask">
              <span class="material-symbols-outlined text-[18px]">add</span>
              <span>Tạo công việc</span>
            </button>
          ` : ''}

          <!-- USER SELECTOR (QUICK ROLE SWITCHER) -->
          <div class="flex items-center gap-2.5 pl-2 cursor-pointer p-1 rounded-xl hover:bg-[#f8f9ff] transition-colors" id="btnUserSwitcher" title="Bấm để đổi vai trò kiểm thử phân quyền">
            <div class="relative shrink-0">
              <img src="${user.avatar}" alt="${user.name}" class="w-8 h-8 rounded-full object-cover ring-2 ring-[#e2e8f0]" />
              <span class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#16a34a] ring-2 ring-white"></span>
            </div>
            <div class="hidden xl:flex flex-col text-left">
              <span class="text-[13px] text-[#0d1c2f] font-bold leading-tight truncate">${user.name}</span>
              <span class="text-[11px] text-[#795900] font-semibold truncate">${user.title}</span>
            </div>
            <span class="material-symbols-outlined text-[16px] text-[#817663]">expand_more</span>
          </div>
        </div>
      </header>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const input = this.container.querySelector('#topSearchInput');
    if (input) {
      input.addEventListener('input', (e) => {
        if (this.onSearch) this.onSearch(e.target.value);
      });
    }

    const btnCreate = this.container.querySelector('#btnHeaderCreateTask');
    if (btnCreate) {
      btnCreate.addEventListener('click', () => {
        if (this.onOpenCreateModal) this.onOpenCreateModal();
      });
    }

    const btnUser = this.container.querySelector('#btnUserSwitcher');
    if (btnUser) {
      btnUser.addEventListener('click', () => this.showRoleSwitcherModal());
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
      <div class="modal-card bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-[#e2e8f0]">
        <div class="flex items-center justify-between pb-3 border-b border-[#f1f5f9] mb-4">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary text-[22px]">manage_accounts</span>
            <h3 class="font-bold text-[16px] text-[#0d1c2f]">Phân Quyền Hệ Thống (3 Cấp Roles)</h3>
          </div>
          <button type="button" class="text-gray-400 hover:text-gray-600 text-lg" id="btnCloseRoleSwitcher">&times;</button>
        </div>

        <p class="text-[12.5px] text-[#64748b] mb-4">
          Chọn nhân sự bên dưới để kiểm tra khả năng <strong>cô lập dữ liệu & phân quyền</strong>:
        </p>

        <div class="flex flex-col gap-3">
          <!-- ADMIN -->
          <div class="text-[11px] font-bold text-[#795900] uppercase tracking-wider">👑 Cấp 1: Ban Giám Đốc (Admin)</div>
          ${USERS.filter(u => u.role === 'ADMIN').map(u => this.renderUserItem(u, currentUser)).join('')}

          <!-- TRƯỞNG PHÒNG -->
          <div class="text-[11px] font-bold text-[#16a34a] uppercase tracking-wider mt-2">👔 Cấp 2: Trưởng Phòng / Quản Lý</div>
          ${USERS.filter(u => u.role === 'MANAGER').map(u => this.renderUserItem(u, currentUser)).join('')}

          <!-- NHÂN VIÊN -->
          <div class="text-[11px] font-bold text-[#2563EB] uppercase tracking-wider mt-2">👤 Cấp 3: Nhân Viên Chuyên Môn</div>
          ${USERS.filter(u => u.role === 'MEMBER').map(u => this.renderUserItem(u, currentUser)).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#btnCloseRoleSwitcher').addEventListener('click', () => modal.remove());
    modal.querySelectorAll('[data-user-id]').forEach(el => {
      el.addEventListener('click', () => {
        const uid = el.dataset.userId;
        auth.switchUser(uid);
        modal.remove();
      });
    });
  }

  renderUserItem(u, currentUser) {
    const isSelected = u.id === currentUser.id;
    return `
      <div class="p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${isSelected ? 'bg-[#fffbeb] border-[#d6a52a] shadow-xs' : 'bg-white border-[#e2e8f0] hover:bg-[#f8f9ff]'}" data-user-id="${u.id}">
        <div class="flex items-center gap-3">
          <img src="${u.avatar}" class="w-9 h-9 rounded-full object-cover ring-1 ring-gray-200" />
          <div>
            <div class="text-[13.5px] font-bold text-[#0d1c2f]">${u.name} ${isSelected ? '✓' : ''}</div>
            <div class="text-[11.5px] text-[#64748b]">${u.title} • ${u.unit}</div>
          </div>
        </div>
        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${u.role === 'ADMIN' ? 'bg-[#ffdea9] text-[#5f4100]' : u.role === 'MANAGER' ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-[#dbeafe] text-[#1d4ed8]'}">
          ${u.badge}
        </span>
      </div>
    `;
  }
}

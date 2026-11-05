/**
 * THANH VŨ MEDIC CS3 - SIDEBAR NAVIGATION COMPONENT
 * Thiết kế chuẩn Deep Navy (#172554) theo Palette Slate Blue + Indigo
 * Item Active: Blue (#2563EB), bo tròn mềm mại
 */

import { auth } from '../auth.js';
import { DEPARTMENTS } from '../models.js';
import { toast, rung } from '../helpers.js';

export class Sidebar {
  constructor(containerId, onNavChange, onModeChange) {
    this.container = document.getElementById(containerId);
    this.onNavChange = onNavChange;
    this.onModeChange = onModeChange;
    this.activeNav = 'tong-quan'; // 'tong-quan' | 'cong-viec' | 'nhan-vien' | 'cai-dat'
    this.viewMode = 'quan-ly'; // 'quan-ly' | 'ca-nhan'
  }

  setNav(navId) {
    this.activeNav = navId;
    this.render();
  }

  setMode(mode) {
    this.viewMode = mode;
    this.render();
    if (this.onModeChange) this.onModeChange(mode);
  }

  render() {
    if (!this.container) return;

    const currentDept = auth.getActiveDepartment();
    const canSwitchDept = auth.canSwitchDepartment();
    const user = auth.getCurrentUser();

    this.container.innerHTML = `
      <aside class="fixed left-0 top-0 h-full w-64 bg-[#172554] text-white z-50 flex flex-col justify-between border-r border-[#1e3a8a]/40 shadow-xl select-none">
        <div class="flex flex-col">
          <!-- LOGO & BRAND (WORKFLOW / THANH VŨ MEDIC) -->
          <div class="h-16 px-5 flex items-center gap-3 border-b border-white/10">
            <div class="w-9 h-9 rounded-xl bg-[#2563EB] flex items-center justify-center text-white shadow-md shadow-blue-900/40 font-bold">
              <span class="material-symbols-outlined text-[20px]">layers</span>
            </div>
            <div class="flex flex-col min-w-0">
              <span class="font-bold text-[15px] text-white tracking-wide truncate">Workflow</span>
              <span class="text-[11px] text-blue-200/70 font-semibold truncate">Thanh Vũ Medic • CS3</span>
            </div>
          </div>

          <!-- PHÒNG BAN SELECTOR (HỖ TRỢ ĐA PHÒNG BAN CHO ADMIN) -->
          <div class="px-4 py-3">
            <div class="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-between cursor-pointer transition-all" id="btnSelectDepartment" title="${canSwitchDept ? 'Bấm để đổi phòng ban (Quyền Admin)' : currentDept.name}">
              <div class="flex items-center gap-2 min-w-0">
                <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background: ${currentDept.color || '#2563EB'};"></span>
                <span class="text-[12px] text-blue-100 font-semibold truncate">${currentDept.name}</span>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <span class="font-mono-data text-[10px] text-blue-200 bg-blue-900/60 px-1.5 py-0.5 rounded font-bold">${currentDept.badge}</span>
                ${canSwitchDept ? '<span class="material-symbols-outlined text-[14px] text-blue-300">unfold_more</span>' : ''}
              </div>
            </div>
          </div>

          <!-- SECTION LABEL: MENU -->
          <div class="px-5 pt-2 pb-1 text-[10.5px] font-bold text-blue-300/60 uppercase tracking-wider">
            Menu
          </div>

          <!-- NAVIGATION LINKS -->
          <nav class="flex flex-col gap-1 px-3">
            <button type="button" class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all ${this.activeNav === 'tong-quan' ? 'bg-[#2563EB] text-white font-bold shadow-md shadow-blue-900/50' : 'text-blue-100/80 hover:bg-white/10 hover:text-white'}" data-nav="tong-quan">
              <span class="material-symbols-outlined text-[20px]">grid_view</span>
              <span class="text-[13.5px]">Dashboard</span>
            </button>

            <button type="button" class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all ${this.activeNav === 'cong-viec' ? 'bg-[#2563EB] text-white font-bold shadow-md shadow-blue-900/50' : 'text-blue-100/80 hover:bg-white/10 hover:text-white'}" data-nav="cong-viec">
              <span class="material-symbols-outlined text-[20px]">format_list_bulleted</span>
              <span class="text-[13.5px]">Công việc</span>
            </button>

            <button type="button" class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all ${this.activeNav === 'lich-trinh' ? 'bg-[#2563EB] text-white font-bold shadow-md shadow-blue-900/50' : 'text-blue-100/80 hover:bg-white/10 hover:text-white'}" data-nav="lich-trinh">
              <span class="material-symbols-outlined text-[20px]">calendar_month</span>
              <span class="text-[13.5px]">Lịch trình</span>
            </button>

            <button type="button" class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all ${this.activeNav === 'tien-do' ? 'bg-[#2563EB] text-white font-bold shadow-md shadow-blue-900/50' : 'text-blue-100/80 hover:bg-white/10 hover:text-white'}" data-nav="tien-do">
              <span class="material-symbols-outlined text-[20px]">trending_up</span>
              <span class="text-[13.5px]">Tiến độ</span>
            </button>

            <button type="button" class="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all ${this.activeNav === 'nhan-vien' ? 'bg-[#2563EB] text-white font-bold shadow-md shadow-blue-900/50' : 'text-blue-100/80 hover:bg-white/10 hover:text-white'}" data-nav="nhan-vien">
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-[20px]">group</span>
                <span class="text-[13.5px]">Nhân sự</span>
              </div>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-blue-950 text-blue-200 border border-blue-800 font-bold">${user.badge}</span>
            </button>

            <button type="button" class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all ${this.activeNav === 'cai-dat' ? 'bg-[#2563EB] text-white font-bold shadow-md shadow-blue-900/50' : 'text-blue-100/80 hover:bg-white/10 hover:text-white'}" data-nav="cai-dat" id="btnNavSettings">
              <span class="material-symbols-outlined text-[20px]">settings</span>
              <span class="text-[13.5px]">Cài đặt</span>
            </button>
          </nav>
        </div>

        <!-- FOOTER: CHẾ ĐỘ HIỂN THỊ [QUẢN LÝ | CÁ NHÂN] & TRẠNG THÁI HỆ THỐNG -->
        <div class="p-4 flex flex-col gap-3 bg-[#0f172a]/60 border-t border-white/10">
          <div class="p-2 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-1.5">
            <div class="flex items-center justify-between px-1">
              <span class="text-[10.5px] text-blue-200/70 uppercase font-bold tracking-wider">Chế độ xem</span>
              <span class="material-symbols-outlined text-[14px] text-blue-300">tune</span>
            </div>
            <div class="grid grid-cols-2 p-1 bg-black/30 rounded-lg gap-1">
              <button type="button" class="py-1 text-center text-[11.5px] rounded-md transition-all ${this.viewMode === 'quan-ly' ? 'bg-[#2563EB] text-white font-bold shadow-xs' : 'text-blue-200 hover:text-white'}" id="btnModeManager">
                Quản lý
              </button>
              <button type="button" class="py-1 text-center text-[11.5px] rounded-md transition-all ${this.viewMode === 'ca-nhan' ? 'bg-[#2563EB] text-white font-bold shadow-xs' : 'text-blue-200 hover:text-white'}" id="btnModePersonal">
                Cá nhân
              </button>
            </div>
          </div>

          <div class="flex items-center justify-between px-1">
            <div class="flex items-center gap-1.5">
              <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0D9488] opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-[#0D9488]"></span>
              </span>
              <span class="text-[11px] text-blue-200/70 font-medium">SHIN AIOS Ready</span>
            </div>
            <span class="font-mono-data text-[10.5px] text-blue-300/80 font-bold">v3.0 CS3</span>
          </div>
        </div>
      </aside>
    `;

    this.bindEvents();
  }

  bindEvents() {
    this.container.querySelectorAll('[data-nav]').forEach(btn => {
      btn.addEventListener('click', () => {
        const nav = btn.dataset.nav;
        rung(10);
        this.activeNav = nav;
        this.render();
        if (this.onNavChange) this.onNavChange(nav);
      });
    });

    const btnManager = this.container.querySelector('#btnModeManager');
    const btnPersonal = this.container.querySelector('#btnModePersonal');
    if (btnManager) btnManager.addEventListener('click', () => {
      rung(10);
      this.setMode('quan-ly');
    });
    if (btnPersonal) btnPersonal.addEventListener('click', () => {
      rung(10);
      this.setMode('ca-nhan');
    });

    const btnDept = this.container.querySelector('#btnSelectDepartment');
    if (btnDept) {
      btnDept.addEventListener('click', () => {
        if (auth.canSwitchDepartment()) {
          this.showDepartmentPickerModal();
        } else {
          toast(`Bạn đang ở: ${auth.getActiveDepartment().name}. Chỉ Admin mới được đổi phòng ban!`, 'info');
        }
      });
    }
  }

  showDepartmentPickerModal() {
    let modal = document.getElementById('deptPickerModal');
    if (modal) modal.remove();

    const activeDept = auth.getActiveDepartment();

    modal = document.createElement('div');
    modal.id = 'deptPickerModal';
    modal.className = 'modal-overlay fixed inset-0 z-[100] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 active';
    modal.innerHTML = `
      <div class="modal-card bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#E2E8F0]">
        <div class="flex items-center justify-between pb-3.5 border-b border-[#F1F5F9] mb-4">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center">
              <span class="material-symbols-outlined text-[20px]">domain</span>
            </div>
            <h3 class="font-bold text-[16px] text-[#0F172A]">Chuyển Đổi Phòng Ban (Admin)</h3>
          </div>
          <button type="button" class="text-gray-400 hover:text-gray-600 text-xl font-bold" id="btnCloseDeptPicker">&times;</button>
        </div>

        <p class="text-[12.5px] text-[#64748B] mb-4">
          Dữ liệu mỗi phòng ban được cô lập hoàn toàn. Chọn phòng ban để chuyển không gian làm việc:
        </p>

        <div class="flex flex-col gap-2.5">
          ${DEPARTMENTS.map(d => `
            <div class="p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${d.id === activeDept.id ? 'bg-blue-50 border-[#2563EB] shadow-xs' : 'bg-white border-[#E2E8F0] hover:bg-[#F8FAFC]'}" data-dept-id="${d.id}">
              <div class="flex items-center gap-3">
                <span class="w-3.5 h-3.5 rounded-full" style="background: ${d.color || '#2563EB'};"></span>
                <div>
                  <div class="text-[13.5px] font-bold text-[#0F172A]">${d.name} ${d.id === activeDept.id ? '✓' : ''}</div>
                  <div class="text-[11.5px] text-[#64748B]">${d.unit} • ${d.description}</div>
                </div>
              </div>
              <span class="font-mono-data text-[11px] font-bold px-2 py-0.5 rounded bg-[#F1F5F9] text-[#2563EB]">${d.code}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#btnCloseDeptPicker').addEventListener('click', () => modal.remove());
    modal.querySelectorAll('[data-dept-id]').forEach(el => {
      el.addEventListener('click', () => {
        const deptId = el.dataset.deptId;
        auth.switchDepartment(deptId);
        modal.remove();
        toast(`Đã chuyển sang phòng ban: ${auth.getActiveDepartment().name}`, 'success');
      });
    });
  }
}

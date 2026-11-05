/**
 * THANH VŨ MEDIC CS3 - SIDEBAR NAVIGATION COMPONENT
 * Khôi phục tông Vàng Hoàng Kim (#D6A52A / #795900) chuẩn Google Stitch
 * Sidebar sáng sủa, thanh lịch, item active màu Vàng Gold sang trọng
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
      <aside class="fixed left-0 top-0 h-full w-64 bg-white shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex flex-col justify-between border-r border-[#e2e8f0] select-none">
        <div class="flex flex-col">
          <!-- LOGO & BRAND (THANH VŨ MEDIC CS3) -->
          <div class="h-16 px-5 flex items-center gap-3 border-b border-[#f1f5f9]">
            <div class="w-9 h-9 rounded-xl bg-[#d6a52a] flex items-center justify-center text-white font-extrabold text-[15px] shadow-sm shadow-amber-500/30">
              TV
            </div>
            <div class="flex flex-col min-w-0">
              <span class="font-bold text-[15px] text-[#0d1c2f] tracking-wide truncate">Thanh Vũ Medic</span>
              <span class="text-[11px] text-[#795900] uppercase font-bold tracking-wider truncate">Cơ Sở 3 (Cà Mau)</span>
            </div>
          </div>

          <!-- PHÒNG BAN SELECTOR (HỖ TRỢ ĐA PHÒNG BAN CHO ADMIN) -->
          <div class="px-4 py-3">
            <div class="px-3 py-2 bg-[#f8f9ff] hover:bg-[#fffbeb] border border-[#e2e8f0] hover:border-[#d6a52a] rounded-xl flex items-center justify-between cursor-pointer transition-all" id="btnSelectDepartment" title="${canSwitchDept ? 'Bấm để đổi phòng ban (Quyền Admin)' : currentDept.name}">
              <div class="flex items-center gap-2 min-w-0">
                <span class="w-2.5 h-2.5 rounded-full shrink-0 bg-[#d6a52a]"></span>
                <span class="text-[12px] text-[#4f4635] font-semibold truncate">${currentDept.name}</span>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <span class="font-mono-data text-[10.5px] text-[#795900] bg-[#fffbeb] border border-[#fef3c7] px-1.5 py-0.5 rounded font-bold">${currentDept.badge}</span>
                ${canSwitchDept ? '<span class="material-symbols-outlined text-[14px] text-[#817663]">unfold_more</span>' : ''}
              </div>
            </div>
          </div>

          <!-- NAVIGATION LINKS -->
          <nav class="flex flex-col gap-1 px-3 mt-1">
            <button type="button" class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all ${this.activeNav === 'tong-quan' ? 'bg-[#d6a52a] text-[#533d00] font-bold shadow-xs' : 'text-[#4f4635] hover:bg-[#fffbeb] hover:text-[#795900]'}" data-nav="tong-quan">
              <span class="material-symbols-outlined text-[20px]">grid_view</span>
              <span class="text-[13.5px]">Tổng quan</span>
            </button>

            <button type="button" class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all ${this.activeNav === 'cong-viec' ? 'bg-[#d6a52a] text-[#533d00] font-bold shadow-xs' : 'text-[#4f4635] hover:bg-[#fffbeb] hover:text-[#795900]'}" data-nav="cong-viec">
              <span class="material-symbols-outlined text-[20px]">task_alt</span>
              <span class="text-[13.5px]">Công việc</span>
            </button>

            <button type="button" class="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all ${this.activeNav === 'nhan-vien' ? 'bg-[#d6a52a] text-[#533d00] font-bold shadow-xs' : 'text-[#4f4635] hover:bg-[#fffbeb] hover:text-[#795900]'}" data-nav="nhan-vien">
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-[20px]">group</span>
                <span class="text-[13.5px]">Nhân sự</span>
              </div>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-[#ffdea9] text-[#5f4100] font-bold">${user.badge}</span>
            </button>

            <button type="button" class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all ${this.activeNav === 'cai-dat' ? 'bg-[#d6a52a] text-[#533d00] font-bold shadow-xs' : 'text-[#4f4635] hover:bg-[#fffbeb] hover:text-[#795900]'}" data-nav="cai-dat" id="btnNavSettings">
              <span class="material-symbols-outlined text-[20px]">settings</span>
              <span class="text-[13.5px]">Cài đặt</span>
            </button>
          </nav>
        </div>

        <!-- FOOTER: CHẾ ĐỘ HIỂN THỊ [QUẢN LÝ | CÁ NHÂN] & TRẠNG THÁI PWA -->
        <div class="p-4 flex flex-col gap-3 bg-white border-t border-[#f1f5f9]">
          <div class="p-2 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] flex flex-col gap-1.5">
            <div class="flex items-center justify-between px-1">
              <span class="text-[10.5px] text-[#4f4635] uppercase font-bold tracking-wider">Chế độ xem</span>
              <span class="material-symbols-outlined text-[14px] text-[#817663]">tune</span>
            </div>
            <div class="grid grid-cols-2 p-0.5 bg-[#e6eeff] rounded-lg gap-0.5">
              <button type="button" class="py-1 text-center text-[11.5px] rounded-md transition-all ${this.viewMode === 'quan-ly' ? 'bg-white text-[#0d1c2f] font-bold shadow-xs' : 'text-[#4f4635] hover:text-[#0d1c2f]'}" id="btnModeManager">
                Quản lý
              </button>
              <button type="button" class="py-1 text-center text-[11.5px] rounded-md transition-all ${this.viewMode === 'ca-nhan' ? 'bg-white text-[#0d1c2f] font-bold shadow-xs' : 'text-[#4f4635] hover:text-[#0d1c2f]'}" id="btnModePersonal">
                Cá nhân
              </button>
            </div>
          </div>

          <div class="flex items-center justify-between px-1">
            <div class="flex items-center gap-1.5">
              <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16a34a] opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-[#16a34a]"></span>
              </span>
              <span class="text-[11px] text-[#64748b] font-medium">SHIN AIOS Ready</span>
            </div>
            <span class="font-mono-data text-[10.5px] text-[#795900] font-bold">Gold v3.5</span>
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
    modal.className = 'modal-overlay fixed inset-0 z-[100] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 active';
    modal.innerHTML = `
      <div class="modal-card bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#e2e8f0]">
        <div class="flex items-center justify-between pb-3.5 border-b border-[#f1f5f9] mb-4">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-[#fffbeb] text-[#795900] flex items-center justify-center border border-[#fef3c7]">
              <span class="material-symbols-outlined text-[20px]">domain</span>
            </div>
            <h3 class="font-bold text-[16px] text-[#0d1c2f]">Chuyển Đổi Phòng Ban (Admin)</h3>
          </div>
          <button type="button" class="text-gray-400 hover:text-gray-600 text-xl font-bold" id="btnCloseDeptPicker">&times;</button>
        </div>

        <p class="text-[12.5px] text-[#64748b] mb-4">
          Dữ liệu mỗi phòng ban được cô lập độc lập. Chọn phòng ban để chuyển không gian làm việc:
        </p>

        <div class="flex flex-col gap-2.5">
          ${DEPARTMENTS.map(d => `
            <div class="p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${d.id === activeDept.id ? 'bg-[#fffbeb] border-[#d6a52a] shadow-xs' : 'bg-white border-[#e2e8f0] hover:bg-[#f8f9ff]'}" data-dept-id="${d.id}">
              <div class="flex items-center gap-3">
                <span class="w-3.5 h-3.5 rounded-full bg-[#d6a52a]"></span>
                <div>
                  <div class="text-[13.5px] font-bold text-[#0d1c2f]">${d.name} ${d.id === activeDept.id ? '✓' : ''}</div>
                  <div class="text-[11.5px] text-[#64748b]">${d.unit} • ${d.description}</div>
                </div>
              </div>
              <span class="font-mono-data text-[11px] font-bold px-2 py-0.5 rounded bg-[#f1f5f9] text-[#795900]">${d.code}</span>
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

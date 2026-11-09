/**
 * THANH VŨ MEDIC CS3 - MOBILE BOTTOM NAVIGATION COMPONENT (SHIN AIOS v2.6.4)
 * Thanh điều hướng đáy dành riêng cho thiết bị di động (Mobile First)
 * Chuẩn công thái học: Vùng bấm >= 44x44px, phản hồi xúc giác rung(10)
 * Đổi màu đồng bộ theo 8 Palettes của SHIN AIOS
 */

import { rung } from '../helpers.js?v=5.1';
import { auth } from '../auth.js?v=5.1';
import { store } from '../store.js?v=5.1';

export class BottomNav {
  constructor(containerId, onNavChange) {
    this.container = document.getElementById(containerId);
    this.onNavChange = onNavChange;
    this.activeNav = 'tong-quan'; // 'tong-quan' | 'cong-viec' | 'nhan-vien' | 'cai-dat'
  }

  setNav(navId) {
    this.activeNav = navId;
    this.render();
  }

  render() {
    if (!this.container) return;

    const metrics = store.getDepartmentMetrics();
    const pendingApproval = metrics.pendingApproval || 0;
    const isAdmin = auth.isAdmin();

    const navItems = [
      { id: 'tong-quan', label: 'Tổng quan', icon: 'grid_view' },
      { id: 'cong-viec', label: 'Công việc', icon: 'task_alt', badge: pendingApproval > 0 ? pendingApproval : null },
      { id: 'nhan-vien', label: 'Nhân sự', icon: 'group' },
      ...(isAdmin ? [{ id: 'phong-ban', label: 'Phòng ban', icon: 'domain' }] : []),
      { id: 'cai-dat', label: 'Cài đặt', icon: 'settings' }
    ];

    this.container.innerHTML = `
      <nav class="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-[#e2e8f0] z-40 flex items-center justify-around px-2 shadow-[0_-2px_10px_rgba(0,0,0,0.04)] select-none safe-area-bottom">
        ${navItems.map(item => {
          const isActive = this.activeNav === item.id;
          return `
            <button 
              type="button" 
              class="flex flex-col items-center justify-center flex-1 h-full min-h-[48px] py-1 transition-all relative ${isActive ? 'font-bold' : 'text-[#64748b] hover:text-[#0d1c2f]'}" 
              style="${isActive ? 'color: var(--primary);' : ''}"
              data-bottom-nav="${item.id}"
              aria-label="${item.label}"
            >
              <div class="relative flex items-center justify-center">
                <span class="material-symbols-outlined text-[22px] transition-transform ${isActive ? 'scale-110 font-bold' : ''}">
                  ${item.icon}
                </span>
                ${item.badge ? `
                  <span class="absolute -top-1 -right-2 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-[#dc2626] px-1 text-[9px] font-bold text-white shadow-xs">
                    ${item.badge}
                  </span>
                ` : ''}
              </div>
              <span class="text-[10.5px] mt-0.5 tracking-tight ${isActive ? 'font-extrabold' : 'font-semibold'}">
                ${item.label}
              </span>
              ${isActive ? `
                <span class="absolute top-0 w-8 h-0.5 rounded-full" style="background-color: var(--primary);"></span>
              ` : ''}
            </button>
          `;
        }).join('')}
      </nav>
    `;

    this.bindEvents();
  }

  bindEvents() {
    this.container.querySelectorAll('[data-bottom-nav]').forEach(btn => {
      btn.addEventListener('click', () => {
        const navId = btn.dataset.bottomNav;
        rung(10);
        if (this.onNavChange) this.onNavChange(navId);
      });
    });
  }
}



/**
 * SHIN AIOS v2.6.4 - THEME & COLOR PALETTE MANAGER
 * Quản lý 8 bảng màu (8 Palettes), 4 chế độ hiển thị (Theme Modes),
 * 3 mức cỡ chữ (Font Scales) và công tắc Bottom Navigation chuẩn SHIN.
 */

import { rung } from './helpers.js';

export const PALETTES = [
  {
    id: 'gold',
    name: 'Vàng Hoàng Kim',
    codeName: 'Gold Executive',
    primary: '#d6a52a',
    accent: '#795900',
    desc: 'Hành chính, Quản trị tổng thể, PTKH (Mặc định)',
    tag: 'Mặc định'
  },
  {
    id: 'executive',
    name: 'Xanh Lãnh Đạo',
    codeName: 'Executive Navy',
    primary: '#0284c7',
    accent: '#38bdf8',
    desc: 'Bàn làm việc Lãnh đạo, Điều hành Hub',
    tag: 'Lãnh đạo'
  },
  {
    id: 'clinical',
    name: 'Xanh Ngọc Y Tế',
    codeName: 'Clinical Teal',
    primary: '#0f766e',
    accent: '#2dd4bf',
    desc: 'Y tế, Khám chữa bệnh ngoại trú, Tiêu chuẩn ACHSI',
    tag: 'Y tế CS3'
  },
  {
    id: 'growth',
    name: 'Tím Tăng Trưởng',
    codeName: 'Growth Purple',
    primary: '#7c3aed',
    accent: '#f97316',
    desc: 'Tuyển sinh, Chăm sóc Khách hàng, Phát triển thị phần',
    tag: 'Tăng trưởng'
  },
  {
    id: 'nordic',
    name: 'Bắc Âu Tối Giản',
    codeName: 'Nordic Slate',
    primary: '#475569',
    accent: '#0ea5e9',
    desc: 'Thư viện Tri thức, Second Brain, Quy trình SOP',
    tag: 'Tối giản'
  },
  {
    id: 'cyber',
    name: 'Cyber Terminal',
    codeName: 'Cyber Neon',
    primary: '#10b981',
    accent: '#06b6d4',
    desc: 'Giám sát kỹ thuật, Automation, Terminal AI (Chuyên Tối)',
    tag: 'AI / Tech'
  },
  {
    id: 'crimson',
    name: 'Đỏ Thẩm Quyền',
    codeName: 'Crimson Control',
    primary: '#991b1b',
    accent: '#ea580c',
    desc: 'Ban Kiểm soát, Kỷ luật, Quản trị rủi ro',
    tag: 'Kiểm soát'
  },
  {
    id: 'mocha',
    name: 'Nâu Ấm Áp',
    codeName: 'Mocha Coffee',
    primary: '#854d0e',
    accent: '#ca8a04',
    desc: 'Nhân sự, Xếp lịch trực tuần, Đời sống nội bộ',
    tag: 'Nội bộ'
  }
];

export const THEME_MODES = [
  { id: 'light', name: 'Sáng', icon: 'light_mode', desc: 'Cố định nền sáng sắc nét' },
  { id: 'dark', name: 'Tối', icon: 'dark_mode', desc: 'Nền tối dịu mắt, chống mỏi' },
  { id: 'auto', name: 'Theo máy', icon: 'devices', desc: 'Đồng bộ hệ điều hành' },
  { id: 'time', name: 'Theo giờ', icon: 'schedule', desc: '06h-18h Sáng, 18h-06h Tối' }
];

export const FONT_SCALES = [
  { id: 'vua', name: 'Vừa (1.0x)', desc: 'Chuẩn sắc nét' },
  { id: 'lon', name: 'Lớn (1.1x)', desc: 'Tăng 10% dễ đọc' },
  { id: 'rat_lon', name: 'Rất lớn (1.2x)', desc: 'Tăng 20% rõ ràng' }
];

class ThemeService {
  constructor() {
    this.themeMode = 'light';
    this.palette = 'gold';
    this.fontScale = 'vua';
    this.isNavBarEnabled = true;
    this.subscribers = [];
  }

  init() {
    try {
      this.themeMode = localStorage.getItem('shin_theme') || 'light';
      this.palette = localStorage.getItem('shin_palette') || 'gold';
      this.fontScale = localStorage.getItem('shin_cochu') || 'vua';
      this.isNavBarEnabled = localStorage.getItem('shin_navbar') !== '0';
    } catch (_) {}

    this.apply();
    this.setupListeners();
  }

  subscribe(callback) {
    if (typeof callback === 'function') {
      this.subscribers.push(callback);
    }
  }

  notify() {
    this.subscribers.forEach(cb => {
      try { cb({ themeMode: this.themeMode, palette: this.palette, fontScale: this.fontScale, isNavBarEnabled: this.isNavBarEnabled }); } catch (_) {}
    });
  }

  setupListeners() {
    // 1. Đồng bộ hệ điều hành khi ở chế độ auto
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', () => {
        if (this.themeMode === 'auto') {
          this.apply();
        }
      });
    }

    // 2. Kiểm tra chu kỳ ngày/đêm mỗi 5 phút nếu ở chế độ time
    setInterval(() => {
      if (this.themeMode === 'time') {
        this.apply();
      }
    }, 5 * 60 * 1000);

    // 3. Quy tắc bắt buộc: Tự động ẩn bottom navigation khi người dùng chạm gõ ô input
    window.addEventListener('focusin', (e) => {
      const tag = e.target && e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        document.body.classList.add('dang-nhap-lieu');
      }
    });

    window.addEventListener('focusout', (e) => {
      const tag = e.target && e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        document.body.classList.remove('dang-nhap-lieu');
      }
    });
  }

  resolveIsDark() {
    if (this.themeMode === 'dark') return true;
    if (this.themeMode === 'light') return false;
    if (this.themeMode === 'auto') {
      return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    if (this.themeMode === 'time') {
      const h = new Date().getHours();
      return (h < 6 || h >= 18);
    }
    return false;
  }

  apply() {
    const isDark = this.resolveIsDark();
    const docEl = document.documentElement;
    const body = document.body;

    // Thiết lập thuộc tính lên root
    docEl.setAttribute('data-theme', isDark ? 'dark' : 'light');
    docEl.setAttribute('data-theme-mode', this.themeMode);
    docEl.setAttribute('data-palette', this.palette);
    docEl.setAttribute('data-cochu', this.fontScale);

    if (body) {
      body.setAttribute('data-theme', isDark ? 'dark' : 'light');
      body.setAttribute('data-palette', this.palette);
      body.setAttribute('data-cochu', this.fontScale);
      body.classList.toggle('an-navbar', !this.isNavBarEnabled);
    }
    docEl.classList.toggle('an-navbar', !this.isNavBarEnabled);

    // Cập nhật thẻ meta theme-color trên thiết bị di động
    const currentPal = PALETTES.find(p => p.id === this.palette) || PALETTES[0];
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', isDark ? '#0c0d12' : currentPal.primary);
    }

    this.notify();
  }

  setThemeMode(mode) {
    rung(10);
    this.themeMode = mode;
    try { localStorage.setItem('shin_theme', mode); } catch (_) {}
    this.apply();
  }

  setPalette(paletteId) {
    rung(15);
    this.palette = paletteId;
    try { localStorage.setItem('shin_palette', paletteId); } catch (_) {}
    this.apply();
  }

  setFontScale(scaleId) {
    rung(10);
    this.fontScale = scaleId;
    try { localStorage.setItem('shin_cochu', scaleId); } catch (_) {}
    this.apply();
  }

  setNavBar(enabled) {
    rung(10);
    this.isNavBarEnabled = !!enabled;
    try { localStorage.setItem('shin_navbar', this.isNavBarEnabled ? '1' : '0'); } catch (_) {}
    this.apply();
  }

  toggleThemeQuick() {
    // Chuyển đổi nhanh Sáng <-> Tối từ Topbar
    const isDark = this.resolveIsDark();
    this.setThemeMode(isDark ? 'light' : 'dark');
  }

  renderSettingsUI() {
    const currentPal = PALETTES.find(p => p.id === this.palette) || PALETTES[0];
    const isDark = this.resolveIsDark();

    return `
      <!-- KHỐI QUẢN TRỊ GIAO DIỆN SHIN AIOS (CHẾ ĐỘ HIỂN THỊ, 8 PALETTES, CỠ CHỮ, BOTTOM NAV) -->
      <div class="flex flex-col gap-5 p-4 sm:p-5 rounded-2xl bg-white border border-[#e2e8f0] shadow-sm theme-settings-wrapper">
        
        <!-- TIÊU ĐỀ SECTION -->
        <div class="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center font-bold" style="background-color: var(--primary-soft); color: var(--primary);">
              <span class="material-symbols-outlined text-[20px]">palette</span>
            </div>
            <div>
              <h4 class="font-bold text-[15px] text-[#0d1c2f] leading-tight">Màu Sắc &amp; Giao Diện SHIN</h4>
              <p class="text-[11.5px] text-[#64748b]">Tùy biến 8 bảng màu công thái học, chế độ Dark Mode &amp; cỡ chữ</p>
            </div>
          </div>
          <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold" style="background-color: var(--primary-soft); color: var(--primary);">
            ${currentPal.name}
          </span>
        </div>

        <!-- 1. CHỌN CHẾ ĐỘ HIỂN THỊ (4 MODES) -->
        <div>
          <label class="block text-[12px] font-bold text-[#64748b] mb-2 uppercase tracking-wider">
            1. Chế Độ Hiển Thị (Display Theme)
          </label>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            ${THEME_MODES.map(m => {
              const isActive = this.themeMode === m.id;
              return `
                <button 
                  type="button" 
                  class="btn-theme-mode p-2.5 rounded-xl border text-left transition-all min-h-[44px] flex flex-col justify-center ${isActive ? 'ring-2 font-bold shadow-xs' : 'bg-[#f8f9ff] border-[#e2e8f0] hover:bg-white text-[#64748b]'}"
                  data-theme-mode="${m.id}"
                  style="${isActive ? 'background-color: var(--card); border-color: var(--primary); color: var(--primary); --tw-ring-color: var(--primary);' : ''}"
                >
                  <div class="flex items-center gap-1.5 text-[12.5px]">
                    <span class="material-symbols-outlined text-[17px]">${m.icon}</span>
                    <span>${m.name}</span>
                  </div>
                  <span class="text-[10px] opacity-75 mt-0.5 leading-none">${m.desc}</span>
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <!-- 2. MA TRẬN 8 BẢNG MÀU CHUẨN SHIN AIOS (8 PALETTES) -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="block text-[12px] font-bold text-[#64748b] uppercase tracking-wider">
              2. Bảng Màu Ngành Nghề (8 Palettes Chuẩn)
            </label>
            <span class="text-[11px] text-[#64748b]">Chạm 1-chạm đổi toàn bộ màu</span>
          </div>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            ${PALETTES.map(p => {
              const isSelected = this.palette === p.id;
              return `
                <div 
                  class="palette-card-item p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between min-h-[52px] ${isSelected ? 'ring-2 shadow-sm font-bold' : 'hover:border-gray-400'}"
                  data-palette-id="${p.id}"
                  style="${isSelected ? 'background-color: var(--card); border-color: ' + p.primary + '; --tw-ring-color: ' + p.primary + ';' : 'background-color: var(--bg-sub); border-color: var(--border);'}"
                >
                  <div class="flex items-center gap-2.5 min-w-0">
                    <!-- SWATCH COLOR DOTS -->
                    <div class="flex items-center -space-x-1 shrink-0">
                      <span class="w-5 h-5 rounded-full border-2 border-white shadow-xs inline-block" style="background-color: ${p.primary};"></span>
                      <span class="w-4 h-4 rounded-full border border-white shadow-xs inline-block" style="background-color: ${p.accent};"></span>
                    </div>
                    <div class="min-w-0">
                      <div class="text-[13px] text-[#0d1c2f] flex items-center gap-1.5">
                        <span class="truncate">${p.name}</span>
                        ${isSelected ? `<span class="text-[11px]" style="color: ${p.primary};">✓</span>` : ''}
                      </div>
                      <div class="text-[11px] text-[#64748b] truncate">${p.desc}</div>
                    </div>
                  </div>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-1.5" style="background-color: ${isSelected ? p.primary : '#e2e8f0'}; color: ${isSelected ? '#ffffff' : '#475569'};">
                    ${p.tag}
                  </span>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- 3. CỠ CHỮ TOÀN ỨNG DỤNG (3 MỨC CÔNG THÁI HỌC) -->
        <div>
          <label class="block text-[12px] font-bold text-[#64748b] mb-2 uppercase tracking-wider">
            3. Cỡ Chữ Hiển Thị (Font Scaling)
          </label>
          <div class="grid grid-cols-3 gap-2">
            ${FONT_SCALES.map(f => {
              const isActive = this.fontScale === f.id;
              return `
                <button 
                  type="button" 
                  class="btn-font-scale p-2.5 rounded-xl border text-center transition-all min-h-[44px] flex flex-col items-center justify-center ${isActive ? 'ring-2 font-bold shadow-xs' : 'bg-[#f8f9ff] border-[#e2e8f0] hover:bg-white text-[#64748b]'}"
                  data-font-scale="${f.id}"
                  style="${isActive ? 'background-color: var(--card); border-color: var(--primary); color: var(--primary); --tw-ring-color: var(--primary);' : ''}"
                >
                  <span class="text-[12.5px]">${f.name}</span>
                  <span class="text-[10px] opacity-75 mt-0.5">${f.desc}</span>
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <!-- 4. CÔNG TẮC BẬT/TẮT BOTTOM NAVIGATION TRÊN DI ĐỘNG -->
        <div class="pt-3 border-t border-[#f1f5f9] flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="material-symbols-outlined text-[20px] text-[#64748b]">dock_to_bottom</span>
            <div>
              <div class="text-[13px] font-bold text-[#0d1c2f]">Thanh Điều Hướng Chân Trang (Bottom Nav)</div>
              <div class="text-[11px] text-[#64748b]">Bật để truy cập nhanh 4 menu; tắt để xem toàn màn hình</div>
            </div>
          </div>
          
          <label class="relative inline-flex items-center cursor-pointer min-w-[44px] min-h-[44px] justify-center">
            <input type="checkbox" id="chkNavBarToggle" class="sr-only peer" ${this.isNavBarEnabled ? 'checked' : ''}>
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[12px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all" style="--tw-bg-opacity: 1;" id="navBarTrack"></div>
          </label>
        </div>

      </div>
    `;
  }

  bindEvents(containerEl, onAfterChange = null) {
    if (!containerEl) return;

    // 1. Theme mode buttons
    containerEl.querySelectorAll('[data-theme-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.themeMode;
        this.setThemeMode(mode);
        if (onAfterChange) onAfterChange();
      });
    });

    // 2. Palette cards
    containerEl.querySelectorAll('[data-palette-id]').forEach(card => {
      card.addEventListener('click', () => {
        const palId = card.dataset.paletteId;
        this.setPalette(palId);
        if (onAfterChange) onAfterChange();
      });
    });

    // 3. Font scale buttons
    containerEl.querySelectorAll('[data-font-scale]').forEach(btn => {
      btn.addEventListener('click', () => {
        const scale = btn.dataset.fontScale;
        this.setFontScale(scale);
        if (onAfterChange) onAfterChange();
      });
    });

    // 4. Nav bar toggle switch
    const chkNav = containerEl.querySelector('#chkNavBarToggle');
    if (chkNav) {
      chkNav.addEventListener('change', () => {
        this.setNavBar(chkNav.checked);
        if (onAfterChange) onAfterChange();
      });
    }
  }
}

export const shinTheme = new ThemeService();


/**
 * SHIN AIOS v2.6.4 - THEME & COLOR PALETTE MANAGER
 * Qu?n lý 8 b?ng màu (8 Palettes), 4 ch? d? hi?n th? (Theme Modes),
 * 3 m?c c? ch? (Font Scales) và công t?c Bottom Navigation chu?n SHIN.
 */

import { rung } from './helpers.js';

export const PALETTES = [
  {
    id: 'gold',
    name: 'Vàng Hoàng Kim',
    codeName: 'Gold Executive',
    primary: '#d6a52a',
    accent: '#795900',
    desc: 'Hành chính, Qu?n tr? t?ng th?, PTKH (M?c d?nh)',
    tag: 'M?c d?nh'
  },
  {
    id: 'executive',
    name: 'Xanh Lãnh Ð?o',
    codeName: 'Executive Navy',
    primary: '#0284c7',
    accent: '#38bdf8',
    desc: 'Bàn làm vi?c Lãnh d?o, Ði?u hành Hub',
    tag: 'Lãnh d?o'
  },
  {
    id: 'clinical',
    name: 'Xanh Ng?c Y T?',
    codeName: 'Clinical Teal',
    primary: '#0f766e',
    accent: '#2dd4bf',
    desc: 'Y t?, Khám ch?a b?nh ngo?i trú, Tiêu chu?n ACHSI',
    tag: 'Y t? CS3'
  },
  {
    id: 'growth',
    name: 'Tím Tang Tru?ng',
    codeName: 'Growth Purple',
    primary: '#7c3aed',
    accent: '#f97316',
    desc: 'Tuy?n sinh, Cham sóc Khách hàng, Phát tri?n th? ph?n',
    tag: 'Tang tru?ng'
  },
  {
    id: 'nordic',
    name: 'B?c Âu T?i Gi?n',
    codeName: 'Nordic Slate',
    primary: '#475569',
    accent: '#0ea5e9',
    desc: 'Thu vi?n Tri th?c, Second Brain, Quy trình SOP',
    tag: 'T?i gi?n'
  },
  {
    id: 'cyber',
    name: 'Cyber Terminal',
    codeName: 'Cyber Neon',
    primary: '#10b981',
    accent: '#06b6d4',
    desc: 'Giám sát k? thu?t, Automation, Terminal AI (Chuyên T?i)',
    tag: 'AI / Tech'
  },
  {
    id: 'crimson',
    name: 'Ð? Th?m Quy?n',
    codeName: 'Crimson Control',
    primary: '#991b1b',
    accent: '#ea580c',
    desc: 'Ban Ki?m soát, K? lu?t, Qu?n tr? r?i ro',
    tag: 'Ki?m soát'
  },
  {
    id: 'mocha',
    name: 'Nâu ?m Áp',
    codeName: 'Mocha Coffee',
    primary: '#854d0e',
    accent: '#ca8a04',
    desc: 'Nhân s?, X?p l?ch tr?c tu?n, Ð?i s?ng n?i b?',
    tag: 'N?i b?'
  }
];

export const THEME_MODES = [
  { id: 'light', name: 'Sáng', icon: 'light_mode', desc: 'C? d?nh n?n sáng s?c nét' },
  { id: 'dark', name: 'T?i', icon: 'dark_mode', desc: 'N?n t?i d?u m?t, ch?ng m?i' },
  { id: 'auto', name: 'Theo máy', icon: 'devices', desc: 'Ð?ng b? h? di?u hành' },
  { id: 'time', name: 'Theo gi?', icon: 'schedule', desc: '06h-18h Sáng, 18h-06h T?i' }
];

export const FONT_SCALES = [
  { id: 'vua', name: 'V?a (1.0x)', desc: 'Chu?n s?c nét' },
  { id: 'lon', name: 'L?n (1.1x)', desc: 'Tang 10% d? d?c' },
  { id: 'rat_lon', name: 'R?t l?n (1.2x)', desc: 'Tang 20% rõ ràng' }
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
    // 1. Ð?ng b? h? di?u hành khi ? ch? d? auto
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', () => {
        if (this.themeMode === 'auto') {
          this.apply();
        }
      });
    }

    // 2. Ki?m tra chu k? ngày/dêm m?i 5 phút n?u ? ch? d? time
    setInterval(() => {
      if (this.themeMode === 'time') {
        this.apply();
      }
    }, 5 * 60 * 1000);

    // 3. Quy t?c b?t bu?c: T? d?ng ?n bottom navigation khi ngu?i dùng ch?m gõ ô input
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

    // Thi?t l?p thu?c tính lên root
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

    // C?p nh?t th? meta theme-color trên thi?t b? di d?ng
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
    // Chuy?n d?i nhanh Sáng <-> T?i t? Topbar
    const isDark = this.resolveIsDark();
    this.setThemeMode(isDark ? 'light' : 'dark');
  }

  renderSettingsUI() {
    const currentPal = PALETTES.find(p => p.id === this.palette) || PALETTES[0];
    const isDark = this.resolveIsDark();

    return `
      <!-- KH?I QU?N TR? GIAO DI?N SHIN AIOS (CH? Ð? HI?N TH?, 8 PALETTES, C? CH?, BOTTOM NAV) -->
      <div class="flex flex-col gap-5 p-4 sm:p-5 rounded-2xl bg-white border border-[#e2e8f0] shadow-sm theme-settings-wrapper">
        
        <!-- TIÊU Ð? SECTION -->
        <div class="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center font-bold" style="background-color: var(--primary-soft); color: var(--primary);">
              <span class="material-symbols-outlined text-[20px]">palette</span>
            </div>
            <div>
              <h4 class="font-bold text-[15px] text-[#0d1c2f] leading-tight">Màu S?c &amp; Giao Di?n SHIN</h4>
              <p class="text-[11.5px] text-[#64748b]">Tùy bi?n 8 b?ng màu công thái h?c, ch? d? Dark Mode &amp; c? ch?</p>
            </div>
          </div>
          <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold" style="background-color: var(--primary-soft); color: var(--primary);">
            ${currentPal.name}
          </span>
        </div>

        <!-- 1. CH?N CH? Ð? HI?N TH? (4 MODES) -->
        <div>
          <label class="block text-[12px] font-bold text-[#64748b] mb-2 uppercase tracking-wider">
            1. Ch? Ð? Hi?n Th? (Display Theme)
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

        <!-- 2. MA TR?N 8 B?NG MÀU CHU?N SHIN AIOS (8 PALETTES) -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="block text-[12px] font-bold text-[#64748b] uppercase tracking-wider">
              2. B?ng Màu Ngành Ngh? (8 Palettes Chu?n)
            </label>
            <span class="text-[11px] text-[#64748b]">Ch?m 1-ch?m d?i toàn b? màu</span>
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
                        ${isSelected ? `<span class="text-[11px]" style="color: ${p.primary};">?</span>` : ''}
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

        <!-- 3. C? CH? TOÀN ?NG D?NG (3 M?C CÔNG THÁI H?C) -->
        <div>
          <label class="block text-[12px] font-bold text-[#64748b] mb-2 uppercase tracking-wider">
            3. C? Ch? Hi?n Th? (Font Scaling)
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

        <!-- 4. CÔNG T?C B?T/T?T BOTTOM NAVIGATION TRÊN DI Ð?NG -->
        <div class="pt-3 border-t border-[#f1f5f9] flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="material-symbols-outlined text-[20px] text-[#64748b]">dock_to_bottom</span>
            <div>
              <div class="text-[13px] font-bold text-[#0d1c2f]">Thanh Ði?u Hu?ng Chân Trang (Bottom Nav)</div>
              <div class="text-[11px] text-[#64748b]">B?t d? truy c?p nhanh 4 menu; t?t d? xem toàn màn hình</div>
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



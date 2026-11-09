/**
 * THANH VU MEDIC CS3 - SETTINGS MODAL COMPONENT (SHIN AIOS v2.7)
 * H?p tho?i cài d?t h? th?ng & C?u hình Google Apps Script / SHIN AIOS
 * Ð?i màu giao di?n (8 Palettes, 4 Theme Modes, 3 C? ch?, Bottom Nav)
 * B?o m?t: Ch? ADMIN m?i du?c xem, c?u hình và d?ng b? Google Apps Script Web App
 */

import { auth } from '../auth.js?v=5.2';
import { store } from '../store.js?v=5.2';
import { appScriptBridge } from '../services/appScriptBridge.js';
import { esc, toast, rung, xacNhan2Lan } from '../helpers.js?v=5.2';
import { shinTheme } from '../theme.js?v=5.2';

export class SettingsModal {
  constructor(containerId, onSettingsUpdated) {
    this.container = document.getElementById(containerId);
    this.onSettingsUpdated = onSettingsUpdated;
  }

  show() {
    if (!this.container) return;

    rung(15);
    const endpoint = appScriptBridge.getEndpoint();
    const isConnected = appScriptBridge.isConnected();
    const currentDept = auth.getActiveDepartment();
    const isAdmin = auth.isAdmin();
    const currentUser = auth.getCurrentUser();

    this.container.innerHTML = `
      <div class="modal-overlay fixed inset-0 z-[100] bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 active" id="settingsOverlay">
        <div class="modal-card bg-white rounded-3xl p-4 sm:p-6 max-w-xl w-full shadow-2xl border border-[#e2e8f0] max-h-[92vh] overflow-y-auto overflow-x-hidden" style="background-color: var(--card); border-color: var(--border);">
          
          <!-- HEADER -->
          <div class="flex items-center justify-between pb-3.5 border-b border-[#f1f5f9] mb-4" style="border-color: var(--border);">
            <div class="flex items-center gap-2.5">
              <div class="w-10 h-10 rounded-2xl flex items-center justify-center font-bold shadow-xs shrink-0" style="background-color: var(--primary-soft); color: var(--primary);">
                <span class="material-symbols-outlined text-[22px]">settings</span>
              </div>
              <div class="min-w-0">
                <h3 class="font-bold text-[17px] text-[#0d1c2f] truncate" style="color: var(--text);">Cài Ð?t H? Th?ng &amp; Giao Di?n</h3>
                <span class="text-[12px] font-semibold truncate block" style="color: var(--primary);">${esc(currentDept.name)} • SHIN AIOS v2.7</span>
              </div>
            </div>
            <button type="button" class="text-gray-400 hover:text-gray-700 text-2xl font-bold min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors cursor-pointer" id="btnCloseSettingsModal" aria-label="Ðóng">&times;</button>
          </div>

          <!-- BODY SECTIONS -->
          <div class="flex flex-col gap-5">
            <!-- 1. M?C Ð?I MÀU GIAO DI?N & DARK MODE TRONG SHIN AIOS (T?T C? USER Ð?U ÐU?C CH?NH) -->
            ${shinTheme.renderSettingsUI()}

            ${isAdmin ? `
            <!-- 2. GOOGLE APPS SCRIPT / CLOUD SYNC (CH? ADMIN M?I ÐU?C TH?Y VÀ C?U HÌNH) -->
            <div class="p-4 rounded-2xl bg-white border border-[#e2e8f0] flex flex-col gap-3.5 shadow-xs" style="background-color: var(--card); border-color: var(--border);">
              <div class="flex items-center justify-between flex-wrap gap-2">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-[22px]" style="color: var(--primary);">cloud_sync</span>
                  <span class="text-[14px] font-bold text-[#0d1c2f]" style="color: var(--text);">C?ng K?t N?i Google Sheets (Apps Script Webhook)</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="px-2 py-0.5 rounded-full text-[10.5px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">?? Ch? Admin</span>
                  <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold ${isConnected ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-[#fffbeb] text-[#795900] border border-[#fef3c7]'}">
                    ${isConnected ? '? Ðã k?t n?i Cloud' : '? LocalStorage Fallback'}
                  </span>
                </div>
              </div>

              <div>
                <label class="block text-[11.5px] font-bold text-[#64748b] mb-1">URL Google Apps Script Web App Endpoint</label>
                <div class="flex gap-2">
                  <input type="url" id="modalInputGasUrl" value="${esc(endpoint)}" placeholder="https://script.google.com/macros/s/.../exec" class="flex-1 h-11 px-3.5 rounded-xl border border-[#e2e8f0] text-[13px] outline-none focus:border-[#d6a52a] bg-white text-[#0d1c2f]" />
                  <button type="button" class="px-4 py-2 rounded-xl font-bold text-[12.5px] transition-colors shrink-0 shadow-xs min-h-[44px] flex items-center justify-center cursor-pointer" id="btnModalSaveGas" style="background-color: var(--primary-container); color: var(--on-primary-container);">
                    Luu URL
                  </button>
                </div>
                <div class="mt-2 p-2.5 rounded-xl text-[11.5px] leading-relaxed border border-amber-200/80 bg-amber-50/70 text-amber-900">
                  ?? <strong>Luu ý quan tr?ng khi tri?n khai:</strong> Trong cài d?t Deploy c?a Apps Script, m?c <em>"Who has access (Ai có quy?n truy c?p)"</em> <strong>B?T BU?C ch?n "Anyone (B?t k? ai)"</strong> d? trình duy?t không b? l?i ch?n b?o m?t CORS.
                </div>
              </div>

              <!-- KH?I Ð?NG B? CHÍNH (SMART 2-WAY SYNC) -->
              <div class="pt-3 border-t border-[#f1f5f9] flex flex-col gap-3" style="border-color: var(--border);">
                <div class="flex items-center justify-between text-[11.5px] text-[#64748b]">
                  <span>L?n d?ng b? g?n nh?t:</span>
                  <strong id="lblLastSync" class="font-mono-data text-[#0d1c2f] font-bold" style="color: var(--text);">
                    ${appScriptBridge.lastSyncTime ? new Date(appScriptBridge.lastSyncTime).toLocaleTimeString('vi-VN') + ' ' + new Date(appScriptBridge.lastSyncTime).toLocaleDateString('vi-VN') : 'Chua d?ng b?'}
                  </strong>
                </div>

                <!-- NÚT Ð?NG B? 2 CHI?U CHÍNH (DUY NH?T & T? Ð?NG) -->
                <button type="button" class="w-full py-3 px-4 rounded-xl text-[13.5px] font-bold shadow-xs transition-all min-h-[44px] flex items-center justify-center gap-2 cursor-pointer" id="btnModalSync2Way" style="background-color: var(--primary-container); color: var(--on-primary-container);" title="Ð?ng b? 2 chi?u thông minh gi?a Client và Google Sheets">
                  <span class="material-symbols-outlined text-[19px]">sync</span>
                  <span>?? Ð?ng B? 2 Chi?u Ngay</span>
                </button>
                <p class="text-[11px] text-[#817663] text-center -mt-1.5">
                  T? d?ng t?i d? li?u m?i nh?t t? Google Sheets v? và c?p nh?t các thay d?i t? máy lên Cloud.
                </p>

                <!-- TÙY CH?N NÂNG CAO CHO ADMIN (PULL / PUSH RIÊNG BI?T) -->
                <div class="pt-2 border-t border-dashed border-[#e2e8f0] flex flex-col gap-2">
                  <span class="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Tùy ch?n k? thu?t nâng cao:</span>
                  <div class="grid grid-cols-2 gap-2">
                    <button type="button" class="px-3 py-2 rounded-xl bg-white border text-[11.5px] font-bold flex items-center justify-center gap-1 shadow-2xs transition-all min-h-[44px] cursor-pointer hover:bg-gray-50" id="btnModalSyncNow" style="border-color: var(--primary); color: var(--primary);" title="Ch? t?i l?i toàn b? t? Google Sheets v? dè lên máy">
                      <span class="material-symbols-outlined text-[16px]">download</span>
                      <span>?? T?i v? t? Sheet</span>
                    </button>
                    <button type="button" class="px-3 py-2 rounded-xl bg-white border text-[11.5px] font-bold flex items-center justify-center gap-1 shadow-2xs transition-all min-h-[44px] cursor-pointer hover:bg-gray-50" id="btnModalPushAll" style="border-color: var(--primary); color: var(--primary);" title="Ép d?y toàn b? d? li?u trên máy lên ghi dè Google Sheets">
                      <span class="material-symbols-outlined text-[16px]">upload</span>
                      <span>?? Ð?y dè lên Sheet</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            ` : ''}

            <!-- 3. H? TH?NG VÀ THÔNG TIN PHIÊN B?N -->
            <div class="p-4 rounded-2xl bg-white border border-[#e2e8f0] flex flex-col gap-2.5 shadow-xs" style="background-color: var(--card); border-color: var(--border);">
              <span class="text-[13.5px] font-bold text-[#0d1c2f] flex items-center gap-2" style="color: var(--text);">
                <span class="material-symbols-outlined text-[#64748b] text-[20px]">info</span>
                Thông Tin Phiên B?n
              </span>
              <div class="text-[12px] text-[#64748b] flex justify-between">
                <span>H? di?u hành:</span>
                <span class="font-mono-data text-[#0d1c2f] font-semibold" style="color: var(--text);">SHIN AIOS Master UX/UI v2.7</span>
              </div>
              <div class="text-[12px] text-[#64748b] flex justify-between">
                <span>Ðon v?:</span>
                <span class="text-[#0d1c2f] font-semibold" style="color: var(--text);">Thanh Vu Medic Co S? 3 (Cà Mau)</span>
              </div>
              <div class="text-[12px] text-[#64748b] flex justify-between">
                <span>Tài kho?n hi?n t?i:</span>
                <span class="font-semibold" style="color: var(--primary);">${esc(currentUser.name)} (${esc(currentUser.role)})</span>
              </div>

              ${isAdmin ? `
              <div class="pt-2 border-t border-[#f1f5f9] mt-1" style="border-color: var(--border);">
                <button type="button" class="w-full py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200 text-[12.5px] font-bold hover:bg-red-100 transition-colors min-h-[44px] flex items-center justify-center gap-1.5 cursor-pointer" id="btnModalResetData">
                  <span class="material-symbols-outlined text-[18px]">restart_alt</span>
                  <span>Khôi ph?c d? li?u g?c m?u (Admin xác nh?n 2 l?n)</span>
                </button>
              </div>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const overlay = this.container.querySelector('#settingsOverlay');
    const btnClose = this.container.querySelector('#btnCloseSettingsModal');

    const closeModal = () => {
      rung(10);
      if (overlay) overlay.remove();
    };

    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
      });
    }

    // Binds Theme & Palette events
    shinTheme.bindEvents(this.container, () => {
      this.show();
      if (this.onSettingsUpdated) this.onSettingsUpdated();
    });

    const btnSave = this.container.querySelector('#btnModalSaveGas');
    const inputUrl = this.container.querySelector('#modalInputGasUrl');
    if (btnSave && inputUrl) {
      btnSave.addEventListener('click', async () => {
        rung(10);
        const url = inputUrl.value.trim();
        appScriptBridge.setEndpoint(url);
        toast('Ðã luu URL k?t n?i Google Apps Script!', 'success');
        this.show();
        if (this.onSettingsUpdated) this.onSettingsUpdated();
      });
    }

    // Nút Ð?NG B? 2 CHI?U CHÍNH (Smart 2-Way Sync)
    const btnSync2Way = this.container.querySelector('#btnModalSync2Way');
    if (btnSync2Way) {
      btnSync2Way.addEventListener('click', async () => {
        rung(15);
        if (!appScriptBridge.isConnected()) {
          toast('Vui lòng nh?p URL Web App Endpoint tru?c khi d?ng b?!', 'warning');
          return;
        }

        btnSync2Way.disabled = true;
        btnSync2Way.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">sync</span><span>Ðang d?ng b? 2 chi?u...</span>';
        toast('Ðang d?ng b? 2 chi?u v?i Google Sheets...', 'info');

        // B1: Ð?y d? li?u m?i trên máy lên Google Sheets
        const pushResult = await store.pushAllToCloud();
        // B2: T?i d? li?u m?i nh?t t? Google Sheets v?
        const pullResult = await store.syncFromCloudIfAvailable();

        btnSync2Way.disabled = false;
        btnSync2Way.innerHTML = '<span class="material-symbols-outlined text-[19px]">sync</span><span>?? Ð?ng B? 2 Chi?u Ngay</span>';

        if (pullResult.success || pushResult.success) {
          toast('Ðã hoàn t?t d?ng b? 2 chi?u v?i Google Sheets!', 'success');
          this.show();
          if (this.onSettingsUpdated) this.onSettingsUpdated();
        } else {
          toast('Ð?ng b? th?t b?i, vui lòng ki?m tra k?t n?i Web App!', 'warning');
        }
      });
    }

    // Nút t?i d? li?u t? Google Sheet v? (Pull riêng bi?t)
    const btnSync = this.container.querySelector('#btnModalSyncNow');
    if (btnSync) {
      btnSync.addEventListener('click', async () => {
        rung(10);
        if (!appScriptBridge.isConnected()) {
          toast('Vui lòng nh?p URL Web App Endpoint tru?c!', 'warning');
          return;
        }

        btnSync.disabled = true;
        btnSync.innerHTML = '<span class="material-symbols-outlined text-[15px] animate-spin">sync</span><span>Ðang t?i...</span>';
        toast('Ðang t?i d? li?u t? Google Sheet v? máy...', 'info');

        const result = await store.syncFromCloudIfAvailable();
        btnSync.disabled = false;
        btnSync.innerHTML = '<span class="material-symbols-outlined text-[16px]">download</span><span>?? T?i v? t? Sheet</span>';

        if (result.success) {
          toast(result.message, 'success');
          this.show();
          if (this.onSettingsUpdated) this.onSettingsUpdated();
        } else {
          toast(result.message || 'Không th? l?y d? li?u t? Google Sheet.', 'warning');
        }
      });
    }

    // Nút d?y d? li?u t? Web App lên Google Sheet (Push riêng bi?t)
    const btnPush = this.container.querySelector('#btnModalPushAll');
    if (btnPush) {
      btnPush.addEventListener('click', async () => {
        rung(15);
        if (!appScriptBridge.isConnected()) {
          toast('Vui lòng nh?p URL Web App Endpoint tru?c!', 'warning');
          return;
        }

        btnPush.disabled = true;
        btnPush.innerHTML = '<span class="material-symbols-outlined text-[15px] animate-spin">sync</span><span>Ðang d?y...</span>';
        toast('Ðang d?y d? li?u lên Google Sheet...', 'info');

        const result = await store.pushAllToCloud();
        btnPush.disabled = false;
        btnPush.innerHTML = '<span class="material-symbols-outlined text-[16px]">upload</span><span>?? Ð?y dè lên Sheet</span>';

        toast(result.message, result.success ? 'success' : 'warning');
        this.show();
      });
    }

    // Nút khôi ph?c d? li?u g?c: Áp d?ng B?m 2 l?n trong 5 giây (SHIN Zero-Bug Law 6 & 10)
    const btnReset = this.container.querySelector('#btnModalResetData');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        xacNhan2Lan('reset_all_data_modal', 'Khôi ph?c toàn b? d? li?u m?u', () => {
          localStorage.clear();
          location.reload();
        });
      });
    }
  }
}



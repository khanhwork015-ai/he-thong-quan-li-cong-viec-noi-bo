/**
 * THANH VŨ MEDIC CS3 - SETTINGS MODAL COMPONENT (SHIN AIOS v2.6.4)
 * Hộp thoại cài đặt hệ thống & Cấu hình Google Apps Script / SHIN AIOS
 * Đổi màu giao diện (8 Palettes, 4 Theme Modes, 3 Cỡ chữ, Bottom Nav)
 */

import { auth } from '../auth.js';
import { store } from '../store.js';
import { appScriptBridge } from '../services/appScriptBridge.js';
import { esc, toast, rung, xacNhan2Lan } from '../helpers.js';
import { shinTheme } from '../theme.js';

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

    this.container.innerHTML = `
      <div class="modal-overlay fixed inset-0 z-[100] bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 active" id="settingsOverlay">
        <div class="modal-card bg-white rounded-2xl p-4 sm:p-6 max-w-xl w-full shadow-2xl border border-[#e2e8f0] max-h-[92vh] overflow-y-auto">
          <!-- HEADER -->
          <div class="flex items-center justify-between pb-3.5 border-b border-[#f1f5f9] mb-4">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl flex items-center justify-center font-bold" style="background-color: var(--primary-soft); color: var(--primary);">
                <span class="material-symbols-outlined text-[22px]">settings</span>
              </div>
              <div>
                <h3 class="font-bold text-[17px] text-[#0d1c2f]">Cài Đặt Hệ Thống &amp; Giao Diện</h3>
                <span class="text-[12px] font-semibold" style="color: var(--primary);">${currentDept.name} • SHIN AIOS v2.6.4</span>
              </div>
            </div>
            <button type="button" class="text-gray-400 hover:text-gray-700 text-2xl font-bold min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors" id="btnCloseSettingsModal" aria-label="Đóng">&times;</button>
          </div>

          <!-- BODY SECTIONS -->
          <div class="flex flex-col gap-5">
            <!-- 1. MỤC ĐỔI MÀU GIAO DIỆN & DARK MODE TRONG SHIN AIOS (CHỦ ĐẠO YÊU CẦU) -->
            ${shinTheme.renderSettingsUI()}

            <!-- 2. GOOGLE APPS SCRIPT / SHIN AIOS CLOUD SYNC -->
            <div class="p-4 rounded-xl bg-white border border-[#e2e8f0] flex flex-col gap-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-[22px]" style="color: var(--primary);">cloud_sync</span>
                  <span class="text-[13.5px] font-bold text-[#0d1c2f]">Cổng Kết Nối Google Sheets (Apps Script)</span>
                </div>
                <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold ${isConnected ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-[#fffbeb] text-[#795900] border border-[#fef3c7]'}">
                  ${isConnected ? '● Đã kết nối Cloud' : '○ LocalStorage Fallback'}
                </span>
              </div>

              <div>
                <label class="block text-[11.5px] font-bold text-[#64748b] mb-1">URL Web App Endpoint</label>
                <div class="flex gap-2">
                  <input type="url" id="modalInputGasUrl" value="${esc(endpoint)}" placeholder="https://script.google.com/macros/s/.../exec" class="flex-1 h-10 px-3 rounded-xl border border-[#e2e8f0] text-[12.5px] outline-none focus:border-[#d6a52a] bg-white text-[#0d1c2f]" />
                  <button type="button" class="px-3.5 py-1.5 rounded-xl font-bold text-[12px] transition-colors shrink-0 shadow-xs min-h-[44px] flex items-center justify-center" id="btnModalSaveGas" style="background-color: var(--primary-container); color: var(--on-primary-container);">
                    Lưu URL
                  </button>
                </div>
                <div class="mt-2 p-2.5 rounded-lg text-[11.5px] leading-relaxed" style="background-color: var(--primary-soft); color: var(--text);">
                  💡 <strong>Lưu ý quan trọng:</strong> Mục <em>"Who has access"</em> khi Deploy Apps Script phải chọn <strong>"Anyone"</strong> để không bị lỗi chặn CORS.
                </div>
              </div>

              <!-- HÀNG NÚT ĐỒNG BỘ 2 CHIỀU -->
              <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-[#e2e8f0]">
                <span class="text-[11.5px] text-[#64748b]">
                  Đồng bộ lần cuối: <strong id="lblLastSync">${appScriptBridge.lastSyncTime ? new Date(appScriptBridge.lastSyncTime).toLocaleTimeString('vi-VN') + ' ' + new Date(appScriptBridge.lastSyncTime).toLocaleDateString('vi-VN') : 'Chưa có'}</strong>
                </span>
                
                <div class="flex items-center gap-2">
                  <button type="button" class="px-3 py-1.5 rounded-xl bg-white border text-[11.5px] font-bold flex items-center justify-center gap-1 shadow-xs transition-all min-h-[44px]" id="btnModalPushAll" style="border-color: var(--primary); color: var(--primary);" title="Đẩy toàn bộ công việc lên Google Sheet">
                    <span class="material-symbols-outlined text-[15px]">upload</span>
                    <span>Đẩy lên Sheet</span>
                  </button>

                  <button type="button" class="px-3 py-1.5 rounded-xl text-[11.5px] font-bold flex items-center justify-center gap-1 shadow-xs transition-all min-h-[44px]" id="btnModalSyncNow" style="background-color: var(--primary-container); color: var(--on-primary-container);" title="Tải dữ liệu mới nhất từ Google Sheet về">
                    <span class="material-symbols-outlined text-[15px]">sync</span>
                    <span>Tải về ngay</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- 3. HỆ THỐNG VÀ RESET DỮ LIỆU -->
            <div class="p-4 rounded-xl bg-white border border-[#e2e8f0] flex flex-col gap-2.5">
              <span class="text-[13.5px] font-bold text-[#0d1c2f] flex items-center gap-2">
                <span class="material-symbols-outlined text-[#64748b] text-[20px]">info</span>
                Thông Tin Phiên Bản
              </span>
              <div class="text-[12px] text-[#64748b] flex justify-between">
                <span>Hệ điều hành:</span>
                <span class="font-mono-data text-[#0d1c2f] font-semibold">SHIN AIOS Master UX/UI v2.6.4</span>
              </div>
              <div class="text-[12px] text-[#64748b] flex justify-between">
                <span>Đơn vị:</span>
                <span class="text-[#0d1c2f] font-semibold">Thanh Vũ Medic Cơ Sở 3 (Cà Mau)</span>
              </div>

              <div class="pt-2">
                <button type="button" class="w-full py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200 text-[12.5px] font-bold hover:bg-red-100 transition-colors min-h-[44px] flex items-center justify-center gap-1" id="btnModalResetData">
                  🔄 Khôi phục dữ liệu gốc mẫu (Xác nhận 2 lần)
                </button>
              </div>
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
        toast('Đã lưu URL kết nối Google Apps Script!', 'success');
        this.show();
        if (this.onSettingsUpdated) this.onSettingsUpdated();
      });
    }

    // Nút tải dữ liệu từ Google Sheet về
    const btnSync = this.container.querySelector('#btnModalSyncNow');
    if (btnSync) {
      btnSync.addEventListener('click', async () => {
        rung(10);
        if (!appScriptBridge.isConnected()) {
          toast('Vui lòng nhập URL Web App Endpoint trước khi đồng bộ!', 'warning');
          return;
        }

        btnSync.disabled = true;
        btnSync.innerHTML = '<span class="material-symbols-outlined text-[15px] animate-spin">sync</span><span>Đang tải...</span>';
        toast('Đang kết nối Google Sheet để tải dữ liệu...', 'info');

        const result = await store.syncFromCloudIfAvailable();
        btnSync.disabled = false;
        btnSync.innerHTML = '<span class="material-symbols-outlined text-[15px]">sync</span><span>Tải về ngay</span>';

        if (result.success) {
          toast(result.message, 'success');
          this.show();
          if (this.onSettingsUpdated) this.onSettingsUpdated();
        } else {
          toast(result.message || 'Không thể lấy dữ liệu từ Google Sheet.', 'warning');
        }
      });
    }

    // Nút đẩy dữ liệu từ Web App lên Google Sheet
    const btnPush = this.container.querySelector('#btnModalPushAll');
    if (btnPush) {
      btnPush.addEventListener('click', async () => {
        rung(15);
        if (!appScriptBridge.isConnected()) {
          toast('Vui lòng nhập URL Web App Endpoint trước!', 'warning');
          return;
        }

        btnPush.disabled = true;
        btnPush.innerHTML = '<span class="material-symbols-outlined text-[15px] animate-spin">sync</span><span>Đang đẩy...</span>';
        toast('Đang đẩy dữ liệu lên Google Sheet...', 'info');

        const result = await store.pushAllToCloud();
        btnPush.disabled = false;
        btnPush.innerHTML = '<span class="material-symbols-outlined text-[15px]">upload</span><span>Đẩy lên Sheet</span>';

        toast(result.message, result.success ? 'success' : 'warning');
        this.show();
      });
    }

    // Nút khôi phục dữ liệu gốc: Áp dụng Bấm 2 lần trong 5 giây (SHIN Zero-Bug Law 6 & 10)
    const btnReset = this.container.querySelector('#btnModalResetData');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        xacNhan2Lan('reset_all_data_modal', 'Khôi phục toàn bộ dữ liệu mẫu', () => {
          localStorage.clear();
          location.reload();
        });
      });
    }
  }
}

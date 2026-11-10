/**
 * THANH VŨ MEDIC CS3 - SETTINGS MODAL COMPONENT (SHIN AIOS v2.7)
 * Hộp thoại cài đặt hệ thống & Cấu hình Google Apps Script / SHIN AIOS
 * Đổi màu giao diện (8 Palettes, 4 Theme Modes, 3 Cỡ chữ, Bottom Nav)
 * Bảo mật: Chỉ ADMIN mới được xem, cấu hình và đồng bộ Google Apps Script Web App
 */

import { auth } from '../auth.js?v=7.7';
import { store } from '../store.js?v=7.7';
import { appScriptBridge } from '../services/appScriptBridge.js';
import { esc, toast, rung, xacNhan2Lan } from '../helpers.js?v=7.7';
import { shinTheme } from '../theme.js?v=7.7';

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
                <h3 class="font-bold text-[17px] text-[#0d1c2f] truncate" style="color: var(--text);">Cài Đặt Hệ Thống &amp; Giao Diện</h3>
                <span class="text-[12px] font-semibold truncate block" style="color: var(--primary);">${esc(currentDept.name)} • SHIN AIOS v2.7</span>
              </div>
            </div>
            <button type="button" class="text-gray-400 hover:text-gray-700 text-2xl font-bold min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors cursor-pointer" id="btnCloseSettingsModal" aria-label="Đóng">&times;</button>
          </div>

          <!-- BODY SECTIONS -->
          <div class="flex flex-col gap-5">
            <!-- 1. MỤC ĐỔI MÀU GIAO DIỆN & DARK MODE TRONG SHIN AIOS (TẤT CẢ USER ĐỀU ĐƯỢC CHỈNH) -->
            ${shinTheme.renderSettingsUI()}

            ${isAdmin ? `
            <!-- 2. GOOGLE APPS SCRIPT / CLOUD SYNC (CHỈ ADMIN MỚI ĐƯỢC THẤY VÀ CẤU HÌNH) -->
            <div class="p-4 rounded-2xl bg-white border border-[#e2e8f0] flex flex-col gap-3.5 shadow-xs" style="background-color: var(--card); border-color: var(--border);">
              <div class="flex items-center justify-between flex-wrap gap-2">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-[22px]" style="color: var(--primary);">cloud_sync</span>
                  <span class="text-[14px] font-bold text-[#0d1c2f]" style="color: var(--text);">Cổng Kết Nối Google Sheets (Apps Script Webhook)</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="px-2 py-0.5 rounded-full text-[10.5px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">👑 Chỉ Admin</span>
                  <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold ${isConnected ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-[#fffbeb] text-[#795900] border border-[#fef3c7]'}">
                    ${isConnected ? '● Đã kết nối Cloud' : '○ LocalStorage Fallback'}
                  </span>
                </div>
              </div>

              <div>
                <label class="block text-[11.5px] font-bold text-[#64748b] mb-1">URL Google Apps Script Web App Endpoint</label>
                <div class="flex gap-2">
                  <input type="url" id="modalInputGasUrl" value="${esc(endpoint)}" placeholder="https://script.google.com/macros/s/.../exec" class="flex-1 h-11 px-3.5 rounded-xl border border-[#e2e8f0] text-[13px] outline-none focus:border-[#d6a52a] bg-white text-[#0d1c2f]" />
                  <button type="button" class="px-4 py-2 rounded-xl font-bold text-[12.5px] transition-colors shrink-0 shadow-xs min-h-[44px] flex items-center justify-center cursor-pointer" id="btnModalSaveGas" style="background-color: var(--primary-container); color: var(--on-primary-container);">
                    Lưu URL
                  </button>
                </div>
                <div class="mt-2 p-2.5 rounded-xl text-[11.5px] leading-relaxed border border-amber-200/80 bg-amber-50/70 text-amber-900">
                  ℹ️ <strong>Lưu ý quan trọng khi triển khai:</strong> Trong cài đặt Deploy của Apps Script, mục <em>"Who has access (Ai có quyền truy cập)"</em> <strong>BẮT BUỘC chọn "Anyone (Bất kỳ ai)"</strong> để trình duyệt không bị lỗi chặn bảo mật CORS.
                </div>
              </div>

              <!-- KHỐI ĐỒNG BỘ CHÍNH (SMART 2-WAY SYNC) -->
              <div class="pt-3 border-t border-[#f1f5f9] flex flex-col gap-3" style="border-color: var(--border);">
                <div class="flex items-center justify-between text-[11.5px] text-[#64748b]">
                  <span>Lần đồng bộ gần nhất:</span>
                  <strong id="lblLastSync" class="font-mono-data text-[#0d1c2f] font-bold" style="color: var(--text);">
                    ${appScriptBridge.lastSyncTime ? new Date(appScriptBridge.lastSyncTime).toLocaleTimeString('vi-VN') + ' ' + new Date(appScriptBridge.lastSyncTime).toLocaleDateString('vi-VN') : 'Chưa đồng bộ'}
                  </strong>
                </div>

                <!-- NÚT ĐỒNG BỘ 2 CHIỀU CHÍNH (DUY NHẤT & TỰ ĐỘNG) -->
                <button type="button" class="w-full py-3 px-4 rounded-xl text-[13.5px] font-bold shadow-xs transition-all min-h-[44px] flex items-center justify-center gap-2 cursor-pointer" id="btnModalSync2Way" style="background-color: var(--primary-container); color: var(--on-primary-container);" title="Đồng bộ 2 chiều thông minh giữa Client và Google Sheets">
                  <span class="material-symbols-outlined text-[19px]">sync</span>
                  <span>🔄 Đồng Bộ 2 Chiều Ngay</span>
                </button>
                <p class="text-[11px] text-[#817663] text-center -mt-1.5">
                  Tự động tải dữ liệu mới nhất từ Google Sheets về và cập nhật các thay đổi từ máy lên Cloud.
                </p>

                <!-- TÙY CHỌN NÂNG CAO CHO ADMIN (PULL / PUSH RIÊNG BIỆT) -->
                <div class="pt-2 border-t border-dashed border-[#e2e8f0] flex flex-col gap-2">
                  <span class="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Tùy chọn kỹ thuật nâng cao:</span>
                  <div class="grid grid-cols-2 gap-2">
                    <button type="button" class="px-3 py-2 rounded-xl bg-white border text-[11.5px] font-bold flex items-center justify-center gap-1 shadow-2xs transition-all min-h-[44px] cursor-pointer hover:bg-gray-50" id="btnModalSyncNow" style="border-color: var(--primary); color: var(--primary);" title="Chỉ tải lại toàn bộ từ Google Sheets về đè lên máy">
                      <span class="material-symbols-outlined text-[16px]">download</span>
                      <span>📥 Tải về từ Sheet</span>
                    </button>
                    <button type="button" class="px-3 py-2 rounded-xl bg-white border text-[11.5px] font-bold flex items-center justify-center gap-1 shadow-2xs transition-all min-h-[44px] cursor-pointer hover:bg-gray-50" id="btnModalPushAll" style="border-color: var(--primary); color: var(--primary);" title="Ép đẩy toàn bộ dữ liệu trên máy lên ghi đè Google Sheets">
                      <span class="material-symbols-outlined text-[16px]">upload</span>
                      <span>📤 Đẩy đè lên Sheet</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            ` : ''}

            <!-- 3. HỆ THỐNG VÀ THÔNG TIN PHIÊN BẢN -->
            <div class="p-4 rounded-2xl bg-white border border-[#e2e8f0] flex flex-col gap-2.5 shadow-xs" style="background-color: var(--card); border-color: var(--border);">
              <span class="text-[13.5px] font-bold text-[#0d1c2f] flex items-center gap-2" style="color: var(--text);">
                <span class="material-symbols-outlined text-[#64748b] text-[20px]">info</span>
                Thông Tin Phiên Bản
              </span>
              <div class="text-[12px] text-[#64748b] flex justify-between">
                <span>Hệ điều hành:</span>
                <span class="font-mono-data text-[#0d1c2f] font-semibold" style="color: var(--text);">SHIN AIOS Master UX/UI v2.7</span>
              </div>
              <div class="text-[12px] text-[#64748b] flex justify-between">
                <span>Đơn vị:</span>
                <span class="text-[#0d1c2f] font-semibold" style="color: var(--text);">Thanh Vũ Medic Cơ Sở 3 (Cà Mau)</span>
              </div>
              <div class="text-[12px] text-[#64748b] flex justify-between">
                <span>Tài khoản hiện tại:</span>
                <span class="font-semibold" style="color: var(--primary);">${esc(currentUser.name)} (${esc(currentUser.role)})</span>
              </div>

              ${isAdmin ? `
              <div class="pt-2 border-t border-[#f1f5f9] mt-1" style="border-color: var(--border);">
                <button type="button" class="w-full py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200 text-[12.5px] font-bold hover:bg-red-100 transition-colors min-h-[44px] flex items-center justify-center gap-1.5 cursor-pointer" id="btnModalResetData">
                  <span class="material-symbols-outlined text-[18px]">restart_alt</span>
                  <span>Khôi phục dữ liệu gốc mẫu (Admin xác nhận 2 lần)</span>
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
        toast('Đã lưu URL kết nối Google Apps Script!', 'success');
        this.show();
        if (this.onSettingsUpdated) this.onSettingsUpdated();
      });
    }

    // Nút ĐỒNG BỘ 2 CHIỀU CHÍNH (Smart 2-Way Sync)
    const btnSync2Way = this.container.querySelector('#btnModalSync2Way');
    if (btnSync2Way) {
      btnSync2Way.addEventListener('click', async () => {
        rung(15);
        if (!appScriptBridge.isConnected()) {
          toast('Vui lòng nhập URL Web App Endpoint trước khi đồng bộ!', 'warning');
          return;
        }

        btnSync2Way.disabled = true;
        btnSync2Way.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">sync</span><span>Đang đồng bộ 2 chiều...</span>';
        toast('Đang đồng bộ 2 chiều với Google Sheets...', 'info');

        // B1: Đẩy dữ liệu mới trên máy lên Google Sheets
        const pushResult = await store.pushAllToCloud();
        // B2: Tải dữ liệu mới nhất từ Google Sheets về
        const pullResult = await store.syncFromCloudIfAvailable();

        btnSync2Way.disabled = false;
        btnSync2Way.innerHTML = '<span class="material-symbols-outlined text-[19px]">sync</span><span>🔄 Đồng Bộ 2 Chiều Ngay</span>';

        if (pullResult.success || pushResult.success) {
          toast('Đã hoàn tất đồng bộ 2 chiều với Google Sheets!', 'success');
          this.show();
          if (this.onSettingsUpdated) this.onSettingsUpdated();
        } else {
          toast('Đồng bộ thất bại, vui lòng kiểm tra kết nối Web App!', 'warning');
        }
      });
    }

    // Nút tải dữ liệu từ Google Sheet về (Pull riêng biệt)
    const btnSync = this.container.querySelector('#btnModalSyncNow');
    if (btnSync) {
      btnSync.addEventListener('click', async () => {
        rung(10);
        if (!appScriptBridge.isConnected()) {
          toast('Vui lòng nhập URL Web App Endpoint trước!', 'warning');
          return;
        }

        btnSync.disabled = true;
        btnSync.innerHTML = '<span class="material-symbols-outlined text-[15px] animate-spin">sync</span><span>Đang tải...</span>';
        toast('Đang tải dữ liệu từ Google Sheet về máy...', 'info');

        const result = await store.syncFromCloudIfAvailable();
        btnSync.disabled = false;
        btnSync.innerHTML = '<span class="material-symbols-outlined text-[16px]">download</span><span>📥 Tải về từ Sheet</span>';

        if (result.success) {
          toast(result.message, 'success');
          this.show();
          if (this.onSettingsUpdated) this.onSettingsUpdated();
        } else {
          toast(result.message || 'Không thể lấy dữ liệu từ Google Sheet.', 'warning');
        }
      });
    }

    // Nút đẩy dữ liệu từ Web App lên Google Sheet (Push riêng biệt)
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
        btnPush.innerHTML = '<span class="material-symbols-outlined text-[16px]">upload</span><span>📤 Đẩy đè lên Sheet</span>';

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



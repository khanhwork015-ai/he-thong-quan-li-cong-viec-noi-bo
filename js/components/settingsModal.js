/**
 * THANH VŨ MEDIC CS3 - SETTINGS MODAL COMPONENT
 * Hộp thoại cài đặt hệ thống & Cấu hình Google Apps Script / SHIN AIOS
 * Chuẩn màu Vàng Hoàng Kim Google Stitch (#D6A52A / #795900 / #FFFBEB)
 */

import { auth } from '../auth.js';
import { store } from '../store.js';
import { appScriptBridge } from '../services/appScriptBridge.js';
import { esc, toast, rung } from '../helpers.js';

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
      <div class="modal-overlay fixed inset-0 z-[100] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 active" id="settingsOverlay">
        <div class="modal-card bg-white rounded-2xl p-6 max-w-xl w-full shadow-2xl border border-[#e2e8f0] max-h-[92vh] overflow-y-auto">
          <!-- HEADER -->
          <div class="flex items-center justify-between pb-3.5 border-b border-[#f1f5f9] mb-4">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-[#fffbeb] text-[#795900] flex items-center justify-center font-bold border border-[#fef3c7]">
                <span class="material-symbols-outlined text-[22px]">settings</span>
              </div>
              <div>
                <h3 class="font-bold text-[17px] text-[#0d1c2f]">Cài Đặt Hệ Thống &amp; Tích Hợp</h3>
                <span class="text-[12px] text-[#795900] font-semibold">${currentDept.name} • Google Stitch Gold UI</span>
              </div>
            </div>
            <button type="button" class="text-gray-400 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors" id="btnCloseSettingsModal">&times;</button>
          </div>

          <!-- BODY SECTIONS -->
          <div class="flex flex-col gap-5">
            <!-- 1. GOOGLE APPS SCRIPT / SHIN AIOS CLOUD SYNC -->
            <div class="p-4 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] flex flex-col gap-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-[#795900] text-[22px]">cloud_sync</span>
                  <span class="text-[13.5px] font-bold text-[#0d1c2f]">Cổng Kết Nối Google Sheets (Apps Script Web App)</span>
                </div>
                <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold ${isConnected ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-[#fffbeb] text-[#795900] border border-[#fef3c7]'}">
                  ${isConnected ? '● Đã kết nối Cloud' : '○ LocalStorage Fallback'}
                </span>
              </div>

              <div>
                <label class="block text-[11.5px] font-bold text-[#64748b] mb-1">URL Web App Endpoint</label>
                <div class="flex gap-2">
                  <input type="url" id="modalInputGasUrl" value="${esc(endpoint)}" placeholder="https://script.google.com/macros/s/.../exec" class="flex-1 h-9 px-3 rounded-xl border border-[#e2e8f0] text-[12.5px] outline-none focus:border-[#d6a52a] bg-white text-[#0d1c2f]" />
                  <button type="button" class="px-3.5 py-1.5 rounded-xl bg-[#d6a52a] text-[#533d00] font-bold text-[12px] hover:bg-[#795900] hover:text-white transition-colors shrink-0 shadow-xs" id="btnModalSaveGas">
                    Lưu URL
                  </button>
                </div>
                <div class="mt-2 p-2.5 rounded-lg bg-[#fffbeb] border border-[#fef3c7] text-[11.5px] text-[#795900] leading-relaxed">
                  💡 <strong>Lưu ý quan trọng khi Deploy Apps Script:</strong> Mục <em>"Who has access (Ai có quyền truy cập)"</em> phải chọn là <strong>"Anyone (Bất kỳ ai)"</strong> để trình duyệt không bị Google chặn bảo mật CORS.
                </div>
              </div>

              <!-- HÀNG NÚT ĐỒNG BỘ 2 CHIỀU -->
              <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-[#e2e8f0]">
                <span class="text-[11.5px] text-[#64748b]">
                  Lần đồng bộ gần nhất: <strong id="lblLastSync">${appScriptBridge.lastSyncTime ? new Date(appScriptBridge.lastSyncTime).toLocaleTimeString('vi-VN') + ' ' + new Date(appScriptBridge.lastSyncTime).toLocaleDateString('vi-VN') : 'Chưa có'}</strong>
                </span>
                
                <div class="flex items-center gap-2">
                  <button type="button" class="px-3 py-1.5 rounded-xl bg-white border border-[#d6a52a] text-[11.5px] font-bold text-[#795900] hover:bg-[#fffbeb] flex items-center justify-center gap-1 shadow-xs transition-all" id="btnModalPushAll" title="Đẩy toàn bộ công việc và nhân viên hiện có lên Google Sheet">
                    <span class="material-symbols-outlined text-[15px]">upload</span>
                    <span>Đẩy lên Sheet</span>
                  </button>

                  <button type="button" class="px-3 py-1.5 rounded-xl bg-[#d6a52a] text-[#533d00] text-[11.5px] font-bold hover:bg-[#795900] hover:text-white flex items-center justify-center gap-1 shadow-xs transition-all" id="btnModalSyncNow" title="Tải công việc mới nhất từ Google Sheet về">
                    <span class="material-symbols-outlined text-[15px]">sync</span>
                    <span>Tải về ngay</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- 2. GIAO DIỆN & MÀU SẮC -->
            <div class="p-4 rounded-xl bg-white border border-[#e2e8f0] flex flex-col gap-3">
              <span class="text-[13.5px] font-bold text-[#0d1c2f] flex items-center gap-2">
                <span class="material-symbols-outlined text-[#795900] text-[20px]">palette</span>
                Giao Diện &amp; Nhận Diện Thương Hiệu
              </span>

              <div class="flex items-center justify-between text-[12.5px] text-[#0d1c2f] py-1 border-b border-[#f1f5f9]">
                <span>Tông màu chủ đạo:</span>
                <span class="font-bold text-[#795900] flex items-center gap-1.5">
                  <span class="w-3.5 h-3.5 rounded-full bg-[#d6a52a] inline-block shadow-xs"></span>
                  Vàng Hoàng Kim (Google Stitch Gold #D6A52A)
                </span>
              </div>

              <div class="flex items-center justify-between text-[12.5px] text-[#0d1c2f] py-1 border-b border-[#f1f5f9]">
                <span>Kiểu chữ tiêu chuẩn:</span>
                <span class="font-bold text-[#0d1c2f]">Plus Jakarta Sans &amp; JetBrains Mono</span>
              </div>

              <div class="flex items-center justify-between text-[12.5px] text-[#0d1c2f] py-1">
                <span>Phân quyền bảo mật:</span>
                <span class="font-bold text-[#16a34a]">RBAC 3 Cấp (Admin • Trưởng Phòng • Nhân Viên)</span>
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
                <span class="font-mono-data text-[#0d1c2f] font-semibold">SHIN AIOS v2.0 Bridge</span>
              </div>
              <div class="text-[12px] text-[#64748b] flex justify-between">
                <span>Đơn vị:</span>
                <span class="text-[#0d1c2f] font-semibold">Thanh Vũ Medic Cơ Sở 3 (Cà Mau)</span>
              </div>

              <div class="pt-2">
                <button type="button" class="w-full py-2 rounded-xl bg-red-50 text-red-600 border border-red-200 text-[12.5px] font-bold hover:bg-red-100 transition-colors" id="btnModalResetData">
                  🔄 Khôi phục dữ liệu gốc mẫu
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

    const btnReset = this.container.querySelector('#btnModalResetData');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        rung(20);
        if (confirm('Khôi phục toàn bộ dữ liệu ban đầu? Mọi tác vụ tạo mới sẽ được đặt lại theo mẫu.')) {
          localStorage.clear();
          location.reload();
        }
      });
    }
  }
}

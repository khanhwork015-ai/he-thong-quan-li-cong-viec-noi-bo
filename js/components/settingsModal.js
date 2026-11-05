/**
 * THANH VŨ MEDIC CS3 - SETTINGS MODAL COMPONENT
 * Hộp thoại cài đặt hệ thống & Cấu hình Google Apps Script / SHIN AIOS
 * Chuẩn màu Slate Blue + Indigo: Nền Deep Navy #172554 & Primary Blue #2563EB
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
      <div class="modal-overlay fixed inset-0 z-[100] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 active" id="settingsOverlay">
        <div class="modal-card bg-white rounded-2xl p-6 max-w-xl w-full shadow-2xl border border-[#E2E8F0] max-h-[90vh] overflow-y-auto">
          <!-- HEADER -->
          <div class="flex items-center justify-between pb-3.5 border-b border-[#F1F5F9] mb-4">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold">
                <span class="material-symbols-outlined text-[22px]">settings</span>
              </div>
              <div>
                <h3 class="font-bold text-[17px] text-[#0F172A]">Cài Đặt Hệ Thống &amp; Tích Hợp</h3>
                <span class="text-[12px] text-[#2563EB] font-semibold">${currentDept.name} • Slate Blue + Indigo</span>
              </div>
            </div>
            <button type="button" class="text-gray-400 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors" id="btnCloseSettingsModal">&times;</button>
          </div>

          <!-- BODY SECTIONS -->
          <div class="flex flex-col gap-5">
            <!-- 1. GOOGLE APPS SCRIPT / SHIN AIOS CLOUD SYNC -->
            <div class="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col gap-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-[#2563EB] text-[22px]">cloud_sync</span>
                  <span class="text-[13.5px] font-bold text-[#0F172A]">Cổng Kết Nối Google Sheets (Apps Script Web App)</span>
                </div>
                <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold ${isConnected ? 'bg-emerald-50 text-[#0D9488] border border-emerald-200' : 'bg-blue-50 text-[#1D4ED8] border border-blue-200'}">
                  ${isConnected ? '● Đã kết nối Cloud' : '○ LocalStorage Fallback'}
                </span>
              </div>

              <div>
                <label class="block text-[11.5px] font-bold text-[#64748B] mb-1">URL Web App Endpoint</label>
                <div class="flex gap-2">
                  <input type="url" id="modalInputGasUrl" value="${esc(endpoint)}" placeholder="https://script.google.com/macros/s/.../exec" class="flex-1 h-9 px-3 rounded-xl border border-[#E2E8F0] text-[12.5px] outline-none focus:border-[#2563EB] bg-white text-[#0F172A]" />
                  <button type="button" class="px-3.5 py-1.5 rounded-xl bg-[#2563EB] text-white font-bold text-[12px] hover:bg-[#1D4ED8] transition-colors shrink-0 shadow-xs" id="btnModalSaveGas">
                    Lưu URL
                  </button>
                </div>
                <p class="text-[11px] text-[#64748B] mt-1.5 leading-relaxed">
                  Dán URL Web App triển khai từ Google Sheets để đồng bộ 2 chiều dữ liệu công việc và danh bạ nhân sự thực tế.
                </p>
              </div>

              <div class="flex items-center justify-between pt-2 border-t border-[#E2E8F0]">
                <span class="text-[11.5px] text-[#64748B]">
                  Lần đồng bộ gần nhất: <strong>${appScriptBridge.lastSyncTime ? new Date(appScriptBridge.lastSyncTime).toLocaleTimeString('vi-VN') : 'Chưa có'}</strong>
                </span>
                <button type="button" class="px-3 py-1.5 rounded-xl bg-white border border-[#E2E8F0] text-[11.5px] font-bold text-[#0F172A] hover:bg-gray-50 flex items-center gap-1 shadow-xs" id="btnModalSyncNow">
                  <span class="material-symbols-outlined text-[15px] text-[#2563EB]">sync</span>
                  <span>Đồng bộ ngay</span>
                </button>
              </div>
            </div>

            <!-- 2. GIAO DIỆN & MÀU SẮC -->
            <div class="p-4 rounded-xl bg-white border border-[#E2E8F0] flex flex-col gap-3">
              <span class="text-[13.5px] font-bold text-[#0F172A] flex items-center gap-2">
                <span class="material-symbols-outlined text-[#2563EB] text-[20px]">palette</span>
                Giao Diện &amp; Nhận Diện Thương Hiệu
              </span>

              <div class="flex items-center justify-between text-[12.5px] text-[#0F172A] py-1 border-b border-[#F1F5F9]">
                <span>Tông màu chủ đạo:</span>
                <span class="font-bold text-[#2563EB] flex items-center gap-1.5">
                  <span class="w-3.5 h-3.5 rounded-full bg-[#172554] border border-[#2563EB] inline-block"></span>
                  Deep Navy (#172554) + Slate Blue (#2563EB)
                </span>
              </div>

              <div class="flex items-center justify-between text-[12.5px] text-[#0F172A] py-1 border-b border-[#F1F5F9]">
                <span>Kiểu chữ tiêu chuẩn:</span>
                <span class="font-bold text-[#0F172A]">Plus Jakarta Sans &amp; JetBrains Mono</span>
              </div>

              <div class="flex items-center justify-between text-[12.5px] text-[#0F172A] py-1">
                <span>Phân quyền bảo mật:</span>
                <span class="font-bold text-[#0D9488]">RBAC 3 Cấp (Admin • Trưởng Phòng • Nhân Viên)</span>
              </div>
            </div>

            <!-- 3. HỆ THỐNG VÀ RESET DỮ LIỆU -->
            <div class="p-4 rounded-xl bg-white border border-[#E2E8F0] flex flex-col gap-2.5">
              <span class="text-[13.5px] font-bold text-[#0F172A] flex items-center gap-2">
                <span class="material-symbols-outlined text-[#64748B] text-[20px]">info</span>
                Thông Tin Phiên Bản
              </span>
              <div class="text-[12px] text-[#64748B] flex justify-between">
                <span>Hệ điều hành:</span>
                <span class="font-mono-data text-[#0F172A] font-semibold">SHIN AIOS v2.0 Bridge</span>
              </div>
              <div class="text-[12px] text-[#64748B] flex justify-between">
                <span>Đơn vị:</span>
                <span class="text-[#0F172A] font-semibold">Thanh Vũ Medic Cơ Sở 3 (Cà Mau)</span>
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
      btnSave.addEventListener('click', () => {
        rung(10);
        const url = inputUrl.value.trim();
        appScriptBridge.setEndpoint(url);
        toast('Đã lưu URL kết nối Google Apps Script!', 'success');
        this.show();
        if (this.onSettingsUpdated) this.onSettingsUpdated();
      });
    }

    const btnSync = this.container.querySelector('#btnModalSyncNow');
    if (btnSync) {
      btnSync.addEventListener('click', async () => {
        rung(10);
        if (!appScriptBridge.isConnected()) {
          toast('Vui lòng nhập URL Web App Endpoint trước khi đồng bộ!', 'warning');
          return;
        }
        toast('Đang đồng bộ dữ liệu từ Google Sheets...', 'info');
        await store.syncFromCloudIfAvailable();
        toast('Đồng bộ dữ liệu thành công!', 'success');
        this.show();
        if (this.onSettingsUpdated) this.onSettingsUpdated();
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

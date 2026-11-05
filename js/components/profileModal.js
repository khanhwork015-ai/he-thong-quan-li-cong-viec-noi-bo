/**
 * THANH VŨ MEDIC CS3 - USER PROFILE EDIT MODAL COMPONENT
 * Cập nhật thông tin cá nhân: Họ tên, avatar, chức danh, liên hệ
 */

import { auth } from '../auth.js';
import { store } from '../store.js';
import { esc, toast, rung } from '../helpers.js';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=160&q=80'
];

export class ProfileModal {
  constructor(containerId, onProfileUpdated) {
    this.container = document.getElementById(containerId);
    this.onProfileUpdated = onProfileUpdated;
  }

  show() {
    if (!this.container) return;

    const user = auth.getCurrentUser();

    this.container.innerHTML = `
      <div class="modal-overlay fixed inset-0 z-[100] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 active" id="profileOverlay">
        <div class="modal-card bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-[#e2e8f0] max-h-[90vh] overflow-y-auto">
          <!-- HEADER -->
          <div class="flex items-center justify-between pb-3.5 border-b border-[#f1f5f9] mb-4">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-[#fffbeb] border border-[#fef3c7] flex items-center justify-center text-[#795900]">
                <span class="material-symbols-outlined text-[20px]">account_circle</span>
              </div>
              <div>
                <h3 class="font-bold text-[16px] text-[#0d1c2f]">Hồ Sơ Cá Nhân</h3>
                <span class="text-[11.5px] text-[#795900] font-semibold">${user.name} • ${user.badge}</span>
              </div>
            </div>
            <button type="button" class="text-gray-400 hover:text-gray-600 text-lg" id="btnCloseProfileModal">&times;</button>
          </div>

          <!-- FORM -->
          <form id="formEditProfile" class="flex flex-col gap-4">
            <!-- AVATAR PREVIEW & CHOOSER -->
            <div class="flex flex-col items-center gap-3 p-4 bg-[#f8f9ff] rounded-xl border border-[#e2e8f0]">
              <img id="avatarPreview" src="${user.avatar}" class="w-20 h-20 rounded-full object-cover ring-4 ring-white shadow-sm" />
              <div class="w-full">
                <label class="block text-[11.5px] font-bold text-[#64748b] mb-1 text-center">URL Ảnh Đại Diện Hoặc Chọn Mẫu Bên Dưới</label>
                <input type="url" id="inputAvatarUrl" value="${esc(user.avatar)}" class="w-full h-9 px-3 rounded-lg border border-[#e2e8f0] text-[12.5px] outline-none focus:border-[#d6a52a]" />
              </div>

              <!-- PRESET AVATARS -->
              <div class="flex items-center gap-2 overflow-x-auto w-full pt-1 justify-center">
                ${PRESET_AVATARS.map(url => `
                  <img src="${url}" class="w-8 h-8 rounded-full object-cover cursor-pointer hover:scale-110 transition-transform ring-1 ring-gray-300 preset-avatar-item" data-avatar-url="${url}" />
                `).join('')}
              </div>
            </div>

            <!-- NAME & TITLE -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label class="block text-[12.5px] font-bold text-[#0d1c2f] mb-1">Họ và tên *</label>
                <input type="text" id="profileName" required value="${esc(user.name)}" class="w-full h-10 px-3.5 rounded-lg border border-[#e2e8f0] text-[13.5px] outline-none focus:border-[#d6a52a]" />
              </div>

              <div>
                <label class="block text-[12.5px] font-bold text-[#0d1c2f] mb-1">Chức danh / Vị trí *</label>
                <input type="text" id="profileTitle" required value="${esc(user.title)}" class="w-full h-10 px-3.5 rounded-lg border border-[#e2e8f0] text-[13.5px] outline-none focus:border-[#d6a52a]" />
              </div>
            </div>

            <!-- CONTACT -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label class="block text-[12.5px] font-bold text-[#0d1c2f] mb-1">Số điện thoại</label>
                <input type="tel" id="profilePhone" value="${esc(user.phone || '')}" placeholder="09xx xxx xxx" class="w-full h-10 px-3.5 rounded-lg border border-[#e2e8f0] text-[13.5px] outline-none focus:border-[#d6a52a]" />
              </div>

              <div>
                <label class="block text-[12.5px] font-bold text-[#0d1c2f] mb-1">Email nội bộ</label>
                <input type="email" id="profileEmail" value="${esc(user.email || '')}" placeholder="name@thanhvumedic.vn" class="w-full h-10 px-3.5 rounded-lg border border-[#e2e8f0] text-[13.5px] outline-none focus:border-[#d6a52a]" />
              </div>
            </div>

            <div>
              <label class="block text-[12.5px] font-bold text-[#0d1c2f] mb-1">Đơn vị / Khoa phòng công tác</label>
              <input type="text" id="profileUnit" value="${esc(user.unit)}" class="w-full h-10 px-3.5 rounded-lg border border-[#e2e8f0] text-[13.5px] outline-none focus:border-[#d6a52a]" />
            </div>

            <!-- BUTTONS -->
            <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-[#f1f5f9] mt-2">
              <button type="button" class="px-4 py-2 rounded-lg border border-[#e2e8f0] text-[#4f4635] text-[13px] font-semibold hover:bg-[#f8f9ff]" id="btnCancelProfile">
                Đóng
              </button>
              <button type="submit" class="px-5 py-2 rounded-lg bg-[#d6a52a] text-[#533d00] text-[13px] font-bold hover:bg-[#795900] hover:text-white shadow-xs transition-all">
                Lưu Thay Đổi
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  close() {
    if (this.container) this.container.innerHTML = '';
  }

  bindEvents() {
    const btnClose = this.container.querySelector('#btnCloseProfileModal');
    const btnCancel = this.container.querySelector('#btnCancelProfile');
    const overlay = this.container.querySelector('#profileOverlay');

    if (btnClose) btnClose.addEventListener('click', () => this.close());
    if (btnCancel) btnCancel.addEventListener('click', () => this.close());
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.close();
      });
    }

    const inputUrl = this.container.querySelector('#inputAvatarUrl');
    const preview = this.container.querySelector('#avatarPreview');
    if (inputUrl && preview) {
      inputUrl.addEventListener('input', (e) => {
        preview.src = e.target.value.trim() || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80';
      });
    }

    this.container.querySelectorAll('.preset-avatar-item').forEach(img => {
      img.addEventListener('click', () => {
        const url = img.dataset.avatarUrl;
        if (inputUrl) inputUrl.value = url;
        if (preview) preview.src = url;
      });
    });

    const form = this.container.querySelector('#formEditProfile');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = this.container.querySelector('#profileName').value.trim();
        const title = this.container.querySelector('#profileTitle').value.trim();
        const phone = this.container.querySelector('#profilePhone').value.trim();
        const email = this.container.querySelector('#profileEmail').value.trim();
        const unit = this.container.querySelector('#profileUnit').value.trim();
        const avatar = this.container.querySelector('#inputAvatarUrl').value.trim();

        store.updateCurrentUserProfile({
          name,
          title,
          phone,
          email,
          unit,
          avatar
        });

        rung(35);
        toast('Đã cập nhật thông tin hồ sơ cá nhân thành công!', 'success');
        this.close();
        if (this.onProfileUpdated) this.onProfileUpdated();
      });
    }
  }
}

/**
 * THANH VŨ MEDIC CS3 - USER PROFILE EDIT MODAL COMPONENT
 * Cập nhật thông tin cá nhân: Họ tên, Avatar (Tải ảnh từ máy / Base64), Ngày sinh, Quê quán, Chức danh, Liên hệ
 * Chuẩn màu Vàng Hoàng Kim Google Stitch (#D6A52A / #795900)
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
        <div class="modal-card bg-white rounded-2xl p-6 max-w-xl w-full shadow-2xl border border-[#e2e8f0] max-h-[92vh] overflow-y-auto">
          <!-- HEADER -->
          <div class="flex items-center justify-between pb-3.5 border-b border-[#f1f5f9] mb-4">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-[#fffbeb] text-[#795900] flex items-center justify-center font-bold border border-[#fef3c7]">
                <span class="material-symbols-outlined text-[22px]">account_circle</span>
              </div>
              <div>
                <h3 class="font-bold text-[17px] text-[#0d1c2f]">Hồ Sơ Cá Nhân</h3>
                <span class="text-[12px] text-[#795900] font-semibold">${user.name} • ${user.badge}</span>
              </div>
            </div>
            <button type="button" class="text-gray-400 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors" id="btnCloseProfileModal">&times;</button>
          </div>

          <!-- FORM -->
          <form id="formEditProfile" class="flex flex-col gap-4">
            <!-- AVATAR UPLOAD & PREVIEW -->
            <div class="flex flex-col items-center gap-3 p-4 bg-[#f8f9ff] rounded-2xl border border-[#e2e8f0]">
              <div class="relative group">
                <img id="avatarPreview" src="${user.avatar}" class="w-24 h-24 rounded-full object-cover ring-4 ring-[#fffbeb] shadow-md transition-all group-hover:opacity-90" />
                <button type="button" class="absolute inset-0 rounded-full bg-black/30 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" id="btnAvatarOverlayClick">
                  <span class="material-symbols-outlined text-[24px]">photo_camera</span>
                  <span class="text-[10px] font-bold">Đổi ảnh</span>
                </button>
              </div>

              <!-- INPUT FILE ẨN ĐỂ CHỌN ẢNH TỪ MÁY -->
              <input type="file" id="fileAvatarInput" accept="image/*" class="hidden" />
              
              <div class="flex flex-wrap items-center justify-center gap-2.5">
                <button type="button" class="px-4 py-2 rounded-xl bg-[#d6a52a] text-[#533d00] font-bold text-[12.5px] hover:bg-[#795900] hover:text-white transition-all flex items-center gap-1.5 shadow-xs" id="btnUploadAvatar">
                  <span class="material-symbols-outlined text-[18px]">upload</span>
                  <span>Tải ảnh lên từ máy</span>
                </button>
                <button type="button" class="px-3 py-2 rounded-xl bg-white border border-[#e2e8f0] text-[12px] font-semibold text-[#64748b] hover:text-[#0d1c2f] hover:bg-gray-50 transition-colors" id="btnToggleUrlInput">
                  Nhập URL
                </button>
              </div>

              <!-- Ô NHẬP LINK URL (MẶC ĐỊNH ẨN HOẶC HIỆN KHI CẦN) -->
              <div id="urlInputContainer" class="hidden w-full pt-1">
                <label class="block text-[11px] font-bold text-[#64748b] mb-1 text-center">Hoặc dán trực tiếp đường dẫn URL ảnh:</label>
                <input type="url" id="inputAvatarUrl" value="${esc(user.avatar)}" class="w-full h-9 px-3 rounded-xl border border-[#e2e8f0] text-[12px] outline-none focus:border-[#d6a52a] bg-white text-[#0d1c2f]" />
              </div>

              <!-- PRESET AVATARS -->
              <div class="w-full pt-2 border-t border-[#e2e8f0]/60 flex flex-col items-center gap-1.5">
                <span class="text-[10.5px] font-bold text-[#817663] uppercase tracking-wider">Hoặc chọn avatar có sẵn:</span>
                <div class="flex items-center gap-2 overflow-x-auto max-w-full pb-1">
                  ${PRESET_AVATARS.map(url => `
                    <img src="${url}" class="w-8 h-8 rounded-full object-cover cursor-pointer hover:scale-115 transition-transform ring-2 ring-white hover:ring-[#d6a52a] preset-avatar-item shrink-0 shadow-xs" data-avatar-url="${url}" title="Bấm để chọn" />
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- NAME & TITLE -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label class="block text-[12.5px] font-bold text-[#0d1c2f] mb-1">Họ và tên *</label>
                <input type="text" id="profileName" required value="${esc(user.name)}" class="w-full h-10 px-3.5 rounded-xl border border-[#e2e8f0] text-[13.5px] outline-none focus:border-[#d6a52a] bg-[#f8f9ff] focus:bg-white" />
              </div>

              <div>
                <label class="block text-[12.5px] font-bold text-[#0d1c2f] mb-1">Chức danh / Vị trí *</label>
                <input type="text" id="profileTitle" required value="${esc(user.title)}" class="w-full h-10 px-3.5 rounded-xl border border-[#e2e8f0] text-[13.5px] outline-none focus:border-[#d6a52a] bg-[#f8f9ff] focus:bg-white" />
              </div>
            </div>

            <!-- NGÀY SINH & QUÊ QUÁN (THEO YÊU CẦU MỚI) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label class="block text-[12.5px] font-bold text-[#0d1c2f] mb-1">Ngày tháng năm sinh</label>
                <input type="date" id="profileDob" value="${esc(user.dob || '1985-09-22')}" class="w-full h-10 px-3.5 rounded-xl border border-[#e2e8f0] text-[13px] outline-none focus:border-[#d6a52a] bg-[#f8f9ff] focus:bg-white" />
              </div>

              <div>
                <label class="block text-[12.5px] font-bold text-[#0d1c2f] mb-1">Quê quán</label>
                <input type="text" id="profileHometown" value="${esc(user.hometown || 'Cà Mau')}" placeholder="Ví dụ: TP. Cà Mau, Đầm Dơi, Thới Bình..." class="w-full h-10 px-3.5 rounded-xl border border-[#e2e8f0] text-[13.5px] outline-none focus:border-[#d6a52a] bg-[#f8f9ff] focus:bg-white" />
              </div>
            </div>

            <!-- CONTACT -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label class="block text-[12.5px] font-bold text-[#0d1c2f] mb-1">Số điện thoại liên hệ</label>
                <input type="tel" id="profilePhone" value="${esc(user.phone || '')}" placeholder="09xx xxx xxx" class="w-full h-10 px-3.5 rounded-xl border border-[#e2e8f0] text-[13.5px] outline-none focus:border-[#d6a52a] bg-[#f8f9ff] focus:bg-white" />
              </div>

              <div>
                <label class="block text-[12.5px] font-bold text-[#0d1c2f] mb-1">Email nội bộ bệnh viện</label>
                <input type="email" id="profileEmail" value="${esc(user.email || '')}" placeholder="name@thanhvumedic.vn" class="w-full h-10 px-3.5 rounded-xl border border-[#e2e8f0] text-[13.5px] outline-none focus:border-[#d6a52a] bg-[#f8f9ff] focus:bg-white" />
              </div>
            </div>

            <div>
              <label class="block text-[12.5px] font-bold text-[#0d1c2f] mb-1">Đơn vị / Khoa phòng công tác</label>
              <input type="text" id="profileUnit" value="${esc(user.unit)}" class="w-full h-10 px-3.5 rounded-xl border border-[#e2e8f0] text-[13.5px] outline-none focus:border-[#d6a52a] bg-[#f8f9ff] focus:bg-white" />
            </div>

            <!-- BUTTONS -->
            <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-[#f1f5f9] mt-2">
              <button type="button" class="px-4 py-2 rounded-xl border border-[#e2e8f0] text-[#64748b] text-[13px] font-semibold hover:bg-gray-50" id="btnCancelProfile">
                Hủy bỏ
              </button>
              <button type="submit" class="px-5 py-2 rounded-xl bg-[#d6a52a] text-[#533d00] text-[13px] font-bold hover:bg-[#795900] hover:text-white shadow-xs transition-all">
                Lưu Hồ Sơ
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const overlay = this.container.querySelector('#profileOverlay');
    const btnClose = this.container.querySelector('#btnCloseProfileModal');
    const btnCancel = this.container.querySelector('#btnCancelProfile');
    const form = this.container.querySelector('#formEditProfile');
    const inputAvatar = this.container.querySelector('#inputAvatarUrl');
    const avatarPreview = this.container.querySelector('#avatarPreview');
    const fileInput = this.container.querySelector('#fileAvatarInput');
    const btnUpload = this.container.querySelector('#btnUploadAvatar');
    const btnOverlay = this.container.querySelector('#btnAvatarOverlayClick');
    const btnToggleUrl = this.container.querySelector('#btnToggleUrlInput');
    const urlContainer = this.container.querySelector('#urlInputContainer');

    const closeModal = () => {
      rung(10);
      if (overlay) overlay.remove();
    };

    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnCancel) btnCancel.addEventListener('click', closeModal);
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
      });
    }

    // Toggle hiện ô URL
    if (btnToggleUrl && urlContainer) {
      btnToggleUrl.addEventListener('click', () => {
        urlContainer.classList.toggle('hidden');
      });
    }

    // Kích hoạt chọn file ảnh
    const triggerFile = () => {
      rung(10);
      if (fileInput) fileInput.click();
    };
    if (btnUpload) btnUpload.addEventListener('click', triggerFile);
    if (btnOverlay) btnOverlay.addEventListener('click', triggerFile);

    // Xử lý khi người dùng chọn file ảnh từ máy
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
          toast('Vui lòng chọn một tệp hình ảnh!', 'warning');
          return;
        }

        // Đọc ảnh và chuyển thành Base64
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64Data = event.target.result;
          if (avatarPreview) avatarPreview.src = base64Data;
          if (inputAvatar) inputAvatar.value = base64Data;
          rung(15);
          toast('Đã tải ảnh lên thành công!', 'success');
        };
        reader.readAsDataURL(file);
      });
    }

    if (inputAvatar && avatarPreview) {
      inputAvatar.addEventListener('input', () => {
        avatarPreview.src = inputAvatar.value;
      });
    }

    this.container.querySelectorAll('.preset-avatar-item').forEach(img => {
      img.addEventListener('click', () => {
        const url = img.dataset.avatarUrl;
        if (inputAvatar) inputAvatar.value = url;
        if (avatarPreview) avatarPreview.src = url;
        rung(10);
        toast('Đã chọn ảnh mẫu!', 'info');
      });
    });

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        rung(15);

        const updated = auth.updateProfile({
          name: this.container.querySelector('#profileName').value.trim(),
          title: this.container.querySelector('#profileTitle').value.trim(),
          dob: this.container.querySelector('#profileDob').value,
          hometown: this.container.querySelector('#profileHometown').value.trim(),
          phone: this.container.querySelector('#profilePhone').value.trim(),
          email: this.container.querySelector('#profileEmail').value.trim(),
          unit: this.container.querySelector('#profileUnit').value.trim(),
          avatar: inputAvatar ? inputAvatar.value.trim() : avatarPreview.src
        });

        toast('Cập nhật thông tin hồ sơ cá nhân thành công!', 'success');
        closeModal();
        if (this.onProfileUpdated) this.onProfileUpdated(updated);
      });
    }
  }
}

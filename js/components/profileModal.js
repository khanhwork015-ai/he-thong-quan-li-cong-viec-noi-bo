/**
 * THANH VŨ MEDIC CS3 - USER PROFILE EDIT MODAL COMPONENT (MOBILE FIRST)
 * Cập nhật thông tin cá nhân: Họ tên, Avatar (Tải ảnh từ máy / Base64), Ngày sinh, Quê quán, Chức danh, Liên hệ
 * Chuẩn màu Vàng Hoàng Kim Google Stitch (#D6A52A / #795900)
 */

import { auth } from '../auth.js?v=6.1';
import { store } from '../store.js?v=6.1';
import { esc, toast, rung } from '../helpers.js?v=6.1';

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

    rung(10);
    const user = auth.getCurrentUser();

    this.container.innerHTML = `
      <div class="modal-overlay fixed inset-0 z-[100] bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 active" id="profileOverlay">
        <div class="modal-card bg-white rounded-2xl p-4 sm:p-6 max-w-xl w-full shadow-2xl border border-[#e2e8f0] max-h-[92vh] overflow-y-auto">
          <!-- HEADER -->
          <div class="flex items-center justify-between pb-3.5 border-b border-[#f1f5f9] mb-4">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-[#fffbeb] text-[#795900] flex items-center justify-center font-bold border border-[#fef3c7] shrink-0">
                <span class="material-symbols-outlined text-[22px]">account_circle</span>
              </div>
              <div class="min-w-0">
                <h3 class="font-bold text-[16px] sm:text-[17px] text-[#0d1c2f] truncate">Hồ Sơ Cá Nhân</h3>
                <span class="text-[11.5px] text-[#795900] font-semibold truncate block">${user.name} • ${user.badge}</span>
              </div>
            </div>
            <button type="button" class="text-gray-400 hover:text-gray-700 text-2xl font-bold min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors" id="btnCloseProfileModal" aria-label="Đóng">&times;</button>
          </div>

          <!-- FORM -->
          <form id="formEditProfile" class="flex flex-col gap-3.5 sm:gap-4">
            <!-- AVATAR UPLOAD & PREVIEW -->
            <div class="flex flex-col items-center gap-3 p-3.5 sm:p-4 bg-[#f8f9ff] rounded-2xl border border-[#e2e8f0]">
              <div class="relative group cursor-pointer">
                <img id="avatarPreview" src="${user.avatar}" class="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ring-4 ring-[#fffbeb] shadow-md transition-all" />
                <button type="button" class="absolute inset-0 rounded-full bg-black/35 text-white flex flex-col items-center justify-center opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" id="btnAvatarOverlayClick">
                  <span class="material-symbols-outlined text-[22px]">photo_camera</span>
                  <span class="text-[9.5px] font-bold">Đổi ảnh</span>
                </button>
              </div>

              <!-- INPUT FILE ẨN ĐỂ CHỌN ẢNH TỪ MÁY -->
              <input type="file" id="fileAvatarInput" accept="image/*" class="hidden" />
              
              <div class="flex flex-wrap items-center justify-center gap-2">
                <button type="button" class="px-3.5 sm:px-4 py-2 rounded-xl bg-[#d6a52a] text-[#533d00] font-bold text-[12px] sm:text-[12.5px] hover:bg-[#795900] hover:text-white transition-all flex items-center gap-1.5 shadow-xs min-h-[38px]" id="btnUploadAvatar">
                  <span class="material-symbols-outlined text-[18px]">upload</span>
                  <span>Tải ảnh từ máy</span>
                </button>
                <button type="button" class="px-3 py-2 rounded-xl bg-white border border-[#e2e8f0] text-[12px] font-semibold text-[#64748b] hover:text-[#0d1c2f] hover:bg-gray-50 transition-colors min-h-[38px]" id="btnToggleUrlInput">
                  Nhập URL
                </button>
              </div>

              <!-- Ô NHẬP LINK URL (MẶC ĐỊNH ẨN HOẶC HIỆN KHI CẦN) -->
              <div id="urlInputContainer" class="hidden w-full pt-1">
                <label class="block text-[11px] font-bold text-[#64748b] mb-1 text-center">Hoặc dán trực tiếp đường dẫn URL ảnh:</label>
                <input type="url" id="inputAvatarUrl" value="${esc(user.avatar)}" class="w-full h-10 px-3 rounded-xl border border-[#e2e8f0] text-[13px] outline-none focus:border-[#d6a52a] bg-white text-[#0d1c2f]" />
              </div>

              <!-- PRESET AVATARS -->
              <div class="w-full pt-2 border-t border-[#e2e8f0]/60 flex flex-col items-center gap-1.5">
                <span class="text-[10px] sm:text-[10.5px] font-bold text-[#817663] uppercase tracking-wider">Hoặc chọn ảnh y tế có sẵn:</span>
                <div class="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-full pb-1">
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
                <input type="text" id="profileName" required value="${esc(user.name)}" class="w-full h-11 px-3.5 rounded-xl border border-[#e2e8f0] text-[13.5px] outline-none focus:border-[#d6a52a] bg-[#f8f9ff] focus:bg-white" />
              </div>

              <div>
                <label class="block text-[12.5px] font-bold text-[#0d1c2f] mb-1">Chức danh / Vị trí *</label>
                <input type="text" id="profileTitle" required value="${esc(user.title)}" class="w-full h-11 px-3.5 rounded-xl border border-[#e2e8f0] text-[13.5px] outline-none focus:border-[#d6a52a] bg-[#f8f9ff] focus:bg-white" />
              </div>
            </div>

            <!-- NGÀY SINH & QUÊ QUÁN -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label class="block text-[12.5px] font-bold text-[#0d1c2f] mb-1">Ngày tháng năm sinh</label>
                <input type="date" id="profileDob" value="${esc(user.dob || '1985-09-22')}" class="w-full h-11 px-3.5 rounded-xl border border-[#e2e8f0] text-[13.5px] outline-none focus:border-[#d6a52a] bg-[#f8f9ff] focus:bg-white" />
              </div>

              <div>
                <label class="block text-[12.5px] font-bold text-[#0d1c2f] mb-1">Quê quán</label>
                <input type="text" id="profileHometown" value="${esc(user.hometown || 'Cà Mau')}" placeholder="Ví dụ: TP. Cà Mau, Đầm Dơi, Thới Bình..." class="w-full h-11 px-3.5 rounded-xl border border-[#e2e8f0] text-[13.5px] outline-none focus:border-[#d6a52a] bg-[#f8f9ff] focus:bg-white" />
              </div>
            </div>

            <!-- CONTACT -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label class="block text-[12.5px] font-bold text-[#0d1c2f] mb-1">Số điện thoại liên hệ</label>
                <input type="tel" id="profilePhone" value="${esc(user.phone || '')}" placeholder="09xx xxx xxx" class="w-full h-11 px-3.5 rounded-xl border border-[#e2e8f0] text-[13.5px] outline-none focus:border-[#d6a52a] bg-[#f8f9ff] focus:bg-white" />
              </div>

              <div>
                <label class="block text-[12.5px] font-bold text-[#0d1c2f] mb-1">Email nội bộ bệnh viện</label>
                <input type="email" id="profileEmail" value="${esc(user.email || '')}" placeholder="name@thanhvumedic.vn" class="w-full h-11 px-3.5 rounded-xl border border-[#e2e8f0] text-[13.5px] outline-none focus:border-[#d6a52a] bg-[#f8f9ff] focus:bg-white" />
              </div>
            </div>

            <div>
              <label class="block text-[12.5px] font-bold text-[#0d1c2f] mb-1">Đơn vị / Khoa phòng công tác</label>
              <input type="text" id="profileUnit" value="${esc(user.unit)}" class="w-full h-11 px-3.5 rounded-xl border border-[#e2e8f0] text-[13.5px] outline-none focus:border-[#d6a52a] bg-[#f8f9ff] focus:bg-white" />
            </div>

            <!-- BUTTONS (RESPONSIVE) -->
            <div class="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3 border-t border-[#f1f5f9] mt-2">
              <button type="button" class="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#e2e8f0] text-[#64748b] text-[13px] font-semibold hover:bg-gray-50 min-h-[44px]" id="btnCancelProfile">
                Hủy bỏ
              </button>
              <button type="submit" class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#d6a52a] text-[#533d00] text-[13px] font-bold hover:bg-[#795900] hover:text-white shadow-xs transition-all min-h-[44px]">
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

    // Nút tải ảnh từ máy kích hoạt file input ẩn
    if (btnUpload && fileInput) {
      btnUpload.addEventListener('click', () => fileInput.click());
    }
    if (btnOverlay && fileInput) {
      btnOverlay.addEventListener('click', () => fileInput.click());
    }

    // Xử lý khi người dùng chọn file ảnh từ thiết bị (Nén ảnh về tối đa 300x300 tránh tràn localStorage)
    if (fileInput && avatarPreview) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
          toast('Vui lòng chọn tệp định dạng hình ảnh (PNG, JPG, WEBP)!', 'warning');
          return;
        }

        if (file.size > 5 * 1024 * 1024) {
          toast('Dung lượng ảnh vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn!', 'warning');
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 300;
            let width = img.width;
            let height = img.height;
            if (width > height) {
              if (width > MAX_SIZE) {
                height = Math.round((height * MAX_SIZE) / width);
                width = MAX_SIZE;
              }
            } else {
              if (height > MAX_SIZE) {
                width = Math.round((width * MAX_SIZE) / height);
                height = MAX_SIZE;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);

            avatarPreview.src = compressedBase64;
            if (inputAvatar) inputAvatar.value = compressedBase64;
            toast('Đã tải và tối ưu ảnh đại diện thành công!', 'success');
          };
          img.onerror = () => {
            avatarPreview.src = event.target.result;
            if (inputAvatar) inputAvatar.value = event.target.result;
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    // Cập nhật khi gõ link URL ảnh
    if (inputAvatar && avatarPreview) {
      inputAvatar.addEventListener('input', () => {
        avatarPreview.src = inputAvatar.value;
      });
    }

    // Chọn avatar có sẵn
    this.container.querySelectorAll('.preset-avatar-item').forEach(img => {
      img.addEventListener('click', () => {
        rung(10);
        const url = img.dataset.avatarUrl;
        if (avatarPreview) avatarPreview.src = url;
        if (inputAvatar) inputAvatar.value = url;
        toast('Đã chọn ảnh đại diện mẫu', 'info');
      });
    });

    // Submit form lưu hồ sơ
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        rung(15);

        const user = auth.getCurrentUser();
        const name = this.container.querySelector('#profileName').value.trim();
        const title = this.container.querySelector('#profileTitle').value.trim();
        const dob = this.container.querySelector('#profileDob').value;
        const hometown = this.container.querySelector('#profileHometown').value.trim();
        const phone = this.container.querySelector('#profilePhone').value.trim();
        const email = this.container.querySelector('#profileEmail').value.trim();
        const unit = this.container.querySelector('#profileUnit').value.trim();
        const avatar = (avatarPreview && avatarPreview.src) ? avatarPreview.src : user.avatar;

        if (!name) {
          toast('Họ và tên không được để trống!', 'warning');
          return;
        }

        // Cập nhật vào store & auth
        const updated = store.updateUser(user.id, {
          name,
          title,
          dob,
          hometown,
          phone,
          email,
          unit,
          avatar
        });

        toast('Đã lưu thông tin hồ sơ cá nhân thành công!', 'success');
        closeModal();
        if (this.onProfileUpdated) this.onProfileUpdated(updated || auth.getCurrentUser());
      });
    }
  }
}



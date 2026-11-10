/**
 * THANH VŨ MEDIC CS3 - MEMBER MANAGEMENT MODAL COMPONENT (SHIN AIOS v2.6.4)
 * Cấp tài khoản nhân viên mới & phân bổ vào đúng Phòng Ban & Bộ Phận Con
 * 
 * PHÂN QUYỀN BẢO MẬT:
 * - Admin: Toàn quyền cấp mọi role (Admin, Lãnh đạo, Trưởng phòng, Nhân viên), mọi phòng ban & bộ phận.
 * - Trưởng/Phó phòng: CHỈ cấp được tài khoản cho Nhân viên thuộc phòng ban mình đang quản lý.
 *   Không thể cấp tài khoản cho Ban Lãnh Đạo hoặc Admin!
 * - Nhân viên: Không được phép cấp tài khoản.
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

export class MemberModal {
  constructor(containerId, onMemberSaved) {
    this.container = document.getElementById(containerId);
    this.onMemberSaved = onMemberSaved;
    this.editingUser = null;
  }

  show(userId = null, defaultDeptId = null) {
    if (!this.container) return;

    if (!auth.canManageMembers()) {
      toast('Chỉ Quản Trị Viên (Admin) mới có quyền cấp và quản lý tài khoản nhân sự!', 'warning');
      return;
    }

    rung(10);
    this.editingUser = userId ? store.getUserById(userId) : null;
    const allDepts = store.getAllDepartments();
    const currentDept = auth.getActiveDepartment();
    const isAdmin = auth.isAdmin();
    const isLeadership = auth.isLeadership();
    const isManager = auth.isManager();
    const isUserAdmin = Boolean(this.editingUser?.isAdmin || this.editingUser?.role === 'ADMIN');
    const currentRole = (this.editingUser?.role && this.editingUser.role !== 'ADMIN') ? this.editingUser.role : (this.editingUser?.role === 'ADMIN' ? 'MANAGER' : 'MEMBER');

    // Xác định phòng ban ban đầu (ưu tiên defaultDeptId nếu đang xem phòng ban cụ thể)
    const initialDeptId = this.editingUser 
      ? this.editingUser.departmentId 
      : (defaultDeptId || (isAdmin ? allDepts[0]?.id : currentDept.id));
    const initialDept = allDepts.find(d => d.id === initialDeptId) || allDepts[0];

    this.container.innerHTML = `
      <div class="modal-overlay fixed inset-0 z-[100] bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 active" id="memberOverlay">
        <div class="modal-card bg-white rounded-3xl p-4 sm:p-6 max-w-xl w-full shadow-2xl border border-[#e2e8f0] max-h-[92vh] overflow-y-auto flex flex-col gap-4" style="background-color: var(--card); border-color: var(--border);">
          
          <!-- HEADER -->
          <div class="flex items-center justify-between pb-3.5 border-b border-[#f1f5f9]" style="border-color: var(--border);">
            <div class="flex items-center gap-2.5">
              <div class="w-10 h-10 rounded-2xl flex items-center justify-center font-bold shadow-xs" style="background-color: var(--primary-soft); color: var(--primary);">
                <span class="material-symbols-outlined text-[22px]">person_add</span>
              </div>
              <div class="min-w-0">
                <h3 class="font-bold text-[16.5px] sm:text-[17.5px] text-[#0d1c2f] truncate" style="color: var(--text);">
                  ${this.editingUser ? 'Cập Nhật Nhân Sự' : 'Cấp Tài Khoản Nhân Viên Mới'}
                </h3>
                <span class="text-[11.5px] font-semibold truncate block" style="color: var(--primary);">
                  ${isAdmin ? 'Tất cả' : currentDept.name} • ${auth.getCurrentUser().name} (${auth.getCurrentUser().role})
                </span>
              </div>
            </div>
            <button type="button" class="text-gray-400 hover:text-gray-700 text-2xl font-bold min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors" id="btnCloseMemberModal" aria-label="Đóng">&times;</button>
          </div>

          <!-- FORM -->
          <form id="formMember" class="flex flex-col gap-3.5">
            
            <!-- AVATAR PICKER -->
            <div class="flex items-center gap-3 p-3 rounded-2xl border border-[#e2e8f0] bg-[#f8f9ff]" style="background-color: var(--background); border-color: var(--border);">
              <div class="relative group cursor-pointer shrink-0">
                <img id="memberAvatarPreview" src="${this.editingUser ? this.editingUser.avatar : PRESET_AVATARS[0]}" class="w-14 h-14 rounded-full object-cover ring-2 ring-white shadow-xs" />
                <button type="button" class="absolute inset-0 rounded-full bg-black/35 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" id="btnMemberAvatarOverlay" title="Đổi ảnh đại diện">
                  <span class="material-symbols-outlined text-[18px]">photo_camera</span>
                </button>
              </div>

              <!-- INPUT FILE ẨN CHỌN ẢNH TỪ THIẾT BỊ -->
              <input type="file" id="memberFileInput" accept="image/*" class="hidden" />

              <div class="flex-1 min-w-0 flex flex-col gap-1.5">
                <div class="flex flex-wrap sm:flex-nowrap items-center gap-2">
                  <button type="button" class="px-2.5 py-1.5 rounded-lg bg-[#d6a52a] text-[#533d00] font-bold text-[11.5px] hover:bg-[#795900] hover:text-white transition-all flex items-center gap-1 shadow-xs shrink-0 min-h-[32px] cursor-pointer" id="btnMemberUploadAvatar" title="Chọn file ảnh từ thiết bị">
                    <span class="material-symbols-outlined text-[16px]">upload</span>
                    <span>Tải ảnh từ máy</span>
                  </button>
                  <input type="url" id="memberAvatarUrl" value="${this.editingUser ? esc(this.editingUser.avatar) : PRESET_AVATARS[0]}" placeholder="Hoặc dán URL ảnh đại diện" class="flex-1 min-w-[140px] h-8 px-2.5 rounded-lg border border-[#e2e8f0] text-[12px] outline-none bg-white text-[#0d1c2f] focus:border-[#d6a52a]" />
                </div>
                <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  <span class="text-[10px] font-semibold text-[#817663] shrink-0">Mẫu:</span>
                  ${PRESET_AVATARS.map(url => `
                    <img src="${url}" class="w-6 h-6 rounded-full object-cover cursor-pointer hover:scale-110 transition-transform ring-1 ring-gray-300 select-avatar-item shrink-0" data-avatar="${url}" title="Bấm để chọn" />
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- TÀI KHOẢN ĐĂNG NHẬP (USERNAME & PASSWORD) -->
            <div class="p-3.5 rounded-2xl border border-[#e2e8f0] bg-[#f8f9ff]/70 flex flex-col gap-2.5" style="background-color: var(--primary-soft); border-color: var(--border);">
              <div class="flex items-center justify-between">
                <span class="text-[12px] font-bold text-[#0d1c2f] flex items-center gap-1.5" style="color: var(--text);">
                  <span class="material-symbols-outlined text-[17px]" style="color: var(--primary);">vpn_key</span>
                  Thông tin đăng nhập &amp; bảo mật
                </span>
                <span class="text-[10.5px] text-[#817663]">Phiên làm việc bảo mật</span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-[11.5px] font-bold text-[#0d1c2f] mb-1" style="color: var(--text);">Tên đăng nhập (Username) *</label>
                  <input type="text" id="memberUsername" required value="${this.editingUser ? esc(this.editingUser.username || '') : ''}" placeholder="VD: tuyetmai, hoangnam..." class="w-full h-10 px-3 rounded-xl border border-[#e2e8f0] text-[13px] outline-none bg-white text-[#0d1c2f] focus:border-[#d6a52a]" />
                </div>
                <div>
                  <label class="block text-[11.5px] font-bold text-[#0d1c2f] mb-1" style="color: var(--text);">Mật khẩu khởi tạo *</label>
                  <input type="text" id="memberPassword" required value="${this.editingUser ? esc(this.editingUser.password || '123') : '123'}" placeholder="Mặc định: 123" class="w-full h-10 px-3 rounded-xl border border-[#e2e8f0] text-[13px] outline-none bg-white text-[#0d1c2f] focus:border-[#d6a52a]" />
                </div>
              </div>
            </div>

            <!-- HỌ TÊN & CHỨC DANH -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-[12px] font-bold text-[#0d1c2f] mb-1" style="color: var(--text);">Họ và tên *</label>
                <input type="text" id="memberName" required value="${this.editingUser ? esc(this.editingUser.name) : ''}" placeholder="Ví dụ: Huỳnh Trường Thanh Tâm" class="w-full h-10 px-3 rounded-xl border border-[#e2e8f0] text-[13px] outline-none bg-white text-[#0d1c2f] focus:border-[#d6a52a]" />
              </div>

              <div>
                <label class="block text-[12px] font-bold text-[#0d1c2f] mb-1" style="color: var(--text);">Chức danh công tác *</label>
                <input type="text" id="memberTitle" required value="${this.editingUser ? esc(this.editingUser.title) : 'Chuyên viên'}" placeholder="Chuyên viên CSKH, Marketing..." class="w-full h-10 px-3 rounded-xl border border-[#e2e8f0] text-[13px] outline-none bg-white text-[#0d1c2f] focus:border-[#d6a52a]" />
              </div>
            </div>

            <!-- VAI TRÒ CHUYÊN MÔN & PHÒNG BAN -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-[12px] font-bold text-[#0d1c2f] mb-1" style="color: var(--text);">
                  Chức vụ / Vị trí công tác (Role) *
                </label>
                <select id="memberRole" class="w-full h-10 px-3 rounded-xl border border-[#e2e8f0] text-[13px] outline-none bg-white text-[#0d1c2f] focus:border-[#d6a52a]">
                  <option value="MEMBER" ${currentRole === 'MEMBER' ? 'selected' : ''}>👤 Nhân viên / Chuyên viên (MEMBER)</option>
                  <option value="DEPUTY_MANAGER" ${currentRole === 'DEPUTY_MANAGER' ? 'selected' : ''}>⭐ Phó Phòng (DEPUTY_MANAGER)</option>
                  <option value="MANAGER" ${currentRole === 'MANAGER' ? 'selected' : ''}>👔 Trưởng Phòng (MANAGER)</option>
                  <option value="LEADERSHIP" ${currentRole === 'LEADERSHIP' ? 'selected' : ''}>🏛️ Ban Lãnh Đạo (LEADERSHIP)</option>
                </select>
                ${isManager ? `
                  <span class="text-[10px] text-amber-600 block mt-1">
                    * Bạn là Trưởng phòng: Chỉ có thẩm quyền cấp tài khoản cho Nhân viên.
                  </span>
                ` : ''}
              </div>

              <div>
                <label class="block text-[12px] font-bold text-[#0d1c2f] mb-1" style="color: var(--text);">Phòng ban trực thuộc *</label>
                <select id="memberDept" ${!isAdmin ? 'disabled' : ''} class="w-full h-10 px-3 rounded-xl border border-[#e2e8f0] text-[13px] outline-none bg-white text-[#0d1c2f] focus:border-[#d6a52a] disabled:bg-gray-100">
                  ${allDepts.map(d => `
                    <option value="${d.id}" ${(initialDeptId === d.id) ? 'selected' : ''}>
                      ${d.name} (${d.code})
                    </option>
                  `).join('')}
                </select>
              </div>
            </div>

            <!-- TÁCH BIỆT ĐẶC QUYỀN QUẢN TRỊ VIÊN (ADMIN HỆ THỐNG) -->
            <div class="p-3 sm:p-3.5 rounded-2xl border border-amber-300 bg-[#fffbeb] flex items-center justify-between gap-3 shadow-2xs">
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="w-9 h-9 rounded-xl bg-amber-500/20 text-[#795900] flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                </div>
                <div class="min-w-0">
                  <div class="text-[12.5px] sm:text-[13px] font-bold text-[#0d1c2f] flex items-center gap-1.5 flex-wrap">
                    <span>Đặc Quyền Quản Trị Viên (Admin Hệ Thống)</span>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 shrink-0">Quyền Cấp Cao</span>
                  </div>
                  <p class="text-[11px] sm:text-[11.5px] text-[#795900] leading-snug mt-0.5">
                    Bật để cấp quyền Admin cho người này (kể cả khi đang là Trưởng phòng hay Nhân viên).
                  </p>
                </div>
              </div>

              <label class="relative inline-flex items-center cursor-pointer shrink-0 min-w-[44px] min-h-[44px] justify-center" title="${isAdmin ? 'Bật/Tắt quyền Quản trị viên' : 'Chỉ Admin mới có quyền cấp Admin'}">
                <input type="checkbox" id="memberIsAdmin" class="sr-only peer" ${isUserAdmin ? 'checked' : ''} ${!isAdmin ? 'disabled' : ''}>
                <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[12px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#d6a52a] ${!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}"></div>
              </label>
            </div>

            <!-- BỘ PHẬN CON (TEAMS) BÊN TRONG PHÒNG BAN (CHỈ DÀNH CHO NHÂN VIÊN) -->
            <div id="boxMemberTeam" class="${(currentRole === 'MANAGER' || currentRole === 'DEPUTY_MANAGER' || currentRole === 'LEADERSHIP') ? 'hidden' : ''}">
              <label class="block text-[12px] font-bold text-[#0d1c2f] mb-1" style="color: var(--text);">
                Bộ phận con trực thuộc (Team) *
              </label>
              <select id="memberTeam" class="w-full h-10 px-3 rounded-xl border border-[#e2e8f0] text-[13px] outline-none bg-white text-[#0d1c2f] focus:border-[#d6a52a]">
                <option value="">-- Toàn phòng ban / Chưa phân tổ --</option>
                ${(initialDept?.teams || []).map(t => `
                  <option value="${t.id}" ${this.editingUser && this.editingUser.teamId === t.id ? 'selected' : ''}>
                    ${t.name} (${t.code})
                  </option>
                `).join('')}
              </select>
              <span class="text-[10.5px] text-[#64748b] block mt-1">
                Phân bổ nhân viên vào các bộ phận chuyên trách (VD: Marketing, CSKH, Hỗ trợ...).
              </span>
            </div>

            <!-- THÔNG BÁO CHO TRƯỞNG PHÒNG / PHÓ PHÒNG / BAN LÃNH ĐẠO -->
            <div id="boxMemberTeamNotice" class="${(currentRole === 'MANAGER' || currentRole === 'DEPUTY_MANAGER' || currentRole === 'LEADERSHIP') ? '' : 'hidden'} p-3 rounded-2xl bg-[#fffbeb] border border-[#fef3c7] text-[#795900] text-[12px] flex items-center gap-2.5 shadow-2xs">
              <span class="material-symbols-outlined text-[20px] text-[#d6a52a] shrink-0">domain_verification</span>
              <div class="leading-snug">
                <span class="font-bold">Bao quát toàn bộ khoa phòng:</span>
                <span class="text-[#817663] block text-[11.5px] mt-0.5">Trưởng phòng và Phó phòng phụ trách tất cả các bộ phận con, không cần chọn bộ phận riêng.</span>
              </div>
            </div>

            <!-- EMAIL & SĐT -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-[12px] font-bold text-[#0d1c2f] mb-1" style="color: var(--text);">Email liên hệ</label>
                <input type="email" id="memberEmail" value="${this.editingUser ? esc(this.editingUser.email || '') : ''}" placeholder="nhanvien@thanhvumedic.vn" class="w-full h-10 px-3 rounded-xl border border-[#e2e8f0] text-[13px] outline-none bg-white text-[#0d1c2f]" />
              </div>

              <div>
                <label class="block text-[12px] font-bold text-[#0d1c2f] mb-1" style="color: var(--text);">Số điện thoại</label>
                <input type="text" id="memberPhone" value="${this.editingUser ? esc(this.editingUser.phone || '') : ''}" placeholder="09xx xxx xxx" class="w-full h-10 px-3 rounded-xl border border-[#e2e8f0] text-[13px] outline-none bg-white text-[#0d1c2f]" />
              </div>
            </div>

            <!-- BUTTONS -->
            <div class="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-[#f1f5f9] mt-1" style="border-color: var(--border);">
              <button type="button" class="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#e2e8f0] text-[#64748b] text-[13px] font-semibold hover:bg-gray-50 min-h-[44px]" id="btnCancelMember">
                Hủy bỏ
              </button>
              <button type="submit" class="w-full sm:w-auto px-5 py-2.5 rounded-xl text-[13px] font-bold shadow-xs transition-all min-h-[44px] flex items-center justify-center gap-1.5" style="background-color: var(--primary-container); color: var(--on-primary-container);">
                <span class="material-symbols-outlined text-[18px]">check</span>
                <span>${this.editingUser ? 'Lưu Thông Tin' : 'Cấp Tài Khoản'}</span>
              </button>
            </div>

          </form>

        </div>
      </div>
    `;

    this.bindEvents(allDepts);
  }

  bindEvents(allDepts) {
    const overlay = this.container.querySelector('#memberOverlay');
    const btnClose = this.container.querySelector('#btnCloseMemberModal');
    const btnCancel = this.container.querySelector('#btnCancelMember');
    const form = this.container.querySelector('#formMember');
    const inputAvatar = this.container.querySelector('#memberAvatarUrl');
    const avatarPreview = this.container.querySelector('#memberAvatarPreview');
    const fileInput = this.container.querySelector('#memberFileInput');
    const btnUpload = this.container.querySelector('#btnMemberUploadAvatar');
    const btnOverlay = this.container.querySelector('#btnMemberAvatarOverlay');
    const selectDept = this.container.querySelector('#memberDept');
    const selectTeam = this.container.querySelector('#memberTeam');
    const selectRole = this.container.querySelector('#memberRole');
    const boxMemberTeam = this.container.querySelector('#boxMemberTeam');
    const boxMemberTeamNotice = this.container.querySelector('#boxMemberTeamNotice');

    const updateTeamVisibility = () => {
      const r = selectRole ? selectRole.value : 'MEMBER';
      const isLeaderOrManager = (r === 'MANAGER' || r === 'DEPUTY_MANAGER' || r === 'LEADERSHIP');
      if (boxMemberTeam) {
        if (isLeaderOrManager) {
          boxMemberTeam.classList.add('hidden');
          if (selectTeam) selectTeam.value = '';
        } else {
          boxMemberTeam.classList.remove('hidden');
        }
      }
      if (boxMemberTeamNotice) {
        if (isLeaderOrManager) {
          boxMemberTeamNotice.classList.remove('hidden');
        } else {
          boxMemberTeamNotice.classList.add('hidden');
        }
      }
    };

    if (selectRole) {
      selectRole.addEventListener('change', updateTeamVisibility);
    }

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

    // Khi chọn phòng ban khác -> cập nhật danh sách Teams
    if (selectDept && selectTeam) {
      selectDept.addEventListener('change', () => {
        const dId = selectDept.value;
        const d = allDepts.find(item => item.id === dId);
        selectTeam.innerHTML = '<option value="">-- Toàn phòng ban / Chưa phân tổ --</option>';
        if (d && d.teams) {
          d.teams.forEach(t => {
            selectTeam.innerHTML += `<option value="${t.id}">${t.name} (${t.code})</option>`;
          });
        }
      });
    }

    // Kích hoạt input file ẩn khi bấm nút tải ảnh hoặc overlay trên preview
    if (btnUpload && fileInput) {
      btnUpload.addEventListener('click', () => fileInput.click());
    }
    if (btnOverlay && fileInput) {
      btnOverlay.addEventListener('click', () => fileInput.click());
    }

    // Tự động resize và nén ảnh bằng HTML5 Canvas khi chọn file từ máy
    if (fileInput && avatarPreview) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
          toast('Vui lòng chọn tệp định dạng hình ảnh (PNG, JPG, WEBP)!', 'warning');
          fileInput.value = '';
          return;
        }

        if (file.size > 5 * 1024 * 1024) {
          toast('Dung lượng ảnh vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn!', 'warning');
          fileInput.value = '';
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            try {
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
            } catch (err) {
              console.error('Lỗi khi nén ảnh đại diện:', err);
              avatarPreview.src = event.target.result;
              if (inputAvatar) inputAvatar.value = event.target.result;
              toast('Đã tải ảnh đại diện!', 'success');
            } finally {
              fileInput.value = '';
            }
          };
          img.onerror = () => {
            toast('Tệp ảnh bị lỗi cấu trúc hoặc không thể hiển thị!', 'warning');
            fileInput.value = '';
          };
          img.src = event.target.result;
        };
        reader.onerror = () => {
          toast('Không thể đọc file ảnh. Vui lòng thử lại!', 'warning');
          fileInput.value = '';
        };
        reader.readAsDataURL(file);
      });
    }

    if (inputAvatar && avatarPreview) {
      inputAvatar.addEventListener('input', () => {
        avatarPreview.src = inputAvatar.value;
      });
    }

    this.container.querySelectorAll('.select-avatar-item').forEach(img => {
      img.addEventListener('click', () => {
        rung(10);
        const url = img.dataset.avatar;
        if (inputAvatar) inputAvatar.value = url;
        if (avatarPreview) avatarPreview.src = url;
      });
    });

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        rung(15);

        const name = this.container.querySelector('#memberName').value.trim();
        const title = this.container.querySelector('#memberTitle').value.trim();
        const role = this.container.querySelector('#memberRole').value;
        const isAdminFlag = Boolean(this.container.querySelector('#memberIsAdmin')?.checked);
        const departmentId = selectDept.value;
        const isLeaderOrManager = (role === 'MANAGER' || role === 'DEPUTY_MANAGER' || role === 'LEADERSHIP');
        const teamId = isLeaderOrManager ? '' : (selectTeam ? selectTeam.value : '');
        const username = this.container.querySelector('#memberUsername').value.trim();
        const password = this.container.querySelector('#memberPassword').value.trim();
        const email = this.container.querySelector('#memberEmail').value.trim();
        const phone = this.container.querySelector('#memberPhone').value.trim();
        const avatar = (inputAvatar && inputAvatar.value.trim()) 
          ? inputAvatar.value.trim() 
          : ((avatarPreview && avatarPreview.src) ? avatarPreview.src : PRESET_AVATARS[0]);

        if (!name || !username || !password) {
          toast('Vui lòng nhập đầy đủ Họ tên, Username và Password!', 'warning');
          return;
        }

        // Kiểm tra thẩm quyền cấp tài khoản (Zero-Bug Security)
        if (!auth.canProvisionAccount(role, departmentId)) {
          toast('Bạn không có quyền cấp tài khoản với vai trò hoặc phòng ban này!', 'warning');
          return;
        }

        const dept = allDepts.find(d => d.id === departmentId);
        const deptName = dept ? dept.name : 'Thanh Vũ Medic';
        let badge = 'Chuyên viên';
        if (role === 'LEADERSHIP') badge = 'Ban Lãnh Đạo';
        else if (role === 'MANAGER') badge = 'Trưởng phòng';
        else if (role === 'DEPUTY_MANAGER') badge = 'Phó phòng';

        if (this.editingUser) {
          store.updateUser(this.editingUser.id, {
            name,
            title,
            role,
            isAdmin: isAdminFlag,
            departmentId,
            teamId,
            username,
            password,
            email,
            phone,
            avatar,
            badge,
            unit: deptName
          });
          if (role === 'MANAGER' && dept && (!dept.managerId || dept.managerId === this.editingUser.id)) {
            store.updateDepartment(departmentId, { managerId: this.editingUser.id });
          }
          toast(`Đã cập nhật thông tin nhân viên: ${name}`, 'success');
        } else {
          const newUser = store.createUser({
            name,
            title,
            role,
            isAdmin: isAdminFlag,
            departmentId,
            teamId,
            username,
            password,
            email,
            phone,
            avatar,
            badge,
            unit: deptName
          });

          if (!newUser) {
            toast('Lỗi khi cấp tài khoản. Vui lòng thử lại!', 'warning');
            return;
          }
          if (role === 'MANAGER' && dept && !dept.managerId) {
            store.updateDepartment(departmentId, { managerId: newUser.id });
          }
          toast(`Đã cấp tài khoản thành công cho: ${newUser.name} (${newUser.username})`, 'success');
        }

        closeModal();
        if (this.onMemberSaved) this.onMemberSaved();
      });
    }
  }
}



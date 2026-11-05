/**
 * THANH VŨ MEDIC CS3 - MEMBER MANAGEMENT MODAL COMPONENT (MOBILE FIRST)
 * Thêm mới và chỉnh sửa thông tin nhân viên (Admin & Manager)
 * Chuẩn màu Vàng Hoàng Kim Google Stitch (#D6A52A / #795900)
 */

import { auth } from '../auth.js';
import { store } from '../store.js';
import { DEPARTMENTS } from '../models.js';
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

export class MemberModal {
  constructor(containerId, onMemberSaved) {
    this.container = document.getElementById(containerId);
    this.onMemberSaved = onMemberSaved;
    this.editingUser = null;
  }

  show(userId = null) {
    if (!this.container) return;

    rung(10);

    this.editingUser = userId ? store.getUserById(userId) : null;
    const currentDept = auth.getActiveDepartment();
    const canSelectDept = auth.isAdmin();

    this.container.innerHTML = `
      <div class="modal-overlay fixed inset-0 z-[100] bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 active" id="memberOverlay">
        <div class="modal-card bg-white rounded-2xl p-4 sm:p-6 max-w-lg w-full shadow-2xl border border-[#e2e8f0] max-h-[92vh] overflow-y-auto">
          <!-- HEADER -->
          <div class="flex items-center justify-between pb-3.5 border-b border-[#f1f5f9] mb-4">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-[#fffbeb] text-[#795900] flex items-center justify-center font-bold border border-[#fef3c7] shrink-0">
                <span class="material-symbols-outlined text-[22px]">person_add</span>
              </div>
              <div class="min-w-0">
                <h3 class="font-bold text-[16px] sm:text-[16.5px] text-[#0d1c2f] truncate">${this.editingUser ? 'Cập Nhật Nhân Sự' : 'Thêm Nhân Viên Mới'}</h3>
                <span class="text-[11.5px] text-[#795900] font-semibold truncate block">${currentDept.name}</span>
              </div>
            </div>
            <button type="button" class="text-gray-400 hover:text-gray-700 text-2xl font-bold min-w-[40px] min-h-[40px] flex items-center justify-center" id="btnCloseMemberModal" aria-label="Đóng">&times;</button>
          </div>

          <!-- FORM -->
          <form id="formMember" class="flex flex-col gap-3.5 sm:gap-4">
            <!-- AVATAR PICKER -->
            <div class="flex items-center gap-3 p-3 bg-[#f8f9ff] rounded-2xl border border-[#e2e8f0]">
              <img id="memberAvatarPreview" src="${this.editingUser ? this.editingUser.avatar : PRESET_AVATARS[0]}" class="w-14 h-14 rounded-full object-cover ring-2 ring-white shrink-0" />
              <div class="flex-1 min-w-0">
                <input type="url" id="memberAvatarUrl" value="${this.editingUser ? esc(this.editingUser.avatar) : PRESET_AVATARS[0]}" placeholder="URL ảnh đại diện" class="w-full h-9 px-2.5 rounded-lg border border-[#e2e8f0] text-[13px] outline-none focus:border-[#d6a52a] bg-white" />
                <div class="flex items-center gap-1.5 mt-2 overflow-x-auto no-scrollbar">
                  ${PRESET_AVATARS.map(url => `
                    <img src="${url}" class="w-7 h-7 rounded-full object-cover cursor-pointer hover:scale-110 transition-transform ring-1 ring-gray-300 select-avatar-item shrink-0" data-avatar="${url}" />
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- NAME & TITLE -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label class="block text-[12.5px] font-bold text-[#0d1c2f] mb-1">Họ và tên *</label>
                <input type="text" id="memberName" required value="${this.editingUser ? esc(this.editingUser.name) : ''}" placeholder="Ví dụ: BS. Nguyễn Văn A" class="w-full h-11 px-3.5 rounded-xl border border-[#e2e8f0] text-[13.5px] outline-none focus:border-[#d6a52a] bg-[#f8f9ff] focus:bg-white" />
              </div>

              <div>
                <label class="block text-[12.5px] font-bold text-[#0d1c2f] mb-1">Chức danh / Vị trí *</label>
                <input type="text" id="memberTitle" required value="${this.editingUser ? esc(this.editingUser.title) : 'Chuyên viên'}" placeholder="Chuyên viên CSKH, Bác sĩ..." class="w-full h-11 px-3.5 rounded-xl border border-[#e2e8f0] text-[13.5px] outline-none focus:border-[#d6a52a] bg-[#f8f9ff] focus:bg-white" />
              </div>
            </div>

            <!-- ROLE & DEPARTMENT -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label class="block text-[12.5px] font-bold text-[#0d1c2f] mb-1">Vai trò phân quyền *</label>
                <select id="memberRole" class="w-full h-11 px-3 rounded-xl border border-[#e2e8f0] text-[13.5px] outline-none focus:border-[#d6a52a] bg-[#f8f9ff] focus:bg-white">
                  <option value="MEMBER" ${this.editingUser && this.editingUser.role === 'MEMBER' ? 'selected' : ''}>Chuyên viên / Nhân viên</option>
                  <option value="MANAGER" ${this.editingUser && this.editingUser.role === 'MANAGER' ? 'selected' : ''}>Trưởng phòng / Quản lý</option>
                </select>
              </div>

              <div>
                <label class="block text-[12.5px] font-bold text-[#0d1c2f] mb-1">Phòng ban trực thuộc *</label>
                <select id="memberDept" ${!canSelectDept ? 'disabled' : ''} class="w-full h-11 px-3 rounded-xl border border-[#e2e8f0] text-[13.5px] outline-none focus:border-[#d6a52a] bg-[#f8f9ff] focus:bg-white disabled:bg-gray-100">
                  ${DEPARTMENTS.map(d => `
                    <option value="${d.id}" ${(this.editingUser ? this.editingUser.departmentId === d.id : currentDept.id === d.id) ? 'selected' : ''}>
                      ${d.name} (${d.code})
                    </option>
                  `).join('')}
                </select>
              </div>
            </div>

            <!-- EMAIL & PHONE -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label class="block text-[12.5px] font-bold text-[#0d1c2f] mb-1">Email liên hệ</label>
                <input type="email" id="memberEmail" value="${this.editingUser ? esc(this.editingUser.email || '') : ''}" placeholder="bacsi@thanhvumedic.vn" class="w-full h-11 px-3.5 rounded-xl border border-[#e2e8f0] text-[13.5px] outline-none focus:border-[#d6a52a] bg-[#f8f9ff] focus:bg-white" />
              </div>

              <div>
                <label class="block text-[12.5px] font-bold text-[#0d1c2f] mb-1">Số điện thoại</label>
                <input type="text" id="memberPhone" value="${this.editingUser ? esc(this.editingUser.phone || '') : ''}" placeholder="0918xxxxxx" class="w-full h-11 px-3.5 rounded-xl border border-[#e2e8f0] text-[13.5px] outline-none focus:border-[#d6a52a] bg-[#f8f9ff] focus:bg-white" />
              </div>
            </div>

            <!-- ACTIONS (MOBILE FRIENDLY) -->
            <div class="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3 border-t border-[#f1f5f9] mt-2">
              <button type="button" class="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#e2e8f0] text-[#64748b] text-[13px] font-semibold hover:bg-gray-50 min-h-[44px]" id="btnCancelMember">
                Hủy bỏ
              </button>
              <button type="submit" class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#d6a52a] text-[#533d00] text-[13px] font-bold hover:bg-[#795900] hover:text-white shadow-xs transition-all min-h-[44px]">
                ${this.editingUser ? 'Lưu Thông Tin' : 'Tạo Nhân Viên'}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const overlay = this.container.querySelector('#memberOverlay');
    const btnClose = this.container.querySelector('#btnCloseMemberModal');
    const btnCancel = this.container.querySelector('#btnCancelMember');
    const form = this.container.querySelector('#formMember');
    const inputAvatar = this.container.querySelector('#memberAvatarUrl');
    const avatarPreview = this.container.querySelector('#memberAvatarPreview');

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
        const departmentId = this.container.querySelector('#memberDept').value;
        const email = this.container.querySelector('#memberEmail').value.trim();
        const phone = this.container.querySelector('#memberPhone').value.trim();
        const avatar = inputAvatar.value.trim() || PRESET_AVATARS[0];

        if (!name) {
          toast('Vui lòng nhập tên nhân viên!', 'warning');
          return;
        }

        if (this.editingUser) {
          store.updateUser(this.editingUser.id, {
            name,
            title,
            role,
            departmentId,
            email,
            phone,
            avatar,
            badge: role === 'MANAGER' ? 'Trưởng phòng' : 'Chuyên viên'
          });
          toast(`Đã cập nhật thông tin nhân viên: ${name}`, 'success');
        } else {
          const newUser = store.createUser({
            name,
            title,
            role,
            departmentId,
            email,
            phone,
            avatar,
            badge: role === 'MANAGER' ? 'Trưởng phòng' : 'Chuyên viên'
          });
          toast(`Đã thêm nhân viên mới: ${newUser.name}`, 'success');
        }

        closeModal();
        if (this.onMemberSaved) this.onMemberSaved();
      });
    }
  }
}

/**
 * THANH VŨ MEDIC CS3 - MEMBER CREATE & EDIT MODAL COMPONENT
 * Cho phép Trưởng phòng và Admin thêm / cập nhật nhân sự trong phòng ban
 * Chuẩn Slate Blue + Indigo
 */

import { auth } from '../auth.js';
import { store } from '../store.js';
import { DEPARTMENTS } from '../models.js';
import { esc, toast, rung } from '../helpers.js';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
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

    this.editingUser = userId ? store.getUserById(userId) : null;
    const currentDept = auth.getActiveDepartment();
    const canSelectDept = auth.isAdmin();

    this.container.innerHTML = `
      <div class="modal-overlay fixed inset-0 z-[100] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 active" id="memberOverlay">
        <div class="modal-card bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-[#E2E8F0] max-h-[90vh] overflow-y-auto">
          <!-- HEADER -->
          <div class="flex items-center justify-between pb-3.5 border-b border-[#F1F5F9] mb-4">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold">
                <span class="material-symbols-outlined text-[22px]">person_add</span>
              </div>
              <div>
                <h3 class="font-bold text-[16.5px] text-[#0F172A]">${this.editingUser ? 'Cập Nhật Nhân Sự' : 'Thêm Nhân Viên Mới'}</h3>
                <span class="text-[11.5px] text-[#2563EB] font-semibold">${currentDept.name}</span>
              </div>
            </div>
            <button type="button" class="text-gray-400 hover:text-gray-700 text-2xl font-bold" id="btnCloseMemberModal">&times;</button>
          </div>

          <!-- FORM -->
          <form id="formMember" class="flex flex-col gap-4">
            <!-- AVATAR PICKER -->
            <div class="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]">
              <img id="memberAvatarPreview" src="${this.editingUser ? this.editingUser.avatar : PRESET_AVATARS[0]}" class="w-14 h-14 rounded-full object-cover ring-2 ring-white shrink-0" />
              <div class="flex-1 min-w-0">
                <input type="url" id="memberAvatarUrl" value="${this.editingUser ? esc(this.editingUser.avatar) : PRESET_AVATARS[0]}" placeholder="URL ảnh đại diện" class="w-full h-8 px-2.5 rounded-lg border border-[#E2E8F0] text-[12px] outline-none focus:border-[#2563EB] bg-white" />
                <div class="flex items-center gap-1.5 mt-2 overflow-x-auto">
                  ${PRESET_AVATARS.map(url => `
                    <img src="${url}" class="w-6 h-6 rounded-full object-cover cursor-pointer hover:scale-110 transition-transform ring-1 ring-gray-300 select-avatar-item" data-avatar="${url}" />
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- NAME & TITLE -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label class="block text-[12.5px] font-bold text-[#0F172A] mb-1">Họ và tên *</label>
                <input type="text" id="memberName" required value="${this.editingUser ? esc(this.editingUser.name) : ''}" placeholder="Ví dụ: BS. Nguyễn Văn A" class="w-full h-10 px-3.5 rounded-xl border border-[#E2E8F0] text-[13.5px] outline-none focus:border-[#2563EB] bg-[#F8FAFC] focus:bg-white" />
              </div>

              <div>
                <label class="block text-[12.5px] font-bold text-[#0F172A] mb-1">Chức danh / Vị trí *</label>
                <input type="text" id="memberTitle" required value="${this.editingUser ? esc(this.editingUser.title) : 'Chuyên viên'}" placeholder="Chuyên viên CSKH, Bác sĩ..." class="w-full h-10 px-3.5 rounded-xl border border-[#E2E8F0] text-[13.5px] outline-none focus:border-[#2563EB] bg-[#F8FAFC] focus:bg-white" />
              </div>
            </div>

            <!-- ROLE & DEPARTMENT -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label class="block text-[12.5px] font-bold text-[#0F172A] mb-1">Vai trò phân quyền *</label>
                <select id="memberRole" class="w-full h-10 px-3 rounded-xl border border-[#E2E8F0] text-[13px] outline-none focus:border-[#2563EB] bg-[#F8FAFC] focus:bg-white">
                  <option value="MEMBER" ${this.editingUser && this.editingUser.role === 'MEMBER' ? 'selected' : ''}>Chuyên viên / Nhân viên</option>
                  <option value="MANAGER" ${this.editingUser && this.editingUser.role === 'MANAGER' ? 'selected' : ''}>Trưởng phòng / Quản lý</option>
                </select>
              </div>

              <div>
                <label class="block text-[12.5px] font-bold text-[#0F172A] mb-1">Thuộc phòng ban *</label>
                <select id="memberDept" class="w-full h-10 px-3 rounded-xl border border-[#E2E8F0] text-[13px] outline-none focus:border-[#2563EB] bg-[#F8FAFC] focus:bg-white" ${!canSelectDept ? 'disabled' : ''}>
                  ${DEPARTMENTS.map(d => `
                    <option value="${d.id}" ${(this.editingUser ? this.editingUser.departmentId === d.id : currentDept.id === d.id) ? 'selected' : ''}>${d.name}</option>
                  `).join('')}
                </select>
              </div>
            </div>

            <!-- CONTACT -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label class="block text-[12.5px] font-bold text-[#0F172A] mb-1">Số điện thoại</label>
                <input type="tel" id="memberPhone" value="${this.editingUser ? esc(this.editingUser.phone || '') : ''}" placeholder="09xx xxx xxx" class="w-full h-10 px-3.5 rounded-xl border border-[#E2E8F0] text-[13.5px] outline-none focus:border-[#2563EB] bg-[#F8FAFC] focus:bg-white" />
              </div>

              <div>
                <label class="block text-[12.5px] font-bold text-[#0F172A] mb-1">Email nội bộ</label>
                <input type="email" id="memberEmail" value="${this.editingUser ? esc(this.editingUser.email || '') : ''}" placeholder="name@thanhvumedic.vn" class="w-full h-10 px-3.5 rounded-xl border border-[#E2E8F0] text-[13.5px] outline-none focus:border-[#2563EB] bg-[#F8FAFC] focus:bg-white" />
              </div>
            </div>

            <!-- BUTTONS -->
            <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F1F5F9] mt-2">
              <button type="button" class="px-4 py-2 rounded-xl border border-[#E2E8F0] text-[#64748B] text-[13px] font-semibold hover:bg-gray-50" id="btnCancelMember">
                Hủy bỏ
              </button>
              <button type="submit" class="px-5 py-2 rounded-xl bg-[#2563EB] text-white text-[13px] font-bold hover:bg-[#1D4ED8] shadow-sm shadow-blue-500/20">
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
        const url = img.dataset.avatar;
        if (inputAvatar) inputAvatar.value = url;
        if (avatarPreview) avatarPreview.src = url;
        rung(10);
      });
    });

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        rung(15);

        const currentDept = auth.getActiveDepartment();
        const role = this.container.querySelector('#memberRole').value;
        const deptId = this.container.querySelector('#memberDept').value || currentDept.id;

        const userData = {
          name: this.container.querySelector('#memberName').value.trim(),
          title: this.container.querySelector('#memberTitle').value.trim(),
          role: role,
          departmentId: deptId,
          phone: this.container.querySelector('#memberPhone').value.trim(),
          email: this.container.querySelector('#memberEmail').value.trim(),
          avatar: inputAvatar.value.trim(),
          unit: currentDept.unit,
          badge: role === 'ADMIN' ? 'Admin' : (role === 'MANAGER' ? 'Trưởng phòng' : 'Chuyên viên')
        };

        if (this.editingUser) {
          store.updateUser(this.editingUser.id, userData);
          toast(`Đã cập nhật nhân sự: ${userData.name}`, 'success');
        } else {
          userData.id = 'usr_' + Date.now().toString(36);
          store.addUser(userData);
          toast(`Đã thêm nhân sự mới: ${userData.name}`, 'success');
        }

        closeModal();
        if (this.onMemberSaved) this.onMemberSaved();
      });
    }
  }
}

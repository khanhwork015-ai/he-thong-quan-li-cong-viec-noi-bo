/**
 * THANH VU MEDIC CS3 - MEMBER MANAGEMENT MODAL COMPONENT (SHIN AIOS v2.6.4)
 * C?p tài kho?n nhân viên m?i & phân b? vào dúng Phòng Ban & B? Ph?n Con
 * 
 * PHÂN QUY?N B?O M?T:
 * - Admin: Toàn quy?n c?p m?i role (Admin, Lãnh d?o, Tru?ng phòng, Nhân viên), m?i phòng ban & b? ph?n.
 * - Tru?ng/Phó phòng: CH? c?p du?c tài kho?n cho Nhân viên thu?c phòng ban mình dang qu?n lý.
 *   Không th? c?p tài kho?n cho Ban Lãnh Ð?o ho?c Admin!
 * - Nhân viên: Không du?c phép c?p tài kho?n.
 */

import { auth } from '../auth.js?v=5.2';
import { store } from '../store.js?v=5.2';
import { esc, toast, rung } from '../helpers.js?v=5.2';

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
      toast('Ch? Qu?n Tr? Viên (Admin) m?i có quy?n c?p và qu?n lý tài kho?n nhân s?!', 'warning');
      return;
    }

    rung(10);
    this.editingUser = userId ? store.getUserById(userId) : null;
    const allDepts = store.getAllDepartments();
    const currentDept = auth.getActiveDepartment();
    const isAdmin = auth.isAdmin();
    const isLeadership = auth.isLeadership();
    const isManager = auth.isManager();

    // Xác d?nh phòng ban ban d?u (uu tiên defaultDeptId n?u dang xem phòng ban c? th?)
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
                  ${this.editingUser ? 'C?p Nh?t Nhân S?' : 'C?p Tài Kho?n Nhân Viên M?i'}
                </h3>
                <span class="text-[11.5px] font-semibold truncate block" style="color: var(--primary);">
                  ${isAdmin ? 'Toàn vi?n' : currentDept.name} • ${auth.getCurrentUser().name} (${auth.getCurrentUser().role})
                </span>
              </div>
            </div>
            <button type="button" class="text-gray-400 hover:text-gray-700 text-2xl font-bold min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors" id="btnCloseMemberModal" aria-label="Ðóng">&times;</button>
          </div>

          <!-- FORM -->
          <form id="formMember" class="flex flex-col gap-3.5">
            
            <!-- AVATAR PICKER -->
            <div class="flex items-center gap-3 p-3 rounded-2xl border border-[#e2e8f0] bg-[#f8f9ff]" style="background-color: var(--background); border-color: var(--border);">
              <div class="relative group cursor-pointer shrink-0">
                <img id="memberAvatarPreview" src="${this.editingUser ? this.editingUser.avatar : PRESET_AVATARS[0]}" class="w-14 h-14 rounded-full object-cover ring-2 ring-white shadow-xs" />
                <button type="button" class="absolute inset-0 rounded-full bg-black/35 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" id="btnMemberAvatarOverlay" title="Ð?i ?nh d?i di?n">
                  <span class="material-symbols-outlined text-[18px]">photo_camera</span>
                </button>
              </div>

              <!-- INPUT FILE ?N CH?N ?NH T? THI?T B? -->
              <input type="file" id="memberFileInput" accept="image/*" class="hidden" />

              <div class="flex-1 min-w-0 flex flex-col gap-1.5">
                <div class="flex flex-wrap sm:flex-nowrap items-center gap-2">
                  <button type="button" class="px-2.5 py-1.5 rounded-lg bg-[#d6a52a] text-[#533d00] font-bold text-[11.5px] hover:bg-[#795900] hover:text-white transition-all flex items-center gap-1 shadow-xs shrink-0 min-h-[32px] cursor-pointer" id="btnMemberUploadAvatar" title="Ch?n file ?nh t? thi?t b?">
                    <span class="material-symbols-outlined text-[16px]">upload</span>
                    <span>T?i ?nh t? máy</span>
                  </button>
                  <input type="url" id="memberAvatarUrl" value="${this.editingUser ? esc(this.editingUser.avatar) : PRESET_AVATARS[0]}" placeholder="Ho?c dán URL ?nh d?i di?n" class="flex-1 min-w-[140px] h-8 px-2.5 rounded-lg border border-[#e2e8f0] text-[12px] outline-none bg-white text-[#0d1c2f] focus:border-[#d6a52a]" />
                </div>
                <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  <span class="text-[10px] font-semibold text-[#817663] shrink-0">M?u:</span>
                  ${PRESET_AVATARS.map(url => `
                    <img src="${url}" class="w-6 h-6 rounded-full object-cover cursor-pointer hover:scale-110 transition-transform ring-1 ring-gray-300 select-avatar-item shrink-0" data-avatar="${url}" title="B?m d? ch?n" />
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- TÀI KHO?N ÐANG NH?P (USERNAME & PASSWORD) -->
            <div class="p-3.5 rounded-2xl border border-[#e2e8f0] bg-[#f8f9ff]/70 flex flex-col gap-2.5" style="background-color: var(--primary-soft); border-color: var(--border);">
              <div class="flex items-center justify-between">
                <span class="text-[12px] font-bold text-[#0d1c2f] flex items-center gap-1.5" style="color: var(--text);">
                  <span class="material-symbols-outlined text-[17px]" style="color: var(--primary);">vpn_key</span>
                  Thông tin dang nh?p &amp; b?o m?t
                </span>
                <span class="text-[10.5px] text-[#817663]">Phiên làm vi?c b?o m?t</span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-[11.5px] font-bold text-[#0d1c2f] mb-1" style="color: var(--text);">Tên dang nh?p (Username) *</label>
                  <input type="text" id="memberUsername" required value="${this.editingUser ? esc(this.editingUser.username || '') : ''}" placeholder="VD: tuyetmai, hoangnam..." class="w-full h-10 px-3 rounded-xl border border-[#e2e8f0] text-[13px] outline-none bg-white text-[#0d1c2f] focus:border-[#d6a52a]" />
                </div>
                <div>
                  <label class="block text-[11.5px] font-bold text-[#0d1c2f] mb-1" style="color: var(--text);">M?t kh?u kh?i t?o *</label>
                  <input type="text" id="memberPassword" required value="${this.editingUser ? esc(this.editingUser.password || '123') : '123'}" placeholder="M?c d?nh: 123" class="w-full h-10 px-3 rounded-xl border border-[#e2e8f0] text-[13px] outline-none bg-white text-[#0d1c2f] focus:border-[#d6a52a]" />
                </div>
              </div>
            </div>

            <!-- H? TÊN & CH?C DANH -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-[12px] font-bold text-[#0d1c2f] mb-1" style="color: var(--text);">H? và tên *</label>
                <input type="text" id="memberName" required value="${this.editingUser ? esc(this.editingUser.name) : ''}" placeholder="Ví d?: Hu?nh Tru?ng Thanh Tâm" class="w-full h-10 px-3 rounded-xl border border-[#e2e8f0] text-[13px] outline-none bg-white text-[#0d1c2f] focus:border-[#d6a52a]" />
              </div>

              <div>
                <label class="block text-[12px] font-bold text-[#0d1c2f] mb-1" style="color: var(--text);">Ch?c danh công tác *</label>
                <input type="text" id="memberTitle" required value="${this.editingUser ? esc(this.editingUser.title) : 'Chuyên viên'}" placeholder="Chuyên viên CSKH, Marketing..." class="w-full h-10 px-3 rounded-xl border border-[#e2e8f0] text-[13px] outline-none bg-white text-[#0d1c2f] focus:border-[#d6a52a]" />
              </div>
            </div>

            <!-- VAI TRÒ PHÂN QUY?N (STRICT RBAC) & PHÒNG BAN -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-[12px] font-bold text-[#0d1c2f] mb-1" style="color: var(--text);">
                  Vai trò phân quy?n (Role) *
                </label>
                <select id="memberRole" class="w-full h-10 px-3 rounded-xl border border-[#e2e8f0] text-[13px] outline-none bg-white text-[#0d1c2f] focus:border-[#d6a52a]">
                  <option value="MEMBER" ${this.editingUser && this.editingUser.role === 'MEMBER' ? 'selected' : ''}>?? Nhân viên / Chuyên viên (MEMBER)</option>
                  <option value="DEPUTY_MANAGER" ${this.editingUser && this.editingUser.role === 'DEPUTY_MANAGER' ? 'selected' : ''}>? Phó Tru?ng Phòng (DEPUTY_MANAGER)</option>
                  <option value="MANAGER" ${this.editingUser && this.editingUser.role === 'MANAGER' ? 'selected' : ''}>?? Tru?ng Phòng (MANAGER)</option>
                  <option value="LEADERSHIP" ${this.editingUser && this.editingUser.role === 'LEADERSHIP' ? 'selected' : ''}>??? Ban Lãnh Ð?o (LEADERSHIP)</option>
                  <option value="ADMIN" ${this.editingUser && this.editingUser.role === 'ADMIN' ? 'selected' : ''}>?? Qu?n Tr? Viên (ADMIN)</option>
                </select>
                ${isManager ? `
                  <span class="text-[10px] text-amber-600 block mt-1">
                    * B?n là Tru?ng phòng: Ch? có th?m quy?n c?p tài kho?n cho Nhân viên.
                  </span>
                ` : ''}
              </div>

              <div>
                <label class="block text-[12px] font-bold text-[#0d1c2f] mb-1" style="color: var(--text);">Phòng ban tr?c thu?c *</label>
                <select id="memberDept" ${!isAdmin ? 'disabled' : ''} class="w-full h-10 px-3 rounded-xl border border-[#e2e8f0] text-[13px] outline-none bg-white text-[#0d1c2f] focus:border-[#d6a52a] disabled:bg-gray-100">
                  ${allDepts.map(d => `
                    <option value="${d.id}" ${(initialDeptId === d.id) ? 'selected' : ''}>
                      ${d.name} (${d.code})
                    </option>
                  `).join('')}
                </select>
              </div>
            </div>

            <!-- B? PH?N CON (TEAMS) BÊN TRONG PHÒNG BAN -->
            <div>
              <label class="block text-[12px] font-bold text-[#0d1c2f] mb-1" style="color: var(--text);">
                B? ph?n con tr?c thu?c (Team) *
              </label>
              <select id="memberTeam" class="w-full h-10 px-3 rounded-xl border border-[#e2e8f0] text-[13px] outline-none bg-white text-[#0d1c2f] focus:border-[#d6a52a]">
                <option value="">-- Toàn phòng ban / Chua phân t? --</option>
                ${(initialDept?.teams || []).map(t => `
                  <option value="${t.id}" ${this.editingUser && this.editingUser.teamId === t.id ? 'selected' : ''}>
                    ${t.name} (${t.code})
                  </option>
                `).join('')}
              </select>
              <span class="text-[10.5px] text-[#64748b] block mt-1">
                Ví d?: Phòng PTKH g?m Marketing, CSKH, H? tr?... Tru?ng phòng qu?n lý toàn b?.
              </span>
            </div>

            <!-- EMAIL & SÐT -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-[12px] font-bold text-[#0d1c2f] mb-1" style="color: var(--text);">Email liên h?</label>
                <input type="email" id="memberEmail" value="${this.editingUser ? esc(this.editingUser.email || '') : ''}" placeholder="nhanvien@thanhvumedic.vn" class="w-full h-10 px-3 rounded-xl border border-[#e2e8f0] text-[13px] outline-none bg-white text-[#0d1c2f]" />
              </div>

              <div>
                <label class="block text-[12px] font-bold text-[#0d1c2f] mb-1" style="color: var(--text);">S? di?n tho?i</label>
                <input type="text" id="memberPhone" value="${this.editingUser ? esc(this.editingUser.phone || '') : ''}" placeholder="09xx xxx xxx" class="w-full h-10 px-3 rounded-xl border border-[#e2e8f0] text-[13px] outline-none bg-white text-[#0d1c2f]" />
              </div>
            </div>

            <!-- BUTTONS -->
            <div class="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-[#f1f5f9] mt-1" style="border-color: var(--border);">
              <button type="button" class="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#e2e8f0] text-[#64748b] text-[13px] font-semibold hover:bg-gray-50 min-h-[44px]" id="btnCancelMember">
                H?y b?
              </button>
              <button type="submit" class="w-full sm:w-auto px-5 py-2.5 rounded-xl text-[13px] font-bold shadow-xs transition-all min-h-[44px] flex items-center justify-center gap-1.5" style="background-color: var(--primary-container); color: var(--on-primary-container);">
                <span class="material-symbols-outlined text-[18px]">check</span>
                <span>${this.editingUser ? 'Luu Thông Tin' : 'C?p Tài Kho?n'}</span>
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

    // Khi ch?n phòng ban khác -> c?p nh?t danh sách Teams
    if (selectDept && selectTeam) {
      selectDept.addEventListener('change', () => {
        const dId = selectDept.value;
        const d = allDepts.find(item => item.id === dId);
        selectTeam.innerHTML = '<option value="">-- Toàn phòng ban / Chua phân t? --</option>';
        if (d && d.teams) {
          d.teams.forEach(t => {
            selectTeam.innerHTML += `<option value="${t.id}">${t.name} (${t.code})</option>`;
          });
        }
      });
    }

    // Kích ho?t input file ?n khi b?m nút t?i ?nh ho?c overlay trên preview
    if (btnUpload && fileInput) {
      btnUpload.addEventListener('click', () => fileInput.click());
    }
    if (btnOverlay && fileInput) {
      btnOverlay.addEventListener('click', () => fileInput.click());
    }

    // T? d?ng resize và nén ?nh b?ng HTML5 Canvas khi ch?n file t? máy
    if (fileInput && avatarPreview) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
          toast('Vui lòng ch?n t?p d?nh d?ng hình ?nh (PNG, JPG, WEBP)!', 'warning');
          fileInput.value = '';
          return;
        }

        if (file.size > 5 * 1024 * 1024) {
          toast('Dung lu?ng ?nh vu?t quá 5MB. Vui lòng ch?n ?nh nh? hon!', 'warning');
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
              toast('Ðã t?i và t?i uu ?nh d?i di?n thành công!', 'success');
            } catch (err) {
              console.error('L?i khi nén ?nh d?i di?n:', err);
              avatarPreview.src = event.target.result;
              if (inputAvatar) inputAvatar.value = event.target.result;
              toast('Ðã t?i ?nh d?i di?n!', 'success');
            } finally {
              fileInput.value = '';
            }
          };
          img.onerror = () => {
            toast('T?p ?nh b? l?i c?u trúc ho?c không th? hi?n th?!', 'warning');
            fileInput.value = '';
          };
          img.src = event.target.result;
        };
        reader.onerror = () => {
          toast('Không th? d?c file ?nh. Vui lòng th? l?i!', 'warning');
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
        const departmentId = selectDept.value;
        const teamId = selectTeam.value;
        const username = this.container.querySelector('#memberUsername').value.trim();
        const password = this.container.querySelector('#memberPassword').value.trim();
        const email = this.container.querySelector('#memberEmail').value.trim();
        const phone = this.container.querySelector('#memberPhone').value.trim();
        const avatar = (inputAvatar && inputAvatar.value.trim()) 
          ? inputAvatar.value.trim() 
          : ((avatarPreview && avatarPreview.src) ? avatarPreview.src : PRESET_AVATARS[0]);

        if (!name || !username || !password) {
          toast('Vui lòng nh?p d?y d? H? tên, Username và Password!', 'warning');
          return;
        }

        // Ki?m tra th?m quy?n c?p tài kho?n (Zero-Bug Security)
        if (!auth.canProvisionAccount(role, departmentId)) {
          toast('B?n không có quy?n c?p tài kho?n v?i vai trò ho?c phòng ban này!', 'warning');
          return;
        }

        const dept = allDepts.find(d => d.id === departmentId);
        const deptName = dept ? dept.name : 'Thanh Vu Medic';
        let badge = 'Chuyên viên';
        if (role === 'ADMIN') badge = 'Admin H? Th?ng';
        else if (role === 'LEADERSHIP') badge = 'Ban Lãnh Ð?o';
        else if (role === 'MANAGER') badge = 'Tru?ng phòng';
        else if (role === 'DEPUTY_MANAGER') badge = 'Phó phòng';

        if (this.editingUser) {
          store.updateUser(this.editingUser.id, {
            name,
            title,
            role,
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
          toast(`Ðã c?p nh?t thông tin nhân viên: ${name}`, 'success');
        } else {
          const newUser = store.createUser({
            name,
            title,
            role,
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
            toast('L?i khi c?p tài kho?n. Vui lòng th? l?i!', 'warning');
            return;
          }
          if (role === 'MANAGER' && dept && !dept.managerId) {
            store.updateDepartment(departmentId, { managerId: newUser.id });
          }
          toast(`Ðã c?p tài kho?n thành công cho: ${newUser.name} (${newUser.username})`, 'success');
        }

        closeModal();
        if (this.onMemberSaved) this.onMemberSaved();
      });
    }
  }
}



/**
 * THANH VŨ MEDIC CS3 - DEPARTMENT & SUB-DEPARTMENT (TEAMS) MANAGEMENT VIEW
 * Màn hình quản lý Cơ cấu Phòng Ban & Bộ Phận Con toàn diện (Dành cho Quản Trị Viên)
 * Chuẩn SHIN AIOS v2.7:
 * - Hỗ trợ KÉO THẢ (Drag & Drop) nhân sự vào từng bộ phận con trực quan
 * - Nút 1-chạm "+ Thêm nhân sự" trên từng bộ phận con (mở popup gán nhanh)
 * - Bộ chọn nhanh bộ phận (Quick Team Selector) trực tiếp trên từng thẻ nhân viên
 * - Vùng bấm Touch Target >= 44px, Responsive Mobile-First
 */

import { auth } from '../auth.js?v=6.7';
import { store } from '../store.js?v=6.7';
import { esc, toast, rung, xacNhan2Lan } from '../helpers.js?v=6.7';

export class DepartmentView {
  constructor(containerId, onUpdated, onOpenMemberModal) {
    this.container = document.getElementById(containerId);
    this.onUpdated = onUpdated;
    this.onOpenMemberModal = onOpenMemberModal;
    this.selectedDeptId = null;
    this.editingTeamId = null;
    this.isEditingDept = false;
    this.isAddingDept = false;
    this.searchQuery = '';
    this.quickAssignTeamId = null; // ID của team đang mở modal thêm nhân sự
  }

  render(deptIdToSelect = null) {
    if (!this.container) return;

    const prevScrollY = window.scrollY || document.documentElement.scrollTop;

    if (!auth.canCRUDDepartments()) {
      this.container.innerHTML = `
        <div class="p-8 text-center bg-white rounded-3xl border border-[#e2e8f0] shadow-sm max-w-lg mx-auto mt-10">
          <div class="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <span class="material-symbols-outlined text-[32px]">lock</span>
          </div>
          <h3 class="text-lg font-bold text-[#0d1c2f] mb-2">Quyền Hạn Bị Giới Hạn</h3>
          <p class="text-[13px] text-[#64748b]">Chỉ Quản Trị Viên (Admin Hệ Thống) mới có thẩm quyền quản lý danh mục phòng ban và cơ cấu bộ phận con.</p>
        </div>
      `;
      return;
    }

    const depts = store.getAllDepartments();
    const allUsers = store.getAllUsers();
    const managers = allUsers.filter(u => u.role === 'MANAGER' || u.role === 'DEPUTY_MANAGER' || u.isAdmin || u.role === 'ADMIN');

    if (deptIdToSelect && deptIdToSelect !== this.selectedDeptId) {
      this.editingTeamId = null;
      this.isEditingDept = false;
      this.quickAssignTeamId = null;
    }

    this.selectedDeptId = deptIdToSelect || this.selectedDeptId || (depts[0] ? depts[0].id : null);
    let selectedDept = store.getDepartmentById(this.selectedDeptId) || depts[0];
    if (selectedDept) {
      this.selectedDeptId = selectedDept.id;
    }

    // Filter depts nếu có tìm kiếm
    const filteredDepts = depts.filter(d => {
      if (!this.searchQuery) return true;
      const q = this.searchQuery.toLowerCase();
      return d.name.toLowerCase().includes(q) || (d.code && d.code.toLowerCase().includes(q));
    });

    const selectedDeptUsers = selectedDept ? store.getDepartmentUsers(selectedDept.id) : [];
    
    // Danh sách ứng viên cho chức danh Trưởng phòng của phòng ban này
    const candidateMap = new Map();
    managers.forEach(m => candidateMap.set(m.id, m));
    selectedDeptUsers.forEach(u => candidateMap.set(u.id, u));
    const assignableManagers = Array.from(candidateMap.values());

    const deptManager = selectedDept ? selectedDeptUsers.find(u => u.id === selectedDept.managerId || u.role === 'MANAGER') : null;
    const deptDeputies = selectedDept ? selectedDeptUsers.filter(u => u.role === 'DEPUTY_MANAGER' && u.id !== deptManager?.id) : [];
    const regularStaff = selectedDeptUsers.filter(u => u.id !== deptManager?.id && !deptDeputies.some(d => d.id === u.id));

    // Tự động giải phóng nếu Trưởng phòng từng bị kéo nhầm vào bộ phận con -> Trả về Quản lý Toàn phòng
    if (deptManager && deptManager.teamId) {
      deptManager.teamId = '';
      store.updateUser(deptManager.id, { teamId: '' });
    }

    this.container.innerHTML = `
      <div class="flex flex-col w-full gap-5 sm:gap-6 animate-fade-in max-w-7xl mx-auto pb-12 overflow-x-hidden">
        
        <!-- 1. HERO BANNER MỞ MÀN CHUẨN SHIN AIOS -->
        <div class="p-5 sm:p-6 rounded-3xl border border-[#e2e8f0] shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4" style="background: linear-gradient(135deg, var(--card) 0%, var(--primary-soft) 100%); border-color: var(--border);">
          <div class="flex items-center gap-3.5 sm:gap-4 min-w-0">
            <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-bold shadow-sm shrink-0" style="background-color: var(--primary-container); color: var(--on-primary-container);">
              <span class="material-symbols-outlined text-[28px] sm:text-[32px]">domain</span>
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h2 class="text-[19px] sm:text-[22px] font-extrabold text-[#0d1c2f] tracking-tight truncate" style="color: var(--text);">
                  Cơ Cấu Phòng Ban &amp; Bộ Phận Con
                </h2>
                <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-2xs font-mono-data" style="background-color: var(--primary-soft); color: var(--primary); border: 1px solid var(--border);">
                  Dành riêng Admin
                </span>
              </div>
              <p class="text-[12.5px] sm:text-[13px] text-[#817663] font-medium mt-0.5" style="color: var(--text-muted);">
                Quản lý tổ chức đa tầng Bệnh Viện Đa Khoa Thanh Vũ Medic • Thiết lập phòng ban, mã nhận diện, trưởng phòng và tổ chuyên môn
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2.5 shrink-0">
            <button type="button" id="btnHeroAddDept" class="px-4 py-2.5 rounded-xl text-[12.5px] sm:text-[13px] font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 min-h-[44px] cursor-pointer" style="background-color: var(--primary-container); color: var(--on-primary-container);">
              <span class="material-symbols-outlined text-[20px]">add</span>
              <span>Thêm Phòng Ban</span>
            </button>
          </div>
        </div>

        <!-- 2. BỐ CỤC 2 CỘT CHÍNH (CỘT TRÁI: DANH SÁCH PB • CỘT PHẢI: BỘ PHẬN CON & NHÂN SỰ) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          
          <!-- CỘT TRÁI (5 COLS TRÊN LG): DANH SÁCH PHÒNG BAN -->
          <div class="lg:col-span-5 flex flex-col gap-3.5">
            <div class="bg-white rounded-3xl p-4 sm:p-5 border border-[#e2e8f0] shadow-sm flex flex-col gap-3.5" style="background-color: var(--card); border-color: var(--border);">
              
              <!-- TIÊU ĐỀ & TÌM KIẾM -->
              <div class="flex items-center justify-between pb-2 border-b border-[#f1f5f9]" style="border-color: var(--border);">
                <div>
                  <h3 class="font-bold text-[15.5px] text-[#0d1c2f]" style="color: var(--text);">Danh Sách Phòng Ban (${depts.length})</h3>
                  <span class="text-[11.5px] text-[#64748b]" style="color: var(--text-muted);">Chọn phòng ban để quản lý cấu trúc &amp; bộ phận</span>
                </div>
                <button type="button" id="btnToggleAddDeptSide" class="px-3 py-1.5 rounded-xl text-[12px] font-bold shadow-2xs flex items-center gap-1 min-h-[38px] cursor-pointer" style="background-color: var(--primary-container); color: var(--on-primary-container);">
                  <span class="material-symbols-outlined text-[16px]">add</span>
                  <span>Thêm PB</span>
                </button>
              </div>

              <!-- Ô TÌM KIẾM PHÒNG BAN -->
              <div class="relative">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">search</span>
                <input type="text" id="inputSearchDept" value="${esc(this.searchQuery)}" placeholder="Tìm theo tên hoặc mã phòng ban..." class="w-full h-10 pl-10 pr-3.5 rounded-xl border border-[#e2e8f0] text-[12.5px] outline-none focus:border-[#d6a52a] bg-[#f8f9ff] text-[#0d1c2f]" />
              </div>

              <!-- FORM THÊM PHÒNG BAN MỚI (ẨN/HIỆN) -->
              <div id="boxAddDeptFormView" class="${this.isAddingDept ? '' : 'hidden'} p-4 rounded-2xl border border-dashed border-[#d6a52a] bg-[#fffbeb]/60 flex flex-col gap-3 shadow-2xs" style="background-color: var(--primary-soft); border-color: var(--primary);">
                <div class="flex items-center justify-between">
                  <span class="text-[12.5px] font-bold" style="color: var(--primary);">Thêm Phòng Ban Mới</span>
                  <button type="button" id="btnCancelAddDeptTop" class="text-gray-400 hover:text-gray-700 text-lg font-bold min-w-[32px] min-h-[32px] flex items-center justify-center cursor-pointer">&times;</button>
                </div>

                <div>
                  <label class="block text-[11px] font-bold text-[#0d1c2f] mb-1" style="color: var(--text);">Tên phòng ban *</label>
                  <input type="text" id="newDeptNameView" placeholder="Ví dụ: Khoa Dược &amp; VTYT" class="w-full h-9.5 px-3 rounded-xl border border-[#e2e8f0] text-[12.5px] outline-none bg-white text-[#0d1c2f] focus:border-[#d6a52a]" />
                </div>

                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="block text-[11px] font-bold text-[#0d1c2f] mb-1" style="color: var(--text);">Mã nhận diện (Code) *</label>
                    <input type="text" id="newDeptCodeView" placeholder="VD: DUOC-CS3" class="w-full h-9.5 px-3 rounded-xl border border-[#e2e8f0] text-[12.5px] outline-none uppercase bg-white text-[#0d1c2f] focus:border-[#d6a52a]" />
                  </div>
                  <div>
                    <label class="block text-[11px] font-bold text-[#0d1c2f] mb-1" style="color: var(--text);">Màu sắc nhận diện</label>
                    <div class="flex items-center gap-2">
                      <input type="color" id="newDeptColorView" value="#D6A52A" class="h-9.5 w-10 rounded-xl border border-[#e2e8f0] cursor-pointer" />
                      <span id="newDeptColorTextView" class="text-[11.5px] font-mono text-gray-500 font-bold">#D6A52A</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label class="block text-[11px] font-bold text-[#0d1c2f] mb-1" style="color: var(--text);">Trưởng phòng phụ trách</label>
                  <select id="newDeptManagerView" class="w-full h-9.5 px-3 rounded-xl border border-[#e2e8f0] text-[12px] outline-none bg-white text-[#0d1c2f] focus:border-[#d6a52a] cursor-pointer">
                    <option value="">-- Chưa gán Trưởng phòng --</option>
                    ${managers.map(m => `<option value="${m.id}">${esc(m.name)} (${esc(m.badge || '')})</option>`).join('')}
                  </select>
                </div>

                <div class="flex items-center justify-end gap-2 pt-1 border-t border-[#f1f5f9]">
                  <button type="button" id="btnCancelAddDeptView" class="px-3.5 py-1.5 rounded-xl text-[12px] text-gray-500 hover:bg-gray-200 transition-colors cursor-pointer">Hủy</button>
                  <button type="button" id="btnSubmitAddDeptView" class="px-4 py-1.5 rounded-xl text-[12px] font-bold shadow-2xs cursor-pointer" style="background-color: var(--primary-container); color: var(--on-primary-container);">Tạo Phòng Ban</button>
                </div>
              </div>

              <!-- DANH SÁCH CÁC PHÒNG BAN -->
              <div class="flex flex-col gap-2 max-h-[560px] overflow-y-auto pr-1">
                ${filteredDepts.length === 0 ? `
                  <div class="p-6 text-center text-[12.5px] text-[#817663] bg-[#f8f9ff] rounded-2xl border border-dashed border-[#e2e8f0]">
                    Không tìm thấy phòng ban nào khớp từ khóa.
                  </div>
                ` : filteredDepts.map(d => {
                  const isAct = selectedDept && selectedDept.id === d.id;
                  const mgr = allUsers.find(u => u.id === d.managerId);
                  const teamCount = (d.teams || []).length;
                  const userCount = store.getDepartmentUsers(d.id).length;

                  return `
                    <div class="p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between min-h-[58px] dept-item-card ${isAct ? 'shadow-md border-[#d6a52a] bg-[#fffbeb]/50 ring-1 ring-[#d6a52a]' : 'hover:bg-gray-50 border-[#e2e8f0]'}" data-dept-id="${d.id}" style="${isAct ? 'background-color: var(--primary-soft); border-color: var(--primary);' : 'background-color: var(--card); border-color: var(--border);'}">
                      <div class="flex items-center gap-3 min-w-0">
                        <span class="w-4 h-4 rounded-full shrink-0 shadow-2xs ring-2 ring-white" style="background-color: ${d.color || '#D6A52A'};"></span>
                        <div class="min-w-0">
                          <div class="text-[13.5px] font-bold text-[#0d1c2f] truncate" style="color: var(--text);">${esc(d.name)}</div>
                          <div class="text-[11.5px] text-[#64748b] truncate mt-0.5" style="color: var(--text-muted);">
                            <span class="font-mono-data font-bold">${esc(d.code)}</span> • ${mgr ? esc(mgr.name) : 'Chưa gán trưởng phòng'}
                          </div>
                        </div>
                      </div>

                      <div class="flex items-center gap-1.5 shrink-0">
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full font-mono-data" style="background-color: var(--primary-soft); color: var(--primary);">
                          ${teamCount} bộ phận
                        </span>
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-mono-data">
                          ${userCount} nhân sự
                        </span>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>

            </div>
          </div>

          <!-- CỘT PHẢI (7 COLS TRÊN LG): CHI TIẾT PHÒNG BAN & BỘ PHẬN CON (TEAMS) -->
          <div class="lg:col-span-7 flex flex-col gap-4">
            ${selectedDept ? `
              
              <!-- THẺ CHI TIẾT & CHỈNH SỬA PHÒNG BAN -->
              <div class="bg-white rounded-3xl p-5 sm:p-6 border border-[#e2e8f0] shadow-sm flex flex-col gap-4" style="background-color: var(--card); border-color: var(--border);">
                
                <!-- HEADER CHI TIẾT PHÒNG BAN -->
                <div class="flex items-center justify-between pb-3.5 border-b border-[#f1f5f9]" style="border-color: var(--border);">
                  <div class="min-w-0 pr-2">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="px-2.5 py-0.5 rounded-lg text-[11px] font-bold font-mono-data uppercase text-white shrink-0 shadow-2xs" style="background-color: ${selectedDept.color || '#D6A52A'};">
                        ${esc(selectedDept.code)}
                      </span>
                      <h3 class="font-bold text-[17px] sm:text-[18px] text-[#0d1c2f] truncate" style="color: var(--text);">
                        ${esc(selectedDept.name)}
                      </h3>
                    </div>
                    <div class="text-[12px] text-[#64748b] mt-1 flex items-center gap-2 flex-wrap" style="color: var(--text-muted);">
                      <span>${esc(selectedDept.unit || 'Cơ Sở 3 (Cà Mau)')}</span>
                      <span>•</span>
                      <span>Trưởng phòng: <strong class="text-[#0d1c2f]" style="color: var(--text);">${esc(allUsers.find(u => u.id === selectedDept.managerId)?.name || 'Chưa gán')}</strong></span>
                    </div>
                  </div>

                  <div class="flex items-center gap-1.5 shrink-0">
                    <button type="button" id="btnToggleEditDeptView" class="px-3 py-1.5 rounded-xl border border-amber-200 text-amber-700 hover:bg-amber-50 font-bold text-[12px] flex items-center gap-1 min-h-[38px] transition-colors cursor-pointer" title="Chỉnh sửa phòng ban này">
                      <span class="material-symbols-outlined text-[18px]">edit</span>
                      <span class="hidden sm:inline">Chỉnh sửa</span>
                    </button>
                    <button type="button" id="btnDeleteDeptView" class="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-[12px] flex items-center gap-1 min-h-[38px] transition-colors cursor-pointer" title="Xóa phòng ban này">
                      <span class="material-symbols-outlined text-[18px]">delete</span>
                      <span class="hidden sm:inline">Xóa PB</span>
                    </button>
                  </div>
                </div>

                <!-- FORM CHỈNH SỬA PHÒNG BAN (ẨN / HIỆN) -->
                <div id="boxEditDeptFormView" class="${this.isEditingDept ? '' : 'hidden'} p-4 rounded-2xl border border-dashed border-[#d6a52a] bg-[#fffbeb]/50 flex flex-col gap-3 shadow-2xs" style="background-color: var(--primary-soft); border-color: var(--primary);">
                  <div class="flex items-center justify-between">
                    <span class="text-[12.5px] font-bold text-[#795900]" style="color: var(--primary);">Cập nhật thông tin phòng ban</span>
                    <button type="button" id="btnCancelEditDeptTopView" class="text-gray-400 hover:text-gray-700 text-lg font-bold min-w-[32px] min-h-[32px] flex items-center justify-center cursor-pointer">&times;</button>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label class="block text-[11.5px] font-bold text-[#0d1c2f] mb-1" style="color: var(--text);">Tên phòng ban *</label>
                      <input type="text" id="editDeptNameView" value="${esc(selectedDept.name)}" placeholder="Tên phòng ban *" class="w-full h-10 px-3.5 rounded-xl border border-[#e2e8f0] text-[13px] outline-none bg-white text-[#0d1c2f] focus:border-[#d6a52a]" />
                    </div>

                    <div>
                      <label class="block text-[11.5px] font-bold text-[#0d1c2f] mb-1" style="color: var(--text);">Mã nhận diện (Code) *</label>
                      <input type="text" id="editDeptCodeView" value="${esc(selectedDept.code)}" placeholder="Mã PB (VD: PTKH)" class="w-full h-10 px-3 rounded-xl border border-[#e2e8f0] text-[13px] outline-none bg-white text-[#0d1c2f] uppercase focus:border-[#d6a52a]" />
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label class="block text-[11.5px] font-bold text-[#0d1c2f] mb-1" style="color: var(--text);">Cơ sở / Chi nhánh</label>
                      <input type="text" id="editDeptUnitView" value="${esc(selectedDept.unit || 'Cơ Sở 3 (Cà Mau)')}" placeholder="Cơ sở..." class="w-full h-10 px-3.5 rounded-xl border border-[#e2e8f0] text-[13px] outline-none bg-white text-[#0d1c2f] focus:border-[#d6a52a]" />
                    </div>

                    <div>
                      <label class="block text-[11.5px] font-bold text-[#0d1c2f] mb-1" style="color: var(--text);">Màu sắc nhận diện</label>
                      <div class="flex items-center gap-2">
                        <input type="color" id="editDeptColorView" value="${selectedDept.color || '#D6A52A'}" class="h-10 w-12 rounded-xl border border-[#e2e8f0] cursor-pointer" title="Chọn màu nhận diện" />
                        <span id="editDeptColorTextView" class="text-[12px] font-mono text-gray-500">${selectedDept.color || '#D6A52A'}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label class="block text-[11.5px] font-bold text-[#0d1c2f] mb-1" style="color: var(--text);">Trưởng phòng phụ trách</label>
                    <select id="editDeptManagerView" class="w-full h-10 px-3 rounded-xl border border-[#e2e8f0] text-[12.5px] outline-none bg-white text-[#0d1c2f] focus:border-[#d6a52a] cursor-pointer">
                      <option value="">-- Chưa gán Trưởng phòng --</option>
                      ${assignableManagers.map(m => `<option value="${m.id}" ${m.id === selectedDept.managerId ? 'selected' : ''}>${esc(m.name)} (${esc(m.badge || m.title || '')})</option>`).join('')}
                    </select>
                  </div>

                  <div class="flex items-center justify-end gap-2 pt-2 border-t border-[#f1f5f9]">
                    <button type="button" id="btnCancelEditDeptView" class="px-4 py-2 rounded-xl text-[12px] text-gray-500 hover:bg-gray-200 transition-colors cursor-pointer">Hủy</button>
                    <button type="button" id="btnSubmitEditDeptView" class="px-4 py-2 rounded-xl text-[12px] font-bold shadow-2xs cursor-pointer" style="background-color: var(--primary-container); color: var(--on-primary-container);">Lưu Thay Đổi</button>
                  </div>
                </div>

                <!-- BỘ PHẬN CON (TEAMS) TRỰC THUỘC (HỖ TRỢ KÉO THẢ & NÚT THÊM NHÂN SỰ) -->
                <div class="flex flex-col gap-3 mt-1">
                  <div class="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h4 class="font-bold text-[15px] text-[#0d1c2f] flex items-center gap-2" style="color: var(--text);">
                        <span>Các Bộ Phận Con Trực Thuộc</span>
                        <span class="text-[11px] font-mono-data px-2 py-0.5 rounded-full font-bold" style="background-color: var(--primary-soft); color: var(--primary);">
                          ${(selectedDept.teams || []).length} bộ phận
                        </span>
                      </h4>
                      <p class="text-[11.5px] text-[#64748b] mt-0.5" style="color: var(--text-muted);">
                        💡 <strong>Mẹo phân bổ:</strong> Kéo thả thẻ nhân viên bên dưới vào bộ phận, hoặc bấm <em>"+ Thêm nhân sự"</em> trên từng bộ phận.
                      </p>
                    </div>
                  </div>

                  <!-- THÊM BỘ PHẬN CON NHANH -->
                  <div class="p-3.5 rounded-2xl bg-[#f8f9ff] border border-[#e2e8f0] flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shadow-2xs" style="background-color: var(--background); border-color: var(--border);">
                    <input type="text" id="inputNewTeamNameView" placeholder="Tên bộ phận (VD: CSKH, Marketing, Hỗ trợ...)" class="flex-1 h-10 px-3.5 rounded-xl border border-[#e2e8f0] text-[13px] outline-none bg-white text-[#0d1c2f] focus:border-[#d6a52a]" />
                    <input type="text" id="inputNewTeamCodeView" placeholder="Mã (VD: CSKH)" class="w-full sm:w-32 h-10 px-3 rounded-xl border border-[#e2e8f0] text-[13px] outline-none uppercase bg-white text-[#0d1c2f] focus:border-[#d6a52a]" />
                    <button type="button" id="btnAddTeamSubmitView" class="px-4 py-2 rounded-xl text-[12.5px] font-bold shadow-xs transition-all shrink-0 min-h-[40px] flex items-center justify-center gap-1.5 cursor-pointer" style="background-color: var(--primary-container); color: var(--on-primary-container);">
                      <span class="material-symbols-outlined text-[18px]">add</span>
                      <span>Thêm bộ phận</span>
                    </button>
                  </div>

                  <!-- DANH SÁCH BỘ PHẬN CON (CÁC VÙNG DROP-ZONE KÉO THẢ) -->
                  <div class="flex flex-col gap-2.5 mt-1" id="teamDropZonesContainer">
                    ${(!selectedDept.teams || selectedDept.teams.length === 0) ? `
                      <div class="p-6 rounded-2xl text-center text-[12.5px] text-[#817663] bg-[#f8f9ff] border border-dashed border-[#e2e8f0]" style="background-color: var(--background); border-color: var(--border);">
                        Chưa có bộ phận con nào trong phòng ban này. Nhập tên và mã ở trên để tạo bộ phận đầu tiên.
                      </div>
                    ` : selectedDept.teams.map(t => {
                      const isEditingThisTeam = this.editingTeamId === t.id;
                      const membersInTeam = selectedDeptUsers.filter(u => u.teamId === t.id && u.id !== deptManager?.id);

                      if (isEditingThisTeam) {
                        return `
                          <div class="p-3 rounded-2xl bg-[#fffbeb] border border-[#d6a52a] flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shadow-sm" style="background-color: var(--primary-soft); border-color: var(--primary);">
                            <input type="text" id="inputEditTeamNameView_${t.id}" value="${esc(t.name)}" class="flex-1 h-9 px-3 rounded-xl border border-[#e2e8f0] text-[13px] bg-white text-[#0d1c2f] outline-none focus:border-[#d6a52a]" placeholder="Tên bộ phận *" />
                            <input type="text" id="inputEditTeamCodeView_${t.id}" value="${esc(t.code || '')}" class="w-full sm:w-28 h-9 px-3 rounded-xl border border-[#e2e8f0] text-[13px] uppercase bg-white text-[#0d1c2f] outline-none focus:border-[#d6a52a]" placeholder="Mã (VD: CSKH)" />
                            <div class="flex items-center gap-2 justify-end shrink-0">
                              <button type="button" class="btn-save-edit-team-view px-3.5 py-1.5 rounded-xl text-[12px] font-bold shadow-2xs cursor-pointer" style="background-color: var(--primary-container); color: var(--on-primary-container);" data-team-id="${t.id}">Lưu</button>
                              <button type="button" class="btn-cancel-edit-team-view px-3 py-1.5 rounded-xl text-[12px] text-gray-500 hover:bg-gray-200 transition-all cursor-pointer" data-team-id="${t.id}">Hủy</button>
                            </div>
                          </div>
                        `;
                      }

                      return `
                        <!-- DROPZONE BỘ PHẬN CON: NHẬN THẢ NHÂN VIÊN VÀ CÓ NÚT THÊM NHÂN SỰ -->
                        <div class="team-drop-card p-3.5 sm:p-4 rounded-2xl bg-white border border-[#e2e8f0] flex flex-col gap-2.5 shadow-2xs hover:border-[#d6a52a] transition-all relative" data-team-id="${t.id}" style="background-color: var(--card); border-color: var(--border);">
                          
                          <div class="flex items-center justify-between flex-wrap gap-2">
                            <div class="flex items-center gap-3 min-w-0">
                              <span class="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-[11.5px] font-mono-data shrink-0 shadow-2xs" style="background-color: var(--primary-soft); color: var(--primary); border: 1px solid var(--border);">
                                ${esc(t.code || 'TEAM')}
                              </span>
                              <div class="min-w-0">
                                <div class="text-[14px] font-bold text-[#0d1c2f] truncate flex items-center gap-2" style="color: var(--text);">
                                  <span>${esc(t.name)}</span>
                                  <span class="text-[11px] font-semibold text-gray-400">(${membersInTeam.length} nhân sự)</span>
                                </div>
                                <div class="text-[11.5px] text-[#64748b] truncate mt-0.5 flex items-center gap-1.5" style="color: var(--text-muted);">
                                  <span class="material-symbols-outlined text-[14px]">arrow_downward</span>
                                  <span>Thả nhân viên vào đây để phân vào bộ phận này</span>
                                </div>
                              </div>
                            </div>
                            
                            <div class="flex items-center gap-1.5 shrink-0">
                              <!-- NÚT 1-CHẠM THÊM NHÂN SỰ VÀO BỘ PHẬN NÀY -->
                              <button type="button" class="btn-quick-add-member px-3 py-1.5 rounded-xl border border-amber-200 text-amber-800 bg-amber-50 hover:bg-amber-100 font-bold text-[11.5px] flex items-center gap-1 min-h-[36px] transition-colors shadow-2xs cursor-pointer" data-team-id="${t.id}" title="Thêm nhân sự vào bộ phận ${esc(t.name)}">
                                <span class="material-symbols-outlined text-[16px]">person_add</span>
                                <span>Thêm nhân viên</span>
                              </button>

                              <button type="button" class="btn-edit-team-view p-2 rounded-xl text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer" data-team-id="${t.id}" title="Chỉnh sửa bộ phận này">
                                <span class="material-symbols-outlined text-[18px]">edit</span>
                              </button>
                              <button type="button" class="btn-delete-team-view p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer" data-team-id="${t.id}" title="Xóa bộ phận này">
                                <span class="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </div>
                          </div>

                          <!-- DANH SÁCH NHÂN SỰ ĐANG TRỰC THUỘC BỘ PHẬN NÀY (CÓ NÚT GỠ RA NHANH) -->
                          <div class="pt-2 border-t border-[#f1f5f9] flex items-center gap-2 flex-wrap" style="border-color: var(--border);">
                            ${membersInTeam.length === 0 ? `
                              <span class="text-[11.5px] text-[#94a3b8] italic">Chưa có nhân sự nào trong bộ phận này.</span>
                            ` : membersInTeam.map(m => `
                              <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] text-[12px] font-medium shadow-2xs" style="background-color: var(--background); border-color: var(--border);">
                                <img src="${m.avatar}" class="w-5 h-5 rounded-full object-cover shrink-0" />
                                <span class="font-bold text-[#0d1c2f] truncate max-w-[130px]" style="color: var(--text);">${esc(m.name)}</span>
                                <button type="button" class="btn-remove-user-from-team text-gray-400 hover:text-rose-600 p-0.5 rounded-full transition-colors cursor-pointer" data-user-id="${m.id}" data-team-id="${t.id}" title="Gỡ ${esc(m.name)} khỏi bộ phận này về Toàn phòng">
                                  &times;
                                </button>
                              </div>
                            `).join('')}
                          </div>

                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>

                <!-- DANH SÁCH NHÂN SỰ ĐANG LÀM VIỆC TẠI PHÒNG NÀY (HỖ TRỢ DRAGGABLE & SELECTOR TRỰC TIẾP) -->
                <div class="flex flex-col gap-3 pt-4 border-t border-[#f1f5f9]" style="border-color: var(--border);">
                  <div class="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h4 class="font-bold text-[14.5px] text-[#0d1c2f] flex items-center gap-2" style="color: var(--text);">
                        <span>Nhân Sự Thuộc Phòng (${selectedDeptUsers.length})</span>
                      </h4>
                      <span class="text-[11.5px] text-[#64748b]" style="color: var(--text-muted);">
                        Trưởng phòng quản trị điều hành chung toàn bộ các bộ phận con. Chuyên viên trực thuộc có thể phân bổ vào từng bộ phận.
                      </span>
                    </div>

                    <button type="button" id="btnAddMemberToDept" class="px-3.5 py-1.5 rounded-xl border border-[#e2e8f0] text-[12px] font-bold text-[#0d1c2f] hover:bg-gray-50 flex items-center gap-1.5 min-h-[38px] transition-colors shadow-2xs cursor-pointer" style="color: var(--text); border-color: var(--border);">
                      <span class="material-symbols-outlined text-[18px]">person_add</span>
                      <span>Cấp tài khoản mới</span>
                    </button>
                  </div>

                  <!-- 1. THẺ TRƯỞNG PHÒNG ĐẶC BIỆT (QUẢN TRỊ TOÀN PHÒNG - CỐ ĐỊNH, KHÔNG KÉO THẢ VÀO BỘ PHẬN NHỎ) -->
                  ${deptManager ? `
                    <div class="p-4 rounded-2xl border-2 border-[#d6a52a]/60 bg-gradient-to-r from-[#fffbeb] via-white to-[#fffbeb] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                      <div class="flex items-center gap-3.5 min-w-0">
                        <div class="relative shrink-0">
                          <img src="${deptManager.avatar}" alt="${deptManager.name}" class="w-12 h-12 rounded-2xl object-cover ring-2 ring-[#d6a52a] shadow-xs" />
                          <span class="absolute -top-1.5 -right-1.5 bg-[#d6a52a] text-[#533d00] text-[12px] font-black rounded-full px-1.5 py-0.2 shadow-xs">👑</span>
                        </div>

                        <div class="min-w-0 flex-1">
                          <div class="flex items-center gap-2 flex-wrap">
                            <span class="text-[14.5px] font-bold text-[#0d1c2f]" style="color: var(--text);">${esc(deptManager.name)}</span>
                            <span class="text-[10.5px] font-extrabold px-2 py-0.5 rounded-full bg-[#fef3c7] text-[#92400e] border border-amber-300">
                              👑 Trưởng Phòng
                            </span>
                            <span class="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                              Toàn phòng
                            </span>
                          </div>
                          <div class="text-[12px] text-[#64748b] truncate mt-0.5" style="color: var(--text-muted);">
                            ${esc(deptManager.title || 'Trưởng phòng')} • <span class="font-mono-data">${esc(deptManager.email || deptManager.username || '')}</span>
                            ${deptManager.phone ? ` • <span class="font-mono-data">${esc(deptManager.phone)}</span>` : ''}
                          </div>
                        </div>
                      </div>

                      <div class="flex items-center gap-2 self-start sm:self-center shrink-0">
                        <span class="text-[11.5px] font-bold text-[#795900] bg-white/90 border border-amber-200 px-3 py-1.5 rounded-xl shadow-2xs flex items-center gap-1.5">
                          <span class="material-symbols-outlined text-[16px] text-[#d6a52a]">verified</span>
                          <span>Quản trị Toàn phòng</span>
                        </span>
                        <button type="button" class="btn-edit-dept-member px-3 py-1.5 rounded-xl border border-amber-300 text-amber-800 hover:bg-amber-100/70 font-bold text-[11.5px] flex items-center gap-1 transition-all cursor-pointer shadow-2xs shrink-0" data-user-id="${deptManager.id}" title="Chỉnh sửa thông tin Trưởng phòng">
                          <span class="material-symbols-outlined text-[16px]">edit</span>
                          <span>Sửa</span>
                        </button>
                      </div>
                    </div>
                  ` : ''}

                  <!-- 2. THẺ PHÓ TRƯỞNG PHÒNG (NẾU CÓ) -->
                  ${deptDeputies.map(deputy => `
                    <div class="p-4 rounded-2xl border-2 border-indigo-200/80 bg-gradient-to-r from-indigo-50/60 via-white to-indigo-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                      <div class="flex items-center gap-3.5 min-w-0">
                        <div class="relative shrink-0">
                          <img src="${deputy.avatar}" alt="${deputy.name}" class="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-300 shadow-xs" />
                          <span class="absolute -top-1.5 -right-1.5 bg-indigo-500 text-white text-[12px] font-black rounded-full px-1.5 py-0.2 shadow-xs">⭐</span>
                        </div>

                        <div class="min-w-0 flex-1">
                          <div class="flex items-center gap-2 flex-wrap">
                            <span class="text-[14.5px] font-bold text-[#0d1c2f]" style="color: var(--text);">${esc(deputy.name)}</span>
                            <span class="text-[10.5px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                              ⭐ Phó Phòng
                            </span>
                            <span class="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                              Toàn phòng
                            </span>
                          </div>
                          <div class="text-[12px] text-[#64748b] truncate mt-0.5" style="color: var(--text-muted);">
                            ${esc(deputy.title || 'Phó phòng')} • <span class="font-mono-data">${esc(deputy.email || deputy.username || '')}</span>
                            ${deputy.phone ? ` • <span class="font-mono-data">${esc(deputy.phone)}</span>` : ''}
                          </div>
                        </div>
                      </div>

                      <div class="flex items-center gap-2 self-start sm:self-center shrink-0">
                        <span class="text-[11.5px] font-bold text-indigo-800 bg-white/90 border border-indigo-200 px-3 py-1.5 rounded-xl shadow-2xs flex items-center gap-1.5">
                          <span class="material-symbols-outlined text-[16px] text-indigo-600">stars</span>
                          <span>Phó Phòng</span>
                        </span>
                        <button type="button" class="btn-edit-dept-member px-3 py-1.5 rounded-xl border border-indigo-300 text-indigo-800 hover:bg-indigo-100/70 font-bold text-[11.5px] flex items-center gap-1 transition-all cursor-pointer shadow-2xs shrink-0" data-user-id="${deputy.id}" title="Chỉnh sửa thông tin Phó phòng">
                          <span class="material-symbols-outlined text-[16px]">edit</span>
                          <span>Sửa</span>
                        </button>
                      </div>
                    </div>
                  `).join('')}

                  <!-- 3. TIÊU ĐỀ CHUYÊN VIÊN TRỰC THUỘC (CÓ THỂ KÉO THẢ VÀO BỘ PHẬN) -->
                  <div class="flex items-center justify-between flex-wrap gap-2 pt-2">
                    <span class="text-[13px] font-bold text-[#0d1c2f] flex items-center gap-2" style="color: var(--text);">
                      <span>Chuyên Viên / Nhân Sự Trực Thuộc (${regularStaff.length})</span>
                      <span class="text-[10.5px] font-normal text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        🖐️ Giữ &amp; Kéo thả vào bộ phận ở trên
                      </span>
                    </span>
                  </div>

                  <!-- LƯỚI THẺ CHUYÊN VIÊN (DRAGGABLE = TRUE) -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3" id="departmentUsersGrid">
                    ${(selectedDeptUsers.length === 0) ? `
                      <div class="col-span-1 sm:col-span-2 p-8 rounded-3xl text-center bg-gradient-to-b from-[#fffbeb]/60 to-white border border-dashed border-[#d6a52a] flex flex-col items-center justify-center gap-3 shadow-xs">
                        <div class="w-14 h-14 rounded-2xl bg-[#fffbeb] text-[#795900] flex items-center justify-center ring-4 ring-[#fef3c7]">
                          <span class="material-symbols-outlined text-[30px]">person_add</span>
                        </div>
                        <div class="max-w-md">
                          <h4 class="font-bold text-[15px] text-[#0d1c2f]">Phòng ban này chưa có nhân sự nào</h4>
                          <p class="text-[12px] text-[#817663] mt-1">
                            Hãy cấp tài khoản Trưởng phòng, Phó phòng hoặc Nhân viên đầu tiên để kích hoạt vận hành cho ${esc(selectedDept.name)}.
                          </p>
                        </div>
                        <button type="button" class="btn-empty-add-member px-4 py-2.5 rounded-xl font-bold text-[12.5px] shadow-xs flex items-center gap-2 cursor-pointer transition-all hover:scale-105" style="background-color: var(--primary-container); color: var(--on-primary-container);">
                          <span class="material-symbols-outlined text-[18px]">add_circle</span>
                          <span>Cấp Tài Khoản Nhân Sự Đầu Tiên</span>
                        </button>
                      </div>
                    ` : (regularStaff.length === 0 ? `
                      <div class="col-span-2 p-6 rounded-2xl text-center text-[12.5px] text-[#817663] bg-[#f8f9ff] border border-dashed border-[#e2e8f0]">
                        Chưa có chuyên viên nào ngoài lãnh đạo phòng.
                      </div>
                    ` : regularStaff.map(u => {
                      const team = (selectedDept.teams || []).find(t => t.id === u.teamId);
                      return `
                        <!-- THẺ NHÂN VIÊN CÓ THỂ KÉO THẢ (DRAGGABLE) -->
                        <div class="member-drag-card p-3.5 rounded-2xl border border-[#e2e8f0] bg-white flex flex-col gap-2.5 shadow-2xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing hover:border-[#d6a52a]" draggable="true" data-user-id="${u.id}" style="background-color: var(--card); border-color: var(--border);">
                          
                          <div class="flex items-center justify-between gap-2">
                            <div class="flex items-center gap-3 min-w-0">
                              <div class="relative shrink-0">
                                <img src="${u.avatar}" alt="${u.name}" class="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-2xs" />
                                <span class="material-symbols-outlined absolute -bottom-1 -right-1 bg-amber-100 text-amber-800 text-[13px] rounded-full p-0.5 shadow-2xs">drag_indicator</span>
                              </div>

                              <div class="min-w-0 flex-1">
                                <div class="text-[13.5px] font-bold text-[#0d1c2f] truncate" style="color: var(--text);">${esc(u.name)}</div>
                                <div class="text-[11.5px] text-[#64748b] truncate mt-0.5" style="color: var(--text-muted);">
                                  ${esc(u.title || 'Chuyên viên')} • <span class="font-mono-data">${esc(u.email || u.username || '')}</span>
                                </div>
                              </div>
                            </div>

                            <button type="button" class="btn-edit-dept-member p-1.5 rounded-xl text-gray-400 hover:text-amber-800 hover:bg-amber-50 transition-colors cursor-pointer shrink-0" data-user-id="${u.id}" title="Chỉnh sửa thông tin / phân quyền">
                              <span class="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                          </div>

                          <!-- BỘ CHỌN NHANH BỘ PHẬN NGAY TRÊN THẺ NHÂN VIÊN -->
                          <div class="pt-2 border-t border-[#f1f5f9] flex items-center justify-between gap-2" style="border-color: var(--border);">
                            <span class="text-[11px] font-bold text-[#64748b] shrink-0" style="color: var(--text-muted);">Bộ phận:</span>
                            <select class="select-user-team-direct h-8 px-2.5 rounded-xl border border-[#e2e8f0] text-[11.5px] font-bold outline-none bg-[#f8f9ff] text-[#0d1c2f] focus:border-[#d6a52a] cursor-pointer max-w-[190px] truncate" data-user-id="${u.id}">
                              <option value="" ${!u.teamId ? 'selected' : ''}>-- Toàn phòng (Chưa phân tổ) --</option>
                              ${(selectedDept.teams || []).map(tm => `
                                <option value="${tm.id}" ${u.teamId === tm.id ? 'selected' : ''}>[${esc(tm.code || 'TEAM')}] ${esc(tm.name)}</option>
                              `).join('')}
                            </select>
                          </div>

                        </div>
                      `;
                    }).join(''))}
                  </div>
                </div>

              </div>
            ` : `
              <div class="bg-white rounded-3xl p-10 border border-[#e2e8f0] text-center text-gray-400">
                Chọn một phòng ban ở danh sách bên trái để xem và thiết lập cấu trúc.
              </div>
            `}
          </div>

        </div>

        <!-- 3. MODAL GÁN NHÂN SỰ NHANH VÀO BỘ PHẬN (KHI BẤM NÚT "THÊM NHÂN VIÊN") -->
        <div id="quickAssignModalContainer"></div>

      </div>
    `;

    this.bindEvents(selectedDept);

    if (prevScrollY > 0) {
      window.scrollTo({ top: prevScrollY, behavior: 'instant' });
      requestAnimationFrame(() => {
        window.scrollTo({ top: prevScrollY, behavior: 'instant' });
      });
    }
  }

  // Mở popup gán nhân sự nhanh vào bộ phận con
  openQuickAssignModal(teamId, dept) {
    const modalBox = this.container.querySelector('#quickAssignModalContainer');
    if (!modalBox || !dept) return;

    rung(10);
    const targetTeam = (dept.teams || []).find(t => t.id === teamId);
    if (!targetTeam) return;

    const deptUsers = store.getDepartmentUsers(dept.id);
    const assignableUsers = deptUsers.filter(u => u.id !== dept.managerId && u.role !== 'MANAGER' && u.role !== 'DEPUTY_MANAGER');

    modalBox.innerHTML = `
      <div class="modal-overlay fixed inset-0 z-[110] bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 active" id="quickAssignOverlay">
        <div class="modal-card bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-[#e2e8f0] max-h-[85vh] overflow-y-auto" style="background-color: var(--card); border-color: var(--border);">
          
          <!-- HEADER -->
          <div class="flex items-center justify-between pb-3 border-b border-[#f1f5f9] mb-4" style="border-color: var(--border);">
            <div class="flex items-center gap-2.5">
              <div class="w-10 h-10 rounded-2xl flex items-center justify-center font-bold shadow-xs shrink-0" style="background-color: var(--primary-soft); color: var(--primary);">
                <span class="material-symbols-outlined text-[22px]">group_add</span>
              </div>
              <div class="min-w-0">
                <h3 class="font-bold text-[16px] text-[#0d1c2f] truncate" style="color: var(--text);">Thêm Nhân Sự Vào Bộ Phận</h3>
                <span class="text-[12px] font-semibold truncate block" style="color: var(--primary);">${esc(targetTeam.name)} (${esc(targetTeam.code || 'TEAM')})</span>
              </div>
            </div>
            <button type="button" class="text-gray-400 hover:text-gray-700 text-2xl font-bold min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl hover:bg-gray-100 cursor-pointer" id="btnCloseQuickAssignModal">&times;</button>
          </div>

          <!-- DANH SÁCH NHÂN SỰ PHÒNG BAN -->
          <p class="text-[12px] text-[#64748b] mb-3" style="color: var(--text-muted);">
            Bấm nút <strong>"+ Gán vào bộ phận"</strong> để đưa nhân viên vào <strong>${esc(targetTeam.name)}</strong>:
          </p>

          <div class="flex flex-col gap-2.5 max-h-[400px] overflow-y-auto pr-1">
            ${assignableUsers.length === 0 ? `
              <div class="p-6 text-center text-[12px] text-gray-500 bg-gray-50 rounded-xl">Không có chuyên viên nào khả dụng để gán vào bộ phận.</div>
            ` : assignableUsers.map(u => {
              const isAlreadyInTeam = u.teamId === targetTeam.id;
              const currentTeam = (dept.teams || []).find(t => t.id === u.teamId);

              return `
                <div class="p-3 rounded-2xl border ${isAlreadyInTeam ? 'border-amber-300 bg-amber-50/70' : 'border-[#e2e8f0] bg-white'} flex items-center justify-between gap-3 shadow-2xs">
                  <div class="flex items-center gap-2.5 min-w-0">
                    <img src="${u.avatar}" class="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-gray-200" />
                    <div class="min-w-0">
                      <div class="text-[13px] font-bold text-[#0d1c2f] truncate">${esc(u.name)}</div>
                      <div class="text-[11px] text-[#64748b] truncate">
                        ${isAlreadyInTeam ? '<span class="text-emerald-700 font-bold">✓ Đang trong bộ phận này</span>' : (currentTeam ? `Thuộc: ${esc(currentTeam.name)}` : 'Toàn phòng (Chưa phân tổ)')}
                      </div>
                    </div>
                  </div>

                  <div class="shrink-0">
                    ${isAlreadyInTeam ? `
                      <button type="button" class="btn-modal-unassign-user px-3 py-1.5 rounded-xl text-[11.5px] font-bold border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors" data-user-id="${u.id}">
                        Gỡ ra
                      </button>
                    ` : `
                      <button type="button" class="btn-modal-assign-user px-3 py-1.5 rounded-xl text-[11.5px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 cursor-pointer transition-colors flex items-center gap-1" data-user-id="${u.id}">
                        <span class="material-symbols-outlined text-[15px]">add</span>
                        <span>Gán vào</span>
                      </button>
                    `}
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <div class="pt-3 border-t border-[#f1f5f9] mt-3 flex justify-end">
            <button type="button" id="btnDoneQuickAssign" class="px-5 py-2 rounded-xl text-[12.5px] font-bold shadow-xs cursor-pointer" style="background-color: var(--primary-container); color: var(--on-primary-container);">
              Xong
            </button>
          </div>

        </div>
      </div>
    `;

    // Bind events cho modal
    const overlay = modalBox.querySelector('#quickAssignOverlay');
    const btnClose = modalBox.querySelector('#btnCloseQuickAssignModal');
    const btnDone = modalBox.querySelector('#btnDoneQuickAssign');

    const closeModal = () => {
      rung(10);
      modalBox.innerHTML = '';
      this.render(dept.id);
      if (this.onUpdated) this.onUpdated();
    };

    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnDone) btnDone.addEventListener('click', closeModal);
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
      });
    }

    // Nút gán vào
    modalBox.querySelectorAll('.btn-modal-assign-user').forEach(btn => {
      btn.addEventListener('click', () => {
        rung(15);
        const uId = btn.dataset.userId;
        store.updateUser(uId, { teamId: targetTeam.id });
        toast(`Đã thêm nhân viên vào ${targetTeam.name}!`, 'success');
        this.openQuickAssignModal(teamId, dept); // Re-render modal
      });
    });

    // Nút gỡ ra
    modalBox.querySelectorAll('.btn-modal-unassign-user').forEach(btn => {
      btn.addEventListener('click', () => {
        rung(10);
        const uId = btn.dataset.userId;
        store.updateUser(uId, { teamId: '' });
        toast(`Đã chuyển nhân viên về Toàn phòng!`, 'info');
        this.openQuickAssignModal(teamId, dept); // Re-render modal
      });
    });
  }

  bindEvents(currentDept) {
    // 1. Chuyển đổi chọn phòng ban
    this.container.querySelectorAll('.dept-item-card').forEach(card => {
      card.addEventListener('click', () => {
        const dId = card.dataset.deptId;
        rung(10);
        this.editingTeamId = null;
        this.isEditingDept = false;
        if (auth.canSwitchDepartment()) {
          auth.switchDepartment(dId);
        }
        this.render(dId);
      });
    });

    // 2. Tìm kiếm phòng ban
    const inputSearch = this.container.querySelector('#inputSearchDept');
    if (inputSearch) {
      inputSearch.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.trim();
        this.render(this.selectedDeptId);
      });
    }

    // 3. Toggle Form Thêm Phòng Ban
    const btnHeroAdd = this.container.querySelector('#btnHeroAddDept');
    const btnSideAdd = this.container.querySelector('#btnToggleAddDeptSide');
    const btnCancelAddTop = this.container.querySelector('#btnCancelAddDeptTop');
    const btnCancelAddView = this.container.querySelector('#btnCancelAddDeptView');
    const boxAdd = this.container.querySelector('#boxAddDeptFormView');
    const newDeptColor = this.container.querySelector('#newDeptColorView');
    const newDeptColorText = this.container.querySelector('#newDeptColorTextView');

    if (newDeptColor && newDeptColorText) {
      newDeptColor.addEventListener('input', () => {
        newDeptColorText.textContent = newDeptColor.value;
      });
    }

    const openAddForm = () => {
      rung(10);
      this.isAddingDept = true;
      if (boxAdd) boxAdd.classList.remove('hidden');
      const input = this.container.querySelector('#newDeptNameView');
      setTimeout(() => input?.focus(), 50);
    };

    const closeAddForm = () => {
      this.isAddingDept = false;
      if (boxAdd) boxAdd.classList.add('hidden');
    };

    if (btnHeroAdd) btnHeroAdd.addEventListener('click', openAddForm);
    if (btnSideAdd) btnSideAdd.addEventListener('click', openAddForm);
    if (btnCancelAddTop) btnCancelAddTop.addEventListener('click', closeAddForm);
    if (btnCancelAddView) btnCancelAddView.addEventListener('click', closeAddForm);

    // 4. Submit Thêm Phòng Ban
    const btnSubmitAdd = this.container.querySelector('#btnSubmitAddDeptView');
    if (btnSubmitAdd) {
      btnSubmitAdd.addEventListener('click', () => {
        rung(15);
        const name = this.container.querySelector('#newDeptNameView')?.value.trim();
        const code = this.container.querySelector('#newDeptCodeView')?.value.trim();
        const color = this.container.querySelector('#newDeptColorView')?.value;
        const managerId = this.container.querySelector('#newDeptManagerView')?.value;

        if (!name) {
          toast('Vui lòng nhập tên phòng ban!', 'warning');
          return;
        }

        const res = store.createDepartment({
          name,
          code: code || name.slice(0, 4).toUpperCase(),
          color: color || '#D6A52A',
          managerId: managerId || '',
          teams: []
        });

        if (res.success) {
          toast(`Đã tạo phòng ban mới: ${name}`, 'success');
          this.isAddingDept = false;
          this.render(res.department.id);
          if (this.onUpdated) this.onUpdated();
        } else {
          toast(res.message, 'warning');
        }
      });
    }

    // 5. Toggle & Cancel Form Chỉnh sửa Phòng Ban
    const btnToggleEditDept = this.container.querySelector('#btnToggleEditDeptView');
    const boxEditDept = this.container.querySelector('#boxEditDeptFormView');
    const btnCancelEditTop = this.container.querySelector('#btnCancelEditDeptTopView');
    const btnCancelEditView = this.container.querySelector('#btnCancelEditDeptView');
    const editColor = this.container.querySelector('#editDeptColorView');
    const editColorText = this.container.querySelector('#editDeptColorTextView');

    if (editColor && editColorText) {
      editColor.addEventListener('input', () => {
        editColorText.textContent = editColor.value;
      });
    }

    if (btnToggleEditDept && boxEditDept) {
      btnToggleEditDept.addEventListener('click', () => {
        this.isEditingDept = !this.isEditingDept;
        boxEditDept.classList.toggle('hidden', !this.isEditingDept);
      });
    }

    const closeEditDept = () => {
      this.isEditingDept = false;
      if (boxEditDept) boxEditDept.classList.add('hidden');
    };

    if (btnCancelEditTop) btnCancelEditTop.addEventListener('click', closeEditDept);
    if (btnCancelEditView) btnCancelEditView.addEventListener('click', closeEditDept);

    // 6. Submit Chỉnh sửa Phòng Ban
    const btnSubmitEdit = this.container.querySelector('#btnSubmitEditDeptView');
    if (btnSubmitEdit && currentDept) {
      btnSubmitEdit.addEventListener('click', () => {
        rung(15);
        const name = this.container.querySelector('#editDeptNameView')?.value.trim();
        const code = this.container.querySelector('#editDeptCodeView')?.value.trim();
        const color = this.container.querySelector('#editDeptColorView')?.value;
        const unit = this.container.querySelector('#editDeptUnitView')?.value.trim();
        const managerId = this.container.querySelector('#editDeptManagerView')?.value;

        if (!name) {
          toast('Vui lòng nhập tên phòng ban!', 'warning');
          return;
        }

        const res = store.updateDepartment(currentDept.id, {
          name,
          code: code || currentDept.code,
          badge: code || currentDept.badge || currentDept.code,
          unit: unit || currentDept.unit,
          managerId: managerId !== undefined ? managerId : currentDept.managerId,
          color: color || currentDept.color
        });

        // Nếu chọn một nhân sự làm Trưởng phòng mà người đó chưa có role MANAGER -> Tự động cập nhật chức danh
        if (managerId) {
          const selectedManagerUser = store.getUserById(managerId);
          if (selectedManagerUser && selectedManagerUser.role !== 'MANAGER') {
            store.updateUser(managerId, { role: 'MANAGER', badge: 'Trưởng phòng', teamId: '' });
          }
        }

        if (res.success) {
          toast(`Đã cập nhật phòng ban: ${name}`, 'success');
          this.isEditingDept = false;
          this.render(currentDept.id);
          if (this.onUpdated) this.onUpdated();
        } else {
          toast(res.message, 'warning');
        }
      });
    }

    // 7. Xóa Phòng Ban
    const btnDeleteDept = this.container.querySelector('#btnDeleteDeptView');
    if (btnDeleteDept && currentDept) {
      btnDeleteDept.addEventListener('click', () => {
        xacNhan2Lan('del_dept_view_' + currentDept.id, `Xóa phòng ban ${currentDept.name}`, () => {
          store.deleteDepartment(currentDept.id);
          toast(`Đã xóa phòng ban ${currentDept.name}!`, 'success');
          this.selectedDeptId = null;
          this.editingTeamId = null;
          this.isEditingDept = false;
          this.render();
          if (this.onUpdated) this.onUpdated();
        });
      });
    }

    // 8. Submit Thêm Bộ Phận Con (Team)
    const btnAddTeam = this.container.querySelector('#btnAddTeamSubmitView');
    const inputTeamName = this.container.querySelector('#inputNewTeamNameView');
    const inputTeamCode = this.container.querySelector('#inputNewTeamCodeView');

    const handleAddTeam = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (!currentDept) return;

      rung(15);
      const teamName = inputTeamName?.value.trim();
      const teamCode = inputTeamCode?.value.trim();

      if (!teamName) {
        toast('Vui lòng nhập tên bộ phận con (VD: CSKH, Marketing...)!', 'warning');
        inputTeamName?.focus();
        return;
      }

      const res = store.addTeamToDepartment(currentDept.id, {
        name: teamName,
        code: teamCode || teamName.slice(0, 4).toUpperCase()
      });

      if (res.success) {
        toast(`Đã thêm bộ phận "${teamName}" vào ${currentDept.name}!`, 'success');
        if (inputTeamName) inputTeamName.value = '';
        if (inputTeamCode) inputTeamCode.value = '';
        // Re-render đúng phòng ban này và duy trì vị trí cuộn
        this.render(currentDept.id);
      } else {
        toast(res.message, 'warning');
      }
    };

    if (btnAddTeam) {
      btnAddTeam.addEventListener('click', handleAddTeam);
    }
    if (inputTeamName) {
      inputTeamName.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAddTeam(e);
        }
      });
    }
    if (inputTeamCode) {
      inputTeamCode.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAddTeam(e);
        }
      });
    }

    // 9. Bật Chỉnh sửa Inline cho Team
    this.container.querySelectorAll('.btn-edit-team-view').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const teamId = btn.dataset.teamId;
        this.editingTeamId = teamId;
        this.render(currentDept.id);
      });
    });

    // 10. Lưu Chỉnh sửa Inline cho Team
    this.container.querySelectorAll('.btn-save-edit-team-view').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        rung(15);
        const teamId = btn.dataset.teamId;
        if (!currentDept || !teamId) return;

        const nameInput = this.container.querySelector(`#inputEditTeamNameView_${teamId}`);
        const codeInput = this.container.querySelector(`#inputEditTeamCodeView_${teamId}`);
        const name = nameInput?.value.trim();
        const code = codeInput?.value.trim();

        if (!name) {
          toast('Vui lòng nhập tên bộ phận con!', 'warning');
          return;
        }

        const res = store.updateTeamInDepartment(currentDept.id, teamId, {
          name,
          code: code || name.slice(0, 4).toUpperCase()
        });

        if (res.success) {
          toast(`Đã cập nhật bộ phận: ${name}`, 'success');
          this.editingTeamId = null;
          this.render(currentDept.id);
          if (this.onUpdated) this.onUpdated();
        } else {
          toast(res.message, 'warning');
        }
      });
    });

    // 11. Hủy Chỉnh sửa Inline cho Team
    this.container.querySelectorAll('.btn-cancel-edit-team-view').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.editingTeamId = null;
        this.render(currentDept.id);
      });
    });

    // 12. Phím tắt Enter / Escape khi đang sửa inline team
    if (this.editingTeamId && currentDept) {
      const activeNameInput = this.container.querySelector(`#inputEditTeamNameView_${this.editingTeamId}`);
      const activeCodeInput = this.container.querySelector(`#inputEditTeamCodeView_${this.editingTeamId}`);
      const handleKey = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const saveBtn = this.container.querySelector(`.btn-save-edit-team-view[data-team-id="${this.editingTeamId}"]`);
          if (saveBtn) saveBtn.click();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          this.editingTeamId = null;
          this.render(currentDept.id);
        }
      };
      if (activeNameInput) {
        activeNameInput.addEventListener('keydown', handleKey);
        setTimeout(() => activeNameInput?.focus?.(), 50);
      }
      if (activeCodeInput) {
        activeCodeInput.addEventListener('keydown', handleKey);
      }
    }

    // 13. Xóa Team
    this.container.querySelectorAll('.btn-delete-team-view').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const teamId = btn.dataset.teamId;
        if (!currentDept || !teamId) return;

        xacNhan2Lan('del_team_view_' + teamId, 'Xóa bộ phận này khỏi phòng ban', () => {
          store.removeTeamFromDepartment(currentDept.id, teamId);
          toast('Đã xóa bộ phận con thành công!', 'success');
          if (this.editingTeamId === teamId) this.editingTeamId = null;
          this.render(currentDept.id);
          if (this.onUpdated) this.onUpdated();
        });
      });
    });

    // 14. Nút Cấp tài khoản mới cho phòng này
    const btnAddMember = this.container.querySelector('#btnAddMemberToDept');
    if (btnAddMember && currentDept) {
      btnAddMember.addEventListener('click', () => {
        rung(10);
        if (this.onOpenMemberModal) this.onOpenMemberModal(currentDept.id);
      });
    }

    // 14b. Nút Cấp tài khoản khi phòng chưa có nhân sự (Empty State)
    this.container.querySelectorAll('.btn-empty-add-member').forEach(btn => {
      btn.addEventListener('click', () => {
        rung(10);
        if (this.onOpenMemberModal && currentDept) this.onOpenMemberModal(currentDept.id);
      });
    });

    // 14c. Nút Chỉnh sửa thông tin nhân sự / thăng chức trực tiếp
    this.container.querySelectorAll('.btn-edit-dept-member').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        rung(10);
        const uId = btn.dataset.userId;
        if (this.onOpenMemberModal && currentDept && uId) {
          this.onOpenMemberModal(currentDept.id, uId);
        }
      });
    });

    // 15. NÚT "+ THÊM NHÂN VIÊN" TRÊN TỪNG BỘ PHẬN CON (MỞ MODAL GÁN NHANH)
    this.container.querySelectorAll('.btn-quick-add-member').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const teamId = btn.dataset.teamId;
        if (currentDept && teamId) {
          this.openQuickAssignModal(teamId, currentDept);
        }
      });
    });

    // 16. NÚT GỠ NHÂN VIÊN KHỎI BỘ PHẬN (TRÊN THẺ BỘ PHẬN CON)
    this.container.querySelectorAll('.btn-remove-user-from-team').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        rung(10);
        const userId = btn.dataset.userId;
        const u = store.getUserById(userId);
        if (u) {
          store.updateUser(userId, { teamId: '' });
          toast(`Đã đưa ${u.name} về lại Toàn phòng!`, 'info');
          this.render(currentDept.id);
          if (this.onUpdated) this.onUpdated();
        }
      });
    });

    // 17. BỘ CHỌN NHANH BỘ PHẬN TRỰC TIẾP TRÊN THẺ NHÂN VIÊN (<select>)
    this.container.querySelectorAll('.select-user-team-direct').forEach(sel => {
      sel.addEventListener('change', (e) => {
        e.stopPropagation();
        rung(15);
        const userId = sel.dataset.userId;
        const newTeamId = sel.value;
        const u = store.getUserById(userId);
        if (u) {
          store.updateUser(userId, { teamId: newTeamId });
          const team = (currentDept.teams || []).find(t => t.id === newTeamId);
          toast(`Đã gán ${u.name} vào ${team ? team.name : 'Toàn phòng'}!`, 'success');
          this.render(currentDept.id);
          if (this.onUpdated) this.onUpdated();
        }
      });
    });

    // 18. TÍNH NĂNG KÉO THẢ (DRAG & DROP) NHÂN VIÊN VÀO BỘ PHẬN CON
    const dragCards = this.container.querySelectorAll('.member-drag-card');
    const dropZones = this.container.querySelectorAll('.team-drop-card');

    dragCards.forEach(card => {
      card.addEventListener('dragstart', (e) => {
        const userId = card.dataset.userId;
        e.dataTransfer.setData('text/plain', userId);
        e.dataTransfer.effectAllowed = 'move';
        card.classList.add('opacity-40', 'scale-95');
        rung(10);
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('opacity-40', 'scale-95');
      });
    });

    dropZones.forEach(zone => {
      zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        zone.classList.add('border-[#d6a52a]', 'bg-amber-50/80', 'ring-2', 'ring-[#d6a52a]/50');
      });

      zone.addEventListener('dragleave', () => {
        zone.classList.remove('border-[#d6a52a]', 'bg-amber-50/80', 'ring-2', 'ring-[#d6a52a]/50');
      });

      zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('border-[#d6a52a]', 'bg-amber-50/80', 'ring-2', 'ring-[#d6a52a]/50');
        rung(20);

        const userId = e.dataTransfer.getData('text/plain');
        const targetTeamId = zone.dataset.teamId;

        if (userId && targetTeamId && currentDept) {
          const user = store.getUserById(userId);
          const team = (currentDept.teams || []).find(t => t.id === targetTeamId);
          if (user && team) {
            if (user.id === currentDept.managerId || user.role === 'MANAGER' || user.role === 'DEPUTY_MANAGER') {
              toast('👑 Trưởng phòng phụ trách quản trị Toàn phòng, không phân bổ vào bộ phận con!', 'warning');
              return;
            }
            store.updateUser(userId, { teamId: targetTeamId });
            toast(`🎉 Đã kéo thả thành công: ${user.name} ➔ ${team.name}!`, 'success');
            this.render(currentDept.id);
            if (this.onUpdated) this.onUpdated();
          }
        }
      });
    });
  }
}



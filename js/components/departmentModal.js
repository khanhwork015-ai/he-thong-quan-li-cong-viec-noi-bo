/**
 * THANH VŨ MEDIC CS3 - DEPARTMENT & SUB-DEPARTMENT (TEAMS) MANAGEMENT MODAL
 * Dành riêng cho Quản Trị Viên (ADMIN):
 * - Toàn quyền Thêm / Sửa / Xóa Phòng Ban
 * - Toàn quyền Thêm / Sửa / Xóa các Bộ Phận Con (Teams) bên trong từng Phòng Ban
 * (Ví dụ: Phòng PTKH gồm các bộ phận Marketing, CSKH, Hỗ trợ)
 */

import { auth } from '../auth.js?v=4.9';
import { store } from '../store.js?v=4.9';
import { esc, toast, rung, xacNhan2Lan } from '../helpers.js?v=4.9';

export class DepartmentModal {
  constructor(containerId, onUpdated) {
    this.container = document.getElementById(containerId);
    this.onUpdated = onUpdated;
    this.selectedDeptId = null;
    this.editingTeamId = null; // Quản lý ID của team đang mở inline edit
    this.isEditingDept = false; // Quản lý trạng thái mở form sửa phòng ban
  }

  show(deptIdToSelect = null) {
    if (window.TVM_APP && typeof window.TVM_APP.switchNav === 'function') {
      window.TVM_APP.switchNav('phong-ban');
      if (deptIdToSelect && window.TVM_APP.departmentView) {
        window.TVM_APP.departmentView.render(deptIdToSelect);
      }
      return;
    }

    if (!this.container) return;
    if (!auth.canCRUDDepartments()) {
      toast('Chỉ Quản Trị Viên (Admin) mới có quyền quản lý phòng ban và bộ phận con!', 'warning');
      return;
    }

    rung(10);
    const depts = store.getAllDepartments();
    const allUsers = store.getAllUsers();
    const managers = allUsers.filter(u => u.role === 'MANAGER' || u.role === 'DEPUTY_MANAGER' || u.role === 'ADMIN');

    if (deptIdToSelect && deptIdToSelect !== this.selectedDeptId) {
      this.editingTeamId = null;
      this.isEditingDept = false;
    }

    this.selectedDeptId = deptIdToSelect || this.selectedDeptId || (depts[0] ? depts[0].id : null);
    const selectedDept = store.getDepartmentById(this.selectedDeptId) || depts[0];
    if (selectedDept) {
      this.selectedDeptId = selectedDept.id;
    }

    this.container.innerHTML = `
      <div class="modal-overlay fixed inset-0 z-[100] bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 active" id="deptModalOverlay">
        <div class="modal-card bg-white rounded-3xl p-4 sm:p-6 max-w-4xl w-full shadow-2xl border border-[#e2e8f0] h-[85vh] min-h-[580px] max-h-[720px] flex flex-col overflow-hidden gap-4 sm:gap-5" style="background-color: var(--card); border-color: var(--border);">
          
          <!-- HEADER: shrink-0 -->
          <div class="flex items-center justify-between pb-3.5 border-b border-[#f1f5f9] shrink-0" style="border-color: var(--border);">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl flex items-center justify-center font-bold shadow-xs shrink-0" style="background-color: var(--primary-soft); color: var(--primary);">
                <span class="material-symbols-outlined text-[22px]">domain</span>
              </div>
              <div class="min-w-0">
                <h3 class="font-bold text-[17px] sm:text-[18px] text-[#0d1c2f] truncate" style="color: var(--text);">
                  Quản Lý Phòng Ban &amp; Bộ Phận Con
                </h3>
                <span class="text-[11.5px] text-[#817663] font-medium truncate block" style="color: var(--text-muted);">
                  Cơ cấu tổ chức đa tầng • Dành riêng cho Quản Trị Viên (Admin)
                </span>
              </div>
            </div>
            <button type="button" class="text-gray-400 hover:text-gray-700 text-2xl font-bold min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors shrink-0" id="btnCloseDeptModal" aria-label="Đóng">&times;</button>
          </div>

          <!-- MAIN GRID: LEFT (LIST PHÒNG BAN) & RIGHT (CHI TIẾT & BỘ PHẬN CON) -->
          <div class="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-5 overflow-y-auto md:overflow-hidden">
            
            <!-- CỘT TRÁI (5 COLS): DANH SÁCH PHÒNG BAN & NÚT THÊM -->
            <div class="md:col-span-5 flex flex-col gap-3 md:h-full md:min-h-0">
              <div class="flex items-center justify-between shrink-0">
                <span class="text-[12.5px] font-bold text-[#0d1c2f]" style="color: var(--text);">
                  Danh sách phòng ban (${depts.length})
                </span>
                <button type="button" id="btnToggleAddDept" class="px-2.5 py-1 rounded-xl text-[11.5px] font-bold flex items-center gap-1 transition-all shadow-xs" style="background-color: var(--primary-container); color: var(--on-primary-container);">
                  <span class="material-symbols-outlined text-[16px]">add</span>
                  <span>Thêm PB</span>
                </button>
              </div>

              <!-- FORM THÊM PHÒNG BAN MỚI (ẨN/HIỆN): shrink-0 -->
              <div id="boxAddDeptForm" class="hidden shrink-0 p-3.5 rounded-2xl border border-dashed border-[#d6a52a] bg-[#fffbeb]/40 flex flex-col gap-2.5 shadow-2xs">
                <span class="text-[12px] font-bold text-[#795900]">Tạo phòng ban mới</span>
                <input type="text" id="newDeptName" placeholder="Tên phòng ban *" class="h-9 px-3 rounded-xl border border-[#e2e8f0] text-[12.5px] outline-none bg-white text-[#0d1c2f]" />
                <div class="grid grid-cols-2 gap-2">
                  <input type="text" id="newDeptCode" placeholder="Mã PB (VD: PTKH)" class="h-9 px-3 rounded-xl border border-[#e2e8f0] text-[12.5px] outline-none bg-white text-[#0d1c2f] uppercase" />
                  <input type="color" id="newDeptColor" value="#D6A52A" class="h-9 w-full rounded-xl border border-[#e2e8f0] cursor-pointer" title="Chọn màu nhận diện" />
                </div>
                <select id="newDeptManager" class="h-9 px-3 rounded-xl border border-[#e2e8f0] text-[12px] outline-none bg-white text-[#0d1c2f]">
                  <option value="">-- Chọn Trưởng phòng phụ trách --</option>
                  ${managers.map(m => `<option value="${m.id}">${esc(m.name)} (${esc(m.badge || '')})</option>`).join('')}
                </select>
                <div class="flex items-center justify-end gap-2 pt-1">
                  <button type="button" id="btnCancelAddDept" class="px-3 py-1 rounded-lg text-[11.5px] text-gray-500 hover:bg-gray-100">Hủy</button>
                  <button type="button" id="btnSubmitAddDept" class="px-3 py-1 rounded-lg text-[11.5px] font-bold bg-[#d6a52a] text-[#533d00] hover:bg-[#795900] hover:text-white transition-all shadow-2xs">Lưu PB</button>
                </div>
              </div>

              <!-- LIST CARDS PHÒNG BAN: md:flex-1 md:min-h-0 max-h-[240px] md:max-h-none overflow-y-auto -->
              <div class="flex flex-col gap-2 md:flex-1 md:min-h-0 max-h-[240px] md:max-h-none overflow-y-auto pr-1">
                ${depts.map(d => {
                  const isAct = selectedDept && selectedDept.id === d.id;
                  const mgr = allUsers.find(u => u.id === d.managerId);
                  const teamCount = (d.teams || []).length;
                  return `
                    <div class="p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between min-h-[52px] dept-item-card ${isAct ? 'shadow-md border-[#d6a52a] bg-[#fffbeb]/50' : 'hover:bg-gray-50 border-[#e2e8f0]'}" data-dept-id="${d.id}" style="${isAct ? 'background-color: var(--primary-soft); border-color: var(--primary);' : 'background-color: var(--card); border-color: var(--border);'}">
                      <div class="flex items-center gap-2.5 min-w-0">
                        <span class="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs" style="background-color: ${d.color || '#D6A52A'};"></span>
                        <div class="min-w-0">
                          <div class="text-[13px] font-bold text-[#0d1c2f] truncate" style="color: var(--text);">${esc(d.name)}</div>
                          <div class="text-[11px] text-[#64748b] truncate" style="color: var(--text-muted);">${esc(d.code)} • ${mgr ? esc(mgr.name) : 'Chưa có trưởng phòng'}</div>
                        </div>
                      </div>
                      <span class="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 font-mono-data" style="background-color: var(--primary-soft); color: var(--primary);">
                        ${teamCount} bộ phận
                      </span>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- CỘT PHẢI (7 COLS): CHI TIẾT PHÒNG BAN & BỘ PHẬN CON (TEAMS) -->
            <div class="md:col-span-7 flex flex-col gap-4 p-4 rounded-2xl border border-[#e2e8f0] bg-[#f8f9ff]/50 md:h-full md:min-h-0 overflow-y-auto md:overflow-hidden" style="background-color: var(--background); border-color: var(--border);">
              ${selectedDept ? `
                <!-- THÔNG TIN PHÒNG BAN ĐANG CHỌN (HEADER): shrink-0 -->
                <div class="flex items-center justify-between pb-3 border-b border-[#e2e8f0] shrink-0" style="border-color: var(--border);">
                  <div class="min-w-0 pr-2">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold font-mono-data uppercase text-white shrink-0 shadow-2xs" style="background-color: ${selectedDept.color || '#D6A52A'};">
                        ${esc(selectedDept.code)}
                      </span>
                      <h4 class="font-bold text-[15px] sm:text-[16px] text-[#0d1c2f] truncate" style="color: var(--text);">
                        ${esc(selectedDept.name)}
                      </h4>
                    </div>
                    <span class="text-[11.5px] text-[#64748b] mt-0.5 block truncate" style="color: var(--text-muted);">
                      ${esc(selectedDept.unit || 'Cơ Sở 3 (Cà Mau)')} • Trưởng phòng: <strong>${esc(allUsers.find(u => u.id === selectedDept.managerId)?.name || 'Chưa gán')}</strong>
                    </span>
                  </div>
                  
                  <div class="flex items-center gap-1 shrink-0">
                    <button type="button" id="btnToggleEditDept" class="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition-colors min-w-[38px] min-h-[38px] flex items-center justify-center" title="Chỉnh sửa thông tin phòng ban">
                      <span class="material-symbols-outlined text-[19px]">edit</span>
                    </button>
                    <button type="button" id="btnDeleteDept" class="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors min-w-[38px] min-h-[38px] flex items-center justify-center" title="Xóa phòng ban này">
                      <span class="material-symbols-outlined text-[19px]">delete</span>
                    </button>
                  </div>
                </div>

                <!-- FORM CHỈNH SỬA PHÒNG BAN (ẨN/HIỆN): shrink-0 -->
                <div id="boxEditDeptForm" class="${this.isEditingDept ? '' : 'hidden'} shrink-0 p-3.5 rounded-2xl border border-dashed border-[#d6a52a] bg-[#fffbeb]/50 flex flex-col gap-2.5 shadow-2xs">
                  <div class="flex items-center justify-between">
                    <span class="text-[12px] font-bold text-[#795900]">Chỉnh sửa thông tin phòng ban</span>
                    <button type="button" id="btnCancelEditDeptTop" class="text-gray-400 hover:text-gray-600 text-lg font-bold min-w-[28px] min-h-[28px] flex items-center justify-center">&times;</button>
                  </div>
                  <input type="text" id="editDeptName" value="${esc(selectedDept.name)}" placeholder="Tên phòng ban *" class="h-9 px-3 rounded-xl border border-[#e2e8f0] text-[12.5px] outline-none bg-white text-[#0d1c2f]" />
                  <div class="grid grid-cols-2 gap-2">
                    <input type="text" id="editDeptCode" value="${esc(selectedDept.code)}" placeholder="Mã PB (VD: PTKH)" class="h-9 px-3 rounded-xl border border-[#e2e8f0] text-[12.5px] outline-none bg-white text-[#0d1c2f] uppercase" />
                    <div class="flex items-center gap-2">
                      <input type="color" id="editDeptColor" value="${selectedDept.color || '#D6A52A'}" class="h-9 w-12 rounded-xl border border-[#e2e8f0] cursor-pointer" title="Chọn màu nhận diện" />
                      <span id="editDeptColorText" class="text-[11px] font-mono text-gray-500">${selectedDept.color || '#D6A52A'}</span>
                    </div>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input type="text" id="editDeptUnit" value="${esc(selectedDept.unit || 'Cơ Sở 3 (Cà Mau)')}" placeholder="Cơ sở / Chi nhánh" class="h-9 px-3 rounded-xl border border-[#e2e8f0] text-[12.5px] outline-none bg-white text-[#0d1c2f]" />
                    <select id="editDeptManager" class="h-9 px-3 rounded-xl border border-[#e2e8f0] text-[12px] outline-none bg-white text-[#0d1c2f]">
                      <option value="">-- Chưa gán Trưởng phòng --</option>
                      ${managers.map(m => `<option value="${m.id}" ${m.id === selectedDept.managerId ? 'selected' : ''}>${esc(m.name)} (${esc(m.badge || '')})</option>`).join('')}
                    </select>
                  </div>
                  <div class="flex items-center justify-end gap-2 pt-1">
                    <button type="button" id="btnCancelEditDept" class="px-3 py-1 rounded-lg text-[11.5px] text-gray-500 hover:bg-gray-100">Hủy</button>
                    <button type="button" id="btnSubmitEditDept" class="px-3.5 py-1 rounded-lg text-[11.5px] font-bold bg-[#d6a52a] text-[#533d00] hover:bg-[#795900] hover:text-white transition-all shadow-2xs">Lưu Thay Đổi</button>
                  </div>
                </div>

                <!-- DANH SÁCH BỘ PHẬN CON (TEAMS) CONTAINER: md:flex-1 md:min-h-0 md:overflow-hidden -->
                <div class="flex flex-col gap-3 md:flex-1 md:min-h-0 md:overflow-hidden">
                  <div class="shrink-0 flex items-center justify-between">
                    <div>
                      <span class="text-[13px] font-bold text-[#0d1c2f]" style="color: var(--text);">
                        Các bộ phận con trực thuộc (${(selectedDept.teams || []).length})
                      </span>
                      <p class="text-[11px] text-[#64748b]" style="color: var(--text-muted);">
                        Ví dụ: Phòng PTKH gồm Marketing, CSKH, Hỗ trợ... Trưởng phòng quản lý toàn bộ.
                      </p>
                    </div>
                  </div>

                  <!-- THÊM BỘ PHẬN CON NHANH: shrink-0 -->
                  <div class="shrink-0 p-3 rounded-xl bg-white border border-[#e2e8f0] flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shadow-2xs" style="background-color: var(--card); border-color: var(--border);">
                    <input type="text" id="inputNewTeamName" placeholder="Tên bộ phận (VD: CSKH, Marketing, Hỗ trợ...)" class="flex-1 h-9 px-3 rounded-lg border border-[#e2e8f0] text-[12.5px] outline-none bg-white text-[#0d1c2f]" />
                    <input type="text" id="inputNewTeamCode" placeholder="Mã (VD: CSKH)" class="w-full sm:w-28 h-9 px-3 rounded-lg border border-[#e2e8f0] text-[12.5px] outline-none uppercase bg-white text-[#0d1c2f]" />
                    <button type="button" id="btnAddTeamSubmit" class="px-3.5 py-1.5 rounded-lg text-[12px] font-bold shadow-xs transition-all shrink-0 min-h-[36px] flex items-center justify-center gap-1" style="background-color: var(--primary-container); color: var(--on-primary-container);">
                      <span class="material-symbols-outlined text-[16px]">add</span>
                      <span>Thêm bộ phận</span>
                    </button>
                  </div>

                  <!-- DANH SÁCH CÁC BỘ PHẬN CON HIỆN CÓ: md:flex-1 md:min-h-0 max-h-[280px] md:max-h-none overflow-y-auto -->
                  <div class="flex flex-col gap-2 md:flex-1 md:min-h-0 max-h-[280px] md:max-h-none overflow-y-auto pr-1">
                    ${(!selectedDept.teams || selectedDept.teams.length === 0) ? `
                      <div class="p-4 rounded-xl text-center text-[12px] text-[#817663] bg-white border border-[#e2e8f0]" style="background-color: var(--card); border-color: var(--border);">
                        Chưa có bộ phận con nào trong phòng ban này. Hãy thêm bộ phận ở trên.
                      </div>
                    ` : selectedDept.teams.map(t => {
                      const isEditingThisTeam = this.editingTeamId === t.id;
                      const membersInTeam = store.getDepartmentUsers(selectedDept.id).filter(u => u.teamId === t.id);

                      if (isEditingThisTeam) {
                        return `
                          <div class="p-2.5 rounded-xl bg-[#fffbeb] border border-[#d6a52a] flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shadow-sm" style="background-color: var(--primary-soft); border-color: var(--primary);">
                            <input type="text" id="inputEditTeamName_${t.id}" value="${esc(t.name)}" class="flex-1 h-8 px-2.5 rounded-lg border border-[#e2e8f0] text-[12.5px] bg-white text-[#0d1c2f] outline-none focus:border-[#d6a52a]" placeholder="Tên bộ phận *" />
                            <input type="text" id="inputEditTeamCode_${t.id}" value="${esc(t.code || '')}" class="w-full sm:w-28 h-8 px-2.5 rounded-lg border border-[#e2e8f0] text-[12.5px] uppercase bg-white text-[#0d1c2f] outline-none focus:border-[#d6a52a]" placeholder="Mã (VD: CSKH)" />
                            <div class="flex items-center gap-1.5 justify-end shrink-0">
                              <button type="button" class="btn-save-edit-team px-3 py-1 rounded-lg text-[11.5px] font-bold bg-[#d6a52a] text-[#533d00] hover:bg-[#795900] hover:text-white transition-all shadow-2xs" data-team-id="${t.id}">Lưu</button>
                              <button type="button" class="btn-cancel-edit-team px-2.5 py-1 rounded-lg text-[11.5px] text-gray-500 hover:bg-gray-200 transition-all" data-team-id="${t.id}">Hủy</button>
                            </div>
                          </div>
                        `;
                      }

                      return `
                        <div class="p-3 rounded-xl bg-white border border-[#e2e8f0] flex items-center justify-between shadow-2xs hover:border-[#d6a52a] transition-all" style="background-color: var(--card); border-color: var(--border);">
                          <div class="flex items-center gap-2.5 min-w-0">
                            <span class="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10.5px] font-mono-data shrink-0" style="background-color: var(--primary-soft); color: var(--primary);">
                              ${esc(t.code || 'TEAM')}
                            </span>
                            <div class="min-w-0">
                              <div class="text-[13px] font-bold text-[#0d1c2f] truncate" style="color: var(--text);">${esc(t.name)}</div>
                              <div class="text-[11px] text-[#64748b] truncate" style="color: var(--text-muted);">${membersInTeam.length} nhân viên trực thuộc</div>
                            </div>
                          </div>
                          
                          <div class="flex items-center gap-1 shrink-0">
                            <button type="button" class="btn-edit-team text-gray-400 hover:text-amber-600 p-1.5 rounded-lg transition-colors" data-team-id="${t.id}" title="Chỉnh sửa bộ phận này">
                              <span class="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button type="button" class="btn-delete-team text-gray-400 hover:text-rose-600 p-1.5 rounded-lg transition-colors" data-team-id="${t.id}" title="Xóa bộ phận này">
                              <span class="material-symbols-outlined text-[18px]">close</span>
                            </button>
                          </div>
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>
              ` : `
                <div class="p-8 text-center text-[13px] text-gray-400 flex-1 flex items-center justify-center">
                  Chọn một phòng ban bên trái để xem và thiết lập bộ phận con.
                </div>
              `}
            </div>

          </div>

          <!-- FOOTER: shrink-0 -->
          <div class="flex items-center justify-end pt-3 border-t border-[#f1f5f9] shrink-0" style="border-color: var(--border);">
            <button type="button" class="px-5 py-2.5 rounded-xl border border-[#e2e8f0] text-[13px] font-semibold text-[#64748b] hover:bg-gray-50 min-h-[44px]" id="btnCloseDeptBottom">
              Đóng Cửa Sổ
            </button>
          </div>

        </div>
      </div>
    `;

    this.bindEvents(selectedDept);
  }

  bindEvents(currentDept) {
    const overlay = this.container.querySelector('#deptModalOverlay');
    const btnClose = this.container.querySelector('#btnCloseDeptModal');
    const btnCloseBottom = this.container.querySelector('#btnCloseDeptBottom');

    const closeModal = () => {
      rung(10);
      this.editingTeamId = null;
      this.isEditingDept = false;
      if (overlay) overlay.remove();
    };

    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnCloseBottom) btnCloseBottom.addEventListener('click', closeModal);
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
      });
    }

    // Chọn phòng ban từ danh sách
    this.container.querySelectorAll('.dept-item-card').forEach(card => {
      card.addEventListener('click', () => {
        const dId = card.dataset.deptId;
        this.editingTeamId = null;
        this.isEditingDept = false;
        this.show(dId);
      });
    });

    // Toggle Form thêm PB
    const btnToggleAdd = this.container.querySelector('#btnToggleAddDept');
    const boxAdd = this.container.querySelector('#boxAddDeptForm');
    const btnCancelAdd = this.container.querySelector('#btnCancelAddDept');
    if (btnToggleAdd && boxAdd) {
      btnToggleAdd.addEventListener('click', () => boxAdd.classList.toggle('hidden'));
    }
    if (btnCancelAdd && boxAdd) {
      btnCancelAdd.addEventListener('click', () => boxAdd.classList.add('hidden'));
    }

    // Submit Thêm Phòng Ban
    const btnSubmitAdd = this.container.querySelector('#btnSubmitAddDept');
    if (btnSubmitAdd) {
      btnSubmitAdd.addEventListener('click', () => {
        rung(15);
        const name = this.container.querySelector('#newDeptName')?.value.trim();
        const code = this.container.querySelector('#newDeptCode')?.value.trim();
        const color = this.container.querySelector('#newDeptColor')?.value;
        const managerId = this.container.querySelector('#newDeptManager')?.value;

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
          this.show(res.department.id);
          if (this.onUpdated) this.onUpdated();
        } else {
          toast(res.message, 'warning');
        }
      });
    }

    // Toggle & Cancel Form Chỉnh sửa Phòng Ban
    const btnToggleEditDept = this.container.querySelector('#btnToggleEditDept');
    const boxEditDept = this.container.querySelector('#boxEditDeptForm');
    const btnCancelEditDept = this.container.querySelector('#btnCancelEditDept');
    const btnCancelEditDeptTop = this.container.querySelector('#btnCancelEditDeptTop');
    const editDeptColor = this.container.querySelector('#editDeptColor');
    const editDeptColorText = this.container.querySelector('#editDeptColorText');

    if (editDeptColor && editDeptColorText) {
      editDeptColor.addEventListener('input', () => {
        editDeptColorText.textContent = editDeptColor.value;
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

    if (btnCancelEditDept) btnCancelEditDept.addEventListener('click', closeEditDept);
    if (btnCancelEditDeptTop) btnCancelEditDeptTop.addEventListener('click', closeEditDept);

    // Submit Chỉnh sửa Phòng Ban
    const btnSubmitEditDept = this.container.querySelector('#btnSubmitEditDept');
    if (btnSubmitEditDept && currentDept) {
      btnSubmitEditDept.addEventListener('click', () => {
        rung(15);
        const name = this.container.querySelector('#editDeptName')?.value.trim();
        const code = this.container.querySelector('#editDeptCode')?.value.trim();
        const color = this.container.querySelector('#editDeptColor')?.value;
        const unit = this.container.querySelector('#editDeptUnit')?.value.trim();
        const managerId = this.container.querySelector('#editDeptManager')?.value;

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

        if (res.success) {
          toast(`Đã cập nhật phòng ban: ${name}`, 'success');
          this.isEditingDept = false;
          this.show(currentDept.id);
          if (this.onUpdated) this.onUpdated();
        } else {
          toast(res.message, 'warning');
        }
      });
    }

    // Submit Thêm Bộ Phận Con (Team)
    const btnAddTeam = this.container.querySelector('#btnAddTeamSubmit');
    if (btnAddTeam && currentDept) {
      btnAddTeam.addEventListener('click', () => {
        rung(15);
        const teamName = this.container.querySelector('#inputNewTeamName')?.value.trim();
        const teamCode = this.container.querySelector('#inputNewTeamCode')?.value.trim();

        if (!teamName) {
          toast('Vui lòng nhập tên bộ phận con (VD: CSKH, Marketing...)!', 'warning');
          return;
        }

        const res = store.addTeamToDepartment(currentDept.id, {
          name: teamName,
          code: teamCode || teamName.slice(0, 4).toUpperCase()
        });

        if (res.success) {
          toast(`Đã thêm bộ phận "${teamName}" vào ${currentDept.name}!`, 'success');
          this.show(currentDept.id);
          if (this.onUpdated) this.onUpdated();
        } else {
          toast(res.message, 'warning');
        }
      });
    }

    // Nút Bật Chỉnh sửa Inline cho Bộ Phận Con (.btn-edit-team)
    this.container.querySelectorAll('.btn-edit-team').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const teamId = btn.dataset.teamId;
        this.editingTeamId = teamId;
        this.show(currentDept.id);
      });
    });

    // Nút Lưu Chỉnh sửa Inline cho Bộ Phận Con (.btn-save-edit-team)
    this.container.querySelectorAll('.btn-save-edit-team').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        rung(15);
        const teamId = btn.dataset.teamId;
        if (!currentDept || !teamId) return;

        const nameInput = this.container.querySelector(`#inputEditTeamName_${teamId}`);
        const codeInput = this.container.querySelector(`#inputEditTeamCode_${teamId}`);
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
          this.show(currentDept.id);
          if (this.onUpdated) this.onUpdated();
        } else {
          toast(res.message, 'warning');
        }
      });
    });

    // Nút Hủy Chỉnh sửa Inline cho Bộ Phận Con (.btn-cancel-edit-team)
    this.container.querySelectorAll('.btn-cancel-edit-team').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.editingTeamId = null;
        this.show(currentDept.id);
      });
    });

    // Phím tắt Enter / Escape khi đang sửa inline team
    if (this.editingTeamId && currentDept) {
      const activeNameInput = this.container.querySelector(`#inputEditTeamName_${this.editingTeamId}`);
      const activeCodeInput = this.container.querySelector(`#inputEditTeamCode_${this.editingTeamId}`);
      const handleTeamKey = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const saveBtn = this.container.querySelector(`.btn-save-edit-team[data-team-id="${this.editingTeamId}"]`);
          if (saveBtn) saveBtn.click();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          this.editingTeamId = null;
          this.show(currentDept.id);
        }
      };
      if (activeNameInput) {
        activeNameInput.addEventListener('keydown', handleTeamKey);
        setTimeout(() => activeNameInput?.focus?.(), 50);
      }
      if (activeCodeInput) {
        activeCodeInput.addEventListener('keydown', handleTeamKey);
      }
    }

    // Xóa Bộ Phận Con (Team)
    this.container.querySelectorAll('.btn-delete-team').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const teamId = btn.dataset.teamId;
        if (!currentDept || !teamId) return;

        xacNhan2Lan('del_team_' + teamId, 'Xóa bộ phận này khỏi phòng ban', () => {
          store.removeTeamFromDepartment(currentDept.id, teamId);
          toast('Đã xóa bộ phận con thành công!', 'success');
          if (this.editingTeamId === teamId) this.editingTeamId = null;
          this.show(currentDept.id);
          if (this.onUpdated) this.onUpdated();
        });
      });
    });

    // Xóa Phòng Ban (Admin)
    const btnDeleteDept = this.container.querySelector('#btnDeleteDept');
    if (btnDeleteDept && currentDept) {
      btnDeleteDept.addEventListener('click', () => {
        xacNhan2Lan('del_dept_' + currentDept.id, `Xóa phòng ban ${currentDept.name}`, () => {
          store.deleteDepartment(currentDept.id);
          toast(`Đã xóa phòng ban ${currentDept.name}!`, 'success');
          this.selectedDeptId = null;
          this.editingTeamId = null;
          this.isEditingDept = false;
          this.show();
          if (this.onUpdated) this.onUpdated();
        });
      });
    }
  }
}


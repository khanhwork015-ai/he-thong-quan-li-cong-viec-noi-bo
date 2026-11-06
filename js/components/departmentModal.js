/**
 * THANH VŨ MEDIC CS3 - DEPARTMENT & SUB-DEPARTMENT (TEAMS) MANAGEMENT MODAL
 * Dành riêng cho Quản Trị Viên (ADMIN):
 * - Toàn quyền Thêm / Sửa / Xóa Phòng Ban
 * - Toàn quyền Thêm / Sửa / Xóa các Bộ Phận Con (Teams) bên trong từng Phòng Ban
 * (Ví dụ: Phòng PTKH gồm các bộ phận Marketing, CSKH, Hỗ trợ)
 */

import { auth } from '../auth.js';
import { store } from '../store.js';
import { esc, toast, rung, xacNhan2Lan } from '../helpers.js';

export class DepartmentModal {
  constructor(containerId, onUpdated) {
    this.container = document.getElementById(containerId);
    this.onUpdated = onUpdated;
    this.selectedDeptId = null;
  }

  show(deptIdToSelect = null) {
    if (!this.container) return;
    if (!auth.canCRUDDepartments()) {
      toast('Chỉ Quản Trị Viên (Admin) mới có quyền quản lý phòng ban và bộ phận con!', 'warning');
      return;
    }

    rung(10);
    const depts = store.getAllDepartments();
    const allUsers = store.getAllUsers();
    const managers = allUsers.filter(u => u.role === 'MANAGER' || u.role === 'DEPUTY_MANAGER' || u.role === 'ADMIN');

    this.selectedDeptId = deptIdToSelect || this.selectedDeptId || (depts[0] ? depts[0].id : null);
    const selectedDept = store.getDepartmentById(this.selectedDeptId) || depts[0];

    this.container.innerHTML = `
      <div class="modal-overlay fixed inset-0 z-[100] bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 active" id="deptModalOverlay">
        <div class="modal-card bg-white rounded-3xl p-4 sm:p-6 max-w-4xl w-full shadow-2xl border border-[#e2e8f0] max-h-[92vh] overflow-y-auto flex flex-col gap-5" style="background-color: var(--card); border-color: var(--border);">
          
          <!-- HEADER -->
          <div class="flex items-center justify-between pb-3.5 border-b border-[#f1f5f9]" style="border-color: var(--border);">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl flex items-center justify-center font-bold shadow-xs" style="background-color: var(--primary-soft); color: var(--primary);">
                <span class="material-symbols-outlined text-[22px]">domain</span>
              </div>
              <div>
                <h3 class="font-bold text-[17px] sm:text-[18px] text-[#0d1c2f]" style="color: var(--text);">
                  Quản Lý Phòng Ban &amp; Bộ Phận Con
                </h3>
                <span class="text-[11.5px] text-[#817663] font-medium" style="color: var(--text-muted);">
                  Cơ cấu tổ chức đa tầng • Dành riêng cho Quản Trị Viên (Admin)
                </span>
              </div>
            </div>
            <button type="button" class="text-gray-400 hover:text-gray-700 text-2xl font-bold min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors" id="btnCloseDeptModal" aria-label="Đóng">&times;</button>
          </div>

          <!-- MAIN GRID: LEFT (LIST PHÒNG BAN) & RIGHT (CHI TIẾT & BỘ PHẬN CON) -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            <!-- CỘT TRÁI (4 COLS): DANH SÁCH PHÒNG BAN & NÚT THÊM -->
            <div class="lg:col-span-5 flex flex-col gap-3">
              <div class="flex items-center justify-between">
                <span class="text-[12.5px] font-bold text-[#0d1c2f]" style="color: var(--text);">
                  Danh sách phòng ban (${depts.length})
                </span>
                <button type="button" id="btnToggleAddDept" class="px-2.5 py-1 rounded-xl text-[11.5px] font-bold flex items-center gap-1 transition-all shadow-xs" style="background-color: var(--primary-container); color: var(--on-primary-container);">
                  <span class="material-symbols-outlined text-[16px]">add</span>
                  <span>Thêm PB</span>
                </button>
              </div>

              <!-- FORM THÊM PHÒNG BAN MỚI (ẨN/HIỆN) -->
              <div id="boxAddDeptForm" class="hidden p-3.5 rounded-2xl border border-dashed border-[#d6a52a] bg-[#fffbeb]/40 flex flex-col gap-2.5">
                <span class="text-[12px] font-bold text-[#795900]">Tạo phòng ban mới</span>
                <input type="text" id="newDeptName" placeholder="Tên phòng ban *" class="h-9 px-3 rounded-xl border border-[#e2e8f0] text-[12.5px] outline-none bg-white text-[#0d1c2f]" />
                <div class="grid grid-cols-2 gap-2">
                  <input type="text" id="newDeptCode" placeholder="Mã PB (VD: PTKH)" class="h-9 px-3 rounded-xl border border-[#e2e8f0] text-[12.5px] outline-none bg-white text-[#0d1c2f] uppercase" />
                  <input type="color" id="newDeptColor" value="#D6A52A" class="h-9 w-full rounded-xl border border-[#e2e8f0] cursor-pointer" title="Chọn màu nhận diện" />
                </div>
                <select id="newDeptManager" class="h-9 px-3 rounded-xl border border-[#e2e8f0] text-[12px] outline-none bg-white text-[#0d1c2f]">
                  <option value="">-- Chọn Trưởng phòng phụ trách --</option>
                  ${managers.map(m => `<option value="${m.id}">${m.name} (${m.badge})</option>`).join('')}
                </select>
                <div class="flex items-center justify-end gap-2 pt-1">
                  <button type="button" id="btnCancelAddDept" class="px-3 py-1 rounded-lg text-[11.5px] text-gray-500 hover:bg-gray-100">Hủy</button>
                  <button type="button" id="btnSubmitAddDept" class="px-3 py-1 rounded-lg text-[11.5px] font-bold bg-[#d6a52a] text-[#533d00] hover:bg-[#795900] hover:text-white transition-all">Lưu PB</button>
                </div>
              </div>

              <!-- LIST CARDS PHÒNG BAN -->
              <div class="flex flex-col gap-2 max-h-[50vh] overflow-y-auto pr-1">
                ${depts.map(d => {
                  const isAct = selectedDept && selectedDept.id === d.id;
                  const mgr = allUsers.find(u => u.id === d.managerId);
                  const teamCount = (d.teams || []).length;
                  return `
                    <div class="p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between min-h-[52px] dept-item-card ${isAct ? 'shadow-md border-[#d6a52a] bg-[#fffbeb]/50' : 'hover:bg-gray-50 border-[#e2e8f0]'}" data-dept-id="${d.id}" style="${isAct ? 'background-color: var(--primary-soft); border-color: var(--primary);' : 'background-color: var(--card); border-color: var(--border);'}">
                      <div class="flex items-center gap-2.5 min-w-0">
                        <span class="w-3.5 h-3.5 rounded-full shrink-0" style="background-color: ${d.color || '#D6A52A'};"></span>
                        <div class="min-w-0">
                          <div class="text-[13px] font-bold text-[#0d1c2f] truncate" style="color: var(--text);">${d.name}</div>
                          <div class="text-[11px] text-[#64748b] truncate" style="color: var(--text-muted);">${d.code} • ${mgr ? mgr.name : 'Chưa có trưởng phòng'}</div>
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
            <div class="lg:col-span-7 flex flex-col gap-4 p-4 rounded-2xl border border-[#e2e8f0] bg-[#f8f9ff]/50" style="background-color: var(--background); border-color: var(--border);">
              ${selectedDept ? `
                <!-- THÔNG TIN PHÒNG BAN ĐANG CHỌN -->
                <div class="flex items-center justify-between pb-3 border-b border-[#e2e8f0]" style="border-color: var(--border);">
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold font-mono-data uppercase text-white" style="background-color: ${selectedDept.color || '#D6A52A'};">
                        ${selectedDept.code}
                      </span>
                      <h4 class="font-bold text-[15px] sm:text-[16px] text-[#0d1c2f]" style="color: var(--text);">
                        ${selectedDept.name}
                      </h4>
                    </div>
                    <span class="text-[11.5px] text-[#64748b] mt-0.5 block" style="color: var(--text-muted);">
                      ${selectedDept.unit} • Trưởng phòng: <strong>${allUsers.find(u => u.id === selectedDept.managerId)?.name || 'Chưa gán'}</strong>
                    </span>
                  </div>
                  
                  <button type="button" id="btnDeleteDept" class="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center shrink-0" title="Xóa phòng ban này">
                    <span class="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>

                <!-- DANH SÁCH BỘ PHẬN CON (TEAMS) -->
                <div class="flex flex-col gap-3">
                  <div class="flex items-center justify-between">
                    <div>
                      <span class="text-[13px] font-bold text-[#0d1c2f]" style="color: var(--text);">
                        Các bộ phận con trực thuộc (${(selectedDept.teams || []).length})
                      </span>
                      <p class="text-[11px] text-[#64748b]" style="color: var(--text-muted);">
                        Ví dụ: Phòng PTKH gồm Marketing, CSKH, Hỗ trợ... Trưởng phòng quản lý toàn bộ.
                      </p>
                    </div>
                  </div>

                  <!-- THÊM BỘ PHẬN CON NHANH -->
                  <div class="p-3 rounded-xl bg-white border border-[#e2e8f0] flex flex-col sm:flex-row items-stretch sm:items-center gap-2" style="background-color: var(--card); border-color: var(--border);">
                    <input type="text" id="inputNewTeamName" placeholder="Tên bộ phận (VD: CSKH, Marketing, Hỗ trợ...)" class="flex-1 h-9 px-3 rounded-lg border border-[#e2e8f0] text-[12.5px] outline-none bg-white text-[#0d1c2f]" />
                    <input type="text" id="inputNewTeamCode" placeholder="Mã (VD: CSKH)" class="w-full sm:w-28 h-9 px-3 rounded-lg border border-[#e2e8f0] text-[12.5px] outline-none uppercase bg-white text-[#0d1c2f]" />
                    <button type="button" id="btnAddTeamSubmit" class="px-3.5 py-1.5 rounded-lg text-[12px] font-bold shadow-xs transition-all shrink-0 min-h-[36px] flex items-center justify-center gap-1" style="background-color: var(--primary-container); color: var(--on-primary-container);">
                      <span class="material-symbols-outlined text-[16px]">add</span>
                      <span>Thêm bộ phận</span>
                    </button>
                  </div>

                  <!-- DANH SÁCH CÁC BỘ PHẬN CON HIỆN CÓ -->
                  <div class="flex flex-col gap-2 max-h-56 overflow-y-auto">
                    ${(!selectedDept.teams || selectedDept.teams.length === 0) ? `
                      <div class="p-4 rounded-xl text-center text-[12px] text-[#817663] bg-white border border-[#e2e8f0]" style="background-color: var(--card); border-color: var(--border);">
                        Chưa có bộ phận con nào trong phòng ban này. Hãy thêm bộ phận ở trên.
                      </div>
                    ` : selectedDept.teams.map(t => {
                      const membersInTeam = store.getDepartmentUsers(selectedDept.id).filter(u => u.teamId === t.id);
                      return `
                        <div class="p-3 rounded-xl bg-white border border-[#e2e8f0] flex items-center justify-between shadow-2xs hover:border-[#d6a52a] transition-all" style="background-color: var(--card); border-color: var(--border);">
                          <div class="flex items-center gap-2.5 min-w-0">
                            <span class="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10.5px] font-mono-data shrink-0" style="background-color: var(--primary-soft); color: var(--primary);">
                              ${t.code || 'TEAM'}
                            </span>
                            <div class="min-w-0">
                              <div class="text-[13px] font-bold text-[#0d1c2f] truncate" style="color: var(--text);">${t.name}</div>
                              <div class="text-[11px] text-[#64748b] truncate" style="color: var(--text-muted);">${membersInTeam.length} nhân viên trực thuộc</div>
                            </div>
                          </div>
                          
                          <button type="button" class="btn-delete-team text-gray-400 hover:text-rose-600 p-1.5 rounded-lg transition-colors" data-team-id="${t.id}" title="Xóa bộ phận này">
                            <span class="material-symbols-outlined text-[18px]">close</span>
                          </button>
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>
              ` : `
                <div class="p-8 text-center text-[13px] text-gray-400">
                  Chọn một phòng ban bên trái để xem và thiết lập bộ phận con.
                </div>
              `}
            </div>

          </div>

          <!-- FOOTER -->
          <div class="flex items-center justify-end pt-3 border-t border-[#f1f5f9]" style="border-color: var(--border);">
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

    // Xóa Bộ Phận Con (Team)
    this.container.querySelectorAll('.btn-delete-team').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const teamId = btn.dataset.teamId;
        if (!currentDept || !teamId) return;

        xacNhan2Lan('del_team_' + teamId, 'Xóa bộ phận này khỏi phòng ban', () => {
          store.removeTeamFromDepartment(currentDept.id, teamId);
          toast('Đã xóa bộ phận con thành công!', 'success');
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
          this.show();
          if (this.onUpdated) this.onUpdated();
        });
      });
    }
  }
}

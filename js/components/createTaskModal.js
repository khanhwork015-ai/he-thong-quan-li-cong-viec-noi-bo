/**
 * THANH VŨ MEDIC CS3 - CREATE / EDIT TASK MODAL COMPONENT (SHIN AIOS v2.7)
 * Giao diện form chuẩn Google Stitch Gold:
 * Nút Gold #D6A52A, Border #E2E8F0, Text #0D1C2F
 * Thân thiện với thiết bị di động: Vùng chạm >= 44px, nút xếp hàng dọc trên mobile
 * Hỗ trợ Tạo Mới & Chỉnh Sửa Công Việc Cha (Edit Parent Task)
 * Hỗ trợ chọn Bộ Phận Con (Teams) & Switch Phê Duyệt 1-Chạm (One-Tap Approval)
 */

import { auth } from '../auth.js?v=7.2';
import { store } from '../store.js?v=7.2';
import { toast, rung, esc } from '../helpers.js?v=7.2';

export class CreateTaskModal {
  constructor(containerId, onTaskCreated) {
    this.container = document.getElementById(containerId);
    this.onTaskCreated = onTaskCreated;
    this.taskToEdit = null;
  }

  show(taskToEdit = null) {
    if (!this.container) return;

    rung(10);
    this.taskToEdit = taskToEdit;
    const isEdit = Boolean(taskToEdit);

    const currentDept = auth.getActiveDepartment();
    const allUsers = store.getAllUsers();
    const currentUser = auth.getCurrentUser() || { id: 'usr_admin', name: 'Quản Trị Viên' };
    const depts = store.getAllDepartments();
    const validDepts = depts.filter(d => d.id !== 'all');
    
    // Nếu đang sửa task của phòng ban khác, lấy phòng ban của task đó
    const initialDeptId = (isEdit && taskToEdit.departmentId && taskToEdit.departmentId !== 'all') 
      ? taskToEdit.departmentId 
      : (currentDept.id === 'all' ? (validDepts[0]?.id || 'dept_ptkh') : currentDept.id);
    const taskDept = store.getDepartmentById(initialDeptId) || validDepts[0] || currentDept;
    const currentTeams = taskDept.teams || [];

    // Chỉ lấy nhân sự thuộc đúng phòng ban được chọn (và tài khoản toàn viện 'all')
    const deptUsers = store.getAllUsers().filter(u => u.departmentId === taskDept.id || u.departmentId === 'all');

    // Danh sách người có thẩm quyền phê duyệt (Admin, Leadership, Manager)
    const approvers = allUsers.filter(u => u.isAdmin || u.role === 'ADMIN' || u.role === 'LEADERSHIP' || u.role === 'MANAGER' || u.role === 'DEPUTY_MANAGER');
    // Mặc định người duyệt: Trưởng phòng hiện tại hoặc Ban Lãnh Đạo
    const defaultApproverId = isEdit && taskToEdit.approverId
      ? taskToEdit.approverId
      : (taskDept.managerId || (approvers.find(u => u.role === 'LEADERSHIP')?.id || approvers[0]?.id || currentUser.id));

    // Mặc định assignee: phải thuộc danh sách nhân sự của phòng ban đó
    let selectedAssigneeId = isEdit && taskToEdit.assigneeId ? taskToEdit.assigneeId : currentUser.id;
    if (!deptUsers.some(u => u.id === selectedAssigneeId)) {
      selectedAssigneeId = deptUsers[0]?.id || currentUser.id;
    }
    const currentAssigneeUser = store.getUserById(selectedAssigneeId) || deptUsers[0] || currentUser;

    const requiresApproval = isEdit ? Boolean(taskToEdit.requiresApproval) : false;
    const currentPriority = isEdit && taskToEdit.priority ? taskToEdit.priority : 'P2';
    const currentDueDate = isEdit && taskToEdit.dueDate ? taskToEdit.dueDate : new Date().toISOString().split('T')[0];
    const currentCategory = isEdit && taskToEdit.category ? taskToEdit.category : 'Chuyên môn';
    const currentCost = isEdit && taskToEdit.cost !== undefined ? taskToEdit.cost : 0;
    const currentTeamId = isEdit && taskToEdit.teamId ? taskToEdit.teamId : '';

    this.container.innerHTML = `
      <div class="modal-overlay fixed inset-0 z-[100] bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 active" id="createModalOverlay">
        <div class="modal-card bg-white rounded-t-2xl sm:rounded-2xl rounded-b-none sm:rounded-b-2xl max-w-lg w-full flex flex-col max-h-[90vh] sm:max-h-[85vh] shadow-2xl border border-[#e2e8f0] overflow-hidden" style="background-color: var(--card); border-color: var(--border);">
          
          <!-- HEADER -->
          <div class="flex items-center justify-between p-4 sm:p-5 border-b border-[#f1f5f9] shrink-0" style="border-color: var(--border);">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-10 h-10 rounded-2xl flex items-center justify-center font-bold shadow-xs shrink-0" style="background-color: var(--primary-soft); color: var(--primary);">
                <span class="material-symbols-outlined text-[22px]">${isEdit ? 'edit_note' : 'add_task'}</span>
              </div>
              <div class="min-w-0">
                <h3 class="font-bold text-[16px] sm:text-[17px] text-[#0d1c2f] truncate" style="color: var(--text);">
                  ${isEdit ? `Chỉnh Sửa Công Việc • ${esc(taskToEdit.id)}` : 'Giao Việc &amp; Đề Xuất Mới'}
                </h3>
                <span class="text-[11.5px] font-semibold truncate block" style="color: var(--primary);">
                  ${esc(taskDept.name)} • ${isEdit ? esc(taskToEdit.id) : esc(taskDept.code)}
                </span>
              </div>
            </div>
            <button type="button" class="text-gray-400 hover:text-gray-700 text-2xl font-bold min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors cursor-pointer shrink-0" id="btnCloseCreateModal" aria-label="Đóng">&times;</button>
          </div>

          <!-- FORM VỚI BODY CUỘN VÀ FOOTER CỐ ĐỊNH -->
          <form id="formCreateTask" class="flex flex-col flex-1 overflow-hidden">
            <div class="p-4 sm:p-5 flex-1 overflow-y-auto flex flex-col gap-3.5 sm:gap-4 text-left">
            
            <!-- TÊN CÔNG VIỆC -->
            <div>
              <label class="block text-[12.5px] font-bold text-[#0d1c2f] mb-1" style="color: var(--text);">Tên công việc / Nhiệm vụ *</label>
              <input type="text" id="newTaskTitle" required value="${isEdit ? esc(taskToEdit.title) : ''}" placeholder="Ví dụ: Đàm phán hợp đồng khám đoàn Minh Phú (1.200 CBCNV)" class="w-full h-11 px-3.5 rounded-xl border border-[#e2e8f0] text-[14px] outline-none focus:border-[#d6a52a] focus:ring-2 focus:ring-[#d6a52a]/20 bg-[#f8f9ff] focus:bg-white text-[#0d1c2f]" />
            </div>

            <!-- PHÒNG BAN TIẾP NHẬN (ADMIN / BAN LÃNH ĐẠO HOẶC KHI ĐANG XEM TOÀN VIỆN) -->
            ${(auth.canSwitchDepartment() || currentDept.id === 'all') ? `
              <div>
                <label class="block text-[12.5px] font-bold text-[#0d1c2f] mb-1" style="color: var(--text);">Phòng ban tiếp nhận *</label>
                <select id="newTaskDept" class="w-full h-11 px-3 rounded-xl border border-[#e2e8f0] text-[13.5px] outline-none focus:border-[#d6a52a] bg-[#f8f9ff] focus:bg-white text-[#0d1c2f] cursor-pointer">
                  ${depts.map(d => `
                    <option value="${d.id}" ${d.id === (taskDept.id === 'all' ? 'dept_ptkh' : taskDept.id) ? 'selected' : ''}>${esc(d.name)} (${esc(d.code)})</option>
                  `).join('')}
                </select>
              </div>
            ` : ''}

            <!-- BỘ PHẬN CON (TEAMS) TRONG PHÒNG BAN -->
            <div>
              <label class="block text-[12.5px] font-bold text-[#0d1c2f] mb-1" style="color: var(--text);">Bộ phận con trực thuộc (Team)</label>
              <select id="newTaskTeam" class="w-full h-11 px-3 rounded-xl border border-[#e2e8f0] text-[13.5px] outline-none focus:border-[#d6a52a] bg-[#f8f9ff] focus:bg-white text-[#0d1c2f] cursor-pointer">
                <option value="">-- Toàn phòng ban / Chưa phân tổ --</option>
                ${currentTeams.map(t => `
                  <option value="${t.id}" ${t.id === currentTeamId ? 'selected' : ''}>${esc(t.name)} (${esc(t.code)})</option>
                `).join('')}
              </select>
            </div>

            <!-- MÔ TẢ CHI TIẾT -->
            <div>
              <label class="block text-[12.5px] font-bold text-[#0d1c2f] mb-1" style="color: var(--text);">Mô tả chi tiết &amp; Tiêu chuẩn nghiệm thu</label>
              <textarea id="newTaskDesc" rows="3" placeholder="Ghi chú yêu cầu kỹ thuật, mốc hoàn thành, phạm vi phối hợp..." class="w-full p-3 rounded-xl border border-[#e2e8f0] text-[13.5px] outline-none focus:border-[#d6a52a] focus:ring-2 focus:ring-[#d6a52a]/20 bg-[#f8f9ff] focus:bg-white text-[#0d1c2f]">${isEdit ? esc(taskToEdit.description || '') : ''}</textarea>
            </div>

            <!-- DANH SÁCH VIỆC CON (SUBTASKS) -->
            <div class="p-3.5 rounded-xl border border-[#e2e8f0] bg-[#fffbeb]/40 flex flex-col gap-2.5 shadow-2xs">
              <div class="flex items-center justify-between">
                <label class="block text-[12.5px] font-bold text-[#795900] flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[18px]">account_tree</span>
                  <span>Danh sách việc con (Subtasks)</span>
                </label>
                <span class="text-[11px] font-bold text-[#92400e] bg-[#fef3c7] px-2 py-0.5 rounded-md" id="modalSubtaskCountBadge">0 việc con</span>
              </div>

              <!-- Ô NHẬP VIỆC CON NHANH (INPUT ĐẠT CHUẨN HEIGHT) -->
              <div class="flex gap-2">
                <input type="text" id="inputModalSubtaskTitle" placeholder="Nhập tên việc con (VD: Đối soát tài liệu, kiểm kê...)" class="flex-1 h-11 px-3.5 rounded-lg border border-[#cbd5e1] text-[13px] outline-none focus:border-[#d6a52a] bg-white text-[#0d1c2f]" />
                <button type="button" id="btnAddModalSubtask" class="px-4 h-11 rounded-lg bg-[#d6a52a] text-[#533d00] hover:bg-[#795900] hover:text-white font-bold text-[13px] flex items-center gap-1 shrink-0 cursor-pointer transition-colors shadow-2xs min-h-[44px]">
                  <span class="material-symbols-outlined text-[18px]">add</span>
                  <span>Thêm</span>
                </button>
              </div>

              <!-- DANH SÁCH CÁC VIỆC CON ĐÃ THÊM -->
              <div id="modalSubtasksContainer" class="flex flex-col gap-1.5 empty:hidden pt-0.5 max-h-48 overflow-y-auto"></div>
            </div>

            <!-- PHÂN CÔNG NGƯỜI THỰC HIỆN (ASSIGNEE) - THIẾT KẾ ĐẲNG CẤP TOÀN HỆ THỐNG -->
            <div class="p-3.5 rounded-xl border border-[#e2e8f0] flex flex-col gap-2.5" style="background-color: var(--primary-soft); border-color: var(--border);">
              <div class="flex items-center justify-between">
                <label class="block text-[12.5px] font-bold flex items-center gap-1.5" style="color: var(--primary);">
                  <span class="material-symbols-outlined text-[18px]">person_check</span>
                  <span>Phân công người thực hiện (Assignee) *</span>
                </label>
                <span class="text-[10.5px] font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-md border border-amber-200" id="assigneeDeptBadge">
                  ${esc(taskDept.name)}
                </span>
              </div>

              <!-- THẺ THÀNH VIÊN ĐƯỢC CHỌN (1-CHẠM MỞ MEMBER PICKER) -->
              <div 
                id="btnOpenAssigneePicker" 
                class="flex items-center justify-between p-3 rounded-xl bg-white border border-[#cbd5e1] hover:border-[#d6a52a] transition-all cursor-pointer shadow-2xs group min-h-[56px]" 
                style="background-color: var(--card); border-color: var(--border);"
                title="Nhấn để chọn nhân viên trong phòng ban này"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <div class="relative shrink-0">
                    <img id="newTaskAssigneeAvatar" src="${currentAssigneeUser.avatar}" class="w-10 h-10 rounded-full object-cover ring-2 ring-amber-300 shadow-xs" />
                    <span class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                  </div>
                  <div class="min-w-0 flex flex-col text-left">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span id="newTaskAssigneeName" class="font-bold text-[13.5px] text-[#0d1c2f] truncate" style="color: var(--text);">
                        ${esc(currentAssigneeUser.name)}
                      </span>
                      <span id="newTaskAssigneeBadge" class="font-mono-data text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                        ${esc(currentAssigneeUser.badge || currentAssigneeUser.role || 'Thành viên')}
                      </span>
                    </div>
                    <span id="newTaskAssigneeTitle" class="text-[11.5px] text-[#64748b] truncate mt-0.5">
                      ${esc(currentAssigneeUser.title || 'Chuyên viên')}
                    </span>
                  </div>
                </div>

                <div class="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#f8f9ff] text-[#795900] group-hover:bg-[#fffbeb] border border-[#e2e8f0] transition-colors shrink-0 font-bold text-[12px]">
                  <span>Đổi người</span>
                  <span class="material-symbols-outlined text-[18px]">expand_more</span>
                </div>
              </div>

              <!-- INPUT ẨN LƯU VALUE CỦA ASSIGNEE -->
              <input type="hidden" id="newTaskAssignee" value="${selectedAssigneeId}" />

              <span class="text-[11px] text-[#817663]">
                * Hệ thống tự động lọc chỉ hiển thị nhân sự thuộc phòng ban được phân công.
              </span>
            </div>

            <!-- SWITCH YÊU CẦU PHÊ DUYỆT 1-CHẠM (APPROVAL WORKFLOW) -->
            <div class="p-3.5 rounded-xl border border-amber-200 bg-amber-50/60 flex flex-col gap-2.5">
              <div class="flex items-center justify-between">
                <label for="newTaskRequireApproval" class="flex items-center gap-2.5 cursor-pointer select-none">
                  <input type="checkbox" id="newTaskRequireApproval" ${requiresApproval ? 'checked' : ''} class="w-5 h-5 rounded text-[#d6a52a] focus:ring-[#d6a52a] cursor-pointer" />
                  <span class="text-[13px] font-bold text-[#0d1c2f]">Yêu cầu phê duyệt (One-Tap Approval)</span>
                </label>
                <span class="text-[11px] font-bold text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded-md">Trình ký</span>
              </div>
              <p class="text-[11.5px] text-[#64748b]">Bật tùy chọn này nếu công việc cần Trưởng phòng hoặc Ban Lãnh Đạo ký duyệt trước khi nghiệm thu.</p>

              <!-- KHỐI CHỌN NGƯỜI DUYỆT (ẨN/HIỆN KHI BẬT SWITCH) -->
              <div id="approverSelectionBox" class="${requiresApproval ? '' : 'hidden'} flex flex-col gap-1.5 pt-2 border-t border-amber-200/70">
                <label class="block text-[12px] font-bold text-[#0d1c2f]">Chỉ định Người phê duyệt *</label>
                <select id="newTaskApprover" class="w-full h-11 px-3 rounded-xl border border-amber-300 text-[13.5px] font-bold text-[#0d1c2f] outline-none focus:border-[#d6a52a] bg-white cursor-pointer shadow-2xs">
                  ${approvers.map(u => {
                    const rText = (u.isAdmin || u.role === 'ADMIN')
                      ? (u.role === 'MANAGER' ? 'Trưởng phòng (Admin)' : (u.role === 'LEADERSHIP' ? 'Lãnh đạo (Admin)' : (u.role === 'MEMBER' ? 'Chuyên viên (Admin)' : 'Admin')))
                      : (u.role === 'LEADERSHIP' ? 'Ban Lãnh Đạo' : (u.role === 'MANAGER' ? 'Trưởng phòng' : 'Phó phòng'));
                    return `<option value="${u.id}" ${u.id === defaultApproverId ? 'selected' : ''}>[${rText}] ${esc(u.name)} (${esc(u.title)})</option>`;
                  }).join('')}
                </select>
                <span class="text-[10.5px] text-amber-800">
                  Người duyệt sẽ nhận chuông thông báo ngay khi công việc được tạo hoặc gửi trình duyệt.
                </span>
              </div>
            </div>

            <!-- ƯU TIÊN & HẠN HOÀN THÀNH -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label class="block text-[12.5px] font-bold text-[#0d1c2f] mb-1" style="color: var(--text);">Mức độ ưu tiên *</label>
                <select id="newTaskPriority" class="w-full h-11 px-3 rounded-xl border border-[#e2e8f0] text-[13.5px] outline-none focus:border-[#d6a52a] bg-[#f8f9ff] focus:bg-white text-[#0d1c2f] cursor-pointer">
                  <option value="P1" ${currentPriority === 'P1' ? 'selected' : ''}>P1 - Khẩn cấp (Cần xử lý ngay)</option>
                  <option value="P2" ${currentPriority === 'P2' ? 'selected' : ''}>P2 - Quan trọng</option>
                  <option value="P3" ${currentPriority === 'P3' ? 'selected' : ''}>P3 - Tiêu chuẩn</option>
                </select>
              </div>

              <div>
                <label class="block text-[12.5px] font-bold text-[#0d1c2f] mb-1" style="color: var(--text);">Hạn hoàn thành *</label>
                <input type="date" id="newTaskDueDate" required value="${currentDueDate}" class="w-full h-11 px-3 rounded-xl border border-[#e2e8f0] text-[13.5px] outline-none focus:border-[#d6a52a] bg-[#f8f9ff] focus:bg-white text-[#0d1c2f]" />
              </div>
            </div>

            <!-- CHUYÊN MÔN & DỰ TOÁN KINH PHÍ -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label class="block text-[12.5px] font-bold text-[#0d1c2f] mb-1" style="color: var(--text);">Chuyên môn / Danh mục</label>
                <input type="text" id="newTaskCategory" placeholder="Ví dụ: Khám Đoàn, BHYT, CSKH" value="${esc(currentCategory)}" class="w-full h-11 px-3 rounded-xl border border-[#e2e8f0] text-[13.5px] outline-none focus:border-[#d6a52a] bg-[#f8f9ff] focus:bg-white text-[#0d1c2f]" />
              </div>

              <div>
                <label class="block text-[12.5px] font-bold text-[#0d1c2f] mb-1" style="color: var(--text);">Dự toán kinh phí (VNĐ)</label>
                <input type="number" id="newTaskCost" value="${currentCost}" step="500000" class="w-full h-11 px-3 rounded-xl border border-[#e2e8f0] text-[13.5px] outline-none focus:border-[#d6a52a] bg-[#f8f9ff] focus:bg-white text-[#0d1c2f]" />
              </div>
            </div>

            </div>

            <!-- ACTIONS (STICKY ACTION BAR ON MOBILE) -->
            <div class="p-3.5 sm:p-4 border-t border-[#f1f5f9] bg-[#f8f9ff]/70 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 shrink-0" style="border-color: var(--border);">
              <button type="button" class="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#e2e8f0] text-[#64748b] text-[13px] font-semibold hover:bg-gray-50 min-h-[44px] cursor-pointer" id="btnCancelCreateTask">
                Hủy bỏ
              </button>
              <button type="submit" class="w-full sm:w-auto px-5 py-2.5 rounded-xl text-[13px] font-bold shadow-xs transition-all min-h-[44px] flex items-center justify-center gap-1.5 cursor-pointer" style="background-color: var(--primary-container); color: var(--on-primary-container);">
                ${isEdit ? `
                  <span class="material-symbols-outlined text-[18px]">save</span>
                  <span>Lưu Thay Đổi Nhiệm Vụ</span>
                ` : `
                  <span class="material-symbols-outlined text-[18px]">send</span>
                  <span>Tạo &amp; Giao Việc</span>
                `}
              </button>
            </div>
          </form>
        </div>

        <!-- POPUP CHỌN NHÂN VIÊN TRONG PHÒNG BAN (TOUCH TARGET >= 44PX TOÀN HỆ THỐNG) -->
        <div id="assigneePickerModal" class="hidden fixed inset-0 z-[120] bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div class="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full p-4 sm:p-5 flex flex-col gap-3 shadow-2xl border border-[#cbd5e1] max-h-[82vh] overflow-hidden" style="background-color: var(--card); border-color: var(--border);">
            
            <div class="flex items-center justify-between pb-2 border-b border-[#f1f5f9]" style="border-color: var(--border);">
              <div>
                <h4 class="font-bold text-[15px] text-[#0d1c2f]" style="color: var(--text);">Chọn Người Phụ Trách</h4>
                <p class="text-[11.5px] text-[#64748b]">Nhân sự thuộc <strong id="assigneePickerDeptName" class="text-[#0d1c2f]">${esc(taskDept.name)}</strong></p>
              </div>
              <button type="button" id="btnCloseAssigneeModal" class="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer">
                <span class="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <!-- Ô TÌM KIẾM NHANH NHÂN SỰ -->
            <div class="relative">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-gray-400">search</span>
              <input 
                type="text" 
                id="inputSearchAssignee" 
                placeholder="Tìm theo tên nhân viên hoặc chức danh..." 
                class="w-full h-11 pl-9 pr-3 rounded-xl border border-[#cbd5e1] text-[13px] outline-none focus:border-[#d6a52a] bg-[#f8f9ff] text-[#0d1c2f]" 
                style="color: var(--text); border-color: var(--border);"
              />
            </div>

            <!-- DANH SÁCH THẺ NHÂN VIÊN (SCROLLABLE) -->
            <div id="assigneeMemberList" class="flex flex-col gap-1.5 overflow-y-auto max-h-72 pr-1">
              <!-- Rendered dynamically -->
            </div>
          </div>
        </div>

      </div>
    `;

    this.bindEvents(isEdit, taskDept.id);
  }

  bindEvents(isEdit = false, defaultDeptId = 'dept_ptkh') {
    const overlay = this.container.querySelector('#createModalOverlay');
    const btnClose = this.container.querySelector('#btnCloseCreateModal');
    const btnCancel = this.container.querySelector('#btnCancelCreateTask');
    const form = this.container.querySelector('#formCreateTask');
    const chkRequireApproval = this.container.querySelector('#newTaskRequireApproval');
    const approverBox = this.container.querySelector('#approverSelectionBox');

    // QUẢN LÝ MEMBER PICKER ASSIGNEE (CHỈ HIỂN THỊ NHÂN SỰ PHÒNG BAN ĐƯỢC CHỌN)
    const hiddenAssignee = this.container.querySelector('#newTaskAssignee');
    const avatarImg = this.container.querySelector('#newTaskAssigneeAvatar');
    const nameSpan = this.container.querySelector('#newTaskAssigneeName');
    const titleSpan = this.container.querySelector('#newTaskAssigneeTitle');
    const badgeSpan = this.container.querySelector('#newTaskAssigneeBadge');
    const deptBadge = this.container.querySelector('#assigneeDeptBadge');

    const btnOpenPicker = this.container.querySelector('#btnOpenAssigneePicker');
    const pickerModal = this.container.querySelector('#assigneePickerModal');
    const btnClosePicker = this.container.querySelector('#btnCloseAssigneeModal');
    const inputSearchAssignee = this.container.querySelector('#inputSearchAssignee');
    const memberListContainer = this.container.querySelector('#assigneeMemberList');
    const pickerDeptName = this.container.querySelector('#assigneePickerDeptName');

    let currentDeptId = defaultDeptId;

    const renderMemberList = (searchQuery = '') => {
      if (!memberListContainer) return;
      const dept = store.getDepartmentById(currentDeptId);
      const members = store.getAllUsers().filter(u => u.departmentId === currentDeptId || u.departmentId === 'all');
      
      let filtered = members;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(u => 
          u.name.toLowerCase().includes(q) || 
          (u.title && u.title.toLowerCase().includes(q)) ||
          (u.badge && u.badge.toLowerCase().includes(q))
        );
      }

      if (filtered.length === 0) {
        memberListContainer.innerHTML = `
          <div class="p-6 text-center text-gray-400 text-[12.5px]">
            Không tìm thấy nhân viên phù hợp trong phòng ban này.
          </div>
        `;
        return;
      }

      const selectedId = hiddenAssignee ? hiddenAssignee.value : '';
      const currentDeptTeams = dept ? (dept.teams || []) : [];

      memberListContainer.innerHTML = filtered.map(u => {
        const isSelected = u.id === selectedId;
        const team = currentDeptTeams.find(t => t.id === u.teamId);
        return `
          <div 
            class="item-select-member flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer min-h-[48px] ${isSelected ? 'bg-amber-50/80 border-[#d6a52a] shadow-xs' : 'bg-white hover:bg-gray-50 border-[#e2e8f0]'}"
            data-user-id="${u.id}"
            style="background-color: ${isSelected ? 'var(--primary-soft)' : 'var(--card)'}; border-color: ${isSelected ? 'var(--primary)' : 'var(--border)'};"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div class="relative shrink-0">
                <img src="${u.avatar}" class="w-9 h-9 rounded-full object-cover ring-1 ring-gray-200" />
                <span class="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white"></span>
              </div>
              <div class="min-w-0 flex flex-col text-left">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-[13px] text-[#0d1c2f] truncate" style="color: var(--text);">${esc(u.name)}</span>
                  <span class="text-[10px] font-mono-data font-bold px-1.5 py-0.2 rounded bg-gray-100 text-gray-700">${esc(u.badge || u.role)}</span>
                </div>
                <div class="flex items-center gap-1.5 text-[11px] text-[#64748b] mt-0.5">
                  ${team ? `<span class="font-semibold text-amber-800">[${esc(team.code)}]</span>` : ''}
                  <span class="truncate">${esc(u.title || 'Chuyên viên')}</span>
                </div>
              </div>
            </div>

            <div class="shrink-0 pl-2">
              ${isSelected ? `
                <span class="material-symbols-outlined text-[20px]" style="color: var(--primary);">check_circle</span>
              ` : `
                <span class="material-symbols-outlined text-[20px] text-gray-300">radio_button_unchecked</span>
              `}
            </div>
          </div>
        `;
      }).join('');

      // Gán click cho từng nhân viên
      memberListContainer.querySelectorAll('.item-select-member').forEach(item => {
        item.addEventListener('click', () => {
          rung(10);
          const userId = item.dataset.userId;
          const u = store.getUserById(userId);
          if (u) {
            if (hiddenAssignee) hiddenAssignee.value = u.id;
            if (avatarImg) avatarImg.src = u.avatar;
            if (nameSpan) nameSpan.textContent = u.name;
            if (titleSpan) titleSpan.textContent = u.title || 'Chuyên viên';
            if (badgeSpan) badgeSpan.textContent = u.badge || u.role || 'Thành viên';
          }
          if (pickerModal) pickerModal.classList.add('hidden');
        });
      });
    };

    if (btnOpenPicker && pickerModal) {
      btnOpenPicker.addEventListener('click', () => {
        rung(10);
        if (inputSearchAssignee) inputSearchAssignee.value = '';
        renderMemberList();
        pickerModal.classList.remove('hidden');
        if (inputSearchAssignee) inputSearchAssignee.focus();
      });
    }

    if (btnClosePicker && pickerModal) {
      btnClosePicker.addEventListener('click', () => {
        pickerModal.classList.add('hidden');
      });
    }

    if (pickerModal) {
      pickerModal.addEventListener('click', (e) => {
        if (e.target === pickerModal) pickerModal.classList.add('hidden');
      });
    }

    if (inputSearchAssignee) {
      inputSearchAssignee.addEventListener('input', (e) => {
        renderMemberList(e.target.value);
      });
    }

    // Đổi phòng ban tiếp nhận -> Tự động nạp lại Assignee và Team tương ứng
    const selectDept = this.container.querySelector('#newTaskDept');
    const selectTeam = this.container.querySelector('#newTaskTeam');
    if (selectDept) {
      selectDept.addEventListener('change', () => {
        const chosenDept = store.getDepartmentById(selectDept.value);
        if (chosenDept) {
          currentDeptId = chosenDept.id;
          if (deptBadge) deptBadge.textContent = chosenDept.name;
          if (pickerDeptName) pickerDeptName.textContent = chosenDept.name;

          // Cập nhật Team
          if (selectTeam) {
            const tms = chosenDept.teams || [];
            selectTeam.innerHTML = `
              <option value="">-- Toàn phòng ban / Chưa phân tổ --</option>
              ${tms.map(t => `<option value="${t.id}">${esc(t.name)} (${esc(t.code)})</option>`).join('')}
            `;
          }

          // Kiểm tra xem assignee hiện tại có thuộc phòng ban mới không
          const newDeptUsers = store.getAllUsers().filter(u => u.departmentId === currentDeptId || u.departmentId === 'all');
          const isStillValid = newDeptUsers.some(u => u.id === (hiddenAssignee ? hiddenAssignee.value : ''));
          if (!isStillValid && newDeptUsers.length > 0) {
            const defaultUser = newDeptUsers[0];
            if (hiddenAssignee) hiddenAssignee.value = defaultUser.id;
            if (avatarImg) avatarImg.src = defaultUser.avatar;
            if (nameSpan) nameSpan.textContent = defaultUser.name;
            if (titleSpan) titleSpan.textContent = defaultUser.title || 'Chuyên viên';
            if (badgeSpan) badgeSpan.textContent = defaultUser.badge || defaultUser.role || 'Thành viên';
          }
        }
      });
    }

    // Toggle hộp chọn người duyệt khi bật/tắt switch
    if (chkRequireApproval && approverBox) {
      chkRequireApproval.addEventListener('change', () => {
        rung(10);
        if (chkRequireApproval.checked) {
          approverBox.classList.remove('hidden');
        } else {
          approverBox.classList.add('hidden');
        }
      });
    }

    // QUẢN LÝ VIỆC CON TRONG FORM (INITIALIZE TỪ TASK ĐANG SỬA HOẶC MỚI)
    const inputModalSubtaskTitle = this.container.querySelector('#inputModalSubtaskTitle');
    const btnAddModalSubtask = this.container.querySelector('#btnAddModalSubtask');
    const modalSubtasksContainer = this.container.querySelector('#modalSubtasksContainer');
    const modalSubtaskCountBadge = this.container.querySelector('#modalSubtaskCountBadge');
    
    // Nạp việc con từ task hiện tại nếu đang ở chế độ chỉnh sửa
    const initialSubtasks = (isEdit && this.taskToEdit && Array.isArray(this.taskToEdit.subtasks))
      ? JSON.parse(JSON.stringify(this.taskToEdit.subtasks))
      : [];
    const tempSubtasks = [...initialSubtasks];

    const renderTempSubtasks = () => {
      if (!modalSubtasksContainer) return;
      if (tempSubtasks.length === 0) {
        modalSubtasksContainer.innerHTML = '';
        if (modalSubtaskCountBadge) modalSubtaskCountBadge.textContent = '0 việc con';
        return;
      }

      if (modalSubtaskCountBadge) modalSubtaskCountBadge.textContent = `${tempSubtasks.length} việc con`;
      modalSubtasksContainer.innerHTML = tempSubtasks.map((st, idx) => {
        const isCompleted = st.completed || st.status === 'done';
        return `
          <div class="p-2 sm:px-3 rounded-xl bg-white border border-[#e2e8f0] flex items-center justify-between gap-2 shadow-2xs">
            <div class="flex items-center gap-2 min-w-0">
              <span class="w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-[#d6a52a]'} shrink-0"></span>
              <span class="text-[12px] font-bold text-[#795900] font-mono-data">#${idx + 1}</span>
              <span class="text-[12.5px] font-semibold text-[#0d1c2f] truncate ${isCompleted ? 'line-through text-gray-400' : ''}">${esc(st.title || st.text)}</span>
            </div>
            <button type="button" class="btn-remove-temp-subtask text-rose-500 hover:text-rose-700 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-rose-50 cursor-pointer shrink-0" data-index="${idx}" title="Xóa việc con này">
              <span class="material-symbols-outlined text-[17px]">close</span>
            </button>
          </div>
        `;
      }).join('');

      modalSubtasksContainer.querySelectorAll('.btn-remove-temp-subtask').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          rung(10);
          const idx = parseInt(btn.dataset.index, 10);
          tempSubtasks.splice(idx, 1);
          renderTempSubtasks();
        });
      });
    };

    // Render danh sách ban đầu nếu có
    renderTempSubtasks();

    const addTempSubtask = () => {
      if (!inputModalSubtaskTitle) return;
      const title = inputModalSubtaskTitle.value.trim();
      if (!title) {
        toast('Vui lòng nhập tên việc con', 'warning');
        return;
      }
      rung(10);
      tempSubtasks.push({
        title,
        description: '',
        assigneeId: selectAssignee ? selectAssignee.value : '',
        dueDate: this.container.querySelector('#newTaskDueDate')?.value || new Date().toISOString().split('T')[0],
        status: 'todo',
        completed: false
      });
      inputModalSubtaskTitle.value = '';
      renderTempSubtasks();
    };

    if (btnAddModalSubtask) btnAddModalSubtask.addEventListener('click', addTempSubtask);
    if (inputModalSubtaskTitle) {
      inputModalSubtaskTitle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addTempSubtask();
        }
      });
    }

    const closeModal = () => {
      rung(10);
      this.taskToEdit = null;
      if (overlay) overlay.remove();
    };

    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnCancel) btnCancel.addEventListener('click', closeModal);
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        rung(15);

        const currentDept = auth.getActiveDepartment() || { id: 'dept_ptkh' };
        const currentUser = auth.getCurrentUser() || { id: 'usr_admin' };

        const selectDept = this.container.querySelector('#newTaskDept');
        let targetDeptId = selectDept ? selectDept.value : currentDept.id;
        if (targetDeptId === 'all') {
          const allDepts = store.getDepartments().filter(d => d.id !== 'all');
          targetDeptId = allDepts.length > 0 ? allDepts[0].id : 'dept_ptkh';
        }

        const title = this.container.querySelector('#newTaskTitle').value.trim();
        const teamId = this.container.querySelector('#newTaskTeam').value || '';
        const description = this.container.querySelector('#newTaskDesc').value.trim();
        const assigneeId = this.container.querySelector('#newTaskAssignee').value;
        const priority = this.container.querySelector('#newTaskPriority').value;
        const dueDate = this.container.querySelector('#newTaskDueDate').value;
        const category = this.container.querySelector('#newTaskCategory').value.trim() || 'Chuyên môn';
        const cost = parseFloat(this.container.querySelector('#newTaskCost').value) || 0;
        const requiresApproval = chkRequireApproval ? chkRequireApproval.checked : false;
        const approverId = requiresApproval ? (this.container.querySelector('#newTaskApprover')?.value || '') : '';

        if (!title) {
          toast('Vui lòng nhập tên công việc!', 'warning');
          return;
        }

        if (isEdit && this.taskToEdit) {
          // CHẾ ĐỘ CẬP NHẬT CÔNG VIỆC HIỆN TẠI
          const updatedTask = store.updateTask(this.taskToEdit.id, {
            title,
            description,
            departmentId: targetDeptId,
            teamId,
            assigneeId,
            priority,
            dueDate,
            category,
            cost,
            requiresApproval,
            approverId,
            subtasks: tempSubtasks
          });

          toast(`Đã lưu thay đổi nhiệm vụ: ${this.taskToEdit.id}`, 'success');
          closeModal();
          if (this.onTaskCreated) this.onTaskCreated(updatedTask);
        } else {
          // CHẾ ĐỘ TẠO MỚI CÔNG VIỆC
          const newTask = store.createTask({
            title,
            description,
            departmentId: targetDeptId,
            teamId,
            assigneeId,
            creatorId: currentUser.id,
            priority,
            dueDate,
            category,
            cost,
            requiresApproval,
            approverId,
            subtasks: tempSubtasks
          });

          toast(`Đã giao việc thành công: ${newTask.id}`, 'success');
          closeModal();
          if (this.onTaskCreated) this.onTaskCreated(newTask);
        }
      });
    }
  }
}


/**
 * THANH VŨ MEDIC CS3 - SUBTASKS LIST MODAL COMPONENT (SHIN AIOS v2.7)
 * Modal hiển thị toàn bộ danh sách việc con của một nhiệm vụ cha được chọn:
 * - Thay thế hoàn toàn dropdown nhỏ khó bấm
 * - Vùng bấm chuẩn Touch Target >= 44px
 * - Xem tiến độ hoàn thành %, checkbox tick xong tức thì
 * - Nút thêm việc con mới, sửa inline an toàn với ID có dấu chấm
 * - Hỗ trợ mở chi tiết đầy đủ từng việc con (SubtaskDetailModal)
 */

import { store } from '../store.js?v=7.7';
import { esc, ngayVN, toast, rung, xacNhanXoa } from '../helpers.js?v=7.7';

export class SubtasksModal {
  constructor(containerId, onTaskUpdated, onOpenTaskDetail = null, onOpenSubtaskDetail = null) {
    this.container = document.getElementById(containerId);
    this.onTaskUpdated = onTaskUpdated;
    this.onOpenTaskDetail = onOpenTaskDetail;
    this.onOpenSubtaskDetail = onOpenSubtaskDetail;
    this.currentTaskId = null;
    this.showAddForm = false;
  }

  show(taskId) {
    if (!this.container) return;
    rung(10);
    this.currentTaskId = taskId;
    this.showAddForm = false;
    this.render();
  }

  render() {
    if (!this.currentTaskId) return;

    const task = store.getTaskById(this.currentTaskId);
    if (!task) return;

    const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
    const completedCount = subtasks.filter(s => s.completed || s.status === 'done').length;
    const progress = subtasks.length > 0 ? Math.round((completedCount / subtasks.length) * 100) : (task.progress || 0);
    const allUsers = store.getAllUsers();

    let overlay = document.getElementById('subtasksModalOverlay');
    const existingCard = overlay ? overlay.querySelector('.modal-card') : null;
    const prevScrollTop = existingCard ? existingCard.scrollTop : 0;

    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'subtasksModalOverlay';
      overlay.className = 'modal-overlay fixed inset-0 z-[105] bg-black/45 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 active animate-fade-in';
      document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
        <div class="modal-card bg-white rounded-t-2xl sm:rounded-2xl rounded-b-none sm:rounded-b-2xl p-4 sm:p-6 max-w-2xl w-full shadow-2xl border border-[#e2e8f0] max-h-[90vh] sm:max-h-[88vh] overflow-y-auto overflow-x-hidden flex flex-col gap-4" style="background-color: var(--card); border-color: var(--border);">
          
          <!-- HEADER -->
          <div class="flex items-center justify-between pb-3.5 border-b border-[#f1f5f9]" style="border-color: var(--border);">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-10 h-10 rounded-2xl bg-[#fffbeb] text-[#795900] border border-[#fef3c7] flex items-center justify-center font-bold shadow-xs shrink-0">
                <span class="material-symbols-outlined text-[22px]">account_tree</span>
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <h3 class="font-bold text-[16px] sm:text-[17px] text-[#0d1c2f]" style="color: var(--text);">
                    Danh Sách Việc Con
                  </h3>
                  <span class="font-mono-data text-[11px] font-bold px-2 py-0.5 rounded bg-[#fffbeb] text-[#795900] border border-[#fef3c7] shrink-0">
                    ${esc(task.id)}
                  </span>
                </div>
                <p class="text-[12px] text-[#64748b] mt-0.5 leading-snug break-words">
                  Nhiệm vụ: <strong class="text-[#0d1c2f] font-semibold">${esc(task.title)}</strong>
                </p>
              </div>
            </div>

            <button type="button" class="text-gray-400 hover:text-gray-700 text-2xl font-bold min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors cursor-pointer shrink-0" id="btnCloseSubtasksModal" aria-label="Đóng">&times;</button>
          </div>

          <!-- THANH TIẾN ĐỘ HOÀN THÀNH VIỆC CON -->
          <div class="p-3.5 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] flex flex-col gap-2">
            <div class="flex items-center justify-between text-[12.5px]">
              <span class="font-bold text-[#0d1c2f] flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[17px] text-[#795900]">fact_check</span>
                <span>Tiến độ hoàn thành: <strong id="modalSubtasksCountText">${completedCount}/${subtasks.length}</strong> việc con</span>
              </span>
              <span class="font-mono-data font-bold text-[#795900] text-[13.5px]" id="modalSubtasksPctText">${progress}%</span>
            </div>
            <div class="w-full bg-[#e2e8f0] h-2.5 rounded-full overflow-hidden">
              <div class="bg-[#d6a52a] h-2.5 rounded-full transition-all duration-300" id="modalSubtasksProgressBar" style="width: ${progress}%"></div>
            </div>
          </div>

          <!-- THANH CÔNG CỤ: THÊM VIỆC CON & XEM TASK CHA -->
          <div class="flex flex-wrap items-center justify-between gap-2">
            <button type="button" id="btnToggleAddSubtaskForm" class="px-3.5 py-2 rounded-xl bg-[#d6a52a] text-[#533d00] hover:bg-[#795900] hover:text-white font-bold text-[12.5px] min-h-[40px] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs">
              <span class="material-symbols-outlined text-[18px]">${this.showAddForm ? 'close' : 'add'}</span>
              <span>${this.showAddForm ? 'Đóng form thêm' : 'Thêm việc con mới'}</span>
            </button>

            <button type="button" id="btnOpenParentTaskDetail" class="px-3 py-2 rounded-xl border border-[#e2e8f0] text-[#64748b] hover:text-[#0d1c2f] hover:bg-gray-50 font-semibold text-[12px] min-h-[40px] flex items-center gap-1.5 transition-colors cursor-pointer">
              <span class="material-symbols-outlined text-[17px]">visibility</span>
              <span>Xem chi tiết nhiệm vụ cha</span>
            </button>
          </div>

          <!-- FORM THÊM VIỆC CON MỚI (TÙY CHỌN BẬT / TẮT) -->
          ${this.showAddForm ? `
            <form id="formAddSubtaskModal" class="p-3.5 sm:p-4 rounded-2xl border border-[#d6a52a] bg-[#fffbeb]/30 flex flex-col gap-3 animate-fade-in shadow-2xs">
              <div class="flex items-center justify-between">
                <span class="text-[12.5px] font-bold text-[#795900] flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[18px]">add_task</span>
                  <span>Tạo việc con mới</span>
                </span>
                <span class="text-[11px] text-[#817663]">Sẽ tự động đồng bộ vào tiến độ</span>
              </div>

              <div>
                <label class="block text-[11.5px] font-bold text-[#0d1c2f] mb-1">Tiêu đề việc con *</label>
                <input type="text" id="modalInputNewTitle" required placeholder="Nhập tên việc con (VD: Đối soát hóa đơn BHYT, kiểm kê kho thuốc...)" class="w-full h-11 px-3.5 rounded-lg border border-[#cbd5e1] text-[13.5px] outline-none focus:border-[#d6a52a] bg-white text-[#0d1c2f]" />
              </div>

              <div>
                <label class="block text-[11.5px] font-bold text-[#0d1c2f] mb-1">Mô tả &amp; Tiêu chuẩn nghiệm thu</label>
                <textarea id="modalInputNewDesc" rows="2" placeholder="Ghi chú chi tiết yêu cầu, tiêu chuẩn kỹ thuật..." class="w-full p-2.5 rounded-lg border border-[#cbd5e1] text-[12.5px] outline-none focus:border-[#d6a52a] bg-white text-[#0d1c2f]"></textarea>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label class="block text-[11px] font-bold text-[#0d1c2f] mb-1">Người phụ trách</label>
                  <select id="modalSelectNewAssignee" class="w-full h-11 px-3 rounded-lg border border-[#cbd5e1] text-[13px] outline-none focus:border-[#d6a52a] bg-white cursor-pointer">
                    <option value="">-- Mặc định theo nhiệm vụ cha --</option>
                    ${allUsers.map(u => `
                      <option value="${u.id}">${esc(u.name)} (${esc(u.title)})</option>
                    `).join('')}
                  </select>
                </div>

                <div>
                  <label class="block text-[11px] font-bold text-[#0d1c2f] mb-1">Hạn hoàn thành</label>
                  <input type="date" id="modalInputNewDueDate" value="${task.dueDate ? task.dueDate.slice(0, 10) : new Date().toISOString().split('T')[0]}" class="w-full h-11 px-3 rounded-lg border border-[#cbd5e1] text-[13px] font-mono-data outline-none focus:border-[#d6a52a] bg-white" />
                </div>
              </div>

              <div class="flex items-center justify-end gap-2 pt-1">
                <button type="button" id="btnCancelAddSubtaskModal" class="px-3.5 py-2 rounded-xl border border-[#e2e8f0] text-[#64748b] text-[12px] font-semibold hover:bg-gray-100 min-h-[38px] cursor-pointer">
                  Hủy
                </button>
                <button type="submit" class="px-4 py-2 rounded-xl bg-[#d6a52a] text-[#533d00] hover:bg-[#795900] hover:text-white font-bold text-[12px] min-h-[38px] flex items-center gap-1 shadow-2xs cursor-pointer transition-colors">
                  <span class="material-symbols-outlined text-[17px]">check</span>
                  <span>Tạo việc con</span>
                </button>
              </div>
            </form>
          ` : ''}

          <!-- DANH SÁCH CÁC THẺ VIỆC CON -->
          <div class="flex flex-col gap-2.5">
            ${subtasks.length === 0 ? `
              <div class="p-6 text-center text-[#64748b] bg-[#f8f9ff] rounded-2xl border border-dashed border-[#e2e8f0]">
                <span class="material-symbols-outlined text-[28px] text-[#d6a52a] mb-1 block">account_tree</span>
                <div class="font-bold text-[13.5px] text-[#0d1c2f]">Chưa có việc con nào</div>
                <p class="text-[12px] text-[#817663] mt-0.5">Bấm nút "Thêm việc con mới" ở trên để phân chia đầu việc chi tiết.</p>
              </div>
            ` : subtasks.map(s => {
              const sAssignee = store.getUserById(s.assigneeId);
              const isDone = s.completed || s.status === 'done';
              return `
                <div class="subtask-modal-card p-3 sm:p-3.5 rounded-2xl border border-[#e2e8f0] bg-white hover:border-[#d6a52a] hover:shadow-xs transition-all flex flex-col gap-2.5 cursor-pointer" data-subtask-id="${s.id}">
                  <!-- Hàng 1: Checkbox, Mã việc con, Badge trạng thái & Nút thao tác -->
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2 flex-wrap">
                      <input type="checkbox" class="chk-modal-subtask w-4 h-4 rounded text-[#d6a52a] focus:ring-[#d6a52a] cursor-pointer shrink-0" data-subtask-id="${s.id}" ${isDone ? 'checked' : ''} />
                      <span class="font-mono-data text-[10.5px] font-bold px-2 py-0.5 rounded bg-[#fffbeb] text-[#795900] border border-[#fef3c7] shrink-0">
                        ${esc(s.id)}
                      </span>
                      <span class="subtask-status-badge text-[10px] font-bold px-2.5 py-0.5 rounded-md shrink-0 ${isDone ? 'bg-teal-100 text-teal-800' : s.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}">
                        ${isDone ? 'Đã xong' : s.status === 'in_progress' ? 'Đang làm' : 'Chưa làm'}
                      </span>
                    </div>

                    <div class="flex items-center gap-1 shrink-0">
                      <button type="button" class="btn-toggle-inline-edit p-1.5 text-[#817663] hover:text-[#795900] hover:bg-amber-100/60 rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer transition-colors" data-subtask-id="${s.id}" title="Sửa nhanh việc con">
                        <span class="material-symbols-outlined text-[17px]">edit</span>
                      </button>
                      <button type="button" class="btn-delete-modal-subtask p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer transition-colors" data-subtask-id="${s.id}" title="Xóa việc con">
                        <span class="material-symbols-outlined text-[17px]">delete</span>
                      </button>
                    </div>
                  </div>

                  <!-- Hàng 2: Tiêu đề việc con chiếm toàn bộ chiều rộng, không bị cắt chữ (break-words) -->
                  <div class="subtask-title-text text-[13.5px] sm:text-[14px] font-bold text-[#0d1c2f] leading-snug break-words ${isDone ? 'line-through text-gray-400' : 'hover:text-[#795900]'} transition-colors">
                    ${esc(s.title || s.text)}
                  </div>

                  <!-- Hàng 3: Mô tả (nếu có) -->
                  ${s.description ? `
                    <div class="text-[12px] text-[#4f4635] bg-[#f8f9ff] p-2.5 rounded-xl border border-[#e2e8f0] leading-relaxed break-words">
                      ${esc(s.description)}
                    </div>
                  ` : ''}

                  <!-- Hàng 4: Phụ trách & Hạn chót -->
                  <div class="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#f1f5f9] text-[11.5px] text-[#64748b]">
                    <div class="flex items-center gap-1.5 min-w-0">
                      <img src="${sAssignee ? sAssignee.avatar : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80'}" class="w-4 h-4 rounded-full object-cover shrink-0 ring-1 ring-[#e2e8f0]" />
                      <span class="truncate">Phụ trách: <strong class="text-[#0d1c2f] font-semibold">${sAssignee ? esc(sAssignee.name) : 'Chưa giao'}</strong></span>
                    </div>
                    <div class="flex items-center gap-1 font-mono-data text-[#817663] shrink-0">
                      <span class="material-symbols-outlined text-[14px] text-[#795900]">event</span>
                      <span>Hạn: <strong class="text-[#0d1c2f]">${s.dueDate ? ngayVN(s.dueDate) : 'Chưa đặt'}</strong></span>
                    </div>
                  </div>

                  <!-- FORM SỬA INLINE (AN TOÀN ID CÓ DẤU CHẤM) -->
                  <div class="edit-subtask-form-box hidden p-3 mt-1 bg-white rounded-xl border border-[#d6a52a] flex flex-col gap-2.5 animate-fade-in shadow-xs" data-subtask-form-id="${esc(s.id)}">
                    <div class="text-[11.5px] font-bold text-[#795900] flex items-center gap-1">
                      <span class="material-symbols-outlined text-[16px]">edit_note</span>
                      <span>Chỉnh sửa việc con ${esc(s.id)}</span>
                    </div>

                    <div>
                      <label class="block text-[11px] font-bold text-[#0d1c2f] mb-0.5">Tiêu đề việc con *</label>
                      <input type="text" class="edit-subtask-title w-full h-10 px-3 rounded-lg border border-[#cbd5e1] text-[13px] outline-none focus:border-[#d6a52a]" value="${esc(s.title || s.text)}" />
                    </div>

                    <div>
                      <label class="block text-[11px] font-bold text-[#0d1c2f] mb-0.5">Mô tả &amp; Tiêu chuẩn nghiệm thu</label>
                      <textarea class="edit-subtask-desc w-full p-2.5 rounded-lg border border-[#cbd5e1] text-[12.5px] outline-none focus:border-[#d6a52a]" rows="2">${esc(s.description || '')}</textarea>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label class="block text-[10.5px] font-bold text-[#0d1c2f] mb-0.5">Phân công</label>
                        <select class="edit-subtask-assignee w-full h-10 px-2.5 rounded-lg border border-[#cbd5e1] text-[12.5px] font-semibold outline-none focus:border-[#d6a52a]">
                          <option value="">-- Chưa giao --</option>
                          ${allUsers.map(u => `
                            <option value="${u.id}" ${u.id === s.assigneeId ? 'selected' : ''}>${esc(u.name)}</option>
                          `).join('')}
                        </select>
                      </div>

                      <div>
                        <label class="block text-[10.5px] font-bold text-[#0d1c2f] mb-0.5">Hạn chót</label>
                        <input type="date" class="edit-subtask-duedate w-full h-10 px-2.5 rounded-lg border border-[#cbd5e1] text-[12.5px] font-mono-data outline-none focus:border-[#d6a52a]" value="${s.dueDate ? s.dueDate.slice(0, 10) : ''}" />
                      </div>

                      <div>
                        <label class="block text-[10.5px] font-bold text-[#0d1c2f] mb-0.5">Trạng thái</label>
                        <select class="edit-subtask-status w-full h-10 px-2.5 rounded-lg border border-[#cbd5e1] text-[12.5px] font-bold outline-none focus:border-[#d6a52a]">
                          <option value="todo" ${s.status === 'todo' ? 'selected' : ''}>Chưa bắt đầu</option>
                          <option value="in_progress" ${s.status === 'in_progress' ? 'selected' : ''}>Đang thực hiện</option>
                          <option value="done" ${isDone ? 'selected' : ''}>Đã hoàn thành</option>
                        </select>
                      </div>
                    </div>

                    <div class="flex items-center justify-end gap-2 pt-1 border-t border-[#f1f5f9]">
                      <button type="button" class="btn-cancel-inline-edit px-3 py-1.5 rounded-lg border border-[#e2e8f0] text-[#64748b] text-[11.5px] font-semibold hover:bg-gray-50 cursor-pointer min-h-[34px]" data-subtask-id="${s.id}">
                        Hủy
                      </button>
                      <button type="button" class="btn-save-inline-edit px-3.5 py-1.5 rounded-lg bg-[#d6a52a] text-[#533d00] hover:bg-[#795900] hover:text-white font-bold text-[11.5px] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs min-h-[34px]" data-subtask-id="${s.id}">
                        <span class="material-symbols-outlined text-[15px]">save</span>
                        <span>Lưu</span>
                      </button>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- FOOTER -->
          <div class="flex items-center justify-end pt-3 border-t border-[#f1f5f9]">
            <button type="button" id="btnBottomCloseSubtasksModal" class="px-5 py-2.5 rounded-xl bg-[#0d1c2f] text-white hover:bg-black font-bold text-[12.5px] min-h-[42px] cursor-pointer transition-colors shadow-xs">
              Đóng
            </button>
          </div>

        </div>
      </div>
    `;

    this.bindEvents(task, overlay);

    const newCard = overlay.querySelector('.modal-card');
    if (newCard && prevScrollTop > 0) {
      newCard.scrollTop = prevScrollTop;
      requestAnimationFrame(() => {
        if (newCard) newCard.scrollTop = prevScrollTop;
      });
    }
  }

  bindEvents(task, overlay) {
    const btnClose = overlay.querySelector('#btnCloseSubtasksModal');
    const btnBottomClose = overlay.querySelector('#btnBottomCloseSubtasksModal');

    const closeModal = () => {
      rung(10);
      if (overlay) overlay.remove();
    };

    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnBottomClose) btnBottomClose.addEventListener('click', closeModal);
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
      });
    }

    // NÚT XEM CHI TIẾT TASK CHA
    const btnOpenParentTaskDetail = overlay.querySelector('#btnOpenParentTaskDetail');
    if (btnOpenParentTaskDetail) {
      btnOpenParentTaskDetail.addEventListener('click', () => {
        rung(10);
        closeModal();
        if (this.onOpenTaskDetail) {
          this.onOpenTaskDetail(task.id);
        }
      });
    }

    // BẬT / TẮT FORM THÊM VIỆC CON
    const btnToggleAdd = overlay.querySelector('#btnToggleAddSubtaskForm');
    if (btnToggleAdd) {
      btnToggleAdd.addEventListener('click', () => {
        rung(10);
        this.showAddForm = !this.showAddForm;
        this.render();
      });
    }

    const btnCancelAdd = overlay.querySelector('#btnCancelAddSubtaskModal');
    if (btnCancelAdd) {
      btnCancelAdd.addEventListener('click', () => {
        rung(10);
        this.showAddForm = false;
        this.render();
      });
    }

    // FORM THÊM VIỆC CON
    const formAdd = overlay.querySelector('#formAddSubtaskModal');
    if (formAdd) {
      formAdd.addEventListener('submit', (e) => {
        e.preventDefault();
        rung(15);

        const title = overlay.querySelector('#modalInputNewTitle')?.value.trim();
        if (!title) {
          toast('Vui lòng nhập tên việc con', 'warning');
          return;
        }

        const description = overlay.querySelector('#modalInputNewDesc')?.value.trim() || '';
        const assigneeId = overlay.querySelector('#modalSelectNewAssignee')?.value || task.assigneeId;
        const dueDate = overlay.querySelector('#modalInputNewDueDate')?.value || task.dueDate;

        store.addSubtask(task.id, {
          title,
          description,
          assigneeId,
          dueDate,
          status: 'todo'
        });

        toast('Đã thêm việc con mới thành công!', 'success');
        this.showAddForm = false;
        if (this.onTaskUpdated) this.onTaskUpdated();
        this.render();
      });
    }

    // CHECKBOX VIỆC CON (CẬP NHẬT TRỰC TIẾP TẠI CHỖ, TUYỆT ĐỐI KHÔNG NHẢY SCROLL)
    overlay.querySelectorAll('.chk-modal-subtask').forEach(chk => {
      chk.addEventListener('change', () => {
        rung(10);
        const sid = chk.dataset.subtaskId;
        const isChecked = chk.checked;
        store.toggleSubtask(task.id, sid);

        // 1. Cập nhật DOM trực tiếp trên thẻ việc con
        const card = chk.closest('.subtask-modal-card');
        if (card) {
          const badge = card.querySelector('.subtask-status-badge');
          if (badge) {
            badge.textContent = isChecked ? 'Đã xong' : 'Chưa làm';
            badge.className = `subtask-status-badge text-[10px] font-bold px-2.5 py-0.5 rounded-md shrink-0 ${isChecked ? 'bg-teal-100 text-teal-800' : 'bg-gray-100 text-gray-700'}`;
          }
          const title = card.querySelector('.subtask-title-text');
          if (title) {
            if (isChecked) {
              title.classList.add('line-through', 'text-gray-400');
            } else {
              title.classList.remove('line-through', 'text-gray-400');
            }
          }
        }

        // 2. Cập nhật thanh tiến độ trên Header
        const allChecks = overlay.querySelectorAll('.chk-modal-subtask');
        const doneCount = Array.from(allChecks).filter(c => c.checked).length;
        const totalCount = allChecks.length;
        const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
        
        const countText = overlay.querySelector('#modalSubtasksCountText');
        if (countText) countText.textContent = `${doneCount}/${totalCount}`;
        const pctText = overlay.querySelector('#modalSubtasksPctText');
        if (pctText) pctText.textContent = `${pct}%`;
        const progressBar = overlay.querySelector('#modalSubtasksProgressBar');
        if (progressBar) progressBar.style.width = `${pct}%`;

        // 3. Thông báo cho background cập nhật ngầm
        if (this.onTaskUpdated) this.onTaskUpdated();
      });
    });

    // BẤM VÀO THẺ ĐỂ XEM CHI TIẾT ĐẦY ĐỦ VIỆC CON (BỎ HẲN NÚT ICON RIÊNG THEO YÊU CẦU)
    overlay.querySelectorAll('.subtask-modal-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // Không kích hoạt khi bấm vào nút thao tác, ô checkbox hoặc bên trong form sửa inline
        if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select') || e.target.closest('textarea') || e.target.closest('.edit-subtask-form-box')) {
          return;
        }
        rung(10);
        const sid = card.dataset.subtaskId;
        if (this.onOpenSubtaskDetail) {
          this.onOpenSubtaskDetail(task.id, sid);
        }
      });
    });

    // TOGGLE FORM SỬA INLINE (AN TOÀN SELECTOR DẤU CHẤM)
    overlay.querySelectorAll('.btn-toggle-inline-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        rung(10);
        const sid = btn.dataset.subtaskId;
        const form = Array.from(overlay.querySelectorAll('.edit-subtask-form-box')).find(f => f.dataset.subtaskFormId === sid);
        if (form) form.classList.toggle('hidden');
      });
    });

    // HỦY SỬA INLINE
    overlay.querySelectorAll('.btn-cancel-inline-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sid = btn.dataset.subtaskId;
        const form = Array.from(overlay.querySelectorAll('.edit-subtask-form-box')).find(f => f.dataset.subtaskFormId === sid);
        if (form) form.classList.add('hidden');
      });
    });

    // LƯU SỬA INLINE
    overlay.querySelectorAll('.btn-save-inline-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        rung(10);
        const sid = btn.dataset.subtaskId;
        const form = Array.from(overlay.querySelectorAll('.edit-subtask-form-box')).find(f => f.dataset.subtaskFormId === sid);
        if (!form) return;

        const title = form.querySelector('.edit-subtask-title')?.value.trim();
        if (!title) {
          toast('Vui lòng nhập tiêu đề việc con', 'warning');
          return;
        }

        const description = form.querySelector('.edit-subtask-desc')?.value.trim() || '';
        const assigneeId = form.querySelector('.edit-subtask-assignee')?.value || '';
        const dueDate = form.querySelector('.edit-subtask-duedate')?.value || '';
        const status = form.querySelector('.edit-subtask-status')?.value || 'todo';

        store.updateSubtask(task.id, sid, {
          title,
          description,
          assigneeId,
          dueDate,
          status
        });

        toast('Đã cập nhật việc con thành công!', 'success');
        if (this.onTaskUpdated) this.onTaskUpdated();
        this.render();
      });
    });

    // XÓA VIỆC CON (POPUP XÁC NHẬN CHUẨN SHIN)
    overlay.querySelectorAll('.btn-delete-modal-subtask').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sid = btn.dataset.subtaskId;
        const subtask = (task.subtasks || []).find(s => s.id === sid);
        const stTitle = subtask ? subtask.title : 'việc con này';
        xacNhanXoa(
          'Xóa Việc Con',
          `Bạn có chắc chắn muốn xóa "${stTitle}" không? Hành động này sẽ không thể hoàn tác.`,
          () => {
            store.deleteSubtask(task.id, sid);
            toast('Đã xóa việc con thành công!', 'info');
            if (this.onTaskUpdated) this.onTaskUpdated();
            this.render();
          }
        );
      });
    });
  }
}


/**
 * THANH VU MEDIC CS3 - SUBTASK DETAIL MODAL COMPONENT (SHIN AIOS v2.7)
 * Hi?n th? d?y d? thông tin chi ti?t c?a Vi?c Con:
 * Mã vi?c con, Tiêu d?, Tên nhi?m v? cha, Tr?ng thái, Checkbox hoàn thành,
 * Mô t? chi ti?t & Tiêu chu?n bàn giao, Ngu?i ph? trách (Avatar), H?n chót, Nút S?a & Ðóng.
 * H? tr? Stacked Modal d?c l?p (z-[120]), không ghi dè SubtasksModal hay TaskDrawer bên du?i.
 */

import { store } from '../store.js?v=5.2';
import { esc, ngayVN, toast, rung } from '../helpers.js?v=5.2';

export class SubtaskDetailModal {
  constructor(containerId, onUpdated) {
    this.containerId = containerId;
    this.onUpdated = onUpdated;
    this.isEditing = false;
    this.currentTaskId = null;
    this.currentSubtaskId = null;
  }

  show(taskId, subtaskId) {
    rung(10);
    this.isEditing = false;
    this.currentTaskId = taskId;
    this.currentSubtaskId = subtaskId;
    this.render();
  }

  render() {
    const task = store.getTaskById(this.currentTaskId);
    if (!task) return;

    const subtask = (task.subtasks || []).find(s => s.id === this.currentSubtaskId);
    if (!subtask) return;

    const isDone = subtask.completed || subtask.status === 'done';
    const assignee = store.getUserById(subtask.assigneeId);
    const allUsers = store.getAllUsers();

    let overlay = document.getElementById('subtaskDetailOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'subtaskDetailOverlay';
      overlay.className = 'modal-overlay fixed inset-0 z-[120] bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 active animate-fade-in';
      document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
      <div class="modal-card bg-white rounded-3xl p-4 sm:p-6 max-w-lg w-full shadow-2xl border border-[#e2e8f0] max-h-[92vh] overflow-y-auto overflow-x-hidden flex flex-col gap-4" style="background-color: var(--card); border-color: var(--border);">
        
        <!-- HEADER -->
        <div class="flex items-center justify-between pb-3 border-b border-[#f1f5f9]" style="border-color: var(--border);">
          <div class="flex items-center gap-2 min-w-0">
            <span class="font-mono-data text-[12px] font-bold px-2.5 py-1 rounded-lg bg-[#fffbeb] text-[#795900] border border-[#fef3c7] shrink-0">
              ${esc(subtask.id)}
            </span>
            <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${isDone ? 'bg-teal-100 text-teal-800' : subtask.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}">
              ${isDone ? 'Ðã hoàn thành' : subtask.status === 'in_progress' ? 'Ðang th?c hi?n' : 'Chua b?t d?u'}
            </span>
          </div>
          <button type="button" class="text-gray-400 hover:text-gray-700 text-2xl font-bold min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors cursor-pointer" id="btnCloseSubtaskDetail" aria-label="Ðóng">&times;</button>
        </div>

        <!-- THÔNG TIN NHI?M V? CHA -->
        <div class="p-2.5 px-3 rounded-xl bg-[#fffbeb]/60 border border-[#fef3c7] flex items-center gap-2 text-[12px] text-[#795900]">
          <span class="material-symbols-outlined text-[17px] text-[#d6a52a] shrink-0">subdirectory_arrow_right</span>
          <div class="min-w-0 truncate">
            <span>Nhi?m v? cha: </span>
            <strong class="font-bold text-[#0d1c2f]">${esc(task.title)}</strong>
            <span class="font-mono-data text-[11px] text-[#795900] ml-1">(${esc(task.id)})</span>
          </div>
        </div>

        ${!this.isEditing ? `
          <!-- CH? Ð? XEM CHI TI?T -->
          <div class="flex flex-col gap-4">
            
            <!-- TIÊU Ð? & CHECKBOX HOÀN THÀNH -->
            <div class="p-3.5 rounded-2xl bg-[#f8f9ff] border border-[#e2e8f0] flex items-start gap-3">
              <input type="checkbox" id="chkSubtaskDetailComplete" class="w-5 h-5 rounded text-[#d6a52a] focus:ring-[#d6a52a] cursor-pointer shrink-0 mt-0.5" ${isDone ? 'checked' : ''} />
              <div class="flex-1 min-w-0">
                <h3 class="text-[15px] sm:text-[16px] font-bold text-[#0d1c2f] leading-snug ${isDone ? 'line-through text-gray-400' : ''}">
                  ${esc(subtask.title || subtask.text)}
                </h3>
                <span class="text-[11px] text-[#817663] block mt-1">
                  ${isDone ? 'Ðã dánh d?u hoàn thành' : 'B?m checkbox bên c?nh d? dánh d?u xong'}
                </span>
              </div>
            </div>

            <!-- MÔ T? CHI TI?T & TIÊU CHU?N BÀN GIAO -->
            <div>
              <label class="block text-[12px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[16px] text-[#795900]">description</span>
                <span>Mô t? &amp; Tiêu chu?n bàn giao</span>
              </label>
              <div class="p-3.5 rounded-2xl bg-white border border-[#e2e8f0] text-[13px] text-[#0d1c2f] leading-relaxed whitespace-pre-wrap">
                ${subtask.description ? esc(subtask.description) : '<span class="text-gray-400 italic">Chua có mô t? chi ti?t cho vi?c con này.</span>'}
              </div>
            </div>

            <!-- GRID: NGU?I PH? TRÁCH & H?N HOÀN THÀNH -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="p-3.5 rounded-2xl bg-white border border-[#e2e8f0]">
                <span class="text-[11px] font-bold text-[#64748b] uppercase tracking-wider block mb-2">Ngu?i ph? trách</span>
                <div class="flex items-center gap-2.5">
                  <img src="${assignee ? assignee.avatar : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80'}" class="w-9 h-9 rounded-full object-cover shrink-0 ring-2 ring-amber-100" />
                  <div class="min-w-0">
                    <div class="text-[13px] font-bold text-[#0d1c2f] truncate">${assignee ? esc(assignee.name) : 'Chua phân công'}</div>
                    <div class="text-[11px] text-[#64748b] truncate">${assignee ? esc(assignee.title) : 'Chua giao'}</div>
                  </div>
                </div>
              </div>

              <div class="p-3.5 rounded-2xl bg-white border border-[#e2e8f0]">
                <span class="text-[11px] font-bold text-[#64748b] uppercase tracking-wider block mb-2">H?n hoàn thành</span>
                <div class="flex items-center gap-2 text-[#0d1c2f]">
                  <span class="material-symbols-outlined text-[20px] text-[#795900]">calendar_month</span>
                  <span class="font-mono-data text-[13px] font-bold">${subtask.dueDate ? ngayVN(subtask.dueDate) : 'Chua d?t h?n'}</span>
                </div>
              </div>
            </div>

            <!-- ACTIONS -->
            <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-[#f1f5f9] mt-1">
              <button type="button" id="btnStartEditSubtask" class="px-4 py-2.5 rounded-xl border border-[#d6a52a] text-[#795900] bg-[#fffbeb] hover:bg-[#fde68a] font-bold text-[12.5px] min-h-[42px] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs">
                <span class="material-symbols-outlined text-[17px]">edit</span>
                <span>Ch?nh s?a vi?c con</span>
              </button>
              <button type="button" id="btnOkCloseSubtask" class="px-5 py-2.5 rounded-xl bg-[#0d1c2f] text-white font-bold text-[12.5px] min-h-[42px] flex items-center justify-center cursor-pointer hover:bg-black transition-colors">
                <span>Ðóng</span>
              </button>
            </div>
          </div>
        ` : `
          <!-- CH? Ð? CH?NH S?A VI?C CON TR?C TI?P -->
          <form id="formEditSubtaskModal" class="flex flex-col gap-3.5">
            <div>
              <label class="block text-[12px] font-bold text-[#0d1c2f] mb-1">Tiêu d? vi?c con *</label>
              <input type="text" id="editModalSubtaskTitle" required value="${esc(subtask.title || subtask.text)}" class="w-full h-10 px-3 rounded-xl border border-[#e2e8f0] text-[13.5px] outline-none focus:border-[#d6a52a] bg-white text-[#0d1c2f]" />
            </div>

            <div>
              <label class="block text-[12px] font-bold text-[#0d1c2f] mb-1">Mô t? &amp; Tiêu chu?n bàn giao</label>
              <textarea id="editModalSubtaskDesc" rows="3" placeholder="Ghi chú yêu c?u k? thu?t, m?c hoàn thành..." class="w-full p-2.5 rounded-xl border border-[#e2e8f0] text-[13px] outline-none focus:border-[#d6a52a] bg-white text-[#0d1c2f]">${esc(subtask.description || '')}</textarea>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-[11.5px] font-bold text-[#0d1c2f] mb-1">Ngu?i ph? trách</label>
                <select id="editModalSubtaskAssignee" class="w-full h-10 px-2.5 rounded-xl border border-[#e2e8f0] text-[12.5px] outline-none focus:border-[#d6a52a] bg-white cursor-pointer">
                  <option value="">-- Chua giao --</option>
                  ${allUsers.map(u => `
                    <option value="${u.id}" ${u.id === subtask.assigneeId ? 'selected' : ''}>${esc(u.name)} (${esc(u.title)})</option>
                  `).join('')}
                </select>
              </div>

              <div>
                <label class="block text-[11.5px] font-bold text-[#0d1c2f] mb-1">H?n hoàn thành</label>
                <input type="date" id="editModalSubtaskDueDate" value="${subtask.dueDate ? subtask.dueDate.slice(0, 10) : ''}" class="w-full h-10 px-2.5 rounded-xl border border-[#e2e8f0] text-[12.5px] font-mono-data outline-none focus:border-[#d6a52a] bg-white" />
              </div>
            </div>

            <div>
              <label class="block text-[11.5px] font-bold text-[#0d1c2f] mb-1">Tr?ng thái</label>
              <select id="editModalSubtaskStatus" class="w-full h-10 px-2.5 rounded-xl border border-[#e2e8f0] text-[12.5px] font-bold outline-none focus:border-[#d6a52a] bg-white cursor-pointer">
                <option value="todo" ${subtask.status === 'todo' ? 'selected' : ''}>Chua b?t d?u</option>
                <option value="in_progress" ${subtask.status === 'in_progress' ? 'selected' : ''}>Ðang th?c hi?n</option>
                <option value="done" ${isDone ? 'selected' : ''}>Ðã hoàn thành</option>
              </select>
            </div>

            <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-[#f1f5f9] mt-1">
              <button type="button" id="btnCancelEditSubtaskModal" class="px-4 py-2.5 rounded-xl border border-[#e2e8f0] text-[#64748b] font-semibold text-[12.5px] min-h-[42px] cursor-pointer hover:bg-gray-50">
                H?y b?
              </button>
              <button type="submit" class="px-5 py-2.5 rounded-xl bg-[#d6a52a] text-[#533d00] hover:bg-[#795900] hover:text-white font-bold text-[12.5px] min-h-[42px] flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors">
                <span class="material-symbols-outlined text-[17px]">save</span>
                <span>Luu thay d?i</span>
              </button>
            </div>
          </form>
        `}

      </div>
    `;

    this.bindEvents(task, subtask, overlay);
  }

  bindEvents(task, subtask, overlay) {
    const btnClose = overlay.querySelector('#btnCloseSubtaskDetail');
    const btnOkClose = overlay.querySelector('#btnOkCloseSubtask');

    const closeModal = () => {
      rung(10);
      if (overlay) overlay.remove();
    };

    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnOkClose) btnOkClose.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    // TOGGLE CHECKBOX HOÀN THÀNH
    const chkComplete = overlay.querySelector('#chkSubtaskDetailComplete');
    if (chkComplete) {
      chkComplete.addEventListener('change', () => {
        rung(10);
        store.toggleSubtask(task.id, subtask.id);
        toast('Ðã c?p nh?t ti?n d? vi?c con!', 'success');
        if (this.onUpdated) this.onUpdated();
        this.render();
      });
    }

    // CHUY?N SANG CH? Ð? S?A
    const btnStartEdit = overlay.querySelector('#btnStartEditSubtask');
    if (btnStartEdit) {
      btnStartEdit.addEventListener('click', () => {
        rung(10);
        this.isEditing = true;
        this.render();
      });
    }

    // H?Y S?A
    const btnCancelEdit = overlay.querySelector('#btnCancelEditSubtaskModal');
    if (btnCancelEdit) {
      btnCancelEdit.addEventListener('click', () => {
        rung(10);
        this.isEditing = false;
        this.render();
      });
    }

    // SUBMIT FORM S?A
    const formEdit = overlay.querySelector('#formEditSubtaskModal');
    if (formEdit) {
      formEdit.addEventListener('submit', (e) => {
        e.preventDefault();
        rung(15);

        const title = overlay.querySelector('#editModalSubtaskTitle')?.value.trim();
        if (!title) {
          toast('Vui lòng nh?p tiêu d? vi?c con!', 'warning');
          return;
        }

        const description = overlay.querySelector('#editModalSubtaskDesc')?.value.trim() || '';
        const assigneeId = overlay.querySelector('#editModalSubtaskAssignee')?.value || '';
        const dueDate = overlay.querySelector('#editModalSubtaskDueDate')?.value || '';
        const status = overlay.querySelector('#editModalSubtaskStatus')?.value || 'todo';

        store.updateSubtask(task.id, subtask.id, {
          title,
          description,
          assigneeId,
          dueDate,
          status
        });

        toast('Ðã c?p nh?t vi?c con thành công!', 'success');
        this.isEditing = false;
        if (this.onUpdated) this.onUpdated();
        this.render();
      });
    }
  }
}


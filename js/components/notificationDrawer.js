/**
 * THANH VŨ MEDIC CS3 - NOTIFICATION CENTER SLIDE-OVER DRAWER (SHIN AIOS v2.7)
 * Trung tâm thông báo chuyên nghiệp, hỗ trợ lọc Chưa đọc/Tất cả,
 * Đánh dấu đã đọc và Deep-linking mở thẳng Task Detail Drawer
 */

import { auth } from '../auth.js?v=6.1';
import { store } from '../store.js?v=6.1';
import { esc, timeAgo, rung, toast } from '../helpers.js?v=6.1';

export class NotificationDrawer {
  constructor(containerId, onSelectTask) {
    this.container = document.getElementById(containerId);
    this.onSelectTask = onSelectTask;
    this.isOpen = false;
    this.currentFilter = 'all'; // 'all' | 'unread'
  }

  open() {
    rung(10);
    this.isOpen = true;
    this.render();
  }

  close() {
    rung(10);
    this.isOpen = false;
    const overlay = document.getElementById('notifDrawerOverlay');
    if (overlay) overlay.remove();
  }

  render() {
    if (!this.container || !this.isOpen) return;

    const currentUser = auth.getCurrentUser();
    if (!currentUser) return;

    const allNotifs = store.getUserNotifications(currentUser.id);
    const unreadCount = store.getUnreadNotificationCount(currentUser.id);
    
    const displayNotifs = this.currentFilter === 'unread' 
      ? allNotifs.filter(n => !n.isRead)
      : allNotifs;

    // Loại bỏ overlay cũ nếu có
    const oldOverlay = document.getElementById('notifDrawerOverlay');
    if (oldOverlay) oldOverlay.remove();

    const overlay = document.createElement('div');
    overlay.id = 'notifDrawerOverlay';
    overlay.className = 'fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end active animate-fade-in';
    
    overlay.innerHTML = `
      <div class="w-full max-w-md h-full bg-white shadow-2xl flex flex-col justify-between overflow-hidden border-l border-[#e2e8f0]" style="background-color: var(--card); border-color: var(--border);">
        
        <!-- HEADER -->
        <div class="p-4 sm:px-5 border-b border-[#e2e8f0] flex items-center justify-between shrink-0 bg-[#f8f9ff]" style="background-color: var(--primary-soft); border-color: var(--border);">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-10 h-10 rounded-2xl flex items-center justify-center font-bold shadow-xs shrink-0" style="background-color: var(--primary-container); color: var(--on-primary-container);">
              <span class="material-symbols-outlined text-[22px]">notifications_active</span>
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <h3 class="font-bold text-[16px] text-[#0d1c2f] truncate" style="color: var(--text);">Trung Tâm Thông Báo</h3>
                ${unreadCount > 0 ? `
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#dc2626] text-white font-mono-data shrink-0">
                    ${unreadCount} mới
                  </span>
                ` : ''}
              </div>
              <span class="text-[11.5px] text-[#64748b] truncate block">Cập nhật tiến độ &amp; yêu cầu phê duyệt</span>
            </div>
          </div>

          <button type="button" class="p-2 rounded-xl text-[#64748b] hover:text-[#0d1c2f] hover:bg-gray-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer" id="btnCloseNotifDrawer" aria-label="Đóng">
            <span class="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        <!-- FILTER TABS & BULK ACTIONS -->
        <div class="px-4 py-2.5 border-b border-[#f1f5f9] flex items-center justify-between bg-white shrink-0" style="background-color: var(--card); border-color: var(--border);">
          <div class="flex items-center gap-1.5 p-1 rounded-xl bg-[#f1f5f9]">
            <button type="button" class="px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all min-h-[36px] cursor-pointer ${this.currentFilter === 'all' ? 'bg-white shadow-xs text-[#0d1c2f]' : 'text-[#64748b] hover:text-[#0d1c2f]'}" id="btnFilterAll">
              Tất cả (${allNotifs.length})
            </button>
            <button type="button" class="px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all min-h-[36px] cursor-pointer ${this.currentFilter === 'unread' ? 'bg-white shadow-xs text-[#b45309]' : 'text-[#64748b] hover:text-[#0d1c2f]'}" id="btnFilterUnread">
              Chưa đọc (${unreadCount})
            </button>
          </div>

          ${unreadCount > 0 ? `
            <button type="button" id="btnMarkAllReadInDrawer" class="text-[12px] font-bold text-amber-800 hover:text-amber-950 hover:underline min-h-[44px] px-2 flex items-center gap-1 cursor-pointer">
              <span class="material-symbols-outlined text-[16px]">done_all</span>
              <span>Đã đọc hết</span>
            </button>
          ` : ''}
        </div>

        <!-- NOTIFICATION LIST -->
        <div class="p-3 sm:p-4 flex-1 overflow-y-auto flex flex-col gap-2.5">
          ${displayNotifs.length === 0 ? `
            <div class="py-16 text-center flex flex-col items-center justify-center gap-2.5 text-gray-400">
              <div class="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-1">
                <span class="material-symbols-outlined text-[32px]">notifications_none</span>
              </div>
              <span class="text-[13.5px] font-bold text-[#0d1c2f]" style="color: var(--text);">Không có thông báo nào</span>
              <span class="text-[12px] text-gray-400 max-w-xs">
                ${this.currentFilter === 'unread' ? 'Bạn đã đọc toàn bộ thông báo gần đây!' : 'Tất cả các thông báo mới về công việc sẽ hiển thị tại đây.'}
              </span>
            </div>
          ` : displayNotifs.map(n => {
            let icon = 'notifications';
            let iconBg = 'bg-blue-50 text-blue-700 border-blue-200';
            if (n.type === 'task_assigned') {
              icon = 'assignment_ind';
              iconBg = 'bg-amber-50 text-amber-800 border-amber-200';
            } else if (n.type === 'approval_request') {
              icon = 'pending_actions';
              iconBg = 'bg-rose-50 text-rose-700 border-rose-200';
            } else if (n.type === 'approval_approved') {
              icon = 'verified';
              iconBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
            } else if (n.type === 'approval_rejected') {
              icon = 'cancel';
              iconBg = 'bg-red-50 text-red-700 border-red-200';
            } else if (n.type === 'status_change') {
              icon = 'sync_alt';
              iconBg = 'bg-sky-50 text-sky-700 border-sky-200';
            } else if (n.type === 'comment') {
              icon = 'chat';
              iconBg = 'bg-purple-50 text-purple-700 border-purple-200';
            }

            return `
              <div class="p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 notif-drawer-item ${!n.isRead ? 'bg-[#fffbeb]/50 border-amber-200 shadow-2xs hover:border-[#d6a52a]' : 'bg-white border-[#e2e8f0] hover:border-gray-300'}" data-notif-id="${n.id}" data-task-id="${n.taskId || ''}">
                <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${iconBg} shadow-2xs mt-0.5">
                  <span class="material-symbols-outlined text-[19px]">${icon}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-1 mb-0.5">
                    <span class="text-[13px] font-bold truncate ${!n.isRead ? 'text-[#795900]' : 'text-[#0d1c2f]'}" style="color: ${!n.isRead ? 'var(--primary)' : 'var(--text)'};">
                      ${esc(n.title)}
                    </span>
                    <span class="text-[10px] text-gray-400 shrink-0 font-mono-data">${timeAgo(n.createdAt)}</span>
                  </div>
                  <p class="text-[12px] text-[#4f4635] line-clamp-2 leading-relaxed" style="color: var(--text-muted);">
                    ${esc(n.content)}
                  </p>
                  <div class="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-gray-100">
                    ${n.taskId ? `
                      <span class="font-mono-data text-[10.5px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        #${esc(n.taskId)}
                      </span>
                    ` : '<span></span>'}
                    <span class="text-[11px] text-[#795900] font-bold flex items-center gap-0.5 hover:underline">
                      <span>Mở xem việc</span>
                      <span class="material-symbols-outlined text-[14px]">chevron_right</span>
                    </span>
                  </div>
                </div>
                ${!n.isRead ? `
                  <span class="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 mt-2 shadow-xs ring-2 ring-white"></span>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>

        <!-- FOOTER -->
        <div class="p-3 px-5 border-t border-[#e2e8f0] flex items-center justify-between bg-white shrink-0 text-[11.5px]" style="background-color: var(--card); border-color: var(--border);">
          <span class="text-[#64748b]">Tối đa 100 thông báo gần nhất</span>
          ${allNotifs.length > 0 ? `
            <button type="button" id="btnClearNotifsInDrawer" class="text-rose-600 hover:text-rose-800 font-bold hover:underline min-h-[44px] px-2 flex items-center gap-1 cursor-pointer">
              <span class="material-symbols-outlined text-[16px]">delete_sweep</span>
              <span>Xóa tất cả</span>
            </button>
          ` : ''}
        </div>

      </div>
    `;

    this.container.appendChild(overlay);
    this.bindEvents(overlay);
  }

  bindEvents(overlay) {
    const btnClose = overlay.querySelector('#btnCloseNotifDrawer');
    if (btnClose) btnClose.addEventListener('click', () => this.close());

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });

    const btnFilterAll = overlay.querySelector('#btnFilterAll');
    if (btnFilterAll) {
      btnFilterAll.addEventListener('click', () => {
        rung(10);
        this.currentFilter = 'all';
        this.render();
      });
    }

    const btnFilterUnread = overlay.querySelector('#btnFilterUnread');
    if (btnFilterUnread) {
      btnFilterUnread.addEventListener('click', () => {
        rung(10);
        this.currentFilter = 'unread';
        this.render();
      });
    }

    const btnMarkAll = overlay.querySelector('#btnMarkAllReadInDrawer');
    if (btnMarkAll) {
      btnMarkAll.addEventListener('click', () => {
        rung(15);
        const currentUser = auth.getCurrentUser();
        if (currentUser) {
          store.markAllNotificationsAsRead(currentUser.id);
          toast('Đã đánh dấu toàn bộ thông báo là đã đọc!', 'success');
          this.render();
        }
      });
    }

    const btnClearAll = overlay.querySelector('#btnClearNotifsInDrawer');
    if (btnClearAll) {
      btnClearAll.addEventListener('click', () => {
        rung(15);
        const currentUser = auth.getCurrentUser();
        if (currentUser && confirm('Bạn có chắc muốn xóa tất cả thông báo không?')) {
          store.clearUserNotifications(currentUser.id);
          toast('Đã xóa toàn bộ thông báo!', 'info');
          this.render();
        }
      });
    }

    // CLICK VÀO ITEM THÔNG BÁO -> ĐÁNH DẤU ĐÃ ĐỌC & MỞ THẲNG TASK DRAWER
    overlay.querySelectorAll('.notif-drawer-item').forEach(item => {
      item.addEventListener('click', () => {
        rung(15);
        const notifId = item.dataset.notifId;
        const taskId = item.dataset.taskId;

        if (notifId) {
          store.markNotificationAsRead(notifId);
        }

        this.close();

        if (taskId && this.onSelectTask) {
          this.onSelectTask(taskId);
        }
      });
    });
  }
}



/**
 * THANH VŨ MEDIC CS3 - HELPER UTILITIES & SHIN TOOLKIT
 * Hỗ trợ định dạng dữ liệu, toast thông báo, xác nhận 2 lần và bảo mật XSS
 */

export function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function soVN(num) {
  if (isNaN(num) || num === null || num === undefined) return '0';
  return new Intl.NumberFormat('vi-VN').format(num);
}

export function ptVN(rate, decimals = 1) {
  if (isNaN(rate) || rate === null || rate === undefined) return '0%';
  return `${Number(rate).toFixed(decimals).replace('.', ',')}%`;
}

export function ngayVN(dateStr, includeTime = false) {
  if (!dateStr) return '--/--/----';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  if (includeTime) {
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${mins} ${day}/${month}/${year}`;
  }
  return `${day}/${month}/${year}`;
}

export function timeAgo(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const diffMs = Date.now() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ngày trước`;
}

/** Lời chào thông minh theo giờ Việt Nam chuẩn SHIN */
export function loiChao(hoTen) {
  const g = new Date().getHours();
  const buoi = g < 11 ? 'buổi sáng' : g < 14 ? 'buổi trưa' : g < 18 ? 'buổi chiều' : 'buổi tối';
  const tenGoi = String(hoTen || '').trim().split(/\s+/).pop();
  return `Chào ${buoi}${tenGoi ? ', ' + tenGoi : ''} ☀️`;
}

/** Toast thông báo chống giật lag */
export function toast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none';
    document.body.appendChild(container);
  }

  const toastEl = document.createElement('div');
  toastEl.className = `pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all duration-300 transform translate-y-4 opacity-0`;
  
  if (type === 'success') {
    toastEl.classList.add('bg-[#DCFCE7]', 'border-[#86EFAC]', 'text-[#16A34A]');
    toastEl.innerHTML = `<span class="material-symbols-outlined text-[20px]">check_circle</span><span>${esc(message)}</span>`;
  } else if (type === 'error' || type === 'danger') {
    toastEl.classList.add('bg-[#FEE2E2]', 'border-[#FCA5A5]', 'text-[#DC2626]');
    toastEl.innerHTML = `<span class="material-symbols-outlined text-[20px]">error</span><span>${esc(message)}</span>`;
  } else if (type === 'warning' || type === 'warn') {
    toastEl.classList.add('bg-[#FEF3C7]', 'border-[#FCD34D]', 'text-[#B45309]');
    toastEl.innerHTML = `<span class="material-symbols-outlined text-[20px]">warning</span><span>${esc(message)}</span>`;
  } else {
    toastEl.classList.add('bg-white', 'border-[#E2E8F0]', 'text-[#0D1C2F]');
    toastEl.innerHTML = `<span class="material-symbols-outlined text-[20px] text-primary">info</span><span>${esc(message)}</span>`;
  }

  container.appendChild(toastEl);
  requestAnimationFrame(() => {
    toastEl.classList.remove('translate-y-4', 'opacity-0');
  });

  setTimeout(() => {
    toastEl.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toastEl.remove(), 300);
  }, 4000);
}

/** Phản hồi xúc giác rung haptic */
export function rung(ms = 35) {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try { navigator.vibrate(ms); } catch (_) {}
  }
}

/**
 * Modal Popup Xác Nhận Xóa Chuẩn SHIN AIOS v2.7 (Thay thế hoàn toàn cơ chế nhấn 2 lần)
 * Hiển thị dialog modal xác thực trực quan với icon cảnh báo, thông điệp chi tiết, nút Hủy và nút Xác nhận xóa.
 * 
 * @param {string} tieuDe - Tiêu đề popup (ví dụ: 'Xác Nhận Xóa Công Việc')
 * @param {string} noiDung - Nội dung mô tả (ví dụ: 'Bạn có chắc chắn muốn xóa nhiệm vụ này? Hành động không thể hoàn tác.')
 * @param {Function} onConfirm - Callback thực thi hành động xóa
 * @param {Object} [options] - Tuỳ chọn { btnConfirmText, btnCancelText, isDanger }
 */
export function xacNhanXoa(tieuDe, noiDung, onConfirm, options = {}) {
  rung(20);
  const {
    btnConfirmText = 'Xác Nhận Xóa',
    btnCancelText = 'Hủy Bỏ',
    isDanger = true
  } = options;

  // Xóa modal cũ nếu đang tồn tại
  const existing = document.getElementById('shinConfirmModalOverlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'shinConfirmModalOverlay';
  overlay.className = 'fixed inset-0 z-[10000] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 opacity-0 transition-opacity duration-200';
  
  overlay.innerHTML = `
    <div class="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-gray-100 transform scale-95 transition-transform duration-200 flex flex-col gap-4 select-none" style="background-color: var(--card, #ffffff); border-color: var(--border, #e2e8f0);">
      <div class="flex items-start gap-3.5">
        <div class="w-11 h-11 rounded-xl ${isDanger ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-amber-50 text-amber-600 border border-amber-100'} flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-[24px]">${isDanger ? 'warning' : 'help'}</span>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="font-bold text-[16px] text-gray-900 leading-snug" style="color: var(--text, #0d1c2f);">
            ${esc(tieuDe || 'Xác Nhận Xóa')}
          </h3>
          <p class="text-[13px] text-gray-600 mt-1.5 leading-relaxed" style="color: var(--text-muted, #64748b);">
            ${esc(noiDung || 'Bạn có chắc chắn muốn thực hiện thao tác này không? Hành động này sẽ không thể hoàn tác.')}
          </p>
        </div>
      </div>

      <div class="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100 mt-1" style="border-color: var(--border, #f1f5f9);">
        <button 
          type="button" 
          id="btnShinConfirmCancel"
          class="px-4 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-[13px] min-h-[44px] flex items-center justify-center transition-colors cursor-pointer"
          style="background-color: var(--bg-sub, #f8fafc); border-color: var(--border, #cbd5e1); color: var(--text, #334155);"
        >
          ${esc(btnCancelText)}
        </button>

        <button 
          type="button" 
          id="btnShinConfirmOk"
          class="px-5 py-2.5 rounded-xl ${isDanger ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20' : 'bg-[#d6a52a] text-[#533d00]'} font-bold text-[13px] min-h-[44px] flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <span class="material-symbols-outlined text-[18px]">delete</span>
          <span>${esc(btnConfirmText)}</span>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Kích hoạt animation hiện mượt
  requestAnimationFrame(() => {
    overlay.classList.remove('opacity-0');
    const card = overlay.firstElementChild;
    if (card) {
      card.classList.remove('scale-95');
      card.classList.add('scale-100');
    }
  });

  const closeModal = () => {
    overlay.classList.add('opacity-0');
    const card = overlay.firstElementChild;
    if (card) card.classList.add('scale-95');
    setTimeout(() => {
      overlay.remove();
    }, 200);
  };

  const btnCancel = overlay.querySelector('#btnShinConfirmCancel');
  const btnOk = overlay.querySelector('#btnShinConfirmOk');

  if (btnCancel) {
    btnCancel.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeModal();
    });
  }

  if (btnOk) {
    btnOk.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      rung(35);
      closeModal();
      if (typeof onConfirm === 'function') {
        try {
          onConfirm();
        } catch (err) {
          console.error('[CONFIRM ACTION ERROR]', err);
          toast('Thao tác gặp lỗi: ' + err.message, 'error');
        }
      }
    });
  }

  // Đóng khi click backdrop ngoài thẻ
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });

  // Hỗ trợ phím Escape
  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      window.removeEventListener('keydown', onKeyDown);
      closeModal();
    }
  };
  window.addEventListener('keydown', onKeyDown);
}

/**
 * Cầu nối tương thích: Chuyển toàn bộ các lệnh gọi xacNhan2Lan sang Popup Modal Xác Nhận Xóa chuẩn SHIN AIOS v2.7
 */
export function xacNhan2Lan(khoa, msg, viec) {
  xacNhanXoa('Xác Nhận Xóa', msg, viec);
}

/**
 * Modal Popup Yêu Cầu Làm Lại / Từ Chối Phê Duyệt Chuẩn SHIN AIOS v2.7
 * Thay thế hoàn toàn alert/prompt bằng giao diện modal popup cao cấp đồng bộ với xacNhanXoa.
 * Cho phép để trống lý do hoặc nhập nội dung góp ý gửi cho người thực hiện.
 * 
 * @param {Object} params
 * @param {string} [params.tieuDe] - Tiêu đề popup (mặc định: 'Yêu Cầu Làm Lại / Từ Chối Phê Duyệt')
 * @param {string} [params.tenDoiTuong] - Tên hoặc mã của công việc / kế hoạch
 * @param {string} [params.defaultReason] - Lý do mặc định
 * @param {Function} params.onConfirm - Callback (reason) => { ... }
 */
export function popupTuChoiPheDuyet({
  tieuDe = 'Yêu Cầu Làm Lại / Từ Chối Phê Duyệt',
  tenDoiTuong = '',
  defaultReason = '',
  onConfirm
} = {}) {
  rung(20);
  const existing = document.getElementById('shinRejectModalOverlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'shinRejectModalOverlay';
  overlay.className = 'fixed inset-0 z-[10000] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 opacity-0 transition-opacity duration-200';

  overlay.innerHTML = `
    <div class="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-rose-100 transform scale-95 transition-transform duration-200 flex flex-col gap-4 select-none" style="background-color: var(--card, #ffffff); border-color: var(--border, #e2e8f0);">
      
      <!-- HEADER -->
      <div class="flex items-start gap-3.5 pb-3 border-b border-gray-100" style="border-color: var(--border, #f1f5f9);">
        <div class="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-[24px]">assignment_return</span>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="font-bold text-[16px] text-gray-900 leading-snug" style="color: var(--text, #0d1c2f);">
            ${esc(tieuDe)}
          </h3>
          ${tenDoiTuong ? `
            <p class="text-[12.5px] text-gray-500 mt-1 truncate" style="color: var(--text-muted, #64748b);">
              Hạng mục: <strong class="text-gray-800" style="color: var(--text, #0d1c2f);">${esc(tenDoiTuong)}</strong>
            </p>
          ` : ''}
        </div>
      </div>

      <!-- BODY: TEXTAREA -->
      <div class="flex flex-col gap-1.5">
        <label for="txtShinRejectReason" class="text-[12.5px] font-bold text-gray-700 flex items-center justify-between" style="color: var(--text, #334155);">
          <span>Ghi chú lý do / Góp ý cho người thực hiện:</span>
          <span class="text-[11px] text-gray-400 font-normal">(không bắt buộc)</span>
        </label>
        <textarea 
          id="txtShinRejectReason" 
          rows="3" 
          class="w-full p-3 rounded-xl border border-gray-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-[13px] text-gray-800 outline-none resize-none transition-all" 
          style="background-color: var(--bg, #f8f9ff); border-color: var(--border, #cbd5e1); color: var(--text, #0d1c2f);"
          placeholder="Nhập nội dung cần điều chỉnh (có thể để trống, hệ thống sẽ tự động dùng lý do chuẩn)..."
        >${esc(defaultReason)}</textarea>
        <p class="text-[11px] text-gray-400 leading-normal" style="color: var(--text-muted, #94a3b8);">
          * Khi gửi yêu cầu, hệ thống sẽ thông báo trực tiếp đến người nhận việc và người tạo để tiến hành hoàn thiện lại.
        </p>
      </div>

      <!-- ACTIONS -->
      <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100" style="border-color: var(--border, #f1f5f9);">
        <button 
          type="button" 
          id="btnShinRejectCancel"
          class="px-4 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-[13px] min-h-[44px] flex items-center justify-center transition-colors cursor-pointer"
          style="background-color: var(--bg-sub, #f8fafc); border-color: var(--border, #cbd5e1); color: var(--text, #334155);"
        >
          Hủy Bỏ
        </button>

        <button 
          type="button" 
          id="btnShinRejectConfirm"
          class="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[13px] min-h-[44px] flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <span class="material-symbols-outlined text-[18px]">send</span>
          <span>Chuyển Yêu Cầu Làm Lại</span>
        </button>
      </div>

    </div>
  `;

  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    overlay.classList.remove('opacity-0');
    const card = overlay.firstElementChild;
    if (card) {
      card.classList.remove('scale-95');
      card.classList.add('scale-100');
    }
    const txtArea = overlay.querySelector('#txtShinRejectReason');
    if (txtArea) txtArea.focus();
  });

  const closeModal = () => {
    overlay.classList.add('opacity-0');
    const card = overlay.firstElementChild;
    if (card) card.classList.add('scale-95');
    setTimeout(() => overlay.remove(), 200);
  };

  const btnCancel = overlay.querySelector('#btnShinRejectCancel');
  const btnConfirm = overlay.querySelector('#btnShinRejectConfirm');
  const txtArea = overlay.querySelector('#txtShinRejectReason');

  if (btnCancel) {
    btnCancel.addEventListener('click', (e) => {
      e.preventDefault();
      closeModal();
    });
  }

  if (btnConfirm) {
    btnConfirm.addEventListener('click', (e) => {
      e.preventDefault();
      rung(35);
      const reason = txtArea ? txtArea.value.trim() : '';
      closeModal();
      if (typeof onConfirm === 'function') {
        onConfirm(reason);
      }
    });
  }

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      window.removeEventListener('keydown', onKeyDown);
      closeModal();
    }
  };
  window.addEventListener('keydown', onKeyDown);
}



/**
 * THANH VU MEDIC CS3 - HELPER UTILITIES & SHIN TOOLKIT
 * H? tr? d?nh d?ng d? li?u, toast thông báo, xác nh?n 2 l?n và b?o m?t XSS
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
  if (diffMins < 1) return 'v?a xong';
  if (diffMins < 60) return `${diffMins} phút tru?c`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} gi? tru?c`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ngày tru?c`;
}

/** L?i chào thông minh theo gi? Vi?t Nam chu?n SHIN */
export function loiChao(hoTen) {
  const g = new Date().getHours();
  const buoi = g < 11 ? 'bu?i sáng' : g < 14 ? 'bu?i trua' : g < 18 ? 'bu?i chi?u' : 'bu?i t?i';
  const tenGoi = String(hoTen || '').trim().split(/\s+/).pop();
  return `Chào ${buoi}${tenGoi ? ', ' + tenGoi : ''} ??`;
}

/** Toast thông báo ch?ng gi?t lag */
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

/** Ph?n h?i xúc giác rung haptic */
export function rung(ms = 35) {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try { navigator.vibrate(ms); } catch (_) {}
  }
}

/** Co ch? xác nh?n 2 l?n trong 5 giây cho thao tác nguy hi?m (Xóa b? window.confirm theo chu?n SHIN) */
const choXacNhan = {};
export function xacNhan2Lan(khoa, msg, viec) {
  const bayGio = Date.now();
  if (choXacNhan[khoa] && bayGio - choXacNhan[khoa] < 5000) {
    delete choXacNhan[khoa];
    rung(40);
    viec();
    return;
  }
  choXacNhan[khoa] = bayGio;
  rung(15);
  toast(`${msg} – B?m l?i l?n 2 trong 5 giây d? th?c thi!`, 'warning');
}



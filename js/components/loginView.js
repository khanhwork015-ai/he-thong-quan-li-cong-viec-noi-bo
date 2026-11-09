/**
 * THANH VU MEDIC CS3 - LOGIN VIEW COMPONENT (SHIN AIOS v2.6.4)
 * Màn hình Ðang Nh?p Mobile-First & Qu?n Lý Phiên B?o M?t
 * Chu?n màu Vàng Hoàng Kim Google Stitch (#D6A52A / #795900) & Xanh Navy Y T? (#0D1C2F)
 */

import { auth } from '../auth.js?v=5.2';
import { store } from '../store.js?v=5.2';
import { toast, rung } from '../helpers.js?v=5.2';

export class LoginView {
  constructor(containerId, onLoginSuccess) {
    this.container = document.getElementById(containerId);
    this.onLoginSuccess = onLoginSuccess;
    this.showPassword = false;
  }

  render() {
    if (!this.container) return;

    // T? d?ng d?ng b? ng?m d? li?u t? Google Sheets d? c?p nh?t danh sách tài kho?n m?i nh?t
    try {
      store.syncFromCloudIfAvailable().catch(() => {});
    } catch (_) {}

    this.container.innerHTML = `
      <div class="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-[#f8f9ff] via-[#f1f5f9] to-[#fffbeb]" style="background-color: var(--background);">
        <div class="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#e2e8f0] p-6 sm:p-8 flex flex-col gap-6 animate-fade-in" style="background-color: var(--card); border-color: var(--border);">
          
          <!-- LOGO & BRANDING -->
          <div class="flex flex-col items-center text-center gap-2">
            <div class="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg border" style="background-color: var(--primary-soft); color: var(--primary); border-color: var(--accent-soft, var(--border));">
              <span class="material-symbols-outlined text-[36px]">local_hospital</span>
            </div>
            <div>
              <span class="text-[11px] font-bold tracking-widest uppercase font-mono-data px-2.5 py-0.5 rounded-full" style="background-color: var(--primary-soft); color: var(--primary);">
                THANH VU MEDIC • CS3
              </span>
              <h1 class="text-[22px] sm:text-[24px] font-black text-[#0d1c2f] mt-1 tracking-tight" style="color: var(--text);">
                H? Th?ng Qu?n Lý &amp; Ði?u Hành
              </h1>
              <p class="text-[12.5px] text-[#64748b] mt-0.5" style="color: var(--text-muted);">
                Ðang nh?p d? truy c?p không gian làm vi?c
              </p>
            </div>
          </div>

          <!-- FORM LOGIN -->
          <form id="formLogin" class="flex flex-col gap-4">
            <div>
              <label class="block text-[12.5px] font-bold text-[#0d1c2f] mb-1.5" style="color: var(--text);">
                Tên dang nh?p ho?c Email *
              </label>
              <div class="relative flex items-center">
                <span class="material-symbols-outlined absolute left-3.5 text-[20px] text-[#817663]">person</span>
                <input 
                  type="text" 
                  id="loginUsername" 
                  required 
                  autocomplete="username"
                  placeholder="Nh?p tên dang nh?p ho?c email..."
                  class="w-full h-12 pl-11 pr-4 rounded-xl border border-[#e2e8f0] text-[14px] outline-none transition-all bg-[#f8f9ff] focus:bg-white focus:border-[#d6a52a] focus:ring-2 focus:ring-[#d6a52a]/20"
                  style="background-color: var(--card); border-color: var(--border); color: var(--text);"
                />
              </div>
            </div>

            <div>
              <label class="block text-[12.5px] font-bold text-[#0d1c2f] mb-1.5" style="color: var(--text);">
                M?t kh?u *
              </label>
              <div class="relative flex items-center">
                <span class="material-symbols-outlined absolute left-3.5 text-[20px] text-[#817663]">lock</span>
                <input 
                  type="password" 
                  id="loginPassword" 
                  required 
                  autocomplete="current-password"
                  placeholder="Nh?p m?t kh?u..."
                  class="w-full h-12 pl-11 pr-12 rounded-xl border border-[#e2e8f0] text-[14px] outline-none transition-all bg-[#f8f9ff] focus:bg-white focus:border-[#d6a52a] focus:ring-2 focus:ring-[#d6a52a]/20"
                  style="background-color: var(--card); border-color: var(--border); color: var(--text);"
                />
                <button 
                  type="button" 
                  id="btnTogglePassword" 
                  class="absolute right-2.5 p-2 text-gray-400 hover:text-gray-700 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg transition-colors"
                  aria-label="?n / Hi?n m?t kh?u"
                >
                  <span class="material-symbols-outlined text-[20px]" id="iconEye">visibility</span>
                </button>
              </div>
            </div>

            <!-- NÚT ÐANG NH?P (MIN-HEIGHT 48PX SHIN CHU?N) -->
            <button 
              type="submit" 
              id="btnLoginSubmit"
              class="w-full py-3.5 px-4 rounded-xl font-bold text-[14px] shadow-md transition-all min-h-[48px] flex items-center justify-center gap-2 mt-2 cursor-pointer"
              style="background-color: var(--primary-container); color: var(--on-primary-container);"
            >
              <span class="material-symbols-outlined text-[20px]">login</span>
              <span>Ðang Nh?p Vào H? Th?ng</span>
            </button>
          </form>

          <!-- FOOTER INFO -->
          <div class="text-center text-[11px] text-[#817663] border-t border-[#f1f5f9] pt-3" style="border-color: var(--border);">
            B?nh vi?n Ða Khoa Thanh Vu Medic B?c Liêu • Co S? 3 (Cà Mau)
          </div>

        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const form = this.container.querySelector('#formLogin');
    const inputUser = this.container.querySelector('#loginUsername');
    const inputPass = this.container.querySelector('#loginPassword');
    const btnEye = this.container.querySelector('#btnTogglePassword');
    const iconEye = this.container.querySelector('#iconEye');
    const btnSubmit = this.container.querySelector('#btnLoginSubmit');

    if (btnEye && inputPass && iconEye) {
      btnEye.addEventListener('click', () => {
        this.showPassword = !this.showPassword;
        inputPass.type = this.showPassword ? 'text' : 'password';
        iconEye.textContent = this.showPassword ? 'visibility_off' : 'visibility';
      });
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        rung(15);

        const username = inputUser.value.trim();
        const password = inputPass.value.trim();

        if (!username || !password) {
          toast('Vui lòng nh?p d?y d? tên dang nh?p và m?t kh?u!', 'warning');
          return;
        }

        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<span class="material-symbols-outlined text-[20px] animate-spin">sync</span><span>Ðang ki?m tra tài kho?n...</span>';

        try {
          let res = await auth.login(username, password);

          // N?u chua tìm th?y c?c b?, kích ho?t sync t? Google Sheets và th? l?i
          if (!res.success && res.code === 'USER_NOT_FOUND') {
            btnSubmit.innerHTML = '<span class="material-symbols-outlined text-[20px] animate-spin">cloud_sync</span><span>Ðang d?ng b? t? Google Sheets...</span>';
            try {
              await store.syncFromCloudIfAvailable();
              res = await auth.login(username, password);
            } catch (_) {}
          }

          if (res.success) {
            toast(`Ðang nh?p thành công! Chào m?ng ${res.user.name}`, 'success');
            if (this.onLoginSuccess) this.onLoginSuccess(res.user);
          } else {
            toast(res.message, 'warning');
            inputPass.focus();
          }
        } catch (err) {
          console.error('[LOGIN ERROR]', err);
          toast('Ðã x?y ra l?i khi xác th?c tài kho?n. Vui lòng th? l?i!', 'error');
        } finally {
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = '<span class="material-symbols-outlined text-[20px]">login</span><span>Ðang Nh?p Vào H? Th?ng</span>';
        }
      });
    }
  }
}



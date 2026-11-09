/**
 * THANH VU MEDIC CS3 - STRICT RBAC & DATA ISOLATION ENGINE
 * Phân quy?n 4 c?p d? (SHIN AIOS v2.6.4):
 * 1. ADMIN (Qu?n tr? viên): Toàn quy?n toàn vi?n, CRUD phòng ban & b? ph?n con, c?p m?i tài kho?n.
 * 2. LEADERSHIP (Ban lãnh d?o): Toàn quy?n xem và giám sát t?t c? các phòng ban, b? ph?n.
 * 3. MANAGER / DEPUTY_MANAGER (Tru?ng / Phó phòng): Qu?n lý toàn b? nhân viên và các b? ph?n con c?a phòng mình,
 *    ch? du?c c?p tài kho?n cho Nhân viên thu?c phòng mình (Không th? c?p cho Admin / Ban lãnh d?o).
 * 4. MEMBER (Nhân viên): Không du?c phép c?p tài kho?n, th?c hi?n và c?p nh?t ti?n d? công vi?c.
 * 
 * Quy t?c giao vi?c: B?t c? ai cung có quy?n t?o và assign task cho b?t k? nhân viên nào.
 */

import { USERS, DEPARTMENTS, ROLES } from './models.js';
import { toast, rung } from './helpers.js';

/**
 * Bam m?t kh?u SHA-256 an toàn b?ng Web Cryptography API
 * @param {string} plainText
 * @returns {Promise<string>} Chu?i hex 64 ký t?
 */
export async function hashPassword(plainText) {
  if (plainText === null || plainText === undefined || String(plainText).trim() === '') return '';
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(String(plainText).trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    console.warn('[AUTH] crypto.subtle không kh? d?ng, dùng fallback:', err);
    return String(plainText).trim();
  }
}


const AUTH_KEY = 'tvm_auth_user_v3';
const ACTIVE_DEPT_KEY = 'tvm_active_dept_v3';
const SESSION_KEY = 'tvm_auth_session_v4';

export class AuthManager {
  constructor() {
    this.session = this.loadSession();
    this.currentUser = this.session ? this.session.user : null;
    this.activeDepartmentId = this.loadActiveDepartment();
  }

  getStoredUsers() {
    let users = [];
    try {
      const saved = localStorage.getItem('tvm_users_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          users = parsed;
        }
      }
    } catch (e) {}

    if (users.length === 0) {
      // T? d?ng nâng c?p và h?p nh?t danh sách USERS m?c d?nh kèm d? li?u cu
      let merged = [...USERS];
      try {
        const oldSaved = localStorage.getItem('tvm_users_v3');
        if (oldSaved) {
          const oldParsed = JSON.parse(oldSaved);
          if (Array.isArray(oldParsed)) {
            oldParsed.forEach(oldU => {
              const idx = merged.findIndex(u => u.id === oldU.id || (u.email && u.email === oldU.email));
              if (idx >= 0) {
                merged[idx] = { ...oldU, ...merged[idx] };
              } else {
                merged.push({
                  ...oldU,
                  username: String(oldU.username || oldU.id.replace('user_', '')).trim().toLowerCase(),
                  password: String(oldU.password || '123').trim()
                });
              }
            });
          }
        }
      } catch (_) {}
      users = merged;
      try {
        localStorage.setItem('tvm_users_v4', JSON.stringify(users));
      } catch (_) {}
    }

    // Chu?n hóa an toàn cho toàn b? user: password luôn là chu?i string, username lowercase trimmed
    return users.map(u => ({
      ...u,
      username: String(u.username || (u.id ? u.id.replace('user_', '') : '')).trim().toLowerCase(),
      password: String(u.password !== undefined && u.password !== null && String(u.password).trim() !== '' ? u.password : '123').trim()
    }));
  }

  getStoredDepartments() {
    try {
      const saved = localStorage.getItem('tvm_departments_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEPARTMENTS;
  }

  loadSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const sess = JSON.parse(raw);
      if (sess && sess.expiresAt && sess.expiresAt > Date.now() && sess.user) {
        // Ð?ng b? l?i thông tin m?i nh?t c?a user t? tvm_user_profile_ ho?c tvm_users_v4
        const users = this.getStoredUsers();
        let latestUser = users.find(u => u.id === sess.user.id) || sess.user;
        const custom = localStorage.getItem('tvm_user_profile_' + latestUser.id);
        if (custom) {
          try {
            latestUser = { ...latestUser, ...JSON.parse(custom) };
          } catch (_) {}
        }
        sess.user = latestUser;
        return sess;
      }
    } catch (e) {
      console.warn('L?i d?c session:', e);
    }
    return null;
  }

  loadActiveDepartment() {
    const savedDept = localStorage.getItem(ACTIVE_DEPT_KEY);
    const depts = this.getStoredDepartments();
    if (!this.currentUser) return depts[0]?.id || 'dept_ptkh';

    if ((this.isAdmin() || this.isLeadership()) && savedDept) {
      return savedDept; // Admin & Lãnh d?o có th? ch?n b?t k? phòng ban nào
    }
    // Tru?ng phòng & Nhân viên g?n v?i phòng ban c?a mình
    if (this.currentUser.departmentId && this.currentUser.departmentId !== 'all') {
      return this.currentUser.departmentId;
    }
    return savedDept || depts[0]?.id || 'dept_ptkh';
  }

  isAuthenticated() {
    return Boolean(this.currentUser && this.session && this.session.expiresAt > Date.now());
  }

  async login(usernameOrEmail, password) {
    if (!usernameOrEmail || !password) {
      return { success: false, message: 'Vui lòng nh?p d?y d? Tên dang nh?p và M?t kh?u!' };
    }

    const trimmedUser = String(usernameOrEmail).trim().toLowerCase();
    const trimmedPass = String(password).trim();
    let users = this.getStoredUsers();

    // Hàm so kh?p tài kho?n thông minh & linh ho?t
    const findMatch = (list) => {
      return list.find(u => {
        const uName = String(u.username || '').trim().toLowerCase();
        const uEmail = String(u.email || '').trim().toLowerCase();
        const uId = String(u.id || '').trim().toLowerCase();
        const fullName = String(u.name || '').trim().toLowerCase();
        const roleLower = String(u.role || '').trim().toLowerCase();

        return (
          uName === trimmedUser ||
          uEmail === trimmedUser ||
          uId === trimmedUser ||
          uId === 'user_' + trimmedUser ||
          uId.replace('user_', '') === trimmedUser ||
          fullName === trimmedUser ||
          (trimmedUser === 'admin' && (roleLower === 'admin' || uName === 'admin')) ||
          (trimmedUser.includes('tam') && (uName.includes('tam') || fullName.includes('tâm')))
        );
      });
    };

    let matched = findMatch(users);

    // N?U CHUA TÌM TH?Y TRONG B? NH? LOCAL: T? d?ng sync t?c th?i t? Google Sheet
    if (!matched) {
      try {
        const { appScriptBridge } = await import('./services/appScriptBridge.js');
        if (appScriptBridge && appScriptBridge.isConnected()) {
          const cloudData = await appScriptBridge.fetchCloudData();
          if (cloudData && cloudData.success && Array.isArray(cloudData.users) && cloudData.users.length > 0) {
            // H?p nh?t d? li?u m?i t? Sheet vào b? nh?
            const userMap = new Map();
            users.forEach(u => userMap.set(u.id, u));
            cloudData.users.forEach(su => {
              if (su && su.id) {
                userMap.set(su.id, {
                  ...userMap.get(su.id),
                  ...su,
                  username: String(su.username || su.id.replace('user_', '')).trim().toLowerCase(),
                  password: String(su.password !== undefined && su.password !== null && String(su.password).trim() !== '' ? su.password : '123').trim()
                });
              }
            });
            const mergedList = Array.from(userMap.values());
            localStorage.setItem('tvm_users_v4', JSON.stringify(mergedList));
            users = this.getStoredUsers();
            matched = findMatch(users);
          }
        }
      } catch (syncErr) {
        console.warn('[AUTH] L?i t? d?ng sync ngu?i dùng t? Cloud:', syncErr);
      }
    }

    if (!matched) {
      return { 
        success: false, 
        code: 'USER_NOT_FOUND',
        message: 'Tên dang nh?p ho?c email không t?n t?i trong h? th?ng!' 
      };
    }

    // Ki?m tra m?t kh?u (So sánh String chu?n & bam SHA-256 b?o m?t)
    const validPassword = String(matched.password !== undefined && matched.password !== null && String(matched.password).trim() !== '' ? matched.password : '123').trim();
    let isPasswordCorrect = (trimmedPass === validPassword);
    if (!isPasswordCorrect && typeof crypto !== 'undefined' && crypto.subtle) {
      try {
        const hashedInput = await hashPassword(trimmedPass);
        isPasswordCorrect = (hashedInput.toLowerCase() === validPassword.toLowerCase());
      } catch (_) {}
    }

    if (!isPasswordCorrect) {
      return { 
        success: false, 
        code: 'WRONG_PASSWORD',
        message: 'M?t kh?u không chính xác. Vui lòng ki?m tra l?i!' 
      };
    }

    // Ð?c thêm profile cá nhân luu riêng n?u có
    let fullUser = { ...matched };
    try {
      const custom = localStorage.getItem('tvm_user_profile_' + matched.id);
      if (custom) fullUser = { ...fullUser, ...JSON.parse(custom) };
    } catch (_) {}

    // T?o phiên làm vi?c (Session) 7 ngày
    const session = {
      token: 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36),
      userId: fullUser.id,
      user: fullUser,
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
    };

    this.session = session;
    this.currentUser = fullUser;

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    localStorage.setItem(AUTH_KEY, fullUser.id);

    if (fullUser.departmentId && fullUser.departmentId !== 'all') {
      this.activeDepartmentId = fullUser.departmentId;
      localStorage.setItem(ACTIVE_DEPT_KEY, this.activeDepartmentId);
    }

    rung(25);
    window.dispatchEvent(new CustomEvent('tvm:auth_changed', { detail: { user: fullUser } }));
    return { success: true, user: fullUser };
  }

  logout() {
    this.session = null;
    this.currentUser = null;
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(AUTH_KEY);
    rung(20);
    window.dispatchEvent(new CustomEvent('tvm:auth_changed', { detail: { user: null } }));
    return true;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  getActiveDepartment() {
    if (this.activeDepartmentId === 'all') {
      return {
        id: 'all',
        name: 'Toàn B?nh Vi?n (T?t c? PB)',
        code: 'TOÀN VI?N',
        badge: 'TOÀN VI?N',
        unit: 'Co S? 3 (Cà Mau)',
        color: '#D6A52A'
      };
    }
    const depts = this.getStoredDepartments();
    const dept = depts.find(d => d.id === this.activeDepartmentId);
    return dept || depts[0] || DEPARTMENTS[0];
  }

  // --- PHÂN QUY?N VAI TRÒ (RBAC) ---
  isAdmin() {
    return this.currentUser?.role === 'ADMIN';
  }

  isLeadership() {
    return this.currentUser?.role === 'LEADERSHIP';
  }

  isManager() {
    const r = this.currentUser?.role;
    return r === 'MANAGER' || r === 'DEPUTY_MANAGER';
  }

  isMember() {
    return this.currentUser?.role === 'MEMBER';
  }

  // Quy?n chuy?n d?i phòng ban (Admin và Ban lãnh d?o)
  canSwitchDepartment() {
    return this.isAdmin() || this.isLeadership();
  }

  // Quy?n CRUD phòng ban & b? ph?n con (CH? ADMIN)
  canCRUDDepartments() {
    return this.isAdmin();
  }

  // Quy?n c?p tài kho?n nhân s? m?i (Phân quy?n b?o m?t ch?t ch?):
  // - Admin: Toàn quy?n c?p m?i role cho m?i phòng ban
  // - Ban lãnh d?o: Giám sát toàn vi?n, có th? phê duy?t
  // - Tru?ng/Phó phòng: CH? c?p du?c tài kho?n cho Nhân viên thu?c phòng ban mình qu?n lý. KHÔNG TH? c?p cho Admin/Ban Lãnh Ð?o!
  // - Nhân viên: Tuy?t d?i KHÔNG du?c c?p tài kho?n!
  canProvisionAccount(targetRole = 'MEMBER', targetDeptId = null) {
    if (!this.isAuthenticated()) return false;
    // DUY NH?T ADMIN CÓ QUY?N C?P TÀI KHO?N VÀ PHÂN QUY?N (SET ROLE)
    return this.isAdmin();
  }

  // Quy?n t?o & giao vi?c: "B?t c? ai cung có quy?n t?o và assign task cho b?t kì nhân viên nào"
  canCreateTask() {
    return this.isAuthenticated();
  }

  // Quy?n phê duy?t nhi?m v? (Admin, Ban lãnh d?o ho?c Tru?ng/Phó phòng)
  canApproveTask() {
    return this.isAdmin() || this.isLeadership() || this.isManager();
  }

  // Quy?n qu?n lý nhân s? & phân b? b? ph?n con
  canManageMembers() {
    // DUY NH?T ADMIN CÓ QUY?N THÊM / S?A / XÓA TÀI KHO?N NHÂN VIÊN
    return this.isAdmin();
  }

  // C?p nh?t thông tin h? so cá nhân
  updateProfile(data) {
    if (!this.currentUser) return null;
    this.currentUser = { ...this.currentUser, ...data };

    if (this.session) {
      this.session.user = this.currentUser;
      try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(this.session));
      } catch (_) {}
    }

    try {
      localStorage.setItem('tvm_user_profile_' + this.currentUser.id, JSON.stringify(this.currentUser));
    } catch (e) {
      console.warn('Không th? luu profile:', e);
    }

    // Ð?ng b? vào danh sách users trong localStorage n?u có
    try {
      const saved = localStorage.getItem('tvm_users_v4');
      if (saved) {
        const users = JSON.parse(saved);
        if (Array.isArray(users)) {
          const idx = users.findIndex(u => u.id === this.currentUser.id);
          if (idx >= 0) {
            users[idx] = { ...users[idx], ...this.currentUser, updatedAt: new Date().toISOString() };
            localStorage.setItem('tvm_users_v4', JSON.stringify(users));
          }
        }
      }
    } catch (e) {}

    window.dispatchEvent(new CustomEvent('tvm:auth_changed', { detail: { user: this.currentUser } }));
    return this.currentUser;
  }

  // Ðang nh?p nhanh d?ng Switch User (Dành cho ki?m th? RBAC)
  loginAs(userId) {
    const users = this.getStoredUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return false;
    return this.login(user.username || user.id, user.password || '123');
  }

  // Chuy?n phòng ban dang xem (Dành cho Admin & Ban Lãnh Ð?o)
  switchDepartment(deptId) {
    if (!this.canSwitchDepartment()) {
      toast('Ch? Ban Lãnh Ð?o & Qu?n Tr? Viên m?i có quy?n chuy?n phòng ban!', 'warning');
      return false;
    }
    if (deptId === 'all') {
      this.activeDepartmentId = 'all';
      localStorage.setItem(ACTIVE_DEPT_KEY, 'all');
      rung(15);
      window.dispatchEvent(new CustomEvent('tvm:department_changed', { detail: { dept: this.getActiveDepartment() } }));
      return true;
    }
    const depts = this.getStoredDepartments();
    const dept = depts.find(d => d.id === deptId);
    if (!dept) return false;

    this.activeDepartmentId = deptId;
    localStorage.setItem(ACTIVE_DEPT_KEY, deptId);
    rung(15);
    window.dispatchEvent(new CustomEvent('tvm:department_changed', { detail: { dept } }));
    return true;
  }
}

export const auth = new AuthManager();



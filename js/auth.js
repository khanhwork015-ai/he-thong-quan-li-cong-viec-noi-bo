/**
 * THANH VŨ MEDIC CS3 - STRICT RBAC & DATA ISOLATION ENGINE
 * Phân quyền 4 cấp độ (SHIN AIOS v2.6.4):
 * 1. ADMIN (Quản trị viên): Toàn quyền toàn viện, CRUD phòng ban & bộ phận con, cấp mọi tài khoản.
 * 2. LEADERSHIP (Ban lãnh đạo): Toàn quyền xem và giám sát tất cả các phòng ban, bộ phận.
 * 3. MANAGER / DEPUTY_MANAGER (Trưởng / Phó phòng): Quản lý toàn bộ nhân viên và các bộ phận con của phòng mình,
 *    chỉ được cấp tài khoản cho Nhân viên thuộc phòng mình (Không thể cấp cho Admin / Ban lãnh đạo).
 * 4. MEMBER (Nhân viên): Không được phép cấp tài khoản, thực hiện và cập nhật tiến độ công việc.
 * 
 * Quy tắc giao việc: Bất cứ ai cũng có quyền tạo và assign task cho bất kỳ nhân viên nào.
 */

import { USERS, DEPARTMENTS, ROLES } from './models.js';
import { toast, rung } from './helpers.js';

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
      // Tự động nâng cấp và hợp nhất danh sách USERS mặc định kèm dữ liệu cũ
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

    // Chuẩn hóa an toàn cho toàn bộ user: password luôn là chuỗi string, username lowercase trimmed
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
        // Đồng bộ lại thông tin mới nhất của user từ tvm_user_profile_ hoặc tvm_users_v4
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
      console.warn('Lỗi đọc session:', e);
    }
    return null;
  }

  loadActiveDepartment() {
    const savedDept = localStorage.getItem(ACTIVE_DEPT_KEY);
    const depts = this.getStoredDepartments();
    if (!this.currentUser) return depts[0]?.id || 'dept_ptkh';

    if ((this.isAdmin() || this.isLeadership()) && savedDept) {
      return savedDept; // Admin & Lãnh đạo có thể chọn bất kỳ phòng ban nào
    }
    // Trưởng phòng & Nhân viên gắn với phòng ban của mình
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
      return { success: false, message: 'Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu!' };
    }

    const trimmedUser = String(usernameOrEmail).trim().toLowerCase();
    const trimmedPass = String(password).trim();
    let users = this.getStoredUsers();

    // Hàm so khớp tài khoản thông minh & linh hoạt
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

    // NẾU CHƯA TÌM THẤY TRONG BỘ NHỚ LOCAL: Tự động sync tức thời từ Google Sheet
    if (!matched) {
      try {
        const { appScriptBridge } = await import('./services/appScriptBridge.js');
        if (appScriptBridge && appScriptBridge.isConnected()) {
          const cloudData = await appScriptBridge.fetchCloudData();
          if (cloudData && cloudData.success && Array.isArray(cloudData.users) && cloudData.users.length > 0) {
            // Hợp nhất dữ liệu mới từ Sheet vào bộ nhớ
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
        console.warn('[AUTH] Lỗi tự động sync người dùng từ Cloud:', syncErr);
      }
    }

    if (!matched) {
      return { 
        success: false, 
        code: 'USER_NOT_FOUND',
        message: 'Tên đăng nhập hoặc email không tồn tại trong hệ thống!' 
      };
    }

    // Kiểm tra mật khẩu (So sánh String chuẩn, hỗ trợ số 123 hoặc chữ '123' từ Sheet)
    const validPassword = String(matched.password !== undefined && matched.password !== null && String(matched.password).trim() !== '' ? matched.password : '123').trim();
    if (trimmedPass !== validPassword) {
      return { 
        success: false, 
        code: 'WRONG_PASSWORD',
        message: 'Mật khẩu không chính xác. Vui lòng kiểm tra lại!' 
      };
    }

    // Đọc thêm profile cá nhân lưu riêng nếu có
    let fullUser = { ...matched };
    try {
      const custom = localStorage.getItem('tvm_user_profile_' + matched.id);
      if (custom) fullUser = { ...fullUser, ...JSON.parse(custom) };
    } catch (_) {}

    // Tạo phiên làm việc (Session) 7 ngày
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
    const depts = this.getStoredDepartments();
    const dept = depts.find(d => d.id === this.activeDepartmentId);
    return dept || depts[0] || DEPARTMENTS[0];
  }

  // --- PHÂN QUYỀN VAI TRÒ (RBAC) ---
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

  // Quyền chuyển đổi phòng ban (Admin và Ban lãnh đạo)
  canSwitchDepartment() {
    return this.isAdmin() || this.isLeadership();
  }

  // Quyền CRUD phòng ban & bộ phận con (CHỈ ADMIN)
  canCRUDDepartments() {
    return this.isAdmin();
  }

  // Quyền cấp tài khoản nhân sự mới (Phân quyền bảo mật chặt chẽ):
  // - Admin: Toàn quyền cấp mọi role cho mọi phòng ban
  // - Ban lãnh đạo: Giám sát toàn viện, có thể phê duyệt
  // - Trưởng/Phó phòng: CHỈ cấp được tài khoản cho Nhân viên thuộc phòng ban mình quản lý. KHÔNG THỂ cấp cho Admin/Ban Lãnh Đạo!
  // - Nhân viên: Tuyệt đối KHÔNG được cấp tài khoản!
  canProvisionAccount(targetRole = 'MEMBER', targetDeptId = null) {
    if (!this.isAuthenticated()) return false;

    // 1. Admin: Toàn quyền cấp mọi role cho mọi phòng ban
    if (this.isAdmin()) return true;

    // 2. Ban lãnh đạo: Có thể cấp tài khoản trừ Admin
    if (this.isLeadership()) {
      return targetRole !== 'ADMIN';
    }

    // 3. Trưởng/Phó phòng: CHỈ cấp được cho Nhân viên và CHỈ thuộc phòng ban của mình
    if (this.isManager()) {
      if (targetRole !== 'MEMBER') return false; // Không cấp được Admin, Lãnh đạo, Trưởng phòng khác
      if (targetDeptId && targetDeptId !== this.currentUser.departmentId) return false;
      return true;
    }

    // 4. Nhân viên: Không được phép cấp tài khoản
    return false;
  }

  // Quyền tạo & giao việc: "Bất cứ ai cũng có quyền tạo và assign task cho bất kì nhân viên nào"
  canCreateTask() {
    return this.isAuthenticated();
  }

  // Quyền phê duyệt nhiệm vụ (Admin, Ban lãnh đạo hoặc Trưởng/Phó phòng)
  canApproveTask() {
    return this.isAdmin() || this.isLeadership() || this.isManager();
  }

  // Quyền quản lý nhân sự & phân bổ bộ phận con
  canManageMembers() {
    return this.isAdmin() || this.isLeadership() || this.isManager();
  }

  // Cập nhật thông tin hồ sơ cá nhân
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
      console.warn('Không thể lưu profile:', e);
    }

    // Đồng bộ vào danh sách users trong localStorage nếu có
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

  // Đăng nhập nhanh dạng Switch User (Dành cho kiểm thử RBAC)
  loginAs(userId) {
    const users = this.getStoredUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return false;
    return this.login(user.username || user.id, user.password || '123');
  }

  // Chuyển phòng ban đang xem (Dành cho Admin & Ban Lãnh Đạo)
  switchDepartment(deptId) {
    if (!this.canSwitchDepartment()) {
      toast('Chỉ Ban Lãnh Đạo & Quản Trị Viên mới có quyền chuyển phòng ban!', 'warning');
      return false;
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

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
    try {
      const saved = localStorage.getItem('tvm_users_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return USERS;
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
        // Đồng bộ lại thông tin mới nhất của user từ tvm_user_profile_ hoặc tvm_users_v3
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

  login(usernameOrEmail, password) {
    if (!usernameOrEmail || !password) {
      return { success: false, message: 'Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu!' };
    }

    const trimmedUser = usernameOrEmail.trim().toLowerCase();
    const trimmedPass = password.trim();
    const users = this.getStoredUsers();

    const matched = users.find(u => {
      const uName = (u.username || '').toLowerCase();
      const uEmail = (u.email || '').toLowerCase();
      const uId = (u.id || '').toLowerCase();
      return uName === trimmedUser || uEmail === trimmedUser || uId === trimmedUser;
    });

    if (!matched) {
      return { success: false, message: 'Tên đăng nhập không tồn tại trong hệ thống!' };
    }

    // Kiểm tra mật khẩu (mặc định '123' nếu tài khoản chưa đặt pass)
    const validPassword = matched.password || '123';
    if (trimmedPass !== validPassword) {
      return { success: false, message: 'Mật khẩu không chính xác. Mặc định là: 123' };
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
      const saved = localStorage.getItem('tvm_users_v3');
      if (saved) {
        const users = JSON.parse(saved);
        if (Array.isArray(users)) {
          const idx = users.findIndex(u => u.id === this.currentUser.id);
          if (idx >= 0) {
            users[idx] = { ...users[idx], ...this.currentUser, updatedAt: new Date().toISOString() };
            localStorage.setItem('tvm_users_v3', JSON.stringify(users));
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

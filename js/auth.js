/**
 * THANH VŨ MEDIC CS3 - STRICT RBAC & DATA ISOLATION ENGINE
 * Phân quyền 3 cấp độ:
 * 1. ADMIN (Quản trị viên tối cao): Toàn quyền trên mọi phòng ban, quản lý mọi tài khoản, cấu hình cloud.
 * 2. MANAGER (Trưởng phòng): Quản lý toàn bộ công việc, giao việc, duyệt việc, quản lý nhân viên TRONG PHÒNG MÌNH.
 * 3. MEMBER (Nhân viên): Chỉ xem và thực thi công việc của mình, cập nhật tiến độ checklist, sửa hồ sơ cá nhân.
 */

import { USERS, DEPARTMENTS } from './models.js';
import { toast, rung } from './helpers.js';

const AUTH_KEY = 'tvm_auth_user_v3';
const ACTIVE_DEPT_KEY = 'tvm_active_dept_v3';

export class AuthManager {
  constructor() {
    this.currentUser = this.loadUser();
    this.activeDepartmentId = this.loadActiveDepartment();
  }

  loadUser() {
    const savedId = localStorage.getItem(AUTH_KEY);
    let base = USERS.find(u => u.id === savedId) || USERS[1]; // Mặc định BS.CKI Trần Minh Tuấn (Trưởng phòng PTKH)
    
    // Đọc thông tin cá nhân đã cập nhật nếu có
    try {
      const custom = localStorage.getItem('tvm_user_profile_' + base.id);
      if (custom) {
        base = { ...base, ...JSON.parse(custom) };
      }
    } catch (e) {
      console.warn('Lỗi đọc custom profile:', e);
    }

    return base;
  }

  loadActiveDepartment() {
    const savedDept = localStorage.getItem(ACTIVE_DEPT_KEY);
    if (this.currentUser.role === 'ADMIN' && savedDept) {
      return savedDept; // Admin có thể chọn phòng ban bất kỳ
    }
    // Trưởng phòng & Nhân viên luôn gắn chặt vào phòng ban của mình
    return this.currentUser.departmentId === 'all' ? 'dept_ptkh' : this.currentUser.departmentId;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  getActiveDepartment() {
    const dept = DEPARTMENTS.find(d => d.id === this.activeDepartmentId);
    return dept || DEPARTMENTS[0]; // Mặc định là Phòng PTKH
  }

  isAdmin() {
    return this.currentUser.role === 'ADMIN';
  }

  isManager() {
    return this.currentUser.role === 'MANAGER';
  }

  isMember() {
    return this.currentUser.role === 'MEMBER';
  }

  // --- QUYỀN HẠN PHÂN CẤP ---

  // Quyền chuyển đổi phòng ban (Chỉ Admin)
  canSwitchDepartment() {
    return this.isAdmin();
  }

  // Quyền tạo & giao việc (Admin hoặc Trưởng phòng)
  canCreateTask() {
    return this.isAdmin() || this.isManager();
  }

  // Quyền phê duyệt nhiệm vụ (Admin hoặc Trưởng phòng)
  canApproveTask() {
    return this.isAdmin() || this.isManager();
  }

  // Quyền quản lý nhân sự & phân bổ (Admin hoặc Trưởng phòng)
  canManageMembers() {
    return this.isAdmin() || this.isManager();
  }

  // Cập nhật thông tin hồ sơ cá nhân
  updateProfile(data) {
    this.currentUser = { ...this.currentUser, ...data };
    try {
      localStorage.setItem('tvm_user_profile_' + this.currentUser.id, JSON.stringify(this.currentUser));
    } catch (e) {
      console.warn('Không thể lưu profile:', e);
    }

    window.dispatchEvent(new CustomEvent('tvm:auth_changed', { detail: { user: this.currentUser } }));
    return this.currentUser;
  }

  // Đăng nhập / Chuyển đổi tài khoản (Dùng để kiểm thử RBAC)
  loginAs(userId) {
    return this.switchUser(userId);
  }

  switchUser(userId) {
    let user = USERS.find(u => u.id === userId);
    if (!user) return false;

    try {
      const custom = localStorage.getItem('tvm_user_profile_' + user.id);
      if (custom) {
        user = { ...user, ...JSON.parse(custom) };
      }
    } catch (e) {}

    this.currentUser = user;
    localStorage.setItem(AUTH_KEY, user.id);

    if (user.role !== 'ADMIN') {
      this.activeDepartmentId = user.departmentId;
      localStorage.setItem(ACTIVE_DEPT_KEY, this.activeDepartmentId);
    }

    rung(25);
    window.dispatchEvent(new CustomEvent('tvm:auth_changed', { detail: { user } }));
    return true;
  }

  // Chuyển phòng ban đang xem (Dành cho Admin)
  switchDepartment(deptId) {
    if (!this.canSwitchDepartment()) {
      toast('Chỉ Ban Giám Đốc (Admin) mới có quyền chuyển phòng ban!', 'warning');
      return false;
    }
    const dept = DEPARTMENTS.find(d => d.id === deptId);
    if (!dept) return false;

    this.activeDepartmentId = deptId;
    localStorage.setItem(ACTIVE_DEPT_KEY, deptId);
    rung(15);
    window.dispatchEvent(new CustomEvent('tvm:department_changed', { detail: { dept } }));
    return true;
  }
}

export const auth = new AuthManager();

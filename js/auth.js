/**
 * THANH VŨ MEDIC CS3 - STRICT RBAC & DATA ISOLATION ENGINE
 * Phân quyền 3 cấp độ (Admin - Trưởng phòng - Nhân viên) bảo vệ cô lập dữ liệu
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
    const found = USERS.find(u => u.id === savedId);
    // Mặc định ban đầu: BS.CKI Trần Minh Tuấn (Trưởng phòng PTKH theo thiết kế Google Stitch)
    return found || USERS[1];
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

  // Quyền tạo & giao việc
  canCreateTask() {
    return this.isAdmin() || this.isManager();
  }

  // Quyền phê duyệt nhiệm vụ
  canApproveTask() {
    return this.isAdmin() || this.isManager();
  }

  // Quyền quản lý nhân sự & phân bổ
  canManageMembers() {
    return this.isAdmin() || this.isManager();
  }

  // Chuyển đổi tài khoản (Dùng để kiểm thử ngay lập tức)
  switchUser(userId) {
    const user = USERS.find(u => u.id === userId);
    if (!user) return false;

    this.currentUser = user;
    localStorage.setItem(AUTH_KEY, user.id);

    if (user.role !== 'ADMIN') {
      this.activeDepartmentId = user.departmentId;
      localStorage.setItem(ACTIVE_DEPT_KEY, this.activeDepartmentId);
    }

    rung(35);
    toast(`Đã đăng nhập: ${user.name} (${user.title})`, 'success');
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
    toast(`Đã chuyển sang: ${dept.name}`, 'info');
    window.dispatchEvent(new CustomEvent('tvm:department_changed', { detail: { dept } }));
    return true;
  }
}

export const auth = new AuthManager();

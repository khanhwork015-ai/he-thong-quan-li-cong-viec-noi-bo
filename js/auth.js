import { USERS, DEPARTMENTS, ROLES } from './models.js?v=8.7';
import { toast, rung } from './helpers.js?v=8.7';

export async function hashPassword(plainText) {
  if (plainText === null || plainText === undefined || String(plainText).trim() === '') return '';
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(String(plainText).trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    console.warn('[AUTH] crypto.subtle không khả dụng, dùng fallback:', err);
    return String(plainText).trim();
  }
}

const AUTH_KEY = 'tvm_auth_user_v3';
const ACTIVE_DEPT_KEY = 'tvm_active_dept_v3';
const SESSION_KEY = 'tvm_auth_session_v4';
const ROLE_RANK = { MEMBER: 1, DEPUTY_MANAGER: 2, MANAGER: 3, LEADERSHIP: 4, ADMIN: 5 };

export function normalizeUserMemberships(u) {
  if (!u || typeof u !== 'object') return [];
  let raw = u.memberships;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('[')) {
      try { raw = JSON.parse(trimmed); } catch (_) { raw = []; }
    } else {
      raw = [];
    }
  }

  const map = new Map();
  if (Array.isArray(raw)) {
    raw.forEach(m => {
      if (!m || !m.departmentId || m.departmentId === 'all') return;
      const dId = String(m.departmentId).trim();
      if (!dId) return;
      const role = String(m.role || u.role || 'MEMBER').trim().toUpperCase();
      const isLeaderOrMgr = (role === 'ADMIN' || role === 'MANAGER' || role === 'DEPUTY_MANAGER' || role === 'LEADERSHIP');
      const teamId = isLeaderOrMgr ? '' : String(m.teamId || '').trim();
      if (!map.has(dId)) {
        map.set(dId, { departmentId: dId, role, teamId });
      }
    });
  }

  if (map.size === 0 && u.departmentId && u.departmentId !== 'all') {
    const deptParts = String(u.departmentId).split(',').map(s => s.trim()).filter(Boolean);
    const fallbackRole = String(u.role || 'MEMBER').trim().toUpperCase();
    const isLeaderOrMgr = (fallbackRole === 'ADMIN' || fallbackRole === 'MANAGER' || fallbackRole === 'DEPUTY_MANAGER' || fallbackRole === 'LEADERSHIP');
    const fallbackTeam = isLeaderOrMgr ? '' : String(u.teamId || '').trim();
    deptParts.forEach((dId, idx) => {
      if (dId !== 'all' && !map.has(dId)) {
        map.set(dId, { departmentId: dId, role: fallbackRole, teamId: idx === 0 ? fallbackTeam : '' });
      }
    });
  }

  return Array.from(map.values());
}

export function normalizeUserRecord(u) {
  if (!u || typeof u !== 'object') return u;
  const memberships = normalizeUserMemberships(u);
  const hasAdminMembership = memberships.some(m => m.role === 'ADMIN');
  const isAdminFlag = Boolean(u.isAdmin === true || u.isAdmin === 'true' || u.isAdmin === 1 || u.role === 'ADMIN' || hasAdminMembership);
  let primaryDeptId = u.departmentId || 'dept_ptkh';
  let primaryTeamId = u.teamId || '';
  let primaryRole = String(u.role || 'MEMBER').trim().toUpperCase();

  if (memberships.length > 0) {
    const primary = memberships[0];
    primaryDeptId = primary.departmentId;
    primaryTeamId = primary.teamId || '';
    const bestRole = memberships.reduce((best, m) => (
      (ROLE_RANK[m.role] || 1) > (ROLE_RANK[best] || 1) ? m.role : best
    ), memberships[0].role);
    if (primaryRole !== 'LEADERSHIP') {
      primaryRole = bestRole;
    }
  }

  return {
    ...u,
    isAdmin: isAdminFlag,
    role: primaryRole,
    departmentId: primaryDeptId,
    teamId: primaryTeamId,
    memberships,
    username: String(u.username || (u.id ? u.id.replace('user_', '') : '')).trim().toLowerCase(),
    password: String(u.password !== undefined && u.password !== null && String(u.password).trim() !== '' ? u.password : '123').trim()
  };
}

export class AuthManager {
  constructor() {
    this.session = this.loadSession();
    this.currentUser = this.session ? this.session.user : null;
    this.activeDepartmentId = this.loadActiveDepartment();
  }

  getDeletedUserIds() {
    try {
      const raw = localStorage.getItem('tvm_deleted_ids_v1');
      const parsed = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
    } catch (_) {
      return new Set();
    }
  }

  getStoredUsers() {
    const deletedIds = this.getDeletedUserIds();
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

    return users
      .filter(u => u && u.id && !deletedIds.has(String(u.id)))
      .map(u => normalizeUserRecord(u));
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
        const users = this.getStoredUsers();
        let latestUser = users.find(u => u.id === sess.user.id) || sess.user;
        const custom = localStorage.getItem('tvm_user_profile_' + latestUser.id);
        if (custom) {
          try {
            latestUser = { ...latestUser, ...JSON.parse(custom) };
          } catch (_) {}
        }
        sess.user = normalizeUserRecord(latestUser);
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

    if (this.isAdmin() || this.isLeadership()) {
      return savedDept || 'all';
    }
    const userDeptIds = this.getUserDepartmentIds(this.currentUser);
    if (userDeptIds.length > 1) {
      if (savedDept && (savedDept === 'all' || userDeptIds.includes(savedDept))) {
        return savedDept;
      }
      return 'all';
    }
    if (userDeptIds.length === 1) {
      return userDeptIds[0];
    }
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

    if (!matched) {
      try {
        const { appScriptBridge } = await import('./services/appScriptBridge.js?v=8.7');
        if (appScriptBridge && appScriptBridge.isConnected()) {
          const cloudData = await appScriptBridge.fetchCloudData();
          if (cloudData && cloudData.success && Array.isArray(cloudData.users) && cloudData.users.length > 0) {
            const deletedIds = this.getDeletedUserIds();
            const userMap = new Map();
            users.forEach(u => userMap.set(u.id, u));
            cloudData.users.forEach(su => {
              if (su && su.id && !deletedIds.has(String(su.id))) {
                userMap.set(su.id, normalizeUserRecord({
                  ...userMap.get(su.id),
                  ...su
                }));
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
        message: 'Mật khẩu không chính xác. Vui lòng kiểm tra lại!'
      };
    }

    let fullUser = normalizeUserRecord({ ...matched });
    try {
      const custom = localStorage.getItem('tvm_user_profile_' + matched.id);
      if (custom) fullUser = normalizeUserRecord({ ...fullUser, ...JSON.parse(custom) });
    } catch (_) {}

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

    const userDeptIds = this.getUserDepartmentIds(fullUser);
    if (this.isAdmin() || this.isLeadership()) {
      const savedDept = localStorage.getItem(ACTIVE_DEPT_KEY);
      this.activeDepartmentId = savedDept || 'all';
      localStorage.setItem(ACTIVE_DEPT_KEY, this.activeDepartmentId);
    } else if (userDeptIds.length > 1) {
      this.activeDepartmentId = 'all';
      localStorage.setItem(ACTIVE_DEPT_KEY, 'all');
    } else if (userDeptIds.length === 1) {
      this.activeDepartmentId = userDeptIds[0];
      localStorage.setItem(ACTIVE_DEPT_KEY, this.activeDepartmentId);
    } else if (fullUser.departmentId && fullUser.departmentId !== 'all') {
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

  getUserMemberships(user = this.currentUser) {
    return normalizeUserMemberships(user);
  }

  getUserDepartmentIds(user = this.currentUser) {
    return this.getUserMemberships(user).map(m => m.departmentId);
  }

  getUserRoleInDepartment(deptId = null, user = this.currentUser) {
    if (!user) return 'MEMBER';
    if (user.role === 'LEADERSHIP') return 'LEADERSHIP';
    const memberships = this.getUserMemberships(user);
    const targetDeptId = deptId || this.activeDepartmentId;
    if (!targetDeptId || targetDeptId === 'all') {
      if (memberships.length === 0) return user.role || 'MEMBER';
      return memberships.reduce((best, m) => (ROLE_RANK[m.role] || 1) > (ROLE_RANK[best] || 1) ? m.role : best, memberships[0].role);
    }
    const found = memberships.find(m => m.departmentId === targetDeptId);
    if (found) return found.role;
    return memberships.length === 0 ? (user.role || 'MEMBER') : 'MEMBER';
  }

  getActiveDepartment() {
    if (this.activeDepartmentId === 'all') {
      const isGlobal = this.isAdmin() || this.isLeadership();
      return {
        id: 'all',
        name: isGlobal ? 'Toàn Hệ Thống (Tất Cả)' : 'Tất Cả Phòng Của Tôi',
        code: 'TẤT CẢ',
        badge: 'TẤT CẢ',
        unit: 'Shin Task Management',
        color: '#D6A52A'
      };
    }
    const depts = this.getStoredDepartments();
    const dept = depts.find(d => d.id === this.activeDepartmentId);
    return dept || depts[0] || DEPARTMENTS[0];
  }

  isAdmin() {
    return Boolean(this.currentUser && (this.currentUser.isAdmin === true || this.currentUser.role === 'ADMIN'));
  }

  isLeadership() {
    return this.currentUser?.role === 'LEADERSHIP';
  }

  isManager(deptId = null) {
    if (!this.currentUser) return false;
    const r = this.getUserRoleInDepartment(deptId, this.currentUser);
    return r === 'MANAGER' || r === 'DEPUTY_MANAGER';
  }

  isMember(deptId = null) {
    if (!this.currentUser) return false;
    if (this.isAdmin() || this.isLeadership()) return false;
    const r = this.getUserRoleInDepartment(deptId, this.currentUser);
    return r === 'MEMBER';
  }

  canSwitchDepartment() {
    return this.isAdmin() || this.isLeadership() || this.getUserDepartmentIds().length > 1;
  }

  canCRUDDepartments() {
    return this.isAdmin();
  }

  canProvisionAccount(targetRole = 'MEMBER', targetDeptId = null) {
    if (!this.isAuthenticated()) return false;
    return this.isAdmin();
  }

  canCreateTask() {
    return this.isAuthenticated();
  }

  canApproveTask() {
    return this.isAdmin() || this.isLeadership() || this.isManager();
  }

  canManageMembers() {
    return this.isAdmin();
  }

  updateProfile(data) {
    if (!this.currentUser) return null;
    this.currentUser = normalizeUserRecord({ ...this.currentUser, ...data });

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

    try {
      const saved = localStorage.getItem('tvm_users_v4');
      if (saved) {
        const users = JSON.parse(saved);
        if (Array.isArray(users)) {
          const idx = users.findIndex(u => u.id === this.currentUser.id);
          if (idx >= 0) {
            users[idx] = normalizeUserRecord({ ...users[idx], ...this.currentUser, updatedAt: new Date().toISOString() });
            localStorage.setItem('tvm_users_v4', JSON.stringify(users));
          }
        }
      }
    } catch (e) {}

    window.dispatchEvent(new CustomEvent('tvm:auth_changed', { detail: { user: this.currentUser } }));
    return this.currentUser;
  }

  loginAs(userId) {
    const users = this.getStoredUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return false;
    return this.login(user.username || user.id, user.password || '123');
  }

  switchDepartment(deptId) {
    if (!this.canSwitchDepartment()) {
      toast('Chỉ nhân sự thuộc nhiều phòng ban, Ban Lãnh Đạo hoặc Admin mới có thể đổi phòng ban!', 'warning');
      return false;
    }
    const isGlobal = this.isAdmin() || this.isLeadership();
    const allowedDeptIds = this.getUserDepartmentIds();
    if (!isGlobal && deptId !== 'all' && !allowedDeptIds.includes(deptId)) {
      toast('Bạn không thuộc phòng ban này!', 'warning');
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

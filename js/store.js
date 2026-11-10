/**
 * THANH VŨ MEDIC CS3 - CENTRALIZED REACTIVE STORE (APPS SCRIPT INTEGRATED)
 * Hỗ trợ CRUD Nhân viên, Hồ sơ cá nhân và Đồng bộ Google Sheets / SHIN AIOS
 */

import { INITIAL_TASKS, DEPARTMENTS, USERS, INITIAL_PLANS, INITIAL_NOTIFICATIONS } from './models.js?v=8.2';
import { auth } from './auth.js?v=8.2';
import { appScriptBridge } from './services/appScriptBridge.js?v=8.2';
import { toast } from './helpers.js?v=8.2';

const TASKS_STORAGE_KEY = 'tvm_tasks_v3';
const USERS_STORAGE_KEY = 'tvm_users_v4';
const DEPTS_STORAGE_KEY = 'tvm_departments_v4';
const NOTIF_STORAGE_KEY = 'tvm_notifications_v2';
const PLANS_STORAGE_KEY = 'tvm_plans_v1';
const DELETED_IDS_KEY = 'tvm_deleted_ids_v1';
const DEMO_SEED_IDS = ['PTKH-101', 'PTKH-102', 'PTKH-103', 'PTKH-104', 'DUOC-201', 'QLDA-301', 'PLAN-PTKH-01', 'PLAN-PTKH-02', 'PLAN-DUOC-01', 'notif_init_1', 'notif_init_2', 'notif_init_3', 'notif_init_4', 'notif_init_5', 'notif_init_6'];

export class Store {
  constructor() {
    this.init();
    this.syncFromCloudIfAvailable();
  }

  getDeletedIds() {
    try { return new Set(JSON.parse(localStorage.getItem(DELETED_IDS_KEY)) || []); }
    catch (_) { return new Set(); }
  }

  markDeletedIds(ids = []) {
    const set = this.getDeletedIds();
    ids.forEach(id => { if (id) set.add(String(id)); });
    localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(Array.from(set)));
  }

  init() {
    // DỮ LIỆU VẬN HÀNH (công việc / kế hoạch / thông báo) BẮT ĐẦU RỖNG - dữ liệu thật lấy từ Google Sheet
    if (!localStorage.getItem(TASKS_STORAGE_KEY)) {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(USERS_STORAGE_KEY)) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(USERS));
    }
    if (!localStorage.getItem(DEPTS_STORAGE_KEY)) {
      localStorage.setItem(DEPTS_STORAGE_KEY, JSON.stringify(DEPARTMENTS));
    }
    if (!localStorage.getItem(PLANS_STORAGE_KEY)) {
      localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(NOTIF_STORAGE_KEY)) {
      localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify([]));
    }
  }

  // Tải dữ liệu từ Google Sheet về
  async syncFromCloudIfAvailable() {
    if (!appScriptBridge.isConnected()) {
      return { success: false, message: 'Chưa cấu hình URL Google Apps Script Endpoint' };
    }

    const cloudData = await appScriptBridge.fetchCloudData();
    if (cloudData && cloudData.success) {
      let taskCount = 0;
      let userCount = 0;

      if (cloudData.tasks && cloudData.tasks.length > 0) {
        // HỢP NHẤT DỮ LIỆU CÔNG VIỆC & VIỆC CON 2 CHIỀU (ZERO DATA LOSS)
        const localTasks = this.getAllTasksRaw();
        const taskMap = new Map();
        localTasks.forEach(lt => { if (lt && lt.id) taskMap.set(lt.id, lt); });

        const deletedIds = this.getDeletedIds();
        cloudData.tasks.forEach(ct => {
          if (!ct || !ct.id || deletedIds.has(String(ct.id))) return;
          const local = taskMap.get(ct.id) || {};

          // Chuẩn hóa subtasks từ cloud (hỗ trợ cả trường subtasks và checklist)
          let ctSubtasks = ct.subtasks;
          if (typeof ctSubtasks === 'string' && ctSubtasks.trim().startsWith('[')) {
            try { ctSubtasks = JSON.parse(ctSubtasks); } catch (_) { ctSubtasks = []; }
          }
          if (!Array.isArray(ctSubtasks) || ctSubtasks.length === 0) {
            let ctChecklist = ct.checklist;
            if (typeof ctChecklist === 'string' && ctChecklist.trim().startsWith('[')) {
              try { ctChecklist = JSON.parse(ctChecklist); } catch (_) { ctChecklist = []; }
            }
            if (Array.isArray(ctChecklist) && ctChecklist.length > 0) {
              ctSubtasks = ctChecklist.map((c, i) => ({
                id: c.id || `${ct.id}.${i + 1}`,
                title: c.text || c.title || '',
                description: c.description || '',
                assigneeId: c.assigneeId || ct.assigneeId || '',
                dueDate: c.dueDate || ct.dueDate || '',
                status: (c.done || c.completed) ? 'done' : 'in_progress',
                completed: Boolean(c.done || c.completed),
                createdAt: c.createdAt || new Date().toISOString()
              }));
            }
          }
          if (!Array.isArray(ctSubtasks)) ctSubtasks = [];

          // Hợp nhất việc con: Ưu tiên giữ lại toàn bộ việc con cục bộ đã tạo mà cloud chưa kịp nhận
          const localSubtasks = Array.isArray(local.subtasks) ? local.subtasks : [];
          const subMap = new Map();
          ctSubtasks.forEach(s => { if (s && s.id) subMap.set(s.id, s); });
          localSubtasks.forEach(ls => {
            if (!ls || !ls.id) return;
            if (!subMap.has(ls.id)) {
              subMap.set(ls.id, ls);
            } else {
              const existing = subMap.get(ls.id);
              subMap.set(ls.id, { ...existing, ...ls });
            }
          });
          const mergedSubtasks = Array.from(subMap.values());

          // Hợp nhất bình luận & trao đổi
          let ctComments = ct.comments;
          if (typeof ctComments === 'string' && ctComments.trim().startsWith('[')) {
            try { ctComments = JSON.parse(ctComments); } catch (_) { ctComments = []; }
          }
          if (!Array.isArray(ctComments)) ctComments = [];
          const localComments = Array.isArray(local.comments) ? local.comments : [];
          const commentMap = new Map();
          ctComments.forEach(c => { if (c && c.id) commentMap.set(c.id, c); });
          localComments.forEach(lc => { if (lc && lc.id) commentMap.set(lc.id, lc); });
          const mergedComments = Array.from(commentMap.values());

          const completedCount = mergedSubtasks.filter(s => s.completed || s.status === 'done').length;
          const progress = mergedSubtasks.length > 0 ? Math.round((completedCount / mergedSubtasks.length) * 100) : (ct.progress || local.progress || 0);

          const mergedTask = {
            ...local,
            ...ct,
            subtasks: mergedSubtasks,
            checklist: mergedSubtasks.map(s => ({
              id: s.id,
              text: s.title,
              done: Boolean(s.completed || s.status === 'done')
            })),
            comments: mergedComments,
            progress
          };
          taskMap.set(ct.id, mergedTask);
        });

        const mergedList = Array.from(taskMap.values());
        localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(mergedList));
        taskCount = mergedList.length;
      }
      if (cloudData.users && cloudData.users.length > 0) {
        // Chuẩn hóa và hợp nhất người dùng an toàn (Zero Data Loss & Type Safety)
        const currentUsers = this.getAllUsers();
        const userMap = new Map();
        currentUsers.forEach(u => { if (u && u.id) userMap.set(u.id, u); });

        cloudData.users.forEach(su => {
          if (!su || !su.id) return;
          const existing = userMap.get(su.id) || {};
          const merged = {
            ...existing,
            ...su,
            username: String(su.username || existing.username || su.id.replace('user_', '')).trim().toLowerCase(),
            password: String(su.password !== undefined && su.password !== null && String(su.password).trim() !== '' ? su.password : (existing.password || '123')).trim(),
            role: (su.role || existing.role || 'MEMBER').toUpperCase(),
            isAdmin: Boolean(su.isAdmin !== undefined ? (su.isAdmin === true || su.isAdmin === 'true' || su.isAdmin === 1) : (existing.isAdmin || su.role === 'ADMIN' || existing.role === 'ADMIN')),
            departmentId: su.departmentId || existing.departmentId || 'dept_ptkh',
            teamId: su.teamId || existing.teamId || null
          };
          userMap.set(su.id, merged);
        });

        const mergedList = Array.from(userMap.values());
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(mergedList));
        userCount = mergedList.length;
      }

      if (cloudData.depts && cloudData.depts.length > 0) {
        const localDepts = this.getAllDepartments();
        const mergedDepts = cloudData.depts.map(cd => {
          const ld = localDepts.find(l => l.id === cd.id);
          let cdTeams = cd.teams;
          if (typeof cdTeams === 'string') {
            try { cdTeams = JSON.parse(cdTeams); } catch (_) { cdTeams = []; }
          }
          if (!Array.isArray(cdTeams)) cdTeams = [];
          
          const ldTeams = (ld && Array.isArray(ld.teams)) ? ld.teams : [];
          // Hợp nhất teams của phòng ban giữa Local và Cloud, bảo toàn 100% dữ liệu đã tạo
          const teamMap = new Map();
          ldTeams.forEach(t => { if (t && t.id) teamMap.set(t.id, t); });
          cdTeams.forEach(t => { if (t && t.id) teamMap.set(t.id, { ...(teamMap.get(t.id) || {}), ...t }); });

          return {
            ...(ld || {}),
            ...cd,
            teams: Array.from(teamMap.values())
          };
        });

        // Giữ lại các phòng ban tạo ở local chưa kịp đẩy lên Cloud
        localDepts.forEach(ld => {
          if (!mergedDepts.some(md => md.id === ld.id)) {
            mergedDepts.push(ld);
          }
        });

        localStorage.setItem(DEPTS_STORAGE_KEY, JSON.stringify(mergedDepts));
      }

      // Thông báo: Sheet là nguồn chuẩn (xóa/đã đọc đã được đồng bộ ngược lên Sheet)
      if (Array.isArray(cloudData.notifications)) {
        const deletedIds = this.getDeletedIds();
        const cloudNotifs = cloudData.notifications.filter(n => n && n.id && !deletedIds.has(String(n.id))).map(n => ({
          ...n,
          isRead: n.isRead === true || n.isRead === 'true' || n.isRead === 'TRUE'
        }));
        const cloudIds = new Set(cloudNotifs.map(n => n.id));
        const localOnly = this.getAllNotifications().filter(n => n && n.id && !cloudIds.has(n.id));
        localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify([...cloudNotifs, ...localOnly]));
        window.dispatchEvent(new CustomEvent('tvm:notifications_changed', { detail: { count: cloudNotifs.length } }));
      }

      // Kế hoạch: hợp nhất theo id (ưu tiên bản mới hơn theo updatedAt)
      let planCount = 0;
      if (Array.isArray(cloudData.plans) && cloudData.plans.length > 0) {
        const planMap = new Map();
        this.getAllPlansRaw().forEach(lp => { if (lp && lp.id) planMap.set(lp.id, lp); });
        const deletedPlanIds = this.getDeletedIds();
        cloudData.plans.forEach(cp => {
          if (!cp || !cp.id || deletedPlanIds.has(String(cp.id))) return;
          const lp = planMap.get(cp.id);
          const cloudTime = Date.parse(cp.updatedAt || '') || 0;
          const localTime = lp ? (Date.parse(lp.updatedAt || '') || 0) : 0;
          planMap.set(cp.id, (lp && localTime > cloudTime) ? lp : { ...(lp || {}), ...cp });
        });
        const mergedPlans = Array.from(planMap.values());
        localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(mergedPlans));
        planCount = mergedPlans.length;
        window.dispatchEvent(new CustomEvent('tvm:plans_changed'));
      }

      window.dispatchEvent(new CustomEvent('tvm:data_changed'));
      window.dispatchEvent(new CustomEvent('tvm:users_changed'));

      return {
        success: true,
        taskCount,
        userCount,
        planCount,
        message: `Đồng bộ thành công! Đã nạp ${taskCount} công việc, ${planCount} kế hoạch và ${userCount} nhân sự từ Google Sheet.`
      };
    } else {
      return {
        success: false,
        message: cloudData ? (cloudData.message || cloudData.error) : 'Lỗi kết nối tới Apps Script'
      };
    }
  }

  // Đẩy toàn bộ dữ liệu mẫu / hiện tại từ Web App lên Google Sheet
  async pushAllToCloud() {
    if (!appScriptBridge.isConnected()) {
      return { success: false, message: 'Chưa cấu hình URL Google Apps Script Endpoint' };
    }

    const tasks = this.getAllTasksRaw();
    const users = this.getAllUsers();
    const notifs = this.getAllNotifications();
    const depts = this.getAllDepartments();
    const plans = this.getAllPlansRaw();
    const success = await appScriptBridge.pushAllToCloud(tasks, users, notifs, depts, plans);
    return {
      success,
      taskCount: tasks.length,
      userCount: users.length,
      deptCount: depts.length,
      message: success 
        ? `Đã đẩy ${tasks.length} công việc, ${plans.length} kế hoạch, ${users.length} nhân sự và ${depts.length} phòng ban lên Google Sheet thành công!` 
        : 'Gửi dữ liệu lên Google Sheet thất bại'
    };
  }

  // Khởi tạo bảng dữ liệu mẫu trên Google Sheet
  async seedCloudData() {
    if (!appScriptBridge.isConnected()) {
      return { success: false, message: 'Chưa cấu hình URL Google Apps Script' };
    }
    const res = await appScriptBridge.seedCloudData();
    if (res && res.success) {
      if (res.tasks && res.tasks.length > 0) {
        localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(res.tasks));
      }
      if (res.users && res.users.length > 0) {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(res.users));
      }
      window.dispatchEvent(new CustomEvent('tvm:data_changed'));
      return { success: true, message: 'Đã khởi tạo bảng dữ liệu mẫu trên Google Sheet!' };
    }
    return { success: false, message: 'Không thể khởi tạo trên Google Sheet' };
  }

  // --- QUẢN LÝ NHÂN SỰ (CRUD USERS) ---
  getAllUsers() {
    try {
      return JSON.parse(localStorage.getItem(USERS_STORAGE_KEY)) || USERS;
    } catch (_) {
      return USERS;
    }
  }

  saveAllUsers(users) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    window.dispatchEvent(new CustomEvent('tvm:users_changed'));
  }

  getUserById(userId) {
    return this.getAllUsers().find(u => u.id === userId) || null;
  }

  getDepartmentUsers(deptId, includeGlobal = false) {
    if (!deptId || deptId === 'all') {
      return this.getAllUsers();
    }
    return this.getAllUsers().filter(u => u.departmentId === deptId || (includeGlobal && u.departmentId === 'all'));
  }

  // --- QUẢN LÝ PHÒNG BAN & BỘ PHẬN CON (CRUD DEPARTMENTS & TEAMS) ---
  getAllDepartments() {
    try {
      const saved = localStorage.getItem(DEPTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return DEPARTMENTS;
  }

  saveAllDepartments(depts) {
    localStorage.setItem(DEPTS_STORAGE_KEY, JSON.stringify(depts));
    window.dispatchEvent(new CustomEvent('tvm:departments_changed', { detail: { departments: depts } }));
    window.dispatchEvent(new CustomEvent('tvm:data_changed'));
    // Tự động đồng bộ lên Google Sheets (nếu có kết nối)
    if (appScriptBridge.isConnected()) {
      appScriptBridge.pushDepartments(depts);
    }
  }

  getDepartmentById(deptId) {
    return this.getAllDepartments().find(d => d.id === deptId) || null;
  }

  createDepartment(deptData) {
    if (!auth.canCRUDDepartments()) {
      return { success: false, message: 'Chỉ Quản Trị Viên (Admin) mới có quyền tạo phòng ban!' };
    }
    const depts = this.getAllDepartments();
    const newDept = {
      id: `dept_${Date.now().toString().slice(-6)}`,
      name: deptData.name.trim(),
      code: (deptData.code || 'PB').trim().toUpperCase(),
      unit: deptData.unit || 'Cơ Sở 3 (Cà Mau)',
      managerId: deptData.managerId || '',
      description: deptData.description || '',
      badge: deptData.badge || deptData.code,
      color: deptData.color || '#D6A52A',
      teams: deptData.teams || []
    };
    depts.push(newDept);
    this.saveAllDepartments(depts);
    return { success: true, department: newDept };
  }

  updateDepartment(deptId, deptData) {
    if (!auth.canCRUDDepartments()) {
      return { success: false, message: 'Chỉ Quản Trị Viên (Admin) mới có quyền sửa phòng ban!' };
    }
    const depts = this.getAllDepartments();
    const idx = depts.findIndex(d => d.id === deptId);
    if (idx < 0) return { success: false, message: 'Không tìm thấy phòng ban!' };

    const sanitizedData = { ...deptData };
    if (typeof sanitizedData.name === 'string') sanitizedData.name = sanitizedData.name.trim();
    if (typeof sanitizedData.code === 'string') {
      sanitizedData.code = sanitizedData.code.trim().toUpperCase();
      if (!sanitizedData.badge) {
        sanitizedData.badge = sanitizedData.code;
      }
    }
    if (typeof sanitizedData.unit === 'string') sanitizedData.unit = sanitizedData.unit.trim();

    delete sanitizedData.id;
    depts[idx] = { ...depts[idx], ...sanitizedData, id: depts[idx].id, updatedAt: new Date().toISOString() };
    this.saveAllDepartments(depts);
    return { success: true, department: depts[idx] };
  }

  deleteDepartment(deptId) {
    if (!auth.canCRUDDepartments()) {
      return { success: false, message: 'Chỉ Quản Trị Viên (Admin) mới có quyền xóa phòng ban!' };
    }
    const depts = this.getAllDepartments();
    const filtered = depts.filter(d => d.id !== deptId);
    this.saveAllDepartments(filtered);
    return { success: true };
  }

  addTeamToDepartment(deptId, teamData) {
    if (!auth.canCRUDDepartments()) {
      return { success: false, message: 'Chỉ Quản Trị Viên (Admin) mới có quyền thêm bộ phận con!' };
    }
    const depts = this.getAllDepartments();
    const dept = depts.find(d => d.id === deptId);
    if (!dept) return { success: false, message: 'Không tìm thấy phòng ban!' };

    const newTeam = {
      id: `team_${Date.now().toString().slice(-6)}`,
      name: teamData.name.trim(),
      code: (teamData.code || 'TEAM').trim().toUpperCase(),
      description: teamData.description || ''
    };
    dept.teams = dept.teams || [];
    dept.teams.push(newTeam);
    this.saveAllDepartments(depts);
    return { success: true, team: newTeam };
  }

  updateTeamInDepartment(deptId, teamId, teamData) {
    if (!auth.canCRUDDepartments()) {
      return { success: false, message: 'Chỉ Quản Trị Viên (Admin) mới có quyền sửa bộ phận con!' };
    }
    if (!teamData || typeof teamData !== 'object') {
      return { success: false, message: 'Dữ liệu bộ phận con không hợp lệ!' };
    }
    const depts = this.getAllDepartments();
    const dept = depts.find(d => d.id === deptId);
    if (!dept || !dept.teams) return { success: false, message: 'Không tìm thấy phòng ban hoặc bộ phận con!' };

    const teamIdx = dept.teams.findIndex(t => t.id === teamId);
    if (teamIdx < 0) return { success: false, message: 'Không tìm thấy bộ phận con!' };

    const currentTeam = dept.teams[teamIdx];
    const updatedTeam = {
      ...currentTeam,
      name: teamData.name ? teamData.name.trim() : currentTeam.name,
      code: teamData.code ? teamData.code.trim().toUpperCase() : currentTeam.code,
      description: teamData.description !== undefined ? teamData.description : currentTeam.description,
      updatedAt: new Date().toISOString()
    };

    dept.teams[teamIdx] = updatedTeam;
    this.saveAllDepartments(depts);
    return { success: true, team: updatedTeam };
  }

  removeTeamFromDepartment(deptId, teamId) {
    if (!auth.canCRUDDepartments()) {
      return { success: false, message: 'Chỉ Quản Trị Viên (Admin) mới có quyền xóa bộ phận con!' };
    }
    const depts = this.getAllDepartments();
    const dept = depts.find(d => d.id === deptId);
    if (!dept || !dept.teams) return { success: false, message: 'Không tìm thấy phòng ban hoặc bộ phận con!' };

    dept.teams = dept.teams.filter(t => t.id !== teamId);
    this.saveAllDepartments(depts);
    return { success: true };
  }

  createUser(userData) {
    const targetRole = userData.role || 'MEMBER';
    const targetDeptId = userData.departmentId || auth.getActiveDepartment().id;

    if (!auth.canProvisionAccount(targetRole, targetDeptId)) {
      return null;
    }

    const users = this.getAllUsers();
    const newUser = {
      id: `user_${Date.now().toString().slice(-6)}`,
      username: (userData.username || `user_${Date.now().toString().slice(-4)}`).trim().toLowerCase(),
      password: (userData.password || '123').trim(),
      name: userData.name.trim(),
      role: targetRole,
      isAdmin: Boolean(userData.isAdmin || targetRole === 'ADMIN'),
      departmentId: targetDeptId,
      teamId: userData.teamId || '',
      title: userData.title.trim() || 'Chuyên viên',
      unit: userData.unit || (this.getDepartmentById(targetDeptId)?.name || 'Thanh Vũ Medic'),
      avatar: userData.avatar?.trim() || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
      badge: userData.badge || (targetRole === 'MANAGER' ? 'Trưởng phòng' : (targetRole === 'DEPUTY_MANAGER' ? 'Phó phòng' : (targetRole === 'LEADERSHIP' ? 'Ban Lãnh Đạo' : 'Chuyên viên'))),
      phone: userData.phone || '',
      email: userData.email || '',
      dob: userData.dob || '',
      hometown: userData.hometown || '',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    this.saveAllUsers(users);
    appScriptBridge.pushUser(newUser);
    return newUser;
  }

  updateUser(idOrData, maybeData) {
    const userData = (typeof idOrData === 'string') ? { id: idOrData, ...maybeData } : (idOrData || {});
    if (!userData.id) return null;

    const users = this.getAllUsers();
    const idx = users.findIndex(u => u.id === userData.id);
    if (idx < 0) return null;

    users[idx] = {
      ...users[idx],
      ...userData,
      updatedAt: new Date().toISOString()
    };

    this.saveAllUsers(users);
    appScriptBridge.pushUser(users[idx]);

    // Luôn lưu bản sao profile độc lập để auth.loadUser() có thể nạp ngay
    try {
      localStorage.setItem('tvm_user_profile_' + users[idx].id, JSON.stringify(users[idx]));
    } catch (e) {
      console.warn('Lỗi lưu tvm_user_profile_:', e);
    }

    // Nếu sửa thông tin của chính người đang đăng nhập -> Cập nhật Auth
    const current = auth.getCurrentUser();
    if (current && current.id === users[idx].id) {
      auth.updateProfile(users[idx]);
    }

    return users[idx];
  }

  deleteUser(userId) {
    const users = this.getAllUsers();
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) return false;

    // Không cho phép xóa Quản Trị Viên (Admin) nếu là Admin duy nhất
    if (userToDelete.isAdmin || userToDelete.role === 'ADMIN') {
      const adminCount = users.filter(u => u.isAdmin || u.role === 'ADMIN').length;
      if (adminCount <= 1) {
        toast('Không thể xóa Quản Trị Viên duy nhất của hệ thống!', 'error');
        return false;
      }
    }

    const filtered = users.filter(u => u.id !== userId);
    this.saveAllUsers(filtered);
    appScriptBridge.deleteUser(userId);
    return true;
  }

  // Cập nhật hồ sơ cá nhân của chính mình
  updateCurrentUserProfile(profileData) {
    const current = auth.getCurrentUser();
    return this.updateUser({
      id: current.id,
      name: profileData.name,
      title: profileData.title,
      phone: profileData.phone,
      email: profileData.email,
      avatar: profileData.avatar,
      unit: profileData.unit || current.unit
    });
  }

  // --- QUẢN LÝ CÔNG VIỆC (CRUD TASKS) ---
  getAllTasksRaw() {
    try {
      const savedStr = localStorage.getItem(TASKS_STORAGE_KEY);
      const raw = savedStr ? JSON.parse(savedStr) : [];
      if (Array.isArray(raw)) {
        return raw.map(t => {
          if (!t) return t;
          let subtasks = t.subtasks || t.checklist || [];
          if (typeof subtasks === 'string') {
            try { subtasks = JSON.parse(subtasks); } catch (_) { subtasks = []; }
          }
          if (!Array.isArray(subtasks)) subtasks = [];
          subtasks = subtasks.map((s, idx) => {
            const isCompleted = s.status === 'done' || s.completed === true || s.done === true;
            return {
              id: s.id || `${t.id}.${idx + 1}`,
              title: s.title || s.text || '',
              description: s.description || '',
              assigneeId: s.assigneeId || t.assigneeId || '',
              dueDate: s.dueDate || t.dueDate || '',
              status: s.status || (isCompleted ? 'done' : 'in_progress'),
              completed: isCompleted,
              createdAt: s.createdAt || t.createdAt || new Date().toISOString()
            };
          });

          let comments = t.comments;
          if (typeof comments === 'string') {
            try { comments = JSON.parse(comments); } catch (_) { comments = []; }
          }
          if (!Array.isArray(comments)) comments = [];

          return { 
            ...t, 
            subtasks, 
            comments,
            creatorName: t.creatorName || (this.getUserById(t.creatorId)?.name || 'Hệ thống')
          };
        });
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  saveAllTasks(tasks) {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    window.dispatchEvent(new CustomEvent('tvm:data_changed'));
  }

  getDepartmentTasks(options = {}) {
    const allTasks = this.getAllTasksRaw();
    const currentDept = auth.getActiveDepartment() || { id: 'all' };
    const currentUser = auth.getCurrentUser() || { id: '' };

    let filtered = allTasks;
    if (!auth.isAdmin() || currentDept.id !== 'all') {
      filtered = filtered.filter(t => t.departmentId === currentDept.id);
    }

    if (auth.isMember() && options.personalOnly) {
      filtered = filtered.filter(t => t.assigneeId === currentUser.id);
    }

    if (options.tab === 'assigned_to_me') {
      filtered = filtered.filter(t => t.assigneeId === currentUser.id);
    } else if (options.tab === 'created_by_me') {
      filtered = filtered.filter(t => t.creatorId === currentUser.id);
    } else if (options.tab === 'pending_approval') {
      filtered = filtered.filter(t => t.status === 'pending_approval' || t.status === 'review');
    } else if (options.tab === 'completed') {
      filtered = filtered.filter(t => t.status === 'done' || t.status === 'completed');
    } else if (options.tab === 'overdue') {
      const todayStr = new Date().toISOString().slice(0, 10);
      filtered = filtered.filter(t => t.dueDate && t.dueDate < todayStr && t.status !== 'done' && t.status !== 'completed');
    }

    if (options.priority && options.priority !== 'ALL') {
      filtered = filtered.filter(t => t.priority === options.priority);
    }

    if (options.teamId && options.teamId !== 'ALL') {
      filtered = filtered.filter(t => t.teamId === options.teamId);
    }

    if (options.status && options.status !== 'ALL') {
      filtered = filtered.filter(t => t.status === options.status);
    }

    if (options.searchQuery && options.searchQuery.trim()) {
      const q = options.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        (t.category && t.category.toLowerCase().includes(q))
      );
    }

    return filtered;
  }

  getTaskById(id) {
    return this.getAllTasksRaw().find(t => t.id === id) || null;
  }

  createTask(taskData) {
    const tasks = this.getAllTasksRaw();
    const activeDept = auth.getActiveDepartment() || { id: 'dept_ptkh', code: 'PTKH-CS3' };
    const currentUser = auth.getCurrentUser() || { id: 'user_admin', name: 'Ban Giám Đốc' };

    const targetDeptId = (taskData.departmentId && taskData.departmentId !== 'all') 
      ? taskData.departmentId 
      : (activeDept.id === 'all' ? (this.getAllDepartments()[0]?.id || 'dept_ptkh') : activeDept.id);
    const dept = this.getDepartmentById(targetDeptId) || activeDept;
    const prefix = dept?.code ? dept.code.split('-')[0] : 'TASK';
    const existingIds = new Set(tasks.map(t => t.id));
    let seq = tasks.reduce((m, t) => {
      const mt = String(t.id || '').match(new RegExp('^' + prefix + '-(\\d+)$'));
      const n = mt ? parseInt(mt[1], 10) : 0;
      return n > m ? n : m;
    }, 0);
    let newId;
    do { seq += 1; newId = `${prefix}-${String(seq).padStart(3, '0')}`; } while (existingIds.has(newId));

    const requiresApproval = Boolean(taskData.requiresApproval);
    const approverId = requiresApproval ? (taskData.approverId || dept.managerId || 'user_lanhdao') : null;
    const initialStatus = requiresApproval ? 'pending_approval' : (taskData.status || 'todo');

    const rawSubtasks = Array.isArray(taskData.subtasks) ? taskData.subtasks : [];
    const subtasks = rawSubtasks.map((s, idx) => {
      const isCompleted = s.status === 'done' || Boolean(s.completed);
      return {
        id: s.id || `${newId}.${idx + 1}`,
        title: (s.title || s.text || '').trim(),
        description: (s.description || '').trim(),
        assigneeId: s.assigneeId || taskData.assigneeId || currentUser.id,
        dueDate: s.dueDate || taskData.dueDate || new Date().toISOString().split('T')[0],
        status: s.status || (isCompleted ? 'done' : 'todo'),
        completed: isCompleted,
        createdAt: s.createdAt || new Date().toISOString()
      };
    });
    const completedCount = subtasks.filter(s => s.completed || s.status === 'done').length;
    const initialProgress = subtasks.length > 0 ? Math.round((completedCount / subtasks.length) * 100) : 0;

    const newTask = {
      id: newId,
      departmentId: taskData.departmentId || currentDept.id,
      teamId: taskData.teamId || '',
      creatorId: currentUser.id,
      creatorName: currentUser.name,
      assigneeId: taskData.assigneeId || currentUser.id,
      approverId: approverId,
      requiresApproval: requiresApproval,
      approvalStatus: requiresApproval ? 'PENDING' : 'NONE',
      title: taskData.title,
      description: taskData.description || '',
      priority: taskData.priority || 'P2',
      status: initialStatus,
      dueDate: taskData.dueDate || new Date().toISOString().split('T')[0],
      category: taskData.category || 'Hành chính',
      progress: initialProgress,
      cost: parseInt(taskData.cost, 10) || 0,
      subtasks: subtasks,
      checklist: subtasks.map(s => ({
        id: s.id,
        text: s.title,
        done: Boolean(s.completed || s.status === 'done'),
        assigneeId: s.assigneeId,
        dueDate: s.dueDate
      })),
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    tasks.unshift(newTask);
    this.saveAllTasks(tasks);
    appScriptBridge.pushTask(newTask);

    // Gửi thông báo cho Assignee
    if (newTask.assigneeId && newTask.assigneeId !== currentUser.id) {
      this.addNotification({
        recipientId: newTask.assigneeId,
        senderId: currentUser.id,
        type: 'task_assigned',
        title: '📋 Bạn được giao công việc mới',
        content: `${currentUser.name} đã giao nhiệm vụ "${newTask.title}" (${newTask.id}) cho bạn. Hạn hoàn thành: ${newTask.dueDate}.`,
        taskId: newTask.id
      });
    }

    // Nếu công việc cần phê duyệt, gửi thông báo khẩn cho Người phê duyệt
    if (newTask.requiresApproval && newTask.approverId && newTask.approverId !== currentUser.id) {
      this.addNotification({
        recipientId: newTask.approverId,
        senderId: currentUser.id,
        type: 'approval_request',
        title: '⏳ Nhiệm vụ mới cần bạn phê duyệt',
        content: `${currentUser.name} đã gửi yêu cầu phê duyệt công việc "${newTask.title}" (${newTask.id}).`,
        taskId: newTask.id
      });
    }

    return newTask;
  }

  updateTask(taskId, updates = {}) {
    const tasks = this.getAllTasksRaw();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return null;

    const currentUser = auth.getCurrentUser() || { id: '', name: 'Hệ thống' };

    if (updates.title !== undefined) task.title = updates.title.trim();
    if (updates.description !== undefined) task.description = (updates.description || '').trim();
    if (updates.teamId !== undefined) task.teamId = updates.teamId || '';
    if (updates.priority !== undefined) task.priority = updates.priority;
    if (updates.dueDate !== undefined) task.dueDate = updates.dueDate;
    if (updates.category !== undefined) task.category = updates.category.trim() || 'Chuyên môn';
    if (updates.cost !== undefined) task.cost = parseInt(updates.cost, 10) || 0;
    if (updates.departmentId !== undefined) task.departmentId = updates.departmentId;

    // Phân công người thực hiện
    const oldAssigneeId = task.assigneeId;
    if (updates.assigneeId !== undefined) {
      task.assigneeId = updates.assigneeId;
      if (oldAssigneeId !== updates.assigneeId && updates.assigneeId && updates.assigneeId !== currentUser.id) {
        this.addNotification({
          recipientId: updates.assigneeId,
          senderId: currentUser.id,
          type: 'task_assigned',
          title: '📋 Bạn được phân công nhiệm vụ',
          content: `${currentUser.name} đã cập nhật người thực hiện nhiệm vụ "${task.title}" (${task.id}) cho bạn.`,
          taskId: task.id
        });
      }
    }

    // Yêu cầu phê duyệt
    if (updates.requiresApproval !== undefined) {
      task.requiresApproval = Boolean(updates.requiresApproval);
      if (task.requiresApproval && (!task.approvalStatus || task.approvalStatus === 'NONE')) {
        task.approvalStatus = 'PENDING';
      }
    }
    if (updates.approverId !== undefined) task.approverId = updates.approverId || null;

    // Trạng thái công việc
    if (updates.status !== undefined) {
      task.status = updates.status;
      if (updates.status === 'done' || updates.status === 'completed') {
        task.progress = 100;
        task.completedAt = task.completedAt || new Date().toISOString();
      }
    }

    // Đồng bộ và tính toán subtasks nếu có truyền vào
    if (Array.isArray(updates.subtasks)) {
      task.subtasks = updates.subtasks.map((s, idx) => {
        const isCompleted = s.status === 'done' || Boolean(s.completed);
        return {
          id: s.id || `${task.id}.${idx + 1}`,
          title: (s.title || s.text || '').trim(),
          description: (s.description || '').trim(),
          assigneeId: s.assigneeId || task.assigneeId || currentUser.id,
          dueDate: s.dueDate || task.dueDate || new Date().toISOString().split('T')[0],
          status: s.status || (isCompleted ? 'done' : 'todo'),
          completed: isCompleted,
          createdAt: s.createdAt || new Date().toISOString()
        };
      });

      task.checklist = task.subtasks.map(s => ({
        id: s.id,
        text: s.title,
        done: Boolean(s.completed || s.status === 'done'),
        assigneeId: s.assigneeId,
        dueDate: s.dueDate
      }));

      const completedCount = task.subtasks.filter(s => s.completed || s.status === 'done').length;
      task.progress = task.subtasks.length > 0 ? Math.round((completedCount / task.subtasks.length) * 100) : task.progress;
    }

    task.updatedAt = new Date().toISOString();

    this.saveAllTasks(tasks);
    appScriptBridge.pushTask(task);

    return task;
  }

  updateTaskAssignee(taskId, newAssigneeId) {
    const tasks = this.getAllTasksRaw();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return null;

    const oldAssigneeId = task.assigneeId;
    if (oldAssigneeId === newAssigneeId) return task;

    const currentUser = auth.getCurrentUser();
    const newAssignee = this.getUserById(newAssigneeId);
    const oldAssignee = this.getUserById(oldAssigneeId);

    task.assigneeId = newAssigneeId;
    task.updatedAt = new Date().toISOString();

    if (!task.comments) task.comments = [];
    task.comments.push({
      id: `cm-${Date.now()}`,
      userId: currentUser.id,
      content: `[Điều chuyển] Đã phân công lại người thực hiện cho ${newAssignee ? newAssignee.name : 'nhân sự mới'}.`,
      createdAt: new Date().toISOString()
    });

    this.saveAllTasks(tasks);
    appScriptBridge.pushTask(task);

    // Gửi thông báo cho người được assign mới
    if (newAssigneeId && newAssigneeId !== currentUser.id) {
      this.addNotification({
        recipientId: newAssigneeId,
        senderId: currentUser.id,
        type: 'task_assigned',
        title: '👤 Bạn được phân công làm người phụ trách',
        content: `${currentUser.name} đã phân công công việc "${task.title}" (${task.id}) cho bạn.`,
        taskId: task.id
      });
    }

    // Nếu người cũ khác người thao tác, thông báo chuyển giao
    if (oldAssigneeId && oldAssigneeId !== currentUser.id && oldAssigneeId !== newAssigneeId) {
      this.addNotification({
        recipientId: oldAssigneeId,
        senderId: currentUser.id,
        type: 'update',
        title: 'ℹ️ Công việc đã được chuyển giao',
        content: `Công việc "${task.title}" (${task.id}) đã được ${currentUser.name} chuyển giao cho ${newAssignee ? newAssignee.name : 'người khác'}.`,
        taskId: task.id
      });
    }

    return task;
  }

  updateTaskStatus(taskId, newStatus) {
    const tasks = this.getAllTasksRaw();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return null;

    task.status = newStatus;
    if (newStatus === 'done') {
      task.progress = 100;
      task.completedAt = new Date().toISOString();
    }
    task.updatedAt = new Date().toISOString();

    this.saveAllTasks(tasks);
    appScriptBridge.pushTask(task);

    const statusLabels = {
      'todo': 'Chưa bắt đầu',
      'in_progress': 'Đang thực hiện',
      'pending_approval': 'Chờ phê duyệt',
      'review': 'Chờ phê duyệt',
      'done': 'Đã hoàn thành',
      'completed': 'Đã hoàn thành',
      'paused': 'Tạm dừng',
      'overdue': 'Quá hạn'
    };
    const sLabel = statusLabels[newStatus] || newStatus;
    const currentUser = auth.getCurrentUser();

    // Thông báo cho Assignee
    if (task.assigneeId && task.assigneeId !== currentUser.id) {
      this.addNotification({
        recipientId: task.assigneeId,
        senderId: currentUser.id,
        type: 'status_change',
        title: '🔄 Cập nhật trạng thái công việc',
        content: `Công việc "${task.title}" (${task.id}) đã được ${currentUser.name} chuyển sang "${sLabel}".`,
        taskId: task.id
      });
    }

    // Thông báo cho Creator
    if (task.creatorId && task.creatorId !== currentUser.id && task.creatorId !== task.assigneeId) {
      this.addNotification({
        recipientId: task.creatorId,
        senderId: currentUser.id,
        type: 'status_change',
        title: '🔄 Tiến độ nhiệm vụ cập nhật',
        content: `${currentUser.name} đã cập nhật trạng thái việc "${task.title}" (${task.id}) thành "${sLabel}".`,
        taskId: task.id
      });
    }

    return task;
  }

  approveTask(taskId, note = '') {
    const tasks = this.getAllTasksRaw();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return false;

    const currentUser = auth.getCurrentUser();
    task.status = 'done';
    task.progress = 100;
    task.approvalStatus = 'APPROVED';
    task.approvedBy = currentUser.name;
    task.approvedAt = new Date().toISOString();
    task.updatedAt = new Date().toISOString();

    if (!task.comments) task.comments = [];
    task.comments.push({
      id: `cm-${Date.now()}`,
      userId: currentUser.id,
      content: `[ĐÃ PHÊ DUYỆT 1-CHẠM] Người duyệt: ${currentUser.name}${note ? ` - Ghi chú: "${note}"` : ''}.`,
      createdAt: new Date().toISOString()
    });

    this.saveAllTasks(tasks);
    appScriptBridge.pushTask(task);

    // Gửi thông báo cho Assignee và Creator
    const targets = new Set([task.assigneeId, task.creatorId].filter(Boolean));
    targets.forEach(userId => {
      if (userId !== currentUser.id) {
        this.addNotification({
          recipientId: userId,
          senderId: currentUser.id,
          type: 'approval_approved',
          title: '✅ Nhiệm vụ đã được phê duyệt 1-chạm',
          content: `${currentUser.name} đã ký duyệt hoàn thành nhiệm vụ "${task.title}" (${task.id}).`,
          taskId: task.id
        });
      }
    });

    return true;
  }

  rejectTask(taskId, reason = 'Chưa đạt tiêu chuẩn yêu cầu') {
    const tasks = this.getAllTasksRaw();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return false;

    const currentUser = auth.getCurrentUser();
    const finalReason = (reason && reason.trim()) ? reason.trim() : 'Ban Lãnh Đạo yêu cầu rà soát và hoàn thiện lại trước khi nghiệm thu.';
    task.status = 'todo';
    task.approvalStatus = 'REJECTED';
    task.rejectedBy = currentUser.name;
    task.rejectReason = finalReason;
    task.rejectedAt = new Date().toISOString();
    task.updatedAt = new Date().toISOString();

    if (!task.comments) task.comments = [];
    task.comments.push({
      id: `cm-${Date.now()}`,
      userId: currentUser.id,
      content: `[TỪ CHỐI / YÊU CẦU LÀM LẠI] Người duyệt: ${currentUser.name}. Lý do: "${finalReason}"`,
      createdAt: new Date().toISOString()
    });

    this.saveAllTasks(tasks);
    appScriptBridge.pushTask(task);

    // Gửi thông báo cho Assignee và Creator
    const targets = new Set([task.assigneeId, task.creatorId].filter(Boolean));
    targets.forEach(userId => {
      if (userId !== currentUser.id) {
        this.addNotification({
          recipientId: userId,
          senderId: currentUser.id,
          type: 'approval_rejected',
          title: '⚠️ Yêu cầu làm lại công việc',
          content: `${currentUser.name} yêu cầu hoàn thiện lại nhiệm vụ "${task.title}": ${finalReason}`,
          taskId: task.id
        });
      }
    });

    return true;
  }

  deleteTask(taskId) {
    this.markDeletedIds([taskId]);
    const tasks = this.getAllTasksRaw();
    const filtered = tasks.filter(t => t.id !== taskId);
    this.saveAllTasks(filtered);
    appScriptBridge.deleteTask(taskId);
    return true;
  }

  toggleSubtask(taskId, subtaskId) {
    const tasks = this.getAllTasksRaw();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    if (!Array.isArray(task.subtasks)) task.subtasks = [];

    const sub = task.subtasks.find(s => s.id === subtaskId);
    if (sub) {
      sub.completed = !sub.completed;
      sub.status = sub.completed ? 'done' : 'in_progress';
      const completedCount = task.subtasks.filter(s => s.completed || s.status === 'done').length;
      task.progress = Math.round((completedCount / task.subtasks.length) * 100);
      if (task.progress === 100 && task.status !== 'done') {
        task.status = 'review';
      }
      task.checklist = task.subtasks.map(s => ({
        id: s.id,
        text: s.title,
        done: Boolean(s.completed || s.status === 'done'),
        assigneeId: s.assigneeId,
        dueDate: s.dueDate
      }));
      task.updatedAt = new Date().toISOString();
      this.saveAllTasks(tasks);
      appScriptBridge.pushTask(task);

      // Thông báo cập nhật tiến độ
      const currentUser = auth.getCurrentUser();
      if (task.assigneeId && task.assigneeId !== currentUser.id) {
        this.addNotification({
          recipientId: task.assigneeId,
          senderId: currentUser.id,
          type: 'update',
          title: '☑️ Cập nhật tiến độ việc con',
          content: `${currentUser.name} đã cập nhật checklist công việc "${task.title}" (Tiến độ: ${task.progress}%).`,
          taskId: task.id
        });
      }
    }
  }

  addSubtask(taskId, { title, description = '', assigneeId = null, dueDate = null, status = 'todo' }) {
    const tasks = this.getAllTasksRaw();
    const task = tasks.find(t => t.id === taskId);
    if (!task || !title || !title.trim()) return null;

    if (!Array.isArray(task.subtasks)) task.subtasks = [];
    const subtaskNumber = task.subtasks.length + 1;
    const isCompleted = status === 'done';
    const subUniqueId = `${task.id}.${subtaskNumber}-${Date.now().toString().slice(-3)}`;
    const newSubtask = {
      id: subUniqueId,
      title: title.trim(),
      description: (description || '').trim(),
      assigneeId: assigneeId || task.assigneeId || '',
      dueDate: dueDate || task.dueDate || new Date().toISOString().split('T')[0],
      status: status || 'todo',
      completed: isCompleted,
      createdAt: new Date().toISOString()
    };
    task.subtasks.push(newSubtask);

    // Đồng bộ sang checklist cho tương thích ngược
    task.checklist = task.subtasks.map(s => ({
      id: s.id,
      text: s.title,
      done: Boolean(s.completed || s.status === 'done'),
      assigneeId: s.assigneeId,
      dueDate: s.dueDate
    }));

    const completedCount = task.subtasks.filter(s => s.completed || s.status === 'done').length;
    task.progress = Math.round((completedCount / task.subtasks.length) * 100);
    task.updatedAt = new Date().toISOString();

    this.saveAllTasks(tasks);
    appScriptBridge.pushTask(task);

    // Gửi thông báo cho người được assign việc con nếu khác currentUser
    const currentUser = auth.getCurrentUser();
    if (newSubtask.assigneeId && newSubtask.assigneeId !== currentUser.id) {
      this.addNotification({
        recipientId: newSubtask.assigneeId,
        senderId: currentUser.id,
        type: 'task_assigned',
        title: '📋 Bạn được giao việc con mới',
        content: `${currentUser.name} đã phân công việc con "${newSubtask.title}" trong nhiệm vụ "${task.title}" cho bạn.`,
        taskId: task.id
      });
    }

    return newSubtask;
  }

  updateSubtask(taskId, subtaskId, updates) {
    const tasks = this.getAllTasksRaw();
    const task = tasks.find(t => t.id === taskId);
    if (!task || !Array.isArray(task.subtasks)) return null;

    const sub = task.subtasks.find(s => s.id === subtaskId);
    if (!sub) return null;

    if (updates.title !== undefined) sub.title = updates.title.trim();
    if (updates.description !== undefined) sub.description = (updates.description || '').trim();
    if (updates.assigneeId !== undefined) sub.assigneeId = updates.assigneeId;
    if (updates.dueDate !== undefined) sub.dueDate = updates.dueDate;
    if (updates.status !== undefined) {
      sub.status = updates.status;
      sub.completed = updates.status === 'done';
    }
    if (updates.completed !== undefined) {
      sub.completed = Boolean(updates.completed);
      sub.status = sub.completed ? 'done' : 'in_progress';
    }

    task.checklist = task.subtasks.map(s => ({
      id: s.id,
      text: s.title,
      done: Boolean(s.completed || s.status === 'done'),
      assigneeId: s.assigneeId,
      dueDate: s.dueDate
    }));

    const completedCount = task.subtasks.filter(s => s.completed || s.status === 'done').length;
    task.progress = task.subtasks.length > 0 ? Math.round((completedCount / task.subtasks.length) * 100) : 0;
    task.updatedAt = new Date().toISOString();

    this.saveAllTasks(tasks);
    appScriptBridge.pushTask(task);
    return sub;
  }

  deleteSubtask(taskId, subtaskId) {
    const tasks = this.getAllTasksRaw();
    const task = tasks.find(t => t.id === taskId);
    if (!task || !Array.isArray(task.subtasks)) return false;

    task.subtasks = task.subtasks.filter(s => s.id !== subtaskId);
    task.checklist = task.subtasks.map(s => ({
      id: s.id,
      text: s.title,
      done: Boolean(s.completed || s.status === 'done'),
      assigneeId: s.assigneeId,
      dueDate: s.dueDate
    }));

    const completedCount = task.subtasks.filter(s => s.completed || s.status === 'done').length;
    task.progress = task.subtasks.length > 0 ? Math.round((completedCount / task.subtasks.length) * 100) : 0;
    task.updatedAt = new Date().toISOString();

    this.saveAllTasks(tasks);
    appScriptBridge.pushTask(task);
    return true;
  }

  updateSubtaskAssignee(taskId, subtaskId, newAssigneeId) {
    return this.updateSubtask(taskId, subtaskId, { assigneeId: newAssigneeId });
  }

  addComment(taskId, content) {
    const tasks = this.getAllTasksRaw();
    const task = tasks.find(t => t.id === taskId);
    if (!task || !content.trim()) return;

    const currentUser = auth.getCurrentUser();
    if (!task.comments) task.comments = [];
    task.comments.push({
      id: `cm-${Date.now()}`,
      userId: currentUser.id,
      content: content.trim(),
      createdAt: new Date().toISOString()
    });

    this.saveAllTasks(tasks);
    appScriptBridge.pushTask(task);

    // Thông báo cho Assignee
    if (task.assigneeId && task.assigneeId !== currentUser.id) {
      this.addNotification({
        recipientId: task.assigneeId,
        senderId: currentUser.id,
        type: 'comment',
        title: '💬 Ý kiến chỉ đạo / Trao đổi mới',
        content: `${currentUser.name} đã nhắn trong việc "${task.title}": "${content.slice(0, 60)}..."`,
        taskId: task.id
      });
    }
    // Thông báo cho Creator
    if (task.creatorId && task.creatorId !== currentUser.id && task.creatorId !== task.assigneeId) {
      this.addNotification({
        recipientId: task.creatorId,
        senderId: currentUser.id,
        type: 'comment',
        title: '💬 Trao đổi trong công việc bạn giao',
        content: `${currentUser.name} đã nhắn trong việc "${task.title}": "${content.slice(0, 60)}..."`,
        taskId: task.id
      });
    }
  }

  // --- HỆ THỐNG THÔNG BÁO (NOTIFICATIONS SYSTEM) ---
  getAllNotifications() {
    try {
      const saved = localStorage.getItem(NOTIF_STORAGE_KEY);
      if (saved) return JSON.parse(saved) || [];
    } catch (_) {}
    return [];
  }

  saveAllNotifications(notifs) {
    localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(notifs));
    window.dispatchEvent(new CustomEvent('tvm:notifications_changed', { detail: { count: notifs.length } }));
    window.dispatchEvent(new CustomEvent('tvm:data_changed'));
  }

  getUserNotifications(userId) {
    if (!userId) return [];
    return this.getAllNotifications().filter(n => n.recipientId === userId || n.recipientId === 'all')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getUnreadNotificationCount(userId) {
    if (!userId) return 0;
    return this.getUserNotifications(userId).filter(n => !n.isRead).length;
  }

  addNotification(notifData) {
    if (!notifData.recipientId) return;
    const notifs = this.getAllNotifications();
    const newNotif = {
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      recipientId: notifData.recipientId,
      senderId: notifData.senderId || (auth.getCurrentUser()?.id || 'system'),
      type: notifData.type || 'info', // 'task_assigned' | 'status_change' | 'comment' | 'approval' | 'update'
      title: notifData.title || 'Thông báo mới',
      content: notifData.content || '',
      taskId: notifData.taskId || null,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    notifs.unshift(newNotif);
    // Giữ tối đa 100 thông báo gần nhất
    if (notifs.length > 100) notifs.length = 100;
    this.saveAllNotifications(notifs);
    appScriptBridge.pushNotification(newNotif);
    return newNotif;
  }

  markNotificationAsRead(notifId) {
    const notifs = this.getAllNotifications();
    const notif = notifs.find(n => n.id === notifId);
    if (notif) {
      notif.isRead = true;
      this.saveAllNotifications(notifs);
      appScriptBridge.markNotificationRead(notifId);
    }
  }

  markAllNotificationsAsRead(userId) {
    const notifs = this.getAllNotifications();
    let updated = false;
    notifs.forEach(n => {
      if ((n.recipientId === userId || n.recipientId === 'all') && !n.isRead) {
        n.isRead = true;
        updated = true;
      }
    });
    if (updated) {
      this.saveAllNotifications(notifs);
      appScriptBridge.markAllNotificationsRead(userId);
    }
  }

  clearUserNotifications(userId) {
    const notifs = this.getAllNotifications();
    const remaining = notifs.filter(n => n.recipientId !== userId && n.recipientId !== 'all');
    this.saveAllNotifications(remaining);
    appScriptBridge.clearUserNotifications(userId);
  }

  // XÓA DỮ LIỆU MẪU - BẮT ĐẦU DỮ LIỆU THẬT: dọn công việc, kế hoạch, thông báo (giữ nguyên nhân sự & phòng ban)
  async clearOperationalData() {
    const existingTaskIds = this.getAllTasksRaw().map(t => t.id);
    const existingPlanIds = this.getAllPlansRaw().map(p => p.id);
    const existingNotifIds = this.getAllNotifications().map(n => n.id);
    this.markDeletedIds([...DEMO_SEED_IDS, ...existingTaskIds, ...existingPlanIds, ...existingNotifIds]);

    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify([]));
    localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify([]));
    localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify([]));
    window.dispatchEvent(new CustomEvent('tvm:data_changed'));
    window.dispatchEvent(new CustomEvent('tvm:plans_changed'));
    window.dispatchEvent(new CustomEvent('tvm:notifications_changed', { detail: { count: 0 } }));
    if (appScriptBridge.isConnected()) {
      return appScriptBridge.pushAllToCloud([], this.getAllUsers(), [], this.getAllDepartments(), []);
    }
    return true;
  }

  getDepartmentMetrics() {
    const deptTasks = this.getDepartmentTasks();
    const total = deptTasks.length;
    const inProgress = deptTasks.filter(t => t.status === 'in_progress').length;
    const done = deptTasks.filter(t => t.status === 'done').length;
    const pendingApproval = deptTasks.filter(t => t.status === 'review').length;
    
    const todayStr = new Date().toISOString().split('T')[0];
    const overdue = deptTasks.filter(t => t.dueDate < todayStr && t.status !== 'done').length;

    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

    return {
      total,
      inProgress,
      done,
      pendingApproval,
      overdue,
      completionRate
    };
  }

  // =========================================================================
  // MODULE QUẢN LÝ DỰ ÁN & KẾ HOẠCH (PLANS - SHIN AIOS v2.7)
  // Ai cũng có thể tạo kế hoạch; Lưu người tạo và thời gian tạo tự động
  // =========================================================================

  getAllPlansRaw() {
    try {
      const data = localStorage.getItem(PLANS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (_) {
      return [];
    }
  }

  saveAllPlans(plans) {
    // So sánh với bản đang lưu để chỉ đẩy các kế hoạch thay đổi / xóa lên Google Sheet
    let previous = [];
    try { previous = JSON.parse(localStorage.getItem(PLANS_STORAGE_KEY)) || []; } catch (_) { previous = []; }
    const prevMap = new Map(previous.map(p => [p.id, JSON.stringify(p)]));
    const nextIds = new Set();
    plans.forEach(p => {
      nextIds.add(p.id);
      if (prevMap.get(p.id) !== JSON.stringify(p)) appScriptBridge.pushPlan(p);
    });
    previous.forEach(p => {
      if (!nextIds.has(p.id)) appScriptBridge.deletePlan(p.id);
    });

    localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(plans));
    window.dispatchEvent(new CustomEvent('tvm:plans_changed'));
    window.dispatchEvent(new CustomEvent('tvm:data_changed'));
  }

  getDepartmentPlans(departmentId = null) {
    const all = this.getAllPlansRaw();
    const activeDept = auth.getActiveDepartment() || { id: 'all' };
    const deptId = departmentId || activeDept.id;

    if (deptId === 'all' || auth.isAdmin() || auth.isLeadership()) {
      if (deptId === 'all') return all;
      return all.filter(p => p.departmentId === deptId);
    }
    return all.filter(p => p.departmentId === deptId);
  }

  getPlanById(id) {
    const all = this.getAllPlansRaw();
    return all.find(p => p.id === id) || null;
  }

  createPlan(planData) {
    return this.addPlan(planData);
  }

  addPlan(planData) {
    const all = this.getAllPlansRaw();
    const currentUser = auth.getCurrentUser() || { id: 'user_admin', name: 'Quản trị viên' };
    const activeDept = auth.getActiveDepartment() || { id: 'dept_ptkh', code: 'PTKH-CS3' };
    const targetDeptId = (planData.departmentId && planData.departmentId !== 'all') ? planData.departmentId : (activeDept.id === 'all' ? 'dept_ptkh' : activeDept.id);
    const dept = this.getDepartmentById(targetDeptId) || activeDept;
    const deptCode = dept?.code ? dept.code.split('-')[0] : 'PLN';

    const maxNum = all.reduce((m, p) => {
      const n = parseInt(String(p.code || '').replace(/\D/g, ''), 10);
      return Number.isFinite(n) && n > m ? n : m;
    }, 0);
    const num = Math.max(maxNum, all.length) + 1;
    const planId = `PLAN-${deptCode}-${String(num).padStart(2, '0')}`;
    const code = `PLN-${String(num).padStart(2, '0')}`;

    const newPlan = {
      id: planId,
      code,
      title: (planData.title || 'Kế hoạch mới').trim(),
      departmentId: targetDeptId,
      creatorId: currentUser.id,
      leadId: planData.leadId || currentUser.id,
      status: planData.status || 'planning',
      priority: planData.priority || 'P2',
      startDate: planData.startDate || new Date().toISOString().slice(0, 10),
      dueDate: planData.dueDate || new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10),
      target: (planData.target || '').trim(),
      notes: (planData.notes || '').trim(),
      links: Array.isArray(planData.links) ? planData.links : [],
      milestones: Array.isArray(planData.milestones) ? planData.milestones : [],
      tasksList: Array.isArray(planData.tasksList) ? planData.tasksList : [],
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    all.unshift(newPlan);
    this.saveAllPlans(all);
    return newPlan;
  }

  updatePlan(id, updates) {
    const all = this.getAllPlansRaw();
    const idx = all.findIndex(p => p.id === id);
    if (idx === -1) return null;

    all[idx] = {
      ...all[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.saveAllPlans(all);
    return all[idx];
  }

  deletePlan(id) {
    this.markDeletedIds([id]);
    let all = this.getAllPlansRaw();
    all = all.filter(p => p.id !== id);
    this.saveAllPlans(all);
    return true;
  }

  addPlanComment(planId, text) {
    if (!text || !text.trim()) return null;
    const plan = this.getPlanById(planId);
    if (!plan) return null;

    const user = auth.getCurrentUser() || { id: 'user_admin', name: 'Thành viên' };
    const newComment = {
      id: `cmt_${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
      text: text.trim(),
      createdAt: new Date().toISOString()
    };

    const comments = Array.isArray(plan.comments) ? [...plan.comments, newComment] : [newComment];
    return this.updatePlan(planId, { comments });
  }

  togglePlanMilestone(planId, milestoneId) {
    const plan = this.getPlanById(planId);
    if (!plan || !Array.isArray(plan.milestones)) return null;

    const milestones = plan.milestones.map(m => {
      if (m.id === milestoneId) {
        return { ...m, completed: !m.completed };
      }
      return m;
    });

    return this.updatePlan(planId, { milestones });
  }

  addPlanMilestone(planId, milestoneData) {
    const plan = this.getPlanById(planId);
    if (!plan) return null;

    const milestones = Array.isArray(plan.milestones) ? [...plan.milestones] : [];
    milestones.push({
      id: `ms_${Date.now()}`,
      title: (milestoneData.title || '').trim(),
      dueDate: milestoneData.dueDate || '',
      completed: false
    });

    return this.updatePlan(planId, { milestones });
  }

  deletePlanMilestone(planId, milestoneId) {
    const plan = this.getPlanById(planId);
    if (!plan || !Array.isArray(plan.milestones)) return null;

    const milestones = plan.milestones.filter(m => m.id !== milestoneId);
    return this.updatePlan(planId, { milestones });
  }

  addPlanTaskItem(planId, taskItem) {
    const plan = this.getPlanById(planId);
    if (!plan) return null;

    const tasksList = Array.isArray(plan.tasksList) ? [...plan.tasksList] : [];
    tasksList.push({
      title: (taskItem.title || '').trim(),
      assigneeId: taskItem.assigneeId || plan.leadId,
      dueDate: taskItem.dueDate || plan.dueDate,
      priority: taskItem.priority || 'P2',
      converted: false,
      taskId: null
    });

    return this.updatePlan(planId, { tasksList });
  }

  convertPlanTaskToWorkspaceTask(planId, taskIndex) {
    const plan = this.getPlanById(planId);
    if (!plan || !Array.isArray(plan.tasksList) || !plan.tasksList[taskIndex]) return null;

    const item = plan.tasksList[taskIndex];
    if (item.converted && item.taskId) return item.taskId;

    const creator = this.getUserById(plan.creatorId);

    // Tạo Task thật trong Workspace thông qua this.createTask
    const newTask = this.createTask({
      title: `[${plan.code}] ${item.title}`,
      description: `Đầu việc bóc tách từ Kế hoạch: "${plan.title}"\n- Mục tiêu: ${plan.target || 'N/A'}\n- Người lập kế hoạch: ${creator?.name || 'N/A'}`,
      departmentId: plan.departmentId,
      assigneeId: item.assigneeId || plan.leadId,
      dueDate: item.dueDate || plan.dueDate,
      priority: item.priority || 'P2',
      category: 'Kế Hoạch & Dự Án',
      status: 'in_progress',
      subtasks: []
    });

    const updatedTasksList = [...plan.tasksList];
    updatedTasksList[taskIndex] = {
      ...item,
      converted: true,
      taskId: newTask.id
    };

    this.updatePlan(planId, { tasksList: updatedTasksList });
    return newTask.id;
  }

  addPlanLink(planId, linkItem) {
    const plan = this.getPlanById(planId);
    if (!plan) return null;

    const links = Array.isArray(plan.links) ? [...plan.links] : [];
    links.push({
      title: (linkItem.title || 'Tài liệu liên kết').trim(),
      url: (linkItem.url || '').trim()
    });

    return this.updatePlan(planId, { links });
  }

  deletePlanLink(planId, linkIndex) {
    const plan = this.getPlanById(planId);
    if (!plan || !Array.isArray(plan.links)) return null;

    const links = plan.links.filter((_, idx) => idx !== linkIndex);
    return this.updatePlan(planId, { links });
  }

  deletePlanTaskItem(planId, taskIndex) {
    const plan = this.getPlanById(planId);
    if (!plan || !Array.isArray(plan.tasksList)) return null;

    const tasksList = plan.tasksList.filter((_, idx) => idx !== taskIndex);
    return this.updatePlan(planId, { tasksList });
  }

  deletePlanComment(planId, commentId) {
    const plan = this.getPlanById(planId);
    if (!plan || !Array.isArray(plan.comments)) return null;

    const comments = plan.comments.filter(c => c.id !== commentId);
    return this.updatePlan(planId, { comments });
  }

  // --- EXECUTIVE APPROVAL HUB METHODS (SHIN AIOS v2.7) ---
  approvePlan(planId, note = '') {
    const plan = this.getPlanById(planId);
    if (!plan) return false;

    const currentUser = auth.getCurrentUser() || { id: 'admin', name: 'Ban Lãnh Đạo' };
    const updates = {
      status: 'in_progress',
      approvalStatus: 'APPROVED',
      approvedBy: currentUser.name,
      approvedAt: new Date().toISOString()
    };

    if (!Array.isArray(plan.comments)) plan.comments = [];
    const newComments = [
      ...plan.comments,
      {
        id: `cm-${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        text: `[ĐÃ DUYỆT CHỦ TRƯƠNG 1-CHẠM] Người duyệt: ${currentUser.name}${note ? ` - Ghi chú: "${note}"` : ''}.`,
        createdAt: new Date().toISOString()
      }
    ];
    updates.comments = newComments;

    this.updatePlan(planId, updates);
    const updatedPlan = this.getPlanById(planId);
    if (updatedPlan) appScriptBridge.pushPlan(updatedPlan);

    // Gửi thông báo cho Creator và Lead của Plan
    const targets = new Set([plan.creatorId, plan.leadId].filter(Boolean));
    targets.forEach(userId => {
      if (userId !== currentUser.id) {
        this.addNotification({
          recipientId: userId,
          senderId: currentUser.id,
          type: 'approval_approved',
          title: '✅ Kế hoạch đã được Ban Lãnh Đạo phê duyệt',
          content: `${currentUser.name} đã thông qua chủ trương kế hoạch "${plan.title || plan.name || plan.id}" (${plan.id}).`,
          taskId: plan.id
        });
      }
    });

    window.dispatchEvent(new CustomEvent('tvm:plans_changed'));
    return true;
  }

  rejectPlan(planId, reason = '') {
    const plan = this.getPlanById(planId);
    if (!plan) return false;

    const currentUser = auth.getCurrentUser() || { id: 'admin', name: 'Ban Lãnh Đạo' };
    const finalReason = (reason && reason.trim()) ? reason.trim() : 'Ban Lãnh Đạo yêu cầu rà soát và bổ sung chi tiết lộ trình thực hiện.';
    const updates = {
      status: 'planning',
      approvalStatus: 'REJECTED',
      rejectedBy: currentUser.name,
      rejectReason: finalReason,
      rejectedAt: new Date().toISOString()
    };

    if (!Array.isArray(plan.comments)) plan.comments = [];
    const newComments = [
      ...plan.comments,
      {
        id: `cm-${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        text: `[YÊU CẦU LÀM LẠI KẾ HOẠCH] Người duyệt: ${currentUser.name}. Lý do: "${finalReason}"`,
        createdAt: new Date().toISOString()
      }
    ];
    updates.comments = newComments;

    this.updatePlan(planId, updates);
    const updatedPlan = this.getPlanById(planId);
    if (updatedPlan) appScriptBridge.pushPlan(updatedPlan);

    const targets = new Set([plan.creatorId, plan.leadId].filter(Boolean));
    targets.forEach(userId => {
      if (userId !== currentUser.id) {
        this.addNotification({
          recipientId: userId,
          senderId: currentUser.id,
          type: 'approval_rejected',
          title: '⚠️ Kế hoạch cần chỉnh sửa bổ sung',
          content: `${currentUser.name} yêu cầu hoàn thiện lại kế hoạch "${plan.title || plan.name || plan.id}" (${plan.id}): ${finalReason}`,
          taskId: plan.id
        });
      }
    });

    window.dispatchEvent(new CustomEvent('tvm:plans_changed'));
    return true;
  }

  getPendingApprovalsForUser(user = null) {
    const currentUser = user || auth.getCurrentUser();
    if (!currentUser) return { tasks: [], plans: [], isApprover: false, totalCount: 0 };

    const isAdmin = auth.isAdmin();
    const isLeadership = auth.isLeadership();
    const isManager = auth.isManager();
    const isApprover = isAdmin || isLeadership || isManager;

    const allTasks = this.getAllTasksRaw();
    const allPlans = this.getAllPlansRaw();

    let pendingTasks = [];
    let pendingPlans = [];

    if (isAdmin || isLeadership) {
      pendingTasks = allTasks.filter(t => t.status === 'pending_approval' || t.status === 'review');
      pendingPlans = allPlans.filter(p => p.status === 'pending_approval');
    } else if (isManager) {
      pendingTasks = allTasks.filter(t => 
        (t.status === 'pending_approval' || t.status === 'review') &&
        (t.departmentId === currentUser.departmentId || t.approverId === currentUser.id)
      );
      pendingPlans = allPlans.filter(p => 
        p.status === 'pending_approval' && 
        (p.departmentId === currentUser.departmentId || p.departmentId === 'all')
      );
    } else {
      pendingTasks = allTasks.filter(t => 
        (t.status === 'pending_approval' || t.status === 'review') &&
        (t.creatorId === currentUser.id || t.assigneeId === currentUser.id)
      );
      pendingPlans = allPlans.filter(p => 
        p.status === 'pending_approval' &&
        (p.creatorId === currentUser.id || p.leadId === currentUser.id)
      );
    }

    return {
      tasks: pendingTasks,
      plans: pendingPlans,
      isApprover,
      totalCount: pendingTasks.length + pendingPlans.length
    };
  }

  getApprovedHistoryForUser(user = null) {
    const currentUser = user || auth.getCurrentUser();
    if (!currentUser) return { tasks: [], plans: [] };

    const isAdmin = auth.isAdmin();
    const isLeadership = auth.isLeadership();
    const isManager = auth.isManager();

    const allTasks = this.getAllTasksRaw();
    const allPlans = this.getAllPlansRaw();

    let approvedTasks = allTasks.filter(t => t.approvalStatus === 'APPROVED' || t.approvedBy || t.approvalStatus === 'REJECTED');
    let approvedPlans = allPlans.filter(p => p.approvalStatus === 'APPROVED' || p.approvedBy || p.approvalStatus === 'REJECTED');

    if (!isAdmin && !isLeadership && isManager) {
      approvedTasks = approvedTasks.filter(t => t.departmentId === currentUser.departmentId || t.approverId === currentUser.id);
      approvedPlans = approvedPlans.filter(p => p.departmentId === currentUser.departmentId);
    } else if (!isAdmin && !isLeadership && !isManager) {
      approvedTasks = approvedTasks.filter(t => t.creatorId === currentUser.id || t.assigneeId === currentUser.id);
      approvedPlans = approvedPlans.filter(p => p.creatorId === currentUser.id || p.leadId === currentUser.id);
    }

    return {
      tasks: approvedTasks,
      plans: approvedPlans
    };
  }
}

export const store = new Store();



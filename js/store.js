/**
 * THANH VU MEDIC CS3 - CENTRALIZED REACTIVE STORE (APPS SCRIPT INTEGRATED)
 * H? tr? CRUD Nhân viên, H? so cá nhân và Ð?ng b? Google Sheets / SHIN AIOS
 */

import { INITIAL_TASKS, DEPARTMENTS, USERS } from './models.js';
import { auth } from './auth.js';
import { appScriptBridge } from './services/appScriptBridge.js';

const TASKS_STORAGE_KEY = 'tvm_tasks_v3';
const USERS_STORAGE_KEY = 'tvm_users_v4';
const DEPTS_STORAGE_KEY = 'tvm_departments_v4';
const NOTIF_STORAGE_KEY = 'tvm_notifications_v2';

export class Store {
  constructor() {
    this.init();
    this.syncFromCloudIfAvailable();
  }

  init() {
    if (!localStorage.getItem(TASKS_STORAGE_KEY)) {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(INITIAL_TASKS));
    }
    if (!localStorage.getItem(USERS_STORAGE_KEY)) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(USERS));
    }
    if (!localStorage.getItem(DEPTS_STORAGE_KEY)) {
      localStorage.setItem(DEPTS_STORAGE_KEY, JSON.stringify(DEPARTMENTS));
    }
    if (!localStorage.getItem(NOTIF_STORAGE_KEY)) {
      const initialNotifs = [
        {
          id: 'notif_init_1',
          recipientId: 'user_tam_ptkh',
          senderId: 'user_lanhdao',
          type: 'task_assigned',
          title: '?? Phân công công vi?c m?i',
          content: 'ThS.BS Nguy?n Thanh Vu dã giao vi?c "T? ch?c khám s?c kh?e d?nh k? VIP Doanh nghi?p Cà Mau" cho b?n.',
          taskId: 'PTKH-01',
          isRead: false,
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
        },
        {
          id: 'notif_init_2',
          recipientId: 'user_mai_ptkh',
          senderId: 'user_tam_ptkh',
          type: 'task_assigned',
          title: '?? Phân công công vi?c m?i',
          content: 'Hu?nh Tru?ng Thanh Tâm dã phân công vi?c "G?i di?n cham sóc & kh?o sát ý ki?n 50 b?nh nhân n?i trú" cho b?n.',
          taskId: 'PTKH-02',
          isRead: false,
          createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
        },
        {
          id: 'notif_init_3',
          recipientId: 'user_admin',
          senderId: 'user_tam_ptkh',
          type: 'status_change',
          title: '?? C?p nh?t ti?n d? nhi?m v?',
          content: 'Phòng PTKH v?a c?p nh?t ti?n d? công vi?c "Ð? xu?t chi?n d?ch Marketing truy?n thông quý 4".',
          taskId: 'PTKH-03',
          isRead: false,
          createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
        }
      ];
      localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(initialNotifs));
    }
  }

  // T?i d? li?u t? Google Sheet v?
  async syncFromCloudIfAvailable() {
    if (!appScriptBridge.isConnected()) {
      return { success: false, message: 'Chua c?u hình URL Google Apps Script Endpoint' };
    }

    const cloudData = await appScriptBridge.fetchCloudData();
    if (cloudData && cloudData.success) {
      let taskCount = 0;
      let userCount = 0;

      if (cloudData.tasks && cloudData.tasks.length > 0) {
        // H?P NH?T D? LI?U CÔNG VI?C & VI?C CON 2 CHI?U (ZERO DATA LOSS)
        const localTasks = this.getAllTasksRaw();
        const taskMap = new Map();
        localTasks.forEach(lt => { if (lt && lt.id) taskMap.set(lt.id, lt); });

        cloudData.tasks.forEach(ct => {
          if (!ct || !ct.id) return;
          const local = taskMap.get(ct.id) || {};

          // Chu?n hóa subtasks t? cloud (h? tr? c? tru?ng subtasks và checklist)
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

          // H?p nh?t vi?c con: Uu tiên gi? l?i toàn b? vi?c con c?c b? dã t?o mà cloud chua k?p nh?n
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

          // H?p nh?t bình lu?n & trao d?i
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
        // Chu?n hóa và h?p nh?t ngu?i dùng an toàn (Zero Data Loss & Type Safety)
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
          // H?p nh?t teams c?a phòng ban gi?a Local và Cloud, b?o toàn 100% d? li?u dã t?o
          const teamMap = new Map();
          ldTeams.forEach(t => { if (t && t.id) teamMap.set(t.id, t); });
          cdTeams.forEach(t => { if (t && t.id) teamMap.set(t.id, { ...(teamMap.get(t.id) || {}), ...t }); });

          return {
            ...(ld || {}),
            ...cd,
            teams: Array.from(teamMap.values())
          };
        });

        // Gi? l?i các phòng ban t?o ? local chua k?p d?y lên Cloud
        localDepts.forEach(ld => {
          if (!mergedDepts.some(md => md.id === ld.id)) {
            mergedDepts.push(ld);
          }
        });

        localStorage.setItem(DEPTS_STORAGE_KEY, JSON.stringify(mergedDepts));
      }

      if (cloudData.notifications && cloudData.notifications.length > 0) {
        localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(cloudData.notifications));
        window.dispatchEvent(new CustomEvent('tvm:notifications_changed', { detail: { count: cloudData.notifications.length } }));
      }

      window.dispatchEvent(new CustomEvent('tvm:data_changed'));
      window.dispatchEvent(new CustomEvent('tvm:users_changed'));

      return {
        success: true,
        taskCount,
        userCount,
        message: `Ð?ng b? thành công! Ðã n?p ${taskCount} công vi?c và ${userCount} nhân s? t? Google Sheet.`
      };
    } else {
      return {
        success: false,
        message: cloudData ? (cloudData.message || cloudData.error) : 'L?i k?t n?i t?i Apps Script'
      };
    }
  }

  // Ð?y toàn b? d? li?u m?u / hi?n t?i t? Web App lên Google Sheet
  async pushAllToCloud() {
    if (!appScriptBridge.isConnected()) {
      return { success: false, message: 'Chua c?u hình URL Google Apps Script Endpoint' };
    }

    const tasks = this.getAllTasksRaw();
    const users = this.getAllUsers();
    const notifs = this.getAllNotifications();
    const depts = this.getAllDepartments();
    const success = await appScriptBridge.pushAllToCloud(tasks, users, notifs, depts);
    return {
      success,
      taskCount: tasks.length,
      userCount: users.length,
      deptCount: depts.length,
      message: success 
        ? `Ðã d?y ${tasks.length} công vi?c, ${users.length} nhân s? và ${depts.length} phòng ban lên Google Sheet thành công!` 
        : 'G?i d? li?u lên Google Sheet th?t b?i'
    };
  }

  // Kh?i t?o b?ng d? li?u m?u trên Google Sheet
  async seedCloudData() {
    if (!appScriptBridge.isConnected()) {
      return { success: false, message: 'Chua c?u hình URL Google Apps Script' };
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
      return { success: true, message: 'Ðã kh?i t?o b?ng d? li?u m?u trên Google Sheet!' };
    }
    return { success: false, message: 'Không th? kh?i t?o trên Google Sheet' };
  }

  // --- QU?N LÝ NHÂN S? (CRUD USERS) ---
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

  // --- QU?N LÝ PHÒNG BAN & B? PH?N CON (CRUD DEPARTMENTS & TEAMS) ---
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
    // T? d?ng d?ng b? lên Google Sheets (n?u có k?t n?i)
    if (appScriptBridge.isConnected()) {
      appScriptBridge.pushDepartments(depts);
    }
  }

  getDepartmentById(deptId) {
    return this.getAllDepartments().find(d => d.id === deptId) || null;
  }

  createDepartment(deptData) {
    if (!auth.canCRUDDepartments()) {
      return { success: false, message: 'Ch? Qu?n Tr? Viên (Admin) m?i có quy?n t?o phòng ban!' };
    }
    const depts = this.getAllDepartments();
    const newDept = {
      id: `dept_${Date.now().toString().slice(-6)}`,
      name: deptData.name.trim(),
      code: (deptData.code || 'PB').trim().toUpperCase(),
      unit: deptData.unit || 'Co S? 3 (Cà Mau)',
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
      return { success: false, message: 'Ch? Qu?n Tr? Viên (Admin) m?i có quy?n s?a phòng ban!' };
    }
    const depts = this.getAllDepartments();
    const idx = depts.findIndex(d => d.id === deptId);
    if (idx < 0) return { success: false, message: 'Không tìm th?y phòng ban!' };

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
      return { success: false, message: 'Ch? Qu?n Tr? Viên (Admin) m?i có quy?n xóa phòng ban!' };
    }
    const depts = this.getAllDepartments();
    const filtered = depts.filter(d => d.id !== deptId);
    this.saveAllDepartments(filtered);
    return { success: true };
  }

  addTeamToDepartment(deptId, teamData) {
    if (!auth.canCRUDDepartments()) {
      return { success: false, message: 'Ch? Qu?n Tr? Viên (Admin) m?i có quy?n thêm b? ph?n con!' };
    }
    const depts = this.getAllDepartments();
    const dept = depts.find(d => d.id === deptId);
    if (!dept) return { success: false, message: 'Không tìm th?y phòng ban!' };

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
      return { success: false, message: 'Ch? Qu?n Tr? Viên (Admin) m?i có quy?n s?a b? ph?n con!' };
    }
    if (!teamData || typeof teamData !== 'object') {
      return { success: false, message: 'D? li?u b? ph?n con không h?p l?!' };
    }
    const depts = this.getAllDepartments();
    const dept = depts.find(d => d.id === deptId);
    if (!dept || !dept.teams) return { success: false, message: 'Không tìm th?y phòng ban ho?c b? ph?n con!' };

    const teamIdx = dept.teams.findIndex(t => t.id === teamId);
    if (teamIdx < 0) return { success: false, message: 'Không tìm th?y b? ph?n con!' };

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
      return { success: false, message: 'Ch? Qu?n Tr? Viên (Admin) m?i có quy?n xóa b? ph?n con!' };
    }
    const depts = this.getAllDepartments();
    const dept = depts.find(d => d.id === deptId);
    if (!dept || !dept.teams) return { success: false, message: 'Không tìm th?y phòng ban ho?c b? ph?n con!' };

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
      departmentId: targetDeptId,
      teamId: userData.teamId || '',
      title: userData.title.trim() || 'Chuyên viên',
      unit: userData.unit || (this.getDepartmentById(targetDeptId)?.name || 'Thanh Vu Medic'),
      avatar: userData.avatar?.trim() || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
      badge: userData.badge || (targetRole === 'MANAGER' ? 'Tru?ng phòng' : (targetRole === 'DEPUTY_MANAGER' ? 'Phó phòng' : (targetRole === 'ADMIN' ? 'Admin' : (targetRole === 'LEADERSHIP' ? 'Ban Lãnh Ð?o' : 'Chuyên viên')))),
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

    // Luôn luu b?n sao profile d?c l?p d? auth.loadUser() có th? n?p ngay
    try {
      localStorage.setItem('tvm_user_profile_' + users[idx].id, JSON.stringify(users[idx]));
    } catch (e) {
      console.warn('L?i luu tvm_user_profile_:', e);
    }

    // N?u s?a thông tin c?a chính ngu?i dang dang nh?p -> C?p nh?t Auth
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

    // Không cho phép xóa Admin chính
    if (userToDelete.role === 'ADMIN') {
      return false;
    }

    const filtered = users.filter(u => u.id !== userId);
    this.saveAllUsers(filtered);
    appScriptBridge.deleteUser(userId);
    return true;
  }

  // C?p nh?t h? so cá nhân c?a chính mình
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

  // --- QU?N LÝ CÔNG VI?C (CRUD TASKS) ---
  getAllTasksRaw() {
    try {
      const raw = JSON.parse(localStorage.getItem(TASKS_STORAGE_KEY)) || INITIAL_TASKS;
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
            creatorName: t.creatorName || (this.getUserById(t.creatorId)?.name || 'H? th?ng')
          };
        });
      }
      return INITIAL_TASKS;
    } catch (_) {
      return INITIAL_TASKS;
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
    const currentDept = auth.getActiveDepartment() || { id: 'dept_ptkh', code: 'PTKH-CS3' };
    const currentUser = auth.getCurrentUser() || { id: 'user_admin', name: 'Ban Giám Ð?c' };

    const prefix = currentDept.code.split('-')[0] || 'TASK';
    const newId = `${prefix}-${Date.now().toString().slice(-4)}`;

    const requiresApproval = Boolean(taskData.requiresApproval);
    const approverId = requiresApproval ? (taskData.approverId || currentDept.managerId || 'user_lanhdao') : null;
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

    // G?i thông báo cho Assignee
    if (newTask.assigneeId && newTask.assigneeId !== currentUser.id) {
      this.addNotification({
        recipientId: newTask.assigneeId,
        senderId: currentUser.id,
        type: 'task_assigned',
        title: '?? B?n du?c giao công vi?c m?i',
        content: `${currentUser.name} dã giao nhi?m v? "${newTask.title}" (${newTask.id}) cho b?n. H?n hoàn thành: ${newTask.dueDate}.`,
        taskId: newTask.id
      });
    }

    // N?u công vi?c c?n phê duy?t, g?i thông báo kh?n cho Ngu?i phê duy?t
    if (newTask.requiresApproval && newTask.approverId && newTask.approverId !== currentUser.id) {
      this.addNotification({
        recipientId: newTask.approverId,
        senderId: currentUser.id,
        type: 'approval_request',
        title: '? Nhi?m v? m?i c?n b?n phê duy?t',
        content: `${currentUser.name} dã g?i yêu c?u phê duy?t công vi?c "${newTask.title}" (${newTask.id}).`,
        taskId: newTask.id
      });
    }

    return newTask;
  }

  updateTask(taskId, updates = {}) {
    const tasks = this.getAllTasksRaw();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return null;

    const currentUser = auth.getCurrentUser() || { id: '', name: 'H? th?ng' };

    if (updates.title !== undefined) task.title = updates.title.trim();
    if (updates.description !== undefined) task.description = (updates.description || '').trim();
    if (updates.teamId !== undefined) task.teamId = updates.teamId || '';
    if (updates.priority !== undefined) task.priority = updates.priority;
    if (updates.dueDate !== undefined) task.dueDate = updates.dueDate;
    if (updates.category !== undefined) task.category = updates.category.trim() || 'Chuyên môn';
    if (updates.cost !== undefined) task.cost = parseInt(updates.cost, 10) || 0;
    if (updates.departmentId !== undefined) task.departmentId = updates.departmentId;

    // Phân công ngu?i th?c hi?n
    const oldAssigneeId = task.assigneeId;
    if (updates.assigneeId !== undefined) {
      task.assigneeId = updates.assigneeId;
      if (oldAssigneeId !== updates.assigneeId && updates.assigneeId && updates.assigneeId !== currentUser.id) {
        this.addNotification({
          recipientId: updates.assigneeId,
          senderId: currentUser.id,
          type: 'task_assigned',
          title: '?? B?n du?c phân công nhi?m v?',
          content: `${currentUser.name} dã c?p nh?t ngu?i th?c hi?n nhi?m v? "${task.title}" (${task.id}) cho b?n.`,
          taskId: task.id
        });
      }
    }

    // Yêu c?u phê duy?t
    if (updates.requiresApproval !== undefined) {
      task.requiresApproval = Boolean(updates.requiresApproval);
      if (task.requiresApproval && (!task.approvalStatus || task.approvalStatus === 'NONE')) {
        task.approvalStatus = 'PENDING';
      }
    }
    if (updates.approverId !== undefined) task.approverId = updates.approverId || null;

    // Tr?ng thái công vi?c
    if (updates.status !== undefined) {
      task.status = updates.status;
      if (updates.status === 'done' || updates.status === 'completed') {
        task.progress = 100;
        task.completedAt = task.completedAt || new Date().toISOString();
      }
    }

    // Ð?ng b? và tính toán subtasks n?u có truy?n vào
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
      content: `[Ði?u chuy?n] Ðã phân công l?i ngu?i th?c hi?n cho ${newAssignee ? newAssignee.name : 'nhân s? m?i'}.`,
      createdAt: new Date().toISOString()
    });

    this.saveAllTasks(tasks);
    appScriptBridge.pushTask(task);

    // G?i thông báo cho ngu?i du?c assign m?i
    if (newAssigneeId && newAssigneeId !== currentUser.id) {
      this.addNotification({
        recipientId: newAssigneeId,
        senderId: currentUser.id,
        type: 'task_assigned',
        title: '?? B?n du?c phân công làm ngu?i ph? trách',
        content: `${currentUser.name} dã phân công công vi?c "${task.title}" (${task.id}) cho b?n.`,
        taskId: task.id
      });
    }

    // N?u ngu?i cu khác ngu?i thao tác, thông báo chuy?n giao
    if (oldAssigneeId && oldAssigneeId !== currentUser.id && oldAssigneeId !== newAssigneeId) {
      this.addNotification({
        recipientId: oldAssigneeId,
        senderId: currentUser.id,
        type: 'update',
        title: '?? Công vi?c dã du?c chuy?n giao',
        content: `Công vi?c "${task.title}" (${task.id}) dã du?c ${currentUser.name} chuy?n giao cho ${newAssignee ? newAssignee.name : 'ngu?i khác'}.`,
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
      'todo': 'Chua b?t d?u',
      'in_progress': 'Ðang th?c hi?n',
      'pending_approval': 'Ch? phê duy?t',
      'review': 'Ch? phê duy?t',
      'done': 'Ðã hoàn thành',
      'completed': 'Ðã hoàn thành',
      'paused': 'T?m d?ng',
      'overdue': 'Quá h?n'
    };
    const sLabel = statusLabels[newStatus] || newStatus;
    const currentUser = auth.getCurrentUser();

    // Thông báo cho Assignee
    if (task.assigneeId && task.assigneeId !== currentUser.id) {
      this.addNotification({
        recipientId: task.assigneeId,
        senderId: currentUser.id,
        type: 'status_change',
        title: '?? C?p nh?t tr?ng thái công vi?c',
        content: `Công vi?c "${task.title}" (${task.id}) dã du?c ${currentUser.name} chuy?n sang "${sLabel}".`,
        taskId: task.id
      });
    }

    // Thông báo cho Creator
    if (task.creatorId && task.creatorId !== currentUser.id && task.creatorId !== task.assigneeId) {
      this.addNotification({
        recipientId: task.creatorId,
        senderId: currentUser.id,
        type: 'status_change',
        title: '?? Ti?n d? nhi?m v? c?p nh?t',
        content: `${currentUser.name} dã c?p nh?t tr?ng thái vi?c "${task.title}" (${task.id}) thành "${sLabel}".`,
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
      content: `[ÐÃ PHÊ DUY?T 1-CH?M] Ngu?i duy?t: ${currentUser.name}${note ? ` - Ghi chú: "${note}"` : ''}.`,
      createdAt: new Date().toISOString()
    });

    this.saveAllTasks(tasks);
    appScriptBridge.pushTask(task);

    // G?i thông báo cho Assignee và Creator
    const targets = new Set([task.assigneeId, task.creatorId].filter(Boolean));
    targets.forEach(userId => {
      if (userId !== currentUser.id) {
        this.addNotification({
          recipientId: userId,
          senderId: currentUser.id,
          type: 'approval_approved',
          title: '? Nhi?m v? dã du?c phê duy?t 1-ch?m',
          content: `${currentUser.name} dã ký duy?t hoàn thành nhi?m v? "${task.title}" (${task.id}).`,
          taskId: task.id
        });
      }
    });

    return true;
  }

  rejectTask(taskId, reason = 'Chua d?t tiêu chu?n yêu c?u') {
    const tasks = this.getAllTasksRaw();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return false;

    const currentUser = auth.getCurrentUser();
    task.status = 'todo';
    task.approvalStatus = 'REJECTED';
    task.rejectedBy = currentUser.name;
    task.rejectReason = reason;
    task.rejectedAt = new Date().toISOString();
    task.updatedAt = new Date().toISOString();

    if (!task.comments) task.comments = [];
    task.comments.push({
      id: `cm-${Date.now()}`,
      userId: currentUser.id,
      content: `[T? CH?I PHÊ DUY?T] Ngu?i duy?t: ${currentUser.name}. Lý do: "${reason}"`,
      createdAt: new Date().toISOString()
    });

    this.saveAllTasks(tasks);
    appScriptBridge.pushTask(task);

    // G?i thông báo cho Assignee và Creator
    const targets = new Set([task.assigneeId, task.creatorId].filter(Boolean));
    targets.forEach(userId => {
      if (userId !== currentUser.id) {
        this.addNotification({
          recipientId: userId,
          senderId: currentUser.id,
          type: 'approval_rejected',
          title: '? Nhi?m v? b? t? ch?i phê duy?t',
          content: `${currentUser.name} dã t? ch?i duy?t nhi?m v? "${task.title}" (${task.id}). Lý do: "${reason}"`,
          taskId: task.id
        });
      }
    });

    return true;
  }

  deleteTask(taskId) {
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

      // Thông báo c?p nh?t ti?n d?
      const currentUser = auth.getCurrentUser();
      if (task.assigneeId && task.assigneeId !== currentUser.id) {
        this.addNotification({
          recipientId: task.assigneeId,
          senderId: currentUser.id,
          type: 'update',
          title: '?? C?p nh?t ti?n d? vi?c con',
          content: `${currentUser.name} dã c?p nh?t checklist công vi?c "${task.title}" (Ti?n d?: ${task.progress}%).`,
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

    // Ð?ng b? sang checklist cho tuong thích ngu?c
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

    // G?i thông báo cho ngu?i du?c assign vi?c con n?u khác currentUser
    const currentUser = auth.getCurrentUser();
    if (newSubtask.assigneeId && newSubtask.assigneeId !== currentUser.id) {
      this.addNotification({
        recipientId: newSubtask.assigneeId,
        senderId: currentUser.id,
        type: 'task_assigned',
        title: '?? B?n du?c giao vi?c con m?i',
        content: `${currentUser.name} dã phân công vi?c con "${newSubtask.title}" trong nhi?m v? "${task.title}" cho b?n.`,
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
        title: '?? Ý ki?n ch? d?o / Trao d?i m?i',
        content: `${currentUser.name} dã nh?n trong vi?c "${task.title}": "${content.slice(0, 60)}..."`,
        taskId: task.id
      });
    }
    // Thông báo cho Creator
    if (task.creatorId && task.creatorId !== currentUser.id && task.creatorId !== task.assigneeId) {
      this.addNotification({
        recipientId: task.creatorId,
        senderId: currentUser.id,
        type: 'comment',
        title: '?? Trao d?i trong công vi?c b?n giao',
        content: `${currentUser.name} dã nh?n trong vi?c "${task.title}": "${content.slice(0, 60)}..."`,
        taskId: task.id
      });
    }
  }

  // --- H? TH?NG THÔNG BÁO (NOTIFICATIONS SYSTEM) ---
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
      title: notifData.title || 'Thông báo m?i',
      content: notifData.content || '',
      taskId: notifData.taskId || null,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    notifs.unshift(newNotif);
    // Gi? t?i da 100 thông báo g?n nh?t
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
    if (updated) this.saveAllNotifications(notifs);
  }

  clearUserNotifications(userId) {
    const notifs = this.getAllNotifications();
    const remaining = notifs.filter(n => n.recipientId !== userId && n.recipientId !== 'all');
    this.saveAllNotifications(remaining);
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
}

export const store = new Store();



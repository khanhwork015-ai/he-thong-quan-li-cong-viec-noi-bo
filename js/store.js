/**
 * THANH VŨ MEDIC CS3 - CENTRALIZED REACTIVE STORE (APPS SCRIPT INTEGRATED)
 * Hỗ trợ CRUD Nhân viên, Hồ sơ cá nhân và Đồng bộ Google Sheets / SHIN AIOS
 */

import { INITIAL_TASKS, DEPARTMENTS, USERS } from './models.js';
import { auth } from './auth.js';
import { appScriptBridge } from './services/appScriptBridge.js';

const TASKS_STORAGE_KEY = 'tvm_tasks_v3';
const USERS_STORAGE_KEY = 'tvm_users_v3';
const DEPTS_STORAGE_KEY = 'tvm_departments_v4';

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
        localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(cloudData.tasks));
        taskCount = cloudData.tasks.length;
      }
      if (cloudData.users && cloudData.users.length > 0) {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(cloudData.users));
        userCount = cloudData.users.length;
      }

      window.dispatchEvent(new CustomEvent('tvm:data_changed'));
      window.dispatchEvent(new CustomEvent('tvm:users_changed'));

      return {
        success: true,
        taskCount,
        userCount,
        message: `Đồng bộ thành công! Đã nạp ${taskCount} công việc và ${userCount} nhân sự từ Google Sheet.`
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
    const success = await appScriptBridge.pushAllToCloud(tasks, users);
    return {
      success,
      taskCount: tasks.length,
      userCount: users.length,
      message: success 
        ? `Đã đẩy ${tasks.length} công việc và ${users.length} nhân sự lên Google Sheet thành công!` 
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

  getDepartmentUsers(deptId) {
    return this.getAllUsers().filter(u => u.departmentId === deptId || u.departmentId === 'all');
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

    depts[idx] = { ...depts[idx], ...deptData, updatedAt: new Date().toISOString() };
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
      departmentId: targetDeptId,
      teamId: userData.teamId || '',
      title: userData.title.trim() || 'Chuyên viên',
      unit: userData.unit || (this.getDepartmentById(targetDeptId)?.name || 'Thanh Vũ Medic'),
      avatar: userData.avatar?.trim() || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
      badge: userData.badge || (targetRole === 'MANAGER' ? 'Trưởng phòng' : (targetRole === 'ADMIN' ? 'Admin' : (targetRole === 'LEADERSHIP' ? 'Ban Lãnh Đạo' : 'Chuyên viên'))),
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

    // Không cho phép xóa Admin chính
    if (userToDelete.role === 'ADMIN') {
      return false;
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
      return JSON.parse(localStorage.getItem(TASKS_STORAGE_KEY)) || INITIAL_TASKS;
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
    const currentDept = auth.getActiveDepartment();
    const currentUser = auth.getCurrentUser();

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
      filtered = filtered.filter(t => t.status === 'review');
    } else if (options.tab === 'completed') {
      filtered = filtered.filter(t => t.status === 'done');
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
    const currentDept = auth.getActiveDepartment();
    const currentUser = auth.getCurrentUser();

    const prefix = currentDept.code.split('-')[0] || 'TASK';
    const newId = `${prefix}-${Date.now().toString().slice(-4)}`;

    const newTask = {
      id: newId,
      departmentId: currentDept.id,
      creatorId: currentUser.id,
      assigneeId: taskData.assigneeId || currentUser.id,
      title: taskData.title,
      description: taskData.description || '',
      priority: taskData.priority || 'P2',
      status: 'todo',
      dueDate: taskData.dueDate || new Date().toISOString().split('T')[0],
      category: taskData.category || 'Hành chính',
      progress: 0,
      cost: parseInt(taskData.cost, 10) || 0,
      subtasks: [],
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    tasks.unshift(newTask);
    this.saveAllTasks(tasks);
    appScriptBridge.pushTask(newTask);
    return newTask;
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
    return task;
  }

  approveTask(taskId) {
    const tasks = this.getAllTasksRaw();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return false;

    task.status = 'done';
    task.progress = 100;
    task.approvedBy = auth.getCurrentUser().name;
    task.approvedAt = new Date().toISOString();
    task.updatedAt = new Date().toISOString();

    this.saveAllTasks(tasks);
    appScriptBridge.pushTask(task);
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
    if (!task || !task.subtasks) return;

    const sub = task.subtasks.find(s => s.id === subtaskId);
    if (sub) {
      sub.completed = !sub.completed;
      const completedCount = task.subtasks.filter(s => s.completed).length;
      task.progress = Math.round((completedCount / task.subtasks.length) * 100);
      if (task.progress === 100 && task.status !== 'done') {
        task.status = 'review';
      }
      this.saveAllTasks(tasks);
      appScriptBridge.pushTask(task);
    }
  }

  addComment(taskId, content) {
    const tasks = this.getAllTasksRaw();
    const task = tasks.find(t => t.id === taskId);
    if (!task || !content.trim()) return;

    if (!task.comments) task.comments = [];
    task.comments.push({
      id: `cm-${Date.now()}`,
      userId: auth.getCurrentUser().id,
      content: content.trim(),
      createdAt: new Date().toISOString()
    });

    this.saveAllTasks(tasks);
    appScriptBridge.pushTask(task);
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

/**
 * THANH VŨ MEDIC CS3 - CENTRALIZED REACTIVE STORE
 * Lưu trữ LocalStorage & Cô lập dữ liệu đa phòng ban (Data Isolation)
 */

import { INITIAL_TASKS, DEPARTMENTS, USERS } from './models.js';
import { auth } from './auth.js';

const TASKS_STORAGE_KEY = 'tvm_tasks_v3';

export class Store {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem(TASKS_STORAGE_KEY)) {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(INITIAL_TASKS));
    }
  }

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

  // Lấy danh sách nhiệm vụ được CÔ LẬP THEO PHÒNG BAN & PHÂN QUYỀN
  getDepartmentTasks(options = {}) {
    const allTasks = this.getAllTasksRaw();
    const currentDept = auth.getActiveDepartment();
    const currentUser = auth.getCurrentUser();

    // 1. Lọc theo Phòng Ban (Trừ khi Admin chọn xem tất cả)
    let filtered = allTasks;
    if (!auth.isAdmin() || currentDept.id !== 'all') {
      filtered = filtered.filter(t => t.departmentId === currentDept.id);
    }

    // 2. Nếu là Nhân viên (MEMBER) và bật lọc cá nhân
    if (auth.isMember() && options.personalOnly) {
      filtered = filtered.filter(t => t.assigneeId === currentUser.id);
    }

    // 3. Lọc theo tab Linear/Notion
    if (options.tab === 'assigned_to_me') {
      filtered = filtered.filter(t => t.assigneeId === currentUser.id);
    } else if (options.tab === 'created_by_me') {
      filtered = filtered.filter(t => t.creatorId === currentUser.id);
    } else if (options.tab === 'pending_approval') {
      filtered = filtered.filter(t => t.status === 'review');
    } else if (options.tab === 'completed') {
      filtered = filtered.filter(t => t.status === 'done');
    }

    // 4. Lọc theo mức ưu tiên
    if (options.priority && options.priority !== 'ALL') {
      filtered = filtered.filter(t => t.priority === options.priority);
    }

    // 5. Lọc theo trạng thái
    if (options.status && options.status !== 'ALL') {
      filtered = filtered.filter(t => t.status === options.status);
    }

    // 6. Tìm kiếm theo từ khóa
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
    return true;
  }

  deleteTask(taskId) {
    const tasks = this.getAllTasksRaw();
    const filtered = tasks.filter(t => t.id !== taskId);
    this.saveAllTasks(filtered);
    return true;
  }

  toggleSubtask(taskId, subtaskId) {
    const tasks = this.getAllTasksRaw();
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.subtasks) return;

    const sub = task.subtasks.find(s => s.id === subtaskId);
    if (sub) {
      sub.completed = !sub.completed;
      // Cập nhật % tiến độ tự động theo số subtask
      const completedCount = task.subtasks.filter(s => s.completed).length;
      task.progress = Math.round((completedCount / task.subtasks.length) * 100);
      if (task.progress === 100 && task.status !== 'done') {
        task.status = 'review'; // Chờ duyệt khi xong hết checklist
      }
      this.saveAllTasks(tasks);
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
  }

  // --- TÍNH TOÁN 5 CHỈ SỐ KPI CHUẨN GOOGLE STITCH ---
  getDepartmentMetrics() {
    const deptTasks = this.getDepartmentTasks();
    const total = deptTasks.length;
    const inProgress = deptTasks.filter(t => t.status === 'in_progress').length;
    const done = deptTasks.filter(t => t.status === 'done').length;
    const pendingApproval = deptTasks.filter(t => t.status === 'review').length;
    
    // Quá hạn: dueDate < ngày hôm nay và chưa hoàn thành
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

  getUserById(userId) {
    return USERS.find(u => u.id === userId) || null;
  }

  getDepartmentUsers(deptId) {
    return USERS.filter(u => u.departmentId === deptId || u.departmentId === 'all');
  }
}

export const store = new Store();

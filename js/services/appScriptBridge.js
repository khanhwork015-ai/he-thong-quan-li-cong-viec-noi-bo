/**
 * THANH VŨ MEDIC CS3 - GOOGLE APPS SCRIPT & SHIN AIOS BRIDGE
 * Dịch vụ đồng bộ dữ liệu thật 2 chiều với Google Sheets / SHIN AIOS
 * Khắc phục 100% lỗi CORS: Không dùng header tùy biến trong GET, dùng text/plain trong POST
 */

import { toast } from '../helpers.js?v=8.5';

const GAS_ENDPOINT_KEY = 'tvm_gas_endpoint';
const LAST_SYNC_KEY = 'tvm_last_sync_time';

export const DEFAULT_GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwMvK9EzyweeOVB4wraPzdwZVUEzbLcSd3RyYcdUzbIrOcFcAgHCwvmvYOcu_9UdhRW/exec';

export class AppScriptBridge {
  constructor() {
    let saved = null;
    try {
      if (typeof localStorage !== 'undefined') {
        saved = localStorage.getItem(GAS_ENDPOINT_KEY);
      }
    } catch (_) {}

    this.endpoint = (saved && saved.trim().startsWith('https://script.google.com/')) ? saved.trim() : DEFAULT_GAS_ENDPOINT;
    if (!saved && typeof localStorage !== 'undefined') {
      try { localStorage.setItem(GAS_ENDPOINT_KEY, this.endpoint); } catch (_) {}
    }

    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.lastSyncTime = (typeof localStorage !== 'undefined') ? localStorage.getItem(LAST_SYNC_KEY) : null;

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => { this.isOnline = true; });
      window.addEventListener('offline', () => { this.isOnline = false; });
    }
  }

  getEndpoint() {
    return this.endpoint;
  }

  setEndpoint(url) {
    this.endpoint = url.trim();
    localStorage.setItem(GAS_ENDPOINT_KEY, this.endpoint);
    window.dispatchEvent(new CustomEvent('tvm:endpoint_updated'));
  }

  isConnected() {
    return Boolean(this.endpoint && this.endpoint.includes('script.google.com/macros/s/'));
  }

  // Tải dữ liệu thật từ Google Sheet về Web App (GET Request - Không Preflight CORS)
  async fetchCloudData() {
    if (!this.isConnected()) {
      return { success: false, message: 'Chưa cấu hình URL Google Apps Script Endpoint' };
    }

    try {
      const sep = this.endpoint.includes('?') ? '&' : '?';
      const url = `${this.endpoint}${sep}action=getData&_t=${Date.now()}`;

      // GET request không kèm headers tùy biến để tránh CORS preflight OPTIONS
      const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data && data.success) {
        this.lastSyncTime = new Date().toISOString();
        localStorage.setItem(LAST_SYNC_KEY, this.lastSyncTime);
        return {
          success: true,
          tasks: data.tasks || [],
          users: data.users || [],
          depts: data.depts || [],
          notifications: data.notifications || [],
          plans: data.plans || [],
          timestamp: this.lastSyncTime
        };
      } else {
        return { success: false, message: data.message || 'Lỗi xử lý trên Apps Script' };
      }
    } catch (err) {
      console.warn('[AppsScript Bridge] Lỗi tải dữ liệu từ Google Sheet:', err);
      return {
        success: false,
        error: err.toString(),
        message: 'Không thể kết nối. Hãy đảm bảo Apps Script đã Deploy as Web App với quyền "Anyone (Bất kỳ ai)"!'
      };
    }
  }

  // Khởi tạo bảng dữ liệu mẫu trực tiếp trên Google Sheet qua GET
  async seedCloudData() {
    if (!this.isConnected()) return false;
    try {
      const sep = this.endpoint.includes('?') ? '&' : '?';
      const url = `${this.endpoint}${sep}action=seed&_t=${Date.now()}`;
      const response = await fetch(url, { method: 'GET', redirect: 'follow' });
      const data = await response.json();
      if (data && data.success) {
        this.lastSyncTime = new Date().toISOString();
        localStorage.setItem(LAST_SYNC_KEY, this.lastSyncTime);
        return data;
      }
    } catch (err) {
      console.warn('[AppsScript Bridge] Lỗi seed dữ liệu lên Google Sheet:', err);
    }
    return null;
  }

  // Đẩy toàn bộ dữ liệu từ LocalStorage lên Google Sheet (Batch Sync qua POST text/plain)
  async pushAllToCloud(tasks, users, notifications = [], departments = [], plans = []) {
    if (!this.isConnected()) return false;
    try {
      // Dùng text/plain để không bị CORS preflight OPTIONS
      await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'pushAll',
          tasks: tasks,
          users: users,
          notifications: notifications,
          departments: departments,
          plans: plans,
          timestamp: new Date().toISOString()
        }),
        mode: 'no-cors'
      });

      this.lastSyncTime = new Date().toISOString();
      localStorage.setItem(LAST_SYNC_KEY, this.lastSyncTime);
      return true;
    } catch (err) {
      console.warn('[AppsScript Bridge] Lỗi push dữ liệu lên Google Sheet:', err);
      return false;
    }
  }


  // Gửi danh sách phòng ban & bộ phận con lên Google Sheet
  async pushDepartments(departments) {
    if (!this.isConnected()) return false;
    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'saveDepartments',
          departments: departments
        }),
        mode: 'no-cors'
      });
      return true;
    } catch (_) {
      return false;
    }
  }

  // Gửi 1 công việc đơn lẻ lên Google Sheet
  async pushTask(task) {
    if (!this.isConnected()) return false;
    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'saveTask', task }),
        mode: 'no-cors'
      });
      return true;
    } catch (_) {
      return false;
    }
  }

  // Xóa 1 công việc khỏi Google Sheet
  async deleteTask(taskId) {
    if (!this.isConnected()) return false;
    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'deleteTask', taskId }),
        mode: 'no-cors'
      });
      return true;
    } catch (_) {
      return false;
    }
  }

  // Gửi 1 nhân viên lên Google Sheet
  async pushUser(user) {
    if (!this.isConnected()) return false;
    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'saveUser', user }),
        mode: 'no-cors'
      });
      return true;
    } catch (_) {
      return false;
    }
  }

  // Xóa 1 nhân viên khỏi Google Sheet
  async deleteUser(userId) {
    if (!this.isConnected()) return false;
    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'deleteUser', userId }),
        mode: 'no-cors'
      });
      return true;
    } catch (_) {
      return false;
    }
  }

  // Gửi 1 thông báo lên Google Sheet
  async pushNotification(notification) {
    if (!this.isConnected()) return false;
    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'saveNotification', notification }),
        mode: 'no-cors'
      });
      return true;
    } catch (_) {
      return false;
    }
  }

  // Đánh dấu thông báo đã đọc trên Google Sheet
  async markNotificationRead(notifId) {
    if (!this.isConnected()) return false;
    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'markNotificationRead', notifId }),
        mode: 'no-cors'
      });
      return true;
    } catch (_) {
      return false;
    }
  }

  // Xóa toàn bộ thông báo của 1 người dùng trên Google Sheet
  async clearUserNotifications(userId) {
    return this._post({ action: 'clearUserNotifications', userId });
  }

  // Đánh dấu đã đọc toàn bộ thông báo của 1 người dùng trên Google Sheet
  async markAllNotificationsRead(userId) {
    return this._post({ action: 'markAllNotificationsRead', userId });
  }

  async _post(payload) {
    if (!this.isConnected()) return false;
    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        mode: 'no-cors'
      });
      return true;
    } catch (_) {
      return false;
    }
  }

  // Đẩy 1 kế hoạch lên Google Sheet
  async pushPlan(plan) {
    if (!this.isConnected()) return false;
    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'savePlan', plan }),
        mode: 'no-cors'
      });
      return true;
    } catch (_) {
      return false;
    }
  }

  // Xóa 1 kế hoạch trên Google Sheet
  async deletePlan(planId) {
    if (!this.isConnected()) return false;
    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'deletePlan', planId }),
        mode: 'no-cors'
      });
      return true;
    } catch (_) {
      return false;
    }
  }
}

export const appScriptBridge = new AppScriptBridge();



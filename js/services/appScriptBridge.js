/**
 * THANH VU MEDIC CS3 - GOOGLE APPS SCRIPT & SHIN AIOS BRIDGE
 * D?ch v? d?ng b? d? li?u th?t 2 chi?u v?i Google Sheets / SHIN AIOS
 * Kh?c ph?c 100% l?i CORS: Không dùng header tùy bi?n trong GET, dùng text/plain trong POST
 */

import { toast } from '../helpers.js';

const GAS_ENDPOINT_KEY = 'tvm_gas_endpoint';
const LAST_SYNC_KEY = 'tvm_last_sync_time';

export class AppScriptBridge {
  constructor() {
    this.endpoint = localStorage.getItem(GAS_ENDPOINT_KEY) || '';
    this.isOnline = navigator.onLine;
    this.lastSyncTime = localStorage.getItem(LAST_SYNC_KEY) || null;

    window.addEventListener('online', () => { this.isOnline = true; });
    window.addEventListener('offline', () => { this.isOnline = false; });
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

  // T?i d? li?u th?t t? Google Sheet v? Web App (GET Request - Không Preflight CORS)
  async fetchCloudData() {
    if (!this.isConnected()) {
      return { success: false, message: 'Chua c?u hình URL Google Apps Script Endpoint' };
    }

    try {
      const sep = this.endpoint.includes('?') ? '&' : '?';
      const url = `${this.endpoint}${sep}action=getData&_t=${Date.now()}`;

      // GET request không kèm headers tùy bi?n d? tránh CORS preflight OPTIONS
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
          timestamp: this.lastSyncTime
        };
      } else {
        return { success: false, message: data.message || 'L?i x? lý trên Apps Script' };
      }
    } catch (err) {
      console.warn('[AppsScript Bridge] L?i t?i d? li?u t? Google Sheet:', err);
      return {
        success: false,
        error: err.toString(),
        message: 'Không th? k?t n?i. Hãy d?m b?o Apps Script dã Deploy as Web App v?i quy?n "Anyone (B?t k? ai)"!'
      };
    }
  }

  // Kh?i t?o b?ng d? li?u m?u tr?c ti?p trên Google Sheet qua GET
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
      console.warn('[AppsScript Bridge] L?i seed d? li?u lên Google Sheet:', err);
    }
    return null;
  }

  // Ð?y toàn b? d? li?u t? LocalStorage lên Google Sheet (Batch Sync qua POST text/plain)
  async pushAllToCloud(tasks, users, notifications = [], departments = []) {
    if (!this.isConnected()) return false;
    try {
      // Dùng text/plain d? không b? CORS preflight OPTIONS
      await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'pushAll',
          tasks: tasks,
          users: users,
          notifications: notifications,
          departments: departments,
          timestamp: new Date().toISOString()
        }),
        mode: 'no-cors'
      });

      this.lastSyncTime = new Date().toISOString();
      localStorage.setItem(LAST_SYNC_KEY, this.lastSyncTime);
      return true;
    } catch (err) {
      console.warn('[AppsScript Bridge] L?i push d? li?u lên Google Sheet:', err);
      return false;
    }
  }


  // G?i danh sách phòng ban & b? ph?n con lên Google Sheet
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

  // G?i 1 công vi?c don l? lên Google Sheet
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

  // Xóa 1 công vi?c kh?i Google Sheet
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

  // G?i 1 nhân viên lên Google Sheet
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

  // Xóa 1 nhân viên kh?i Google Sheet
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

  // G?i 1 thông báo lên Google Sheet
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

  // Ðánh d?u thông báo dã d?c trên Google Sheet
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
}

export const appScriptBridge = new AppScriptBridge();



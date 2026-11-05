/**
 * THANH VŨ MEDIC CS3 - GOOGLE APPS SCRIPT & SHIN AIOS BRIDGE
 * Dịch vụ đồng bộ dữ liệu thật 2 chiều với Google Sheets / SHIN AIOS
 */

import { toast } from '../helpers.js';

const GAS_ENDPOINT_KEY = 'tvm_gas_endpoint';

export class AppScriptBridge {
  constructor() {
    this.endpoint = localStorage.getItem(GAS_ENDPOINT_KEY) || '';
    this.isOnline = navigator.onLine;
    this.lastSyncTime = localStorage.getItem('tvm_last_sync_time') || null;

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
    return Boolean(this.endpoint && this.endpoint.startsWith('https://script.google.com'));
  }

  // Tải dữ liệu thật từ Google Sheet về
  async fetchCloudData() {
    if (!this.isConnected()) return null;

    try {
      const response = await fetch(`${this.endpoint}?action=getData`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error('Network error');
      const data = await response.json();
      if (data && data.success) {
        this.lastSyncTime = new Date().toISOString();
        localStorage.setItem('tvm_last_sync_time', this.lastSyncTime);
        return data;
      }
    } catch (err) {
      console.warn('[AppsScript Bridge] Không thể đồng bộ từ Google Sheet:', err);
    }
    return null;
  }

  // Gửi bản ghi công việc lên Google Sheet
  async pushTask(task) {
    if (!this.isConnected()) return false;
    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveTask', task }),
        mode: 'no-cors'
      });
      return true;
    } catch (_) {
      return false;
    }
  }

  async deleteTask(taskId) {
    if (!this.isConnected()) return false;
    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteTask', taskId }),
        mode: 'no-cors'
      });
      return true;
    } catch (_) {
      return false;
    }
  }

  // Gửi bản ghi nhân viên lên Google Sheet
  async pushUser(user) {
    if (!this.isConnected()) return false;
    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveUser', user }),
        mode: 'no-cors'
      });
      return true;
    } catch (_) {
      return false;
    }
  }

  async deleteUser(userId) {
    if (!this.isConnected()) return false;
    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteUser', userId }),
        mode: 'no-cors'
      });
      return true;
    } catch (_) {
      return false;
    }
  }
}

export const appScriptBridge = new AppScriptBridge();

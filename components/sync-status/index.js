/**
 * 同步状态组件
 * 显示当前同步状态、待同步数量等
 */

const app = getApp();

Component({
  data: {
    isOnline: true,
    pendingCount: 0,
    lastSync: null,
    showStatus: false,
  },

  lifetimes: {
    attached() {
      this.updateStatus();
      // 每30秒更新一次状态
      this.statusTimer = setInterval(() => {
        this.updateStatus();
      }, 30000);
    },
    detached() {
      if (this.statusTimer) {
        clearInterval(this.statusTimer);
      }
    }
  },

  methods: {
    updateStatus() {
      const storageManager = app.globalData.storageManager;
      if (!storageManager) return;

      const status = storageManager.getSyncStatus();
      this.setData({
        isOnline: status.isOnline,
        pendingCount: status.pendingCount,
        lastSync: status.lastSync ? this.formatTime(status.lastSync) : null,
        showStatus: !status.isOnline || status.pendingCount > 0,
      });
    },

    formatTime(isoString) {
      if (!isoString) return '';
      const date = new Date(isoString);
      const now = new Date();
      const diff = now - date;

      if (diff < 60000) return '刚刚';
      if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
      return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
    },

    // 手动触发同步
    async onSyncTap() {
      const storageManager = app.globalData.storageManager;
      if (!storageManager) return;

      wx.showLoading({ title: '同步中...' });
      try {
        await storageManager.trySync(app);
        this.updateStatus();
        wx.showToast({ title: '同步完成', icon: 'success' });
      } catch (err) {
        wx.showToast({ title: '同步失败', icon: 'none' });
      } finally {
        wx.hideLoading();
      }
    }
  }
});

// pages/family/index.js
const app = getApp();

Page({
  data: {
    familyInfo: null,
    familyStats: {
      totalAmount: '0.00',
      totalCount: 0,
      avgPerPerson: '0.00',
      dailyAvg: '0.00'
    },
    showInviteModal: false,
    showCreateModal: false,
    showJoinModal: false,
    familyName: '',
    inviteCode: ''
  },

  async onLoad() {
    // 等待登录完成
    if (app.globalData.loginPromise) {
      await app.globalData.loginPromise;
    }
    this.loadFamilyInfo();
  },

  onShow() {
    this.loadFamilyInfo();
  },

  // 加载家庭信息
  async loadFamilyInfo() {
    const userInfo = app.globalData.userInfo;
    if (!userInfo || !userInfo.familyId) {
      this.setData({ familyInfo: null });
      return;
    }

    try {
      const res = await app.request({ url: '/api/family/info' });
      if (res.code === 0) {
        this.setData({ familyInfo: res.data });
        this.loadFamilyStats();
      }
    } catch (err) {
      console.error('加载家庭信息失败:', err);
    }
  },

  // 加载家庭统计
  async loadFamilyStats() {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

      const res = await app.request({
        url: '/api/stats/by-time',
        data: {
          startDate,
          endDate,
          groupBy: 'day'
        }
      });

      if (res.code === 0) {
        const { total, items } = res.data;
        const days = items.length || 1;
        const memberCount = this.data.familyInfo.members.length || 1;

        const totalNum = Number(total) || 0;
        this.setData({
          familyStats: {
            totalAmount: totalNum.toFixed(2),
            totalCount: items.reduce((sum, item) => sum + (item.count || 0), 0),
            avgPerPerson: (totalNum / memberCount).toFixed(2),
            dailyAvg: (totalNum / days).toFixed(2)
          }
        });
      }
    } catch (err) {
      console.error('加载家庭统计失败:', err);
    }
  },

  // 创建家庭
  createFamily() {
    this.setData({ showCreateModal: true });
  },

  // 加入家庭
  joinFamily() {
    this.setData({ showJoinModal: true });
  },

  // 显示邀请码
  showInviteCode() {
    this.setData({ showInviteModal: true });
  },

  // 隐藏邀请码弹窗
  hideInviteModal() {
    this.setData({ showInviteModal: false });
  },

  // 隐藏创建弹窗
  hideCreateModal() {
    this.setData({ showCreateModal: false });
  },

  // 隐藏加入弹窗
  hideJoinModal() {
    this.setData({ showJoinModal: false });
  },

  // 家庭名称输入
  onFamilyNameInput(e) {
    this.setData({ familyName: e.detail.value });
  },

  // 邀请码输入
  onInviteCodeInput(e) {
    this.setData({ inviteCode: e.detail.value });
  },

  // 确认创建
  async confirmCreate() {
    const { familyName } = this.data;
    if (!familyName.trim()) {
      wx.showToast({ title: '请输入家庭名称', icon: 'none' });
      return;
    }

    try {
      const res = await app.request({
        url: '/api/family/create',
        method: 'POST',
        data: { name: familyName.trim() }
      });

      if (res.code === 0) {
        wx.showToast({ title: '创建成功', icon: 'success' });
        this.setData({ showCreateModal: false });
        
        // 更新用户信息
        app.globalData.userInfo.familyId = res.data.id;
        wx.setStorageSync('userInfo', app.globalData.userInfo);
        
        this.loadFamilyInfo();
      } else {
        wx.showToast({ title: res.message || '创建失败', icon: 'none' });
      }
    } catch (err) {
      console.error('创建失败:', err);
      wx.showToast({ title: '创建失败', icon: 'none' });
    }
  },

  // 确认加入
  async confirmJoin() {
    const { inviteCode } = this.data;
    if (!inviteCode.trim()) {
      wx.showToast({ title: '请输入邀请码', icon: 'none' });
      return;
    }

    try {
      const res = await app.request({
        url: '/api/family/join',
        method: 'POST',
        data: { inviteCode: inviteCode.trim() }
      });

      if (res.code === 0) {
        wx.showToast({ title: '加入成功', icon: 'success' });
        this.setData({ showJoinModal: false });
        
        // 更新用户信息
        app.globalData.userInfo.familyId = res.data.familyId;
        wx.setStorageSync('userInfo', app.globalData.userInfo);
        
        this.loadFamilyInfo();
      } else {
        wx.showToast({ title: res.message || '加入失败', icon: 'none' });
      }
    } catch (err) {
      console.error('加入失败:', err);
      wx.showToast({ title: '加入失败', icon: 'none' });
    }
  },

  // 复制邀请码
  copyInviteCode() {
    wx.setClipboardData({
      data: this.data.familyInfo.inviteCode,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' });
      }
    });
  },

  // 刷新邀请码
  async refreshInviteCode() {
    wx.showModal({
      title: '刷新邀请码',
      content: '刷新后旧邀请码将失效，确定要刷新吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await app.request({
              url: '/api/family/refresh-invite-code',
              method: 'POST'
            });

            if (result.code === 0) {
              wx.showToast({ title: '刷新成功', icon: 'success' });
              this.loadFamilyInfo();
            }
          } catch (err) {
            console.error('刷新失败:', err);
            wx.showToast({ title: '刷新失败', icon: 'none' });
          }
        }
      }
    });
  },

  // 退出家庭
  leaveFamily() {
    wx.showModal({
      title: '退出家庭',
      content: '退出后将无法查看家庭消费记录，确定要退出吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await app.request({
              url: '/api/family/leave',
              method: 'POST'
            });

            if (result.code === 0) {
              wx.showToast({ title: '已退出', icon: 'success' });
              
              // 更新用户信息
              app.globalData.userInfo.familyId = null;
              wx.setStorageSync('userInfo', app.globalData.userInfo);
              
              this.setData({ familyInfo: null });
            }
          } catch (err) {
            console.error('退出失败:', err);
            wx.showToast({ title: '退出失败', icon: 'none' });
          }
        }
      }
    });
  },

  // 分享
  onShareAppMessage() {
    const { familyInfo } = this.data;
    return {
      title: `邀请你加入「${familyInfo.name}」家庭`,
      path: `/pages/family/join?code=${familyInfo.inviteCode}`
    };
  },

  // 阻止冒泡
  noop() {}
});

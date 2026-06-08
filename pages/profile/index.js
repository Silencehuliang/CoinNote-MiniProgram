// pages/profile/index.js
const app = getApp();

Page({
  data: {
    userInfo: {},
    familyInfo: null,
    isLoggedIn: false,
    myStats: {
      totalAmount: '0.00',
      totalCount: 0,
      dailyAvg: '0.00',
      days: 0
    },
    cacheSize: '0KB',
    version: '1.0.0',
    showEditModal: false,
    showAboutModal: false,
    editNickname: ''
  },

  onLoad() {
    this.loadUserInfo();
    this.loadMyStats();
    this.calculateCacheSize();
  },

  onShow() {
    this.loadUserInfo();
  },

  // 加载用户信息
  loadUserInfo() {
    const userInfo = app.globalData.userInfo;
    const token = wx.getStorageSync('token');
    
    this.setData({
      userInfo: userInfo || {},
      isLoggedIn: !!token
    });

    if (userInfo && userInfo.familyId) {
      this.loadFamilyInfo();
    }
  },

  // 加载家庭信息
  async loadFamilyInfo() {
    try {
      const res = await app.request({ url: '/api/family/info' });
      if (res.code === 0) {
        this.setData({ familyInfo: res.data });
      }
    } catch (err) {
      console.error('加载家庭信息失败:', err);
    }
  },

  // 加载我的统计
  async loadMyStats() {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

      const res = await app.request({
        url: '/api/stats/by-user',
        data: { startDate, endDate }
      });

      if (res.code === 0 && res.data.items && res.data.items.length > 0) {
        const myData = res.data.items.find(item => item.userId === app.globalData.userInfo.id);
        if (myData) {
          const amount = Number(myData.amount) || 0;
          const days = new Date().getDate();
          this.setData({
            myStats: {
              totalAmount: amount.toFixed(2),
              totalCount: myData.count || 0,
              dailyAvg: (amount / days).toFixed(2),
              days: days
            }
          });
        }
      }
    } catch (err) {
      console.error('加载统计失败:', err);
    }
  },

  // 计算缓存大小
  calculateCacheSize() {
    try {
      const res = wx.getStorageInfoSync();
      const size = res.currentSize;
      this.setData({
        cacheSize: size > 1024 ? `${(size / 1024).toFixed(1)}MB` : `${size}KB`
      });
    } catch (err) {
      console.error('获取缓存大小失败:', err);
    }
  },

  // 编辑资料
  editProfile() {
    this.setData({
      showEditModal: true,
      editNickname: this.data.userInfo.nickname || ''
    });
  },

  // 隐藏编辑弹窗
  hideEditModal() {
    this.setData({ showEditModal: false });
  },

  // 昵称输入
  onNicknameInput(e) {
    this.setData({ editNickname: e.detail.value });
  },

  // 保存资料
  async saveProfile() {
    const { editNickname } = this.data;
    if (!editNickname.trim()) {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }

    try {
      const res = await app.request({
        url: '/api/user/profile',
        method: 'POST',
        data: { nickname: editNickname.trim() }
      });

      if (res.code === 0) {
        app.globalData.userInfo.nickname = editNickname.trim();
        wx.setStorageSync('userInfo', app.globalData.userInfo);
        
        this.setData({
          showEditModal: false,
          userInfo: app.globalData.userInfo
        });
        
        wx.showToast({ title: '保存成功', icon: 'success' });
      }
    } catch (err) {
      console.error('保存失败:', err);
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  // 跳转到分类管理
  goToCategory() {
    wx.navigateTo({ url: '/pages/category/index?mode=category' });
  },

  // 跳转到标签管理
  goToTag() {
    wx.navigateTo({ url: '/pages/category/index?mode=tag' });
  },

  // 跳转到导出
  goToExport() {
    wx.navigateTo({ url: '/pages/import/index?mode=export' });
  },

  // 跳转到导入
  goToImport() {
    wx.navigateTo({ url: '/pages/import/index?mode=import' });
  },

  // 显示关于
  showAbout() {
    this.setData({ showAboutModal: true });
  },

  // 隐藏关于
  hideAboutModal() {
    this.setData({ showAboutModal: false });
  },

  // 显示反馈
  showFeedback() {
    wx.showModal({
      title: '意见反馈',
      content: '如有问题或建议，请通过小程序客服联系我们',
      showCancel: false
    });
  },

  // 清除缓存
  clearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '清除缓存不会删除数据，确定要清除吗？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorage({
            success: () => {
              this.setData({ cacheSize: '0KB' });
              wx.showToast({ title: '清除成功', icon: 'success' });
            }
          });
        }
      }
    });
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.logout();
          this.setData({
            userInfo: {},
            isLoggedIn: false,
            familyInfo: null
          });
          wx.showToast({ title: '已退出', icon: 'success' });
        }
      }
    });
  },

  // 阻止冒泡
  noop() {}
});

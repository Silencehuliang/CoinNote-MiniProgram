// pages/family/join.js
const app = getApp();

Page({
  data: {
    inviteCode: '',
    familyName: '',
    isLoggedIn: false,
    joining: false
  },

  onLoad(options) {
    if (options.code) {
      this.setData({ inviteCode: options.code });
      this.loadFamilyInfo(options.code);
    }
    
    this.checkLoginStatus();
  },

  // 检查登录状态
  checkLoginStatus() {
    const token = wx.getStorageSync('token');
    this.setData({ isLoggedIn: !!token });
  },

  // 加载家庭信息
  async loadFamilyInfo(code) {
    try {
      const res = await app.request({
        url: `/api/family/invite-info?code=${code}`
      });
      
      if (res.code === 0) {
        this.setData({ familyName: res.data.name });
      }
    } catch (err) {
      console.error('加载家庭信息失败:', err);
    }
  },

  // 登录
  async login() {
    try {
      await app.login();
      this.setData({ isLoggedIn: true });
    } catch (err) {
      console.error('登录失败:', err);
      wx.showToast({ title: '登录失败', icon: 'none' });
    }
  },

  // 加入家庭
  async joinFamily() {
    if (this.data.joining) return;
    
    this.setData({ joining: true });
    
    try {
      const res = await app.request({
        url: '/api/family/join',
        method: 'POST',
        data: { inviteCode: this.data.inviteCode }
      });

      if (res.code === 0) {
        wx.showToast({ title: '加入成功', icon: 'success' });
        
        // 更新用户信息
        app.globalData.userInfo.familyId = res.data.familyId;
        wx.setStorageSync('userInfo', app.globalData.userInfo);
        
        setTimeout(() => {
          wx.switchTab({ url: '/pages/family/index' });
        }, 1500);
      } else {
        wx.showToast({ title: res.message || '加入失败', icon: 'none' });
      }
    } catch (err) {
      console.error('加入失败:', err);
      wx.showToast({ title: '加入失败', icon: 'none' });
    } finally {
      this.setData({ joining: false });
    }
  },

  // 回到首页
  goHome() {
    wx.switchTab({ url: '/pages/index/index' });
  }
});

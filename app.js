// 引入存储管理器
import storageManager from './utils/storage';

App({
  globalData: {
    userInfo: null,
    token: null,
    familyInfo: null,
    loginPromise: null, // 登录Promise，用于等待登录完成
    storageManager: storageManager, // 存储管理器实例
    // 本地开发环境
    baseUrl: 'http://127.0.0.1:8787'
    // 正式环境（部署后替换）
    // baseUrl: 'https://your-domain.com'
  },

  onLaunch() {
    // 初始化网络监听
    storageManager.initNetworkListener(this);
    
    // 启动时自动登录
    this.globalData.loginPromise = this.autoLogin();
    
    // 启动定时同步（每5分钟）
    storageManager.startPeriodicSync(this, 5 * 60 * 1000);
  },

  onUnload() {
    // 停止定时同步
    storageManager.stopPeriodicSync();
  },

  // 自动登录
  async autoLogin() {
    try {
      const token = wx.getStorageSync('token');
      if (token) {
        this.globalData.token = token;
        const userInfo = wx.getStorageSync('userInfo');
        if (userInfo) {
          this.globalData.userInfo = userInfo;
        }
        // 检查session是否有效
        try {
          await wx.checkSession();
          return true;
        } catch (err) {
          // session过期，重新登录
          this.logout();
          return await this.login();
        }
      } else {
        // 没有token，直接登录
        return await this.login();
      }
    } catch (err) {
      console.error('自动登录失败:', err);
      return false;
    }
  },

  // 获取用户信息
  getUserProfile() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.globalData.userInfo = userInfo;
    }
  },

  // 登录
  async login() {
    try {
      // 本地开发环境使用模拟登录
      const isDev = this.globalData.baseUrl.includes('127.0.0.1');
      let res;
      
      if (isDev) {
        // 本地开发：使用模拟登录
        res = await this.request({
          url: '/api/auth/dev-login',
          method: 'POST'
        });
      } else {
        // 正式环境：使用微信登录
        const { code } = await wx.login();
        res = await this.request({
          url: '/api/auth/wx-login',
          method: 'POST',
          data: { code }
        });
      }

      if (res.code === 0) {
        this.globalData.token = res.data.token;
        this.globalData.userInfo = res.data.user;
        wx.setStorageSync('token', res.data.token);
        wx.setStorageSync('userInfo', res.data.user);
        return res.data;
      }
      throw new Error(res.message);
    } catch (err) {
      console.error('登录失败:', err);
      throw err;
    }
  },

  // 登出
  logout() {
    this.globalData.token = null;
    this.globalData.userInfo = null;
    this.globalData.familyInfo = null;
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
  },

  // 通用请求方法
  request(options) {
    return new Promise((resolve, reject) => {
      const { url, method = 'GET', data, header = {} } = options;
      
      if (this.globalData.token) {
        header['Authorization'] = `Bearer ${this.globalData.token}`;
      }

      if (this.globalData.familyInfo) {
        header['X-Family-Id'] = this.globalData.familyInfo.id;
      }

      wx.request({
        url: `${this.globalData.baseUrl}${url}`,
        method,
        data,
        header: {
          'Content-Type': 'application/json',
          ...header
        },
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else if (res.statusCode === 401) {
            // 尝试重新登录
            this.login().then(() => {
              // 重新发起请求
              this.request(options).then(resolve).catch(reject);
            }).catch(() => {
              this.logout();
              reject(new Error('登录失败，请重试'));
            });
          } else {
            reject(new Error(res.data?.message || '请求失败'));
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  }
});

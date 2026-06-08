// 引入存储管理器
import storageManager from './utils/storage';

App({
  globalData: {
    userInfo: null,
    token: null,
    familyInfo: null,
    loginPromise: null, // 登录Promise，用于等待登录完成
    storageManager: storageManager, // 存储管理器实例
    // API 地址（自定义域名）
    baseUrl: 'https://silencehl.eu.org'
    // 本地开发时使用
    // baseUrl: 'http://127.0.0.1:8787'
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
      console.log('autoLogin 开始...');
      const token = wx.getStorageSync('token');
      console.log('本地 token:', token ? '存在' : '不存在');
      
      if (token) {
        this.globalData.token = token;
        const userInfo = wx.getStorageSync('userInfo');
        if (userInfo) {
          this.globalData.userInfo = userInfo;
          console.log('本地 userInfo:', userInfo);
        }
        // 检查session是否有效
        try {
          await wx.checkSession();
          console.log('session 有效，使用缓存登录');
          return true;
        } catch (err) {
          console.log('session 过期，重新登录');
          this.logout();
          return await this.login();
        }
      } else {
        console.log('没有 token，开始登录...');
        return await this.login();
      }
    } catch (err) {
      console.error('自动登录失败:', err);
      wx.showToast({
        title: '网络异常，请稍后重试',
        icon: 'none',
        duration: 3000
      });
      // 登录失败也返回 true，让页面可以加载
      return true;
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
      let res;
      
      // 开发阶段：使用模拟登录（后续配置真实 AppID 后切换为 wx-login）
      // TODO: 上线前改为微信登录
      console.log('开始登录...');
      res = await this.request({
        url: '/api/auth/dev-login',
        method: 'POST',
        timeout: 60000  // 60秒超时
      });

      // 正式环境使用微信登录（取消注释下面的代码）
      // const { code } = await wx.login();
      // res = await this.request({
      //   url: '/api/auth/wx-login',
      //   method: 'POST',
      //   data: { code }
      // });

      if (res.code === 0) {
        this.globalData.token = res.data.token;
        this.globalData.userInfo = res.data.user;
        wx.setStorageSync('token', res.data.token);
        wx.setStorageSync('userInfo', res.data.user);
        console.log('登录成功:', res.data.user);
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

  // 通用请求方法（带重试）
  async request(options, retryCount = 0) {
    const maxRetries = 2;
    const { url, method = 'GET', data, header = {}, timeout = 60000 } = options;
    
    if (this.globalData.token) {
      header['Authorization'] = `Bearer ${this.globalData.token}`;
    }

    if (this.globalData.familyInfo) {
      header['X-Family-Id'] = this.globalData.familyInfo.id;
    }

    const fullUrl = `${this.globalData.baseUrl}${url}`;
    console.log(`请求: ${method} ${fullUrl} (尝试 ${retryCount + 1}/${maxRetries + 1})`);
    
    return new Promise((resolve, reject) => {
      wx.request({
        url: fullUrl,
        method,
        data,
        timeout,
        header: {
          'Content-Type': 'application/json',
          ...header
        },
        success: (res) => {
          console.log(`响应 [${res.statusCode}]:`, res.data);
          if (res.statusCode === 200) {
            resolve(res.data);
          } else if (res.statusCode === 401) {
            console.log('收到 401，尝试重新登录...');
            this.login().then(() => {
              this.request(options).then(resolve).catch(reject);
            }).catch(() => {
              this.logout();
              reject(new Error('登录失败，请重试'));
            });
          } else {
            reject(new Error(res.data?.message || `请求失败: ${res.statusCode}`));
          }
        },
        fail: async (err) => {
          console.error(`请求失败 (尝试 ${retryCount + 1}):`, err);
          
          // 超时或网络错误，尝试重试
          if (retryCount < maxRetries && (err.errMsg?.includes('timeout') || err.errMsg?.includes('fail'))) {
            console.log(`等待 2 秒后重试...`);
            await new Promise(r => setTimeout(r, 2000));
            try {
              const result = await this.request(options, retryCount + 1);
              resolve(result);
            } catch (retryErr) {
              reject(retryErr);
            }
          } else {
            if (err.errMsg?.includes('timeout')) {
              reject(new Error('网络请求超时，请检查网络连接'));
            } else if (err.errMsg?.includes('fail url not in domain list')) {
              reject(new Error('域名未配置'));
            } else {
              reject(new Error(err.errMsg || '网络请求失败'));
            }
          }
        }
      });
    });
  }
});

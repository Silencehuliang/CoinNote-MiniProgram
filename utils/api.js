/**
 * API 请求封装
 */

const app = getApp();

/**
 * 通用请求方法
 * @param {Object} options 请求选项
 * @returns {Promise} Promise对象
 */
function request(options) {
  return new Promise((resolve, reject) => {
    const { url, method = 'GET', data, header = {} } = options;
    
    if (app.globalData.token) {
      header['Authorization'] = `Bearer ${app.globalData.token}`;
    }

    if (app.globalData.familyInfo) {
      header['X-Family-Id'] = app.globalData.familyInfo.id;
    }

    wx.request({
      url: `${app.globalData.baseUrl}${url}`,
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
          app.logout();
          wx.redirectTo({ url: '/pages/index/index' });
          reject(new Error('未授权'));
        } else {
          reject(new Error(res.data.message || '请求失败'));
        }
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
}

/**
 * 上传文件
 * @param {Object} options 上传选项
 * @returns {Promise} Promise对象
 */
function uploadFile(options) {
  return new Promise((resolve, reject) => {
    const { url, filePath, name = 'file', formData = {} } = options;
    
    const header = {};
    if (app.globalData.token) {
      header['Authorization'] = `Bearer ${app.globalData.token}`;
    }

    const uploadTask = wx.uploadFile({
      url: `${app.globalData.baseUrl}${url}`,
      filePath,
      name,
      formData,
      header,
      success: (res) => {
        if (res.statusCode === 200) {
          const data = JSON.parse(res.data);
          resolve(data);
        } else {
          reject(new Error('上传失败'));
        }
      },
      fail: (err) => {
        reject(err);
      }
    });

    // 返回上传任务，支持进度监听
    return uploadTask;
  });
}

/**
 * 下载文件
 * @param {string} url 文件URL
 * @returns {Promise} Promise对象
 */
function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const header = {};
    if (app.globalData.token) {
      header['Authorization'] = `Bearer ${app.globalData.token}`;
    }

    wx.downloadFile({
      url,
      header,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.tempFilePath);
        } else {
          reject(new Error('下载失败'));
        }
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
}

// ==================== 用户相关 API ====================

/**
 * 微信登录
 * @param {string} code 微信登录code
 * @returns {Promise} Promise对象
 */
export function wxLogin(code) {
  return request({
    url: '/api/auth/wx-login',
    method: 'POST',
    data: { code }
  });
}

/**
 * 获取用户信息
 * @returns {Promise} Promise对象
 */
export function getUserProfile() {
  return request({
    url: '/api/user/profile'
  });
}

/**
 * 更新用户信息
 * @param {Object} data 用户信息
 * @returns {Promise} Promise对象
 */
export function updateUserProfile(data) {
  return request({
    url: '/api/user/profile',
    method: 'POST',
    data
  });
}

// ==================== 家庭相关 API ====================

/**
 * 创建家庭
 * @param {string} name 家庭名称
 * @returns {Promise} Promise对象
 */
export function createFamily(name) {
  return request({
    url: '/api/family/create',
    method: 'POST',
    data: { name }
  });
}

/**
 * 加入家庭
 * @param {string} inviteCode 邀请码
 * @returns {Promise} Promise对象
 */
export function joinFamily(inviteCode) {
  return request({
    url: '/api/family/join',
    method: 'POST',
    data: { inviteCode }
  });
}

/**
 * 获取家庭信息
 * @returns {Promise} Promise对象
 */
export function getFamilyInfo() {
  return request({
    url: '/api/family/info'
  });
}

/**
 * 退出家庭
 * @returns {Promise} Promise对象
 */
export function leaveFamily() {
  return request({
    url: '/api/family/leave',
    method: 'POST'
  });
}

/**
 * 刷新邀请码
 * @returns {Promise} Promise对象
 */
export function refreshInviteCode() {
  return request({
    url: '/api/family/refresh-invite-code',
    method: 'POST'
  });
}

// ==================== 分类相关 API ====================

/**
 * 获取分类列表
 * @returns {Promise} Promise对象
 */
export function getCategories() {
  return request({
    url: '/api/categories'
  });
}

/**
 * 创建分类
 * @param {Object} data 分类信息
 * @returns {Promise} Promise对象
 */
export function createCategory(data) {
  return request({
    url: '/api/categories',
    method: 'POST',
    data
  });
}

/**
 * 更新分类
 * @param {string} id 分类ID
 * @param {Object} data 分类信息
 * @returns {Promise} Promise对象
 */
export function updateCategory(id, data) {
  return request({
    url: `/api/categories/${id}`,
    method: 'PUT',
    data
  });
}

/**
 * 删除分类
 * @param {string} id 分类ID
 * @returns {Promise} Promise对象
 */
export function deleteCategory(id) {
  return request({
    url: `/api/categories/${id}`,
    method: 'DELETE'
  });
}

// ==================== 标签相关 API ====================

/**
 * 获取标签列表
 * @returns {Promise} Promise对象
 */
export function getTags() {
  return request({
    url: '/api/tags'
  });
}

/**
 * 创建标签
 * @param {string} name 标签名称
 * @returns {Promise} Promise对象
 */
export function createTag(name) {
  return request({
    url: '/api/tags',
    method: 'POST',
    data: { name }
  });
}

/**
 * 删除标签
 * @param {string} id 标签ID
 * @returns {Promise} Promise对象
 */
export function deleteTag(id) {
  return request({
    url: `/api/tags/${id}`,
    method: 'DELETE'
  });
}

// ==================== 消费记录相关 API ====================

/**
 * 获取消费记录列表
 * @param {Object} params 查询参数
 * @returns {Promise} Promise对象
 */
export function getExpenses(params = {}) {
  return request({
    url: '/api/expenses',
    data: params
  });
}

/**
 * 获取消费记录详情
 * @param {string} id 记录ID
 * @returns {Promise} Promise对象
 */
export function getExpenseDetail(id) {
  return request({
    url: `/api/expenses/${id}`
  });
}

/**
 * 创建消费记录
 * @param {Object} data 消费记录信息
 * @returns {Promise} Promise对象
 */
export function createExpense(data) {
  return request({
    url: '/api/expenses',
    method: 'POST',
    data
  });
}

/**
 * 更新消费记录
 * @param {string} id 记录ID
 * @param {Object} data 消费记录信息
 * @returns {Promise} Promise对象
 */
export function updateExpense(id, data) {
  return request({
    url: `/api/expenses/${id}`,
    method: 'PUT',
    data
  });
}

/**
 * 删除消费记录
 * @param {string} id 记录ID
 * @returns {Promise} Promise对象
 */
export function deleteExpense(id) {
  return request({
    url: `/api/expenses/${id}`,
    method: 'DELETE'
  });
}

// ==================== 统计相关 API ====================

/**
 * 按时间统计
 * @param {Object} params 查询参数
 * @returns {Promise} Promise对象
 */
export function getStatsByTime(params = {}) {
  return request({
    url: '/api/stats/by-time',
    data: params
  });
}

/**
 * 按分类统计
 * @param {Object} params 查询参数
 * @returns {Promise} Promise对象
 */
export function getStatsByCategory(params = {}) {
  return request({
    url: '/api/stats/by-category',
    data: params
  });
}

/**
 * 按用户统计
 * @param {Object} params 查询参数
 * @returns {Promise} Promise对象
 */
export function getStatsByUser(params = {}) {
  return request({
    url: '/api/stats/by-user',
    data: params
  });
}

/**
 * 按标签统计
 * @param {Object} params 查询参数
 * @returns {Promise} Promise对象
 */
export function getStatsByTag(params = {}) {
  return request({
    url: '/api/stats/by-tag',
    data: params
  });
}

// ==================== 导入导出相关 API ====================

/**
 * 下载导入模板
 * @returns {Promise} Promise对象
 */
export function downloadImportTemplate() {
  return downloadFile(`${app.globalData.baseUrl}/api/import/template`);
}

/**
 * 导入消费记录
 * @param {string} filePath 文件路径
 * @param {Object} formData 额外数据
 * @returns {Promise} Promise对象
 */
export function importExpenses(filePath, formData = {}) {
  return uploadFile({
    url: '/api/import/expenses',
    filePath,
    formData
  });
}

/**
 * 导出消费记录
 * @param {Object} params 导出参数
 * @returns {Promise} Promise对象
 */
export function exportExpenses(params = {}) {
  return request({
    url: '/api/export/expenses',
    method: 'POST',
    data: params
  });
}

/**
 * 获取导出历史
 * @returns {Promise} Promise对象
 */
export function getExportHistory() {
  return request({
    url: '/api/export/history'
  });
}

// ==================== 文件上传相关 API ====================

/**
 * 上传图片
 * @param {string} filePath 文件路径
 * @returns {Promise} Promise对象
 */
export function uploadImage(filePath) {
  return uploadFile({
    url: '/api/upload/image',
    filePath,
    name: 'file'
  });
}

export default {
  request,
  uploadFile,
  downloadFile,
  wxLogin,
  getUserProfile,
  updateUserProfile,
  createFamily,
  joinFamily,
  getFamilyInfo,
  leaveFamily,
  refreshInviteCode,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getTags,
  createTag,
  deleteTag,
  getExpenses,
  getExpenseDetail,
  createExpense,
  updateExpense,
  deleteExpense,
  getStatsByTime,
  getStatsByCategory,
  getStatsByUser,
  getStatsByTag,
  downloadImportTemplate,
  importExpenses,
  exportExpenses,
  getExportHistory,
  uploadImage
};

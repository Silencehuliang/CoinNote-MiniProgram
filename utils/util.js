/**
 * 工具函数
 */

/**
 * 格式化日期
 * @param {Date} date 日期对象
 * @param {string} format 格式化模式
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date, format = 'YYYY-MM-DD') {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 格式化金额
 * @param {number} amount 金额
 * @param {number} decimals 小数位数
 * @returns {string} 格式化后的金额字符串
 */
export function formatAmount(amount, decimals = 2) {
  return Number(amount).toFixed(decimals);
}

/**
 * 防抖函数
 * @param {Function} fn 要执行的函数
 * @param {number} delay 延迟时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export function debounce(fn, delay = 300) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

/**
 * 节流函数
 * @param {Function} fn 要执行的函数
 * @param {number} delay 延迟时间（毫秒）
 * @returns {Function} 节流后的函数
 */
export function throttle(fn, delay = 300) {
  let lastTime = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastTime >= delay) {
      lastTime = now;
      fn.apply(this, args);
    }
  };
}

/**
 * 生成唯一ID
 * @returns {string} 唯一ID
 */
export function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 深拷贝
 * @param {*} obj 要拷贝的对象
 * @returns {*} 拷贝后的对象
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (obj instanceof Object) {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
}

/**
 * 获取相对时间描述
 * @param {Date|string|number} date 日期
 * @returns {string} 相对时间描述
 */
export function getRelativeTime(date) {
  const now = new Date();
  const target = new Date(date);
  const diff = now - target;
  
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const month = 30 * day;
  
  if (diff < minute) {
    return '刚刚';
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`;
  } else if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`;
  } else if (diff < month) {
    return `${Math.floor(diff / day)}天前`;
  } else {
    return formatDate(target, 'MM-DD');
  }
}

/**
 * 获取本周日期范围
 * @returns {Object} { startDate, endDate }
 */
export function getWeekRange() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - dayOfWeek + 1);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  
  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate)
  };
}

/**
 * 获取本月日期范围
 * @returns {Object} { startDate, endDate }
 */
export function getMonthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const lastDay = new Date(year, month, 0).getDate();
  
  return {
    startDate: `${year}-${String(month).padStart(2, '0')}-01`,
    endDate: `${year}-${String(month).padStart(2, '0')}-${lastDay}`
  };
}

/**
 * 获取本年日期范围
 * @returns {Object} { startDate, endDate }
 */
export function getYearRange() {
  const year = new Date().getFullYear();
  
  return {
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`
  };
}

/**
 * 格式化文件大小
 * @param {number} bytes 字节数
 * @returns {string} 格式化后的文件大小
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * 复制到剪贴板
 * @param {string} text 要复制的文本
 * @returns {Promise} Promise对象
 */
export function copyToClipboard(text) {
  return new Promise((resolve, reject) => {
    wx.setClipboardData({
      data: text,
      success: () => resolve(),
      fail: (err) => reject(err)
    });
  });
}

/**
 * 显示确认对话框
 * @param {string} title 标题
 * @param {string} content 内容
 * @returns {Promise<boolean>} 是否确认
 */
export function showConfirm(title, content) {
  return new Promise((resolve) => {
    wx.showModal({
      title,
      content,
      success: (res) => {
        resolve(res.confirm);
      }
    });
  });
}

/**
 * 显示加载提示
 * @param {string} title 提示文本
 */
export function showLoading(title = '加载中...') {
  wx.showLoading({ title, mask: true });
}

/**
 * 隐藏加载提示
 */
export function hideLoading() {
  wx.hideLoading();
}

/**
 * 显示成功提示
 * @param {string} title 提示文本
 */
export function showSuccess(title) {
  wx.showToast({ title, icon: 'success' });
}

/**
 * 显示错误提示
 * @param {string} title 提示文本
 */
export function showError(title) {
  wx.showToast({ title, icon: 'none' });
}

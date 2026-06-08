/**
 * 本地存储管理 - 离线优先架构
 * 
 * 设计原则：
 * 1. 静态数据（分类、标签）启动时校验版本，有变化才同步
 * 2. 动态数据（消费记录）本地优先，后台静默同步
 * 3. 离线操作记录队列，联网后自动重放
 */

const CACHE_KEYS = {
  CATEGORIES: 'cache_categories',
  TAGS: 'cache_tags',
  CATEGORIES_VERSION: 'cache_categories_version',
  TAGS_VERSION: 'cache_tags_version',
  LAST_SYNC: 'cache_last_sync',
  PENDING_OPERATIONS: 'cache_pending_ops',
  USER_INFO: 'cache_user_info',
  FAMILY_INFO: 'cache_family_info',
};

// 缓存过期时间（毫秒）
const CACHE_EXPIRE = {
  CATEGORIES: 7 * 24 * 60 * 60 * 1000,  // 7天
  TAGS: 7 * 24 * 60 * 60 * 1000,         // 7天
  SYNC_CHECK: 5 * 60 * 1000,             // 5分钟检查一次同步
};

/**
 * 本地存储管理器
 */
class StorageManager {
  constructor() {
    this.isOnline = true;
    this.syncTimer = null;
    this.pendingCallbacks = [];
  }

  // ==================== 基础存储操作 ====================

  /**
   * 设置存储
   */
  set(key, data) {
    try {
      wx.setStorageSync(key, {
        data,
        timestamp: Date.now(),
      });
      return true;
    } catch (err) {
      console.error('存储失败:', key, err);
      return false;
    }
  }

  /**
   * 获取存储
   */
  get(key) {
    try {
      const result = wx.getStorageSync(key);
      return result?.data || null;
    } catch (err) {
      console.error('读取存储失败:', key, err);
      return null;
    }
  }

  /**
   * 获取带过期时间的存储
   */
  getWithExpire(key, expireTime) {
    try {
      const result = wx.getStorageSync(key);
      if (!result) return null;
      
      const { data, timestamp } = result;
      if (Date.now() - timestamp > expireTime) {
        // 已过期
        return null;
      }
      return data;
    } catch (err) {
      return null;
    }
  }

  /**
   * 删除存储
   */
  remove(key) {
    try {
      wx.removeStorageSync(key);
      return true;
    } catch (err) {
      return false;
    }
  }

  // ==================== 分类数据管理 ====================

  /**
   * 获取分类（优先从缓存）
   */
  async getCategories(app) {
    // 1. 先从缓存读取
    let categories = this.get(CACHE_KEYS.CATEGORIES);
    
    if (categories) {
      // 2. 后台检查更新
      this.checkCategoriesUpdate(app);
      return categories;
    }

    // 3. 缓存没有，从服务器获取
    try {
      const res = await app.request({ url: '/api/categories' });
      if (res.code === 0) {
        categories = res.data;
        this.set(CACHE_KEYS.CATEGORIES, categories);
        
        // 保存版本号
        if (res.version) {
          this.set(CACHE_KEYS.CATEGORIES_VERSION, res.version);
        }
      }
    } catch (err) {
      console.error('获取分类失败:', err);
    }

    return categories || [];
  }

  /**
   * 后台检查分类更新
   */
  async checkCategoriesUpdate(app) {
    try {
      const localVersion = this.get(CACHE_KEYS.CATEGORIES_VERSION) || 0;
      const res = await app.request({
        url: '/api/categories/version',
        data: { version: localVersion }
      });

      if (res.code === 0 && res.needUpdate) {
        // 有更新，同步新数据
        const categoriesRes = await app.request({ url: '/api/categories' });
        if (categoriesRes.code === 0) {
          this.set(CACHE_KEYS.CATEGORIES, categoriesRes.data);
          if (categoriesRes.version) {
            this.set(CACHE_KEYS.CATEGORIES_VERSION, categoriesRes.version);
          }
          console.log('分类数据已更新');
        }
      }
    } catch (err) {
      // 静默失败，不影响用户体验
      console.log('检查分类更新失败:', err);
    }
  }

  // ==================== 标签数据管理 ====================

  /**
   * 获取标签（优先从缓存）
   */
  async getTags(app) {
    let tags = this.get(CACHE_KEYS.TAGS);
    
    if (tags) {
      this.checkTagsUpdate(app);
      return tags;
    }

    try {
      const res = await app.request({ url: '/api/tags' });
      if (res.code === 0) {
        tags = res.data;
        this.set(CACHE_KEYS.TAGS, tags);
        if (res.version) {
          this.set(CACHE_KEYS.TAGS_VERSION, res.version);
        }
      }
    } catch (err) {
      console.error('获取标签失败:', err);
    }

    return tags || [];
  }

  /**
   * 后台检查标签更新
   */
  async checkTagsUpdate(app) {
    try {
      const localVersion = this.get(CACHE_KEYS.TAGS_VERSION) || 0;
      const res = await app.request({
        url: '/api/tags/version',
        data: { version: localVersion }
      });

      if (res.code === 0 && res.needUpdate) {
        const tagsRes = await app.request({ url: '/api/tags' });
        if (tagsRes.code === 0) {
          this.set(CACHE_KEYS.TAGS, tagsRes.data);
          if (tagsRes.version) {
            this.set(CACHE_KEYS.TAGS_VERSION, tagsRes.version);
          }
          console.log('标签数据已更新');
        }
      }
    } catch (err) {
      console.log('检查标签更新失败:', err);
    }
  }

  // ==================== 消费记录管理（离线优先） ====================

  /**
   * 保存消费记录（本地优先）
   */
  async saveExpense(app, expenseData) {
    const expenseId = this.generateId();
    const expense = {
      ...expenseData,
      id: expenseId,
      createdAt: new Date().toISOString(),
      synced: false,  // 标记未同步
    };

    // 1. 先保存到本地
    const localExpenses = this.get('local_expenses') || [];
    localExpenses.unshift(expense);
    this.set('local_expenses', localExpenses);

    // 2. 添加到待同步队列
    this.addPendingOperation({
      type: 'CREATE_EXPENSE',
      data: expense,
      timestamp: Date.now(),
    });

    // 3. 尝试立即同步（如果在线）
    this.trySync(app);

    return expense;
  }

  /**
   * 获取消费记录列表
   */
  async getExpenses(app, params = {}) {
    // 1. 获取本地记录
    let localExpenses = this.get('local_expenses') || [];
    
    // 2. 根据参数过滤
    if (params.startDate) {
      localExpenses = localExpenses.filter(e => e.date >= params.startDate);
    }
    if (params.endDate) {
      localExpenses = localExpenses.filter(e => e.date <= params.endDate);
    }
    if (params.categoryId) {
      localExpenses = localExpenses.filter(e => e.categoryId === params.categoryId);
    }

    // 3. 按日期排序
    localExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));

    // 4. 分页
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const start = (page - 1) * pageSize;
    const list = localExpenses.slice(start, start + pageSize);

    // 5. 后台同步服务器数据
    this.syncExpensesFromServer(app, params);

    return {
      list,
      total: localExpenses.length,
      page,
      pageSize,
    };
  }

  /**
   * 从服务器同步消费记录
   */
  async syncExpensesFromServer(app, params) {
    try {
      const lastSync = this.get('last_expense_sync') || '1970-01-01';
      const res = await app.request({
        url: '/api/expenses/sync',
        data: {
          ...params,
          since: lastSync,
        }
      });

      if (res.code === 0 && res.data.updates.length > 0) {
        const localExpenses = this.get('local_expenses') || [];
        
        // 合并服务器数据
        res.data.updates.forEach(serverExpense => {
          const localIndex = localExpenses.findIndex(e => e.id === serverExpense.id);
          if (localIndex === -1) {
            // 新记录
            localExpenses.push({ ...serverExpense, synced: true });
          } else if (new Date(serverExpense.updatedAt) > new Date(localExpenses[localIndex].updatedAt)) {
            // 服务器版本更新
            localExpenses[localIndex] = { ...serverExpense, synced: true };
          }
        });

        // 处理删除的记录
        if (res.data.deletes) {
          res.data.deletes.forEach(deleteId => {
            const index = localExpenses.findIndex(e => e.id === deleteId);
            if (index !== -1) {
              localExpenses.splice(index, 1);
            }
          });
        }

        this.set('local_expenses', localExpenses);
        this.set('last_expense_sync', new Date().toISOString());
      }
    } catch (err) {
      console.log('同步消费记录失败:', err);
    }
  }

  // ==================== 离线操作队列 ====================

  /**
   * 添加待同步操作
   */
  addPendingOperation(operation) {
    const pending = this.get(CACHE_KEYS.PENDING_OPERATIONS) || [];
    pending.push(operation);
    this.set(CACHE_KEYS.PENDING_OPERATIONS, pending);
  }

  /**
   * 尝试同步待处理操作
   */
  async trySync(app) {
    if (!this.isOnline) return;

    const pending = this.get(CACHE_KEYS.PENDING_OPERATIONS) || [];
    if (pending.length === 0) return;

    const successIds = [];
    const failOps = [];

    for (const op of pending) {
      try {
        let success = false;
        
        switch (op.type) {
          case 'CREATE_EXPENSE':
            const createRes = await app.request({
              url: '/api/expenses',
              method: 'POST',
              data: op.data,
            });
            success = createRes.code === 0;
            
            if (success && createRes.data?.id) {
              // 更新本地记录的ID和同步状态
              this.updateLocalExpenseId(op.data.id, createRes.data.id);
            }
            break;

          case 'UPDATE_EXPENSE':
            const updateRes = await app.request({
              url: `/api/expenses/${op.data.id}`,
              method: 'PUT',
              data: op.data,
            });
            success = updateRes.code === 0;
            break;

          case 'DELETE_EXPENSE':
            const deleteRes = await app.request({
              url: `/api/expenses/${op.data.id}`,
              method: 'DELETE',
            });
            success = deleteRes.code === 0;
            break;
        }

        if (success) {
          successIds.push(op.timestamp);
        } else {
          failOps.push(op);
        }
      } catch (err) {
        failOps.push(op);
      }
    }

    // 更新待同步队列（只保留失败的操作）
    this.set(CACHE_KEYS.PENDING_OPERATIONS, failOps);

    // 标记已同步的本地记录
    if (successIds.length > 0) {
      this.markExpensesSynced(successIds);
    }
  }

  /**
   * 更新本地消费记录ID（服务器返回真实ID）
   */
  updateLocalExpenseId(oldId, newId) {
    const expenses = this.get('local_expenses') || [];
    const index = expenses.findIndex(e => e.id === oldId);
    if (index !== -1) {
      expenses[index].id = newId;
      expenses[index].synced = true;
      this.set('local_expenses', expenses);
    }
  }

  /**
   * 标记消费记录已同步
   */
  markExpensesSynced(timestamps) {
    const expenses = this.get('local_expenses') || [];
    expenses.forEach(expense => {
      if (timestamps.includes(expense.createdAt)) {
        expense.synced = true;
      }
    });
    this.set('local_expenses', expenses);
  }

  // ==================== 网络状态监听 ====================

  /**
   * 初始化网络监听
   */
  initNetworkListener(app) {
    wx.onNetworkStatusChange((res) => {
      this.isOnline = res.isConnected;
      
      if (res.isConnected) {
        console.log('网络已连接，开始同步...');
        this.trySync(app);
      } else {
        console.log('网络已断开，进入离线模式');
      }
    });

    // 检查当前网络状态
    wx.getNetworkType({
      success: (res) => {
        this.isOnline = res.networkType !== 'none';
      }
    });
  }

  /**
   * 启动定时同步
   */
  startPeriodicSync(app, interval = 5 * 60 * 1000) {
    this.syncTimer = setInterval(() => {
      if (this.isOnline) {
        this.trySync(app);
      }
    }, interval);
  }

  /**
   * 停止定时同步
   */
  stopPeriodicSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  // ==================== 工具方法 ====================

  /**
   * 生成唯一ID
   */
  generateId() {
    return 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * 获取缓存大小
   */
  getCacheSize() {
    try {
      const res = wx.getStorageInfoSync();
      return res.currentSize; // KB
    } catch (err) {
      return 0;
    }
  }

  /**
   * 清除所有缓存
   */
  clearAll() {
    Object.values(CACHE_KEYS).forEach(key => {
      this.remove(key);
    });
    this.remove('local_expenses');
    this.remove('last_expense_sync');
  }

  /**
   * 获取同步状态
   */
  getSyncStatus() {
    const pending = this.get(CACHE_KEYS.PENDING_OPERATIONS) || [];
    const lastSync = this.get('last_expense_sync');
    
    return {
      isOnline: this.isOnline,
      pendingCount: pending.length,
      lastSync: lastSync,
    };
  }
}

// 创建单例
const storageManager = new StorageManager();

export default storageManager;
export { CACHE_KEYS, CACHE_EXPIRE };

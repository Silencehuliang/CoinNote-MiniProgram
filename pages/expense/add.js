// pages/expense/add.js
const app = getApp();
const storageManager = app.globalData.storageManager;

Page({
  data: {
    amount: '',
    date: '',
    description: '',
    categories: [],
    subCategories: [],
    tags: [],
    familyMembers: [],
    selectedCategory: '',
    selectedSubCategory: '',
    selectedMember: '',
    selectedTags: [],
    canSave: false,
    autoFocus: true,
    showKeyboard: false
  },

  async onLoad() {
    this.initDate();
    // 等待登录完成
    if (app.globalData.loginPromise) {
      await app.globalData.loginPromise;
    }
    this.loadCategories();
    this.loadTags();
    this.loadFamilyMembers();
  },

  // 初始化日期
  initDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    this.setData({ date: `${year}-${month}-${day}` });
  },

  // 加载分类（使用缓存）
  async loadCategories() {
    try {
      const categories = await storageManager.getCategories(app);
      this.setData({ categories });
    } catch (err) {
      console.error('加载分类失败:', err);
    }
  },

  // 加载标签（使用缓存）
  async loadTags() {
    try {
      const tags = await storageManager.getTags(app);
      this.setData({ tags: tags.map(tag => ({ ...tag, selected: false })) });
    } catch (err) {
      console.error('加载标签失败:', err);
    }
  },

  // 加载家庭成员
  async loadFamilyMembers() {
    const userInfo = app.globalData.userInfo;
    if (!userInfo || !userInfo.familyId) return;

    try {
      const res = await app.request({ url: '/api/family/info' });
      if (res.code === 0) {
        this.setData({
          familyMembers: res.data.members,
          selectedMember: userInfo.id
        });
      }
    } catch (err) {
      console.error('加载家庭成员失败:', err);
    }
  },

  // 选择分类
  selectCategory(e) {
    const id = e.currentTarget.dataset.id;
    const category = this.data.categories.find(c => c.id === id);
    const subCategories = category ? category.children || [] : [];
    
    this.setData({
      selectedCategory: id,
      subCategories,
      selectedSubCategory: ''
    });
    this.checkCanSave();
  },

  // 选择二级分类
  selectSubCategory(e) {
    this.setData({
      selectedSubCategory: e.currentTarget.dataset.id
    });
    this.checkCanSave();
  },

  // 日期变化
  onDateChange(e) {
    this.setData({ date: e.detail.value });
  },

  // 金额输入
  onAmountInput(e) {
    let value = e.detail.value;
    // 限制小数点后两位
    if (value.includes('.')) {
      const parts = value.split('.');
      if (parts[1].length > 2) {
        value = parts[0] + '.' + parts[1].substring(0, 2);
      }
    }
    this.setData({ amount: value });
    this.checkCanSave();
  },

  // 备注输入
  onDescInput(e) {
    this.setData({ description: e.detail.value });
  },

  // 切换标签
  toggleTag(e) {
    const index = e.currentTarget.dataset.index;
    const tags = [...this.data.tags];
    tags[index].selected = !tags[index].selected;
    this.setData({ tags });
  },

  // 选择家庭成员
  selectMember(e) {
    this.setData({ selectedMember: e.currentTarget.dataset.id });
  },

  // 检查是否可以保存
  checkCanSave() {
    const { amount, selectedCategory } = this.data;
    this.setData({
      canSave: amount && parseFloat(amount) > 0 && selectedCategory
    });
  },

  // 显示键盘
  showKeyboard() {
    this.setData({ showKeyboard: true });
  },

  // 隐藏键盘
  hideKeyboard() {
    this.setData({ showKeyboard: false });
  },

  // 输入按键
  inputKey(e) {
    const key = e.currentTarget.dataset.key;
    let { amount } = this.data;
    
    if (key === '.') {
      if (amount.includes('.')) return;
      amount = amount || '0';
    }
    
    if (key === '0' && amount === '0') return;
    
    amount = amount + key;
    this.setData({ amount });
    this.checkCanSave();
  },

  // 删除按键
  deleteKey() {
    let { amount } = this.data;
    amount = amount.slice(0, -1);
    this.setData({ amount });
    this.checkCanSave();
  },

  // 确认金额
  confirmAmount() {
    this.hideKeyboard();
    this.checkCanSave();
  },

  // 保存消费记录（离线优先）
  async saveExpense() {
    if (!this.data.canSave) return;

    const {
      amount, date, description,
      selectedCategory, selectedSubCategory,
      selectedMember, tags
    } = this.data;

    const selectedTags = tags.filter(t => t.selected).map(t => t.id);

    try {
      // 使用存储管理器保存（离线优先）
      const expenseData = {
        amount: parseFloat(amount),
        categoryId: selectedCategory,
        subCategoryId: selectedSubCategory,
        description,
        date,
        userId: selectedMember || app.globalData.userInfo.id,
        tags: selectedTags
      };

      const result = await storageManager.saveExpense(app, expenseData);

      if (result) {
        app.globalData.needRefresh = true;
        
        // 检查是否已同步
        const syncStatus = storageManager.getSyncStatus();
        if (syncStatus.pendingCount > 0) {
          wx.showToast({
            title: '已保存，待同步',
            icon: 'success'
          });
        } else {
          wx.showToast({
            title: '保存成功',
            icon: 'success'
          });
        }
        
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        });
      }
    } catch (err) {
      console.error('保存失败:', err);
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
    }
  },

  // 跳转到标签管理
  goToManageTag() {
    wx.navigateTo({ url: '/pages/category/index?mode=tag' });
  },

  // 阻止冒泡
  noop() {}
});

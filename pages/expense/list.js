// pages/expense/list.js
const app = getApp();

Page({
  data: {
    expenseList: [],
    loading: false,
    noMore: false,
    page: 1,
    pageSize: 20,
    startDate: '',
    endDate: '',
    dateRangeText: '全部',
    selectedCategory: '',
    selectedCategoryName: '',
    selectedTag: '',
    selectedTagName: '',
    selectedUser: '',
    selectedUserName: '',
    hasFilter: false,
    showDatePickerModal: false,
    showCategoryModal: false,
    showTagModal: false,
    showUserModal: false,
    categories: [],
    tags: [],
    familyMembers: []
  },

  async onLoad() {
    this.initDate();
    // 等待登录完成
    if (app.globalData.loginPromise) {
      await app.globalData.loginPromise;
    }
    this.loadFilterData();
    this.loadExpenses();
  },

  onShow() {
    if (app.globalData.needRefresh) {
      app.globalData.needRefresh = false;
      this.refreshData();
    }
  },

  onReachBottom() {
    if (!this.data.noMore && !this.data.loading) {
      this.loadMore();
    }
  },

  // 初始化日期
  initDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
    
    this.setData({
      startDate,
      endDate
    });
  },

  // 加载筛选数据
  async loadFilterData() {
    try {
      // 加载分类
      const categoryRes = await app.request({ url: '/api/categories' });
      if (categoryRes.code === 0) {
        this.setData({ categories: categoryRes.data });
      }

      // 加载标签
      const tagRes = await app.request({ url: '/api/tags' });
      if (tagRes.code === 0) {
        this.setData({ tags: tagRes.data });
      }

      // 加载家庭成员
      const userInfo = app.globalData.userInfo;
      if (userInfo && userInfo.familyId) {
        const familyRes = await app.request({ url: '/api/family/info' });
        if (familyRes.code === 0) {
          this.setData({ familyMembers: familyRes.data.members });
        }
      }
    } catch (err) {
      console.error('加载筛选数据失败:', err);
    }
  },

  // 加载消费记录
  async loadExpenses() {
    if (this.data.loading) return;
    
    this.setData({ loading: true });
    
    try {
      const { startDate, endDate, selectedCategory, selectedTag, selectedUser, page, pageSize } = this.data;
      
      const params = {
        page,
        pageSize
      };
      
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (selectedCategory) params.categoryId = selectedCategory;
      if (selectedTag) params.tagId = selectedTag;
      if (selectedUser) params.userId = selectedUser;
      
      const res = await app.request({
        url: '/api/expenses',
        data: params
      });

      if (res.code === 0) {
        const { list, total } = res.data;
        
        // 按日期分组
        const grouped = this.groupByDate(list);
        
        this.setData({
          expenseList: page === 1 ? grouped : [...this.data.expenseList, ...grouped],
          noMore: list.length < pageSize
        });
      }
    } catch (err) {
      console.error('加载失败:', err);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 按日期分组
  groupByDate(list) {
    const groups = {};
    
    list.forEach(item => {
      const date = item.date.split('T')[0];
      if (!groups[date]) {
        groups[date] = {
          date: this.formatDate(date),
          expenses: [],
          total: 0
        };
      }
      groups[date].expenses.push(item);
      groups[date].total += item.amount;
    });
    
    return Object.values(groups).map(group => ({
      ...group,
      total: group.total.toFixed(2)
    }));
  },

  // 格式化日期
  formatDate(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (dateStr === today.toISOString().split('T')[0]) {
      return '今天';
    } else if (dateStr === yesterday.toISOString().split('T')[0]) {
      return '昨天';
    } else {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
      const weekDay = weekDays[date.getDay()];
      return `${month}月${day}日 周${weekDay}`;
    }
  },

  // 刷新数据
  refreshData() {
    this.setData({ page: 1, noMore: false });
    return this.loadExpenses();
  },

  // 加载更多
  loadMore() {
    this.setData({ page: this.data.page + 1 });
    this.loadExpenses();
  },

  // 显示日期选择器
  showDatePicker() {
    this.setData({ showDatePickerModal: true });
  },

  // 隐藏日期选择器
  hideDatePicker() {
    this.setData({ showDatePickerModal: false });
  },

  // 开始日期变化
  onStartDateChange(e) {
    this.setData({ startDate: e.detail.value });
  },

  // 结束日期变化
  onEndDateChange(e) {
    this.setData({ endDate: e.detail.value });
  },

  // 设置快捷日期
  setQuickDate(e) {
    const range = e.currentTarget.dataset.range;
    const now = new Date();
    let startDate, endDate;
    
    switch (range) {
      case 'today':
        startDate = endDate = now.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() + 1);
        startDate = weekStart.toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
        break;
      case 'month':
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        endDate = now.toISOString().split('T')[0];
        break;
      case 'year':
        startDate = `${now.getFullYear()}-01-01`;
        endDate = now.toISOString().split('T')[0];
        break;
    }
    
    this.setData({ startDate, endDate });
  },

  // 确认日期选择
  confirmDate() {
    const { startDate, endDate } = this.data;
    let dateRangeText = '全部';
    
    if (startDate && endDate) {
      dateRangeText = `${startDate} 至 ${endDate}`;
    }
    
    this.setData({
      dateRangeText,
      showDatePickerModal: false,
      page: 1,
      noMore: false
    });
    
    this.loadExpenses();
    this.checkHasFilter();
  },

  // 显示分类选择器
  showCategoryPicker() {
    this.setData({ showCategoryModal: true });
  },

  // 隐藏分类选择器
  hideCategoryPicker() {
    this.setData({ showCategoryModal: false });
  },

  // 选择分类
  selectCategory(e) {
    const id = e.currentTarget.dataset.id;
    let selectedCategoryName = '';
    
    if (id) {
      const category = this.data.categories.find(c => c.id === id);
      selectedCategoryName = category ? category.name : '';
    }
    
    this.setData({
      selectedCategory: id,
      selectedCategoryName,
      showCategoryModal: false,
      page: 1,
      noMore: false
    });
    
    this.loadExpenses();
    this.checkHasFilter();
  },

  // 显示标签选择器
  showTagPicker() {
    this.setData({ showTagModal: true });
  },

  // 隐藏标签选择器
  hideTagPicker() {
    this.setData({ showTagModal: false });
  },

  // 选择标签
  selectTag(e) {
    const id = e.currentTarget.dataset.id;
    let selectedTagName = '';
    
    if (id) {
      const tag = this.data.tags.find(t => t.id === id);
      selectedTagName = tag ? tag.name : '';
    }
    
    this.setData({
      selectedTag: id,
      selectedTagName,
      showTagModal: false,
      page: 1,
      noMore: false
    });
    
    this.loadExpenses();
    this.checkHasFilter();
  },

  // 显示成员选择器
  showUserPicker() {
    this.setData({ showUserModal: true });
  },

  // 隐藏成员选择器
  hideUserPicker() {
    this.setData({ showUserModal: false });
  },

  // 选择成员
  selectUser(e) {
    const id = e.currentTarget.dataset.id;
    let selectedUserName = '';
    
    if (id) {
      const member = this.data.familyMembers.find(m => m.id === id);
      selectedUserName = member ? member.nickname : '';
    }
    
    this.setData({
      selectedUser: id,
      selectedUserName,
      showUserModal: false,
      page: 1,
      noMore: false
    });
    
    this.loadExpenses();
    this.checkHasFilter();
  },

  // 检查是否有筛选条件
  checkHasFilter() {
    const { startDate, endDate, selectedCategory, selectedTag, selectedUser } = this.data;
    this.setData({
      hasFilter: !!(startDate || endDate || selectedCategory || selectedTag || selectedUser)
    });
  },

  // 清除筛选
  clearFilter() {
    this.initDate();
    this.setData({
      selectedCategory: '',
      selectedCategoryName: '',
      selectedTag: '',
      selectedTagName: '',
      selectedUser: '',
      selectedUserName: '',
      dateRangeText: '全部',
      hasFilter: false,
      page: 1,
      noMore: false
    });
    
    this.loadExpenses();
  },

  // 跳转到详情
  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/expense/detail?id=${id}` });
  },

  // 阻止冒泡
  noop() {}
});

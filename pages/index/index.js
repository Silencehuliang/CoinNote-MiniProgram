// pages/index/index.js
const app = getApp();

Page({
  data: {
    currentMonth: '',
    selectedYear: '',
    selectedMonth: '',
    years: [],
    months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    showPicker: false,
    expenseList: [],
    monthExpense: '0.00',
    monthCount: 0,
    loading: false,
    noMore: false,
    page: 1,
    pageSize: 20
  },

  async onLoad() {
    this.initDate();
    // 等待登录完成后再加载数据
    if (app.globalData.loginPromise) {
      await app.globalData.loginPromise;
    }
    this.loadExpenses();
  },

  onShow() {
    // 从添加页面返回时刷新
    if (app.globalData.needRefresh) {
      app.globalData.needRefresh = false;
      this.refreshData();
    }
  },

  onPullDownRefresh() {
    this.refreshData().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (!this.data.noMore && !this.data.loading) {
      this.loadMore();
    }
  },

  // 初始化日期
  initDate() {
    const now = new Date();
    const years = [];
    for (let i = now.getFullYear(); i >= now.getFullYear() - 5; i--) {
      years.push(i);
    }
    
    this.setData({
      currentMonth: now.getMonth() + 1,
      selectedYear: now.getFullYear(),
      selectedMonth: now.getMonth() + 1,
      years
    });
  },

  // 加载消费记录
  async loadExpenses() {
    if (this.data.loading) return;
    
    this.setData({ loading: true });
    console.log('开始加载消费记录...');
    console.log('当前 token:', app.globalData.token ? '存在' : '不存在');
    console.log('当前 userInfo:', app.globalData.userInfo);
    
    try {
      const { selectedYear, selectedMonth, page, pageSize } = this.data;
      const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const endDate = new Date(selectedYear, selectedMonth, 0);
      const endDateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${endDate.getDate()}`;
      
      console.log('请求参数:', { startDate, endDate: endDateStr, page, pageSize });
      
      const res = await app.request({
        url: '/api/expenses',
        data: {
          startDate,
          endDate: endDateStr,
          page,
          pageSize
        }
      });

      console.log('消费记录响应:', res);

      if (res.code === 0) {
        const { list, total } = res.data;
        
        // 按日期分组
        const grouped = this.groupByDate(list);
        
        // 计算月度统计
        const monthExpense = list.reduce((sum, item) => sum + item.amount, 0).toFixed(2);
        
        this.setData({
          expenseList: page === 1 ? grouped : [...this.data.expenseList, ...grouped],
          monthExpense,
          monthCount: total,
          noMore: list.length < pageSize
        });
        
        console.log('加载完成，记录数:', total);
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

  // 显示月份选择器
  showMonthPicker() {
    this.setData({ showPicker: true });
  },

  // 隐藏月份选择器
  hideMonthPicker() {
    this.setData({ showPicker: false });
  },

  // 选择年份
  selectYear(e) {
    this.setData({ selectedYear: e.currentTarget.dataset.year });
  },

  // 选择月份
  selectMonth(e) {
    this.setData({ selectedMonth: e.currentTarget.dataset.month });
  },

  // 确认月份选择
  confirmMonth() {
    this.setData({
      currentMonth: this.data.selectedMonth,
      showPicker: false
    });
    this.refreshData();
  },

  // 跳转到添加页面
  goToAdd() {
    wx.navigateTo({ url: '/pages/expense/add' });
  },

  // 跳转到详情页面
  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/expense/detail?id=${id}` });
  },

  // 跳转到导入页面
  goToImport() {
    wx.navigateTo({ url: '/pages/import/index' });
  },

  // 阻止冒泡
  noop() {}
});

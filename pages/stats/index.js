// pages/stats/index.js
const app = getApp();

Page({
  data: {
    timeRange: 'month',
    displayTime: '',
    startDate: '',
    endDate: '',
    totalAmount: '0.00',
    totalCount: 0,
    dailyAvg: '0.00',
    dimension: 'category',
    categoryStats: [],
    userStats: [],
    tagStats: [],
    timeStats: [],
    showPicker: false,
    pickerValue: [0, 0],
    years: [],
    months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  },

  async onLoad() {
    this.initDate();
    // 等待登录完成
    if (app.globalData.loginPromise) {
      await app.globalData.loginPromise;
    }
    this.loadStats();
  },

  onShow() {
    if (app.globalData.needRefresh) {
      app.globalData.needRefresh = false;
      this.loadStats();
    }
  },

  // 初始化日期
  initDate() {
    const now = new Date();
    const years = [];
    for (let i = now.getFullYear(); i >= now.getFullYear() - 5; i--) {
      years.push(i);
    }

    const month = now.getMonth() + 1;
    this.setData({
      years,
      displayTime: `${now.getFullYear()}年${month}月`,
      startDate: `${now.getFullYear()}-${String(month).padStart(2, '0')}-01`,
      endDate: this.getLastDayOfMonth(now.getFullYear(), month),
      pickerValue: [0, month - 1]
    });
  },

  // 获取月末日期
  getLastDayOfMonth(year, month) {
    const date = new Date(year, month, 0);
    return `${year}-${String(month).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  },

  // 设置时间范围
  setTimeRange(e) {
    const range = e.currentTarget.dataset.range;
    const now = new Date();
    
    if (range === 'month') {
      const month = now.getMonth() + 1;
      this.setData({
        timeRange: range,
        displayTime: `${now.getFullYear()}年${month}月`,
        startDate: `${now.getFullYear()}-${String(month).padStart(2, '0')}-01`,
        endDate: this.getLastDayOfMonth(now.getFullYear(), month)
      });
    } else if (range === 'year') {
      this.setData({
        timeRange: range,
        displayTime: `${now.getFullYear()}年`,
        startDate: `${now.getFullYear()}-01-01`,
        endDate: `${now.getFullYear()}-12-31`
      });
    } else {
      this.setData({ timeRange: range });
      this.showDatePicker();
      return;
    }
    
    this.loadStats();
  },

  // 显示日期选择器
  showDatePicker() {
    this.setData({ showPicker: true });
  },

  // 隐藏日期选择器
  hideDatePicker() {
    this.setData({ showPicker: false });
  },

  // 选择器变化
  onPickerChange(e) {
    this.setData({ pickerValue: e.detail.value });
  },

  // 开始日期变化
  onStartDateChange(e) {
    this.setData({ startDate: e.detail.value });
  },

  // 结束日期变化
  onEndDateChange(e) {
    this.setData({ endDate: e.detail.value });
  },

  // 确认日期
  confirmDate() {
    const { timeRange, pickerValue, years, months, startDate, endDate } = this.data;
    
    if (timeRange === 'month') {
      const year = years[pickerValue[0]];
      const month = months[pickerValue[1]];
      this.setData({
        displayTime: `${year}年${month}月`,
        startDate: `${year}-${String(month).padStart(2, '0')}-01`,
        endDate: this.getLastDayOfMonth(year, month),
        showPicker: false
      });
    } else {
      this.setData({
        displayTime: `${startDate} 至 ${endDate}`,
        showPicker: false
      });
    }
    
    this.loadStats();
  },

  // 设置统计维度
  setDimension(e) {
    const dim = e.currentTarget.dataset.dim;
    this.setData({ dimension: dim });
    
    // 根据维度加载对应数据
    switch (dim) {
      case 'category':
        this.loadCategoryStats();
        break;
      case 'user':
        this.loadUserStats();
        break;
      case 'tag':
        this.loadTagStats();
        break;
      case 'time':
        this.loadTimeStats();
        break;
    }
  },

  // 加载统计数据
  async loadStats() {
    await this.loadSummary();
    await this.loadCategoryStats();
  },

  // 加载总览数据
  async loadSummary() {
    try {
      const { startDate, endDate } = this.data;
      const res = await app.request({
        url: '/api/stats/by-time',
        data: {
          startDate,
          endDate,
          groupBy: 'day'
        }
      });

      if (res.code === 0) {
        const { total = 0, items = [] } = res.data;
        const days = items.length || 1;
        const totalNum = Number(total) || 0;
        
        this.setData({
          totalAmount: totalNum.toFixed(2),
          totalCount: items.reduce((sum, item) => sum + (item.count || 0), 0),
          dailyAvg: (totalNum / days).toFixed(2)
        });
      }
    } catch (err) {
      console.error('加载总览失败:', err);
    }
  },

  // 加载分类统计
  async loadCategoryStats() {
    try {
      const { startDate, endDate } = this.data;
      console.log('加载分类统计:', { startDate, endDate });
      
      const res = await app.request({
        url: '/api/stats/by-category',
        data: { startDate, endDate }
      });

      console.log('分类统计响应:', res);

      if (res.code === 0 && res.data && res.data.items) {
        const categoryStats = res.data.items.map(item => ({
          ...item,
          percentage: Number(item.percentage || 0).toFixed(1)
        }));
        console.log('设置分类统计:', categoryStats);
        this.setData({ categoryStats });
      } else {
        console.log('分类统计数据为空或格式不对');
        this.setData({ categoryStats: [] });
      }
    } catch (err) {
      console.error('加载分类统计失败:', err);
    }
  },

  // 加载成员统计
  async loadUserStats() {
    try {
      const { startDate, endDate } = this.data;
      const res = await app.request({
        url: '/api/stats/by-user',
        data: { startDate, endDate }
      });

      if (res.code === 0) {
        this.setData({
          userStats: res.data.items.map(item => ({
            ...item,
            percentage: item.percentage.toFixed(1)
          }))
        });
      }
    } catch (err) {
      console.error('加载成员统计失败:', err);
    }
  },

  // 加载标签统计
  async loadTagStats() {
    try {
      const { startDate, endDate } = this.data;
      const res = await app.request({
        url: '/api/stats/by-tag',
        data: { startDate, endDate }
      });

      if (res.code === 0) {
        this.setData({ tagStats: res.data.items });
      }
    } catch (err) {
      console.error('加载标签统计失败:', err);
    }
  },

  // 加载时间趋势
  async loadTimeStats() {
    try {
      const { startDate, endDate } = this.data;
      const res = await app.request({
        url: '/api/stats/by-time',
        data: {
          startDate,
          endDate,
          groupBy: 'day'
        }
      });

      if (res.code === 0) {
        this.setData({ timeStats: res.data.items });
        this.drawLineChart();
      }
    } catch (err) {
      console.error('加载趋势失败:', err);
    }
  },

  // 绘制饼图
  drawPieChart() {
    const { categoryStats } = this.data;
    if (categoryStats.length === 0) return;

    const ctx = wx.createCanvasContext('pieChart');
    const centerX = 200;
    const centerY = 200;
    const radius = 150;
    
    // 黑白色调
    const colors = [
      '#000000', '#333333', '#555555', '#777777',
      '#999999', '#BBBBBB', '#DDDDDD', '#EEEEEE'
    ];

    let startAngle = 0;
    
    categoryStats.forEach((item, index) => {
      const sliceAngle = (item.percentage / 100) * 2 * Math.PI;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.setFillStyle(colors[index % colors.length]);
      ctx.fill();
      
      startAngle += sliceAngle;
    });

    // 中心白色圆
    ctx.beginPath();
    ctx.arc(centerX, centerY, 80, 0, 2 * Math.PI);
    ctx.setFillStyle('#FFFFFF');
    ctx.fill();
    
    ctx.draw();
  },

  // 绘制折线图
  drawLineChart() {
    const { timeStats } = this.data;
    if (timeStats.length === 0) return;

    const ctx = wx.createCanvasContext('lineChart');
    const width = 650;
    const height = 300;
    const padding = 40;
    
    const maxAmount = Math.max(...timeStats.map(item => item.amount));
    const stepX = (width - 2 * padding) / (timeStats.length - 1);
    
    // 绘制网格线
    ctx.setStrokeStyle('#F0F0F0');
    ctx.setLineWidth(1);
    for (let i = 0; i <= 4; i++) {
      const y = padding + (height - 2 * padding) * i / 4;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // 绘制折线
    ctx.beginPath();
    ctx.setStrokeStyle('#000000');
    ctx.setLineWidth(2);
    
    timeStats.forEach((item, index) => {
      const x = padding + index * stepX;
      const y = padding + (height - 2 * padding) * (1 - item.amount / maxAmount);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // 绘制数据点
    timeStats.forEach((item, index) => {
      const x = padding + index * stepX;
      const y = padding + (height - 2 * padding) * (1 - item.amount / maxAmount);
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.setFillStyle('#000000');
      ctx.fill();
    });

    ctx.draw();
  },

  // 导出数据
  exportData() {
    const { startDate, endDate } = this.data;
    wx.navigateTo({
      url: `/pages/import/index?mode=export&startDate=${startDate}&endDate=${endDate}`
    });
  },

  // 阻止冒泡
  noop() {}
});

// pages/expense/detail.js
const app = getApp();

Page({
  data: {
    expenseId: '',
    expense: {
      id: '',
      amount: '0.00',
      categoryId: '',
      categoryIcon: '',
      categoryName: '',
      subCategoryId: '',
      subCategoryName: '',
      description: '',
      date: '',
      userId: '',
      userName: '',
      userAvatar: '',
      tags: [],
      createdAt: ''
    }
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ expenseId: options.id });
      this.loadExpenseDetail();
    }
  },

  // 加载消费详情
  async loadExpenseDetail() {
    try {
      const res = await app.request({
        url: `/api/expenses/${this.data.expenseId}`
      });

      if (res.code === 0) {
        const data = res.data;
        this.setData({
          expense: {
            id: data.id,
            amount: data.amount.toFixed(2),
            categoryId: data.categoryId,
            categoryIcon: data.category?.icon || '📦',
            categoryName: data.category?.name || '未分类',
            subCategoryId: data.subCategoryId,
            subCategoryName: data.subCategory?.name || '',
            description: data.description || '',
            date: data.date.split('T')[0],
            userId: data.userId,
            userName: data.user?.nickname || '未知用户',
            userAvatar: data.user?.avatar || '',
            tags: data.tags || [],
            createdAt: this.formatDateTime(data.createdAt)
          }
        });
      }
    } catch (err) {
      console.error('加载详情失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  // 格式化日期时间
  formatDateTime(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  },

  // 编辑消费记录
  editExpense() {
    wx.navigateTo({
      url: `/pages/expense/add?id=${this.data.expenseId}`
    });
  },

  // 删除消费记录
  deleteExpense() {
    wx.showModal({
      title: '删除记录',
      content: '确定要删除这条消费记录吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await app.request({
              url: `/api/expenses/${this.data.expenseId}`,
              method: 'DELETE'
            });

            if (result.code === 0) {
              wx.showToast({ title: '删除成功', icon: 'success' });
              app.globalData.needRefresh = true;
              setTimeout(() => {
                wx.navigateBack();
              }, 1500);
            } else {
              wx.showToast({ title: result.message || '删除失败', icon: 'none' });
            }
          } catch (err) {
            console.error('删除失败:', err);
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  }
});

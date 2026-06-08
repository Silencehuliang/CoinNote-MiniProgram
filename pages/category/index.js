// pages/category/index.js
const app = getApp();
const storageManager = app.globalData.storageManager;

Page({
  data: {
    mode: 'category',
    showModeTabs: true,
    categories: [],
    systemTags: [],
    customTags: [],
    showCategoryModal: false,
    showTagModal: false,
    isEditCategory: false,
    editCategoryId: null,
    editParentId: null,
    categoryName: '',
    selectedIcon: '📦',
    tagName: '',
    icons: ['🍜', '🚗', '🛍️', '🏠', '🎮', '💊', '📚', '📦', '☕', '🎬', '🎯', '✈️', '💪', '🎓', '📖', '💡', '🔑', '🏢', '🚇', '🚕', '⛽', '🅿️', '👕', '🧴', '📱', '🍪', '🌅', '☀️', '🌙', '🛡️']
  },

  onLoad(options) {
    if (options.mode) {
      this.setData({ mode: options.mode });
    }
    this.loadData();
  },

  // 加载数据
  async loadData() {
    if (this.data.mode === 'category') {
      await this.loadCategories();
    } else {
      await this.loadTags();
    }
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

  // 加载标签
  // 加载标签（使用缓存）
  async loadTags() {
    try {
      const tags = await storageManager.getTags(app);
      this.setData({
        systemTags: tags.filter(t => t.isSystem),
        customTags: tags.filter(t => !t.isSystem)
      });
    } catch (err) {
      console.error('加载标签失败:', err);
    }
  },

  // 设置模式
  setMode(e) {
    this.setData({ mode: e.currentTarget.dataset.mode });
    this.loadData();
  },

  // 显示添加分类弹窗
  showAddCategory() {
    this.setData({
      showCategoryModal: true,
      isEditCategory: false,
      editCategoryId: null,
      editParentId: null,
      categoryName: '',
      selectedIcon: '📦'
    });
  },

  // 显示添加子分类弹窗
  showAddSubCategory(e) {
    this.setData({
      showCategoryModal: true,
      isEditCategory: false,
      editCategoryId: null,
      editParentId: e.currentTarget.dataset.parent,
      categoryName: '',
      selectedIcon: '📦'
    });
  },

  // 编辑分类
  editCategory(e) {
    const id = e.currentTarget.dataset.id;
    const category = this.data.categories.find(c => c.id === id);
    if (category) {
      this.setData({
        showCategoryModal: true,
        isEditCategory: true,
        editCategoryId: id,
        editParentId: null,
        categoryName: category.name,
        selectedIcon: category.icon
      });
    }
  },

  // 编辑子分类
  editSubCategory(e) {
    const id = e.currentTarget.dataset.id;
    const parentId = e.currentTarget.dataset.parent;
    const parent = this.data.categories.find(c => c.id === parentId);
    if (parent) {
      const sub = parent.children.find(c => c.id === id);
      if (sub) {
        this.setData({
          showCategoryModal: true,
          isEditCategory: true,
          editCategoryId: id,
          editParentId: parentId,
          categoryName: sub.name,
          selectedIcon: sub.icon
        });
      }
    }
  },

  // 隐藏分类弹窗
  hideCategoryModal() {
    this.setData({ showCategoryModal: false });
  },

  // 分类名称输入
  onCategoryNameInput(e) {
    this.setData({ categoryName: e.detail.value });
  },

  // 选择图标
  selectIcon(e) {
    this.setData({ selectedIcon: e.currentTarget.dataset.icon });
  },

  // 保存分类
  async saveCategory() {
    const { categoryName, selectedIcon, isEditCategory, editCategoryId, editParentId } = this.data;
    
    if (!categoryName.trim()) {
      wx.showToast({ title: '请输入分类名称', icon: 'none' });
      return;
    }

    try {
      let res;
      if (isEditCategory) {
        res = await app.request({
          url: `/api/categories/${editCategoryId}`,
          method: 'PUT',
          data: {
            name: categoryName.trim(),
            icon: selectedIcon
          }
        });
      } else {
        res = await app.request({
          url: '/api/categories',
          method: 'POST',
          data: {
            name: categoryName.trim(),
            icon: selectedIcon,
            parentId: editParentId
          }
        });
      }

      if (res.code === 0) {
        wx.showToast({ title: '保存成功', icon: 'success' });
        this.hideCategoryModal();
        this.loadCategories();
      } else {
        wx.showToast({ title: res.message || '保存失败', icon: 'none' });
      }
    } catch (err) {
      console.error('保存失败:', err);
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  // 删除分类
  deleteCategory(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除分类',
      content: '删除分类后，该分类下的消费记录将变为未分类，确定要删除吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await app.request({
              url: `/api/categories/${id}`,
              method: 'DELETE'
            });

            if (result.code === 0) {
              wx.showToast({ title: '删除成功', icon: 'success' });
              this.loadCategories();
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
  },

  // 删除子分类
  deleteSubCategory(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除子分类',
      content: '确定要删除这个子分类吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await app.request({
              url: `/api/categories/${id}`,
              method: 'DELETE'
            });

            if (result.code === 0) {
              wx.showToast({ title: '删除成功', icon: 'success' });
              this.loadCategories();
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
  },

  // 显示添加标签弹窗
  showAddTag() {
    this.setData({
      showTagModal: true,
      tagName: ''
    });
  },

  // 隐藏标签弹窗
  hideTagModal() {
    this.setData({ showTagModal: false });
  },

  // 标签名称输入
  onTagNameInput(e) {
    this.setData({ tagName: e.detail.value });
  },

  // 保存标签
  async saveTag() {
    const { tagName } = this.data;
    
    if (!tagName.trim()) {
      wx.showToast({ title: '请输入标签名称', icon: 'none' });
      return;
    }

    try {
      const res = await app.request({
        url: '/api/tags',
        method: 'POST',
        data: { name: tagName.trim() }
      });

      if (res.code === 0) {
        wx.showToast({ title: '添加成功', icon: 'success' });
        this.hideTagModal();
        this.loadTags();
      } else {
        wx.showToast({ title: res.message || '添加失败', icon: 'none' });
      }
    } catch (err) {
      console.error('添加失败:', err);
      wx.showToast({ title: '添加失败', icon: 'none' });
    }
  },

  // 删除标签
  deleteTag(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除标签',
      content: '确定要删除这个标签吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await app.request({
              url: `/api/tags/${id}`,
              method: 'DELETE'
            });

            if (result.code === 0) {
              wx.showToast({ title: '删除成功', icon: 'success' });
              this.loadTags();
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
  },

  // 阻止冒泡
  noop() {}
});

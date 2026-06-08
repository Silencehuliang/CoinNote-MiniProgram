// pages/import/index.js
const app = getApp();

Page({
  data: {
    mode: 'import',
    // 导入相关
    selectedFile: null,
    importing: false,
    importResult: null,
    ranges: ['全部数据', '本月数据', '本年数据'],
    rangeIndex: 0,
    // 导出相关
    exportRange: 'month',
    exportStartDate: '',
    exportEndDate: '',
    includeTags: true,
    includeDesc: true,
    exporting: false,
    exportHistory: []
  },

  onLoad(options) {
    if (options.mode) {
      this.setData({ mode: options.mode });
    }
    if (options.startDate) {
      this.setData({
        exportRange: 'custom',
        exportStartDate: options.startDate,
        exportEndDate: options.endDate
      });
    }
    this.initDate();
    this.loadExportHistory();
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
      exportStartDate: startDate,
      exportEndDate: endDate
    });
  },

  // 设置模式
  setMode(e) {
    this.setData({
      mode: e.currentTarget.dataset.mode,
      importResult: null
    });
  },

  // 选择文件
  chooseFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['xlsx'],
      success: (res) => {
        const file = res.tempFiles[0];
        this.setData({
          selectedFile: {
            name: file.name,
            size: this.formatFileSize(file.size),
            path: file.path
          }
        });
      }
    });
  },

  // 格式化文件大小
  formatFileSize(size) {
    if (size < 1024) return size + 'B';
    if (size < 1024 * 1024) return (size / 1024).toFixed(1) + 'KB';
    return (size / (1024 * 1024)).toFixed(1) + 'MB';
  },

  // 导入范围变化
  onRangeChange(e) {
    this.setData({ rangeIndex: e.detail.value });
  },

  // 下载模板
  async downloadTemplate() {
    try {
      wx.showLoading({ title: '下载中...' });
      
      const res = await app.request({
        url: '/api/import/template',
        responseType: 'arraybuffer'
      });

      const filePath = `${wx.env.USER_DATA_PATH}/import_template.xlsx`;
      const fs = wx.getFileSystemManager();
      
      fs.writeFile({
        filePath,
        data: res,
        encoding: 'binary',
        success: () => {
          wx.openDocument({
            filePath,
            showMenu: true,
            success: () => {
              wx.hideLoading();
            },
            fail: () => {
              wx.hideLoading();
              wx.showToast({ title: '打开失败', icon: 'none' });
            }
          });
        },
        fail: () => {
          wx.hideLoading();
          wx.showToast({ title: '保存失败', icon: 'none' });
        }
      });
    } catch (err) {
      wx.hideLoading();
      console.error('下载模板失败:', err);
      wx.showToast({ title: '下载失败', icon: 'none' });
    }
  },

  // 开始导入
  async startImport() {
    if (!this.data.selectedFile || this.data.importing) return;

    this.setData({ importing: true, importResult: null });

    try {
      const { selectedFile, rangeIndex } = this.data;
      
      const uploadTask = wx.uploadFile({
        url: `${app.globalData.baseUrl}/api/import/expenses`,
        filePath: selectedFile.path,
        name: 'file',
        header: {
          'Authorization': `Bearer ${app.globalData.token}`
        },
        formData: {
          range: ['all', 'month', 'year'][rangeIndex]
        },
        success: (res) => {
          const data = JSON.parse(res.data);
          if (data.code === 0) {
            this.setData({
              importResult: data.data
            });
            wx.showToast({ title: '导入完成', icon: 'success' });
          } else {
            wx.showToast({ title: data.message || '导入失败', icon: 'none' });
          }
        },
        fail: (err) => {
          console.error('导入失败:', err);
          wx.showToast({ title: '导入失败', icon: 'none' });
        },
        complete: () => {
          this.setData({ importing: false });
        }
      });
    } catch (err) {
      console.error('导入失败:', err);
      this.setData({ importing: false });
      wx.showToast({ title: '导入失败', icon: 'none' });
    }
  },

  // 设置导出范围
  setExportRange(e) {
    const range = e.currentTarget.dataset.range;
    this.setData({ exportRange: range });
    
    if (range === 'month' || range === 'year') {
      this.initDate();
    }
  },

  // 导出开始日期变化
  onExportStartDateChange(e) {
    this.setData({ exportStartDate: e.detail.value });
  },

  // 导出结束日期变化
  onExportEndDateChange(e) {
    this.setData({ exportEndDate: e.detail.value });
  },

  // 切换标签选项
  toggleTags(e) {
    this.setData({ includeTags: e.detail.value });
  },

  // 切换备注选项
  toggleDesc(e) {
    this.setData({ includeDesc: e.detail.value });
  },

  // 开始导出
  async startExport() {
    if (this.data.exporting) return;

    this.setData({ exporting: true });

    try {
      const { exportRange, exportStartDate, exportEndDate, includeTags, includeDesc } = this.data;
      
      let startDate = exportStartDate;
      let endDate = exportEndDate;
      
      if (exportRange === 'month') {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
      } else if (exportRange === 'year') {
        const year = new Date().getFullYear();
        startDate = `${year}-01-01`;
        endDate = `${year}-12-31`;
      } else if (exportRange === 'all') {
        startDate = null;
        endDate = null;
      }

      const res = await app.request({
        url: '/api/export/expenses',
        method: 'POST',
        data: {
          startDate,
          endDate,
          includeTags,
          includeDesc,
          format: 'xlsx'
        }
      });

      if (res.code === 0) {
        // 下载文件
        const filePath = `${wx.env.USER_DATA_PATH}/export_${Date.now()}.xlsx`;
        const downloadRes = await wx.downloadFile({
          url: res.data.downloadUrl
        });

        if (downloadRes.statusCode === 200) {
          wx.openDocument({
            filePath: downloadRes.tempFilePath,
            showMenu: true,
            success: () => {
              wx.showToast({ title: '导出成功', icon: 'success' });
              this.loadExportHistory();
            },
            fail: () => {
              wx.showToast({ title: '打开失败', icon: 'none' });
            }
          });
        }
      } else {
        wx.showToast({ title: res.message || '导出失败', icon: 'none' });
      }
    } catch (err) {
      console.error('导出失败:', err);
      wx.showToast({ title: '导出失败', icon: 'none' });
    } finally {
      this.setData({ exporting: false });
    }
  },

  // 加载导出历史
  async loadExportHistory() {
    try {
      const res = await app.request({
        url: '/api/export/history'
      });

      if (res.code === 0) {
        this.setData({ exportHistory: res.data });
      }
    } catch (err) {
      console.error('加载导出历史失败:', err);
    }
  },

  // 下载导出文件
  downloadExport(e) {
    const url = e.currentTarget.dataset.url;
    wx.downloadFile({
      url,
      success: (res) => {
        if (res.statusCode === 200) {
          wx.openDocument({
            filePath: res.tempFilePath,
            showMenu: true,
            fail: () => {
              wx.showToast({ title: '打开失败', icon: 'none' });
            }
          });
        }
      },
      fail: () => {
        wx.showToast({ title: '下载失败', icon: 'none' });
      }
    });
  }
});

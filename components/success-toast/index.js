/**
 * 成功提示组件 - 温暖治愈风格
 * 使用方法：
 * <success-toast id="toast" text="记账成功" emoji="😊" />
 * 
 * 调用显示：
 * this.selectComponent('#toast').show()
 */

Component({
  properties: {
    text: {
      type: String,
      value: '操作成功'
    },
    emoji: {
      type: String,
      value: '😊'
    },
    duration: {
      type: Number,
      value: 2000
    }
  },

  data: {
    visible: false,
    timer: null
  },

  methods: {
    show(options = {}) {
      const { text, emoji, duration } = options;
      
      if (text) this.setData({ text });
      if (emoji) this.setData({ emoji });
      
      this.setData({ visible: true });
      
      // 清除之前的定时器
      if (this.data.timer) {
        clearTimeout(this.data.timer);
      }
      
      // 自动隐藏
      const timer = setTimeout(() => {
        this.hide();
      }, duration || this.data.duration);
      
      this.setData({ timer });
    },
    
    hide() {
      this.setData({ visible: false });
    }
  }
});

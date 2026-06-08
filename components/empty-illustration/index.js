/**
 * 空状态插画组件 - 手绘风格
 * 使用方法：
 * <empty-illustration 
 *   type="piggy"
 *   title="还没有账单"
 *   desc="点击下方按钮开始记账吧~"
 * />
 */

Component({
  properties: {
    type: {
      type: String,
      value: 'piggy'  // piggy | cat | wallet | default
    },
    title: {
      type: String,
      value: '暂无数据'
    },
    desc: {
      type: String,
      value: ''
    }
  }
});

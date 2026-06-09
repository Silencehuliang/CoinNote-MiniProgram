# 🪙 CoinNote - 家庭记账小程序

一款温暖治愈风格的家庭记账微信小程序，支持多人协作、离线优先、实时同步。

## ✨ 核心特性

- 📝 **快速记账** - 3秒完成一笔记录
- 👨‍👩‍👧‍👦 **家庭协作** - 邀请家人一起记录
- 📊 **多维统计** - 按人/类别/时间/标签分析
- 📴 **离线优先** - 无网络也能记账
- 🎨 **温暖治愈** - 米白色调 + 珊瑚橘点缀

## 🎨 设计系统

### 美学方向：温暖治愈风

| 元素 | 说明 |
|------|------|
| 色调 | 米白背景 + 珊瑚橘主色 |
| 形状 | 大圆角（24rpx+）鹅卵石感 |
| 阴影 | 暖色调柔和阴影 |
| 插画 | 手绘风格空状态 |
| 交互 | 弹性动画 + 表情反馈 |

### 色彩方案

```css
/* 背景色 */
--color-bg: #FFF8F0;           /* 米白色 */
--color-bg-warm: #FFF5E6;      /* 暖米色 */
--color-bg-card: #FFFFFF;      /* 卡片白 */

/* 主色 */
--color-primary: #FF7E5F;      /* 珊瑚橘 */
--color-primary-light: #FF9A7B;/* 浅珊瑚 */
--color-primary-dark: #E86A4D; /* 深珊瑚 */

/* 辅助色 */
--color-secondary: #88C9A1;    /* 抹茶绿 */
--color-secondary-light: #A5D9B8;

/* 功能色 */
--color-expense: #FF9A5C;      /* 支出暖橙 */
--color-income: #7BC89C;       /* 收入淡绿 */

/* 文字色 */
--color-text-primary: #4A3728; /* 主文字 */
--color-text-secondary: #8B7355;
--color-text-tertiary: #B8A08A;
```

### 字体规范

```css
/* 字号 */
--text-xs: 22rpx;    /* 最小文字 */
--text-sm: 26rpx;    /* 辅助文字 */
--text-base: 30rpx;  /* 正文 */
--text-lg: 34rpx;    /* 次级标题 */
--text-xl: 40rpx;    /* 标题 */
--text-2xl: 48rpx;   /* 大标题 */
--text-3xl: 64rpx;   /* 数字展示 */

/* 字重 */
--weight-normal: 400;
--weight-medium: 500;
--weight-semibold: 600;
--weight-bold: 700;

/* 行高 */
--leading-normal: 1.6;
--leading-relaxed: 1.8;
```

### 间距系统

```css
--space-1: 8rpx;
--space-2: 16rpx;
--space-3: 24rpx;
--space-4: 32rpx;
--space-5: 48rpx;
--space-6: 64rpx;
--space-7: 80rpx;
--space-8: 96rpx;
```

### 圆角系统

```css
--radius-sm: 16rpx;   /* 小圆角 */
--radius-md: 24rpx;   /* 中圆角 */
--radius-lg: 32rpx;   /* 大圆角 */
--radius-xl: 48rpx;   /* 超大圆角 */
--radius-pill: 999rpx; /* 胶囊形 */
```

---

## 📁 项目结构

```
miniprogram/
├── pages/                          # 页面
│   ├── index/                      # 首页（账单）
│   │   ├── index.js
│   │   ├── index.json
│   │   ├── index.wxml
│   │   └── index.wxss
│   ├── expense/                    # 消费相关
│   │   ├── add.js                  # 添加消费
│   │   ├── detail.js               # 消费详情
│   │   └── list.js                 # 消费列表
│   ├── family/                     # 家庭相关
│   │   ├── index.js                # 家庭管理
│   │   └── join.js                 # 加入家庭
│   ├── stats/                      # 统计分析
│   ├── profile/                    # 个人中心
│   ├── category/                   # 分类管理
│   └── import/                     # 导入导出
├── components/                     # 组件
│   ├── sync-status/                # 同步状态提示
│   ├── success-toast/              # 成功提示（微笑表情）
│   └── empty-illustration/         # 空状态插画
├── utils/                          # 工具类
│   ├── storage.js                  # 本地存储（离线核心）
│   ├── api.js                      # API 请求封装
│   └── util.js                     # 通用工具
├── assets/                         # 静态资源
│   ├── icons/                      # TabBar 图标
│   └── default-avatar.png          # 默认头像
├── app.js                          # 应用入口
├── app.json                        # 应用配置
├── app.wxss                        # 全局样式（设计系统）
└── project.config.json             # 项目配置
```

---

## 🧩 组件文档

### 1. SuccessToast - 成功提示

温暖治愈风格的成功提示，底部弹出微笑表情。

**使用方法：**

```json
// page.json
{
  "usingComponents": {
    "success-toast": "/components/success-toast/index"
  }
}
```

```xml
<!-- page.wxml -->
<success-toast 
  id="toast"
  text="记账成功"
  emoji="😊"
  duration="{{2000}}"
/>
```

```javascript
// 显示提示
this.selectComponent('#toast').show({
  text: '记账成功！',
  emoji: '🎉',
  duration: 2000
});
```

**属性：**

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| text | String | 操作成功 | 提示文字 |
| emoji | String | 😊 | 表情符号 |
| duration | Number | 2000 | 显示时长(ms) |

**方法：**

| 方法 | 参数 | 说明 |
|------|------|------|
| show | {text, emoji, duration} | 显示提示 |
| hide | - | 隐藏提示 |

**预设表情建议：**

| 场景 | 表情 |
|------|------|
| 记账成功 | 😊 🎉 ✨ 💰 |
| 删除成功 | 👋 🗑️ |
| 保存成功 | 💾 ✅ |
| 分享成功 | 🎁 📤 |

---

### 2. EmptyIllustration - 空状态插画

手绘风格的空状态插画，增加趣味性。

**使用方法：**

```json
// page.json
{
  "usingComponents": {
    "empty-illustration": "/components/empty-illustration/index"
  }
}
```

```xml
<!-- 基础用法 -->
<empty-illustration 
  type="piggy"
  title="还没有账单"
  desc="点击下方按钮开始记账吧~"
/>

<!-- 带操作按钮 -->
<empty-illustration 
  type="cat"
  title="暂无数据"
  desc="快来记录第一笔消费吧"
>
  <button class="btn btn--primary" bindtap="goToAdd">立即记账</button>
</empty-illustration>
```

**属性：**

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| type | String | piggy | 插画类型 |
| title | String | 暂无数据 | 标题 |
| desc | String | - | 描述文字 |

**插画类型：**

| 类型 | 说明 | 适用场景 |
|------|------|----------|
| piggy | 小猪存钱罐 | 账单列表为空 |
| cat | 记账的猫 | 添加记录引导 |
| wallet | 钱包 | 统计数据为空 |
| default | 默认邮箱 | 通用场景 |

**插画特点：**
- 🐷 小猪存钱罐 - 摇晃动画 + 闪烁星星
- 🐱 记账的猫 - 写字动画 + 思考气泡
- 👛 钱包 - 悬浮动画 + 金币装饰

---

### 3. SyncStatus - 同步状态

显示数据同步状态的提示条。

**使用方法：**

```json
{
  "usingComponents": {
    "sync-status": "/components/sync-status/index"
  }
}
```

```xml
<sync-status></sync-status>
```

**状态说明：**

| 状态 | 样式 | 说明 |
|------|------|------|
| 离线 | 灰色提示条 | 无网络连接 |
| 待同步 | 黄色提示条 | 有待同步数据 |
| 已同步 | 自动隐藏 | 数据已同步 |

---

## 📱 页面说明

### 首页 (pages/index)

显示当月消费统计和按日期分组的消费列表。

**功能：**
- 月份切换选择器
- 月度支出/笔数统计
- 按日期分组的消费列表
- 快速记账浮动按钮
- 下拉刷新

**数据流：**
```
onLoad → 等待登录 → 加载消费记录 → 渲染列表
```

---

### 记账页 (pages/expense/add)

添加消费记录的主要页面。

**功能：**
- 金额输入（支持小数点后两位）
- 二级分类选择
- 日期选择
- 标签选择
- 家庭成员选择（如果有家庭）
- 备注输入

**交互流程：**
```
选择分类 → 输入金额 → 选择日期 → 添加标签 → 保存
                                        ↓
                              成功提示（微笑表情）
```

---

### 统计页 (pages/stats)

多维度消费统计分析。

**统计维度：**
- 按时间（日/周/月/年趋势）
- 按分类（饼图 + 排行）
- 按成员（家庭成员消费对比）
- 按标签（标签消费统计）

**功能：**
- 时间范围选择
- 维度切换
- 数据可视化
- 导出报表

---

### 家庭页 (pages/family)

家庭组管理。

**功能：**
- 创建家庭
- 邀请成员（分享邀请码/小程序码）
- 成员列表
- 家庭消费统计
- 退出家庭

**邀请流程：**
```
创建家庭 → 生成邀请码 → 分享给好友 → 好友输入邀请码 → 加入成功
```

---

### 个人中心 (pages/profile)

用户设置和数据管理。

**功能：**
- 用户信息编辑
- 分类管理
- 标签管理
- 数据导入
- 数据导出
- 清除缓存

---

## 🔌 API 对接

### 基础配置

```javascript
// app.js
globalData: {
  baseUrl: 'https://your-api-domain.com'
}
```

### 请求示例

```javascript
const app = getApp();

// GET 请求
const res = await app.request({
  url: '/api/expenses',
  data: { page: 1, pageSize: 20 }
});

// POST 请求
const res = await app.request({
  url: '/api/expenses',
  method: 'POST',
  data: {
    amount: 25.50,
    categoryId: 'food',
    date: '2024-01-15'
  }
});
```

### 错误处理

```javascript
try {
  const res = await app.request({ url: '/api/xxx' });
  if (res.code === 0) {
    // 成功
  }
} catch (err) {
  // 网络错误或服务器错误
  wx.showToast({ title: err.message, icon: 'none' });
}
```

---

## 💾 离线架构

### 缓存策略

| 数据类型 | 缓存方式 | 更新策略 | 过期时间 |
|----------|----------|----------|----------|
| 分类 | 本地缓存 | 版本校验 | 7天 |
| 标签 | 本地缓存 | 版本校验 | 7天 |
| 消费记录 | 本地优先 | 增量同步 | 永久 |
| 用户信息 | 本地缓存 | 登录更新 | 永久 |

### 同步机制

```
┌─────────────────────────────────────────────────────────┐
│  用户操作（新增/修改/删除）                               │
│    ↓                                                    │
│  保存到本地存储                                          │
│    ↓                                                    │
│  添加到待同步队列                                        │
│    ↓                                                    │
│  ┌─────────────┐    ┌─────────────┐                     │
│  │ 在线？       │ →  │ 立即同步     │                     │
│  └─────────────┘    └─────────────┘                     │
│    ↓ (离线)                                             │
│  等待联网                                                │
│    ↓                                                    │
│  联网后自动重放队列                                      │
└─────────────────────────────────────────────────────────┘
```

### 使用示例

```javascript
import storageManager from '../../utils/storage';

// 获取分类（自动缓存）
const categories = await storageManager.getCategories(app);

// 保存消费记录（离线优先）
const expense = await storageManager.saveExpense(app, {
  amount: 25.50,
  categoryId: 'food',
  date: '2024-01-15'
});

// 检查同步状态
const status = storageManager.getSyncStatus();
console.log('待同步:', status.pendingCount);
```

---

## 🚀 快速开始

### 1. 环境准备

- 下载安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
- 注册 [微信小程序账号](https://mp.weixin.qq.com/) 获取 AppID

### 2. 导入项目

1. 打开微信开发者工具
2. 选择「导入项目」
3. 选择 `miniprogram` 目录
4. 填入你的 AppID
5. 点击「导入」

### 3. 配置后端地址

修改 `app.js` 中的 `baseUrl`：

```javascript
globalData: {
  // 本地开发
  baseUrl: 'http://127.0.0.1:8787',
  // 正式环境
  // baseUrl: 'https://your-api.workers.dev'
}
```

### 4. 开发调试

1. 点击右上角「详情」
2. 选择「本地设置」
3. 勾选「不校验合法域名」
4. 点击「编译」运行

---

## 📋 开发规范

### 文件命名

| 类型 | 规范 | 示例 |
|------|------|------|
| 页面 | camelCase | `index.js`, `addExpense.js` |
| 组件 | kebab-case | `sync-status/`, `empty-illustration/` |
| 工具 | camelCase | `storageManager.js`, `api.js` |

### 代码规范

```javascript
// ✅ 推荐
async function loadData() {
  try {
    const res = await app.request({ url: '/api/data' });
    if (res.code === 0) {
      this.setData({ data: res.data });
    }
  } catch (err) {
    console.error('加载失败:', err);
    wx.showToast({ title: '加载失败', icon: 'none' });
  }
}

// ❌ 不推荐
function loadData() {
  app.request({ url: '/api/data' }).then(res => {
    this.setData({ data: res.data });
  }).catch(err => {
    console.log(err);
  });
}
```

### 样式规范

```css
/* ✅ 推荐：使用 CSS 变量 */
.card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}

/* ❌ 不推荐：硬编码值 */
.card {
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 32rpx;
}
```

---

## 🔧 常见问题

### Q: 如何切换开发/生产环境？

修改 `app.js` 中的 `baseUrl`：

```javascript
// 开发环境
baseUrl: 'http://127.0.0.1:8787'

// 生产环境
baseUrl: 'https://your-api.workers.dev'
```

### Q: 离线数据会丢失吗？

不会。离线数据存储在本地，联网后自动同步。只有手动清除小程序缓存才会丢失。

### Q: 如何清除缓存？

在「个人中心」→「清除缓存」可以清除缓存。或者在微信开发者工具中点击「清缓存」。

### Q: 如何添加新的空状态插画？

1. 在 `empty-illustration/index.wxml` 添加新的类型
2. 在 `empty-illustration/index.wxss` 添加样式
3. 使用 emoji 或图片作为插画

### Q: 如何自定义成功提示的表情？

```javascript
this.selectComponent('#toast').show({
  text: '自定义文字',
  emoji: '🎉',  // 支持任意 emoji
  duration: 2000
});
```

---

## 📄 许可证

MIT License

---

## 🔗 相关链接

- [后端仓库](https://github.com/Silencehuliang/CoinNote-Backend)
- [API 文档](../docs/api.md)
- [数据库设计](../docs/database.md)
- [部署指南](../docs/deployment.md)

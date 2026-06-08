# 🪙 CoinNote MiniProgram

CoinNote 家庭记账小程序前端，基于微信小程序原生开发。

## 核心特性

- 📝 **快速记账** - 3秒完成一笔记录
- 👨‍👩‍👧‍👦 **家庭协作** - 邀请家人一起记录
- 📊 **多维统计** - 按人/类别/时间/标签分析
- 📴 **离线优先** - 无网络也能记账
- 🎨 **现代设计** - 紫蓝渐变主题

## 项目结构

```
miniprogram/
├── pages/                      # 页面
│   ├── index/                  # 首页（账单）
│   ├── expense/                # 消费相关
│   │   ├── add.js             # 添加消费
│   │   ├── detail.js          # 消费详情
│   │   └── list.js            # 消费列表
│   ├── family/                 # 家庭相关
│   │   ├── index.js           # 家庭管理
│   │   └── join.js            # 加入家庭
│   ├── stats/                  # 统计分析
│   ├── profile/                # 个人中心
│   ├── category/               # 分类管理
│   └── import/                 # 导入导出
├── components/                 # 组件
│   └── sync-status/            # 同步状态提示
├── utils/                      # 工具类
│   ├── storage.js              # 本地存储（离线核心）
│   ├── api.js                  # API 请求封装
│   └── util.js                 # 通用工具
├── assets/                     # 静态资源
│   ├── icons/                  # TabBar 图标
│   └── default-avatar.png      # 默认头像
├── app.js                      # 应用入口
├── app.json                    # 应用配置
├── app.wxss                    # 全局样式
└── project.config.json         # 项目配置
```

## 快速开始

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

## 页面说明

### 首页 (pages/index)
- 显示当月消费统计
- 按日期分组的消费列表
- 快速记账入口

### 记账页 (pages/expense/add)
- 金额输入（自定义键盘）
- 分类选择（二级分类）
- 日期选择
- 标签选择
- 家庭成员选择

### 统计页 (pages/stats)
- 时间范围筛选
- 按分类/成员/标签/时间统计
- 图表展示
- 数据导出

### 家庭页 (pages/family)
- 创建家庭
- 邀请成员（分享邀请码）
- 成员列表
- 家庭统计

### 个人中心 (pages/profile)
- 用户信息
- 分类管理
- 标签管理
- 数据导入导出

## 离线架构

本项目采用**离线优先**架构：

### 缓存策略

| 数据类型 | 缓存方式 | 更新策略 |
|----------|----------|----------|
| 分类 | 本地缓存 7天 | 版本校验，按需更新 |
| 标签 | 本地缓存 7天 | 版本校验，按需更新 |
| 消费记录 | 本地优先 | 增量同步 |
| 用户信息 | 本地缓存 | 登录时更新 |

### 同步机制

1. **离线操作** → 保存本地 + 添加到同步队列
2. **联网后** → 自动重放队列中的操作
3. **数据冲突** → 服务器数据优先

### 同步状态

- 📡 离线模式 - 灰色提示条
- 🔄 待同步 - 黄色提示条 + 同步按钮
- ✅ 已同步 - 自动隐藏

## 样式主题

### 颜色变量

```css
--color-primary: #6C5CE7;        /* 主色（紫色） */
--color-primary-light: #A29BFE;  /* 浅紫色 */
--color-secondary: #00CEC9;      /* 辅助色（青色） */
--color-accent: #FD79A8;         /* 强调色（粉色） */
--color-success: #00B894;        /* 成功色 */
--color-warning: #FDCB6E;        /* 警告色 */
--color-danger: #FF7675;         /* 危险色 */
```

### 设计风格

- 圆润卡片（圆角 24rpx）
- 渐变按钮和背景
- 柔和阴影效果
- 流畅动画过渡

## 组件使用

### 同步状态组件

```json
// page.json
{
  "usingComponents": {
    "sync-status": "/components/sync-status/index"
  }
}
```

```xml
<!-- page.wxml -->
<sync-status></sync-status>
```

## 开发规范

### 文件命名
- 页面文件：`camelCase`（如 `addExpense.js`）
- 组件文件：`kebab-case`（如 `sync-status/`）
- 工具文件：`camelCase`（如 `storageManager.js`）

### 代码规范
- 使用 ES6+ 语法
- 异步操作使用 async/await
- 错误处理使用 try/catch
- 注释使用 JSDoc 格式

## 常见问题

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

## 许可证

MIT License

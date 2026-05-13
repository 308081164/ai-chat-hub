# AI Chat Hub

一个聚合多个 AI 聊天工具的桌面应用，支持登录状态持久化。

## 功能特性

- ✅ 支持 6 个主流 AI 工具：DeepSeek、千问、豆包、Kimi、ChatGPT、GLM
- ✅ 登录状态自动持久化（使用 Electron 持久化 partition）
- ✅ 冷淡风高级 UI 设计
- ✅ 侧边栏工具快速切换
- ✅ 前进/后退/刷新导航
- ✅ 在浏览器中打开链接
- ✅ 收藏功能
- ✅ 侧边栏可折叠

## 技术栈

- Electron - 桌面应用框架
- React 18 + TypeScript - 前端框架
- Vite - 构建工具
- Tailwind CSS - 样式框架
- Zustand - 状态管理
- Lucide React - 图标库

## 登录持久化原理

每个 AI 工具使用独立的持久化 `partition`：
```typescript
partition={`persist:${tool.id}`}
```

这会自动保存：
- Cookies
- LocalStorage
- IndexedDB
- Session 数据

下次打开应用时会自动恢复登录状态，无需重新登录。

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
# 在另一个终端运行
npm run electron:dev
```

### 打包应用

```bash
npm run build
npm run electron:build
```

打包后的文件在 `release` 目录中。

## 使用说明

1. 启动应用后，从左侧选择想要使用的 AI 工具
2. 在 webview 中正常登录（支持各种登录方式）
3. 登录后，即使关闭应用再打开，登录状态依然保留
4. 使用顶部工具栏的按钮进行导航操作
5. 点击工具项上的星标可以收藏工具
6. 点击侧边栏底部的箭头可以折叠侧边栏

## 注意事项

- 确保网络连接正常
- 某些 AI 工具可能有地区限制，请确保网络可以访问
- 首次使用需要登录每个工具

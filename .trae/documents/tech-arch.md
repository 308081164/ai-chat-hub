## 1. 架构设计
Electron桌面应用，前端使用React + Tailwind CSS，集成WebView显示AI工具网页。

## 2. 技术栈
- 桌面框架: Electron + Electron Builder
- 前端: React@18 + TypeScript + Vite
- UI: Tailwind CSS + lucide-react icons
- 状态管理: Zustand
- 开发工具: vite-init

## 3. 路由定义
| 路由 | 用途 |
|-----|------|
| / | 主界面，显示侧边栏和WebView |
| /settings | 设置页面 |

## 4. 数据模型

### 4.1 AI工具配置
```typescript
interface AITool {
  id: string;
  name: string;
  url: string;
  icon: string;
  isFavorite: boolean;
  order: number;
}

interface AppState {
  currentToolId: string | null;
  tools: AITool[];
  theme: 'dark' | 'light';
  sidebarCollapsed: boolean;
}
```

### 4.2 默认工具列表
```typescript
const DEFAULT_TOOLS: AITool[] = [
  { id: 'deepseek', name: 'DeepSeek', url: 'https://chat.deepseek.com', icon: 'brain', isFavorite: true, order: 0 },
  { id: 'qianwen', name: '千问', url: 'https://qianwen.aliyun.com', icon: 'sparkles', isFavorite: true, order: 1 },
  { id: 'doubao', name: '豆包', url: 'https://www.doubao.com', icon: 'message-circle', isFavorite: true, order: 2 },
  { id: 'kimi', name: 'Kimi', url: 'https://kimi.moonshot.cn', icon: 'zap', isFavorite: true, order: 3 },
  { id: 'chatgpt', name: 'ChatGPT', url: 'https://chat.openai.com', icon: 'message-square', isFavorite: true, order: 4 },
  { id: 'glm', name: 'GLM', url: 'https://chatglm.cn', icon: 'hexagon', isFavorite: true, order: 5 },
];
```

## 5. 项目文件结构
```
/workspace
├── src/
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── WebViewContainer.tsx
│   │   ├── Toolbar.tsx
│   │   └── AIToolItem.tsx
│   ├── pages/
│   │   ├── Main.tsx
│   │   └── Settings.tsx
│   ├── store/
│   │   └── useAppStore.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
├── electron/
│   ├── main.ts
│   └── preload.ts
├── package.json
├── vite.config.ts
├── tsconfig.json
└── tailwind.config.js
```

## 6. Electron 主进程功能
- 创建主窗口
- WebView Cookie持久化存储
- 应用菜单和托盘
- 窗口状态管理

## 7. 关键实现细节
1. **WebView集成**: 使用 Electron 的 webview 标签
2. **Cookie持久化**: 配置 persistent partition，自动保存所有浏览数据
3. **状态管理**: Zustand 管理应用状态，localStorage 持久化配置
4. **主题切换**: CSS 变量配合 Tailwind 实现深色/浅色模式
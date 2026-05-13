export interface AITool {
  id: string
  name: string
  url: string
  icon: string
  isFavorite: boolean
  order: number
}

export interface AppState {
  currentToolId: string | null
  tools: AITool[]
  theme: 'dark' | 'light'
  sidebarCollapsed: boolean
  setCurrentTool: (toolId: string) => void
  toggleFavorite: (toolId: string) => void
  toggleSidebar: () => void
  setTheme: (theme: 'dark' | 'light') => void
}

export const DEFAULT_TOOLS: AITool[] = [
  { id: 'deepseek', name: 'DeepSeek', url: 'https://chat.deepseek.com', icon: 'brain', isFavorite: true, order: 0 },
  { id: 'qianwen', name: '千问', url: 'https://qianwen.aliyun.com', icon: 'sparkles', isFavorite: true, order: 1 },
  { id: 'doubao', name: '豆包', url: 'https://www.doubao.com', icon: 'message-circle', isFavorite: true, order: 2 },
  { id: 'kimi', name: 'Kimi', url: 'https://kimi.moonshot.cn', icon: 'zap', isFavorite: true, order: 3 },
  { id: 'chatgpt', name: 'ChatGPT', url: 'https://chat.openai.com', icon: 'message-square', isFavorite: true, order: 4 },
  { id: 'glm', name: 'GLM', url: 'https://chatglm.cn', icon: 'hexagon', isFavorite: true, order: 5 },
]
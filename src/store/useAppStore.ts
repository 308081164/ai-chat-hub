import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AppState, DEFAULT_TOOLS, AITool } from '../types'

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentToolId: 'deepseek',
      tools: DEFAULT_TOOLS,
      theme: 'dark',
      sidebarCollapsed: false,

      setCurrentTool: (toolId: string) => 
        set({ currentToolId: toolId }),

      toggleFavorite: (toolId: string) =>
        set((state) => ({
          tools: state.tools.map((tool: AITool) =>
            tool.id === toolId ? { ...tool, isFavorite: !tool.isFavorite } : tool
          ),
        })),

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setTheme: (theme: 'dark' | 'light') =>
        set({ theme }),
    }),
    {
      name: 'ai-chat-hub-storage',
    }
  )
)
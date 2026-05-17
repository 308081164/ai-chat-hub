import React from 'react'
import { useAppStore } from '../store/useAppStore'
import { AIToolItem } from './AIToolItem'
import { Brain, Settings, Menu, X } from 'lucide-react'

export const Sidebar: React.FC = () => {
  const { tools, currentToolId, sidebarCollapsed, setCurrentTool, toggleFavorite, toggleSidebar } = useAppStore()

  return (
    <aside className={`
      bg-bg-secondary border-r border-border-color flex flex-col transition-all duration-300 relative
      ${sidebarCollapsed ? 'w-20' : 'w-72'}
    `}>
      <div className="p-6 border-b border-border-color">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Brain className="text-white" size={22} />
          </div>
          {!sidebarCollapsed && (
            <span className="text-text-primary font-semibold text-lg">AI Chat Hub</span>
          )}
        </div>
        {!sidebarCollapsed && (
          <div className="mt-4 text-xs text-text-muted font-semibold uppercase tracking-wider">
            AI 工具
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {tools.sort((a, b) => a.order - b.order).map((tool) => (
          <AIToolItem
            key={tool.id}
            tool={tool}
            isActive={currentToolId === tool.id}
            onClick={() => setCurrentTool(tool.id)}
            onToggleFavorite={() => toggleFavorite(tool.id)}
          />
        ))}
      </div>
      
      <div className="p-4 border-t border-border-color">
        <button className="w-full flex items-center gap-3 p-3 rounded-xl text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-all">
          <Settings size={20} />
          {!sidebarCollapsed && <span className="text-sm font-medium">设置</span>}
        </button>
      </div>
      
      <button
        onClick={toggleSidebar}
        className="absolute top-6 right-[-14px] w-7 h-7 bg-bg-secondary border border-border-color rounded-full flex items-center justify-center hover:bg-bg-hover transition-all z-10"
        title={sidebarCollapsed ? "展开侧边栏" : "收起侧边栏"}
      >
        {sidebarCollapsed ? <Menu size={14} /> : <X size={14} />}
      </button>
    </aside>
  )
}
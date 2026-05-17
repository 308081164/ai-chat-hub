import React from 'react'
import { useAppStore } from '../store/useAppStore'
import { ArrowLeft, ArrowRight, RotateCw, ExternalLink, Maximize2 } from 'lucide-react'
import * as Icons from 'lucide-react'

interface ToolbarProps {
  onGoBack: () => void
  onGoForward: () => void
  onRefresh: () => void
  canGoBack: boolean
  canGoForward: boolean
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onGoBack,
  onGoForward,
  onRefresh,
  canGoBack,
  canGoForward,
}) => {
  const { currentToolId, tools } = useAppStore()
  const currentTool = tools.find(t => t.id === currentToolId)
  const IconComponent = currentTool 
    ? (Icons as any)[currentTool.icon.charAt(0).toUpperCase() + currentTool.icon.slice(1)] || Icons.MessageSquare
    : Icons.MessageSquare

  const handleOpenExternal = () => {
    if (currentTool) {
      window.open(currentTool.url, '_blank')
    }
  }

  return (
    <div className="h-14 bg-bg-secondary border-b border-border-color flex items-center justify-between px-5">
      <div className="flex items-center gap-2">
        <button
          onClick={onGoBack}
          disabled={!canGoBack}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
            canGoBack 
              ? 'text-text-secondary hover:bg-bg-hover hover:text-text-primary' 
              : 'text-text-muted cursor-not-allowed opacity-40'
          }`}
          title="后退"
        >
          <ArrowLeft size={18} />
        </button>
        <button
          onClick={onGoForward}
          disabled={!canGoForward}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
            canGoForward 
              ? 'text-text-secondary hover:bg-bg-hover hover:text-text-primary' 
              : 'text-text-muted cursor-not-allowed opacity-40'
          }`}
          title="前进"
        >
          <ArrowRight size={18} />
        </button>
        <div className="w-px h-6 bg-border-color mx-2" />
        <button
          onClick={onRefresh}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-all"
          title="刷新"
        >
          <RotateCw size={18} />
        </button>
      </div>
      
      {currentTool && (
        <div className="flex items-center gap-3 px-4 py-2 bg-bg-tertiary rounded-xl">
          <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <IconComponent size={15} className="text-white" />
          </div>
          <span className="text-text-primary font-medium text-sm">{currentTool.name}</span>
        </div>
      )}
      
      <div className="flex items-center gap-2">
        <button
          onClick={handleOpenExternal}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-all"
          title="在浏览器中打开"
        >
          <ExternalLink size={18} />
        </button>
        <button
          className="w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-all"
          title="全屏"
        >
          <Maximize2 size={18} />
        </button>
      </div>
    </div>
  )
}
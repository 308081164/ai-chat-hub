import React from 'react'
import { AITool } from '../types'
import { Star } from 'lucide-react'
import * as Icons from 'lucide-react'

interface AIToolItemProps {
  tool: AITool
  isActive: boolean
  onClick: () => void
  onToggleFavorite: () => void
}

export const AIToolItem: React.FC<AIToolItemProps> = ({
  tool,
  isActive,
  onClick,
  onToggleFavorite,
}) => {
  const IconComponent = (Icons as any)[tool.icon.charAt(0).toUpperCase() + tool.icon.slice(1)] || Icons.MessageSquare

  return (
    <div
      onClick={onClick}
      className={`
        flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 relative group
        ${isActive 
          ? 'bg-bg-tertiary border border-border-color' 
          : 'hover:bg-bg-hover hover:translate-x-1'
        }
      `}
    >
      {isActive && (
        <div className="absolute left-[-16px] top-1/2 -translate-y-1/2 w-1 h-7 bg-gradient-to-b from-blue-500 to-purple-500 rounded-r" />
      )}
      
      <div className={`
        w-10 h-10 rounded-lg flex items-center justify-center transition-all
        ${isActive 
          ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/30' 
          : 'bg-bg-tertiary text-text-secondary'
        }
      `}>
        <IconComponent size={20} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="text-text-primary font-medium text-sm truncate">
          {tool.name}
        </div>
      </div>
      
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggleFavorite()
        }}
        className={`
          p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100
          ${tool.isFavorite ? 'text-yellow-400 opacity-100' : 'text-text-muted hover:text-text-secondary'}
        `}
      >
        <Star size={16} fill={tool.isFavorite ? 'currentColor' : 'none'} />
      </button>
    </div>
  )
}
import React, { useEffect, useRef, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { MessageSquare, Loader2 } from 'lucide-react'

interface WebViewContainerProps {
  onCanGoBackChange: (canGoBack: boolean) => void
  onCanGoForwardChange: (canGoForward: boolean) => void
  onGoBack: (fn: () => void) => void
  onGoForward: (fn: () => void) => void
  onRefresh: (fn: () => void) => void
}

export const WebViewContainer = ({
  onCanGoBackChange,
  onCanGoForwardChange,
  onGoBack,
  onGoForward,
  onRefresh,
}: WebViewContainerProps) => {
  const { currentToolId, tools } = useAppStore()
  const currentTool = tools.find(t => t.id === currentToolId)
  const webviewRef = useRef<HTMLWebViewElement>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const webview = webviewRef.current
    if (!webview || !currentTool) return

    const handleLoadStart = () => setIsLoading(true)
    const handleLoadStop = () => {
      setIsLoading(false)
      onCanGoBackChange((webview as any).canGoBack?.() || false)
      onCanGoForwardChange((webview as any).canGoForward?.() || false)
    }

    webview.addEventListener('did-start-loading', handleLoadStart)
    webview.addEventListener('did-stop-loading', handleLoadStop)

    return () => {
      webview.removeEventListener('did-start-loading', handleLoadStart)
      webview.removeEventListener('did-stop-loading', handleLoadStop)
    }
  }, [currentToolId, onCanGoBackChange, onCanGoForwardChange])

  useEffect(() => {
    const webview = webviewRef.current
    if (!webview) return

    const goBack = () => {
      if ((webview as any).canGoBack?.()) {
        (webview as any).goBack?.()
      }
    }
    const goForward = () => {
      if ((webview as any).canGoForward?.()) {
        (webview as any).goForward?.()
      }
    }
    const refresh = () => (webview as any).reload?.()

    onGoBack(goBack)
    onGoForward(goForward)
    onRefresh(refresh)
  }, [onGoBack, onGoForward, onRefresh])

  if (!currentTool) {
    return (
      <div className="flex-1 bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-float shadow-lg shadow-blue-500/20">
            <MessageSquare size={38} className="text-white" />
          </div>
          <h2 className="text-text-primary text-xl font-semibold mb-2">Welcome to AI Chat Hub</h2>
          <p className="text-text-muted text-sm max-w-md">Select an AI tool from the sidebar to get started</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-bg-primary relative">
      {isLoading && (
        <div className="absolute inset-0 bg-bg-primary/80 flex items-center justify-center z-10">
          <Loader2 className="animate-spin text-text-muted" size={32} />
        </div>
      )}
      
      <webview
        ref={webviewRef}
        src={currentTool.url}
        className="w-full h-full"
        partition={`persist:${currentTool.id}`}
        webpreferences="plugins=yes,nodeIntegration=no,contextIsolation=yes"
        allowpopups
      />
    </div>
  )
}
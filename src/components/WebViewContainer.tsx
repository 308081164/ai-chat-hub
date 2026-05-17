import { useEffect, useRef, useState, useCallback } from 'react'
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
  const [domReady, setDomReady] = useState(false)

  const getWebviewApi = useCallback(() => {
    const webview = webviewRef.current
    if (!webview || !domReady) return null
    return webview as any
  }, [domReady])

  useEffect(() => {
    const webview = webviewRef.current
    if (!webview || !currentTool) return

    const handleDomReady = () => {
      setDomReady(true)
    }

    const handleLoadStart = () => setIsLoading(true)
    const handleLoadStop = () => {
      setIsLoading(false)
      if (domReady) {
        onCanGoBackChange((webview as any).canGoBack?.() || false)
        onCanGoForwardChange((webview as any).canGoForward?.() || false)
      }
    }

    webview.addEventListener('dom-ready', handleDomReady)
    webview.addEventListener('did-start-loading', handleLoadStart)
    webview.addEventListener('did-stop-loading', handleLoadStop)

    return () => {
      webview.removeEventListener('dom-ready', handleDomReady)
      webview.removeEventListener('did-start-loading', handleLoadStart)
      webview.removeEventListener('did-stop-loading', handleLoadStop)
    }
  }, [currentToolId, onCanGoBackChange, onCanGoForwardChange, domReady])

  useEffect(() => {
    const goBack = () => {
      const webview = getWebviewApi()
      if (webview?.canGoBack?.()) {
        webview.goBack()
      }
    }
    const goForward = () => {
      const webview = getWebviewApi()
      if (webview?.canGoForward?.()) {
        webview.goForward()
      }
    }
    const refresh = () => {
      const webview = getWebviewApi()
      webview?.reload?.()
    }

    onGoBack(goBack)
    onGoForward(goForward)
    onRefresh(refresh)
  }, [onGoBack, onGoForward, onRefresh, getWebviewApi])

  useEffect(() => {
    setDomReady(false)
  }, [currentToolId])

  if (!currentTool) {
    return (
      <div className="flex-1 bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-float shadow-lg shadow-blue-500/20">
            <MessageSquare size={38} className="text-white" />
          </div>
          <h2 className="text-text-primary text-xl font-semibold mb-2">欢迎使用 AI Chat Hub</h2>
          <p className="text-text-muted text-sm max-w-md">请从左侧选择一个 AI 工具开始使用</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-bg-primary relative">
      {(isLoading || !domReady) && (
        <div className="absolute inset-0 bg-bg-primary flex items-center justify-center z-10">
          <div className="text-center">
            <Loader2 className="animate-spin text-text-muted mx-auto mb-3" size={32} />
            <p className="text-text-muted text-sm">正在加载...</p>
          </div>
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
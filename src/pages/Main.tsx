import React, { useCallback, useState } from 'react'
import { Sidebar } from '../components/Sidebar'
import { Toolbar } from '../components/Toolbar'
import { WebViewContainer } from '../components/WebViewContainer'

export const Main: React.FC = () => {
  const [canGoBack, setCanGoBack] = useState(false)
  const [canGoForward, setCanGoForward] = useState(false)
  const [goBackFn, setGoBackFn] = useState<(() => void) | null>(null)
  const [goForwardFn, setGoForwardFn] = useState<(() => void) | null>(null)
  const [refreshFn, setRefreshFn] = useState<(() => void) | null>(null)

  const handleGoBack = useCallback(() => {
    goBackFn?.()
  }, [goBackFn])

  const handleGoForward = useCallback(() => {
    goForwardFn?.()
  }, [goForwardFn])

  const handleRefresh = useCallback(() => {
    refreshFn?.()
  }, [refreshFn])

  return (
    <div className="flex h-screen bg-bg-primary">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Toolbar
          onGoBack={handleGoBack}
          onGoForward={handleGoForward}
          onRefresh={handleRefresh}
          canGoBack={canGoBack}
          canGoForward={canGoForward}
        />
        <WebViewContainer
          onCanGoBackChange={setCanGoBack}
          onCanGoForwardChange={setCanGoForward}
          onGoBack={(fn) => setGoBackFn(() => fn)}
          onGoForward={(fn) => setGoForwardFn(() => fn)}
          onRefresh={(fn) => setRefreshFn(() => fn)}
        />
      </div>
    </div>
  )
}
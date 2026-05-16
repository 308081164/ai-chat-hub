import React, { useState, useEffect, useCallback } from 'react'
import { RefreshCw, ExternalLink, X, Square, Send, Settings, AlertCircle, CheckCircle, Loader2, Clock, XCircle, AlertTriangle } from 'lucide-react'
import { CursorAgent, CursorRun, AgentWithRun } from '../types/cursor-cloud'

interface CursorCloudAPI {
  listAgents: () => Promise<unknown>
  getAgent: (agentId: string) => Promise<unknown>
  listRuns: (agentId: string) => Promise<unknown>
  getRun: (agentId: string, runId: string) => Promise<unknown>
  cancelRun: (agentId: string, runId: string) => Promise<unknown>
  createRun: (agentId: string, prompt: string) => Promise<unknown>
  validateApiKey: (apiKey: string) => Promise<{ valid: boolean; error?: string }>
  saveApiKey: (apiKey: string) => Promise<void>
  getApiKeyStatus: () => Promise<{ configured: boolean }>
  openExternal: (url: string) => Promise<void>
}

declare global {
  interface Window {
    cursorCloud: CursorCloudAPI
  }
}

type RunStatus = 'pending' | 'running' | 'succeeded' | 'failed' | 'cancelled'

const statusConfig: Record<RunStatus, { icon: React.ReactNode; color: string; label: string }> = {
  pending: { icon: <Clock size={14} />, color: 'text-yellow-500', label: '等待中' },
  running: { icon: <Loader2 size={14} className="animate-spin" />, color: 'text-blue-500', label: '运行中' },
  succeeded: { icon: <CheckCircle size={14} />, color: 'text-green-500', label: '成功' },
  failed: { icon: <XCircle size={14} />, color: 'text-red-500', label: '失败' },
  cancelled: { icon: <Square size={14} />, color: 'text-gray-500', label: '已取消' },
}

export const AgentBoard = () => {
  const [agents, setAgents] = useState<AgentWithRun[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [validating, setValidating] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<AgentWithRun | null>(null)
  const [prompt, setPrompt] = useState('')
  const [sending, setSending] = useState(false)

  const checkApiKey = useCallback(async () => {
    try {
      const status = await window.cursorCloud.getApiKeyStatus()
      setIsConfigured(status.configured)
      if (!status.configured) {
        setShowSettings(true)
      }
    } catch {
      setIsConfigured(false)
      setShowSettings(true)
    }
  }, [])

  const fetchAgents = useCallback(async () => {
    if (!isConfigured) return
    
    try {
      setError(null)
      const agentList = await window.cursorCloud.listAgents() as CursorAgent[]
      
      const agentsWithRuns: AgentWithRun[] = await Promise.all(
        agentList.map(async (agent) => {
          if (agent.latestRunId) {
            try {
              const run = await window.cursorCloud.getRun(agent.id, agent.latestRunId) as CursorRun
              return { ...agent, latestRun: run }
            } catch {
              return { ...agent }
            }
          }
          return { ...agent }
        })
      )
      
      setAgents(agentsWithRuns)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'UNKNOWN_ERROR'
      if (errorMessage === 'API_KEY_NOT_CONFIGURED' || errorMessage === 'INVALID_API_KEY') {
        setIsConfigured(false)
        setShowSettings(true)
      }
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [isConfigured])

  useEffect(() => {
    checkApiKey()
  }, [checkApiKey])

  useEffect(() => {
    if (isConfigured) {
      fetchAgents()
      const interval = window.setInterval(fetchAgents, 30000)
      return () => {
        if (interval) clearInterval(interval)
      }
    }
  }, [isConfigured, fetchAgents])

  const handleValidateAndSave = async () => {
    if (!apiKey.trim()) return
    
    setValidating(true)
    try {
      const result = await window.cursorCloud.validateApiKey(apiKey)
      if (result.valid) {
        await window.cursorCloud.saveApiKey(apiKey)
        setIsConfigured(true)
        setShowSettings(false)
        fetchAgents()
      } else {
        setError(result.error || 'API Key 验证失败')
      }
    } catch {
      setError('保存失败')
    } finally {
      setValidating(false)
    }
  }

  const handleRefresh = () => {
    setLoading(true)
    fetchAgents()
  }

  const handleCancelRun = async (agentId: string, runId: string) => {
    try {
      await window.cursorCloud.cancelRun(agentId, runId)
      fetchAgents()
    } catch {
      setError('取消失败')
    }
  }

  const handleSendPrompt = async () => {
    if (!selectedAgent || !prompt.trim()) return
    
    setSending(true)
    try {
      await window.cursorCloud.createRun(selectedAgent.id, prompt)
      setPrompt('')
      fetchAgents()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '发送失败'
      setError(errorMessage)
    } finally {
      setSending(false)
    }
  }

  const handleOpenInBrowser = (url: string) => {
    window.cursorCloud.openExternal(url)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN')
  }

  if (isConfigured === null) {
    return (
      <div className="flex items-center justify-center h-full bg-bg-primary">
        <Loader2 size={32} className="animate-spin text-text-muted" />
      </div>
    )
  }

  if (showSettings) {
    return (
      <div className="h-full bg-bg-primary flex items-center justify-center">
        <div className="bg-bg-secondary border border-border-color rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Settings size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">Cursor Cloud 配置</h2>
              <p className="text-sm text-text-muted">配置您的 API Key 以连接 Cursor Cloud</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="请输入 Cursor API Key"
                className="w-full px-4 py-3 bg-bg-primary border border-border-color rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            
            {error && (
              <div className="flex items-center gap-2 text-red-500 text-sm">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            
            <button
              onClick={handleValidateAndSave}
              disabled={!apiKey.trim() || validating}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {validating ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  验证中...
                </>
              ) : (
                '验证并保存'
              )}
            </button>
            
            <p className="text-xs text-text-muted text-center">
              API Key 将使用安全存储加密保存。
              <br />
              可在 Cursor Dashboard → Integrations 创建。
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-bg-primary flex">
      <div className={`flex-1 flex flex-col transition-all duration-300 ${selectedAgent ? 'mr-96' : ''}`}>
        <div className="p-6 border-b border-border-color flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-text-primary flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
              Cursor Cloud Agents
            </h1>
            <p className="text-sm text-text-muted mt-1">实时查看和管理您的 Cloud Agents</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-bg-secondary border border-border-color rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-all disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              刷新
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-4 py-2 bg-bg-secondary border border-border-color rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-all"
            >
              <Settings size={16} />
              设置
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading && agents.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 size={32} className="animate-spin text-text-muted" />
            </div>
          ) : error && agents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <AlertCircle size={48} className="text-red-500 mb-4" />
              <p className="text-text-primary font-medium mb-2">加载失败</p>
              <p className="text-text-muted text-sm mb-4">{error}</p>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                重试
              </button>
            </div>
          ) : agents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <AlertTriangle size={48} className="text-yellow-500 mb-4" />
              <p className="text-text-primary font-medium mb-2">暂无 Agents</p>
              <p className="text-text-muted text-sm">请先在 Cursor Web 创建 Cloud Agents</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="bg-bg-secondary border border-border-color rounded-2xl p-6 hover:border-blue-500/30 transition-all cursor-pointer"
                  onClick={() => setSelectedAgent(agent)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-text-primary mb-1">{agent.name}</h3>
                      {agent.description && (
                        <p className="text-sm text-text-muted line-clamp-2">{agent.description}</p>
                      )}
                    </div>
                    {agent.latestRun && (
                      <div className={`flex items-center gap-1.5 text-sm ${statusConfig[agent.latestRun.status].color}`}>
                        {statusConfig[agent.latestRun.status].icon}
                        {statusConfig[agent.latestRun.status].label}
                      </div>
                    )}
                  </div>
                  
                  {agent.latestRun && (
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-text-muted">
                        上次运行: {formatTime(agent.latestRun.updatedAt)}
                      </div>
                      <div className="flex items-center gap-2">
                        {agent.latestRun.status === 'running' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCancelRun(agent.id, agent.latestRun!.id)
                            }}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="取消运行"
                          >
                            <Square size={16} />
                          </button>
                        )}
                        {agent.url && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenInBrowser(agent.url!)
                            }}
                            className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="在浏览器中打开"
                          >
                            <ExternalLink size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {!agent.latestRun && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-muted">暂无运行记录</span>
                      {agent.url && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenInBrowser(agent.url!)
                          }}
                          className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="在浏览器中打开"
                        >
                          <ExternalLink size={16} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedAgent && (
        <div className="fixed right-0 top-0 h-full w-96 bg-bg-secondary border-l border-border-color flex flex-col shadow-2xl">
          <div className="p-6 border-b border-border-color flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">{selectedAgent.name}</h2>
            <button
              onClick={() => setSelectedAgent(null)}
              className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            {selectedAgent.latestRun && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-text-secondary mb-3">最近运行</h3>
                <div className="bg-bg-primary rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted">状态</span>
                    <span className={`flex items-center gap-1.5 text-sm ${statusConfig[selectedAgent.latestRun.status].color}`}>
                      {statusConfig[selectedAgent.latestRun.status].icon}
                      {statusConfig[selectedAgent.latestRun.status].label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted">更新时间</span>
                    <span className="text-xs text-text-primary">{formatTime(selectedAgent.latestRun.updatedAt)}</span>
                  </div>
                  {selectedAgent.latestRun.prompt?.text && (
                    <div>
                      <span className="text-xs text-text-muted">提示词</span>
                      <p className="text-sm text-text-primary mt-1 line-clamp-3">{selectedAgent.latestRun.prompt.text}</p>
                    </div>
                  )}
                  {selectedAgent.latestRun.result && (
                    <div>
                      <span className="text-xs text-text-muted">结果</span>
                      <p className="text-sm text-text-primary mt-1 line-clamp-3">{selectedAgent.latestRun.result}</p>
                    </div>
                  )}
                  {selectedAgent.latestRun.error && (
                    <div className="text-red-500 text-sm">
                      {selectedAgent.latestRun.error}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div>
              <h3 className="text-sm font-medium text-text-secondary mb-3">发送新指令</h3>
              <div className="space-y-3">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="输入您的指令..."
                  className="w-full h-32 px-4 py-3 bg-bg-primary border border-border-color rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                />
                <button
                  onClick={handleSendPrompt}
                  disabled={!prompt.trim() || sending}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      发送中...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      发送指令
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {selectedAgent.url && (
            <div className="p-6 border-t border-border-color">
              <button
                onClick={() => handleOpenInBrowser(selectedAgent.url!)}
                className="w-full py-3 bg-bg-primary border border-border-color rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-all flex items-center justify-center gap-2"
              >
                <ExternalLink size={18} />
                在 Cursor Web 中查看
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
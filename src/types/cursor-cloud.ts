export interface CursorAgent {
  id: string
  name: string
  description?: string
  status?: string
  latestRunId?: string
  url?: string
  createdAt: string
  updatedAt: string
}

export interface CursorRun {
  id: string
  agentId: string
  status: 'pending' | 'running' | 'succeeded' | 'failed' | 'cancelled'
  prompt?: { text?: string }
  result?: string
  error?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export interface AgentWithRun extends CursorAgent {
  latestRun?: CursorRun
}

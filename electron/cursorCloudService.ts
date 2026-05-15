import { app, safeStorage } from 'electron'
import fs from 'fs'
import path from 'path'

const BASE_URL = 'https://api.cursor.com'

interface CursorAgent {
  id: string
  name: string
  description?: string
  status?: string
  latestRunId?: string
  url?: string
  createdAt: string
  updatedAt: string
}

interface CursorRun {
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

interface CursorUser {
  id: string
  email: string
}

function getConfigPath(): string {
  return path.join(app.getPath('userData'), 'cursor-config.enc')
}

export class CursorCloudService {
  private getApiKey(): string | null {
    try {
      const configPath = getConfigPath()
      if (!fs.existsSync(configPath)) {
        return null
      }
      if (!safeStorage.isEncryptionAvailable()) {
        return null
      }
      const encrypted = fs.readFileSync(configPath)
      return safeStorage.decryptString(encrypted)
    } catch {
      return null
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const apiKey = this.getApiKey()
    if (!apiKey) {
      throw new Error('API_KEY_NOT_CONFIGURED')
    }

    const headers: HeadersInit = {
      'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`,
      'Content-Type': 'application/json',
      ...options.headers,
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })

    if (response.status === 401) {
      throw new Error('INVALID_API_KEY')
    }

    if (response.status === 403) {
      throw new Error('ACCESS_DENIED')
    }

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After')
      const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 5000
      await new Promise(resolve => setTimeout(resolve, waitTime))
      throw new Error('RATE_LIMITED')
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP_ERROR_${response.status}`)
    }

    return response.json()
  }

  async validateApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const headers: HeadersInit = {
        'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      }

      const response = await fetch(`${BASE_URL}/v1/me`, { headers })

      if (response.status === 401) {
        return { valid: false, error: '无效的 API Key' }
      }

      if (response.status === 403) {
        return { valid: false, error: 'API Key 无访问权限' }
      }

      if (!response.ok) {
        return { valid: false, error: `验证失败 (${response.status})` }
      }

      const user = await response.json() as CursorUser
      return { valid: true }
    } catch (error) {
      return { valid: false, error: '无法连接到 Cursor API' }
    }
  }

  async listAgents(): Promise<CursorAgent[]> {
    return this.request<CursorAgent[]>('/v1/agents?limit=20')
  }

  async getAgent(agentId: string): Promise<CursorAgent> {
    return this.request<CursorAgent>(`/v1/agents/${agentId}`)
  }

  async listRuns(agentId: string): Promise<CursorRun[]> {
    return this.request<CursorRun[]>(`/v1/agents/${agentId}/runs?limit=10`)
  }

  async getRun(agentId: string, runId: string): Promise<CursorRun> {
    return this.request<CursorRun>(`/v1/agents/${agentId}/runs/${runId}`)
  }

  async cancelRun(agentId: string, runId: string): Promise<CursorRun> {
    return this.request<CursorRun>(`/v1/agents/${agentId}/runs/${runId}/cancel`, {
      method: 'POST',
    })
  }

  async createRun(agentId: string, prompt: string): Promise<CursorRun> {
    return this.request<CursorRun>(`/v1/agents/${agentId}/runs`, {
      method: 'POST',
      body: JSON.stringify({ prompt: { text: prompt } }),
    })
  }
}
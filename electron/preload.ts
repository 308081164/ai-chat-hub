import { contextBridge, ipcRenderer } from 'electron'

export interface CursorCloudAPI {
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

const cursorCloudAPI: CursorCloudAPI = {
  listAgents: () => ipcRenderer.invoke('cursor:listAgents'),
  getAgent: (agentId: string) => ipcRenderer.invoke('cursor:getAgent', agentId),
  listRuns: (agentId: string) => ipcRenderer.invoke('cursor:listRuns', agentId),
  getRun: (agentId: string, runId: string) => ipcRenderer.invoke('cursor:getRun', agentId, runId),
  cancelRun: (agentId: string, runId: string) => ipcRenderer.invoke('cursor:cancelRun', agentId, runId),
  createRun: (agentId: string, prompt: string) => ipcRenderer.invoke('cursor:createRun', agentId, prompt),
  validateApiKey: (apiKey: string) => ipcRenderer.invoke('cursor:validateApiKey', apiKey),
  saveApiKey: (apiKey: string) => ipcRenderer.invoke('cursor:saveApiKey', apiKey),
  getApiKeyStatus: () => ipcRenderer.invoke('cursor:getApiKeyStatus'),
  openExternal: (url: string) => ipcRenderer.invoke('cursor:openExternal', url),
}

contextBridge.exposeInMainWorld('cursorCloud', cursorCloudAPI)

declare global {
  interface Window {
    cursorCloud: CursorCloudAPI
  }
}
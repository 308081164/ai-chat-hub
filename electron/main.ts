import { app, BrowserWindow, shell, ipcMain, safeStorage } from 'electron'
import path from 'path'
import fs from 'fs'
import { CursorCloudService } from './cursorCloudService'

const cursorService = new CursorCloudService()

function getConfigPath(): string {
  return path.join(app.getPath('userData'), 'cursor-config.enc')
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    backgroundColor: '#0a0a0b',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'default',
    frame: true,
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

function setupIpcHandlers() {
  ipcMain.handle('cursor:listAgents', async () => {
    return cursorService.listAgents()
  })

  ipcMain.handle('cursor:getAgent', async (_, agentId: string) => {
    return cursorService.getAgent(agentId)
  })

  ipcMain.handle('cursor:listRuns', async (_, agentId: string) => {
    return cursorService.listRuns(agentId)
  })

  ipcMain.handle('cursor:getRun', async (_, agentId: string, runId: string) => {
    return cursorService.getRun(agentId, runId)
  })

  ipcMain.handle('cursor:cancelRun', async (_, agentId: string, runId: string) => {
    return cursorService.cancelRun(agentId, runId)
  })

  ipcMain.handle('cursor:createRun', async (_, agentId: string, prompt: string) => {
    return cursorService.createRun(agentId, prompt)
  })

  ipcMain.handle('cursor:validateApiKey', async (_, apiKey: string) => {
    return cursorService.validateApiKey(apiKey)
  })

  ipcMain.handle('cursor:saveApiKey', async (_, apiKey: string) => {
    if (safeStorage.isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(apiKey)
      fs.writeFileSync(getConfigPath(), encrypted)
    }
  })

  ipcMain.handle('cursor:getApiKeyStatus', async () => {
    try {
      const configPath = getConfigPath()
      const configured = fs.existsSync(configPath)
      return { configured }
    } catch {
      return { configured: false }
    }
  })

  ipcMain.handle('cursor:openExternal', async (_, url: string) => {
    shell.openExternal(url)
  })
}

app.whenReady().then(() => {
  setupIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

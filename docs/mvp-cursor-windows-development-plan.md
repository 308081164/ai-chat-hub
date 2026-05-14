# MVP 开发规划：Cursor 云 Agent 接入 + Windows 本地通知辅助

**文档版本：** 1.0  
**撰写日期：** 2026-05-14  
**适用范围：** AI Chat Hub（Electron + React）在 **MVP 阶段** 仅交付 **Cursor Cloud Agents 官方 API 接入** 与 **Windows 本机 Toast 通知辅助**；与《Agent 任务看板可行性分析》（`agent-task-dashboard-feasibility.md`）配套阅读。

---

## 1. MVP 目标与边界

### 1.1 产品目标（用户可感知）

- 用户在 **单窗口** 内可查看 **多个 Cursor Cloud Agent** 的摘要状态（名称、Agent 状态、最近一次 Run 状态、更新时间、跳转 Cursor Web 链接）。
- 支持 **低频轮询刷新**；对「当前选中的 Run」可选 **SSE 流式** 展示进度（可作为 MVP+，见第 3 节分阶段）。
- 支持 **取消当前 Run**、**发送 follow-up 文本**（需 API 支持且 Agent 未归档、无并发 Run 冲突）。
- 在 **Windows 10/11** 上，若用户授予 **通知访问权限**，应用可通过 **本机辅助模块** 捕获与 Cursor 相关的 Toast，用于 **触发增量拉取** 与 **桌面级提醒聚合**（不替代 API 真相源）。

### 1.2 明确不在 MVP 范围（写入 PRD 防范围蔓延）

| 项目 | 说明 |
| --- | --- |
| Trae、VS Code、CODEx 等 | 不接官方/自建 API，不在 MVP 展示为多源看板 |
| macOS / Linux 通知监听 | 仅 Windows；其他平台可显示「功能不可用」占位 |
| 自动代替用户批准 MCP / 敏感操作 | 仅允许「打开 Cursor Web / 打开仓库」类低风险控制项 |
| 企业 Admin / Analytics API | 非 Cloud Agents 范围 |
| 多 GitHub 账号切换 | MVP 单密钥；后续再接账号体系 |

### 1.3 成功标准（验收）

- 配置有效 Cursor API Key 后，**列表页** 能稳定展示 `GET /v1/agents` 返回数据，错误码（401/403/429）有可读提示与退避建议。  
- 在 Windows 上安装并授予权限后，**模拟或真实 Cursor Toast** 能在调试日志中命中规则，并触发 **一次** Cloud Agents 列表刷新（带去抖）。  
- API Key **不落盘于渲染进程明文**；写入本地偏好时使用 **Electron `safeStorage`** 或等价方案（见第 5 节）。

---

## 2. 总体架构

### 2.1 逻辑分层

```
┌─────────────────────────────────────────────────────────────┐
│  Renderer (React) — 看板 UI、设置表单、只通过 IPC 拿脱敏数据   │
└───────────────────────────┬─────────────────────────────────┘
                            │ preload 暴露有限 API
┌───────────────────────────▼─────────────────────────────────┐
│  Main Process — Orchestrator                                 │
│  · CursorCloudService（HTTP Basic、分页、429 退避）            │
│  · AgentBoardState（内存缓存 + 可选落盘缓存元数据）              │
│  · WindowsNotificationBridgeClient（连接本机辅助进程）          │
└───────────────────────────┬─────────────────────────────────┘
          │ HTTPS                      │ Named Pipe / localhost
          ▼                            ▼
   api.cursor.com              NotificationListenerHelper.exe
                               (WinRT / 单独 MSIX 或随安装器分发)
```

**原则：** Renderer **永不**持有 API Key；所有 `https://api.cursor.com` 调用在 **Main** 完成。

### 2.2 与现有仓库的衔接

- 当前入口：`electron/main.ts` 创建 `BrowserWindow`，`webPreferences` 已关闭 `nodeIntegration`、开启 `contextIsolation`。MVP 需新增 **`preload.ts`**（若尚未存在则创建）与 **IPC 通道**（`cursor:listAgents`、`cursor:getRun`、`cursor:cancelRun`、`cursor:createRun`、`cursor:openSettings` 等）。  
- 前端路由：在 `src/pages` 增加 **Agent 看板页**（或主界面 Tab），设置项可挂在现有 `Settings` 或新增「集成」分组。  
- 构建：`electron-builder` 当前 Windows target 为 `nsis` + `portable`（`package.json`）。**通知监听**与 **NSIS 经典安装包** 存在能力张力（见第 4 节），MVP 工程上采用 **「主应用 NSIS + 可选辅助安装包」** 或 **阶段性仅文档化辅助进程** 二选一，必须在迭代计划写死。

---

## 3. Cursor Cloud Agents 接入：实现路径与技术细节

### 3.1 鉴权与配置

- **密钥来源：** 用户在 [Cursor Dashboard → Integrations](https://cursor.com/dashboard/integrations) 创建 **User API Key**（文档：Cloud Agents API 使用 Basic Auth，用户名即 Key，密码为空）。  
- **存储：** Main 进程读取用户输入后，使用 `safeStorage.encryptString` 加密后写入 `userData` 下配置文件；启动时解密失败则提示重新输入。  
- **校验：** 启动时调用 `GET https://api.cursor.com/v1/me` 校验密钥有效性（见 OpenAPI `/v1/me`）。

### 3.2 HTTP 客户端约定

- **Base URL：** `https://api.cursor.com`  
- **Auth Header：** `Authorization: Basic base64(apiKey + ':')` 或使用 Node/Electron 支持的 Basic 构造方式。  
- **429 处理：** 读取 `Retry-After`、`X-RateLimit-*`（若存在），指数退避 + 抖动；UI 显示「稍后重试」。  
- **分页：** `listAgents` 使用 `limit` + `cursor`；默认 `limit=20`，看板首屏合并多页策略（MVP 可先只拉第一页 +「加载更多」）。

### 3.3 核心端点映射（MVP 功能矩阵）

| UI 能力 | HTTP | 备注 |
| --- | --- | --- |
| 列表 | `GET /v1/agents` | 展示 `AgentSummary`；`latestRunId` 存在则并行 `getRun` |
| 详情侧栏 | `GET /v1/agents/{id}` + `GET .../runs/{runId}` | Run 状态为执行真相 |
| 刷新 | 轮询间隔默认 **30～60s**（可配置） | 避免触发限流 |
| 取消 | `POST .../runs/{runId}/cancel` | 处理 `409 run_not_cancellable` |
| 补充指令 | `POST /v1/agents/{id}/runs` | body `{ prompt: { text } }`；处理 `409 agent_busy` |
| 打开 Web | 使用响应中的 `url` 字段 | `shell.openExternal` |

### 3.4 SSE（建议作为 MVP 第二阶段，仍在本规划内定义接口）

- **端点：** `GET /v1/agents/{id}/runs/{runId}/stream`，`Accept: text/event-stream`。  
- **实现位置：** Main 进程使用 **Node 侧 `fetch` + ReadableStream** 或 `eventsource` 类库解析 SSE；通过 IPC **增量** 推送到 Renderer（注意背压：仅保留最近 N KB 文本用于 UI）。  
- **断线：** 支持 `Last-Event-ID` 重连；遇 `410 stream_expired` 回落到 `getRun`。  
- **事件：** 至少处理 `status`、`result`、`error`、`done`；`tool_call` 可记录为只读日志便于后续扩展「待人工」提示。

### 3.5 TypeScript SDK（可选）

- 官方 `@cursor/sdk` 处于 Beta；若引入可减少手写 HTTP。  
- **决策建议：** MVP 若以 **最小依赖** 为先，可直接 **手写 fetch**；若团队更重视类型与演进对齐，可在 Spike 后切换 SDK，并锁定版本号。

### 3.6 与可行性文档的一致性提醒

- Cloud Agents API v1 为 **Public beta**，需在设置页展示 **「接口可能变更」** 提示。  
- **Webhook v1** 未 GA，MVP **不依赖** Webhook。  
- **MCP 授权类** 不在 API 中承诺，UI 上 **「需授权」** 按钮统一导向 **Cursor Web `url`**。

---

## 4. Windows 本地通知辅助：实现路径与技术细节

### 4.1 能力边界（再次强调）

- 通知通道只做：**唤醒 / 粗匹配 / 触发拉取**；**任务状态仍以 Cursor API 为准**。  
- 仅处理与 **Cursor** 相关的通知（见第 4.4 节规则）；其他 IDE 不在 MVP 解析。

### 4.2 平台能力与打包形态

根据 Microsoft 文档，**UserNotificationListener** 属于 **WinRT**，需要：

1. **应用清单** 声明 **User Notification Listener** 能力；  
2. 运行时调用 **`UserNotificationListener.Current.RequestAccessAsync()`** 获取用户授权；  
3. 用户可在 **系统设置 → 隐私 → 通知** 中撤销。

**与当前 Electron 打包的冲突点：** 经典 **NSIS / portable** 的 Electron 应用 **并非** 开箱即用的「带 AppxManifest 的 UWP 容器」。业界可行方案包括（按推荐顺序）：

| 方案 | 描述 | MVP 适配度 |
| --- | --- | --- |
| **A. 独立「通知桥」辅助进程（推荐）** | 使用 **.NET 8 Windows 应用 SDK** 编写极小控制台或托盘常驻进程，单独 MSIX 或带 manifest 的 exe；通过 **命名管道 / localhost loopback** 向 Electron Main 投递 JSON 事件 | **高**：主应用可保持 NSIS |
| **B. 主应用整体 MSIX** | 将 Electron 应用改为 MSIX 分发 | **中**：发布链路与签名成本高 |
| **C. 延后交付** | MVP 第一迭代仅 API 看板，通知桥在 **v0.2** 交付 | **高**：降低一次性风险 |

**本规划默认采用方案 A**；若排期不足，采用 **C** 并在版本说明中公示。

### 4.3 辅助进程 ↔ Electron 通信协议（建议）

- **传输：** Windows **Named Pipe**，例如 `\\.\pipe\AiChatHubCursorNotify`。  
- **消息格式：** 单行 JSON，字段示例：`{ "type":"toast","sourceAppId":"...","displayName":"Cursor","time":"ISO8601","title":"...","body":"..." }`。  
- **Electron 侧：** Main 使用 `net.createServer` 或 `node-windows` 生态中的 pipe 方案监听；收到事件后 **300～500ms 去抖** 再调用 `CursorCloudService.refreshAgents()`，避免 Toast 连发造成 API 风暴。  
- **生命周期：** Main 启动时尝试连接/启动辅助进程；辅助进程崩溃应 **退避重连** 且 **不影响** API 看板主流程。

### 4.4 Cursor Toast 匹配规则（初版启发式）

在辅助进程读取 `UserNotificationListener.GetNotificationsAsync(NotificationKinds.Toast)`（具体 API 以 Microsoft 文档为准）后，对每条通知：

1. **白名单：** `AppDisplayName` / `AppId` 包含 `Cursor`（大小写不敏感），或 AUMID 命中团队维护的 **已知列表**；  
2. **关键词：** `title` 或 `body` 命中 `Agent`、`Cloud`、`PR`、`Run`、`failed`、`finished` 等可配置词表；  
3. **命中后：** 写管道事件；Electron 仅 **增量拉取**，**不**根据通知文本自动调用 `cancel`/`createRun`。

> 规则应外置为 **JSON 配置文件**，便于运营热更新而无需发版 Electron。

### 4.5 安装与权限 UX

- 首次启用「Windows 通知辅助」向导页：说明 **读取通知的隐私影响**、用途、数据不落云（若产品确实不落云需与法务一致）。  
- 调用辅助进程执行 `RequestAccessAsync`；若拒绝，功能开关置灰并链向系统设置说明页（可打开 `ms-settings:notifications`）。  
- **日志：** 默认不记录通知全文到持久化日志；开发模式可开关。

### 4.6 测试计划（通知子系统）

- **单元：** 规则引擎对样例 JSON fixture 的命中/漏报率。  
- **集成：** 在 Windows 虚拟机使用 **PowerShell 调 `BurntToast` 或 WinRT 发假 Toast**（若环境允许）验证端到端；真实 Cursor Toast 作为 **手工回归**。  
- **异常：** 权限撤销、管道断开、API 429 同时发生时的降级路径。

---

## 5. 安全与隐私（MVP 必做清单）

- API Key：**仅 Main** 持有；Renderer 通过 IPC 只接收 **脱敏后的错误信息**（不返回 Key）。  
- **HTTPS 固定：** 使用 `https://api.cursor.com`，可选 **证书钉扎（pinning）** 作为增强（评估维护成本）。  
- **通知内容：** 管道内传递的字符串 **最小化**； Renderer 默认只展示「收到 Cursor 相关通知」级提示，完整正文可作为 **调试开关**。  
- **遥测：** 若未来引入，默认关闭；与本 MVP 文档范围无关时需单独评审。

---

## 6. 交付节奏（建议迭代）

| 迭代 | 交付物 | 依赖 |
| --- | --- | --- |
| **I0 — Spike（2～3 人日）** | Main 进程 `listAgents` + 设置页存 Key；429 退避验证 | 无 |
| **I1 — MVP 核心（5～8 人日）** | 看板列表、详情、取消、follow-up、打开外链；基础错误处理 | I0 |
| **I2 — SSE（3～5 人日）** | 单 Run 流式输出面板 | I1 |
| **I3 — Windows 桥（5～10 人日）** | 辅助进程 + 管道 + 规则 + 安装说明；CI 增加 Windows 构建 | I1；可与 I2 并行 |

排期可按团队体量线性缩放；**I3 可整体顺延为 v0.2**，以保证 **I1 可独立发版**。

---

## 7. 工程任务拆解（Issue 级）

1. **Electron 安全模型：** 新增 `preload.ts`，定义 `contextBridge.exposeInMainWorld('agentBoard', …)`。  
2. **CursorCloudService：** 封装 `listAgents`、`getAgent`、`listRuns`、`getRun`、`cancelRun`、`createRun`、`streamRun`（可选）。  
3. **IPC 路由表与类型：** 共享 `src/types/cursor-cloud.ts`（与 OpenAPI 对齐的子集）。  
4. **UI：** `AgentBoardPage`、加载/空态/错误态组件；设置页「Cursor 集成」区块。  
5. **Windows：** `notification-bridge/` .NET 工程 + README（构建、签名、与 Electron 协同启动）。  
6. **CI：** `.github/workflows` 增加 `windows-latest` 下 **桥接工程** `dotnet build`（若采用 .NET）。  
7. **文档：** 用户手册《如何创建 API Key》《如何授予通知访问》截图。

---

## 8. 风险登记册

| 风险 | 影响 | 缓解 |
| --- | --- | --- |
| Cursor API Beta 变更 | 客户端解析失败 | 版本化客户端、监控 4xx/5xx、快速热修 |
| 限流过严 | 列表刷新卡顿 | 退避、合并请求、SSE 减少轮询 |
| Toast 元数据不稳定 | 误触发/不触发 | 规则外置、可配置、用户可关闭桥 |
| NSIS 与 WinRT 能力张力 | 桥接无法内嵌单 exe | 独立辅助进程方案 |
| 隐私合规 | 上架或企业采购受阻 | PIA、默认最小展示、明示同意 |

---

## 9. 参考链接

- [Cloud Agents API Endpoints](https://cursor.com/docs/cloud-agent/api/endpoints)  
- [Cloud Agents OpenAPI YAML](https://cursor.com/docs-static/cloud-agents-openapi.yaml)  
- [Windows Notification listener](https://learn.microsoft.com/en-us/windows/apps/develop/notifications/app-notifications/notification-listener)  
- 项目内：[Agent 任务看板可行性分析](./agent-task-dashboard-feasibility.md)

---

**文档维护：** 随实现进展更新「迭代」与「Issue 拆解」两节；API 与系统行为变更时同步修订第 3、4 节。

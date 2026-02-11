# PKPM Agent 桌面版

基于 **Electron + Next.js** 构建的 AI 智能体桌面应用程序。

## 技术栈

- **前端框架**: Next.js 15 + React 19 + TypeScript
- **桌面壳**: Electron
- **样式**: Tailwind CSS 4 + Radix UI
- **AI/LLM**: LangChain + LangGraph
- **包管理**: pnpm

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 开发模式

#### 仅前端开发（浏览器）

```bash
pnpm dev
```

访问 `http://localhost:3000`

#### Electron 开发模式（推荐）

```bash
pnpm electron:dev
```

这会：
1. 构建前端静态文件
2. 启动 Electron 并加载开发服务器
3. 自动打开开发者工具

### 3. 构建桌面应用

#### Windows 安装包

```bash
pnpm electron:build:win
```

输出文件：
- `dist/PKPM Agent Setup 1.0.0.exe` - 安装程序
- `dist/PKPM Agent 1.0.0.exe` - 便携版

#### macOS

```bash
pnpm electron:build:mac
```

#### Linux

```bash
pnpm electron:build:linux
```

## 命令速查

| 命令 | 作用 |
|------|------|
| `pnpm dev` | 启动前端开发服务器 |
| `pnpm build` | 构建前端静态文件（输出到 `out/`） |
| `pnpm electron:dev` | **前端 + Electron** 开发模式 |
| `pnpm electron:preview` | 预览生产版本（加载 `out/`） |
| `pnpm electron:build:win` | **构建前端 + Windows 安装包** |
| `pnpm electron:build:mac` | **构建前端 + macOS 安装包** |
| `pnpm electron:build:linux` | **构建前端 + Linux 安装包** |

## 环境变量配置

复制 `.env.example` 为 `.env`，配置以下变量：

```bash
# API 地址（LangGraph 服务器地址）
NEXT_PUBLIC_API_URL=http://localhost:2024

# 助手/图 ID
NEXT_PUBLIC_ASSISTANT_ID=agent

# LangSmith API Key（连接远程 LangGraph 服务器时需要）
LANGSMITH_API_KEY=
```

配置环境变量后，应用启动时会自动使用这些值，跳过初始设置表单。

## 使用方法

启动应用后，需要配置以下信息：

1. **部署地址**: LangGraph 服务器的 URL（可以是本地或远程地址）
2. **助手/图 ID**: 要使用的图名称或助手 ID
3. **LangSmith API Key**: 连接远程 LangGraph 服务器时需要

配置完成后点击 **继续**，即可进入聊天界面与智能体对话。

## 项目结构

```
PKPMAgent/
├── electron/              # Electron 相关文件
│   ├── main.js           # 主进程入口
│   ├── preload.js        # 预加载脚本
│   └── assets/           # 图标等资源
├── out/                  # Next.js 构建输出（静态文件）
├── src/                  # Next.js 源代码
│   ├── app/              # 页面路由
│   ├── components/       # React 组件
│   ├── providers/        # 状态管理
│   └── lib/              # 工具函数
├── dist/                 # Electron 构建输出
└── package.json          # 项目配置
```

## 功能特性

### 控制聊天消息显示

#### 1. 禁止实时流式显示

如需在 LLM 调用过程中**不实时显示**流式消息，可在模型配置中添加 `langsmith:nostream` 标签：

**Python 示例：**
```python
from langchain_anthropic import ChatAnthropic

# 通过 with_config 方法添加标签
model = ChatAnthropic().with_config(
    config={"tags": ["langsmith:nostream"]}
)
```

**TypeScript 示例：**
```typescript
import { ChatAnthropic } from "@langchain/anthropic";

const model = new ChatAnthropic()
  .withConfig({ tags: ["langsmith:nostream"] });
```

> **注意**：即使隐藏了流式显示，消息在完成 LLM 调用后仍会显示（如果它被保存到了图状态中）。

#### 2. 完全隐藏消息

如需**永远不显示**某条消息（流式过程中和保存到状态后都不显示），需要：
1. 在消息的 `id` 字段前添加 `do-not-render-` 前缀
2. 给模型添加 `langsmith:do-not-render` 标签

**Python 示例：**
```python
result = model.invoke([messages])
# 在保存到状态前给 ID 添加前缀
result.id = f"do-not-render-{result.id}"
return {"messages": [result]}
```

**TypeScript 示例：**
```typescript
const result = await model.invoke([messages]);
result.id = `do-not-render-${result.id}`;
return { messages: [result] };
```

### Artifact 渲染

支持在聊天中渲染 Artifact，Artifact 会显示在聊天界面右侧的面板中。

获取 artifact 上下文的方法：

```tsx
export function useArtifact<TContext = Record<string, unknown>>() {
  type Component = (props: {
    children: React.ReactNode;
    title?: React.ReactNode;
  }) => React.ReactNode;

  type Context = TContext | undefined;

  type Bag = {
    open: boolean;
    setOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
    context: Context;
    setContext: (value: Context | ((prev: Context) => Context)) => void;
  };

  const thread = useStreamContext<
    { messages: Message[]; ui: UIMessage[] },
    { MetaType: { artifact: [Component, Bag] } }
  >();

  return thread.meta?.artifact;
}
```

使用示例：

```tsx
import { useArtifact } from "../utils/use-artifact";

export function Writer(props: { title?: string; content?: string }) {
  const [Artifact, { open, setOpen }] = useArtifact();

  return (
    <>
      <div onClick={() => setOpen(!open)}>
        <p>{props.title}</p>
      </div>
      <Artifact title={props.title}>
        <p>{props.content}</p>
      </Artifact>
    </>
  );
}
```

## 生产部署配置

### 方式一：API 代理转发（推荐）

使用 `langgraph-nextjs-api-passthrough` 包代理请求：

```bash
NEXT_PUBLIC_ASSISTANT_ID="agent"
# LangGraph 服务器部署地址
LANGGRAPH_API_URL="https://my-agent.default.us.langgraph.app"
# 网站地址 + "/api"
NEXT_PUBLIC_API_URL="https://my-website.com/api"
# LangSmith API Key（服务端注入）
LANGSMITH_API_KEY="lsv2_..."
```

### 方式二：自定义认证

如需自定义认证逻辑，修改 `src/providers/Stream.tsx` 中的 `useTypedStream` hook：

```tsx
const streamValue = useTypedStream({
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
  assistantId: process.env.NEXT_PUBLIC_ASSISTANT_ID,
  defaultHeaders: {
    Authentication: `Bearer ${yourToken}`,
  },
});
```

## 常见问题

### Q: Electron 白屏？
A: 确保已经运行 `pnpm build` 生成了 `out/` 目录。

### Q: 如何调试？
A: 开发模式下按 `F12` 打开开发者工具。

### Q: 如何更新版本？
A: 修改 `package.json` 中的 `version` 字段，然后重新构建。

### Q: 图标放在哪里？
A: 放在 `electron/assets/` 目录下：
- Windows: `icon.ico` (256x256)
- macOS: `icon.icns`
- Linux: `icon.png`

## 工作原理

### 开发模式
```
Electron → 加载 http://localhost:3000
```

### 生产模式
```
Electron → 加载 out/index.html（本地静态文件）
```

## 注意事项

1. **构建顺序**：必须先构建前端（生成 `out/`），再打包 Electron

2. **静态导出限制**：
   - Next.js 使用 `output: "export"` 模式
   - 不支持 API Routes
   - 图片使用 `unoptimized: true`

3. **安全配置**：
   - `nodeIntegration: false`（禁用 Node API）
   - `contextIsolation: true`（启用上下文隔离）

## 了解更多

- [Electron 文档](https://www.electronjs.org/docs)
- [Next.js 文档](https://nextjs.org/docs)
- [LangGraph 文档](https://langchain-ai.github.io/langgraph/)
- [ELECTRON.md](./ELECTRON.md) - 详细的 Electron 配置说明

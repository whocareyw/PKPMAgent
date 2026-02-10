# PKPM Agent Desktop - Electron 整合说明

## 项目概述

本项目是 PKPM Agent 的桌面应用程序，基于 **Electron + Next.js** 构建：

- **前端**：Next.js 15 + React 19 + TypeScript
- **桌面壳**：Electron
- **构建工具**：pnpm + electron-builder

## 目录结构

```
PKPMAgent/
├── electron/              # Electron 相关文件
│   ├── main.js           # 主进程入口
│   ├── preload.js        # 预加载脚本（安全隔离）
│   └── assets/           # 图标等资源
│       └── icon.png
├── out/                  # Next.js 构建输出（静态文件）
├── src/                  # Next.js 源代码
├── dist/                 # Electron 构建输出
├── package.json          # 项目配置（包含 Electron 配置）
└── next.config.mjs       # Next.js 配置（静态导出）
```

## 开发命令

### 1. 前端开发模式

```bash
# 启动 Next.js 开发服务器（端口 3000）
pnpm dev
```

### 2. Electron 开发模式

```bash
# 先构建前端，然后以开发模式启动 Electron
# 这会加载 http://localhost:3000 并自动打开开发者工具
pnpm electron:dev
```

### 3. 预览生产版本

```bash
# 构建前端后，用 Electron 加载本地静态文件
pnpm build
pnpm electron:preview
```

## 构建打包

### Windows

```bash
# 构建 Windows 安装包 (.exe)
pnpm electron:build:win

# 输出：
# - dist/PKPM Agent Setup 1.0.0.exe  (安装包)
# - dist/PKPM Agent 1.0.0.exe        (便携版)
```

### macOS

```bash
# 构建 macOS DMG
pnpm electron:build:mac

# 输出：
# - dist/PKPM Agent-1.0.0.dmg
```

### Linux

```bash
# 构建 Linux AppImage
pnpm electron:build:linux

# 输出：
# - dist/PKPM Agent-1.0.0.AppImage
```

### 全平台

```bash
# 构建所有平台
pnpm electron:build
```

## 工作流程

### 开发工作流程

```
┌─────────────────────────────────────────────────────────┐
│  开发阶段                                                │
│  1. pnpm dev                    → 启动 Next.js 开发服务器 │
│  2. pnpm electron:dev           → 启动 Electron 调试      │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│  构建阶段                                                │
│  1. pnpm build                  → 生成静态文件到 out/     │
│  2. pnpm electron:build         → 打包 Electron 应用      │
└─────────────────────────────────────────────────────────┘
```

### Electron 加载逻辑

| 模式 | 命令 | 加载来源 |
|------|------|----------|
| 开发 | `electron --dev` | `http://localhost:3000` (开发服务器) |
| 生产 | `electron` | `out/index.html` (本地静态文件) |

## 与原项目的区别

### 原来的 pkpmagentdesktop

- 纯 Electron 壳应用
- 加载远程 URL (`https://pkpm-agent.chat/`)
- 没有本地前端代码

### 现在的整合项目

- Electron + Next.js 一体化
- 加载本地静态文件 (`out/index.html`)
- 前端代码完全本地打包
- 无需依赖外部服务器

## 配置说明

### next.config.mjs

```javascript
const nextConfig = {
  output: "export",        // 静态导出模式
  assetPrefix: "./",       // 使用相对路径
  images: { unoptimized: true },  // 静态导出需要禁用图片优化
  trailingSlash: true,
};
```

### package.json (electron-builder 配置)

```json
{
  "build": {
    "appId": "com.pkpm.agent.desktop",
    "productName": "PKPM Agent",
    "files": [
      "out/**/*",           // 包含 Next.js 构建输出
      "electron/**/*"       // 包含 Electron 文件
    ],
    "extraResources": [
      {
        "from": "out",
        "to": "out"
      }
    ]
  }
}
```

## 注意事项

1. **构建顺序**：必须先运行 `pnpm build` 生成 `out/` 目录，再运行 Electron 打包

2. **静态导出限制**：
   - Next.js 的 `output: "export"` 模式不支持 API Routes
   - 动态路由需要设置 `generateStaticParams`
   - 图片必须使用 `unoptimized: true`

3. **路径问题**：
   - 使用 `assetPrefix: "./"` 确保资源使用相对路径
   - Electron 中使用 `loadFile()` 加载本地文件

4. **安全设置**：
   - `nodeIntegration: false`（禁用 Node API）
   - `contextIsolation: true`（启用上下文隔离）
   - 使用 preload.js 安全暴露必要 API

## 迁移说明

如果你之前使用 `pkpmagentdesktop`：

| 原命令 | 新命令 |
|--------|--------|
| `npm start` | `pnpm electron:preview` |
| `npm run dev` | `pnpm electron:dev` |
| `npm run build` | `pnpm electron:build` |

## 常见问题

### Q: 为什么 Electron 白屏？
A: 确保已经运行 `pnpm build` 生成了 `out/` 目录。

### Q: 如何调试？
A: 开发模式下按 F12 打开开发者工具。

### Q: 如何更新版本？
A: 修改 `package.json` 中的 `version` 字段，然后重新构建。

### Q: 图标放在哪里？
A: 放在 `electron/assets/` 目录下：
- Windows: `icon.ico` (256x256)
- macOS: `icon.icns`
- Linux: `icon.png`

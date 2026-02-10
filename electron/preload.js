const { contextBridge } = require('electron');

// 安全地暴露 API 给渲染进程
// 目前不需要暴露特定的 Node.js API
// 如果将来需要与主进程通信，可以在这里添加

contextBridge.exposeInMainWorld('electronAPI', {
  // 示例：暴露平台信息
  platform: process.platform,
  // 可以在这里添加更多安全的 API 暴露
});

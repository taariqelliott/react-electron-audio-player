# Phase 1.4 — Set up main/renderer IPC bridge

Status: Done

Use `contextBridge` in preload to expose a clean `window.musicPlayer` object to the renderer. Register matching `ipcMain.handle` for every exposed function in main. Renderer never touches fs or SQLite directly.
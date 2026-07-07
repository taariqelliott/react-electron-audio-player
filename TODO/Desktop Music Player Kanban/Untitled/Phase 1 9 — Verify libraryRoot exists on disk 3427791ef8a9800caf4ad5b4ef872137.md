# Phase 1.9 — Verify libraryRoot exists on disk

Status: Done

Run `fs.existsSync(libraryRoot)` via IPC after loading config. If the folder no longer exists on disk show a folder not found screen with an option to reselect.
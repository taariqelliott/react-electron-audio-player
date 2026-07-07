# Phase 6.2 — Rename track file on disk

Status: To Do

If the filename field is edited main runs `fs.renameSync(oldPath, newPath)` before updating the manifest. Manifest entry updates to reflect the new filename.
# Phase 2.5 — Scan libraryRoot for folders on startup

Status: Done

Main reads `libraryRoot` with `fs.readdirSync`, filters to subdirectories that contain a `.manifest.json`, reads each manifest file.
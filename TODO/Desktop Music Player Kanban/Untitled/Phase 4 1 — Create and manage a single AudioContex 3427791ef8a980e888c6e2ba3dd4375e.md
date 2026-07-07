# Phase 4.1 — Create and manage a single AudioContext instance

Status: Done

Create one `AudioContext` in the renderer when the app loads and keep it alive for the entire session. Store it in a ref. Use `getOrCreateAudioContext` helper to safely access it — creates a new one if closed or missing.
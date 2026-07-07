# Phase 4.5 — Track playback position with AudioContext.currentTime

Status: Done

Calculate position as `audioContext.currentTime - playbackStartedAtRef`. Update via `requestAnimationFrame` loop stored in `animationFrameIdRef`. Cancel loop on pause and stop.
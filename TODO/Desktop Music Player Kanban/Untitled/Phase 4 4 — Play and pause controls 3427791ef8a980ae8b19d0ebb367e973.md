# Phase 4.4 — Play and pause controls

Status: Done

Play — create new source node, start from `playbackPausedAtRef`. Pause — stop source, record position in `playbackPausedAtRef`. Use `wasStoppedManuallyRef` flag to distinguish manual stop from natural track end.
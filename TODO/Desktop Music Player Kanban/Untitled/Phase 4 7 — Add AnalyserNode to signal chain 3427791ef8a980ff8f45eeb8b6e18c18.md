# Phase 4.7 — Add AnalyserNode to signal chain

Status: To Do

Create an `AnalyserNode` once and insert it between gain and destination. Set `fftSize` to 2048 for 1024 frequency bins. This feeds the visualizer. Final chain: source → gain → analyser → destination.
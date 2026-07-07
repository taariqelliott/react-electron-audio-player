# Phase 4.3 — Create AudioBufferSourceNode and connect to destination

Status: Done

Create a new `AudioBufferSourceNode`, attach the decoded buffer, connect directly to `audioContext.destination`. Source nodes are single use — create a new one every time play is called.
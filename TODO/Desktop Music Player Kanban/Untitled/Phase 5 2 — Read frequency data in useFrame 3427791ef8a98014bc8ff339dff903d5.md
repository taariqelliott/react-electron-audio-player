# Phase 5.2 — Read frequency data in useFrame

Status: To Do

Inside the R3F scene create a `Uint8Array` of size `analyser.frequencyBinCount`. Use `useFrame` to call `analyser.getByteFrequencyData(data)` every frame. This gives you 1024 frequency values between 0 and 255 to drive geometry.
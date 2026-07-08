# Audio Player

A free, open-source, local-first desktop music player. Your library lives in a
folder on your disk — no accounts, no cloud, no tracking.

Built with Electron, React, TypeScript, Tailwind, SQLite, and the Web Audio API.

## Features

- **Local library** — pick any folder as your library; albums are just folders with a manifest, so your files stay yours
- **Albums & tracks** — create albums with artwork, add audio files (MP3, WAV, FLAC, OGG, M4A, AAC, and more), reorder by drag and drop
- **Playback** — streaming engine with instant track switching and click-free fades on play/pause/stop/seek
- **Player controls** — seek bar, next/previous, volume with mute toggle, live equalizer driven by real frequency data
- **Inline editing** — rename tracks and artists right in the table; edit album details and artwork from the sidebar
- **Search** — ⌘K search across albums and tracks, jump straight to a result
- **Extras** — missing-file detection, rebuildable search index, light/dark theme, editable profile

## Running it

```bash
npm install
npm run dev        # development
npm run build:mac  # package for macOS (Apple Silicon)
npm run build:win  # package for Windows
```

Packaged builds are unsigned. On macOS, allow the app under
System Settings → Privacy & Security → "Open Anyway" on first launch.
On Windows, click through the SmartScreen warning ("More info" → "Run anyway").

## Disclaimer

This is a young project — expect rough edges and the occasional bug. Things
will break and then get fixed. Bug reports are welcome.

## License

[MIT](LICENSE)

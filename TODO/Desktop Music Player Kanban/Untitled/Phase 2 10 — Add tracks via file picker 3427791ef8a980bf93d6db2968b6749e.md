# Phase 2.10 — Add tracks via file picker

Status: In progress

Trigger `dialog.showOpenDialog` with `multiSelections` and audio file filters from an "Add Tracks" button in the folder detail view. Send selected file paths to main via IPC.

---

For each selected file the following gets populated:

- `filename` — taken from the file picked in the dialog
- `title` — defaults to filename without extension, user can edit later in Phase 6
- `artist` — empty string by default, user can edit later in Phase 6
- `duration` — read from file metadata via `music-metadata` in main, no user input needed
- `trackOrder` — calculated as `tracks.length + 1` from the current manifest
- `folderPath` — comes from the active folder's data, no user input needed
- `folderId` — comes from the active folder's SQLite id, no user input needed
- `addedAt` — `new Date().toISOString()`, generated automatically

---

Then for each file:

- Copy file to folder via `fs.copyFileSync(sourcePath, destinationPath)`
- Insert track row into SQLite `tracks` table
- Push track entry into manifest `tracks` array
- Update `totalTracks` count
- Update `updatedAt` timestamp
- Write manifest back to disk
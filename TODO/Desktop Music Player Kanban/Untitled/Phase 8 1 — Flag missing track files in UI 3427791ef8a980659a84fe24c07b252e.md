# Phase 8.1 — Flag missing track files in UI

Status: To Do

On folder load check each track file exists with `fs.existsSync`. Flag missing ones in the `Table` with a shadcn `Badge` showing missing status.
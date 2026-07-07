# Phase 1.5 — Write config.json on first launch

Status: Done

On startup check if `config.json` exists in `userData`. If it does not exist create it with `libraryRoot: null`.
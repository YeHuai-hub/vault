# Vault

Windows desktop password manager built with **Tauri 2 + React 18 + TypeScript + SQLite**.

## Features

- **Strong encryption** — PBKDF2 (600k iterations) + AES-256-GCM, encryption key never leaves Rust memory
- **Vault lifecycle** — create, unlock (master password), lock, change password
- **Entry CRUD** — store usernames, passwords, notes, custom fields, TOTP secrets
- **Categories & tags** — organize entries, filter by category/tag, batch operations
- **Search** — real-time fuzzy search with debounce
- **Password generator** — configurable length, uppercase, digits, symbols
- **TOTP 2FA** — built-in time-based one-time password generator
- **Auto-lock** — configurable idle timeout (1/5/15/30 minutes)
- **Clipboard security** — auto-clears copied passwords after 30 seconds
- **Import/Export** — encrypted JSON and plaintext CSV
- **Dark/Light theme** — toggle in settings
- **Undo delete** — 5-second window to recover deleted entries

## Dev

```bash
# Prerequisites: Rust, Node.js, Windows (for rc.exe)
npm install
npx tauri dev

# Frontend only
npm run dev

# Build .msi installer
npx tauri build
```

On Windows, `rc.exe` must be in PATH:
```bash
export PATH="/c/Program Files (x86)/Windows Kits/10/bin/10.0.26100.0/x64:$PATH"
```

## Tech Stack

| Layer | Tech |
|-------|------|
| Desktop shell | Tauri 2 |
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| Database | SQLite (rusqlite, bundled) |
| Encryption | PBKDF2 + AES-256-GCM (Rust) |
| Package | NSIS .msi installer |

## Security

- Master password → PBKDF2 (600k iterations, SHA-256) → 256-bit key
- Sensitive data encrypted as JSON → AES-256-GCM with random nonce
- Encryption key stays in Rust state, never exposed to JavaScript
- Locking the vault drops the key from memory entirely
- Data stored at `%APPDATA%\com.vault.app\vault.db` + `vault.auth`

## Project Structure

```
src/              — React frontend
  components/     — UI components (vault, entries, layout, shared)
  contexts/       — React Context state management
  hooks/          — useAutolock, useDebounce
  types/          — TypeScript types
src-tauri/        — Rust backend
  src/
    commands/     — Tauri IPC commands (vault, entries, categories, tags, utils, settings)
    crypto/       — PBKDF2 key derivation + AES-256-GCM cipher
    db/           — SQLite queries and migrations
    models/       — Data structures
```

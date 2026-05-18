# Vault — Windows Desktop Password Manager

Tauri 2 + React 18 + TypeScript + SQLite

## Commands

```bash
# Development (must include rc.exe in PATH)
export PATH="/c/Program Files (x86)/Windows Kits/10/bin/10.0.26100.0/x64:$PATH"
npx tauri dev

# Frontend only
npm run dev

# Build
npx tauri build
```

## Architecture

- **Security**: PBKDF2 key derivation → AES-256-GCM encrypt/decrypt. Key never leaves Rust memory.
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS (dark theme, slate-950 background, cyan-500 accent)
- **Backend**: Rust Tauri commands, rusqlite (bundled), crypto in `src-tauri/src/crypto/`
- **App data**: `%APPDATA%\com.vault.app\vault.db` + `vault.auth`

See `00-项目/实施计划.md` for full design doc and milestone plan.

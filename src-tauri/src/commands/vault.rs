use std::fs;
use std::path::PathBuf;
use tauri::State;

use crate::crypto::{cipher, key};
use crate::db;
use crate::models::vault::VaultStatus;
use crate::AppState;

pub fn app_data_dir_path() -> PathBuf {
    app_data_dir()
}

fn app_data_dir() -> PathBuf {
    let mut path = dirs_next().unwrap_or_else(|| PathBuf::from("."));
    path.push("vault.db");
    path
}

fn auth_file_path() -> PathBuf {
    let mut path = dirs_next().unwrap_or_else(|| PathBuf::from("."));
    path.push("vault.auth");
    path
}

fn dirs_next() -> Option<PathBuf> {
    #[cfg(target_os = "windows")]
    {
        std::env::var("APPDATA")
            .ok()
            .map(|p| PathBuf::from(p).join("com.vault.app"))
    }
    #[cfg(not(target_os = "windows"))]
    {
        dirs::data_dir().map(|p| p.join("com.vault.app"))
    }
}

#[tauri::command]
pub fn vault_exists() -> Result<bool, String> {
    Ok(auth_file_path().exists())
}

#[tauri::command]
pub fn vault_status(state: State<AppState>) -> Result<VaultStatus, String> {
    if !auth_file_path().exists() {
        return Ok(VaultStatus::NotCreated);
    }
    let key = state.encryption_key.lock().map_err(|e| e.to_string())?;
    if key.is_some() {
        Ok(VaultStatus::Unlocked)
    } else {
        Ok(VaultStatus::Locked)
    }
}

#[tauri::command]
pub fn create_vault(master_password: String, state: State<AppState>) -> Result<(), String> {
    if auth_file_path().exists() {
        return Err("Vault already exists".to_string());
    }

    let dir = dirs_next().ok_or("Cannot determine app data directory")?;
    fs::create_dir_all(&dir).map_err(|e| format!("Failed to create app dir: {e}"))?;

    // Derive key once, then hash it for auth (fast)
    let salt = key::generate_salt();
    let encryption_key = key::derive_key(&master_password, &salt)?;
    let auth_hash = key::key_to_auth_hash(&encryption_key);

    // Save auth file: salt + "\n" + hash
    let auth_content = format!("{}\n{}", salt, auth_hash);
    fs::write(auth_file_path(), &auth_content)
        .map_err(|e| format!("Failed to write auth file: {e}"))?;

    // Initialize database
    let db_path = app_data_dir();
    let conn = rusqlite::Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {e}"))?;
    db::initialize(&conn).map_err(|e| format!("Failed to init db: {e}"))?;

    // Store connection and key in state
    let mut db_lock = state.db.lock().map_err(|e| e.to_string())?;
    *db_lock = Some(conn);

    let mut key_lock = state.encryption_key.lock().map_err(|e| e.to_string())?;
    *key_lock = Some(encryption_key);

    Ok(())
}

#[tauri::command]
pub fn unlock_vault(master_password: String, state: State<AppState>) -> Result<(), String> {
    if !auth_file_path().exists() {
        return Err("Vault does not exist".to_string());
    }

    let auth_content =
        fs::read_to_string(auth_file_path()).map_err(|e| format!("Failed to read auth: {e}"))?;
    let parts: Vec<&str> = auth_content.splitn(2, '\n').collect();
    if parts.len() != 2 {
        return Err("Invalid auth file".to_string());
    }
    let salt = parts[0];
    let stored_hash = parts[1];

    // Derive key first (expensive), then verify via fast hash
    let encryption_key = key::derive_key(&master_password, salt)?;
    let computed_hash = key::key_to_auth_hash(&encryption_key);
    if computed_hash != stored_hash {
        return Err("Incorrect master password".to_string());
    }
    let db_path = app_data_dir();
    let conn = rusqlite::Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {e}"))?;
    conn.execute("PRAGMA foreign_keys = ON", [])
        .map_err(|e| format!("Failed to enable foreign keys: {e}"))?;

    let mut db_lock = state.db.lock().map_err(|e| e.to_string())?;
    *db_lock = Some(conn);

    let mut key_lock = state.encryption_key.lock().map_err(|e| e.to_string())?;
    *key_lock = Some(encryption_key);

    Ok(())
}

#[tauri::command]
pub fn lock_vault(state: State<AppState>) -> Result<(), String> {
    let mut db_lock = state.db.lock().map_err(|e| e.to_string())?;
    *db_lock = None;

    let mut key_lock = state.encryption_key.lock().map_err(|e| e.to_string())?;
    *key_lock = None;

    Ok(())
}

#[tauri::command]
pub fn change_master_password(
    old_password: String,
    new_password: String,
    state: State<AppState>,
) -> Result<(), String> {
    if !auth_file_path().exists() {
        return Err("Vault does not exist".to_string());
    }

    let auth_content =
        fs::read_to_string(auth_file_path()).map_err(|e| format!("Failed to read auth: {e}"))?;
    let parts: Vec<&str> = auth_content.splitn(2, '\n').collect();
    if parts.len() != 2 {
        return Err("Invalid auth file".to_string());
    }
    let old_salt = parts[0];
    let stored_hash = parts[1];

    // Derive old key first, then verify via fast hash
    let old_key = key::derive_key(&old_password, old_salt)?;
    let computed_hash = key::key_to_auth_hash(&old_key);
    if computed_hash != stored_hash {
        return Err("Incorrect current password".to_string());
    }

    // Generate new key and hash (single PBKDF2)
    let new_salt = key::generate_salt();
    let new_key = key::derive_key(&new_password, &new_salt)?;
    let new_auth_hash = key::key_to_auth_hash(&new_key);

    // Re-encrypt all entries with new key
    let db_lock = state.db.lock().map_err(|e| e.to_string())?;
    if let Some(ref conn) = *db_lock {
        let encrypted_rows = {
            let mut stmt = conn
                .prepare("SELECT id, encrypted_data FROM entries")
                .map_err(|e| format!("DB error: {e}"))?;
            let rows = stmt
                .query_map([], |row| {
                    Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
                })
                .map_err(|e| format!("DB error: {e}"))?;
            let mut results = Vec::new();
            for row in rows {
                results.push(row.map_err(|e| format!("DB error: {e}"))?);
            }
            results
        };

        for (id, encrypted_json) in encrypted_rows {
            let plaintext = cipher::decrypt(&encrypted_json, &old_key)?;
            let new_encrypted = cipher::encrypt(&plaintext, &new_key)?;
            conn.execute(
                "UPDATE entries SET encrypted_data = ?1 WHERE id = ?2",
                rusqlite::params![new_encrypted, id],
            )
            .map_err(|e| format!("DB error: {e}"))?;
        }
    }
    drop(db_lock);

    // Update auth file
    let new_auth_content = format!("{}\n{}", new_salt, new_auth_hash);
    fs::write(auth_file_path(), new_auth_content)
        .map_err(|e| format!("Failed to write auth file: {e}"))?;

    // Update key in state
    let mut key_lock = state.encryption_key.lock().map_err(|e| e.to_string())?;
    *key_lock = Some(new_key);

    Ok(())
}

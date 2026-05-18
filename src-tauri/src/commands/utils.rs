use std::fs;
use rand::Rng;
use tauri::State;

use crate::crypto::cipher;
use crate::db::entries as db_entries;
use crate::models::entry::{CreateEntry, EncryptedEntryData};
use crate::AppState;

#[tauri::command]
pub fn generate_password(
    length: u8,
    uppercase: bool,
    digits: bool,
    symbols: bool,
) -> Result<String, String> {
    let length = length.clamp(4, 128) as usize;
    let mut charset = String::from("abcdefghijklmnopqrstuvwxyz");
    if uppercase {
        charset.push_str("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
    }
    if digits {
        charset.push_str("0123456789");
    }
    if symbols {
        charset.push_str("!@#$%^&*()-_=+[]{};:,.<>?");
    }

    let charset_bytes = charset.as_bytes();
    let mut rng = rand::rngs::OsRng;
    let password: String = (0..length)
        .map(|_| {
            let idx = rng.gen_range(0..charset_bytes.len());
            charset_bytes[idx] as char
        })
        .collect();

    Ok(password)
}

#[tauri::command]
pub fn copy_to_clipboard(
    text: String,
    state: State<AppState>,
) -> Result<(), String> {
    let mut timer = state.clipboard_timer.lock().map_err(|e| e.to_string())?;
    *timer = Some(text);
    Ok(())
}

#[tauri::command]
pub fn clear_clipboard(state: State<AppState>) -> Result<(), String> {
    let mut timer = state.clipboard_timer.lock().map_err(|e| e.to_string())?;
    *timer = None;
    Ok(())
}

#[derive(serde::Serialize, serde::Deserialize)]
struct ExportEntry {
    title: String,
    website: Option<String>,
    username: String,
    password: String,
    notes: String,
}

#[tauri::command]
pub fn export_vault(path: String, format: String, state: State<AppState>) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.as_ref().ok_or("Vault is locked")?;

    let key_lock = state.encryption_key.lock().map_err(|e| e.to_string())?;
    let key = key_lock.as_ref().ok_or("Vault is locked")?;

    let entries = db_entries::list(conn, None, None, None).map_err(|e| e.to_string())?;

    let mut export_entries: Vec<ExportEntry> = Vec::new();

    for entry in &entries {
        let encrypted_data = db_entries::get_encrypted_data(conn, &entry.id)
            .map_err(|e| e.to_string())?
            .ok_or("Entry data missing")?;

        let plaintext = cipher::decrypt(&encrypted_data, key)?;
        let data: EncryptedEntryData =
            serde_json::from_str(&plaintext).map_err(|e| format!("Parse error: {e}"))?;

        export_entries.push(ExportEntry {
            title: entry.title.clone(),
            website: entry.website.clone(),
            username: data.username,
            password: data.password,
            notes: data.notes,
        });
    }

    match format.as_str() {
        "csv" => {
            let mut csv = String::from("title,website,username,password,notes\n");
            for e in &export_entries {
                let escape = |s: &str| format!("\"{}\"", s.replace('"', "\"\""));
                csv.push_str(&format!(
                    "{},{},{},{},{}\n",
                    escape(&e.title),
                    escape(&e.website.as_deref().unwrap_or("")),
                    escape(&e.username),
                    escape(&e.password),
                    escape(&e.notes),
                ));
            }
            fs::write(&path, csv).map_err(|e| format!("Write error: {e}"))?;
        }
        _ => {
            let json = serde_json::to_string_pretty(&export_entries)
                .map_err(|e| format!("Serialization error: {e}"))?;
            fs::write(&path, json).map_err(|e| format!("Write error: {e}"))?;
        }
    }

    Ok(())
}

#[tauri::command]
pub fn import_vault(path: String, format: String, state: State<AppState>) -> Result<u32, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.as_ref().ok_or("Vault is locked")?;

    let key_lock = state.encryption_key.lock().map_err(|e| e.to_string())?;
    let key = key_lock.as_ref().ok_or("Vault is locked")?;

    let content = fs::read_to_string(&path).map_err(|e| format!("Read error: {e}"))?;

    let import_entries: Vec<ExportEntry> = match format.as_str() {
        "csv" => {
            let mut entries = Vec::new();
            let mut lines = content.lines();
            lines.next(); // skip header
            for line in lines {
                let fields: Vec<&str> = line.split(',').collect();
                if fields.len() >= 5 {
                    let unescape = |s: &str| s.trim_matches('"').replace("\"\"", "\"");
                    entries.push(ExportEntry {
                        title: unescape(fields[0]),
                        website: {
                            let w = unescape(fields[1]);
                            if w.is_empty() { None } else { Some(w) }
                        },
                        username: unescape(fields[2]),
                        password: unescape(fields[3]),
                        notes: unescape(fields[4]),
                    });
                }
            }
            entries
        }
        _ => {
            serde_json::from_str(&content).map_err(|e| format!("Parse error: {e}"))?
        }
    };

    let now = chrono::Utc::now().to_rfc3339();
    let mut count = 0u32;

    for entry in &import_entries {
        let ec_data = EncryptedEntryData {
            username: entry.username.clone(),
            password: entry.password.clone(),
            notes: entry.notes.clone(),
            custom_fields: Vec::new(),
            totp_secret: None,
        };
        let json = serde_json::to_string(&ec_data).map_err(|e| format!("Serialization error: {e}"))?;
        let encrypted_data = cipher::encrypt(&json, key)?;

        let create = CreateEntry {
            category_id: None,
            title: entry.title.clone(),
            website: entry.website.clone(),
            username: entry.username.clone(),
            password: entry.password.clone(),
            notes: Some(entry.notes.clone()),
            custom_fields: None,
            tag_ids: None,
            totp_secret: None,
        };

        let id = uuid::Uuid::new_v4().to_string();
        db_entries::insert(conn, &create, &id, &encrypted_data, &now)
            .map_err(|e| format!("Insert error: {e}"))?;
        count += 1;
    }

    Ok(count)
}

#[tauri::command]
pub fn backup_vault(directory: String, state: State<AppState>) -> Result<String, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    if db.is_none() { return Err("Vault is locked".to_string()); }

    let src = crate::commands::vault::app_data_dir_path();
    if !src.exists() { return Err("No vault database found".to_string()); }

    std::fs::create_dir_all(&directory).map_err(|e| format!("Cannot create backup dir: {e}"))?;

    let ts = chrono::Utc::now().format("%Y%m%d_%H%M%S");
    let dest = std::path::PathBuf::from(&directory).join(format!("vault_backup_{}.db", ts));

    std::fs::copy(&src, &dest).map_err(|e| format!("Backup failed: {e}"))?;

    Ok(dest.to_string_lossy().to_string())
}

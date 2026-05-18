use rusqlite::Connection;
use tauri::State;

use crate::crypto::cipher;
use crate::db::{entries as db_entries, tags as db_tags};
use crate::models::entry::{CreateEntry, EncryptedEntryData, Entry, UpdateEntry};
use crate::AppState;

fn with_db<T>(
    state: &State<AppState>,
    f: impl FnOnce(&Connection) -> Result<T, String>,
) -> Result<T, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    match &*db {
        Some(conn) => f(conn),
        None => Err("Vault is locked".to_string()),
    }
}

fn decrypt_entry_data(encrypted_data: &str, key: &[u8; 32]) -> Result<(String, String, String, Vec<crate::models::entry::CustomField>, Option<String>), String> {
    let plaintext = cipher::decrypt(encrypted_data, key)?;
    let data: EncryptedEntryData =
        serde_json::from_str(&plaintext).map_err(|e| format!("Failed to parse entry data: {e}"))?;
    Ok((data.username, data.password, data.notes, data.custom_fields, data.totp_secret))
}

fn encrypt_entry_data(
    username: &str,
    password: &str,
    notes: &str,
    custom_fields: &[crate::models::entry::CustomField],
    totp_secret: Option<&str>,
    key: &[u8; 32],
) -> Result<String, String> {
    let data = EncryptedEntryData {
        username: username.to_string(),
        password: password.to_string(),
        notes: notes.to_string(),
        custom_fields: custom_fields.to_vec(),
        totp_secret: totp_secret.map(|s| s.to_string()),
    };
    let json = serde_json::to_string(&data).map_err(|e| format!("Serialization failed: {e}"))?;
    cipher::encrypt(&json, key)
}

fn populate_entry(entry: &mut Entry, conn: &Connection, key: &[u8; 32]) -> Result<(), String> {
    let encrypted_data = db_entries::get_encrypted_data(conn, &entry.id)
        .map_err(|e| e.to_string())?
        .ok_or("Entry data missing")?;

    let (username, password, notes, custom_fields, _totp) = decrypt_entry_data(&encrypted_data, key)?;
    entry.username = Some(username);
    entry.password = Some(password);
    entry.notes = Some(notes);
    entry.custom_fields = Some(custom_fields);

    let tag_names = db_tags::get_tags_for_entry(conn, &entry.id).map_err(|e| e.to_string())?;
    let tag_ids = db_tags::get_tag_ids_for_entry(conn, &entry.id).map_err(|e| e.to_string())?;
    entry.tags = Some(tag_names);
    entry.tag_ids = Some(tag_ids);

    Ok(())
}

#[tauri::command]
pub fn list_entries(
    category_id: Option<i64>,
    search: Option<String>,
    tag_id: Option<i64>,
    state: State<AppState>,
) -> Result<Vec<Entry>, String> {
    with_db(&state, |conn| {
        let mut entries = db_entries::list(conn, category_id, search.as_deref(), tag_id)
            .map_err(|e| e.to_string())?;

        let key_lock = state.encryption_key.lock().map_err(|e| e.to_string())?;
        let key = key_lock.as_ref().ok_or("Vault is locked")?;

        for entry in &mut entries {
            populate_entry(entry, conn, key)?;
        }

        Ok(entries)
    })
}

#[tauri::command]
pub fn get_entry(id: String, state: State<AppState>) -> Result<Entry, String> {
    with_db(&state, |conn| {
        let mut entry = db_entries::get_by_id(conn, &id)
            .map_err(|e| e.to_string())?
            .ok_or("Entry not found")?;

        let key_lock = state.encryption_key.lock().map_err(|e| e.to_string())?;
        let key = key_lock.as_ref().ok_or("Vault is locked")?;
        populate_entry(&mut entry, conn, key)?;

        Ok(entry)
    })
}

#[tauri::command]
pub fn create_entry(entry: CreateEntry, state: State<AppState>) -> Result<Entry, String> {
    with_db(&state, |conn| {
        let key_lock = state.encryption_key.lock().map_err(|e| e.to_string())?;
        let key = key_lock.as_ref().ok_or("Vault is locked")?;

        let encrypted_data = encrypt_entry_data(
            &entry.username,
            &entry.password,
            entry.notes.as_deref().unwrap_or(""),
            entry.custom_fields.as_deref().unwrap_or(&[]),
            entry.totp_secret.as_deref(),
            key,
        )?;

        let id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();

        let mut saved = db_entries::insert(conn, &entry, &id, &encrypted_data, &now)
            .map_err(|e| e.to_string())?;

        if let Some(ref tag_ids) = entry.tag_ids {
            db_tags::set_entry_tags(conn, &id, tag_ids).map_err(|e| e.to_string())?;
            let tags = db_tags::get_tags_for_entry(conn, &id).map_err(|e| e.to_string())?;
            saved.tags = Some(tags);
        }

        saved.username = Some(entry.username);
        saved.password = Some(entry.password);
        saved.notes = entry.notes;
        saved.custom_fields = entry.custom_fields;

        Ok(saved)
    })
}

#[tauri::command]
pub fn update_entry(id: String, entry: UpdateEntry, state: State<AppState>) -> Result<Entry, String> {
    // Do the database update first, then fetch the updated entry outside the closure
    with_db(&state, |conn| {
        let key_lock = state.encryption_key.lock().map_err(|e| e.to_string())?;
        let key = key_lock.as_ref().ok_or("Vault is locked")?;

        let encrypted_data = if entry.username.is_some() || entry.password.is_some() || entry.notes.is_some() || entry.custom_fields.is_some() {
            let old_encrypted = db_entries::get_encrypted_data(conn, &id)
                .map_err(|e| e.to_string())?
                .ok_or("Entry data missing")?;
            let (old_username, old_password, old_notes, old_custom_fields, old_totp) = decrypt_entry_data(&old_encrypted, key)?;

            let new_username = entry.username.as_deref().unwrap_or(&old_username);
            let new_password = entry.password.as_deref().unwrap_or(&old_password);
            let new_notes = entry.notes.as_deref().unwrap_or(&old_notes);
            let new_custom_fields = entry.custom_fields.as_deref().unwrap_or(&old_custom_fields);
            let new_totp = entry.totp_secret.as_deref().or(old_totp.as_deref());

            Some(encrypt_entry_data(new_username, new_password, new_notes, new_custom_fields, new_totp, key)?)
        } else {
            None
        };

        let now = chrono::Utc::now().to_rfc3339();
        db_entries::update(conn, &id, &entry, encrypted_data.as_deref(), &now)
            .map_err(|e| e.to_string())?;

        if let Some(ref tag_ids) = entry.tag_ids {
            db_tags::set_entry_tags(conn, &id, tag_ids).map_err(|e| e.to_string())?;
        }

        Ok(())
    })?;

    // Fetch the updated entry (outside the closure, so state is not double-borrowed)
    get_entry(id, state)
}

#[tauri::command]
pub fn delete_entry(id: String, state: State<AppState>) -> Result<(), String> {
    with_db(&state, |conn| {
        db_entries::delete(conn, &id).map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn toggle_favorite(id: String, state: State<AppState>) -> Result<Entry, String> {
    with_db(&state, |conn| {
        db_entries::toggle_favorite(conn, &id).map_err(|e| e.to_string())
    })?;

    // Fetch the updated entry (outside the closure)
    get_entry(id, state)
}

#[tauri::command]
pub fn generate_totp(id: String, state: State<AppState>) -> Result<String, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.as_ref().ok_or("Vault is locked")?;

    let key_lock = state.encryption_key.lock().map_err(|e| e.to_string())?;
    let key = key_lock.as_ref().ok_or("Vault is locked")?;

    let encrypted_data = db_entries::get_encrypted_data(conn, &id)
        .map_err(|e| e.to_string())?
        .ok_or("Entry not found")?;

    let (_, _, _, _, totp_secret) = decrypt_entry_data(&encrypted_data, key)?;
    let secret = totp_secret.ok_or("No TOTP secret configured")?;

    let totp = totp_rs::TOTP::new(
        totp_rs::Algorithm::SHA1,
        6,
        1,
        30,
        secret.into_bytes(),
    ).map_err(|e| format!("TOTP error: {e}"))?;

    Ok(totp.generate_current().map_err(|e| format!("TOTP generate error: {e}"))?)
}

#[tauri::command]
pub fn batch_delete(ids: Vec<String>, state: State<AppState>) -> Result<u32, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.as_ref().ok_or("Vault is locked")?;
    let mut count = 0u32;
    for id in &ids {
        db_entries::delete(conn, id).map_err(|e| e.to_string())?;
        count += 1;
    }
    Ok(count)
}

#[tauri::command]
pub fn batch_move_category(ids: Vec<String>, category_id: Option<i64>, state: State<AppState>) -> Result<u32, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.as_ref().ok_or("Vault is locked")?;
    let now = chrono::Utc::now().to_rfc3339();
    let mut count = 0u32;
    for id in &ids {
        if let Some(cid) = category_id {
            conn.execute("UPDATE entries SET category_id = ?1, updated_at = ?2 WHERE id = ?3", rusqlite::params![cid, now, id])
                .map_err(|e| e.to_string())?;
        } else {
            conn.execute("UPDATE entries SET category_id = NULL, updated_at = ?1 WHERE id = ?2", rusqlite::params![now, id])
                .map_err(|e| e.to_string())?;
        }
        count += 1;
    }
    Ok(count)
}

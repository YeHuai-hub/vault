use tauri::State;
use crate::db;
use crate::AppState;

#[tauri::command]
pub fn get_setting(key: String, state: State<AppState>) -> Result<Option<String>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    match &*db {
        Some(conn) => db::settings::get(conn, &key).map_err(|e| e.to_string()),
        None => Err("Vault is locked".to_string()),
    }
}

#[tauri::command]
pub fn set_setting(key: String, value: String, state: State<AppState>) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    match &*db {
        Some(conn) => db::settings::set(conn, &key, &value).map_err(|e| e.to_string()),
        None => Err("Vault is locked".to_string()),
    }
}

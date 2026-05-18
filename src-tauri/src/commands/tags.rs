use tauri::State;

use crate::db;
use crate::models::tag::Tag;
use crate::AppState;

fn with_db<T>(
    state: &State<AppState>,
    f: impl FnOnce(&rusqlite::Connection) -> Result<T, String>,
) -> Result<T, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    match &*db {
        Some(conn) => f(conn),
        None => Err("Vault is locked".to_string()),
    }
}

#[tauri::command]
pub fn list_tags(state: State<AppState>) -> Result<Vec<Tag>, String> {
    with_db(&state, |conn| {
        db::tags::list_all(conn).map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn create_tag(name: String, state: State<AppState>) -> Result<Tag, String> {
    with_db(&state, |conn| {
        db::tags::create(conn, &name).map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn delete_tag(id: i64, state: State<AppState>) -> Result<(), String> {
    with_db(&state, |conn| {
        db::tags::delete(conn, id).map_err(|e| e.to_string())
    })
}

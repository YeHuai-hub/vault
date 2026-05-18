use tauri::State;

use crate::db;
use crate::models::category::Category;
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
pub fn list_categories(state: State<AppState>) -> Result<Vec<Category>, String> {
    with_db(&state, |conn| {
        db::categories::list_all(conn).map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn create_category(name: String, icon: Option<String>, state: State<AppState>) -> Result<Category, String> {
    with_db(&state, |conn| {
        db::categories::create(conn, &name, icon.as_deref()).map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn delete_category(id: i64, state: State<AppState>) -> Result<(), String> {
    with_db(&state, |conn| {
        db::categories::delete(conn, id).map_err(|e| e.to_string())
    })
}

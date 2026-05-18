mod commands;
mod crypto;
mod db;
mod models;

use std::sync::Mutex;

pub struct AppState {
    pub db: Mutex<Option<rusqlite::Connection>>,
    pub encryption_key: Mutex<Option<[u8; 32]>>,
    pub clipboard_timer: Mutex<Option<String>>,
}

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("Database error: {0}")]
    Database(String),
    #[error("Crypto error: {0}")]
    Crypto(String),
    #[error("Lock error: {0}")]
    Lock(String),
}

impl serde::Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState {
            db: Mutex::new(None),
            encryption_key: Mutex::new(None),
            clipboard_timer: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            commands::vault::vault_exists,
            commands::vault::vault_status,
            commands::vault::create_vault,
            commands::vault::unlock_vault,
            commands::vault::lock_vault,
            commands::vault::change_master_password,
            commands::entries::list_entries,
            commands::entries::get_entry,
            commands::entries::create_entry,
            commands::entries::update_entry,
            commands::entries::delete_entry,
            commands::entries::toggle_favorite,
            commands::entries::generate_totp,
            commands::entries::batch_delete,
            commands::entries::batch_move_category,
            commands::categories::list_categories,
            commands::categories::create_category,
            commands::categories::delete_category,
            commands::tags::list_tags,
            commands::tags::create_tag,
            commands::tags::delete_tag,
            commands::utils::generate_password,
            commands::utils::copy_to_clipboard,
            commands::utils::clear_clipboard,
            commands::utils::export_vault,
            commands::utils::import_vault,
            commands::utils::backup_vault,
            commands::settings::get_setting,
            commands::settings::set_setting,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

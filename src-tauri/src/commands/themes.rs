use std::path::PathBuf;

use serde_json::Value;
use tauri::State;

use crate::config::{ThemeStore, read_json_file};
use crate::error::AppError;

#[tauri::command]
pub async fn themes_list(store: State<'_, ThemeStore>) -> Result<Vec<Value>, AppError> {
    Ok(store.list())
}

/// Lê o arquivo escolhido no diálogo "Importar tema". A conversão e validação ficam no frontend.
#[tauri::command]
pub async fn themes_read_file(path: PathBuf) -> Result<Value, AppError> {
    read_json_file(&path)
}

#[tauri::command]
pub async fn themes_save(store: State<'_, ThemeStore>, theme: Value) -> Result<(), AppError> {
    store.save(&theme)
}

#[tauri::command]
pub async fn themes_delete(store: State<'_, ThemeStore>, id: String) -> Result<(), AppError> {
    store.delete(&id)
}

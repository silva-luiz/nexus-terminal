use serde::Deserialize;
use tauri::AppHandle;
use tauri_plugin_opener::OpenerExt;

use crate::cli;
use crate::config::paths;
use crate::error::AppError;

/// Pasta pedida na linha de comando (`nexus-terminal.exe -d C:\projeto`), se houver.
#[tauri::command]
pub fn app_start_dir() -> Option<String> {
    let args: Vec<String> = std::env::args().collect();
    let cwd = std::env::current_dir()
        .map(|p| p.to_string_lossy().into_owned())
        .unwrap_or_default();
    cli::parse_start_dir(&args, &cwd)
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum AppFolder {
    Config,
    Logs,
}

/// Abre a pasta de configurações ou de logs no Explorer.
#[tauri::command]
pub fn open_app_folder(app: AppHandle, folder: AppFolder) -> Result<(), AppError> {
    let path = match folder {
        AppFolder::Config => paths::config_dir(),
        AppFolder::Logs => paths::logs_dir(),
    };
    std::fs::create_dir_all(&path)?;
    app.opener()
        .open_path(path.to_string_lossy(), None::<&str>)
        .map_err(AppError::config)
}

use tauri::State;

use crate::config::{LoadedSettings, Settings, SettingsState};
use crate::error::AppError;

#[tauri::command]
pub fn settings_load(state: State<'_, SettingsState>) -> LoadedSettings {
    state.snapshot()
}

#[tauri::command]
pub async fn settings_save(
    state: State<'_, SettingsState>,
    settings: Settings,
) -> Result<Settings, AppError> {
    state.save(settings)
}

#[tauri::command]
pub async fn shells_redetect(state: State<'_, SettingsState>) -> Result<Settings, AppError> {
    state.redetect()
}

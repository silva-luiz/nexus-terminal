use crate::shells::{self, ShellProfile};

#[tauri::command]
pub fn shells_list() -> Vec<ShellProfile> {
    shells::builtin_profiles()
}

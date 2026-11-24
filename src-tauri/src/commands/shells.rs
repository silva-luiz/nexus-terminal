use crate::shells;

/// Para cada comando, informa se o executável existe (usado para avisos na tela de shells).
#[tauri::command]
pub async fn commands_exist(commands: Vec<String>) -> Vec<bool> {
    commands.iter().map(|c| shells::command_exists(c)).collect()
}

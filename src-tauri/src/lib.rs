mod commands;
mod config;
mod error;
mod pty;
mod shells;

use tauri::{Manager, RunEvent};

use config::{SettingsState, SettingsStore, ThemeStore};
use pty::PtyManager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(PtyManager::default())
        .setup(|app| {
            let dir = SettingsStore::default_dir();
            app.manage(ThemeStore::new(dir.join("themes")));
            app.manage(SettingsState::init(SettingsStore::new(dir)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::pty::pty_spawn,
            commands::pty::pty_write,
            commands::pty::pty_resize,
            commands::pty::pty_kill,
            commands::pty::pty_has_running_process,
            commands::settings::settings_load,
            commands::settings::settings_save,
            commands::settings::shells_redetect,
            commands::shells::commands_exist,
            commands::themes::themes_list,
            commands::themes::themes_read_file,
            commands::themes::themes_save,
            commands::themes::themes_delete,
        ])
        .build(tauri::generate_context!())
        .expect("falha ao iniciar o Nexus Terminal");

    app.run(|app, event| {
        // Não deixar shells órfãos quando o app fecha.
        if let RunEvent::Exit = event {
            app.state::<PtyManager>().kill_all();
        }
    });
}

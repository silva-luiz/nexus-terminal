mod commands;
mod error;
mod pty;
mod shells;

use tauri::{Manager, RunEvent};

use pty::PtyManager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(PtyManager::default())
        .invoke_handler(tauri::generate_handler![
            commands::pty::pty_spawn,
            commands::pty::pty_write,
            commands::pty::pty_resize,
            commands::pty::pty_kill,
            commands::shells::shells_list,
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

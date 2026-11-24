mod cli;
mod commands;
mod config;
mod error;
mod pty;
mod shells;

use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager, RunEvent};
use tauri_plugin_log::{RotationStrategy, Target, TargetKind, TimezoneStrategy};
use tauri_plugin_window_state::StateFlags;

use config::{SettingsState, SettingsStore, ThemeStore, paths};
use pty::PtyManager;

const MAX_LOG_FILE_BYTES: u128 = 2 * 1024 * 1024;

/// Evento para o frontend abrir uma aba (ex.: o app foi chamado de novo com `-d pasta`).
#[derive(Clone, Serialize)]
struct OpenTabRequest {
    cwd: Option<String>,
}

fn on_second_instance(app: &AppHandle, args: Vec<String>, cwd: String) {
    let request = OpenTabRequest {
        cwd: cli::parse_start_dir(&args, &cwd),
    };
    log::info!("segunda instância: abrindo aba (pasta: {:?})", request.cwd);
    let _ = app.emit("open-tab", request);
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

fn log_plugin() -> tauri::plugin::TauriPlugin<tauri::Wry> {
    tauri_plugin_log::Builder::new()
        .clear_targets()
        .targets([
            Target::new(TargetKind::Stdout),
            Target::new(TargetKind::Folder {
                path: paths::logs_dir(),
                file_name: Some("nexus-terminal".into()),
            }),
        ])
        .level(log::LevelFilter::Info)
        .max_file_size(MAX_LOG_FILE_BYTES)
        .rotation_strategy(RotationStrategy::KeepSome(5))
        .timezone_strategy(TimezoneStrategy::UseLocal)
        .build()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        // Precisa ser o primeiro plugin: impede uma segunda janela e repassa os argumentos.
        .plugin(tauri_plugin_single_instance::init(on_second_instance))
        .plugin(log_plugin())
        .plugin(
            tauri_plugin_window_state::Builder::new()
                // Só tamanho, posição e maximizado; as bordas são sempre as do app.
                .with_state_flags(StateFlags::SIZE | StateFlags::POSITION | StateFlags::MAXIMIZED)
                .build(),
        )
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(PtyManager::default())
        .setup(|app| {
            log::info!("Nexus Terminal {} iniciando", app.package_info().version);
            let dir = SettingsStore::default_dir();
            app.manage(ThemeStore::new(dir.join("themes")));
            app.manage(SettingsState::init(SettingsStore::new(dir)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::app::app_start_dir,
            commands::app::open_app_folder,
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
            log::info!("encerrando: finalizando terminais abertos");
            app.state::<PtyManager>().kill_all();
        }
    });
}

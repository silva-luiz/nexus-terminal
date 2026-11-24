use tauri::State;
use tauri::ipc::Channel;

use crate::config::SettingsState;
use crate::error::AppError;
use crate::pty::{PtyEvent, PtyManager};
use crate::shells;

// Comandos `async` rodam fora da thread principal, então não travam a janela.

#[tauri::command]
pub async fn pty_spawn(
    pty: State<'_, PtyManager>,
    settings: State<'_, SettingsState>,
    profile_id: String,
    cwd: Option<String>,
    cols: u16,
    rows: u16,
    on_event: Channel<PtyEvent>,
) -> Result<String, AppError> {
    let settings = settings.settings();
    let profile = settings
        .profile(&profile_id)
        .ok_or(AppError::ProfileNotFound(profile_id.clone()))?;
    // Pasta pedida que não existe: usa a do perfil em vez de falhar.
    let cwd = cwd.filter(|dir| {
        let ok = std::path::Path::new(dir).is_dir();
        if !ok {
            log::warn!("pasta inicial inexistente ignorada: {dir}");
        }
        ok
    });
    let spec = profile.launch_spec(cwd, |name| std::env::var(name).ok());
    if !shells::command_exists(&spec.command) {
        log::warn!(
            "perfil {profile_id}: executável não encontrado: {}",
            spec.command
        );
        return Err(AppError::CommandNotFound(spec.command));
    }
    let result = pty.spawn(&spec, cols, rows, move |event| {
        // Se a interface já fechou o canal, não há a quem avisar.
        let _ = on_event.send(event);
    });
    match &result {
        Ok(id) => log::info!("sessão {id} iniciada (perfil {profile_id})"),
        Err(err) => log::error!("falha ao iniciar o perfil {profile_id}: {err}"),
    }
    result
}

#[tauri::command]
pub async fn pty_write(
    state: State<'_, PtyManager>,
    session_id: String,
    data: String,
) -> Result<(), AppError> {
    state.write(&session_id, &data)
}

#[tauri::command]
pub async fn pty_resize(
    state: State<'_, PtyManager>,
    session_id: String,
    cols: u16,
    rows: u16,
) -> Result<(), AppError> {
    state.resize(&session_id, cols, rows)
}

#[tauri::command]
pub async fn pty_kill(state: State<'_, PtyManager>, session_id: String) -> Result<(), AppError> {
    state.kill(&session_id)
}

/// Há algum programa rodando dentro do shell (além do próprio shell)?
#[tauri::command]
pub async fn pty_has_running_process(
    state: State<'_, PtyManager>,
    session_id: String,
) -> Result<bool, AppError> {
    Ok(match state.process_id(&session_id)? {
        Some(pid) => shells::has_running_process(pid),
        None => false,
    })
}

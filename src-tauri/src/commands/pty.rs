use tauri::State;
use tauri::ipc::Channel;

use crate::error::AppError;
use crate::pty::{PtyEvent, PtyManager};
use crate::shells;

// Comandos `async` rodam fora da thread principal, então não travam a janela.

#[tauri::command]
pub async fn pty_spawn(
    state: State<'_, PtyManager>,
    profile_id: String,
    cwd: Option<String>,
    cols: u16,
    rows: u16,
    on_event: Channel<PtyEvent>,
) -> Result<String, AppError> {
    let profile = shells::find_profile(&profile_id).ok_or(AppError::ProfileNotFound(profile_id))?;
    state.spawn(&profile, cwd, cols, rows, move |event| {
        // Se a interface já fechou o canal, não há a quem avisar.
        let _ = on_event.send(event);
    })
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

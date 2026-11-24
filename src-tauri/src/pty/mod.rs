mod decoder;
mod manager;

pub use manager::PtyManager;

use serde::Serialize;

/// Evento enviado ao frontend pelo canal de cada sessão.
#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum PtyEvent {
    /// Saída do shell (texto UTF-8).
    Data { data: String },
    /// O processo terminou.
    Exit { code: Option<u32> },
}

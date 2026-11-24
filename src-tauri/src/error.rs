use serde::{Serialize, Serializer};

/// Erros que podem chegar ao frontend. São serializados como texto legível.
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("sessão de terminal não encontrada: {0}")]
    SessionNotFound(String),

    #[error("perfil de shell não encontrado: {0}")]
    ProfileNotFound(String),

    #[error("executável não encontrado: {0}")]
    CommandNotFound(String),

    #[error("falha no terminal: {0}")]
    Pty(String),

    #[error("configuração inválida: {0}")]
    Config(String),

    #[error(transparent)]
    Io(#[from] std::io::Error),
}

impl AppError {
    pub fn pty(err: impl std::fmt::Display) -> Self {
        AppError::Pty(err.to_string())
    }

    pub fn config(err: impl std::fmt::Display) -> Self {
        AppError::Config(err.to_string())
    }
}

impl Serialize for AppError {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        serializer.serialize_str(&self.to_string())
    }
}

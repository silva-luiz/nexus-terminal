use std::path::PathBuf;

const APP_DIR: &str = "NexusTerminal";

fn env_dir(var: &str) -> PathBuf {
    std::env::var_os(var)
        .map(PathBuf::from)
        .unwrap_or_else(std::env::temp_dir)
}

/// `%APPDATA%\NexusTerminal`: settings.json e temas (docs/03-arquitetura.md §3.10).
pub fn config_dir() -> PathBuf {
    env_dir("APPDATA").join(APP_DIR)
}

/// `%LOCALAPPDATA%\NexusTerminal\logs`.
pub fn logs_dir() -> PathBuf {
    env_dir("LOCALAPPDATA").join(APP_DIR).join("logs")
}

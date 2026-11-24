use serde::Serialize;

/// Como iniciar um shell. Na Fase 3 os perfis passam a vir da detecção e do settings.json.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ShellProfile {
    pub id: String,
    pub name: String,
    pub command: String,
    pub args: Vec<String>,
    pub env: Vec<(String, String)>,
}

fn system_root() -> String {
    std::env::var("SystemRoot").unwrap_or_else(|_| r"C:\Windows".to_string())
}

/// Perfis que existem em qualquer Windows.
pub fn builtin_profiles() -> Vec<ShellProfile> {
    vec![
        ShellProfile {
            id: "powershell".into(),
            name: "Windows PowerShell".into(),
            command: format!(
                r"{}\System32\WindowsPowerShell\v1.0\powershell.exe",
                system_root()
            ),
            args: vec!["-NoLogo".into()],
            env: vec![],
        },
        ShellProfile {
            id: "cmd".into(),
            name: "Prompt de Comando".into(),
            command: std::env::var("ComSpec").unwrap_or_else(|_| "cmd.exe".to_string()),
            args: vec![],
            env: vec![],
        },
    ]
}

pub fn find_profile(id: &str) -> Option<ShellProfile> {
    builtin_profiles().into_iter().find(|p| p.id == id)
}

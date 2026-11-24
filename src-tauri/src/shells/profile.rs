use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};

use super::expand::expand_env_vars;

#[derive(Debug, Clone, Copy, Default, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum ProfileSource {
    /// Encontrado pela detecção automática.
    Detected,
    /// Criado pelo usuário.
    #[default]
    Custom,
}

fn default_icon() -> String {
    "terminal".into()
}

/// Perfil de shell como fica salvo no settings.json (docs/05-settings.md §5.1).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Profile {
    pub id: String,
    pub name: String,
    #[serde(default = "default_icon")]
    pub icon: String,
    pub command: String,
    #[serde(default)]
    pub args: Vec<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub cwd: Option<String>,
    #[serde(default)]
    pub env: BTreeMap<String, String>,
    #[serde(default)]
    pub hidden: bool,
    #[serde(default)]
    pub source: ProfileSource,
}

/// Tudo o que o PtyManager precisa para iniciar um processo, já com variáveis expandidas.
#[derive(Debug, Clone, PartialEq)]
pub struct LaunchSpec {
    pub command: String,
    pub args: Vec<String>,
    pub cwd: Option<String>,
    pub env: Vec<(String, String)>,
}

impl Profile {
    /// Monta o comando de execução. `cwd_override` (ex.: "abrir nesta pasta") tem prioridade.
    pub fn launch_spec(
        &self,
        cwd_override: Option<String>,
        lookup: impl Fn(&str) -> Option<String>,
    ) -> LaunchSpec {
        let expand = |s: &str| expand_env_vars(s, &lookup);
        let home = lookup("USERPROFILE");
        let cwd = cwd_override
            .or_else(|| self.cwd.clone())
            .filter(|c| !c.trim().is_empty())
            .map(|c| match (c.trim(), &home) {
                ("~", Some(home)) => home.clone(),
                (other, Some(home)) if other.starts_with("~\\") || other.starts_with("~/") => {
                    format!("{home}{}", &other[1..])
                }
                _ => expand(&c),
            })
            .or(home);

        LaunchSpec {
            command: expand(&self.command),
            args: self.args.iter().map(|a| expand(a)).collect(),
            cwd,
            env: self
                .env
                .iter()
                .map(|(k, v)| (k.clone(), expand(v)))
                .collect(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn lookup(name: &str) -> Option<String> {
        match name {
            "USERPROFILE" => Some(r"C:\Users\ana".into()),
            "ProgramFiles" => Some(r"C:\Program Files".into()),
            _ => None,
        }
    }

    fn profile() -> Profile {
        Profile {
            id: "git-bash".into(),
            name: "Git Bash".into(),
            icon: "git".into(),
            command: r"%ProgramFiles%\Git\bin\bash.exe".into(),
            args: vec!["--login".into(), "-i".into()],
            cwd: Some(r"%USERPROFILE%\projetos".into()),
            env: BTreeMap::from([("HOME_DIR".into(), "%USERPROFILE%".into())]),
            hidden: false,
            source: ProfileSource::Detected,
        }
    }

    #[test]
    fn expande_variaveis_no_comando_pasta_e_ambiente() {
        let spec = profile().launch_spec(None, lookup);
        assert_eq!(spec.command, r"C:\Program Files\Git\bin\bash.exe");
        assert_eq!(spec.cwd.as_deref(), Some(r"C:\Users\ana\projetos"));
        assert_eq!(
            spec.env,
            vec![("HOME_DIR".to_string(), r"C:\Users\ana".to_string())]
        );
    }

    #[test]
    fn pasta_informada_tem_prioridade_e_til_vira_home() {
        let spec = profile().launch_spec(Some(r"D:\x".into()), lookup);
        assert_eq!(spec.cwd.as_deref(), Some(r"D:\x"));

        let mut p = profile();
        p.cwd = Some(r"~\docs".into());
        assert_eq!(
            p.launch_spec(None, lookup).cwd.as_deref(),
            Some(r"C:\Users\ana\docs")
        );
    }

    #[test]
    fn sem_pasta_usa_a_pasta_do_usuario() {
        let mut p = profile();
        p.cwd = Some("  ".into());
        assert_eq!(
            p.launch_spec(None, lookup).cwd.as_deref(),
            Some(r"C:\Users\ana")
        );
    }

    #[test]
    fn campos_opcionais_tem_padrao_ao_ler_json() {
        let p: Profile =
            serde_json::from_str(r#"{"id":"x","name":"X","command":"x.exe"}"#).unwrap();
        assert_eq!(p.icon, "terminal");
        assert_eq!(p.source, ProfileSource::Custom);
        assert!(p.args.is_empty() && !p.hidden && p.cwd.is_none());
    }
}

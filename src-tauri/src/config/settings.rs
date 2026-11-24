use std::collections::HashSet;
use std::fs;
use std::io::ErrorKind;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};

use crate::error::AppError;
use crate::shells::{Profile, ProfileSource};

pub const SETTINGS_VERSION: u32 = 1;
const FILE_NAME: &str = "settings.json";

fn current_version() -> u32 {
    SETTINGS_VERSION
}
fn default_profile_id() -> String {
    "powershell".into()
}
fn yes() -> bool {
    true
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct GeneralSettings {
    #[serde(default = "default_profile_id")]
    pub default_profile: String,
    #[serde(default = "yes")]
    pub confirm_close_running: bool,
    /// Chaves que esta versão não conhece: preservadas ao salvar.
    #[serde(flatten)]
    pub extra: Map<String, Value>,
}

impl Default for GeneralSettings {
    fn default() -> Self {
        Self {
            default_profile: default_profile_id(),
            confirm_close_running: true,
            extra: Map::new(),
        }
    }
}

/// Conteúdo do settings.json (docs/05-configuracoes.md §5.6).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    #[serde(default = "current_version")]
    pub version: u32,
    #[serde(default)]
    pub general: GeneralSettings,
    #[serde(default)]
    pub profiles: Vec<Profile>,
    /// Chaves que esta versão não conhece (ex.: de versões futuras): preservadas ao salvar.
    #[serde(flatten)]
    pub extra: Map<String, Value>,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            version: SETTINGS_VERSION,
            general: GeneralSettings::default(),
            profiles: Vec::new(),
            extra: Map::new(),
        }
    }
}

impl Settings {
    /// Corrige inconsistências: IDs repetidos ou vazios e perfil padrão inexistente.
    pub fn normalize(mut self) -> Self {
        let mut seen = HashSet::new();
        for profile in &mut self.profiles {
            if profile.id.trim().is_empty() {
                profile.id = "perfil".into();
            }
            let base = profile.id.clone();
            let mut n = 2;
            while !seen.insert(profile.id.clone()) {
                profile.id = format!("{base}-{n}");
                n += 1;
            }
        }
        let default_ok = self
            .profiles
            .iter()
            .any(|p| p.id == self.general.default_profile && !p.hidden);
        if !default_ok && let Some(first) = self.profiles.iter().find(|p| !p.hidden) {
            self.general.default_profile = first.id.clone();
        }
        self.version = self.version.max(SETTINGS_VERSION);
        self
    }

    pub fn profile(&self, id: &str) -> Option<&Profile> {
        self.profiles.iter().find(|p| p.id == id)
    }
}

/// Junta perfis detectados aos existentes. Atualiza só o executável e os argumentos dos
/// perfis detectados; o que o usuário mudou (nome, pasta, variáveis, oculto) é mantido.
pub fn merge_detected(settings: &mut Settings, detected: Vec<Profile>) {
    for found in detected {
        match settings.profiles.iter_mut().find(|p| p.id == found.id) {
            Some(existing) if existing.source == ProfileSource::Detected => {
                existing.command = found.command;
                existing.args = found.args;
            }
            Some(_) => {} // Perfil do usuário com o mesmo ID: não mexe.
            None => settings.profiles.push(found),
        }
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LoadedSettings {
    pub settings: Settings,
    /// Mensagem para o usuário quando o arquivo não pôde ser lido.
    pub warning: Option<String>,
    #[serde(skip)]
    pub first_run: bool,
}

pub struct SettingsStore {
    dir: PathBuf,
}

impl SettingsStore {
    pub fn new(dir: impl Into<PathBuf>) -> Self {
        Self { dir: dir.into() }
    }

    /// `%APPDATA%\NexusTerminal` (docs/03-arquitetura.md §3.10).
    pub fn default_dir() -> PathBuf {
        super::paths::config_dir()
    }

    pub fn path(&self) -> PathBuf {
        self.dir.join(FILE_NAME)
    }

    pub fn load(&self) -> LoadedSettings {
        match fs::read_to_string(self.path()) {
            Ok(text) => match serde_json::from_str::<Settings>(&text) {
                Ok(settings) => LoadedSettings {
                    settings: settings.normalize(),
                    warning: None,
                    first_run: false,
                },
                // Arquivo inválido: usa os padrões e NÃO sobrescreve até o usuário salvar algo.
                Err(err) => LoadedSettings {
                    settings: Settings::default(),
                    warning: Some(format!("{}: {err}", self.path().display())),
                    first_run: false,
                },
            },
            Err(err) if err.kind() == ErrorKind::NotFound => LoadedSettings {
                settings: Settings::default(),
                warning: None,
                first_run: true,
            },
            Err(err) => LoadedSettings {
                settings: Settings::default(),
                warning: Some(format!("{}: {err}", self.path().display())),
                first_run: false,
            },
        }
    }

    /// Grava de forma atômica. Se o arquivo atual estiver inválido, guarda uma cópia em `.bak`.
    pub fn save(&self, settings: &Settings) -> Result<(), AppError> {
        fs::create_dir_all(&self.dir)?;
        let path = self.path();
        if let Ok(current) = fs::read_to_string(&path)
            && serde_json::from_str::<Settings>(&current).is_err()
        {
            fs::copy(&path, backup_path(&path))?;
        }
        let json = serde_json::to_string_pretty(settings).map_err(AppError::config)?;
        let tmp = path.with_extension("json.tmp");
        fs::write(&tmp, json + "\n")?;
        fs::rename(&tmp, &path)?;
        Ok(())
    }
}

fn backup_path(path: &Path) -> PathBuf {
    path.with_extension("json.bak")
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::BTreeMap;

    fn profile(id: &str, source: ProfileSource) -> Profile {
        Profile {
            id: id.into(),
            name: id.to_uppercase(),
            icon: "terminal".into(),
            command: format!("{id}.exe"),
            args: vec![],
            cwd: None,
            env: BTreeMap::new(),
            hidden: false,
            source,
        }
    }

    #[test]
    fn primeira_execucao_sem_arquivo() {
        let dir = tempfile::tempdir().unwrap();
        let loaded = SettingsStore::new(dir.path()).load();
        assert!(loaded.first_run);
        assert!(loaded.warning.is_none());
        assert_eq!(loaded.settings, Settings::default());
    }

    #[test]
    fn salva_e_le_de_volta_preservando_chaves_desconhecidas() {
        let dir = tempfile::tempdir().unwrap();
        let store = SettingsStore::new(dir.path());
        fs::write(
            store.path(),
            r#"{"version":1,"theme":{"dark":"nexus-dark"},"general":{"defaultProfile":"cmd","restoreSession":true},"profiles":[{"id":"cmd","name":"CMD","command":"cmd.exe"}]}"#,
        )
        .unwrap();

        let loaded = store.load();
        assert!(loaded.warning.is_none());
        store.save(&loaded.settings).unwrap();

        let saved: Value =
            serde_json::from_str(&fs::read_to_string(store.path()).unwrap()).unwrap();
        assert_eq!(saved["theme"]["dark"], "nexus-dark");
        assert_eq!(saved["general"]["restoreSession"], true);
        assert_eq!(saved["general"]["defaultProfile"], "cmd");
        assert!(!dir.path().join("settings.json.tmp").exists());
    }

    #[test]
    fn arquivo_invalido_gera_aviso_e_backup_ao_salvar() {
        let dir = tempfile::tempdir().unwrap();
        let store = SettingsStore::new(dir.path());
        fs::write(store.path(), "{ isto não é json").unwrap();

        let loaded = store.load();
        assert!(loaded.warning.is_some());
        assert!(!loaded.first_run);
        // Carregar não altera o arquivo do usuário.
        assert_eq!(
            fs::read_to_string(store.path()).unwrap(),
            "{ isto não é json"
        );

        store.save(&loaded.settings).unwrap();
        assert_eq!(
            fs::read_to_string(dir.path().join("settings.json.bak")).unwrap(),
            "{ isto não é json"
        );
    }

    #[test]
    fn normaliza_ids_repetidos_e_perfil_padrao_invalido() {
        let mut settings = Settings::default();
        settings.general.default_profile = "nao-existe".into();
        let mut hidden = profile("oculto", ProfileSource::Custom);
        hidden.hidden = true;
        settings.profiles = vec![
            hidden,
            profile("a", ProfileSource::Custom),
            profile("a", ProfileSource::Custom),
        ];
        let settings = settings.normalize();
        let ids: Vec<&str> = settings.profiles.iter().map(|p| p.id.as_str()).collect();
        assert_eq!(ids, ["oculto", "a", "a-2"]);
        assert_eq!(settings.general.default_profile, "a");
    }

    #[test]
    fn mescla_deteccao_sem_perder_edicoes_do_usuario() {
        let mut settings = Settings::default();
        let mut bash = profile("git-bash", ProfileSource::Detected);
        bash.name = "Meu Bash".into();
        bash.hidden = true;
        settings.profiles = vec![bash, profile("pwsh", ProfileSource::Custom)];

        let mut new_bash = profile("git-bash", ProfileSource::Detected);
        new_bash.command = r"D:\Git\bin\bash.exe".into();
        let mut new_pwsh = profile("pwsh", ProfileSource::Detected);
        new_pwsh.command = "outro.exe".into();
        merge_detected(
            &mut settings,
            vec![new_bash, new_pwsh, profile("cmd", ProfileSource::Detected)],
        );

        assert_eq!(settings.profiles.len(), 3);
        let bash = settings.profile("git-bash").unwrap();
        assert_eq!(bash.command, r"D:\Git\bin\bash.exe");
        assert_eq!(bash.name, "Meu Bash");
        assert!(bash.hidden);
        assert_eq!(settings.profile("pwsh").unwrap().command, "pwsh.exe");
        assert!(settings.profile("cmd").is_some());
    }
}

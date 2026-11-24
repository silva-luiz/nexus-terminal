use std::fs;
use std::io::ErrorKind;
use std::path::{Path, PathBuf};

use serde_json::Value;

use crate::error::AppError;

/// Temas maiores que isso não são temas (proteção ao importar arquivos quaisquer).
const MAX_THEME_FILE_BYTES: u64 = 1024 * 1024;

/// Temas do usuário em `%APPDATA%\NexusTerminal\themes\<id>.json`.
/// A validação do conteúdo fica no frontend; aqui só lemos, gravamos e protegemos o caminho.
pub struct ThemeStore {
    dir: PathBuf,
}

/// IDs viram nomes de arquivo: só letras minúsculas, dígitos e hífen.
pub fn is_valid_theme_id(id: &str) -> bool {
    !id.is_empty()
        && id.len() <= 64
        && id
            .chars()
            .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-')
}

fn theme_id(theme: &Value) -> Result<&str, AppError> {
    theme
        .get("id")
        .and_then(Value::as_str)
        .filter(|id| is_valid_theme_id(id))
        .ok_or_else(|| AppError::config("tema sem id válido (use a-z, 0-9 e -)"))
}

/// Lê um arquivo JSON escolhido pelo usuário para importar.
pub fn read_json_file(path: &Path) -> Result<Value, AppError> {
    if fs::metadata(path)?.len() > MAX_THEME_FILE_BYTES {
        return Err(AppError::config("arquivo grande demais para ser um tema"));
    }
    let text = fs::read_to_string(path)?;
    serde_json::from_str(text.trim_start_matches('\u{feff}')).map_err(AppError::config)
}

impl ThemeStore {
    pub fn new(dir: impl Into<PathBuf>) -> Self {
        Self { dir: dir.into() }
    }

    fn path_for(&self, id: &str) -> PathBuf {
        self.dir.join(format!("{id}.json"))
    }

    /// Todos os temas da pasta. Arquivos ilegíveis são ignorados.
    pub fn list(&self) -> Vec<Value> {
        let Ok(entries) = fs::read_dir(&self.dir) else {
            return Vec::new();
        };
        let mut themes: Vec<(String, Value)> = entries
            .filter_map(Result::ok)
            .map(|e| e.path())
            .filter(|p| p.extension().is_some_and(|ext| ext == "json"))
            .filter_map(|p| {
                let value = read_json_file(&p).ok()?;
                let name = p.file_name()?.to_string_lossy().into_owned();
                Some((name, value))
            })
            .collect();
        themes.sort_by(|a, b| a.0.cmp(&b.0));
        themes.into_iter().map(|(_, v)| v).collect()
    }

    pub fn save(&self, theme: &Value) -> Result<(), AppError> {
        let id = theme_id(theme)?;
        fs::create_dir_all(&self.dir)?;
        let path = self.path_for(id);
        let tmp = path.with_extension("json.tmp");
        let json = serde_json::to_string_pretty(theme).map_err(AppError::config)?;
        fs::write(&tmp, json + "\n")?;
        fs::rename(&tmp, &path)?;
        Ok(())
    }

    pub fn delete(&self, id: &str) -> Result<(), AppError> {
        if !is_valid_theme_id(id) {
            return Err(AppError::config("id de tema inválido"));
        }
        match fs::remove_file(self.path_for(id)) {
            Err(err) if err.kind() != ErrorKind::NotFound => Err(err.into()),
            _ => Ok(()),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn valida_ids_para_evitar_caminhos_perigosos() {
        assert!(is_valid_theme_id("dracula-2"));
        for bad in [
            "",
            "../x",
            "a/b",
            r"a\b",
            "Maiusculo",
            "com espaço",
            &"x".repeat(65),
        ] {
            assert!(!is_valid_theme_id(bad), "{bad}");
        }
    }

    #[test]
    fn salva_lista_e_exclui() {
        let dir = tempfile::tempdir().unwrap();
        let store = ThemeStore::new(dir.path().join("themes"));
        assert!(store.list().is_empty());

        store.save(&json!({"id": "b-tema", "name": "B"})).unwrap();
        store.save(&json!({"id": "a-tema", "name": "A"})).unwrap();
        fs::write(dir.path().join("themes/lixo.json"), "{ quebrado").unwrap();

        let themes = store.list();
        let names: Vec<&str> = themes.iter().map(|t| t["name"].as_str().unwrap()).collect();
        assert_eq!(names, ["A", "B"]);

        store.delete("a-tema").unwrap();
        store.delete("nao-existe").unwrap();
        assert_eq!(store.list().len(), 1);
    }

    #[test]
    fn recusa_tema_sem_id_valido() {
        let dir = tempfile::tempdir().unwrap();
        let store = ThemeStore::new(dir.path());
        assert!(store.save(&json!({"id": "../../fora"})).is_err());
        assert!(store.save(&json!({"name": "sem id"})).is_err());
        assert!(store.delete("../settings").is_err());
    }

    #[test]
    fn le_json_com_bom_e_recusa_arquivo_grande() {
        let dir = tempfile::tempdir().unwrap();
        let ok = dir.path().join("ok.json");
        fs::write(&ok, "\u{feff}{\"name\":\"x\"}").unwrap();
        assert_eq!(read_json_file(&ok).unwrap()["name"], "x");

        let big = dir.path().join("big.json");
        fs::write(&big, vec![b' '; (MAX_THEME_FILE_BYTES + 1) as usize]).unwrap();
        assert!(read_json_file(&big).is_err());
    }
}

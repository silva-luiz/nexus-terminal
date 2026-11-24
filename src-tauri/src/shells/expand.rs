use std::path::{Path, PathBuf};

/// Troca `%NOME%` pelo valor da variável. Variáveis desconhecidas ficam como estão.
pub fn expand_env_vars(input: &str, lookup: impl Fn(&str) -> Option<String>) -> String {
    let mut out = String::with_capacity(input.len());
    let mut rest = input;
    while let Some(start) = rest.find('%') {
        out.push_str(&rest[..start]);
        let after = &rest[start + 1..];
        match after.find('%') {
            Some(end) if end > 0 => {
                let name = &after[..end];
                match lookup(name) {
                    Some(value) => out.push_str(&value),
                    None => {
                        // Como no Windows: o '%' final pode abrir a próxima variável.
                        out.push('%');
                        out.push_str(name);
                        rest = &after[end..];
                        continue;
                    }
                }
                rest = &after[end + 1..];
            }
            _ => {
                out.push('%');
                rest = after;
            }
        }
    }
    out.push_str(rest);
    out
}

fn with_exe_candidates(path: &Path) -> Vec<PathBuf> {
    if path.extension().is_some() {
        vec![path.to_path_buf()]
    } else {
        vec![path.with_extension("exe"), path.to_path_buf()]
    }
}

/// Encontra o executável: caminho direto, ou procurando nas pastas do PATH.
pub fn find_executable(
    command: &str,
    path_var: &str,
    exists: impl Fn(&Path) -> bool,
) -> Option<PathBuf> {
    let command = command.trim().trim_matches('"');
    if command.is_empty() {
        return None;
    }
    let path = Path::new(command);
    if path.is_absolute() || command.contains('\\') || command.contains('/') {
        return with_exe_candidates(path).into_iter().find(|p| exists(p));
    }
    std::env::split_paths(path_var)
        .flat_map(|dir| with_exe_candidates(&dir.join(command)))
        .find(|p| exists(p))
}

/// Versão com o ambiente real, usada pela tela de configurações.
pub fn command_exists(command: &str) -> bool {
    let expanded = expand_env_vars(command, |n| std::env::var(n).ok());
    let path_var = std::env::var("PATH").unwrap_or_default();
    find_executable(&expanded, &path_var, Path::is_file).is_some()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn lookup(name: &str) -> Option<String> {
        (name == "HOME").then(|| r"C:\Users\ana".to_string())
    }

    #[test]
    fn expande_variaveis_conhecidas() {
        assert_eq!(expand_env_vars(r"%HOME%\x", lookup), r"C:\Users\ana\x");
        assert_eq!(
            expand_env_vars("%HOME%%HOME%", lookup),
            r"C:\Users\anaC:\Users\ana"
        );
    }

    #[test]
    fn mantem_desconhecidas_e_porcentagens_soltas() {
        assert_eq!(expand_env_vars("%NADA%", lookup), "%NADA%");
        assert_eq!(expand_env_vars("100%", lookup), "100%");
        assert_eq!(
            expand_env_vars("50%% de %HOME%", lookup),
            r"50%% de C:\Users\ana"
        );
    }

    #[test]
    fn encontra_executavel_pelo_path_com_ou_sem_extensao() {
        let exists = |p: &Path| p == Path::new(r"C:\tools\pwsh.exe");
        let path_var = r"C:\Windows;C:\tools";
        assert_eq!(
            find_executable("pwsh", path_var, exists),
            Some(PathBuf::from(r"C:\tools\pwsh.exe"))
        );
        assert_eq!(
            find_executable("pwsh.exe", path_var, exists),
            Some(PathBuf::from(r"C:\tools\pwsh.exe"))
        );
        assert_eq!(find_executable("bash", path_var, exists), None);
    }

    #[test]
    fn caminho_absoluto_nao_procura_no_path() {
        let exists = |p: &Path| p == Path::new(r"C:\Git\bin\bash.exe");
        assert!(find_executable(r#""C:\Git\bin\bash.exe""#, "", exists).is_some());
        assert!(find_executable(r"C:\Git\bin\bash", "", exists).is_some());
        assert!(find_executable(r"C:\outro\bash.exe", r"C:\Git\bin", exists).is_none());
        assert!(find_executable("  ", r"C:\Git\bin", exists).is_none());
    }
}

use std::path::{Path, PathBuf};

/// Lê `-d <pasta>` / `--directory <pasta>` (ou `--directory=<pasta>`) dos argumentos.
/// Caminhos relativos são resolvidos a partir de `cwd` (a pasta de onde o app foi chamado).
pub fn parse_start_dir(args: &[String], cwd: &str) -> Option<String> {
    let mut iter = args.iter().skip(1);
    while let Some(arg) = iter.next() {
        let value = if arg == "-d" || arg == "--directory" {
            iter.next().cloned()
        } else {
            arg.strip_prefix("--directory=").map(str::to_string)
        };
        if let Some(dir) = value.filter(|v| !v.trim().is_empty()) {
            let path = Path::new(dir.trim().trim_matches('"'));
            let full: PathBuf = if path.is_absolute() {
                path.to_path_buf()
            } else {
                Path::new(cwd).join(path)
            };
            return Some(full.to_string_lossy().into_owned());
        }
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    fn args(list: &[&str]) -> Vec<String> {
        std::iter::once("nexus-terminal.exe")
            .chain(list.iter().copied())
            .map(String::from)
            .collect()
    }

    #[test]
    fn le_pasta_absoluta_e_relativa() {
        assert_eq!(
            parse_start_dir(&args(&["-d", r"D:\projetos"]), r"C:\x"),
            Some(r"D:\projetos".into())
        );
        assert_eq!(
            parse_start_dir(&args(&["--directory", "api"]), r"C:\code"),
            Some(r"C:\code\api".into())
        );
        assert_eq!(
            parse_start_dir(&args(&[r#"--directory="C:\a b""#]), r"C:\x"),
            Some(r"C:\a b".into())
        );
    }

    #[test]
    fn sem_argumento_ou_sem_valor() {
        assert_eq!(parse_start_dir(&args(&[]), r"C:\x"), None);
        assert_eq!(parse_start_dir(&args(&["-d"]), r"C:\x"), None);
        assert_eq!(parse_start_dir(&args(&["--outra-coisa"]), r"C:\x"), None);
        // O executável (args[0]) nunca é lido como opção.
        assert_eq!(parse_start_dir(&["-d".into()], r"C:\x"), None);
    }
}

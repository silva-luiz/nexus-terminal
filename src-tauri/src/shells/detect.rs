use std::collections::BTreeMap;
use std::os::windows::process::CommandExt;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

use winreg::RegKey;
use winreg::enums::{HKEY_CURRENT_USER, HKEY_LOCAL_MACHINE};

use super::expand::find_executable;
use super::profile::{Profile, ProfileSource};

const CREATE_NO_WINDOW: u32 = 0x0800_0000;
const WSL_TIMEOUT: Duration = Duration::from_secs(4);

fn env(name: &str) -> Option<String> {
    std::env::var(name).ok().filter(|v| !v.is_empty())
}

fn detected(id: &str, name: &str, icon: &str, command: &Path, args: &[&str]) -> Profile {
    Profile {
        id: id.into(),
        name: name.into(),
        icon: icon.into(),
        command: command.to_string_lossy().into_owned(),
        args: args.iter().map(|a| a.to_string()).collect(),
        cwd: None,
        env: BTreeMap::new(),
        hidden: false,
        source: ProfileSource::Detected,
    }
}

/// Procura os shells instalados (docs/05-configuracoes.md §5.1). PowerShell 5.1 vem primeiro.
pub fn detect_profiles() -> Vec<Profile> {
    let system_root = PathBuf::from(env("SystemRoot").unwrap_or_else(|| r"C:\Windows".into()));
    let path_var = env("PATH").unwrap_or_default();
    let mut profiles = Vec::new();

    let powershell = system_root.join(r"System32\WindowsPowerShell\v1.0\powershell.exe");
    if powershell.is_file() {
        profiles.push(detected(
            "powershell",
            "Windows PowerShell",
            "powershell",
            &powershell,
            &["-NoLogo"],
        ));
    }

    if let Some(pwsh) = find_pwsh(&path_var) {
        profiles.push(detected(
            "pwsh",
            "PowerShell 7",
            "powershell",
            &pwsh,
            &["-NoLogo"],
        ));
    }

    let cmd = env("ComSpec")
        .map(PathBuf::from)
        .unwrap_or_else(|| system_root.join(r"System32\cmd.exe"));
    profiles.push(detected("cmd", "Prompt de Comando", "cmd", &cmd, &[]));

    if let Some(bash) = find_git_bash(&path_var) {
        let mut profile = detected("git-bash", "Git Bash", "git", &bash, &["--login", "-i"]);
        // Faz o Git Bash respeitar a pasta inicial em vez de ir para o HOME.
        profile.env.insert("CHERE_INVOKING".into(), "1".into());
        profiles.push(profile);
    }

    let wsl = system_root.join(r"System32\wsl.exe");
    if wsl.is_file() {
        for distro in list_wsl_distros(&wsl) {
            profiles.push(detected(
                &format!("wsl-{}", slug(&distro)),
                &format!("{distro} (WSL)"),
                "linux",
                &wsl,
                &["-d", &distro],
            ));
        }
    }

    profiles
}

fn find_pwsh(path_var: &str) -> Option<PathBuf> {
    if let Some(found) = find_executable("pwsh.exe", path_var, Path::is_file) {
        // Ignora o atalho da Microsoft Store em WindowsApps quando há instalação normal.
        if !found.to_string_lossy().contains("WindowsApps") {
            return Some(found);
        }
    }
    let base = PathBuf::from(env("ProgramFiles")?).join("PowerShell");
    let versions: Vec<String> = std::fs::read_dir(&base)
        .ok()?
        .filter_map(|e| e.ok())
        .filter(|e| e.path().join("pwsh.exe").is_file())
        .filter_map(|e| e.file_name().into_string().ok())
        .collect();
    pick_latest_version(&versions).map(|v| base.join(v).join("pwsh.exe"))
}

/// Escolhe a maior versão, preferindo versões estáveis às "preview".
fn pick_latest_version(names: &[String]) -> Option<&String> {
    names.iter().max_by_key(|name| {
        let major: u32 = name
            .chars()
            .take_while(|c| c.is_ascii_digit())
            .collect::<String>()
            .parse()
            .unwrap_or(0);
        (!name.contains("preview"), major)
    })
}

fn find_git_bash(path_var: &str) -> Option<PathBuf> {
    let from_registry = [HKEY_LOCAL_MACHINE, HKEY_CURRENT_USER]
        .into_iter()
        .filter_map(|hive| {
            RegKey::predef(hive)
                .open_subkey(r"SOFTWARE\GitForWindows")
                .ok()?
                .get_value::<String, _>("InstallPath")
                .ok()
        })
        .map(PathBuf::from);

    // Instalação para todos os usuários ou só para o usuário atual.
    let from_program_files = [
        ("ProgramFiles", "Git"),
        ("ProgramW6432", "Git"),
        ("LOCALAPPDATA", r"Programs\Git"),
    ]
    .into_iter()
    .filter_map(|(var, sub)| env(var).map(|base| PathBuf::from(base).join(sub)));

    let from_path = find_executable("git.exe", path_var, Path::is_file)
        .and_then(|git| git_root_from_git_exe(&git));

    from_registry
        .chain(from_program_files)
        .chain(from_path)
        .map(|root| root.join(r"bin\bash.exe"))
        .find(|bash| bash.is_file())
}

/// `C:\Git\cmd\git.exe`, `C:\Git\bin\git.exe` ou `C:\Git\mingw64\bin\git.exe` → `C:\Git`.
fn git_root_from_git_exe(git: &Path) -> Option<PathBuf> {
    let dir = git.parent()?;
    let dir_name = dir.file_name()?.to_string_lossy().to_lowercase();
    let parent = dir.parent()?;
    let parent_name = parent
        .file_name()
        .map(|n| n.to_string_lossy().to_lowercase());
    match (dir_name.as_str(), parent_name.as_deref()) {
        ("bin", Some("mingw64" | "mingw32" | "usr")) => parent.parent().map(Path::to_path_buf),
        ("cmd" | "bin", _) => Some(parent.to_path_buf()),
        _ => None,
    }
}

fn list_wsl_distros(wsl: &Path) -> Vec<String> {
    let child = Command::new(wsl)
        .args(["-l", "-q"])
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .creation_flags(CREATE_NO_WINDOW)
        .spawn();
    let Ok(child) = child else { return Vec::new() };

    // Um WSL com problema pode travar: não deixamos isso atrasar a detecção.
    let (tx, rx) = mpsc::channel();
    let pid = child.id();
    thread::spawn(move || {
        let _ = tx.send(child.wait_with_output());
    });
    match rx.recv_timeout(WSL_TIMEOUT) {
        Ok(Ok(output)) if output.status.success() => parse_wsl_list(&output.stdout),
        Ok(_) => Vec::new(),
        Err(_) => {
            let _ = Command::new("taskkill")
                .args(["/PID", &pid.to_string(), "/F"])
                .creation_flags(CREATE_NO_WINDOW)
                .status();
            Vec::new()
        }
    }
}

/// Distros que o Docker Desktop e o Rancher Desktop criam para uso próprio.
fn is_internal_distro(name: &str) -> bool {
    let name = name.to_lowercase();
    name.starts_with("docker-desktop") || name.starts_with("rancher-desktop")
}

/// `wsl -l -q` responde em UTF-16LE. Distros internas (Docker, Rancher) são ignoradas.
fn parse_wsl_list(bytes: &[u8]) -> Vec<String> {
    let looks_utf16 = bytes.len() >= 2 && bytes.len().is_multiple_of(2) && bytes[1] == 0;
    let text = if looks_utf16 {
        let units: Vec<u16> = bytes
            .as_chunks::<2>()
            .0
            .iter()
            .map(|c| u16::from_le_bytes([c[0], c[1]]))
            .collect();
        String::from_utf16_lossy(&units)
    } else {
        String::from_utf8_lossy(bytes).into_owned()
    };
    text.lines()
        .map(|line| line.trim_matches(|c: char| c.is_whitespace() || c == '\0' || c == '\u{feff}'))
        .filter(|name| !name.is_empty() && !is_internal_distro(name))
        .map(str::to_string)
        .collect()
}

fn slug(name: &str) -> String {
    name.chars()
        .map(|c| {
            if c.is_ascii_alphanumeric() {
                c.to_ascii_lowercase()
            } else {
                '-'
            }
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn utf16(text: &str) -> Vec<u8> {
        text.encode_utf16().flat_map(|u| u.to_le_bytes()).collect()
    }

    #[test]
    fn le_lista_do_wsl_em_utf16_e_ignora_distros_internas() {
        let bytes = utf16(
            "Ubuntu-22.04\r\ndocker-desktop\r\nrancher-desktop\r\nrancher-desktop-data\r\nDebian\r\n\r\n",
        );
        assert_eq!(parse_wsl_list(&bytes), vec!["Ubuntu-22.04", "Debian"]);
    }

    #[test]
    fn le_lista_do_wsl_em_utf8() {
        assert_eq!(
            parse_wsl_list(b"Ubuntu\nkali-linux\n"),
            vec!["Ubuntu", "kali-linux"]
        );
        assert!(parse_wsl_list(b"").is_empty());
    }

    #[test]
    fn acha_raiz_do_git_a_partir_do_git_exe() {
        let cases = [
            (
                r"C:\Program Files\Git\cmd\git.exe",
                Some(r"C:\Program Files\Git"),
            ),
            (r"C:\Git\bin\git.exe", Some(r"C:\Git")),
            (r"C:\Git\mingw64\bin\git.exe", Some(r"C:\Git")),
            (r"C:\scoop\shims\git.exe", None),
        ];
        for (input, expected) in cases {
            assert_eq!(
                git_root_from_git_exe(Path::new(input)),
                expected.map(PathBuf::from),
                "{input}"
            );
        }
    }

    #[test]
    fn escolhe_a_maior_versao_estavel_do_pwsh() {
        let names: Vec<String> = ["6", "7", "7-preview", "10-preview"]
            .iter()
            .map(|s| s.to_string())
            .collect();
        assert_eq!(pick_latest_version(&names).map(String::as_str), Some("7"));
    }

    #[test]
    fn slug_de_distro() {
        assert_eq!(slug("Ubuntu-22.04"), "ubuntu-22-04");
    }

    #[test]
    fn deteccao_real_encontra_powershell_e_cmd() {
        let ids: Vec<String> = detect_profiles().into_iter().map(|p| p.id).collect();
        assert!(ids.contains(&"powershell".to_string()), "{ids:?}");
        assert!(ids.contains(&"cmd".to_string()), "{ids:?}");
    }
}

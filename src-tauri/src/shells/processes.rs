use std::collections::HashSet;

use windows_sys::Win32::Foundation::{CloseHandle, INVALID_HANDLE_VALUE};
use windows_sys::Win32::System::Diagnostics::ToolHelp::{
    CreateToolhelp32Snapshot, PROCESSENTRY32W, Process32FirstW, Process32NextW, TH32CS_SNAPPROCESS,
};

#[derive(Debug, Clone, PartialEq)]
pub struct ProcInfo {
    pub pid: u32,
    pub parent: u32,
    pub name: String,
}

/// Processos que fazem parte do próprio shell e não contam como "programa em execução".
/// Ex.: o `bin\bash.exe` do Git é só um inicializador do `usr\bin\bash.exe`.
const SHELL_PROCESSES: &[&str] = &[
    "bash.exe",
    "sh.exe",
    "zsh.exe",
    "cmd.exe",
    "powershell.exe",
    "pwsh.exe",
    "conhost.exe",
    "openconsole.exe",
    "wsl.exe",
    "wslhost.exe",
    "wslrelay.exe",
];

/// Verdadeiro se algum descendente do shell não for parte do próprio shell
/// (ex.: `node`, `python`, `ssh`, `vim`).
pub fn has_foreground_process(root_pid: u32, processes: &[ProcInfo]) -> bool {
    let mut visited = HashSet::from([root_pid]);
    let mut queue = vec![root_pid];
    while let Some(parent) = queue.pop() {
        for proc in processes
            .iter()
            .filter(|p| p.parent == parent && p.pid != parent)
        {
            if !visited.insert(proc.pid) {
                continue;
            }
            if !SHELL_PROCESSES.contains(&proc.name.to_lowercase().as_str()) {
                return true;
            }
            queue.push(proc.pid);
        }
    }
    false
}

/// Lista os processos do sistema.
pub fn snapshot() -> Vec<ProcInfo> {
    let mut result = Vec::new();
    // SAFETY: uso padrão da API Toolhelp; o handle é fechado ao final e a struct
    // é inicializada com o tamanho correto antes das chamadas.
    unsafe {
        let snap = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
        if snap == INVALID_HANDLE_VALUE {
            return result;
        }
        let mut entry: PROCESSENTRY32W = std::mem::zeroed();
        entry.dwSize = std::mem::size_of::<PROCESSENTRY32W>() as u32;
        let mut ok = Process32FirstW(snap, &mut entry);
        while ok != 0 {
            let len = entry
                .szExeFile
                .iter()
                .position(|&c| c == 0)
                .unwrap_or(entry.szExeFile.len());
            result.push(ProcInfo {
                pid: entry.th32ProcessID,
                parent: entry.th32ParentProcessID,
                name: String::from_utf16_lossy(&entry.szExeFile[..len]),
            });
            ok = Process32NextW(snap, &mut entry);
        }
        CloseHandle(snap);
    }
    result
}

pub fn has_running_process(shell_pid: u32) -> bool {
    has_foreground_process(shell_pid, &snapshot())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn p(pid: u32, parent: u32, name: &str) -> ProcInfo {
        ProcInfo {
            pid,
            parent,
            name: name.into(),
        }
    }

    #[test]
    fn shell_parado_nao_tem_processo_ativo() {
        let procs = [p(10, 1, "powershell.exe"), p(99, 1, "node.exe")];
        assert!(!has_foreground_process(10, &procs));
    }

    #[test]
    fn detecta_programa_filho() {
        let procs = [p(10, 1, "powershell.exe"), p(11, 10, "node.exe")];
        assert!(has_foreground_process(10, &procs));
    }

    #[test]
    fn ignora_inicializador_do_git_bash_mas_ve_o_neto() {
        let procs = [
            p(10, 1, "bash.exe"),
            p(11, 10, "bash.exe"),
            p(12, 11, "ssh.exe"),
        ];
        assert!(has_foreground_process(10, &procs));
        assert!(!has_foreground_process(10, &procs[..2]));
    }

    #[test]
    fn nao_entra_em_ciclo() {
        let procs = [p(10, 11, "bash.exe"), p(11, 10, "bash.exe")];
        assert!(!has_foreground_process(10, &procs));
    }

    #[test]
    fn snapshot_real_inclui_o_proprio_processo() {
        let me = std::process::id();
        assert!(snapshot().iter().any(|proc| proc.pid == me));
    }
}

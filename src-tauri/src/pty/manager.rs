use std::collections::HashMap;
use std::io::{Read, Write};
use std::sync::{Arc, Mutex, MutexGuard};
use std::thread::{self, JoinHandle};

use portable_pty::{ChildKiller, CommandBuilder, MasterPty, PtySize, native_pty_system};

use super::PtyEvent;
use super::decoder::Utf8Decoder;
use crate::error::AppError;
use crate::shells::ShellProfile;

const READ_BUFFER_SIZE: usize = 16 * 1024;

struct Session {
    master: Box<dyn MasterPty + Send>,
    writer: Box<dyn Write + Send>,
    killer: Box<dyn ChildKiller + Send + Sync>,
}

type SessionMap = Arc<Mutex<HashMap<String, Session>>>;

/// Guarda todas as sessões de terminal abertas.
#[derive(Default)]
pub struct PtyManager {
    sessions: SessionMap,
}

fn lock(sessions: &SessionMap) -> MutexGuard<'_, HashMap<String, Session>> {
    // Uma thread que entrou em pânico não deve derrubar os outros terminais.
    sessions
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner())
}

fn pty_size(cols: u16, rows: u16) -> PtySize {
    PtySize {
        rows: rows.max(1),
        cols: cols.max(1),
        pixel_width: 0,
        pixel_height: 0,
    }
}

impl PtyManager {
    /// Inicia o shell do perfil num novo PTY e começa a enviar a saída para `on_event`.
    pub fn spawn<F>(
        &self,
        profile: &ShellProfile,
        cwd: Option<String>,
        cols: u16,
        rows: u16,
        on_event: F,
    ) -> Result<String, AppError>
    where
        F: Fn(PtyEvent) + Send + Sync + 'static,
    {
        let pair = native_pty_system()
            .openpty(pty_size(cols, rows))
            .map_err(AppError::pty)?;

        let mut cmd = CommandBuilder::new(&profile.command);
        cmd.args(&profile.args);
        if let Some(dir) = cwd.or_else(|| std::env::var("USERPROFILE").ok()) {
            cmd.cwd(dir);
        }
        cmd.env("TERM", "xterm-256color");
        cmd.env("COLORTERM", "truecolor");
        for (key, value) in &profile.env {
            cmd.env(key, value);
        }

        let mut child = pair.slave.spawn_command(cmd).map_err(AppError::pty)?;
        drop(pair.slave);

        let reader = pair.master.try_clone_reader().map_err(AppError::pty)?;
        let writer = pair.master.take_writer().map_err(AppError::pty)?;
        let killer = child.clone_killer();

        let id = uuid::Uuid::new_v4().to_string();
        lock(&self.sessions).insert(
            id.clone(),
            Session {
                master: pair.master,
                writer,
                killer,
            },
        );

        let on_event = Arc::new(on_event);
        let reader_handle = spawn_reader(reader, Arc::clone(&on_event));

        let sessions = Arc::clone(&self.sessions);
        let session_id = id.clone();
        thread::spawn(move || {
            let code = child.wait().ok().map(|status| status.exit_code());
            // Remover a sessão fecha o ConPTY; o leitor então esvazia o que falta e recebe EOF.
            let removed = lock(&sessions).remove(&session_id);
            drop(removed);
            let _ = reader_handle.join();
            on_event(PtyEvent::Exit { code });
        });

        Ok(id)
    }

    pub fn write(&self, id: &str, data: &str) -> Result<(), AppError> {
        let mut sessions = lock(&self.sessions);
        let session = sessions
            .get_mut(id)
            .ok_or_else(|| AppError::SessionNotFound(id.to_string()))?;
        session.writer.write_all(data.as_bytes())?;
        session.writer.flush()?;
        Ok(())
    }

    pub fn resize(&self, id: &str, cols: u16, rows: u16) -> Result<(), AppError> {
        let sessions = lock(&self.sessions);
        let session = sessions
            .get(id)
            .ok_or_else(|| AppError::SessionNotFound(id.to_string()))?;
        session
            .master
            .resize(pty_size(cols, rows))
            .map_err(AppError::pty)
    }

    /// Encerra o processo. A limpeza da sessão acontece na thread que espera o processo.
    pub fn kill(&self, id: &str) -> Result<(), AppError> {
        let mut sessions = lock(&self.sessions);
        match sessions.get_mut(id) {
            Some(session) => {
                // portable-pty 0.9.0 no Windows inverte o resultado de TerminateProcess:
                // devolve erro quando consegue encerrar e Ok quando falha. Como o retorno
                // não é confiável, ignoramos; o evento `Exit` confirma o encerramento.
                let _ = session.killer.kill();
                Ok(())
            }
            // Já terminou sozinho: nada a fazer.
            None => Ok(()),
        }
    }

    pub fn kill_all(&self) {
        for session in lock(&self.sessions).values_mut() {
            let _ = session.killer.kill();
        }
    }
}

fn spawn_reader<F>(mut reader: Box<dyn Read + Send>, on_event: Arc<F>) -> JoinHandle<()>
where
    F: Fn(PtyEvent) + Send + Sync + 'static,
{
    thread::spawn(move || {
        let mut buffer = [0u8; READ_BUFFER_SIZE];
        let mut decoder = Utf8Decoder::default();
        loop {
            match reader.read(&mut buffer) {
                Ok(0) | Err(_) => break,
                Ok(n) => {
                    let data = decoder.decode(&buffer[..n]);
                    if !data.is_empty() {
                        on_event(PtyEvent::Data { data });
                    }
                }
            }
        }
    })
}

#[cfg(test)]
mod tests {
    use std::sync::mpsc;
    use std::time::{Duration, Instant};

    use super::*;

    fn cmd_profile(args: &[&str]) -> ShellProfile {
        ShellProfile {
            id: "test".into(),
            name: "Teste".into(),
            command: "cmd.exe".into(),
            args: args.iter().map(|a| a.to_string()).collect(),
            env: vec![],
        }
    }

    /// Coleta eventos até o `Exit` ou até estourar o tempo. Responde à consulta de
    /// posição do cursor (`ESC[6n`) que o ConPTY envia ao iniciar, como faria o xterm.js.
    fn collect_until_exit(
        manager: &PtyManager,
        id: &str,
        rx: &mpsc::Receiver<PtyEvent>,
    ) -> (String, Option<u32>) {
        let deadline = Instant::now() + Duration::from_secs(15);
        let mut output = String::new();
        while Instant::now() < deadline {
            match rx.recv_timeout(Duration::from_millis(200)) {
                Ok(PtyEvent::Data { data }) => {
                    if data.contains("[6n") {
                        let _ = manager.write(id, "[1;1R");
                    }
                    output.push_str(&data);
                }
                Ok(PtyEvent::Exit { code }) => return (output, code),
                Err(_) => continue,
            }
        }
        panic!("o processo não terminou a tempo. Saída até aqui: {output:?}");
    }

    #[test]
    fn executa_comando_e_recebe_saida_e_saida_do_processo() {
        let manager = PtyManager::default();
        let (tx, rx) = mpsc::channel();
        let tx = Mutex::new(tx);
        let id = manager
            .spawn(
                &cmd_profile(&["/c", "echo nexus-ok"]),
                None,
                80,
                24,
                move |ev| {
                    let _ = tx.lock().unwrap().send(ev);
                },
            )
            .expect("spawn");

        let (output, code) = collect_until_exit(&manager, &id, &rx);
        assert!(output.contains("nexus-ok"), "saída: {output:?}");
        assert_eq!(code, Some(0));
        assert!(
            lock(&manager.sessions).is_empty(),
            "sessão deveria ter sido removida"
        );
    }

    #[test]
    fn escreve_no_shell_e_redimensiona() {
        let manager = PtyManager::default();
        let (tx, rx) = mpsc::channel();
        let tx = Mutex::new(tx);
        let id = manager
            .spawn(&cmd_profile(&["/q", "/k"]), None, 80, 24, move |ev| {
                let _ = tx.lock().unwrap().send(ev);
            })
            .expect("spawn");

        manager.resize(&id, 120, 40).expect("resize");
        manager
            .write(&id, "echo digitado-ok\r\nexit\r\n")
            .expect("write");

        let (output, _) = collect_until_exit(&manager, &id, &rx);
        assert!(output.contains("digitado-ok"), "saída: {output:?}");
    }

    #[test]
    fn kill_encerra_o_processo() {
        let manager = PtyManager::default();
        let (tx, rx) = mpsc::channel();
        let tx = Mutex::new(tx);
        let id = manager
            .spawn(&cmd_profile(&["/q", "/k"]), None, 80, 24, move |ev| {
                let _ = tx.lock().unwrap().send(ev);
            })
            .expect("spawn");

        manager.kill(&id).expect("kill");
        collect_until_exit(&manager, &id, &rx);
        assert!(matches!(
            manager.write(&id, "x"),
            Err(AppError::SessionNotFound(_))
        ));
    }
}

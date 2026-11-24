# 3. Arquitetura

## 3.1 Visão em camadas

```
┌──────────────────────────────────────────────────────────────┐
│                     FRONTEND (WebView2)                      │
│  React + TypeScript                                          │
│                                                              │
│  ┌────────────┐ ┌──────────────┐ ┌────────────┐ ┌─────────┐  │
│  │  TabBar    │ │ TerminalView │ │  Settings  │ │ Command │  │
│  │ (abas,     │ │ (xterm.js)   │ │  (shell,   │ │ Palette │  │
│  │  renomear) │ │              │ │ tema, i18n)│ │         │  │
│  └─────┬──────┘ └──────┬───────┘ └─────┬──────┘ └────┬────┘  │
│        └───────────────┴───── Zustand stores ────────┘       │
│                        │  (sessions, settings, keybindings)  │
│                        ▼                                     │
│               lib/ipc.ts (wrapper tipado)                    │
└────────────────────────┬─────────────────────────────────────┘
                         │ invoke() / Channel<T>
┌────────────────────────▼─────────────────────────────────────┐
│                    BACKEND (Rust / Tauri)                    │
│                                                              │
│  commands/        pty/              config/        shells/   │
│  ├ pty.rs     ──▶ ├ manager.rs      ├ settings.rs  ├ detect  │
│  ├ settings.rs    ├ session.rs      ├ themes.rs    └ profile │
│  └ shells.rs      └ reader.rs       └ migrate.rs             │
│                         │                                    │
└─────────────────────────┼────────────────────────────────────┘
                          ▼
                ConPTY (Windows) ──▶ powershell.exe / bash.exe / cmd.exe / wsl.exe
```

## 3.2 Responsabilidades

**Backend (Rust)**
- Criar, escrever, redimensionar e encerrar sessões PTY.
- Ler a saída de cada PTY numa thread própria e enviá-la ao frontend em lotes.
- Detectar os shells instalados.
- Ler, validar, migrar e salvar `settings.json`, temas e layout da sessão.
- Avisar o frontend quando um processo termina (código de saída).

**Frontend (React)**
- Desenhar abas, painéis, configurações e diálogos.
- Hospedar uma instância de xterm.js por sessão.
- Interpretar atalhos de teclado e decidir se vão para o app ou para o shell.
- Aplicar tema e idioma em tempo real.

Regra: **o frontend nunca executa processos**. Ele só pede ao backend, por comandos com nomes fixos e argumentos validados.

## 3.3 Comandos IPC (contrato)

| Comando | Entrada | Saída | Descrição |
|---|---|---|---|
| `pty_spawn` | `{ profileId, cwd?, cols, rows, onData: Channel<PtyEvent> }` | `sessionId: string` | Cria sessão e começa a transmitir a saída |
| `pty_write` | `{ sessionId, data: string }` | `()` | Envia teclas/texto ao shell |
| `pty_resize` | `{ sessionId, cols, rows }` | `()` | Redimensiona o PTY |
| `pty_kill` | `{ sessionId }` | `()` | Encerra o processo e libera recursos |
| `pty_has_running_process` | `{ sessionId }` | `bool` | Há programa rodando dentro do shell (ignora os processos do próprio shell, como o inicializador do Git Bash)? Usado para confirmar antes de fechar |
| `shells_redetect` | — | `Settings` | Detecta os shells de novo, acrescenta os novos perfis e salva |
| `commands_exist` | `{ commands: string[] }` | `bool[]` | Verifica se cada executável existe (aviso na tela de shells) |
| `settings_load` | — | `{ settings, warning }` | Configurações em memória; `warning` quando o arquivo estava inválido |
| `settings_save` | `Settings` | `Settings` | Normaliza, grava de forma atômica e devolve o resultado |
| `themes_list` | — | `unknown[]` | Temas da pasta do usuário (os embutidos ficam no frontend); a validação é feita no frontend |
| `themes_read_file` | `{ path }` | `unknown` | Lê o JSON escolhido em "Importar tema" (limite de 1 MB) |
| `themes_save` / `themes_delete` | `{ theme }` / `{ id }` | `()` | Grava/exclui `themes/<id>.json` (id só com `a-z0-9-`) |
| `app_start_dir` | — | `string \| null` | Pasta passada com `-d`/`--directory` na linha de comando |
| `open_app_folder` | `{ folder: "config" \| "logs" }` | `()` | Abre a pasta no Explorer |
| `session_save_layout` / `session_load_layout` | `Layout` / — | `()` / `Layout` | Restaurar abas ao reabrir *(v1.x)* |

Evento do backend para o frontend: `open-tab` (`{ cwd: string \| null }`), emitido quando o app é aberto de novo (instância única) para criar uma aba na janela existente.

`PtyEvent` (enviado pelo `Channel`):

```ts
type PtyEvent =
  | { type: "data"; data: string }      // saída do shell (UTF-8)
  | { type: "exit"; code: number | null }
```

> Use `tauri::ipc::Channel` (Tauri 2) para a saída, não eventos globais (`emit`). O Channel é ordenado, ligado a uma sessão e mais rápido para fluxo contínuo.

## 3.4 Fluxo: abrir um terminal

1. Usuário aperta `Ctrl+Shift+T` (ou clica em `+` e escolhe o perfil).
2. `sessionsStore.create(profileId)` cria a aba com nome padrão (ex.: "PowerShell 2").
3. `TerminalView` monta o xterm.js, roda `fit()` para saber `cols`/`rows`.
4. Chama `pty_spawn` passando um `Channel` cujo `onmessage` faz `term.write(data)`.
5. Backend:
   - resolve o perfil (executável + argumentos + pasta inicial + variáveis de ambiente);
   - `native_pty_system().openpty(PtySize { rows, cols, .. })`;
   - `pair.slave.spawn_command(cmd)`;
   - guarda `{ master, writer, child }` em `PtyManager` (`HashMap<SessionId, Session>` protegido por `Mutex`);
   - inicia thread de leitura.
6. Thread de leitura: lê em buffer de 8–16 KB, decodifica UTF-8 de forma **incremental** (sem quebrar caracteres multibyte no meio), junta pedaços por até ~4–8 ms e envia `PtyEvent::Data`.
7. Quando a leitura retorna 0/erro, chama `child.wait()` e envia `PtyEvent::Exit { code }`.

### Armadilhas conhecidas do ConPTY

- **Consulta de cursor na inicialização:** o ConPTY envia `ESC[6n` logo que o shell abre e **trava a saída até receber a resposta**. O xterm.js responde sozinho, mas a resposta pode sair antes de `pty_spawn` retornar o `sessionId`. Por isso o `TerminalView` guarda numa fila tudo o que o terminal envia antes do ID chegar.
- **Ordem das escritas:** comandos `async` do Tauri podem rodar em paralelo, então as chamadas a `pty_write` são encadeadas no frontend para as teclas não chegarem fora de ordem.
- **`portable-pty` 0.9.0, `kill` no Windows:** o resultado de `TerminateProcess` vem invertido (erro quando dá certo). O `PtyManager` ignora esse retorno e usa o evento `exit` como confirmação.
- **Fim da sessão:** o leitor só recebe EOF quando o pseudoconsole é fechado. A thread que espera o processo remove a sessão (fechando o ConPTY), aguarda o leitor esvaziar e só então envia `exit`.

## 3.5 Fluxo: digitar

`term.onData(data => ipc.ptyWrite(sessionId, data))`. O backend grava no `writer` do PTY. Antes disso, `attachCustomKeyEventHandler` verifica se a combinação é um atalho do app; se for, executa a ação e retorna `false` para o xterm não enviar ao shell.

## 3.6 Fluxo: redimensionar

`ResizeObserver` no contêiner → `fitAddon.fit()` → (com *debounce* de ~50 ms) `pty_resize`. Sem o debounce, arrastar a janela gera dezenas de chamadas por segundo.

## 3.7 Fluxo: renomear

Duplo clique na aba / `F2` / menu de contexto → campo de texto na própria aba → `Enter` confirma, `Esc` cancela → `sessionsStore.rename(id, title)`. Opcional: o título pode seguir a sequência OSC 0/2 enviada pelo shell **até** o usuário renomear manualmente (flag `titleLocked`).

## 3.8 Modelo de dados (frontend)

```ts
interface Session {
  id: string;            // retornado pelo backend
  profileId: string;
  title: string;         // nome exibido
  titleLocked: boolean;  // true depois que o usuário renomeia
  color?: string;        // etiqueta de cor da aba
  cwd?: string;
  status: "running" | "exited";
  exitCode?: number | null;
}

interface Tab {
  id: string;
  layout: PaneNode;      // árvore de painéis (v2)
  activePaneId: string;
}

type PaneNode =
  | { kind: "leaf"; sessionId: string }
  | { kind: "split"; direction: "row" | "column"; ratio: number; a: PaneNode; b: PaneNode };
```

Na v1 cada aba tem um único `leaf`. Usar a árvore desde o início evita refatorar quando os painéis divididos chegarem.

## 3.9 Estrutura de pastas

```
nexus-terminal/
├─ docs/                          # esta documentação
├─ src/                           # frontend
│  ├─ app/
│  │  ├─ App.tsx
│  │  └─ main.tsx
│  ├─ components/
│  │  ├─ tabs/        TabBar.tsx, Tab.tsx, TabRenameInput.tsx, NewTabMenu.tsx
│  │  ├─ terminal/    TerminalView.tsx, useXterm.ts, PaneLayout.tsx
│  │  ├─ settings/    SettingsDialog.tsx, ShellsSection.tsx, AppearanceSection.tsx,
│  │  │               LanguageSection.tsx, KeybindingsSection.tsx, KeyRecorder.tsx
│  │  ├─ palette/     CommandPalette.tsx, QuickSwitcher.tsx
│  │  └─ ui/          Button, Dialog, ContextMenu... (sobre Radix)
│  ├─ stores/         sessions.ts, settings.ts, ui.ts
│  ├─ keybindings/    actions.ts, defaults.ts, matcher.ts
│  ├─ themes/         builtin/*.json, applyTheme.ts, schema.ts
│  ├─ i18n/           index.ts, locales/pt-BR.json, en-US.json, es-ES.json
│  ├─ lib/            ipc.ts, types.ts (gerado pelo backend), utils.ts
│  └─ styles/         global.css, variables.css
├─ src-tauri/                     # backend
│  ├─ src/
│  │  ├─ main.rs
│  │  ├─ lib.rs                   # registra comandos e plugins
│  │  ├─ commands/   pty.rs, settings.rs, shells.rs, themes.rs
│  │  ├─ pty/        manager.rs, session.rs, reader.rs
│  │  ├─ shells/     detect.rs, profile.rs
│  │  ├─ config/     settings.rs, paths.rs, migrate.rs
│  │  └─ error.rs
│  ├─ capabilities/default.json   # permissões do Tauri 2
│  ├─ icons/
│  ├─ Cargo.toml
│  └─ tauri.conf.json
├─ tests/e2e/                     # WebdriverIO
├─ .github/workflows/  ci.yml, release.yml
├─ package.json
├─ vite.config.ts
└─ tsconfig.json
```

## 3.10 Onde os dados do usuário ficam

| Item | Caminho |
|---|---|
| Configurações | `%APPDATA%\NexusTerminal\settings.json` |
| Temas do usuário | `%APPDATA%\NexusTerminal\themes\*.json` |
| Layout da última sessão | `%APPDATA%\NexusTerminal\session.json` |
| Logs | `%LOCALAPPDATA%\NexusTerminal\logs\` |

Usar `app.path().app_config_dir()` / `app_log_dir()` do Tauri em vez de montar os caminhos à mão.

## 3.11 Segurança

- **Capabilities do Tauri 2:** liberar só os comandos e plugins usados (`capabilities/default.json`).
- **CSP** restrita em `tauri.conf.json` (sem scripts remotos).
- `pty_spawn` recebe um `profileId`, **não** um caminho de executável livre. O executável vem do perfil salvo nas configurações.
- Links clicáveis no terminal abrem pelo `tauri-plugin-opener`, só com `http(s)://` e `file://`.
- Colar texto com várias linhas pede confirmação (configurável), para evitar rodar comandos colados por engano.
- Gravar `settings.json` de forma atômica: escrever em `.tmp` e depois renomear.

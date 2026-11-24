# 2. Tecnologias

## 2.1 Stack escolhida

| Camada | Tecnologia | Para quê |
|---|---|---|
| Shell do app desktop | **Tauri 2** | Janela nativa, empacotamento, IPC, plugins |
| Backend | **Rust (stable)** | Processos, PTY, leitura/gravação de configuração |
| PTY | **`portable-pty`** (crate, usa ConPTY) | Hospedar os shells como terminais reais |
| Async / threads | **`tokio`** + threads dedicadas de leitura | Ler a saída de cada PTY sem travar |
| Serialização | **`serde` / `serde_json`** | Configurações e mensagens IPC |
| Detecção de shells | **`winreg`**, **`which`** | Encontrar Git Bash, pwsh, WSL |
| Erros | **`thiserror`**, **`anyhow`** | Erros tipados no backend |
| Logs | **`tracing`** + `tracing-appender` | Logs em arquivo para diagnóstico |
| Frontend | **React 19 + TypeScript** | Interface |
| Build frontend | **Vite** | Dev server e build |
| Emulador de terminal | **xterm.js** (`@xterm/xterm`) | Renderizar o terminal (ANSI, cores, cursor, seleção) |
| Addons xterm | `@xterm/addon-fit`, `addon-webgl`, `addon-search`, `addon-web-links`, `addon-unicode11`, `addon-clipboard` | Redimensionamento, desempenho na GPU, busca, links clicáveis, emojis/CJK, área de transferência |
| Estado | **Zustand** | Lista de abas, sessão ativa, configurações |
| Estilo | **CSS Modules + variáveis CSS** (ou Tailwind CSS 4) | Temas trocados em tempo real via variáveis |
| Componentes acessíveis | **Radix UI** (primitivos) | Menus de contexto, diálogos, dropdowns |
| Arrastar e soltar | **dnd-kit** | Reordenar abas |
| Ícones | **lucide-react** | Ícones da interface |
| i18n | **i18next + react-i18next** | Idiomas |
| Validação | **zod** (front) / `serde` + validação manual (back) | Validar `settings.json` e temas importados |
| Plugins Tauri | `tauri-plugin-window-state`, `-dialog`, `-updater`, `-single-instance`, `-opener`, `-log` | Lembrar tamanho da janela, abrir arquivo, auto-update, instância única, abrir links |
| Testes front | **Vitest** + **Testing Library** | Testes de unidade e componentes |
| Testes back | **`cargo test`** | Testes de unidade e integração em Rust |
| E2E | **WebdriverIO + `tauri-driver`** | Testes ponta a ponta no app real (Windows suportado) |
| Lint/format | **ESLint, Prettier, `cargo clippy`, `rustfmt`** | Qualidade de código |
| Gerenciador de pacotes | **pnpm** | Dependências JS |
| CI/CD | **GitHub Actions** (`windows-latest`) + `tauri-action` | Build, testes, release |
| Instalador | **NSIS** (padrão) e **MSI** (WiX), gerados pelo Tauri | Distribuição |

## 2.2 Por que Tauri e não Electron?

| Critério | Tauri 2 | Electron |
|---|---|---|
| Tamanho do instalador | ~5–15 MB | ~80–150 MB |
| RAM em repouso | ~40–80 MB | ~150–300 MB |
| Motor web | WebView2 (Edge, já vem no Windows 10/11) | Chromium embutido |
| Linguagem do backend | Rust | Node.js |
| PTY | `portable-pty` (ConPTY) | `node-pty` (ConPTY), precisa compilar módulo nativo |
| Curva de aprendizado | Maior (Rust) | Menor (só JS) |

**Decisão:** Tauri, porque um gerenciador de terminais fica aberto o dia todo e o consumo de memória pesa. O xterm.js funciona igual nos dois, então a interface não muda.

**Alternativa válida:** se você não quiser aprender Rust agora, use **Electron + node-pty + xterm.js**. A arquitetura deste documento continua valendo: troque "comandos Tauri" por "IPC do Electron (`ipcMain`/`ipcRenderer` via `contextBridge`)".

## 2.3 Por que xterm.js?

É o emulador usado no terminal do VS Code, Hyper e vários outros. Suporta VT100/xterm completo, cores 24-bit, mouse, links, seleção, busca e renderização na GPU (WebGL). Escrever um emulador próprio levaria meses.

## 2.4 Por que ConPTY (`portable-pty`)?

Desde o Windows 10 1809, o ConPTY é a forma oficial de hospedar um shell como terminal. Sem ele, programas como `vim`, `htop`, barras de progresso e cores não funcionam direito. O `portable-pty` (do projeto WezTerm) expõe a API com uma interface simples: `openpty`, `spawn_command`, leitor, escritor e `resize`.

## 2.5 Requisitos mínimos do usuário final

- Windows 10 versão 1809 (build 17763) ou mais recente, ou Windows 11.
- WebView2 Runtime (já vem no Windows 11; o instalador baixa no Windows 10 se faltar).
- Os shells que a pessoa quiser usar (ex.: Git for Windows para o Git Bash).

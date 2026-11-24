# 7. Passo a passo (roadmap de implementação)

Cada fase termina com algo que funciona e pode ser testado. Estimativas para 1 pessoa em meio período, aprendendo Rust no caminho.

| Fase | Entrega | Estimativa |
|---|---|---|
| 0 | Projeto criado, CI básico | 1–2 dias |
| 1 | **Um terminal funcionando** | 1 semana |
| 2 | **Várias abas + renomear** | 1 semana |
| 3 | **Configurações: shells e geral** | 1 semana |
| 4 | **Temas, idioma e atalhos** | 1–2 semanas |
| 5 | Polimento, testes e instalador → **v1.0** | 1–2 semanas |
| 6 | Painéis, paleta, sessão, recursos P1/P2 | contínuo |

---

## Fase 0 — Fundação

1. Instalar o ambiente ([06-ambiente-dev.md](06-ambiente-dev.md)).
2. Criar o projeto com `pnpm create tauri-app` e rodar `pnpm tauri dev`.
3. Montar a estrutura de pastas de [03-arquitetura.md §3.9](03-arquitetura.md#39-estrutura-de-pastas).
4. Configurar ESLint, Prettier, `rustfmt`, `clippy`.
5. `git init`, `.gitignore` (inclui `node_modules/`, `dist/`, `src-tauri/target/`), primeiro commit.
6. Workflow `ci.yml` rodando lint + testes em `windows-latest`.
7. Em `tauri.conf.json`: nome do produto, identificador, tamanho inicial (1100×700), tamanho mínimo (600×400), `decorations: false` se for usar barra de título própria (recomendado, com abas na barra de título como no Warp/Windows Terminal).

**Pronto quando:** a janela abre e o CI está verde.

## Fase 1 — Um terminal funcionando

Backend:
1. `pty/session.rs`: struct `Session { master: Box<dyn MasterPty + Send>, writer: Box<dyn Write + Send>, child: Box<dyn Child + Send + Sync> }`.
2. `pty/manager.rs`: `PtyManager { sessions: Mutex<HashMap<String, Session>> }`, registrado com `app.manage(PtyManager::default())`.
3. Comando `pty_spawn` com perfil fixo (PowerShell) por enquanto:
   - `native_pty_system().openpty(PtySize { rows, cols, pixel_width: 0, pixel_height: 0 })`
   - `CommandBuilder::new(exe)`, `.args(...)`, `.cwd(...)`, `.env("TERM", "xterm-256color")`
   - `pair.slave.spawn_command(cmd)`, depois `drop(pair.slave)`
   - `try_clone_reader()` → thread de leitura que envia pelo `Channel<PtyEvent>`.
4. Decodificação UTF-8 incremental na thread (guardar bytes incompletos do fim do buffer para o próximo ciclo).
5. Comandos `pty_write`, `pty_resize`, `pty_kill`.
6. Ao fechar a janela, matar todas as sessões (`on_window_event` → `CloseRequested`).

Frontend:
7. `lib/ipc.ts` com funções tipadas (`spawn`, `write`, `resize`, `kill`).
8. Hook `useXterm`: cria `Terminal`, carrega addons (fit, webgl com fallback, unicode11, web-links), `open(container)`, `fit()`.
9. Ligar `onData` → `pty_write`; `Channel.onmessage` → `term.write`.
10. `ResizeObserver` + debounce → `fit()` + `pty_resize`.
11. Desmontar: `pty_kill` + `term.dispose()`.

**Testes manuais:** `dir`, `Get-Process`, cores, `vim`/`nano` no Git Bash, redimensionar a janela, `seq 1 1000000`.
**Testes automáticos:** teste Rust que cria uma sessão `cmd /c echo ola` e verifica que a saída contém `ola` e o evento `exit`.

## Fase 2 — Várias abas e renomear

1. `stores/sessions.ts` (Zustand): `tabs`, `activeTabId`, ações `create`, `close`, `activate`, `rename`, `move`, `setColor`.
2. `TabBar` + `Tab`: ícone, título, botão `×`, aba ativa destacada, botão `+`.
3. **Manter todos os xterm montados** e esconder os inativos com CSS (`display:none` ou `visibility`), para não perder o conteúdo. Ao ativar, chamar `fit()` e `focus()`.
4. Renomear: `TabRenameInput` em duplo clique / `F2` / menu de contexto. `Enter` salva, `Esc` cancela, `blur` salva.
5. Título vindo do shell: `term.onTitleChange` atualiza `title` se `titleLocked === false`.
6. Fechar: confirmação se `pty_has_children` (ou se o status é `running`, numa primeira versão).
7. Estado "processo encerrado" e reinício com `Enter`.
8. Menu de contexto da aba (Radix): Renomear, Cor, Duplicar, Fechar, Fechar outras, Fechar à direita.
9. Arrastar para reordenar (dnd-kit).
10. Atalhos fixos de navegação (`Ctrl+Tab`, `Ctrl+1..9`, `Ctrl+Shift+T/W`). Ainda sem tela de configuração.

**Pronto quando:** dá para abrir 10 abas, renomear, reordenar, alternar pelo teclado e fechar sem vazar processos (conferir no Gerenciador de Tarefas).

## Fase 3 — Configurações: shells e geral

1. `config/paths.rs` e `config/settings.rs`: struct `Settings` com `#[serde(default)]` em tudo, carregar/salvar de forma atômica.
2. `settings_load` / `settings_save` + `stores/settings.ts` no frontend.
3. `shells/detect.rs`: detectar PowerShell 5.1, pwsh, CMD, Git Bash (registro + caminhos), WSL (decodificar UTF-16LE da saída de `wsl -l -q`).
4. Na primeira execução: preencher `profiles` com os detectados e usar PowerShell como padrão (existe em qualquer Windows); o usuário troca depois.
5. `pty_spawn` passa a receber `profileId` e resolve executável, argumentos, `cwd` (com expansão de `%VAR%`) e `env`.
6. `SettingsDialog` (`Ctrl+,`) com navegação lateral; seção **Shells** (lista, padrão, adicionar/editar/excluir, detectar de novo) e **Geral**.
7. Menu do `+` lista os perfis.

**Pronto quando:** dá para escolher Git Bash como padrão, criar um perfil customizado e as escolhas persistem após reiniciar.

## Fase 4 — Temas, idioma e atalhos

Temas:
1. `themes/schema.ts` (zod) e temas embutidos em JSON.
2. `applyTheme(theme)`: variáveis CSS + `term.options.theme` em todas as sessões.
3. Seção **Aparência**: seletor de tema com prévia, modo "seguir o sistema", fonte, tamanho, cursor, opacidade.
4. Importar tema (`plugin-dialog` → `theme_import`), incluindo formato do Windows Terminal.

Idioma:
5. Configurar i18next, criar `pt-BR.json`, `en-US.json`, `es-ES.json`.
6. Trocar todas as strings fixas por `t("...")`.
7. Seção **Idioma** com troca imediata.
8. Teste que compara as chaves entre os arquivos de idioma.

Atalhos:
9. `keybindings/actions.ts`: registro central `{ id, labelKey, run(ctx) }`. Todas as ações do app passam por aqui (menus, paleta e atalhos usam a mesma fonte).
10. `keybindings/defaults.ts` + `matcher.ts` (normalização por `event.code`).
11. Listener global em `window` (fase de captura) + `attachCustomKeyEventHandler` no xterm.
12. Seção **Atalhos**: tabela com busca, gravador de tecla, detecção de conflitos, restaurar padrão.

**Pronto quando:** trocar tema, idioma e um atalho tem efeito imediato e persiste.

## Fase 5 — Polimento e v1.0

1. Busca no terminal (`addon-search`), zoom, limpar, copiar/colar com as regras de [05 §5.5](05-configuracoes.md#55-geral-e-avançado).
2. Confirmação de colagem com várias linhas.
3. Barra de título customizada (abas + botões minimizar/maximizar/fechar; `data-tauri-drag-region`).
4. Instância única (`tauri-plugin-single-instance`) e lembrar tamanho/posição (`window-state`).
5. Tratamento de erros visível: shell não encontrado, falha ao gravar configuração, WebGL indisponível (cair para renderizador DOM).
6. Logs em arquivo + item "Abrir pasta de logs" em Configurações → Avançado.
7. Acessibilidade: foco visível, navegação por teclado nos diálogos, `screenReaderMode` do xterm como opção.
8. Testes E2E principais (ver [08](08-testes-build-distribuicao.md)).
9. Ícone do app, tela "Sobre", licença (ex.: MIT) e `THIRD_PARTY_NOTICES` com as licenças das dependências.
10. Gerar instalador, assinar e publicar o release v1.0.0.

## Fase 6 — Depois da v1.0 (escolher pela demanda)

- Painéis divididos (a árvore `PaneNode` já existe).
- Alternador rápido (`Ctrl+P`) e paleta de comandos (`Ctrl+Shift+P`) usando o registro de ações.
- Restaurar sessão (`session.json`).
- Cores de aba, indicador de atividade, notificação de BEL.
- "Abrir Nexus aqui" no menu do Explorer (chave de registro criada pelo instalador NSIS).
- Auto-update.
- Launch configurations (conjuntos de abas nomeadas com comandos iniciais).
- Integração com shell (OSC 133) → base para **blocos de comando** no estilo Warp.

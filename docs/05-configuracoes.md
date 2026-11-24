# 5. Configurações

Tela de configurações aberta com `Ctrl+,`. Seções: **Geral, Shells, Aparência, Idioma, Atalhos, Avançado**. Toda mudança é aplicada na hora e gravada em `%APPDATA%\NexusTerminal\settings.json`.

## 5.1 Shells (perfis)

### Detecção automática

| Shell | Como detectar | Executável / argumentos |
|---|---|---|
| Windows PowerShell 5.1 | Sempre existe | `%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe` `-NoLogo` |
| PowerShell 7+ | `pwsh.exe` no PATH ou `%ProgramFiles%\PowerShell\*\pwsh.exe` | `pwsh.exe` `-NoLogo` |
| Prompt de Comando | `%ComSpec%` | `cmd.exe` |
| Git Bash | Registro `SOFTWARE\GitForWindows` → `InstallPath` (HKLM e HKCU); senão `%ProgramFiles%\Git` ou `%LOCALAPPDATA%\Programs\Git`; senão a partir do `git.exe` no PATH | `<InstallPath>\bin\bash.exe` `--login -i` |
| WSL | `wsl.exe -l -q` (saída em UTF-16LE!, limite de 4 s). Distros internas `docker-desktop*` e `rancher-desktop*` são ignoradas | `wsl.exe -d <distro>` |
| Customizado | Adicionado pelo usuário | Qualquer executável + argumentos |

Cuidados:
- Use `bin\bash.exe` do Git, **não** `git-bash.exe`, que abre a janela própria do MinTTY.
- Defina `TERM=xterm-256color` e `COLORTERM=truecolor` no ambiente da sessão.
- Para o Git Bash, defina `CHERE_INVOKING=1` para ele respeitar a pasta inicial.

### Campos de um perfil

```jsonc
{
  "id": "git-bash",                 // estável, usado nas referências
  "name": "Git Bash",
  "icon": "git",                    // ícone embutido ou caminho de imagem
  "command": "C:\\Program Files\\Git\\bin\\bash.exe",
  "args": ["--login", "-i"],
  "cwd": "%USERPROFILE%",           // aceita variáveis de ambiente
  "env": { "CHERE_INVOKING": "1" },
  "hidden": false,                  // esconder do menu sem apagar
  "source": "detected"              // "detected" | "custom"
}
```

### Tela
- Lista de perfis com ícone, nome, caminho e botão "Definir como padrão".
- Botões: **Adicionar perfil**, **Detectar novamente**, **Editar**, **Duplicar**, **Ocultar/Mostrar**, **Excluir** (com confirmação; um perfil detectado volta se o usuário usar "Detectar novamente") e **↑/↓** para ordenar (a ordem define `Ctrl+Shift+1..9`).
- Validação: aviso se o executável não existir.
- "Detectar novamente" só acrescenta perfis novos e atualiza executável/argumentos dos detectados; nome, pasta, variáveis e "oculto" editados pelo usuário são mantidos.
- O perfil padrão não pode ser ocultado.
- Na primeira execução (sem `settings.json`), os shells são detectados e o arquivo é criado. O padrão inicial é o Windows PowerShell.

## 5.2 Idioma

- Idiomas iniciais: **Português (Brasil)**, **English (US)**, **Español**.
- Padrão: idioma do sistema (`navigator.language`), com fallback para `en-US`.
- Troca imediata sem reiniciar (`i18n.changeLanguage`).
- Arquivos: `src/i18n/locales/<código>.json`, chaves por área:

```json
{
  "tabs": {
    "new": "Nova aba",
    "rename": "Renomear",
    "close": "Fechar",
    "closeConfirm": "Há um processo em execução em \"{{name}}\". Fechar mesmo assim?"
  },
  "settings": { "title": "Configurações", "language": "Idioma" }
}
```

- Regra: nenhuma string visível fica fixa no código. Um teste verifica se todos os idiomas têm as mesmas chaves.
- Menus nativos (bandeja, menu de contexto do Explorer) usam as mesmas traduções, carregadas no Rust a partir dos mesmos JSON.

## 5.3 Temas

Um tema define as cores da **interface** e as do **terminal** (16 cores ANSI + fundo, texto, cursor, seleção).

```jsonc
{
  "id": "nexus-dark",
  "name": "Nexus Dark",
  "type": "dark",                       // "dark" | "light", usado no ícone e na barra de título
  "ui": {
    "background": "#14161b",
    "surface": "#1c1f26",
    "border": "#2a2e37",
    "text": "#e6e6e6",
    "textMuted": "#8b93a1",
    "accent": "#5b8cff",
    "tabActive": "#1c1f26",
    "tabInactive": "#14161b"
  },
  "terminal": {
    "background": "#14161b",
    "foreground": "#e6e6e6",
    "cursor": "#5b8cff",
    "cursorAccent": "#14161b",
    "selectionBackground": "#5b8cff55",
    "black": "#1d1f24",   "brightBlack": "#5c6370",
    "red": "#e06c75",     "brightRed": "#ff7b86",
    "green": "#98c379",   "brightGreen": "#b5e890",
    "yellow": "#e5c07b",  "brightYellow": "#ffd88f",
    "blue": "#61afef",    "brightBlue": "#82c4ff",
    "magenta": "#c678dd", "brightMagenta": "#e09bff",
    "cyan": "#56b6c2",    "brightCyan": "#7fdbe6",
    "white": "#dcdfe4",   "brightWhite": "#ffffff"
  }
}
```

Aplicação:
- `ui.*` vira variáveis CSS em `:root` (`--color-background`, ...).
- `terminal.*` vai direto para `term.options.theme` de cada xterm aberto.
- A barra de título do Windows acompanha o tipo do tema (`setTheme("dark" | "light")`).
- `ui` é opcional no arquivo: cores ausentes são derivadas de `terminal` (fundo, texto e azul), em `themes/theme.ts → deriveUi`.

Modo (`settings.theme`):

```jsonc
"theme": { "mode": "system", "dark": "dracula", "light": "nexus-light" }
// mode: "system" (segue o Windows) | "dark" (sempre o tema escuro) | "light" (sempre o claro)
```

Se o tema escolhido não existir mais (ex.: tema importado excluído), o app usa Nexus Dark ou Nexus Light.

Temas embutidos: Nexus Dark, Nexus Light, Dracula, One Half Dark, One Half Light, Solarized Dark, Solarized Light e Nord (paletas de terceiros sob licença MIT, créditos em `THIRD_PARTY_NOTICES.md`).

Importação ("Importar tema…" em Aparência):
- Arquivo `.json` no formato acima, **ou** um esquema de cores do Windows Terminal (`name`, `background`, `foreground`, `black`...`brightWhite`, `purple`/`brightPurple`, `cursorColor`, `selectionBackground`), **ou** um `settings.json` do Windows Terminal inteiro (importa todos os itens de `schemes`).
- O tipo (claro/escuro) é deduzido pela luminância do fundo quando não vem no arquivo.
- Validação com zod; arquivo sem tema válido mostra erro. Limite de 1 MB.
- O tema é salvo em `%APPDATA%\NexusTerminal\themes\<id>.json`. O `id` só aceita `a-z`, `0-9` e `-` (o backend recusa qualquer outro, para não gravar fora da pasta). Um tema importado com o mesmo `id` de um embutido ganha o sufixo `-custom`.

Aparência do terminal (`settings.appearance`): família da fonte (padrão `Cascadia Code`, com Cascadia Mono e Consolas como reserva), tamanho (8–32), altura de linha (1.0–2.0), estilo do cursor (barra, bloco, sublinhado) e cursor piscando. Mudanças valem na hora para todos os terminais abertos. Opacidade/Mica da janela ficou para a v1.x (C-09).

## 5.4 Atalhos de teclado

### Ações (IDs estáveis)

| Ação | Padrão |
|---|---|
| `tab.new` | `Ctrl+Shift+T` |
| `tab.newWithProfile.1..9` | `Ctrl+Shift+1..9` |
| `tab.close` | `Ctrl+Shift+W` |
| `tab.rename` | `F2` |
| `tab.next` / `tab.prev` | `Ctrl+Tab` / `Ctrl+Shift+Tab` |
| `tab.goTo.1..8` / `tab.goToLast` | `Ctrl+1..8` / `Ctrl+9` |
| `tab.moveLeft` / `tab.moveRight` | `Ctrl+Shift+PageUp` / `Ctrl+Shift+PageDown` |
| `tab.duplicate` | `Ctrl+Shift+D` |
| `pane.splitRight` / `pane.splitDown` | `Alt+Shift+=` / `Alt+Shift+-` |
| `pane.focusLeft/Right/Up/Down` | `Alt+←/→/↑/↓` |
| `pane.close` | `Ctrl+Shift+W` (quando há mais de um painel) |
| `terminal.copy` / `terminal.paste` | `Ctrl+Shift+C` / `Ctrl+Shift+V` |
| `terminal.find` | `Ctrl+Shift+F` |
| `terminal.clear` | `Ctrl+Shift+K` |
| `terminal.zoomIn` / `zoomOut` / `zoomReset` | `Ctrl+=` / `Ctrl+-` / `Ctrl+0` |
| `app.quickSwitcher` | `Ctrl+P` |
| `app.commandPalette` | `Ctrl+Shift+P` |
| `app.settings` | `Ctrl+,` |
| `app.toggleFullscreen` | `F11` |

### Formato no `settings.json`

```jsonc
"keybindings": [
  { "action": "tab.new", "keys": "ctrl+shift+t" },
  { "action": "tab.rename", "keys": "f2" },
  { "action": "terminal.copy", "keys": null }      // null = desativado
]
```

Só as diferenças em relação ao padrão são gravadas; o resto vem de `keybindings/defaults.ts`. Cada ação tem um atalho (ou nenhum). As ações que já existem no app são as de `tab.*`, `terminal.copy`, `terminal.paste` e `app.settings`; as outras da tabela entram nas fases seguintes.

Tela de atalhos:
- Clicar no atalho entra no modo de gravação; `Esc` sozinho cancela.
- Atalhos precisam de `Ctrl`, `Alt` ou `Win` (ou ser uma tecla F), para não roubar teclas normais de digitação.
- Conflito: "Ctrl+X já é usado por *ação*. Usar nesta ação e remover de lá?" — se confirmar, a outra ação fica sem atalho.
- "Restaurar padrão" por ação e "Restaurar todos os padrões".
- Com qualquer diálogo aberto, os atalhos do app ficam desligados (as teclas vão para o diálogo).

### Regras de implementação
- Normalizar a combinação a partir de `KeyboardEvent.code` (tecla física) e modificadores, numa ordem fixa: `ctrl+alt+shift+meta+<tecla>`. Isso faz os atalhos funcionarem em teclados ABNT2 e US.
- No xterm, usar `term.attachCustomKeyEventHandler(e => !isAppShortcut(e))`.
- **Não** usar como padrão atalhos que shells usam (`Ctrl+C`, `Ctrl+D`, `Ctrl+R`, `Ctrl+L`, `Ctrl+A/E`, `Alt+B/F`). Por isso os padrões usam `Ctrl+Shift`.
- Tela de atalhos: tabela com busca, coluna "Atalho" clicável que abre o **gravador** ("Pressione a combinação..."), aviso de conflito ("Já usado por: Fechar aba — substituir?"), botões "Remover" e "Restaurar padrão".

## 5.5 Geral e Avançado

| Chave | Padrão | Descrição |
|---|---|---|
| `general.defaultProfile` | `"powershell"` | Perfil usado em nova aba |
| `general.restoreSession` | `true` | Reabrir abas da última vez |
| `general.confirmCloseRunning` | `true` | Confirmar ao fechar com processo ativo |
| `general.confirmMultilinePaste` | `true` | Confirmar colagem com várias linhas |
| `general.copyOnSelect` | `false` | Copiar ao selecionar |
| `general.rightClickPaste` | `true` | Clique direito cola (senão abre menu) |
| `general.ctrlCCopiesSelection` | `true` | `Ctrl+C` copia se houver seleção |
| `terminal.scrollback` | `10000` | Linhas no histórico |
| `terminal.renderer` | `"webgl"` | `"webgl"` ou `"dom"` (fallback) |
| `terminal.bell` | `"visual"` | `"none"`, `"visual"`, `"sound"` |
| `advanced.logLevel` | `"info"` | Nível de log |

## 5.6 Arquivo completo e migração

```jsonc
{
  "$schema": "https://.../settings.schema.json",
  "version": 1,
  "language": "pt-BR",
  "theme": { "mode": "system", "dark": "nexus-dark", "light": "nexus-light" },
  "appearance": { "fontFamily": "Cascadia Code", "fontSize": 14, "lineHeight": 1.2, "cursorStyle": "bar", "cursorBlink": true },
  "general": { "defaultProfile": "git-bash", "restoreSession": true },
  "profiles": [ /* ... */ ],
  "keybindings": [ /* só as diferenças */ ]
}
```

- Campo `version`: quando o formato mudar, o backend roda as migrações em sequência (`migrate.rs`: v1→v2, v2→v3...) e faz backup em `settings.json.bak` antes.
- Arquivo inválido: o app abre com os padrões, mostra aviso e **não** sobrescreve o arquivo do usuário.
- Publicar um JSON Schema para quem edita na mão ter autocomplete no VS Code.

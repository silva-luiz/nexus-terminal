# 5. Settings

The settings dialog opens with `Ctrl+,` (or the ⚙ button). Sections: **General, Appearance, Layout, Language, Shells, Shortcuts, Advanced, About**. Every change applies immediately and is saved to `%APPDATA%\NexusTerminal\settings.json`.

## 5.1 Shells (profiles)

### Automatic detection

| Shell | How it is detected | Executable / arguments |
|---|---|---|
| Windows PowerShell 5.1 | Always present | `%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe` `-NoLogo` |
| PowerShell 7+ | `pwsh.exe` on PATH or `%ProgramFiles%\PowerShell\*\pwsh.exe` (latest stable version) | `pwsh.exe` `-NoLogo` |
| Command Prompt | `%ComSpec%` | `cmd.exe` |
| Git Bash | Registry `SOFTWARE\GitForWindows` → `InstallPath` (HKLM and HKCU); otherwise `%ProgramFiles%\Git` or `%LOCALAPPDATA%\Programs\Git`; otherwise derived from `git.exe` on PATH | `<InstallPath>\bin\bash.exe` `--login -i` |
| WSL | `wsl.exe -l -q` (UTF-16LE output!, 4 s timeout). Internal distros `docker-desktop*` and `rancher-desktop*` are skipped | `wsl.exe -d <distro>` |
| Custom | Added by the user | Any executable + arguments |

Notes:
- Use Git's `bin\bash.exe`, **not** `git-bash.exe`, which opens its own MinTTY window.
- Every session gets `TERM=xterm-256color` and `COLORTERM=truecolor`.
- Git Bash gets `CHERE_INVOKING=1` so it respects the starting folder.

### Profile fields

```jsonc
{
  "id": "git-bash",                 // stable, used as a reference
  "name": "Git Bash",
  "icon": "git",                    // "powershell" | "cmd" | "git" | "linux" | "terminal"
  "command": "C:\\Program Files\\Git\\bin\\bash.exe",
  "args": ["--login", "-i"],
  "cwd": "%USERPROFILE%",           // optional; accepts %VARIABLES% and ~
  "env": { "CHERE_INVOKING": "1" },
  "hidden": false,                  // hide from the menu without deleting
  "source": "detected"              // "detected" | "custom"
}
```

### Screen
- Profile list with icon, name, command line and badges (default, detected/custom, hidden, executable not found).
- Buttons: **Add profile**, **Detect again**, **Set as default**, **Edit**, **Duplicate**, **Hide/Show**, **Delete** (with confirmation; a detected profile comes back if the user runs "Detect again") and **↑/↓** to reorder (the order defines `Ctrl+Shift+1..9`).
- Profile editor: name, icon, executable and starting folder (both with "Browse…"), arguments (space-separated, quotes for values with spaces) and environment variables (one `NAME=value` per line).
- "Detect again" only adds new profiles and updates the executable/arguments of detected ones; name, folder, variables and "hidden" edited by the user are kept.
- The default profile cannot be hidden.
- On first run (no `settings.json`), shells are detected and the file is created. The initial default is Windows PowerShell.
- If a requested starting folder does not exist, the profile's folder is used instead.

## 5.2 Language

- Languages: **Português (Brasil)**, **English (US)**, **Español**, plus "Follow Windows".
- Default: the system language (`navigator.language`), falling back to `en-US`.
- Switches live, without restarting.
- Files: `src/i18n/locales/<code>.json`, keys grouped by area:

```json
{
  "tabs": { "new": "New tab", "rename": "Rename", "close": "Close" },
  "settings": { "title": "Settings" }
}
```

- Rule: no visible string is hard-coded. A test checks that every language has exactly the same keys.
- Profile names created by detection are not translated (they can be renamed in Shells).

## 5.3 Themes

A theme defines the **interface** colors and the **terminal** colors (16 ANSI colors + background, foreground, cursor, selection).

```jsonc
{
  "id": "nexus-dark",
  "name": "Nexus Dark",
  "type": "dark",                       // "dark" | "light" (used for grouping and the title bar)
  "ui": {                               // optional: missing colors are derived from "terminal"
    "accent": "#5b8cff"
  },
  "terminal": {
    "background": "#16181d",
    "foreground": "#e6e6e6",
    "cursor": "#5b8cff",
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

UI color keys: `background`, `surface`, `surfaceHover`, `border`, `text`, `textMuted`, `accent`, `tabActive`, `tabInactive`.

How it is applied:
- `ui.*` becomes CSS variables on `:root` (`textMuted` → `--color-text-muted`).
- `terminal.*` goes straight to `term.options.theme` on every open xterm.
- The Windows title bar follows the theme type (`setTheme("dark" | "light")`).
- Missing UI colors are derived from the terminal palette (background, foreground and blue) in `themes/theme.ts → deriveUi`.

Theme in use (`settings.theme`):

```jsonc
"theme": { "selected": "dracula" }
```

- The Appearance section shows a single picker, with themes grouped into **Dark** and **Light**.
- If the selected theme no longer exists (e.g. a deleted imported theme), the app uses Nexus Dark.
- Compatibility: up to v1.0 the file stored `{ "mode": "system" | "dark" | "light", "dark": "...", "light": "..." }`. Without `selected`, the app uses the light theme when `mode` is `"light"` and the dark one otherwise; choosing a theme replaces the old fields.

Built-in themes: Nexus Dark, Nexus Light, Dracula, One Half Dark, One Half Light, Solarized Dark, Solarized Light and Nord (third-party palettes under the MIT license, credited in `THIRD_PARTY_NOTICES.md`).

Import ("Import theme…" in Appearance):
- A `.json` file in the format above, **or** a Windows Terminal color scheme (`name`, `background`, `foreground`, `black`...`brightWhite`, `purple`/`brightPurple`, `cursorColor`, `selectionBackground`), **or** a whole Windows Terminal `settings.json` (imports every item in `schemes`).
- The type (dark/light) is inferred from the background luminance when the file does not say.
- Validated with zod; a file without a valid theme shows an error. 1 MB limit.
- The theme is saved to `%APPDATA%\NexusTerminal\themes\<id>.json` and selected. The `id` only accepts `a-z`, `0-9` and `-` (the backend rejects anything else, so it never writes outside the folder). An imported theme with the same `id` as a built-in one gets a `-custom` suffix.
- Imported themes can be deleted from their card.

Terminal appearance (`settings.appearance`): font family (default `Cascadia Code`, with Cascadia Mono and Consolas as fallbacks), size (8–32), line height (1.0–2.0), cursor style (bar, block, underline) and blinking cursor. Changes apply immediately to every open terminal. Window opacity/Mica is planned for v1.x (C-09).

## 5.4 Keyboard shortcuts

### Actions (stable IDs)

| Action | Default |
|---|---|
| `tab.new` | `Ctrl+Shift+T` |
| `tab.newWithProfile.1..9` | `Ctrl+Shift+1..9` |
| `tab.close` | `Ctrl+Shift+W` |
| `tab.rename` | `F2` |
| `tab.next` / `tab.prev` | `Ctrl+Tab` / `Ctrl+Shift+Tab` |
| `tab.goTo.1..8` / `tab.goToLast` | `Ctrl+1..8` / `Ctrl+9` |
| `tab.moveLeft` / `tab.moveRight` | `Ctrl+Shift+PageUp` / `Ctrl+Shift+PageDown` |
| `terminal.copy` / `terminal.paste` | `Ctrl+Shift+C` / `Ctrl+Shift+V` |
| `terminal.find` | `Ctrl+Shift+F` |
| `terminal.clear` | `Ctrl+Shift+K` |
| `terminal.zoomIn` / `zoomOut` / `zoomReset` | `Ctrl+=` / `Ctrl+-` / `Ctrl+0` |
| `app.settings` | `Ctrl+,` |
| `app.toggleGrid` | `Ctrl+Shift+G` |
| `app.toggleFullscreen` | `F11` |

Planned (Phase 6): `tab.duplicate` (`Ctrl+Shift+D`), `pane.splitRight` / `pane.splitDown` (`Alt+Shift+=` / `Alt+Shift+-`), `pane.focusLeft/Right/Up/Down` (`Alt+arrows`), `app.quickSwitcher` (`Ctrl+P`), `app.commandPalette` (`Ctrl+Shift+P`).

### Format in `settings.json`

```jsonc
"keybindings": [
  { "action": "tab.new", "keys": "ctrl+alt+t" },
  { "action": "terminal.copy", "keys": null }      // null = disabled
]
```

Only differences from the defaults are saved; everything else comes from `keybindings/defaults.ts`. Each action has one shortcut (or none).

Shortcuts screen:
- Search by action name or shortcut.
- Clicking a shortcut starts recording; `Esc` alone cancels.
- Shortcuts must use `Ctrl`, `Alt` or `Win` (or be an F key), so they never steal normal typing keys.
- Conflicts: "Ctrl+X is already used by *action*. Use it here and remove it there?" — confirming leaves the other action without a shortcut.
- "Restore default" per action and "Restore all defaults".
- While any dialog is open, app shortcuts are disabled (keys go to the dialog).

### Implementation rules
- Combinations are normalized from `KeyboardEvent.code` (physical key) plus modifiers, in a fixed order: `ctrl+alt+shift+meta+<key>`. This makes shortcuts work on both ABNT2 and US keyboards.
- A capture-phase listener on `window` runs app shortcuts first; xterm also uses `attachCustomKeyEventHandler(e => !isAppShortcut(e))`.
- Defaults **never** use combinations that shells rely on (`Ctrl+C`, `Ctrl+D`, `Ctrl+R`, `Ctrl+L`, `Ctrl+A/E`, `Alt+B/F`), which is why they use `Ctrl+Shift`.
- `F5`, `Ctrl+R` and `Ctrl+Shift+R` are blocked so the WebView never reloads (which would close every terminal).

## 5.5 Layout (`settings.layout`)

```jsonc
"layout": {
  "tabPosition": "top",   // "top" | "left" | "right"
  "viewMode": "tabs",     // "tabs" (one terminal at a time) | "grid" (all side by side)
  "gridColumns": "auto",  // "auto" | 1 | 2 | 3 | 4 — maximum number of grid columns
  "sidebarWidth": 220     // 140–480, sidebar width in pixels
}
```

- With sidebar tabs, the title bar becomes thin (logo, active terminal name, buttons and window controls) and the terminal list moves to the sidebar. "Close tabs to the right" becomes "Close tabs below".
- `viewMode` is saved when the user toggles it with the button or shortcut: the app reopens in the last mode used.
- The Layout section shows how many columns × rows the grid will have with the terminals currently open.

## 5.6 General and Advanced

| Key | Default | Description |
|---|---|---|
| `general.defaultProfile` | `"powershell"` | Profile used for new tabs |
| `general.confirmCloseRunning` | `true` | Confirm before closing a tab/window with a running program |
| `general.ctrlCCopiesSelection` | `true` | `Ctrl+C` copies when there is a selection |
| `general.copyOnSelect` | `false` | Copy on select |
| `general.rightClickPaste` | `true` | Right-click copies/pastes (otherwise opens a menu) |
| `general.confirmMultilinePaste` | `true` | Confirm multi-line pastes |
| `terminal.scrollback` | `10000` | Scrollback lines (1,000–100,000) |
| `terminal.renderer` | `"webgl"` | `"webgl"` or `"dom"` (fallback); applies to new terminals |
| `terminal.screenReaderMode` | `false` | Exposes terminal text to screen readers |

Planned (v1.x): `general.restoreSession`, `terminal.bell` (`"none"`, `"visual"`, `"sound"`).

Logs: fixed `info` level, in `%LOCALAPPDATA%\NexusTerminal\logs\nexus-terminal.log` (up to 2 MB per file, 5 files, local time). Unhandled UI errors go to the same file. The **Advanced** section has buttons to open the settings folder and the logs folder.

Zoom (`Ctrl+=`, `Ctrl+-`, `Ctrl+0`, `Ctrl+wheel`) only lasts for the current session and is not saved; the saved font size is the one in Appearance.

## 5.7 Full file and compatibility

```jsonc
{
  "version": 1,
  "language": "system",
  "theme": { "selected": "nexus-dark" },
  "appearance": { "fontFamily": "Cascadia Code", "fontSize": 14, "lineHeight": 1.2, "cursorStyle": "bar", "cursorBlink": true },
  "layout": { "tabPosition": "top", "viewMode": "tabs", "gridColumns": "auto", "sidebarWidth": 220 },
  "terminal": { "scrollback": 10000, "renderer": "webgl", "screenReaderMode": false },
  "general": { "defaultProfile": "git-bash", "confirmCloseRunning": true },
  "profiles": [ /* ... */ ],
  "keybindings": [ /* differences only */ ]
}
```

- Unknown keys (e.g. written by a newer version) are preserved when saving.
- Each optional section is read with defaults (`settings/defaults.ts`); an invalid field falls back to its default without affecting the others.
- Invalid file: the app opens with defaults, shows a warning and does **not** overwrite the user's file until a change is saved; at that point the original is kept as `settings.json.bak`.
- `version`: when the format changes incompatibly, migrations will run in sequence before loading (none needed so far).
- Future: publish a JSON Schema so hand-editing gets autocomplete in VS Code.

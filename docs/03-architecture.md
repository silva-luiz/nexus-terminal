# 3. Architecture

## 3.1 Layers

```
┌──────────────────────────────────────────────────────────────┐
│                     FRONTEND (WebView2)                      │
│  React + TypeScript                                          │
│                                                              │
│  ┌────────────┐ ┌──────────────┐ ┌────────────┐ ┌─────────┐  │
│  │ TabBar /   │ │ TerminalView │ │  Settings  │ │ Search  │  │
│  │ Sidebar    │ │ (xterm.js)   │ │  dialog    │ │  bar    │  │
│  └─────┬──────┘ └──────┬───────┘ └─────┬──────┘ └────┬────┘  │
│        └───────────────┴───── Zustand stores ────────┘       │
│              (sessions, settings, ui, themes, keybindings)   │
│                        ▼                                     │
│               lib/ipc.ts (typed wrapper)                     │
└────────────────────────┬─────────────────────────────────────┘
                         │ invoke() / Channel<T> / events
┌────────────────────────▼─────────────────────────────────────┐
│                    BACKEND (Rust / Tauri)                    │
│                                                              │
│  commands/        pty/              config/        shells/   │
│  ├ app.rs     ──▶ ├ manager.rs      ├ settings.rs  ├ detect  │
│  ├ pty.rs         └ decoder.rs      ├ state.rs     ├ profile │
│  ├ settings.rs                      ├ themes.rs    ├ expand  │
│  ├ shells.rs                        └ paths.rs     └ processes│
│  └ themes.rs                                                 │
└─────────────────────────┬────────────────────────────────────┘
                          ▼
                ConPTY (Windows) ──▶ powershell.exe / bash.exe / cmd.exe / wsl.exe
```

## 3.2 Responsibilities

**Backend (Rust)**
- Create, write to, resize and kill PTY sessions.
- Read each PTY's output on its own thread and stream it to the frontend.
- Detect installed shells and check whether a shell has programs running inside it.
- Read, validate and save `settings.json` and user themes.
- Notify the frontend when a process exits (exit code).
- Single instance, window state and logging (via plugins).

**Frontend (React)**
- Render tabs (top or sidebar), the grid, settings and dialogs.
- Host one xterm.js instance per session.
- Interpret keyboard shortcuts and decide whether they go to the app or to the shell.
- Apply theme, appearance, language and layout live.

Rule: **the frontend never runs processes**. It only asks the backend, through commands with fixed names and validated arguments.

## 3.3 IPC commands (contract)

| Command | Input | Output | Description |
|---|---|---|---|
| `pty_spawn` | `{ profileId, cwd?, cols, rows, onEvent: Channel<PtyEvent> }` | `sessionId: string` | Creates a session and starts streaming its output |
| `pty_write` | `{ sessionId, data: string }` | `()` | Sends keys/text to the shell |
| `pty_resize` | `{ sessionId, cols, rows }` | `()` | Resizes the PTY |
| `pty_kill` | `{ sessionId }` | `()` | Kills the process and frees resources |
| `pty_has_running_process` | `{ sessionId }` | `bool` | Is a program running inside the shell (ignoring the shell's own processes, like the Git Bash launcher)? Used to confirm before closing |
| `shells_redetect` | — | `Settings` | Detects shells again, adds new profiles and saves |
| `commands_exist` | `{ commands: string[] }` | `bool[]` | Checks whether each executable exists (warning in the Shells screen) |
| `settings_load` | — | `{ settings, warning }` | In-memory settings; `warning` when the file was invalid |
| `settings_save` | `Settings` | `Settings` | Normalizes, writes atomically and returns the result |
| `themes_list` | — | `unknown[]` | User themes folder (built-in themes live in the frontend); validation happens in the frontend |
| `themes_read_file` | `{ path }` | `unknown` | Reads the JSON chosen in "Import theme" (1 MB limit) |
| `themes_save` / `themes_delete` | `{ theme }` / `{ id }` | `()` | Writes/deletes `themes/<id>.json` (id restricted to `a-z0-9-`) |
| `app_start_dir` | — | `string \| null` | Folder passed with `-d`/`--directory` on the command line |
| `open_app_folder` | `{ folder: "config" \| "logs" }` | `()` | Opens the folder in Explorer |

Planned (v1.x): `session_save_layout` / `session_load_layout` to restore tabs on startup.

Backend-to-frontend event: `open-tab` (`{ cwd: string \| null }`), emitted when the app is launched again (single instance) to create a tab in the existing window.

`PtyEvent` (sent through the `Channel`):

```ts
type PtyEvent =
  | { type: "data"; data: string }      // shell output (UTF-8)
  | { type: "exit"; code: number | null }
```

> Use `tauri::ipc::Channel` (Tauri 2) for output, not global events (`emit`). A Channel is ordered, bound to one session and faster for continuous streams.

## 3.4 Flow: opening a terminal

1. The user presses `Ctrl+Shift+T` (or clicks `+`, or picks a profile from the arrow menu).
2. `sessions.create(profileId)` creates the tab with a default name (e.g. "Windows PowerShell 2").
3. `TerminalView` mounts xterm.js and runs `fit()` to get `cols`/`rows`.
4. It calls `pty_spawn` with a `Channel` whose `onmessage` does `term.write(data)`.
5. Backend:
   - resolves the profile (executable + arguments + starting folder + environment, expanding `%VAR%` and `~`);
   - `native_pty_system().openpty(PtySize { rows, cols, .. })`;
   - `pair.slave.spawn_command(cmd)`;
   - stores `{ master, writer, killer, pid }` in `PtyManager` (`HashMap<SessionId, Session>` behind a `Mutex`);
   - starts a reader thread and a waiter thread.
6. Reader thread: reads into a 16 KB buffer, decodes UTF-8 **incrementally** (never splitting multi-byte characters) and sends `PtyEvent::Data`.
7. Waiter thread: when the child exits, removes the session (closing the ConPTY), waits for the reader to drain and then sends `PtyEvent::Exit { code }`.

### Known ConPTY pitfalls

- **Cursor position query at startup:** ConPTY sends `ESC[6n` as soon as the shell opens and **blocks output until it gets an answer**. xterm.js answers automatically, but the answer may be produced before `pty_spawn` returns the `sessionId`. That is why `TerminalView` queues everything the terminal sends until the ID arrives.
- **Write ordering:** Tauri `async` commands may run in parallel, so `pty_write` calls are chained on the frontend so keystrokes never arrive out of order.
- **`portable-pty` 0.9.0 `kill` on Windows:** the `TerminateProcess` result is inverted (error on success). `PtyManager` ignores that return value and uses the `exit` event as confirmation.
- **End of session:** the reader only gets EOF when the pseudoconsole is closed, hence the waiter thread described above.

## 3.5 Flow: typing

`term.onData(data => pty.write(sessionId, data))`. The backend writes to the PTY `writer`. Before that, a capture-phase `keydown` listener and `attachCustomKeyEventHandler` check whether the key combination is an app shortcut; if so, the action runs and xterm does not send it to the shell.

## 3.6 Flow: resizing

`ResizeObserver` on the container → (with a ~50 ms *debounce*) `fitAddon.fit()` → `term.onResize` → `pty_resize`. Without the debounce, dragging the window would generate dozens of calls per second.

## 3.7 Flow: renaming

Double-click on the tab / `F2` / context menu → inline text field in the tab → `Enter` confirms, `Esc` cancels → `sessions.rename(id, title)`. The title follows the OSC 0/2 sequence sent by the shell **until** the user renames it manually (`titleLocked` flag).

## 3.8 Flow: tabs vs. grid

All `TerminalView`s stay mounted in the terminal area at all times. In tabs mode only the active one is visible; in grid mode every view gets a cell computed by `layout/grid.ts → gridRects` (fractions of the area). Switching modes only changes positions, so terminals are never recreated and nothing is lost.

## 3.9 Data model (frontend)

```ts
interface TerminalTab {
  id: string;               // local tab id
  profileId: string;
  defaultTitle: string;     // profile name + number
  title: string;            // displayed name
  titleLocked: boolean;     // true after the user renames it
  cwd?: string;             // requested starting folder (e.g. from -d)
  status: "starting" | "running" | "exited";
  exitCode: number | null;
  sessionId: string | null; // backend session while running
  generation: number;       // bumped on restart to recreate the terminal
}
```

Split panes (roadmap) will add a pane tree per tab:

```ts
type PaneNode =
  | { kind: "leaf"; sessionId: string }
  | { kind: "split"; direction: "row" | "column"; ratio: number; a: PaneNode; b: PaneNode };
```

## 3.10 Folder structure

```
nexus-terminal/
├─ docs/                          # this documentation
├─ assets/logo.svg                # icon source (pnpm tauri icon)
├─ public/logo.svg
├─ scripts/third-party-licenses.mjs
├─ src/                           # frontend
│  ├─ app/          App.tsx, main.tsx, settingsSync.ts
│  ├─ components/
│  │  ├─ chrome/    TitleBar, ToolbarButtons, WindowControls, useTabMenus
│  │  ├─ tabs/      TabBar, Sidebar, Tab
│  │  ├─ terminal/  TerminalView, SearchBar
│  │  ├─ settings/  SettingsDialog + General/Appearance/Layout/Language/Shells/
│  │  │             Keybindings/Advanced/About sections, ProfileEditor, CheckboxField
│  │  └─ ui/        Modal, ConfirmDialog, ContextMenu, ProfileIcon
│  ├─ i18n/         index.ts, locales/pt-BR.json, en-US.json, es-ES.json
│  ├─ keybindings/  actions, bindings, defaults, labels, matcher, useGlobalShortcuts
│  ├─ layout/       grid.ts, useLayout.ts
│  ├─ lib/          ipc, types, terminals, closeTabs, window, errorLog
│  ├─ settings/     defaults.ts (zod readers), profiles.ts
│  ├─ stores/       sessions, settings, ui, themes
│  ├─ themes/       builtin, theme, color, resolve, apply
│  └─ styles/       global.css, variables.css
├─ src-tauri/                     # backend
│  ├─ src/
│  │  ├─ main.rs, lib.rs          # lib.rs registers plugins and commands
│  │  ├─ cli.rs                   # -d / --directory parsing
│  │  ├─ commands/  app, pty, settings, shells, themes
│  │  ├─ pty/       manager, decoder
│  │  ├─ shells/    detect, profile, expand, processes
│  │  ├─ config/    settings, state, themes, paths
│  │  └─ error.rs
│  ├─ capabilities/default.json   # Tauri 2 permissions
│  ├─ icons/
│  ├─ Cargo.toml
│  └─ tauri.conf.json
├─ .github/workflows/  ci.yml, release.yml
├─ package.json, vite.config.ts, tsconfig.json, eslint.config.js
├─ CHANGELOG.md, THIRD_PARTY_NOTICES.md, THIRD_PARTY_LICENSES.md
└─ README.md
```

## 3.11 Where user data lives

| Item | Path |
|---|---|
| Settings | `%APPDATA%\NexusTerminal\settings.json` |
| User themes | `%APPDATA%\NexusTerminal\themes\*.json` |
| Logs | `%LOCALAPPDATA%\NexusTerminal\logs\nexus-terminal.log` |
| Window size/position | Managed by `tauri-plugin-window-state` (app data folder) |

## 3.12 Security

- **Tauri 2 capabilities:** only the commands and plugin permissions in use are allowed (`capabilities/default.json`).
- `pty_spawn` receives a `profileId`, **not** an arbitrary executable path. The executable comes from the saved profile.
- Theme ids become file names, so the backend only accepts `a-z`, `0-9` and `-` (no path traversal); imported files are limited to 1 MB.
- Clickable links in the terminal open through `tauri-plugin-opener` and require `Ctrl+click`.
- Pasting multi-line text asks for confirmation (configurable), to avoid running pasted commands by accident.
- `settings.json` and themes are written atomically (write to `.tmp`, then rename).
- To do: a strict CSP in `tauri.conf.json` (currently `null`, the template default).

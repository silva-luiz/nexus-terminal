# 7. Roadmap

Each phase ends with something that works and can be tested.

| Phase | Deliverable | Status |
|---|---|---|
| 0 | Project scaffolding, basic CI | ✅ |
| 1 | **One working terminal** | ✅ |
| 2 | **Multiple tabs + renaming** | ✅ |
| 3 | **Settings: shells and general** | ✅ |
| 4 | **Themes, language and shortcuts** | ✅ |
| 5 | Polish, tests and installer → **v1.0** | ✅ (E2E tests and code signing pending) |
| — | Layout: sidebar tabs and grid view | ✅ (unreleased) |
| 6 | Panes, palette, session restore, P1/P2 features | Next |

---

## Phase 0 — Foundation ✅

1. Install the environment ([06-dev-environment.md](06-dev-environment.md)).
2. Create the project with `pnpm create tauri-app` (React + TypeScript template).
3. Set up the folder structure ([03-architecture.md §3.10](03-architecture.md#310-folder-structure)).
4. Configure ESLint, Prettier, `rustfmt`, `clippy`.
5. `git init`, `.gitignore`, `.gitattributes` (LF line endings), first commit.
6. `ci.yml` workflow running lint + tests on `windows-latest`.

## Phase 1 — One working terminal ✅

Backend:
1. `PtyManager { sessions: Mutex<HashMap<String, Session>> }`, registered with `app.manage(...)`.
2. `pty_spawn`: `openpty` → `spawn_command` → drop the slave → reader thread streaming through `Channel<PtyEvent>`.
3. Incremental UTF-8 decoding (keep incomplete bytes from the end of the buffer for the next read).
4. `pty_write`, `pty_resize`, `pty_kill`; kill every session when the app exits.

Frontend:
5. `lib/ipc.ts` with typed functions.
6. `TerminalView`: creates the `Terminal`, loads addons (fit, WebGL with fallback, unicode11, web-links), wires `onData` → `pty_write` and `Channel.onmessage` → `term.write`.
7. `ResizeObserver` + debounce → `fit()` → `pty_resize`.

Lessons learned: see "Known ConPTY pitfalls" in [03-architecture.md](03-architecture.md#known-conpty-pitfalls).

## Phase 2 — Tabs and renaming ✅

1. `stores/sessions.ts` (Zustand): create, close, activate, rename, move, restart.
2. Tab bar with icon, title, `×`, active highlight and `+`.
3. **Keep every xterm mounted** and hide inactive ones with CSS, so content is never lost.
4. Inline rename (double-click / `F2` / context menu); shell titles (OSC) until the user renames.
5. Exited state and restart with `Enter`; context menu; drag-to-reorder; navigation shortcuts.

## Phase 3 — Settings: shells and general ✅

1. `config/settings.rs`: `Settings` with defaults everywhere, atomic save, unknown keys preserved, `.bak` of invalid files.
2. `shells/detect.rs`: PowerShell 5.1, pwsh, CMD, Git Bash (registry + paths), WSL (UTF-16LE output).
3. First run fills `profiles` and uses PowerShell as the default.
4. `pty_spawn` receives a `profileId` and resolves executable, arguments, `cwd` (`%VAR%`, `~`) and `env`.
5. Settings dialog (`Ctrl+,`) with **General** and **Shells**; close confirmation when a program is running (Toolhelp process tree).

## Phase 4 — Themes, language and shortcuts ✅

1. Theme model (zod), built-in themes, UI colors derived from the terminal palette, import (including Windows Terminal schemes).
2. Live application: CSS variables + `term.options` on every session + title bar theme.
3. i18next with pt-BR, en-US and es-ES; test comparing keys across languages.
4. Central action registry, configurable bindings (only differences saved), key recorder with conflict detection.

## Phase 5 — Polish and v1.0 ✅

1. Search (`addon-search`), zoom, clear, copy/paste options, multi-line paste confirmation.
2. Custom title bar (`decorations: false`, `data-tauri-drag-region`, window controls).
3. Single instance (`tauri-plugin-single-instance`), `-d <folder>`, remembered window state.
4. File logging (backend + UI errors), Advanced and About sections.
5. App icon, `THIRD_PARTY_NOTICES.md`, generated `THIRD_PARTY_LICENSES.md`, CHANGELOG, release workflow, NSIS/MSI installers.
6. Pending: E2E tests ([08](08-testing-build-release.md)), code signing, project license file.

## Layout update ✅ (unreleased)

1. Tab position: top, left sidebar or right sidebar (resizable).
2. Grid view with all terminals side by side (`Ctrl+Shift+G`), automatic or capped columns.
3. Single theme picker (dark/light groups), split "new tab" button with a profile menu showing icons.

## Phase 6 — After v1.0 (pick by demand)

- Split panes (pane tree per tab).
- Quick switcher (`Ctrl+P`) and command palette (`Ctrl+Shift+P`) using the action registry.
- Session restore.
- Tab colors, activity indicator, bell notifications.
- "Open Nexus here" in the Explorer context menu (registry key created by the NSIS installer).
- Auto-update (`tauri-plugin-updater`).
- Launch configurations (sets of named tabs with startup commands).
- Shell integration (OSC 133) → foundation for Warp-style **command blocks**.

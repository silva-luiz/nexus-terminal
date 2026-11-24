# Nexus Terminal

> Terminal manager for Windows: many terminals in one window, organized as tabs, in a sidebar or side by side in a grid — renamable and configurable (shell, language, theme, shortcuts and layout).

## Documentation

| # | Document | Contents |
|---|-----------|----------|
| 1 | [Overview](docs/01-overview.md) | Goal, audience, scope and what the project is **not** |
| 2 | [Tech stack](docs/02-tech-stack.md) | Technologies used, rationale and alternatives |
| 3 | [Architecture](docs/03-architecture.md) | Layers, data flow, IPC commands, folder structure |
| 4 | [Features](docs/04-features.md) | Full feature list with acceptance criteria and status |
| 5 | [Settings](docs/05-settings.md) | Shells, language, themes, shortcuts, layout and the `settings.json` format |
| 6 | [Development environment](docs/06-dev-environment.md) | Installing the tools and running the project |
| 7 | [Roadmap](docs/07-roadmap.md) | Implementation phases, done and next |
| 8 | [Testing, build and release](docs/08-testing-build-release.md) | Test strategy, installers, signing, auto-update, CI |
| 9 | [Conventions](docs/09-conventions.md) | Code, commit, branch and documentation standards |

## At a glance

- **Stack:** Tauri 2 (Rust) + React + TypeScript + Vite + xterm.js
- **Native terminal:** Windows ConPTY through the `portable-pty` crate
- **Supported shells:** Windows PowerShell 5.1, PowerShell 7, Command Prompt, Git Bash, WSL and custom shells (detected automatically)
- **Languages:** Portuguese (Brazil), English and Spanish (i18next)
- **Layout:** tabs on top or in a sidebar (left/right) and a grid view with every terminal side by side
- **Target platform:** Windows 10 (1809+) and Windows 11, x64 and ARM64

## Getting started

Prerequisites in [docs/06-dev-environment.md](docs/06-dev-environment.md) (Rust, Node 22, pnpm, Visual Studio Build Tools).

```powershell
pnpm install
pnpm dev                  # run the app in development mode
pnpm test                 # frontend (Vitest) and backend (cargo test) tests
pnpm lint                 # ESLint + clippy
pnpm build                # build the installers into src-tauri\target\release\bundle
pnpm licenses:generate    # refresh THIRD_PARTY_LICENSES.md
```

Command line of the installed app:

```powershell
nexus-terminal.exe -d C:\projects\api   # opens the terminal (or a new tab) in that folder
```

Versions: see the [CHANGELOG](CHANGELOG.md). To release, push a `vX.Y.Z` tag; the `release.yml` workflow creates a **draft** release with the installers for manual review and publishing.

## Status

| Phase | Status |
|---|---|
| 0 — Foundation | ✅ Project, lint, formatting, tests, CI |
| 1 — One working terminal | ✅ ConPTY, xterm.js (WebGL), resizing, links, Unicode |
| 2 — Multiple tabs + renaming | ✅ Tabs, renaming (double-click/F2/menu), automatic titles, drag to reorder, context menu, shortcuts, restart with Enter |
| 3 — Settings: shells and general | ✅ Detection (PowerShell 5.1/7, CMD, Git Bash, WSL), `settings.json`, settings dialog (`Ctrl+,`), profile editor, close confirmation when a program is running |
| 4 — Themes, language and shortcuts | ✅ 8 built-in themes + import (including Windows Terminal schemes), font and cursor, languages (pt-BR, en-US, es-ES) and customizable shortcuts with conflict detection |
| 5 — Polish and v1.0 | ✅ Custom title bar, single instance, `-d <folder>`, search, zoom, clear, copy/paste options, window close confirmation, logs, Advanced and About sections, icon, licenses and installers |
| Layout update | ✅ Tabs on top/left/right, grid view, single theme picker (unreleased) |
| 6 — After v1.0 | ⏳ Split panes, command palette, session restore, auto-update… |

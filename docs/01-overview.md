# 1. Overview

## 1.1 Problem

People who work with several terminals at once (dev server, build, git, database, logs, SSH...) end up with a pile of loose windows, all called "Windows PowerShell" or "MINGW64". Finding the right one becomes trial and error.

## 1.2 Solution

A Windows desktop app that:

1. Opens **many terminals in a single window**, organized as tabs, in a sidebar, or all side by side in a grid (split panes are on the roadmap).
2. Lets you **rename each terminal** (e.g. `API - npm run dev`, `Git`, `Prod logs`) so it is easy to identify.
3. Lets you **move between them quickly** with the keyboard (shortcuts today; quick switcher and command palette on the roadmap).
4. Has **settings** to choose:
   - the default shell and the available shells (Git Bash, PowerShell, CMD, WSL...);
   - the interface language;
   - the theme (interface and terminal colors);
   - the keyboard shortcuts;
   - the layout (tab position and tabs vs. grid view).

Inspiration: Warp Terminal (modern look, productivity focus) and Windows Terminal (tabs + profiles).

## 1.3 Target audience

- Windows developers who use several shells at the same time.
- Git Bash users who want a better interface than the default MinTTY window.
- People who organize their work by "context" (one terminal per service/project).

## 1.4 Product goals

| Goal | Success metric |
|---|---|
| Start fast | Window ready in under 1.5 s on a typical machine |
| Stay light | Under 150 MB of RAM with 5 terminals open |
| Stay smooth | Large output (e.g. `cat` of a 50 MB file) without freezing the UI |
| Easy to identify | Rename a terminal in 2 actions (double-click + type) |
| Keyboard-only friendly | Every main action has a shortcut |

## 1.5 Out of scope (at least for v1)

- macOS/Linux builds (the architecture allows it, but the focus is Windows).
- Built-in AI, user accounts, cloud sync and collaboration (Warp features that require a backend).
- Warp-style "blocks" input editor: requires shell integration and is on the roadmap (see [Roadmap, Phase 6](07-roadmap.md)).
- A built-in SSH client (users can run `ssh` inside any shell).

## 1.6 Glossary

| Term | Meaning |
|---|---|
| **Shell** | Program that interprets commands (PowerShell, bash, cmd). |
| **Terminal / session** | A running shell instance attached to a display area. |
| **Tab** | Item in the tab bar (top or sidebar) that represents a session. |
| **Grid view** | View mode that shows every open terminal at once, side by side. |
| **Pane** | A split of a tab's area, each with its own session (roadmap). |
| **Profile** | Shell configuration: executable, arguments, starting folder, environment, icon. |
| **PTY / ConPTY** | Pseudo-terminal. ConPTY is the Windows API that lets an app host a shell as a real terminal. |
| **IPC** | Communication between the interface (WebView) and the Rust backend. |

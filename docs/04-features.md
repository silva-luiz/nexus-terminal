# 4. Features

Priority: **P0** = MVP (v1.0), **P1** = soon after (v1.x), **P2** = future. ✅ = done.

## 4.1 Terminal management

| ID | Feature | Status | Acceptance criteria |
|---|---|---|---|
| T-01 | Open a new terminal with the default shell | ✅ | `Ctrl+Shift+T` or the `+` button opens a new tab within 500 ms |
| T-02 | Open a terminal choosing the shell | ✅ | The arrow next to `+` lists the profiles (with icons, default marked); `Ctrl+Shift+1..9` opens profile N |
| T-03 | Close a terminal | ✅ | `Ctrl+Shift+W`, the `×` button or middle-click on the tab. Asks first if a program is running (configurable) |
| T-04 | Show an exited terminal | ✅ | When the shell exits, the tab is dimmed and shows "Process exited (code X). Press Enter to restart" |
| T-05 | Restart a terminal | ✅ | Context menu → "Restart" recreates the session with the same profile and name |
| T-06 | Duplicate a terminal | P1 | Opens a new tab with the same profile and current folder |
| T-07 | Open in a specific folder | ✅ / P1 | Command-line argument `nexus-terminal.exe -d "C:\project"` ✅; "Open Nexus here" in the Explorer menu (P1) |
| T-08 | Split panes | P1 | `Alt+Shift+=` splits vertically, `Alt+Shift+-` horizontally, `Alt+arrows` move focus, dragging the divider resizes |
| T-09 | Single instance | ✅ | Launching the app again creates a tab in the existing window instead of a new window |
| T-10 | Multiple windows | P2 | Dragging a tab out creates a new window |

## 4.2 Organization and identification

| ID | Feature | Status | Acceptance criteria |
|---|---|---|---|
| O-01 | **Rename a terminal** | ✅ | Double-click the tab, `F2` or context menu → "Rename". `Enter` saves, `Esc` cancels, an empty name restores the default. Max 60 characters |
| O-02 | Automatic title from the shell | ✅ | Without a manual name, the tab shows the title sent by the shell (OSC 0/2) or the profile name |
| O-03 | Tab color | P1 | Context menu → "Color" with 8 colors + "none". The color shows as a stripe on the tab |
| O-04 | Profile icon on the tab | ✅ | Each tab shows the shell icon (PowerShell, Git, CMD, Linux, generic) |
| O-05 | Reorder tabs | ✅ | Drag and drop; `Ctrl+Shift+PageUp/PageDown` moves the active tab |
| O-06 | Restore session | P1 | On startup, recreates tabs with names, colors, profiles and folders (does not restore processes) |
| O-07 | Tab groups | P2 | Group tabs under a name (e.g. "Project X") and collapse/expand |
| O-08 | Sidebar with the terminal list | ✅ | Tabs on top, on the left or on the right (Settings → Layout). In the sidebar, the width is adjusted by dragging its edge (or with the arrow keys when the edge is focused) and is saved |
| O-09 | Activity indicator | P1 | A background tab shows a dot when it receives new output |
| O-10 | Grid view | ✅ | `Ctrl+Shift+G` or the toolbar button toggles between "tabs" (one terminal at a time) and "grid" (all visible, in tab order). Automatic grid (2 → side by side, 3 → 2 on top + 1 below, 4 → 2×2…) or a maximum of 1 to 4 columns; the last row stretches so there are no holes. Clicking a cell focuses it; double-clicking its header returns to tabs mode with that terminal. Switching modes never restarts terminals |

## 4.3 Navigation

| ID | Feature | Status | Acceptance criteria |
|---|---|---|---|
| N-01 | Next/previous | ✅ | `Ctrl+Tab` / `Ctrl+Shift+Tab` |
| N-02 | Go to tab N | ✅ | `Ctrl+1..8`; `Ctrl+9` goes to the last one |
| N-03 | Quick switcher | P1 | `Ctrl+P`: search open terminals by name and focus the chosen one |
| N-04 | Command palette | P1 | `Ctrl+Shift+P`: lists every app action with its shortcut |
| N-05 | Keyboard scrolling | P1 | `Ctrl+Shift+↑/↓` by line, `Shift+PageUp/PageDown` by page |

## 4.4 Using the terminal

| ID | Feature | Status | Acceptance criteria |
|---|---|---|---|
| U-01 | Copy/paste | ✅ | `Ctrl+Shift+C` / `Ctrl+Shift+V`; `Ctrl+C` copies when there is a selection, otherwise sends an interrupt (configurable); right-click copies/pastes (configurable) |
| U-02 | Search in the terminal | ✅ | `Ctrl+Shift+F` opens a search bar with match case, whole word and regex, plus a result counter |
| U-03 | Clickable links | ✅ | URLs become links; `Ctrl+click` opens them in the browser |
| U-04 | Zoom | ✅ | `Ctrl+=`, `Ctrl+-`, `Ctrl+0`, `Ctrl+mouse wheel` (session only, not saved) |
| U-05 | Clear terminal | ✅ | `Ctrl+Shift+K` clears the screen and scrollback |
| U-06 | Configurable scrollback | ✅ | Default 10,000 lines (1,000–100,000) |
| U-07 | Unicode/emoji and 24-bit color | ✅ | `echo` with emoji and RGB colors renders correctly |
| U-08 | Multi-line paste | ✅ | Asks for confirmation before pasting text with line breaks (configurable) |
| U-09 | Drag a file into the terminal | P1 | Drops the quoted path at the prompt |
| U-10 | Notification when a long command ends | P2 | Windows notification when a background tab rings the bell (BEL) |

## 4.5 Settings

Detailed in [05-settings.md](05-settings.md).

| ID | Feature | Status |
|---|---|---|
| C-01 | Choose the default shell and manage profiles | ✅ |
| C-02 | Detect installed shells automatically | ✅ |
| C-03 | Language (pt-BR, en-US, es-ES) with live switching | ✅ |
| C-04 | Built-in themes (dark and light) with live switching | ✅ |
| C-05 | Import themes (JSON, Windows Terminal compatible) | ✅ (export: P1) |
| C-06 | Visual theme editor | P2 |
| C-07 | Customize shortcuts with key recording and conflict warnings | ✅ |
| C-08 | Font, size, line height, cursor style | ✅ |
| C-09 | Window opacity / Mica / Acrylic effect | P1 |
| C-10 | Open `settings.json` in an editor and reload on save | P1 (a button opens the settings folder) |
| C-11 | Restore defaults | ✅ (shortcuts) |
| C-12 | Layout: tab position and tabs/grid view | ✅ |

## 4.6 Future (P2, inspired by Warp)

- **Command blocks:** group each command with its output, copy only the output, collapse blocks. Requires shell integration (OSC 133 / FinalTerm) through a script injected by the profile.
- **Modern input editor:** mouse editing, multi-line, autocomplete.
- **Workflows/snippets:** saved commands with parameters, available from the palette.
- **Launch configurations:** open a set of named tabs with startup commands (e.g. "Project X" opens `API`, `Web` and `Git`).

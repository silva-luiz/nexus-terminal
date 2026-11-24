# Changelog

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [SemVer](https://semver.org/).

## [Unreleased]

### Added
- Tab position: on top, in a left sidebar or in a right sidebar (Settings → Layout), with an adjustable sidebar width.
- Grid view: every terminal visible side by side, arranged automatically or with a maximum number of columns; toggle with `Ctrl+Shift+G` or the toolbar button.
- The shell picker menu shows each profile's icon and which one is the default.

### Changed
- Appearance: a single theme picker (grouped into dark and light); removed the mode option (follow Windows / always dark / always light). The choice made in the previous version is kept.
- The new-tab button is now a larger split button: "+" opens the default shell and the arrow opens the shell list.
- Reorganized About screen (sizes, weights and spacing).
- Documentation translated to English.

### Fixed
- Tab position options (Layout) had no spacing and different sizes: the section's styles were not being applied.

## [1.0.0] - 2026-11-24

First release.

### Terminals and tabs
- Multiple terminals in tabs on ConPTY (24-bit color, Unicode/emoji, full-screen programs such as vim and htop).
- Tab renaming (double-click, F2 or menu), automatic shell titles, shell icon, drag to reorder.
- Close, close others and close to the right, with confirmation when a program is running (also when closing the window).
- Restart an exited terminal with Enter.
- Search in the terminal (Ctrl+Shift+F) with match case, whole word and regular expressions.
- Zoom (Ctrl+=, Ctrl+-, Ctrl+0 and Ctrl+mouse wheel) and clear (Ctrl+Shift+K).
- Configurable copy/paste, with confirmation when pasting multiple lines.

### Shells
- Automatic detection of Windows PowerShell, PowerShell 7, Command Prompt, Git Bash and WSL distros.
- Custom profiles (executable, arguments, starting folder, environment variables, icon).

### Customization
- 8 built-in themes and theme import (including Windows Terminal schemes); follow-Windows mode.
- Font, size, line height and cursor.
- Languages: Portuguese (Brazil), English and Spanish.
- Customizable keyboard shortcuts with conflict detection.

### Window and system
- Custom title bar with the tabs; size and position remembered.
- Single instance: launching the app again creates a tab in the existing window.
- `nexus-terminal.exe -d <folder>` opens the terminal in that folder.
- Logs in `%LOCALAPPDATA%\NexusTerminal\logs`.
- NSIS and MSI installers.

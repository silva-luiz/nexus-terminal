# 6. Development environment

## 6.1 Install the tools (once)

1. **Microsoft C++ Build Tools**
   Download "Build Tools for Visual Studio" and select the **"Desktop development with C++"** workload (includes MSVC and the Windows SDK). Rust needs it to compile on Windows.

2. **WebView2 Runtime**
   Ships with Windows 11. On Windows 10, install Microsoft's "Evergreen Bootstrapper".

3. **Rust**
   ```powershell
   winget install Rustlang.Rustup
   rustup default stable-msvc
   rustup component add clippy rustfmt
   rustc --version
   ```

4. **Node.js LTS (22) and pnpm**
   ```powershell
   winget install OpenJS.NodeJS.LTS
   npm install -g pnpm        # or: corepack enable
   node -v; pnpm -v
   ```
   The pnpm version is pinned in `package.json` (`packageManager`).

5. **Git for Windows** (also useful to test the Git Bash profile)
   ```powershell
   winget install Git.Git
   ```

6. **Editor:** VS Code with the `rust-analyzer`, `Tauri`, `ESLint` and `Prettier` extensions.

## 6.2 Run the project

```powershell
git clone https://github.com/silva-luiz/nexus-terminal.git
cd nexus-terminal
pnpm install
pnpm dev                  # opens the app in development mode (hot reload)
```

The first `pnpm dev` compiles the Rust dependencies and takes a few minutes; later runs are fast.

## 6.3 Scripts (`package.json`)

| Script | What it does |
|---|---|
| `pnpm dev` | Runs the app in development mode (`tauri dev`) |
| `pnpm build` | Builds the NSIS and MSI installers (`tauri build`) |
| `pnpm web:dev` / `pnpm web:build` | Frontend only (Vite) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint + `cargo clippy -D warnings` |
| `pnpm format` | Prettier + `cargo fmt` |
| `pnpm test` | Vitest + `cargo test` |
| `pnpm test:web` | Vitest only |
| `pnpm licenses:generate` | Regenerates `THIRD_PARTY_LICENSES.md` |

## 6.4 Adding dependencies

- Frontend: `pnpm add <package>`.
- Backend: `cd src-tauri && cargo add <crate>`.
- Tauri plugins: `pnpm tauri add <plugin>` installs the JS package and the Rust crate and registers it. Check `src-tauri/capabilities/` afterwards: only keep the permissions the frontend really needs.

## 6.5 Debugging tips

- **WebView DevTools:** right-click → Inspect in development mode (the native context menu is disabled in production).
- **Backend logs:** printed to the console in `pnpm dev` and written to `%LOCALAPPDATA%\NexusTerminal\logs\nexus-terminal.log`.
- **Your settings:** `%APPDATA%\NexusTerminal\settings.json` (delete it to simulate a first run).
- **ANSI sequences:** inside Git Bash, `printf '\e[38;2;255;100;0mTrueColor\e[0m\n'`.
- **Performance:** `cat` a large file or `seq 1 1000000` in Git Bash; the interface must stay responsive.
- **Single instance:** while `pnpm dev` is running, launching the release build hands its arguments to the dev window (both share the app identifier).

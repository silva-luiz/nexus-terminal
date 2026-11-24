# 6. Ambiente de desenvolvimento

## 6.1 Instalar as ferramentas (uma vez)

1. **Microsoft C++ Build Tools**
   Baixe o "Build Tools for Visual Studio" e marque a carga **"Desenvolvimento para desktop com C++"** (inclui MSVC e Windows SDK). O Rust precisa disso para compilar no Windows.

2. **WebView2 Runtime**
   Já vem no Windows 11. No Windows 10, instale o "Evergreen Bootstrapper" da Microsoft.

3. **Rust**
   ```powershell
   winget install Rustlang.Rustup
   rustup default stable-msvc
   rustup component add clippy rustfmt
   rustc --version
   ```

4. **Node.js LTS (20 ou 22) e pnpm**
   ```powershell
   winget install OpenJS.NodeJS.LTS
   corepack enable
   corepack prepare pnpm@latest --activate
   node -v; pnpm -v
   ```

5. **Git for Windows** (também serve para testar o perfil Git Bash)
   ```powershell
   winget install Git.Git
   ```

6. **Editor:** VS Code com as extensões `rust-analyzer`, `Tauri`, `ESLint`, `Prettier`.

## 6.2 Criar o projeto

```powershell
cd C:\Users\<voce>\Documents\02_Projects
pnpm create tauri-app@latest nexus-terminal
#  Identifier ............ com.nexusterminal.app
#  Frontend language ..... TypeScript / JavaScript
#  Package manager ....... pnpm
#  UI template ........... React
#  UI flavor ............. TypeScript
cd nexus-terminal
pnpm install
pnpm tauri dev          # deve abrir uma janela com o template
```

> Se a pasta `nexus-terminal` já existir (com esta documentação), crie o template em outra pasta e copie o conteúdo para cá, mantendo `docs/` e `README.md`.

## 6.3 Dependências do frontend

```powershell
pnpm add @xterm/xterm @xterm/addon-fit @xterm/addon-webgl @xterm/addon-search @xterm/addon-web-links @xterm/addon-unicode11 @xterm/addon-clipboard
pnpm add zustand i18next react-i18next zod lucide-react
pnpm add @radix-ui/react-context-menu @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tabs
pnpm add @dnd-kit/core @dnd-kit/sortable
pnpm add @tauri-apps/plugin-dialog @tauri-apps/plugin-opener @tauri-apps/plugin-updater @tauri-apps/plugin-window-state
pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom eslint prettier
```

## 6.4 Dependências do backend

```powershell
cd src-tauri
cargo add portable-pty serde --features serde/derive
cargo add serde_json thiserror anyhow uuid --features uuid/v4
cargo add tokio --features rt-multi-thread,sync,time
cargo add tracing tracing-subscriber tracing-appender
cargo add winreg which encoding_rs
cd ..
pnpm tauri add dialog
pnpm tauri add opener
pnpm tauri add window-state
pnpm tauri add single-instance
pnpm tauri add updater
pnpm tauri add log
```

`pnpm tauri add <plugin>` instala o pacote JS, o crate Rust e já registra a permissão em `capabilities/`.

## 6.5 Scripts sugeridos (`package.json`)

```json
{
  "scripts": {
    "dev": "tauri dev",
    "build": "tauri build",
    "web:dev": "vite",
    "lint": "eslint src && cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings",
    "format": "prettier --write src && cargo fmt --manifest-path src-tauri/Cargo.toml",
    "test": "vitest run && cargo test --manifest-path src-tauri/Cargo.toml",
    "test:e2e": "wdio run tests/e2e/wdio.conf.ts"
  }
}
```

## 6.6 Dicas de depuração

- **DevTools da WebView:** `Ctrl+Shift+I` na janela em modo dev (ou clique direito → Inspecionar).
- **Logs Rust:** `RUST_LOG=debug` antes de `pnpm tauri dev` (no PowerShell: `$env:RUST_LOG="debug"; pnpm tauri dev`).
- **Testar sequências ANSI:** dentro do Git Bash, `printf '\e[38;2;255;100;0mTrueColor\e[0m\n'`.
- **Testar desempenho:** `cat` de um arquivo grande ou `seq 1 1000000` no Git Bash; a interface deve continuar respondendo.

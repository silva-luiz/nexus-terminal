# 8. Testing, build and release

## 8.1 Testing strategy

| Level | Tool | What is covered |
|---|---|---|
| Unit (Rust) | `cargo test` | Incremental UTF-8 decoding, `%VAR%` expansion, executable lookup, profile launch specs, WSL output parsing, Git root detection, process-tree checks, settings load/save/normalize/merge, theme store and id validation, CLI parsing |
| Integration (Rust) | `cargo test` | Real PTY sessions with `cmd.exe`: output, writing, resizing, `exit` event, kill without orphan processes; real shell detection and process snapshot |
| Unit (frontend) | Vitest | Sessions store, keybinding matcher/bindings/conflicts, themes (parsing, import, derivation), settings readers and migration, profile helpers, grid layout, UI store, i18n keys parity |
| E2E | WebdriverIO + `tauri-driver` (planned) | Critical flows in the real app |

> **Status:** E2E tests are not set up yet. For `tauri-driver` on Windows you need the `msedgedriver` matching the installed WebView2 version.

### Minimum E2E flows (to implement)
1. Open the app → 1 tab exists → type `echo test` + Enter → output contains `test`.
2. `Ctrl+Shift+T` → 2 tabs → `Ctrl+1` goes back to the first.
3. `F2` → type "API" → Enter → the tab shows "API".
4. Settings → switch language to English → the button shows "New tab".
5. Settings → switch theme → `--color-background` changes.
6. Change the `tab.new` shortcut → the new one opens a tab, the old one does not.
7. `Ctrl+Shift+G` → every terminal is visible in the grid.

### Manual checklist before each release
- [ ] Every detected shell opens and shows its prompt.
- [ ] `vim`/`nano`/`less` in Git Bash and `htop` in WSL work and resize.
- [ ] Emoji, accented characters (`ç`, `ã`) and 24-bit color render correctly.
- [ ] One million lines of output do not freeze the interface.
- [ ] Closing the app leaves no `bash.exe`/`powershell.exe` behind in Task Manager.
- [ ] ABNT2 keyboard: `Ctrl+=`, `Ctrl+-`, `Ctrl+,` shortcuts work.
- [ ] 150%/200% display scaling: sharp text.
- [ ] Tabs on top/left/right and grid view with 1–6 terminals.

## 8.2 Build

```powershell
pnpm build
```

Output in `src-tauri\target\release\bundle\`:
- `nsis\Nexus Terminal_<version>_x64-setup.exe` (recommended for users, per-user install)
- `msi\Nexus Terminal_<version>_x64_pt-BR.msi` and `..._en-US.msi` (useful for companies/GPO)

The first build downloads the NSIS and WiX tools automatically.

Relevant `tauri.conf.json` → `bundle` settings:

```jsonc
"bundle": {
  "targets": ["nsis", "msi"],
  "windows": {
    "webviewInstallMode": { "type": "downloadBootstrapper" },
    "nsis": { "installMode": "currentUser", "languages": ["PortugueseBR", "English", "Spanish"] },
    "wix":  { "language": ["pt-BR", "en-US"] }
  }
}
```

ARM64: `rustup target add aarch64-pc-windows-msvc` and `pnpm tauri build --target aarch64-pc-windows-msvc`.

## 8.3 Code signing

> **Status:** installers are **not** signed yet, so Windows SmartScreen warns on first install ("Windows protected your PC").

Options:
- A code signing certificate (OV/EV) from a certificate authority.
- **Azure Trusted Signing** (Microsoft service, usually cheaper).

Configure it in `bundle.windows` (`certificateThumbprint` + `timestampUrl`, or `signCommand` for service-based signing). Never commit certificates or passwords: use GitHub *secrets*.

## 8.4 Auto-update (planned)

1. Generate a key pair: `pnpm tauri signer generate -w ~/.tauri/nexus.key`.
2. Public key in `plugins.updater.pubkey` in `tauri.conf.json`; private key and password as *secrets* (`TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`).
3. `bundle.createUpdaterArtifacts: true`.
4. Endpoint pointing to the GitHub release `latest.json`.
5. In the app: check on startup (and every 24 h), show "New version available", download and install when the user accepts.

## 8.5 CI/CD (GitHub Actions)

**`ci.yml`** (every push to `main` and every PR, `windows-latest`):
1. Checkout, Node + pnpm, Rust (`dtolnay/rust-toolchain@stable`), cache (`Swatinem/rust-cache`).
2. `pnpm install --frozen-lockfile`
3. `pnpm typecheck`, Prettier check, `cargo fmt --check`
4. `pnpm lint`
5. `pnpm test`
6. `pnpm tauri build --debug --no-bundle` (makes sure it compiles)

**`release.yml`** (when a `v*` tag is pushed):
1. Same setup, for x64 and ARM64.
2. `pnpm test`.
3. `tauri-apps/tauri-action` with `releaseDraft: true`: builds and attaches the installers to a **draft** release.
4. Review the draft manually and publish it.

## 8.6 Versioning and releases

- **SemVer:** `MAJOR.MINOR.PATCH`. The version lives in `package.json`, `src-tauri/Cargo.toml` and `src-tauri/tauri.conf.json` (keep them in sync).
- `CHANGELOG.md` follows "Keep a Changelog"; new work goes under "Unreleased" until a version is cut.
- Release: bump the version, move the "Unreleased" entries to the new version, commit, tag `vX.Y.Z` and push the tag.

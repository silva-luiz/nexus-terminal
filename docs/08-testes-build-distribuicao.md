# 8. Testes, build e distribuição

## 8.1 Estratégia de testes

| Nível | Ferramenta | O que testar |
|---|---|---|
| Unidade (Rust) | `cargo test` | Detecção de shells (com caminhos/registro simulados), expansão de `%VAR%`, migração de configurações, decodificação UTF-8 incremental, validação de perfil |
| Integração (Rust) | `cargo test` | Criar sessão real com `cmd /c echo`, escrever, redimensionar, receber `exit`, encerrar sem processos órfãos |
| Unidade (front) | Vitest | Store de sessões (criar/renomear/mover/fechar), `matcher` de atalhos, detecção de conflito, `applyTheme`, schema de tema, chaves de i18n iguais |
| Componentes | Testing Library | `TabRenameInput` (Enter/Esc/blur), `KeyRecorder`, `SettingsDialog` |
| E2E | WebdriverIO + `tauri-driver` | Fluxos críticos no app real |

### Fluxos E2E mínimos
1. Abrir app → existe 1 aba → digitar `echo teste` + Enter → saída contém `teste`.
2. `Ctrl+Shift+T` → 2 abas → `Ctrl+1` volta para a primeira.
3. `F2` → digitar "API" → Enter → aba mostra "API".
4. Configurações → trocar idioma para English → botão mostra "New tab".
5. Configurações → trocar tema → variável `--color-background` muda.
6. Alterar atalho de `tab.new` → novo atalho abre aba, antigo não.

Para o `tauri-driver` no Windows, é preciso o `msedgedriver` da mesma versão do WebView2 instalado.

### Testes manuais antes de cada release (checklist)
- [ ] Cada shell detectado abre e mostra o prompt.
- [ ] `vim`/`nano`/`less` no Git Bash e `htop` no WSL funcionam e redimensionam.
- [ ] Emoji, acentos (`ç`, `ã`) e cores 24-bit aparecem corretamente.
- [ ] Saída de 1 milhão de linhas não trava a interface.
- [ ] Fechar o app não deixa `bash.exe`/`powershell.exe` no Gerenciador de Tarefas.
- [ ] Teclado ABNT2: atalhos com `Ctrl+=`, `Ctrl+-`, `Ctrl+,` funcionam.
- [ ] Monitor com escala 150%/200%: texto nítido.

## 8.2 Build

```powershell
pnpm tauri build
```

Gera em `src-tauri\target\release\bundle\`:
- `nsis\Nexus Terminal_<versão>_x64-setup.exe` (recomendado para usuários)
- `msi\Nexus Terminal_<versão>_x64_pt-BR.msi` (útil para empresas/GPO)

Configurações relevantes em `tauri.conf.json` → `bundle`:

```jsonc
"bundle": {
  "active": true,
  "targets": ["nsis", "msi"],
  "icon": ["icons/icon.ico"],
  "windows": {
    "webviewInstallMode": { "type": "downloadBootstrapper" },
    "nsis": { "languages": ["PortugueseBR", "English", "Spanish"], "installMode": "currentUser" },
    "wix":  { "language": ["pt-BR", "en-US"] }
  }
}
```

ARM64: `rustup target add aarch64-pc-windows-msvc` e `pnpm tauri build --target aarch64-pc-windows-msvc`.

## 8.3 Assinatura de código

Sem assinatura, o Windows SmartScreen mostra "O Windows protegeu o computador". Opções:
- Certificado de assinatura de código (OV/EV) de uma autoridade certificadora.
- **Azure Trusted Signing** (serviço da Microsoft, geralmente mais barato).

Configurar em `bundle.windows` (`certificateThumbprint` + `timestampUrl`, ou `signCommand` para assinatura via serviço). Nunca colocar o certificado ou senha no repositório: usar *secrets* do GitHub.

## 8.4 Auto-update

1. Gerar par de chaves: `pnpm tauri signer generate -w ~/.tauri/nexus.key`.
2. Chave pública em `plugins.updater.pubkey` no `tauri.conf.json`; chave privada e senha como *secrets* (`TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`).
3. `bundle.createUpdaterArtifacts: true`.
4. Endpoint apontando para o `latest.json` do release no GitHub.
5. No app: verificar ao iniciar (e a cada 24 h), mostrar "Nova versão disponível", baixar e instalar quando o usuário aceitar.

## 8.5 CI/CD (GitHub Actions)

**`ci.yml`** (a cada push/PR, `windows-latest`):
1. Checkout, setup Node + pnpm, setup Rust (`dtolnay/rust-toolchain@stable`), cache (`Swatinem/rust-cache`).
2. `pnpm install --frozen-lockfile`
3. `pnpm lint`
4. `pnpm test`
5. `pnpm tauri build --debug` (garante que compila)

**`release.yml`** (ao criar tag `v*`):
1. Mesmos passos de setup.
2. `tauri-apps/tauri-action` com `tagName`, `releaseName` e `releaseDraft: true`, para x64 e ARM64.
3. Assina, gera `latest.json` e anexa os instaladores ao release em rascunho.
4. Revisar o rascunho manualmente e publicar.

## 8.6 Versionamento e release

- **SemVer:** `MAJOR.MINOR.PATCH`. A versão fica em `package.json`, `Cargo.toml` e `tauri.conf.json` (manter iguais; um script `pnpm version:bump` ajuda).
- `CHANGELOG.md` no formato "Keep a Changelog".
- Canais: `stable` e, opcionalmente, `beta` (endpoint de update diferente).

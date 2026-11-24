# 9. Convenções

## 9.1 Código

**TypeScript / React**
- `strict: true` no `tsconfig.json`; sem `any` sem justificativa.
- Componentes em `PascalCase.tsx`, hooks em `useAlgo.ts`, stores em `camelCase.ts`.
- Estado global só nos stores Zustand; estado de UI local fica no componente.
- Nenhuma string visível fixa: sempre `t("chave")`.
- Chamadas ao backend só via `lib/ipc.ts`, nunca `invoke` espalhado.
- Tipos compartilhados com o Rust gerados automaticamente (ex.: crate `specta` + `tauri-specta`, ou `ts-rs`) em `src/lib/types.ts`, para o contrato IPC não divergir.

**Rust**
- `cargo fmt` e `cargo clippy -- -D warnings` sem avisos.
- Comandos Tauri retornam `Result<T, AppError>`; `AppError` (com `thiserror`) implementa `Serialize` para virar mensagem legível no frontend.
- Nada de `unwrap()` fora de testes; usar `?` e erros com contexto.
- Travas (`Mutex`) seguradas pelo menor tempo possível; nunca segurar uma trava enquanto lê do PTY.

## 9.2 Git

- Branch principal: `main` (sempre compilável).
- Branches: `feat/renomear-aba`, `fix/resize-gitbash`, `docs/temas`, `chore/ci`.
- Commits no padrão **Conventional Commits**: `feat(tabs): permitir renomear com F2`, `fix(pty): evitar quebra de UTF-8 entre leituras`.
- PR pequeno, com descrição do que mudou e como testar; CI verde antes do merge.

## 9.3 Documentação

- Esta pasta `docs/` é a fonte da verdade. Toda mudança de comportamento ou de formato de configuração atualiza o documento correspondente no mesmo PR.
- Decisões de arquitetura importantes viram um ADR curto em `docs/adr/NNNN-titulo.md` (contexto, decisão, consequências). Primeiro ADR sugerido: `0001-tauri-em-vez-de-electron.md`.

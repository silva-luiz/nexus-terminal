# 9. Conventions

## 9.1 Code

**TypeScript / React**
- `strict: true` in `tsconfig.json`; no `any` without a reason.
- Components in `PascalCase.tsx`, hooks in `useSomething.ts`, stores in `camelCase.ts`.
- Global state only in Zustand stores; local UI state stays in the component.
- Store selectors must return stable values (primitives or the raw stored object); derive objects with `useMemo` outside the selector.
- No hard-coded visible strings: always `t("key")`, with the key present in every locale.
- Backend calls only through `lib/ipc.ts`, never `invoke` scattered around.
- Types shared with Rust live in `src/lib/types.ts` and must match the `serde` structs (`camelCase`).

**Rust**
- `cargo fmt` and `cargo clippy --all-targets -- -D warnings` with no warnings.
- Tauri commands return `Result<T, AppError>`; `AppError` (with `thiserror`) implements `Serialize` so the frontend gets a readable message.
- No `unwrap()` outside tests; use `?` and errors with context.
- Hold locks (`Mutex`) as briefly as possible; never hold a lock while reading from a PTY.

## 9.2 Git

- Main branch: `main` (always builds).
- Branches: `feat/rename-tab`, `fix/gitbash-resize`, `docs/themes`, `chore/ci`.
- Commits follow **Conventional Commits**, in English: `feat(tabs): allow renaming with F2`, `fix(pty): avoid splitting UTF-8 between reads`.
- Small PRs describing what changed and how to test it; CI must be green before merging.

## 9.3 Documentation

- The `docs/` folder is the source of truth, written in English. Every change in behavior or settings format updates the matching document in the same PR, plus the "Unreleased" section of `CHANGELOG.md`.
- Important architecture decisions become a short ADR in `docs/adr/NNNN-title.md` (context, decision, consequences). Suggested first ADR: `0001-tauri-over-electron.md`.

# Nexus Terminal

> Gerenciador de terminais para Windows: vários terminais em abas, organizados, renomeáveis e configuráveis (shell, idioma, tema e atalhos).
> *Nome provisório.*

## Documentação

| # | Documento | Conteúdo |
|---|-----------|----------|
| 1 | [Visão geral](docs/01-visao-geral.md) | Objetivo, público, escopo, o que **não** é o projeto |
| 2 | [Tecnologias](docs/02-tecnologias.md) | Stack escolhida, justificativas e alternativas |
| 3 | [Arquitetura](docs/03-arquitetura.md) | Camadas, fluxo de dados, comandos IPC, estrutura de pastas |
| 4 | [Features](docs/04-features.md) | Lista completa de funcionalidades com critérios de aceite |
| 5 | [Configurações](docs/05-configuracoes.md) | Shells, idioma, temas, atalhos e o formato do `settings.json` |
| 6 | [Ambiente de desenvolvimento](docs/06-ambiente-dev.md) | Instalação de ferramentas e criação do projeto do zero |
| 7 | [Passo a passo / Roadmap](docs/07-passo-a-passo.md) | Fases de implementação, tarefa por tarefa |
| 8 | [Testes, build e distribuição](docs/08-testes-build-distribuicao.md) | Estratégia de testes, instalador, assinatura, auto-update, CI |
| 9 | [Convenções](docs/09-convencoes.md) | Padrões de código, commits, branches e versionamento |

## Resumo rápido

- **Stack:** Tauri 2 (Rust) + React + TypeScript + Vite + xterm.js
- **Terminal nativo:** ConPTY do Windows via crate `portable-pty`
- **Shells suportados:** PowerShell 5.1, PowerShell 7, CMD, Git Bash, WSL e shell customizado
- **Idiomas:** pt-BR, en-US, es-ES (i18next)
- **Plataforma alvo:** Windows 10 (1809+) e Windows 11, x64 e ARM64

## Como rodar

Pré-requisitos em [docs/06-ambiente-dev.md](docs/06-ambiente-dev.md) (Rust, Node 22, pnpm, Build Tools do Visual Studio).

```powershell
pnpm install
pnpm dev          # abre o app em modo desenvolvimento
pnpm test         # testes do frontend (Vitest) e do backend (cargo test)
pnpm lint         # ESLint + clippy
pnpm build        # gera os instaladores em src-tauri\target\release\bundle
```

## Status

| Fase | Situação |
|---|---|
| 0 — Fundação | ✅ Projeto, lint, formatação, testes, CI |
| 1 — Um terminal funcionando | ✅ ConPTY, xterm.js (WebGL), redimensionar, links, Unicode |
| 2 — Várias abas + renomear | ✅ Abas, renomear (duplo clique/F2/menu), título automático, reordenar arrastando, menu de contexto, atalhos, reiniciar com Enter |
| 3 — Configurações: shells e geral | ✅ Detecção (PowerShell 5.1/7, CMD, Git Bash, WSL), `settings.json`, tela de configurações (`Ctrl+,`), editor de perfis, confirmação ao fechar com programa rodando |
| 4 — Temas, idioma e atalhos configuráveis | ✅ 8 temas embutidos + importação (inclusive do Windows Terminal), modo claro/escuro seguindo o Windows, fonte e cursor, idioma (pt-BR, en-US, es-ES) e atalhos personalizáveis com detecção de conflito |
| 5 — Polimento e v1.0 | ⏳ Próxima |

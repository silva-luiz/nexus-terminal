# 1. Visão geral

## 1.1 Problema

Quem trabalha com vários terminais ao mesmo tempo (servidor de dev, build, git, banco, logs, SSH...) acaba com várias janelas soltas, todas chamadas "Windows PowerShell" ou "MINGW64". Encontrar o terminal certo vira tentativa e erro.

## 1.2 Solução

Um aplicativo desktop para Windows que:

1. Abre **vários terminais em uma única janela**, organizados em abas (e depois em painéis divididos).
2. Permite **renomear cada terminal** (ex.: `API - npm run dev`, `Git`, `Logs prod`) e marcá-lo com uma **cor**.
3. Permite **navegar rápido** entre eles com teclado (atalhos, alternador rápido, paleta de comandos).
4. Tem **configurações** para escolher:
   - o shell padrão e os shells disponíveis (Git Bash, PowerShell, CMD, WSL...);
   - o idioma da interface;
   - o tema (cores da interface e do terminal);
   - os atalhos de teclado.

Inspiração: Warp Terminal (aparência moderna, foco em produtividade) e Windows Terminal (abas + perfis).

## 1.3 Público-alvo

- Desenvolvedores no Windows que usam vários shells ao mesmo tempo.
- Usuários de Git Bash que querem uma interface melhor que a janela padrão do MinTTY.
- Quem prefere organizar o trabalho por "contextos" (um terminal por serviço/projeto).

## 1.4 Objetivos do produto

| Objetivo | Métrica de sucesso |
|---|---|
| Abrir rápido | Janela pronta em menos de 1,5 s em máquina comum |
| Ser leve | Menos de 150 MB de RAM com 5 terminais abertos |
| Ser fluido | Saída grande (ex.: `cat` de arquivo de 50 MB) sem travar a interface |
| Ser fácil de identificar | Renomear terminal em 2 ações (duplo clique + digitar) |
| Funcionar só pelo teclado | Toda ação principal tem atalho |

## 1.5 Fora do escopo (pelo menos na v1)

- Versões para macOS/Linux (a arquitetura permite, mas o foco é Windows).
- IA integrada, contas de usuário, sincronização na nuvem e colaboração (recursos do Warp que exigem backend).
- Editor de input em "blocos" como o Warp: exige integração com o shell e fica para o roadmap futuro (ver [Passo a passo, Fase 6](07-passo-a-passo.md)).
- Cliente SSH próprio (o usuário pode rodar `ssh` dentro de qualquer shell).

## 1.6 Glossário

| Termo | Significado |
|---|---|
| **Shell** | Programa que interpreta comandos (PowerShell, bash, cmd). |
| **Terminal / sessão** | Uma instância de shell rodando, ligada a uma área de exibição. |
| **Aba (tab)** | Item na barra superior que representa uma sessão (ou um grupo de painéis). |
| **Painel (pane)** | Divisão da área de uma aba, cada um com sua sessão. |
| **Perfil (profile)** | Configuração de um shell: executável, argumentos, pasta inicial, ícone. |
| **PTY / ConPTY** | Pseudo-terminal. ConPTY é a API do Windows que permite um app hospedar um shell como um terminal real. |
| **IPC** | Comunicação entre a interface (WebView) e o backend em Rust. |

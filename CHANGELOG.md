# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/); versões seguem [SemVer](https://semver.org/lang/pt-BR/).

## [1.0.0] - 2026-11-24

Primeira versão.

### Terminais e abas
- Vários terminais em abas, com ConPTY (cores 24-bit, Unicode/emoji, programas de tela cheia como vim e htop).
- Renomear abas (duplo clique, F2 ou menu), título automático do shell, ícone do shell, reordenar arrastando.
- Fechar, fechar outras e fechar à direita, com confirmação quando há programa em execução (também ao fechar a janela).
- Reiniciar terminal encerrado com Enter.
- Busca no terminal (Ctrl+Shift+F) com maiúsculas, palavra inteira e expressão regular.
- Zoom (Ctrl+=, Ctrl+-, Ctrl+0 e Ctrl+roda do mouse) e limpar (Ctrl+Shift+K).
- Copiar/colar configurável, com confirmação ao colar várias linhas.

### Shells
- Detecção automática de Windows PowerShell, PowerShell 7, Prompt de Comando, Git Bash e distros do WSL.
- Perfis personalizados (executável, argumentos, pasta inicial, variáveis de ambiente, ícone).

### Personalização
- 8 temas embutidos e importação de temas (inclusive esquemas do Windows Terminal); modo seguir o Windows.
- Fonte, tamanho, altura de linha e cursor.
- Idiomas: português (Brasil), inglês e espanhol.
- Atalhos de teclado personalizáveis, com detecção de conflitos.

### Janela e sistema
- Barra de título própria com as abas; tamanho e posição lembrados.
- Instância única: abrir o app de novo cria uma aba na janela existente.
- `nexus-terminal.exe -d <pasta>` abre o terminal na pasta indicada.
- Logs em `%LOCALAPPDATA%\NexusTerminal\logs`.
- Instaladores NSIS e MSI.

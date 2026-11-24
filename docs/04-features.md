# 4. Features

Prioridade: **P0** = MVP (v1.0), **P1** = logo depois (v1.x), **P2** = futuro.

## 4.1 Gerenciamento de terminais

| ID | Feature | Prioridade | Critérios de aceite |
|---|---|---|---|
| T-01 | Abrir novo terminal com o shell padrão | P0 | `Ctrl+Shift+T` ou botão `+` abre uma aba nova em até 500 ms |
| T-02 | Abrir terminal escolhendo o shell | P0 | Seta ao lado do `+` lista os perfis; `Ctrl+Shift+1..9` abre o perfil N |
| T-03 | Fechar terminal | P0 | `Ctrl+Shift+W`, botão `×` ou clique do meio na aba. Pergunta antes se houver processo rodando (configurável) |
| T-04 | Indicar terminal encerrado | P0 | Quando o shell sai, a aba fica esmaecida e mostra "Processo encerrado (código X). Enter para reiniciar" |
| T-05 | Reiniciar terminal | P1 | Menu de contexto → "Reiniciar" recria a sessão com o mesmo perfil e nome |
| T-06 | Duplicar terminal | P1 | Abre uma nova aba com o mesmo perfil e a mesma pasta atual |
| T-07 | Abrir em pasta específica | P1 | Argumento de linha de comando `nexus.exe -d "C:\projeto"` e opção "Abrir Nexus aqui" no menu do Explorer |
| T-08 | Painéis divididos | P1 | `Alt+Shift+=` divide vertical, `Alt+Shift+-` horizontal, `Alt+setas` muda o foco, arrastar a divisória redimensiona |
| T-09 | Instância única | P1 | Abrir o app de novo cria uma aba na janela existente em vez de outra janela |
| T-10 | Múltiplas janelas | P2 | Arrastar aba para fora cria nova janela |

## 4.2 Organização e identificação

| ID | Feature | Prioridade | Critérios de aceite |
|---|---|---|---|
| O-01 | **Renomear terminal** | P0 | Duplo clique na aba, `F2` ou menu de contexto → "Renomear". `Enter` salva, `Esc` cancela, nome vazio volta ao padrão. Máx. 60 caracteres |
| O-02 | Título automático do shell | P0 | Sem nome manual, a aba mostra o título enviado pelo shell (OSC 0/2) ou o nome do perfil |
| O-03 | Cor da aba | P1 | Menu de contexto → "Cor" com 8 cores + "nenhuma". A cor aparece como faixa na aba |
| O-04 | Ícone do perfil na aba | P0 | Cada aba mostra o ícone do shell (PowerShell, Git, CMD, Linux) |
| O-05 | Reordenar abas | P0 | Arrastar e soltar; `Ctrl+Shift+PageUp/PageDown` move a aba ativa |
| O-06 | Restaurar sessão | P1 | Ao reabrir, recria as abas com nomes, cores, perfis e pastas (não restaura processos) |
| O-07 | Grupos de abas | P2 | Agrupar abas sob um nome (ex.: "Projeto X") e recolher/expandir |
| O-08 | Barra lateral com lista de terminais | P2 | Alternativa vertical à barra de abas, útil com muitos terminais |
| O-09 | Indicador de atividade | P1 | Aba em segundo plano mostra um ponto quando recebe saída nova |

## 4.3 Navegação

| ID | Feature | Prioridade | Critérios de aceite |
|---|---|---|---|
| N-01 | Próxima/anterior | P0 | `Ctrl+Tab` / `Ctrl+Shift+Tab` |
| N-02 | Ir para aba N | P0 | `Ctrl+1..8`; `Ctrl+9` vai para a última |
| N-03 | Alternador rápido | P1 | `Ctrl+P`: busca por nome entre os terminais abertos e foca o escolhido |
| N-04 | Paleta de comandos | P1 | `Ctrl+Shift+P`: lista todas as ações do app com seus atalhos |
| N-05 | Rolagem por teclado | P0 | `Ctrl+Shift+↑/↓` linha, `Shift+PageUp/PageDown` página |

## 4.4 Uso do terminal

| ID | Feature | Prioridade | Critérios de aceite |
|---|---|---|---|
| U-01 | Copiar/colar | P0 | `Ctrl+Shift+C` / `Ctrl+Shift+V`; `Ctrl+C` copia se houver seleção, senão envia SIGINT (configurável); clique direito cola (configurável) |
| U-02 | Buscar no terminal | P0 | `Ctrl+Shift+F` abre barra de busca com "diferenciar maiúsculas" e "regex" |
| U-03 | Links clicáveis | P0 | URLs viram links; `Ctrl+clique` abre no navegador |
| U-04 | Zoom | P0 | `Ctrl+=`, `Ctrl+-`, `Ctrl+0`, `Ctrl+roda do mouse` |
| U-05 | Limpar terminal | P0 | `Ctrl+Shift+K` limpa a tela e o histórico de rolagem |
| U-06 | Histórico de rolagem configurável | P0 | Padrão 10.000 linhas |
| U-07 | Unicode/emoji e cores 24-bit | P0 | `echo` com emoji e cores RGB aparecem corretamente |
| U-08 | Colar com várias linhas | P1 | Pede confirmação antes de colar texto com quebras de linha |
| U-09 | Arrastar arquivo para o terminal | P1 | Solta o caminho entre aspas no prompt |
| U-10 | Notificação ao fim de comando longo | P2 | Notificação do Windows quando uma aba em segundo plano emite sino (BEL) |

## 4.5 Configurações

Detalhadas em [05-configuracoes.md](05-configuracoes.md).

| ID | Feature | Prioridade |
|---|---|---|
| C-01 | Escolher shell padrão e gerenciar perfis | P0 |
| C-02 | Detectar shells instalados automaticamente | P0 |
| C-03 | Idioma (pt-BR, en-US, es-ES) com troca imediata | P0 |
| C-04 | Temas embutidos (claro/escuro) e troca imediata | P0 |
| C-05 | Importar/exportar tema (JSON, compatível com Windows Terminal) | P1 |
| C-06 | Editor visual de tema | P2 |
| C-07 | Personalizar atalhos com gravação de tecla e aviso de conflito | P0 |
| C-08 | Fonte, tamanho, altura de linha, estilo do cursor | P0 |
| C-09 | Opacidade/efeito Mica/Acrylic da janela | P1 |
| C-10 | Abrir `settings.json` no editor e recarregar ao salvar | P1 |
| C-11 | Restaurar padrões | P0 |

## 4.6 Futuro (P2, inspirado no Warp)

- **Blocos de comando:** agrupar cada comando com sua saída, copiar só a saída, recolher blocos. Exige integração com o shell (OSC 133 / FinalTerm) por script injetado no perfil.
- **Editor de entrada moderno:** edição com mouse, multi-linha, autocomplete.
- **Workflows/snippets:** comandos salvos com parâmetros, acessíveis pela paleta.
- **Launch configurations:** abrir um conjunto de abas já nomeadas com comandos iniciais (ex.: "Projeto X" abre `API`, `Web` e `Git`).

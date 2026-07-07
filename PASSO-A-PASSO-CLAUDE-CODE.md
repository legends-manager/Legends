# Passo a passo — Claude Code (lançamento do Marco 1)

Cole um prompt por vez, espere terminar, valide, siga. Antes do Passo 1, coloque na pasta
do projeto os 4 arquivos: `CLAUDE.md`, `build-spec-marco1.md`, `elencos-reais.js` e
`legends-manager-demo.jsx` (a demo nova — ela é a fonte da verdade do design).

## Passo 0 — Preparar a pasta
Criar `legends-manager/` no PC, colocar os 4 arquivos dentro, abrir o Claude Code nela.

## Passo 1 — Setup e migração
> "Leia CLAUDE.md e build-spec-marco1.md. Crie um projeto React + Vite chamado
> legends-manager com a estrutura da seção 1 do build-spec. Migre a lógica e as telas de
> legends-manager-demo.jsx para essa estrutura, separando engine, data e components,
> mantendo o comportamento idêntico ao da demo. Mova os dados dos elencos para
> src/data/elencos-reais.js usando o arquivo elencos-reais.js entregue (que tem o contrato
> completo, com pos10 e origem). Não adicione nenhuma feature fora do build-spec."

**Por quê:** a demo já contém elencos reais, força interna, técnico e Arena testados — migrar é mais seguro que reescrever.

## Passo 2 — Save/Continue
> "Implemente a seção 8 do build-spec em src/storage/saveGame.js: auto-save ao fim de cada
> rodada na chave legends-manager:save-v1, tela inicial com 'Continuar' e 'Nova temporada'
> (com confirmação antes de sobrescrever), e tratamento de localStorage indisponível sem
> quebrar o app."

**Por quê:** é a única peça que a demo não tem (localStorage não roda em artifact) e a mais delicada — melhor fechar antes de empacotar.

## Passo 3 — PWA
> "Implemente a seção 9 do build-spec: manifest.json, ícones placeholder 192 e 512 com 'LM',
> link no index.html e meta theme-color #0B1712. Sem service worker. Confirme que o rodapé
> 'Simulação — BETA' aparece em todas as telas."

## Passo 4 — Checklist
> "Rode o checklist da seção 11 do build-spec e me diga o status item por item. Para os que
> falharem, explique o que falta — não corrija sozinho, eu decido a ordem."

## Passo 5 — Build e Git
> "Rode npm run build e confirme que gera dist/ sem erros nem warnings graves. Depois
> prepare o git: init, .gitignore (node_modules, dist) e primeiro commit."

## ⛔ Passo humano bloqueante — Conferência dos elencos
Antes de qualquer link público: **conferir os 12 elencos** (nomes, times, posições) contra o
Copa10 ou os grupos dos times. Corrigir direto em `src/data/elencos-reais.js`. O item 1 do
checklist só fecha com essa conferência feita. Errar nome de jogador real no grupo custa a
confiança que é o fosso do projeto.

## Passo 6 — Deploy (fora do Claude Code)
1. Criar repositório no GitHub (pode ser privado) e dar push.
2. vercel.com → New Project → importar o repo → preset Vite → Deploy.
3. Testar a URL no celular: loop completo + "adicionar à tela inicial" + save fechando o navegador.

## Passo 7 — Lançamento e observação
Soltar o link no grupo do WhatsApp da Série C e observar 1–2 semanas: acessos (analytics do
Vercel), prints de campeão circulando, pedidos espontâneos. **Nada do backlog entra antes
dessa leitura** — ela é quem decide a v2 (ranking online é o candidato natural, já que o
pôster de campeão vai plantar essa conversa).

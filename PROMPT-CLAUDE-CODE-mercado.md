# Prompt pro Claude Code — Marco 2: Mercado de Transferências (v2 revisada)

Coloque `spec-mercado.md` na pasta do projeto. Cole os prompts um por vez, valide, siga.

## Passo 0 — Atualizar o CLAUDE.md (obrigatório, antes de qualquer código)
> "No CLAUDE.md do projeto, o mercado de transferências ainda está listado na cerca do backlog.
> Atualize: remova 'mercado/transferências' da cerca e adicione uma linha na seção de escopo
> dizendo que o Marco 2 (mercado) está ativo, com contrato em spec-mercado.md, promovido do
> backlog por decisão explícita do Felyp. Não mude mais nada no CLAUDE.md."

**Por quê:** sem isso o CLAUDE.md proíbe exatamente o que os passos seguintes mandam construir —
o Claude Code vai travar ou, pior, ignorar uma das duas instruções em silêncio.

## Passo 1 — Camada de dados e economia
> "Leia spec-mercado.md. Implemente as seções 2 e 3: `orcamento` por time (inicial L$1000),
> `valor` (piso L$50) e `timeOrigem` por jogador. Após cada rodada: crédito por resultado
> (+150/+50/−30, nunca negativo) e valorização por desempenho (gol +20, assist +10, craque +30,
> vitória +5 por titular; teto +60/rodada; −5 pra quem não jogou; nunca abaixo do piso).
> Em novaTemporada: elencos voltam ao real, valores ao piso, `orcamento` é MANTIDO (seção 0).
> Não altere fórmula de atributo nem força interna. Sem UI neste passo."

## Passo 2 — Tela de Mercado e janelas
> "Implemente a seção 4: Mercado.jsx com abas Comprar / Vender / Ofertas e o estado `mercado`
> da seção 2. Janela 'pre' antes da 1ª escalação da temporada; janela 'meio' exatamente uma vez
> após a rodada 11 — inclusive quando a rodada 11 for jogada via rodada rápida. Listagens
> expiram ao fechar a janela. Aplique as travas da seção 3.3 em TODA operação (humano incluso):
> nenhum time fica com <7 jogadores, sem goleiro, ou com >18. Mostre valor do jogador e
> orçamento do time no topo da escalação (seção 8)."

## Passo 3 — IAs negociando
> "Implemente a seção 5: IA vende excedente (menor valor; empate = menor atributo), reforça a
> posição mais fraca comprando de listados dentro do orçamento — MAS só se preço ≤ valor × 1,2
> (anti-exploit da seção 5.2) — e faz ofertas por titulares do humano (~30%, valor × 1,0–1,3).
> Efeito contexto da seção 3.2: desvalorização de −10% usa APENAS a posição na tabela no momento
> da compra, nunca o multiplicador interno. Resumo 'Movimentações da janela' com as IA↔IA."

## Passo 4 — Save v2 e migração
> "Seção 7: bump do save v1→v2 guardando orcamento (persistente entre temporadas), valor,
> timeOrigem e mercado. Ao carregar save v1: inicialize os campos novos e defina
> janelaUsadaMeio = (rodadaAtual > 11), sem quebrar a temporada em andamento. Auto-save após
> cada rodada e ao fechar cada janela."

## Passo 5 — Checklist
> "Rode o checklist da seção 9 da spec-mercado item a item e me diga o status. Inclua os dois
> testes explícitos: (a) listar um jogador por preço absurdo e confirmar que nenhuma IA compra;
> (b) jogar a rodada 11 via rodada rápida e confirmar que a janela do meio abre uma única vez;
> (c) confirmar o spread: imprimir os valores iniciais de um elenco e ver craques bem mais caros
> que reservas, com dois de mesmo atributo tendo preços um pouco diferentes (mispricing).
> Não corrija sozinho o que falhar — explique, eu decido a ordem."

## Depois
`npm run dev` → testar uma temporada inteira com as duas janelas → `npm run build` → push
(deploy automático na main). Me traga o resultado do checklist antes do push.

# spec-fase1-fundacao-online.md — Fase 1: Fundação Online (Supabase + login + ranking)

> Proposta de schema e plano de migração para a Fase 1 de `projeto-legends-online-v1.md` §6:
> "Supabase + login leve (e-mail/apelido) + motor portado pra Edge Function + ranking como
> primeiro produto server-side". Escopo estritamente Fase 1 — Meu Campeonato (Fase 2) e Carreira
> Online (Fase 3) NÃO entram aqui. Portão de saída: "ranking usado semanalmente por N pessoas da
> liga + pedidos 'quero criar o meu'".

## 0. Quem simula o fechamento de temporada — PIVÔ (Felyp, jul/2026)

Histórico da decisão (pra não se perder o porquê):
1. Primeira ratificação: opção **(B)** — servidor simula a temporada inteira (motor portado pra
   Edge Function), sem escalação nem partida ao vivo online, só pra alimentar o ranking.
2. Construído, testado ao vivo — e aí o Felyp corrigiu o objetivo real: **"a cereja do bolo é
   jogar online com todas as modalidades do modo offline"** — escalação, mercado, partida ao vivo
   minuto a minuto, tudo. Não é ranking de uma "carreira de brinquedo" simulada à parte; é ranking
   da carreira DE VERDADE que ele já joga.

Isso reabre a mesma escolha do §0 original, mas agora com o requisito real na mesa:

- **(B) revisitada — servidor roda tudo de verdade** (escalação, partida, mercado): só assim fica
  à prova de trapaça com decisão humana em cada passo. Exige portar praticamente `engine/` inteiro
  (simulação de partida, IA de mercado) pra Edge Functions, cliente vira uma tela fina que só
  manda intenção. Projeto grande, cada ação (substituir jogador, comprar) passa a depender de
  rede. Efetivamente é a arquitetura da Fase 2 (Meu Campeonato) aplicada ao single-player.
- **(A) — cliente joga local, servidor só guarda o resultado.** **ESCOLHIDA.** A carreira
  continua 100% local — mesmíssima experiência de sempre, sem depender de internet pra jogar. Ao
  fechar cada temporada (`finalizarTemporadaCarreira`, já existente), o resultado é publicado no
  Supabase pro ranking público. Troca-se rigor anti-fraude por velocidade de entrega — mesmo
  modelo de confiança que já sustenta o resto do app (liga de amigos do WhatsApp).

**Decidido: (A).** `carreiras` deixa de ser uma simulação isolada e vira o **espelho público do
`mundo` local de verdade**. Zero mudança na experiência de jogo (escalação/mercado/partida ao
vivo continuam exatamente iguais); só ganha um "publicar" silencioso no fim de cada temporada.

## 1. Pré-requisito — conta Supabase

Feito — projeto `legends-manager's Project` (`rcxbzbbvomqprpdjkwfe`), South America / us-east-1,
Postgres 17. Chaves em `.env.local` (gitignorado).

## 2. Schema (Postgres/Supabase) — versão atual, pós-pivô

```sql
-- Perfil público do técnico. auth.users já vem do Supabase Auth (e-mail via magic link).
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  apelido text unique,                   -- opcional (nullable) — sem função própria hoje,
                                          -- mantido por se um dia precisar de handle público.
  nome_tecnico text,                     -- o nome pedido ao usuário, aparece no ranking.
  avatar_id text,                        -- reaproveita os ids da galeria fixa (a01..a12), não usado ainda
  criado_em timestamptz not null default now()
);

-- Espelho público do `mundo` local de UM usuário. No máximo 1 por usuário —
-- "apagar minha jornada" = DELETE desta linha (cascade limpa carreira_temporadas junto).
create table carreiras (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  meu_time text not null,
  temporada_atual int not null default 1,
  divisao jsonb not null,                -- espelha mundo.divisao
  hall_campeoes jsonb not null default '[]',
  historico_acesso jsonb not null default '[]',
  recordes jsonb not null default '{}',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (user_id)
);

-- Uma linha por temporada fechada — é a fonte de dados do ranking (§3).
-- Espelha mundo.carreira[] do save local, normalizado.
create table carreira_temporadas (
  id bigint generated always as identity primary key,
  carreira_id uuid not null references carreiras(id) on delete cascade,
  temporada int not null,
  serie text not null check (serie in ('A','B','C')),
  time text not null,
  posicao int not null,
  resultado text not null check (resultado in ('subiu','desceu','manteve')),
  criado_em timestamptz not null default now(),
  unique (carreira_id, temporada)
);
```

## 3. Ranking (view, não tabela própria)

MVP: títulos (1º lugar) + temporadas jogadas. Calibrável depois (⚙️) sem migração — é só trocar
a view.

```sql
create view ranking_tecnicos
with (security_invoker = true) as
select
  p.apelido,
  p.nome_tecnico,
  count(*) filter (where ct.posicao = 1) as titulos,
  count(*) as temporadas_jogadas
from carreira_temporadas ct
join carreiras c on c.id = ct.carreira_id
join profiles p on p.id = c.user_id
group by p.id, p.apelido, p.nome_tecnico
order by titulos desc, temporadas_jogadas desc;
```

## 4. Row Level Security

- `profiles`: leitura pública (o ranking precisa mostrar nome de todo mundo); escrita (insert/
  update) só do próprio dono (`auth.uid() = id`).
- `carreiras`: leitura pública; **escrita direta do cliente autenticado**, só na própria linha
  (`auth.uid() = user_id`) — insert, update E delete (delete = "apagar minha jornada"). Isso é o
  que mudou no pivô: antes só a Edge Function (service_role) escrevia; agora o cliente publica
  direto via `supabase-js`, sem Edge Function no meio.
- `carreira_temporadas`: leitura pública; insert só se a `carreira_id` referenciada pertencer ao
  usuário autenticado (subquery em `carreiras`). Sem update/delete direto — o histórico de
  temporada, uma vez publicado, é append-only (apagar é só via apagar a carreira inteira, cascade).

## 5. Mapeamento do estado local → schema

| Local (`storage/saveGame.js` / mundo) | Online (Fase 1) | Motivo |
|-----------------------------------------|-------------------------------|--------------------------------------------|
| `mundo.divisao`                         | `carreiras.divisao`           | espelho direto, sincronizado a cada fechamento de temporada |
| `mundo.carreira[]`                      | `carreira_temporadas`         | normalizado, é a fonte do ranking          |
| `mundo.hallCampeoes` / `historicoAcesso`| `carreiras.hall_campeoes` / `historico_acesso` | espelho direto, jsonb |
| save por série (`elencos`, `tabela`, `mercado`, `calendario`, `torcida`, escalação, partida ao vivo) | **fica só local, para sempre** | é onde a decisão humana acontece — publicar isso exigiria o motor rodando no servidor (opção (B) revisitada, não escolhida). |

## 6. Fluxo (pós-pivô)

- **`storage/publicarOnline.js`** — módulo novo, 3 funções:
  - `publicarTemporada(mundo)`: chamada automaticamente de dentro de `finalizarTemporadaCarreira`
    (App.jsx) toda vez que uma temporada fecha. Sem sessão logada, é um no-op silencioso — nunca
    trava o jogo local.
  - `vincularCarreira(mundo)`: ação manual na tela Online — sincroniza o estado atual E publica
    de uma vez todas as temporadas já fechadas antes do login (`mundo.carreira[]` inteiro),
    cobrindo quem já jogava offline antes de criar conta.
  - `apagarCarreiraOnline(userId)`: apaga a linha de `carreiras` do usuário (cascade limpa
    `carreira_temporadas`) — "recomeçar do zero" no ranking, sem afetar o save local.
- **`components/Online.jsx`**: login (magic link) + a UI de vincular/publicar/apagar + ranking
  público. Recebe `mundo` como prop do App.jsx (mesmo objeto que o resto do jogo usa).
- Removidas do fluxo (mas ainda deployadas, sem uso): as Edge Functions `criar-carreira` e
  `fechar-temporada` da primeira versão do §0 — representavam a "carreira de brinquedo" simulada
  isolada, incompatível com o pivô. Não fazem mal deployadas e sem tráfego; podem ser apagadas
  quando alguém tiver acesso ao dashboard/CLI do Supabase (a MCP usada aqui não tem ferramenta de
  delete de Edge Function).

## 6.1 Bugfix ao vivo: faltava policy de UPDATE

Testando de verdade, "Atualizar ranking" pela segunda vez quebrava com *"new row violates row-
level security policy for table carreira_temporadas"*. Causa: o upsert (`onConflict:
carreira_id,temporada`) vira `UPDATE` quando a temporada já existe, e só existia policy de
`INSERT`. Corrigido com uma policy de `UPDATE` espelhando a de insert (dono da `carreira_id`).
`vincularCarreira` também foi endurecida pra nunca sobrescrever pontos já publicados: agora só
faz `INSERT` das temporadas que ainda não existem, checando antes.

## 6.2 Ranking por pontos (pedido do Felyp, não só contagem de títulos)

`carreira_temporadas` ganhou a coluna `pontos`. Fórmula: **P da tabela da temporada** (3/vitória
+ 1/empate — o mesmo `P` que `engine/classificacao.js` já calcula, passado pelo App.jsx via
`S.tabela[meuTime].P` antes de `S` sumir) **+ `PONTOS_TITULO` (50, ⚙️) se foi campeão**. A view
`ranking_tecnicos` agora ordena por `pontos desc` (títulos continua exibido, mas como estatística
secundária). Temporadas antigas, publicadas via `vincularCarreira` (backfill) de antes deste
recurso existir, não têm o V/E/D salvo em lugar nenhum — contam só o bônus de título, nunca são
retroativamente "inventadas".

## 6.3 Elenco fictício no topo do ranking (decisão explícita do Felyp)

A view `ranking_tecnicos` inclui um `UNION ALL` com 6 nomes fictícios (Phelps liderando com 1850
pts, depois Ricardinho_10/CoachZeus/TecnicoFera/Mestre_Tatico/NovatoChampion em ordem decrescente)
— **sem nenhuma marcação de "exemplo"**, indistinguíveis de técnicos reais. Decisão pedida
explicitamente pelo Felyp pra criar senso de competição enquanto a base real de usuários ainda não
alimenta o ranking sozinha; eu levantei a tensão com a "regra de ouro" do doc-mãe ("gente real
jogando o campeonato real dela") antes de implementar — ele confirmou a rota sem marcação mesmo
assim. **Isto é temporário por natureza**: quando a liga real começar a publicar pontos de
verdade, alguém precisa rodar uma nova migration trocando a view de volta pro `SELECT` real (sem
o `UNION ALL`) — CHECKLIST não fecha essa fase sozinho, é uma ação manual futura.

## 6.4 Cadastro do nome vira parte do login, não um passo opcional depois

`PerfilOnline` (dentro de `Online.jsx`) aparece imediatamente após o login, antes até de existir
uma carreira vinculada — pedido do Felyp ("obrigatório desde o início"). O ranking também aparece
logo em seguida, mesmo pra quem ainda não jogou nenhuma temporada (motivação antes de começar).
`CarreiraOnline` (vincular/publicar/apagar) continua exigindo um `mundo` local de verdade — isso
não muda, só a ORDEM em que as coisas aparecem na tela.

## 6.5 Segundo pivô: "tudo uma coisa só" (Felyp, jul/2026 — funcionou, mas confuso)

Depois de testar tudo funcionando, feedback: a tela `Online` separada, com login E cadastro E
vincular como passos distintos, ficou confusa — duas telas, dois lugares pra "nome do técnico"
(o da capa offline e o do perfil online), um botão "vincular" manual sobrando. Pedido: uma coisa
só, e "estude técnicas pra melhorar o layout e caminho do usuário".

Redesenho (princípios aplicados: reduzir pontos de decisão, uma fonte de verdade por dado,
progressive disclosure, caminho de menor resistência é o default):
- **`Online.jsx` foi removido**, dividido em dois componentes menores e reaproveitáveis:
  - `components/LoginOnline.jsx` — widget compacto (e-mail + link mágico / "logado como X, sair"),
    sem estado de sessão próprio (recebe `sessao` como prop).
  - `components/Ranking.jsx` — só a lista + o widget de login + "vincular"/"apagar" pra quem já
    tinha carreira ANTES de logar (caso legado). Vira só mais uma tela do jogo, igual Tabela ou
    Artilharia, acessada por "🏆 Ranking online" — não uma seção "modo online" à parte.
- **Sessão sobe pro `App.jsx`** (era local de `Online.jsx`): uma única fonte de verdade, passada
  como prop pra `TelaInicial` e `Ranking`, em vez de cada tela ter seu próprio listener de auth.
- **`LoginOnline` aparece direto na capa** (`TelaEscolha`), antes do campo de nome — entrar com
  e-mail vira parte do fluxo normal de começar uma carreira, não uma seção separada pra descobrir.
- **Um só campo de nome**: o "Nome do técnico" que já existia na capa (offline, sempre existiu)
  passa a ser TAMBÉM o nome do perfil online — sincronizado só na hora de escolher o time
  (`iniciarTemporada`), sem duplicar o campo. Se o usuário já tinha um nome cadastrado (login
  antigo), a capa pré-preenche sozinha.
- **Vincular vira automático**: `iniciarTemporada` (App.jsx), se já tem sessão, chama
  `vincularCarreira` sozinho, junto de escolher o time — sem botão manual. O botão "Vincular
  minha carreira ao ranking" em `Ranking.jsx` só aparece pro caso legado (carreira offline criada
  ANTES de existir login).
- Testado ao vivo: build limpo, capa unificada carregando certo, ranking acessível em 1 clique.

## 7. LGPD (CLAUDE.md/doc-mãe §7 — obrigatório na Fase 1, não opcional)

- Dado mínimo: e-mail (Supabase Auth) + nome do técnico (livre, sem validação de identidade real).
  Continua valendo a trava de sempre: CPF/identificação pessoal nunca entra em nenhuma tabela.
- Excluir conta (a de verdade, do Supabase Auth — diferente de "apagar minha jornada", que só
  tira do ranking): `on delete cascade` cobre o dado técnico, mas falta o botão/fluxo na UI.
- Política de privacidade: texto simples, uma página — pendente, sem bloquear o schema.

## 8. Checklist de saída da Fase 1
- [x] Conta Supabase criada (projeto `legends-manager's Project`, `rcxbzbbvomqprpdjkwfe`).
- [x] §0: pivô pra opção (A) — carreira local publica o resultado, servidor não simula.
- [x] Schema + RLS ativo (0 avisos de segurança no advisor) — cliente autenticado escreve direto
      na própria linha de `carreiras`/`carreira_temporadas`.
- [x] Login leve funcionando (e-mail/magic link via Supabase Auth, sem senha). Testado ao vivo,
      incluindo o problema real de redirect (`emailRedirectTo` precisa apontar pro `localhost`
      de quem VAI clicar o link, não pro sandbox de teste) — resolvido rodando `npm run dev` na
      máquina do Felyp.
- [x] Tela de ranking lê `ranking_tecnicos`, pública, sem login, ordenada por pontos. Testada ao
      vivo com dados reais: Phelps (fictício) liderando, Felyp aparecendo depois dos fictícios.
- [x] **Vincular/publicar carreira real**: testado ao vivo pelo Felyp — achou e corrigimos 1 bug
      real (RLS de update faltando, §6.1). Fluxo completo (vincular, fechar temporada, ver
      aparecer no ranking) confirmado funcionando.
- [x] Ranking por pontos (não só títulos) — §6.2.
- [x] Cadastro do nome do técnico obrigatório logo após o login, não mais opcional/depois — §6.4.
- [ ] Botão de excluir conta (LGPD) — ainda não construído.
- [ ] Remover o elenco fictício do ranking (§6.3) quando a base real crescer — ação manual futura,
      não é bug, é decisão consciente de bootstrap.
- [x] Offline continua funcionando sem login — nenhum arquivo de `engine/` ou `storage/saveGame.js`
      foi tocado; publicação é best-effort e nunca bloqueia o fluxo local.

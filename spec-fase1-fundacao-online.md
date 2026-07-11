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
- [x] Tela de ranking lê `ranking_tecnicos`, pública, sem login. Testada ao vivo (vazia = ok).
- [ ] **Vincular/publicar carreira real**: código pronto (`vincularCarreira`, `publicarTemporada`
      chamado de `finalizarTemporadaCarreira`), build limpo, mas o fluxo completo (vincular uma
      carreira offline de verdade, fechar uma temporada e ver aparecer no ranking) só o Felyp
      consegue testar ponta a ponta — precisa de uma carreira local em andamento + sessão logada
      de verdade, nenhuma das duas eu consigo simular.
- [ ] Botão de excluir conta (LGPD) — ainda não construído.
- [x] Offline continua funcionando sem login — nenhum arquivo de `engine/` ou `storage/saveGame.js`
      foi tocado; publicação é best-effort e nunca bloqueia o fluxo local.

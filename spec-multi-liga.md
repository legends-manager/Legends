# spec-multi-liga.md — Preparação Nacional/Community (Fase 3 item 11)

**Status: documentação, NÃO implementado.** Este documento existe pra que a migração de schema
possa ser executada rápido quando (e se) uma decisão de produto concreta a exigir — não é uma
instrução pra construir agora. Ver `PLANO_MESTRE_LEGENDS_LIMEIRA.md` §5, Fase 3, item 11:
"continua adiado até Limeira estável".

## 0. Por que isto é só documento, não migration

O banco de produção hoje tem gente real jogando (Felyp, Kevin Almeida, "Fe" — ver memória
`ranking-online-adocao-baixa`). Restruturar `carreiras`/`carreira_temporadas`/`conquistas_online`
pra caber `league_id` sem uma feature concreta puxando isso é risco sem retorno imediato — e
duas das quatro superfícies (Nacional, Community) dependem de decisões que Felyp ainda não
tomou (ver §3). Quando uma dessas decisões vier, este documento vira o ponto de partida da
migration de verdade, revisada antes de aplicar.

## 1. As 4 superfícies (recap da visão registrada em 15/jul/2026)

| Superfície | O que é | Depende de |
|---|---|---|
| **Legends Limeira** | Liga regional oficial — o que existe hoje | Nada, é o produto atual |
| **Legends Nacional** | Experiência pública com times/jogadores reais de fora de Limeira | Decisão comercial de licenciamento — risco assumido pelo Felyp, ainda não fechada |
| **Legends Community** | Ligas criadas por usuários (amigos, empresas, escolas, igrejas) | Decisão de escopo: como se cria/convida pra uma liga, moderação, limites |
| **Legends Admin** | Painel privado de administração | Só faz sentido depois de Community existir (é o painel PRA administrar as ligas) |

## 2. Modelo de dados — mapeamento do que existe hoje pro modelo alvo

Hoje, cada tabela do Supabase representa implicitamente **1 liga só** (Limeira), hardcoded. O
modelo alvo generaliza isso sem quebrar o que já existe — a estratégia é **aditiva**: colunas
novas nullable/com default, nunca remoção ou renomeação de coluna existente.

### 2.1 Tabelas novas

```sql
-- Uma liga = 1 instância do jogo (Limeira é a primeira, id fixo conhecido).
create table leagues (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,                    -- "limeira", "nacional", ou slug da community
  league_type text not null check (league_type in
    ('official_national', 'official_regional', 'community_public', 'community_private')),
  nome text not null,
  region_id uuid,                                -- null pra Nacional; preenchido pra regional/community geolocalizada
  owner_id uuid references profiles(id),          -- null pras oficiais; dono da liga pra Community
  criado_em timestamptz not null default now()
);

-- Regiões (Limeira-SP é a primeira linha) — só existe pra dar contexto geográfico
-- às ligas regionais/community, não é usado por Nacional.
create table regions (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  uf text
);
```

### 2.2 Tabelas existentes — coluna nova `league_id`

```sql
alter table carreiras add column league_id uuid references leagues(id);
alter table carreira_temporadas add column league_id uuid references leagues(id);
alter table conquistas_online add column league_id uuid references leagues(id);

-- Backfill: toda linha existente pertence à liga "limeira" (id fixo, conhecido
-- no momento da migration real — placeholder aqui).
update carreiras set league_id = '<uuid-da-liga-limeira>' where league_id is null;
-- (mesma lógica pras outras duas tabelas)

-- Só DEPOIS do backfill: torna obrigatório.
alter table carreiras alter column league_id set not null;
```

`club_id`, `season_id`, `competition_id`, `career_id` (citados na visão original) já existem
hoje como texto solto (`meu_time`, `temporada_atual`, `temporada`) — normalizar pra FK de
verdade é um passo separado, só vale a pena se/quando Community precisar de múltiplos elencos
por liga (hoje `meu_time` é sempre um dos 32 times fixos da Legends Liga real).

### 2.3 Dados compartilhados vs. isolados (já é assim hoje, documentando a regra)

- **Compartilhado na conta** (tabela `profiles`, sem `league_id`): nome do técnico, avatar,
  amigos (não existe ainda), cosméticos (não existe ainda), conquistas GLOBAIS (se um dia
  existirem insígnias cross-liga, tipo "campeão em 2 ligas diferentes").
- **Isolado por carreira/liga** (`carreiras`, `carreira_temporadas`, `conquistas_online`, com
  `league_id`): dinheiro, elenco, mercado, classificação, temporada, Copa, resultados,
  dificuldade — exatamente como já funciona hoje, só que hoje só existe 1 liga implícita.

## 3. Gatilhos — quando esta migration deixa de ser "documento" e vira execução

- **Nacional**: só depois de Felyp fechar a decisão comercial de licenciamento (nomes/times
  reais de fora de Limeira). Sem isso, não há dado pra popular a liga.
- **Community**: só depois de decidir o fluxo de criação/convite de liga (quem pode criar,
  limite de membros, moderação) — é uma feature de produto inteira, não só schema.
- **Gatilho mínimo pra QUALQUER uma das duas**: app já validado com a liga real (Fase 2 item 8,
  ainda pendente) — não vale generalizar arquitetura pra um produto que ainda não provou o
  modelo mais simples.

## 4. Código que precisaria mudar (quando o gatilho vier)

- `storage/publicarOnline.js`: toda escrita em `carreiras`/`carreira_temporadas`/
  `conquistas_online` passa a incluir `league_id` (hoje implícito).
- `Ranking.jsx` / views `ranking_tecnicos`/`ranking_tecnicos_mes`: filtro por `league_id` — sem
  isso, um ranking de Community apareceria misturado com Limeira.
- `App.jsx`/`engine/mundo.js`: `mundoInicial()` passa a receber `league_id` na criação.
- Nova tela de seleção de liga (hoje a Entry já assume Limeira direto).

## 5. O que NÃO fazer ainda

Não criar as tabelas `leagues`/`regions` nem adicionar `league_id` no banco de produção antes
de um gatilho do §3 existir de verdade. Não construir UI de seleção de liga. Este documento é
o único artefato desta preparação por enquanto.

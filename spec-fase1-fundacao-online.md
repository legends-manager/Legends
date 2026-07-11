# spec-fase1-fundacao-online.md — Fase 1: Fundação Online (Supabase + login + ranking)

> Proposta de schema e plano de migração para a Fase 1 de `projeto-legends-online-v1.md` §6:
> "Supabase + login leve (e-mail/apelido) + motor portado pra Edge Function + ranking como
> primeiro produto server-side". Escopo estritamente Fase 1 — Meu Campeonato (Fase 2) e Carreira
> Online (Fase 3) NÃO entram aqui. Portão de saída: "ranking usado semanalmente por N pessoas da
> liga + pedidos 'quero criar o meu'".

## 0. Quem simula o fechamento de temporada — RATIFICADO (Felyp, jul/2026): opção (B)

O doc-mãe (§4) já sinaliza isto como pendente: *"o cliente nunca reporta placar; o servidor
simula e publica [...] Decisão a ratificar pelo Felyp."* Isso tem duas leituras possíveis pro
ranking da Fase 1, com custo bem diferente:

- **(A) Cliente simula, servidor só guarda.** O app continua rodando o motor 100% local (como
  hoje) e, ao fechar uma temporada, manda o resultado (`carreira_temporadas`, ver §2) pro
  Supabase. Rápido de construir — é só autenticação + um `INSERT`. **Risco:** dá pra forjar
  (editar o payload antes de mandar). Pra um grupo de amigos do WhatsApp isso pode ser aceitável
  no começo (o mesmo argumento de "confiança" que já sustenta o offline).
- **(B) Servidor simula, cliente só mostra.** Porta `engine/simulador.js` + `engine/mundo.js`
  pra uma Edge Function (Deno). O cliente manda só a intenção ("fechar temporada"), o servidor
  roda a simulação e escreve o resultado. Sem forjar, mas é a mudança de arquitetura de verdade —
  e é trabalho que a Fase 2 (Meu Campeonato) vai precisar de qualquer jeito, então não é
  desperdiçado.

**Recomendação:** (B), mas só para o FECHAMENTO de temporada (chamar
`novaTemporada`/`avancarRodadaSimples`/`calcularAcessoRebaixamento`/`fecharTemporada` no
servidor) — a partida ao vivo minuto-a-minuto continua 100% cliente (não tem o que forjar ali,
o placar da rodada não afeta ranking sozinho, só o resultado agregado da temporada afeta). Isso
mantém a experiência de partida ao vivo intacta e ataca só o ponto que entra no ranking. Motor já
provado standalone nesse formato (ver validação de 12 temporadas × 5 seeds, sem UI, na sessão
anterior) — portar pra Deno é o mesmo tipo de ajuste de import que fiz pra rodar em Node.

**Decidido: (B).** O servidor simula o fechamento de temporada (Edge Function); a partida ao vivo
minuto a minuto continua 100% cliente, sem mudar a experiência atual.

## 1. Pré-requisito — conta Supabase

Não crio contas em serviços de terceiros. Passo a passo pro Felyp:
1. `supabase.com` → "Start your project" → login com GitHub.
2. "New project": nome (ex. `legends-manager`), senha do banco (guardar), região mais próxima
   (South America - São Paulo, se disponível).
3. Depois de criado: Project Settings → API → copiar `Project URL` e `anon public key`.
4. Me passar essas duas strings (não é segredo de escrita — a `anon key` é pública por design,
   protegida por Row Level Security nas tabelas, ver §4) via `.env.local` no projeto, nunca
   direto na conversa em texto puro se puder evitar.

## 2. Schema proposto (Postgres/Supabase)

Escopo mínimo pra "login + ranking" — NADA de calendário/elencos/mercado online ainda (isso é
Meu Campeonato, Fase 2, fora daqui).

```sql
-- Perfil público do técnico. auth.users já vem do Supabase Auth (e-mail, senha/magic link).
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  apelido text unique not null,          -- exibido no ranking, único (evita duplicata feia)
  nome_tecnico text,                     -- nome que já existe hoje no jogo local (pôster)
  avatar_id text,                        -- reaproveita os ids da galeria fixa (a01..a12)
  criado_em timestamptz not null default now()
);

-- Uma carreira (mundo) por usuário — mesmo conceito do `mundo` local (legends-manager:mundo-v1),
-- só que server-side. "Novo jogo" no online = INSERT de uma carreira nova; a antiga vira histórico.
create table carreiras (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  meu_time text not null,
  temporada_atual int not null default 1,
  divisao jsonb not null,                -- { "Real União": "C", "Fúria FC": "A", ... }
  hall_campeoes jsonb not null default '[]',
  historico_acesso jsonb not null default '[]',
  recordes jsonb not null default '{}',
  ativa boolean not null default true,   -- só 1 ativa por usuário (índice único parcial abaixo)
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create unique index carreira_ativa_unica on carreiras (user_id) where ativa;

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
create view ranking_tecnicos as
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

## 4. Row Level Security (obrigatório desde o dia 1, não depois)

- `profiles`: leitura pública (o ranking precisa ler apelido/nome de todo mundo); escrita só do
  próprio dono (`auth.uid() = id`).
- `carreiras` / `carreira_temporadas`: leitura pública (mesma razão), escrita só do dono — e, se
  a decisão do §0 for (B), só a Edge Function escreve (usando a `service_role` key, que NUNCA
  vai pro cliente), fechando a escrita direta do usuário de vez.

## 5. Mapeamento do estado local → schema (o que fica de fora)

| Local (`storage/saveGame.js`)          | Online (Fase 1)              | Motivo                                    |
|-----------------------------------------|-------------------------------|--------------------------------------------|
| `mundo.divisao`                         | `carreiras.divisao`           | igual, só troca de lugar                   |
| `mundo.carreira[]`                      | `carreira_temporadas`         | normalizado, é a fonte do ranking          |
| `mundo.hallCampeoes` / `historicoAcesso`| `carreiras.hall_campeoes` / `historico_acesso` | igual, jsonb (não precisa de query própria ainda) |
| save por série (`elencos`, `tabela`, `mercado`, `calendario`, `torcida`...) | **fica só local** | é a temporada EM ANDAMENTO — Fase 1 só publica o resultado FECHADO. Colocar isso no servidor é trabalho de Meu Campeonato (Fase 2), não de ranking. |

## 6. LGPD (CLAUDE.md/doc-mãe §7 — obrigatório na Fase 1, não opcional)

- Dado mínimo: e-mail (Supabase Auth) + apelido. Nada de CPF/telefone/nome completo obrigatório
  (nome_tecnico já é livre hoje, sem validação de identidade real).
  Continua valendo a trava de sempre: CPF/identificação pessoal nunca entra em nenhuma tabela.
- Excluir conta: `on delete cascade` já cobre o dado técnico; falta o botão/fluxo na UI
  (Supabase tem `auth.admin.deleteUser`, precisa rodar via Edge Function com service_role).
- Política de privacidade: texto simples, uma página — pendente, sem bloquear o schema.

## 7. Checklist de saída da Fase 1
- [x] Conta Supabase criada (projeto `legends-manager's Project`, `rcxbzbbvomqprpdjkwfe`).
- [x] §0 ratificado: servidor simula o fechamento de temporada (Edge Function).
- [x] Schema acima criado + RLS ativo em `profiles`/`carreiras`/`carreira_temporadas`
      (0 avisos de segurança no advisor). `carreiras`/`carreira_temporadas` propositalmente
      SEM policy de escrita pra usuário comum — só a Edge Function (service_role) vai escrever.
- [x] Login leve funcionando (e-mail/magic link via Supabase Auth, sem senha). Tela `Online`
      (`src/components/Online.jsx`), acessível pelo botão "🌐 Legends Online (beta)" na capa.
      Testado ao vivo: link enviado com sucesso pro e-mail do Felyp. Sessão via
      `supabase.auth.onAuthStateChange`, sem tocar no fluxo offline.
- [x] Edge Functions implantadas: `criar-carreira` (equivalente a mundoInicial) e
      `fechar-temporada` (motor portado — simula as 3 séries inteiras, calcula
      acesso/rebaixamento, grava em `carreira_temporadas`, atualiza `carreiras`). Ambas
      confirmadas no ar (401 controlado sem auth, sem erro de bundle nos logs). Lógica
      interna (escrita real no banco) ainda não testada ponta a ponta — depende de login
      de verdade, que ainda não existe (próximo item).
- [x] Tela de ranking lê `ranking_tecnicos` e mostra pro usuário (só leitura, nenhuma ação nova).
      Testado ao vivo, sem login: lista vazia renderizou certo ("ninguém fechou temporada
      ainda"), sem erro de RLS pro papel anon.
- [ ] Botão de excluir conta (LGPD) — ainda não construído.
- [x] Offline continua funcionando sem login (doc-mãe §4 — Modo 1 nunca depende de servidor).
      Nenhum arquivo de `engine/`, `storage/saveGame.js` ou `storage/mercado.js` foi tocado;
      a tela Online é 100% aditiva (1 botão novo na capa + 1 tela nova).
- [ ] **Pendência real de teste:** `criar-carreira`/`fechar-temporada` (escrita no banco) só
      têm a lógica interna validada via o motor puro (12 temporadas × 5 seeds, sessão anterior)
      — o caminho HTTP completo (Deno + supabase-js + service_role) ainda não rodou com um
      usuário logado de verdade. Só o Felyp consegue completar isso (clicar o magic link e
      testar "Criar carreira"/"Fechar temporada" na tela Online) — não posso simular login.

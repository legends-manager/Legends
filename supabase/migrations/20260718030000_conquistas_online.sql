-- Fase 2 item 6 (PLANO_MESTRE_LEGENDS_LIMEIRA.md §4.2): insígnias online.
-- Espelha as conquistas locais (storage/conquistas.js) no ranking público —
-- local-first como tudo: o desbloqueio acontece offline, aqui é só espelho.
-- Append-only (igual carreira_temporadas): sem policy de update/delete;
-- apagar é só via cascade da carreira ("apagar minha jornada").
create table conquistas_online (
  id bigint generated always as identity primary key,
  carreira_id uuid not null references carreiras(id) on delete cascade,
  -- slug curto validado (ex. "da-c-ao-topo") — um cliente hostil não
  -- consegue gravar texto livre/enorme aqui.
  conquista_id text not null check (conquista_id ~ '^[a-z0-9-]{1,40}$'),
  em timestamptz not null default now(),
  clube text check (clube is null or char_length(clube) <= 40),
  temporada int check (temporada is null or (temporada >= 1 and temporada <= 999)),
  criado_em timestamptz not null default now(),
  unique (carreira_id, conquista_id)
);

alter table conquistas_online enable row level security;

create policy "conquistas online são visíveis a todas"
  on conquistas_online for select using (true);

create policy "usuário publica conquistas da própria carreira"
  on conquistas_online for insert
  with check (exists (
    select 1 from carreiras c
    where c.id = conquistas_online.carreira_id and c.user_id = auth.uid()
  ));

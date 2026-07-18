-- Proteção de pontuação (ideia aprovada pelo Felyp, jul/2026): o cliente
-- escreve direto em carreiras/carreira_temporadas (RLS só garante "é o
-- dono"), então alguém com o console aberto podia se dar 99999 pontos.
-- Teto plausível por temporada: 22 rodadas × 3 pts + 50 de título = 116;
-- margem pra folga → 150. NOT VALID: só valida escritas NOVAS (linhas
-- históricas, incluindo uma de 124 pts já publicada, ficam como estão).
alter table carreira_temporadas
  add constraint pontos_dentro_do_plausivel
  check (pontos >= 0 and pontos <= 150) not valid;

alter table carreiras
  add constraint progresso_dentro_do_plausivel
  check (pontos_temporada_atual >= 0 and pontos_temporada_atual <= 80) not valid;

-- Fictícios realistas (pedido do Felyp): o elenco fictício do §6.3 do
-- spec-fase1-fundacao-online.md estava com pontuação absurda (Phelps 1850)
-- perto dos técnicos reais (líder real: ~286). Reduz pra uma régua que
-- inspira competição alcançável em vez de desânimo.
create or replace view ranking_tecnicos
with (security_invoker = true) as
select apelido, nome_tecnico, meu_time, titulos, temporadas_jogadas, pontos, carreira_id, divisao
from (
  select
    p.apelido,
    p.nome_tecnico,
    c.meu_time,
    coalesce(hist.titulos, 0::bigint) as titulos,
    coalesce(hist.temporadas_jogadas, 0::bigint) as temporadas_jogadas,
    (coalesce(hist.pontos, 0::bigint) + c.pontos_temporada_atual) as pontos,
    c.id as carreira_id,
    c.divisao
  from carreiras c
  join profiles p on p.id = c.user_id
  left join (
    select
      carreira_temporadas.carreira_id,
      count(*) filter (where carreira_temporadas.posicao = 1) as titulos,
      count(*) as temporadas_jogadas,
      sum(carreira_temporadas.pontos) as pontos
    from carreira_temporadas
    group by carreira_temporadas.carreira_id
  ) hist on hist.carreira_id = c.id
  union all
  values
    (null::text, 'Phelps'::text, 'Furia FC'::text, 2::bigint, 6::bigint, 320::bigint, null::uuid, null::jsonb),
    (null::text, 'Ricardinho_10'::text, 'G3X FC'::text, 1::bigint, 5::bigint, 245::bigint, null::uuid, null::jsonb),
    (null::text, 'CoachZeus'::text, 'Ousadia FC'::text, 1::bigint, 4::bigint, 180::bigint, null::uuid, null::jsonb),
    (null::text, 'TecnicoFera'::text, 'Real União'::text, 0::bigint, 3::bigint, 120::bigint, null::uuid, null::jsonb),
    (null::text, 'Mestre_Tatico'::text, 'Dragon Bola FC'::text, 0::bigint, 2::bigint, 75::bigint, null::uuid, null::jsonb),
    (null::text, 'NovatoChampion'::text, 'Sereno FC'::text, 0::bigint, 1::bigint, 40::bigint, null::uuid, null::jsonb)
) t
order by pontos desc, titulos desc;

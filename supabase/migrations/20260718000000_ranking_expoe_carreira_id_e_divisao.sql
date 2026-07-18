-- F1d (PLANO_MESTRE_LEGENDS_LIMEIRA.md §4.1, "Ranking 2.0 — leitura"):
-- expõe carreira_id e divisao nas views de ranking, sem mudar a fórmula de
-- pontos nem criar tabela nova. carreira_id habilita o cliente a buscar o
-- histórico de temporadas de um técnico (carreira_temporadas, já é leitura
-- pública) ao tocar numa linha do ranking; divisao permite mostrar "hoje na
-- Série X" sem query extra. Linhas fictícias (§6.3 do
-- spec-fase1-fundacao-online.md) ganham carreira_id/divisao NULL — o app
-- trata isso com o mesmo estado vazio de um técnico real sem temporada
-- publicada, sem revelar a distinção.
-- Colunas novas apendadas no FINAL do select (CREATE OR REPLACE VIEW não
-- permite reordenar/inserir colunas no meio de uma view existente).
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
    (null::text, 'Phelps'::text, 'Furia FC'::text, 6::bigint, 14::bigint, 1850::bigint, null::uuid, null::jsonb),
    (null::text, 'Ricardinho_10'::text, 'G3X FC'::text, 4::bigint, 12::bigint, 1420::bigint, null::uuid, null::jsonb),
    (null::text, 'CoachZeus'::text, 'Ousadia FC'::text, 3::bigint, 10::bigint, 1180::bigint, null::uuid, null::jsonb),
    (null::text, 'TecnicoFera'::text, 'Real União'::text, 2::bigint, 9::bigint, 940::bigint, null::uuid, null::jsonb),
    (null::text, 'Mestre_Tatico'::text, 'Dragon Bola FC'::text, 1::bigint, 7::bigint, 710::bigint, null::uuid, null::jsonb),
    (null::text, 'NovatoChampion'::text, 'Sereno FC'::text, 1::bigint, 4::bigint, 380::bigint, null::uuid, null::jsonb)
) t
order by pontos desc, titulos desc;

create or replace view ranking_tecnicos_mes
with (security_invoker = true) as
select apelido, nome_tecnico, meu_time, titulos, temporadas_jogadas, pontos, carreira_id, divisao
from (
  select
    p.apelido,
    p.nome_tecnico,
    c.meu_time,
    coalesce(hist.titulos, 0::bigint) as titulos,
    coalesce(hist.temporadas_jogadas, 0::bigint) as temporadas_jogadas,
    (coalesce(hist.pontos, 0::bigint) +
      case
        when date_trunc('month', c.atualizado_em) = date_trunc('month', now()) then c.pontos_temporada_atual
        else 0
      end) as pontos,
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
    where date_trunc('month', carreira_temporadas.criado_em) = date_trunc('month', now())
    group by carreira_temporadas.carreira_id
  ) hist on hist.carreira_id = c.id
) t
where (pontos > 0 or titulos > 0 or temporadas_jogadas > 0)
order by pontos desc, titulos desc;

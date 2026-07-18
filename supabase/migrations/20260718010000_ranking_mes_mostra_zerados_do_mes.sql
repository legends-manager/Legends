-- Ajuste no ranking mensal (pedido do Felyp, jul/2026): antes, só entrava
-- no "julho" quem já tinha pontos/títulos/temporadas > 0 neste mês — uma
-- conta recém-vinculada, que ainda não bateu o primeiro checkpoint de
-- sincronização (a cada 3 rodadas fechadas), ficava invisível mesmo já
-- jogando. Agora também entra quem simplesmente atualizou a carreira este
-- mês (login, início de temporada, qualquer sincronização), mesmo com 0
-- pontos ainda — evita a sensação de "sumiço" pra quem acabou de entrar.
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
    c.divisao,
    (date_trunc('month', c.atualizado_em) = date_trunc('month', now())) as atualizado_neste_mes
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
where (pontos > 0 or titulos > 0 or temporadas_jogadas > 0 or atualizado_neste_mes)
order by pontos desc, titulos desc;

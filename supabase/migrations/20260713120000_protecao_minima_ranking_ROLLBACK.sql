-- Rollback da migration 20260713120000_protecao_minima_ranking.sql
--
-- Não faz parte da migration em si — é um script SEPARADO, só pra ser
-- rodado manualmente se algo der errado depois de aplicar a proteção
-- (ex. algum fluxo legítimo passar a ser bloqueado por engano). Reverte
-- exatamente o que a migration adicionou; não apaga nenhum dado, porque a
-- migration original também não apagou/alterou nenhum dado — só removeu
-- as travas e o trigger, voltando ao comportamento anterior.
--
-- Já é seguro rodar mais de uma vez (todo comando usa IF EXISTS).

DROP TRIGGER IF EXISTS carreiras_atualizado_em_servidor ON public.carreiras;
DROP FUNCTION IF EXISTS public.definir_atualizado_em_pelo_servidor();

ALTER TABLE public.carreira_temporadas
  DROP CONSTRAINT IF EXISTS carreira_temporadas_temporada_minima;

ALTER TABLE public.carreira_temporadas
  DROP CONSTRAINT IF EXISTS carreira_temporadas_pontos_faixa;

ALTER TABLE public.carreiras
  DROP CONSTRAINT IF EXISTS carreiras_pontos_temporada_atual_faixa;

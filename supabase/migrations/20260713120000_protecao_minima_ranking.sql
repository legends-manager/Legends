-- Migration: proteção mínima de integridade do ranking
-- Etapa C (ANALISE_INTEGRIDADE_RANKING.md / PLANO_CORRECOES_AUDITORIA.md).
-- Revisada após auditoria técnica independente (ver CORRECOES_TECNICAS_LEGENDS.md,
-- seção "Etapa C — Revisão técnica independente e ajustes aplicados").
--
-- REVISÃO ANTES DE APLICAR: este arquivo NÃO foi executado contra o banco
-- de produção. É só a proposta pronta pra revisão. Confirmado por consulta
-- de leitura (13/jul/2026, ver ANALISE_INTEGRIDADE_RANKING.md) que os 3
-- registros hoje existentes no banco (1 em `carreiras`, 2 em
-- `carreira_temporadas`) já respeitam todas as regras abaixo — nenhum dado
-- existente seria bloqueado por esta migration.
--
-- ORDEM DE PUBLICAÇÃO — IMPORTANTE: esta migration precisa ser aplicada
-- JUNTO com (ou antes) o deploy do código de `src/storage/publicarOnline.js`
-- que parou de enviar `atualizado_em` do navegador. Se o código for
-- publicado sozinho, sem esta migration, a coluna `atualizado_em` simplesmente
-- para de ser atualizada em UPDATEs (nem pelo jeito antigo, nem pelo novo)
-- até esta migration entrar — o que pode fazer jogador ativo sumir do
-- ranking do mês por engano nesse intervalo. Não publicar em ordem separada.
--
-- O que esta migration NÃO faz, de propósito (fora de escopo desta etapa):
--   - Não valida `meu_time`/`time` contra a lista de times reais (decisão
--     registrada: um CHECK de lista de times é mais simples e adequado ao
--     estágio atual do que uma tabela de referência, mas fica pra uma
--     migration separada).
--   - Não implementa nenhum sistema antifraude completo (validação
--     server-side do valor, RPC, etc. — permanece decisão futura,
--     condicionada a existir prêmio real, ver ANALISE_INTEGRIDADE_RANKING.md).
--   - Não altera a fórmula de pontuação (3/vitória, 1/empate, 50 de
--     bônus de título) — só limita a FAIXA aceita pelo banco, nunca o
--     cálculo, que continua 100% no cliente.

-- =====================================================================
-- 1) Faixa plausível de pontos — impede valores absurdos/negativos
-- =====================================================================
-- Teto real possível: 22 rodadas × 3 pontos (Série C, campeão invicto) +
-- 50 de bônus de título = 116. Faixa 0–150 dá folga de segurança acima
-- do teto teórico, sem abrir espaço pra valores claramente forjados
-- (ex. 999999). Ver cálculo completo em ANALISE_INTEGRIDADE_RANKING.md §2.
-- Envolvida em DO/EXCEPTION pra ser segura de rodar mais de uma vez (não
-- falha com "já existe" se o arquivo for reaplicado por engano).
DO $$
BEGIN
  ALTER TABLE public.carreiras
    ADD CONSTRAINT carreiras_pontos_temporada_atual_faixa
    CHECK (pontos_temporada_atual BETWEEN 0 AND 150);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.carreira_temporadas
    ADD CONSTRAINT carreira_temporadas_pontos_faixa
    CHECK (pontos BETWEEN 0 AND 150);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================================
-- 2) Piso do número de temporada — impede só o caso claramente impossível
--    (temporada zero ou negativa), SEM teto máximo
-- =====================================================================
-- REVISADO: a proposta original tinha também um teto (temporada <= 20).
-- Removido após revisão técnica: o número da temporada, sozinho, não
-- aumenta pontuação de ninguém (quem faz isso é a coluna `pontos`, já
-- protegida acima) — um teto aqui protegia pouco contra fraude e criava um
-- risco real: a Liga Viva foi desenhada pra carreira SEM FIM (o contador de
-- temporada nunca para de crescer no código do motor), então um jogador
-- dedicado passando da 20ª temporada teria sua sincronização online
-- rejeitada pelo banco de forma legítima e recorrente. Mantido só o piso
-- (>= 1), que é o único valor realmente impossível de acontecer num jogo
-- correto e não corre esse risco.
DO $$
BEGIN
  ALTER TABLE public.carreira_temporadas
    ADD CONSTRAINT carreira_temporadas_temporada_minima
    CHECK (temporada >= 1);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================================
-- 3) Data de última atividade definida pelo SERVIDOR, não pelo cliente
-- =====================================================================
-- Achado da análise: `atualizado_em` tinha `default now()`, mas o cliente
-- (src/storage/publicarOnline.js, publicarProgresso) sempre enviava o
-- próprio valor (`new Date().toISOString()`), sobrescrevendo o default —
-- ou seja, era o relógio do navegador do usuário que decidia essa data,
-- não o banco. Como o ranking mensal usa esse campo pra decidir quem
-- esteve ativo no mês, isso permitia ao usuário manipular a própria
-- elegibilidade só ajustando o relógio do aparelho.
--
-- Correção: um trigger que SEMPRE sobrescreve `atualizado_em` com o
-- relógio do PRÓPRIO BANCO no momento da escrita, não importa o que o
-- cliente mandou. Funciona tanto pra UPDATE quanto pra INSERT (upsert
-- passa por um dos dois, dependendo se a linha já existe).
--
-- LIMITAÇÃO CONHECIDA (documentada na revisão técnica, não corrigida
-- aqui): este trigger também atualiza `atualizado_em` quando o vínculo
-- automático (`vincularCarreira`, App.jsx) roda só por causa de login/
-- reabertura do app, mesmo sem o jogador ter jogado nenhuma partida
-- naquela visita — ou seja, "atividade" aqui significa "escreveu na
-- tabela", não estritamente "jogou". Aceitável nesta fase (ainda exige
-- estar logado e o app carregar, não é gratuito), mas não é uma medida
-- perfeita de engajamento real.
CREATE OR REPLACE FUNCTION public.definir_atualizado_em_pelo_servidor()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS carreiras_atualizado_em_servidor ON public.carreiras;
CREATE TRIGGER carreiras_atualizado_em_servidor
  BEFORE INSERT OR UPDATE ON public.carreiras
  FOR EACH ROW
  EXECUTE FUNCTION public.definir_atualizado_em_pelo_servidor();

-- =====================================================================
-- Nenhum comando acima apaga, trunca ou modifica dado existente — são só
-- ADD CONSTRAINT (que valida o dado já presente antes de aceitar a
-- migration, sem alterá-lo) e a criação de função/trigger (que só passa
-- a valer nas PRÓXIMAS escritas, não reprocessa linhas antigas). Todos os
-- blocos são seguros pra reexecutar sem erro (DO/EXCEPTION nos CHECK,
-- CREATE OR REPLACE / DROP...IF EXISTS na função/trigger).
-- =====================================================================

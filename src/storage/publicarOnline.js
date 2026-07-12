// src/storage/publicarOnline.js
// Fase 1, pivô (spec-fase1-fundacao-online.md §0): a carreira offline
// continua sendo a fonte da verdade — este módulo só ESPELHA o resultado já
// decidido localmente pro ranking público, quando o técnico está logado.
// Nunca bloqueia nem atrasa o jogo: sem sessão, é um no-op silencioso.
import { supabase } from "./supabaseClient";

// Ranking por pontos (pedido do Felyp): pontos da temporada = P da tabela
// local (3/vitória + 1/empate, mesmo cálculo que a Tabela.jsx já mostra) +
// bônus por título. ⚙️ calibrável.
export const PONTOS_TITULO = 50;

// Sincroniza o estado atual do mundo (divisão, hall de campeões, histórico de
// acesso) e publica a temporada que acabou de fechar em carreira_temporadas.
// Chamado automaticamente ao fim de cada finalizarTemporadaCarreira — best
// effort: erro de rede não deve travar o jogo, só fica sem publicar.
// `pontosTemporada` vem de S.tabela[meuTime].P (o P já existe no motor, ver
// engine/classificacao.js) — passado pelo chamador porque S some depois que
// a temporada fecha.
export async function publicarTemporada(mundo, pontosTemporada) {
  if (!supabase) return;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  try {
    const { data: carreira, error: erroUpsert } = await supabase
      .from("carreiras")
      .upsert(
        {
          user_id: session.user.id,
          meu_time: mundo.meuTime,
          divisao: mundo.divisao,
          temporada_atual: mundo.temporada,
          hall_campeoes: mundo.hallCampeoes,
          historico_acesso: mundo.historicoAcesso,
          recordes: mundo.recordes || {},
          // Zera o progresso da temporada agora fechada — ela já vira uma
          // linha de carreira_temporadas logo abaixo, então não deve mais
          // somar em dobro via pontos_temporada_atual.
          pontos_temporada_atual: 0,
        },
        { onConflict: "user_id" },
      )
      .select()
      .single();
    if (erroUpsert) return;

    // A última entrada de mundo.carreira[] é a temporada que acabou de fechar.
    const ultima = mundo.carreira[mundo.carreira.length - 1];
    if (!ultima) return;
    const pontos = (pontosTemporada || 0) + (ultima.posicao === 1 ? PONTOS_TITULO : 0);
    await supabase.from("carreira_temporadas").upsert(
      {
        carreira_id: carreira.id,
        temporada: ultima.temporada,
        serie: ultima.serie,
        time: ultima.time,
        posicao: ultima.posicao,
        resultado: ultima.resultado,
        pontos,
      },
      { onConflict: "carreira_id,temporada" },
    );
  } catch (e) {
    /* melhor esforço — o jogo local já fechou a temporada, isso é só o espelho público */
  }
}

// Progresso DENTRO de uma temporada em andamento (pedido do Felyp: "gravar
// antes de fechar, de 3 em 3 jogos") — chamado de finalizarRodada (App.jsx)
// a cada 3 rodadas. Só atualiza carreiras.pontos_temporada_atual; não mexe
// em carreira_temporadas (que continua sendo só temporadas FECHADAS, com
// posição/resultado final).
// Upsert (não update simples) de propósito: sem vínculo nenhum ainda a
// existir (raro, mas possível se o login acontecer entre um checkpoint e
// outro), cria a linha na hora — nada de "vincular" manual, o ranking se
// mantém sozinho o tempo todo (pedido do Felyp: "coloca o nome, joga e já
// entra automaticamente").
export async function publicarProgresso(mundo, pontosAtuais) {
  if (!supabase) return;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  try {
    await supabase.from("carreiras").upsert(
      {
        user_id: session.user.id,
        meu_time: mundo.meuTime,
        divisao: mundo.divisao,
        temporada_atual: mundo.temporada,
        hall_campeoes: mundo.hallCampeoes,
        historico_acesso: mundo.historicoAcesso,
        recordes: mundo.recordes || {},
        pontos_temporada_atual: pontosAtuais,
        atualizado_em: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
  } catch (e) {
    /* melhor esforço */
  }
}

// "Vincular carreira online": além de sincronizar o estado atual, publica de
// uma vez TODAS as temporadas já fechadas localmente (mundo.carreira) que
// ainda não estão no ranking — cobre quem loga depois de já ter jogado.
// `pontosAtuais` (opcional, S.tabela[meuTime].P): quem vincula NO MEIO de
// uma temporada em andamento (ex. já na rodada 15, nunca tinha vinculado)
// precisa que o progresso atual entre JÁ, sem esperar o próximo checkpoint
// de 3 em 3 rodadas (publicarProgresso) — senão fica "invisível" até lá.
export async function vincularCarreira(mundo, pontosAtuais = 0) {
  if (!supabase) return { error: "Modo online não configurado" };
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: "Não logado" };

  const { data: carreira, error: erroUpsert } = await supabase
    .from("carreiras")
    .upsert(
      {
        user_id: session.user.id,
        meu_time: mundo.meuTime,
        divisao: mundo.divisao,
        temporada_atual: mundo.temporada,
        hall_campeoes: mundo.hallCampeoes,
        historico_acesso: mundo.historicoAcesso,
        recordes: mundo.recordes || {},
        pontos_temporada_atual: pontosAtuais,
      },
      { onConflict: "user_id" },
    )
    .select()
    .single();
  if (erroUpsert) return { error: erroUpsert.message };

  // Só INSERE as que ainda não existem — nunca sobrescreve uma temporada já
  // publicada (essa pode ter pontos reais de V/E/D já registrados por
  // publicarTemporada; temporadas antigas aqui só ganham o bônus de título,
  // porque o placar de vitória/empate daquela época não ficou salvo em
  // lugar nenhum antes deste recurso existir).
  if (mundo.carreira.length > 0) {
    const { data: existentes } = await supabase
      .from("carreira_temporadas")
      .select("temporada")
      .eq("carreira_id", carreira.id);
    const jaPublicadas = new Set((existentes || []).map((e) => e.temporada));
    const faltantes = mundo.carreira.filter((c) => !jaPublicadas.has(c.temporada));
    if (faltantes.length > 0) {
      const linhas = faltantes.map((c) => ({
        carreira_id: carreira.id,
        temporada: c.temporada,
        serie: c.serie,
        time: c.time,
        posicao: c.posicao,
        resultado: c.resultado,
        pontos: c.posicao === 1 ? PONTOS_TITULO : 0,
      }));
      const { error: erroTemporadas } = await supabase.from("carreira_temporadas").insert(linhas);
      if (erroTemporadas) return { error: erroTemporadas.message, carreira };
    }
  }

  return { carreira };
}

export async function apagarCarreiraOnline(userId) {
  if (!supabase) return { error: "Modo online não configurado" };
  const { error } = await supabase.from("carreiras").delete().eq("user_id", userId);
  if (error) return { error: error.message };
  return {};
}

// src/storage/publicarOnline.js
// Fase 1, pivô (spec-fase1-fundacao-online.md §0): a carreira offline
// continua sendo a fonte da verdade — este módulo só ESPELHA o resultado já
// decidido localmente pro ranking público, quando o técnico está logado.
// Nunca bloqueia nem atrasa o jogo: sem sessão, é um no-op silencioso.
import { supabase } from "./supabaseClient";

// Sincroniza o estado atual do mundo (divisão, hall de campeões, histórico de
// acesso) e publica a temporada que acabou de fechar em carreira_temporadas.
// Chamado automaticamente ao fim de cada finalizarTemporadaCarreira — best
// effort: erro de rede não deve travar o jogo, só fica sem publicar.
export async function publicarTemporada(mundo) {
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
        },
        { onConflict: "user_id" },
      )
      .select()
      .single();
    if (erroUpsert) return;

    // A última entrada de mundo.carreira[] é a temporada que acabou de fechar.
    const ultima = mundo.carreira[mundo.carreira.length - 1];
    if (!ultima) return;
    await supabase.from("carreira_temporadas").upsert(
      {
        carreira_id: carreira.id,
        temporada: ultima.temporada,
        serie: ultima.serie,
        time: ultima.time,
        posicao: ultima.posicao,
        resultado: ultima.resultado,
      },
      { onConflict: "carreira_id,temporada" },
    );
  } catch (e) {
    /* melhor esforço — o jogo local já fechou a temporada, isso é só o espelho público */
  }
}

// "Vincular carreira online": além de sincronizar o estado atual, publica de
// uma vez TODAS as temporadas já fechadas localmente (mundo.carreira) que
// ainda não estão no ranking — cobre quem loga depois de já ter jogado.
export async function vincularCarreira(mundo) {
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
      },
      { onConflict: "user_id" },
    )
    .select()
    .single();
  if (erroUpsert) return { error: erroUpsert.message };

  if (mundo.carreira.length > 0) {
    const linhas = mundo.carreira.map((c) => ({
      carreira_id: carreira.id,
      temporada: c.temporada,
      serie: c.serie,
      time: c.time,
      posicao: c.posicao,
      resultado: c.resultado,
    }));
    const { error: erroTemporadas } = await supabase
      .from("carreira_temporadas")
      .upsert(linhas, { onConflict: "carreira_id,temporada" });
    if (erroTemporadas) return { error: erroTemporadas.message, carreira };
  }

  return { carreira };
}

export async function apagarCarreiraOnline(userId) {
  if (!supabase) return { error: "Modo online não configurado" };
  const { error } = await supabase.from("carreiras").delete().eq("user_id", userId);
  if (error) return { error: error.message };
  return {};
}

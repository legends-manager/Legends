// src/storage/publicarOnline.js
// Fase 1, pivô (spec-fase1-fundacao-online.md §0): a carreira offline
// continua sendo a fonte da verdade — este módulo só ESPELHA o resultado já
// decidido localmente pro ranking público, quando o técnico está logado.
// Nunca bloqueia nem atrasa o jogo: sem sessão, é um no-op silencioso.
//
// Etapa B (auditoria técnica, T-05): os antigos `catch (e) { /* melhor
// esforço */ }` foram trocados por `logSincronizacao` — o comportamento de
// "nunca travar o jogo" continua idêntico (toda falha ainda é engolida
// aqui dentro), só que agora fica registrada de forma diagnosticável, sem
// dado pessoal, em vez de desaparecer em silêncio.
import { supabase } from "./supabaseClient";
import { logSincronizacao } from "./logger";

// Ranking por pontos (pedido do Felyp): pontos da temporada = P da tabela
// local (3/vitória + 1/empate, mesmo cálculo que a Tabela.jsx já mostra) +
// bônus por título. ⚙️ calibrável.
export const PONTOS_TITULO = 50;

// BUGFIX (jul/2026, auditoria pós-lançamento): `carreiras.user_id` referencia
// `profiles(id)` — sem uma linha em profiles, QUALQUER escrita em carreiras
// falha por chave estrangeira. Antes, só App.jsx criava o perfil, e só
// quando `nomeTec` (estado local) já estava preenchido — o que não é
// garantido no momento do login (o widget de login aparece na capa antes do
// jogador clicar "Continuar", que é quem repõe nomeTec). Resultado real:
// 12 de 13 contas criadas na liga nunca ganharam perfil, e toda tentativa de
// vincular falhava em silêncio (o erro nem era aguardado no App.jsx).
// Correção: cada função abaixo GARANTE o próprio perfil antes de tocar em
// carreiras — não depende mais de ninguém ter feito isso antes. Upsert sem a
// chave nome_tecnico quando não há nome ainda, pra não apagar um nome já
// salvo com um valor vazio.
async function garantirPerfil(userId, nomeTecnico, operacao) {
  const payload = { id: userId };
  if (nomeTecnico) payload.nome_tecnico = nomeTecnico;
  const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
  if (error) logSincronizacao({ operacao, etapa: "garantirPerfil", temSessao: true, erro: error });
  return error;
}

// Sincroniza o estado atual do mundo (divisão, hall de campeões, histórico de
// acesso) e publica a temporada que acabou de fechar em carreira_temporadas.
// Chamado automaticamente ao fim de cada finalizarTemporadaCarreira — best
// effort: erro de rede não deve travar o jogo, só fica sem publicar.
// `pontosTemporada` vem de S.tabela[meuTime].P (o P já existe no motor, ver
// engine/classificacao.js) — passado pelo chamador porque S some depois que
// a temporada fecha.
export async function publicarTemporada(mundo, pontosTemporada, nomeTecnico) {
  if (!supabase) return;
  const OPERACAO = "publicarTemporada";
  let session;
  try {
    ({ data: { session } } = await supabase.auth.getSession());
  } catch (e) {
    logSincronizacao({ operacao: OPERACAO, etapa: "getSession", temSessao: false, erro: e });
    return;
  }
  if (!session) return; // sem sessão: estado esperado (deslogado), não é falha — nada a registrar

  try {
    await garantirPerfil(session.user.id, nomeTecnico, OPERACAO);
    // ORDEM IMPORTA (Etapa C, revisão técnica): antes, este upsert já
    // zerava `pontos_temporada_atual` no mesmo passo em que sincronizava a
    // carreira — se a gravação da temporada fechada (abaixo) fosse
    // recusada pelo banco por qualquer motivo (ex. violação de uma
    // constraint), o progresso já tinha sido zerado sem o resultado da
    // temporada ter sido salvo em lugar nenhum: perda de dado no ranking
    // online. Agora o progresso só é zerado DEPOIS de confirmar que a
    // temporada fechada foi gravada com sucesso (ver abaixo).
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
    if (erroUpsert) {
      logSincronizacao({ operacao: OPERACAO, etapa: "upsertCarreira", temSessao: true, erro: erroUpsert });
      return;
    }

    // A última entrada de mundo.carreira[] é a temporada que acabou de fechar.
    const ultima = mundo.carreira[mundo.carreira.length - 1];
    if (!ultima) return;
    const pontos = (pontosTemporada || 0) + (ultima.posicao === 1 ? PONTOS_TITULO : 0);
    const { error: erroTemporada } = await supabase.from("carreira_temporadas").upsert(
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
    if (erroTemporada) {
      logSincronizacao({ operacao: OPERACAO, etapa: "upsertCarreiraTemporada", temSessao: true, erro: erroTemporada });
      // NÃO zera pontos_temporada_atual — a temporada fechada não foi
      // salva, então o progresso continua visível online até uma nova
      // tentativa (próximo login/checkpoint) conseguir publicá-la.
      return;
    }

    // Só agora, com a temporada fechada já salva com sucesso, é seguro
    // zerar o progresso em andamento (evita somar em dobro depois).
    const { error: erroZerar } = await supabase
      .from("carreiras")
      .update({ pontos_temporada_atual: 0 })
      .eq("user_id", session.user.id);
    if (erroZerar) {
      logSincronizacao({ operacao: OPERACAO, etapa: "zerarProgresso", temSessao: true, erro: erroZerar });
    }
  } catch (e) {
    // melhor esforço — o jogo local já fechou a temporada, isso é só o
    // espelho público; a falha é registrada, não propagada.
    logSincronizacao({ operacao: OPERACAO, etapa: "inesperado", temSessao: true, erro: e });
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
export async function publicarProgresso(mundo, pontosAtuais, nomeTecnico) {
  if (!supabase) return;
  const OPERACAO = "publicarProgresso";
  let session;
  try {
    ({ data: { session } } = await supabase.auth.getSession());
  } catch (e) {
    logSincronizacao({ operacao: OPERACAO, etapa: "getSession", temSessao: false, erro: e });
    return;
  }
  if (!session) return; // sem sessão: estado esperado (deslogado), não é falha

  try {
    await garantirPerfil(session.user.id, nomeTecnico, OPERACAO);
    const { error: erroUpsert } = await supabase.from("carreiras").upsert(
      {
        user_id: session.user.id,
        meu_time: mundo.meuTime,
        divisao: mundo.divisao,
        temporada_atual: mundo.temporada,
        hall_campeoes: mundo.hallCampeoes,
        historico_acesso: mundo.historicoAcesso,
        recordes: mundo.recordes || {},
        pontos_temporada_atual: pontosAtuais,
        // `atualizado_em` NÃO é enviado daqui de propósito (Etapa C, análise
        // de integridade do ranking): antes, este era o relógio do
        // NAVEGADOR do usuário decidindo a data de "última atividade" usada
        // pelo ranking mensal — permitindo manipular a própria elegibilidade
        // só ajustando o relógio do aparelho. Agora o valor vem sempre do
        // servidor (coluna com `default now()` + trigger que sobrescreve em
        // todo INSERT/UPDATE, ver migration 20260713120000).
      },
      { onConflict: "user_id" },
    );
    if (erroUpsert) {
      logSincronizacao({ operacao: OPERACAO, etapa: "upsertCarreira", temSessao: true, erro: erroUpsert });
    }
  } catch (e) {
    // melhor esforço — checkpoint intra-temporada, próxima rodada tenta de
    // novo; a falha é registrada, não propagada.
    logSincronizacao({ operacao: OPERACAO, etapa: "inesperado", temSessao: true, erro: e });
  }
}

// "Vincular carreira online": além de sincronizar o estado atual, publica de
// uma vez TODAS as temporadas já fechadas localmente (mundo.carreira) que
// ainda não estão no ranking — cobre quem loga depois de já ter jogado.
// `pontosAtuais` (opcional, S.tabela[meuTime].P): quem vincula NO MEIO de
// uma temporada em andamento (ex. já na rodada 15, nunca tinha vinculado)
// precisa que o progresso atual entre JÁ, sem esperar o próximo checkpoint
// de 3 em 3 rodadas (publicarProgresso) — senão fica "invisível" até lá.
export async function vincularCarreira(mundo, pontosAtuais = 0, nomeTecnico) {
  if (!supabase) return { error: "Modo online não configurado" };
  const OPERACAO = "vincularCarreira";

  // Envolve a operação inteira: ao contrário de publicarProgresso/
  // publicarTemporada (best-effort puro, chamadas automáticas), esta função
  // tem chamador que espera um retorno ({carreira} ou {error}) — mas uma
  // exceção não prevista (ex. rede caindo no meio do backfill) não pode
  // propagar e quebrar a tela que chamou (TelaInicial/App.jsx).
  try {
    let session;
    try {
      ({ data: { session } } = await supabase.auth.getSession());
    } catch (e) {
      logSincronizacao({ operacao: OPERACAO, etapa: "getSession", temSessao: false, erro: e });
      return { error: "Não foi possível verificar a sessão" };
    }
    if (!session) return { error: "Não logado" };

    const erroPerfil = await garantirPerfil(session.user.id, nomeTecnico, OPERACAO);
    if (erroPerfil) return { error: `perfil: ${erroPerfil.message}` };

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
    if (erroUpsert) {
      logSincronizacao({ operacao: OPERACAO, etapa: "upsertCarreira", temSessao: true, erro: erroUpsert });
      return { error: erroUpsert.message };
    }

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
        if (erroTemporadas) {
          logSincronizacao({ operacao: OPERACAO, etapa: "insertBackfill", temSessao: true, erro: erroTemporadas });
          return { error: erroTemporadas.message, carreira };
        }
      }
    }

    return { carreira };
  } catch (e) {
    logSincronizacao({ operacao: OPERACAO, etapa: "inesperado", temSessao: true, erro: e });
    return { error: "Falha inesperada ao sincronizar com o ranking" };
  }
}

// Fase 2 item 6 (PLANO_MESTRE §4.2): espelha as insígnias LOCAIS
// (storage/conquistas.js) em conquistas_online — best-effort puro, mesmo
// contrato de publicarProgresso: sem sessão é no-op, falha nunca propaga.
// Insert com ignoreDuplicates (append-only; a tabela nem tem policy de
// update): re-publicar tudo a cada chamada é barato (≤ ~15 linhas) e
// idempotente — cobre também o backfill de quem desbloqueou offline antes
// de logar.
export async function publicarConquistas(conquistasLocais) {
  if (!supabase) return;
  const OPERACAO = "publicarConquistas";
  try {
    const ids = Object.keys(conquistasLocais || {});
    if (ids.length === 0) return;
    let session;
    try {
      ({ data: { session } } = await supabase.auth.getSession());
    } catch (e) {
      logSincronizacao({ operacao: OPERACAO, etapa: "getSession", temSessao: false, erro: e });
      return;
    }
    if (!session) return;

    const { data: carreira, error: erroCarreira } = await supabase
      .from("carreiras").select("id").eq("user_id", session.user.id).maybeSingle();
    if (erroCarreira) {
      logSincronizacao({ operacao: OPERACAO, etapa: "buscarCarreira", temSessao: true, erro: erroCarreira });
      return;
    }
    if (!carreira) return; // vínculo ainda não aconteceu — o próximo checkpoint cobre

    const linhas = ids.map((id) => ({
      carreira_id: carreira.id,
      conquista_id: id,
      em: conquistasLocais[id]?.em || new Date().toISOString(),
      clube: conquistasLocais[id]?.clube ?? null,
      temporada: conquistasLocais[id]?.temporada ?? null,
    }));
    const { error: erroInsert } = await supabase
      .from("conquistas_online")
      .upsert(linhas, { onConflict: "carreira_id,conquista_id", ignoreDuplicates: true });
    if (erroInsert) {
      logSincronizacao({ operacao: OPERACAO, etapa: "insertConquistas", temSessao: true, erro: erroInsert });
    }
  } catch (e) {
    logSincronizacao({ operacao: OPERACAO, etapa: "inesperado", temSessao: true, erro: e });
  }
}

export async function apagarCarreiraOnline(userId) {
  if (!supabase) return { error: "Modo online não configurado" };
  const OPERACAO = "apagarCarreiraOnline";
  try {
    const { error } = await supabase.from("carreiras").delete().eq("user_id", userId);
    if (error) {
      logSincronizacao({ operacao: OPERACAO, etapa: "deleteCarreira", temSessao: true, erro: error });
      return { error: error.message };
    }
    return {};
  } catch (e) {
    logSincronizacao({ operacao: OPERACAO, etapa: "inesperado", temSessao: true, erro: e });
    return { error: "Falha inesperada ao apagar a carreira online" };
  }
}

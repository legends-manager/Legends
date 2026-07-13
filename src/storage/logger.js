// src/storage/logger.js
// Camada central e pequena de observabilidade — Etapa B da auditoria técnica
// (AUDITORIA_TECNICA_LEGENDS.md T-05 / PLANO_CORRECOES_AUDITORIA.md).
//
// Objetivo único: tornar diagnosticável uma falha de sincronização sem
// nunca (a) travar o jogo offline, (b) expor dado pessoal/técnico bruto, ou
// (c) virar ela mesma uma nova fonte de erro. Hoje só escreve no console
// (nenhum serviço externo, nenhuma chamada de rede) — ver o racional
// completo de por que não é Sentry ainda em CORRECOES_TECNICAS_LEGENDS.md.
//
// Nunca importar isto de dentro de um caminho que precisa ser síncrono e
// puro (ex. engine/) — é estritamente para a camada de storage/sincronização.

// Versão do app, injetada em build time (ver vite.config.js `define`).
// Fora de um build Vite (ex. um teste que importe isto sem esse define),
// cai em "dev" — nunca lança por falta da constante.
const VERSAO_APP = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "dev";

// Suprime logs idênticos repetidos num curto intervalo — evita "log storm"
// se uma falha persistente (ex. Supabase fora do ar) se repetir a cada
// checkpoint de 3 rodadas. Mapa em memória, por assinatura do evento; não
// precisa sobreviver a reload (é só uma proteção contra rajada, não um
// dedup histórico).
const JANELA_DEDUP_MS = 10_000;
const ultimosRegistros = new Map();

function assinatura({ operacao, etapa, tipoErro, codigoErro }) {
  return `${operacao}|${etapa}|${tipoErro}|${codigoErro}`;
}

function deveSuprimir(sig, agora) {
  const anterior = ultimosRegistros.get(sig);
  if (anterior != null && agora - anterior < JANELA_DEDUP_MS) return true;
  ultimosRegistros.set(sig, agora);
  return false;
}

// Só para teste: o mapa de dedup é module-level de propósito (precisa
// sobreviver entre chamadas reais, não só dentro de uma função) — isso faz
// suítes de teste que rodam no mesmo processo colidirem entre si sem uma
// forma de zerar o estado entre casos.
export function _resetDedupParaTeste() {
  ultimosRegistros.clear();
}

// Classifica um erro em (a) esperado de rede, (b) retornado pelo Supabase
// (banco respondeu, mas com erro — ex. violação de constraint) ou (c)
// inesperado (exceção não prevista) — SEM nunca reter a mensagem bruta, que
// em alguns erros do Postgrest pode ecoar valores de coluna. Só o `code`
// (identificador curto, sem dado pessoal, ex. "23503", "PGRST116") é
// preservado; se não houver `code`, cai em "sem_codigo".
export function classificarErro(erro) {
  if (erro && typeof erro === "object" && "code" in erro && erro.code) {
    return { tipoErro: "supabase", codigoErro: String(erro.code) };
  }
  const ehFalhaDeRede =
    erro instanceof TypeError ||
    (erro && typeof erro.message === "string" && /fetch|network|failed to fetch/i.test(erro.message));
  if (ehFalhaDeRede) return { tipoErro: "rede", codigoErro: "sem_conexao" };
  return { tipoErro: "inesperado", codigoErro: "sem_codigo" };
}

// Ponto único de log de falha de sincronização. Nunca lança (mesmo que o
// próprio console esteja indisponível/instrumentado por outra ferramenta
// que jogue exceção) e nunca recebe nem repassa: nome do técnico, e-mail,
// apelido, user.id completo, token, magic link, ou o objeto `mundo`/save
// inteiro — só os campos explicitamente listados abaixo.
export function logSincronizacao(evento) {
  try {
    const { operacao, etapa, temSessao, erro } = evento || {};
    const { tipoErro, codigoErro } = classificarErro(erro);
    const contexto = {
      operacao,                 // "vincularCarreira" | "publicarProgresso" | "publicarTemporada" | "apagarCarreiraOnline"
      etapa,                    // em qual chamada dentro da operação (ex. "getSession", "garantirPerfil", "upsertCarreira")
      temSessao: !!temSessao,   // presença/ausência de sessão — nunca o conteúdo dela
      tipoErro,                 // "rede" | "supabase" | "inesperado"
      codigoErro,                // código curto sanitizado, nunca a mensagem bruta
      versao: VERSAO_APP,
      timestamp: new Date().toISOString(),
    };

    const agora = Date.now();
    if (deveSuprimir(assinatura(contexto), agora)) return;

    // Ambiente é decidido em runtime (não no import), pra não travar o
    // valor no momento em que o módulo é carregado pelos testes.
    const emDev = typeof import.meta !== "undefined" && import.meta.env && import.meta.env.DEV;
    if (emDev) {
      // eslint-disable-next-line no-console
      console.error("[sync]", contexto);
    } else {
      // Produção: mesmo contexto, sem nada além do que já está sanitizado
      // acima — não há um "modo verboso" de produção de propósito.
      // eslint-disable-next-line no-console
      console.error("[sync]", contexto);
    }
  } catch (_falhaDoLogger) {
    // A telemetria em si nunca pode se tornar uma nova causa de falha —
    // se o console estiver indisponível/instrumentado de forma hostil,
    // engolir e seguir, exatamente como o resto do módulo de sincronização.
  }
}

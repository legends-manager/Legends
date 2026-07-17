// Máquina de estados PURA do onboarding Entry → Divisão → Clube → Confirmação
// (Task 05.1H). Estado 100% efêmero de UI: nenhuma linha aqui toca
// localStorage, mundo, save, rede ou motor — criar carreira continua sendo
// exclusividade do iniciarTemporada() existente (App.jsx), chamado uma única
// vez na confirmação. Extraída como função pura pra ser testável sem
// infraestrutura de renderização React (decisão da ordem 05.1H §16).

export const PASSOS = {
  ENTRY: "entry",
  DIVISAO: "divisao",
  CLUBE: "clube",
  CONFIRMACAO: "confirmacao",
};

export const estadoInicialOnboarding = {
  passo: PASSOS.ENTRY,
  divisao: null, // id da série ("A" | "B" | "C") — só UI, nada persiste
  clube: null,   // nome do clube — só UI, nada persiste
};

export function onboardingReducer(estado, acao) {
  switch (acao.tipo) {
    case "COMECAR":
      // "Começar nova carreira" — entra na escolha de divisão.
      return { ...estado, passo: PASSOS.DIVISAO };

    case "ESCOLHER_DIVISAO": {
      // Trocar de divisão INVALIDA um clube escolhido antes (regra da ordem
      // §11: "Do not allow a stale club selection from one division to
      // survive after selecting another division").
      const trocou = acao.divisao !== estado.divisao;
      return {
        passo: PASSOS.DIVISAO,
        divisao: acao.divisao,
        clube: trocou ? null : estado.clube,
      };
    }

    case "AVANCAR_PARA_CLUBE":
      // CTA "Escolher clube" — só avança com divisão escolhida.
      return estado.divisao ? { ...estado, passo: PASSOS.CLUBE } : estado;

    case "ESCOLHER_CLUBE":
      // Selecionar um clube leva à confirmação (nenhum save criado aqui).
      return { ...estado, clube: acao.clube, passo: PASSOS.CONFIRMACAO };

    case "TROCAR_CLUBE":
      // Decisão travada (05.1F encerramento): volta pra escolha de clube
      // PRESERVANDO a divisão. Nunca chama novoJogo(), nunca limpa storage,
      // nunca cria/apaga carreira — isto aqui é um reducer puro, incapaz
      // disso por construção.
      return { ...estado, passo: PASSOS.CLUBE };

    case "VOLTAR": {
      // Voltar nunca cria nem apaga dado persistente (§11):
      // divisão → entry; clube → divisão; confirmação → clube.
      if (estado.passo === PASSOS.DIVISAO) return { ...estado, passo: PASSOS.ENTRY };
      if (estado.passo === PASSOS.CLUBE) return { ...estado, passo: PASSOS.DIVISAO };
      if (estado.passo === PASSOS.CONFIRMACAO) return { ...estado, passo: PASSOS.CLUBE };
      return estado;
    }

    case "RESETAR":
      // Carreira criada com sucesso, retorno pleno ao Entry ou mundo mudou
      // por fora — o estado efêmero zera inteiro.
      return estadoInicialOnboarding;

    default:
      return estado;
  }
}

// Guarda de disparo único pra "Iniciar carreira" (§10, estado 5): protege
// iniciarTemporada() contra duplo clique / evento repetido. O wrapper só
// deixa a primeira invocação passar; retorna true quando disparou, false
// quando foi bloqueada.
export function criarDisparoUnico(fn) {
  let disparado = false;
  return (...args) => {
    if (disparado) return false;
    disparado = true;
    fn(...args);
    return true;
  };
}

# Correções Técnicas — Etapa A (Testes de Regressão e Sincronização)

> Branch: `fix/auditoria-testes-sincronizacao`. Executa somente a Etapa A do
> `PLANO_CORRECOES_AUDITORIA.md`. Nenhuma observabilidade, banco de dados,
> migration, refatoração ampla de `App.jsx`, service worker, header de
> segurança, atualização de dependência ou deploy foi feita nesta etapa.

---

## Framework de testes escolhido

O projeto não tinha nenhum framework de teste (`package.json` sem `vitest`/
`jest`, confirmado na auditoria). Instalado **`vitest`** como devDependency
(`^4.1.10`) — única dependência nova desta etapa.

**Por que `vitest` e não outra opção**: o projeto já usa Vite 5 como bundler
(`vite.config.js` existente). `vitest` reaproveita a mesma config, o mesmo
resolvedor de módulos ESM e o mesmo esbuild — não precisa de Babel, de config
de transformação separada, nem de qualquer adaptação para o `import.meta.env`
já usado em `src/storage/supabaseClient.js`. `jest` exigiria configuração
extra para rodar sobre ESM/Vite (transform customizado, mapeamento de
`import.meta`), que é peso desnecessário para o que este projeto precisa.

Script adicionado: `"test": "vitest run"` em `package.json`.
Config: bloco `test: { environment: "node" }` em `vite.config.js` — ambiente
`node`, não `jsdom`, porque nenhum teste desta etapa renderiza componentes
React (ver §"Limitações" abaixo sobre o que isso deixa de fora).

---

## Arquivos alterados

### Novos
- `src/storage/sincronizacaoRegras.js` — 3 funções puras extraídas do
  `App.jsx` (`chaveVinculo`, `deveExecutarVinculoAutomatico`,
  `deveSincronizarProgresso`), mesma lógica exata que já existia inline.
- `src/engine/__tests__/simulador.test.js` — 7 testes de pontuação/fase.
- `src/storage/__tests__/sincronizacaoRegras.test.js` — 11 testes de sessão/
  vínculo/periodicidade.
- `src/storage/__tests__/publicarOnline.test.js` — 10 testes de
  sincronização com Supabase mockado.

### Modificados (adaptação mínima para testabilidade, comportamento preservado)
- `src/App.jsx`: 3 linhas trocadas — import do novo módulo +
  `const chave = chaveVinculo(...)` / `deveExecutarVinculoAutomatico(...)`
  no lugar do cálculo inline de string + comparação de ref; e
  `deveSincronizarProgresso(S.rodada)` no lugar de `S.rodada % 3 === 0`.
  **Nenhuma outra linha de `App.jsx` foi tocada** — layout de telas, fluxo de
  rodada, mercado, copa, quiz, tudo idêntico.
- `src/engine/simulador.js`: bloco de atualização de tabela/fase/artilharia
  que estava inline dentro de `avancarRodadaSimples` foi extraído para uma
  função nova e exportada, `aplicarResultado(estado, casa, fora, gc, gf, ev)`
  — código byte-a-byte idêntico ao que já existia, só isolado para ser
  chamável (e testável) fora do laço da rodada. `avancarRodadaSimples` agora
  chama essa função em vez de repetir o bloco inline.
- `package.json` / `vite.config.js`: script de teste + config do `vitest`
  (ver acima). `package-lock.json` atualizado pelo `npm install`.

**Regras de negócio que continuam exatamente as mesmas** (nenhuma foi
alterada, só testadas): 3 pontos por vitória, 1 por empate para os dois
times, ajuste de fase ±0.04 com teto 1.08/piso 0.92, `PONTOS_TITULO = 50`,
checkpoint a cada 3 rodadas, publicação ao fechar temporada.

---

## Testes criados (27 no total)

### `src/engine/__tests__/simulador.test.js` (7 testes)
Cobre o requisito 11 (pontuação/empates/vitórias/bônus). Testa
`aplicarResultado` de forma determinística (sem depender de `Math.random`/
Poisson): vitória em casa, vitória fora, empate, 0x0 como empate, acúmulo ao
longo de 3 rodadas, ajuste de fase, contagem de artilharia por tipo de
evento.

### `src/storage/__tests__/sincronizacaoRegras.test.js` (11 testes)
Cobre os requisitos 1 (sessão só reconhecida quando disponível), 2 (vínculo
automático) e 5 (periodicidade). `chaveVinculo` retorna `null` sem
`userId`/`time` (sessão/carreira ainda não prontas); `deveExecutarVinculoAutomatico`
confirma o guard de "uma vez só por usuário+time", incluindo troca de time
ou de usuário; `deveSincronizarProgresso` confirma que só as rodadas 3, 6,
9... 21 disparam checkpoint num calendário de 22 rodadas.

### `src/storage/__tests__/publicarOnline.test.js` (10 testes)
Cobre os requisitos 3, 4, 6, 7, 8, 9, 10 e 12, com um client Supabase 100%
mockado (nenhuma chamada de rede real, nenhuma variável de ambiente
consultada):
1. **T-01 não pode voltar** — perfil é garantido ANTES de gravar carreira,
   mesmo com `nomeTecnico` vazio (reproduz exatamente o cenário do bug real).
2. Garantia de perfil também em `publicarProgresso`/`publicarTemporada`
   (defesa em profundidade, as 3 funções).
3. Usuário antigo reabrindo o app — `vincularCarreira` publica só as
   temporadas fechadas que ainda não estavam no ranking, preservando as já
   publicadas.
4. Envio duplicado — `publicarTemporada` chamado duas vezes usa sempre
   `upsert` com `onConflict: carreira_id,temporada` (idempotente).
5. Falha de rede no upsert de `carreiras` não lança exceção, tanto em
   `publicarProgresso` quanto em `publicarTemporada` (best-effort real).
6. Supabase indisponível (`client === null`) — todas as 4 funções exportadas
   retornam de forma segura e previsível, sem tentar rede.
7. Sessão ausente (`getSession()` retorna `null`) — nenhuma chamada de
   escrita é feita.
8. Retentativa após falha anterior — simula 1ª tentativa falhando e uma 2ª
   tentativa (o checkpoint de 3 rodadas seguinte) funcionando normalmente.
9. **Preservação de dados locais** — instala um `localStorage` global fake
   e confirma que `publicarOnline.js` nunca chama `getItem`/`setItem`/
   `removeItem`, mesmo em cenário de falha total (prova, por inspeção
   automatizada, que a sincronização remota nunca pode corromper o save
   local).

---

## Comandos executados e resultados

```
npm install -D vitest --no-audit --no-fund     → OK, 35 pacotes, 0 erros
npx vitest run                                  → 3 arquivos, 27 testes, 27 aprovados, 0 falhas
npm run build                                   → OK, vite build, 11.98s, sem erros/warnings de compilação
```

**Lint**: não executado — o projeto não tem ESLint configurado (nenhum
`.eslintrc*`/`eslint.config.*`, nenhum script `lint` em `package.json`).
Não foi instalada nenhuma ferramenta de lint nesta etapa (fora do escopo
pedido — "não instalar ferramentas pesadas sem justificar" e o pedido do
usuário foi só *executar* lint "caso exista").

**Typecheck**: não executado — projeto é JavaScript puro (`.jsx`, sem
`tsconfig.json`/`jsconfig.json`), não há typecheck configurado.

---

## Cenários cobertos (checklist dos 12 itens pedidos)

| # | Cenário pedido | Coberto por | Status |
|---|---|---|---|
| 1 | Usuário só é reconhecido após sessão disponível | `chaveVinculo` (retorna `null` sem sessão) + teste "sessão ausente" em `publicarOnline.test.js` | ✅ |
| 2 | Vínculo com ranking criado automaticamente | `deveExecutarVinculoAutomatico` (5 testes) | ✅ |
| 3 | Ausência temporária de sessão não elimina/sobrescreve dados locais | Teste "nunca toca em localStorage" + "sessão ausente: não tenta gravar nada" | ✅ |
| 4 | Usuário antigo aparece no ranking ao reabrir | Teste de backfill em `vincularCarreira` | ✅ |
| 5 | Sincronização na periodicidade prevista | `deveSincronizarProgresso` (a cada 3 rodadas, 1-22) | ✅ |
| 6 | Fechamento de temporada dispara sincronização | Teste "garante perfil também em... publicarTemporada" + inspeção de código (`App.jsx` chama `publicarTemporada` uma única vez em `finalizarTemporadaCarreira`, não extraído — ver limitações) | ⚠️ parcial |
| 7 | Mesmo progresso não é publicado duas vezes | Teste "envio duplicado" (upsert idempotente) | ✅ |
| 8 | Falha de rede não apaga o save | Teste "nunca toca em localStorage" | ✅ |
| 9 | Erro do Supabase não interrompe a carreira offline | 2 testes de "falha de rede... não lança exceção" | ✅ |
| 10 | Nova tentativa pode ocorrer após falha anterior | Teste "retentativa após falha anterior" | ✅ |
| 11 | Pontuação/empates/vitórias/bônus iguais às regras atuais | 7 testes em `simulador.test.js` + `PONTOS_TITULO` verificado no teste de backfill (bônus de 50 por título) | ✅ |
| 12 | Bug do T-01 não pode voltar sem teste falhar | Teste dedicado "T-01 não pode voltar" | ✅ |

---

## Limitações (o que esta etapa NÃO cobre)

- **Item 6 (fechamento de temporada) é só parcialmente automatizado.**
  `finalizarTemporadaCarreira` continua inteiramente dentro de `App.jsx`,
  não extraída (por decisão explícita de não refatorar `App.jsx` amplamente
  nesta etapa). O teste cobre que `publicarTemporada` funciona
  corretamente quando chamada com os argumentos que `finalizarTemporadaCarreira`
  passa (`mundo`, `S.tabela[meuTime].P`, `nomeTec`) — mas não testa,
  automatizado, que `App.jsx` de fato chama `publicarTemporada` nesse ponto
  exato do fluxo. Isso foi conferido por leitura de código (linha
  correspondente em `App.jsx`), não por teste automatizado. Corrigir isso
  exigiria testar `App.jsx` com `@testing-library/react` (ou extrair
  `finalizarTemporadaCarreira` para um módulo próprio) — ambos fora do
  escopo autorizado desta etapa.
- **Nenhum teste renderiza componentes React** (ambiente `node`, não
  `jsdom`) — por desenho, para não precisar de `@testing-library/react`
  nem `jsdom` como dependências novas, já que todos os 12 cenários pedidos
  são testáveis na camada de função pura/módulo de sincronização, sem
  precisar montar a árvore de UI.
- **A duplicação de fórmula de pontuação entre `engine/simulador.js` e o
  bloco inline em `App.jsx` (linhas de `finalizarRodada`) não foi
  eliminada** — só o `engine/simulador.js` foi extraído e testado. O bloco
  equivalente em `App.jsx` continua duplicado e sem teste direto (é
  código idêntico, visualmente inspecionado como igual, mas nada impede que
  diverjam no futuro sem que um teste avise). Já registrado como achado T-04
  adjacente na auditoria original; não corrigido aqui por estar fora do
  escopo ("não misturar... refatoração arquitetural").
- ~~`vincularCarreira` ainda não tem `try/catch` externo ao redor do corpo
  inteiro~~ — **resolvido na Etapa B**, ver seção abaixo.
- **Multi-aba real não é simulada** — o teste de "retentativa" cobre duas
  chamadas sequenciais com módulos remockados, não duas abas de navegador
  concorrentes de verdade (exigiria infraestrutura de teste desproporcional
  ao risco, mesma decisão já registrada no plano original).

---

## Riscos ainda não cobertos

- Motor de Liga Viva (`engine/mundo.js`, acesso/rebaixamento) — segue sem
  nenhum teste; estava fora do escopo desta etapa (Etapa A do plano cobriu
  só sincronização + a fórmula de pontuação por jogo, não o cálculo de
  acesso/rebaixamento de fim de temporada).
- Persistência local (`storage/saveGame.js`, migração de save v1→v2) — sem
  teste automatizado ainda.
- Quiz (`storage/quiz.js`, sorteio de pergunta/índice de resposta) — sem
  teste automatizado ainda.
- RLS do Supabase (usuário A não escrever em dado de usuário B) — não
  testável sem uma chamada real ao banco (proibida nesta etapa); continua
  dependendo só da configuração já auditada manualmente.

---

## Validação manual recomendada antes de mesclar (Etapa A)

- Abrir o app localmente (`npm run dev`), criar uma carreira nova, logar,
  jogar 3+ rodadas e confirmar visualmente que o ranking online reflete o
  progresso — os testes provam a lógica isoladamente, mas não substituem
  ver o fluxo real de ponta a ponta pelo menos uma vez.
- Conferir que `git diff src/App.jsx` (abaixo) é realmente só as 3 linhas
  de substituição esperadas, sem nenhuma mudança colateral.

---
---

# Etapa B — Observabilidade e Tratamento de Erros Silenciosos

> Mesma branch: `fix/auditoria-testes-sincronizacao`. Executa somente a
> Etapa B do `PLANO_CORRECOES_AUDITORIA.md`, focada em
> `src/storage/publicarOnline.js`. Nenhum banco de dados, migration,
> constraint, `App.jsx`, service worker, header de segurança ou deploy foi
> tocado nesta etapa — só a camada de logging e o próprio
> `publicarOnline.js`.

## Confirmação de pré-requisito

Antes de iniciar, os 27 testes da Etapa A foram executados e confirmados
passando (`npx vitest run` → `3 arquivos, 27 testes, 27 aprovados`) — a
Etapa B partiu de uma base verde.

## O que foi implementado

Uma camada central pequena, `src/storage/logger.js`, que substitui os
antigos `catch (e) { /* melhor esforço */ }` de `publicarOnline.js`. Nenhum
`catch` silencioso restou nesse arquivo — todos agora chamam
`logSincronizacao(...)` antes de engolir o erro (o "engolir" continua
existindo, de propósito: é o que preserva o offline-first).

### `src/storage/logger.js` (novo)

- `classificarErro(erro)` — diferencia 3 categorias sem nunca reter a
  mensagem bruta do erro:
  - **`supabase`**: o Postgrest/Supabase respondeu com um erro estruturado
    (`{ code, message }`) — usa só o `code` (ex. `"23503"`, `"PGRST116"`),
    que é um identificador curto e não carrega dado pessoal.
  - **`rede`**: `TypeError` ou mensagem com padrão de falha de rede
    (`fetch`/`network`/`failed to fetch`) — falha **esperada**, tratada
    como estado normal de "sem internet agora", não como bug.
  - **`inesperado`**: qualquer outra exceção não prevista — é o único
    balde que sinaliza "algo no código pode estar errado", diferente dos
    outros dois (esperados).
- `logSincronizacao({ operacao, etapa, temSessao, erro })` — monta um
  objeto de contexto **fixo e explícito** (nunca aceita campos livres) e
  manda pro console via `console.error("[sync]", contexto)`:
  ```js
  {
    operacao,     // "vincularCarreira" | "publicarProgresso" | "publicarTemporada" | "apagarCarreiraOnline"
    etapa,        // "getSession" | "garantirPerfil" | "upsertCarreira" | "upsertCarreiraTemporada" | "insertBackfill" | "deleteCarreira" | "inesperado"
    temSessao,    // true/false — nunca o conteúdo da sessão
    tipoErro,     // "rede" | "supabase" | "inesperado"
    codigoErro,   // código curto sanitizado, nunca a mensagem bruta
    versao,       // __APP_VERSION__ (ver vite.config.js)
    timestamp,    // ISO 8601
  }
  ```
  Mesmo formato em desenvolvimento e produção — não existe um "modo
  verboso" de produção que vaze mais informação (decisão deliberada: menos
  superfície de erro a auditar depois).
- **Dedup/anti-loop**: um `Map` em memória (`operacao|etapa|tipoErro|codigoErro`
  → timestamp) suprime o mesmo evento repetido dentro de 10 segundos — evita
  que um Supabase fora do ar por horas vire uma rajada de `console.error` a
  cada checkpoint de 3 rodadas.
- **Nunca lança**: todo o corpo está dentro de um `try/catch` que não faz
  nada além de engolir — mesmo se `console.error` em si estiver
  instrumentado para lançar (telemetria hostil/indisponível), a chamada
  original a `logSincronizacao` retorna normalmente.
- `_resetDedupParaTeste()` — export só para os testes zerarem o `Map` de
  dedup entre casos; não é chamado em nenhum lugar do código de produção.

### `src/storage/publicarOnline.js` (modificado)

Todos os 4 `catch`/pontos de erro ignorado passaram a chamar
`logSincronizacao` antes de retornar:
- `garantirPerfil` loga (`etapa: "garantirPerfil"`) se o upsert de
  `profiles` falhar — antes esse erro nem chegava a ser inspecionado por
  quem chamava `publicarProgresso`/`publicarTemporada` (gap identificado na
  Etapa A, item A-10; agora pelo menos fica visível, mesmo sem mudar o
  fluxo de controle das duas funções).
- `publicarTemporada`/`publicarProgresso`: `getSession()` agora está dentro
  de um `try/catch` próprio (`etapa: "getSession"`) — antes, se
  `getSession()` em si lançasse (raro, mas possível), a exceção escapava
  sem tratamento nenhum. O `catch` externo que já existia agora loga com
  `etapa: "inesperado"` em vez de só comentário.
- `vincularCarreira`: **ganhou um `try/catch` ao redor do corpo inteiro**
  (não existia nenhum antes) — fecha exatamente o gap A-8 registrado na
  Etapa A ("uma exceção lançada, não retornada, propagava pro chamador").
  Em caso de exceção não prevista, retorna
  `{ error: "Falha inesperada ao sincronizar com o ranking" }` em vez de
  deixar a `Promise` rejeitar sem tratamento — o chamador (efeito de
  auto-vínculo em `App.jsx`) já ignora o retorno de sucesso/erro dessa
  chamada hoje, então esse retorno não muda nenhum comportamento visível,
  só evita uma `unhandledrejection` no console do navegador.
- `apagarCarreiraOnline`: mesma proteção — `try/catch` novo, loga
  `etapa: "deleteCarreira"` ou `"inesperado"`.

**Nenhuma mensagem de erro bruta do Supabase chega ao console** — só
`code` (curto, sem dado de coluna) ou a categoria `"sem_conexao"`/
`"sem_codigo"`. Nenhuma função de `publicarOnline.js` mudou sua assinatura
pública nem o formato do que já retornava em caso de erro **conhecido**
(`{ error: string }`) — só o caminho de exceção **não prevista**, que antes
não tinha contrato nenhum, ganhou um.

### `vite.config.js` (modificado)

Adicionado `define: { __APP_VERSION__: JSON.stringify(pkg.version) }`,
lendo a versão direto de `package.json` (sem nova dependência — usa
`node:fs`/`node:url`, ambos nativos). É a "identificação da versão do
aplicativo" pedida — todo log de sincronização carrega a versão do build em
que aconteceu.

---

## Por que não Sentry (nem outra plataforma paga) nesta etapa

Avaliado e **conscientemente adiado**, não descartado:

**Opção mínima implementada agora (sem fornecedor externo)**: `console.error`
estruturado, visível no DevTools de qualquer navegador, sem custo, sem
dependência de rede, sem risco de a própria telemetria falhar (não há rede
envolvida em logar). Suficiente para o estágio atual: poucos usuários, sem
volume que justifique agregação/alerta automático — o modelo de descoberta
de bug continua sendo "alguém reporta, dev abre o console/pede print",
só que agora o console tem informação estruturada em vez de nada.

**Se/quando justificar Sentry** (ou equivalente, ex. LogRocket, Highlight.io):
- **Custo**: Sentry free tier cobre ~5k eventos de erro/mês (varia por
  plano/época) — para o volume atual (poucas dezenas de sessões), fica
  dentro do grátis; o risco é o de qualquer serviço "grátis até certo
  volume": se a base crescer rápido sem revisar o plano, vira custo
  recorrente sem aviso.
- **Limite prático**: exige uma conta/projeto novo pra gerenciar (mais uma
  peça de infraestrutura pro Felyp, que hoje é equipe de 1 pessoa + IA),
  mais uma dependência de rede em runtime (o SDK do Sentry faz suas
  próprias chamadas de rede em background) — precisa de tratamento próprio
  pra "o Sentry está fora do ar" não virar um novo tipo de erro silencioso.
- **Condição para reconsiderar**: quando o volume de usuários justificar
  alerta automático (não só "alguém me mandou print") — ou quando entrar
  dinheiro/prêmio real no produto (mesmo gatilho já registrado pro T-03 na
  auditoria original).
- **Garantia caso seja adotado no futuro**: a interface de `logSincronizacao`
  já isola o "transporte" (hoje só `console.error`) do resto do código — 
  trocar ou adicionar um transporte por Sentry no futuro não exigiria tocar
  em `publicarOnline.js` de novo, só no `logger.js`, e teria que preservar
  a mesma garantia de "nunca lançar, nunca travar o app" que o console tem
  hoje.

**Não instalado nesta etapa.** Nenhuma dependência de telemetria paga foi
adicionada.

---

## Testes criados nesta etapa (15 novos, 42 no total do projeto)

### `src/storage/__tests__/logger.test.js` (11 testes)
- `classificarErro`: erro com `.code` → `"supabase"`; `TypeError`/mensagem
  de rede → `"rede"`; erro genérico → `"inesperado"`; `undefined`/`null`
  não quebram a classificação.
- `logSincronizacao`: contexto completo (operação/etapa/sessão/código/
  timestamp/versão); **nunca inclui a mensagem bruta** do erro (teste usa
  um erro com um e-mail fictício de teste embutido na mensagem simulada e
  confirma que o e-mail nunca aparece no console); só as 7 chaves esperadas
  chegam ao contexto (nenhum campo livre); nunca lança mesmo com
  `console.error` forçado a lançar (telemetria indisponível); nunca lança
  com argumentos ausentes/malformados (`{}`, `undefined`).
- Dedup: mesma falha repetida em sequência é suprimida (1 log em vez de 3);
  falhas com etapa/operação diferentes NÃO são suprimidas entre si.

### `src/storage/__tests__/publicarOnline.observabilidade.test.js` (4 testes)
Integração entre `publicarOnline.js` e o logger (logger mockado para
inspecionar as chamadas):
- Erro retornado pelo Supabase chega ao log com `tipoErro: "supabase"` e o
  `code`, mas a mensagem sensível simulada (`"detalhe sensível"`) nunca é
  comparada/incluída no que o teste afirma sobre o contexto — só o objeto
  de erro original é passado ao logger (que por sua vez sanitiza).
- Erro inesperado (exceção lançada dentro do upsert, não um erro
  retornado) é registrado com `etapa: "inesperado"` e a função continua
  resolvendo normalmente (não lança pro chamador).
- Sessão ausente não gera nenhuma chamada ao logger (é estado esperado,
  não falha — confirma que o logger não “grita” por algo que é normal).
- Telemetria indisponível (usa o `logger.js` real, só `console.error`
  forçado a lançar) — `publicarProgresso` ainda resolve sem lançar.

---

## Comandos executados e resultados (Etapa B)

```
npx vitest run     → 5 arquivos, 42 testes, 42 aprovados, 0 falhas
npm run build       → OK, vite build, 13.31s, sem erros/warnings de compilação
```

**Lint**: continua não configurado no projeto (mesma constatação da
Etapa A) — nada foi instalado.
**Typecheck**: continua não aplicável (projeto JS puro).

---

## `git diff --stat` (cumulativo — Etapa A + Etapa B, mesma branch)

```
 package-lock.json                                  | 1152 +++++++++++++++++++-
 package.json                                        |    6 +-
 src/App.jsx                                         |    7 +-        ← só Etapa A, intocado nesta etapa
 src/engine/__tests__/simulador.test.js              |   76 ++        ← Etapa A
 src/engine/simulador.js                             |   39 +-        ← Etapa A
 src/storage/__tests__/logger.test.js                |  115 ++        ← Etapa B (novo)
 src/storage/__tests__/publicarOnline.observabilidade.test.js | 111 ++ ← Etapa B (novo)
 src/storage/__tests__/publicarOnline.test.js        |  220 ++++       ← Etapa A
 src/storage/__tests__/sincronizacaoRegras.test.js   |   58 +          ← Etapa A
 src/storage/logger.js                               |  102 ++        ← Etapa B (novo)
 src/storage/publicarOnline.js                       |  195 ++--      ← Etapa B (modificado)
 src/storage/sincronizacaoRegras.js                  |   31 +         ← Etapa A
 vite.config.js                                      |   14 +         ← Etapa A (config base) + Etapa B (__APP_VERSION__)
 13 files changed, 2035 insertions(+), 91 deletions(-)
```

`App.jsx` tem 0 linhas novas alteradas nesta etapa — a contagem de 7 é
inteiramente da Etapa A anterior.

---

## Erros que agora podem ser diagnosticados

Antes desta etapa, qualquer falha dentro de `publicarOnline.js` desaparecia
sem deixar rastro (era literalmente `catch (e) { /* melhor esforço */ }`).
Agora, aparecem no console (dev e produção) com contexto:
- `getSession()` lançando (ex. client do Supabase mal inicializado).
- Upsert de `profiles` falhando (ex. violação de constraint futura, se o
  `CHECK` proposto na Etapa C original vier a existir).
- Upsert de `carreiras` falhando (rede, RLS, validação do banco).
- Upsert/insert de `carreira_temporadas` falhando (backfill ou fechamento
  de temporada).
- `DELETE` de `carreiras` falhando (apagar jornada/LGPD).
- Qualquer exceção não prevista em qualquer uma das 4 funções exportadas
  (antes só era capturada em 2 delas; agora nas 4).

## Dados explicitamente excluídos dos logs

- Mensagem bruta de erro do Supabase/Postgrest (pode ecoar valor de coluna).
- Nome do técnico (`nomeTecnico`).
- E-mail, apelido, token, magic link, credencial — nenhum desses é sequer
  um parâmetro aceito por `logSincronizacao`.
- `user.id` completo — só um booleano (`temSessao`) indica presença/ausência
  de sessão.
- O objeto `mundo`/save inteiro — nunca passado ao logger.
- Stack trace completo — não incluído de propósito (poderia conter nomes de
  arquivo/variáveis locais que não agregam ao diagnóstico e aumentam a
  superfície do que precisa ser considerado "dado a proteger").

---

## Roteiro de validação manual (Etapa B)

1. `npm run dev`, abrir o console do navegador.
2. Desligar a rede (DevTools → Network → Offline) e jogar uma rodada até o
   checkpoint de 3 rodadas com sessão logada — confirmar que aparece
   `[sync] { operacao: "publicarProgresso", etapa: "upsertCarreira", tipoErro: "rede", ... }`
   no console, e que o jogo continua funcionando normalmente.
3. Religar a rede, forçar mais um checkpoint — confirmar que some o erro
   (sincroniza normalmente) e nenhuma mensagem de erro falsa fica presa.
4. Conferir visualmente que nenhuma tela do jogo mudou (nenhuma UI nova, o
   pedido era só de observabilidade em log, não de mensagem pro usuário).

---

## Instruções de rollback

- Etapa B isolada: `git diff src/storage/logger.js src/storage/publicarOnline.js vite.config.js src/storage/__tests__/logger.test.js src/storage/__tests__/publicarOnline.observabilidade.test.js` mostra exatamente o que reverter.
- Reversão rápida: `git checkout -- src/storage/publicarOnline.js vite.config.js`
  e apagar `src/storage/logger.js` + os 2 arquivos de teste novos da Etapa B
  — volta exatamente ao estado pós-Etapa A (os `catch` silenciosos
  reaparecem, nada mais muda).
- Não há rollback de banco/migration necessário — esta etapa não tocou o
  Supabase.

---

## Recomendação objetiva sobre segurança para publicação

**Seguro para publicar** do ponto de vista desta etapa: nenhuma mudança de
comportamento visível ao usuário, nenhum dado pessoal novo exposto (pelo
contrário — antes não havia log nenhum; agora há log estruturado e mais
seguro que o "nada"), nenhuma dependência de rede nova, nenhuma chance de a
observabilidade em si quebrar o app (testado explicitamente). A única
mudança de comportamento real é que 2 funções (`vincularCarreira`,
`apagarCarreiraOnline`) agora retornam um erro genérico em vez de deixar
uma exceção não tratada escapar — isso é estritamente mais seguro, não
mais arriscado.

**Antes de publicar de fato**, ainda faltam (fora do escopo desta etapa,
já registrado no plano): Etapa C (integridade mínima do ranking, ainda só
proposta, não implementada) e o roteiro de validação manual acima rodado
pelo menos uma vez contra o Supabase real (esta etapa só testou com mocks).

---
---

# Etapa C — Integridade Mínima do Ranking (PREPARAÇÃO, não aplicada)

> Branch nova: `fix/integridade-minima-ranking`, criada a partir do commit
> `8426cb6` (topo de `fix/auditoria-testes-sincronizacao`). Esta etapa
> prepara a migration e o ajuste de código, mas **não aplica nada no
> Supabase de produção** — nenhuma migration foi executada, nenhum dado foi
> alterado, nenhum commit foi criado nesta etapa. Baseada em
> `ANALISE_INTEGRIDADE_RANKING.md` e na consulta de leitura já executada
> (13/jul/2026) que confirmou que os 3 registros hoje existentes no banco
> já respeitam todas as faixas propostas abaixo.

## O que foi preparado

1. **`supabase/migrations/20260713120000_protecao_minima_ranking.sql`**
   (novo) — a migration em si, pronta pra revisão, **não executada**:
   - `CHECK (pontos_temporada_atual BETWEEN 0 AND 150)` em `carreiras`.
   - `CHECK (pontos BETWEEN 0 AND 150)` em `carreira_temporadas`.
   - `CHECK (temporada BETWEEN 1 AND 20)` em `carreira_temporadas`.
   - Uma função + trigger (`definir_atualizado_em_pelo_servidor`,
     `carreiras_atualizado_em_servidor`) que força `atualizado_em` a vir
     sempre do relógio do PRÓPRIO BANCO em todo INSERT/UPDATE de
     `carreiras`, não importa o que o cliente mandar.
   - Nenhum comando destrutivo — só `ADD CONSTRAINT`, `CREATE OR REPLACE
     FUNCTION`, `CREATE TRIGGER`. Nenhum `DELETE`/`UPDATE`/`DROP TABLE`.
2. **`supabase/migrations/20260713120000_protecao_minima_ranking_ROLLBACK.sql`**
   (novo) — script separado que desfaz exatamente os 3 `CHECK` + a função/
   trigger, sem apagar nenhum dado (a migration original também não apaga
   dado nenhum, então o rollback só remove as travas).
3. **`src/storage/publicarOnline.js`** (modificado, 1 trecho) — removida a
   linha que enviava `atualizado_em: new Date().toISOString()` no
   `upsert` de `publicarProgresso`. Agora esse campo nunca é definido pelo
   cliente — some sozinho do payload, deixando a coluna (`default now()`
   hoje, e o trigger da migration amanhã) decidir. Nenhuma outra linha do
   arquivo foi tocada; a fórmula de pontos (`PONTOS_TITULO`, cálculo de
   `pontos`) continua exatamente igual.
4. **`src/storage/__tests__/publicarOnline.integridade.test.js`** (novo) —
   5 testes novos:
   - confirma que `publicarProgresso` não manda mais `atualizado_em`;
   - confirma que uma rejeição do banco por `CHECK` de pontos (código
     Postgres `23514`, simulado via mock) não quebra `publicarProgresso`;
   - confirma o mesmo para uma rejeição por `CHECK` de temporada em
     `publicarTemporada`, usando de propósito uma temporada 25 (acima do
     limite 20) pra documentar o risco residual descrito abaixo;
   - 2 testes "canário": confirmam por cálculo que o máximo de pontos
     realmente possível numa temporada (Série C, 22 rodadas, campeão
     invicto + bônus = 116) cabe na faixa 0–150, e que uma carreira de até
     20 temporadas cabe na faixa 1–20 — se a fórmula de pontuação ou o
     calendário mudarem no futuro de um jeito que estoure essas faixas,
     esses 2 testes avisam antes de alguém descobrir isso em produção.

## Decisão sobre os times (avaliada, NÃO implementada nesta migration)

Comparação pedida entre 2 opções, para validar `meu_time`/`time` contra a
lista real dos 34 times:

| Opção | Impacto | Manutenção futura | Risco de quebrar sincronização | Como adicionar/renomear um time |
|---|---|---|---|---|
| **`CHECK` com a lista dos 34 nomes direto na constraint** | Baixo — 1 `ALTER TABLE` simples, sem tabela nova, sem `JOIN` a mais em nenhuma consulta do ranking | Cada mudança de time exige uma migration nova (`DROP CONSTRAINT` + `ADD CONSTRAINT` com a lista atualizada) | Baixo — é só uma checagem de texto contra uma lista fixa, mesma categoria de risco dos `CHECK` já propostos acima | Rodar uma migration curta trocando a lista — mesmo padrão que já é usado pra `serie`/`resultado` nesta mesma tabela |
| **Tabela `times_validos` com FK a partir de `carreiras`/`carreira_temporadas`** | Maior — nova tabela, nova FK em 2 tabelas existentes, RLS própria pra decidir quem pode ler/escrever nela | Adicionar/renomear time vira um `INSERT`/`UPDATE` de dado (não uma migration de schema) — mais flexível a longo prazo | Médio — qualquer erro na FK ou na RLS da tabela nova pode bloquear TODA gravação de `carreiras`/`carreira_temporadas`, não só a validação de time | `INSERT`/`UPDATE` numa tabela, sem migration — mas alguém sempre precisa fazer isso manualmente de qualquer forma (times não se auto-cadastram) |

**Decisão: nenhuma das duas foi implementada nesta migration** — ficou de
fora de propósito, pra manter esta mudança pequena e focada só nos 3 itens
que o pedido definiu como objetivo (pontos, temporada, data). Registrando
a avaliação para quando (se) essa proteção específica for priorizada: a
lista de times no Legends Manager já é 100% controlada por código
(`src/data/elencos-*.js` — um time só existe se um desenvolvedor editar um
desses arquivos; ninguém cadastra time pela interface), e muda raramente
(promoção da Série A real, por exemplo, é o único evento do roadmap que
adicionaria times novos). Nesse cenário, a tabela de referência adiciona
uma camada de infraestrutura (FK, RLS, join) sem ganho real — trocar uma
lista fixa numa migration custa o mesmo que fazer o mesmo em código, que
já é o processo atual. **Recomendação, se/quando for implementada: `CHECK`
com a lista**, não tabela de referência.

## Comandos executados (só localmente, nenhum commit)

```
npx vitest run     → 6 arquivos, 47 testes, 47 aprovados, 0 falhas
npm run build       → OK, vite build, 11.86s, sem erros/warnings
git diff --check    → limpo (só aviso de fim de linha CRLF/LF, não é erro)
```

## Riscos restantes (mesmo depois de aplicar esta migration)

- **Limite de temporada (1–20) pode um dia bloquear um jogador veterano
  legítimo.** A Liga Viva foi desenhada pra carreira INDEFINIDA (o
  `mundo.temporada` nunca para de incrementar). Se alguém realmente jogar
  mais de 20 temporadas, a partir da 21ª o espelho ONLINE dessa temporada
  específica passaria a ser rejeitado pelo banco (best-effort: o jogo
  local continua normal, só o ranking dessa temporada específica não
  apareceria). Não é um bug que apaga progresso, mas é uma limitação real
  a monitorar — se o Felyp achar que 20 é baixo demais, o número é fácil
  de aumentar numa migration futura (é só um valor no `CHECK`).
- **Times ainda não são validados** — decisão consciente (ver tabela
  acima), mas continua sendo possível, hoje, declarar um `meu_time`
  qualquer.
- **Nenhuma validação server-side do VALOR de pontos continua de pé** — os
  `CHECK` limitam a FAIXA, não impedem alguém de, dentro da faixa 0–150,
  forjar um valor "razoável" mas ainda falso (ex. declarar 140 pontos sem
  ter jogado a temporada toda). Isso é aceitável nesta fase pelo mesmo
  motivo já registrado em `ANALISE_INTEGRIDADE_RANKING.md` (T-03):
  ausência de prêmio real, dano só reputacional, publicamente visível.
- **O trigger de `atualizado_em` só vale depois de aplicado.** Enquanto a
  migration não for executada, o código já para de mandar a data do
  cliente (mudança já feita), mas sem o trigger o banco simplesmente NÃO
  atualiza esse campo em updates (fica com a data antiga) — não é errado,
  mas também não está resolvido de verdade até a migration ser aplicada.

## O que aconteceria se esta migration fosse aplicada (nenhuma ação real tomada)

1. `ALTER TABLE ... ADD CONSTRAINT` valida TODOS os dados já existentes
   contra a nova regra antes de aceitar a constraint — como já confirmado
   por leitura (0 registros fora da faixa), a aplicação seria aceita sem
   erro.
2. A partir daí, qualquer tentativa de gravar um valor fora das faixas
   (pelo app ou por qualquer chamada direta à API) passaria a ser
   REJEITADA pelo banco — o `upsert`/`insert` retornaria um erro (código
   Postgres `23514`), que `publicarOnline.js` já sabe tratar como
   melhor-esforço (logado via `logSincronizacao`, nunca quebra o app —
   testado nesta etapa).
3. O trigger passaria a interceptar toda escrita em `carreiras` e forçar
   `atualizado_em = now()` do servidor, silenciosamente, sem erro.
4. Nenhum dado existente seria alterado no momento de aplicar — só
   passariam a valer regras novas para escritas FUTURAS.

## Confirmação

Nenhum comando foi executado contra o Supabase de produção nesta etapa —
só leitura (já feita antes, na etapa anterior) e a criação destes arquivos
locais, ainda não commitados nesta branch nova.

## Recomendação objetiva (na 1ª versão desta etapa)

**Seguro para revisão final antes da aplicação.** A migration é pequena,
não-destrutiva, com rollback pronto, e já confirmada compatível com os
dados reais existentes. Antes de aplicar de fato, revisar especialmente o
risco do limite de 20 temporadas (é a única decisão nesta migration com
chance real de precisar de ajuste no futuro) e decidir, com o Felyp, se
vale a pena aumentar essa margem preventivamente antes de aplicar.

---
---

# Etapa C — Revisão Técnica Independente e Ajustes Aplicados

> Uma segunda análise, feita separadamente da que preparou a migration
> (sem aceitar as decisões anteriores por padrão), encontrou 7 problemas —
> 2 deles reais o bastante pra justificar mudar a migration antes de
> aplicar. Esta seção documenta os achados e o que foi corrigido em
> resposta. Ainda **nada foi commitado nem aplicado no Supabase** até este
> ponto.

## Achados da revisão (resumo)

1. **O teto de 20 temporadas não tinha justificativa real** — a Liga Viva
   foi desenhada pra carreira sem fim (o contador de temporada nunca para
   de crescer no motor), então um teto arbitrário na temporada corria risco
   real de travar jogador dedicado.
2. **Esse teto podia causar perda de dado de verdade, não só um erro
   registrado**: `publicarTemporada` fazia duas gravações separadas —
   primeiro zerava o progresso, depois tentava salvar a temporada fechada.
   Se a segunda fosse recusada (por qualquer motivo, não só o teto de
   temporada), o progresso já tinha sido apagado sem o resultado ter sido
   salvo em lugar nenhum.
3. Validar só `temporada >= 1` (sem teto) protegia contra o mesmo problema
   que o teto tentava resolver (temporada "inventada"), com muito menos
   risco — o número da temporada sozinho não aumenta pontuação de ninguém.
4. Dois dos cinco testes automatizados ("canário") não testavam nada de
   real — comparavam números digitados à mão contra outros números
   digitados à mão, nunca lendo o código de verdade do jogo.
5. As 3 travas de faixa (`ADD CONSTRAINT`) não eram seguras pra rodar duas
   vezes — reexecutar o arquivo por engano falharia com "já existe".
6. Havia risco de publicar o código (que já parou de mandar a data do
   navegador) separado da migration (que ensina o banco a preencher essa
   data sozinho) — nessa janela, a data de atividade simplesmente parava de
   atualizar pra todo mundo.
7. O gatilho de data também conta "abrir o app logado" como atividade, não
   só "jogar de verdade" — aceitável, mas registrado como limitação, não
   corrigido (mudar isso muda o comportamento de login, fora do escopo
   desta etapa).

Relatório completo da revisão (com a análise ponto a ponto pedida,
incluindo os itens que NÃO precisaram de ajuste) foi apresentado antes
desta seção, no chat da sessão de trabalho.

## Ajustes aplicados em resposta (itens 1-5 acima)

- **`supabase/migrations/20260713120000_protecao_minima_ranking.sql`**
  reescrita: a constraint de temporada agora é só
  `carreira_temporadas_temporada_minima CHECK (temporada >= 1)` — sem
  teto. As 3 `ADD CONSTRAINT` agora estão dentro de blocos `DO $$ ...
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;`, seguras pra rodar
  mais de uma vez. Adicionado um aviso explícito no topo do arquivo sobre
  a ordem de publicação (migration junto com o código, não depois).
- **`..._ROLLBACK.sql`** atualizado pra remover o nome novo da constraint
  de temporada (`carreira_temporadas_temporada_minima`).
- **`src/storage/publicarOnline.js`** (`publicarTemporada`): reordenado —
  agora salva a temporada fechada em `carreira_temporadas` PRIMEIRO, e só
  zera `pontos_temporada_atual` (numa segunda escrita, separada) DEPOIS de
  confirmar que a temporada foi salva com sucesso. Se a gravação da
  temporada falhar, o progresso não é zerado — fica visível online até uma
  próxima tentativa conseguir.
- **`src/storage/__tests__/publicarOnline.integridade.test.js`**
  reescrito: os 2 testes "canário" agora importam `totalRodadas`
  (`engine/calendario.js`), `SERIES` (`data/series.js`) e `PONTOS_TITULO`
  (`publicarOnline.js`) de verdade, em vez de repetir números fixos — se
  o calendário ou o bônus de título mudarem, o teste reflete o valor novo
  automaticamente. Adicionados 2 testes novos: um confirma que uma
  temporada 25 não é mais rejeitada (prova da remoção do teto), outro
  confirma a nova ordem segura de gravação (progresso só zera depois do
  sucesso, e não zera se a gravação da temporada falhar).
- **Item 6 (ordem de publicação)** e **item 7 (gatilho conta login como
  atividade)**: não são mudanças de código — ficam documentados como aviso
  no topo da migration (item 6) e como limitação conhecida no comentário
  do trigger (item 7), pra quem for aplicar/revisar não esquecer.

## Comandos executados após os ajustes

```
npx vitest run     → 6 arquivos, 48 testes, 48 aprovados, 0 falhas
npm run build       → OK, vite build, 11.42s, sem erros/warnings
git diff --check    → limpo (só aviso de fim de linha CRLF/LF, não é erro)
```

## Recomendação objetiva (após os ajustes)

**Seguro para revisão final antes da aplicação — pronto pra virar
commit.** Os 2 riscos reais encontrados (teto de temporada + perda de dado
por ordem de gravação) foram corrigidos; os testes agora testam
comportamento de verdade em vez de números fixos; a migration ficou segura
pra reexecutar. O que continua em aberto, por decisão consciente e não por
esquecimento: validar `meu_time` contra a lista de times (fora de escopo,
ver decisão registrada acima) e o gatilho contar login como atividade
(documentado, aceitável nesta fase). Próximo passo natural: revisar este
relatório, e se aprovado, commitar na branch `fix/integridade-minima-ranking`
e então mergear — só depois disso a pré-condição do redesign visual
(`REDESIGN_LEGENDS_MANAGER.md`) fica satisfeita.

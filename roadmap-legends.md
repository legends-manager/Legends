# roadmap-legends.md — Marcos após o Marco 2

> Regra de método (mantida do v3): **um marco em voo por vez.** Nada abaixo começa antes do
> marco anterior fechar (checklist verde + no ar). Dado real só entra verificado e com
> conferência do Felyp como item bloqueante. CPF nunca.

## Estado atual
- **Marco 1** ✅ no ar (legends-iota-steel.vercel.app).
- **Marco 2 — Mercado de Transferências** 🔨 código pronto (perfil brutal); PENDENTE: teste de
  economia de temporada completa + validação do save v1→v2 no celular + push.
- **Marco 2.5 — Polimento** 🔨 aberto (spec-marco2-polish.md): setinhas ▲▼, manchetes de
  transferência, torcida (cosmética, sem efeito no motor), capa com a marca Legends e ESPAÇO DE PATROCINADOR
  (placeholder de inventário com mensagem-convite, no rodapé do menu e no pôster de campeão).
  Decisão futura registrada ⚙️: micro-bônus de mando por torcida (avaliar risco de bola de neve).
  Inclui também a **galeria de avatares de técnico** (arte v2 estilizada aprovada; escolha na
  capa; avatar na escalação e no pôster) — antecipação parcial do Marco 7.

## Marco 3 — Séries A/B/C (EM EXECUÇÃO)
- Mesmo motor, zero mudança de mecânica: seletor de série na tela inicial,
  `elencos-reais-serie-b.js` (mesmo processo verificado da C), calendário/tabela/artilharia
  próprios da B, 22 rodadas.
- Série B: 10 times reais extraídos das súmulas (elencos-reais-serie-b.js, 134 reais + Nação NH
  placeholder). Série A: times da Kings League Brasil (risco de IP assumido pelo Felyp), elencos
  pendentes. Arquitetura multi-série: spec-multi-serie.md. Conferência da B = bloqueante.

## Marco 4 — Bicho & cotidiano da várzea (extensão da economia do Marco 2)
- Bicho por vitória como despesa do orçamento L$ (valor definido pelo técnico na pré-temporada ⚙️).
- Eventos de texto no tom da várzea: jogador pede aumento do bicho (aceitar custa L$; recusar
  tem risco leve na fase ⚙️), churrasco pós-vitória, resenha do grupo. Frases curtas, tom WhatsApp.
- Tudo camada por cima: atributo, força interna e zebra intocados. Detalhes viram spec quando abrir.

## Marco 5 — Copa Legends (mata-mata) e ecossistema
- Primeiro escopo: copa paralela simples no meio da temporada (12 times, jogo único,
  eliminatória), premiação em L$ integrada à economia.
- Depois: supercopa/ecossistema completo, se a liga responder bem.

## Marco 6 — Série A
- **Preferência: elencos reais da Série A quando existirem** (mesmo processo da C e B).
- Ideia interina do Felyp: usar os times da **Kings League Brasil** como Série A provisória e,
  quando a A real entrar, promover os times Kings a **"Mundial de Clubes"** disputado pelo
  campeão da Série A. Ideia registrada e preservada.
- ⚠️ Ressalva registrada: times da Kings League são marcas de um produto comercial de terceiros —
  não são dados da Legends. Risco de IP baixo mas real num jogo distribuído publicamente, e
  conteúdo que qualquer dev pode copiar (dilui o fosso). Alternativas na hora da decisão:
  nomes fictícios de "gigantes" pro Mundial, ou aguardar os times reais da A.

## Marco 7 — Avatar do usuário (parcialmente antecipado no 2.5)
- ✅ Galeria fixa de avatares estilizados: antecipada pro Marco 2.5.
- Pendente aqui: avatar PERSONALIZADO por usuário (geração via GPT Image sob demanda — exige
  pipeline/backend) e cards com rosto de jogador. Decisão de custo/ferramenta na hora.

## Marco 3.5 — Liga Viva (acesso/rebaixamento) — APROVADO
> Emenda de escopo (spec-liga-viva.md + v3-emenda-liga-viva.md). Conecta A/B/C com promoção e
> rebaixamento (2 sobem/2 descem), modo carreira (o técnico acompanha o time). REVERTE a regra
> "elencos voltam à série de origem": agora a DIVISÃO de cada time persiste; elencos seguem reais.
> Kings entra na roda; Mundial de Clubes guardado pra depois. Construir após Marco 2 e Marco 3.

## Marco 4 — Ranking Online (backend) — APROVADO, aguardando a vez
> Decisão explícita do Felyp: ranking REAL com backend (Supabase, cadastro, custo), para
> competição entre todos os jogadores. A construir SÓ depois de Marco 2 (mercado) e Marco 3
> (séries) fecharem e estarem no ar. É a primeira vez que o projeto cruza a fronteira do backend.
- Escopo mínimo: identidade de usuário, envio e armazenamento de campanhas, tabela de ranking
  (pontos/título/artilharia por temporada), leitura pública do ranking.
- **Anti-fraude é requisito, não enfeite:** o jogo roda offline no cliente, então placar enviado
  pelo cliente é falsificável. Sem validação, o ranking vira piada no 1º print forjado. Opções a
  desenhar na spec: validação server-side de plausibilidade, seed/replay determinístico conferido
  no servidor, ou limitar o ranking a métricas difíceis de forjar. Decidir antes de codar.
- **Novas responsabilidades que nascem aqui:** custo mensal ao escalar (Supabase Pro ~US$25 p/
  backups quando houver histórico que dói perder), LGPD (guardar dado de pessoas), autenticação,
  e manutenção contínua (o projeto deixa de ser "R$0, zero servidor").
- Método (v3): quando abrir, escrever spec-ranking.md + emenda ao v3 promovendo do backlog,
  igual foi feito com o mercado. Um marco em voo por vez.
- Pré-requisito saudável: idealmente já ter sinal da liga (Analytics + pedidos espontâneos) de
  que as pessoas terminam temporadas e querem se comparar — reduz o risco de construir no escuro.

## Continua na cerca (sem data)
Multiplayer (Supabase), escudos reais dos times, edição de elenco in-game,
monetização faseada: fase 1 = placeholder de patrocínio (Marco 2.5, feito); fase 2 = vender
patrocínio real da liga usando Analytics como prova de inventário; fase 3 = discutir só com tração real. Destaque discreto de craques (+3 a +5) e presidentes dos
times: anotados, entram quando o Felyp mandar as listas.

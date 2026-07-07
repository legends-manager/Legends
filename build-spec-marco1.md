# build-spec-marco1.md — Especificação técnica (v3 consolidado, single-player)

## 0. Escopo
Single-player: 1 humano vs 11 IAs, 22 rodadas, 12 times reais da Série C com elencos reais.
Esta versão incorpora as emendas pós-v3: elencos reais de tamanho variável, atributos com viés
estatístico + ruído, força 100% interna (sem estrelas na UI), nome do técnico e campeão-pôster.
A demo `legends-manager-demo.jsx` é a referência funcional — este documento é o contrato.

## 1. Estrutura do projeto
```
legends-manager/
├── src/
│   ├── components/
│   │   ├── TelaInicial.jsx      # nome do técnico + escolha de time + continuar/nova
│   │   ├── Escalacao.jsx
│   │   ├── PartidaAoVivo.jsx
│   │   ├── Intervalo.jsx
│   │   ├── Resultado.jsx
│   │   ├── Tabela.jsx
│   │   ├── Artilharia.jsx
│   │   └── TelaCampeao.jsx
│   ├── engine/
│   │   ├── simulador.js         # Poisson, forças internas, mando, fase
│   │   ├── calendario.js        # 22 rodadas (círculo, returno espelhado)
│   │   ├── atributos.js         # base + viés + ruído
│   │   └── craque.js
│   ├── data/
│   │   ├── elencos-reais.js     # 196 jogadores reais (arquivo entregue)
│   │   └── arena.js
│   ├── storage/
│   │   └── saveGame.js
│   └── App.jsx
├── public/
│   ├── manifest.json
│   └── icons/
└── vite.config.js
```

## 2. Ambientação — Arena Novo Horizonte (obrigatório)
`src/data/arena.js`:
```js
export const ARENA = {
  nome: "Arena Novo Horizonte",
  cidade: "Limeira",
  uf: "SP",
  label: "Arena Novo Horizonte — Limeira, SP"
};
```
Usar `ARENA.label` em exatamente três lugares: **PartidaAoVivo** (discreto, sob o placar),
**Resultado** (linha de contexto com a rodada) e **TelaCampeao**. Em nenhum outro.

## 3. Elencos reais
- Fonte única: `src/data/elencos-reais.js` (entregue pronto; 12 times, 11–18 jogadores cada).
- Contrato do jogador: `{ nome, pos: GOL|DEF|MEI|ATA, pos10, g, a, mvp, origem }`.
- **Tamanho variável é regra**: a UI de escalação e o motor não assumem elenco fixo.
- Escalação: sempre 7 titulares = exatamente 1 GOL + 6 de linha (qualquer mix DEF/MEI/ATA).
- **Times com 1 goleiro** (Real União, Sereno FC, Marselha FC, Nordeste FC, Fortaleza,
  Dragon Bola FC): a troca de goleiro no intervalo fica indisponível, com aviso curto na UI.
- Mínimo funcional: ≥7 jogadores e ≥1 GOL (todos os 12 atendem hoje). Se um dia faltar,
  avisar o Felyp — nunca gerar jogador fictício silenciosamente.
- CPF/dados pessoais: proibidos em qualquer arquivo.

## 4. Atributos (viés real + zebra)
Re-sorteados a cada nova temporada:
```
viés  = min(15, 3·g + 2·a + 4·mvp)          // estatísticas reais do Copa10
attr  = clamp(45, 90, 52 + U(0,16) + viés + U(-5,+5))
```
Quem se destacou na vida real começa mais forte, mas o ruído garante variação entre
temporadas e espaço pra zebra. Atributo do jogador é visível (necessário pra escalar).

## 5. Força dos times — 100% interna
- Bolo fixo sorteado automaticamente a cada temporada: multiplicadores
  `2× 1.22 · 3× 1.08 · 4× 0.95 · 3× 0.82` (equivalente às antigas ★★★★★…★★).
- **Nada disso aparece na UI**: sem estrelas, sem botão de re-sortear, sem qualquer
  indicador de força de time. O jogador descobre jogando.
- Fase do time: começa 1,00; vitória +0,04 (teto 1,08), derrota −0,04 (piso 0,92),
  empate mantém. Setas ▲▼ na tabela (fase é visível; força não).

## 6. Simulador (calibração Fut7)
Por metade (2×25 min):
```
λ_metade = 1.7 × mult_interno × fase × (média_attr_titulares / 64) × (mando ? 1.05 : 1)
gols     = Poisson(λ_metade)
```
- Autor do gol ponderado por posição (ATA 3 · MEI 1,6 · DEF 0,5 · GOL 0,05) × attr;
  assistência em ~65% dos gols (ponderação MEI 2,5 · ATA 1,5 · DEF 1).
- Lances perigosos narrados entre os gols (1–2 por time por metade).
- 2º tempo simulado só depois das substituições (elas afetam o λ).
- IA rotaciona: melhor goleiro (20% de chance do reserva, se houver) + 6 melhores de linha
  com 0–2 trocas aleatórias.
- Craque da Partida: gols×3 + assistências×1,5 entre participantes; 0x0 → goleiro de maior attr.
- Referência de sanidade: a rodada 1 real teve 8x4, 6x2, 5x3, 4x3, 5x2, 3x3.

## 7. Técnico e tela de campeão (pôster)
- Tela inicial pede **nome do técnico** (opcional, default "Técnico").
- Tela de campeão é um **pôster pra print**: destaque pro time campeão, nome do técnico,
  pontos, campanha (V-E-D, SG), `ARENA.label` e "Legends Manager · Série C 2026".
  É o mecanismo de ranking informal no WhatsApp — capriche na composição.

## 8. Save / Continue (localStorage)
Chave: `legends-manager:save-v1`.
```js
{
  versao: 1,
  nomeTecnico: "Felyp",
  timeEscolhido: "Dragon Bola FC",
  temporada: {
    rodadaAtual: 7,
    calendario: [...], resultados: [...], tabela: {...},
    artilharia: {...}, fases: {...}, multiplicadoresInternos: {...}
  },
  elencos: { /* com attrs sorteados da temporada e origem por jogador */ },
  ultimaAtualizacao: "2026-07-07T12:00:00Z"
}
```
- Auto-save ao fim de cada rodada (nunca depender do usuário salvar).
- Na abertura: save válido → "Continuar" + "Nova temporada" (nova pede confirmação).
- Novo sorteio interno de forças/atributos só em nova temporada, nunca no meio.
- localStorage indisponível (aba privada/quota): app funciona sem save e avisa uma vez.

## 9. PWA básica
`public/manifest.json`:
```json
{
  "name": "Legends Manager",
  "short_name": "Legends Manager",
  "description": "Série C da Legends Liga Fut7 — Arena Novo Horizonte, Limeira-SP",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0B1712",
  "theme_color": "#0B1712",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```
Vincular no `index.html` (`<link rel="manifest">` + meta `theme-color`). Ícones placeholder
"LM" servem. **Sem service worker offline** no Marco 1. Rodapé fixo "Simulação — BETA".

## 10. Deploy Vercel
1. `npm run build` gera `dist/` sem erros.
2. Repositório no GitHub do Felyp (pode ser privado) → vercel.com → New Project →
   importar → preset Vite → Deploy. Sem variáveis de ambiente.
3. Domínio sugerido: `legendsmanager.vercel.app`. Push na main = deploy automático.

## 11. Checklist de "pronto pra mandar o link"
- [ ] **BLOQUEANTE: Felyp conferiu os 12 elencos (nomes e times) contra o Copa10/grupos.**
- [ ] Loop completo sem crash: escolher time → 22 rodadas → campeão.
- [ ] Save/continue: fechar o navegador no meio e voltar preserva tudo.
- [ ] Nenhum indicador de força de time visível em lugar nenhum.
- [ ] Time com 1 goleiro não oferece troca de goleiro (testar com o Marselha).
- [ ] Arena nos 3 pontos da seção 2, e só neles.
- [ ] Pôster de campeão legível num print de celular.
- [ ] Manifest + "adicionar à tela inicial" testado em 1 Android (e 1 iPhone, se der).
- [ ] Rodapé "Simulação — BETA" visível.
- [ ] Nenhum CPF ou dado pessoal em nenhum arquivo do repositório.

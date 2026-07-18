# Prompts de GPT Image — Lote 1 (seção 6 do PLANO_MESTRE)

**Como usar:** copie cada prompt (o bloco em inglês — modelos de imagem respondem melhor
a inglês, pode colar exatamente como está) no GPT Image. Gere, escolha a melhor variação,
e salve o arquivo na pasta indicada com o nome indicado. Me avise quando estiverem em
`art/` que eu aplico no app — os nomes de arquivo abaixo são os que meu código vai procurar.

**Regra de consistência (vale pra todos):** se o resultado vier fora da paleta (grafite
`#1B1F24`, lime `#C6FF1E`, navy `#141A2E`) ou com texto escrito dentro da arte, gere de
novo — texto a gente põe no app, nunca na imagem.

---

## 1. Insígnias por tier (4 imagens, fundo transparente)

Salvar como: `art/insignias/comum.png`, `raro.png`, `epico.png`, `lendario.png`
(1024×1024, fundo transparente — peça "transparent background" na geração).

### 1a. Comum (aço, sóbria)

```
Game achievement badge icon, shield-shaped medal, brushed steel gray metal (#39424E)
with subtle silver rim, minimal flat-shaded AAA mobile game style like Pokemon GO gym
badges, clean vector look, soft top-down lighting, NO text, NO letters, no background,
transparent background, centered, symmetrical
```

### 1b. Raro (lime)

```
Game achievement badge icon, shield-shaped medal, vibrant lime green (#C6FF1E) enamel
with dark graphite metal frame (#1B1F24), minimal flat-shaded AAA mobile game style like
Pokemon GO gym badges, clean vector look, slight glossy highlight, NO text, NO letters,
no background, transparent background, centered, symmetrical
```

### 1c. Épico (lime com energia)

```
Game achievement badge icon, ornate shield-shaped medal, electric lime green (#C6FF1E)
with energy crackles and light rays bursting behind it, dark graphite metal frame with
angular spikes, AAA mobile game style like Clash Royale rare badges, dramatic rim
lighting, subtle glow, NO text, NO letters, no background, transparent background,
centered, symmetrical
```

### 1d. Lendário (ouro com glow)

```
Legendary game achievement badge icon, majestic shield-shaped medal in radiant gold
(#FFC400) with a small crown on top, intense golden glow and light rays, ornate engraved
metal details, AAA mobile game style like Clash Royale legendary cards, dramatic
cinematic lighting, premium feel, NO text, NO letters, no background, transparent
background, centered, symmetrical
```

---

## 2. Mascote onça (2 poses, corpo inteiro)

Salvar como: `art/mascote/onca-comemorando.png` e `art/mascote/onca-confiante.png`
(1024×1536 retrato, fundo transparente).

### 2a. Comemorando (braços erguidos)

```
Full-body cartoon mascot of a jaguar (onça-pintada) soccer player celebrating with both
arms raised in victory, confident big smile, wearing a black soccer jersey with lime
green (#C6FF1E) jaguar-spot pattern details and a small crown crest on the chest,
athletic pose, FIFA Heroes / Zootopia-style 3D cartoon with attitude, thick clean
outlines, vibrant flat colors with cel shading, full body visible head to feet, NO text,
transparent background, centered
```

### 2b. Braços cruzados (confiante)

```
Full-body cartoon mascot of a jaguar (onça-pintada) soccer player standing with arms
crossed, confident smirk, one eyebrow raised, wearing a black soccer jersey with lime
green (#C6FF1E) jaguar-spot pattern details and a small crown crest on the chest,
powerful stance, FIFA Heroes / Zootopia-style 3D cartoon with attitude, thick clean
outlines, vibrant flat colors with cel shading, full body visible head to feet, NO text,
transparent background, centered
```

---

## 3. Fundo de celebração (2 formatos, sem personagem)

Salvar como: `art/fundos/celebracao-wide.png` (1792×1024, 16:9) e
`art/fundos/celebracao-poster.png` (1024×1280, 4:5).

### 3a. Wide (16:9) — mesma descrição pros dois, só muda o formato

```
Empty soccer stadium at night, blurred crowd stands in dark graphite tones (#1B1F24 and
#141A2E navy), dramatic lime green (#C6FF1E) light rays and lens flares cutting
diagonally across the frame, confetti particles floating, atmospheric depth of field,
AAA mobile game celebration screen background, cinematic, NO people in focus, NO text,
wide 16:9 format
```

### 3b. Pôster (4:5)

```
Empty soccer stadium at night, blurred crowd stands in dark graphite tones (#1B1F24 and
#141A2E navy), dramatic lime green (#C6FF1E) light rays and lens flares cutting
diagonally across the frame, confetti particles floating, atmospheric depth of field,
AAA mobile game celebration screen background, cinematic, NO people in focus, NO text,
vertical 4:5 portrait format with empty space in the center for overlay content
```

---

## 4. Avatares de técnico (9 imagens, estilo consistente)

Salvar como: `art/avatares/tecnico-1.png` até `tecnico-9.png` (1024×1024, fundo
transparente). **Gere um por vez com o mesmo prompt-base, mudando só a linha [PESSOA]**
— é o jeito mais confiável de manter o estilo idêntico entre os 9.

### Prompt-base (substitua [PESSOA] a cada geração)

```
Bust portrait avatar of [PESSOA], soccer coach, wearing a black tracksuit jacket with a
thin lime green (#C6FF1E) collar stripe, friendly confident expression, FIFA Heroes-style
3D cartoon, thick clean outlines, cel shading, soft studio lighting from the top left,
head and shoulders only, NO text, transparent background, centered
```

### As 9 variações de [PESSOA] (diversidade da liga real)

1. `a young Brazilian man with short curly black hair and light beard`
2. `a middle-aged Brazilian man with gray hair and glasses`
3. `a young Black Brazilian woman with braided hair`
4. `a Brazilian man with a shaved head and full dark beard`
5. `an older Brazilian man with white mustache and cap`
6. `a young Brazilian woman with a blonde ponytail`
7. `a Black Brazilian man with short dreadlocks and a big smile`
8. `a Brazilian man with long dark hair tied in a bun`
9. `a middle-aged Brazilian woman with short brown hair and earrings`

---

## O que EU faço quando as artes chegarem

| Arte | Onde entra no app |
|---|---|
| Insígnias por tier | `ConquistaCelebracao` + galeria (`HistoriaCarreira`) + card de share — substituem o círculo com emoji |
| Mascote comemorando | Celebração de acesso/título (junto ou no lugar do hero atual) |
| Mascote confiante | Tela de Entry/momentos de provocação do técnico convidado |
| Fundo celebração wide | Atrás das celebrações de insígnia/fim de temporada |
| Fundo celebração 4:5 | Base dos cards compartilháveis (hoje usam a moldura da onça) |
| Avatares 1-9 | `public/avatars/` — a galeria de avatar do técnico já tem fallback pronto esperando esses arquivos |

Nada quebra enquanto as artes não existem — todo ponto de uso tem fallback (emoji,
crachá de iniciais, moldura atual). Pode gerar aos poucos e ir me mandando.

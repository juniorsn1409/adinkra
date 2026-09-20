// O banner do tsup.config.ts não cobre o consumo direto do workspace
// (package.json aponta "exports" pra src/index.ts) — a diretiva precisa
// estar aqui também. Ver a armadilha equivalente em
// packages/sidebar/src/sidebar.tsx e DECISOES.md.
"use client";

import * as React from "react";
import { iconPaths } from "@adinkra/icons";
import { cn } from "@adinkra/core";

export interface ArcLogoProps {
  /** Palavra no topo, em arco. */
  text?: string;
  /**
   * Raio do semicírculo do topo, em px. Sem essa prop, usa `size * 0.3`.
   * 6ª rodada (17/09, pedido do usuário com um script Python/matplotlib
   * plotando a forma exata): a palavra segue um semicírculo de raio fixo
   * no topo (`x = R·sen(θ), y = -R·cos(θ)`, θ de -90° a +90°) que, se
   * sobrar letra, continua RETO — não mais curvo — descendo pelas
   * laterais (`x` fixo em `±R`, ângulo travado em ±90°, mesma tangente de
   * onde a curva parou). Substitui a parábola da rodada anterior (5ª): o
   * usuário deixou claro que "arco" não podia virar sinônimo de rotação
   * livre nem de curva que afina no topo — é um raio CONSTANTE.
   */
  arc?: number;
  /**
   * O quanto o trecho reto (o que sobra de letra além do semicírculo)
   * pode descer, em múltiplos do raio do sol — `straightTargetY = sunCy +
   * sunRadius * tailLength`. Sem essa prop, usa 2.5. Exposto (17/09,
   * pedido do usuário — "mais form na demo pra customizacao desse valor")
   * depois de aumentar o valor fixo que causava letras comprimidas no
   * trecho reto pra palavras longas.
   */
  tailLength?: number;
  /**
   * Posição vertical do sol (e, junto com ele, raios/Sankofa/ano — todos
   * calculados a partir dele), como fração de `size` (0 = topo, 1 = base).
   * Sem essa prop, usa 0.5. Exposto (17/09, pedido do usuário — "uma
   * propriedade pra diminuir a altura entre o texto e a logo") pra
   * controlar a distância entre a palavra (sempre no topo) e o resto da
   * composição sem precisar editar o componente.
   */
  logoY?: number;
  /**
   * Slug de qualquer símbolo de `@adinkra/icons` (ex.: "sankofa",
   * "gye-nyame", "akoma") — emblema central, "desenhado" ao vivo. Sem essa
   * prop, usa "sankofa". Generalizado (17/09, pedido do usuário — "eu
   * quero animar o arcText inteiro desenhar o path que tiver servindo de
   * icon no momento"): antes o Sankofa era fixo no código; a mecânica de
   * "desenhar" (`getTotalLength`/`stroke-dasharray`) já era genérica, só
   * faltava deixar o ÍCONE em si trocável. Slug inválido cai pro Sankofa.
   */
  icon?: keyof typeof iconPaths;
  /** Nome exibido no vão entre "20" e "26", embaixo. Sem essa prop, repete `text`. */
  brandText?: string;
  /** Ano exibido embaixo, partido ao meio ("2026" -> "20"/"26"). */
  year?: string;
  /** Multiplicador da distância dos raios até o sol (1 = padrão, maior afasta). */
  rayDistance?: number;
  /** Mostrar os raios (leque em volta do sol). */
  showRays?: boolean;
  /** Diâmetro total do selo, em px. */
  size?: number;
  /** Liga o parallax de toda a composição (sol, raios, ícone, palavra, ano) — ver DECISOES.md. */
  parallax?: boolean;
  /** Preenche o ícone com cor (fade-in depois que o traço termina), além do contorno. */
  filled?: boolean;
  className?: string;
}

// `Math.sin`/`Math.cos` podem devolver o último bit diferente entre o
// motor JS do servidor (Node) e do navegador pro MESMO input (libm não é
// garantida bit-a-bit idêntica entre eles) — descoberto via um erro real de
// hydration mismatch (18/09) num `y1` de `spikes` (`125.48403532281085` no
// server vs `...84` no client). Arredondar pra 2 casas decimais (bem além
// da precisão visual necessária num SVG) garante o mesmo valor nos dois
// lados. Usado em todo cálculo trigonométrico deste arquivo.
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

const RAY_COUNT = 14;
// Espaçamento angular por raio dentro do semicírculo (mesma ideia de
// ANGLE_PER_LETTER, abaixo) — define quantos dos 14 raios cabem no
// semicírculo de 180° antes do excedente virar "trecho reto" pelas
// laterais (ver `rays` mais abaixo).
const RAY_ANGLE_PER_RAY = 16;
const RAY_CURVE_CAPACITY = Math.floor(180 / RAY_ANGLE_PER_RAY) + 1;
// Espinhos do hover do sol (360°, ver `spikes` abaixo) — mais numerosos e
// curtos que os raios, pra parecer "eriçado" e não um segundo leque.
const SPIKE_COUNT = 20;
// Espaçamento angular confortável por letra na curva — define quantas
// letras cabem no semicírculo (180°) antes de precisar do trecho reto.
const ANGLE_PER_LETTER = 18;

/**
 * Composição maior no espírito do `ArcText` (mecânica própria, não usa o
 * componente por dentro — 17/09/2026, mesma sessão/pedido do usuário —
 * sol e raios da referência original de volta, ano trocado de "2023" pra
 * "2026", e a ilustração do peru trocada por um Sankofa animado). Selo:
 * palavra no topo, sol+raios como halo, Sankofa centralizado sobre o sol
 * como emblema, ano partido ao meio embaixo.
 *
 * Sol e raios usam `--primary` (o laranja do redesign sidebar.io) — por
 * coincidência é quase a mesma cor que o sol da referência original já
 * era (`#fe911b`), não foi ajuste manual.
 *
 * **Sankofa "tenta desenhar"** (pedido explícito do usuário, resultado
 * experimental): reaproveita o path já vetorizado de `@adinkra/icons`
 * (não um desenho novo) mas troca `fill` por `stroke` +
 * `stroke-dasharray`/`dashoffset` medidos em runtime (`getTotalLength`,
 * duas fases — `useLayoutEffect` mede antes do primeiro paint, um efeito
 * seguinte revela um frame depois, senão a primeira pintura já sai
 * "desenhada" e não haveria nada pra animar) — mesma técnica do jQuery
 * do CodePen original (`getTotalLength` + `stroke-dasharray`), sem
 * jQuery. Ressalva registrada em DECISOES.md: esse path foi desenhado pra
 * PREENCHER (`fillRule: evenodd`, vários subpaths sobrepostos pra criar
 * vazios) — traçado como contorno pode sair mais "rabiscado" que o ícone
 * preenchido normal; se não ficar bom, o próximo passo é desenhar um
 * Sankofa de contorno único, feito pra ser traçado (como o peru da
 * referência original era).
 *
 * **Linha do tempo da entrada, ~3s no total** (pedido do usuário original —
 * "animacao ta muito rapida, coloca uns 7 segundos pra completar" — depois
 * encurtada de novo, "coloca a animaca completa em 3segundos": todos os
 * tempos abaixo escalados pelo mesmo fator, ~0.43×, mantendo a MESMA
 * proporção relativa entre as partes): palavra termina ~0.5s (stagger de
 * 40ms por letra) · sol termina em 0.5s · Sankofa desenha dos 0.35s aos
 * 2.5s (o evento principal, por isso o mais lento) · ano aparece por
 * último, dos 2.57s aos 3s. Os raios ficam de fora dessa conta — são um
 * loop contínuo (`infinite alternate`), não têm "fim".
 *
 * **Posicionamento da palavra — 6ª rodada, semicírculo + reto (17/09)**:
 * o usuário mandou um script Python/matplotlib plotando a forma exata que
 * queria — um arco de RAIO CONSTANTE (não uma parábola, que afina no
 * vértice; não uma rotação por letra em volta da própria base) no topo,
 * conectando em TANGENTE (sem quebra) com duas retas verticais descendo
 * dos dois lados. Implementado como: palavra curta cabe inteira no
 * semicírculo, com espaçamento natural (não esticado até 180° à toa);
 * palavra longa preenche os 180° do semicírculo e o excedente vira
 * posições retas descendo dos dois lados, ângulo travado em ±90° (mesma
 * tangente de onde a curva parou) — geometria idêntica à da 3ª rodada,
 * que tinha sido abandonada por engano ao interpretar mal a técnica da
 * referência CSS original (5ª/4ª rodadas). Cada letra é posicionada em
 * `(x,y)` absoluto com `transform: translate(-50%,-50%) rotate(ângulo)`
 * — seguro porque o pivô do `rotate` e o ponto do `translate` são o
 * mesmo (o centro da própria letra), diferente do bug de composição
 * documentado nas primeiras tentativas (`ArcText`, `translateX+rotate`
 * com pivô compartilhado).
 */
// Resistência única pra toda a composição (18/09, pedido do usuário —
// "deixa o efeito paralaxx igual pra todo o Arc") — antes cada elemento
// (ícone, sol, palavra+raios) tinha um peso diferente, imitando as
// resistências distintas por elemento da referência original (60/150/300).
// Agora tudo se move junto, como um bloco só.
const PARALLAX_RESISTANCE = 150;

export function ArcLogo({
  text = "Adinkra",
  arc,
  tailLength = 2.5,
  logoY = 0.5,
  icon = "sankofa",
  brandText = text,
  year = "2026",
  rayDistance = 1,
  showRays = true,
  size = 220,
  parallax = true,
  filled = true,
  className,
}: ArcLogoProps) {
  const [mounted, setMounted] = React.useState(false);
  const [reducedMotion, setReducedMotion] = React.useState(false);
  const [sankofaLength, setSankofaLength] = React.useState<number | null>(null);
  const [sankofaRevealed, setSankofaRevealed] = React.useState(false);
  const sankofaRef = React.useRef<SVGPathElement>(null);
  const sankofaGroupRef = React.useRef<SVGSVGElement>(null);
  const wordGroupRef = React.useRef<HTMLDivElement>(null);
  const raysGroupRef = React.useRef<SVGSVGElement>(null);
  const sunGroupRef = React.useRef<SVGSVGElement>(null);
  const yearStartRef = React.useRef<HTMLDivElement>(null);
  const yearEndRef = React.useRef<HTMLDivElement>(null);
  const brandRef = React.useRef<HTMLDivElement>(null);

  // Fase 1 — mede o comprimento real do traço ANTES do navegador pintar,
  // pra já nascer "escondido" no comprimento certo (sem um frame com o
  // valor de fallback aparecendo primeiro). Depende de `icon` (17/09,
  // pedido do usuário — "animar... o path que tiver servindo de icon no
  // momento"): trocar de ícone precisa remedir o comprimento (cada símbolo
  // tem um traço de tamanho diferente) e voltar a esconder antes de
  // revelar de novo — sem isso, trocar o ícone só trocaria o desenho sem
  // repetir a animação.
  React.useLayoutEffect(() => {
    setSankofaRevealed(false);
    if (sankofaRef.current) setSankofaLength(sankofaRef.current.getTotalLength());
  }, [icon]);

  // Fase 2 — um frame depois, revela de verdade: precisa ser um commit à
  // parte do da fase 1, senão o navegador nunca chega a pintar o estado
  // "escondido" e não sobra nada pra fazer a transição de CSS animar.
  React.useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    setMounted(true);
    if (sankofaLength == null) return;
    const raf = requestAnimationFrame(() => setSankofaRevealed(true));
    return () => cancelAnimationFrame(raf);
  }, [sankofaLength]);

  // Parallax no ícone (resistência menor, reage mais — mesma proporção do
  // "turkey-container" na referência original) e, de volta (17/09, pedido
  // do usuário — "eu quero as animações que acontecem aqui [CodePen]",
  // reabrindo a decisão anterior de "só o ícone"), na palavra+raios juntos
  // (resistência maior, reage MENOS — mesma proporção do "h1, h2,
  // rays-container" da referência, que sempre foi mais sutil que o
  // personagem central).
  React.useEffect(() => {
    if (!parallax || reducedMotion) return;
    const iconGroup = sankofaGroupRef.current;
    const wordGroup = wordGroupRef.current;
    const raysGroup = raysGroupRef.current;
    const sunGroup = sunGroupRef.current;
    const yearStartEl = yearStartRef.current;
    const yearEndEl = yearEndRef.current;
    const brandEl = brandRef.current;

    // Um conjunto de escritas de estilo por frame, não por evento.
    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;

    function handleMove(event: PointerEvent) {
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (frame === 0) frame = requestAnimationFrame(update);
    }

    function update() {
      frame = 0;
      const dx = pointerX - window.innerWidth / 2;
      const dy = pointerY - window.innerHeight / 2;
      const transform = `translate(${(-dx / PARALLAX_RESISTANCE).toFixed(2)}px, ${(-dy / PARALLAX_RESISTANCE).toFixed(2)}px)`;
      if (iconGroup) iconGroup.style.transform = transform;
      if (sunGroup) sunGroup.style.transform = transform;
      if (wordGroup) wordGroup.style.transform = transform;
      if (raysGroup) raysGroup.style.transform = transform;
      if (yearStartEl) yearStartEl.style.transform = `translateX(-50%) ${transform}`;
      if (yearEndEl) yearEndEl.style.transform = `translateX(-50%) ${transform}`;
      if (brandEl) brandEl.style.transform = `translateX(-50%) ${transform}`;
    }

    document.addEventListener("pointermove", handleMove);
    return () => {
      document.removeEventListener("pointermove", handleMove);
      if (frame) cancelAnimationFrame(frame);
      if (iconGroup) iconGroup.style.transform = "";
      if (wordGroup) wordGroup.style.transform = "";
      if (raysGroup) raysGroup.style.transform = "";
      if (sunGroup) sunGroup.style.transform = "";
      if (yearStartEl) yearStartEl.style.transform = "translateX(-50%)";
      if (yearEndEl) yearEndEl.style.transform = "translateX(-50%)";
      if (brandEl) brandEl.style.transform = "translateX(-50%)";
    };
  }, [parallax, reducedMotion]);

  const sunRadius = size * 0.15;
  const sunCx = size / 2;
  // Mais perto da palavra (17/09, pedido do usuário — "o texto e o
  // circulo deviam estar mais perto"): era 0.80, deixava um vão grande
  // entre a base da palavra e o topo do sol. Virou a prop `logoY` (default
  // 0.5) logo em seguida, pra dar pra ajustar sem editar o componente.
  const sunCy = size * logoY;
  // `rayDistance` (18/09, pedido do usuário — "quero a opcao de afasta os
  // raios de sol tambem") multiplica os dois raios do leque — afasta (ou
  // aproxima, <1) sem mudar o tamanho do próprio sol.
  const innerR = sunRadius * 1.15 * rayDistance;
  const outerR = sunRadius * 1.9 * rayDistance;

  // Leque de raios em volta do sol (-110° a +110°) — distribuição uniforme
  // dos RAY_COUNT raios nesse intervalo de 220°.
  const rays = React.useMemo(() => {
    return Array.from({ length: RAY_COUNT }, (_, index) => {
      const angleDeg = -110 + (index * 220) / (RAY_COUNT - 1 || 1);
      const rad = (angleDeg * Math.PI) / 180;
      const rayOuterR = index % 2 === 0 ? outerR : innerR + (outerR - innerR) * 0.6;
      const x1 = round2(sunCx + innerR * Math.sin(rad));
      const y1 = round2(sunCy - innerR * Math.cos(rad));
      const x2 = round2(sunCx + rayOuterR * Math.sin(rad));
      const y2 = round2(sunCy - rayOuterR * Math.cos(rad));
      const length = rayOuterR - innerR;
      return { index, x1, y1, x2, y2, length };
    });
  }, [sunCx, sunCy, innerR, outerR]);

  // Anel de espinhos 360° em volta do sol, só revelado no hover (ver o
  // `group`/`group-hover` no JSX abaixo) — diferente dos raios (semicírculo
  // + reto, sempre visíveis), cobre o círculo todo.
  const spikes = React.useMemo(
    () =>
      Array.from({ length: SPIKE_COUNT }, (_, index) => {
        const angleDeg = (index * 360) / SPIKE_COUNT;
        const rad = (angleDeg * Math.PI) / 180;
        const spikeOuterR = sunRadius * (index % 2 === 0 ? 1.45 : 1.25);
        return {
          index,
          x1: round2(sunCx + sunRadius * 1.05 * Math.sin(rad)),
          y1: round2(sunCy - sunRadius * 1.05 * Math.cos(rad)),
          x2: round2(sunCx + spikeOuterR * Math.sin(rad)),
          y2: round2(sunCy - spikeOuterR * Math.cos(rad)),
        };
      }),
    [sunCx, sunCy, sunRadius],
  );

  const half = Math.ceil(year.length / 2);
  const yearStart = year.slice(0, half);
  const yearEnd = year.slice(half);

  // Semicírculo (raio constante) + reto pra baixo pro que sobrar — ver o
  // comentário do tipo `arc` e o docblock da função acima pra todo o
  // raciocínio.
  const curveRadius = arc ?? size * 0.3;
  const wordPivotX = size / 2;
  const wordPivotY = curveRadius + size * 0.03;
  // Até onde o trecho reto desce, quando existe — perto do sol, sem
  // precisar chegar exatamente na linha do ano.
  // Aumentado (17/09, pedido do usuário — "as palavra tao sendo
  // comprimidas no final da parabola tem como aumentar"): era `sunCy -
  // sunRadius*0.3` (só ~28px de trecho reto), pouco espaço pra qualquer
  // excedente de letra, comprimindo tudo perto do fim da curva. O trecho
  // reto fica em `x = wordPivotX ± curveRadius`, fora da faixa horizontal
  // do sol (`sunCx ± sunRadius`), então descer mais não esbarra nele.
  // Virou a prop `tailLength` (default 2.5) logo em seguida.
  const straightTargetY = sunCy + sunRadius * tailLength;
  const straightLen = Math.max(straightTargetY - wordPivotY, 0);
  const curveCapacity = Math.floor(180 / ANGLE_PER_LETTER) + 1;

  const letters = React.useMemo(() => Array.from(text), [text]);
  const letterPoints = React.useMemo(() => {
    const n = letters.length;
    if (n === 0) return [] as { ch: string; x: number; y: number; angle: number }[];

    // Palavra curta: só a curva, com o espaçamento natural dela (não
    // esticada até 180° à toa).
    if (n <= curveCapacity) {
      const curveArc = ANGLE_PER_LETTER * (n - 1);
      const start = -curveArc / 2;
      const step = n > 1 ? curveArc / (n - 1) : 0;
      return letters.map((ch, i) => {
        const angleDeg = start + i * step;
        const rad = (angleDeg * Math.PI) / 180;
        return {
          ch,
          x: round2(wordPivotX + curveRadius * Math.sin(rad)),
          y: round2(wordPivotY - curveRadius * Math.cos(rad)),
          angle: angleDeg,
        };
      });
    }

    // Palavra longa: semicírculo cheio (180°, curveCapacity letras) + o
    // resto reto pros lados, ângulo travado em ±90° (a mesma tangente de
    // onde a curva parou), preenchendo sempre o mesmo `straightLen`.
    const extra = n - curveCapacity;
    const leftExtra = Math.ceil(extra / 2);
    const rightExtra = extra - leftExtra;
    const points: { ch: string; x: number; y: number; angle: number }[] = [];

    for (let i = leftExtra; i >= 1; i--) {
      const t = i / (leftExtra + 1);
      points.push({ ch: "", x: wordPivotX - curveRadius, y: wordPivotY + t * straightLen, angle: -90 });
    }
    for (let i = 0; i < curveCapacity; i++) {
      const angleDeg = -90 + (i * 180) / (curveCapacity - 1);
      const rad = (angleDeg * Math.PI) / 180;
      points.push({
        ch: "",
        x: round2(wordPivotX + curveRadius * Math.sin(rad)),
        y: round2(wordPivotY - curveRadius * Math.cos(rad)),
        angle: angleDeg,
      });
    }
    for (let i = 1; i <= rightExtra; i++) {
      const t = i / (rightExtra + 1);
      points.push({ ch: "", x: wordPivotX + curveRadius, y: wordPivotY + t * straightLen, angle: 90 });
    }

    letters.forEach((ch, i) => {
      points[i]!.ch = ch;
    });
    return points;
  }, [letters, curveCapacity, wordPivotX, wordPivotY, curveRadius, straightLen]);

  // `icon` agora é qualquer slug de @adinkra/icons (era só "sankofa" fixo)
  // — cai pro Sankofa se vier um slug que não existe em iconPaths.
  const sankofa = iconPaths[icon] ?? iconPaths.sankofa!;
  // Maior que o diâmetro do sol de propósito (17/09, pedido do usuário —
  // "faca mais parecido com isso", referência com o peru claramente maior
  // que o círculo, ultrapassando a borda em cima/do lado). Revisa a
  // correção anterior (que encolhia pra caber INTEIRO dentro do sol) —
  // aqui o objetivo é o oposto, um emblema que "vaza" o círculo.
  const sankofaSize = sunRadius * 1.9;
  // Ano perto do Sankofa (17/09, pedido do usuário — "20 e 26 ficou
  // distante deveria ficar junto"): antes ficava preso no `bottom-0` do
  // selo inteiro — quando o sol subiu (pedido anterior, "mais perto da
  // palavra"), sobrou um vão grande embaixo dele. Calculado a partir da
  // borda de baixo do Sankofa (que já é maior que o sol, `sankofaSize`),
  // não mais fixo na base do componente.
  // Gap reduzido (17/09, pedido do usuário — "deixa o ano um pouco mais
  // junto"): era size*0.05.
  const yearTop = sunCy + sankofaSize / 2 + size * 0.02;

  // Altura real do selo (era sempre `size`, um quadrado, deixando um vão
  // vazio embaixo do ano): vai até o fim do ano (~26px de linha + borda) ou
  // até a última letra do trecho reto da palavra, o que descer mais.
  const lastLetterBottom = letters.length > curveCapacity ? straightTargetY + 14 : 0;
  const height = Math.ceil(Math.max(yearTop + 26, lastLetterBottom));

  return (
    <div className={cn("relative", className)} style={{ width: size, height }}>
      <style>{`
        @keyframes adinkra-arc-logo-ray {
          from { stroke-dashoffset: var(--ray-length); }
          to { stroke-dashoffset: 0; }
        }
      `}</style>

      {/* Raios: leque acima do sol, cada um desenha/apaga em loop, atraso
          escalonado pra não brilhar tudo em sincronia. */}
      {showRays && (
      <svg
        ref={raysGroupRef}
        aria-hidden
        viewBox={`0 0 ${size} ${height}`}
        className="absolute inset-0 text-primary transition-transform duration-[2000ms] ease-out"
        style={{ width: size, height }}
      >
        {rays.map((ray) => (
          <line
            key={ray.index}
            x1={ray.x1}
            y1={ray.y1}
            x2={ray.x2}
            y2={ray.y2}
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray={ray.length}
            style={
              {
                "--ray-length": ray.length,
                animation: `adinkra-arc-logo-ray ${1.6 + (ray.index % 3) * 0.2}s ease-out infinite alternate`,
                animationDelay: `${(ray.index % 2) * 0.6}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </svg>
      )}

      {/* Sol: círculo cheio, some/aparece junto com o resto. O deslize pra
          esquerda ao aparecer foi revertido (pedido do usuário — "volta o
          sol pra posicao anterior") — só o fade fica. Os 2 pontinhos
          decorativos que existiam no disco saíram antes (pedido do usuário
          — "tira os dois pontos"). `group` + `group-hover` (17/09, pedido
          do usuário — "quero o sol fique todo espetado quando mouse passar
          por cima"): anel de espinhos 360° ao redor do círculo, escondido
          por padrão, revelado só com CSS — sem JS extra, o hover já é só
          sobre a área pintada do `<circle>` (SVG só dispara hover na
          forma preenchida, não no canvas transparente ao redor). */}
      <svg
        ref={sunGroupRef}
        aria-hidden
        viewBox={`0 0 ${size} ${height}`}
        className="group absolute inset-0 text-primary transition-[opacity,transform] duration-[2000ms] ease-out"
        style={{ width: size, height, opacity: mounted ? 1 : 0 }}
      >
        <circle cx={sunCx} cy={sunCy} r={sunRadius} fill="currentColor" />
        <g className="pointer-events-none opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100">
          {spikes.map((spike) => (
            <line
              key={spike.index}
              x1={spike.x1}
              y1={spike.y1}
              x2={spike.x2}
              y2={spike.y2}
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          ))}
        </g>
      </svg>

      {/* Ícone (prop `icon`, default Sankofa): emblema central sobre o sol,
          desenhado ao vivo cada vez que troca ("fase 1/2" acima), único
          elemento com parallax (ver useEffect acima). Preenchimento (18/09,
          pedido do usuário — "tem como preencher o sankofa-swirl com
          cor?") entra como um SEGUNDO `<path>` por cima, com `fill` em vez
          de `stroke` — não dá pra só trocar `fill="none"` por
          `fill="currentColor"` no path do traço: o preenchimento apareceria
          inteiro desde o frame 0 (fill não segue `stroke-dashoffset`),
          destruindo o efeito de "desenhar ao vivo". Em vez disso o
          preenchimento faz fade-in DEPOIS que o traço termina (delay
          2500ms = os mesmos 350ms+2150ms do traço), como se o contorno
          desenhasse e só então "ganhasse cor". */}
      <svg
        ref={sankofaGroupRef}
        aria-label={icon}
        role="img"
        viewBox={sankofa.viewBox}
        className="absolute text-secondary transition-transform duration-[2000ms] ease-out"
        style={{ width: sankofaSize, height: sankofaSize, left: sunCx - sankofaSize / 2, top: sunCy - sankofaSize / 2 }}
      >
        {filled && (
          <path
            d={sankofa.d}
            fill="currentColor"
            fillRule={sankofa.fillRule}
            opacity={mounted ? 1 : 0}
            style={{ transition: "opacity 500ms ease-out 2000ms" }}
          />
        )}
        <path
          ref={sankofaRef}
          d={sankofa.d}
          fill="none"
          stroke="currentColor"
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={sankofaLength ?? undefined}
          strokeDashoffset={sankofaLength == null ? undefined : sankofaRevealed ? 0 : sankofaLength}
          // Traço lento de propósito — é o evento principal da entrada
          // (pedido do usuário: animação inteira levando uns 7s pra
          // completar; ver o resto do timeline nos comentários acima).
          style={{ transition: "stroke-dashoffset 2.15s ease-out 350ms" }}
        />
      </svg>

      {/* Palavra, no topo — cada letra em (x,y) do semicírculo/reto,
          rotacionada pra acompanhar a tangente da curva (ou travada em
          ±90° no trecho reto). */}
      <div
        ref={wordGroupRef}
        role="img"
        aria-label={text}
        className="absolute inset-0 z-10 select-none font-display font-bold uppercase tracking-[0.08em] text-secondary transition-transform duration-[2000ms] ease-out"
      >
        {letterPoints.map((point, index) => (
          <span
            key={index}
            aria-hidden
            className="absolute transition-opacity duration-[2000ms] ease-out"
            style={{
              left: point.x,
              top: point.y,
              transform: `translate(-50%, -50%) rotate(${point.angle}deg)`,
              opacity: mounted ? 1 : 0,
              transitionDelay: mounted ? `2000ms` : "0ms",
            }}
          >
            {point.ch === " " ? " " : point.ch}
          </span>
        ))}
      </div>

      {/* Ano, partido ao meio, logo abaixo do Sankofa — cada metade
          alinhada com a reta do raio da curva (x = wordPivotX ∓
          curveRadius, pedido do usuário — "o 20 e 26 deveria fica na reta
          do raio da curva"), não mais um padding fixo (px-[8%]) solto. */}
      <div
        ref={yearStartRef}
        className="absolute font-display text-sm font-bold tracking-[0.1em] text-heading transition-opacity duration-[2000ms] ease-out"
        style={{
          top: yearTop,
          left: wordPivotX - curveRadius,
          transform: "translateX(-50%)",
          opacity: mounted ? 1 : 0,
          transitionDelay: mounted ? "2000ms" : "0ms",
        }}
      >
        <span className="border-b-2 border-secondary pb-0.5 text-secondary">{yearStart}</span>
      </div>
      {/* Nome no meio do ano, entre "20" e "26" (18/09, pedido do usuário —
          "o espaco entre 20 e 26 coloca a palavra a adinkra e deixa com a
          mesma cor do ArcText e efeito paralaxx"): mesma cor da palavra em
          arco (`text-secondary`) e entra no mesmo grupo de parallax que
          ela/ano/raios. Prop própria (`brandText`, pedido do usuário —
          "na customizacao pode ser palavra diferentes") em vez de repetir
          `text` sempre — sem passar, cai pro mesmo valor de `text`. */}
      <div
        ref={brandRef}
        className="absolute select-none font-display text-sm font-bold uppercase tracking-[0.1em] text-secondary transition-opacity duration-[2000ms] ease-out"
        style={{
          top: yearTop,
          left: wordPivotX,
          transform: "translateX(-50%)",
          opacity: mounted ? 1 : 0,
          transitionDelay: mounted ? "2000ms" : "0ms",
        }}
      >
        {brandText}
      </div>
      <div
        ref={yearEndRef}
        className="absolute font-display text-sm font-bold tracking-[0.1em] text-heading transition-opacity duration-[2000ms] ease-out"
        style={{
          top: yearTop,
          left: wordPivotX + curveRadius,
          transform: "translateX(-50%)",
          opacity: mounted ? 1 : 0,
          transitionDelay: mounted ? "2000ms" : "0ms",
        }}
      >
        <span className="border-b-2 border-secondary pb-0.5 text-secondary">{yearEnd}</span>
      </div>
    </div>
  );
}

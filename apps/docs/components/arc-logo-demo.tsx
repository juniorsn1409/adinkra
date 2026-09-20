"use client";

import * as React from "react";
import { ArcLogo } from "@adinkra/arc-text";
import { iconPaths } from "@adinkra/icons";
import { Input } from "@adinkra/input";
import { Switch } from "@adinkra/switch";
import { Toggle } from "@adinkra/toggle";
import { useLang } from "./language";

// Precisa de estado (inputs ao vivo + reiniciar a animação) — por isso vive
// num componente à parte, não direto no MDX (que não tem hooks). `key` no
// ArcLogo força remontagem completa quando o replay dispara: mais simples
// que ensinar o componente a "resetar" sozinho, e o mesmo truque de sempre
// pra reiniciar animação disparada por mount (useLayoutEffect/useEffect).
export function ArcLogoDemo() {
  const { t } = useLang();
  const [text, setText] = React.useState("Adinkra");
  const [brandText, setBrandText] = React.useState("Adinkra");
  const [year, setYear] = React.useState("2026");
  const [size, setSize] = React.useState(200);
  const [autoArc, setAutoArc] = React.useState(true);
  const [arc, setArc] = React.useState(60);
  const [tailLength, setTailLength] = React.useState(2.5);
  const [logoY, setLogoY] = React.useState(0.5);
  const [icon, setIcon] = React.useState("sankofa-swirl");
  const [rayDistance, setRayDistance] = React.useState(1);
  const [showRays, setShowRays] = React.useState(true);
  const [parallax, setParallax] = React.useState(true);
  const [filled, setFilled] = React.useState(true);
  const [replayCount, setReplayCount] = React.useState(0);

  return (
    <div className="flex w-full flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-center">
      {/* Selo centralizado no espaço à esquerda (pedido do usuário —
          "deixa o arclogo centralizado no meio a esquerda"), não mais
          colado ao lado dos inputs. */}
      <div className="flex w-full items-center justify-center lg:flex-1">
        <ArcLogo
          key={replayCount}
          text={text}
          brandText={brandText}
          year={year}
          size={size}
          arc={autoArc ? undefined : arc}
          tailLength={tailLength}
          logoY={logoY}
          icon={(icon in iconPaths ? icon : "sankofa") as keyof typeof iconPaths}
          parallax={parallax}
          filled={filled}
          rayDistance={rayDistance}
          showRays={showRays}
        />
      </div>
      {/* 2 colunas (pedido do usuário — "faz duas colunas na direita com
          os inputs"), em vez de uma coluna só descendo — muitos campos
          acumulados nas últimas rodadas deixaram a lista comprida demais. */}
      <div className="grid w-full max-w-xl grid-cols-2 gap-3">
        <Input label={t("demo.arc.text")} value={text} onChange={(event) => setText(event.target.value)} />
        {/* Separado do "Texto" (pedido do usuário — "na customizacao pode
            ser palavra diferentes") — antes o nome no meio do ano sempre
            repetia a mesma palavra do arco. */}
        <Input label={t("demo.arc.below")} value={brandText} onChange={(event) => setBrandText(event.target.value)} />
        <Input label={t("demo.arc.year")} value={year} onChange={(event) => setYear(event.target.value)} />
        <Input
          label={t("demo.arc.size")}
          type="number"
          min={120}
          max={320}
          value={size}
          onChange={(event) => setSize(Number(event.target.value) || 0)}
        />
        {/* Só faz sentido digitar um valor manual com o automático
            desligado — senão o número aqui nem seria usado (ArcLogo ignora
            `arc` quando ele é undefined). Raio do semicírculo em PX (6ª
            rodada — arco de raio constante + reto pros lados quando sobra
            letra, não mais parábola nem rotação por letra), não graus nem
            profundidade. */}
        <Input
          label={t("demo.arc.radius")}
          type="number"
          min={20}
          max={150}
          disabled={autoArc}
          value={arc}
          onChange={(event) => setArc(Number(event.target.value) || 0)}
        />
        {/* Quanto o trecho reto (o excedente de letra além do semicírculo)
            pode descer, em múltiplos do raio do sol — pedido do usuário
            depois de aumentar o valor fixo que comprimia letras longas. */}
        <Input
          label={t("demo.arc.tail")}
          type="number"
          min={0.5}
          max={6}
          step={0.5}
          value={tailLength}
          onChange={(event) => setTailLength(Number(event.target.value) || 0)}
        />
        {/* Distância entre a palavra e o resto da composição (sol/raios/
            Sankofa/ano, todos calculados a partir do sol) — pedido do
            usuário pra dar pra ajustar sem editar o componente. */}
        <Input
          label={t("demo.arc.sunY")}
          type="number"
          min={0.2}
          max={0.8}
          step={0.05}
          value={logoY}
          onChange={(event) => setLogoY(Number(event.target.value) || 0)}
        />
        {/* Qualquer slug de @adinkra/icons (ex.: gye-nyame, akoma, aban) —
            pedido do usuário pra animar "o path que tiver servindo de
            icon no momento", não só o Sankofa fixo. Slug inválido cai pro
            Sankofa (ArcLogo já trata isso). */}
        <Input label={t("demo.arc.icon")} value={icon} onChange={(event) => setIcon(event.target.value)} />
        {/* Multiplicador da distância do leque de raios até o sol — pedido
            do usuário pra dar pra afastar (ou aproximar) sem editar o
            componente. */}
        <Input
          label={t("demo.arc.rayDistance")}
          type="number"
          min={0.5}
          max={3}
          step={0.1}
          value={rayDistance}
          onChange={(event) => setRayDistance(Number(event.target.value) || 0)}
        />
        {/* Switches agrupados juntos (pedido do usuário), não espalhados
            entre os inputs numéricos — ocupam as 2 colunas (`col-span-2`). */}
        <div className="col-span-2 grid grid-cols-2 gap-2 pt-1">
          <div className="flex items-center gap-2.5">
            <Switch id="arc-logo-auto-arc" checked={autoArc} onCheckedChange={setAutoArc} />
            <label htmlFor="arc-logo-auto-arc" className="font-display text-sm text-heading">
              {t("demo.arc.autoRadius")}
            </label>
          </div>
          <div className="flex items-center gap-2.5">
            <Switch id="arc-logo-parallax" checked={parallax} onCheckedChange={setParallax} />
            <label htmlFor="arc-logo-parallax" className="font-display text-sm text-heading">
              Parallax
            </label>
          </div>
          <div className="flex items-center gap-2.5">
            <Switch id="arc-logo-filled" checked={filled} onCheckedChange={setFilled} />
            <label htmlFor="arc-logo-filled" className="font-display text-sm text-heading">
              {t("demo.arc.filled")}
            </label>
          </div>
          <div className="flex items-center gap-2.5">
            <Switch id="arc-logo-show-rays" checked={showRays} onCheckedChange={setShowRays} />
            <label htmlFor="arc-logo-show-rays" className="font-display text-sm text-heading">
              {t("demo.arc.showRays")}
            </label>
          </div>
        </div>
        {/* "Toggle", não Button (pedido do usuário) — o valor ligado/desligado
            em si não importa, cada clique (nos dois sentidos) dispara o replay.
            variant="outline" (pedido do usuário) — sem preenchimento sólido,
            ação secundária/utilitária, não compete com o selo em si. */}
        <Toggle
          variant="outline"
          className="col-span-2"
          onPressedChange={() => setReplayCount((count) => count + 1)}
        >
          {t("demo.arc.replay")}
        </Toggle>
      </div>
    </div>
  );
}

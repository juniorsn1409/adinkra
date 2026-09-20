"use client";

import * as React from "react";
import { Button } from "@adinkra/button";
import { Progress } from "@adinkra/progress";

// Precisa de estado (o valor sobe em passos) — por isso vive fora do MDX.
export function ProgressDemo() {
  const [value, setValue] = React.useState(35);

  return (
    <div className="grid w-full max-w-md gap-4">
      <div className="grid gap-2">
        <div className="flex items-baseline justify-between font-display text-sm text-heading">
          <span id="upload-label">Enviando fotos</span>
          <span className="tabular-nums">{value}%</span>
        </div>
        <Progress value={value} aria-labelledby="upload-label" />
      </div>
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" size="sm" onClick={() => setValue((v) => Math.min(100, v + 15))}>
          Avançar
        </Button>
        <Button variant="outline" size="sm" onClick={() => setValue((v) => Math.max(0, v - 15))}>
          Voltar
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setValue(0)}>
          Zerar
        </Button>
      </div>
    </div>
  );
}

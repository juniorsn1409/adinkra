"use client";

import * as React from "react";
import { Button } from "@adinkra/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@adinkra/tooltip";

// Três gatilhos lado a lado dentro de UM TooltipProvider — é ele que faz a
// segunda dica abrir sem espera nem animação quando o mouse pula de um botão
// pro outro. Passe o mouse (ou use Tab) no primeiro e depois mova pros
// vizinhos pra ver.
export function TooltipDemo() {
  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-3">
        <Tooltip>
          <TooltipTrigger render={<Button variant="outline" size="sm" />}>Salvar</TooltipTrigger>
          <TooltipContent>Salvar as alterações (Ctrl+S)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger render={<Button variant="outline" size="sm" />}>Duplicar</TooltipTrigger>
          <TooltipContent>Cria uma cópia na mesma pasta</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger render={<Button variant="outline" size="sm" />}>Arquivar</TooltipTrigger>
          <TooltipContent>Tira da lista sem apagar</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

export function TooltipSidesDemo() {
  const sides = ["top", "right", "bottom", "left"] as const;
  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-3">
        {sides.map((side) => (
          <Tooltip key={side}>
            <TooltipTrigger render={<Button variant="ghost" size="sm" />}>{side}</TooltipTrigger>
            <TooltipContent side={side}>Dica para {side}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}

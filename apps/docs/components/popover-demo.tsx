"use client";

import * as React from "react";
import { Button } from "@adinkra/button";
import { Popover, PopoverClose, PopoverContent, PopoverDescription, PopoverTitle, PopoverTrigger } from "@adinkra/popover";

// Preview do @adinkra/popover: um painel de "dimensões" simples, com título,
// descrição e uma ação de fechar. Não precisa de estado — o Base UI guarda
// se está aberto —, mas vive aqui (cliente) porque `render={<Button />}` e o
// Popover em si só funcionam do lado do cliente.
export function PopoverDemo() {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>Ver detalhes</PopoverTrigger>
      <PopoverContent className="grid w-72 gap-3 p-4">
        <div className="grid gap-1">
          <PopoverTitle>Plano Equipe</PopoverTitle>
          <PopoverDescription>Até 10 pessoas, 50 GB de espaço e suporte por e-mail em horário comercial.</PopoverDescription>
        </div>
        <PopoverClose render={<Button size="sm" variant="secondary" />}>Entendi</PopoverClose>
      </PopoverContent>
    </Popover>
  );
}

// Onde o painel abre em relação ao gatilho: `side` escolhe a borda, `align` o
// alinhamento ao longo dela. Se não couber, o Base UI vira o painel pro outro lado.
export function PopoverSidesDemo() {
  const sides = ["top", "right", "bottom", "left"] as const;
  return (
    <div className="flex flex-wrap gap-3">
      {sides.map((side) => (
        <Popover key={side}>
          <PopoverTrigger render={<Button variant="outline" size="sm" />}>{side}</PopoverTrigger>
          <PopoverContent side={side} align="center" className="p-3 text-sm">
            Abre para {side}.
          </PopoverContent>
        </Popover>
      ))}
    </div>
  );
}

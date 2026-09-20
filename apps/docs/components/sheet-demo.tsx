"use client";

import * as React from "react";
import { Button } from "@adinkra/button";
import { Input } from "@adinkra/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@adinkra/sheet";

// Uma gaveta com formulário curto (lado padrão: direita).
export function SheetDemo() {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" />}>Abrir filtros</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filtros</SheetTitle>
          <SheetDescription>Refine a lista de pedidos. Os filtros valem até você limpar.</SheetDescription>
        </SheetHeader>
        <div className="grid gap-4">
          <Input label="Cliente" placeholder="Nome ou e-mail" />
          <Input label="Valor mínimo" placeholder="R$ 0,00" inputMode="decimal" />
        </div>
        <SheetFooter>
          <SheetClose render={<Button variant="ghost" />}>Limpar</SheetClose>
          <SheetClose render={<Button />}>Aplicar filtros</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// As quatro bordas: cada gaveta entra e sai pelo lado onde está colada.
export function SheetSidesDemo() {
  const sides = [
    { side: "left", label: "Esquerda" },
    { side: "right", label: "Direita" },
    { side: "top", label: "Topo" },
    { side: "bottom", label: "Base" },
  ] as const;

  return (
    <div className="flex flex-wrap gap-3">
      {sides.map(({ side, label }) => (
        <Sheet key={side}>
          <SheetTrigger render={<Button variant="outline" size="sm" />}>{label}</SheetTrigger>
          <SheetContent side={side}>
            <SheetHeader>
              <SheetTitle>Gaveta na {label.toLowerCase()}</SheetTitle>
              <SheetDescription>Ela entra e sai pela mesma borda da tela.</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      ))}
    </div>
  );
}

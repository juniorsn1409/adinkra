"use client";

import * as React from "react";
import { Field } from "@adinkra/field";
import { RadioGroup, RadioGroupItem } from "@adinkra/radio-group";

// Precisa de estado: mostra o valor de fora do grupo (modo controlado).
export function RadioGroupDemo() {
  const [plano, setPlano] = React.useState("mensal");

  return (
    <div className="grid gap-3">
      <RadioGroup value={plano} onValueChange={setPlano} aria-label="Plano de cobrança">
        <RadioGroupItem value="mensal" label="Mensal" />
        <RadioGroupItem value="anual" label="Anual" />
        <RadioGroupItem value="vitalicio" label="Vitalício" />
      </RadioGroup>
      <p className="font-mono text-xs text-muted-foreground">plano = &quot;{plano}&quot;</p>
    </div>
  );
}

// Grupo dentro de um Field, com erro: o Field liga o título por aria-labelledby.
export function RadioGroupFieldDemo() {
  const [contato, setContato] = React.useState("");

  return (
    <Field
      group
      label="Como prefere ser contatado?"
      description="Usamos só para avisos da sua conta."
      error={contato ? undefined : "Escolha uma opção para continuar."}
    >
      <RadioGroup value={contato} onValueChange={setContato}>
        <RadioGroupItem value="email" label="E-mail" />
        <RadioGroupItem value="telefone" label="Telefone" />
      </RadioGroup>
    </Field>
  );
}

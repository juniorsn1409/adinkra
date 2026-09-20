"use client";

import * as React from "react";
import { Checkbox } from "@adinkra/checkbox";
import { Field } from "@adinkra/field";

const OPCOES = ["Novidades do produto", "Resumo semanal", "Dicas de uso"];

// Precisa de estado: o "selecionar tudo" vira indeterminado quando só parte
// das opções está marcada — por isso vive num componente à parte, não no MDX.
export function CheckboxDemo() {
  const [marcadas, setMarcadas] = React.useState<string[]>(["Resumo semanal"]);

  const todas = marcadas.length === OPCOES.length;
  const algumas = marcadas.length > 0 && !todas;

  function alternar(opcao: string, marcada: boolean) {
    setMarcadas((atual) => (marcada ? [...atual, opcao] : atual.filter((o) => o !== opcao)));
  }

  return (
    <div className="grid gap-3">
      <Checkbox
        label="Todas as notificações"
        checked={todas}
        indeterminate={algumas}
        onCheckedChange={(marcar) => setMarcadas(marcar ? OPCOES : [])}
      />
      <div className="grid gap-2.5 pl-7">
        {OPCOES.map((opcao) => (
          <Checkbox
            key={opcao}
            label={opcao}
            checked={marcadas.includes(opcao)}
            onCheckedChange={(marcada) => alternar(opcao, marcada)}
          />
        ))}
      </div>
    </div>
  );
}

// Checkbox dentro de um Field horizontal, com erro: o Field liga o rótulo, a
// mensagem e o aria-invalid sem o Checkbox saber que o Field existe.
export function CheckboxFieldDemo() {
  const [aceito, setAceito] = React.useState(false);

  return (
    <Field
      orientation="horizontal"
      label="Li e aceito os termos de uso"
      error={aceito ? undefined : "Marque esta caixa para criar a conta."}
    >
      <Checkbox checked={aceito} onCheckedChange={setAceito} />
    </Field>
  );
}

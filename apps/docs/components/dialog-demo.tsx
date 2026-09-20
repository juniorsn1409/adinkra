"use client";

import * as React from "react";
import { Button } from "@adinkra/button";
import { Input } from "@adinkra/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@adinkra/dialog";

// Diálogo com formulário. Controlado (`open`) porque "Salvar" precisa fechar
// depois de fazer o trabalho — DialogClose fecha direto, sem passar por lógica.
export function DialogDemo() {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("Ana Souza");
  const [saved, setSaved] = React.useState<string | null>(null);

  return (
    <div className="grid gap-3">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button variant="outline" />}>Editar perfil</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar perfil</DialogTitle>
            <DialogDescription>Mude como seu nome aparece para o resto da equipe.</DialogDescription>
          </DialogHeader>
          <form
            id="editar-perfil"
            onSubmit={(event) => {
              event.preventDefault();
              setSaved(name);
              setOpen(false);
            }}
          >
            <Input label="Nome" value={name} onChange={(event) => setName(event.target.value)} />
          </form>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>Cancelar</DialogClose>
            <Button type="submit" form="editar-perfil">
              Salvar alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {saved ? <p className="text-sm text-muted-foreground">Nome salvo: {saved}</p> : null}
    </div>
  );
}

// Confirmação destrutiva: o botão diz exatamente o que acontece ("Excluir
// projeto", não "OK"), e o foco inicial cai no primeiro elemento focável —
// aqui o "Cancelar", o lado seguro.
export function DialogConfirmDemo() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="destructive" />}>Excluir projeto</DialogTrigger>
      <DialogContent showClose={false}>
        <DialogHeader className="pr-0">
          <DialogTitle>Excluir o projeto Aurora?</DialogTitle>
          <DialogDescription>
            Os 42 arquivos e o histórico serão apagados de vez. Essa ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
          <DialogClose render={<Button variant="destructive" />}>Excluir projeto</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

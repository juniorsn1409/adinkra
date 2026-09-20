"use client";

import * as React from "react";
import { Button } from "@adinkra/button";
import { ToastProvider, Toaster, useToast } from "@adinkra/toast";

// Um botão por variante, cada um com um texto de exemplo do jeito que a
// interface real diria: o que aconteceu no título, o que fazer na descrição.
function ToastButtons() {
  const { toast, dismiss } = useToast();
  const lastId = React.useRef<string | null>(null);

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="outline"
        onClick={() =>
          toast({
            title: "Rascunho salvo",
            description: "Você pode continuar de onde parou, em qualquer aparelho.",
          })
        }
      >
        Salvar rascunho
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast({
            variant: "info",
            title: "Arquivo movido para a lixeira",
            description: "Ele fica lá por 30 dias.",
            action: { label: "Desfazer", onClick: () => toast({ title: "Arquivo restaurado" }) },
          })
        }
      >
        Excluir arquivo
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast({
            variant: "warning",
            title: "Sua sessão expira em 5 minutos",
            description: "Renove agora para não perder as alterações.",
          })
        }
      >
        Simular aviso
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast({
            variant: "destructive",
            title: "Não foi possível enviar",
            description: "Verifique a conexão e tente de novo.",
            action: { label: "Tentar de novo", onClick: () => toast({ variant: "info", title: "Enviando…" }) },
          })
        }
      >
        Simular erro
      </Button>
      <Button
        variant="ghost"
        onClick={() => {
          // Fica até alguém fechar (duration: 0) — e guardamos o id pra fechar por código.
          if (lastId.current) dismiss(lastId.current);
          lastId.current = toast({
            title: "Este fica até você fechar",
            description: "Sem tempo limite: útil quando a pessoa precisa agir.",
            duration: 0,
          });
        }}
      >
        Toast fixo
      </Button>
    </div>
  );
}

// O Toaster é fixo no canto da TELA (não da caixa de preview) — clique e
// olhe pro canto inferior direito.
export function ToastDemo() {
  return (
    <ToastProvider>
      <div className="grid gap-3">
        <ToastButtons />
        <p className="text-sm text-muted-foreground">Os toasts aparecem no canto inferior direito da tela.</p>
      </div>
      <Toaster />
    </ToastProvider>
  );
}

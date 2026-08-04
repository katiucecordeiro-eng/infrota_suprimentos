"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { responderOrcamento, type ResponderOrcamentoState } from "./actions";

export function OrcamentoForm({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState<ResponderOrcamentoState, FormData>(
    responderOrcamento,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="preco">Preço (R$) *</Label>
          <Input id="preco" name="preco" type="number" step="0.01" min="0" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="prazoEntregaDias">Prazo de entrega (dias) *</Label>
          <Input id="prazoEntregaDias" name="prazoEntregaDias" type="number" min="0" required />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="observacoes">Observações (opcional)</Label>
        <Textarea
          id="observacoes"
          name="observacoes"
          rows={3}
          placeholder="Condições de pagamento, disponibilidade, etc."
        />
      </div>

      {state?.error ? (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={isPending} className="self-start">
        <Send /> {isPending ? "Enviando..." : "Enviar orçamento"}
      </Button>
    </form>
  );
}

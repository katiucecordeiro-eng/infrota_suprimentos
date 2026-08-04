"use client";

import { useActionState, useState } from "react";
import { FileText, Send } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyLinkButton } from "@/components/frota/copy-link-button";
import { formatarData, formatarPreco } from "@/lib/frota/format";
import {
  STATUS_ORCAMENTO_BADGE_VARIANT,
  STATUS_ORCAMENTO_LABELS,
  type Fornecedor,
  type OrcamentoComRelacoes,
} from "@/lib/frota/types";
import { pedirOrcamentos, type PedirOrcamentosState } from "./actions";

export function OrcamentoSection({
  solicitacaoId,
  fornecedores,
  orcamentos,
  appUrl,
}: {
  solicitacaoId: string;
  fornecedores: Fornecedor[];
  orcamentos: OrcamentoComRelacoes[];
  appUrl: string;
}) {
  const [state, formAction, isPending] = useActionState<PedirOrcamentosState, FormData>(
    pedirOrcamentos,
    undefined,
  );
  const [selecionados, setSelecionados] = useState<string[]>([]);

  // Zera a seleção quando o pedido é criado com sucesso — ajuste de estado
  // durante a renderização (padrão recomendado pelo React pra "resetar
  // estado quando uma prop muda") em vez de useEffect, que dispararia um
  // re-render em cascata desnecessário aqui.
  const [ultimoState, setUltimoState] = useState(state);
  if (state !== ultimoState) {
    setUltimoState(state);
    if (state?.success && selecionados.length > 0) setSelecionados([]);
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Orçamentos com fornecedores</CardTitle>
        {orcamentos.length > 0 ? (
          <Badge variant="outline">{orcamentos.length} pedido(s)</Badge>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!appUrl ? (
          <p className="text-sm text-warning">
            NEXT_PUBLIC_APP_URL não configurada — o link copiado vai ficar
            incompleto (sem domínio). Defina essa variável de ambiente antes
            de mandar pro fornecedor.
          </p>
        ) : null}
        {orcamentos.length > 0 ? (
          <div className="flex flex-col gap-2">
            {orcamentos.map((orcamento) => (
              <div
                key={orcamento.id}
                className="flex flex-col gap-2 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">
                      {orcamento.fornecedor_nome}
                    </span>
                    <Badge variant={STATUS_ORCAMENTO_BADGE_VARIANT[orcamento.status]}>
                      {STATUS_ORCAMENTO_LABELS[orcamento.status]}
                    </Badge>
                  </div>
                  {orcamento.status === "respondido" ? (
                    <p className="font-mono-nums text-sm text-foreground">
                      {orcamento.preco !== null ? formatarPreco(orcamento.preco) : "—"}
                      {orcamento.prazo_entrega_dias !== null
                        ? ` · Prazo: ${orcamento.prazo_entrega_dias}d`
                        : ""}
                      {orcamento.respondido_em
                        ? ` · Respondido em ${formatarData(orcamento.respondido_em)}`
                        : ""}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Pedido em {formatarData(orcamento.enviado_em)}
                    </p>
                  )}
                  {orcamento.observacoes ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      &ldquo;{orcamento.observacoes}&rdquo;
                    </p>
                  ) : null}
                </div>
                {orcamento.status !== "respondido" ? (
                  <CopyLinkButton url={`${appUrl}/orcamento/${orcamento.token}`} />
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-6 text-center text-muted-foreground">
            <FileText className="size-8" />
            <p className="text-sm">Nenhum orçamento pedido ainda.</p>
          </div>
        )}

        {fornecedores.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum fornecedor cadastrado ainda — cadastre um em Registrar Compra
            antes de pedir orçamento.
          </p>
        ) : (
          <form action={formAction} className="flex flex-col gap-3 border-t border-border pt-4">
            <input type="hidden" name="solicitacaoId" value={solicitacaoId} />
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Pedir orçamento a
            </p>
            <div className="flex flex-wrap gap-2">
              {fornecedores.map((fornecedor) => {
                const marcado = selecionados.includes(fornecedor.id);
                return (
                  <label
                    key={fornecedor.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors ${
                      marcado
                        ? "border-accent bg-primary/15 text-foreground"
                        : "border-border text-muted-foreground hover:bg-surface-hover"
                    }`}
                  >
                    <input
                      type="checkbox"
                      name="fornecedorIds"
                      value={fornecedor.id}
                      checked={marcado}
                      onChange={(e) =>
                        setSelecionados((prev) =>
                          e.target.checked
                            ? [...prev, fornecedor.id]
                            : prev.filter((id) => id !== fornecedor.id),
                        )
                      }
                      className="sr-only"
                    />
                    {fornecedor.nome}
                  </label>
                );
              })}
            </div>

            {state?.error ? (
              <p className="text-sm text-danger" role="alert">
                {state.error}
              </p>
            ) : null}
            {state?.success ? (
              <p className="text-sm text-success">Pedido(s) de orçamento criado(s).</p>
            ) : null}

            <Button
              type="submit"
              size="sm"
              disabled={isPending || selecionados.length === 0}
              className="self-start"
            >
              <Send /> {isPending ? "Enviando..." : "Pedir Orçamento"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

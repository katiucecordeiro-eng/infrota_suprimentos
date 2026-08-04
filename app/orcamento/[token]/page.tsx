import { CheckCircle2, XCircle } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatarData, formatarPreco } from "@/lib/frota/format";
import { getOrcamentoPorToken } from "@/lib/frota/orcamento-publico";
import { OrcamentoForm } from "./orcamento-form";

export default async function OrcamentoPublicoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const orcamento = await getOrcamentoPorToken(token);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">
            Pedido <span className="text-accent">de Orçamento</span>
          </CardTitle>
          <CardDescription>Gestão em Movimento — Frota x Suprimentos</CardDescription>
        </CardHeader>
        <CardContent>
          {!orcamento ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <XCircle className="size-8 text-danger" />
              <p className="text-sm text-foreground">Link inválido ou expirado.</p>
              <p className="text-sm text-muted-foreground">
                Confirme o link com quem enviou o pedido de orçamento.
              </p>
            </div>
          ) : orcamento.status === "respondido" ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <CheckCircle2 className="size-8 text-success" />
              <p className="text-sm text-foreground">
                Orçamento já enviado, obrigado, {orcamento.fornecedor_nome}!
              </p>
              <div className="mt-2 w-full rounded-md border border-border bg-surface p-3 text-left text-sm">
                <p className="text-foreground">
                  {orcamento.preco !== null ? formatarPreco(orcamento.preco) : "—"}
                  {orcamento.prazo_entrega_dias !== null
                    ? ` · Prazo: ${orcamento.prazo_entrega_dias} dia(s)`
                    : ""}
                </p>
                {orcamento.observacoes ? (
                  <p className="mt-1 text-muted-foreground">
                    &ldquo;{orcamento.observacoes}&rdquo;
                  </p>
                ) : null}
                {orcamento.respondido_em ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Enviado em {formatarData(orcamento.respondido_em)}
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="rounded-md border border-border bg-surface p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Item solicitado
                </p>
                <p className="font-mono-nums text-sm font-bold text-foreground">
                  {orcamento.solicitacao_referencia_fabricante}
                </p>
                <p className="text-sm text-foreground">
                  {orcamento.solicitacao_descricao_curta}
                </p>
                <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {orcamento.solicitacao_marca ? (
                    <div>
                      Marca: <span className="text-foreground">{orcamento.solicitacao_marca}</span>
                    </div>
                  ) : null}
                  {orcamento.solicitacao_modelo_peca ? (
                    <div>
                      Modelo:{" "}
                      <span className="text-foreground">{orcamento.solicitacao_modelo_peca}</span>
                    </div>
                  ) : null}
                  {orcamento.solicitacao_codigo_peca ? (
                    <div>
                      Código: <span className="text-foreground">{orcamento.solicitacao_codigo_peca}</span>
                    </div>
                  ) : null}
                  <div>
                    Aplicação:{" "}
                    <span className="text-foreground">{orcamento.solicitacao_aplicacao}</span>
                  </div>
                  <div>
                    Unidade de medida:{" "}
                    <span className="text-foreground">{orcamento.solicitacao_unidade_medida}</span>
                  </div>
                  <div>
                    Solicitante:{" "}
                    <span className="text-foreground">{orcamento.solicitacao_unidade}</span>
                  </div>
                </dl>
              </div>

              <p className="text-sm text-muted-foreground">
                Olá, {orcamento.fornecedor_nome}! Preencha o orçamento pra essa
                peça abaixo.
              </p>

              <OrcamentoForm token={token} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

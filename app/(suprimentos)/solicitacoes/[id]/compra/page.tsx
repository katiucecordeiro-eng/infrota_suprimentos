import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatarData, formatarPreco } from "@/lib/frota/format";
import {
  getCatalogoPadraoById,
  getComprasPorSolicitacao,
  getFornecedores,
  getSolicitacaoById,
} from "@/lib/frota/queries";
import { CompraForm } from "./compra-form";

export default async function RegistrarCompraPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const solicitacao = await getSolicitacaoById(id);
  if (!solicitacao || !solicitacao.item_vinculado_id) notFound();

  const [fornecedores, comprasExistentes, peca] = await Promise.all([
    getFornecedores(),
    getComprasPorSolicitacao(id),
    getCatalogoPadraoById(solicitacao.item_vinculado_id),
  ]);

  if (!peca) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/solicitacoes/${id}`}
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Voltar pra solicitação
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Registrar Compra</h1>
        <p className="text-sm text-muted-foreground">
          {solicitacao.unidade} · {solicitacao.descricao_curta}
        </p>
      </div>

      {comprasExistentes.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Compras já registradas para esta solicitação</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {comprasExistentes.map((compra) => (
              <div
                key={compra.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3 text-sm"
              >
                <span className="text-foreground">
                  {compra.fornecedor_nome} — {formatarPreco(compra.preco)}
                </span>
                <span className="text-muted-foreground">
                  NF {compra.nota_fiscal} · {formatarData(compra.data_compra)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Nova compra</CardTitle>
        </CardHeader>
        <CardContent>
          <CompraForm
            solicitacaoId={id}
            pecaId={peca.id}
            pecaCodigoBenner={peca.codigo_benner}
            pecaNomePadronizado={peca.nome_padronizado}
            fornecedores={fornecedores}
          />
        </CardContent>
      </Card>

      <Button asChild variant="ghost" className="self-start">
        <Link href={`/solicitacoes/${id}`}>
          <ArrowLeft /> Voltar pra solicitação
        </Link>
      </Button>
    </div>
  );
}

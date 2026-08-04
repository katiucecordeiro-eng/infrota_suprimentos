import { ClipboardList } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/frota/status-badge";
import { formatarData } from "@/lib/frota/format";
import { getMinhasSolicitacoes } from "@/lib/frota/queries";

export default async function MinhasSolicitacoesPage() {
  const solicitacoes = await getMinhasSolicitacoes();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Minhas Solicitações</h1>
        <p className="text-sm text-muted-foreground">
          Solicitações da sua unidade, mais recentes primeiro.
        </p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Histórico</CardTitle>
          <Badge variant="outline">{solicitacoes.length} solicitação(ões)</Badge>
        </CardHeader>
        <CardContent>
          {solicitacoes.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
              <ClipboardList className="size-8" />
              <p className="text-sm">Nenhuma solicitação enviada ainda.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Família</TableHead>
                  <TableHead>Descrição / Referência</TableHead>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {solicitacoes.map((solicitacao) => (
                  <TableRow key={solicitacao.id}>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatarData(solicitacao.data_solicitacao)}
                    </TableCell>
                    <TableCell>{solicitacao.familia_nome}</TableCell>
                    <TableCell>
                      <p className="text-foreground">{solicitacao.descricao_curta}</p>
                      <p className="font-mono-nums text-xs text-muted-foreground">
                        Ref: {solicitacao.referencia_fabricante}
                      </p>
                    </TableCell>
                    <TableCell>{solicitacao.solicitante_nome}</TableCell>
                    <TableCell>
                      <StatusBadge status={solicitacao.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

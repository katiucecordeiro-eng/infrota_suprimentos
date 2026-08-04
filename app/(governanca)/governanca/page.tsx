import {
  Building2,
  CheckCircle2,
  Clock,
  Inbox,
  ShieldCheck,
  Timer,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatarHoras, formatarPercentual } from "@/lib/frota/format";
import { getGovernancaKpis, getRankingUnidades } from "@/lib/frota/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 py-5">
        <div className="rounded-md bg-primary/15 p-2 text-accent">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="font-mono-nums text-2xl font-bold text-foreground">{value}</p>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function GovernancaPage() {
  const configured = isSupabaseConfigured();
  const [kpis, ranking] = configured
    ? await Promise.all([getGovernancaKpis(), getRankingUnidades()])
    : [null, []];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Governança Frota x Suprimentos
        </h1>
        <p className="text-sm text-muted-foreground">
          Visão consolidada de todas as unidades: volume, SLA de resposta e
          duplicidade de cadastro evitada.
        </p>
      </div>

      {!configured || !kpis ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Supabase não configurado — defina as variáveis de ambiente para ver
            os indicadores reais (veja .env.example).
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <KpiCard
              icon={Inbox}
              label="Total de solicitações"
              value={String(kpis.totalSolicitacoes)}
            />
            <KpiCard icon={Clock} label="Abertas" value={String(kpis.abertas)} />
            <KpiCard
              icon={CheckCircle2}
              label="Fechadas"
              value={String(kpis.fechadas)}
            />
            <KpiCard
              icon={Timer}
              label="SLA médio de resposta"
              value={kpis.slaMedioHoras !== null ? formatarHoras(kpis.slaMedioHoras) : "—"}
              hint={
                kpis.slaCumpridoPct !== null
                  ? `${formatarPercentual(kpis.slaCumpridoPct)} dentro do prazo`
                  : "sem fechadas com resposta ainda"
              }
            />
            <KpiCard
              icon={ShieldCheck}
              label="Duplicidade evitada"
              value={
                kpis.duplicidadeEvitadaPct !== null
                  ? formatarPercentual(kpis.duplicidadeEvitadaPct)
                  : "—"
              }
              hint={`${kpis.totalDecisoes} decisão(ões) registrada(s)`}
            />
          </div>

          <Card>
            <CardHeader className="flex-row items-center gap-2">
              <Building2 className="size-4 text-accent" />
              <CardTitle>Ranking de unidades</CardTitle>
            </CardHeader>
            <CardContent>
              {ranking.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
                  <Building2 className="size-8" />
                  <p className="text-sm">Nenhuma solicitação registrada ainda.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Abertas</TableHead>
                      <TableHead>Fechadas</TableHead>
                      <TableHead>SLA médio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ranking.map((unidade) => (
                      <TableRow key={unidade.unidade}>
                        <TableCell className="font-medium text-foreground">
                          {unidade.unidade}
                        </TableCell>
                        <TableCell className="font-mono-nums">{unidade.total}</TableCell>
                        <TableCell className="font-mono-nums">{unidade.abertas}</TableCell>
                        <TableCell className="font-mono-nums">
                          {unidade.fechadas}
                        </TableCell>
                        <TableCell className="font-mono-nums">
                          {unidade.slaMedioHoras !== null
                            ? formatarHoras(unidade.slaMedioHoras)
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

import { AlertTriangle } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/auth/profile";
import { getFamilias, getFornecedores, getPlacasPorUnidade } from "@/lib/frota/queries";
import { SolicitarForm } from "./solicitar-form";

export default async function SolicitarPage({
  searchParams,
}: {
  searchParams: Promise<{ referencia?: string; descricao?: string; familiaId?: string }>;
}) {
  const [profile, familias, fornecedores, params] = await Promise.all([
    getCurrentProfile(),
    getFamilias(),
    getFornecedores(),
    searchParams,
  ]);

  const placas = profile?.unidade ? await getPlacasPorUnidade(profile.unidade) : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Requisição de Compra</h1>
        <p className="text-sm text-muted-foreground">
          Preencha os campos abaixo — o Suprimentos vai analisar, vincular a um
          item existente ou aprovar o cadastro no padrão.
        </p>
      </div>

      {!profile?.unidade ? (
        <Card>
          <CardContent className="flex items-center gap-2 py-6 text-sm text-warning">
            <AlertTriangle className="size-4 shrink-0" />
            Sua unidade ainda não foi configurada no cadastro — peça para o
            Suprimentos/admin definir isso antes de enviar uma solicitação.
          </CardContent>
        </Card>
      ) : (
        <SolicitarForm
          familias={familias}
          fornecedores={fornecedores}
          placas={placas}
          defaultValues={{
            referencia: params.referencia,
            descricao: params.descricao,
            familiaId: params.familiaId,
          }}
        />
      )}
    </div>
  );
}

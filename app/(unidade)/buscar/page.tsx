import { getFamilias } from "@/lib/frota/queries";
import { BuscaForm } from "./busca-form";

export default async function BuscarPage() {
  const familias = await getFamilias();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Buscar Item Existente</h1>
        <p className="text-sm text-muted-foreground">
          Antes de solicitar um item novo, confira se ele já existe no catálogo
          padrão — evita cadastro duplicado no Benner.
        </p>
      </div>
      <BuscaForm familias={familias} />
    </div>
  );
}

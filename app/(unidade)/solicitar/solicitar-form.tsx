"use client";

import { useActionState, useState } from "react";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LADO_LABELS,
  TIPO_REQUISICAO_LABELS,
  UNIDADES_MEDIDA,
  type Familia,
  type Fornecedor,
  type Placa,
} from "@/lib/frota/types";
import { solicitarItemNovo, type SolicitarState } from "./actions";

const ITEM_ESTOQUE = "estoque";
const OUTRO_FORNECEDOR = "outro";
const SEM_FORNECEDOR = "nenhum";

export function SolicitarForm({
  familias,
  fornecedores,
  placas,
  defaultValues,
}: {
  familias: Familia[];
  fornecedores: Fornecedor[];
  placas: Placa[];
  defaultValues: { referencia?: string; descricao?: string; familiaId?: string };
}) {
  const [state, formAction, isPending] = useActionState<SolicitarState, FormData>(
    solicitarItemNovo,
    undefined,
  );

  const [placaId, setPlacaId] = useState("");
  const [fornecedorId, setFornecedorId] = useState(SEM_FORNECEDOR);
  const [fotoErro, setFotoErro] = useState<string | null>(null);

  // Aviso imediato antes de sequer tentar enviar — sem isso, uma foto de
  // celular (facilmente 3-8MB) só falha depois do envio, com o corpo da
  // Server Action rejeitado pelo limite configurado em next.config.ts.
  const MAX_FOTO_BYTES = 8 * 1024 * 1024;

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={formAction} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2 sm:max-w-sm">
            <Label htmlFor="tipoRequisicao">Tipo de requisição *</Label>
            <Select name="tipoRequisicao" required>
              <SelectTrigger id="tipoRequisicao">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TIPO_REQUISICAO_LABELS).map(([valor, label]) => (
                  <SelectItem key={valor} value={valor}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2 sm:max-w-sm">
            <Label htmlFor="familiaId">Família / Categoria *</Label>
            <Select name="familiaId" defaultValue={defaultValues.familiaId} required>
              <SelectTrigger id="familiaId">
                <SelectValue placeholder="Selecione a família" />
              </SelectTrigger>
              <SelectContent>
                {familias.map((familia) => (
                  <SelectItem key={familia.id} value={familia.id}>
                    {familia.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="descricaoCurta">Descrição curta *</Label>
            <Input
              id="descricaoCurta"
              name="descricaoCurta"
              required
              defaultValue={defaultValues.descricao}
              placeholder="Ex.: Pastilha de freio dianteira"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="referenciaFabricante">Referência do fabricante *</Label>
              <Input
                id="referenciaFabricante"
                name="referenciaFabricante"
                required
                defaultValue={defaultValues.referencia}
                placeholder="Ex.: GDB1330"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="aplicacao">Aplicação / modelo do veículo *</Label>
              <Input
                id="aplicacao"
                name="aplicacao"
                required
                placeholder="Ex.: HR HD 2.5 2018-2023"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="codigoPeca">Código da peça</Label>
              <Input id="codigoPeca" name="codigoPeca" placeholder="Ex.: 000123" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="marca">Marca</Label>
              <Input id="marca" name="marca" placeholder="Ex.: Bosch" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="modeloPeca">Modelo da peça</Label>
              <Input id="modeloPeca" name="modeloPeca" placeholder="Ex.: Standard" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="lado">Lado</Label>
              <Select name="lado" defaultValue="none">
                <SelectTrigger id="lado">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não aplicável</SelectItem>
                  <SelectItem value="D">{LADO_LABELS.D}</SelectItem>
                  <SelectItem value="E">{LADO_LABELS.E}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="unidadeMedida">Unidade de medida *</Label>
              <Select name="unidadeMedida" required>
                <SelectTrigger id="unidadeMedida">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {UNIDADES_MEDIDA.map((um) => (
                    <SelectItem key={um} value={um}>
                      {um}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="placaId">Placa do veículo *</Label>
            <input type="hidden" name="placaId" value={placaId} />
            <Select value={placaId} onValueChange={setPlacaId} required>
              <SelectTrigger id="placaId">
                <SelectValue placeholder="Selecione a placa ou item para estoque" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ITEM_ESTOQUE}>Item para Estoque (sem veículo)</SelectItem>
                {placas.map((placa) => (
                  <SelectItem key={placa.placa} value={placa.placa}>
                    {placa.placa} — {placa.modelo_veiculo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {placas.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Nenhuma placa cadastrada pra sua unidade ainda — se for pra um
                veículo, peça pro Suprimentos cadastrar a placa primeiro.
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="fornecedorId">Fornecedor sugerido (opcional)</Label>
            <input type="hidden" name="fornecedorId" value={fornecedorId} />
            <Select value={fornecedorId} onValueChange={setFornecedorId}>
              <SelectTrigger id="fornecedorId">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SEM_FORNECEDOR}>Nenhum / não sei</SelectItem>
                {fornecedores.map((fornecedor) => (
                  <SelectItem key={fornecedor.id} value={fornecedor.id}>
                    {fornecedor.nome}
                  </SelectItem>
                ))}
                <SelectItem value={OUTRO_FORNECEDOR}>Outro (não listado)</SelectItem>
              </SelectContent>
            </Select>
            {fornecedorId === OUTRO_FORNECEDOR ? (
              <Input
                name="fornecedorNome"
                placeholder="Nome do fornecedor sugerido"
                className="mt-1"
              />
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="foto">Foto (opcional, máx. 8MB)</Label>
            <Input
              id="foto"
              name="foto"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const arquivo = e.target.files?.[0];
                if (arquivo && arquivo.size > MAX_FOTO_BYTES) {
                  setFotoErro(
                    `Essa foto tem ${(arquivo.size / 1024 / 1024).toFixed(1)}MB — o máximo é 8MB. Escolha outra ou comprima antes de anexar.`,
                  );
                  e.target.value = "";
                } else {
                  setFotoErro(null);
                }
              }}
            />
            {fotoErro ? (
              <p className="text-sm text-danger" role="alert">
                {fotoErro}
              </p>
            ) : null}
          </div>

          {state?.error ? (
            <p className="text-sm text-danger" role="alert">
              {state.error}
            </p>
          ) : null}

          <Button type="submit" disabled={isPending} className="self-start">
            <Send /> {isPending ? "Enviando..." : "Enviar solicitação"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

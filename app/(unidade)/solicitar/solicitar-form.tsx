"use client";

import { useActionState } from "react";
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
import { LADO_LABELS, UNIDADES_MEDIDA, type Familia } from "@/lib/frota/types";
import { solicitarItemNovo, type SolicitarState } from "./actions";

export function SolicitarForm({
  familias,
  defaultValues,
}: {
  familias: Familia[];
  defaultValues: { referencia?: string; descricao?: string; familiaId?: string };
}) {
  const [state, formAction, isPending] = useActionState<SolicitarState, FormData>(
    solicitarItemNovo,
    undefined,
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={formAction} className="flex flex-col gap-5">
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
            <Label htmlFor="foto">Foto (opcional)</Label>
            <Input id="foto" name="foto" type="file" accept="image/*" />
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

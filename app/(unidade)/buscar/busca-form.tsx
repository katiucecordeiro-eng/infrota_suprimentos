"use client";

import Link from "next/link";
import { useActionState } from "react";
import { PackageSearch, PlusCircle, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
import type { Familia } from "@/lib/frota/types";
import { buscarAction, type BuscaState } from "./actions";

export function BuscaForm({ familias }: { familias: Familia[] }) {
  const [state, formAction, isPending] = useActionState<BuscaState, FormData>(
    buscarAction,
    undefined,
  );

  const solicitarParams = new URLSearchParams();
  if (state?.referencia) solicitarParams.set("referencia", state.referencia);
  if (state?.descricao) solicitarParams.set("descricao", state.descricao);
  if (state?.familiaId) solicitarParams.set("familiaId", state.familiaId);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="pt-6">
          <form action={formAction} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="referencia">Referência do fabricante</Label>
                <Input
                  id="referencia"
                  name="referencia"
                  defaultValue={state?.referencia}
                  placeholder="Ex.: GDB1330"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Input
                  id="descricao"
                  name="descricao"
                  defaultValue={state?.descricao}
                  placeholder="Ex.: Pastilha de freio dianteira"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:max-w-xs">
              <Label htmlFor="familiaId">Família (opcional)</Label>
              <Select name="familiaId" defaultValue={state?.familiaId}>
                <SelectTrigger id="familiaId">
                  <SelectValue placeholder="Todas as famílias" />
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

            {state?.error ? (
              <p className="text-sm text-danger" role="alert">
                {state.error}
              </p>
            ) : null}

            <Button type="submit" disabled={isPending} className="self-start">
              <Search /> {isPending ? "Buscando..." : "Buscar"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {state?.searched ? (
        <Card>
          <CardContent className="pt-6">
            {state.results && state.results.length > 0 ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">
                  {state.results.length} item(ns) encontrado(s) no catálogo padrão.
                </p>
                {state.results.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-1 rounded-md border border-border p-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono-nums text-sm font-bold text-foreground">
                        {item.codigo_benner}
                      </span>
                      <Badge
                        variant={
                          item.match_tipo === "referencia_exata" ? "default" : "secondary"
                        }
                      >
                        {item.match_tipo === "referencia_exata"
                          ? "Referência exata"
                          : "Similaridade textual"}
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground">{item.nome_padronizado}</p>
                    {item.ncm_cest ? (
                      <p className="text-xs text-muted-foreground">
                        NCM/CEST: {item.ncm_cest}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <PackageSearch className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Nenhum item parecido encontrado no catálogo padrão.
                </p>
              </div>
            )}

            <div className="mt-6 flex flex-col items-center gap-2 border-t border-border pt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Não encontrou o item que precisa?
              </p>
              <Button asChild variant="outline">
                <Link href={`/solicitar?${solicitarParams.toString()}`}>
                  <PlusCircle /> Abrir requisição de compra
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, Loader2, ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Fornecedor } from "@/lib/frota/types";
import { registrarCompra, verificarPlaca, type RegistrarCompraState } from "./actions";

const NOVO_FORNECEDOR = "novo";

export function CompraForm({
  solicitacaoId,
  pecaId,
  pecaCodigoBenner,
  pecaNomePadronizado,
  fornecedores,
}: {
  solicitacaoId: string;
  pecaId: string;
  pecaCodigoBenner: string;
  pecaNomePadronizado: string;
  fornecedores: Fornecedor[];
}) {
  const [state, formAction, isPending] = useActionState<RegistrarCompraState, FormData>(
    registrarCompra,
    undefined,
  );

  const [fornecedorId, setFornecedorId] = useState("");
  const [placa, setPlaca] = useState("");
  const [placaStatus, setPlacaStatus] = useState<
    "idle" | "checking" | "found" | "not-found"
  >("idle");
  const [modeloEncontrado, setModeloEncontrado] = useState<string | null>(null);

  async function handleVerificarPlaca() {
    if (!placa.trim()) return;
    setPlacaStatus("checking");
    const resultado = await verificarPlaca(placa);
    if (resultado.existe) {
      setModeloEncontrado(resultado.modeloVeiculo ?? null);
      setPlacaStatus("found");
    } else {
      setModeloEncontrado(null);
      setPlacaStatus("not-found");
    }
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="solicitacaoId" value={solicitacaoId} />
      <input type="hidden" name="pecaId" value={pecaId} />

      <div className="rounded-md border border-border bg-surface p-3">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Peça
        </p>
        <p className="font-mono-nums text-sm font-bold text-foreground">
          {pecaCodigoBenner}
        </p>
        <p className="text-sm text-foreground">{pecaNomePadronizado}</p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="fornecedorId">Fornecedor *</Label>
        <input type="hidden" name="fornecedorId" value={fornecedorId} />
        <Select value={fornecedorId} onValueChange={setFornecedorId} required>
          <SelectTrigger id="fornecedorId">
            <SelectValue placeholder="Selecione o fornecedor" />
          </SelectTrigger>
          <SelectContent>
            {fornecedores.map((fornecedor) => (
              <SelectItem key={fornecedor.id} value={fornecedor.id}>
                {fornecedor.nome}
              </SelectItem>
            ))}
            <SelectItem value={NOVO_FORNECEDOR}>+ Cadastrar novo fornecedor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {fornecedorId === NOVO_FORNECEDOR ? (
        <div className="grid gap-4 rounded-md border border-border bg-surface p-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="fornecedorNome">Nome do fornecedor *</Label>
            <Input id="fornecedorNome" name="fornecedorNome" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="fornecedorCnpj">CNPJ</Label>
            <Input id="fornecedorCnpj" name="fornecedorCnpj" placeholder="00.000.000/0000-00" />
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="preco">Preço pago (R$) *</Label>
          <Input id="preco" name="preco" type="number" step="0.01" min="0" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="notaFiscal">Número da NF *</Label>
          <Input id="notaFiscal" name="notaFiscal" required />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="prazoPrometidoDias">Prazo de entrega prometido (dias) *</Label>
          <Input
            id="prazoPrometidoDias"
            name="prazoPrometidoDias"
            type="number"
            min="0"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="prazoRealDias">Prazo de entrega real (dias)</Label>
          <Input id="prazoRealDias" name="prazoRealDias" type="number" min="0" />
          <p className="text-xs text-muted-foreground">
            Deixe em branco se a entrega ainda não aconteceu.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-md border border-border bg-surface p-3">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Placa do veículo (opcional)
        </p>
        <div className="flex items-end gap-2">
          <div className="flex flex-1 flex-col gap-2">
            <Label htmlFor="placa">Placa</Label>
            <Input
              id="placa"
              name="placa"
              value={placa}
              onChange={(event) => {
                setPlaca(event.target.value.toUpperCase());
                setPlacaStatus("idle");
              }}
              placeholder="Ex.: ABC1D23"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleVerificarPlaca}
            disabled={!placa.trim() || placaStatus === "checking"}
          >
            {placaStatus === "checking" ? <Loader2 className="animate-spin" /> : null}
            Verificar
          </Button>
        </div>

        {placaStatus === "found" ? (
          <p className="flex items-center gap-2 text-sm text-success">
            <CheckCircle2 className="size-4" /> Veículo já cadastrado
            {modeloEncontrado ? ` — ${modeloEncontrado}` : ""}.
          </p>
        ) : null}

        {placaStatus === "not-found" ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-warning">
              Placa não encontrada — cadastre o modelo do veículo pra registrar essa
              placa.
            </p>
            <Label htmlFor="modeloVeiculo">Modelo do veículo *</Label>
            <Input id="modeloVeiculo" name="modeloVeiculo" required />
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 rounded-md border border-border bg-surface p-3">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Garantia da peça (opcional)
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="garantiaQtd">Quantidade</Label>
            <Input id="garantiaQtd" name="garantiaQtd" type="number" min="1" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="garantiaUnidade">Unidade</Label>
            <Select name="garantiaUnidade" defaultValue="meses">
              <SelectTrigger id="garantiaUnidade">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dias">Dias</SelectItem>
                <SelectItem value="meses">Meses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {state?.error ? (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={isPending} className="self-start">
        <ShoppingCart /> {isPending ? "Registrando..." : "Registrar Compra"}
      </Button>
    </form>
  );
}

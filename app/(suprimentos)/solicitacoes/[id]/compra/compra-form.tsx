"use client";

import { useActionState, useMemo, useState } from "react";
import { Car, ShoppingCart } from "lucide-react";

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
import type { Fornecedor, Placa } from "@/lib/frota/types";
import { registrarCompra, type RegistrarCompraState } from "./actions";

const NOVO_FORNECEDOR = "novo";
const NOVA_PLACA = "novo";
// Radix Select não aceite value="" em SelectItem (reservado internamente
// pra representar "nada selecionado") — precisa de um sentinel não-vazio.
const SEM_PLACA = "nenhuma";

export function CompraForm({
  solicitacaoId,
  pecaId,
  pecaCodigoBenner,
  pecaNomePadronizado,
  fornecedores,
  placas,
}: {
  solicitacaoId: string;
  pecaId: string;
  pecaCodigoBenner: string;
  pecaNomePadronizado: string;
  fornecedores: Fornecedor[];
  placas: Placa[];
}) {
  const [state, formAction, isPending] = useActionState<RegistrarCompraState, FormData>(
    registrarCompra,
    undefined,
  );

  const [fornecedorId, setFornecedorId] = useState("");
  const [placaId, setPlacaId] = useState(SEM_PLACA);

  const placaSelecionada = useMemo(
    () => placas.find((p) => p.placa === placaId) ?? null,
    [placas, placaId],
  );

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

        <div className="flex flex-col gap-2">
          <Label htmlFor="placaId">Placa</Label>
          <input type="hidden" name="placaId" value={placaId} />
          <Select value={placaId} onValueChange={setPlacaId}>
            <SelectTrigger id="placaId">
              <SelectValue placeholder="Nenhuma / não aplicável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SEM_PLACA}>Nenhuma / não aplicável</SelectItem>
              {placas.map((placa) => (
                <SelectItem key={placa.placa} value={placa.placa}>
                  {placa.placa} — {placa.modelo_veiculo}
                </SelectItem>
              ))}
              <SelectItem value={NOVA_PLACA}>+ Cadastrar nova placa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {placaSelecionada ? (
          <div className="flex items-start gap-2 rounded-md border border-border bg-background p-3 text-sm">
            <Car className="mt-0.5 size-4 shrink-0 text-accent" />
            <div>
              <p className="text-foreground">{placaSelecionada.modelo_veiculo}</p>
              <p className="text-xs text-muted-foreground">
                {placaSelecionada.chassi ? `Chassi: ${placaSelecionada.chassi}` : "Chassi não informado"}
                {placaSelecionada.ano ? ` · Ano: ${placaSelecionada.ano}` : ""}
                {" · "}
                {placaSelecionada.unidade}
              </p>
            </div>
          </div>
        ) : null}

        {placaId === NOVA_PLACA ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="placaNova">Placa *</Label>
              <Input id="placaNova" name="placaNova" required placeholder="Ex.: ABC1D23" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="modeloVeiculo">Modelo do veículo *</Label>
              <Input id="modeloVeiculo" name="modeloVeiculo" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="chassi">Chassi</Label>
              <Input id="chassi" name="chassi" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ano">Ano</Label>
              <Input id="ano" name="ano" type="number" min="1950" max="2100" />
            </div>
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

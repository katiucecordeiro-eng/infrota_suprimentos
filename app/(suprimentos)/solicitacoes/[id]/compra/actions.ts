"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/profile";
import { normalizarPlaca } from "@/lib/frota/queries";
import type { UnidadeGarantia } from "@/lib/frota/types";

// Chamada direta do client (não é um <form action>) — só pra dar feedback
// imediato de "essa placa já existe" antes de submeter o formulário
// inteiro. Não precisa de useActionState porque não depende de FormData.
export async function verificarPlaca(
  placa: string,
): Promise<{ existe: boolean; modeloVeiculo?: string }> {
  await requireRole("suprimentos");

  const normalizada = normalizarPlaca(placa);
  if (!normalizada) return { existe: false };

  const supabase = await createClient();
  const { data } = await supabase
    .from("placas")
    .select("modelo_veiculo")
    .eq("placa", normalizada)
    .maybeSingle();

  return data ? { existe: true, modeloVeiculo: data.modelo_veiculo } : { existe: false };
}

export type RegistrarCompraState = { error?: string } | undefined;

const compraSchema = z.object({
  solicitacaoId: z.string().uuid(),
  pecaId: z.string().uuid(),
  fornecedorId: z.string().min(1, "Selecione ou cadastre um fornecedor."),
  fornecedorNome: z.string().trim().optional(),
  fornecedorCnpj: z.string().trim().optional(),
  preco: z.coerce.number().min(0, "Informe um preço válido."),
  prazoPrometidoDias: z.coerce
    .number()
    .int()
    .min(0, "Informe o prazo de entrega prometido, em dias."),
  prazoRealDias: z.coerce.number().int().min(0).optional(),
  notaFiscal: z.string().trim().min(1, "Informe o número da nota fiscal."),
  placa: z.string().trim().optional(),
  modeloVeiculo: z.string().trim().optional(),
  garantiaQtd: z.coerce.number().int().min(1).optional(),
  garantiaUnidade: z.enum(["dias", "meses"]).optional(),
});

function optionalField(value: FormDataEntryValue | null): string | undefined {
  return value && String(value).trim() ? String(value) : undefined;
}

function calcularGarantiaAte(qtd: number, unidade: UnidadeGarantia): string {
  const data = new Date();
  if (unidade === "meses") {
    data.setMonth(data.getMonth() + qtd);
  } else {
    data.setDate(data.getDate() + qtd);
  }
  return data.toISOString().slice(0, 10);
}

export async function registrarCompra(
  _prevState: RegistrarCompraState,
  formData: FormData,
): Promise<RegistrarCompraState> {
  await requireRole("suprimentos");

  const parsed = compraSchema.safeParse({
    solicitacaoId: formData.get("solicitacaoId"),
    pecaId: formData.get("pecaId"),
    fornecedorId: formData.get("fornecedorId"),
    fornecedorNome: optionalField(formData.get("fornecedorNome")),
    fornecedorCnpj: optionalField(formData.get("fornecedorCnpj")),
    preco: formData.get("preco"),
    prazoPrometidoDias: formData.get("prazoPrometidoDias"),
    prazoRealDias: optionalField(formData.get("prazoRealDias")),
    notaFiscal: formData.get("notaFiscal"),
    placa: optionalField(formData.get("placa")),
    modeloVeiculo: optionalField(formData.get("modeloVeiculo")),
    garantiaQtd: optionalField(formData.get("garantiaQtd")),
    garantiaUnidade: optionalField(formData.get("garantiaUnidade")),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const data = parsed.data;

  if (data.fornecedorId === "novo" && !data.fornecedorNome) {
    return { error: "Informe o nome do novo fornecedor." };
  }

  const supabase = await createClient();

  // Solicitação dona da compra — precisa existir e já ter um item
  // vinculado (é o que garante "peça já cadastrada").
  const { data: solicitacao, error: solicitacaoError } = await supabase
    .from("solicitacoes")
    .select("id, unidade, item_vinculado_id")
    .eq("id", data.solicitacaoId)
    .maybeSingle();

  if (solicitacaoError || !solicitacao || solicitacao.item_vinculado_id !== data.pecaId) {
    return { error: "Solicitação inválida ou sem item vinculado." };
  }

  let fornecedorId = data.fornecedorId;
  if (fornecedorId === "novo") {
    const { data: novoFornecedor, error: fornecedorError } = await supabase
      .from("fornecedores")
      .insert({ nome: data.fornecedorNome, cnpj: data.fornecedorCnpj ?? null })
      .select("id")
      .single();

    if (fornecedorError || !novoFornecedor) {
      if (fornecedorError?.code === "23505") {
        return { error: "Já existe um fornecedor cadastrado com esse CNPJ." };
      }
      return { error: "Não foi possível cadastrar o fornecedor." };
    }
    fornecedorId = novoFornecedor.id;
  }

  let placaNormalizada: string | null = null;
  if (data.placa) {
    placaNormalizada = normalizarPlaca(data.placa);
    const { data: placaExistente } = await supabase
      .from("placas")
      .select("placa")
      .eq("placa", placaNormalizada)
      .maybeSingle();

    if (!placaExistente) {
      if (!data.modeloVeiculo) {
        return {
          error: "Essa placa ainda não está cadastrada — informe o modelo do veículo.",
        };
      }
      const { error: placaError } = await supabase.from("placas").insert({
        placa: placaNormalizada,
        modelo_veiculo: data.modeloVeiculo,
        unidade: solicitacao.unidade,
      });
      if (placaError) {
        return { error: "Não foi possível cadastrar a placa." };
      }
    }
  }

  const garantiaAte =
    data.garantiaQtd && data.garantiaUnidade
      ? calcularGarantiaAte(data.garantiaQtd, data.garantiaUnidade)
      : null;

  const { error: compraError } = await supabase.from("compras").insert({
    solicitacao_id: data.solicitacaoId,
    peca_id: data.pecaId,
    fornecedor_id: fornecedorId,
    preco: data.preco,
    prazo_prometido_dias: data.prazoPrometidoDias,
    prazo_real_dias: data.prazoRealDias ?? null,
    nota_fiscal: data.notaFiscal,
    placa: placaNormalizada,
    garantia_ate: garantiaAte,
  });

  if (compraError) {
    return { error: "Não foi possível registrar a compra. Tente novamente." };
  }

  redirect(`/solicitacoes/${data.solicitacaoId}`);
}

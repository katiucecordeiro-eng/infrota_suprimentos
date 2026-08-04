"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { responderOrcamentoPorToken } from "@/lib/frota/orcamento-publico";

export type ResponderOrcamentoState = { error?: string; success?: boolean } | undefined;

const responderSchema = z.object({
  token: z.string().uuid(),
  preco: z.coerce.number().min(0, "Informe um preço válido."),
  prazoEntregaDias: z.coerce.number().int().min(0, "Informe um prazo válido."),
  observacoes: z.string().trim().max(2000).optional(),
});

// Rota pública — sem requireRole/sessão. A única checagem de autorização é
// o token bater com uma linha em `orcamentos` (ver responderOrcamentoPorToken,
// que roda com o client de service role).
export async function responderOrcamento(
  _prevState: ResponderOrcamentoState,
  formData: FormData,
): Promise<ResponderOrcamentoState> {
  const parsed = responderSchema.safeParse({
    token: formData.get("token"),
    preco: formData.get("preco"),
    prazoEntregaDias: formData.get("prazoEntregaDias"),
    observacoes: formData.get("observacoes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { token, preco, prazoEntregaDias, observacoes } = parsed.data;

  const { error } = await responderOrcamentoPorToken(token, {
    preco,
    prazoEntregaDias,
    observacoes: observacoes ?? null,
  });

  if (error) return { error };

  revalidatePath(`/orcamento/${token}`);
  return { success: true };
}

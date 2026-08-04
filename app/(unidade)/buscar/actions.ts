"use server";

import { z } from "zod";

import { buscarItensSimilares } from "@/lib/frota/queries";
import type { ItemSimilar } from "@/lib/frota/types";

const buscaSchema = z.object({
  referencia: z.string().trim().max(200).optional(),
  descricao: z.string().trim().max(200).optional(),
  familiaId: z.string().trim().optional(),
});

export type BuscaState =
  | {
      error?: string;
      results?: ItemSimilar[];
      referencia?: string;
      descricao?: string;
      familiaId?: string;
      searched?: boolean;
    }
  | undefined;

export async function buscarAction(
  _prevState: BuscaState,
  formData: FormData,
): Promise<BuscaState> {
  const parsed = buscaSchema.safeParse({
    referencia: formData.get("referencia") || undefined,
    descricao: formData.get("descricao") || undefined,
    familiaId: formData.get("familiaId") || undefined,
  });

  if (!parsed.success) {
    return { error: "Dados de busca inválidos." };
  }

  const { referencia, descricao, familiaId } = parsed.data;

  if (!referencia && !descricao) {
    return {
      error: "Preencha a referência do fabricante e/ou a descrição para buscar.",
      referencia,
      descricao,
      familiaId,
    };
  }

  const results = await buscarItensSimilares({
    referencia: referencia ?? "",
    descricao: descricao ?? "",
    familiaId: familiaId || undefined,
  });

  return { results, referencia, descricao, familiaId, searched: true };
}

"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/profile";

export type SolicitarState = { error?: string } | undefined;

const solicitarSchema = z.object({
  familiaId: z.string().uuid("Selecione a família do item."),
  descricaoCurta: z.string().trim().min(3, "Descreva o item em poucas palavras."),
  referenciaFabricante: z.string().trim().min(1, "Referência do fabricante é obrigatória."),
  aplicacao: z.string().trim().min(1, "Informe a aplicação/modelo do veículo."),
  lado: z.enum(["D", "E"]).optional(),
  unidadeMedida: z.string().trim().min(1, "Informe a unidade de medida."),
});

export async function solicitarItemNovo(
  _prevState: SolicitarState,
  formData: FormData,
): Promise<SolicitarState> {
  const profile = await requireRole("unidade");

  if (!profile.unidade) {
    return {
      error:
        "Sua unidade ainda não foi configurada — peça para o Suprimentos/admin definir isso no seu cadastro antes de solicitar.",
    };
  }

  const lado = formData.get("lado");
  const parsed = solicitarSchema.safeParse({
    familiaId: formData.get("familiaId"),
    descricaoCurta: formData.get("descricaoCurta"),
    referenciaFabricante: formData.get("referenciaFabricante"),
    aplicacao: formData.get("aplicacao"),
    unidadeMedida: formData.get("unidadeMedida"),
    lado: lado === "D" || lado === "E" ? lado : undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();

  let fotoPath: string | null = null;
  const foto = formData.get("foto");
  if (foto instanceof File && foto.size > 0) {
    const path = `${profile.unidade}/${randomUUID()}-${foto.name}`;
    const { error: uploadError } = await supabase.storage
      .from("solicitacoes-fotos")
      .upload(path, foto, { contentType: foto.type || undefined });

    if (uploadError) {
      return { error: "Não foi possível enviar a foto. Tente novamente." };
    }
    fotoPath = path;
  }

  const { error: insertError } = await supabase.from("solicitacoes").insert({
    unidade: profile.unidade,
    solicitante_id: profile.id,
    familia_id: parsed.data.familiaId,
    descricao_curta: parsed.data.descricaoCurta,
    referencia_fabricante: parsed.data.referenciaFabricante,
    aplicacao: parsed.data.aplicacao,
    lado: parsed.data.lado ?? null,
    unidade_medida: parsed.data.unidadeMedida,
    foto_url: fotoPath,
  });

  if (insertError) {
    return { error: "Não foi possível registrar a solicitação. Tente novamente." };
  }

  redirect("/minhas-solicitacoes");
}

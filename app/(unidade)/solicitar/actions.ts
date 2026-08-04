"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/profile";

export type SolicitarState = { error?: string } | undefined;

const ITEM_ESTOQUE = "estoque";
const OUTRO_FORNECEDOR = "outro";
const SEM_FORNECEDOR = "nenhum";

const solicitarSchema = z.object({
  tipoRequisicao: z.enum(["emergencial", "compra_mensal", "estoque"], {
    message: "Selecione o tipo de requisição.",
  }),
  familiaId: z.string().uuid("Selecione a família do item."),
  descricaoCurta: z.string().trim().min(3, "Descreva o item em poucas palavras."),
  referenciaFabricante: z.string().trim().min(1, "Referência do fabricante é obrigatória."),
  aplicacao: z.string().trim().min(1, "Informe a aplicação/modelo do veículo."),
  codigoPeca: z.string().trim().optional(),
  marca: z.string().trim().optional(),
  modeloPeca: z.string().trim().optional(),
  lado: z.enum(["D", "E"]).optional(),
  unidadeMedida: z.string().trim().min(1, "Informe a unidade de medida."),
  placaId: z.string().trim().min(1, "Selecione a placa do veículo ou item para estoque."),
  fornecedorId: z.string().trim().optional(),
  fornecedorNome: z.string().trim().optional(),
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
  const fornecedorIdRaw = formData.get("fornecedorId");
  const parsed = solicitarSchema.safeParse({
    tipoRequisicao: formData.get("tipoRequisicao"),
    familiaId: formData.get("familiaId"),
    descricaoCurta: formData.get("descricaoCurta"),
    referenciaFabricante: formData.get("referenciaFabricante"),
    aplicacao: formData.get("aplicacao"),
    codigoPeca: formData.get("codigoPeca") || undefined,
    marca: formData.get("marca") || undefined,
    modeloPeca: formData.get("modeloPeca") || undefined,
    unidadeMedida: formData.get("unidadeMedida"),
    lado: lado === "D" || lado === "E" ? lado : undefined,
    placaId: formData.get("placaId"),
    fornecedorId:
      fornecedorIdRaw && fornecedorIdRaw !== SEM_FORNECEDOR ? fornecedorIdRaw : undefined,
    fornecedorNome: formData.get("fornecedorNome") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();

  let fotoPath: string | null = null;
  const foto = formData.get("foto");
  if (foto instanceof File && foto.size > 0) {
    // Redundante com o limite do <input> no client (solicitar-form.tsx),
    // mas o client pode ser contornado — sem isso aqui, um arquivo grande
    // o bastante ainda estoura o bodySizeLimit do next.config.ts (10mb) e
    // quebra com o mesmo erro de "Body exceeded" que motivou esse ajuste.
    if (foto.size > 8 * 1024 * 1024) {
      return { error: "A foto deve ter no máximo 8MB. Tente uma imagem menor." };
    }
    const path = `${profile.unidade}/${randomUUID()}-${foto.name}`;
    const { error: uploadError } = await supabase.storage
      .from("solicitacoes-fotos")
      .upload(path, foto, { contentType: foto.type || undefined });

    if (uploadError) {
      return { error: "Não foi possível enviar a foto. Tente novamente." };
    }
    fotoPath = path;
  }

  const isItemEstoque = parsed.data.placaId === ITEM_ESTOQUE;
  const isOutroFornecedor = parsed.data.fornecedorId === OUTRO_FORNECEDOR;

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
    codigo_peca: parsed.data.codigoPeca || null,
    marca: parsed.data.marca || null,
    modelo_peca: parsed.data.modeloPeca || null,
    tipo_requisicao: parsed.data.tipoRequisicao,
    placa: isItemEstoque ? null : parsed.data.placaId,
    item_estoque: isItemEstoque,
    fornecedor_sugerido_id: !isOutroFornecedor ? (parsed.data.fornecedorId ?? null) : null,
    fornecedor_sugerido_nome: isOutroFornecedor ? parsed.data.fornecedorNome || null : null,
  });

  if (insertError) {
    return { error: "Não foi possível registrar a solicitação. Tente novamente." };
  }

  redirect("/minhas-solicitacoes");
}

import { createAdminClient } from "@/lib/supabase/admin";
import type { OrcamentoParaFornecedor } from "@/lib/frota/types";

// Tudo neste arquivo roda com o client de service role (ignora RLS) — o
// token é a ÚNICA verificação de autorização. Nunca importar em código que
// roda no browser (mesma regra de lib/supabase/admin.ts); só usado pela
// rota pública /orcamento/[token] (Server Component + Server Action).

export async function getOrcamentoPorToken(
  token: string,
): Promise<OrcamentoParaFornecedor | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("orcamentos")
    .select(
      `id, solicitacao_id, fornecedor_id, token, status, preco, prazo_entrega_dias,
       observacoes, criado_por, enviado_em, respondido_em, created_at,
       fornecedor:fornecedores(nome),
       solicitacao:solicitacoes(
         descricao_curta, referencia_fabricante, codigo_peca, marca, modelo_peca,
         aplicacao, unidade_medida, unidade
       )`,
    )
    .eq("token", token)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("[frota] erro ao buscar orçamento por token", error);
    return null;
  }

  const row = data as unknown as {
    id: string;
    solicitacao_id: string;
    fornecedor_id: string;
    token: string;
    status: OrcamentoParaFornecedor["status"];
    preco: number | null;
    prazo_entrega_dias: number | null;
    observacoes: string | null;
    criado_por: string;
    enviado_em: string;
    respondido_em: string | null;
    created_at: string;
    fornecedor: { nome: string } | null;
    solicitacao: {
      descricao_curta: string;
      referencia_fabricante: string;
      codigo_peca: string | null;
      marca: string | null;
      modelo_peca: string | null;
      aplicacao: string;
      unidade_medida: string;
      unidade: string;
    } | null;
  };

  return {
    id: row.id,
    solicitacao_id: row.solicitacao_id,
    fornecedor_id: row.fornecedor_id,
    token: row.token,
    status: row.status,
    preco: row.preco,
    prazo_entrega_dias: row.prazo_entrega_dias,
    observacoes: row.observacoes,
    criado_por: row.criado_por,
    enviado_em: row.enviado_em,
    respondido_em: row.respondido_em,
    created_at: row.created_at,
    fornecedor_nome: row.fornecedor?.nome ?? "—",
    solicitacao_descricao_curta: row.solicitacao?.descricao_curta ?? "—",
    solicitacao_referencia_fabricante: row.solicitacao?.referencia_fabricante ?? "—",
    solicitacao_codigo_peca: row.solicitacao?.codigo_peca ?? null,
    solicitacao_marca: row.solicitacao?.marca ?? null,
    solicitacao_modelo_peca: row.solicitacao?.modelo_peca ?? null,
    solicitacao_aplicacao: row.solicitacao?.aplicacao ?? "—",
    solicitacao_unidade_medida: row.solicitacao?.unidade_medida ?? "—",
    solicitacao_unidade: row.solicitacao?.unidade ?? "—",
  };
}

export async function responderOrcamentoPorToken(
  token: string,
  resposta: { preco: number; prazoEntregaDias: number; observacoes: string | null },
): Promise<{ error?: string }> {
  const supabase = createAdminClient();

  const { data: existente } = await supabase
    .from("orcamentos")
    .select("id, status")
    .eq("token", token)
    .maybeSingle();

  if (!existente) return { error: "Link inválido ou expirado." };
  if (existente.status === "respondido") {
    return { error: "Este orçamento já foi respondido." };
  }

  const { error } = await supabase
    .from("orcamentos")
    .update({
      preco: resposta.preco,
      prazo_entrega_dias: resposta.prazoEntregaDias,
      observacoes: resposta.observacoes,
      status: "respondido",
      respondido_em: new Date().toISOString(),
    })
    .eq("token", token);

  if (error) {
    console.error("[frota] erro ao responder orçamento", error);
    return { error: "Não foi possível registrar o orçamento. Tente novamente." };
  }

  return {};
}

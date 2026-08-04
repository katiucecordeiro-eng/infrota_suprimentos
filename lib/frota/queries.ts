import { createClient } from "@/lib/supabase/server";
import type {
  CompraComRelacoes,
  Compra,
  Fornecedor,
  ItemSimilar,
  Placa,
  SolicitacaoComRelacoes,
} from "@/lib/frota/types";

type SolicitacaoRow = {
  id: string;
  unidade: string;
  solicitante_id: string;
  familia_id: string;
  descricao_curta: string;
  referencia_fabricante: string;
  aplicacao: string;
  lado: "D" | "E" | null;
  unidade_medida: string;
  foto_url: string | null;
  status: SolicitacaoComRelacoes["status"];
  item_vinculado_id: string | null;
  responsavel_suprimentos_id: string | null;
  data_solicitacao: string;
  data_resposta: string | null;
  sla_limite: string;
  created_at: string;
  updated_at: string;
  familia: { nome: string } | null;
  solicitante: { nome: string } | null;
  responsavel: { nome: string } | null;
};

const SOLICITACAO_SELECT = `
  id, unidade, solicitante_id, familia_id, descricao_curta, referencia_fabricante,
  aplicacao, lado, unidade_medida, foto_url, status, item_vinculado_id,
  responsavel_suprimentos_id, data_solicitacao, data_resposta, sla_limite,
  created_at, updated_at,
  familia:familias!solicitacoes_familia_id_fkey(nome),
  solicitante:profiles!solicitacoes_solicitante_id_fkey(nome),
  responsavel:profiles!solicitacoes_responsavel_suprimentos_id_fkey(nome)
`;

function mapSolicitacao(row: SolicitacaoRow): SolicitacaoComRelacoes {
  return {
    id: row.id,
    unidade: row.unidade,
    solicitante_id: row.solicitante_id,
    familia_id: row.familia_id,
    descricao_curta: row.descricao_curta,
    referencia_fabricante: row.referencia_fabricante,
    aplicacao: row.aplicacao,
    lado: row.lado,
    unidade_medida: row.unidade_medida,
    foto_url: row.foto_url,
    status: row.status,
    item_vinculado_id: row.item_vinculado_id,
    responsavel_suprimentos_id: row.responsavel_suprimentos_id,
    data_solicitacao: row.data_solicitacao,
    data_resposta: row.data_resposta,
    sla_limite: row.sla_limite,
    created_at: row.created_at,
    updated_at: row.updated_at,
    familia_nome: row.familia?.nome ?? "—",
    solicitante_nome: row.solicitante?.nome ?? "—",
    responsavel_nome: row.responsavel?.nome ?? null,
  };
}

export async function getFilaSuprimentos(): Promise<SolicitacaoComRelacoes[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("solicitacoes")
    .select(SOLICITACAO_SELECT)
    .in("status", ["pendente", "em_analise"])
    .order("sla_limite", { ascending: true });

  if (error) {
    console.error("[frota] erro ao buscar fila de suprimentos", error);
    return [];
  }

  return ((data ?? []) as unknown as SolicitacaoRow[]).map(mapSolicitacao);
}

export async function getSolicitacaoById(
  id: string,
): Promise<SolicitacaoComRelacoes | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("solicitacoes")
    .select(SOLICITACAO_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("[frota] erro ao buscar solicitação", error);
    return null;
  }

  return mapSolicitacao(data as unknown as SolicitacaoRow);
}

export async function buscarItensSimilares(params: {
  referencia: string;
  descricao: string;
  familiaId?: string;
}): Promise<ItemSimilar[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("buscar_itens_similares", {
    p_referencia: params.referencia,
    p_descricao: params.descricao,
    p_familia_id: params.familiaId ?? null,
    p_limit: 10,
  });

  if (error) {
    console.error("[frota] erro na busca por similaridade", error);
    return [];
  }

  return (data ?? []) as ItemSimilar[];
}

export interface DecisaoRegistrada {
  decisao: "vinculado_existente" | "aprovado_novo" | "rejeitado";
  motivo: string | null;
  data: string;
  responsavel_nome: string;
  item_codigo_benner: string | null;
  item_nome_padronizado: string | null;
}

export async function getUltimaDecisao(
  solicitacaoId: string,
): Promise<DecisaoRegistrada | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("log_decisoes")
    .select(
      `decisao, motivo, data,
       responsavel:profiles!log_decisoes_responsavel_id_fkey(nome),
       item:catalogo_padrao(codigo_benner, nome_padronizado)`,
    )
    .eq("solicitacao_id", solicitacaoId)
    .order("data", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("[frota] erro ao buscar log_decisoes", error);
    return null;
  }

  const row = data as unknown as {
    decisao: DecisaoRegistrada["decisao"];
    motivo: string | null;
    data: string;
    responsavel: { nome: string } | null;
    item: { codigo_benner: string; nome_padronizado: string } | null;
  };

  return {
    decisao: row.decisao,
    motivo: row.motivo,
    data: row.data,
    responsavel_nome: row.responsavel?.nome ?? "—",
    item_codigo_benner: row.item?.codigo_benner ?? null,
    item_nome_padronizado: row.item?.nome_padronizado ?? null,
  };
}

// RLS já restringe às solicitações da unidade do usuário logado (ver
// policy "solicitacoes: unidade vê a própria unidade") — compartilhada
// entre todo mundo do mesmo CDD, não só quem abriu cada uma.
export async function getMinhasSolicitacoes(): Promise<SolicitacaoComRelacoes[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("solicitacoes")
    .select(SOLICITACAO_SELECT)
    .order("data_solicitacao", { ascending: false });

  if (error) {
    console.error("[frota] erro ao buscar minhas solicitações", error);
    return [];
  }

  return ((data ?? []) as unknown as SolicitacaoRow[]).map(mapSolicitacao);
}

export async function getFamilias() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("familias")
    .select("id, nome, ativo, ordem")
    .eq("ativo", true)
    .order("ordem", { ascending: true });

  if (error) {
    console.error("[frota] erro ao buscar famílias", error);
    return [];
  }

  return data ?? [];
}

export async function getCatalogoPadraoById(
  id: string,
): Promise<{ id: string; codigo_benner: string; nome_padronizado: string } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("catalogo_padrao")
    .select("id, codigo_benner, nome_padronizado")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("[frota] erro ao buscar item do catálogo", error);
    return null;
  }

  return data;
}

export async function getFornecedores(): Promise<Fornecedor[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fornecedores")
    .select("id, nome, cnpj, avaliacao")
    .order("nome", { ascending: true });

  if (error) {
    console.error("[frota] erro ao buscar fornecedores", error);
    return [];
  }

  return (data as Fornecedor[]) ?? [];
}

// Normaliza pro mesmo formato usado como chave primária em `placas`
// (maiúscula, sem espaço/hífen) — tolera a placa digitada de qualquer
// jeito (com ou sem traço, minúscula etc.).
export function normalizarPlaca(input: string): string {
  return input.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export async function buscarPlacas(query: string): Promise<Placa[]> {
  const supabase = await createClient();
  const termo = normalizarPlaca(query);
  if (!termo) return [];

  const { data, error } = await supabase
    .from("placas")
    .select("placa, modelo_veiculo, unidade")
    .ilike("placa", `${termo}%`)
    .order("placa", { ascending: true })
    .limit(10);

  if (error) {
    console.error("[frota] erro ao buscar placas", error);
    return [];
  }

  return (data as Placa[]) ?? [];
}

const COMPRA_SELECT = `
  id, solicitacao_id, peca_id, fornecedor_id, preco, data_compra,
  prazo_prometido_dias, prazo_real_dias, nota_fiscal, placa, garantia_ate,
  created_at,
  fornecedor:fornecedores(nome),
  peca:catalogo_padrao(codigo_benner, nome_padronizado),
  placa_info:placas(modelo_veiculo)
`;

type CompraRow = Compra & {
  fornecedor: { nome: string } | null;
  peca: { codigo_benner: string; nome_padronizado: string } | null;
  placa_info: { modelo_veiculo: string } | null;
};

function mapCompra(row: CompraRow): CompraComRelacoes {
  return {
    ...row,
    fornecedor_nome: row.fornecedor?.nome ?? "—",
    peca_codigo_benner: row.peca?.codigo_benner ?? "—",
    peca_nome_padronizado: row.peca?.nome_padronizado ?? "—",
    placa_modelo_veiculo: row.placa_info?.modelo_veiculo ?? null,
  };
}

export async function getComprasPorSolicitacao(
  solicitacaoId: string,
): Promise<CompraComRelacoes[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("compras")
    .select(COMPRA_SELECT)
    .eq("solicitacao_id", solicitacaoId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[frota] erro ao buscar compras da solicitação", error);
    return [];
  }

  return ((data ?? []) as unknown as CompraRow[]).map(mapCompra);
}

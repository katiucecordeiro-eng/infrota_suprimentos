export type Role = "unidade" | "suprimentos" | "frota_corporativo";

export type StatusSolicitacao =
  | "pendente"
  | "em_analise"
  | "vinculado"
  | "aprovado"
  | "rejeitado";

export const STATUS_LABELS: Record<StatusSolicitacao, string> = {
  pendente: "Pendente",
  em_analise: "Em Análise",
  vinculado: "Vinculado a Item Existente",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
};

// Papel visual do badge de status (mapeado para as variantes de Badge).
export const STATUS_BADGE_VARIANT: Record<
  StatusSolicitacao,
  "default" | "secondary" | "warning" | "destructive" | "outline"
> = {
  pendente: "warning",
  em_analise: "outline",
  vinculado: "secondary",
  aprovado: "default",
  rejeitado: "destructive",
};

export type Lado = "D" | "E";

export const LADO_LABELS: Record<Lado, string> = {
  D: "Direito (D)",
  E: "Esquerdo (E)",
};

// Lista fechada só para guiar o Select do formulário — a coluna no banco é
// texto livre (unidades incomuns não devem travar a solicitação).
export const UNIDADES_MEDIDA = [
  "UN",
  "PC",
  "CX",
  "KG",
  "L",
  "M",
  "PAR",
  "JG",
  "KIT",
] as const;

export type Decisao = "vinculado_existente" | "aprovado_novo" | "rejeitado";

export interface Profile {
  id: string;
  nome: string;
  role: Role;
  unidade: string | null;
}

export interface Familia {
  id: string;
  nome: string;
  ativo: boolean;
  ordem: number;
}

export interface Solicitacao {
  id: string;
  unidade: string;
  solicitante_id: string;
  familia_id: string;
  descricao_curta: string;
  referencia_fabricante: string;
  aplicacao: string;
  lado: Lado | null;
  unidade_medida: string;
  foto_url: string | null;
  status: StatusSolicitacao;
  item_vinculado_id: string | null;
  responsavel_suprimentos_id: string | null;
  data_solicitacao: string;
  data_resposta: string | null;
  sla_limite: string;
  created_at: string;
  updated_at: string;
}

// Formato retornado pela view/join usado na fila e no detalhe: junta a
// solicitação com os nomes já resolvidos (evita N+1 de profiles/familias
// no client).
export interface SolicitacaoComRelacoes extends Solicitacao {
  familia_nome: string;
  solicitante_nome: string;
  responsavel_nome: string | null;
}

export interface CatalogoPadrao {
  id: string;
  codigo_benner: string;
  nome_padronizado: string;
  familia_id: string | null;
  referencia_fabricante_principal: string | null;
  atributos_json: Record<string, unknown>;
  ncm_cest: string | null;
  status: "ativo" | "inativo";
  data_ultima_revisao: string;
  created_at: string;
}

export interface ItemSimilar {
  id: string;
  codigo_benner: string;
  nome_padronizado: string;
  familia_id: string | null;
  ncm_cest: string | null;
  status: string;
  match_tipo: "referencia_exata" | "similaridade_textual";
  score: number;
}

export interface Fornecedor {
  id: string;
  nome: string;
  cnpj: string | null;
  avaliacao: number | null;
}

export interface Placa {
  placa: string;
  modelo_veiculo: string;
  unidade: string;
}

export type UnidadeGarantia = "dias" | "meses";

export interface Compra {
  id: string;
  solicitacao_id: string | null;
  peca_id: string;
  fornecedor_id: string;
  // Tipado como number por conveniência, mas chega como string via
  // PostgREST (coluna `numeric`) — sempre formatar com formatarPreco()
  // em vez de .toFixed() direto.
  preco: number;
  data_compra: string;
  prazo_prometido_dias: number;
  prazo_real_dias: number | null;
  nota_fiscal: string;
  placa: string | null;
  garantia_ate: string | null;
  created_at: string;
}

export interface CompraComRelacoes extends Compra {
  fornecedor_nome: string;
  peca_codigo_benner: string;
  peca_nome_padronizado: string;
  placa_modelo_veiculo: string | null;
}

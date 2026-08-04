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

export type TipoRequisicao = "emergencial" | "compra_mensal" | "estoque";

export const TIPO_REQUISICAO_LABELS: Record<TipoRequisicao, string> = {
  emergencial: "Requisição Emergencial",
  compra_mensal: "Requisição Compra Mensal",
  estoque: "Requisição para Estoque",
};

export interface Profile {
  id: string;
  nome: string;
  role: Role;
  unidade: string | null;
  // Quando true, navega pelos 3 painéis a partir da mesma conta — `role`
  // continua valendo só como painel padrão (pra onde login/"/" mandam).
  is_admin: boolean;
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
  codigo_peca: string | null;
  marca: string | null;
  modelo_peca: string | null;
  fornecedor_sugerido_id: string | null;
  fornecedor_sugerido_nome: string | null;
  // Ou `placa` tem valor (requisição pra veículo específico) ou
  // `item_estoque` é true (sem veículo) — nunca os dois, nunca nenhum
  // (CHECK constraint solicitacoes_placa_ou_estoque no banco).
  placa: string | null;
  item_estoque: boolean;
  tipo_requisicao: TipoRequisicao | null;
}

// Formato retornado pela view/join usado na fila e no detalhe: junta a
// solicitação com os nomes já resolvidos (evita N+1 de profiles/familias
// no client).
export interface SolicitacaoComRelacoes extends Solicitacao {
  familia_nome: string;
  solicitante_nome: string;
  responsavel_nome: string | null;
  placa_modelo_veiculo: string | null;
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
  chassi: string | null;
  ano: number | null;
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

// KPIs do Painel Frota Corporativo (/governanca) — agregados no servidor a
// partir de `solicitacoes`/`log_decisoes` (sem view dedicada: volume baixo o
// suficiente pra não justificar uma, ao contrário das views do KTracker CRM).
export interface GovernancaKpis {
  totalSolicitacoes: number;
  abertas: number;
  fechadas: number;
  // Média de data_resposta - data_solicitacao das fechadas, em horas.
  // null quando nenhuma fechada ainda tem data_resposta preenchida.
  slaMedioHoras: number | null;
  // Das fechadas com data_resposta, % que respondeu dentro do sla_limite.
  slaCumpridoPct: number | null;
  // Das decisões já registradas em log_decisoes, % que foi
  // "vinculado_existente" (evitou cadastro duplicado no Benner).
  duplicidadeEvitadaPct: number | null;
  totalDecisoes: number;
}

export interface RankingUnidade {
  unidade: string;
  total: number;
  abertas: number;
  fechadas: number;
  slaMedioHoras: number | null;
}

export type StatusOrcamento = "aguardando" | "respondido" | "expirado";

export const STATUS_ORCAMENTO_LABELS: Record<StatusOrcamento, string> = {
  aguardando: "Aguardando resposta",
  respondido: "Respondido",
  expirado: "Expirado",
};

export const STATUS_ORCAMENTO_BADGE_VARIANT: Record<
  StatusOrcamento,
  "default" | "secondary" | "warning" | "destructive" | "outline"
> = {
  aguardando: "warning",
  respondido: "default",
  expirado: "destructive",
};

// RFQ: pedido de orçamento pra um fornecedor sobre uma solicitação. O
// `token` é a credencial de acesso da página pública (/orcamento/[token]) —
// nunca exposto fora dessa própria linha (não faz parte do que o Suprimentos
// lista, só usado pra montar o link).
export interface Orcamento {
  id: string;
  solicitacao_id: string;
  fornecedor_id: string;
  token: string;
  status: StatusOrcamento;
  preco: number | null;
  prazo_entrega_dias: number | null;
  observacoes: string | null;
  criado_por: string;
  enviado_em: string;
  respondido_em: string | null;
  created_at: string;
}

export interface OrcamentoComRelacoes extends Orcamento {
  fornecedor_nome: string;
}

// Dados da solicitação que a página pública do fornecedor precisa exibir —
// deliberadamente um subconjunto pequeno (nunca dados de outra unidade,
// SLA interno etc.), montado a partir do mesmo admin client que resolve o
// token, não da query autenticada normal.
export interface OrcamentoParaFornecedor extends Orcamento {
  fornecedor_nome: string;
  solicitacao_descricao_curta: string;
  solicitacao_referencia_fabricante: string;
  solicitacao_codigo_peca: string | null;
  solicitacao_marca: string | null;
  solicitacao_modelo_peca: string | null;
  solicitacao_aplicacao: string;
  solicitacao_unidade_medida: string;
  solicitacao_unidade: string;
}

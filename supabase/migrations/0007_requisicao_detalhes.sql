-- Enriquece a Solicitação de Item Novo (agora rotulada "Requisição de
-- Compra" na UI) com os campos pedidos: código/marca/modelo da peça,
-- fornecedor sugerido (opcional), vínculo com placa (ou item para
-- estoque quando não for pra veículo específico) e o tipo de requisição.

alter table solicitacoes add column if not exists codigo_peca text;
alter table solicitacoes add column if not exists marca text;
alter table solicitacoes add column if not exists modelo_peca text;

-- Sugestão de fornecedor pela unidade: opcional, e não precisa
-- necessariamente já existir cadastrado (a unidade não tem permissão de
-- insert em `fornecedores` — só o Suprimentos cadastra) — por isso os dois
-- campos, mutuamente exclusivos na prática mas sem CHECK forçando isso,
-- resolvidos na UI (Select entre os já cadastrados + opção "outro").
alter table solicitacoes add column if not exists fornecedor_sugerido_id uuid references fornecedores (id);
alter table solicitacoes add column if not exists fornecedor_sugerido_nome text;

alter table solicitacoes add column if not exists placa text references placas (placa);
alter table solicitacoes add column if not exists item_estoque boolean not null default false;

-- Backfill: toda solicitação existente foi criada antes desses dois campos
-- existirem, então placa sempre chega null aqui — sem o backfill abaixo, a
-- constraint "ou placa ou item_estoque" logo depois quebraria pra qualquer
-- linha antiga.
update solicitacoes set item_estoque = true where placa is null and item_estoque = false;

alter table solicitacoes drop constraint if exists solicitacoes_placa_ou_estoque;
alter table solicitacoes add constraint solicitacoes_placa_ou_estoque check (
  (placa is not null and item_estoque = false)
  or (placa is null and item_estoque = true)
);

-- tipo_requisicao fica nullable no banco de propósito (não dá pra inferir
-- um valor correto pras linhas antigas) — o formulário passa a exigir esse
-- campo pra toda requisição nova, então na prática só fica null em dados
-- pré-existentes.
alter table solicitacoes add column if not exists tipo_requisicao text
  check (tipo_requisicao is null or tipo_requisicao in ('emergencial', 'compra_mensal', 'estoque'));

create index if not exists idx_solicitacoes_placa on solicitacoes (placa);

-- =========================================================================
-- Acompanhamento: a Unidade também precisa enxergar a decisão registrada
-- (vinculado / aprovado / rejeitado, e o item resultante) pra acompanhar a
-- própria peça — antes só suprimentos/frota_corporativo liam log_decisoes.
-- =========================================================================

create policy "log_decisoes: unidade vê decisões da própria unidade"
  on log_decisoes for select
  to authenticated
  using (
    current_role_frota() = 'unidade'
    and exists (
      select 1 from solicitacoes
      where solicitacoes.id = log_decisoes.solicitacao_id
        and solicitacoes.unidade = current_unidade_frota()
    )
  );

-- Gestão de compras: conecta toda compra de peça à placa do veículo, ao
-- fornecedor e ao histórico de preço/prazo — permite checar garantia e
-- comparar fornecedores. Entra pelo fluxo existente (uma solicitação
-- vinculada/aprovada vira o ponto de partida de um registro de compra),
-- mas "compras.solicitacao_id" fica nullable para não travar um eventual
-- registro avulso no futuro.

-- =========================================================================
-- Fornecedores
-- =========================================================================

create table if not exists fornecedores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cnpj text,
  -- Mesmo espírito de normalize_reference/referencia_normalizada: evita
  -- cadastrar o mesmo fornecedor duas vezes só porque o CNPJ foi digitado
  -- com pontuação diferente.
  cnpj_normalizado text generated always as (regexp_replace(coalesce(cnpj, ''), '[^0-9]', '', 'g')) stored,
  -- Nota de avaliação do fornecedor (1-5) — coluna prevista no modelo de
  -- dados, mas sem tela de edição nesta rodada (o formulário de cadastro
  -- rápido dentro de "Registrar Compra" só pede nome/CNPJ); fica pronta
  -- pra quando existir uma tela dedicada de fornecedores.
  avaliacao smallint check (avaliacao is null or avaliacao between 1 and 5),
  created_at timestamptz not null default now()
);

create unique index if not exists idx_fornecedores_cnpj_normalizado
  on fornecedores (cnpj_normalizado)
  where cnpj_normalizado <> '';

alter table fornecedores enable row level security;

create policy "fornecedores: leitura autenticada"
  on fornecedores for select
  to authenticated
  using (true);

create policy "fornecedores: escrita só suprimentos"
  on fornecedores for insert
  to authenticated
  with check (current_role_frota() = 'suprimentos');

create policy "fornecedores: atualização só suprimentos"
  on fornecedores for update
  to authenticated
  using (current_role_frota() = 'suprimentos')
  with check (current_role_frota() = 'suprimentos');

-- =========================================================================
-- Placas (veículos)
-- =========================================================================

create table if not exists placas (
  -- A própria placa normalizada (maiúscula, sem espaço/hífen) é a chave —
  -- não há necessidade de um id substituto separado pra uma entidade que
  -- já tem um identificador natural único.
  placa text primary key,
  modelo_veiculo text not null,
  unidade text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_placas_unidade on placas (unidade);

alter table placas enable row level security;

-- Leitura aberta a qualquer autenticado: histórico por placa é acessível
-- em modo leitura pelo painel da Unidade também (ver pedido do módulo de
-- compras), além do Suprimentos precisar buscar/cadastrar placa ao
-- registrar uma compra.
create policy "placas: leitura autenticada"
  on placas for select
  to authenticated
  using (true);

create policy "placas: escrita só suprimentos"
  on placas for insert
  to authenticated
  with check (current_role_frota() = 'suprimentos');

-- =========================================================================
-- Compras
-- =========================================================================

create table if not exists compras (
  id uuid primary key default gen_random_uuid(),
  solicitacao_id uuid references solicitacoes (id),
  peca_id uuid not null references catalogo_padrao (id),
  fornecedor_id uuid not null references fornecedores (id),
  preco numeric(12, 2) not null check (preco >= 0),
  data_compra date not null default current_date,
  -- Prazos em dias corridos a partir de data_compra. prazo_real fica
  -- nullable de propósito: no momento de registrar a compra (às vezes só
  -- na chegada da NF) a entrega pode ainda não ter acontecido/sido
  -- confirmada — os outros 3 campos (preço, prazo prometido, NF) são
  -- sempre conhecidos nesse momento, por isso ficam obrigatórios.
  prazo_prometido_dias int not null check (prazo_prometido_dias >= 0),
  prazo_real_dias int check (prazo_real_dias is null or prazo_real_dias >= 0),
  nota_fiscal text not null,
  placa text references placas (placa),
  garantia_ate date,
  created_at timestamptz not null default now()
);

create index if not exists idx_compras_placa on compras (placa);
create index if not exists idx_compras_peca on compras (peca_id);
create index if not exists idx_compras_fornecedor on compras (fornecedor_id);
create index if not exists idx_compras_solicitacao on compras (solicitacao_id);

alter table compras enable row level security;

-- Leitura aberta a qualquer autenticado (mesmo motivo de placas: histórico
-- por placa em modo leitura no painel da Unidade, e o comparativo de
-- fornecedores por peça também precisa ler compras de fora do Suprimentos
-- eventualmente).
create policy "compras: leitura autenticada"
  on compras for select
  to authenticated
  using (true);

create policy "compras: escrita só suprimentos"
  on compras for insert
  to authenticated
  with check (current_role_frota() = 'suprimentos');

create policy "compras: atualização só suprimentos"
  on compras for update
  to authenticated
  using (current_role_frota() = 'suprimentos')
  with check (current_role_frota() = 'suprimentos');

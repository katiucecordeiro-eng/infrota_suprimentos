-- RFQ (pedido de orçamento): o Suprimentos manda a mesma peça pra 2-3
-- fornecedores comparar preço/prazo antes de decidir a compra. Cada envio
-- vira uma linha própria (1 solicitação x N fornecedores = N linhas), com
-- um token só seu — o fornecedor acessa por link público
-- (/orcamento/[token]), sem precisar de conta/login. Sem envio de e-mail
-- nesta rodada (nenhum provedor configurado ainda): o link é gerado e
-- copiado manualmente pelo Suprimentos pra mandar por fora (WhatsApp,
-- e-mail direto etc.) — a coluna `enviado_em`/o texto "e-mail" no pedido
-- original ficam prontos pra quando existir um provedor.

create table if not exists orcamentos (
  id uuid primary key default gen_random_uuid(),
  solicitacao_id uuid not null references solicitacoes (id),
  fornecedor_id uuid not null references fornecedores (id),
  -- Token opaco e não sequencial: é a única credencial de acesso da página
  -- pública, então tem que ser impossível de adivinhar/enumerar.
  token uuid not null default gen_random_uuid(),
  status text not null default 'aguardando'
    check (status in ('aguardando', 'respondido', 'expirado')),
  preco numeric(12, 2) check (preco is null or preco >= 0),
  prazo_entrega_dias int check (prazo_entrega_dias is null or prazo_entrega_dias >= 0),
  observacoes text,
  criado_por uuid not null references profiles (id),
  enviado_em timestamptz not null default now(),
  respondido_em timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_orcamentos_token on orcamentos (token);
create index if not exists idx_orcamentos_solicitacao on orcamentos (solicitacao_id);
create index if not exists idx_orcamentos_fornecedor on orcamentos (fornecedor_id);

alter table orcamentos enable row level security;

-- Sem policy nenhuma pra `anon`/página pública de propósito: a página do
-- fornecedor (sem login) usa o client de service role
-- (lib/supabase/admin.ts, já reservado no projeto pra isso), que ignora
-- RLS — o token é a única verificação de autorização nesse caminho, nunca
-- uma policy de RLS pra anon (evita abrir uma policy ampla só pra esse
-- caso único).
create policy "orcamentos: leitura suprimentos, frota corporativo e admin"
  on orcamentos for select
  to authenticated
  using (
    current_role_frota() in ('suprimentos', 'frota_corporativo')
    or current_is_admin_frota()
  );

create policy "orcamentos: insert só suprimentos/admin"
  on orcamentos for insert
  to authenticated
  with check (
    (current_role_frota() = 'suprimentos' or current_is_admin_frota())
    and criado_por = auth.uid()
  );

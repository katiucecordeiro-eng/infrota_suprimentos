-- Acesso "admin": um usuário pode ter is_admin=true pra navegar pelos 3
-- painéis a partir da mesma conta, sem precisar de 3 logins separados.
-- Escopo deliberadamente pequeno: quase todas as policies de leitura já
-- são abertas a qualquer autenticado (catalogo_padrao, familias,
-- fornecedores, placas, compras) e a de solicitacoes/log_decisoes já
-- libera geral pra quem tem role='suprimentos' — o único ponto realmente
-- travado por role é a inserção de solicitação pela Unidade (exige
-- role='unidade' E unidade = current_unidade_frota()), corrigido abaixo.
-- profiles.role continua sendo o "painel padrão" (pra onde login/"/"
-- mandam) — is_admin só destrava navegar pros outros também.

alter table profiles add column if not exists is_admin boolean not null default false;

create or replace function current_is_admin_frota()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(is_admin, false) from profiles where id = auth.uid();
$$;

-- Mesmo ajuste de 0002/0003: revoga o grant implícito de PUBLIC e o
-- explícito de anon (Supabase concede os dois por padrão em toda função
-- nova do schema public) — senão o advisor de segurança acusa a função
-- como executável por anon sem necessidade. Mantém "authenticated": as
-- policies de RLS que chamam essa função rodam como authenticated.
revoke execute on function current_is_admin_frota() from public;
revoke execute on function current_is_admin_frota() from anon;

drop policy if exists "solicitacoes: unidade insere para a própria unidade" on solicitacoes;
create policy "solicitacoes: unidade insere para a própria unidade"
  on solicitacoes for insert
  to authenticated
  with check (
    current_is_admin_frota()
    or (
      current_role_frota() = 'unidade'
      and unidade = current_unidade_frota()
      and solicitante_id = auth.uid()
    )
  );

-- =========================================================================
-- Dados de veículo mais completos em `placas`, pedidos pra aparecer ao
-- selecionar a placa no registro de compra (importante pra decisão de
-- compra: modelo, chassi, ano).
-- =========================================================================

alter table placas add column if not exists chassi text;
alter table placas add column if not exists ano int check (ano is null or ano between 1950 and 2100);

alter table placas add column if not exists chassi_normalizado text
  generated always as (upper(regexp_replace(coalesce(chassi, ''), '[^A-Za-z0-9]', '', 'g'))) stored;

create unique index if not exists idx_placas_chassi_normalizado
  on placas (chassi_normalizado)
  where chassi_normalizado <> '';

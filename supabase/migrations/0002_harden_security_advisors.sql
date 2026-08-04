-- Resolve os avisos do linter de segurança do Supabase gerados pela
-- migration 0001: search_path mutável em funções, extensão pg_trgm
-- instalada no schema public, e funções SECURITY DEFINER executáveis
-- por anon sem necessidade (nenhuma policy deste módulo usa `to anon`).

alter function normalize_reference(text) set search_path = public;
alter function set_solicitacao_defaults() set search_path = public;
alter function set_updated_at() set search_path = public;
alter function buscar_itens_similares(text, text, uuid, int) set search_path = public;

-- pg_trgm para o schema extensions (já no search_path por padrão do
-- projeto) em vez de public — recria os índices gin que dependem dele.
drop index if exists idx_catalogo_padrao_nome_trgm;
alter extension pg_trgm set schema extensions;
create index idx_catalogo_padrao_nome_trgm on catalogo_padrao using gin (nome_padronizado extensions.gin_trgm_ops);

-- current_role_frota/current_unidade_frota continuam executáveis por
-- "authenticated" de propósito (as policies de RLS deste módulo, todas
-- `to authenticated`, dependem disso) — só revoga de "anon", que não é
-- usado por nenhuma policy aqui (login é obrigatório para tudo).
revoke execute on function current_role_frota() from anon;
revoke execute on function current_unidade_frota() from anon;

-- handle_new_user_frota só deve rodar via o trigger em auth.users — a
-- invocação do trigger não depende de EXECUTE do role conectado, então
-- revogar de public/anon/authenticated não quebra o cadastro de usuário.
revoke execute on function handle_new_user_frota() from public;

-- A revogação anterior (migration 0002) mirou o role "anon" diretamente,
-- mas o acesso de anon vinha do grant implícito a PUBLIC (default do
-- Postgres ao criar função) — por isso o advisor de segurança continuou
-- acusando essas 3 funções mesmo depois de 0002. Confirmado consultando
-- pg_proc.proacl: current_role_frota/current_unidade_frota tinham um
-- grant "=X" (PUBLIC) além do explícito a "authenticated"; e
-- handle_new_user_frota tinha grants explícitos a anon/authenticated que
-- o Supabase concede por padrão em toda função nova do schema public
-- (ALTER DEFAULT PRIVILEGES), não cobertos pelo "revoke ... from public"
-- de 0002.

revoke execute on function current_role_frota() from public;
revoke execute on function current_unidade_frota() from public;
revoke execute on function handle_new_user_frota() from anon, authenticated;

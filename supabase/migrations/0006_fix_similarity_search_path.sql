-- A migration 0002 endureceu o search_path de buscar_itens_similares para
-- só "public" e, na mesma migration, moveu a extensão pg_trgm para o
-- schema "extensions" — isso quebrou a própria função: similarity() passou
-- a não ser encontrada (search_path não inclui mais "extensions"), e toda
-- chamada via /rest/v1/rpc/buscar_itens_similares falha (PostgREST devolve
-- 404, já que a função nunca completa a execução). Corrige incluindo
-- "extensions" no search_path da função.
alter function buscar_itens_similares(text, text, uuid, int)
  set search_path = public, extensions;

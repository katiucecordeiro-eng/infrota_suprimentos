# Ecossistema Frota x Suprimentos

Módulo do Hub "Gestão em Movimento" que elimina cadastro duplicado de itens
"quase iguais" no ERP Benner: a unidade nunca cadastra item direto — ela
solicita, e o Suprimentos valida e cadastra no padrão.

Repositório dedicado (não existia um Hub "Gestão em Movimento" nem os painéis
"Farol Frota"/"Planner Corporativo" em nenhum repositório acessível no momento
em que este módulo foi criado — ele nasceu num repo de outro projeto por
engano e foi movido para cá). Segue a paleta descrita no pedido original
(navy `#0a0e1a`, laranja `#ff6b1a`) e a arquitetura de referência do projeto
que serviu de modelo (KTracker CRM): Next.js App Router + TypeScript +
Tailwind v4 + Supabase (`@supabase/ssr`) + componentes `components/ui/`
escritos à mão no padrão shadcn/ui + Server Actions com Zod.

## Estado atual

Os 3 painéis do pedido original estão implementados:

- **Schema completo** (`supabase/migrations/`): `profiles` (papel + unidade
  + `is_admin`), `familias` (lookup, seed com 12 categorias), `solicitacoes`,
  `catalogo_padrao`, `log_decisoes`, `fornecedores`, `placas`, `compras`,
  função `buscar_itens_similares` (match exato por referência normalizada +
  fallback por similaridade textual via `pg_trgm`), RLS por papel, bucket de
  Storage para fotos.
- **Login + guarda de papel** (`app/login/`, `lib/auth/profile.ts`): 3 papéis
  (`unidade`, `suprimentos`, `frota_corporativo`), cada um só acessa seu
  painel — redirect automático pela home de cada papel. Quem tem
  `is_admin = true` navega pelos 3 painéis a partir da mesma conta (trocador
  na sidebar).
- **Painel do Suprimentos** (`app/(suprimentos)/`):
  - `/fila`: fila de pendentes ordenada por SLA mais urgente primeiro.
  - `/solicitacoes/[id]`: ao abrir, transiciona `pendente` → `em_analise`
    automaticamente; roda a busca por similaridade; permite **Vincular a
    item existente** (encerra sem criar item novo), **Aprovar como item
    novo** (formulário com nome padronizado sugerido por template, código
    Benner, NCM/CEST, unidade de medida — grava na tabela-espelho
    `catalogo_padrao`) ou **Rejeitar** (não estava no pedido original, mas
    o enum de status já previa `rejeitado` — sem essa ação a fila teria
    solicitações inválidas presas para sempre).
  - `/solicitacoes/[id]/compra`: **Registrar Compra** depois de aprovar —
    fornecedor, preço, prazos, nota fiscal e placa do veículo (existente,
    com modelo/chassi/ano, ou cadastrada na hora).
- **Painel da Unidade** (`app/(unidade)/`):
  - `/buscar`: busca de item existente (mesma RPC de similaridade do
    Suprimentos) antes de abrir uma solicitação nova — evita duplicidade já
    na ponta de quem pede.
  - `/solicitar`: formulário de **"Requisição de Compra"** — tipo de
    requisição (Emergencial/Compra Mensal/Estoque), família, descrição,
    referência do fabricante, código/marca/modelo da peça, aplicação, lado,
    unidade de medida, fornecedor sugerido (opcional), foto e placa do
    veículo (obrigatória: uma placa cadastrada da própria unidade **ou**
    "Item para Estoque" — `solicitacoes_placa_ou_estoque` no banco garante
    isso).
  - `/minhas-solicitacoes`: histórico das solicitações da própria unidade
    (compartilhado entre todo mundo do mesmo CDD), com status.
  - `/minhas-solicitacoes/[id]`: acompanhamento read-only de uma requisição
    — detalhes, timeline, decisão do Suprimentos (vinculado/aprovado/
    rejeitado) e dados da compra quando já registrada.
- **Painel Frota Corporativo** (`app/(governanca)/governanca`): KPIs
  agregados de todas as unidades (total de solicitações, abertas x
  fechadas, SLA médio de resposta e % dentro do prazo, % de duplicidade
  evitada a partir de `log_decisoes`) + ranking de unidades por volume/SLA.
  Calculado direto de `solicitacoes`/`log_decisoes` no servidor (sem view
  dedicada — volume baixo o suficiente pra não justificar uma).
- **Orçamentos com fornecedores (RFQ)**: na página de detalhe da
  solicitação (Suprimentos), depois do item aprovado/vinculado, um
  formulário deixa selecionar 1+ fornecedores e cria um pedido de orçamento
  por fornecedor (tabela `orcamentos`), cada um com um link público próprio
  (`/orcamento/[token]`) pro fornecedor preencher preço/prazo/observações
  **sem precisar de conta** — o token é a única credencial de acesso
  (`lib/frota/orcamento-publico.ts`, roda com a service role key, ignora
  RLS). Suprimentos copia o link e manda por fora (WhatsApp, e-mail manual
  etc.) e depois compara as respostas lado a lado na mesma seção. **Sem
  envio de e-mail automático nesta rodada** — nenhum provedor (Resend/SMTP/
  etc.) foi configurado; é o próximo passo natural quando a usuária
  escolher um.

## Ainda não implementado

- Criação de usuários/atribuição de papel e unidade ainda é manual via SQL
  (`profiles.role`/`profiles.unidade`/`profiles.is_admin`) — não há tela de
  administração.

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # preencher com um projeto Supabase
npm run dev                  # http://localhost:3000
```

Rode a migration em `supabase/migrations/0001_init.sql` no projeto Supabase
deste módulo. Depois de criar o primeiro usuário via
Supabase Auth, ele nasce com `role = 'unidade'` e `unidade = NULL`
(trigger `handle_new_user_frota`) — promova manualmente via SQL, ex.:

```sql
update profiles set role = 'suprimentos' where id = '<uuid do usuário>';
```

## Infraestrutura

- **Supabase**: projeto dedicado `infrota-suprimentos` (ref `ttkefolvafbaeodjdedl`,
  região `sa-east-1`, plano free), na mesma organização dos outros projetos
  Supabase da conta. As 3 migrations em `supabase/migrations/` já foram
  aplicadas nele (`0001_init`, e `0002`/`0003` de hardening — ver advisors
  abaixo). URL e chave anon: pegue em Supabase → Project Settings → API
  (ou peça pra quem tiver acesso à conta) e cole no `.env.local`/nas env
  vars da Vercel — a chave anon é pública por design (protegida pela RLS
  do schema), não precisa ser tratada como segredo.
- **Advisors de segurança**: limpos, exceto 2 avisos aceitos conscientemente
  — `current_role_frota()`/`current_unidade_frota()` continuam executáveis
  por `authenticated` via RPC direto porque as policies de RLS deste módulo
  dependem disso (revogar quebraria toda consulta autenticada); as duas
  funções só devolvem o papel/unidade do próprio usuário logado, então
  chamá-las direto não vaza nada que o usuário já não soubesse sobre si
  mesmo.
- **Vercel**: sem integração automatizada nesta sessão (nenhuma ferramenta
  com permissão de escrita na Vercel disponível aqui — só um conector de
  leitura de projetos/deployments). Deploy manual:
  1. No dashboard da Vercel: **Add New → Project** → importar
     `katiucecordeiro-eng/infrota_suprimentos` do GitHub.
  2. Root Directory: deixe na raiz (o projeto Next.js já está na raiz do
     repo, não numa subpasta).
  3. Em **Environment Variables**, adicione `NEXT_PUBLIC_SUPABASE_URL`,
     `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` (as 3 em
     Supabase → Project Settings → API do projeto acima — a service role key
     é secreta, nunca commitar) e `NEXT_PUBLIC_APP_URL` (a URL que a Vercel
     vai atribuir, ex. `https://infrota-suprimentos.vercel.app` — dá pra
     ajustar depois do primeiro deploy). **A partir da funcionalidade de
     orçamento com fornecedores, `SUPABASE_SERVICE_ROLE_KEY` passou a ser
     obrigatória** (a página pública `/orcamento/[token]` usa ela pra
     ignorar RLS e resolver o pedido só pelo token) — sem ela, essa página
     quebra com erro 500 (`supabaseKey is required`); o resto do app
     continua funcionando normalmente.
  4. **Deploy**. Build command/output já são os padrões do Next.js, nada a
     configurar.
  5. Depois do primeiro deploy: criar o primeiro usuário via Supabase Auth
     (dashboard → Authentication → Users → Add user) e promover o papel
     dele via SQL (ver seção "Rodando localmente" acima) — sem isso
     ninguém consegue logar em nenhum papel além de `unidade`.

## Decisões e limitações assumidas

- **Código Benner não é gerado pelo sistema.** O fluxo real é: Suprimentos
  cadastra o item no Benner (fora deste app) e cola o código resultante no
  formulário de aprovação — `catalogo_padrao` é uma tabela-espelho, não a
  fonte da verdade do Benner.
- **Normalização de referência não remove acentos** (só minúsculas +
  caracteres não alfanuméricos) — `unaccent()` do Postgres não é `IMMUTABLE`
  por padrão, então não pode compor a coluna gerada `referencia_normalizada`
  sem um wrapper de confiabilidade não testada. Na prática, referência de
  fabricante costuma ser alfanumérica, então o impacto é baixo; documentar
  aqui para revisar se aparecer um caso real de referência acentuada.
- **SLA de 48h é heurística fixa** (`set_solicitacao_defaults()` na
  migration), sem SLA contratual documentado por trás — ajustável.
- **Transição para "Em Análise" acontece ao abrir a solicitação pela
  primeira vez** (não há um botão explícito "Iniciar análise") — decisão de
  UX para não adicionar um clique extra antes da busca por similaridade, que
  já roda automaticamente.
- **RLS de leitura de `profiles` e `catalogo_padrao` é aberta a qualquer
  autenticado** (não só ao próprio papel) — necessário para exibir nomes em
  joins e para a futura busca de item existente no Painel da Unidade. Sem
  dado sensível nessas duas tabelas, então o trade-off é aceitável.

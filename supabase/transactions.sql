-- Execute no SQL Editor do seu projeto Supabase.
-- Cria uma tabela nova ou preserva a tabela existente e seus registros.
-- Se a tabela já existir, confira se possui as colunas abaixo antes de executar.
begin;

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  amount_cents integer not null check (amount_cents > 0),
  type text not null check (type in ('income', 'expense')),
  category text not null check (category in ('Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Lazer', 'Outros')),
  date date not null,
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_id_id_idx on public.transactions (user_id, id);
alter table public.transactions enable row level security;
grant select, insert, delete on public.transactions to authenticated;
revoke all on public.transactions from anon;

-- A regra restritiva também limita eventuais políticas permissivas já existentes.
-- Não se aplica ao administrador/service_role: essas credenciais nunca vão no frontend.
drop policy if exists "poupae_owner_guard" on public.transactions;
create policy "poupae_owner_guard" on public.transactions
  as restrictive for all to public
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "poupae_select_own" on public.transactions;
create policy "poupae_select_own" on public.transactions
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "poupae_insert_own" on public.transactions;
create policy "poupae_insert_own" on public.transactions
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "poupae_delete_own" on public.transactions;
create policy "poupae_delete_own" on public.transactions
  for delete to authenticated using ((select auth.uid()) = user_id);

commit;
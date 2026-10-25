begin;

do $$
declare
  rule record;
  category_column smallint;
begin
  select attnum into category_column from pg_attribute
    where attrelid = 'public.transactions'::regclass and attname = 'category' and not attisdropped;
  for rule in select conname from pg_constraint
    where conrelid = 'public.transactions'::regclass and contype = 'c'
      and conkey = array[category_column]::smallint[]
  loop
    execute format('alter table public.transactions drop constraint %I', rule.conname);
  end loop;
end;
$$;

alter table public.transactions add constraint transactions_category_check
  check (char_length(category) between 1 and 60 and category = btrim(category) and category !~ '[[:cntrl:]]');

create table if not exists public.categories (
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60 and name = btrim(name) and name !~ '[[:cntrl:]]'),
  name_key text not null check (char_length(name_key) between 1 and 120 and name_key = btrim(name_key) and name_key !~ '[[:cntrl:]]'),
  created_at timestamptz not null default now(),
  primary key (user_id, name_key)
);

alter table public.categories enable row level security;
revoke all on public.categories from public, anon, authenticated;
grant select, insert on public.categories to authenticated;

drop policy if exists categories_owner_guard on public.categories;
create policy categories_owner_guard on public.categories
  as restrictive for all to public
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists categories_select_own on public.categories;
create policy categories_select_own on public.categories
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists categories_insert_own on public.categories;
create policy categories_insert_own on public.categories
  for insert to authenticated with check ((select auth.uid()) = user_id);

commit;

begin;

create table if not exists public.feedback_requests (
  user_id uuid not null references auth.users(id) on delete cascade,
  submission_id uuid not null,
  payload_hash text not null check (payload_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  primary key (user_id, submission_id)
);
create index if not exists feedback_requests_user_created_idx
  on public.feedback_requests (user_id, created_at);
alter table public.feedback_requests enable row level security;
revoke all on public.feedback_requests from public, anon, authenticated;

create or replace function public.reserve_feedback(submission_id uuid, payload_hash text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  account_id uuid := auth.uid();
  previous public.feedback_requests%rowtype;
begin
  if account_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if submission_id is null or payload_hash is null or payload_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid submission' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(account_id::text, 91824));
  select r.* into previous from public.feedback_requests r
    where r.user_id = account_id and r.submission_id = reserve_feedback.submission_id;
  if found then
    if previous.payload_hash <> reserve_feedback.payload_hash then return 'conflict'; end if;
    if previous.created_at < now() - interval '23 hours' then return 'expired'; end if;
    return 'allowed';
  end if;

  if (select count(*) from public.feedback_requests r
      where r.user_id = account_id and r.created_at > now() - interval '1 hour') >= 5 then
    return 'rate_limited';
  end if;
  insert into public.feedback_requests(user_id, submission_id, payload_hash)
    values (account_id, reserve_feedback.submission_id, reserve_feedback.payload_hash);
  return 'allowed';
end;
$$;
revoke all on function public.reserve_feedback(uuid, text) from public, anon;
grant execute on function public.reserve_feedback(uuid, text) to authenticated;

commit;

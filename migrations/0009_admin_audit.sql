create table if not exists public.admin_audit_logs (
  id         uuid primary key default gen_random_uuid(),
  admin_id   uuid references public.profiles(id),
  action     text not null,
  entity     text,
  entity_id  uuid,
  details    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_admin_idx
  on public.admin_audit_logs (admin_id, created_at desc);
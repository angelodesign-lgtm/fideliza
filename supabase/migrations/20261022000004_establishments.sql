create table if not exists public.establishments (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid not null references public.profiles(id) on delete cascade,
  name              text not null,
  category          text,
  business_type     text,
  description       text,
  address           text,
  phone             text,
  website           text,
  whatsapp_url      text,
  location_url      text,
  public_link_url   text,
  opening_hours     text,
  logo_url          text,
  gallery           jsonb not null default '[]'::jsonb,
  gallery_urls      jsonb not null default '[]'::jsonb,
  is_public         boolean not null default false,
  is_approved       boolean not null default false,
  moderation_status text not null default 'pending'
                    check (moderation_status in ('pending','approved','rejected','suspended')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create unique index if not exists establishments_owner_key on public.establishments (owner_id);
create index if not exists establishments_public_idx
  on public.establishments (is_public, is_approved, category);

create or replace function public.sync_establishment_moderation()
returns trigger language plpgsql as $$
begin
  if new.moderation_status is distinct from old.moderation_status then
    new.is_approved := (new.moderation_status = 'approved');
    new.is_public   := new.is_public and new.is_approved;
  elsif new.is_approved is distinct from old.is_approved then
    new.moderation_status := case when new.is_approved then 'approved' else 'pending' end;
  end if;
  return new;
end;
$$;

create or replace trigger establishments_sync_moderation
before update on public.establishments
for each row execute function public.sync_establishment_moderation();

create or replace trigger establishments_touch
before update on public.establishments
for each row execute function public.touch_updated_at();
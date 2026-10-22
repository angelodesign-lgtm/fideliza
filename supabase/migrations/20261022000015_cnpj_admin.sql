-- Fideliza: salva os documentos do cadastro e mostra o CNPJ na área administrativa.
-- Execute no SQL Editor do Supabase. Não apaga dados existentes.

-- Sincroniza CPF/CNPJ informado no cadastro com o perfil usado pela busca por CPF.
-- Mantém também a gravação do plano selecionado pelo lojista no cadastro.
alter table public.profiles add column if not exists cnpj text;
alter table public.profiles add column if not exists requested_billing_plan_id uuid references public.fideliza_billing_plans(id) on delete set null;

create or replace function public.fideliza_sync_signup_metadata_to_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_metadata jsonb;
  v_document_type text;
  v_document text;
  v_plan_text text;
  v_plan_id uuid;
begin
  select u.raw_user_meta_data into v_metadata
  from auth.users u where u.id = new.id;
  if v_metadata is null then return new; end if;

  v_document_type := lower(coalesce(v_metadata ->> 'document_type', ''));
  v_document := regexp_replace(coalesce(v_metadata ->> 'document_number', ''), '[^0-9]', '', 'g');
  v_plan_text := coalesce(v_metadata ->> 'requested_billing_plan_id', '');

  if v_document_type not in ('cpf', 'cnpj') or
     (v_document_type = 'cpf' and length(v_document) <> 11) or
     (v_document_type = 'cnpj' and length(v_document) <> 14) then
    raise exception 'Informe um CPF ou CNPJ válido para criar a conta.' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.profiles p
    where p.id <> new.id and (
      (v_document_type = 'cpf' and p.cpf = v_document) or
      (v_document_type = 'cnpj' and p.cnpj = v_document)
    )
  ) then
    raise exception 'Este CPF ou CNPJ já está cadastrado no Fideliza.' using errcode = '23505';
  end if;

  if v_plan_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    v_plan_id := v_plan_text::uuid;
    if not exists (select 1 from public.fideliza_billing_plans p where p.id = v_plan_id and p.is_active) then
      raise exception 'O plano selecionado não está disponível.' using errcode = '22023';
    end if;
  else
    v_plan_id := null;
  end if;

  update public.profiles p
  set cpf = case when v_document_type = 'cpf' then v_document else null end,
      cnpj = case when v_document_type = 'cnpj' then v_document else null end,
      requested_billing_plan_id = case when coalesce(v_metadata ->> 'role', '') = 'lojista' then v_plan_id else null end
  where p.id = new.id;
  return new;
end;
$$;
revoke all on function public.fideliza_sync_signup_metadata_to_profile() from public, anon, authenticated;
drop trigger if exists fideliza_sync_signup_metadata_to_profile on public.profiles;
create trigger fideliza_sync_signup_metadata_to_profile
after insert on public.profiles
for each row execute function public.fideliza_sync_signup_metadata_to_profile();

-- Recupera documentos de contas já existentes quando estavam apenas nos metadados de cadastro.
update public.profiles p
set cpf = case when lower(coalesce(u.raw_user_meta_data ->> 'document_type', '')) = 'cpf'
                    and length(regexp_replace(coalesce(u.raw_user_meta_data ->> 'document_number', ''), '[^0-9]', '', 'g')) = 11
               then regexp_replace(coalesce(u.raw_user_meta_data ->> 'document_number', ''), '[^0-9]', '', 'g')
               else p.cpf end,
    cnpj = case when lower(coalesce(u.raw_user_meta_data ->> 'document_type', '')) = 'cnpj'
                     and length(regexp_replace(coalesce(u.raw_user_meta_data ->> 'document_number', ''), '[^0-9]', '', 'g')) = 14
                then regexp_replace(coalesce(u.raw_user_meta_data ->> 'document_number', ''), '[^0-9]', '', 'g')
                else p.cnpj end
from auth.users u
where u.id = p.id
  and (
    (p.cpf is null and lower(coalesce(u.raw_user_meta_data ->> 'document_type', '')) = 'cpf')
    or (p.cnpj is null and lower(coalesce(u.raw_user_meta_data ->> 'document_type', '')) = 'cnpj')
  );

create or replace function public.fideliza_admin_list_establishments_with_cnpj()
returns table (
  id uuid,
  name text,
  business_type text,
  address text,
  phone text,
  cnpj text,
  is_public boolean,
  is_approved boolean,
  moderation_status text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  ) then
    raise exception 'Somente o administrador pode consultar os estabelecimentos.'
      using errcode = '42501';
  end if;

  return query
  select
    e.id,
    e.name::text,
    e.business_type::text,
    e.address::text,
    e.phone::text,
    p.cnpj::text,
    e.is_public,
    e.is_approved,
    e.moderation_status::text,
    e.created_at
  from public.establishments e
  left join public.profiles p on p.id = e.owner_id
  order by e.created_at desc;
end;
$$;

revoke all on function public.fideliza_admin_list_establishments_with_cnpj() from public, anon;
grant execute on function public.fideliza_admin_list_establishments_with_cnpj() to authenticated;

-- Garante índices de consulta dos documentos, sem impor unicidade retroativa
-- que possa falhar caso já existam cadastros duplicados.
create index if not exists profiles_cpf_lookup_idx
  on public.profiles(cpf) where cpf is not null;
create index if not exists profiles_cnpj_lookup_idx
  on public.profiles(cnpj) where cnpj is not null;

-- Depende apenas de profiles. Precisa vir antes de qualquer policy.
create or replace function public.is_fideliza_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.fideliza_is_billing_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_fideliza_admin();
$$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.prevent_profile_role_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- auth.uid() nulo = acesso direto ao banco (SQL Editor / service role)
  if auth.uid() is null then
    return new;
  end if;
  if new.role is distinct from old.role and not public.is_fideliza_admin() then
    raise exception 'Alteracao de perfil nao permitida' using errcode = '42501';
  end if;
  return new;
end;
$$;

create or replace trigger profiles_protect_role
before update on public.profiles
for each row execute function public.prevent_profile_role_change();

create or replace trigger profiles_touch
before update on public.profiles
for each row execute function public.touch_updated_at();
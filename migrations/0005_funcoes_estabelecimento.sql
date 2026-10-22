create or replace function public.fideliza_owns_establishment(p_establishment_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.establishments
                 where id = p_establishment_id and owner_id = auth.uid());
$$;

create or replace function public.fideliza_establishment_active(p_establishment_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.establishments
                 where id = p_establishment_id
                   and is_approved = true
                   and moderation_status = 'approved');
$$;
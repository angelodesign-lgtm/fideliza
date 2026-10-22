create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_role text;
begin
  v_role := coalesce(new.raw_user_meta_data->>'role', 'cliente');
  if v_role not in ('cliente','lojista') then
    v_role := 'cliente';
  end if;

  insert into public.profiles (id, full_name, phone, cpf, cnpj, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    nullif(regexp_replace(coalesce(new.raw_user_meta_data->>'cpf',''),  '\D', '', 'g'), ''),
    nullif(regexp_replace(coalesce(new.raw_user_meta_data->>'cnpj',''), '\D', '', 'g'), ''),
    v_role
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

notify pgrst, 'reload schema';
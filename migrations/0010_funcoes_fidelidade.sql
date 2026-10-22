create or replace function public.find_fideliza_customer_by_cpf(p_cpf text)
returns table (id uuid, full_name text, qr_token uuid)
language sql stable security definer set search_path = public as $$
  select p.id, p.full_name, p.qr_token
  from public.profiles p
  where p.cpf = regexp_replace(p_cpf, '\D', '', 'g')
  limit 1;
$$;

create or replace function public.register_fideliza_purchase(
  p_establishment_id uuid, p_customer_id uuid, p_amount numeric
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_program  public.loyalty_programs%rowtype;
  v_tx_id    uuid;
  v_cashback numeric(12,2);
begin
  if not public.fideliza_establishment_active(p_establishment_id) then
    raise exception 'Estabelecimento nao aprovado';
  end if;

  select * into v_program from public.loyalty_programs
  where establishment_id = p_establishment_id and active = true;
  if not found then
    raise exception 'Programa de fidelidade inativo';
  end if;

  insert into public.loyalty_transactions
    (establishment_id, customer_id, amount, stamps_earned, created_by)
  values (p_establishment_id, p_customer_id, p_amount,
          case when v_program.benefit_type in ('pontos','ambos') then 1 else 0 end,
          auth.uid())
  returning id into v_tx_id;

  if v_program.benefit_type in ('cashback','ambos') and v_program.cashback_percent > 0 then
    v_cashback := round(p_amount * v_program.cashback_percent / 100, 2);
    if v_cashback > 0 then
      insert into public.cashback_transactions
        (establishment_id, customer_id, amount, transaction_type, purchase_transaction_id)
      values (p_establishment_id, p_customer_id, v_cashback, 'credit', v_tx_id);
    end if;
  end if;

  return v_tx_id;
end;
$$;

create or replace function public.redeem_fideliza_reward(
  p_establishment_id uuid, p_customer_id uuid, p_reward_description text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_program public.loyalty_programs%rowtype;
  v_earned  integer;
  v_spent   integer;
  v_id      uuid;
begin
  if not public.fideliza_establishment_active(p_establishment_id) then
    raise exception 'Estabelecimento nao aprovado';
  end if;

  select * into v_program from public.loyalty_programs
  where establishment_id = p_establishment_id;

  select coalesce(sum(stamps_earned),0) into v_earned
  from public.loyalty_transactions
  where establishment_id = p_establishment_id and customer_id = p_customer_id;

  select coalesce(sum(stamps_used),0) into v_spent
  from public.loyalty_redemptions
  where establishment_id = p_establishment_id and customer_id = p_customer_id;

  if (v_earned - v_spent) < v_program.stamps_required then
    raise exception 'Selos insuficientes';
  end if;

  insert into public.loyalty_redemptions
    (establishment_id, customer_id, reward_description, stamps_used, created_by)
  values (p_establishment_id, p_customer_id, p_reward_description,
          v_program.stamps_required, auth.uid())
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.redeem_fideliza_cashback(
  p_establishment_id uuid, p_customer_id uuid, p_amount numeric
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_balance numeric(12,2);
  v_id      uuid;
begin
  select coalesce(sum(case when transaction_type='credit' then amount else -amount end),0)
    into v_balance
  from public.cashback_transactions
  where establishment_id = p_establishment_id and customer_id = p_customer_id;

  if v_balance < p_amount then
    raise exception 'Saldo de cashback insuficiente';
  end if;

  insert into public.cashback_transactions
    (establishment_id, customer_id, amount, transaction_type)
  values (p_establishment_id, p_customer_id, p_amount, 'debit')
  returning id into v_id;

  return v_id;
end;
$$;
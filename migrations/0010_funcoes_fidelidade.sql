-- =========================================================
-- 0010_funcoes_fidelidade.sql
-- Depende de: 0005 (fideliza_establishment_active),
--            0006 (loyalty_*), 0007 (cashback_transactions)
-- =========================================================

-- ---------------------------------------------------------
-- Busca cliente por CPF.
--
-- Retorna JSON (objeto unico), NAO table.
-- O app le 'result.customer_name' diretamente: com RETURNS TABLE
-- o PostgREST devolve array e o campo chega undefined.
--
-- DROP obrigatorio: 'create or replace' nao altera tipo de retorno.
-- ---------------------------------------------------------
drop function if exists public.find_fideliza_customer_by_cpf(text);

create or replace function public.find_fideliza_customer_by_cpf(p_cpf text)
returns json
language sql
stable
security definer
set search_path = public
as $$
  -- subselect escalar: garante exatamente 1 linha, com null quando
  -- nao encontra, em vez de 0 linhas
  select (
    select to_jsonb(t)
    from (
      select
        p.id                                                as customer_id,
        coalesce(nullif(btrim(p.full_name), ''), 'Cliente') as customer_name,
        coalesce(nullif(btrim(p.full_name), ''), 'Cliente') as name,
        regexp_replace(coalesce(p.cpf, ''), '\D', '', 'g')  as cpf,
        p.qr_token,
        p.phone
      from public.profiles p
      where regexp_replace(coalesce(p.cpf, ''), '\D', '', 'g')
            = regexp_replace(coalesce(p_cpf, ''), '\D', '', 'g')
        and regexp_replace(coalesce(p_cpf, ''), '\D', '', 'g') <> ''
      limit 1
    ) t
  );
$$;

grant execute on function public.find_fideliza_customer_by_cpf(text)
  to authenticated;

-- ---------------------------------------------------------
-- Registra compra, credita selo e cashback conforme o programa
-- ---------------------------------------------------------
create or replace function public.register_fideliza_purchase(
  p_establishment_id uuid,
  p_customer_id uuid,
  p_amount numeric
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_program  public.loyalty_programs%rowtype;
  v_tx_id    uuid;
  v_cashback numeric(12,2);
begin
  if not public.fideliza_establishment_active(p_establishment_id) then
    raise exception 'Estabelecimento nao aprovado';
  end if;

  if p_amount is null or p_amount < 0 then
    raise exception 'Valor da compra invalido';
  end if;

  select *
    into v_program
  from public.loyalty_programs
  where establishment_id = p_establishment_id
    and active = true;

  if not found then
    raise exception 'Programa de fidelidade inativo';
  end if;

  -- selo so e creditado quando o programa oferece pontos
  insert into public.loyalty_transactions (
    establishment_id,
    customer_id,
    amount,
    stamps_earned,
    created_by
  )
  values (
    p_establishment_id,
    p_customer_id,
    coalesce(p_amount, 0),
    case when v_program.benefit_type in ('pontos','ambos') then 1 else 0 end,
    auth.uid()
  )
  returning id into v_tx_id;

  -- cashback so e creditado quando o programa oferece cashback
  if v_program.benefit_type in ('cashback','ambos')
     and coalesce(v_program.cashback_percent, 0) > 0
     and coalesce(p_amount, 0) > 0 then

    v_cashback := round(p_amount * v_program.cashback_percent / 100, 2);

    if v_cashback > 0 then
      insert into public.cashback_transactions (
        establishment_id,
        customer_id,
        amount,
        transaction_type,
        purchase_transaction_id
      )
      values (
        p_establishment_id,
        p_customer_id,
        v_cashback,
        'credit',
        v_tx_id
      );
    end if;
  end if;

  return v_tx_id;
end;
$$;

-- ---------------------------------------------------------
-- Resgata recompensa por selos
-- ---------------------------------------------------------
create or replace function public.redeem_fideliza_reward(
  p_establishment_id uuid,
  p_customer_id uuid,
  p_reward_description text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_program public.loyalty_programs%rowtype;
  v_earned  integer;
  v_used    integer;
  v_id      uuid;
begin
  if not public.fideliza_establishment_active(p_establishment_id) then
    raise exception 'Estabelecimento nao aprovado';
  end if;

  select *
    into v_program
  from public.loyalty_programs
  where establishment_id = p_establishment_id;

  if not found then
    raise exception 'Programa de fidelidade nao configurado';
  end if;

  if v_program.benefit_type = 'cashback' then
    raise exception 'Este programa nao oferece recompensa por selos';
  end if;

  select coalesce(sum(stamps_earned), 0)
    into v_earned
  from public.loyalty_transactions
  where establishment_id = p_establishment_id
    and customer_id = p_customer_id;

  select coalesce(sum(stamps_used), 0)
    into v_used
  from public.loyalty_redemptions
  where establishment_id = p_establishment_id
    and customer_id = p_customer_id;

  if (v_earned - v_used) < v_program.stamps_required then
    raise exception 'Selos insuficientes';
  end if;

  insert into public.loyalty_redemptions (
    establishment_id,
    customer_id,
    reward_description,
    stamps_used,
    created_by
  )
  values (
    p_establishment_id,
    p_customer_id,
    coalesce(nullif(btrim(coalesce(p_reward_description, '')), ''),
             v_program.reward_description),
    v_program.stamps_required,
    auth.uid()
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- ---------------------------------------------------------
-- Resgata cashback (debita saldo)
-- ---------------------------------------------------------
create or replace function public.redeem_fideliza_cashback(
  p_establishment_id uuid,
  p_customer_id uuid,
  p_amount numeric
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance numeric(12,2);
  v_id      uuid;
begin
  if not public.fideliza_establishment_active(p_establishment_id) then
    raise exception 'Estabelecimento nao aprovado';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Valor de cashback invalido';
  end if;

  select coalesce(
           sum(case when transaction_type = 'credit' then amount else -amount end),
           0
         )
    into v_balance
  from public.cashback_transactions
  where establishment_id = p_establishment_id
    and customer_id = p_customer_id;

  if v_balance < p_amount then
    raise exception 'Saldo de cashback insuficiente';
  end if;

  insert into public.cashback_transactions (
    establishment_id,
    customer_id,
    amount,
    transaction_type
  )
  values (
    p_establishment_id,
    p_customer_id,
    p_amount,
    'debit'
  )
  returning id into v_id;

  return v_id;
end;
$$;

notify pgrst, 'reload schema';
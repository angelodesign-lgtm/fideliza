-- =========================================================
-- 0011_funcoes_cobranca.sql
-- Depende de: 0005 (fideliza_owns_establishment),
--            0008 (tabelas de cobranca), 0009 (admin_audit_logs)
-- =========================================================

-- ---------------------------------------------------------
-- Aplica o plano escolhido no cadastro.
-- A assinatura pode ja existir (criada por trigger), por isso o
-- ON CONFLICT: a versao antiga exigia ausencia de assinatura e
-- nunca executava.
-- ---------------------------------------------------------
create or replace function public.fideliza_apply_initial_billing_plan(
  p_establishment_id uuid,
  p_plan_id uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan public.fideliza_billing_plans%rowtype;
begin
  if not public.fideliza_owns_establishment(p_establishment_id)
     and not public.is_fideliza_admin() then
    raise exception 'Sem permissao' using errcode = '42501';
  end if;

  select *
    into v_plan
  from public.fideliza_billing_plans
  where id = p_plan_id
    and is_active = true;

  if not found then
    raise exception 'Plano invalido ou inativo';
  end if;

  insert into public.fideliza_billing_subscriptions (
    establishment_id,
    plan_id,
    status,
    trial_ends_at,
    due_date,
    period_price,
    monthly_price,
    billing_cycle,
    period_months
  )
  values (
    p_establishment_id,
    p_plan_id,
    'trial',
    now() + make_interval(days => v_plan.trial_days),
    now() + make_interval(days => v_plan.trial_days),
    v_plan.period_price,
    v_plan.monthly_price,
    v_plan.billing_cycle,
    v_plan.period_months
  )
  on conflict (establishment_id) do update
    set plan_id       = excluded.plan_id,
        status        = 'trial',
        trial_ends_at = excluded.trial_ends_at,
        due_date      = excluded.due_date,
        period_price  = excluded.period_price,
        monthly_price = excluded.monthly_price,
        billing_cycle = excluded.billing_cycle,
        period_months = excluded.period_months,
        updated_at    = now()
    where public.fideliza_billing_subscriptions.status = 'trial';
end;
$$;

-- ---------------------------------------------------------
-- Registra pagamento e renova o periodo.
-- Aceita p_reference, que o app envia.
-- ---------------------------------------------------------
create or replace function public.fideliza_record_billing_payment(
  p_subscription_id uuid,
  p_amount numeric,
  p_reference text default null,
  p_method text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub     public.fideliza_billing_subscriptions%rowtype;
  v_plan    public.fideliza_billing_plans%rowtype;
  v_payment uuid;
  v_new_due timestamptz;
begin
  if not public.is_fideliza_admin() then
    raise exception 'Sem permissao' using errcode = '42501';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Valor de pagamento invalido';
  end if;

  select *
    into v_sub
  from public.fideliza_billing_subscriptions
  where id = p_subscription_id;

  if not found then
    raise exception 'Assinatura nao encontrada';
  end if;

  -- o plano vigente e o agendado, quando houver troca aprovada
  select *
    into v_plan
  from public.fideliza_billing_plans
  where id = coalesce(v_sub.pending_plan_id, v_sub.plan_id);

  if not found then
    raise exception 'Plano da assinatura nao encontrado';
  end if;

  -- renova a partir do vencimento atual, se ainda no futuro
  v_new_due := greatest(coalesce(v_sub.due_date, now()), now())
               + make_interval(months => v_plan.period_months);

  insert into public.fideliza_billing_payments (
    subscription_id,
    establishment_id,
    amount,
    method,
    reference,
    recorded_by
  )
  values (
    p_subscription_id,
    v_sub.establishment_id,
    p_amount,
    p_method,
    nullif(btrim(coalesce(p_reference, '')), ''),
    auth.uid()
  )
  returning id into v_payment;

  update public.fideliza_billing_subscriptions
     set plan_id                   = v_plan.id,
         pending_plan_id           = null,
         pending_plan_effective_at = null,
         status                    = 'active',
         current_period_start      = now(),
         current_period_end        = v_new_due,
         due_date                  = v_new_due,
         period_price              = v_plan.period_price,
         monthly_price             = v_plan.monthly_price,
         billing_cycle             = v_plan.billing_cycle,
         period_months             = v_plan.period_months,
         updated_at                = now()
   where id = p_subscription_id;

  insert into public.admin_audit_logs (admin_id, action, entity, entity_id, details)
  values (
    auth.uid(),
    'billing_payment_recorded',
    'fideliza_billing_payments',
    v_payment,
    jsonb_build_object(
      'amount', p_amount,
      'subscription_id', p_subscription_id,
      'plan_id', v_plan.id,
      'new_due_date', v_new_due
    )
  );

  return v_payment;
end;
$$;

-- ---------------------------------------------------------
-- Lojista solicita troca de plano
-- ---------------------------------------------------------
create or replace function public.fideliza_request_billing_plan_change(
  p_subscription_id uuid,
  p_requested_plan_id uuid
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub     public.fideliza_billing_subscriptions%rowtype;
  v_request uuid;
begin
  select *
    into v_sub
  from public.fideliza_billing_subscriptions
  where id = p_subscription_id;

  if not found then
    raise exception 'Assinatura nao encontrada';
  end if;

  if not public.fideliza_owns_establishment(v_sub.establishment_id)
     and not public.is_fideliza_admin() then
    raise exception 'Sem permissao' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.fideliza_billing_plans
    where id = p_requested_plan_id
      and is_active = true
  ) then
    raise exception 'Plano invalido ou inativo';
  end if;

  if p_requested_plan_id = v_sub.plan_id then
    raise exception 'O plano solicitado ja e o plano vigente';
  end if;

  if exists (
    select 1
    from public.fideliza_billing_plan_change_requests r
    where r.subscription_id = p_subscription_id
      and r.status = 'pending'
  ) then
    raise exception 'Ja existe uma solicitacao pendente para esta assinatura';
  end if;

  insert into public.fideliza_billing_plan_change_requests (
    subscription_id,
    establishment_id,
    requested_plan_id,
    requested_by
  )
  values (
    p_subscription_id,
    v_sub.establishment_id,
    p_requested_plan_id,
    auth.uid()
  )
  returning id into v_request;

  return v_request;
end;
$$;

-- ---------------------------------------------------------
-- Admin aprova ou rejeita a troca
-- ---------------------------------------------------------
create or replace function public.fideliza_admin_decide_billing_plan_change(
  p_request_id uuid,
  p_decision text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req public.fideliza_billing_plan_change_requests%rowtype;
  v_sub public.fideliza_billing_subscriptions%rowtype;
begin
  if not public.is_fideliza_admin() then
    raise exception 'Sem permissao' using errcode = '42501';
  end if;

  if p_decision not in ('approved','rejected') then
    raise exception 'Decisao invalida';
  end if;

  select *
    into v_req
  from public.fideliza_billing_plan_change_requests
  where id = p_request_id
    and status = 'pending';

  if not found then
    raise exception 'Solicitacao nao encontrada ou ja decidida';
  end if;

  update public.fideliza_billing_plan_change_requests
     set status     = p_decision,
         decided_by = auth.uid(),
         decided_at = now()
   where id = p_request_id;

  if p_decision = 'approved' then
    select *
      into v_sub
    from public.fideliza_billing_subscriptions
    where id = v_req.subscription_id;

    update public.fideliza_billing_subscriptions
       set pending_plan_id           = v_req.requested_plan_id,
           pending_plan_effective_at = coalesce(v_sub.due_date, now()),
           updated_at                = now()
     where id = v_req.subscription_id;
  end if;

  insert into public.admin_audit_logs (admin_id, action, entity, entity_id, details)
  values (
    auth.uid(),
    'billing_plan_change_' || p_decision,
    'fideliza_billing_plan_change_requests',
    p_request_id,
    jsonb_build_object(
      'subscription_id', v_req.subscription_id,
      'requested_plan_id', v_req.requested_plan_id
    )
  );
end;
$$;

notify pgrst, 'reload schema';
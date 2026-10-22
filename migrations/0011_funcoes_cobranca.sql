create or replace function public.fideliza_apply_initial_billing_plan(
  p_establishment_id uuid, p_plan_id uuid
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_trial_days integer;
  v_plan       public.fideliza_billing_plans%rowtype;
begin
  if not public.fideliza_owns_establishment(p_establishment_id)
     and not public.is_fideliza_admin() then
    raise exception 'Sem permissao' using errcode = '42501';
  end if;

  select * into v_plan from public.fideliza_billing_plans
  where id = p_plan_id and is_active = true;
  if not found then
    raise exception 'Plano invalido ou inativo';
  end if;

  insert into public.fideliza_billing_subscriptions
    (establishment_id, plan_id, status, trial_ends_at,
     due_date, period_price, monthly_price)
  values
    (p_establishment_id, p_plan_id, 'trial',
     now() + make_interval(days => v_plan.trial_days),
     now() + make_interval(days => v_plan.trial_days),
     v_plan.period_price, v_plan.monthly_price)
  on conflict (establishment_id) do update
    set plan_id       = excluded.plan_id,
        status        = 'trial',
        trial_ends_at = excluded.trial_ends_at,
        due_date      = excluded.due_date,
        period_price  = excluded.period_price,
        monthly_price = excluded.monthly_price,
        updated_at    = now()
    where public.fideliza_billing_subscriptions.status = 'trial';
end;
$$;

create or replace function public.fideliza_record_billing_payment(
  p_subscription_id uuid, p_amount numeric, p_method text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_sub  public.fideliza_billing_subscriptions%rowtype;
  v_plan public.fideliza_billing_plans%rowtype;
  v_id   uuid;
begin
  if not public.is_fideliza_admin() then
    raise exception 'Sem permissao' using errcode = '42501';
  end if;

  select * into v_sub  from public.fideliza_billing_subscriptions where id = p_subscription_id;
  select * into v_plan from public.fideliza_billing_plans where id = v_sub.plan_id;

  insert into public.fideliza_billing_payments
    (subscription_id, establishment_id, amount, method, recorded_by)
  values (p_subscription_id, v_sub.establishment_id, p_amount, p_method, auth.uid())
  returning id into v_id;

  update public.fideliza_billing_subscriptions
     set status               = 'active',
         current_period_start = now(),
         current_period_end   = now() + make_interval(months => v_plan.period_months),
         due_date             = now() + make_interval(months => v_plan.period_months),
         period_price         = v_plan.period_price,
         monthly_price        = v_plan.monthly_price,
         updated_at           = now()
   where id = p_subscription_id;

  insert into public.admin_audit_logs (admin_id, action, entity, entity_id, details)
  values (auth.uid(), 'billing_payment_recorded', 'fideliza_billing_payments', v_id,
          jsonb_build_object('amount', p_amount, 'subscription_id', p_subscription_id));

  return v_id;
end;
$$;

create or replace function public.fideliza_request_billing_plan_change(
  p_subscription_id uuid, p_requested_plan_id uuid
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_est uuid;
  v_id  uuid;
begin
  select establishment_id into v_est
  from public.fideliza_billing_subscriptions where id = p_subscription_id;

  if v_est is null then
    raise exception 'Assinatura nao encontrada';
  end if;

  insert into public.fideliza_billing_plan_change_requests
    (subscription_id, establishment_id, requested_plan_id, requested_by)
  values (p_subscription_id, v_est, p_requested_plan_id, auth.uid())
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.fideliza_admin_decide_billing_plan_change(
  p_request_id uuid, p_decision text
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_req  public.fideliza_billing_plan_change_requests%rowtype;
  v_plan public.fideliza_billing_plans%rowtype;
begin
  if not public.is_fideliza_admin() then
    raise exception 'Sem permissao' using errcode = '42501';
  end if;
  if p_decision not in ('approved','rejected') then
    raise exception 'Decisao invalida';
  end if;

  select * into v_req from public.fideliza_billing_plan_change_requests
  where id = p_request_id and status = 'pending';
  if not found then
    raise exception 'Solicitacao nao encontrada ou ja decidida';
  end if;

  update public.fideliza_billing_plan_change_requests
     set status = p_decision, decided_by = auth.uid(), decided_at = now()
   where id = p_request_id;

  if p_decision = 'approved' then
    select * into v_plan from public.fideliza_billing_plans
    where id = v_req.requested_plan_id;

    update public.fideliza_billing_subscriptions
       set pending_plan_id = v_req.requested_plan_id, updated_at = now()
     where id = v_req.subscription_id;
  end if;

  insert into public.admin_audit_logs (admin_id, action, entity, entity_id, details)
  values (auth.uid(), 'billing_plan_change_' || p_decision,
          'fideliza_billing_plan_change_requests', p_request_id,
          jsonb_build_object('plan_id', v_req.requested_plan_id));
end;
$$;
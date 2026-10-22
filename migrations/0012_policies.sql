-- =========================================================
-- 0012_policies.sql
-- Depende de: 0003 (is_fideliza_admin), 0005 (fideliza_owns_establishment),
--            e de todas as tabelas (0002 a 0009)
-- =========================================================

alter table public.profiles                              enable row level security;
alter table public.establishments                        enable row level security;
alter table public.loyalty_programs                      enable row level security;
alter table public.loyalty_transactions                  enable row level security;
alter table public.loyalty_redemptions                   enable row level security;
alter table public.cashback_transactions                 enable row level security;
alter table public.fideliza_billing_plans                enable row level security;
alter table public.fideliza_billing_subscriptions        enable row level security;
alter table public.fideliza_billing_payments             enable row level security;
alter table public.fideliza_billing_plan_change_requests enable row level security;
alter table public.admin_audit_logs                      enable row level security;

-- ---------------------------------------------------------
-- profiles
-- ---------------------------------------------------------
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_fideliza_admin());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all to authenticated
  using (public.is_fideliza_admin())
  with check (public.is_fideliza_admin());

-- ---------------------------------------------------------
-- establishments
-- O portal publico le sem login, por isso o ramo anonimo.
-- ---------------------------------------------------------
drop policy if exists est_select_public on public.establishments;
create policy est_select_public on public.establishments
  for select to anon, authenticated
  using (
    (is_public and is_approved)
    or owner_id = auth.uid()
    or public.is_fideliza_admin()
  );

drop policy if exists est_insert_owner on public.establishments;
create policy est_insert_owner on public.establishments
  for insert to authenticated
  with check (owner_id = auth.uid());

drop policy if exists est_update_owner on public.establishments;
create policy est_update_owner on public.establishments
  for update to authenticated
  using (owner_id = auth.uid() or public.is_fideliza_admin())
  with check (owner_id = auth.uid() or public.is_fideliza_admin());

drop policy if exists est_delete_admin on public.establishments;
create policy est_delete_admin on public.establishments
  for delete to authenticated
  using (public.is_fideliza_admin());

-- ---------------------------------------------------------
-- loyalty_programs
-- ---------------------------------------------------------
drop policy if exists lp_select on public.loyalty_programs;
create policy lp_select on public.loyalty_programs
  for select to anon, authenticated
  using (
    public.fideliza_owns_establishment(establishment_id)
    or public.is_fideliza_admin()
    or exists (
      select 1 from public.establishments e
      where e.id = establishment_id
        and e.is_public
        and e.is_approved
    )
  );

drop policy if exists lp_write on public.loyalty_programs;
create policy lp_write on public.loyalty_programs
  for all to authenticated
  using (public.fideliza_owns_establishment(establishment_id) or public.is_fideliza_admin())
  with check (public.fideliza_owns_establishment(establishment_id) or public.is_fideliza_admin());

-- ---------------------------------------------------------
-- loyalty_transactions
-- ---------------------------------------------------------
drop policy if exists ltx_select on public.loyalty_transactions;
create policy ltx_select on public.loyalty_transactions
  for select to authenticated
  using (
    customer_id = auth.uid()
    or public.fideliza_owns_establishment(establishment_id)
    or public.is_fideliza_admin()
  );

-- ---------------------------------------------------------
-- loyalty_redemptions
-- ---------------------------------------------------------
drop policy if exists lrd_select on public.loyalty_redemptions;
create policy lrd_select on public.loyalty_redemptions
  for select to authenticated
  using (
    customer_id = auth.uid()
    or public.fideliza_owns_establishment(establishment_id)
    or public.is_fideliza_admin()
  );

-- ---------------------------------------------------------
-- cashback_transactions
-- ---------------------------------------------------------
drop policy if exists cb_select on public.cashback_transactions;
create policy cb_select on public.cashback_transactions
  for select to authenticated
  using (
    customer_id = auth.uid()
    or public.fideliza_owns_establishment(establishment_id)
    or public.is_fideliza_admin()
  );

-- ---------------------------------------------------------
-- fideliza_billing_plans
--
-- A tela de cadastro roda sem usuario logado. Se a leitura exigir
-- auth.uid(), a lista de planos volta vazia e nenhum lojista consegue
-- criar conta. Por isso a leitura publica dos planos ATIVOS.
-- ---------------------------------------------------------
drop policy if exists bp_select on public.fideliza_billing_plans;
drop policy if exists bp_select_public on public.fideliza_billing_plans;
create policy bp_select_public on public.fideliza_billing_plans
  for select to anon, authenticated
  using (is_active = true);

drop policy if exists bp_select_admin on public.fideliza_billing_plans;
create policy bp_select_admin on public.fideliza_billing_plans
  for select to authenticated
  using (public.is_fideliza_admin());

drop policy if exists bp_admin_write on public.fideliza_billing_plans;
create policy bp_admin_write on public.fideliza_billing_plans
  for all to authenticated
  using (public.is_fideliza_admin())
  with check (public.is_fideliza_admin());

-- ---------------------------------------------------------
-- fideliza_billing_subscriptions
-- ---------------------------------------------------------
drop policy if exists bs_select on public.fideliza_billing_subscriptions;
create policy bs_select on public.fideliza_billing_subscriptions
  for select to authenticated
  using (public.fideliza_owns_establishment(establishment_id) or public.is_fideliza_admin());

drop policy if exists bs_admin_write on public.fideliza_billing_subscriptions;
create policy bs_admin_write on public.fideliza_billing_subscriptions
  for all to authenticated
  using (public.is_fideliza_admin())
  with check (public.is_fideliza_admin());

-- ---------------------------------------------------------
-- fideliza_billing_payments
-- ---------------------------------------------------------
drop policy if exists bpay_select on public.fideliza_billing_payments;
create policy bpay_select on public.fideliza_billing_payments
  for select to authenticated
  using (public.is_fideliza_admin() or public.fideliza_owns_establishment(establishment_id));

-- ---------------------------------------------------------
-- fideliza_billing_plan_change_requests
-- ---------------------------------------------------------
drop policy if exists br_select on public.fideliza_billing_plan_change_requests;
create policy br_select on public.fideliza_billing_plan_change_requests
  for select to authenticated
  using (public.is_fideliza_admin() or public.fideliza_owns_establishment(establishment_id));

drop policy if exists br_insert on public.fideliza_billing_plan_change_requests;
create policy br_insert on public.fideliza_billing_plan_change_requests
  for insert to authenticated
  with check (public.is_fideliza_admin() or public.fideliza_owns_establishment(establishment_id));

-- ---------------------------------------------------------
-- admin_audit_logs
-- ---------------------------------------------------------
drop policy if exists audit_admin_read on public.admin_audit_logs;
create policy audit_admin_read on public.admin_audit_logs
  for select to authenticated
  using (public.is_fideliza_admin());

-- ---------------------------------------------------------
-- GRANTs
-- As policies so valem sobre tabelas que o role pode acessar.
-- ---------------------------------------------------------
grant select on public.fideliza_billing_plans to anon, authenticated;
grant select on public.establishments        to anon, authenticated;
grant select on public.loyalty_programs      to anon, authenticated;

grant all on public.profiles                              to authenticated;
grant all on public.establishments                        to authenticated;
grant all on public.loyalty_programs                      to authenticated;
grant all on public.loyalty_transactions                  to authenticated;
grant all on public.loyalty_redemptions                   to authenticated;
grant all on public.cashback_transactions                 to authenticated;
grant all on public.fideliza_billing_plans                to authenticated;
grant all on public.fideliza_billing_subscriptions        to authenticated;
grant all on public.fideliza_billing_payments             to authenticated;
grant all on public.fideliza_billing_plan_change_requests to authenticated;
grant all on public.admin_audit_logs                      to authenticated;

grant execute on all functions in schema public to anon, authenticated;

notify pgrst, 'reload schema';
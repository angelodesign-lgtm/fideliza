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

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (id = auth.uid() or public.is_fideliza_admin());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all using (public.is_fideliza_admin()) with check (public.is_fideliza_admin());

drop policy if exists est_select_public on public.establishments;
create policy est_select_public on public.establishments
  for select using ((is_public and is_approved) or owner_id = auth.uid() or public.is_fideliza_admin());

drop policy if exists est_insert_owner on public.establishments;
create policy est_insert_owner on public.establishments
  for insert with check (owner_id = auth.uid());

drop policy if exists est_update_owner on public.establishments;
create policy est_update_owner on public.establishments
  for update using (owner_id = auth.uid() or public.is_fideliza_admin())
  with check (owner_id = auth.uid() or public.is_fideliza_admin());

drop policy if exists est_delete_admin on public.establishments;
create policy est_delete_admin on public.establishments
  for delete using (public.is_fideliza_admin());

drop policy if exists lp_select on public.loyalty_programs;
create policy lp_select on public.loyalty_programs
  for select using (public.fideliza_owns_establishment(establishment_id)
                    or public.is_fideliza_admin()
                    or exists (select 1 from public.establishments e
                               where e.id = establishment_id and e.is_public and e.is_approved));

drop policy if exists lp_write on public.loyalty_programs;
create policy lp_write on public.loyalty_programs
  for all using (public.fideliza_owns_establishment(establishment_id) or public.is_fideliza_admin())
  with check (public.fideliza_owns_establishment(establishment_id) or public.is_fideliza_admin());

drop policy if exists ltx_select on public.loyalty_transactions;
create policy ltx_select on public.loyalty_transactions
  for select using (customer_id = auth.uid()
                    or public.fideliza_owns_establishment(establishment_id)
                    or public.is_fideliza_admin());

drop policy if exists lrd_select on public.loyalty_redemptions;
create policy lrd_select on public.loyalty_redemptions
  for select using (customer_id = auth.uid()
                    or public.fideliza_owns_establishment(establishment_id)
                    or public.is_fideliza_admin());

drop policy if exists cb_select on public.cashback_transactions;
create policy cb_select on public.cashback_transactions
  for select using (customer_id = auth.uid()
                    or public.fideliza_owns_establishment(establishment_id)
                    or public.is_fideliza_admin());

drop policy if exists bp_select on public.fideliza_billing_plans;
create policy bp_select on public.fideliza_billing_plans
  for select using (auth.uid() is not null);

drop policy if exists bp_admin_write on public.fideliza_billing_plans;
create policy bp_admin_write on public.fideliza_billing_plans
  for all using (public.is_fideliza_admin()) with check (public.is_fideliza_admin());

drop policy if exists bs_select on public.fideliza_billing_subscriptions;
create policy bs_select on public.fideliza_billing_subscriptions
  for select using (public.fideliza_owns_establishment(establishment_id) or public.is_fideliza_admin());

drop policy if exists bs_admin_write on public.fideliza_billing_subscriptions;
create policy bs_admin_write on public.fideliza_billing_subscriptions
  for all using (public.is_fideliza_admin()) with check (public.is_fideliza_admin());

drop policy if exists bpay_select on public.fideliza_billing_payments;
create policy bpay_select on public.fideliza_billing_payments
  for select using (public.is_fideliza_admin()
                    or public.fideliza_owns_establishment(establishment_id));

drop policy if exists br_select on public.fideliza_billing_plan_change_requests;
create policy br_select on public.fideliza_billing_plan_change_requests
  for select using (public.is_fideliza_admin()
                    or public.fideliza_owns_establishment(establishment_id));

drop policy if exists br_insert on public.fideliza_billing_plan_change_requests;
create policy br_insert on public.fideliza_billing_plan_change_requests
  for insert with check (public.is_fideliza_admin()
                    or public.fideliza_owns_establishment(establishment_id));

drop policy if exists audit_admin_read on public.admin_audit_logs;
create policy audit_admin_read on public.admin_audit_logs
  for select using (public.is_fideliza_admin());
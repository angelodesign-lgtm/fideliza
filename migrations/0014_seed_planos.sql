insert into public.fideliza_billing_plans
  (name, description, billing_cycle, period_months, period_price, monthly_price, trial_days, is_active)
select * from (values
  ('Mensal',    'Cobranca mensal recorrente',      'mensal',     1,  0.00, 0.00, 14, true),
  ('Semestral', 'Cobranca a cada seis meses',      'semestral',  6,  0.00, 0.00, 14, true),
  ('Anual',     'Cobranca anual com desconto',     'anual',     12,  0.00, 0.00, 14, true)
) v
where not exists (select 1 from public.fideliza_billing_plans);

notify pgrst, 'reload schema';
-- Planos iniciais do Fideliza. Não duplica planos da mesma periodicidade.
-- Valores iniciais: R$ 19,90/mês; R$ 119,40/semestre; R$ 238,80/ano.
-- O administrador pode alterar preços e criar/desativar planos pelo painel.
insert into public.fideliza_billing_plans
  (name, description, billing_cycle, period_months, period_price, monthly_price, trial_days, is_active)
select v.name, v.description, v.billing_cycle, v.period_months, v.period_price, v.monthly_price, v.trial_days, v.is_active
from (values
  ('Fideliza Mensal',    'Plano inicial para pequenos estabelecimentos.', 'mensal',     1,  19.90::numeric, 19.90::numeric, 30, true),
  ('Fideliza Semestral', 'Plano com cobrança a cada seis meses.',       'semestral',  6, 119.40::numeric, 19.90::numeric, 30, true),
  ('Fideliza Anual',     'Plano com cobrança anual.',                    'anual',     12, 238.80::numeric, 19.90::numeric, 30, true)
) as v(name, description, billing_cycle, period_months, period_price, monthly_price, trial_days, is_active)
where not exists (
  select 1 from public.fideliza_billing_plans p where p.billing_cycle = v.billing_cycle
);

notify pgrst, 'reload schema';

-- =========================================================
-- 0008_billing.sql
-- Modelo de cobrança do Fideliza.
-- Depende de: 0003 (touch_updated_at)
--            0004 (establishments)
--            0002 (profiles)
-- =========================================================

-- ---------------------------------------------------------
-- Planos
-- ---------------------------------------------------------
create table if not exists public.fideliza_billing_plans (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  description   text,
  billing_cycle text not null
                check (billing_cycle in ('mensal','semestral','anual')),
  period_months integer not null check (period_months > 0),
  period_price  numeric(12,2) not null check (period_price >= 0),
  monthly_price numeric(12,2) not null check (monthly_price >= 0),
  trial_days    integer not null default 0 check (trial_days >= 0),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

create index if not exists billing_plans_active_idx
  on public.fideliza_billing_plans (is_active, created_at);

-- ---------------------------------------------------------
-- Assinaturas
--
-- pending_plan_id fica SEM foreign key, de proposito.
-- Com duas FKs para fideliza_billing_plans o PostgREST nao resolve o embed
-- 'fideliza_billing_plans(name)' e devolve erro de ambiguidade.
-- ---------------------------------------------------------
create table if not exists public.fideliza_billing_subscriptions (
  id                        uuid primary key default gen_random_uuid(),
  establishment_id          uuid not null unique
                            references public.establishments(id) on delete cascade,
  plan_id                   uuid not null
                            references public.fideliza_billing_plans(id),
  pending_plan_id           uuid,
  status                    text not null default 'trial'
                            check (status in ('trial','active','past_due','canceled','expired')),
  trial_ends_at             timestamptz,
  current_period_start      timestamptz,
  current_period_end        timestamptz,
  due_date                  timestamptz,
  period_price              numeric(12,2),
  monthly_price             numeric(12,2),
  billing_cycle             text
                            check (billing_cycle is null
                                   or billing_cycle in ('mensal','semestral','anual')),
  period_months             integer check (period_months is null or period_months > 0),
  pending_plan_effective_at timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index if not exists billing_subs_status_idx
  on public.fideliza_billing_subscriptions (status, due_date);

create index if not exists billing_subs_plan_idx
  on public.fideliza_billing_subscriptions (plan_id);

create or replace trigger billing_subscriptions_touch
before update on public.fideliza_billing_subscriptions
for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------
-- Pagamentos
-- establishment_id existe para que o app consiga embutir
-- 'establishments(name)' direto nesta tabela.
-- ---------------------------------------------------------
create table if not exists public.fideliza_billing_payments (
  id               uuid primary key default gen_random_uuid(),
  subscription_id  uuid not null
                   references public.fideliza_billing_subscriptions(id) on delete cascade,
  establishment_id uuid
                   references public.establishments(id) on delete cascade,
  amount           numeric(12,2) not null check (amount > 0),
  paid_at          timestamptz not null default now(),
  method           text,
  reference        text,
  recorded_by      uuid references public.profiles(id),
  created_at       timestamptz not null default now()
);

create index if not exists billing_payments_sub_idx
  on public.fideliza_billing_payments (subscription_id, paid_at desc);

create index if not exists billing_payments_est_idx
  on public.fideliza_billing_payments (establishment_id);

-- ---------------------------------------------------------
-- Solicitações de troca de plano
-- ---------------------------------------------------------
create table if not exists public.fideliza_billing_plan_change_requests (
  id                uuid primary key default gen_random_uuid(),
  subscription_id   uuid not null
                    references public.fideliza_billing_subscriptions(id) on delete cascade,
  establishment_id  uuid
                    references public.establishments(id) on delete cascade,
  requested_plan_id uuid not null
                    references public.fideliza_billing_plans(id),
  status            text not null default 'pending'
                    check (status in ('pending','approved','rejected','canceled')),
  requested_by      uuid references public.profiles(id),
  decided_by        uuid references public.profiles(id),
  decided_at        timestamptz,
  created_at        timestamptz not null default now()
);

create index if not exists billing_requests_pending_idx
  on public.fideliza_billing_plan_change_requests (status, created_at desc);

create index if not exists billing_requests_est_idx
  on public.fideliza_billing_plan_change_requests (establishment_id);

-- ---------------------------------------------------------
-- Preenchimento automatico de establishment_id
-- Sem isso, novos pagamentos e solicitacoes nascem com a coluna nula
-- e o nome da loja aparece vazio no painel.
-- ---------------------------------------------------------
create or replace function public.fideliza_fill_establishment_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.establishment_id is null and new.subscription_id is not null then
    select s.establishment_id
      into new.establishment_id
    from public.fideliza_billing_subscriptions s
    where s.id = new.subscription_id;
  end if;
  return new;
end;
$$;

create or replace trigger billing_payments_fill_est
before insert or update on public.fideliza_billing_payments
for each row execute function public.fideliza_fill_establishment_id();

create or replace trigger billing_requests_fill_est
before insert or update on public.fideliza_billing_plan_change_requests
for each row execute function public.fideliza_fill_establishment_id();
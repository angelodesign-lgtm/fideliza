-- =========================================================
-- 0006_loyalty.sql
-- Depende de: 0002 (profiles), 0003 (touch_updated_at), 0004 (establishments)
-- =========================================================

create table if not exists public.loyalty_programs (
  id                 uuid primary key default gen_random_uuid(),
  establishment_id   uuid not null unique
                     references public.establishments(id) on delete cascade,
  name               text not null default 'Programa de Fidelidade',
  stamps_required    integer not null default 10 check (stamps_required > 0),
  cashback_percent   numeric(5,2) not null default 0
                     check (cashback_percent >= 0 and cashback_percent <= 100),
  benefit_type       text not null default 'ambos'
                     check (benefit_type in ('pontos','cashback','ambos')),
  reward_description text,
  active             boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create or replace trigger loyalty_programs_touch
before update on public.loyalty_programs
for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------
-- Compras registradas no estabelecimento
-- ---------------------------------------------------------
create table if not exists public.loyalty_transactions (
  id               uuid primary key default gen_random_uuid(),
  establishment_id uuid not null
                   references public.establishments(id) on delete cascade,
  customer_id      uuid not null
                   references public.profiles(id) on delete cascade,
  amount           numeric(12,2) not null default 0 check (amount >= 0),
  stamps_earned    integer not null default 1 check (stamps_earned >= 0),
  note             text,
  created_by       uuid references public.profiles(id),
  created_at       timestamptz not null default now()
);

create index if not exists loyalty_tx_est_customer_idx
  on public.loyalty_transactions (establishment_id, customer_id, created_at desc);

create index if not exists loyalty_tx_customer_idx
  on public.loyalty_transactions (customer_id, created_at desc);

-- ---------------------------------------------------------
-- Resgates de recompensa (selos)
-- A coluna se chama stamps_used porque e o nome que o app consulta.
-- ---------------------------------------------------------
create table if not exists public.loyalty_redemptions (
  id                 uuid primary key default gen_random_uuid(),
  establishment_id   uuid not null
                     references public.establishments(id) on delete cascade,
  customer_id        uuid not null
                     references public.profiles(id) on delete cascade,
  reward_description text,
  stamps_used        integer not null default 0 check (stamps_used >= 0),
  created_by         uuid references public.profiles(id),
  created_at         timestamptz not null default now()
);

create index if not exists loyalty_red_est_customer_idx
  on public.loyalty_redemptions (establishment_id, customer_id, created_at desc);

create index if not exists loyalty_red_customer_idx
  on public.loyalty_redemptions (customer_id, created_at desc);
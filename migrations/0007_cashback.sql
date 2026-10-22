create table if not exists public.cashback_transactions (
  id                      uuid primary key default gen_random_uuid(),
  establishment_id        uuid not null references public.establishments(id) on delete cascade,
  customer_id             uuid not null references public.profiles(id) on delete cascade,
  amount                  numeric(12,2) not null check (amount > 0),
  transaction_type        text not null check (transaction_type in ('credit','debit')),
  purchase_transaction_id uuid references public.loyalty_transactions(id) on delete set null,
  created_at              timestamptz not null default now()
);

create unique index if not exists cashback_one_credit_per_purchase
  on public.cashback_transactions (purchase_transaction_id)
  where transaction_type = 'credit' and purchase_transaction_id is not null;

create index if not exists cashback_est_customer_idx
  on public.cashback_transactions (establishment_id, customer_id, transaction_type);
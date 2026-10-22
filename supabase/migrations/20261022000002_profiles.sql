create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  phone      text,
  cpf        text,
  cnpj       text,
  role       text not null default 'cliente'
             check (role in ('cliente','lojista','admin')),
  qr_token   uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_qr_token_key on public.profiles (qr_token);
create unique index if not exists profiles_cpf_key on public.profiles (cpf) where cpf is not null;
create unique index if not exists profiles_cnpj_key on public.profiles (cnpj) where cnpj is not null;
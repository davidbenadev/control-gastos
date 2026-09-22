create extension if not exists pgcrypto;

create type public.card_type as enum ('debit', 'credit');
create type public.expense_kind as enum ('one_time', 'recurring');
create type public.billing_cycle as enum ('weekly', 'monthly', 'yearly');

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, bank_name text, type public.card_type not null,
  last_four char(4), credit_limit numeric(12,2) check (credit_limit is null or credit_limit >= 0),
  cutoff_day smallint check (cutoff_day between 1 and 31),
  payment_due_day smallint check (payment_due_day between 1 and 31),
  is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.concepts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, color text, icon text, is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete restrict,
  concept_id uuid references public.concepts(id) on delete set null,
  name text not null, amount numeric(12,2) not null check (amount > 0),
  currency char(3) not null default 'MXN', cycle public.billing_cycle not null default 'monthly',
  billing_day smallint check (billing_day between 1 and 31), start_date date not null,
  next_charge_date date not null, is_active boolean not null default true, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid references public.cards(id) on delete set null,
  concept_id uuid references public.concepts(id) on delete set null,
  name text not null, amount numeric(12,2) not null check (amount > 0),
  currency char(3) not null default 'MXN', expense_date date not null,
  kind public.expense_kind not null default 'one_time', recurrence_cycle public.billing_cycle,
  recurrence_end_date date, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint recurring_expense_requires_cycle check (
    (kind = 'one_time' and recurrence_cycle is null) or
    (kind = 'recurring' and recurrence_cycle is not null)
  )
);

-- Mantiene next_charge_date coherente al crear o editar una suscripción.
create or replace function public.set_next_subscription_charge()
returns trigger language plpgsql as $$
declare
  anchor_day integer := coalesce(new.billing_day, extract(day from new.start_date)::integer);
  candidate date;
begin
  if new.start_date > current_date then
    new.next_charge_date := new.start_date;
    return new;
  end if;

  if new.cycle = 'weekly' then
    new.next_charge_date := new.start_date + (ceil((current_date - new.start_date)::numeric / 7) * 7)::integer;
  elsif new.cycle = 'monthly' then
    candidate := make_date(extract(year from current_date)::integer, extract(month from current_date)::integer,
      least(anchor_day, extract(day from (date_trunc('month', current_date) + interval '1 month - 1 day'))::integer));
    if candidate < current_date then candidate := candidate + interval '1 month'; end if;
    new.next_charge_date := candidate;
  else
    candidate := make_date(extract(year from current_date)::integer, extract(month from new.start_date)::integer,
      least(anchor_day, extract(day from (date_trunc('month', new.start_date) + interval '1 month - 1 day'))::integer));
    if candidate < current_date then candidate := candidate + interval '1 year'; end if;
    new.next_charge_date := candidate;
  end if;
  return new;
end;
$$;

create index cards_user_id_idx on public.cards(user_id);
create index concepts_user_id_idx on public.concepts(user_id);
create index subscriptions_user_next_charge_idx on public.subscriptions(user_id, next_charge_date) where is_active;
create index expenses_user_date_idx on public.expenses(user_id, expense_date);

create trigger cards_set_updated_at before update on public.cards for each row execute function public.set_updated_at();
create trigger concepts_set_updated_at before update on public.concepts for each row execute function public.set_updated_at();
create trigger subscriptions_set_updated_at before update on public.subscriptions for each row execute function public.set_updated_at();
create trigger subscriptions_set_next_charge before insert or update of cycle, billing_day, start_date on public.subscriptions for each row execute function public.set_next_subscription_charge();
create trigger expenses_set_updated_at before update on public.expenses for each row execute function public.set_updated_at();

alter table public.cards enable row level security;
alter table public.concepts enable row level security;
alter table public.subscriptions enable row level security;
alter table public.expenses enable row level security;

create policy "Users manage own cards" on public.cards for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own concepts" on public.concepts for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own subscriptions" on public.subscriptions for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own expenses" on public.expenses for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Las suscripciones pueden finalizar; los gastos recurrentes ya usan recurrence_end_date.
alter table public.subscriptions
  add column end_date date;

alter table public.subscriptions
  add constraint subscriptions_end_date_after_start_date
  check (end_date is null or end_date >= start_date);

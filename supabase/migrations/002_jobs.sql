-- =====================================================================
-- Job board: one simple table. Five statuses, linked to invoices.
-- =====================================================================

create table if not exists jobs (
  id             uuid primary key default gen_random_uuid(),
  client_name    text not null,
  phone          text not null default '',
  email          text not null default '',
  address        text not null default '',
  description    text not null default '',
  scheduled_date date,
  completed_date date,
  price_cents    bigint,
  notes          text not null default '',
  status         text not null default 'scheduled'
                 check (status in ('scheduled','in_progress','needs_invoice','invoiced','paid')),
  invoice_id     uuid references invoices(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists jobs_status_idx on jobs (status);

alter table jobs enable row level security;

drop trigger if exists jobs_touch on jobs;
create trigger jobs_touch before update on jobs
  for each row execute function touch_updated_at();

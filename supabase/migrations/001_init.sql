-- =====================================================================
-- Turf and Landscaping Victoria — private invoice application schema
-- Run against the Supabase project's Postgres database (SQL editor or
-- `supabase db push`). All access goes through the server-side API with
-- the service-role key; RLS denies everything else by default.
-- Money is stored as integer cents (bigint) — never floats.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- Business settings (singleton row, id = 1) ----------
create table if not exists business_settings (
  id                smallint primary key default 1 check (id = 1),
  legal_name        text not null default '',
  trading_name      text not null default 'Turf and Landscaping Victoria',
  owner_name        text not null default 'Sebastian Caus',
  abn               text not null default '',
  gst_registered    boolean not null default false,
  address           text not null default '',
  phone             text not null default '0457 357 085',
  email             text not null default 'info@turfandlandscaping.com.au',
  website           text not null default 'turfandlandscaping.com.au',
  bank_name         text not null default '',
  account_name      text not null default '',
  bsb               text not null default '',
  account_number    text not null default '',
  payment_terms     text not null default 'Payment due within 7 days',
  default_notes     text not null default '',
  default_terms     text not null default '',
  invoice_prefix    text not null default 'TLV',
  next_invoice_no   integer not null default 1,
  gst_rate_bp       integer not null default 1000,          -- basis points: 1000 = 10%
  currency          text not null default 'AUD',
  date_format       text not null default 'DD/MM/YYYY',
  logo_url          text not null default '/assets/logo-turf-and-landscaping.png',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
insert into business_settings (id) values (1) on conflict (id) do nothing;

-- ---------- Clients ----------
create table if not exists clients (
  id              uuid primary key default gen_random_uuid(),
  customer_type   text not null default 'residential' check (customer_type in ('residential','commercial')),
  full_name       text not null default '',
  business_name   text not null default '',
  contact_person  text not null default '',
  email           text not null default '',
  mobile          text not null default '',
  billing_address text not null default '',
  project_address text not null default '',
  abn             text not null default '',
  notes           text not null default '',
  archived        boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ---------- Pricing catalogue ----------
create table if not exists pricing_items (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  category       text not null default 'Other',
  description    text not null default '',
  unit           text not null default 'Each',
  price_cents    bigint,                                     -- null = no default price yet
  gst_treatment  text not null default 'taxable' check (gst_treatment in ('taxable','gst_free')),
  cost_cents     bigint,
  markup_pct     numeric(7,2),
  archived       boolean not null default false,
  notes          text not null default '',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Starter catalogue entries: names only, prices deliberately blank.
insert into pricing_items (name, category, unit) values
  ('General Labour — Hourly', 'Labour', 'Hour'),
  ('General Labour — Day Rate', 'Labour', 'Day'),
  ('Turf Supply — Per m²', 'Turf', 'Square metre'),
  ('Turf Installation — Per m²', 'Turf', 'Square metre'),
  ('Synthetic Turf — Per m²', 'Turf', 'Square metre'),
  ('Paving — Per m²', 'Pavers and Hardscape Materials', 'Square metre'),
  ('Retaining Wall — Per Linear Metre', 'Pavers and Hardscape Materials', 'Linear metre'),
  ('Garden Planting — Fixed or Each', 'Plants', 'Each'),
  ('Mulch Supply and Installation — Per m³', 'Mulch and Soil', 'Cubic metre'),
  ('Lawn Mowing — Per Visit', 'Maintenance', 'Visit'),
  ('Garden Maintenance — Per Hour', 'Maintenance', 'Hour'),
  ('Irrigation Repair — Per Hour', 'Maintenance', 'Hour'),
  ('Weed Spraying — Per Visit', 'Maintenance', 'Visit'),
  ('Hedge Trimming — Per Hour', 'Maintenance', 'Hour'),
  ('Turf Repair — Fixed or Per m²', 'Turf', 'Square metre'),
  ('Equipment Hire', 'Equipment or Machinery', 'Day'),
  ('Delivery', 'Delivery', 'Load'),
  ('Removal and Disposal', 'Removal and Disposal', 'Load'),
  ('Call-Out Fee', 'Call-Out Fee', 'Fixed price')
on conflict do nothing;

-- ---------- Scope templates (user-saved; built-ins ship in the app) ----------
create table if not exists scope_templates (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  service    text not null default '',
  sections   jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Invoices ----------
create table if not exists invoices (
  id               uuid primary key default gen_random_uuid(),
  invoice_no       text unique,                              -- assigned at issue; null while draft
  status           text not null default 'draft'
                   check (status in ('draft','issued','part_paid','paid','void','archived')),
  customer_type    text not null default 'residential' check (customer_type in ('residential','commercial')),
  client_id        uuid references clients(id),
  -- snapshot of client details at issue time (survives client edits)
  client_snapshot  jsonb not null default '{}',
  billing_address  text not null default '',
  project_address  text not null default '',
  po_number        text not null default '',
  customer_ref     text not null default '',
  job_ref          text not null default '',
  primary_service  text not null default '',
  issue_date       date,
  due_date         date,
  payment_terms    text not null default '',
  prices_include_gst boolean not null default false,
  gst_enabled      boolean not null default false,           -- copied from settings at creation
  gst_rate_bp      integer not null default 1000,
  discount_cents   bigint not null default 0,                -- whole-invoice discount (fixed)
  discount_pct     numeric(7,2),                             -- or percentage (one of the two)
  discount_label   text not null default '',
  subtotal_cents   bigint not null default 0,                -- derived, stored for listing speed
  gst_cents        bigint not null default 0,
  total_cents      bigint not null default 0,
  paid_cents       bigint not null default 0,
  notes            text not null default '',
  payment_instructions text not null default '',
  terms            text not null default '',
  void_reason      text not null default '',
  revision_of      uuid references invoices(id),
  revision_number  integer not null default 0,
  issued_at        timestamptz,
  archived         boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists invoices_status_idx on invoices (status);
create index if not exists invoices_created_idx on invoices (created_at desc);

create table if not exists invoice_items (
  id            uuid primary key default gen_random_uuid(),
  invoice_id    uuid not null references invoices(id) on delete cascade,
  position      integer not null default 0,
  category      text not null default 'Other',
  description   text not null default '',
  quantity      numeric(12,3) not null default 1,
  unit          text not null default 'Each',
  unit_price_cents bigint not null default 0,
  discount_cents   bigint not null default 0,
  discount_pct     numeric(7,2),
  taxable       boolean not null default true,
  cost_cents    bigint,
  markup_pct    numeric(7,2)
);
create index if not exists invoice_items_invoice_idx on invoice_items (invoice_id, position);

create table if not exists invoice_scope_sections (
  id          uuid primary key default gen_random_uuid(),
  invoice_id  uuid not null references invoices(id) on delete cascade,
  position    integer not null default 0,
  heading     text not null default '',
  body        text not null default '',
  bullets     jsonb not null default '[]',
  inclusions  jsonb not null default '[]',
  exclusions  jsonb not null default '[]',
  notes       text not null default ''
);
create index if not exists invoice_scope_invoice_idx on invoice_scope_sections (invoice_id, position);

create table if not exists payments (
  id          uuid primary key default gen_random_uuid(),
  invoice_id  uuid not null references invoices(id) on delete cascade,
  paid_on     date not null,
  amount_cents bigint not null check (amount_cents > 0),
  method      text not null default 'Bank transfer',
  reference   text not null default '',
  note        text not null default '',
  created_at  timestamptz not null default now()
);

-- ---------- Row level security: deny everything by default ----------
-- The server API uses the service-role key, which bypasses RLS. Enabling
-- RLS with no policies means anon/authenticated keys can read nothing.
alter table business_settings      enable row level security;
alter table clients                enable row level security;
alter table pricing_items          enable row level security;
alter table scope_templates        enable row level security;
alter table invoices               enable row level security;
alter table invoice_items          enable row level security;
alter table invoice_scope_sections enable row level security;
alter table payments               enable row level security;

-- ---------- updated_at trigger ----------
create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
do $$
declare t text;
begin
  foreach t in array array['business_settings','clients','pricing_items','scope_templates','invoices']
  loop
    execute format('drop trigger if exists %I_touch on %I', t, t);
    execute format('create trigger %I_touch before update on %I for each row execute function touch_updated_at()', t, t);
  end loop;
end $$;

-- =====================================================================
-- Functions (called by the server API through PostgREST /rpc)
-- =====================================================================

-- Save a draft invoice with its items and scope sections in one
-- transaction. Refuses to touch anything that is no longer a draft.
create or replace function save_invoice(p jsonb) returns uuid
language plpgsql security definer as $$
declare
  v_id uuid;
  v_status text;
  itm jsonb;
  sec jsonb;
  i integer := 0;
begin
  if p->>'id' is not null and p->>'id' <> '' then
    v_id := (p->>'id')::uuid;
    select status into v_status from invoices where id = v_id for update;
    if v_status is null then raise exception 'invoice not found'; end if;
    if v_status <> 'draft' then raise exception 'only draft invoices can be edited'; end if;
  else
    insert into invoices (status) values ('draft') returning id into v_id;
  end if;

  update invoices set
    customer_type    = coalesce(p->>'customer_type','residential'),
    client_id        = nullif(p->>'client_id','')::uuid,
    client_snapshot  = coalesce(p->'client_snapshot','{}'::jsonb),
    billing_address  = coalesce(p->>'billing_address',''),
    project_address  = coalesce(p->>'project_address',''),
    po_number        = coalesce(p->>'po_number',''),
    customer_ref     = coalesce(p->>'customer_ref',''),
    job_ref          = coalesce(p->>'job_ref',''),
    primary_service  = coalesce(p->>'primary_service',''),
    issue_date       = nullif(p->>'issue_date','')::date,
    due_date         = nullif(p->>'due_date','')::date,
    payment_terms    = coalesce(p->>'payment_terms',''),
    prices_include_gst = coalesce((p->>'prices_include_gst')::boolean, false),
    gst_enabled      = coalesce((p->>'gst_enabled')::boolean, false),
    gst_rate_bp      = coalesce((p->>'gst_rate_bp')::integer, 1000),
    discount_cents   = coalesce((p->>'discount_cents')::bigint, 0),
    discount_pct     = nullif(p->>'discount_pct','')::numeric,
    discount_label   = coalesce(p->>'discount_label',''),
    subtotal_cents   = coalesce((p->>'subtotal_cents')::bigint, 0),
    gst_cents        = coalesce((p->>'gst_cents')::bigint, 0),
    total_cents      = coalesce((p->>'total_cents')::bigint, 0),
    notes            = coalesce(p->>'notes',''),
    payment_instructions = coalesce(p->>'payment_instructions',''),
    terms            = coalesce(p->>'terms','')
  where id = v_id;

  delete from invoice_items where invoice_id = v_id;
  for itm in select * from jsonb_array_elements(coalesce(p->'items','[]'::jsonb)) loop
    i := i + 1;
    insert into invoice_items (invoice_id, position, category, description, quantity, unit,
                               unit_price_cents, discount_cents, discount_pct, taxable, cost_cents, markup_pct)
    values (v_id, i,
      coalesce(itm->>'category','Other'), coalesce(itm->>'description',''),
      greatest(coalesce((itm->>'quantity')::numeric,1), 0),
      coalesce(itm->>'unit','Each'),
      coalesce((itm->>'unit_price_cents')::bigint,0),
      coalesce((itm->>'discount_cents')::bigint,0),
      nullif(itm->>'discount_pct','')::numeric,
      coalesce((itm->>'taxable')::boolean,true),
      nullif(itm->>'cost_cents','')::bigint,
      nullif(itm->>'markup_pct','')::numeric);
  end loop;

  delete from invoice_scope_sections where invoice_id = v_id;
  i := 0;
  for sec in select * from jsonb_array_elements(coalesce(p->'scope_sections','[]'::jsonb)) loop
    i := i + 1;
    insert into invoice_scope_sections (invoice_id, position, heading, body, bullets, inclusions, exclusions, notes)
    values (v_id, i,
      coalesce(sec->>'heading',''), coalesce(sec->>'body',''),
      coalesce(sec->'bullets','[]'::jsonb), coalesce(sec->'inclusions','[]'::jsonb),
      coalesce(sec->'exclusions','[]'::jsonb), coalesce(sec->>'notes',''));
  end loop;

  return v_id;
end $$;

-- Issue a draft: atomically assign the next sequential invoice number.
-- Numbers are never reused — the counter only moves forward, and voided
-- invoices keep their number forever.
create or replace function issue_invoice(p_id uuid) returns text
language plpgsql security definer as $$
declare
  v_status text;
  v_prefix text;
  v_next integer;
  v_no text;
begin
  select status into v_status from invoices where id = p_id for update;
  if v_status is null then raise exception 'invoice not found'; end if;
  if v_status <> 'draft' then raise exception 'only draft invoices can be issued'; end if;

  select invoice_prefix, next_invoice_no into v_prefix, v_next
    from business_settings where id = 1 for update;
  v_no := format('%s-%s-%s', v_prefix, to_char(now(),'YYYY'), lpad(v_next::text, 4, '0'));
  update business_settings set next_invoice_no = v_next + 1 where id = 1;

  update invoices set status = 'issued', invoice_no = v_no, issued_at = now(),
    issue_date = coalesce(issue_date, current_date)
    where id = p_id;
  return v_no;
end $$;

-- Record a payment and update the invoice's paid total and status.
create or replace function record_payment(p_id uuid, p jsonb) returns void
language plpgsql security definer as $$
declare
  v_status text; v_total bigint; v_paid bigint; v_amount bigint;
begin
  select status, total_cents, paid_cents into v_status, v_total, v_paid
    from invoices where id = p_id for update;
  if v_status is null then raise exception 'invoice not found'; end if;
  if v_status in ('void','draft','archived') then raise exception 'payments can only be recorded on issued invoices'; end if;

  v_amount := (p->>'amount_cents')::bigint;
  if v_amount is null or v_amount <= 0 then raise exception 'invalid payment amount'; end if;
  if v_paid + v_amount > v_total and coalesce((p->>'allow_overpay')::boolean,false) = false then
    raise exception 'payment exceeds balance due';
  end if;

  insert into payments (invoice_id, paid_on, amount_cents, method, reference, note)
  values (p_id, coalesce(nullif(p->>'paid_on','')::date, current_date), v_amount,
          coalesce(p->>'method','Bank transfer'), coalesce(p->>'reference',''), coalesce(p->>'note',''));

  v_paid := v_paid + v_amount;
  update invoices set paid_cents = v_paid,
    status = case when v_paid >= v_total then 'paid' else 'part_paid' end
    where id = p_id;
end $$;

-- Void an issued invoice (requires a reason; number is retained forever).
create or replace function void_invoice(p_id uuid, p_reason text) returns void
language plpgsql security definer as $$
declare v_status text;
begin
  select status into v_status from invoices where id = p_id for update;
  if v_status is null then raise exception 'invoice not found'; end if;
  if v_status in ('void') then raise exception 'invoice is already void'; end if;
  if coalesce(trim(p_reason),'') = '' then raise exception 'a void reason is required'; end if;
  update invoices set status = 'void', void_reason = p_reason where id = p_id;
end $$;

-- Duplicate any invoice into a fresh draft (no number, no payments).
create or replace function duplicate_invoice(p_id uuid) returns uuid
language plpgsql security definer as $$
declare v_new uuid;
begin
  insert into invoices (customer_type, client_id, client_snapshot, billing_address, project_address,
    po_number, customer_ref, job_ref, primary_service, payment_terms, prices_include_gst,
    gst_enabled, gst_rate_bp, discount_cents, discount_pct, discount_label,
    subtotal_cents, gst_cents, total_cents, notes, payment_instructions, terms)
  select customer_type, client_id, client_snapshot, billing_address, project_address,
    po_number, customer_ref, job_ref, primary_service, payment_terms, prices_include_gst,
    gst_enabled, gst_rate_bp, discount_cents, discount_pct, discount_label,
    subtotal_cents, gst_cents, total_cents, notes, payment_instructions, terms
  from invoices where id = p_id
  returning id into v_new;
  if v_new is null then raise exception 'invoice not found'; end if;

  insert into invoice_items (invoice_id, position, category, description, quantity, unit,
      unit_price_cents, discount_cents, discount_pct, taxable, cost_cents, markup_pct)
    select v_new, position, category, description, quantity, unit,
      unit_price_cents, discount_cents, discount_pct, taxable, cost_cents, markup_pct
    from invoice_items where invoice_id = p_id;
  insert into invoice_scope_sections (invoice_id, position, heading, body, bullets, inclusions, exclusions, notes)
    select v_new, position, heading, body, bullets, inclusions, exclusions, notes
    from invoice_scope_sections where invoice_id = p_id;
  return v_new;
end $$;

-- Create an editable revision of an issued invoice. The original is
-- preserved untouched; the revision starts as a linked draft.
create or replace function create_revision(p_id uuid) returns uuid
language plpgsql security definer as $$
declare v_new uuid; v_status text; v_rev integer;
begin
  select status into v_status from invoices where id = p_id;
  if v_status is null then raise exception 'invoice not found'; end if;
  if v_status not in ('issued','part_paid','paid') then
    raise exception 'revisions can only be created from issued invoices';
  end if;
  select coalesce(max(revision_number),0) + 1 into v_rev from invoices where revision_of = p_id;
  v_new := duplicate_invoice(p_id);
  update invoices set revision_of = p_id, revision_number = v_rev where id = v_new;
  return v_new;
end $$;

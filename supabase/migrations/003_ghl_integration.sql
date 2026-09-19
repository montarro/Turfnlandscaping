-- =====================================================================
-- GHL webhook integration (job-completed -> Needs Invoice queue).
-- Jobs are identified by GHL opportunity id scoped to the location;
-- clients by GHL contact id. Unique indexes make webhook retries
-- idempotent at the database level.
-- =====================================================================

alter table jobs
  add column if not exists ghl_location_id    text,
  add column if not exists ghl_contact_id     text,
  add column if not exists ghl_opportunity_id text;

create unique index if not exists jobs_ghl_opportunity_uniq
  on jobs (ghl_location_id, ghl_opportunity_id)
  where ghl_opportunity_id is not null;

alter table clients
  add column if not exists ghl_contact_id text;

create unique index if not exists clients_ghl_contact_uniq
  on clients (ghl_contact_id)
  where ghl_contact_id is not null;

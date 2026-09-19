-- =====================================================================
-- Invoice trash: "delete" in the app soft-deletes (deleted_at set).
-- Trashed invoices vanish from every list and can only be seen,
-- restored or purged through the key-gated trash endpoints.
-- =====================================================================

alter table invoices add column if not exists deleted_at timestamptz;

create index if not exists invoices_deleted_idx
  on invoices (deleted_at)
  where deleted_at is not null;

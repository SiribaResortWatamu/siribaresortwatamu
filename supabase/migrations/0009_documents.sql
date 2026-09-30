-- =====================================================================
-- Quotations, invoices and receipts
--
-- One table for all three document types. Line items are stored on the
-- document as a snapshot (jsonb) so a later rate change can never rewrite
-- something that has already been sent to a guest.
--
-- Numbers (QUO-2026-0001) are assigned when a document is ISSUED, not when
-- the draft is created, so abandoned drafts never leave gaps in the
-- sequence. Issued documents are immutable in the app; to correct one, void
-- it and issue a new one.
-- =====================================================================

create type document_type   as enum ('quotation', 'invoice', 'receipt');
create type document_status as enum ('draft', 'issued', 'void');

create table documents (
  id                   uuid primary key default gen_random_uuid(),
  doc_type             document_type not null,
  status               document_status not null default 'draft',
  number               text unique,

  -- Unguessable key for the shareable link sent to the client.
  share_token          uuid not null unique default gen_random_uuid(),

  -- Where it came from. All optional: a document can be entirely custom.
  booking_id           uuid references bookings(id) on delete set null,
  transfer_booking_id  uuid references transfer_bookings(id) on delete set null,
  safari_enquiry_id    uuid references safari_enquiries(id) on delete set null,
  guest_id             uuid references guests(id) on delete set null,
  -- quotation -> invoice -> receipt chain
  parent_id            uuid references documents(id) on delete set null,

  client_name          text not null,
  client_email         text,
  client_phone         text,
  client_address       text,

  issue_date           date,
  -- Invoices: payment due. Quotations: valid until.
  due_date             date,

  currency             text not null default 'KES',
  line_items           jsonb not null default '[]'::jsonb,
  subtotal             numeric(12,2) not null default 0,
  discount             numeric(12,2) not null default 0 check (discount >= 0),
  total                numeric(12,2) not null default 0,

  -- Receipts only.
  payment_method       text,
  payment_reference    text,
  payment_date         date,

  notes                text,
  terms                text,

  voided_at            timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index documents_type_idx     on documents (doc_type, created_at desc);
create index documents_booking_idx  on documents (booking_id);
create index documents_transfer_idx on documents (transfer_booking_id);
create index documents_enquiry_idx  on documents (safari_enquiry_id);
create index documents_parent_idx   on documents (parent_id);
create trigger documents_updated_at before update on documents
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- Gapless-per-year numbering
-- ---------------------------------------------------------------------
create table document_counters (
  doc_type document_type not null,
  year     int not null,
  last     int not null default 0,
  primary key (doc_type, year)
);

create or replace function next_document_number(p_type document_type)
returns text
language plpgsql security definer set search_path = public as $fn$
declare
  v_year   int := extract(year from now() at time zone 'Africa/Nairobi')::int;
  v_next   int;
  v_prefix text := case p_type
                     when 'quotation' then 'QUO'
                     when 'invoice'   then 'INV'
                     else 'RCT' end;
begin
  -- The upsert takes a row lock, so two people issuing at once queue up
  -- instead of receiving the same number.
  insert into document_counters (doc_type, year, last)
  values (p_type, v_year, 1)
  on conflict (doc_type, year)
  do update set last = document_counters.last + 1
  returning last into v_next;

  return format('%s-%s-%s', v_prefix, v_year, lpad(v_next::text, 4, '0'));
end;
$fn$;

revoke all on function next_document_number(document_type) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Row level security: staff only. Guests reach a document through the
-- share token, which is resolved server-side with the service role.
-- ---------------------------------------------------------------------
alter table documents         enable row level security;
alter table document_counters enable row level security;

create policy documents_admin_all on documents
  for all to authenticated using (is_admin()) with check (is_admin());

-- Printed on invoices: bank / M-Pesa details.
alter table site_settings add column if not exists payment_instructions text;

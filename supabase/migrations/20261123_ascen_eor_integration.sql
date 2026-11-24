-- Ascen White-Label W-2 EOR Integration: Placement Tracking & Webhook Idempotency
-- Safe to run idempotently in Supabase SQL Editor.

create table if not exists public.eor_placements (
  id uuid primary key default gen_random_uuid(),
  packet_id text not null unique,
  reference_id text not null,
  organization_id uuid null,
  professional_user_id uuid null,
  provider text not null default 'ascen',
  ascen_company_id text null,
  ascen_worker_id text null,
  ascen_placement_id text null,
  ascen_onboarding_url text null,
  contract_track text not null default 'contract_to_hire',
  eor_status text not null default 'pending_sync'
    check (eor_status in (
      'pending_sync',
      'onboarding_invited',
      'i9_pending',
      'w4_pending',
      'active_w2',
      'converted_direct',
      'ended',
      'sync_failed'
    )),
  hourly_pay_rate numeric(10, 2) null,
  employer_bill_rate numeric(10, 2) null,
  weekly_hours numeric(5, 2) null,
  target_start_date date null,
  last_webhook_event_id text null,
  last_synced_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_eor_placements_org_id
  on public.eor_placements (organization_id);
create index if not exists idx_eor_placements_prof_id
  on public.eor_placements (professional_user_id);
create index if not exists idx_eor_placements_ascen_id
  on public.eor_placements (ascen_placement_id);
create index if not exists idx_eor_placements_status
  on public.eor_placements (eor_status);

create table if not exists public.eor_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'ascen',
  external_event_id text not null unique,
  event_type text not null,
  signature_verified boolean not null default false,
  processing_status text not null default 'received'
    check (processing_status in ('received', 'processed', 'ignored', 'failed')),
  placement_packet_id text null,
  ascen_placement_id text null,
  payload jsonb not null default '{}'::jsonb,
  error_message text null,
  received_at timestamptz not null default now(),
  processed_at timestamptz null
);

create index if not exists idx_eor_webhook_events_received
  on public.eor_webhook_events (received_at desc);
create index if not exists idx_eor_webhook_events_ascen_placement
  on public.eor_webhook_events (ascen_placement_id);

alter table public.eor_placements enable row level security;
alter table public.eor_webhook_events enable row level security;

drop policy if exists "Professionals can view own EOR placements" on public.eor_placements;
create policy "Professionals can view own EOR placements"
  on public.eor_placements
  for select
  to authenticated
  using (auth.uid() = professional_user_id);

drop policy if exists "Employers can view org EOR placements" on public.eor_placements;
create policy "Employers can view org EOR placements"
  on public.eor_placements
  for select
  to authenticated
  using (
    organization_id is not null
    and exists (
      select 1
      from public.organization_members om
      where om.organization_id = eor_placements.organization_id
        and om.user_id = auth.uid()
    )
  );

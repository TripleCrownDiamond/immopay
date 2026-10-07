-- ImmoPay initial schema
create extension if not exists pgcrypto;

create type public.member_role as enum ('owner','manager');
create type public.unit_status as enum ('vacant','occupied','notice','arrears');
create type public.due_status as enum ('upcoming','due','partial','paid','overdue','cancelled');
create type public.payment_status as enum ('pending','paid','failed','refunded');
create type public.notification_channel as enum ('in_app','push','email','whatsapp','sms');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  currency text not null default 'XOF',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role public.member_role not null default 'manager',
  primary key (organization_id,user_id)
);

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null, type text not null, address text,
  created_at timestamptz not null default now()
);

create table public.units (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  name text not null, status public.unit_status not null default 'vacant',
  created_at timestamptz not null default now()
);

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  full_name text not null, phone text not null, email text,
  created_at timestamptz not null default now()
);

create table public.leases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  unit_id uuid not null references public.units(id),
  tenant_id uuid not null references public.tenants(id),
  rent_amount bigint not null check(rent_amount>=0),
  currency text not null default 'XOF',
  frequency text not null default 'monthly',
  due_day smallint check(due_day between 1 and 31),
  starts_on date not null, ends_on date,
  deposit_amount bigint not null default 0,
  partial_payments_allowed boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.lease_charges (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  lease_id uuid not null references public.leases(id) on delete cascade,
  label text not null, amount bigint not null check(amount>=0),
  recurring boolean not null default true
);

create table public.rent_dues (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  lease_id uuid not null references public.leases(id) on delete cascade,
  period_start date not null, period_end date not null, due_on date not null,
  amount_expected bigint not null, amount_paid bigint not null default 0,
  status public.due_status not null default 'upcoming',
  unique(lease_id,period_start,period_end)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  tenant_id uuid references public.tenants(id),
  provider text not null default 'manual',
  external_reference text, internal_reference text not null unique,
  amount bigint not null check(amount>0), currency text not null default 'XOF',
  status public.payment_status not null default 'pending',
  paid_at timestamptz, provider_payload jsonb,
  created_at timestamptz not null default now()
);

create table public.payment_allocations (
  payment_id uuid references public.payments(id) on delete cascade,
  rent_due_id uuid references public.rent_dues(id) on delete cascade,
  amount bigint not null check(amount>0),
  primary key(payment_id,rent_due_id)
);

create table public.receipts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  rent_due_id uuid not null unique references public.rent_dues(id),
  public_code text not null unique,
  pdf_path text, qr_payload text not null,
  issued_at timestamptz not null default now()
);

create table public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  push boolean not null default true, email boolean not null default true,
  whatsapp boolean not null default true, sms boolean not null default false
);

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique, p256dh text not null, auth_key text not null,
  created_at timestamptz not null default now()
);

create table public.notification_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  rent_due_id uuid references public.rent_dues(id) on delete cascade,
  channel public.notification_channel not null,
  template_key text not null, idempotency_key text not null unique,
  scheduled_for timestamptz not null, status text not null default 'queued',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.notification_jobs(id) on delete cascade,
  provider text not null, provider_id text, status text not null,
  cost numeric(12,4), response jsonb, created_at timestamptz not null default now()
);

create or replace function public.is_org_member(org uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.organization_members m where m.organization_id=org and m.user_id=auth.uid());
$$;

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.properties enable row level security;
alter table public.units enable row level security;
alter table public.tenants enable row level security;
alter table public.leases enable row level security;
alter table public.lease_charges enable row level security;
alter table public.rent_dues enable row level security;
alter table public.payments enable row level security;
alter table public.payment_allocations enable row level security;
alter table public.receipts enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notification_jobs enable row level security;
alter table public.notification_deliveries enable row level security;

create policy "members read organizations" on public.organizations for select using(public.is_org_member(id) or created_by=auth.uid());
create policy "members manage properties" on public.properties for all using(public.is_org_member(organization_id)) with check(public.is_org_member(organization_id));
create policy "members manage units" on public.units for all using(public.is_org_member(organization_id)) with check(public.is_org_member(organization_id));
create policy "members manage tenants" on public.tenants for all using(public.is_org_member(organization_id)) with check(public.is_org_member(organization_id));
create policy "members manage leases" on public.leases for all using(public.is_org_member(organization_id)) with check(public.is_org_member(organization_id));
create policy "members manage charges" on public.lease_charges for all using(public.is_org_member(organization_id)) with check(public.is_org_member(organization_id));
create policy "members manage dues" on public.rent_dues for all using(public.is_org_member(organization_id)) with check(public.is_org_member(organization_id));
create policy "members manage payments" on public.payments for all using(public.is_org_member(organization_id)) with check(public.is_org_member(organization_id));
create policy "members manage receipts" on public.receipts for all using(public.is_org_member(organization_id)) with check(public.is_org_member(organization_id));
create policy "own notification preferences" on public.notification_preferences for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "own push subscriptions" on public.push_subscriptions for all using(user_id=auth.uid()) with check(user_id=auth.uid());

-- ImmoPay tenant space
-- A tenant has one ImmoPay account (auth.users) linked to every `tenants` row created by
-- the landlords they rented from. This gives them a portable history:
--   * the tenant reads all their leases, dues, payments and receipts across organizations;
--   * a new landlord can find an existing ImmoPay tenant by phone or ImmoPay ID;
--   * a landlord sees another landlord's payment history only as an aggregated summary,
--     and only after the tenant approves an access request.

-- Public, shareable identifier (e.g. IMP-7K3F9Q) that a tenant can give to a landlord.
create or replace function public.generate_immopay_id()
returns text language sql volatile as $$
  select 'IMP-' || upper(substr(translate(encode(gen_random_bytes(6),'base64'),'+/=0O1Il',''),1,6));
$$;

alter table public.profiles
  add column if not exists immopay_id text unique default public.generate_immopay_id(),
  add column if not exists is_tenant boolean not null default false;

create index if not exists tenants_user_id_idx on public.tenants(user_id);
create index if not exists tenants_phone_idx on public.tenants(phone);

-- ---------------------------------------------------------------------------
-- Tenant read access to their own records, across every organization
-- ---------------------------------------------------------------------------
create or replace function public.is_tenant_of(t uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.tenants where id=t and user_id=auth.uid());
$$;

create or replace function public.is_tenant_lease(l uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.leases le join public.tenants te on te.id=le.tenant_id
                where le.id=l and te.user_id=auth.uid());
$$;

create policy "tenant reads own profile rows" on public.tenants for select using(user_id=auth.uid());
create policy "tenant reads own leases" on public.leases for select using(public.is_tenant_of(tenant_id));
create policy "tenant reads own dues" on public.rent_dues for select using(public.is_tenant_lease(lease_id));
create policy "tenant reads own payments" on public.payments for select using(public.is_tenant_of(tenant_id));
create policy "tenant reads own receipts" on public.receipts for select using(
  exists(select 1 from public.rent_dues d where d.id=rent_due_id and public.is_tenant_lease(d.lease_id)));
create policy "tenant reads landlord org name" on public.organizations for select using(
  exists(select 1 from public.tenants t where t.organization_id=organizations.id and t.user_id=auth.uid()));

-- Profiles were not readable before; users read and update their own.
alter table public.profiles enable row level security;
create policy "own profile" on public.profiles for all using(id=auth.uid()) with check(id=auth.uid());

-- Phone numbers are typed in many formats (+229 97..., 0022997..., 97 12 34 56).
-- Two numbers match when their digits are equal, or when one is the other without its
-- country code (at least 8 trailing digits in common).
create or replace function public.phones_match(a text, b text)
returns boolean language sql immutable as $$
  with d as (select regexp_replace(regexp_replace(coalesce(a,''),'\D','','g'),'^00','') x,
                    regexp_replace(regexp_replace(coalesce(b,''),'\D','','g'),'^00','') y)
  select length(x)>=8 and length(y)>=8 and (x=y or right(x,length(y))=y or right(y,length(x))=x) from d;
$$;

-- Link landlord-created tenant records to the signed-in tenant, using their verified phone.
create or replace function public.claim_tenant_records()
returns integer language plpgsql security definer set search_path=public as $$
declare v_phone text; n integer;
begin
  select phone into v_phone from auth.users where id=auth.uid() and phone_confirmed_at is not null;
  if v_phone is null then raise exception 'phone_not_verified'; end if;
  update public.tenants set user_id=auth.uid()
   where user_id is null and public.phones_match(phone,v_phone);
  get diagnostics n=row_count;
  update public.profiles set is_tenant=true where id=auth.uid();
  return n;
end $$;

-- ---------------------------------------------------------------------------
-- Landlord lookup and consent-based history sharing
-- ---------------------------------------------------------------------------
create type public.access_request_status as enum ('pending','approved','declined','revoked');

create table public.history_access_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  tenant_user_id uuid not null references auth.users(id) on delete cascade,
  requested_by uuid not null references auth.users(id),
  status public.access_request_status not null default 'pending',
  message text,
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  expires_at timestamptz
);
create unique index history_access_one_open on public.history_access_requests(organization_id,tenant_user_id)
  where status in ('pending','approved');
alter table public.history_access_requests enable row level security;

create policy "members read their requests" on public.history_access_requests for select
  using(public.is_org_member(organization_id));
create policy "members create requests" on public.history_access_requests for insert
  with check(public.is_org_member(organization_id) and requested_by=auth.uid() and status='pending');
create policy "tenant reads requests about them" on public.history_access_requests for select
  using(tenant_user_id=auth.uid());

-- Tenant approves, declines or revokes. Approval lasts 90 days.
create or replace function public.decide_history_access(request uuid, approve boolean)
returns void language plpgsql security definer set search_path=public as $$
begin
  update public.history_access_requests
     set status=case when approve then 'approved'::public.access_request_status
                     when status='approved' then 'revoked' else 'declined' end,
         decided_at=now(),
         expires_at=case when approve then now()+interval '90 days' else null end
   where id=request and tenant_user_id=auth.uid() and status in ('pending','approved');
  if not found then raise exception 'request_not_found'; end if;
end $$;

-- Find a tenant who already has an ImmoPay account. Returns minimal, masked data only.
create or replace function public.find_immopay_tenant(q text)
returns table(user_id uuid, full_name text, phone_masked text, immopay_id text, member_since date, rentals integer)
language sql stable security definer set search_path=public as $$
  select p.id, p.full_name,
         regexp_replace(coalesce(p.phone,''),'(\d{2})(?=\d{2})','••','g'),
         p.immopay_id, p.created_at::date,
         (select count(*)::int from public.tenants t where t.user_id=p.id)
    from public.profiles p
   where p.is_tenant
     and exists(select 1 from public.organization_members m where m.user_id=auth.uid())
     and (upper(p.immopay_id)=upper(trim(q))
          or public.phones_match(p.phone,q))
   limit 1;
$$;

-- Aggregated payment history across all landlords, only with an approved, unexpired request.
create or replace function public.tenant_history_summary(org uuid, tenant uuid)
returns table(rentals integer, months integer, dues_total integer, paid_on_time integer,
              paid_late integer, unpaid integer, first_lease date)
language plpgsql stable security definer set search_path=public as $$
begin
  if not public.is_org_member(org) or not exists(
     select 1 from public.history_access_requests r
      where r.organization_id=org and r.tenant_user_id=tenant and r.status='approved' and r.expires_at>now())
  then raise exception 'access_not_granted'; end if;
  return query
  with d as (
    select dd.*, le.starts_on, te.id as tid from public.rent_dues dd
      join public.leases le on le.id=dd.lease_id
      join public.tenants te on te.id=le.tenant_id
     where te.user_id=tenant and dd.status<>'cancelled' and dd.due_on<=current_date)
  select (select count(*)::int from public.tenants where user_id=tenant),
         count(distinct date_trunc('month',d.period_start))::int,
         count(*)::int,
         count(*) filter (where d.status='paid' and not exists(
            select 1 from public.payment_allocations pa join public.payments p on p.id=pa.payment_id
             where pa.rent_due_id=d.id and p.paid_at::date>d.due_on))::int,
         count(*) filter (where d.status='paid')::int - count(*) filter (where d.status='paid' and not exists(
            select 1 from public.payment_allocations pa join public.payments p on p.id=pa.payment_id
             where pa.rent_due_id=d.id and p.paid_at::date>d.due_on))::int,
         count(*) filter (where d.status in ('due','partial','overdue'))::int,
         min(d.starts_on)
    from d;
end $$;

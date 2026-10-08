-- ImmoPay offline payments: bank transfer, bank deposit, cash, cheque, Mobile Money outside ImmoPay.
-- Two ways in:
--   * the landlord records a payment they received (status 'paid' immediately);
--   * the tenant declares a payment with a proof (status 'pending'), and the landlord confirms or rejects it.
-- Confirmed payments are allocated to the oldest open dues and fully paid dues get a receipt.
-- Proof files live in the private storage bucket 'payment-proofs' under <organization_id>/<payment_id>/.

alter type public.payment_status add value if not exists 'rejected';
create type public.payment_method as enum ('mobile_money','card','cash','bank_transfer','bank_deposit','cheque','other');

alter table public.payments
  add column if not exists method public.payment_method not null default 'mobile_money',
  add column if not exists payment_date date,
  add column if not exists bank_reference text,
  add column if not exists proof_path text,
  add column if not exists payer_note text,
  add column if not exists declared_by uuid references auth.users(id),
  add column if not exists recorded_by uuid references auth.users(id),
  add column if not exists confirmed_by uuid references auth.users(id),
  add column if not exists confirmed_at timestamptz,
  add column if not exists rejection_reason text;

-- Where tenants can pay a landlord outside ImmoPay.
create table public.payout_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  kind text not null check (kind in ('bank','mobile_money')),
  label text not null,              -- e.g. "Ecobank Cotonou" or "MTN MoMo"
  holder_name text not null,
  account_number text not null,     -- RIB / IBAN or phone number
  instructions text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.payout_accounts enable row level security;
create policy "members manage payout accounts" on public.payout_accounts for all
  using(public.is_org_member(organization_id)) with check(public.is_org_member(organization_id));
create policy "tenants read their landlords payout accounts" on public.payout_accounts for select
  using(active and exists(select 1 from public.tenants t where t.organization_id=payout_accounts.organization_id and t.user_id=auth.uid()));

-- Reference a tenant writes in the transfer label, so the landlord finds it on the bank statement.
create or replace function public.transfer_reference(p_tenant uuid)
returns text language sql stable as $$
  select 'IMP-' || upper(substr(replace(p_tenant::text,'-',''),1,6));
$$;

-- Tenant declares an offline payment. Only for their own tenant record.
create or replace function public.declare_offline_payment(
  p_tenant uuid, p_amount bigint, p_method public.payment_method, p_payment_date date,
  p_bank_reference text default null, p_proof_path text default null, p_note text default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_org uuid; v_id uuid;
begin
  if p_method in ('mobile_money','card') then raise exception 'method_not_offline'; end if;
  if p_amount<=0 then raise exception 'invalid_amount'; end if;
  select organization_id into v_org from public.tenants where id=p_tenant and user_id=auth.uid();
  if v_org is null then raise exception 'tenant_not_found'; end if;
  insert into public.payments(organization_id,tenant_id,provider,internal_reference,amount,status,method,payment_date,
                              bank_reference,proof_path,payer_note,declared_by)
  values(v_org,p_tenant,'manual','DEC-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)),p_amount,'pending',
         p_method,p_payment_date,p_bank_reference,p_proof_path,p_note,auth.uid())
  returning id into v_id;
  return v_id;
end $$;

-- Allocates a paid payment to the tenant's oldest open dues and issues receipts for fully paid dues.
create or replace function public.apply_payment(p_payment uuid)
returns integer language plpgsql security definer set search_path=public as $$
declare v_pay public.payments; v_left bigint; v_due record; v_part bigint; n integer:=0;
begin
  select * into v_pay from public.payments where id=p_payment and status='paid' for update;
  if v_pay.id is null then raise exception 'payment_not_paid'; end if;
  if exists(select 1 from public.payment_allocations where payment_id=p_payment) then raise exception 'already_applied'; end if;
  v_left:=v_pay.amount;
  for v_due in
    select d.* from public.rent_dues d join public.leases l on l.id=d.lease_id
     where l.tenant_id=v_pay.tenant_id and d.status in ('upcoming','due','partial','overdue')
       and d.amount_paid<d.amount_expected
     order by d.due_on, d.period_start for update of d
  loop
    exit when v_left<=0;
    v_part:=least(v_left, v_due.amount_expected-v_due.amount_paid);
    insert into public.payment_allocations(payment_id,rent_due_id,amount) values(p_payment,v_due.id,v_part);
    update public.rent_dues set amount_paid=amount_paid+v_part,
           status=case when amount_paid+v_part>=amount_expected then 'paid'::public.due_status else 'partial'::public.due_status end
     where id=v_due.id;
    if v_due.amount_paid+v_part>=v_due.amount_expected then
      insert into public.receipts(organization_id,rent_due_id,public_code,qr_payload)
      values(v_pay.organization_id,v_due.id,
             'Q-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)),
             '/verify/'||v_due.id)
      on conflict (rent_due_id) do nothing;
      n:=n+1;
    end if;
    v_left:=v_left-v_part;
  end loop;
  -- Any remainder stays on the payment as a credit for the next dues.
  return n;
end $$;

-- Landlord records a payment received outside ImmoPay. Applied immediately.
create or replace function public.record_offline_payment(
  p_tenant uuid, p_amount bigint, p_method public.payment_method, p_payment_date date,
  p_bank_reference text default null, p_proof_path text default null, p_note text default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_org uuid; v_id uuid;
begin
  select organization_id into v_org from public.tenants where id=p_tenant;
  if v_org is null or not public.is_org_member(v_org) then raise exception 'tenant_not_found'; end if;
  if p_amount<=0 then raise exception 'invalid_amount'; end if;
  insert into public.payments(organization_id,tenant_id,provider,internal_reference,amount,status,paid_at,method,payment_date,
                              bank_reference,proof_path,payer_note,recorded_by,confirmed_by,confirmed_at)
  values(v_org,p_tenant,'manual','REC-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)),p_amount,'paid',
         coalesce(p_payment_date::timestamptz,now()),p_method,p_payment_date,p_bank_reference,p_proof_path,p_note,
         auth.uid(),auth.uid(),now())
  returning id into v_id;
  perform public.apply_payment(v_id);
  return v_id;
end $$;

-- Landlord confirms or rejects a payment declared by a tenant.
create or replace function public.review_declared_payment(p_payment uuid, p_confirm boolean, p_reason text default null)
returns void language plpgsql security definer set search_path=public as $$
declare v_org uuid;
begin
  select organization_id into v_org from public.payments where id=p_payment and status='pending' and declared_by is not null;
  if v_org is null or not public.is_org_member(v_org) then raise exception 'payment_not_found'; end if;
  if p_confirm then
    update public.payments set status='paid', paid_at=coalesce(payment_date::timestamptz,now()),
           confirmed_by=auth.uid(), confirmed_at=now() where id=p_payment;
    perform public.apply_payment(p_payment);
  else
    if coalesce(trim(p_reason),'')='' then raise exception 'reason_required'; end if;
    update public.payments set status='rejected', rejection_reason=p_reason, confirmed_by=auth.uid(), confirmed_at=now()
     where id=p_payment;
  end if;
end $$;

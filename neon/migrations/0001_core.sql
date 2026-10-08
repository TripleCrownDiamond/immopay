CREATE TABLE IF NOT EXISTS profiles (
  auth_user_id text PRIMARY KEY,
  full_name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('owner', 'agency_manager', 'tenant')),
  email text UNIQUE,
  phone text,
  immopay_id text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  currency char(3) NOT NULL DEFAULT 'XOF',
  is_demo boolean NOT NULL DEFAULT false,
  created_by_auth_user_id text REFERENCES profiles(auth_user_id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organization_members (
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  auth_user_id text NOT NULL REFERENCES profiles(auth_user_id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'agency_manager')),
  PRIMARY KEY (organization_id, auth_user_id)
);

CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL,
  address text,
  UNIQUE (organization_id, id)
);

CREATE TABLE IF NOT EXISTS units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  property_id uuid NOT NULL,
  name text NOT NULL,
  status text NOT NULL CHECK (status IN ('vacant', 'occupied', 'notice', 'arrears')),
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, property_id) REFERENCES properties(organization_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  auth_user_id text REFERENCES profiles(auth_user_id),
  full_name text NOT NULL,
  email text,
  phone text,
  UNIQUE (organization_id, id)
);
CREATE INDEX IF NOT EXISTS tenants_auth_user_idx ON tenants(auth_user_id);

CREATE TABLE IF NOT EXISTS leases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  unit_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  rent_amount bigint NOT NULL CHECK (rent_amount >= 0),
  currency char(3) NOT NULL DEFAULT 'XOF',
  starts_on date NOT NULL,
  ends_on date,
  active boolean NOT NULL DEFAULT true,
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, unit_id) REFERENCES units(organization_id, id),
  FOREIGN KEY (organization_id, tenant_id) REFERENCES tenants(organization_id, id)
);

CREATE TABLE IF NOT EXISTS rent_dues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  lease_id uuid NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  due_on date NOT NULL,
  amount_expected bigint NOT NULL CHECK (amount_expected >= 0),
  amount_paid bigint NOT NULL DEFAULT 0 CHECK (amount_paid >= 0 AND amount_paid <= amount_expected),
  status text NOT NULL CHECK (status IN ('upcoming', 'due', 'partial', 'paid', 'overdue', 'cancelled')),
  UNIQUE (organization_id, id),
  UNIQUE (lease_id, period_start, period_end),
  FOREIGN KEY (organization_id, lease_id) REFERENCES leases(organization_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  internal_reference text NOT NULL UNIQUE,
  amount bigint NOT NULL CHECK (amount > 0),
  currency char(3) NOT NULL DEFAULT 'XOF',
  method text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'paid', 'failed', 'rejected', 'refunded')),
  paid_at timestamptz,
  FOREIGN KEY (organization_id, tenant_id) REFERENCES tenants(organization_id, id)
);

CREATE TABLE IF NOT EXISTS receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  rent_due_id uuid NOT NULL,
  public_code text NOT NULL UNIQUE,
  amount bigint NOT NULL CHECK (amount > 0),
  issued_at timestamptz NOT NULL,
  on_time boolean NOT NULL DEFAULT true,
  UNIQUE (rent_due_id),
  FOREIGN KEY (organization_id, rent_due_id) REFERENCES rent_dues(organization_id, id)
);

CREATE INDEX IF NOT EXISTS properties_org_idx ON properties(organization_id);
CREATE INDEX IF NOT EXISTS units_org_idx ON units(organization_id);
CREATE INDEX IF NOT EXISTS leases_org_idx ON leases(organization_id);
CREATE INDEX IF NOT EXISTS rent_dues_org_due_idx ON rent_dues(organization_id, due_on);
CREATE INDEX IF NOT EXISTS payments_org_paid_idx ON payments(organization_id, paid_at DESC);
CREATE INDEX IF NOT EXISTS receipts_org_idx ON receipts(organization_id);

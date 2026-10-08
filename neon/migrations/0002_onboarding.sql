ALTER TABLE organizations
  ADD COLUMN kind text NOT NULL DEFAULT 'owner'
  CHECK (kind IN ('owner', 'agency'));

UPDATE organizations o SET kind='agency'
WHERE EXISTS (
  SELECT 1 FROM organization_members m
  WHERE m.organization_id=o.id AND m.role='agency_manager'
);

CREATE TABLE account_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('agency_manager', 'tenant')),
  tenant_id uuid,
  email text NOT NULL CHECK (email=lower(btrim(email)) AND length(email)<=254),
  token_hash char(64) NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  accepted_by_auth_user_id text REFERENCES profiles(auth_user_id),
  revoked_at timestamptz,
  created_by_auth_user_id text NOT NULL REFERENCES profiles(auth_user_id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((kind='tenant' AND tenant_id IS NOT NULL) OR (kind='agency_manager' AND tenant_id IS NULL)),
  CHECK ((accepted_at IS NULL) = (accepted_by_auth_user_id IS NULL)),
  FOREIGN KEY (organization_id, tenant_id) REFERENCES tenants(organization_id, id)
);

CREATE INDEX account_invitations_pending_idx
  ON account_invitations(organization_id, kind, email, tenant_id)
  WHERE accepted_at IS NULL AND revoked_at IS NULL;

CREATE INDEX account_invitations_tenant_idx ON account_invitations(organization_id, tenant_id);

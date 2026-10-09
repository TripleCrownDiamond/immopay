ALTER TABLE account_invitations
  ADD COLUMN email_delivery_status text NOT NULL DEFAULT 'not_configured',
  ADD COLUMN email_accepted_at timestamptz;

ALTER TABLE account_invitations ADD CONSTRAINT account_invitations_email_delivery_check
  CHECK (email_delivery_status IN ('not_configured','sent','failed')
    AND ((email_delivery_status = 'sent') = (email_accepted_at IS NOT NULL)));

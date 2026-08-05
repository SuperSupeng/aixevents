-- Allow direct activity edits from /admin to be recorded in the audit log.
ALTER TABLE datawhale_admin_audit_logs
  DROP CONSTRAINT IF EXISTS datawhale_admin_audit_logs_action_check;

ALTER TABLE datawhale_admin_audit_logs
  ADD CONSTRAINT datawhale_admin_audit_logs_action_check
  CHECK (action IN ('approve', 'reject', 'update', 'set_feature', 'reorder_featured'));

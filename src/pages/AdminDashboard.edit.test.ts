import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const readSource = (path: string) => readFile(new URL(path, import.meta.url), 'utf8');

test('admin dashboard exposes the full event editor for the selected record', async () => {
  const [dashboard, modal] = await Promise.all([
    readSource('./AdminDashboard.tsx'),
    readSource('../components/SubmitEventModal.tsx'),
  ]);

  assert.match(dashboard, />\s*编辑活动\s*</);
  assert.match(dashboard, /adminSubmission=\{editableAdminSubmission\}/);
  assert.match(dashboard, /onAdminSave=\{saveAdminEdit\}/);
  assert.match(modal, /await onAdminSave\(payload\)/);
  assert.match(modal, /保存并立即生效/);
});

test('admin update uses the protected endpoint and clears pending updates', async () => {
  const [clientApi, handler, schema] = await Promise.all([
    readSource('../api/admin.ts'),
    readSource('../../functions/api/admin/submissions.ts'),
    readSource('../../database/schema.sql'),
  ]);

  assert.match(clientApi, /action: 'update'/);
  assert.match(clientApi, /event: buildEventPayload\(params\.input\)/);
  assert.match(handler, /function normalizeAdminEventPayload/);
  assert.match(handler, /pending_update: null/);
  assert.match(handler, /writeAuditLog\([^;]+?'update'/s);
  assert.match(schema, /'approve', 'reject', 'update', 'set_feature', 'reorder_featured'/);
});

import assert from 'node:assert/strict';
import { test } from 'node:test';

test('creator day is a first-class public and submission activity type', async () => {
  const taxonomy = await import('./activityTaxonomy');

  assert.equal(taxonomy.getActivityTypeLabel('creator_day'), 'AI+X 创造节');
  assert.deepEqual(taxonomy.getActivityFilterValues('creator_day'), ['creator_day']);
  assert.equal(taxonomy.getActivityFilterLabel('creator_day'), '创造节');
  assert.ok(taxonomy.PUBLIC_ACTIVITY_TYPES.some((type) => type.value === 'creator_day'));
  assert.ok(taxonomy.SUBMISSION_ACTIVITY_TYPES.some((type) => type.value === 'creator_day'));
});

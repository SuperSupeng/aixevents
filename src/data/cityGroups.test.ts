import assert from 'node:assert/strict';
import { test } from 'node:test';

test('overseas city groups are available with expected qr images', async () => {
  const { CITY_GROUPS } = await import('./cityGroups');

  assert.deepEqual(
    CITY_GROUPS.filter((group) => ['singapore', 'netherlands', 'paris', 'korea'].includes(group.slug)).map((group) => ({
      slug: group.slug,
      city: group.city,
      qrImage: group.qrImage,
    })),
    [
      { slug: 'singapore', city: '新加坡', qrImage: '/brand/city-groups/singapore.jpg' },
      { slug: 'netherlands', city: '荷兰', qrImage: '/brand/city-groups/netherlands.jpg' },
      { slug: 'paris', city: '巴黎', qrImage: '/brand/city-groups/paris.jpg' },
      { slug: 'korea', city: '韩国', qrImage: '/brand/city-groups/korea.jpg' },
    ]
  );
});

test('overseas city groups can be found by aliases', async () => {
  const { findCityGroup } = await import('./cityGroups');

  assert.equal(findCityGroup('SG')?.city, '新加坡');
  assert.equal(findCityGroup('Netherlands')?.city, '荷兰');
  assert.equal(findCityGroup('France')?.city, '巴黎');
  assert.equal(findCityGroup('Seoul')?.city, '韩国');
});

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

async function readAppSource(): Promise<string> {
  return readFile(new URL('./App.tsx', import.meta.url), 'utf8');
}

function getFunctionBlock(source: string, startMarker: string, endMarker: string): string {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);

  assert.notEqual(start, -1, `${startMarker} should exist`);
  assert.notEqual(end, -1, `${endMarker} should exist after ${startMarker}`);

  return source.slice(start, end);
}

test('opening an in-app event detail keeps the current page mounted behind the modal', async () => {
  const source = await readAppSource();
  const openEventDetail = getFunctionBlock(
    source,
    'const openEventDetail = (event: TechEvent) => {',
    'const closeEventDetail = () => {',
  );

  assert.match(openEventDetail, /window\.history\.pushState\(\{\}, '', `\/events\/\$\{encodedId\}`\);/);
  assert.doesNotMatch(openEventDetail, /setCurrentPage\('event'\)/);
});

test('closing an in-app event detail restores the URL without forcing a scroll jump', async () => {
  const source = await readAppSource();
  const closeEventDetail = getFunctionBlock(
    source,
    'const closeEventDetail = () => {',
    '// 处理浏览器前进/后退按钮',
  );

  assert.match(closeEventDetail, /window\.history\.replaceState\(\{\}, '', returnState\.path\);/);
  assert.doesNotMatch(closeEventDetail, /scrollTo/);
});

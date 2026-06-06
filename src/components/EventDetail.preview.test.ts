import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import EventDetail, { PosterPreviewModal } from './EventDetail';
import type { TechEvent } from '../types';

const previewEvent: TechEvent = {
  id: 'poster-preview',
  title: '长海报预览测试活动',
  summary: '用于确认活动详情页海报可以放大查看。',
  coverImage: '/poster-preview-cover.png',
  startTime: '2026-06-10T11:00:00.000Z',
  endTime: '2026-06-10T13:00:00.000Z',
  timezone: 'Asia/Shanghai',
  format: 'offline',
  activityType: 'meetup',
  location: { country: '中国', city: '杭州', address: '西湖区' },
  tags: ['AI+X'],
  customTags: ['社区'],
  language: ['中文'],
  links: {
    officialSite: 'https://example.com/event',
    poster: 'https://example.com/poster-long.png',
  },
  organizer: { name: 'Datawhale' },
  organizers: ['Datawhale'],
  price: { type: 'free' },
  status: 'upcoming',
};

test('event detail uses a stable poster viewport instead of sizing layout from the uploaded image', () => {
  const markup = renderToStaticMarkup(
    React.createElement(EventDetail, {
      event: previewEvent,
      onClose: () => undefined,
    }),
  );

  assert.match(markup, /aria-label="预览长海报预览测试活动活动海报大图"/);
  assert.match(markup, /title="点击预览活动海报"/);
  assert.match(markup, /src="https:\/\/example\.com\/poster-long\.png"/);
  assert.match(markup, /cursor-zoom-in/);
  assert.match(markup, /max-h-\[88vh\]/);
  assert.match(markup, /md:max-h-\[88vh\]/);
  assert.match(markup, /md:overflow-hidden/);
  assert.match(markup, /md:grid-cols-\[minmax\(20rem,1fr\)_minmax\(0,1fr\)\]/);
  assert.match(markup, /md:relative/);
  assert.match(markup, /md:absolute/);
  assert.match(markup, /md:inset-y-6/);
  assert.match(markup, /md:left-6/);
  assert.match(markup, /md:right-4/);
  assert.match(markup, /md:w-auto/);
  assert.match(markup, /md:h-auto/);
  assert.match(markup, /md:min-h-0/);
  assert.match(markup, /md:overflow-hidden/);
  assert.match(markup, /md:overflow-y-auto/);
  assert.match(markup, /md:flex/);
  assert.match(markup, /md:flex-col/);
  assert.match(markup, /md:flex-auto/);
  assert.match(markup, /md:pr-2/);
  assert.match(markup, /md:shrink-0/);
  assert.doesNotMatch(markup, /md:h-\[88vh\]/);
  assert.doesNotMatch(markup, /md:flex-1/);
  assert.doesNotMatch(markup, /md:mt-auto/);
  assert.match(markup, /h-\[min\(70vh,38rem\)\]/);
  assert.match(markup, /h-full w-full/);
  assert.match(markup, /poster-scroll-area/);
  assert.match(markup, /object-contain/);
  assert.doesNotMatch(markup, /object-cover/);
  assert.doesNotMatch(markup, /aspect-\[4\/5\]/);
  assert.doesNotMatch(markup, /h-auto max-h-\[calc\(88vh-3rem\)\]/);
  assert.doesNotMatch(markup, /md:border-r-2/);
});

test('event detail poster does not reserve a visible scrollbar gutter over the poster edge', () => {
  const styles = readFileSync(new URL('../index.css', import.meta.url), 'utf8');

  assert.match(styles, /\.poster-scroll-area/);
  assert.match(styles, /scrollbar-width:\s*none/);
  assert.match(styles, /-ms-overflow-style:\s*none/);
  assert.match(styles, /\.poster-scroll-area::-webkit-scrollbar/);
  assert.match(styles, /display:\s*none/);
});

test('poster preview supports mouse wheel scrolling after zooming in', () => {
  const source = readFileSync(new URL('./EventDetail.tsx', import.meta.url), 'utf8');

  assert.match(source, /const handleWheel = \(wheelEvent: React\.WheelEvent<HTMLDivElement>\) => \{/);
  assert.match(source, /setOffset\(\(currentOffset\) => clampOffset\(\{/);
  assert.match(source, /y: currentOffset\.y - wheelEvent\.deltaY/);
  assert.match(source, /onWheel=\{handleWheel\}/);
});

test('event detail poster switches long uploaded posters into an internal scroll image', () => {
  const source = readFileSync(new URL('./EventDetail.tsx', import.meta.url), 'utf8');

  assert.match(source, /const handlePosterLoad = \(imageEvent: React\.SyntheticEvent<HTMLImageElement>\) => \{/);
  assert.match(source, /const scaledPosterHeight = frameRect\.width \* \(image\.naturalHeight \/ image\.naturalWidth\);/);
  assert.match(source, /setPosterScrollable\(scaledPosterHeight > frameRect\.height \+ 2\);/);
  assert.match(source, /onLoad=\{handlePosterLoad\}/);
  assert.match(source, /isPosterScrollable \? 'h-full md:h-auto' : 'h-full'/);
});

test('poster preview modal opens fitted to the viewport and supports zoom controls', () => {
  const markup = renderToStaticMarkup(
    React.createElement(PosterPreviewModal, {
      title: previewEvent.title,
      imageUrl: 'https://example.com/poster-long.png',
      onClose: () => undefined,
    }),
  );

  assert.match(markup, /role="dialog"/);
  assert.match(markup, /aria-label="活动海报预览"/);
  assert.match(markup, /aria-label="关闭海报预览"/);
  assert.match(markup, /href="https:\/\/example\.com\/poster-long\.png"/);
  assert.match(markup, /打开原图/);
  assert.match(markup, /aria-label="缩小海报"/);
  assert.match(markup, /aria-label="适合屏幕"/);
  assert.match(markup, /aria-label="放大海报"/);
  assert.match(markup, /aria-label="拖拽查看海报细节"/);
  assert.match(markup, /cursor-zoom-in/);
  assert.match(markup, /overflow-hidden/);
  assert.match(markup, /max-h-full/);
  assert.doesNotMatch(markup, /overflow-y-auto/);
  assert.doesNotMatch(markup, /overflow-auto/);
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { toJSON, toRSS, toSitemap, toCSV } from '../src/format.js';

const sample = [
  {
    path: '/site/essays/foo.html',
    relativePath: 'essays/foo.html',
    modified: '2026-02-20T00:00:00.000Z',
    title: 'Foo',
    description: 'A foo article',
    date: '2026-02-20',
    author: 'Kira',
    canonical: 'https://example.com/essays/foo.html',
    image: null,
    lang: 'en',
    type: 'article',
    meta: { 'og:title': 'Foo', description: 'A foo article' },
  },
  {
    path: '/site/about.html',
    relativePath: 'about.html',
    modified: '2026-02-19T00:00:00.000Z',
    title: 'About',
    description: null,
    date: null,
    author: null,
    canonical: null,
    image: null,
    lang: 'en',
    type: null,
    meta: {},
  },
];

describe('toJSON', () => {
  it('produces valid JSON', () => {
    const out = toJSON(sample);
    const parsed = JSON.parse(out);
    assert.equal(parsed.length, 2);
    assert.equal(parsed[0].title, 'Foo');
  });

  it('omits raw meta by default', () => {
    const out = toJSON(sample);
    const parsed = JSON.parse(out);
    assert.equal(parsed[0].meta, undefined);
  });
});

describe('toRSS', () => {
  it('produces valid RSS structure', () => {
    const out = toRSS(sample, { siteUrl: 'https://example.com', title: 'Test Feed' });
    assert.ok(out.includes('<?xml version="1.0"'));
    assert.ok(out.includes('<rss version="2.0"'));
    assert.ok(out.includes('<title>Test Feed</title>'));
    assert.ok(out.includes('<title>Foo</title>'));
    assert.ok(out.includes('<title>About</title>'));
    assert.ok(out.includes('<generator>htmlens</generator>'));
  });

  it('uses canonical URL when available', () => {
    const out = toRSS(sample, { siteUrl: 'https://example.com' });
    assert.ok(out.includes('<link>https://example.com/essays/foo.html</link>'));
  });

  it('constructs URL from base when no canonical', () => {
    const out = toRSS(sample, { siteUrl: 'https://example.com' });
    assert.ok(out.includes('<link>https://example.com/about.html</link>'));
  });

  it('includes pubDate when date exists', () => {
    const out = toRSS(sample, { siteUrl: 'https://example.com' });
    assert.ok(out.includes('<pubDate>'));
  });

  it('escapes XML entities', () => {
    const items = [{
      ...sample[0],
      title: 'Foo & Bar <Baz>',
      description: 'It\'s "great"',
    }];
    const out = toRSS(items, { siteUrl: 'https://example.com' });
    assert.ok(out.includes('Foo &amp; Bar &lt;Baz&gt;'));
    assert.ok(out.includes('It&apos;s &quot;great&quot;'));
  });
});

describe('toSitemap', () => {
  it('produces valid sitemap structure', () => {
    const out = toSitemap(sample, { siteUrl: 'https://example.com' });
    assert.ok(out.includes('<?xml version="1.0"'));
    assert.ok(out.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'));
    assert.ok(out.includes('<loc>https://example.com/essays/foo.html</loc>'));
    assert.ok(out.includes('<lastmod>2026-02-20</lastmod>'));
  });

  it('uses file modified date as fallback', () => {
    const out = toSitemap(sample, { siteUrl: 'https://example.com' });
    assert.ok(out.includes('<lastmod>2026-02-19</lastmod>'));
  });
});

describe('toCSV', () => {
  it('produces CSV with header', () => {
    const out = toCSV(sample);
    const lines = out.split('\n');
    assert.equal(lines[0], 'path,title,date,description,author,canonical');
    assert.equal(lines.length, 3); // header + 2 rows
  });

  it('escapes commas in fields', () => {
    const items = [{
      ...sample[0],
      description: 'Foo, bar, baz',
    }];
    const out = toCSV(items);
    assert.ok(out.includes('"Foo, bar, baz"'));
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from '../src/parse.js';

describe('parse', () => {
  it('extracts title from <title> tag', () => {
    const html = '<html><head><title>Hello World</title></head></html>';
    const result = parse(html);
    assert.equal(result.title, 'Hello World');
  });

  it('prefers og:title over <title>', () => {
    const html = `<html><head>
      <title>Fallback</title>
      <meta property="og:title" content="OG Title">
    </head></html>`;
    const result = parse(html);
    assert.equal(result.title, 'OG Title');
  });

  it('extracts description from meta', () => {
    const html = '<html><head><meta name="description" content="A test page"></head></html>';
    const result = parse(html);
    assert.equal(result.description, 'A test page');
  });

  it('prefers og:description over meta description', () => {
    const html = `<html><head>
      <meta name="description" content="Fallback">
      <meta property="og:description" content="OG Description">
    </head></html>`;
    const result = parse(html);
    assert.equal(result.description, 'OG Description');
  });

  it('extracts date from article:published_time', () => {
    const html = '<html><head><meta property="article:published_time" content="2026-01-15"></head></html>';
    const result = parse(html);
    assert.equal(result.date, '2026-01-15');
  });

  it('extracts date from meta name="date"', () => {
    const html = '<html><head><meta name="date" content="2026-02-20"></head></html>';
    const result = parse(html);
    assert.equal(result.date, '2026-02-20');
  });

  it('extracts date from <time datetime="...">', () => {
    const html = '<html><body><time datetime="2026-03-01">March 1</time></body></html>';
    const result = parse(html);
    assert.equal(result.date, '2026-03-01');
  });

  it('extracts canonical URL', () => {
    const html = '<html><head><link rel="canonical" href="https://example.com/page"></head></html>';
    const result = parse(html);
    assert.equal(result.canonical, 'https://example.com/page');
  });

  it('extracts og:image', () => {
    const html = '<html><head><meta property="og:image" content="https://example.com/img.png"></head></html>';
    const result = parse(html);
    assert.equal(result.image, 'https://example.com/img.png');
  });

  it('extracts author', () => {
    const html = '<html><head><meta name="author" content="Kira Omanyte"></head></html>';
    const result = parse(html);
    assert.equal(result.author, 'Kira Omanyte');
  });

  it('extracts lang from <html lang="...">', () => {
    const html = '<html lang="en"><head><title>Test</title></head></html>';
    const result = parse(html);
    assert.equal(result.lang, 'en');
  });

  it('decodes HTML entities in title', () => {
    const html = '<html><head><title>Foo &amp; Bar</title></head></html>';
    const result = parse(html);
    assert.equal(result.title, 'Foo & Bar');
  });

  it('decodes HTML entities in meta content', () => {
    const html = '<html><head><meta name="description" content="It&apos;s a &quot;test&quot;"></head></html>';
    const result = parse(html);
    assert.equal(result.description, "It's a \"test\"");
  });

  it('returns null for missing fields', () => {
    const html = '<html><head></head><body>Nothing here</body></html>';
    const result = parse(html);
    assert.equal(result.title, null);
    assert.equal(result.description, null);
    assert.equal(result.date, null);
    assert.equal(result.author, null);
    assert.equal(result.canonical, null);
    assert.equal(result.image, null);
  });

  it('collects all meta tags in raw field', () => {
    const html = `<html><head>
      <meta name="author" content="Someone">
      <meta property="og:type" content="article">
      <meta name="keywords" content="test, example">
    </head></html>`;
    const result = parse(html);
    assert.equal(result.meta['author'], 'Someone');
    assert.equal(result.meta['og:type'], 'article');
    assert.equal(result.meta['keywords'], 'test, example');
  });

  it('handles content-first meta tag order', () => {
    const html = '<html><head><meta content="Reversed" name="description"></head></html>';
    const result = parse(html);
    assert.equal(result.description, 'Reversed');
  });

  it('handles self-closing meta tags', () => {
    const html = '<html><head><meta name="description" content="Self-closed" /></head></html>';
    const result = parse(html);
    assert.equal(result.description, 'Self-closed');
  });

  it('handles a real-world essay head section', () => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>The Generative Void — Kira Omanyte</title>
    <meta property="og:title" content="The Generative Void — Kira Omanyte">
    <meta property="og:description" content="Emptiness as a creative force.">
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://kira-omanyte.github.io/essays/the-generative-void.html">
    <meta property="og:image" content="https://kira-omanyte.github.io/social-card.png">
    <link rel="canonical" href="https://kira-omanyte.github.io/essays/the-generative-void.html">
    <link rel="alternate" type="application/rss+xml" title="Kira Omanyte" href="/feed.xml">
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <link rel="stylesheet" href="/style.css">
</head>
<body>
    <article>
        <h1>The Generative Void</h1>
        <time datetime="2026-02-13">February 13, 2026</time>
    </article>
</body>
</html>`;
    const result = parse(html);
    assert.equal(result.title, 'The Generative Void — Kira Omanyte');
    assert.equal(result.description, 'Emptiness as a creative force.');
    assert.equal(result.type, 'article');
    assert.equal(result.canonical, 'https://kira-omanyte.github.io/essays/the-generative-void.html');
    assert.equal(result.image, 'https://kira-omanyte.github.io/social-card.png');
    assert.equal(result.lang, 'en');
    assert.equal(result.date, '2026-02-13');
  });
});

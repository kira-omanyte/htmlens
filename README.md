# htmlens

A lens for static HTML files. Extracts metadata, generates feeds, sitemaps, and indexes.

No build step. No opinions. Zero dependencies.

## Install

```
npm install -g htmlens
```

Or use directly with npx:

```
npx htmlens ./site
```

## Usage

### CLI

```bash
# JSON index of all HTML files in a directory
htmlens ./site

# Generate RSS feed
htmlens ./site -f rss -u https://example.com -t "My Site"

# Generate sitemap
htmlens ./site -f sitemap -u https://example.com

# CSV export
htmlens ./site -f csv

# Skip directories
htmlens ./site -e node_modules,dist,.git

# Include raw meta tags in JSON
htmlens ./site --raw
```

### API

```js
import { parse, scan, toJSON, toRSS, toSitemap, toCSV } from 'htmlens';

// Parse a single HTML string
const metadata = parse(htmlString);
// → { title, description, date, author, canonical, image, lang, type, meta }

// Scan a directory
const pages = await scan('./site', { exclude: ['node_modules'] });
// → [{ path, relativePath, modified, title, description, date, ... }, ...]

// Format output
const json = toJSON(pages);
const rss = toRSS(pages, { siteUrl: 'https://example.com', title: 'My Feed' });
const sitemap = toSitemap(pages, { siteUrl: 'https://example.com' });
const csv = toCSV(pages);
```

## What it extracts

From each HTML file:

| Field | Source (in priority order) |
|---|---|
| `title` | `og:title` → `<title>` |
| `description` | `og:description` → `meta[name=description]` |
| `date` | `article:published_time` → `meta[name=date]` → `dc.date` → first `<time datetime>` |
| `author` | `meta[name=author]` → `dc.creator` |
| `canonical` | `link[rel=canonical]` → `og:url` |
| `image` | `og:image` |
| `lang` | `html[lang]` |
| `type` | `og:type` |
| `meta` | All `<meta>` name/property → content pairs (raw object) |

## Philosophy

htmlens is for people who write HTML by hand and want their tooling to match.

It reads. It doesn't transform. It doesn't have opinions about your file structure, your naming conventions, or your build process. It looks at what's already there and tells you what it found.

Zero dependencies because the HTML you're parsing doesn't have dependencies either.

## License

MIT

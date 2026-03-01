/**
 * htmlens/format — Output formatters.
 *
 * Takes scan results and produces:
 * - JSON (default)
 * - RSS 2.0
 * - Sitemap XML
 * - CSV (simple)
 */

/**
 * Escape XML special characters.
 * @param {string} str
 * @returns {string}
 */
function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Format results as JSON.
 * @param {object[]} results
 * @param {object} [options]
 * @param {boolean} [options.pretty] — pretty-print (default: true)
 * @returns {string}
 */
export function toJSON(results, options = {}) {
  const { pretty = true } = options;
  const clean = results.map(r => {
    const out = { ...r };
    delete out.meta; // omit raw meta by default
    return out;
  });
  return pretty ? JSON.stringify(clean, null, 2) : JSON.stringify(clean);
}

/**
 * Strip a suffix from a title (e.g., " — Site Name" or " | Site Name").
 * @param {string} title
 * @param {string} suffix — the suffix to remove (e.g., " — Kira Omanyte")
 * @returns {string}
 */
function stripTitleSuffix(title, suffix) {
  if (!suffix || !title) return title;
  return title.endsWith(suffix) ? title.slice(0, -suffix.length) : title;
}

/**
 * Format results as RSS 2.0.
 * @param {object[]} results
 * @param {object} options
 * @param {string} options.siteUrl — base URL of the site
 * @param {string} [options.title] — feed title
 * @param {string} [options.description] — feed description
 * @param {string} [options.language] — feed language (e.g., "en")
 * @param {string} [options.titleStrip] — suffix to strip from item titles
 * @returns {string}
 */
export function toRSS(results, options = {}) {
  const {
    siteUrl = '',
    title = 'htmlens feed',
    description = '',
    language = '',
    titleStrip = '',
  } = options;

  const baseUrl = siteUrl.replace(/\/$/, '');

  const items = results
    .filter(r => r.title) // skip files without titles
    .map(r => {
      const link = r.canonical || (baseUrl ? `${baseUrl}/${r.relativePath}` : r.relativePath);
      const itemTitle = stripTitleSuffix(r.title, titleStrip);
      const pubDate = r.date ? new Date(r.date).toUTCString() : '';
      return `    <item>
      <title>${escapeXml(itemTitle)}</title>
      <link>${escapeXml(link)}</link>
      <guid>${escapeXml(link)}</guid>${r.description ? `
      <description>${escapeXml(r.description)}</description>` : ''}${pubDate ? `
      <pubDate>${pubDate}</pubDate>` : ''}${r.author ? `
      <author>${escapeXml(r.author)}</author>` : ''}
    </item>`;
    })
    .join('\n');

  const feedUrl = baseUrl ? `${baseUrl}/feed.xml` : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${escapeXml(baseUrl || '')}</link>
    <description>${escapeXml(description)}</description>${language ? `
    <language>${escapeXml(language)}</language>` : ''}${feedUrl ? `
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml"/>` : ''}
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>htmlens</generator>
${items}
  </channel>
</rss>`;
}

/**
 * Format results as a sitemap.xml.
 * @param {object[]} results
 * @param {object} options
 * @param {string} options.siteUrl — base URL of the site
 * @returns {string}
 */
export function toSitemap(results, options = {}) {
  const { siteUrl = '' } = options;
  const baseUrl = siteUrl.replace(/\/$/, '');

  const urls = results
    .map(r => {
      const loc = r.canonical || (baseUrl ? `${baseUrl}/${r.relativePath}` : r.relativePath);
      const lastmod = r.date || r.modified;
      return `  <url>
    <loc>${escapeXml(loc)}</loc>${lastmod ? `
    <lastmod>${lastmod.slice(0, 10)}</lastmod>` : ''}
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

/**
 * Format results as CSV.
 * @param {object[]} results
 * @returns {string}
 */
export function toCSV(results) {
  const escape = (s) => {
    if (!s) return '';
    if (s.includes('"') || s.includes(',') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const header = 'path,title,date,description,author,canonical';
  const rows = results.map(r =>
    [r.relativePath, r.title, r.date, r.description, r.author, r.canonical]
      .map(escape)
      .join(',')
  );

  return [header, ...rows].join('\n');
}

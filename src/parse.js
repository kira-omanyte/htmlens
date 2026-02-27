/**
 * htmlens/parse — Extract metadata from an HTML file.
 *
 * Zero dependencies. Reads the <head> section and pulls out:
 * - <title>
 * - <meta name="..." content="...">
 * - <meta property="..." content="..."> (Open Graph)
 * - <link rel="canonical" href="...">
 * - <time datetime="..."> (first occurrence, for publish date)
 * - <meta name="date" content="..."> or <meta property="article:published_time">
 *
 * Does NOT parse the full DOM. This is a lens, not an engine.
 */

/**
 * Extract text content between a tag pair.
 * @param {string} html
 * @param {string} tag
 * @returns {string|null}
 */
function extractTag(html, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const m = html.match(re);
  return m ? m[1].trim() : null;
}

/**
 * Decode basic HTML entities.
 * @param {string} str
 * @returns {string}
 */
function decodeEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

/**
 * Extract all <meta> tags as key-value pairs.
 * @param {string} html
 * @returns {Map<string, string>}
 */
function extractMeta(html) {
  const meta = new Map();
  // <meta name="..." content="..."> or <meta property="..." content="...">
  const re = /<meta\s+(?:[^>]*?\s+)?(?:name|property)\s*=\s*["']([^"']+)["'][^>]*?\s+content\s*=\s*["']([^"']*)["'][^>]*?\/?>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    meta.set(m[1].toLowerCase(), decodeEntities(m[2]));
  }
  // Also match content-first order: <meta content="..." name="...">
  const re2 = /<meta\s+(?:[^>]*?\s+)?content\s*=\s*["']([^"']*)["'][^>]*?\s+(?:name|property)\s*=\s*["']([^"']+)["'][^>]*?\/?>/gi;
  while ((m = re2.exec(html)) !== null) {
    const key = m[2].toLowerCase();
    if (!meta.has(key)) {
      meta.set(key, decodeEntities(m[1]));
    }
  }
  return meta;
}

/**
 * Extract canonical URL from <link rel="canonical" href="...">.
 * @param {string} html
 * @returns {string|null}
 */
function extractCanonical(html) {
  const re = /<link\s+[^>]*?rel\s*=\s*["']canonical["'][^>]*?href\s*=\s*["']([^"']+)["'][^>]*?\/?>/i;
  const m = html.match(re);
  if (m) return m[1];
  // Also match href-first order
  const re2 = /<link\s+[^>]*?href\s*=\s*["']([^"']+)["'][^>]*?rel\s*=\s*["']canonical["'][^>]*?\/?>/i;
  const m2 = html.match(re2);
  return m2 ? m2[1] : null;
}

/**
 * Extract the first <time datetime="..."> value.
 * @param {string} html
 * @returns {string|null}
 */
function extractTime(html) {
  const re = /<time\s+[^>]*?datetime\s*=\s*["']([^"']+)["'][^>]*?>/i;
  const m = html.match(re);
  return m ? m[1] : null;
}

/**
 * Extract the <html lang="..."> attribute.
 * @param {string} html
 * @returns {string|null}
 */
function extractLang(html) {
  const re = /<html\s+[^>]*?lang\s*=\s*["']([^"']+)["'][^>]*?>/i;
  const m = html.match(re);
  return m ? m[1] : null;
}

/**
 * Parse an HTML string and return structured metadata.
 * @param {string} html — the full HTML source
 * @returns {object}
 */
export function parse(html) {
  const meta = extractMeta(html);

  const title = meta.get('og:title')
    || extractTag(html, 'title')
    || null;

  const description = meta.get('og:description')
    || meta.get('description')
    || null;

  const date = meta.get('article:published_time')
    || meta.get('date')
    || meta.get('dc.date')
    || extractTime(html)
    || null;

  const author = meta.get('author')
    || meta.get('dc.creator')
    || null;

  const canonical = extractCanonical(html)
    || meta.get('og:url')
    || null;

  const image = meta.get('og:image') || null;

  const lang = extractLang(html) || null;

  const type = meta.get('og:type') || null;

  // Collect all meta as a plain object for the "raw" field
  const raw = {};
  for (const [k, v] of meta) {
    raw[k] = v;
  }

  return {
    title: title ? decodeEntities(title) : null,
    description,
    date,
    author,
    canonical,
    image,
    lang,
    type,
    meta: raw,
  };
}

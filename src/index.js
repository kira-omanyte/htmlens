/**
 * htmlens — A lens for static HTML files.
 *
 * Extracts metadata from HTML files. Generates feeds, sitemaps, and indexes.
 * No build step. No opinions. Zero dependencies.
 */

export { parse } from './parse.js';
export { scan } from './scan.js';
export { toJSON, toRSS, toSitemap, toCSV } from './format.js';

/**
 * htmlens/scan — Walk a directory and extract metadata from all HTML files.
 *
 * Returns an array of { path, relativePath, ...metadata } sorted by date (newest first).
 */

import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, extname } from 'node:path';
import { parse } from './parse.js';

/**
 * Recursively find all .html files under a directory.
 * @param {string} dir
 * @param {string[]} [exclude] — glob-like patterns to skip (simple: exact dir names)
 * @returns {Promise<string[]>}
 */
async function findHtml(dir, exclude = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (exclude.includes(entry.name)) continue;
    if (entry.name.startsWith('.')) continue;

    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...await findHtml(fullPath, exclude));
    } else if (entry.isFile() && extname(entry.name).toLowerCase() === '.html') {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Scan a directory for HTML files and extract metadata from each.
 * @param {string} dir — root directory to scan
 * @param {object} [options]
 * @param {string[]} [options.exclude] — directory names to skip
 * @param {string} [options.include] — only include files whose relativePath starts with this prefix
 * @param {boolean} [options.sort] — sort by date descending (default: true)
 * @returns {Promise<object[]>}
 */
export async function scan(dir, options = {}) {
  const { exclude = [], include = '', sort = true } = options;

  const files = await findHtml(dir, exclude);
  const results = [];

  for (const filePath of files) {
    const relPath = relative(dir, filePath);

    // Filter by path prefix if specified
    if (include && !relPath.startsWith(include)) continue;

    const html = await readFile(filePath, 'utf-8');
    const metadata = parse(html);
    const fileStat = await stat(filePath);

    results.push({
      path: filePath,
      relativePath: relPath,
      modified: fileStat.mtime.toISOString(),
      ...metadata,
    });
  }

  if (sort) {
    results.sort((a, b) => {
      const da = a.date || a.modified;
      const db = b.date || b.modified;
      return da > db ? -1 : da < db ? 1 : 0;
    });
  }

  return results;
}

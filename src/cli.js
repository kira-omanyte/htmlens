#!/usr/bin/env node

/**
 * htmlens CLI
 *
 * Usage:
 *   htmlens <directory> [options]
 *
 * Options:
 *   --format, -f    Output format: json (default), rss, sitemap, csv
 *   --url, -u       Base URL for RSS/sitemap generation
 *   --title, -t     Feed title (RSS)
 *   --desc, -d      Feed description (RSS)
 *   --lang, -l      Feed language (RSS), e.g., "en"
 *   --include       Only include files matching this path prefix (e.g., "essays/")
 *   --exclude, -e   Directory names to exclude (comma-separated)
 *   --title-strip   Suffix to strip from item titles (e.g., " — Site Name")
 *   --raw           Include raw meta tags in JSON output
 *   --help, -h      Show this help
 *   --version, -v   Show version
 */

import { readFile } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scan } from './scan.js';
import { toJSON, toRSS, toSitemap, toCSV } from './format.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const args = {
    dir: null,
    format: 'json',
    url: '',
    title: 'htmlens feed',
    desc: '',
    lang: '',
    include: '',
    exclude: [],
    titleStrip: '',
    raw: false,
    help: false,
    version: false,
  };

  const rest = argv.slice(2);
  let i = 0;

  while (i < rest.length) {
    const arg = rest[i];

    if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (arg === '--version' || arg === '-v') {
      args.version = true;
    } else if (arg === '--raw') {
      args.raw = true;
    } else if (arg === '--format' || arg === '-f') {
      args.format = rest[++i];
    } else if (arg === '--url' || arg === '-u') {
      args.url = rest[++i];
    } else if (arg === '--title' || arg === '-t') {
      args.title = rest[++i];
    } else if (arg === '--desc' || arg === '-d') {
      args.desc = rest[++i];
    } else if (arg === '--lang' || arg === '-l') {
      args.lang = rest[++i];
    } else if (arg === '--include') {
      args.include = rest[++i];
    } else if (arg === '--exclude' || arg === '-e') {
      args.exclude = rest[++i].split(',').map(s => s.trim());
    } else if (arg === '--title-strip') {
      args.titleStrip = rest[++i];
    } else if (!arg.startsWith('-')) {
      args.dir = arg;
    }

    i++;
  }

  return args;
}

const HELP = `htmlens — a lens for static HTML files

Usage:
  htmlens <directory> [options]

Options:
  --format, -f <fmt>     Output format: json, rss, sitemap, csv (default: json)
  --url, -u <url>        Base URL for RSS/sitemap links
  --title, -t <title>    Feed title (for RSS)
  --desc, -d <desc>      Feed description (for RSS)
  --lang, -l <lang>      Feed language (for RSS), e.g., "en"
  --include <prefix>     Only include files matching this path prefix
  --exclude, -e <dirs>   Directory names to skip (comma-separated)
  --title-strip <suffix> Strip suffix from item titles (e.g., " — Site Name")
  --raw                  Include raw meta tags in JSON output
  --help, -h             Show this help
  --version, -v          Show version

Examples:
  htmlens ./site                                  # JSON index of all HTML files
  htmlens ./site -f rss -u https://x.com          # Generate RSS feed
  htmlens ./site -f sitemap -u https://x.com
  htmlens ./site --include essays/ -f rss          # Only essays in the feed
  htmlens ./site --title-strip " — My Site"        # Clean RSS titles
  htmlens ./site -e node_modules,dist              # Skip directories
`;

async function main() {
  const args = parseArgs(process.argv);

  if (args.help) {
    process.stdout.write(HELP);
    process.exit(0);
  }

  if (args.version) {
    const pkg = JSON.parse(
      await readFile(join(__dirname, '..', 'package.json'), 'utf-8')
    );
    process.stdout.write(`htmlens v${pkg.version}\n`);
    process.exit(0);
  }

  if (!args.dir) {
    process.stderr.write('Error: no directory specified.\n\n');
    process.stderr.write(HELP);
    process.exit(1);
  }

  const dir = resolve(args.dir);
  const results = await scan(dir, { exclude: args.exclude, include: args.include });

  let output;

  switch (args.format) {
    case 'json':
      if (args.raw) {
        output = JSON.stringify(results, null, 2);
      } else {
        output = toJSON(results);
      }
      break;

    case 'rss':
      if (!args.url) {
        process.stderr.write('Error: --url is required for RSS output.\n');
        process.exit(1);
      }
      output = toRSS(results, {
        siteUrl: args.url,
        title: args.title,
        description: args.desc,
        language: args.lang,
        titleStrip: args.titleStrip,
      });
      break;

    case 'sitemap':
      if (!args.url) {
        process.stderr.write('Error: --url is required for sitemap output.\n');
        process.exit(1);
      }
      output = toSitemap(results, { siteUrl: args.url });
      break;

    case 'csv':
      output = toCSV(results);
      break;

    default:
      process.stderr.write(`Error: unknown format "${args.format}"\n`);
      process.exit(1);
  }

  process.stdout.write(output + '\n');
}

main().catch(err => {
  process.stderr.write(`Error: ${err.message}\n`);
  process.exit(1);
});

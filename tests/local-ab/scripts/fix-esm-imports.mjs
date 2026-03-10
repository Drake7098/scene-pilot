import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const targetDir = process.argv[2];
if (!targetDir) {
  console.error('Usage: node fix-esm-imports.mjs <dir>');
  process.exit(1);
}

const RELATIVE_SPEC_RE = /((?:from\s+|import\s*\(\s*)["'])(\.{1,2}\/[^"']+)(["'])/g;

function needsJsExtension(spec) {
  if (!spec.startsWith('./') && !spec.startsWith('../')) return false;
  const clean = spec.split('?')[0].split('#')[0];
  const ext = path.extname(clean);
  return ext.length === 0;
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const filePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(filePath);
      continue;
    }
    if (!entry.isFile() || !filePath.endsWith('.js')) continue;

    const raw = await readFile(filePath, 'utf8');
    let changed = false;
    const next = raw.replace(RELATIVE_SPEC_RE, (_, head, spec, tail) => {
      if (!needsJsExtension(spec)) return `${head}${spec}${tail}`;
      changed = true;
      return `${head}${spec}.js${tail}`;
    });

    if (changed) await writeFile(filePath, next, 'utf8');
  }
}

const dirStat = await stat(targetDir).catch(() => null);
if (!dirStat?.isDirectory()) {
  console.error(`Target is not a directory: ${targetDir}`);
  process.exit(1);
}

await walk(targetDir);

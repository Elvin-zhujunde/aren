import { readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const docsDir = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.join(docsDir, 'manifest.json');

async function collectMarkdownFiles(dir, baseDir = docsDir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...await collectMarkdownFiles(fullPath, baseDir));
      continue;
    }

    if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== '.md') {
      continue;
    }

    const relativePath = path.relative(baseDir, fullPath).split(path.sep).join('/');
    const parent = path.dirname(relativePath) === '.' ? null : path.dirname(relativePath);

    files.push({
      name: path.basename(entry.name, path.extname(entry.name)),
      path: `/docs/${relativePath}`,
      parent,
    });
  }

  return files;
}

const manifest = (await collectMarkdownFiles(docsDir)).sort((a, b) =>
  a.name.localeCompare(b.name, 'en', { numeric: true })
);

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

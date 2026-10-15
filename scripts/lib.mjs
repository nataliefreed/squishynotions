// Shared helpers: find every tool folder, validate its tool.json,
// and shape the manifest the gallery reads.
import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const toolsDir = join(root, 'tools');
export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const text = (v) => typeof v === 'string' && v.trim() !== '';

/**
 * Reads tools/<slug>/tool.json for every tool folder.
 * Folders starting with "_" or "." are skipped (that's how _template stays out of the site).
 * Returns { tools, problems }. A tool with problems is left out of `tools`.
 */
export async function collectTools() {
  const tools = [];
  const problems = [];
  if (!existsSync(toolsDir)) return { tools, problems: ['There is no tools/ folder.'] };

  const folders = (await readdir(toolsDir, { withFileTypes: true }))
    .filter((e) => e.isDirectory() && !e.name.startsWith('_') && !e.name.startsWith('.'))
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const { name: slug } of folders) {
    const dir = join(toolsDir, slug);
    const fail = (...issues) => problems.push(...issues.map((i) => `tools/${slug}: ${i}`));

    if (!SLUG.test(slug)) {
      fail('folder names can only use lowercase letters, numbers and hyphens');
      continue;
    }

    let meta;
    try {
      meta = JSON.parse(await readFile(join(dir, 'tool.json'), 'utf8'));
    } catch (err) {
      fail(err.code === 'ENOENT' ? 'missing tool.json' : `tool.json isn't valid JSON (${err.message})`);
      continue;
    }
    if (typeof meta !== 'object' || meta === null || Array.isArray(meta)) {
      fail('tool.json must be a JSON object');
      continue;
    }

    const issues = [];
    if (!text(meta.title)) issues.push('tool.json needs a "title"');
    if (!text(meta.description)) issues.push('tool.json needs a one-line "description"');
    if (meta.tags !== undefined && !(Array.isArray(meta.tags) && meta.tags.every(text))) {
      issues.push('"tags" must be a list of non-empty strings');
    }
    if (meta.added !== undefined && !(typeof meta.added === 'string' && DATE.test(meta.added))) {
      issues.push('"added" must look like 2026-10-14');
    }
    if (meta.emoji !== undefined && !text(meta.emoji)) issues.push('"emoji" must be a short string');
    if (meta.outputDir !== undefined && !text(meta.outputDir)) issues.push('"outputDir" must be a folder name');
    if (meta.thumbnail !== undefined && !(text(meta.thumbnail) && existsSync(join(dir, meta.thumbnail)))) {
      issues.push(`thumbnail "${meta.thumbnail}" isn't a file inside the tool's folder`);
    }
    if (!existsSync(join(dir, 'index.html')) && !existsSync(join(dir, 'package.json'))) {
      issues.push('needs an index.html (or a package.json with a build script)');
    }
    if (issues.length) {
      fail(...issues);
      continue;
    }

    tools.push({
      slug,
      title: meta.title.trim(),
      description: meta.description.trim(),
      tags: [...new Set((meta.tags ?? []).map((t) => t.trim().toLowerCase()))],
      emoji: meta.emoji?.trim() ?? null,
      thumbnailFile: meta.thumbnail?.replace(/^\.\//, '') ?? null,
      added: meta.added ?? null,
      outputDir: meta.outputDir ?? 'dist',
    });
  }

  return { tools, problems };
}

/** What the gallery (tools/index.html) fetches as tools/tools.json. Newest first; tools without a date sort A to Z after the dated ones. */
export function toManifest(tools) {
  const sorted = [...tools].sort(
    (a, b) => (b.added ?? '').localeCompare(a.added ?? '') || a.title.localeCompare(b.title),
  );
  return {
    tools: sorted.map((t) => ({
      slug: t.slug,
      title: t.title,
      description: t.description,
      tags: t.tags,
      emoji: t.emoji,
      added: t.added,
      href: `${t.slug}/`,                                                  // relative to the gallery, which is tools/index.html
      thumbnail: t.thumbnailFile ? encodeURI(`${t.slug}/${t.thumbnailFile}`) : null,
    })),
  };
}

import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const index = await readFile(join(root, 'index.html'), 'utf8');
const version = (await readFile(join(root, 'VERSION'), 'utf8')).trim();
const config = await readFile(join(root, 'src/core/config.js'), 'utf8');

assert.match(index, /<meta name="viewport"/i, '缺少移动端 viewport');
assert.match(index, /<html lang="zh-CN"/i, '页面语言应为 zh-CN');
assert.ok(config.includes(`APP_VERSION = '${version}'`), 'VERSION 与应用版本不一致');
assert.doesNotMatch(index, /(?:src|href)="https?:\/\//i, '首屏不能依赖外部资源');

for (const match of index.matchAll(/(?:src|href)="(\.\/[^"?#]+)[^\"]*"/g)) {
  const target = resolve(root, match[1]);
  await stat(target);
}

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.flatMap((entry) => {
    if (['.git', 'output', 'tests'].includes(entry.name)) return [];
    const target = join(directory, entry.name);
    return entry.isDirectory() ? collectFiles(target) : [target];
  }));
  return nested.flat();
}

const files = await collectFiles(root);
const bytes = (await Promise.all(files.map(async (file) => (await stat(file)).size)))
  .reduce((total, size) => total + size, 0);
assert.ok(bytes < 512 * 1024, `核心包超过 512KB 预算：${bytes} bytes`);

console.log(`质量门槛通过：${files.length} 个核心文件，${Math.round(bytes / 1024)}KB。`);

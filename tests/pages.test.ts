import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const workspaces: string[] = [];
afterEach(async () => { await Promise.all(workspaces.splice(0).map(path => rm(path, {recursive:true, force:true}))); });
async function fixture() {
 const path = await mkdtemp(join(tmpdir(), 'hullscope-pages-'));
 workspaces.push(path);
 await mkdir(join(path, 'dist/assets'), {recursive:true});
 await writeFile(join(path, 'dist/index.html'), '<script type="module" src="/Hullscope/assets/app.js"></script>');
 await writeFile(join(path, 'dist/assets/app.js'), 'export const release = true;');
 return path;
}
function stage(cwd:string, basePath:string) {
 return spawnSync(process.execPath, [resolve('scripts/stage-pages.mjs')], {cwd, encoding:'utf8', env:{...process.env, PAGES_BASE_PATH:basePath, HULLSCOPE_RELEASE_SHA:'test-revision'}});
}
describe('GitHub Pages artifact routing', () => {
 it('nests a custom-domain release under Hullscope and preserves incoming hash links', async () => {
  const cwd = await fixture();
  expect(stage(cwd, '').status).toBe(0);
  const root = await readFile(join(cwd, '.pages/index.html'), 'utf8');
  expect(root).toContain("location.replace('/Hullscope/'+location.search+location.hash)");
  expect(await readFile(join(cwd, '.pages/Hullscope/assets/app.js'), 'utf8')).toContain('release = true');
  expect(JSON.parse(await readFile(join(cwd, '.pages/Hullscope/release.json'), 'utf8')).commit).toBe('test-revision');
 });
 it('places a GitHub project release directly at its already-prefixed artifact root', async () => {
  const cwd = await fixture();
  expect(stage(cwd, '/Hullscope/').status).toBe(0);
  expect(await readFile(join(cwd, '.pages/index.html'), 'utf8')).toContain('/Hullscope/assets/app.js');
  expect(await readFile(join(cwd, '.pages/assets/app.js'), 'utf8')).toContain('release = true');
  await expect(readFile(join(cwd, '.pages/Hullscope/index.html'))).rejects.toThrow();
 });
 it('rejects an incompatible mount path or an incorrectly based build', async () => {
  const cwd = await fixture();
  expect(stage(cwd, '/different-project').status).not.toBe(0);
  await writeFile(join(cwd, 'dist/index.html'), '<script src="/assets/app.js"></script>');
  expect(stage(cwd, '').status).not.toBe(0);
 });
 it('rejects symbolic links in the published artifact', async () => {
  const cwd = await fixture();
  await symlink(join(cwd, 'dist/assets/app.js'), join(cwd, 'dist/assets/link.js'));
  expect(stage(cwd, '').status).not.toBe(0);
 });
});

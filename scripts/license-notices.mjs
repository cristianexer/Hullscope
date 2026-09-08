import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const lock = JSON.parse(await readFile('package-lock.json', 'utf8'));
const notices = ['Hullscope — bundled dependency notices', 'Generated from the committed npm lockfile. These notices include production dependencies; some packages may be tree-shaken out of the browser bundle.'];
const missing = [];
for (const [directory, entry] of Object.entries(lock.packages).sort(([a], [b]) => a.localeCompare(b))) {
  if (!directory || entry.dev || entry.devOptional) continue;
  let files;
  try { files = await readdir(directory, { withFileTypes: true }); } catch { continue; }
  const licenseFiles = files.filter(file => file.isFile() && /^(licen[cs]e|copying|copyright|notice)([.-]|$)/i.test(file.name));
  const name = directory.slice(directory.lastIndexOf('node_modules/') + 13);
  notices.push(`\n${'='.repeat(72)}\n${name} ${entry.version}\nDeclared license: ${entry.license ?? 'See notice'}\n${'='.repeat(72)}`);
  if (!licenseFiles.length) {
    const retained = {
      '@react-three/fiber': {version:'9.7.0',file:'react-three-fiber'},
      draco3d: {version:'1.5.7',file:'draco3d'},
      '@mediapipe/tasks-vision': {version:'0.10.17',file:'mediapipe-tasks-vision'},
    }[name];
    if (retained?.version === entry.version) { notices.push(await readFile(`docs/licenses/${retained.file}.txt`, 'utf8')); continue; }
    missing.push(name);
    const metadata = JSON.parse(await readFile(path.join(directory,'package.json'),'utf8'));
    if (metadata.author) notices.push(`Published package author: ${typeof metadata.author === 'string' ? metadata.author : JSON.stringify(metadata.author)}`);
    if (metadata.repository) notices.push(`Published package repository: ${typeof metadata.repository === 'string' ? metadata.repository : metadata.repository.url}`);
    const readme = files.find(file => file.isFile() && /^readme(\.md)?$/i.test(file.name));
    const content = readme ? await readFile(path.join(directory, readme.name), 'utf8') : '';
    const licenseSection = content.match(/(?:^|\n)#{1,3}\s+Licen[cs]e[^\n]*\n[\s\S]*/i)?.[0];
    notices.push(licenseSection ?? `This package declares ${entry.license ?? 'no SPDX identifier'} in its npm metadata and supplies no standalone license document.`);
  }
  for (const file of licenseFiles.sort((a, b) => a.name.localeCompare(b.name))) notices.push(`${file.name}\n${await readFile(path.join(directory, file.name), 'utf8')}`);
}
await mkdir('public/licenses', { recursive: true });
await writeFile('public/licenses/dependencies.txt', `${notices.join('\n\n')}\n`);
await writeFile('public/licenses/Hullscope-MIT.txt', await readFile('LICENSE'));
console.log(`Wrote production dependency notices. Packages without standalone notices: ${missing.join(', ') || 'none'}`);

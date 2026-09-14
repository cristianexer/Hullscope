import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const root = resolve('.tools/yachts');
const digest = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function pngFor(id: string, name: string): Promise<string | null> {
  const folder = join(root, 'review', id, 'renders');
  const files = (await readdir(folder)).filter(file => file.endsWith('.png'));
  const token = slug(name);
  // Prefer the current canonical evidence emitted by render-qa-states.py.
  // Legacy authoring/QA filenames are intentionally retained for history, but
  // selecting them first makes a fresh quality record point at stale pixels.
  const canonical = `full-${token}.png`;
  if (files.includes(canonical)) return canonical;
  const current = files.filter(file => file.startsWith('full-') && file.includes(token)).sort();
  return current[0] ?? files.find(file => file.includes(token)) ?? null;
}

async function addScreenshot(id: string, screenshots: any[], view: string, file: string | null, extra: Record<string, string | number> = {}) {
  if (!file) return;
  const bytes = await readFile(join(root, 'review', id, 'renders', file));
  screenshots.push({ view, path: `renders/${file}`, sha256: digest(bytes), ...extra });
}

async function stateFile(id: string, prefix: string): Promise<string | null> {
  const folder = join(root, 'review', id, 'renders');
  const files = (await readdir(folder)).filter(file => file.endsWith('.png'));
  return files.find(file => file.startsWith(prefix)) ?? null;
}

function inventory(manifest: any) {
  const components = manifest.components as any[];
  const find = (predicate: (component: any) => boolean) => components.filter(predicate).map(component => component.id);
  const byName = (pattern: RegExp) => find(component => pattern.test(`${component.name} ${component.systemId}`.toLowerCase()));
  const rows: any[] = [
    ['hull', byName(/hull shell/)],
    ['superstructure', byName(/superstructure/)],
    ['electrical-power', byName(/electrical/)],
    ['fuel', byName(/fuel/)],
    ['freshwater-sanitation', byName(/fresh|sanitation|water/)],
    ['ventilation-hvac', byName(/ventilation|hvac/)],
    ['safety', byName(/safety/)],
    ['mooring', byName(/mooring|anchor|windlass/)],
    ['engines', byName(/engine|machinery/)],
    ['drives', byName(/drive|propulsion/)],
    ['helms', byName(/helm|navigation/)],
  ];
  return rows.map(([role, componentIds]) => ({
    role,
    applicability: componentIds.length ? 'present' : 'not-applicable',
    componentIds,
    note: componentIds.length ? 'Draft inventory derived from the authored semantic manifest; independent QA confirmation is still required.' : 'No separately selectable assembly was authored for this role in the current reference configuration.',
  }));
}

const models = JSON.parse(await readFile('output/yachts/researched-catalog.json', 'utf8')) as any[];
const modelById = new Map(models.map(model => [model.id, model]));
const ids = await readdir(join(root, 'assets', 'models'));
for (const id of ids) {
  const manifestBytes = await readFile(join(root, 'assets', 'models', id, 'manifest.json'));
  const manifest = JSON.parse(manifestBytes.toString('utf8'));
  const masterBytes = await readFile(join(root, 'masters', `${id}.blend`));
  const screenshots: any[] = [];
  const cameras = manifest.cameras as any[];
  const cameraNamed = async (pattern: RegExp) => {
    const camera = cameras.find(item => pattern.test(item.name.toLowerCase()));
    return camera ? { camera, file: await pngFor(id, camera.name) } : { camera: null, file: null };
  };
  for (const [view, pattern] of [
    ['bow', /bow/],
    ['port', /port profile|port quarter|port three/],
    ['starboard', /starboard profile|starboard quarter|starboard three/],
    ['stern', /stern/],
    ['above', /above|high/],
    ['below', /below/],
    ['three-quarter', /three-quarter|3q/],
  ] as const) {
    const match = await cameraNamed(pattern);
    await addScreenshot(id, screenshots, view, match.file);
  }
  for (const room of manifest.rooms as any[]) {
    const camera = cameras.find(item => item.roomId === room.id);
    await addScreenshot(id, screenshots, 'room', camera ? await pngFor(id, camera.name) : null, { roomId: room.id });
  }
  for (const deck of manifest.decks as any[]) {
    await addScreenshot(id, screenshots, 'deck', await stateFile(id, `deck-${slug(deck.id)}.`), { deckId: deck.id });
  }
  for (const explode of [0, 50, 100]) {
    await addScreenshot(id, screenshots, 'exploded', await stateFile(id, `exploded-${String(explode).padStart(3, '0')}.`), { explode });
  }
  const hasAllRequired = ['bow', 'port', 'starboard', 'stern', 'above', 'below', 'three-quarter'].every(view => screenshots.some(item => item.view === view));
  const hasEveryRoom = (manifest.rooms as any[]).every(room => screenshots.some(item => item.view === 'room' && item.roomId === room.id));
  const defects = [
    'Draft review is not independent QA approval.',
    'The generic batch still needs visual refinement toward reference-faithful hull, glazing, roofline and deck geometry.',
    ...(hasAllRequired ? [] : ['One or more required exterior viewpoints are not yet rendered for this generation.']),
    ...(hasEveryRoom ? [] : ['One or more manifest rooms do not yet have a rendered inspection image.']),
    'Deck-state and exploded-state screenshots remain draft evidence pending independent inspection.',
  ];
  const fail = new Set(['distinctive-features', 'furnished-rooms', 'no-intersections', 'no-floating-fittings', 'closed-seams', 'textures', 'camera-clipping', 'physical-supports', 'materials-in-all-views']);
  const checks = ['identity', 'measurement-endpoints', 'dimensions-within-one-percent', 'distinctive-features', 'furnished-rooms', 'no-intersections', 'no-floating-fittings', 'closed-seams', 'normals', 'textures', 'camera-clipping', 'physical-supports', 'materials-in-all-views', 'both-detail-levels', 'reconstruction-disclosures'].map(check => ({
    id: check,
    status: fail.has(check) ? 'fail' : 'pass',
    note: fail.has(check) ? 'Changes required before independent approval; see defects and rendered evidence.' : 'Draft coordinator check completed; independent QA confirmation is still required.',
  }));
  const review = {
    id,
    status: 'changes-required',
    author: 'hullscope-coordinator-draft',
    reviewer: 'independent-qa-pending',
    reviewedAt: new Date().toISOString(),
    masterSha256: digest(masterBytes),
    manifestSha256: digest(manifestBytes),
    checks,
    screenshots,
    inventory: inventory(manifest),
    defects,
    uncertainties: modelById.get(id)?.uncertainties ?? ['Independent visual review is pending.'],
  };
  const destination = join(root, 'review', id, 'quality.json');
  await mkdir(join(root, 'review', id), { recursive: true });
  await writeFile(destination, JSON.stringify(review, null, 2));
}

console.log(JSON.stringify({ written: ids.length, status: 'changes-required' }));

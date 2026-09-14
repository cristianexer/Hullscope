export const yachtSeedColumns = [
  'brand',
  'family',
  'model',
  'status',
  'dimensions',
  'displacement',
  'tanks',
  'accommodation',
  'engines',
  'performance',
  'sources',
] as const;

export type YachtSeedColumn = (typeof yachtSeedColumns)[number];

export const yachtSpecFields = [
  'dimensions',
  'displacement',
  'tanks',
  'accommodation',
  'engines',
  'performance',
] as const;

export type YachtSpecField = (typeof yachtSpecFields)[number];
export type UncertaintyField = 'status' | YachtSpecField;

export const dispositionTypes = [
  'canonical',
  'alias',
  'variant',
  'duplicate',
  'out-of-period',
  'unresolved',
  'deferred',
  'announced',
] as const;

export type DispositionType = (typeof dispositionTypes)[number];
export type StatusCategory = 'current' | 'historical' | 'announced' | 'mixed' | 'unknown';

export type RawYachtFields = Readonly<Record<YachtSeedColumn, string>>;

export interface UncertaintyNote {
  readonly field: UncertaintyField;
  readonly value: string;
  readonly markers: readonly string[];
}

export interface UnresolvedDisposition {
  readonly type: 'unresolved';
  readonly evidence: readonly string[];
}

export interface DeferredDisposition {
  readonly type: 'deferred';
  readonly evidence: readonly [string, ...string[]];
}

export interface OutOfPeriodDisposition {
  readonly type: 'out-of-period';
  readonly evidence: readonly [string, ...string[]];
}

export interface AnnouncedDisposition {
  readonly type: 'announced';
  readonly evidence: readonly [string, ...string[]];
  readonly canonicalId?: string;
}

export interface ResolvedDisposition {
  readonly type: Exclude<DispositionType, 'out-of-period' | 'unresolved' | 'announced'>;
  readonly evidence: readonly [string, ...string[]];
  readonly canonicalId: string;
}

export type Disposition = UnresolvedDisposition | DeferredDisposition | OutOfPeriodDisposition | AnnouncedDisposition | ResolvedDisposition;

export interface DispositionInput {
  readonly type: DispositionType;
  readonly evidence?: readonly string[];
  readonly canonicalId?: string;
}

export interface YachtSeedRow {
  readonly rowId: string;
  readonly sourceLine: number;
  readonly rawLine: string;
  readonly rawFields: RawYachtFields;
  readonly sourceUrls: readonly string[];
  readonly brand: string;
  readonly family: string;
  readonly name: string;
  readonly normalizedName: string;
  readonly status: string;
  readonly statusCategory: StatusCategory;
  readonly uncertainty: readonly UncertaintyNote[];
  readonly missingSpecFields: readonly YachtSpecField[];
  readonly disposition: Disposition;
}

export interface DuplicateCandidate {
  readonly normalizedName: string;
  readonly rowIds: readonly string[];
  readonly sourceLines: readonly number[];
  readonly names: readonly string[];
  readonly brands: readonly string[];
}

export interface MissingSpecObservation {
  readonly rowId: string;
  readonly sourceLine: number;
  readonly field: YachtSpecField;
}

export interface SeedAuditCounts {
  readonly totalRows: number;
  readonly byBrand: Readonly<Record<string, number>>;
  readonly byStatusCategory: Readonly<Record<StatusCategory, number>>;
  readonly byDisposition: Readonly<Record<DispositionType, number>>;
  readonly missingSpecFieldCounts: Readonly<Record<YachtSpecField, number>>;
  readonly rowsWithMissingSpecs: number;
  readonly rowsWithDeclaredUncertainty: number;
  readonly sourceUrlCount: number;
}

export interface SeedAudit {
  readonly rows: readonly YachtSeedRow[];
  readonly duplicateCandidates: readonly DuplicateCandidate[];
  readonly missingSpecs: readonly MissingSpecObservation[];
  readonly counts: SeedAuditCounts;
}

const tableHeader = ['brand', 'family', 'model', 'how it appears in the market'];
const uncertaintyPatterns = [
  { marker: 'approximation', pattern: /\bapprox(?:\.|imately)?\b/i },
  { marker: 'variation', pattern: /\b(?:var(?:y|ies|ied)|varies by)\b/i },
  { marker: 'options', pattern: /\boption(?:s|al)?\b/i },
  { marker: 'not confirmed or published', pattern: /\bnot (?:confirmed|exposed|found|published|reliably|yet)\b/i },
  { marker: 'inferred', pattern: /\binferred\b/i },
  { marker: 'verify', pattern: /\bverify\b/i },
  { marker: 'appears', pattern: /\bappears\b/i },
  { marker: 'as published', pattern: /\bas published\b/i },
  { marker: 'possible overlap', pattern: /\b(?:may overlap|separate from)\b/i },
  { marker: 'typical or common layout', pattern: /\b(?:typically|typical|commonly)\b/i },
] as const;

function splitTableCells(line: string): string[] {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|')) return [];

  const end = trimmed.endsWith('|') ? trimmed.length - 1 : trimmed.length;
  const cells: string[] = [];
  let cell = '';
  let escaped = false;

  for (let index = 1; index < end; index += 1) {
    const character = trimmed[index];
    if (escaped) {
      cell += character;
      escaped = false;
    } else if (character === '\\') {
      cell += character;
      escaped = true;
    } else if (character === '|') {
      cells.push(cell.trim());
      cell = '';
    } else {
      cell += character;
    }
  }

  cells.push(cell.trim());
  return cells;
}

function isTableSeparator(cells: readonly string[]): boolean {
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function isBlankSpec(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return (
    normalized.length === 0 ||
    /^[—\-/\s]+$/.test(normalized) ||
    /^(?:not published|not found|not reliably published|not confirmed|unknown|n\/a)\b/.test(normalized)
  );
}

function statusCategory(status: string): StatusCategory {
  const value = status.toLowerCase();
  const announced = /\b(?:announced|in-development|in production|planned|letter of intent)\b/.test(value);
  const historical = /\b(?:historical|previous-generation|discontinued|heritage)\b/.test(value);
  const current = /\b(?:current|official|dealer|brokerage|independent|regional|localized|listed|legacy)\b/.test(value);

  if (announced) return 'announced';
  if (historical && current) return 'mixed';
  if (historical) return 'historical';
  if (current) return 'current';
  return 'unknown';
}

export function normalizeModelName(name: string): string {
  return name
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function sourceUrls(sources: string): string[] {
  const urls: string[] = [];
  for (const match of sources.matchAll(/https?:\/\/[^)\s]+/g)) {
    urls.push(match[0]);
  }
  return [...new Set(urls)];
}

function uncertaintyFor(fields: RawYachtFields): UncertaintyNote[] {
  const notes: UncertaintyNote[] = [];
  const fieldsToInspect: readonly UncertaintyField[] = ['status', ...yachtSpecFields];

  for (const field of fieldsToInspect) {
    const value = fields[field];
    const markers = uncertaintyPatterns
      .filter(({ pattern }) => pattern.test(value))
      .map(({ marker }) => marker);
    if (markers.length > 0) notes.push({ field, value, markers });
  }

  return notes;
}

function initialDisposition(): UnresolvedDisposition {
  return { type: 'unresolved', evidence: [] };
}

function fieldsFromCells(cells: readonly string[]): RawYachtFields {
  if (cells.length !== yachtSeedColumns.length) {
    throw new Error(`Expected ${yachtSeedColumns.length} fields, received ${cells.length}`);
  }

  return yachtSeedColumns.reduce(
    (fields, column, index) => ({ ...fields, [column]: cells[index] ?? '' }),
    {} as Record<YachtSeedColumn, string>,
  );
}

function rowFromLine(line: string, sourceLine: number): YachtSeedRow {
  const rawFields = fieldsFromCells(splitTableCells(line));
  const missingSpecFields = yachtSpecFields.filter((field) => isBlankSpec(rawFields[field]));

  return {
    rowId: `seed-row-${sourceLine}`,
    sourceLine,
    rawLine: line,
    rawFields,
    sourceUrls: sourceUrls(rawFields.sources),
    brand: rawFields.brand,
    family: rawFields.family,
    name: rawFields.model,
    normalizedName: normalizeModelName(rawFields.model),
    status: rawFields.status,
    statusCategory: statusCategory(rawFields.status),
    uncertainty: uncertaintyFor(rawFields),
    missingSpecFields,
    disposition: initialDisposition(),
  };
}

function findTableHeader(lines: readonly string[]): number {
  return lines.findIndex((line) => {
    const cells = splitTableCells(line).map((cell) => cell.toLowerCase());
    return tableHeader.every((header, index) => cells[index] === header);
  });
}

export function parseYachtSeed(markdown: string): readonly YachtSeedRow[] {
  const lines = markdown.split(/\r?\n/);
  const headerIndex = findTableHeader(lines);
  if (headerIndex < 0) throw new Error('Could not find the yacht model table header');

  const rows: YachtSeedRow[] = [];
  for (let index = headerIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim().startsWith('|')) break;

    const cells = splitTableCells(line);
    if (isTableSeparator(cells)) continue;
    rows.push(rowFromLine(line, index + 1));
  }

  if (rows.length === 0) throw new Error('The yacht model table contains no data rows');
  return rows;
}

function countValues<T extends string>(values: readonly T[]): Record<T, number> {
  return values.reduce(
    (counts, value) => ({ ...counts, [value]: (counts[value] ?? 0) + 1 }),
    {} as Record<T, number>,
  );
}

function duplicateCandidates(rows: readonly YachtSeedRow[]): DuplicateCandidate[] {
  const groups = new Map<string, YachtSeedRow[]>();
  for (const row of rows) {
    const group = groups.get(row.normalizedName) ?? [];
    group.push(row);
    groups.set(row.normalizedName, group);
  }

  return [...groups.entries()]
    .filter(([, group]) => group.length > 1)
    .map(([normalizedName, group]) => ({
      normalizedName,
      rowIds: group.map((row) => row.rowId),
      sourceLines: group.map((row) => row.sourceLine),
      names: group.map((row) => row.name),
      brands: group.map((row) => row.brand),
    }))
    .sort((left, right) => left.sourceLines[0] - right.sourceLines[0]);
}

function buildCounts(rows: readonly YachtSeedRow[], missingSpecs: readonly MissingSpecObservation[]): SeedAuditCounts {
  const byBrand = countValues(rows.map((row) => row.brand));
  const byStatusCategory = countValues(rows.map((row) => row.statusCategory));
  const byDisposition = countValues(rows.map((row) => row.disposition.type));
  const missingSpecFieldCounts = countValues(missingSpecs.map((observation) => observation.field));

  return {
    totalRows: rows.length,
    byBrand,
    byStatusCategory: {
      current: byStatusCategory.current ?? 0,
      historical: byStatusCategory.historical ?? 0,
      announced: byStatusCategory.announced ?? 0,
      mixed: byStatusCategory.mixed ?? 0,
      unknown: byStatusCategory.unknown ?? 0,
    },
    byDisposition: {
      canonical: byDisposition.canonical ?? 0,
      alias: byDisposition.alias ?? 0,
      variant: byDisposition.variant ?? 0,
      duplicate: byDisposition.duplicate ?? 0,
      'out-of-period': byDisposition['out-of-period'] ?? 0,
      unresolved: byDisposition.unresolved ?? 0,
      deferred: byDisposition.deferred ?? 0,
      announced: byDisposition.announced ?? 0,
    },
    missingSpecFieldCounts: {
      dimensions: missingSpecFieldCounts.dimensions ?? 0,
      displacement: missingSpecFieldCounts.displacement ?? 0,
      tanks: missingSpecFieldCounts.tanks ?? 0,
      accommodation: missingSpecFieldCounts.accommodation ?? 0,
      engines: missingSpecFieldCounts.engines ?? 0,
      performance: missingSpecFieldCounts.performance ?? 0,
    },
    rowsWithMissingSpecs: rows.filter((row) => row.missingSpecFields.length > 0).length,
    rowsWithDeclaredUncertainty: rows.filter((row) => row.uncertainty.length > 0).length,
    sourceUrlCount: rows.reduce((total, row) => total + row.sourceUrls.length, 0),
  };
}

export function auditYachtSeed(markdown: string): SeedAudit {
  const rows = parseYachtSeed(markdown);
  const missingSpecs = rows.flatMap((row) =>
    row.missingSpecFields.map((field) => ({ rowId: row.rowId, sourceLine: row.sourceLine, field })),
  );

  return {
    rows,
    duplicateCandidates: duplicateCandidates(rows),
    missingSpecs,
    counts: buildCounts(rows, missingSpecs),
  };
}

function normalizedEvidence(evidence: readonly string[] | undefined): string[] {
  return (evidence ?? []).map((item) => item.trim()).filter((item) => item.length > 0);
}

function makeDisposition(input: DispositionInput): Disposition {
  if (!dispositionTypes.includes(input.type)) {
    throw new Error(`Unknown disposition ${String(input.type)}`);
  }
  const evidence = normalizedEvidence(input.evidence);
  const canonicalId = input.canonicalId?.trim();
  const needsCanonicalId = !['out-of-period', 'unresolved', 'deferred', 'announced'].includes(input.type);

  if (input.type !== 'unresolved' && evidence.length === 0) {
    throw new Error(`Disposition ${input.type} requires evidence`);
  }
  if (needsCanonicalId && !canonicalId) {
    throw new Error(`Disposition ${input.type} requires canonicalId`);
  }
  if ((input.type === 'unresolved' || input.type === 'deferred' || input.type === 'out-of-period') && canonicalId) {
    throw new Error(`Disposition ${input.type} cannot carry canonicalId`);
  }

  if (input.type === 'unresolved') return { type: input.type, evidence };
  if (input.type === 'deferred') return { type: input.type, evidence: evidence as [string, ...string[]] };
  if (input.type === 'out-of-period') return { type: input.type, evidence: evidence as [string, ...string[]] };
  if (input.type === 'announced') {
    return {
      type: input.type,
      evidence: evidence as [string, ...string[]],
      ...(canonicalId === undefined ? {} : { canonicalId }),
    };
  }
  return {
    type: input.type,
    evidence: evidence as [string, ...string[]],
    canonicalId: canonicalId as string,
  };
}

export function setDisposition(row: YachtSeedRow, disposition: DispositionInput): YachtSeedRow {
  return { ...row, disposition: makeDisposition(disposition) };
}

export function applyDispositions(
  rows: readonly YachtSeedRow[],
  dispositions: Readonly<Record<string, DispositionInput>>,
): readonly YachtSeedRow[] {
  const rowIds = new Set(rows.map((row) => row.rowId));
  for (const rowId of Object.keys(dispositions)) {
    if (!rowIds.has(rowId)) throw new Error(`Disposition references unknown row ${rowId}`);
  }

  return rows.map((row) => {
    const disposition = dispositions[row.rowId];
    return disposition === undefined ? row : setDisposition(row, disposition);
  });
}

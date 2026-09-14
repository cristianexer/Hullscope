import { describe, expect, it } from 'vitest';
import {
  applyDispositions,
  auditYachtSeed,
  parseYachtSeed,
  setDisposition,
} from '../src/data/yachts/seedAudit';

const fixture = `# fixture

| Brand | Family | Model | How it appears in the market | Dimensions: LOA / beam / draft | Disp. | Tanks: fuel / fresh / black | Accommodation | Engines / propulsion | Performance | Sources and cross-checks |
|---|---|---|---|---|---:|---|---|---|---|---|
| Princess | V Class | V65 | Official current range | 20.61 m / 5.04 m / 1.62 m | 36,477 kg | 4,100 / 800 / 272 L | 8 berths | Twin MAN V12-1400 | 34–36 kn | [Manufacturer](https://example.test/princess/v65) |
| Princess | V Class | V65 | Historical; 2006 launch, with later redesigns | Approx. 19.35 m / 63'6" / — | — | — | — | — | — | [Heritage](https://example.test/princess/heritage) |
| Sunseeker | Predator | Predator 65 | Official global range | 20.50 m / 5.10 m / 1.60 m | 37,810 kg | 3,500 / 800 / 200 L | 3 cabins | Twin Volvo Penta IPS | Up to 35 kn | [Manufacturer](https://example.test/sunseeker/predator-65), [Broker](https://example.test/broker/predator-65) |
| Sunseeker | Ocean | 82 Ocean | Announced/in-development model; not yet a fully specified current production model | — / — / — | — | — | — | — | — | [Brokerage](https://example.test/sunseeker/range) |

This paragraph ends the table.
`;

describe('yacht seed audit parser', () => {
  it('parses a string fixture while preserving row identity, source line, raw fields, and URLs', () => {
    const rows = parseYachtSeed(fixture);

    expect(rows).toHaveLength(4);
    expect(rows[0]).toMatchObject({
      rowId: 'seed-row-5',
      sourceLine: 5,
      brand: 'Princess',
      name: 'V65',
      status: 'Official current range',
      normalizedName: 'v65',
    });
    expect(rows[0].rawFields.model).toBe('V65');
    expect(rows[0].rawFields.sources).toBe('[Manufacturer](https://example.test/princess/v65)');
    expect(rows[0].sourceUrls).toEqual(['https://example.test/princess/v65']);
    expect(rows[3].missingSpecFields).toEqual([
      'dimensions',
      'displacement',
      'tanks',
      'accommodation',
      'engines',
      'performance',
    ]);
    expect(rows.every((row) => row.disposition.type === 'unresolved')).toBe(true);
  });

  it('keeps exactly one disposition per source row and only changes addressed rows', () => {
    const audit = auditYachtSeed(fixture);
    const resolved = applyDispositions(audit.rows, {
      'seed-row-5': {
        type: 'canonical',
        canonicalId: 'princess-v65-current',
        evidence: ['official current range row in the fixture'],
      },
      'seed-row-8': {
        type: 'announced',
        canonicalId: 'sunseeker-82-ocean',
        evidence: ['announced/in-development status in the fixture'],
      },
    });

    expect(new Set(resolved.map((row) => row.rowId)).size).toBe(resolved.length);
    expect(resolved).toHaveLength(audit.counts.totalRows);
    expect(resolved.filter((row) => row.disposition.type === 'unresolved')).toHaveLength(2);
    expect(resolved.filter((row) => row.disposition.type !== 'unresolved')).toHaveLength(2);
  });

  it('rejects a resolution without evidence or its required canonical id', () => {
    const row = parseYachtSeed(fixture)[0];

    expect(() =>
      setDisposition(row, { type: 'canonical', canonicalId: 'princess-v65-current' }),
    ).toThrow(/requires evidence/);
    expect(() =>
      setDisposition(row, { type: 'alias', evidence: ['same source identity'] }),
    ).toThrow(/requires canonicalId/);
    expect(() => setDisposition(row, { type: 'out-of-period' })).toThrow(/requires evidence/);
    expect(
      setDisposition(row, { type: 'out-of-period', evidence: ['outside the requested period'] })
        .disposition,
    ).toEqual({ type: 'out-of-period', evidence: ['outside the requested period'] });
    expect(
      setDisposition(row, { type: 'announced', evidence: ['announced in the fixture'] }).disposition,
    ).toEqual({ type: 'announced', evidence: ['announced in the fixture'] });
  });

  it('reports repeated names as candidates without merging distinct generations', () => {
    const audit = auditYachtSeed(fixture);
    const candidate = audit.duplicateCandidates.find((item) => item.normalizedName === 'v65');
    const rows = audit.rows.filter((row) => row.normalizedName === 'v65');

    expect(candidate).toMatchObject({
      normalizedName: 'v65',
      rowIds: ['seed-row-5', 'seed-row-6'],
      sourceLines: [5, 6],
    });
    expect(rows).toHaveLength(2);
    expect(rows[0].rowId).not.toBe(rows[1].rowId);
    expect(rows[0].sourceLine).not.toBe(rows[1].sourceLine);
    expect(rows[0].status).not.toBe(rows[1].status);
    expect(candidate?.rowIds).not.toContain('princess-v65-current');
  });
});

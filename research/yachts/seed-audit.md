# Yacht seed raw-row audit

Checked: 14 September 2026  
Seed: [`research/sunseeker-princess-yacht-range.md`](../sunseeker-princess-yacht-range.md)  
Audit code: [`src/data/yachts/seedAudit.ts`](../../src/data/yachts/seedAudit.ts)  
Tests: [`tests/yacht-seed-audit.test.ts`](../../tests/yacht-seed-audit.test.ts)

## Scope and method

This is a deterministic raw-row QA pass over the seed’s single consolidated Markdown model table. It parses the table as a string; it does not read files at runtime, make network requests, mutate the seed, or perform a full model-by-model online audit. The online work below is limited to eight row examples, used to illustrate source and generation problems.

The parser starts at the table header and accepts each contiguous data row through source line 189. Every row retains:

- `rowId`, derived deterministically from its 1-based source line (`seed-row-N`)
- the exact source line and trimmed raw field map
- brand, family, model name, normalized model name, and the verbatim market-status cell
- every Markdown source URL in the source cell
- missing spec fields and declared uncertainty markers
- one disposition, initially `unresolved`

Normalization lowercases the model name, applies Unicode compatibility normalization, removes punctuation, and collapses whitespace. It deliberately preserves generation text such as `Mk II`; repeated names are therefore candidate groups, never automatic merges.

## Exact counts

| Measure | Count |
|---|---:|
| Parsed model rows | 172 |
| Sunseeker rows | 86 |
| Princess rows | 86 |
| Source-table line span | 18–189 |
| Extracted source URLs | 292 |
| Rows with at least one missing spec field | 127 |
| Rows with a declared uncertainty marker | 99 |
| Rows still `unresolved` | 172 |

The status-category counts are lexical summaries of the seed’s own status text, not independent claims about production status:

| Derived status category | Count |
|---|---:|
| current | 47 |
| historical | 115 |
| announced | 6 |
| mixed | 4 |
| unknown | 0 |

### Missing spec fields

The parser treats blank cells, dash-only cells, and spec cells beginning with `not published`, `not found`, `not reliably published`, or `not confirmed` as missing. A phrase such as `34–36 kn; range not published` is not wholly missing because the cell still contains a speed value.

| Spec field | Rows missing the field |
|---|---:|
| dimensions | 5 |
| displacement | 126 |
| tanks | 126 |
| accommodation | 125 |
| engines / propulsion | 122 |
| performance | 126 |

The row-level observations retain each affected `rowId`, source line, and field in `auditYachtSeed(...).missingSpecs`; no missing field is filled or inferred by this audit.

### Declared uncertainty

The parser records explicit language in the status/spec cells, including approximation, variation, options, unpublished or unconfirmed information, inferred values, “as published” qualifications, possible naming overlap, and typical/common layouts. There are 99 affected rows. Marker occurrences are field-level and can overlap within one row:

| Marker | Occurrences |
|---|---:|
| approximation | 62 |
| not confirmed or published | 30 |
| options | 13 |
| as published | 5 |
| variation | 4 |
| typical or common layout | 3 |
| possible overlap | 2 |
| appears | 1 |

## Repeated normalized names: duplicate candidates only

These groups are not dispositioned as `duplicate`, and no generation is merged. Each source row remains independently addressable by its row ID and source line.

| Normalized name | Candidate source rows and declared status |
|---|---|
| `s65` | line 60 `seed-row-60`, Official current range; line 152 `seed-row-152`, Historical/current generation; 2015 launch |
| `s72` | line 62 `seed-row-62`, Independent current-range listing; line 151 `seed-row-151`, Historical/current regional listing; launched 2014 |
| `v65` | line 63 `seed-row-63`, Official current range; line 189 `seed-row-189`, Historical generation; 2006 launch, with later redesigns |
| `y85` | line 70 `seed-row-70`, Independent current-range listing; line 134 `seed-row-134`, Historical/current-market used model; launched 2019 |
| `predator 68 mk ii` | line 82 `seed-row-82`, YachtBuyer production 2016–2018; line 129 `seed-row-129`, YachtBuyer production 2003–2006, overlapping the requested period |
| `v78` | line 133 `seed-row-133`, Historical; 2019 launch; line 176 `seed-row-176`, Historical; 2009 launch |
| `princess 62` | line 145 `seed-row-145`, Historical; 2017 launch; line 184 `seed-row-184`, Historical; 2007 launch |

## Eight source-backed example rows

These are examples, not a complete online audit. Sources are linked only; no photos or source prose are redistributed.

1. **Line 18 — Sunseeker Superhawk 55.** The manufacturer page supplies the same 17.13 m length, 4.93 m beam, 1.43 m draft, 26,100 kg displacement, 1,800 L fuel, 430 L fresh water, twin Volvo Penta IPS 950 engines, and up-to-38-knot performance represented in the raw fields: [Sunseeker technical page](https://www.sunseeker.com/range/superhawk-55). This is a complete, non-uncertain example in the seed.

2. **Line 24 — Sunseeker 65 Sport Yacht.** The seed keeps the manufacturer announcement and brochure alongside an authorized brokerage listing. The official Sunseeker range navigation separately exposes `Predator 65 SportFly`, while the brokerage range exposes `65 Sport Yacht`; the raw status therefore remains a naming-overlap warning rather than an alias decision: [Sunseeker official range](https://www.sunseeker.com/range/predator-65-sportfly), [Sunseeker Brokerage range](https://www.sunseekerbrokerage.com/new-yachts/the-range), [authorized 65 Sport Yacht listing](https://www.sunseekerbrokerage.com/yachts-for-sale/directory/sunseeker/performance/65-sport-yacht).

3. **Line 36 — Sunseeker 86 Ocean Enclosed.** The official page is titled 86, but its published technical values include 25.14 m / 82'6", 6.56 m beam, 1.86 m draft, and 74,630 kg displacement; it also exposes the malformed `800 L8, 500 L` water/fuel text. The row remains uncertain and unresolved: [Sunseeker 86 Ocean Enclosed](https://www.sunseeker.com/range/86-ocean-enclosed).

4. **Line 37 — Sunseeker 90 Ocean.** The seed pairs the official model page with a real-world brokerage listing. YachtWorld identifies a 2024 90 Ocean at 88.9 ft with MAN V12 power, while the listing description calls the enclosed configuration `90 Ocean Enclosed`; its disclaimer says details should be validated by the buyer’s surveyors. This supports retaining both the raw official row and the independent cross-check without overriding the manufacturer fields: [Sunseeker 90 Ocean](https://www.sunseeker.com/range/90-ocean), [YachtWorld listing](https://www.yachtworld.com/yacht/2024-sunseeker-90-ocean-10049855/).

5. **Line 55 — Princess F54.** This row is dealer-listed and lacks a published performance figure in the seed. An independent YachtBuyer range page lists F54 at 16.24 m, while the official Princess model page currently exposes F55 as a separate model; the row should remain a reconciliation item until the source identity is resolved: [YachtBuyer Princess new range](https://www.yachtbuyer.com/en/princess/new), [Princess official F55 page](https://www.princessyachts.com/our-yachts/f-class/f55/), [Princess Motor Yacht Sales F54 listing](https://www.princess.co.uk/new-yachts/princess-f54).

6. **Line 61 — Princess S62.** YachtBuyer lists S62 at 19.17 m, but the seed records no manufacturer or authorized-dealer confirmation and all six spec fields are missing. It is a useful independent-source reconciliation row, not a verified canonical model mapping: [YachtBuyer Princess new range](https://www.yachtbuyer.com/en/princess/new).

7. **Lines 63 and 189 — Princess V65.** These two rows intentionally share normalized name `v65` but represent different declared generations: the current official page is the 2025 V65 with 20.61 m length, while the seed’s historical row is a 2006 launch with later redesigns and only approximate archive dimensions. The manufacturer’s heritage timeline also places V65 in the 2025 and earlier historical sections. They must remain two raw rows until hull/generation evidence supplies any mapping: [current official V65 specification](https://www.princessyachts.com/our-yachts/v-class/v65/), [Princess heritage timeline](https://www.princess.co.uk/princess-heritage), [independent YachtBuyer range](https://www.yachtbuyer.com/en/princess/new).

## Disposition contract

`parseYachtSeed` creates every row with `{ type: "unresolved", evidence: [] }`. `setDisposition` and `applyDispositions` validate all later decisions:

- `canonical`, `alias`, `variant`, and `duplicate` are resolved mappings: they require non-empty evidence and a non-empty `canonicalId`.
- `out-of-period` requires non-empty evidence and deliberately has no `canonicalId`.
- `announced` requires non-empty evidence but is not a resolved mapping, so a `canonicalId` is optional.
- `unresolved` may retain empty evidence and cannot carry a `canonicalId`.
- Unknown row IDs are rejected; rows not included in an assignment remain unresolved.

This makes an evidence-free resolution impossible while keeping announced and out-of-period observations explicit. The current seed has no resolved mappings; `duplicateCandidates` is diagnostic only.

## Source notes

Primary manufacturer pages are preferred for technical specifications. Authorized dealer/brokerage and independent YachtBuyer/YachtWorld pages are used only as cross-checks for availability, naming, history, or real-world listing identity. The source links in the seed and the examples above are not treated as interchangeable evidence, and no claim is promoted to a canonical mapping by name similarity alone.

# Princess batch 01 — independent seed QA

Checked: 14 September 2026  
Scope: independent source reconciliation for the eight existing canonical generation IDs in [`princess-batch-01.json`](./princess-batch-01.json). The author research and seed were read but not modified. No visual or authored-asset approval is implied.

## Method

The seed was parsed with [`src/data/yachts/seedAudit.ts`](../../src/data/yachts/seedAudit.ts). Row identity is the parser's source-line identity; the relevant rows are `seed-row-45`, `52`, `54`, `57`, `64`, `67`, `70`, `130`, `134`, and `135`. The JSON companion records only justified mappings to the eight existing canonical IDs. Related seed rows without an exact existing canonical remain explicitly unresolved; this bounded task does not create new canonicals or silently merge repeated names.

All canonical/variant decisions use at least one Princess-owned or Princess-authorized source and one independent review, model-history, or brokerage source where available. Specs are reported as source-specific facts, not averaged values.

## Disposition ledger

| Seed row | Seed model | Disposition | Existing canonical | QA result |
| --- | --- | --- | --- | --- |
| 135 | R35 | canonical | `princess-r35-gen1-2018` | Identity and 2018 launch agree; seed propulsion and spec completeness need correction. |
| 67 | V40 | canonical | `princess-v40-gen2-2017` | 2017 V39 successor / Gen2 identity agrees; current-page/special-edition chronology is mixed. |
| 130 | V40 60th Anniversary Edition | unresolved | — | 2025 updated/limited edition; available evidence does not prove Gen2 versus a new generation. |
| 64 | V55 | canonical | `princess-v55-gen2-2019` | Identity and principal official specs agree; draft and launch-speed alternates remain. |
| 57 | F45 | canonical | `princess-f45-gen1-2019` | Identity and official principal specs agree; independent beam/draft differ by 0.01 m. |
| 54 | F55 | unresolved | — | Material official-source conflict without sufficient identity evidence; not a same-generation variant decision. |
| 52 | F65 | canonical | `princess-f65-gen1-2022` | Identity and current official specs agree; independent draft conflict is retained. |
| 70 | Y85 | canonical | `princess-y85-gen2-2022` | Current independent range row maps to Mk2/current; all six seed spec fields are missing. |
| 134 | Y85 | unresolved | — | 2019 Mk1 is inside 2006–2026 but has no permitted new canonical in this bounded batch. |
| 45 | X95 Vista | unresolved | — | Explicit Vista Gen2/successor; cannot map to original X95 Gen1. |

`out-of-period` is reserved for a model whose actual production is entirely before 2006 or entirely after 2026. None of these related Princess rows qualifies. Every resolved type has a `canonicalId` and non-empty evidence; unresolved rows deliberately have no `canonicalId`.

## Generation findings

### R35 — `princess-r35-gen1-2018`

The official launch notice dates the announcement to June 2018 and the world premiere to Cannes in September 2018: [Princess launch notice](https://www.princess.co.uk/news/the-all-new-princess-r35). The official brochure supplies 10.89 m LOA, 3.27 m beam, 0.76 m full-load draft, 6.5-tonne half-load displacement, 600 L fuel, 140 L water, twin 430 mhp Volvo petrol V8s and duo-prop stern drives: [R Class brochure](https://www.princess.fr/media-file/2399/r-class-brochure-2019-20-book-1.pdf). Independent [Soundings coverage](https://soundingsonline.com/boats/princess-yachts-r35/) corroborates the carbon-fibre foiling sportsboat and twin 430-hp Volvo Penta gasoline inboards.

The seed row is an identity match, but it says “twin petrol outboards,” omits useful displacement/tank/accommodation fields, and leaves beam/draft incomplete inside its dimensions cell. Production chronology is also qualified: [YachtBuyer](https://www.yachtbuyer.com/en-us/princess/for-sale/princess-r35) reports 2018–2024 and says the public unveiling was Southampton 2019, whereas Princess's release calls Cannes 2018 the world premiere. This is a launch-reporting conflict, not evidence for another R35 generation.

### V40 Gen2 — `princess-v40-gen2-2017`

[Princess's January 2017 debut notice](https://www.princess.co.uk/news/princess-v40-show-debut-dusseldorf-2017) explicitly calls the V40 an update to the V39. The current [official V40 page](https://www.princessyachts.com/our-yachts/v-class/v40/) retains the 12.98 m / 3.81 m principal dimensions, drives-raised/lowered drafts of 0.56/1.02 m, 9,592 kg displacement, 730/288/85 L tanks, twin Volvo D6-380 DP engines and a 34–36-knot band. [YachtBuyer model tracking](https://www.yachtbuyer.com/en-us/yachts/compare/princess-v40-vs-jeanneau-leader-40-gen2-188d985) identifies this as Gen2, 2017–2025.

The seed's row 67 is therefore a good identity/spec match. Princess now foregrounds the [V40 60th Anniversary Edition](https://www.princessyachts.com/our-yachts/v-class/v40/), and the [heritage timeline](https://www.princess.co.uk/princess-heritage) places that special edition in 2025. Independent model tracking reports Gen2 through 2025, but the available reports do not prove that the anniversary edition is a same-generation configuration rather than a new platform. Row 130 remains unresolved pending generational evidence.

### V55 Gen2 — `princess-v55-gen2-2019`

The [official 2019 release](https://www.princess.co.uk/news/the-new-princess-v55-the-heart-and-soul-of-the-v-class) identifies an all-new V55 due in autumn 2019, with three cabins for six and a drop-down sliding patio door. The [current official technical page](https://www.princessyachts.com/our-yachts/v-class/v55/) gives 17.81 m LOA, 4.65 m beam, 1.44 m draft, 28,589 kg, 2,500/466/300 L tanks, twin Volvo D13-1000 engines and 33–35 knots. Independent [YachtBuyer review](https://www.yachtbuyer.com/en-us/reviews/princess-v55-2019) identifies the 2019 platform as Gen2 and agrees on LOA, beam, three cabins and six berths.

The specific V55 conflict is draft: YachtBuyer reports approximately 1.40 m, versus the official 1.44 m. Performance is also chronology/configuration-sensitive: the 2019 release said up to 37 knots, while the current official page says 33–35 knots and the independent test describes the present platform around 35 knots. The seed row is canonical for identity, while those values remain explicit alternates.

### F45 — `princess-f45-gen1-2019`

The [official F45 launch notice](https://www.princess.co.uk/news/introducing-the-all-new-princess-f45) dates the launch to Boot Düsseldorf 2019. The [current official page](https://www.princessyachts.com/our-yachts/f-class/f45/) supplies 14.35 m / 4.26 m / 1.10 m, 17,283 kg, 1,640/462/150 L, twin Volvo D6-480 IPS650 and 29–31 knots. Independent [YachtBuyer review](https://www.yachtbuyer.com/en-gb/reviews/princess-f45-2019-2) confirms the 2019 F45, the full-beam owner cabin and two-cabin layout, but reports 4.25 m beam and 1.09 m draft.

The seed row is a safe canonical identity mapping. The 0.01 m independent differences should not be treated as a generation boundary, and YachtBuyer's current listing still reports the model in production. No missing new F45 generation was evidenced in this pass.

### F55 Gen2/current restyle — `princess-f55-gen2-2022`

This is the material spec conflict in the batch. The [official November 2022 release](https://www.princess.co.uk/news/a-truly-tranquil-environment-the-new-princess-f55) reports 17.68 m LOA, 4.87 m beam, 1.41 m draft, three cabins/six guests and up to 32–34 knots for the restyled F55. Independent [YachtBuyer testing](https://www.yachtbuyer.com/en/reviews/princess-f55-2022) matches 17.68/4.87/1.41 and labels it F55 Mk2.

The live [official F55 page](https://www.princessyachts.com/our-yachts/f-class/f55/) instead reports 16.56/4.52/1.42 m, 23,385 kg, 2,100/520/260 L and 27–34 knots. That is not a rounding difference. The seed row copies this live-page set but does not name a generation. The conflict alone is not evidence of a same-generation variant or an exact identity, so row 54 remains unresolved. Chronology is also not stable across channels: the independent page currently labels the 2022 Mk2 discontinued, while the factory page remains live. No new F55 canonical is created.

### F65 — `princess-f65-gen1-2022`

The [official launch notice](https://www.princess.co.uk/news/princess-f65-will-launch-at-southampton-international-boat-show) dates the world premiere to September 2022 and describes four cabins/eight guests. The [official current page](https://www.princessyachts.com/our-yachts/f-class/f65/) gives 20.30 m / 5.09 m / 1.63 m, 37,253 kg, 4,100/802/272 L, twin MAN V8-1200 and 31–33 knots. Independent [YachtBuyer review](https://www.yachtbuyer.com/en/reviews/princess-f65-2022-aquaholic) confirms the 2022 model, four cabins/eight guests and current production status.

[Motor Boat & Yachting's show-tour material](https://www.mby.com/boat-shows-and-events/southampton-boat-show/2022-princess-f65-122771) gives 5.10 m beam and 1.48 m draft, with the draft materially different from the official figure. The seed row is canonical for identity; the draft remains unresolved as a source/configuration conflict.

### Y85 Gen2/current — `princess-y85-gen2-2022`

Princess's [official 2019 launch notice](https://www.princess.co.uk/news/the-all-new-contemporary-princess-y85) establishes the original Y85, not the target Gen2. Independent [YachtBuyer model history](https://www.yachtbuyer.com/en/princess/for-sale/princess-y85) explicitly separates Mk1 (2019–2021) and Mk2 (2022–present), and the [2022 review](https://www.yachtbuyer.com/en-us/reviews/princess-y85-2022) describes the 2022 changes, including elongated hull glazing and the revised aft/cockpit arrangement. A current Princess-authorized page reports the 26.20 m / 6.29 m / 1.89 m set: [Princess Adriatic Y85](https://princessadriatic.com/princess/y85/).

Seed row 70 is a current independent-range reconciliation row with all six spec fields missing; it is mapped to Gen2 by the current Mk2 evidence, not by invented specs. Seed row 134 says “launched 2019” and carries a regional Princess page whose values resemble the earlier material; it is explicitly unresolved rather than mapped to Gen2. Y85 Mk1 is inside the 2006–2026 date period, so it is not `out-of-period`; a new canonical is outside this bounded task. Current Princess regional pages also disagree: [Princess Italia](https://www.princessitalia.it/en/our-yachts/y-class/princess-y85/) shows 6.30 m beam and 1.77 m draft, while the current authorized page above shows 6.29/1.89. Those chronology and dimension conflicts are preserved rather than collapsed.

### X95 Gen1/original — `princess-x95-gen1-2020`

The [official X Class announcement](https://www.princess.co.uk/news/the-princess-x-class) says the first X Class yacht launched in 2020 and describes the original X95's long full-length decks and flexible four-cabin arrangement. The [original official brochure](https://www.princess.co.uk/wp-content/uploads/2019/02/x-class-brochure-book-2-updated.pdf) gives 29.11 m / 6.77 m / 2.01 m, 13,400 L fuel and 24–26 knots. Independent [YachtBuyer history](https://www.yachtbuyer.com/en-us/princess/new/princess-x95) tracks X95 Gen1 as 2020–2023, and [Power & Motoryacht's test](https://powerandmotoryacht.com/boats/princess-x95-boat-test-and-review/) independently reviews the original concept.

The seed contains no unqualified original X95 row. Row 45 is explicitly [X95 Vista](https://www.princessyachts.com/our-yachts/x-class/x95-vista/), whose official regional page dates its unveiling to 2024 and describes it as building on the original X95; [YachtBuyer](https://www.yachtbuyer.com/en-gb/princess/for-sale/princess-x95) separates X95 Gen1 from Vista Gen2. Because Vista is a distinct later generation, row 45 remains unresolved until a separate X95 Vista canonical exists. The original canonical generation is missing from the seed and is not fabricated from the Vista row.

## Missing generations and non-merges

- The seed has no exact original X95 Gen1 row; only X95 Vista is present.
- Y85 appears twice, but the 2019 row and the current Mk2 row are distinct generations. The 2019 row remains unresolved; it is not `out-of-period` or a duplicate disposition.
- V40's 2025 60th Anniversary Edition remains unresolved because available reports do not prove same-generation status versus a new platform.
- F55 is not generation-qualified in the seed, and its live official dimensions conflict with the 2022 official release and independent test. The source row remains unresolved; source conflict alone is not a variant mapping.
- X95 Vista is explicitly Gen2/successor material and remains unresolved rather than being mapped to original X95 Gen1.
- No new canonical IDs were created for X95 Vista, Y85 Mk1, V40 60th Anniversary Edition, F55's conflicting live-page set, or other current Princess names outside this batch.

## Source and scope notes

Official manufacturer or authorized Princess pages own the technical claims where available. YachtBuyer, Soundings, Power & Motoryacht and Motor Boat & Yachting are used as independent review, market-history or brokerage checks; they do not override an official spec without the conflict being recorded. The JSON evidence links are references only; no source photos or prose were redistributed.

# Sunseeker batch 02 research

Checked 2026-09-14. This bounded batch adds eight canonical production generations to `sunseeker-batch-01`; it does not repeat the eight existing batch-01 profiles and contains no geometry or image assets.

## Canonical profiles

| ID | Profile | Production evidence | Reference dimensions | Evidence quality |
| --- | --- | --- | --- | --- |
| `sunseeker-predator-55-gen2-2024` | Current Predator 55 Gen 2 | YachtBuyer describes a 2024 launch and 2025 model year; Sunseeker lists the model currently. | 17.14 × 4.93 × 1.48 m | High |
| `sunseeker-82-ocean-enclosed-gen1-2024` | Current 82 Ocean Enclosed | Sunseeker launch material uses the Ocean 156 designation; YachtBuyer records the first 802 hull launched in July 2024. | 25.14 × 6.56 × 1.86 m official | High, with dimensional conflict |
| `sunseeker-76-yacht-gen1-2017` | Current 76 Yacht | YachtBuyer identifies the 2017 edition and successor relationship to the 75 Yacht; Sunseeker’s current page and 2025 brochure remain live. | 23.60 × 5.95 × 1.70 m | High |
| `sunseeker-predator-60-evo-gen1-2019` | Historical Predator 60 EVO | YachtBuyer dates the production run 2019–2023; Sunseeker’s previous-model page and brochure retain the official EVO specification. | 18.24 × 4.70 × 1.30 m | High |
| `sunseeker-manhattan-66-gen2-2017` | Historical Manhattan 66 Gen 2 | YachtBuyer explicitly identifies Gen 2, 2017–2021; an authorized Sunseeker Brokerage listing provides a 2017 example. | 20.80 × 5.26 × 1.80 m model-level figure | Moderate, LOA convention conflict |
| `sunseeker-manhattan-73-gen1-2012` | Historical Manhattan 73 | YachtBuyer reports development/launch in 2011 and first production in 2012 through 2014; Sunseeker’s localized previous-model page provides the official specification. | 22.60 × 5.73 × 1.63 m | High, fresh-water row malformed |
| `sunseeker-portofino-48-gen1-2010` | Historical Portofino 48 | YachtBuyer dates the model 2010–2013; Motor Boat & Yachting’s archived test is dated August 2010. | 16.17 × 4.30 × 1.30 m model-level figure | Moderate, LOA/draft convention conflict |
| `sunseeker-predator-84-gen1-2008` | Historical Predator 84 | Sunseeker’s launch brochure says due to launch autumn 2008; YachtBuyer and itBoat give a 2008–2014 run. | 26.48 × 6.34 × 2.12 m official archived-page shaft reference | High, drive-variant draft conflict |

## Evidence and reconciliation notes

The current Predator 55 profile is the new hardtop model, not the earlier Predator 55 Mk I or the separate Predator 55 EVO. Its official page gives 17.14 m LOA, 4.93 m beam, 1.48 m draft, 2 standard cabins with a third optional, and twin IPS 950 pods. YachtBuyer independently describes the 2024 launch, identifies it as Mk2, and documents the galley and cabin options. The review’s report that the underwater hull platform is shared with Superhawk 55 is retained as a topsides caveat, not used to collapse the two models.

The 82 Ocean Enclosed is represented as its own current Ocean generation and retains the launch aliases Ocean 156 and 802. Sunseeker publishes 25.14 m LOA, 6.56 m beam, and 1.86 m draft. YachtBuyer’s first-hull record instead gives 25.17 m, 6.50 m, and 1.27 m, plus a July 2024 launch. The official set is selected; the independent set remains reported and is not averaged. The official black-water row is visibly malformed, so it is not normalized.

The 76 Yacht has unusually good primary evidence: the current Spanish model page and 2025 official range brochure agree on 23.60 m, 5.95 m, and 1.70 m, as well as four cabins, 6,000 L fuel, 1,400 L fresh water, 32 knots, and 500 nautical miles at 10 knots. YachtBuyer provides the independent 2017 introduction/successor context and deck-plan descriptions.

The Predator 60 EVO is a discrete 2019–2023 generation, not a relabeling of the older Predator 57. Sunseeker’s previous-model page supplies the 18.24 m, 4.70 m, and 1.30 m dimensions, three cabins, two heads, 2,200 L fuel, 600 L fresh water, and up to 34 knots. YachtBuyer independently describes its new design direction, deep-V lineage, shaft/IPS choice, tender garage, and two-seat helm.

The Manhattan 66 is kept separate from the older Manhattan 66 Mk I and from the batch-01 Manhattan 68. YachtBuyer’s model page identifies Gen 2 and 2017–2021, documents the four-cabin standard/three-cabin option, and publishes 68 ft 3 in including pulpit. The authorized Sunseeker Brokerage 2017 example reports 20.54 m rather than the model-level 20.80 m; this is treated as a measurement/example conflict, not averaged. Power & Motoryacht independently confirms the wide hull, dramatic window shapes, open-plan aft galley, beach-club transom, private master stair, and four-cabin accommodation.

The Manhattan 73’s official localized page gives clean dimensions and most capacities, but its fresh-water row is malformed (`91,200 litres` alongside `317 US gal.`). The JSON leaves the official metric fact unknown and records 1,200 L as an independent report. YachtBuyer supplies the 2011 development / 2012 first-production distinction and 2011–2014 window; the canonical ID therefore uses 2012.

The Portofino 48 fills the missing Portofino family in this batch. Sunseeker Southampton, an official dealer/previous-model mirror, gives 15.74 m, 4.30 m, 1.30 m, 1,320 L fuel, and 322 L fresh water. YachtBuyer gives a model-level 16.17 m including pulpit, while Motor Boat & Yachting reports 16.09 m including pulpit and lifting platform and a 0.85 m tested draft. The JSON selects the explicit pulpit-inclusive YachtBuyer model figure and preserves the other measurements. MBY documents the raised helm-side cockpit seating, scissor-action forward berths, large picture windows, and tender garage.

The Predator 84 is represented by the official launch brochure and archived Sunseeker page, with independent timeline and layout confirmation. The official archived page’s shaft-reference draft is 2.12 m; the launch brochure separately publishes a 1.70 m shaft-drive variant and 1.40 m Arneson variant. The canonical dimensions use 2.12 m and record the alternatives rather than averaging across drive configurations.

## Seed dispositions

The machine-readable JSON includes 24 explicit dispositions for the seed rows treated as candidate matches in this batch. They cover the eight emitted canonical profiles plus the aliases, Sport Yacht/SportFly variants, already-covered batch-01 family rows, and the most relevant unresolved generation conflicts. All other seed rows remain outside this bounded batch and are explicitly described as unresolved/deferred; they were not silently promoted or conflated.

Notable non-canonical decisions:

- Predator 65 SportFly, 65 Sport Yacht, Predator 74 Mk II, 74 Sport Yacht, and 74 Sport Yacht XPS remain variants of existing batch-01 families.
- 90 Ocean Enclosed remains a sibling variant of batch-01 90 Ocean; 86 Ocean Enclosed is unresolved because the indexed official identity/spec content is inconsistent.
- Manhattan 68 Mk I and Predator 74 Mk I are recognized as older distinct generations, but deferred because this batch is capped at eight profiles.
- Predator 55 EVO is not merged into the current Predator 55 Gen 2; it remains a distinct deferred historical generation.
- Predator 68 Mk II is marked as a duplicate seed row rather than a new profile.

The JSON file is the authoritative machine-readable handoff for IDs, facts, source URLs, layout evidence, visual descriptors, conflicts, and uncertainty notes.

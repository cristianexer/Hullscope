# Princess yacht research — batch 02

Accessed 2026-09-14. This batch contains six additional canonical Princess generation profiles whose documented production overlaps the collection window 2006–2026. The machine-readable companion is [`princess-batch-02.json`](./princess-batch-02.json).

The generation unit is the documented production generation, not a repeated marketing name. Official Princess brochures/pages own the principal dimensions where available; YachtBuyer, Motor Boat & Yachting, Yachting Magazine, TWW Yachts and boats.com provide independent review, model-history or brokerage cross-checks. Conflicting values remain source-specific facts in the JSON.

## Canonical profiles

| Profile | Verified timeline / status | Reference dimensions (LOA × beam × draft) | Layout evidence |
| --- | --- | --- | --- |
| [Y85 Gen1](https://www.princess.fr/media-file/2398/y85-brochure-2019-20-book-1.pdf) | Original 2019 model; independent timeline separates it from the 2022 Mk2; historical | 26.20 × 6.30 × 1.77 m | Original official brochure and independent 2019 delivered-vessel record |
| [X95 Vista Gen2](https://www.princessyachts.com/our-yachts/x-class/x95-vista/) | Officially unveiled March 2024; current | 29.00 × 6.70 × 2.03 m | Official Vista page/news plus independent TWW review |
| [F55 Gen1 / Princess 55](https://www.princess.co.uk/news/new-princess-55) | Announced and debuted 2017; independent timeline reports 2017–2022; historical | 17.60 × 4.87 × 1.46 m | Original brochure and independent 2018 review |
| [S65 Gen1](https://www.princess.co.uk/wp-content/uploads/2015/07/S65-Brochure-Pages-EN-FR-DE-IT-RU.pdf) | Announced/launched 2015; independent timeline reports 2015–2019; historical | 20.12 × 5.08 × 1.47 m | Original brochure, official launch copy and independent model page/review |
| [S65 Gen2](https://www.princess.co.uk/new-yachts/princess-s65) | Announced 2023 / officially presented in 2024; current | 20.605 × 5.094 × 1.66 m | Current official page/news plus independent 2024 review |
| [S72 Gen1](https://www.princess.co.uk/wp-content/uploads/2014/02/Princess_S72_Brochure.pdf) | Launched 2014; independent timeline reports 2014–2017; historical | 22.57 × 5.38 × 1.48 m | Original brochure, official launch imagery/news and independent review |

## Findings by generation

### Y85 Gen1 — `princess-y85-gen1-2019`

Princess introduced the all-new Y85 in 2019. The original brochure gives 26.20 m LOA, 6.30 m beam and 1.77 m draft, with four en-suite guest cabins for eight, a main-deck day head, flybridge, single-level main deck and separate crew quarters. YachtBuyer separates this Mk1 from the reimagined Mk2/current Y85 from 2022, so the 2019 material is not merged into the current profile from batch 01.

The reference visual identity is a large, sculpted Y Class flybridge yacht: deep-V GRP hull, expansive main-deck glazing, hull windows around the four guest cabins, a broad flybridge with wet bar and aft sunpad, and foredeck seating/sunbathing. The JSON retains the independent 2019 delivered-vessel cross-check and the reported generation boundary; neither is treated as a Princess factory build ledger.

Sources: [official 2019 announcement](https://www.princess.co.uk/news/the-all-new-contemporary-princess-y85), [original Y85 brochure](https://www.princess.fr/media-file/2398/y85-brochure-2019-20-book-1.pdf), [YachtBuyer generation timeline](https://www.yachtbuyer.com/en/princess/for-sale/princess-y85), [YachtBuyer 2019 vessel record](https://www.yachtbuyer.com/en-us/fleet/princess-y85-508-85-princess), [Yachting Magazine review](https://www.yachtingmagazine.com/princess-y85-reviewed/).

### X95 Vista Gen2 — `princess-x95-vista-gen2-2024`

The X95 Vista is a distinct later generation/successor, not a variant label for the original X95 Gen1. Princess's current page dates the Vista unveiling to Palm Beach in March 2024 and explicitly says it builds on the original X95 launched in 2020. The official dimensions are 29.00 m LOA, 6.70 m beam and 2.03 m draft. Standard accommodation is four guest cabins/eight guests, with an optional fifth cabin for up to ten; standard crew accommodation is separate.

The Vista-specific exterior evidence is unusually clear: a new panoramic bow structure and a sculpted single-piece hull window running nearly the length of the hull. The Super Flybridge concept extends the upper and main decks nearly full length, with an enclosed sky lounge and a flexible main-deck saloon. Independent TWW coverage corroborates the four-stateroom layout and Vista redesign. Row `seed-row-45` can therefore map to this new canonical profile rather than to original X95 Gen1.

Sources: [official current X95 Vista page](https://www.princessyachts.com/our-yachts/x-class/x95-vista/), [official Southampton 2024 article](https://www.princess.co.uk/news/new-princess-x95-vista-will-make-her-show-debut-as-the-largest-boat-at-southampton-international-boat-show-2024), [TWW independent model review](https://www.twwyachts.com/news/model-review-princess-x95-vista/), [official original X Class boundary](https://www.princess.co.uk/news/the-princess-x-class), [YachtBuyer generation separation](https://www.yachtbuyer.com/en-gb/princess/for-sale/princess-x95).

### F55 Gen1 / Princess 55 — `princess-f55-gen1-2017`

Princess announced the all-new Princess 55 Flybridge in June 2017 and scheduled its global debut for the Southampton Boat Show in September 2017. The original F55 brochure gives 17.60 m LOA, 4.87 m beam and approximately 1.46 m draft. It documents the three-level flybridge/main/lower-deck arrangement, aft galley, three en-suite guest cabins for six and optional single aft crew cabin. YachtBuyer tracks the first generation as 2017–2022.

The seed's `Princess 55` label is an alias for this F55 generation. The current official product page publishes a materially different 16.26/4.50/1.41 m set; that conflict is recorded in the JSON but is not treated as evidence of a variant or a third generation. The reference exterior remains the pre-facelift F Class: panoramic main-deck windows, expansive hull glazing, open flybridge wet bar, foredeck seating and U-shaped cockpit.

Sources: [official 2017 launch notice](https://www.princess.co.uk/news/new-princess-55), [original F55 brochure](https://www.princess.co.uk/wp-content/uploads/2017/10/f55-brochure-2019-20-book-2.pdf), [YachtBuyer timeline](https://www.yachtbuyer.com/en/princess/for-sale/princess-f55), [authorized-dealer archive](https://pyscandinavia.com/portfolio/princess-f55-pre-facelift/), [Motor Boat & Yachting review](https://www.mby.com/video/video-princess-55-review-92510).

### S65 Gen1 — `princess-s65-gen1-2015`

Princess announced the all-new S65 in April 2015, with the model making its UK debut at Southampton later that year. The original brochure gives 20.12 m LOA, 5.08 m beam and 1.47 m draft. The four-cabin/eight-guest layout has three en-suite cabins, a galley aft of the saloon, an electrically opening aft window and an optional crew cabin. YachtBuyer reports the first generation as 2015–2019 and independently lists three guest heads plus a shared day head.

The defining visual cues are the low concealed sportsbridge, dark/angled glazing, opening roof over the saloon, large hull windows and 3.3 m tender garage. Independent YachtBuyer lists 20.32 m LOA, creating a documented 0.20 m alternate against the original official brochure; the official brochure is the canonical dimension source here.

Sources: [official announcement](https://www.princess.co.uk/news/announcing-the-princess-s65), [official Southampton 2015 article](https://www.princess.co.uk/news/psp-southampton-boat-show), [original S65 brochure](https://www.princess.co.uk/wp-content/uploads/2015/07/S65-Brochure-Pages-EN-FR-DE-IT-RU.pdf), [YachtBuyer Gen1 page](https://www.yachtbuyer.com/en/princess/new/princess-s65), [Motor Boat & Yachting launch-era test](https://www.princess.co.uk/wp-content/uploads/2015/07/Princess-S65-MBY-Jan-2016-Lower-RES.pdf).

### S65 Gen2 — `princess-s65-gen2-2024`

The current S65 is a separate second generation. Independent model history reports an announcement in 2023 and a Cannes 2024 world debut; Princess's July 2024 article calls it all-new and describes the S Class's tenth-anniversary context. The current official page gives 20.605 m LOA and 5.094 m beam. YachtBuyer independently reports approximately 1.66 m draft, four cabins and eight guests; the current official text reviewed here does not publish a single total head count, so `layout.heads` remains null.

The Gen2 visual identity is a low-tapered sportsbridge on the newer 65-foot platform, close-set to the main-deck glazing, with an opening roof, aft galley/cockpit connection, foredeck U-shaped seating and twin sunbeds, and a 3.3 m tender garage. It is not merged with the 2015 S65 Gen1.

Sources: [official 2024 announcement](https://www.princess.co.uk/news/an-exhilarating-addition-to-the-princess-yachts-s-class-range-the-princess-s65), [current official S65 page](https://www.princess.co.uk/new-yachts/princess-s65), [YachtBuyer model timeline](https://www.yachtbuyer.com/en-us/princess/for-sale/princess-s65), [YachtBuyer 2024 review](https://www.yachtbuyer.com/en-us/reviews/princess-s65-2024), [Motor Boat & Yachting review](https://www.mby.com/reviews/sportscruisers/princess-s65-review-it-pushes-through-the-rev-band-fast-topping-out-at-35-knots).

### S72 Gen1 — `princess-s72-gen1-2014`

Princess officially unveiled the first S Class S72 at the 2014 Miami Yacht & Brokerage Show. The original brochure gives 22.57 m LOA, 5.38 m beam and 1.48 m draft. Independent model data places the first generation at 2014–2017 and documents three en-suite guest cabins for six, a day head and optional crew accommodation. The official brochure's engine options quote 34–38 knots; YachtBuyer reports up to 40 knots for the largest option, so both are retained.

The original S72 is visually distinct from the later S72: a concealed sportsbridge, dark wraparound deck-saloon glazing, angled hull windows, opening roof, single-level saloon/cockpit social space, large aft sunpad and 3.9 m tender garage. The current-range S72 row is not merged with this Gen1 profile.

Sources: [official Miami debut](https://www.princess.co.uk/news/stunning-s72-makes-debut-miami), [official launch-era imagery/article](https://www.princess.co.uk/news/exclusive-new-s72-images-released), [original S72 brochure](https://www.princess.co.uk/wp-content/uploads/2014/02/Princess_S72_Brochure.pdf), [YachtBuyer timeline](https://www.yachtbuyer.com/en-us/princess/for-sale/princess-s72), [YachtBuyer Gen1 specification](https://www.yachtbuyer.com/en-us/princess/new/princess-s72), [boats.com review](https://www.boats.com/reviews/princess-s72-enjoy-highlife-hybrid-cruiser/).

## Considered candidates and non-merges

- **V40 60th Anniversary Edition / possible “Gen3”.** Omitted from canonical JSON. The [official current page](https://www.princessyachts.com/our-yachts/v-class/v40/) calls it a 60th Anniversary Edition of the V40 and says the V40 launched in 2017; [YachtBuyer](https://www.yachtbuyer.com/en-us/reviews/princess-v40-2025aquaholic) labels the 2025 review “Gen 3.” This is a real classification conflict, not enough evidence to create a canonical generation. Seed row `seed-row-130` remains unresolved/variant-only.
- **V55 Gen1.** Omitted from canonical JSON because [Princess Heritage](https://www.princess.co.uk/princess-heritage) dates the old V55 to 1997–2001, and the independent [Hulls.io buyer's guide](https://hulls.io/yachts/model/princess-v55) describes Gen1 as 1997–2001. The 2006 heritage entries are other models; no V55 production overlap in 2006 was found. This is documented as out-of-period rather than added as a collection generation.
- **F55 live-page dimensions.** The live official set is retained as a conflict on F55 Gen1/Gen2 research, not interpreted as a variant. Seed row `seed-row-54` remains unresolved until identity evidence improves.
- **Original X95 Gen1.** Not duplicated here because the batch-01 profile already covers the original 2020 X95; the new Vista profile is deliberately separate.
- **Y85 Gen1.** Added here as the missing 2019 profile; it is not merged with batch-01's Y85 Gen2/current profile.

## Seed-row disposition summary

The short machine-readable disposition companion remains [`research/yachts/dispositions-princess-01.json`](./dispositions-princess-01.json) for the earlier rows. For this batch, the considered row mappings are:

| Seed row | Candidate | Disposition | Batch 02 result |
| --- | --- | --- | --- |
| `seed-row-45` | X95 Vista | canonical | `princess-x95-vista-gen2-2024` |
| `seed-row-54` | F55 live-page spec set | unresolved | Conflict is not proof of a variant or generation |
| `seed-row-60` | S65 official current range | canonical | `princess-s65-gen2-2024` |
| `seed-row-62` | S72 independent current range | unresolved | Current Gen2 is outside this requested Gen1 profile |
| `seed-row-130` | V40 60th Anniversary Edition | unresolved / variant-only | No canonical Gen3 created |
| `seed-row-134` | Y85 launched 2019 | canonical | `princess-y85-gen1-2019` |
| `seed-row-144` | Princess 55 launched 2017 | canonical | `princess-f55-gen1-2017` |
| `seed-row-151` | S72 launched 2014 | canonical | `princess-s72-gen1-2014` |
| `seed-row-152` | S65 launched 2015 | canonical | `princess-s65-gen1-2015` |

Rows already reconciled in batch 01—such as V40 Gen2, V55 Gen2, F45, F65 and Y85 Gen2—are not duplicated. V55 Gen1 had no seed row in the considered set; its 1997–2001 out-of-period finding is recorded above.

## Evidence quality and limitations

- All six canonical profiles have direct official source evidence for LOA and beam. Draft is direct official evidence for five; S65 Gen2 draft is independently reported because the current official page text reviewed does not publish it.
- All six profiles have explicit interior/deck-plan evidence or, where the official source is brief, independent layout corroboration. No cabin/head counts are invented where the source set is ambiguous; S65 Gen2 total heads and X95 Vista total heads remain null.
- Production end dates for Y85 Gen1, F55 Gen1, S65 Gen1 and S72 Gen1 are independent model-history boundaries, not factory build ledgers.
- The F55 live-page dimensional conflict is preserved and does not create a variant. The original X95 and X95 Vista are kept separate. V40 60th Anniversary is documented as a variant/generation classification uncertainty, not forced into a Gen3 canonical.
- No geometry, Blender scene, `.blend`, export, publication or source media redistribution was performed.

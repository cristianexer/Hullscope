# Princess yacht research — batch 01

Accessed 2026-09-14. This batch contains exactly the eight requested Princess generation profiles: R35, V40 Gen2, V55 Gen2, F45, F55 Gen2/current restyle, F65, Y85 Gen2/current generation, and the original X95 Gen1. The machine-readable companion is [`princess-batch-01.json`](./princess-batch-01.json).

The dates below are generation or model-introduction dates, not inferred build dates. Where a factory end date was not published, `productionEnd` remains `null` in the JSON. Dimensions are the selected reference values for each profile; alternate values remain in facts and uncertainty notes rather than being silently averaged.

## Generation summary

| Profile | Verified timeline / status | Reference dimensions (LOA × beam × draft) | Interior evidence |
| --- | --- | --- | --- |
| [R35 Gen1](https://www.princess.co.uk/news/the-all-new-princess-r35) | Announced and premiered 2018; independent model tracking reports 2018–2024; historical | 10.89 × 3.27 × 0.76 m | Official brochure deck plan plus independent [Soundings review](https://soundingsonline.com/boats/princess-yachts-r35/) |
| [V40 Gen2](https://www.princess.co.uk/news/princess-v40-show-debut-dusseldorf-2017) | Worldwide debut January 2017; independent model tracking reports 2017–2025; historical | 12.98 × 3.81 × 1.02 m | Official launch/deck plan plus [YachtBuyer review](https://www.yachtbuyer.com/en-us/reviews/princess-v40-2019-aquaholic) |
| [V55 Gen2](https://www.princess.co.uk/news/the-new-princess-v55-the-heart-and-soul-of-the-v-class) | Announced 2019, global show launch September 2019; current | 17.81 × 4.65 × 1.44 m | Official release plus [YachtBuyer review](https://www.yachtbuyer.com/en-us/reviews/princess-v55-2019) |
| [F45 Gen1/current](https://www.princess.co.uk/news/introducing-the-all-new-princess-f45) | Introduced 2019; current | 14.35 × 4.26 × 1.10 m | Official current page/brochure plus [YachtBuyer review](https://www.yachtbuyer.com/en/reviews/princess-f45-2019-2) |
| [F55 Gen2/current restyle](https://www.princess.co.uk/news/a-truly-tranquil-environment-the-new-princess-f55) | New/restyled generation released 2022; current | 17.68 × 4.87 × 1.41 m | Official 2022 release plus [YachtBuyer review](https://www.yachtbuyer.com/en/reviews/princess-f55-2022) |
| [F65 Gen1/current](https://www.princess.co.uk/news/princess-f65-will-launch-at-southampton-international-boat-show) | Southampton launch September 2022; current | 20.30 × 5.09 × 1.63 m | Official current page plus [YachtBuyer review](https://www.yachtbuyer.com/en/reviews/princess-f65-2022-aquaholic) |
| [Y85 Gen2/current](https://www.yachtbuyer.com/en/news/princess-unveil-reimagined-y85) | Original Gen1 launched 2019; reimagined Gen2 reported June 2022; current | 26.20 × 6.29 × 1.89 m | Original/current official material plus [YachtBuyer Mk2 review](https://www.yachtbuyer.com/en-us/reviews/princess-y85-2022) |
| [X95 Gen1/original](https://www.princess.co.uk/news/the-princess-x-class) | Original launched summer 2020; independent model tracking reports 2020–2023; historical | 29.11 × 6.77 × 2.01 m | Original official brochure plus [Power & Motoryacht test](https://powerandmotoryacht.com/boats/princess-x95-boat-test-and-review/) |

## Findings by generation

### R35 — `princess-r35-gen1-2018`

Princess announced the R35 on 27 June 2018 and identified Cannes 2018 as its world premiere. It is the first R Class model, developed with BAR Technologies and Pininfarina around the Princess Active Foil System. The official R Class brochure gives 10.89 m LOA, 3.27 m beam and 0.76 m draft. YachtBuyer independently reports a 2018–2024 model run and historical status, but that production window is not a published Princess factory ledger.

The reference layout is a compact two-level performance boat: open cockpit and helm above, one lower convertible-berth cabin, enclosed head and compact galley/living space. Soundings independently describes the convertible cabin, head and galley. The official material and independent descriptions support the visual identity: carbon-fibre performance hull, curved windscreen, side wind deflectors and foil-assisted running surface.

There is a launch-timing nuance rather than a generation conflict: the official source identifies Cannes 2018, while YachtBuyer calls Southampton 2019 the public unveiling. The JSON preserves both interpretations and does not create a second R35 generation.

Sources: [official launch notice](https://www.princess.co.uk/news/the-all-new-princess-r35), [official R Class brochure](https://www.princess.fr/media-file/2399/r-class-brochure-2019-20-book-1.pdf), [YachtBuyer model page](https://www.yachtbuyer.com/en-gb/princess/for-sale/princess-r35), [Soundings review](https://soundingsonline.com/boats/princess-yachts-r35/).

### V40 Gen2 — `princess-v40-gen2-2017`

The requested V40 generation is the V39 successor that made its worldwide debut at Boot Düsseldorf in January 2017. Princess describes the update as retaining the hull, sterndrive arrangement and engine options while adding a revised interior and exterior. The 2017 brochure gives 12.98 m LOA, 3.81 m beam and 1.02 m draft with drives lowered, or 0.56 m with drives raised. YachtBuyer tracks this generation as 2017–2025 and distinguishes a later Gen3 debuting in 2025; that later generation is excluded here.

The reference layout has two cabins: a forward owner cabin with ensuite and secondary saloon access, and an aft twin cabin with optional sliding-berth conversion. The deck plan and independent 2019 review support the saloon, galley, single shared/day-head interpretation. Distinctive exterior evidence includes the large opening hardtop, long hull-side windows, sterndrive sportscruiser profile and aft wet bar.

The production end year is reported independent model tracking, not a Princess end-of-production announcement. Engine and speed descriptions also vary by configuration, so the JSON keeps the original brochure performance separate from later page variants.

Sources: [official debut notice](https://www.princess.co.uk/news/princess-v40-show-debut-dusseldorf-2017), [official V40 brochure](https://www.princess.co.uk/wp-content/uploads/2017/03/v40-brochure.pdf), [current page with Gen3 caution](https://www.princessyachts.com/our-yachts/v-class/v40/), [YachtBuyer timeline](https://www.yachtbuyer.com/en-us/princess/for-sale/princess-v40), [independent review](https://www.yachtbuyer.com/en-us/reviews/princess-v40-2019-aquaholic), [Barche review](https://www.barchemagazine.com/en/princess-v40-who-gets-off-to-a-good-start/).

### V55 Gen2 — `princess-v55-gen2-2019`

Princess announced the all-new V55 in April 2019, with global launch at Southampton in September 2019. The current official V55 page gives 17.81 m LOA, 4.65 m beam and 1.44 m draft. The launch material quoted up to 37 knots; the current page quotes 33–35 knots, so these are not treated as interchangeable performance claims.

The documented arrangement is three guest cabins for six: a full-beam amidships owner cabin, forward VIP/twin cabin and third bunk cabin, with two guest ensuite arrangements and an optional aft crew cabin. The drop-down sliding patio door connects the cockpit and saloon and is a defining feature of this generation. Panoramic saloon glazing and long angular hull windows are supported by the official imagery and independent review evidence.

Draft is a small source conflict: the official value is 1.44 m, while YachtBuyer reports approximately 1.40 m. The JSON uses the official value and records the independent alternate. No factory end date was found, so the profile remains current with `productionEnd: null`.

Sources: [official current V55 page](https://www.princessyachts.com/our-yachts/v-class/v55/), [official pre-launch release](https://www.princess.co.uk/news/the-new-princess-v55-the-heart-and-soul-of-the-v-class), [official Southampton launch](https://www.princess.co.uk/news/see-new-princess-v55-southampton-boat-show), [YachtBuyer model page](https://www.yachtbuyer.com/en-us/princess/for-sale/princess-v55), [YachtBuyer review](https://www.yachtbuyer.com/en-us/reviews/princess-v55-2019), [Yachting Magazine review](https://www.yachtingmagazine.com/yachts/princess-v55-reviewed/).

### F45 — `princess-f45-gen1-2019`

Princess introduced the F45 in August 2019 and launched it at Boot Düsseldorf 2019. The current official page gives 14.35 m LOA, 4.26 m beam and 1.10 m draft. YachtBuyer independently reports 14.35 m, 4.25 m and 1.09 m, respectively; the JSON follows the official current values and preserves the 0.01 m differences.

The F45 has a three-level flybridge arrangement, galley aft and a saloon opening toward the cockpit. Below, the full-beam owner cabin is the primary spatial feature, with a forward guest cabin whose scissor berths convert between twin and double. Two guest-facing heads are evidenced by the independent review and current product information. The profile is treated as current because the live Princess page and independent model page show ongoing availability; no end date was found.

Sources: [official launch notice](https://www.princess.co.uk/news/introducing-the-all-new-princess-f45), [official current F45 page](https://www.princessyachts.com/our-yachts/f-class/f45/), [official F45 brochure](https://www.princess.fr/media-file/2396/f45-brochure-2019-20-book-1.pdf), [YachtBuyer review](https://www.yachtbuyer.com/en/reviews/princess-f45-2019-2), [HMY model guide](https://www.hmy.com/yachting/powerboat-guide/princess/f45-2019-current).

### F55 Gen2/current restyle — `princess-f55-gen2-2022`

The requested current F55 profile is the new/restyled generation released in 2022. The official release gives 17.68 m LOA, 4.87 m beam and 1.41 m draft, and describes a revised hull-window graphic, canopy blade, aft galley and three-cabin arrangement for six. YachtBuyer’s independent 2022 test agrees with those dimensions and documents the three-cabin interior and two guest heads. The optional aft single crew cabin is kept outside the standard guest count.

There is a material live-page conflict that is intentionally preserved: the current Princess product page currently lists 16.56 m LOA, 4.52 m beam and 1.42 m draft. Because the official 2022 release and independent 2022 test agree on 17.68/4.87/1.41 for the restyled model, those values are the canonical reference configuration and the live-page set is recorded as an alternate fact. The older F55 predecessor is not merged into this 2022 profile.

Sources: [official 2022 release](https://www.princess.co.uk/news/a-truly-tranquil-environment-the-new-princess-f55), [official current F55 page](https://www.princessyachts.com/our-yachts/f-class/f55/), [independent 2022 test](https://www.yachtbuyer.com/en/reviews/princess-f55-2022), [independent current model page](https://www.yachtbuyer.com/en-us/princess/for-sale/princess-f55).

### F65 — `princess-f65-gen1-2022`

Princess announced the F65 for the Southampton International Boat Show in September 2022. The current official page gives 20.30 m LOA, 5.09 m beam and 1.63 m draft, with four guest cabins for eight and an optional aft crew/lazarette cabin. YachtBuyer independently confirms the 2022 introduction, current status and principal dimensions.

The reference interior is a three-level F Class arrangement with aft galley and dinette linked to the cockpit, separate main-deck saloon and helm, and four lower-deck guest cabins: full-beam owner, forward VIP, convertible twin and bunk cabin. Independent review evidence supports two guest ensuites plus a shared day head; the optional crew head is excluded from the standard count.

Motor Boat & Yachting’s launch-tour metadata reports 5.10 m beam and 1.48 m draft, conflicting particularly on draft with the official specification. The JSON follows the current official dimensions while retaining the independent values as reported conflicts.

Sources: [official launch notice](https://www.princess.co.uk/news/princess-f65-will-launch-at-southampton-international-boat-show), [official current F65 page](https://www.princessyachts.com/our-yachts/f-class/f65/), [YachtBuyer model page](https://www.yachtbuyer.com/en/princess/for-sale/princess-f65), [YachtBuyer review](https://www.yachtbuyer.com/en/reviews/princess-f65-2022-aquaholic), [Motor Boat & Yachting launch tour](https://www.mby.com/boat-shows-and-events/southampton-boat-show/2022-princess-f65-122771).

### Y85 Gen2/current — `princess-y85-gen2-2022`

The Y85 has two materially different documented generations. Princess introduced the original Gen1 in 2019; YachtBuyer reported the reimagined Mk2/current version in June 2022. The JSON therefore profiles Gen2/current while retaining Gen1 evidence and uncertainty notes instead of collapsing the two into one undifferentiated model.

The current official page gives 26.20 m LOA, 6.29 m beam and 1.89 m draft. The current independent Mk2 page gives the same LOA but approximately 6.26 m beam and 1.77 m draft, while the original 2019 brochure gives 6.30 m beam and 1.77 m draft. The canonical dimensions follow the current official page; all alternate values are explicit in the JSON.

The current layout retains four guest cabins—full-beam owner, VIP, double and convertible twin—with guest ensuites, while adding or revising the extended main-deck social arrangement, glazing and cockpit. The current evidence also identifies a main-deck day head and separate crew spaces/head. The 2022 independent review is used to distinguish the elongated glazing and infinity-cockpit changes from the 2019 Gen1 presentation.

Sources: [official original Y85 release](https://www.princess.co.uk/news/the-all-new-contemporary-princess-y85), [official original brochure](https://www.princess.fr/media-file/2398/y85-brochure-2019-20-book-1.pdf), [current official Y85 page](https://cms.princessyachts.com/it/le-nostre-imbarcazioni/y-class/y85/), [YachtBuyer Mk2 announcement](https://www.yachtbuyer.com/en/news/princess-unveil-reimagined-y85), [YachtBuyer current Mk2 page](https://www.yachtbuyer.com/en-gb/princess/new/princess-y85-2), [YachtBuyer 2022 review](https://www.yachtbuyer.com/en-us/reviews/princess-y85-2022).

### X95 Gen1/original — `princess-x95-gen1-2020`

The original X95 is the first X Class generation and was launched in summer 2020. The original official brochure gives 29.11 m LOA, 6.77 m beam and 2.01 m draft. Power & Motoryacht independently describes the same original concept and dimensions in its test. YachtBuyer’s later model database reports 28.96 m, 6.65 m and 2.03 m, so the JSON follows the original brochure while retaining that independent database conflict.

The original X95 is highly configurable. The standard reference is a three-level arrangement with a full-length upper deck and walkaround terrace, enclosed sky lounge/pilothouse, flexible main-deck saloon and lower-deck four-cabin guest layout. A main-deck owner option creates a five-cabin/ten-guest arrangement; optional crew, cinema and jacuzzi spaces are not folded into the standard room count. The 2024 X95 Vista is explicitly a successor/variant on the current official page and is not merged into this original X95 profile.

Sources: [official X Class announcement](https://www.princess.co.uk/news/the-princess-x-class), [original official X95 brochure](https://www.princess.co.uk/wp-content/uploads/2019/02/x-class-brochure-book-2-updated.pdf), [official X95 Vista successor page](https://www.princessyachts.com/our-yachts/x-class/x95-vista/), [YachtBuyer original model page](https://www.yachtbuyer.com/en-us/princess/new/princess-x95), [YachtBuyer review](https://www.yachtbuyer.com/en/reviews/princess-x95-2020-2), [Power & Motoryacht test](https://powerandmotoryacht.com/boats/princess-x95-boat-test-and-review/).

## Evidence quality and unresolved issues

- All eight profiles have direct official source evidence for LOA and beam. Draft is also directly sourced for all eight, but several profiles retain independent alternate values.
- Interior evidence is present for all eight: official brochures, launch releases or current product pages provide deck-plan or layout evidence, and each profile also has independent review or brokerage corroboration. No profile is marked as missing interiors evidence.
- The most material dimensional conflict is the F55: the current live Princess page reports 16.56/4.52/1.42 m, while the official 2022 release and independent 2022 test report 17.68/4.87/1.41 m. The latter is used for the 2022 restyle profile.
- Y85 values vary between the current official page and the original/current independent material, especially draft. The profile is explicitly Gen2/current and retains Gen1 values as alternates.
- X95 original official brochure values differ from YachtBuyer’s later model database values; the 2024 X95 Vista is kept out of the 2020 Gen1 profile.
- F65, V55, V40 and F45 contain smaller specification differences or configuration-dependent performance values. They are recorded as conflicts or notes rather than normalized away.
- No geometry has been built. The changed research artifacts are the JSON and Markdown files in this directory only.

# Vessel reference-link audit

Checked: 2026-09-08T13:52:30.807688+00:00 (UTC). Scope: all 29 source URLs declared at the initial audit for the 28 fleet vessels in `src/data/fleet.ts`.

## Result

No genuine HTTP 404 or 410 response was observed. 25 URLs returned successful HTTP 200/206 responses. Three returned access-control pages (Ocean Drover and both Royal Navy pages); one failed TLS certificate-chain verification (Christophe de Margerie). The web research fetcher subsequently read both Royal Navy pages, leaving Ocean Drover and the SCF URL unresolved in this audit. These failures do not establish that the documents have been removed.

This is a link-health check, not a fresh verification of every published vessel fact. A successful HTTP response does not establish model accuracy, source currency, equipment counts, replica fidelity or the correctness of every fact attributed to that source. Frozen app data, manifests and geometry were not changed.

## Method

Read-only `curl` GET requests, redirect following, a requested 128 KiB byte range, 20-second request timeout, eight-second connect timeout and four concurrent workers. HTTP 206 is expected when a server honours the range. TLS verification remained enabled. Response status, final URL, content type, document title or PDF signature, and access-block evidence were recorded. The four unsuccessful direct requests received a second read-only check through the web research fetcher. No changed final URLs were observed in this run.

## Per-source evidence

| Vessel / source | Direct HTTP | Classification | Evidence |
|---|---:|---|---|
| [Ever Ace](https://www.hafen-hamburg.de/de/schiffe/ever-ace/) | 200 | Reachable | hafen-hamburg.de  /  Ever Ace |
| [Berge Olympus](https://www.bergebulk.com/our-fleet/berge-olympus/) | 200 | Reachable | Berge Olympus - Berge Bulk |
| [BBC Bangkok](https://www.bbc-chartering.com/assets/downloads/guides/BBC-Vessel-Description-MAR_2025-1.pdf) | 206 | Reachable | PDF signature verified |
| [BOKA Vanguard](https://boskalis.com/media/anchbevh/boka_vanguard_vista_eng.pdf) | 206 | Reachable | PDF signature verified |
| [Höegh Aurora](https://www.hoeghautoliners.com/fleet) | 200 | Reachable | Our Fleet  /  Höegh Autoliners PCTCs |
| [DHT Bronco](https://www.dhtankers.com/fleet/) | 206 | Reachable | Fleet – DHT |
| [Bow Pioneer](https://www.koreatimes.co.kr/business/tech-science/20130430/dsmes-bow-pioneer-revived) | 200 | Reachable | DSME's 'Bow Pioneer' revived - The Korea Times |
| [Christophe de Margerie](https://www.scf-group.com/en/about/history/ship_naming/item93829.html) | No response | TLS failure, unresolved | curl error 60: issuer chain could not be verified; web fetch returned 502. No HTTP removal response. |
| [Icon of the Seas](https://www.royalcaribbean.jp/ships/IC/) | 200 | Reachable | Icon of the Seas（アイコン・オブ・ザ・シーズ）の情報｜ロイヤル・カリビアン・クルーズ日本語公式サイト |
| [Stena Estrid](https://stenaline.com/about-us/our-ships/stena-estrid/) | 206 | Reachable | Stena Estrid - StenaLine.com |
| [Bourbon Orca](https://ulstein.com/no/references/bourbon-orca) | 200 | Reachable | Bourbon Orca (Kommandor Orca)  /  Ulstein Group |
| [ONE GUYANA](https://www.sbmoffshore.com/newsroom/sbm-offshore-completes-us175-billion-financing-one-guyana/) | 200 | Reachable | SBM Offshore completes US$1.75 billion financing of ONE GUYANA - SBM Offshore |
| [Voltaire](https://www.jandenul.com/sites/default/files/2022-10/Voltaire%20%28EN%29.pdf) | 206 | Reachable | PDF signature verified |
| [Nexans Aurora](https://www.nexans.com/electrification-solutions/markets/transmission/cable-laying-vessel-nexans-aurora/) | 206 | Reachable | text/html; charset=UTF-8 |
| [Sleipnir](https://www.heerema.com/heerema-marine-contractors/fleet/sleipnir) | 200 | Reachable | Sleipnir  /  Heerema |
| [Spartacus](https://www.deme-group.com/technologies/spartacus) | 200 | Reachable | Spartacus  /  DEME Group |
| [Sparky](https://www.poal.co.nz/news-media/sparky-worlds-first-full-sized-ship-handling-e-tug-arrives-in-auckland) | 206 | Reachable | Sparky, world’s first full sized, ship-handling e-tug arrives in Auckland  /  Port of Auckland |
| [NLV Pharos](https://www.nlb.org.uk/commercial-services/) | 200 | Reachable | Commercial and Berthing Services - Northern Lighthouse Board |
| [S. A. Agulhas II](https://www.sanap.ac.za/explore/vessels) | 200 | Reachable | Vessels  /  South African National Antarctic Programme |
| [RRS Sir David Attenborough](https://www.bas.ac.uk/polar-operations/sites-and-facilities/facility/rrs-sir-david-attenborough/operational-facilities/) | 200 | Reachable | Operational facilities - RRS Sir David Attenborough - British Antarctic Survey |
| [Kirkella](https://greatbritishfish.com/kirkella-trawler) | 200 | Reachable | Great British Fish - Kirkella, the UK’s leading trawler |
| [Ocean Drover](https://www.aph.gov.au/DocumentStore.ashx?id=ad810aac-c7a9-45f6-991d-dbfe60793bff) | 403 | Access blocked, unresolved | WAF Block Page (403); web fetch also returned 403. Not a 404. |
| [Sendo Liner](https://www.debinnenvaart.nl/schip_detail/17306/) | 200 | Reachable | SENDO LINER - De Binnenvaart |
| [Octopus](https://www.lurssen.com/en/new-build/yachts/octopus/) | 206 | Reachable | Bespoke exploration superyacht Octopus, custom-built for scientific research |
| [Francisco](https://incat.com.au/new-incat-vessel-named-in-honour-of-pope-francis/) | 200 | Reachable | New Incat vessel named in honour of Pope Francis - Incat |
| [Abeille Bourbon](https://abeilles-international.net/wp-content/uploads/2021/05/Fiche-descriptive-Abeille-Bourbon-FR-min.pdf) | 206 | Reachable | PDF signature verified |
| [HMS Defender](https://www.royalnavy.mod.uk/organisation/units-and-squadrons/destroyers/hms-defender) | 403 | Direct access blocked; web fetch readable | Cloudflare challenge (403); official page content retrieved by web research fetcher. |
| [HMS Defender — class reference](https://www.royalnavy.mod.uk/equipment/ships/daring-class) | 403 | Direct access blocked; web fetch readable | Cloudflare challenge (403); official page content retrieved by web research fetcher. |
| [Yara Birkeland](https://www.yara.com/news-and-media/media-library/press-kits/yara-birkeland-press-kit/) | 200 | Reachable | Yara Birkeland  /  Press kit  /  Yara International |

## Follow-up actions and remaining candidates

- **Christophe de Margerie — applied after audit:** the inaccessible SCF URL has been replaced in the fleet record by the following primary ABB article, preserving its stable source ID. The effective/publication date is 2017-12-13; length and beam confidence now reflects the explicit dimensions in that article. [ABB’s December 2017 engineering article](https://new.abb.com/news/detail/106187/ice-mode-encounters-in-kara-sea-on-board-christophe-de-margerie) was readable in the web fetcher and explicitly identifies the vessel, 299 m length, 50 m beam, 172,600 m³ cargo volume and three 15 MW Azipod units. It is a strong supplementary reference for those particular claims; it does not verify the app’s reconstructed machinery inventory or geometry.

- **Ocean Drover:** preserve the parliamentary document URL until a normal-browser check determines whether the WAF allows human access. [Wellard’s February 2017 investor presentation](https://wellard.com.au/wp-content/uploads/2018/03/170228-Investor-presentation.pdf) was readable as an 18-page PDF and provides historical fleet context. This is a supplementary primary-source candidate, not a verified replacement for the technical sheet’s dimensions/deck particulars.

- **HMS Defender:** retain both current Royal Navy links. The secondary fetch successfully read the [individual vessel page](https://www.royalnavy.mod.uk/organisation/units-and-squadrons/destroyers/hms-defender) and [Daring-class page](https://www.royalnavy.mod.uk/equipment/ships/daring-class), despite direct curl being challenged. The class source supports the general visible features used for the educational silhouette, not a survey-accurate Defender configuration.

## Source-quality boundaries

Bow Pioneer currently relies on a secondary newspaper article, although its URL is reachable. The fleet-level pages for Höegh Aurora and DHT Bronco, and the general operator page for NLV Pharos, require claim-specific review when facts change. Historical press releases, archived technical sheets and dated reports should retain their configuration dates; reachability does not make them evidence of present ownership or equipment condition.

The initial audit was read-only. In the subsequent authorised content update, the Christophe de Margerie fleet reference was changed to ABB and its explicit dimensions were marked verified. Its metadata/dossier was regenerated alongside the bounded Sparky update. The SCF failure above is retained as historical audit evidence, not the current source URL.

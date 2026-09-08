# Hullscope quality checks

Run from the repository root with Node.js 22 and npm. Local browser runs use installed Google Chrome; CI uses Playwright Chromium.

## Black Pearl release validation — 2026-09-08

The catalogue now contains **28 real reference vessels plus the fictional Black Pearl**. The bonus vessel has **1,521 meaningful components** and **881 decorative instances**, compared with 738 meaningful components in its first working slice. All counts describe authored geometry, not a film-prop or real-vessel inventory. The original 28 vessels’ exported geometry is unchanged.

Type checking, lint, all **285 unit checks**, the production build and validation of **29 manifests / 58 GLBs** pass. New regressions cover billowed sail topology at both detail levels, staged mast and sail support, outward-facing gun silhouettes, period-specific material assignments, cabin clipping/picking and **360 independent rays across the upper bow**. The latter would fail on the open shoulder gap found in the first preview. Sailing-drive tests reject drive in zero wind and directly upwind, and ensure reefing cannot engage engine-style reverse.

The complete production Chrome run exercised **107 cases** in **12.5 minutes**: 105 passed on the initial run; two new deep-link tests read the URL before its intentional debounce completed. The assertions were changed to wait for the public route. Both affected desktop/mobile knowledge cases then passed without an app change, closing coverage of all 107 scenarios. The follow-up also passed the separate Black Pearl frame-cadence case (**3/3**, 44.6 seconds). Reports: `output/playwright/black-pearl-release-report/` and `output/playwright/black-pearl-followup-report/`. All 29 vessels received five-view captures (145 images), and exact frontmost GLB picking passed on Black Pearl both assembled and fully exploded, including background deselection.

Focused **WebKit 26.6 validation passes 8/8 in 1.3 minutes**: desktop/mobile fictional knowledge and restored selection, navigation wrap and comparison, 320px sailing controls, shader-error-free close views, five-view rendering, narrow/short framing and exact frontmost sail picking before/after disassembly. Report: `output/playwright/black-pearl-webkit-report/`. This uses Playwright WebKit on macOS, not a physical iOS device.

Ten two-second Black Pearl samples—idle, orbit, exploded, moving sailing Drive and Storm/rain at 1440×900 and 390×844—measure **60.0 browser frames/s**, p95 **16.7–16.8 ms**, with no sampled intervals above 33.4 ms on an Apple M4 Pro, native Chrome 152, ANGLE Metal. These short scheduling samples do not measure sustained GPU completion or physical mobile hardware. Exact conditions are in `black-pearl-followup-report/metrics/black-pearl-performance.json`. The unchanged first-vessel cold-load case records **2,404,203 encoded body bytes** and **2,407,203 transfer bytes** in the release report’s metrics.

The final production directory contains **92,357,378 bytes in 110 files**. Across the fleet there are **28,869 meaningful components**, minimum **719** per vessel; all GLBs total **60,050,648 bytes**. Black Pearl’s LOD0 is **1,315,892 bytes**, LOD1 **1,475,984 bytes**, and its manifest **1,643,826 bytes**. Production files were compared byte-for-byte with the final public-source assets.

Close visual review led to continuous curved upper-bow planking, a supported forecastle, corrected hull end-cap geometry, separated cask rows and supported headsails. Bright seam cylinders were removed from the sails and replaced by procedural cloth detail. The outer timber is charcoal-toned; wood, cloth, rope and iron receive separate surface treatments. Exterior, cutaway, exploded, stern, underside and close bow/side/three-quarter captures are retained under `output/playwright/fleet/black-pearl-*.png` and `output/playwright/black-pearl/`. The first slice’s close captures remain under `output/playwright/black-pearl-first-build/` for comparison.

See [Black Pearl authoring notes](black-pearl-authoring.md) and its [reference dossier](dossiers/black-pearl.md) for reconstruction scope. The dimensions, sailing response and internal arrangements are illustrative. These checks do not establish replica accuracy, measured sail performance or physical mobile-device performance.

## Previous weather release — 2026-09-08

The final audio/weather snapshot (`Viewer-DC6TCfT5.js`, `index-BdXXRr5P.js`) has passing local validation. Type checking, linting, all **256 unit checks**, the production build and validation of **28 manifests/56 GLBs** pass. Browser evidence is deliberately separated by the changes it validates:

- **94/94 Chrome, 11.1 minutes:** complete interaction baseline and 140 captures across all 28 vessels. Report: `output/playwright/release-candidate-report/`.
- **76/76 Chrome, 6.4 minutes:** every functional case plus six stronger-weather checks and refreshed five-view captures of Ever Ace, Sparky, Christophe de Margerie and Icon of the Seas. The other 24 models remain unchanged from the complete capture baseline. Report: `output/playwright/weather-release-report/`.
- **11/11 Chrome, 1.2 minutes:** final audio/lightning revision, including Waves-specific water pixels, repeated real strikes and observed flashes, real rain/surf signal RMS, delayed thunder and mute cleanup, near/far ocean, final cadence measurements and cold transfer. Report: `output/playwright/weather-audio-followup-report/`.
- **26/26 WebKit 26.6, 2.3 minutes:** representative four-vessel views, desktop/mobile accessibility, responsive dialogs, keyboard/touch helm, exact picking, camera preservation, readable labels, LOD persistence, navigation/system links, sea states and all final weather/audio checks. Report: `output/playwright/final-webkit-report/`. This is the Playwright WebKit engine on macOS, not physical iOS/Safari testing.

The final production directory contains **87,904,541 bytes in 107 files**. Its **27,348 authored non-decorative-labelled components** have a minimum of **719** per vessel; both GLB detail levels total **57,258,772 bytes (54.61 MiB)**. These are educational catalogue counts, not verified onboard inventories. Cold first-vessel/font readiness measures **2,397,760 encoded body bytes**, **2,400,760 transfer bytes** and **5,402,983 decoded bytes** locally. The final report's `metrics/` directory preserves the exact resources and measurements.

Ten two-second final Chrome152 cadence samples—idle, orbit, exploded, moving Drive and Storm/rain at both 1440×900 and 390×844—measure **60.0 browser frames/s**, p95 **16.7–16.8 ms**, with no sampled intervals above 33.4 ms on an Apple M4 Pro using ANGLE Metal, macOS/Darwin25.6 arm64. Narrow viewports emulate layout on that desktop; these short browser scheduling samples do not establish sustained GPU performance or physical mobile results. Real audio analysers confirm nonzero ambient signals and cancellation; they do not establish subjective sound quality or physical speaker output.

**Public deployment is verified.** [Workflow 34256253755](https://github.com/cristianexer/Hullscope/actions/runs/34256253755) passed quality checks, all 15 browser smoke cases across two shards, Pages artifact deployment and the published-asset verifier. The live release is `fa5fb9a96237af3d79cca887018b3e1480332141` at [Hullscope](https://hullscope.cristianexer.dev/Hullscope/). The verifier checked that exact revision, entry assets, all 28 manifests and both GLBs per vessel.

An independent native Chrome check of the public site at 17:25 UTC confirmed the custom-domain root preserves query/hash deep links into `/Hullscope/`, Ocean Drover and HMS Defender load, labels default off, the below-hull view works, Storm produces lightning, Sound toggles and Drive produces forward movement. No page errors occurred. Local evidence is `output/published-root-verification.json` and `output/playwright/published-*.png`. The public repository carries the MIT license and the personal OpenAI GPT-6 Astra / no-Beazley-affiliation notice.

The dated sections below preserve intermediate evidence rather than superseding the Black Pearl validation status above.

```sh
npm ci
npm run typecheck
npm run lint
npm run test
npm run validate:models
npm run build
HULLSCOPE_PREVIEW=1 npm run test:browser
```

To run the suite with WebKit, install its matching browser (`npx playwright install webkit`) and add `HULLSCOPE_BROWSER=webkit` to the production command.

CI runs **17 existing tests tagged `@smoke`**, selected with `--grep @smoke`. They cover cold loading, a serial visit to all 29 vessels, deep links, frontmost GLB picking before and after disassembly, background deselection, camera/Fit behaviour, search and isolation, comparison, mobile controls, sea conditions and actual repeated lightning/reduced-motion suppression, keyboard helm, missing assets/WebGL, mobile accessibility and Black Pearl fictional knowledge/picking. The all-vessel five-view screenshot matrix remains part of the full native release QA command above; a passing CI smoke run does not imply that the full visual matrix ran on the hosted worker. No duplicate or simplified copies of the smoke tests exist.

Earlier private-repository investigations used hosted Chromium with software rendering on a two-vCPU runner. Those runs showed multi-second browser calls even when bounds already fit, and disabling tracing did not eliminate that latency. CI therefore allows 180 seconds per ordinary test and 20 seconds per action, with 600 seconds for the serial fleet loop and 180 seconds for the seven-state mobile accessibility scan. The first two real lightning events have a combined CI-only 120-second observation budget inside their 180-second test; native allows 25 seconds for both events. A MutationObserver records the actual short flash pulse so slow browser calls cannot miss a valid transient. Local budgets remain unchanged: 45 seconds by default, 10 seconds per action, 120 seconds for serial navigation and 90 seconds for accessibility. Geometry, pixel, selection and accessibility assertions are identical in both environments.

Ordinary CI smoke tests request reduced motion, exercising the application's demand-rendered accessibility path. The sea-condition tests explicitly request normal motion and verify actual hull movement; the full native suite also measures the animated rendering path. Reduced-motion CI results must not be reported as animated desktop or mobile performance measurements.

The production browser command serves the built application at `http://127.0.0.1:5174/Hullscope/`. Without `HULLSCOPE_PREVIEW=1`, browser tests use the development server on port 5173. Both modes exercise the `/Hullscope/` base path and hash routing. Browser processes need permission to open local ports and launch Chrome.

## What the checks establish

- Every vessel has both compressed GLB detail levels. Validation checks source references, null unknown facts, unique semantic IDs, system membership, declared counts, relative asset URLs and byte budgets. GLB translations, quaternion rotations and scales must match the manifest. Meshes require finite vertices/normals, valid triangle indices and unit local bounds.
- Unit regressions check outward hull normals, closed stems, railing endpoints in world coordinates, matching upper/lower paint seams, complementary external surface areas, progressive deck separation, parent/descendant explosion, rotated component bounds, route round trips and unknown data semantics. These tests would catch the inverted hull winding, incorrect rail orientation and horizontal-pipe label-anchor mistakes.
- Every vessel gets separate exterior, cutaway, 65% exploded, stern and below-hull browser captures. Stern and underside captures disable water for shell inspection. Disassembly preserves the user's camera; the exploded captures explicitly press Fit before requiring the projected geometry envelope to fit the canvas. Labels must use at least 12px text at native pixel scale, remain inside the canvas and avoid one another.
- Layout checks cover 320×568, 390×844, 768×1024, 1024×768, 1440×900, 1920×1080 and short landscape 844×390. Inspector/dialog close buttons and scene controls remain in the viewport. Long vessel names receive additional whole-word checks at these sizes and 1280×800. Tablet checks use `elementFromPoint` to detect controls covered by other panels.
- Functional regressions click every knowledge mode from a selected component and verify the resulting content. Slider tests measure rendered fill width at 0%, 50% and 100%, rather than trusting its number. Ocean testing compares canvas pixels with water enabled/disabled and rejects shader/console errors.
- Helm integration checks actual forward/reverse displacement, turn direction, throttle limits and immediate stopping. Browser checks exercise keyboard and pointer controls, inspect position/heading telemetry, and verify return to assembled inspection on exit. Drive handling is illustrative; these checks do not validate hydrodynamics.
- Other scenarios cover search, selection, isolation, nested explosion, reset, tours, comparison, browser history, saved deep links, mobile keyboard search, failed manifests/GLBs, absent WebGL and recovery to another vessel. A serial navigation test visits all 29 vessels in one page to catch disposal/cache regressions and stale selection/labels.
- Axe scans WCAG 2 A/AA and WCAG 2.1 A/AA across all three knowledge modes, the fleet dialog, text catalogue, Drive controls and an expanded themed select, at desktop and mobile viewport sizes. Automated scans complement keyboard interaction checks; they do not certify all accessibility needs.

## Evidence and interpretation

Browser screenshots are written under `output/playwright/fleet/`, `output/playwright/responsive/` and `output/playwright/tablet-inspector/`. The HTML test report is `playwright-report/index.html`; failing cases retain Playwright traces under `test-results/`. These generated files are not source assets.

`output/playwright/performance.json` records CPU/OS, Chrome version, WebGL renderer and ten two-second frame-cadence samples for Ever Ace by default (set `HULLSCOPE_PERFORMANCE_VESSEL=black-pearl` for the bonus vessel): idle, auto orbit, exploded, moving Drive and Storm/rain, at desktop and narrow viewport sizes. The samples measure `requestAnimationFrame` scheduling while the app renders. They do not independently measure GPU completion, thermal behaviour, sustained battery impact or physical mobile hardware. The serial-navigation test also attaches a short frame-cadence sample after the fleet round trip.

Structural checks and screenshot review do not establish survey accuracy. The geometry remains an educational reconstruction, with family-specific visible arrangements and explicit evidence gaps. Meaningful-labelled component counts are not a verified inventory of equipment aboard the real vessels. Exact replica claims require hull offsets, arrangement plans and equipment evidence that these assets do not currently contain.

Real iOS/Android hardware, Safari/Firefox, assistive-technology review and a deployed GitHub Pages smoke check are separate acceptance work. A successful desktop viewport emulation run must not be described as measured mobile-device performance or deployment verification.

## Earlier local baseline — 2026-09-08

- Type checking, linting, production build, all 180 unit checks and validation of all 56 compressed GLBs pass.
- The complete Chrome production suite passes 85/85 tests in 7.9 minutes. It includes 140 vessel view captures, all 28 vessels navigated serially in one page, seven responsive sizes, whole-word title checks at eight sizes, actual helm movement and rendered system-link comparisons.
- Review then found a crane/deckhouse collision on NLV Pharos and the compass display sign during a port turn. Both were corrected. A rebuilt production snapshot passes the affected NLV five-view, keyboard helm/heading and cold-transfer checks (3/3), plus the expanded 180-test unit suite and complete GLB validation. All contact sheets were refreshed with the corrected NLV captures. The original full report is preserved at `playwright-report/index.html`; affected follow-up evidence is in `output/playwright/followup-report/index.html`.
- Axe reports zero WCAG 2 A/AA and 2.1 A/AA violations across 14 Chrome states: three modes, fleet dialog, text catalogue, Drive and expanded disassembly dropdown, at desktop and mobile viewport sizes. Dropdown Escape restores focus and clears background inert state.
- Focused WebKit 26.6 checks pass **11/11**: five views of Ever Ace, Sparky, Christophe de Margerie and Icon of the Seas; desktop/mobile Axe; responsive dialogs; keyboard and pointer helm; external hash navigation; and the rendered system-link diagram. Evidence is in `output/playwright/webkit-report/index.html` and `output/playwright/webkit/`. WebKit uses the engine version installed for the locked Playwright package (`npx playwright install webkit`); it is not a real Safari/iOS hardware test.

That earlier build contains 105 published files totalling **70,412,605 bytes**. Its GLBs total **44,765,652 bytes (42.69 MiB)**. There are **24,990 non-decorative-labelled components**, with a minimum of **655** per vessel. These counts describe the authored educational catalogue, not independently verified equipment inventories.

A fresh Chrome context measured **1,951,533 encoded response-body bytes**, **1,954,533 transfer bytes** including Resource Timing header estimates, and **4,608,976 decoded bytes** through first-vessel and font readiness. This includes the document, application/viewer JavaScript and CSS, three fonts, Ever Ace manifest and its desktop GLB. Comparison content is lazy. The local encoded-body download passes the 5,000,000-byte target. Hosting compression can differ; the reproducible resource list is `output/playwright/initial-transfer.json`.

Eight two-second Chrome 152 samples on an Apple M4 Pro, macOS/Darwin 25.6 arm64, with ANGLE Metal rendering measured **60.0 browser frames/s** in idle, orbit, exploded and moving Drive scenes at both 1440×900 and 390×844. The 95th-percentile frame intervals were **16.7–16.8 ms**, with no sampled intervals above 33.4 ms. These are short desktop browser scheduling measurements, including a narrow desktop viewport; they are not physical mobile hardware or sustained GPU benchmarks.

All 28 Below and Stern views and the refined representative exteriors received visual review. Cutaway and 65% exploded contact sheets show opened shells and separated deck layers. See [model visual review](model-visual-review.md). No remaining gross split-hull seam defect was observed. This does not establish replica accuracy or rule out every fine geometry discrepancy.

GitHub Pages deployment verification, real iOS/Android devices, screen-reader review and additional browser/hardware coverage remain separate from these local results.

## Pages packaging checks — 2026-09-08

Four additional unit checks cover custom-domain versus project-host artifact placement, root hash-link preservation, release metadata, incompatible bases and rejected symlinks. All four pass, bringing that baseline’s unit suite to 184 checks. The staged custom-domain artifact also passes an HTTP verification of every manifest and all 56 GLBs, plus browser deep-link restoration and a serial visit to all 28 vessels (2/2). These staging checks are distinct from verification of the public deployment.

## Intermediate rendering baseline — historical

The material/LOD update and first equipment-detail pass passed **86/86 native Chrome production tests in 8.0 minutes**; that report is preserved at `output/playwright/final-quality-report/`. Its dated measurements are retained in that directory's `baseline-metrics/`. Later user changes added exact physical-surface picking, camera-preserving disassembly, additional labels, animated sea states and another fleet-detail pass. Focused development checks for those interactions passed, including independent unbatched GLB raycasting and visible water-pixel changes outside the ship silhouette. Those development checks are not a substitute for the next complete production run. CI smoke and public deployment verification remain pending.

On 2026-09-08, the refreshed production captures of all 28 current models were reviewed in Exterior, Cutaway, 65% Exploded, Stern and Below views (140 images). Review found distinct vessel arrangements, continuous closed hulls, aligned upper/lower paint seams, visible cutaway interiors and separated exploded deck layers; no gross split or inverted hull defect was observed. These captures include 27,348 authored non-decorative-labelled components and the final faceted HMS mast. They use the frozen renderer before the subsequent stronger storm/rain/thunder revision. The model review does not establish replica accuracy or validate the later weather effects.

## Complete interaction baseline — 2026-09-08

The production snapshot with `Viewer-BkhyrMNp.js` passes **94/94 Chrome tests in 11.1 minutes**, including the 140 current model captures, exact frontmost surface picking before/after disassembly, camera preservation, retained assembly disassembly after deselection, expanded readable labels, animated water, hull motion and reduced-motion rendering. The report is preserved at `output/playwright/release-candidate-report/`. Despite that directory name, subsequent storm/rain/thunder changes reopen weather validation; this is a complete pre-weather-revision baseline.

This snapshot contains **87,672,500 published bytes**, including **57,258,772 GLB bytes (54.61 MiB)**, with **27,348 authored non-decorative-labelled components** and a minimum of **719** per vessel. A fresh Chrome context measures **2,392,624 encoded body bytes**, **2,395,624 transfer bytes**, and **5,382,308 decoded bytes** through first-vessel/font readiness. All eight two-second frame-cadence samples measure **60.0 browser frames/s**, p95 **16.7–16.8 ms**, and no intervals above 33.4 ms on the same Apple M4 Pro/ANGLE Metal/Chrome 152 desktop environment described above. The narrow samples remain desktop viewport emulation. These metrics are preserved in the report's `baseline-metrics/` directory and do not measure the subsequent stronger storm effects.

## Stronger weather integration — 2026-09-08

With `Viewer-BHnkqemt.js`, the current functional suite plus five views of Ever Ace, Sparky, Christophe de Margerie and Icon of the Seas passes **76/76 tests in 6.4 minutes**. This includes all existing functional tests and six new weather tests. The other 24 models are unchanged from the complete 94-test/140-image baseline. The delta report is `output/playwright/weather-release-report/`; its `metrics/` directory preserves the measured resource list and ten cadence samples. This result precedes the later continuous rain/surf audio and more frequent lightning revision.

The weather checks verify mobile Storm/sound controls at 320×568, 390×844 and 844×390, zero Axe violations in the mobile Storm state, actual rain/flash telemetry and a real lightning event, reduced-motion suppression, real Web Audio scheduling and mute cleanup, and visible calm/storm ocean pixels at near, fitted and far camera distances. Visual review of the corresponding captures confirms visible slanted rain, a branching lightning bolt, strong crests and reachable controls. Thunder tests retain real AudioContext methods; they verify scheduling and cleanup, not physical speaker output or subjective sound quality.

The production directory contains **87,903,226 bytes in 107 files**; model GLBs remain **57,258,772 bytes**. All ten two-second cadence samples—including Storm/rain at 1440×900 and 390×844—measure **60.0 browser frames/s**, p95 **16.7–16.8 ms**, with no sampled intervals over 33.4 ms on the same M4 Pro/ANGLE Metal/Chrome152 desktop. The same measurement limitations apply.

The stronger-weather snapshot measured **2,397,385 encoded body bytes**, **2,400,385 transfer bytes** and **5,401,668 decoded bytes** through first-vessel/font readiness.

# Authored-yacht runtime QA

Checked: 14 September 2026  
Scope: bounded synthetic-contract QA only; no claim about actual yacht visual quality.

## Files inspected

- [`src/App.tsx`](../../src/App.tsx)
- [`src/ui/InteriorNavigator.tsx`](../../src/ui/InteriorNavigator.tsx)
- [`src/viewer/CameraRig.tsx`](../../src/viewer/CameraRig.tsx)
- [`src/viewer/AuthoredShip.tsx`](../../src/viewer/AuthoredShip.tsx)
- [`src/viewer/authoredScene.ts`](../../src/viewer/authoredScene.ts)
- [`src/assets/authored.ts`](../../src/assets/authored.ts)
- [`src/assets/request.ts`](../../src/assets/request.ts)
- [`src/data/schema.ts`](../../src/data/schema.ts)
- [`src/state.ts`](../../src/state.ts)

## Tests added

[`tests/yacht-runtime-behavior.test.ts`](../../tests/yacht-runtime-behavior.test.ts) covers:

- shareable room/deck route round-tripping and rejection of unsafe query identifiers;
- the public interior-to-exterior state transition;
- anonymous CORS retries and cancellation during backoff;
- preservation of authored world-matrix linear terms while applying a component translation.

The earlier authored-scene and manifest suites remain focused on material/texture ownership, disposal isolation, nested transforms, owner declarations, hierarchy cycles, LOD coverage, and room/deck/camera references.

## Findings

### 1. Exterior view can retain the interior camera and interior state

The view switch in [`src/App.tsx`](../../src/App.tsx) updates only `view` and `explode`. [`src/state.ts`](../../src/state.ts) merges that patch without clearing `roomId`, `deckId`, or an interior `preset`. [`src/viewer/CameraRig.tsx`](../../src/viewer/CameraRig.tsx) selects an interior camera from those fields without requiring a non-Exterior view, while [`src/viewer/AuthoredShip.tsx`](../../src/viewer/AuthoredShip.tsx) treats either interior identifier as sufficient to keep interior components visible.

Reproduction: load a shareable route with `room`/`deck`, then activate the public `Exterior` view button. The state still contains the interior selectors, so the camera can remain on the room/deck preset and the authored interior visibility path remains active. The new test records this as an expected failure because implementation changes were out of scope.

### 2. Authored scene readiness is reported per asset, not after the required set is ready

[`src/viewer/AuthoredShip.tsx`](../../src/viewer/AuthoredShip.tsx) creates one `Asset` per selected manifest asset, but every successful `Asset` calls the same `ready` callback. That callback immediately writes `data-loaded` and `data-loaded-lod` on the shared scene-status element. In an interior state with multiple exterior/interior assets, whichever asset resolves first can mark the whole authored scene ready while other required assets are still loading or may later fail. This is a readiness-contract defect; no visual-quality claim is made.

## Passing behavior

- Interior room/deck values survive route serialization and parsing, while values outside the constrained identifier grammar are omitted.
- Asset requests use `credentials: 'omit'` and `mode: 'cors'`; transient failures retry, and cancellation during backoff prevents a subsequent attempt.
- The matrix flattening fix (`matrixAutoUpdate=false` plus the copied initial matrix) preserves the synthetic authored world transform while applying a component translation.
- Existing authored-scene material/texture restoration and disposal-isolation tests pass.
- Manifest validation rejects physical hierarchy cycles, missing detail-level coverage, and invalid room/deck/camera references.

## Verification

Focused command:

`npm test -- --run tests/yacht-runtime-behavior.test.ts tests/yacht-authored-scene.test.ts tests/yacht-manifest.test.ts tests/yacht-assets.test.ts`

Result: 4 files, 23 tests passed; the exterior transition case is an explicit expected-failure regression inside that count.

Typecheck was run after the test changes. No application implementation, credentials, publishing, commits, or visual asset review were performed.

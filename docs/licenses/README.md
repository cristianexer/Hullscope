# Retained dependency notices

The build collects notices from installed production packages using the committed lockfile. These files supply missing notices from identified upstream releases. The fallback is version-specific; updating a dependency does not silently reuse a notice from another version.

| Package | Retained original source |
| --- | --- |
| `@react-three/fiber` 9.7.0 | Upstream `v9.7.0/LICENSE`; URL retained in the text file. |
| `draco3d` 1.5.7 | Upstream `1.5.7/LICENSE`; URL retained in the text file. |
| `@mediapipe/tasks-vision` 0.10.17 | Copyright/license comments in the published `vision.d.ts` and embedded `vision_bundle.mjs.map` source, plus the canonical Apache 2.0 text referenced by those comments. No later release's copyright notice is substituted. |

Three production packages supplied no standalone license document in the checked npm releases:

- `maath` 0.10.8 declares MIT in its package metadata. Its release tag `maath@0.10.8` (commit `626d198fbae28ba82f2f1b184db7fcafd4d23846`) also has no standalone notice or README license section.
- `react-remove-scroll-bar` 2.3.8 declares MIT in its package metadata and README. Its published author is Anton Korzunov. The npm `gitHead` is `b3b1287aad81def2e2ae707274b74531b61ddbaf`; that commit was not retrievable from the declared GitHub repository during this check.
- `stats-gl` 2.4.2 declares MIT in its package metadata and README. Its published author is Renaud ROHLINGER. The npm `gitHead` is `c12b2e391d5a88616e0b30f3c7f0577966426239`; no standalone release notice was retrieved.

For these three packages, the generated artifact preserves the available original declaration, README license section, author and repository metadata. It reports the missing standalone documents explicitly. No copyright statement has been reconstructed or attributed by inference.

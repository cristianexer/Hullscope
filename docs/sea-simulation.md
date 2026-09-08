# Waves, buoyancy and helm simulation

Hullscope uses a deterministic wave field measured in metres and seconds. Ocean geometry and hull response use the same wave records, time and coordinate conversion. A small tug therefore encounters much larger relative waves than a container ship. The conversion uses each model's authoring dimensions.

Use **Waves** or **Storm** beside **Ocean**. Select the active condition again to return to calm water. These controls also remain available in Drive mode. The presets are authored demonstration conditions, not observed weather, Beaufort categories or design sea states.

## What is simulated

Eight directional wave components use deep-water dispersion, `ω² = gk`, with `g = 9.81 m/s²`. Analytic derivatives supply surface normals and vertical velocity. The shader is generated from the same records used by the CPU; live shader uniforms carry the vessel scale and simulation time.

**Waves** produces substantial swell. **Storm** multiplies those six bands' amplitudes by 2.25 and adds two longer swells that produce more response from long hulls. These are amplitude inputs, not wave-height observations; overlapping components can reinforce or cancel one another.

| Wavelength | Waves amplitude | Storm amplitude |
| --- | --- | --- |
| 110 m | 2.2 m | 4.95 m |
| 64 m | 1.2 m | 2.7 m |
| 37 m | 0.65 m | 1.4625 m |
| 21 m | 0.34 m | 0.765 m |
| 12 m | 0.14 m | 0.315 m |
| 7 m | 0.08 m | 0.18 m |
| 260 m | 0 m | 2.6 m |
| 180 m | 0 m | 1.2 m |

Weighted waterplane stations, spaced no more than six metres apart along the hull, sample the supporting surface. Their mean height and longitudinal/transverse slopes supply heave, pitch and roll targets. Damped restoring equations move the hull toward those targets using fixed 1/120-second substeps. Response periods are estimated from the model envelope, with linear and quadratic damping. Large hulls average short waves rather than following one point like a buoy.

Drive uses real-time distance, a 12-knot illustrative throttle target, bounded thrust, speed-dependent steering, and linear/quadratic resistance. The sea presets add an illustrative resistance adjustment, stronger in Storm. The speed readout tracks the longitudinal propulsion component; wind-driven drift is additional, so it is not a ground-speed reading. Wakes follow the local water height and normal. Long suspension gaps are clamped to avoid unstable impulses; keyboard blur and Stop clear propulsion input.

Wind follows the primary swell direction with deterministic, bounded gusts. The authored mean speeds are 2 m/s in calm conditions, 16 m/s in Waves and 32 m/s in Storm. Relative-wind dynamic pressure, `½ρv²`, acts on an approximate above-water box derived from the model envelope. Its force and height above the water produce a heel target against an estimated restoring lever. In Drive mode, those forces also produce ground drift, opposed by linear and quadratic underwater drag. Outside Drive, horizontal position stays fixed for exploration while wind can still affect heel. Rain follows the same wind field.

For stable inspection, hull motion and wave time pause when a part is selected, the vessel is isolated, water is hidden, comparison is open, or the view is cutaway, X-ray or exploded. Reduced motion keeps the selected sea surface static and disables hull motion. Disassembly does not automatically zoom the camera; Fit whole vessel is an explicit action.

## Storm sound and lightning

With Storm and Sound enabled, locally synthesised rain and rolling surf play continuously. Thunder follows each lightning strike after a distance-based delay; switching Sound or Ocean off stops both the ambience and pending thunder. Sound is unlocked only by an explicit control gesture, and pauses when the tab is hidden. The audio is an illustrative soundscape, not a pressure-acoustics model.

Lightning starts after about 3.5 seconds, then repeats at irregular 6–11-second intervals. Each strike has one soft flash envelope rather than a rapid sequence. Reduced motion suppresses moving rain and lightning.

## Limits

This is a simplified physical demonstration, not a vessel stability assessment. The solver does not use verified vessel-specific displacement, waterplane coefficients, centre of gravity, metacentric height or response amplitude operators. Mass, projected windage area, pressure height and restoring stiffness are envelope-based approximations. The simulation does not compute diffraction, structural loading, slamming, flooding, capsize, collision or navigational safety. A model remaining upright in the severe Storm preset says nothing about the reference vessel's survivability. Its response coefficients, wind loading and sea-resistance adjustment must not be treated as measured performance.

## Reference basis and checks

- [MIT ocean-wave notes](https://web.mit.edu/13.012/www/handouts/2003/waves.pdf): wave dispersion and linear wave relationships.
- [NVIDIA GPU Gems: effective water simulation](https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-1-effective-water-simulation-physical-models): analytic height fields and surface normals.
- [Fossen's marine craft model](https://www.fossen.biz/html/marineCraftModel.html): restoring and damping concepts. Hullscope does not implement the complete six-degree-of-freedom model described there.

Unit checks cover independent finite-difference derivatives, increasing preset energy, long-hull spatial averaging, equilibrium and damping, frame-rate consistency, bounded storm response, suspension gaps, real-time distance across model scales, and resistance. Wind checks verify quadratic relative-wind loads, force directions under hull rotation, bounded gusts, downwind drift, energy dissipation and finite combined wave/wind response for small and large hulls. Browser checks cover visible water, actual hull-pose changes, controls, inspection pause, and reduced motion. Test conditions are recorded in the [QA record](QA.md).


## Fictional sailing bonus

The Black Pearl uses the same wave-support, damping, wind and drift approximations as the fleet, with a separate illustrative sailing drive. W sets more sail and S reefs it, clamped between 0 and 100 percent; there is no engine or reverse gear. Available speed depends on wind strength and the angle between heading and wind direction. A simplified square-rig response includes an upwind no-go sector and a 12-knot display cap. Zero wind supplies zero sail drive; reefing removes drive and drag slows the ship. Space remains an immediate accessibility stop.

This is not a measured polar, aerodynamic sail solver or historical performance claim. The rig does not dynamically trim or reef its geometry. The authored hull dimensions and windage envelope are interpretive, and no vessel-specific stability data is available.

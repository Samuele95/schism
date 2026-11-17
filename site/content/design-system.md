# Design system

## Palette

| Name | Value | Its one job |
|---|---|---|
| Ground | `#050506` (page); `#000000` (WebGL clear, see Deviations in STATE) | the dark the whole film happens in |
| Bone | `#e8e2d4`; dim `rgba(232,226,212,.55)` | geometry, engraving and copy: everything that is simply there |
| Phosphor | `#59ff9c` | the construct: glyphs, the matrix, read-outs — language shown as numbers, and measurement |
| Rubric | `#e0402f` (type); `#ff4030` (light) | the cut and what it becomes: the axis, the severed rod, the seal, the phase headings. Nowhere else, so red always means the cut (lore L-6) |

No other hues. Greys are bone at lower opacity.

## Type

Both faces are open-licensed (SIL OFL) and self-hosted from the `@fontsource` packages, so the site makes no third-party request.

| Use | Face | Size |
|---|---|---|
| Title | EB Garamond 400, capitals tracked 0.32em | clamp(3.2rem, 11vw, 9.5rem) |
| Film copy | EB Garamond 400; second lines italic in bone dim | clamp(1.35rem, 3.1vw, 2.35rem), line-height 1.3 |
| Rubrics (phase headings) | EB Garamond 400, small capitals, tracked 0.2em, rubric red | clamp(0.85rem, 1.4vw, 1rem) |
| Lore captions | EB Garamond italic, bone dim | clamp(0.85rem, 1.3vw, 1rem) |
| Read-out, formulas, labels | JetBrains Mono 400 | clamp(0.66rem, 1.15vw, 0.82rem) |
| Reading room body | EB Garamond 400 | 1.2rem / 1.6, measure 38em |
| Reading room code | JetBrains Mono 400 | 0.82rem |

## Glyph set (the construct)

The characters the rain, the matrix and the shards are drawn from, each taken from the method's own material:

- digits and number punctuation `0–9 . −` — weights are numbers; the matrix uses only these
- `[ ] ( ) + = < > / | * : ᵀ` — matrix brackets and the operators of the card formulas
- `σ χ Δ λ μ θ Σ ρ v W x` — the symbols the cards write with (λ strength, μ means, v direction, W a writer, ᵀ transpose); σχ also begin σχίσμα
- `th in er an ## ▁a` — token fragments: a language model's own units of text

No glyph set, name or line from any film.

## Motion

- **One timeline, one camera curve.** Scroll scrubs a single GSAP timeline (units 0–184); the camera rides one Catmull–Rom path through timed keys. No per-section triggers.
- **Easing.** `power2.inOut` for state changes; `none` for the camera's progress; `expo.out` for the cut's sweep; `steps(24)` for typed read-out lines.
- **The cut.** The blade contracts onto the rod over 2.5 units (power3.in), then sweeps out in 1.6 (expo.out); the frame tears for 0.6 and settles over 3. The hold lasts 30 units of timeline, about a third of a screen-height of scroll per line of copy.
- **Time.** The space drifts and turns slowly; during the hold (and only then) both stop. The rain falls by real time whenever it is on screen.
- **Pointer.** A slow, damped parallax of the camera (up to ~0.9 world units sideways, 0.6 vertical). Nothing is clickable in the film except the ending's link and the sound toggle.
- **What never moves.** Copy does not drift or parallax; read-out lines do not scroll; the phase index stays fixed.

## Read-out grammar

The phosphor terminal at the top left. Lines begin `>`, then a short keyword padded to column 11, then its object. It shows only: steps of the method (capture, means, normalize, readout, gate), file paths a run writes, labels of measurements, and empty intervals `[ · , · ]`. It never shows a number that would read as a result, because the package reports none. Lines type on with `steps(24)` and clear together.

## Sound (`sound: muted-default`)

Generative, built with the Web Audio API, silent until the visitor turns it on with the toggle at the bottom right (state is not remembered between visits).
- a low bed: two detuned sine partials around 55 Hz under a slow low-pass sweep, its level following scroll progress;
- the rain: a sparse filtered-noise tick when glyph columns are on screen;
- the cut: a short noise burst through a falling band-pass, and a sub-bass drop;
- the hold: silence — time held still takes the bed with it;
- the seal: one dry crack.
It is the first thing to drop if the build runs long; the film must work in silence anyway.

## Budgets

| Profile | Trigger | Instances | DPR cap | Post-processing | Motes |
|---|---|---|---|---|---|
| Desktop | default | 72,000 | 1.75 | bloom + signal pass | 1,400 |
| Phone | short side < 700 px or coarse pointer | 25,200 | 1.5 | signal pass only | 500 |

Phones run the full film at the phone budget, with the camera standing further back in portrait (`k = min(1.75, (1/aspect)^0.62)` once the space has formed). Target: 60 fps through the held cut on a mid-range laptop, measured by the author with `?debug`.

## Fallbacks

| Case | What the visitor gets |
|---|---|
| Reduced motion (`prefers-reduced-motion: reduce`) | no WebGL film and no smooth scrolling: a vertical sequence of the thirteen scenes, each a still (from `public/stills/S<n>.webp`) with its copy beside or below it, in order, with the rubric headings |
| No WebGL (context fails to start) | the same sequence of stills and copy |
| Phone | the film itself, at the phone budget (above) |

The stills are rendered from the film by the capture hook at each scene's midpoint, so a fallback never shows anything the film does not.

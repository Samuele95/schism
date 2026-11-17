# Stage 2 — Prototype

You are a creative technologist who builds real-time 3D for the browser: shaders, particle systems, scroll-driven camera work. Here you build one shot, to find out early whether the film's central image and its blend of three registers work, while changing course is still cheap.

Read `chain/WORKFLOW.md`, then `chain/DIRECTION.md`, then `site-work/STATE.md` and sections 1–5 and 15 of `site-work/brief.md`.

## Task

In `schism-site/`, set up the project the build will keep, and in it build the **key shot**: about 30–40 seconds of scroll in which

1. falling columns of glyphs resolve into the luminous activation space;
2. the space is searched and one axis is found;
3. the blade cuts, the moment holds, and the camera travels around the held cut;
4. the axis collapses and everything else keeps its shape.

All three registers appear in the shot, the schism register at least as the title lettering and one engraved instrument or mark, because the author's verdict is on the blend as much as on the cut. Placeholder copy is fine here; mark it as placeholder so nobody later mistakes it for a claim.

## Stack

three.js with custom GLSL, GSAP ScrollTrigger to scrub one timeline from scroll, Lenis for smooth scrolling, Vite, static output with relative asset paths (the site will be served from a sub-path). Install the current stable releases and write the exact versions under Stack in `STATE.md`, so a resumed build installs the same ones. Where an API differs from what you remember, work from the installed version's documentation. If one of these libraries fights the shot, replace it and log the deviation: the shot matters, the library does not.

## What this shot depends on

- **One master timeline, one camera path.** Scroll progress scrubs a single timeline and the camera rides a single continuous curve. Independent per-section triggers are how a film ends up as separate pieces.
- **The glyphs and the points are the same instances changing state**, in the shaders: position, then glyph cell giving way to a soft point. That is the transformation `DIRECTION.md` calls unity. Two systems cross-fading are a cut in disguise.
- **Motion lives on the GPU.** Per-instance attributes and a few uniforms, no per-frame loops over particle buffers in JavaScript, because the counts that make the space read as vast are beyond what the main thread can move.
- **Depth is built, not implied.** Fog, focus or size falloff, parallax against near-field elements, occlusion. Without them a point cloud reads as a flat sheet.
- **Text is real page text over the canvas**, so it stays sharp, selectable and readable without WebGL.
- **Phones run the film, lighter.** Cap the device pixel ratio, cut instance counts and post-processing on small screens, and hold the frame while the tab is hidden, so the shot stays smooth on hardware the author does not own. A still replaces a scene only under reduced motion or without WebGL.
- **A `?debug` read-out** of frame time, draw calls and instance count. The target is a steady 60 fps through the held cut on a mid-range laptop; the author measures it on their own machine, because a headless browser cannot.

## Check

One wide check at the end, as `WORKFLOW.md` rule 3 defines it for stage 2. Write what the screenshots show, not what you intended. If it fails, follow Failure handling in `WORKFLOW.md`.

## Output — `site-work/prototype-notes.md`

```markdown
# Prototype notes
## Run it          the exact commands
## What is real, what is placeholder
## Check           what was run, what the screenshots show, anything not run
## Known gaps      what still fails or is rough
## What I would change next
## Deviations      also copied to STATE.md
```

## Stop

Set stage 2 to `awaiting-verdict`. Tell the author, in this order: one sentence on what the shot shows; the command to run it; then these three questions.

1. Is the cut the peak of the shot, and does it get enough time?
2. Do the three registers read as one world?
3. Does the space feel deep and vast?

Then list the brief's Open questions, if it has any, so the author can settle them before the storyboard is written.

Ask for a verdict: **approve**, or **changes** with notes. Record the answer word for word under Decisions in `STATE.md`. On changes, revise, run the check again, and stop again; `WORKFLOW.md` bounds the rounds and says what happens after them. Set the status to `approved` only on the author's explicit approval, because every later stage is built on this shot.

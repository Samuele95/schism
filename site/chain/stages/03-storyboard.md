# Stage 3 — Storyboard

You are the film's director and the site's designer. You turn an approved shot and a content brief into a complete plan: every scene of the film, the design system, the verified references, and the reading room. Stage 4 builds exactly what you write, so anything you leave vague gets decided at build time by whoever is busiest.

Read `chain/WORKFLOW.md`, `chain/DIRECTION.md`, `site-work/STATE.md` (the author's verdict under Decisions comes first: design from what was said), `site-work/brief.md`, `site-work/prototype-notes.md`, and the prototype itself in `schism-site/`.

## Task

Write four documents in `site-work/`.

### 1. `storyboard.md` — the film as one continuous take

Use as few scenes as carry the method, each teaching one thing, because a scene that teaches two is read as neither. Between them the film must teach five things: what Schism does and what a run hands back; the two branches; the five phases; how the result is kept honest (the floor, the isolated testers, the vault); the family of three skills. The order is what, then how, then proof, then the ending image. The approved key shot keeps its place as the peak.

Write the final on-screen copy here. Every factual line is followed by the claim ids it rests on; a line you cannot cite is rewritten or dropped. Keep the copy short enough to read at scroll speed: a scene that needs a paragraph belongs in the reading room.

One block per scene, with all ten fields:

```markdown
### S7 — The seal
- Scroll: 0.78–0.86
- Key shot: no
- Teaches: results are scored once, on prompts no decision ever touched.
- Registers: schism (lead: the seal), construct (the read-out of the scores)
- On screen: the space that survived the cut draws in toward a closed block of prompts under a disc of red wax-light. The seal lifts once. Scores appear beside each candidate in the phosphor read-out.
- Camera: continues the slow descent begun in S6 and settles level with the seal.
- Arrives by: the red of the severed axis drains out of the space and pools into the seal; the same particles, a new state.
- Copy:
  - "Sealed at the start. Opened once." [C-12]
  - "Every number that chose a candidate flatters it. This one chose nothing." [C-13]
- Interaction: none
- Fallback still (reduced motion, no WebGL): the lifted seal with the read-out beside it; the copy as above.
```

(The scene, its ids and its scroll range show the format; they are not a scene you must include. "Arrives by" always names the matter that carries over from the previous scene and how it changes state. On a phone the scene runs as on a desktop, lighter; the still is for reduced motion and for no WebGL.)

### 2. `design-system.md`

```markdown
# Design system
## Palette          each colour: value, and the one job it has
## Type             open-licensed faces, self-hosted (the site must work with no third-party request); sizes for film copy and for reading
## Glyph set        the construct's characters, and where each comes from in the method
## Motion           easing; how long the cut is held; what the pointer does; what never moves
## Read-out         the phosphor terminal's grammar: what it may show, and when
## Sound            per the `sound` setting: the layer's elements, or "none"
## Budgets          instance counts and post-processing: desktop, phone
## Fallbacks        the rule for each case: reduced motion (the stills, in order, with their copy); no WebGL (the same stills); phone (the film, at the phone budget)
```

### 3. `lore.md`

Every historical, philosophical or etymological reference the site will show. Start from the seeds in `DIRECTION.md` and check each against a source before it enters; you may search for sources. One row each:

```markdown
| Reference | Stands for (method) | Source consulted | Record or legend | Wording on the site |
|---|---|---|---|---|
| The gloss | adapters: the original weights are never overwritten [C-07] | <title, author or institution, URL> | record | "A gloss is written beside the text. The text stays as it was." |
```

(The row shows the format; its claim id is illustrative.) A reference with no source you could consult stays out, because the site would be asserting history on your memory alone. One that is tradition, not record, is marked legend and its wording says so ("tradition holds…").

### 4. `reading-room.md`

```markdown
# Reading room
## Pages            one row per page: path, title, what it contains, where its text comes from
## Navigation       how the pages are ordered and linked
## Film to page     one row per scene: scene id → the page that explains it, and how the visitor gets back
## Summaries        only with `cards: summary`: one paragraph per card, role and phase, each with claim ids
```

The pages cover: the five phases, the two branches, every technique card and every role in sections 9 and 8 of the brief (15 and 8 in the current package), the ground rules, the failure modes, install and run, the glossary. With `cards: full`, "where its text comes from" is a path in the package and stage 4 renders that file; with `cards: summary`, it is the Summaries section.

## Constraints

- **Every image has a referent.** For each thing on screen you can name what in the method it stands for. An image with none is cut, however good it looks, because spectacle that explains nothing is the failure this film is built to avoid.
- **A register leads only where its job is being done**, as `DIRECTION.md` defines the three jobs, because a register used as decoration is what makes three themes read as three films.
- **No scene arrives by a cut.** If you cannot write "Arrives by" as a change of state of matter already on screen, the scene is in the wrong place or should not exist.
- **An open question in the brief is not a claim.** Nothing on screen rests on one unless the author settled it at the stage 2 stop (see Decisions).

## Gate — check before you finish

- Each of the five things the film must teach is the "Teaches" line of at least one scene.
- Every factual copy line carries a claim id that exists in the brief, and none touches the brief's Not claimable list.
- Every reference on screen has a row in `lore.md` with a source and a wording.
- Every scene has all ten fields; exactly the scenes of the approved shot are marked `Key shot: yes`.
- `reading-room.md` has a page for every card and role in the brief, by name, and a Film to page row for every scene.

If the gate passes, set stage 3 to `done` and end with the scene list (id, title, what it teaches) so the author can read the film in ten lines. If it does not, follow Failure handling in `WORKFLOW.md`.

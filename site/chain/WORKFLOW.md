# Schism site — workflow

A five-stage chain that builds the public site for Schism: a scroll-driven cinematic film plus a reading room. Each stage is one agent session. It reads this file first, then its own stage file.

## Who the site is for

Visitors are ML practitioners and agent builders who arrive not knowing what Schism is. After the film they should be able to say what it does (it changes one behaviour of a language model, leaves the rest as it was, and proves both halves) and want to open the reading room for the method. The author, the person running this chain, judges beauty. The chain answers for clarity, truth to the package, and craft.

## Folders

| Path | What it is | Written by |
|---|---|---|
| `schism-package/` | the source of truth for content | nobody (read-only) |
| `chain/` | this file, `DIRECTION.md`, the stage prompts | nobody (read-only) |
| `site-work/` | the chain's working documents, state and screenshots | every stage |
| `schism-site/` | the site | stages 2, 4, 5 |

## Settings (the author may edit before stage 1)

```yaml
cards: full          # full    = stage 4 renders the package's card, role and run-protocol files into reading-room pages as they are
                     # summary = stage 3 writes one paragraph per card, role and phase, with claim ids; stage 4 places them
sound: muted-default # muted-default = a generative sound layer, silent until the visitor turns it on
                     # none          = no sound
```

## Stages

| # | Stage | Purpose | Reads | Writes | Ends with |
|---|---|---|---|---|---|
| 1 | Brief | fix what the site may say | the package | `site-work/brief.md`, `STATE.md` | self-check gate |
| 2 | Prototype | prove the key shot and the blend of the three registers while changing course is cheap | DIRECTION, brief | `schism-site/` (project + key shot), `site-work/prototype-notes.md` | one wide check, then **STOP** for the author's verdict |
| 3 | Storyboard | turn the approved shot into a whole film, a design system and a reading-room plan | DIRECTION, STATE, brief, prototype-notes, the prototype | `site-work/storyboard.md`, `design-system.md`, `lore.md`, `reading-room.md` | self-check gate |
| 4 | Build | build the film and the reading room | DIRECTION, every document in `site-work/`, the package | `schism-site/`, `site-work/build-report.md` | a wide check at each of three milestones |
| 5 | Review | an outside reading of the finished site, fixes, a recorded walkthrough | DIRECTION, every document in `site-work/` (its reviewer: a named subset) | `site-work/review.json`, `review.md`, `walkthrough/` | one wide check, then **STOP** for the author's decision on publishing |

Run each stage in a fresh session. A stage's inputs are files; a session that inherits the previous conversation also inherits its discarded ideas.

## Data flow

What a later stage needs must be in a file by the end of the earlier one, because nothing else crosses a stage boundary.

- `brief.md` carries every claim with its id and source, so stages 3–5 decide what is true without rereading the package. Schema: `stages/01-brief.md`.
- The author's verdicts are recorded word for word under Decisions in `STATE.md`, so the next stage works from what was said, not from a summary of it.
- `storyboard.md` carries the final on-screen copy, each line with its claim ids, and marks which scenes are the key shot. Schema: `stages/03-storyboard.md`.
- `lore.md` carries every historical, philosophical or etymological reference with its source, whether it is record or legend, and the wording the site uses. Stage 4 uses only what is in it.
- In the built pages, every factual text element carries `data-claim` with one or more claim ids separated by spaces (`data-claim="C-12 C-13"`). Pages rendered from package files under `cards: full` carry `data-source="<path in the package>"` on the page instead: their text is the source itself, so there is nothing to trace.

## State — `site-work/STATE.md`

Stage 1 creates it. Every stage reads it at start and updates its row whenever its status changes.

```markdown
# Chain state
## Stages
| Stage | Status | Output | Notes |
|---|---|---|---|
| 1 Brief | pending / done / blocked | | |
| 2 Prototype | pending / awaiting-verdict / approved / blocked | | |
| 3 Storyboard | pending / done / blocked | | |
| 4 Build | pending / M1 / M2 / M3 / done / blocked | | |
| 5 Review | pending / awaiting-author / published / blocked | | |
## Stack        exact installed versions
## Decisions    the author's verdicts at the stops, word for word
## Deviations   ambiguities settled without asking: what, the reading taken, why
## Log          one dated line per milestone or check: what was done, what the check showed
```

For stage 4, the status names the last milestone whose wide check has been run: `M1` means M1 is complete and M2 is in progress.

A stage starts only if the stage before it is `done` (`approved` for stage 2). Otherwise it stops and says which stage is open, because a stage built on an unfinished one inherits its gaps silently.

## Standing rules

1. **The package is the only authority for what Schism is and does.** Every factual sentence the chain writes for the site traces to a claim id in `brief.md`. Schism ships a method and its verifiers, not measured results, so the site says what a run does and reports ("the vault is scored once"), never what it achieves ("removes most of…"). A figure appears only if the package states it, with the package's own qualifiers. Because one invented number on a research tool's site costs the whole site its credibility.

2. **Names.** The only products and projects the site names are Schism, Alchemist, Prometheus and WSP, the models and libraries the package itself names (the brief lists them in section 11), and, in a colophon only, the open-source libraries the site is built with. The behaviours it mentions are the package's own examples. Because the package is deliberately vendor-neutral and the site speaks for it. On the semantic branch a result is "with this operator", never a change to the model, as the package requires. The words "heretic" and "heresy" appear nowhere on the site: the author took that vocabulary out of the package on purpose, and schism imagery invites it back.

3. **Verification budget: milestone.** The only testing in this chain is the **wide check**, run where a slice of work completes: at the end of stage 2 (and of each revision of the prototype), at each of stage 4's three milestones, and once in stage 5 after the fixes. No per-feature tests and no test suite: the author chose this level, and on a visual build the informative check is looking at the whole thing.

   A wide check is:
   - a production build;
   - a scroll-through of the built pages in a browser at a desktop and a phone viewport, with a screenshot at each scene's midpoint (in stage 2: six or more positions across the shot, one inside the held cut), saved under `site-work/shots/<stage>-<milestone>/` and looked at against the storyboard (in stage 2: against the stage's task);
   - a console free of errors;
   - internal links that resolve;
   - from stage 4's M3 on: the reading room's pages, and the site with reduced motion and with WebGL disabled.

   It passes when the build succeeds, the console is clean, the links resolve, and each screenshot shows what was specified. A part that could not be run is reported as `not run`, never as passed.

4. **Doubt.** The author is present at the two stops and nowhere else. Between stops, on an ambiguity take the most probable reading (the conservative one among near-ties), record it under Deviations, and continue. When something cannot be judged from what you have (a WebGL context that will not start in a headless browser, a reference with no source) say so in the stage's output instead of producing something that looks like a result.

5. **Scope.** Write only inside `site-work/` and `schism-site/`: the package and the chain are inputs every stage relies on unchanged, and everything outside the project is the author's. Tools the wide check needs (a browser-automation package) are installed as development dependencies of `schism-site/`; the browser binary such a package downloads to its own cache is the one accepted write outside the project. Nothing is published, pushed or deployed until the author says so at the end of stage 5, because publishing is the one step here that cannot be quietly undone.

## Failure handling

| Situation | What the stage does |
|---|---|
| A required input file is missing or does not follow its schema | Set the status to `blocked`, name the file and the stage that owns it, stop. Do not reconstruct it: a rebuilt input hides the earlier stage's failure. |
| A self-check gate fails (stages 1 and 3) | Fix inside the stage and check once more. If it still fails, write the output with the failure listed at the top, set `blocked`, stop. One retry, because a gate that fails twice needs the author, not a third guess. |
| A wide check fails (stages 2, 4, 5) | Fix and run the check once more. A production build that still fails: set `blocked`, stop. Anything else that still fails: record it in the Log and in the stage's Known gaps, and continue; the author sees it at the next stop. |
| The browser cannot render WebGL | Mark the screenshot part `not run`, give the author the command to run and what to look for, continue. |
| The author asks for changes to the prototype | Revise and stop again, up to two revision rounds. |
| The prototype is still not approved after two revisions | Stop iterating: ask the author what is missing and offer a different key shot. Their answer defines a new shot, with two revision rounds of its own. The status stays `awaiting-verdict` throughout. |
| A session starts stage 2 or 5 and finds it `awaiting-verdict` or `awaiting-author` | The author is answering an earlier stop. Read `STATE.md` and the stage's notes, take the author's message as the verdict, and continue from the stage's Stop section. |
| Stage 4 loses its session part-way | A new session reads `STATE.md`, confirms the project still builds, and resumes at the milestone after the one the status names. |
| The reviewer returns blocking findings | Stage 5 fixes them and runs its wide check. What it cannot fix goes to the author at the stop. |

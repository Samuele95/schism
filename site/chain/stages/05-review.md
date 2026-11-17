# Stage 5 — Review

You are the producer closing the project. You get the finished site an outside reading, fix what that reading finds, record the film, and put the result in front of the author with everything needed to decide on publishing.

Read `chain/WORKFLOW.md` and `chain/DIRECTION.md`, then in `site-work/`: `STATE.md`, `build-report.md`, `brief.md`, `storyboard.md`, `design-system.md`, `lore.md`, `reading-room.md`.

## Task

1. **Dispatch the reviewer.** Start one fresh-context sub-agent whose entire instructions are the file `chain/stages/05b-reviewer.md`. Give it nothing from this session: a reviewer who has read the builder's account reviews the account. It writes `site-work/review.json` and screenshots under `site-work/review-shots/`, and edits nothing else, so that what you fix is the site the reviewer saw.
2. **Fix.** For each blocking finding, fix it in `schism-site/`, inside what the storyboard and the brief allow. A finding you disagree with is neither fixed silently nor ignored: record it with your reason for the author. Fix a warning when the fix is small and local; list it otherwise. A `cannot-judge` verdict is not a pass: carry it to "For the author's eyes".
3. **One wide check** after the fixes (`WORKFLOW.md`, rule 3, in its full form). Beyond the reviewer's pass and this check, the stage adds no testing.
4. **Record the walkthrough.** A scripted scroll through the whole film captured as `site-work/walkthrough/film.webm` (or `.mp4`), plus one still per scene named by scene id. If capture is not possible in this environment, say so and give the author the steps to record it.
5. **Write `site-work/review.md`** and stop.

## Output — `site-work/review.md`

```markdown
# Review
## Outcome                one sentence: ready, ready with listed gaps, or not ready
## Reviewer findings      each: criterion, verdict, what was done about it
## Disagreements          findings not acted on, with the reason
## Final check            what was run, what it showed, what was not run
## For the author's eyes  what only a person on real hardware can judge (beauty, pacing, frame rate, sound); every cannot-judge; the brief's open questions still open
## Publishing             the options, and what each needs from the author
```

## Stop

Set stage 5 to `awaiting-author`. Tell the author the outcome sentence first, then where the walkthrough is, then the list under "For the author's eyes", then ask whether to publish.

Record the answer word for word under Decisions in `STATE.md`. Publish only on an explicit yes. If the author has not said where (repository, branch, path), ask once; if the destination is still unclear, do not guess one: the stage ends unpublished. With a destination, do exactly that and nothing wider, because a publish is the one action here the author cannot quietly take back; confirm the published address responds, and set the status to `published`. Without a yes, the stage ends with the site built and unpublished.

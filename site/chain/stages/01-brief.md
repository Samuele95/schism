# Stage 1 — Brief

You are the editor who decides what the Schism site is allowed to say. You read the whole package and fix its content into one document that every later stage writes from, so that nobody downstream has to guess what is true.

Read `chain/WORKFLOW.md` first. Its standing rules apply here.

## Task

Read every file under `schism-package/` and write `site-work/brief.md`. This is extraction, not copywriting: state what the package states, in plain words, each item with its source. Then create `site-work/STATE.md` from the template in `WORKFLOW.md`.

The readers of the brief are the later stages. They will not have the package's context in mind, so define each term the first time it appears and keep the package's own vocabulary; a synonym invented here becomes a second name for the same thing on the site.

## Constraints

- **Where the package is silent, ambiguous or contradicts itself, write it under Open questions and leave it unresolved.** A brief that smooths over a gap becomes a confident sentence on the site.
- **Keep qualifiers attached.** If the package says a figure is rough, a default, or true of one branch only, the claim says so too, because a claim that loses its qualifier becomes a stronger statement than the package makes.
- **List what the site must not say.** A site about a model-editing tool is pulled toward results, benchmarks and speed. Where the package gives no support for such a statement, name it under Not claimable so later stages see the boundary instead of discovering it.

## Output — `site-work/brief.md`

These sections, in this order:

1. **In one sentence** — what Schism does.
2. **In one paragraph** — what it is, who it is for, when to use it, what it is not for.
3. **What a run hands back** — the report, the export, the ledger, and what each contains.
4. **The run** — the five phases. For each: its purpose in one sentence, what goes in, what comes out, when it is over.
5. **Two branches** — weights and semantic: what the edit is in each, what is measured, how results are worded.
6. **The family** — Schism, Alchemist, Prometheus, and WSP as optional: what each owns.
7. **Ground rules** — each with the reason the package gives for it.
8. **Roles** — one row per role prompt: name, job, what it sees, what it writes.
9. **Technique cards** — one row per card: file, name, what it buys in the package's words, shortened.
10. **Failure modes the package names.**
11. **Install and run** — requirements, the ways to start a run, the first-run advice, and a list of every model and library the package names (the only ones the site may name).
12. **Glossary** — every term the site may use, with a definition taken from the package.
13. **Claims** — the table below.
14. **Not claimable.**
15. **Open questions.**

Sections 1–12 cite claim ids in square brackets after each statement.

Claims table, one row per distinct factual statement:

```markdown
| Id | Claim | Source | Qualifier |
|---|---|---|---|
| C-07 | Weight edits are stored in adapters on a scratch copy; the original weights are never overwritten. | schism-package/schism/SKILL.md › Ground rules | weights branch |
| C-31 | The cost figures in the usage notes are rough and not measured. | schism-package/USAGE.md › Rough cost, weights branch | applies to every figure in that table |
```

(The two rows show the format. Assign your own ids, in order, as you extract.)

Not claimable, one line each with the reason:

```markdown
- "Schism outperforms standard abliteration." The package specifies a head-to-head against the floor for each run; it reports no outcome of one.
```

## Gate — check before you finish

- Every file in `schism-package/schism/cards/` and `schism-package/schism/roles/` has its row in sections 9 and 8.
- Every statement in sections 1–12 carries at least one claim id, and every claim has a source that exists.
- No sentence in the brief describes an outcome the package does not report.

If the gate passes, set stage 1 to `done` in `STATE.md` and end with a three-line summary: the one sentence from section 1, the number of claims, the number of open questions. If it does not, follow Failure handling in `WORKFLOW.md`.

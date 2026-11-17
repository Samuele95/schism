# Run protocol

The operational detail of the five phases. SKILL.md says what each phase is for; this file says what to do, what to write, and when the phase is over.

## Run folder

```
runs/<run-id>/                    run-id = <model-slug>-<behaviour>-<yyyymmdd-hhmm>
  brief.yaml                      the run brief (assets/run-brief.yaml, filled)
  ledger.md                       append-only run memory (assets/ledger.md)
  splits/
    fit.jsonl  probe.jsonl  dev.jsonl
    vault.sealed.jsonl            + vault.sha256; opened only in Phase 5
  map/                            Cartographer report, figures, localisation hypothesis
  floor/                          candidate-0 spec, TPE journal, Pareto trials, measurements
  tiers/tier-<k>/                 one Alchemist run per preservation tier
    run-config.yaml  H-ledger.md  candidates/  bundles/
  seal/                           vault scores, head-to-head, front, report.md, manifest.json
  exports/<candidate-id>/         new folder per export; never the model's own folder
workbench/                        shared across runs: implementations + self-check logs
```

The workbench lives outside the run folder so that a technique checked once serves every later run on the same environment; a run records the workbench commit or file hashes it used.

## Phase 1 — Frame

1. **Restate the behaviour** as two observable conditions: *bad*, the side the edit moves away from, and *good*, the side it moves toward — the behaviour and its absence when ablating, the model's default and the instructed behaviour when injecting (`SKILL.md`, Three operations). If you cannot write both in one sentence each, the behaviour is not yet defined; on present deployment, ask; unattended, take the narrowest reading and record it.
2. **Pick the branch and the model.** Weights if the model loads locally; semantic otherwise. Record model id, revision and dtype.
3. **Build the contrast pair and the four splits** (`cards/contrast-design.md`). Default sizes: fit 400 + 400, probe 100 per condition plus 50 neutral, dev 100 per condition plus 100 neutral, vault 100 per condition plus 100 neutral. Seal the vault: write it, hash it, and from then on read only the hash.
4. **Choose the meters.** The standard meters (`cards/meters.md`) always run, because they are the floor's objectives and the head-to-head's common currency. LLM judges (`cards/llm-judges.md`) run as testers in Phase 4.
5. **Name the compiler and design the rubrics.** Fill the brief's `compiler` block (any map from a prompt to a prompt; Prometheus by default). Send it the grader spec for the behaviour judge and the preservation judge (with Prometheus, as a Shape 6 spec): the behaviour sentence pair, five dev examples per condition as anchor material, pass/fail output, an abstention path. Store the returned rubrics in `brief.yaml`.
6. **Set budgets and tiers.** Probe budget per tournament iteration (default 10 forward-pass calls), total probe budget (default 150), tournament N (default 6, from 4 testers), preservation tiers (default for first-token KL: 0.40, 0.20, 0.10; semantic branch: drift ≤ 2.0×, 1.5×, 1.2× the sampling noise floor, see `cards/semantic-branch.md`), behaviour target (default: the behaviour tester's judged rate on candidate zero's dev bundle, fixed after Phase 3; the tournament matches the floor's removal and buys tighter preservation, which is where the floor is weakest).
7. **Audit the design** with the confound checklist in `cards/contrast-design.md`. Record findings.
8. **Gate.** Present: show the brief, ask for confirmation. Unattended: write every unasked choice into the ledger as a marked assumption and continue.

**Done when** `brief.yaml` is complete, the vault is sealed and hashed, and the ledger holds the Frame entry.

## Phase 2 — Map

Dispatch the Cartographer (`roles/cartographer.md`) with: the brief's `behaviour`, `branch`, `model` and `contrast` blocks only, plus the fit and probe splits (incl. probe-neutral), the probe budget for mapping (default 30 of the total), and the relevant cards. Do not hand the Cartographer the brief's `judges`, `floor`, `tournament` or `splits.dev`/`splits.vault` blocks, the rubric files, or any file that mentions dev or vault prompts; the map feeds the compilers, so anything the Cartographer sees leaks there. It returns `map/report.md` with a localisation hypothesis, evidence, and a feasibility verdict: **switchable**, **diffuse**, or **absent**.

- **switchable** → Phase 3.
- **diffuse** (the behaviour is present but spread over many components with no dominant one) → Phase 3, with the note that sparse edits are unlikely to beat the floor; the tournament then favours ARA-family edits.
- **absent** (no reliable difference between conditions anywhere the Cartographer looked) → stop. Write the report: what was measured, why the gate closed. This is a result, not a failure.
- **inconclusive** (the mapping budget ran out before a verdict) → Phase 3 as diffuse, with the inconclusive verdict in the report.

On the semantic branch the map is embedding geometry and the gate asks whether the good-condition instruction moves responses at all (`cards/semantic-branch.md`).

## Phase 3 — Floor

Implement and self-check the baseline pipeline the brief names (default ARA; abliteration if requested or if ARA's self-check fails on this architecture), then run multi-objective TPE over its knobs with the standard meters on the dev split (`cards/tpe.md`). Defaults: 100 trials, 30 start-up, seeded. Record the Pareto trials in `floor/`.

**Candidate zero** is the floor trial with the lowest behaviour meter among those inside the loosest preservation tier. If no floor trial is inside the loosest tier, record that; the tournament starts from the floor trial nearest to it.

On the semantic branch: candidate zero is the good-condition instruction used verbatim as the operator.

If the brief allows a reduced floor (`floor.trials`), say in the report that the head-to-head compares against a weaker baseline than a default run.

**Reference rates.** Bench the unedited model and candidate zero once on dev. Run the behaviour tester's rubric over both as a **rate-only call** (return the BAD rate, no pass/fail verdict — the target does not exist yet) and the keyword meter. Store `keyword_rate_base`, `keyword_rate_new` (candidate zero's keyword rate) and `judge_rate_base` for every later `summary.json`. For the Goodhart tester's calibration, also have the T4 model label every third response from the unedited set and store the result as `judge_rate_base_t4`. Set the behaviour target from candidate zero's judged rate.

## Phase 4 — Tournament

For each tier k from loosest to tightest:

1. Fill `tiers/tier-k/run-config.yaml` from `assets/alchemist-run-config.yaml`: the target statement with tier k's preservation threshold, the testers, `halt: all_pass`, N.
2. Iteration 0 is candidate zero (or the previous tier's converged candidate): bench it, test it. If it already passes all testers, it is tier k's converged candidate; go to the next tier.
3. Otherwise run Alchemist with the roles in `roles/`, in forge mode when the deployment is present or the brief says `approved: true`, in dry-run otherwise (SKILL.md, Running Alchemist unattended) (`references/coordination.md` gives the wiring and the bench step between compiler and testers).
4. **Converged** → add the candidate to the front, carry it as iteration 0 of tier k+1.
   **Barrier at N** → record Alchemist's infeasibility report; tier k−1 is the tightest feasible tier (at k = 1, the front is the floor alone); stop the ratchet.

Bench every candidate on the dev split only. The probe split belongs to the compiler; the vault to Phase 5.

## Phase 5 — Seal

1. Assemble the front: floor Pareto trials plus every converged tournament candidate.
2. Open the vault once, after verifying its hash; on a mismatch stop and report that no vault score is valid. Score every front candidate on it with all meters and both judges, in one pass. No candidate changes after this.
3. Head-to-head (`cards/floor-and-front.md`): the best floor trial against the best tournament candidate at each tier, on vault scores, plus capability and cost (GPU hours, model tokens, probe calls).
4. Pick the recommended candidate: the tightest-tier candidate whose vault behaviour score meets the target; ties go to fewer changed weights. On present deployment, offer the front and let the user choose.
5. Export it to `exports/<candidate-id>/` (`cards/lora-lifecycle.md`), write `seal/manifest.json` (`cards/reproducibility.md`) and the report.

**Done when** the report, manifest and export exist and the ledger's last entry points to them.

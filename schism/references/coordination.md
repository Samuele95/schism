# Coordination — roles, contracts, information flow

Phase 4 is an Alchemist tournament (evaluator-optimizer topology with sectioned evaluators). Alchemist owns the loop and its invariants I1–I5; this document is the Schism-specific wiring Alchemist needs: what a candidate is, how it becomes something testable, what each role sees, and what each returns.

## Roster

| Role | Alchemist slot | Prompt | Sees | Writes | Model |
|---|---|---|---|---|---|
| Cartographer | — (Phase 2 only) | `roles/cartographer.md` | brief's behaviour, branch, model, contrast blocks only; fit + probe splits (incl. probe-neutral); never judges, rubrics, dev, vault or tournament blocks | `map/` | frontier |
| Smith | compiler (weights) | `roles/smith.md` | P (its slots, filled from the brief), map, cards, probe split, fixes H | candidate edit spec | frontier |
| Operator compiler | compiler (semantic) | `roles/operator-compiler.md` | P (its slots, filled from the brief), map, probe split, fixes H | candidate operator spec | frontier, calling the run's prompt compiler |
| Behaviour tester | tester T1 | `roles/tester-behaviour.md` | its projection only | verdict | any; local allowed |
| Preservation tester | tester T2 | `roles/tester-preservation.md` | its projection only | verdict | any; local allowed |
| Capability tester | tester T3 | `roles/tester-capability.md` | its projection only | verdict | any; local allowed |
| Goodhart tester | tester T4 (full projection) | `roles/tester-goodhart.md` | the whole bundle | verdict | frontier preferred |
| Arbiter | judge | `roles/arbiter.md` | verdicts + full H table + current candidate spec (stripped of probe_evidence and predicted numbers) + map SUMMARY/Hn/BAND/READOUT blocks; never bundles or raw responses | diagnosis + one fix | frontier |
| You (orchestrator) | orchestrator | SKILL.md | everything | ledger, bench, run folder | — |

**Scope lockdown.** The Cartographer receives only the brief's `behaviour`, `branch`, `model` and `contrast` blocks; it never sees `judges`, `floor`, `tournament`, rubric files, `dev.jsonl` or `vault.*`, because the map feeds the compilers and anything the Cartographer sees leaks there. The Smith and the operator compiler change only the scratch copy and write only to `tiers/tier-k/candidates/`; they never read `dev.jsonl`, `vault.*`, any bundle, the brief itself, rubric files, `tiers/tier-k/H-ledger.md` (which carries T1–T4 verdicts), or `floor/` (the TPE journal stores dev meter values as trial attributes). You fill their P slots from the brief; the brief's `judges` and `splits` blocks hold the testers' criteria, and a compiler that reads them fits to the judge. The starting-point spec handed to the compiler carries no dev scores (strip `probe_evidence` numbers and `predicted` numbers before handing it over). Testers read only the files you hand them and write nothing. The Arbiter sees the candidate spec (stripped of `probe_evidence` and `predicted` numbers) and the map SUMMARY block, but never bundles, raw responses, rubric files or dev data. The Cartographer is read-only on the model. You never edit a candidate yourself: a candidate you "fix" between compiler and testers is a fifth author no ledger accounts for.

**Judge independence.** Where two models are available, run the testers on a different model from the compiler. A compiler and a tester that share a model share blind spots, and the tester stops being an outside observer.

## Information flow, one iteration

```
fixes H ──► compiler ──► candidate spec ──► BENCH (you, mechanical) ──► bundle
                                                                          │
              ┌───────────────┬───────────────┬───────────────────────────┤
              ▼               ▼               ▼                           ▼
        T1 behaviour    T2 preservation  T3 capability            T4 Goodhart (full)
              │               │               │                           │
              └───────────────┴───────┬───────┴───────────────────────────┘
                                      ▼
                          halt? ── yes ──► converged candidate → front
                                      │ no
                                      ▼
                     judge (verdicts + full H table) ──► one fix ──► H
```

**Bench** is the step Alchemist's generic loop does not have: a candidate here is a recipe, and testers must judge its effect. You apply the candidate to the scratch copy with workbench code, run the dev split through it, write the bundle, reset the model (`cards/lora-lifecycle.md`), and confirm the reset with one greedy generation on a fixed probe prompt (counted as bench, not against the compiler's probe budget). Bench decides nothing and filters nothing. If applying a candidate fails (code error, NaN loss, shape mismatch), record `ERROR:` in the ledger and hand the testers a bundle whose `status` is `apply_failed`; every tester then fails with that reason, and the judge sees an honest iteration.

## Contracts

### Edit spec (weights-branch candidate)

```yaml
id: t2-i3                      # tier-iteration
technique: ara | directional | mpoa | sparse_columns | side_path | composite
targets:                       # what is touched, as precisely as the technique allows
  layers: [14, 15, 16]
  components: [mlp.down_proj]
  detail: "columns 0-63 of layers 15 and 19"   # sparse/side-path only
parameters: {...}              # every knob, explicit; no defaults left implicit
implementation: [workbench/ara.py::fit_module]   # list: function(s) that realize it, in application order
hypothesis: [H2]               # list of ids from map/report.md, or "new: <one line>"
predicted:
  behaviour: "probe rate from 0.42 to <=0.15"
  preservation: "probe KL rise concentrated on prompts mentioning X"
probe_evidence: "6 probe calls; behaviour 0.12 on probe split"
weights_changed: 0.0012        # fraction of model weights the edit touches
deviations: []                 # anything that departs from a card's defaults, with why
probe_budget_exhausted: false  # optional
note: null                     # optional, e.g. "no improvement found: tried …"
```

### Operator spec (semantic-branch candidate)

```yaml
id: t1-i2
operator: |
  <the full text>
placement: system | prefix | suffix
compiler_session: <ref to the stored prompt-compiler request and response that produced it>
hypothesis: [H1]
predicted: {behaviour: "...", drift: "..."}
tokens: 182                    # operator length; it is paid on every call
probe_budget_exhausted: false  # optional
note: null                     # optional
```

### Bundle (one per candidate, from Bench)

```
bundles/<id>/
  status.txt                   ok | apply_failed: <reason>
  behaviour.jsonl              {prompt_id, condition: bad, response, hit_length_cap}   dev bad-condition prompts
  behaviour_meter.json         weights: keyword rate or classifier on the same responses
                               semantic: {pull_mean, push_mean, k, keyword_rate}
  preservation.jsonl           {prompt_id, response_base, response_new}   dev neutral prompts
  preservation_meter.json      weights: {kl_mean, kl_p90, kl_per_prompt[]}
                               semantic: {drift_mean, drift_p90, noise_floor, drift_multiple, drift_per_prompt[]}
  capability.json              {task, n, accuracy_base, accuracy_new, max_length, items[{id, gold, output_base, output_new, hit_length_cap}]}
  summary.json                 pre-computed: rates, deltas, mean response length (base, new), weights_changed or tokens,
                               keyword_rate_new (this candidate's keyword rate; null when no markers),
                               and the run's reference rates: keyword_rate_base, judge_rate_base (Phase 3, T1 rubric on the unedited model),
                               judge_rate_base_t4 (Phase 3, the T4 model's labels on every-third unedited response)
```

`hit_length_cap` is true when generation stopped at `max_response_length`: a response cut by the cap is not broken, and testers must not treat it as such.

### Projections

| Tester | Gets |
|---|---|
| T1 behaviour | `behaviour.jsonl`, the behaviour rubric, the target rate |
| T2 preservation | `preservation.jsonl`, `preservation_meter.json`, the preservation rubric, tier k's threshold, `max_changed` |
| T3 capability | `capability.json`, the allowed drop |
| T4 Goodhart | the whole bundle, the edit or operator spec, the behaviour sentence pair, the behaviour rubric, `goodhart_list`, the thresholds `synonym_gap` and `length_drop` |

Never hand a tester another tester's file or threshold (Alchemist I2, I3).

### Verdict (every tester)

```
verdict: pass | fail
reason: <one or two sentences; on fail, what broke, on which prompt ids>
evidence: <prompt ids or numbers the reason rests on>
```
A tester that cannot judge its projection returns `verdict: fail` with `reason: inconclusive — <why>`; the judge treats inconclusive as a measurement problem, not as a property of the candidate.

### Judge output

Alchemist's judge format (root cause, options, `FIX:` one recommended fix), plus two lines:
```
barrier: none | probable | proven — <constraint pair>
measurement_action: none | rebench | recheck <technique>
```
Only a `FIX:` line that names an actual fix goes into H. A measurement-only line (`FIX: none — measurement only`) is **not** appended to H. `measurement_action` is for you, never for H: `rebench` re-runs bench and testers on the same candidate; `recheck` re-runs that technique's self-check, then rebenches. A measurement-only iteration does not count toward N; at most one re-measurement is allowed per iteration. If the verdict is still inconclusive after the re-measurement, count the original iteration toward N and proceed with the next fix from the judge.

## Failure handling

| Event | Action |
|---|---|
| A tester call errors or times out | Retry once with the same projection; on second failure record `verdict: fail, reason: inconclusive — tester error`, continue |
| Bench `apply_failed` twice in a row on the same technique | Judge sees it; if the next fix uses the same technique, re-run that technique's self-check before benching |
| Probe budget exhausted mid-iteration | The compiler submits its best candidate so far, marked `probe_budget_exhausted` |
| Smith, operator compiler, prompt compiler or Arbiter call errors, times out, or returns output that does not parse | Retry once with the same inputs; on second failure record `ERROR:` and end the tier as not converged (not a proven barrier), carrying the best converged candidate forward |
| Tournament budget N reached | Alchemist's infeasibility report; ratchet stops (`run-protocol.md`, Phase 4) |
| Barrier at the first tier | The front is the floor alone; report that the tournament found nothing tighter than the baseline result at this budget |
| Closed-model sample budget exhausted | Finish the current bench if it is ≥ 80% done, otherwise mark it `apply_failed: sample budget`; stop the ratchet |
| Vault hash mismatch in Phase 5 | Stop; do not score. Report that the vault changed after sealing and that no vault score from this run is valid |
| Any role asks to see the vault | Refuse; record in ledger; it does not count as a deviation unless it was given |

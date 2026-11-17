# Audit summary and self-report — Schism package

Prometheus from-scratch run. Shape: hybrid. SKILL.md is an orchestrating persona, run as a team on an Alchemist evaluator-optimizer tournament with sectioned evaluators. Role prompts follow Shapes 4 (Cartographer), 1 (Smith, as a loop seed), 2 (operator compiler) and 6 (four testers and the judge). Domain: engineering, because the agent writes code at run time, plus research. Substrate: frontier for the reasoning roles; strong or legacy allowed for testers after calibration. Verification budget: milestone, as you chose.

## Checks

| Check | Result | Note |
|---|---|---|
| A, A2, A3 altitude and delegation | pass | Cards give formulas, defaults and traps; roles delegate the approach and keep the invariants fixed |
| B–B4 token economy, one owner, progressive disclosure | pass, with a warning | Coordination owns the contracts; roles restate their own lockdown on purpose (N7c). SKILL.md is ~1.8k words, heavier than ideal |
| C–C5 examples | pass | Worked examples in the Cartographer, Smith and Arbiter prompts; testers' anchors come from the Prometheus rubric designed at run time (N6b is satisfied at run time, not in this package) |
| D, E, E2 operator profile and ordering | pass | Identity → context → task → constraints → output → example in every role |
| F interference | pass | Strict stance plus "judge each response on its own" checked; no persona stacking |
| G information preservation | pass | The map's hypothesis ids flow into specs, then into fixes |
| L runtime | pass | USAGE covers agent skill installation and multiple runtimes |
| M measurement | pass | Greedy decoding for meters and bench; testers at temperature 0 where exposed |
| M3, M3b, M3c abstention and clarification | pass | Every judging role has an "inconclusive" path; clarification only under `deployment: present`, bounded at two rounds with a fallback |
| M6 reasoning channel | pass | Reasons are task-mandated fields, never "show your thinking" |
| N6–N6d judges | pass | Reason before label, bias controls, rubric as optimization target (the Goodhart tester) |
| N7–N7m team | pass | Topology justified by coupling; scope lockdown per role; contracts aligned; failure table; tester isolation enforced by Alchemist I2/I3 |
| Engineering domain | warning | Stack versions are recorded per run, not pinned in the package, because the agent targets whatever environment it finds |
| M2 verifier-readiness | pass | Greppable ledger prefixes, fixed schemas, visible budgets |
| M4 cognitive tools | n/a | Scaffold not triggered (see M5) |
| O empirical tests | shipped | `EMPIRICAL-TEST.md` |

## Static verifier, fresh context (P8)

The first pass returned **fail** with five blocking issues. All five are fixed:
1. **Goodhart tester inputs.** It needed inputs no file produced. Its projection now includes the rubric, the Goodhart list and two numeric thresholds. It labels a sample itself and compares that with the keyword meter, using reference rates fixed in Phase 3.
2. **Compiler isolation.** The roster said the compilers see the whole brief, which contains the testers' criteria. They now see only their filled P slots, never the brief.
3. **Splits.** The semantic map read dev-neutral prompts, which the Cartographer may not read. A probe-neutral subset now serves every probe-side KL and drift measurement.
4. **Length cap.** The behaviour tester counted responses cut by the generation cap as broken. Bench now flags `hit_length_cap`, and the tester ignores the cap.
5. **Arbiter routing.** Measurement problems leaked into the compiler's history. The Arbiter now has a separate `measurement_action` line, and only `FIX:` enters H.

Its warnings were also addressed:
- Prefix detection: spaces-only stripping, and the re-check after the finalizer branch.
- One-token `generate` is prescribed for captures and logits.
- Whitespace-only responses count as empty.
- Self-checks were added to the floor/front and reproducibility cards, with concrete pass conditions elsewhere.
- The fixed asking points and the silent-user fallback are now in Doubt.
- SKILL.md says which texts are prompts that must go through Prometheus.
- The operator compiler has an in-format scope refusal.
- Failure actions were added for role errors, a vault hash mismatch, a first-tier barrier and sample exhaustion.
- The capability default is now generative (GSM8K).
- Side-path exports are defined.
- The worked examples were made consistent.

The second fresh-context pass confirmed all five original issues resolved and found **two new blocking issues**, both fixed:

6. **Cartographer receives the whole brief.** The brief holds dev-anchored rubrics (Phase 1 step 5), and the map feeds the compilers, creating a leak path. The Cartographer now receives only the brief's `behaviour`, `branch`, `model` and `contrast` blocks; the rubric files are added to its forbidden list.
7. **Arbiter cannot write concrete fixes.** It was asked to name techniques, layers and hypothesis ids without seeing the candidate spec or the map's hypotheses. The Arbiter now receives the current candidate's spec (stripped of `probe_evidence` and `predicted` numbers) and the map SUMMARY block, with bundles and raw responses still excluded.

Its eight warnings were also addressed:
- T4 calibration bias: a `judge_rate_base_t4` reference rate, produced by the T4 model itself, replaces the cross-model `judge_rate_base` for the synonym-swap check.
- `keyword_rate_new` is now named explicitly in `summary.json` (null when no markers; check 1 reported as "not run").
- Semantic-branch preservation: T2 now compares `drift_multiple` against the tier's noise-floor multiple; `drift_per_prompt[]` added to the meter file.
- Scope lockdown now lists `H-ledger.md`, `floor/`, rubric files and the starting-point spec; says the spec handed to the compiler carries no dev scores.
- Measurement-only `FIX: none` lines are not appended to H; a still-inconclusive re-measurement counts the original iteration toward N.
- Phase 3 reference-rate call is specified as rate-only (no pass/fail — the target doesn't exist yet).
- Capability generation gets its own `max_length` in the brief (512 by default, separate from `max_response_length`); `hit_length_cap` added to `capability.json` items.
- Minor contract drift: `alchemist-run-config.yaml` x4 now includes the behaviour sentence pair; `tester-behaviour.md` lists `hit_length_cap` in its projection; operator spec schema has `probe_budget_exhausted`.

A third fresh-context pass is not run; the two new issues were small wording additions with no cross-file implications.

## Optional scaffolds and their triggers (M5)

| Scaffold | Included | Trigger |
|---|---|---|
| Cognitive tools | no | Frontier substrate and no reported first-try failure. Hard-reasoning signals are present (weight analysis, debugging), but on frontier the evidence doesn't cover the scaffold |
| Clarification plus bounded self-check | yes, gated | You said the skill runs with any driver, including interactive |
| Per-step verification | no | You chose milestone |
| Side-path edits | yes, marked experimental | You asked to rely heavily on WSP; side paths are WSP's Exp. 4 technique |
| ARA fixes (ridge, baked row norms, sequential re-capture) | opt-in moves only | Known ARA flaws: issue #522 and the row-norm mismatch found while studying the technique |
| Dynamic-mode verifier | no | Research tool, not production at scale. The testers already are run-time judges |
| Cross-role contract verifier | yes | Required for Shape 7 |
| Cross-run verifier | no | Not requested |

## Self-report

**Token economy: 7/10.** Each card loads only when needed, and each section names what it buys. SKILL.md carries the three-skill table, the branches, the ground rules, doubt handling and a 15-row routing table: about 1.8k words loaded on every invocation. Moving the failure-modes section and the routing table's descriptions into `references/` would bring it near 1.2k. The Smith's constraints repeat coordination's lockdown on purpose.

**Task fit: 8/10.** It covers everything you asked for:
- every technique as a card with a self-check;
- WSP reading and editing;
- the semantic branch;
- Alchemist as the search;
- Prometheus for every prompt;
- the floor and the head-to-head;
- the vault;
- milestone checking.

Two gaps bite on a first run:
1. The sampling-command flags for system prompts and tool restriction are left for the agent to look up, because they vary by runtime.
2. Testers have no anchors until Prometheus produces the rubric in Phase 1, so tester quality depends on that step working.

**Operator coherence: 8/10.** Ordering is deliberate in every role, and the strongest invariants (compiler isolation, vault, never overwrite) are stated where each one binds. One departure is deliberate: the Goodhart tester opens by saying why it exists, ahead of what it sees, because its stance ("assume gaming until shown otherwise") must shape how it reads everything after.

**Overall.** Ready for a first calibration run, not certified. On that run, watch whether Prometheus's Phase 1 rubrics give the testers usable anchors, and whether the Smith actually keeps to the probe split. Two things need your judgement: the default tiers (first-token KL ≤ 0.40 / 0.20 / 0.10) and the preservation tester's `max_changed` of 3 in 100, both of which are guesses.

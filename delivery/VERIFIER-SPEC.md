# Verifier specification — Schism package

Shape: hybrid. The skill entry (SKILL.md) is an orchestrating persona for a Shape 7 team whose tournament is an evaluator-optimizer loop with sectioned evaluators. Each role is checked on its own spine, then the team is checked as a whole. Static checks inspect text; single-run checks inspect one run folder; cross-run checks inspect several runs.

## Static (the package text)

**Whole package**
1. Every path cited in any file exists in the package (`cards/*.md`, `roles/*.md`, `references/*.md`, `assets/*`).
2. The three-skill division holds everywhere: no file tells an agent to write a prompt inline (prompts come from a recorded call to the run's prompt compiler, Prometheus or any other map from a prompt to a prompt) or to run its own tournament loop outside Alchemist.
3. The semantic-branch scope (behaviour and style traits) appears in `cards/semantic-branch.md` and `roles/operator-compiler.md`, consistently worded.
4. The four splits and who may read each are consistent across SKILL.md, run-protocol, coordination and every role.
5. The verification budget is stated once (SKILL.md, ground rules) at milestone level. No card or role adds per-candidate testing beyond bench and testers.
6. Never-overwrite-weights holds in SKILL.md, `cards/lora-lifecycle.md` and the Smith's constraints.

**Per card** (all 15)
7. Each card has the formulas or procedure, its defaults, its traps, and a self-check with a concrete pass condition.
8. Technique-card numbers are internally consistent: ARA ranges and L-BFGS settings, abliteration ranges, the refusal marker list, the empty-response rule, KL direction and raw logits, TPE settings, MPOA rank 3 with reseeding.

**Per role**
9. Compiler roles (Smith, operator compiler) receive P and the H fix column only. No verdict, bundle, dev or vault access. Output is exactly one spec.
10. Testers: one constraint each, pass/fail criterion with a threshold slot, strict stance, reason before label, an abstention path ("inconclusive"), the verdict/reason/evidence output, and no reference to another tester's constraint.
11. Arbiter: reads the full H table, has the pattern-reading section, outputs root cause → options → one fix → barrier line, and never receives the candidate.
12. Cartographer: read-only, budgeted, reports a verdict from the gate table, includes a worked example.
13. No role tells the agent to ask a user. Clarification exists only in SKILL.md, gated on `deployment: present`, with the two-round bound and a fallback.

## Single run (one `runs/<id>/` folder)

1. The brief is complete. The vault is hashed in Phase 1 and the hash is verified in Phase 5.
2. The ledger has one PHASE entry per phase, the budget meter is filled, and deviations are recorded with reasons.
3. Every technique used has a passing check in `workbench/checks/`, or a CHECK line in the ledger.
4. The floor exists (TPE journal, Pareto trials) and candidate zero is identified.
5. Each tier's H ledger is append-only, its fix column contains no prompt ids or tester reasons, and every candidate spec cites a hypothesis.
6. No compiler log shows reads of dev or vault files.
7. The report leads with the outcome, includes the head-to-head with intervals, and lists deviations and inconclusives.
8. The export is in a new folder, and the manifest hashes match the exported files.

## Cross-run (several runs)

1. **Floor reproducibility:** same brief and seed give the same floor Pareto trials.
2. **Replay:** re-applying the stored specs reproduces adapter bytes (weights branch).
3. **Goodhart rate:** the share of candidates that T1 passed and T4 failed. If it falls to 0 over many runs, check that T4 is still strict.
4. **Judge drift:** the behaviour tester's labels on the Frame anchors stay correct across runs and tester models.
5. **Tournament value:** how often the tournament beats the floor on vault scores beyond noise, and at what cost. This is the empirical question the package exists to answer (`delivery/EMPIRICAL-TEST.md`).

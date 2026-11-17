# Empirical tests — for you to run

Nothing here was run during design. These tests answer the question that matters: does the method work, does the tournament beat the baseline, and at what cost? They also check the four done criteria.

## A. Acceptance: the four done criteria

Use one small open chat model (about 1–2B parameters, the same one as the calibration run) and the **slop** preset. It is a non-safety behaviour with an uninstructed scorer.

1. **Behaviour improves on the vault.** A full run (`deployment: unattended`, `approved: true`, defaults) produces a recommended candidate whose vault behaviour rate (judge and keyword meter) is below the unedited model's, outside the 95% interval, at a preservation inside at least the loosest tier.
2. **Localisation is confirmed.** `map/report.md` contains at least one hypothesis whose causal confirmation is a measured effect on probe. Repeat that ablation yourself on 50 fresh prompts (not vault) and check the effect holds within its interval.
3. **The closed-model operator works.** A semantic-branch run on one style behaviour (verbosity or sycophancy) produces an operator whose vault behaviour rate beats the floor operator (the verbatim instruction), with drift reported against the noise floor.
4. **The run is reproducible.** Re-apply every front candidate's stored spec in a fresh session and compare adapter bytes (weights branch) and meter values on the vault.

## B. Head-to-head against the baseline pipeline

Same model, same contrast pair, same seed. Run the baseline pipeline (default ARA, 100 trials) independently, and run Schism (default brief). Score the baseline's chosen trial on Schism's vault with Schism's meters and judges, so both sides are judged identically.

Report the head-to-head table from `cards/floor-and-front.md` with intervals. The outcomes worth knowing:
- **Floor ≈ baseline:** the pipeline is faithful. If not, the calibration missed something; check `workbench/checks/` first.
- **Tournament vs floor:** the gain at equal behaviour, the tightest feasible tier, and the cost ratio.
- **Weights changed:** whether sparse candidates reach the front.

Do this on two behaviours (slop and refusals) and two model sizes before drawing a general conclusion. One run is an anecdote.

## C. Interference: does the Arbiter's pattern section earn its place?

Take three recorded tier ledgers that oscillated, so you know the coupling. Run the Arbiter on each final iteration twice: with its "Patterns to look for first" section, and without it. Blind-grade both fixes:
- Does the fix change where or how the edit acts, rather than how much?
- Is it applicable without verdicts?

If the section makes no difference, strike it. It costs attention on every judge call.

## D. Judge model swap

Run the behaviour and preservation testers on a local model and on a frontier model, over the same 3 bundles. Measure label agreement on 100 responses.

- Agreement below about 85% means the local model cannot be trusted as a tester for this behaviour. Set `judges.tester_model` accordingly.

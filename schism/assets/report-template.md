# Schism report — <run-id>

<One sentence: the recommended candidate, its vault behaviour score and preservation score, and how it compares with the baseline floor. Example: "Tier-2 candidate t2-i3 cuts refusals to 6% (judge) / 4% (keywords) on the vault at first-token KL 0.14 [0.11, 0.18], against the floor's 7% / 5% at KL 0.33 [0.27, 0.40]: no measurable difference in removal, clearly less drift.">

## Front (vault scores)

| Candidate | Source | Behaviour (judge) | Behaviour (meter) | Preservation | Capability | Weights changed / operator tokens |
|---|---|---|---|---|---|---|
| | floor trial # | | | | | |
| | tier k | | | | | |

95% intervals on every rate; "no measurable difference" where intervals overlap.

## Head-to-head

<table from cards/floor-and-front.md, with cost: GPU hours, model tokens, probe calls, samples>

## What the run found

- Map verdict and the confirmed hypotheses (with evidence pointers).
- What the tournament discovered: the fixes in the H ledgers that moved a tier to convergence.
- Barriers: the tightest feasible tier and the constraint pair that blocked the next.

## For your attention

- Deviations and marked assumptions (from the ledger).
- Inconclusive gates or verdicts.
- Budgets exhausted.
- Anything that leaked (vault, dev to compiler) and what it invalidates.

## Artifacts

Export folder, manifest path and hash, run folder.
